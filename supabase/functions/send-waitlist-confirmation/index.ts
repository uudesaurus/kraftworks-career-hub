import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, email, full_name } = await req.json();
    if (!email || !full_name || !type) {
      throw new Error("Missing required fields: type, email, full_name");
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not configured, skipping waitlist confirmation email");
      return new Response(JSON.stringify({ success: true, note: "Email skipped - no RESEND_API_KEY" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "career@kraftworks.app";

    const isTradeGrad = type === "trade_grad";
    const subject = isTradeGrad
      ? "You're on the Kraftworks Career Fair Waitlist!"
      : "Kraftworks Employer Waitlist — Confirmation";

    const bodyContent = isTradeGrad
      ? `
        <h2 style="color: #1a1a1a;">Welcome to the Waitlist, ${full_name}!</h2>
        <p>You've been added to the <strong>Kraftworks Digital Career Fair</strong> waitlist for trade graduates.</p>
        <p>We'll notify you as soon as the career fair is live with opportunities matched to your trade specialization.</p>
        <p>In the meantime, check out our <a href="https://kraftworks.app/career-toolkit" style="color: #2563eb;">Career Toolkit</a> for resume tips, interview guides, and trade resources.</p>
      `
      : `
        <h2 style="color: #1a1a1a;">Welcome, ${full_name}!</h2>
        <p>Your company has been added to the <strong>Kraftworks Digital Career Fair</strong> employer waitlist.</p>
        <p>We'll be in touch soon with details on how to connect with skilled trade graduates actively seeking opportunities.</p>
        <p>Thank you for your interest in hiring quality trade professionals through Kraftworks.</p>
      `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Kraftworks Career Hub <${fromEmail}>`,
        to: [email],
        subject,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            ${bodyContent}
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
            <p style="font-size: 12px; color: #888;">Kraftworks Career Hub · kraftworks.app</p>
          </div>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errBody = await emailResponse.text();
      console.error("Resend error:", emailResponse.status, errBody);
      return new Response(JSON.stringify({ success: false, error: "Email delivery failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-waitlist-confirmation error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
