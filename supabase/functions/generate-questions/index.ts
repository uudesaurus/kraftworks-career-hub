import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_MODEL = "gemini-2.0-flash";
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { job_description, resume_id } = await req.json();
    if (!job_description || job_description.trim().length < 10) {
      throw new Error("Job description must be at least 10 characters");
    }

    // Fetch resume text context (file name for now since we can't parse PDF in edge fn)
    let resumeContext = "";
    if (resume_id) {
      const { data: resume } = await supabase
        .from("resumes")
        .select("file_name")
        .eq("id", resume_id)
        .single();
      if (resume) {
        resumeContext = `The candidate has uploaded a resume: "${resume.file_name}".`;
      }
    }

    // Check AI usage limits
    const { data: usageRecords } = await supabase
      .from("ai_usage")
      .select("id")
      .eq("user_id", user.id);

    if ((usageRecords?.length || 0) >= 3) {
      return new Response(
        JSON.stringify({ error: "You have reached the maximum of 3 AI actions for the beta." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const modelName = Deno.env.get("GEMINI_MODEL") || DEFAULT_MODEL;

    const systemPrompt = `You are a career coach specializing in skilled trades (HVAC, electrical, welding, plumbing, etc). Generate interview questions tailored to the job description provided. ${resumeContext}

Return exactly this JSON structure using the tool provided. Generate 3-4 questions per category. Each question should be specific to the job description.`;

    const userPrompt = `Generate interview questions for this job description:\n\n${job_description.slice(0, 2000)}`;

    const aiResponse = await fetch(
      `${GEMINI_BASE_URL}/${modelName}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          tools: [
            {
              functionDeclarations: [
                {
                  name: "return_questions",
                  description:
                    "Return interview questions grouped by category",
                  parameters: {
                    type: "object",
                    properties: {
                      technical: {
                        type: "array",
                        items: { type: "string" },
                        description: "Technical interview questions",
                      },
                      behavioral: {
                        type: "array",
                        items: { type: "string" },
                        description: "Behavioral interview questions",
                      },
                      situational: {
                        type: "array",
                        items: { type: "string" },
                        description: "Situational interview questions",
                      },
                    },
                    required: ["technical", "behavioral", "situational"],
                  },
                },
              ],
            },
          ],
          toolConfig: {
            functionCallingConfig: {
              mode: "ANY",
              allowedFunctionNames: ["return_questions"],
            },
          },
          generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
        }),
      }
    );

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const errBody = await aiResponse.text();
      console.error("Gemini error:", status, errBody);
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("AI generation failed");
    }

    const aiData = await aiResponse.json();
    const functionCall = aiData.candidates?.[0]?.content?.parts?.find((p: any) => p.functionCall);
    if (!functionCall) throw new Error("No structured response from AI");

    const questions = functionCall.functionCall.args;

    // Record AI usage
    const inputHash = await hashString(`interview_questions:${job_description}`);
    await supabase.from("ai_usage").insert({
      user_id: user.id,
      action_type: "interview_questions",
      input_hash: inputHash,
    });

    // Save to database
    const { data: saved, error: saveError } = await supabase
      .from("interview_questions")
      .insert({
        user_id: user.id,
        resume_id: resume_id || null,
        job_description: job_description.slice(0, 2000),
        technical: questions.technical || [],
        behavioral: questions.behavioral || [],
        situational: questions.situational || [],
      })
      .select()
      .single();

    if (saveError) throw saveError;

    return new Response(JSON.stringify(saved), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-questions error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
