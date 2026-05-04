import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_MODEL = "gemini-2.0-flash";
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { resume_id, resume_hash } = await req.json();
    if (!resume_id) throw new Error("Missing resume_id");

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

    // Fetch resume info
    const { data: resume } = await supabase
      .from("resumes")
      .select("file_name, trade_program")
      .eq("id", resume_id)
      .single();

    const tradeContext = resume?.trade_program
      ? `The candidate specializes in: ${resume.trade_program}.`
      : "The candidate is in the skilled trades (electrician, HVAC, welding, etc).";

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    const modelName = Deno.env.get("GEMINI_MODEL") || DEFAULT_MODEL;

    const systemPrompt = `You are a career coach for skilled trades professionals. Analyze the resume submission and provide structured feedback. ${tradeContext} Resume file: "${resume?.file_name || 'resume.pdf'}".

Be concise but useful. Keep each bullet point to 1-2 sentences max. Return exactly the structured data requested via the tool.`;

    const userPrompt = `Provide resume feedback for a trades professional. Generate practical, actionable feedback.`;

    const aiResponse = await fetch(`${GEMINI_BASE_URL}/${modelName}:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        tools: [{
          functionDeclarations: [{
            name: "return_feedback",
            description: "Return structured resume feedback",
            parameters: {
              type: "object",
              properties: {
                overall_score: { type: "integer", description: "Overall resume score from 1-10" },
                strengths: { type: "array", items: { type: "string" }, description: "3-4 key strengths" },
                improvements: { type: "array", items: { type: "string" }, description: "3-4 areas for improvement" },
                suggestions: { type: "array", items: { type: "string" }, description: "2-3 specific suggestions" },
                trade_suggestions: { type: "array", items: { type: "string" }, description: "2-3 trade-specific suggestions" },
                actionable_steps: { type: "array", items: { type: "string" }, description: "3-4 clear actionable improvement steps" },
              },
              required: ["overall_score", "strengths", "improvements", "suggestions", "trade_suggestions", "actionable_steps"],
            },
          }],
        }],
        toolConfig: {
          functionCallingConfig: { mode: "ANY", allowedFunctionNames: ["return_feedback"] },
        },
        generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
      }),
    });

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

    const feedback = functionCall.functionCall.args;
    feedback.model_name = modelName;

    // Also trigger admin notification (fire and forget)
    try {
      const fullName = user.user_metadata?.full_name || user.email;
      await supabase.functions.invoke('notify-admin-resume', {
        body: {
          full_name: fullName,
          email: user.email,
          trade_program: resume?.trade_program || 'Not specified',
          timestamp: new Date().toISOString(),
        },
      });
    } catch (notifyErr) {
      console.error("Admin notification failed (non-blocking):", notifyErr);
    }

    return new Response(JSON.stringify(feedback), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-resume-feedback error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
