import type { Env } from '../types';

// OpenRouter API (OpenAI-compatible)
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';
const PRIMARY_MODEL = 'x-ai/grok-3-mini-beta';
const FALLBACK_MODEL = 'google/gemini-2.0-flash-001';

const MAX_RETRIES = 3;

/** Extract retry delay from a 429 response header (defaults to 15s) */
function parseRetryDelay(res: Response): number {
  const header = res.headers.get('retry-after');
  if (header) {
    const secs = Number(header);
    if (!isNaN(secs) && secs > 0) return secs * 1000;
  }
  return 15_000;
}

/** Add random jitter (0-25%) so concurrent requests don't all retry at the same instant */
function withJitter(ms: number): number {
  return ms + Math.random() * ms * 0.25;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

interface InlineData {
  mimeType: string;
  data: string; // base64
}

interface OpenRouterOptions {
  model?: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  temperature?: number;
  max_tokens?: number;
  tool_choice?: any;
  tools?: any[];
  inlineData?: InlineData[];
}

interface OpenRouterResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content?: string | null;
      tool_calls?: Array<{
        id: string;
        type: string;
        function: { name: string; arguments: string };
      }>;
    };
    finish_reason: string;
  }>;
}

// --- Sandbox mock data ---
const MOCK_RESUME_FEEDBACK = {
  overall_score: 7,
  score_breakdown: {
    formatting: 7,
    content: 7,
    trade_relevance: 6,
    impact: 7,
  },
  motivation_note: "You've already taken the most important step — putting yourself out there and investing in your career. Your resume shows real potential, and with a few targeted improvements, you'll be standing out to employers in no time. The trades industry needs motivated people like you, and this feedback is designed to help you land the role you deserve.",
  strengths: [
    "**Clear section structure** — Your resume uses consistent headers (Education, Experience, Skills) which makes it easy for hiring managers to scan quickly. This is a solid foundation to build on.",
    "**Education prominently placed** — You've listed your trade program front and center, which is exactly what employers in the skilled trades want to see first.",
    "**Work experience included** — Having any work history shows employers you understand professional expectations like showing up on time, following instructions, and working with a team — even if it's not trade-specific yet.",
  ],
  improvements: [
    "**Your objective statement needs a rewrite** — Right now it reads too generic (e.g., 'seeking a challenging position'). Employers see hundreds of these. Instead, write a 2–3 sentence professional summary that specifically mentions your trade, your strongest skill, and what kind of role you're targeting.",
    "**Skills section is too vague** — Listing 'communication' and 'teamwork' doesn't set you apart. Every applicant lists these. Replace them with trade-specific technical skills, tools you've used, and any safety certifications you hold.",
    "**Experience section lacks numbers** — Your job descriptions tell what you did but not how well you did it. Adding metrics (how many, how often, how much) transforms a generic bullet point into a compelling achievement.",
    "**No trade-specific certifications listed** — Even if you're still earning them, listing 'EPA 608 (in progress)' or 'OSHA 10 Completed' shows initiative and tells employers you're serious about the trade.",
    "**Formatting could be more scannable** — Consider using a cleaner template with more whitespace, consistent bullet formatting, and your name/contact info in a clear header.",
  ],
  suggestions: [
    "**Replace your objective with a professional summary** — Instead of 'Seeking a challenging position in HVAC,' try: 'Motivated HVAC graduate with hands-on training in residential and commercial systems, EPA 608 certification, and a strong work ethic. Eager to contribute to a team-oriented environment while growing as a technician.'",
    "**Tailor your skills to the HVAC industry** — Add specific skills like: Refrigerant handling, Brazing & soldering, System diagnostics, Ductwork installation, Electrical troubleshooting, EPA 608 certification, OSHA 10/30.",
    "**Quantify your experience** — Change 'Helped with installations' to 'Assisted in 15+ residential HVAC installations over 3 months, including ductwork layout and refrigerant line connections.' Numbers make your work tangible.",
    "**Add a Certifications section** — Create a dedicated section listing: trade program completion date, any safety certs (OSHA, EPA), first aid/CPR, forklift, or any manufacturer training.",
    "**Use a modern, clean resume template** — Try a single-column layout with clear section dividers, your name in a larger font at top, and consistent bullet formatting. Avoid graphics or colors — keep it clean and professional.",
  ],
  trade_suggestions: [
    "**HVAC Technician roles** — Focus your resume toward residential service calls, preventive maintenance, and system diagnostics. Highlight any hands-on lab work from your program.",
    "**HVAC Installer positions** — Emphasize physical readiness, ability to read blueprints, ductwork experience, and comfort working in tight spaces (attics, crawl spaces).",
    "**HVAC Maintenance roles** — Play up any preventive maintenance experience, filter changes, thermostat installations, or seasonal tune-up procedures you've learned.",
    "**Apprenticeship applications** — Many HVAC apprenticeships value attitude over experience. Highlight your eagerness to learn, reliability, and any mentor relationships from your program.",
  ],
  actionable_steps: [
    "**Step 1 (Do today):** Rewrite your objective as a professional summary — 2-3 sentences, mention HVAC specifically, include your strongest skill or cert, and state what role you're targeting.",
    "**Step 2 (This week):** Audit your skills section — remove generic soft skills and replace with 5-8 technical skills relevant to HVAC (tools, procedures, certifications).",
    "**Step 3 (This week):** Revise every experience bullet point to include at least one number — projects completed, team size, hours worked, equipment handled.",
    "**Step 4 (Next step):** Add a Certifications section — list everything you have (even 'in progress' certs count) and any relevant training dates.",
    "**Step 5 (Final polish):** Switch to a clean, modern resume template — single column, professional font, clear headers, consistent formatting throughout.",
  ],
};

// Resource catalog for AI-powered recommendations during interview prep
export const RESOURCE_CATALOG = [
  // General resources
  { id: 'resume-template', name: 'Trade Resume Template', type: 'template', trade: 'general', description: 'Entry-level friendly resume template designed for trade professionals.' },
  { id: 'reference-list', name: 'Reference List Template', type: 'template', trade: 'general', description: 'Professional reference sheet — most grads don\'t have this ready.' },
  { id: 'tools-checklist', name: 'Tools Readiness Checklist', type: 'checklist', trade: 'general', description: 'What to bring (and what not to) on your first day.' },
  { id: 'followup-template', name: 'Follow Up Email/Text Template', type: 'template', trade: 'general', description: 'Professional follow-up message to send after your interview.' },
  // Electrical
  { id: 'nec-code-ref', name: 'NEC Code Quick Reference', type: 'guide', trade: 'electrical', description: 'Key National Electrical Code sections every new electrician should know.' },
  { id: 'electrical-toolkit', name: 'Electrician Tool Kit Checklist', type: 'checklist', trade: 'electrical', description: 'Must-have hand tools, meters, and safety gear for your first job.' },
  // HVAC
  { id: 'epa-608-prep', name: 'EPA 608 Certification Prep Guide', type: 'guide', trade: 'hvac', description: 'Study guide covering Section 608 refrigerant handling requirements.' },
  { id: 'hvac-toolkit', name: 'HVAC Tool & Safety Checklist', type: 'checklist', trade: 'hvac', description: 'Essential tools and PPE you need on day one as an HVAC tech.' },
  // Welding
  { id: 'aws-cert-overview', name: 'AWS Certification Overview', type: 'guide', trade: 'welding', description: 'Summary of American Welding Society certifications and how to prepare.' },
  { id: 'welding-safety', name: 'Welding Shop Safety Checklist', type: 'checklist', trade: 'welding', description: 'PPE, ventilation, and fire safety essentials for your first day in the shop.' },
  // Articles
  { id: 'article-interview-tips', name: 'Skilled Trades Interview Tips', type: 'article', trade: 'general', description: 'Interview mindset, what managers listen for, and how to stand out.' },
  { id: 'article-resume-guide', name: 'Build a Strong Resume', type: 'article', trade: 'general', description: 'Resume structure guide with practical examples for trades.' },
  { id: 'article-employers-notice', name: 'What Employers Notice', type: 'article', trade: 'general', description: 'What hiring managers look for in the first 30 days on the job.' },
  { id: 'article-new-hire-mistakes', name: 'Avoid New Hire Mistakes', type: 'article', trade: 'general', description: '6 common pitfalls for new hires in skilled trades.' },
  { id: 'article-raises-promotions', name: 'Raises and Promotions', type: 'article', trade: 'general', description: 'How pay and career advancement works in the trades.' },
  { id: 'article-keep-learning', name: 'Keep Learning on the Job', type: 'article', trade: 'general', description: 'How to keep developing your skills while working full-time.' },
];

const MOCK_INTERVIEW_QUESTIONS = {
  technical: [
    'Describe the process you follow when troubleshooting a malfunctioning system. What diagnostic tools do you use?',
    'How do you ensure compliance with local building codes and safety regulations in your work?',
    'Walk me through a complex project you completed from start to finish. What challenges did you face?',
    'What methods do you use to read and interpret blueprints or technical drawings?',
  ],
  behavioral: [
    'Tell me about a time you had to work under tight deadlines. How did you prioritize your tasks?',
    'Describe a situation where you disagreed with a coworker on the best approach. How did you resolve it?',
    'Give an example of when you identified a safety hazard on a job site. What did you do?',
    'Tell me about a time you had to learn a new skill quickly to complete a project.',
  ],
  situational: [
    'If you discovered that materials delivered to a job site were incorrect, what steps would you take?',
    'How would you handle a situation where a client requests changes that would violate building codes?',
    'If you were assigned to lead a team of apprentices, how would you approach training and oversight?',
    'What would you do if you fell behind schedule on a critical project milestone?',
  ],
  recommended_resources: [
    { resource_id: 'article-interview-tips', reason: 'Covers interview mindset and what trade hiring managers listen for — directly relevant to your preparation.' },
    { resource_id: 'followup-template', reason: 'A professional follow-up message template to send after your interview can make a strong impression.' },
    { resource_id: 'resume-template', reason: 'Having a polished, trade-focused resume ready strengthens your overall candidacy.' },
    { resource_id: 'article-employers-notice', reason: 'Understanding what employers notice in the first 30 days helps you prepare answers about workplace readiness.' },
  ],
};

export function isSandbox(env: Env): boolean {
  return env.SANDBOX_MODE === 'true';
}

export function mockAICall(toolName: string): { content: any; model: string } {
  if (toolName === 'provide_resume_feedback') {
    return { content: MOCK_RESUME_FEEDBACK, model: 'sandbox/mock' };
  }
  if (toolName === 'provide_interview_questions') {
    return { content: MOCK_INTERVIEW_QUESTIONS, model: 'sandbox/mock' };
  }
  return { content: {}, model: 'sandbox/mock' };
}

// Convert OpenAI-style tool schema — OpenRouter uses the same format, pass through
function formatTools(tools: any[]): any[] {
  return tools;
}

export async function callAI(
  apiKey: string,
  options: OpenRouterOptions,
): Promise<{ content: any; model: string }> {
  const model = options.model || PRIMARY_MODEL;

  // Build messages — attach inline PDFs as base64 data URIs in multipart content
  const messages: ChatMessage[] = options.messages.map(m => {
    if (m.role === 'user' && options.inlineData?.length) {
      const parts: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
        { type: 'text', text: m.content },
      ];
      for (const data of options.inlineData) {
        parts.push({
          type: 'image_url',
          image_url: { url: `data:${data.mimeType};base64,${data.data}` },
        });
      }
      return { role: m.role, content: parts };
    }
    return m;
  });

  const body: Record<string, any> = {
    model,
    messages,
    temperature: options.temperature ?? 0.3,
    max_tokens: options.max_tokens ?? 4096,
  };

  if (options.tools?.length) {
    body.tools = formatTools(options.tools);
    if (options.tool_choice) {
      body.tool_choice = options.tool_choice;
    }
  }

  const fetchOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://career.kraftworks.app',
      'X-Title': 'Kraftworks Career Hub',
    },
    body: JSON.stringify(body),
  };

  let response: Response | null = null;
  let lastErrorBody = '';

  // Exponential backoff loop for rate-limit (429) errors
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    response = await fetch(OPENROUTER_BASE_URL, fetchOptions);

    if (response.ok) break;

    if (response.status === 429 && attempt < MAX_RETRIES) {
      lastErrorBody = await response.text();
      const baseDelay = parseRetryDelay(response);
      const delay = Math.min(withJitter(baseDelay * Math.pow(1.5, attempt)), 90_000);
      await new Promise(r => setTimeout(r, delay));
      continue;
    }

    // Non-429 error on primary → try fallback model once
    if (response.status !== 429 && model === PRIMARY_MODEL) {
      const fallbackBody = JSON.stringify({ ...JSON.parse(fetchOptions.body), model: FALLBACK_MODEL });
      response = await fetch(OPENROUTER_BASE_URL, { ...fetchOptions, body: fallbackBody });
    }
    break;
  }

  if (!response || !response.ok) {
    if (response?.status === 429) {
      throw new Error('AI service is at capacity. Please wait a moment and try again.');
    }
    const errorText = lastErrorBody || (response ? await response.text() : 'No response');
    throw new Error(`AI processing failed (${response?.status}): ${errorText}`);
  }

  const data = (await response.json()) as OpenRouterResponse;
  const choice = data.choices?.[0];

  if (!choice) {
    throw new Error('No response from AI service');
  }

  // If tool call was made, extract the structured output
  if (choice.message.tool_calls?.length) {
    const toolCall = choice.message.tool_calls[0];
    try {
      return { content: JSON.parse(toolCall.function.arguments), model: data.model || model };
    } catch {
      return { content: toolCall.function.arguments, model: data.model || model };
    }
  }

  // Otherwise parse the text content as JSON
  let content: any;
  try {
    content = JSON.parse(choice.message.content || '{}');
  } catch {
    content = choice.message.content;
  }

  return { content, model: data.model || model };
}

// Resume feedback prompt with tool_choice for structured output
export function buildResumeFeedbackMessages(resumeText: string, tradeProgram?: string): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const tradeLine = tradeProgram
    ? `The candidate is studying / graduated from: **${tradeProgram}**. Tailor ALL feedback, certifications, tools, and job-role suggestions to this specific trade.`
    : 'The candidate has not specified a trade program. Infer the most likely trade from the resume content and tailor your feedback accordingly.';

  const systemPrompt = `You are a world-class career coach who specializes in the skilled trades industry (HVAC, Electrical, Welding, Plumbing, Construction, etc.). You genuinely care about helping trade graduates land their first job. Your feedback is warm, specific, and actionable — never generic or boilerplate.

## YOUR MISSION
Analyze this candidate's resume in depth and provide HYPER-PERSONALIZED feedback that:
1. **References specific CV sections** — always state which section you're referencing. For example: "In your **Experience section**, you wrote..." or "Your **Skills section** lists..." or "Under **Education**...". Every bullet MUST cite the exact resume section it relates to.
2. **Explains WHY something works or doesn't** — don't just say "improve your skills section," explain what's missing and why it matters to a hiring manager
3. **Gives concrete before/after examples** — show them exactly what to change, not vague advice
4. **Makes them feel valued and motivated** — this might be their first resume ever. Be encouraging but honest.
5. **Reveals personality & professional character** — based on what you read, tell the candidate what their resume says about who they are, their work style, their mindset, and what kind of professional trait the resume communicates. Be insightful about the human behind the document.

## CANDIDATE CONTEXT
${tradeLine}

## SCORING RULES
- Use score range 6 to 10 ONLY. Never give any score below 6.
- **Differentiate meaningfully** — not every resume deserves the same score. Evaluate each dimension independently. A resume can score 9 on trade relevance but 6 on formatting. Be honest and precise.
- We want to encourage applicants — a score below 6 kills morale — but giving everyone 7/7/7/7 is dishonest and unhelpful.

### FORMATTING & LAYOUT (6-10)
- **6**: Raw text dump or poorly structured document — no clear sections, inconsistent fonts/spacing, hard to scan, no bullet points or headers
- **7**: Has basic sections (Education, Experience) but poor visual hierarchy — inconsistent bullet styles, cramped spacing, no strategic use of whitespace
- **8**: Clean, professional layout with logical sections, consistent bullet formatting, readable font/size, functional but not optimized
- **9**: Well-structured with clear visual hierarchy, strategic whitespace, consistent formatting, section headers stand out, easy 6-second scan
- **10**: ATS-optimized — uses standard section headings (no columns/tables that break ATS), perfect formatting, professional template, impeccable whitespace, passes automated screening systems perfectly

### CONTENT QUALITY (6-10)
- **6**: Lists job duties only ("Responsible for..."), no action verbs, zero quantified achievements, vague or missing descriptions
- **7**: Some action verbs but descriptions are vague ("helped with projects"), few if any measurable results, incomplete role descriptions
- **8**: Consistent action verbs, some quantified results (e.g., "installed 50+ units"), clear role descriptions, shows what they actually did
- **9**: Strong power verbs, multiple quantified achievements with specific numbers/percentages, compelling descriptions that show impact, tailored content
- **10**: Every bullet leads with a power verb + measurable result (e.g., "Installed 200+ HVAC units across 15 commercial sites, reducing callback rate by 30%"), clear value proposition throughout

### TRADE RELEVANCE (6-10)
- **6**: Generic resume with no trade-specific skills, certifications, tools, or industry terminology — could be for any field
- **7**: Mentions the trade field but lacks specific certifications, tools, safety training, or industry keywords that employers search for
- **8**: Lists relevant certifications (e.g., OSHA 10) and some tools/equipment, uses industry terminology, shows basic trade knowledge
- **9**: Strong trade-specific content — industry certifications (OSHA 30, EPA 608, NATE, NCCER, AWS), specific tools/equipment, safety protocols, relevant project experience with scope
- **10**: Comprehensive trade portfolio — multiple certifications with credential numbers, specific equipment/systems worked on, safety training documented, project metrics (scope, scale, complexity), union/apprenticeship details, code compliance experience

### HIRING IMPACT (6-10)
- **6**: A hiring manager would likely pass — resume doesn't communicate job-readiness or value, hard to understand what the candidate can do
- **7**: Would get a second glance but wouldn't stand out among other applicants — missing the "hook" that makes a hiring manager call
- **8**: Would make the interview shortlist for entry-level trade positions — solid foundation that communicates basic competence
- **9**: Stands out among peers — compelling narrative, clear value proposition, a foreman/supervisor would want to interview this person
- **10**: Immediate callback — resume clearly communicates what this person brings to the jobsite, demonstrates reliability, skill, and professionalism at first glance

## RESPONSE GUIDELINES
- Every strength should reference something SPECIFIC from their resume AND NAME the section (e.g., "In your **Experience section**, ...")
- Every improvement should cite the SECTION, explain the PROBLEM, the IMPACT on hiring, and a specific FIX
- Suggestions should include BEFORE → AFTER examples using their actual resume content with section references
- Trade suggestions should list SPECIFIC certifications, tools, and job titles relevant to their trade
- Action steps should be PRIORITIZED (what to do first, second, third) with realistic timelines
- The motivation note should be personal, warm, and include a personality read — what the resume reveals about their character, work ethic, and professional potential. This should feel like a coach who truly sees them.

## PERSONALITY INSIGHTS
In your feedback, weave in observations about the candidate's personality based on their resume:
- What does their choice of words say about their communication style?
- What does their experience history reveal about their work ethic and reliability?
- What traits does their resume project (detail-oriented, hands-on, team player, self-starter, etc.)?
- Include these personality reads naturally within the relevant feedback sections

## FORMATTING RULES
- Use **bold** for key terms, section labels, and section references within each bullet point
- Keep each point detailed (2-4 sentences) — depth over breadth
- Write as if you're sitting across from them giving one-on-one coaching
- Always start feedback points with the CV section reference: "In your **[Section Name]**..."`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Please give me a thorough, personalized resume review. Be specific about what I wrote and what I should change:\n\n${resumeText}` },
  ];
}

export const resumeFeedbackTool = {
  type: 'function' as const,
  function: {
    name: 'provide_resume_feedback',
    description: 'Provide detailed, personalized resume feedback with specific examples from the resume',
    parameters: {
      type: 'object',
      properties: {
        overall_score: {
          type: 'integer',
          minimum: 6,
          maximum: 10,
          description: 'Overall resume quality score (6-10). Differentiate meaningfully — do NOT default to 7. 6 = needs significant work, 8 = solid entry-level resume, 10 = exceptional ATS-optimized resume. NEVER go below 6.',
        },
        score_breakdown: {
          type: 'object',
          properties: {
            formatting: { type: 'integer', minimum: 6, maximum: 10, description: 'Layout, readability, ATS-optimization. 6=text dump/no structure, 7=basic sections but poor hierarchy, 8=clean professional layout, 9=strategic whitespace + visual hierarchy, 10=ATS-perfect template. Min 6.' },
            content: { type: 'integer', minimum: 6, maximum: 10, description: 'Action verbs, quantified achievements, completeness. 6=duty lists only, 7=vague descriptions, 8=action verbs + some metrics, 9=power verbs + multiple quantified results, 10=every bullet has verb + measurable impact. Min 6.' },
            trade_relevance: { type: 'integer', minimum: 6, maximum: 10, description: 'Trade-specific skills, certifications, tools, terminology. 6=generic/no trade content, 7=mentions trade but no specifics, 8=lists certs + tools, 9=strong certs (OSHA/EPA/NATE) + project experience, 10=comprehensive portfolio with credential details + project metrics. Min 6.' },
            impact: { type: 'integer', minimum: 6, maximum: 10, description: 'Would a hiring manager call? 6=would pass, 7=second glance but won\'t stand out, 8=interview shortlist, 9=stands out among peers, 10=immediate callback. Min 6.' },
          },
          required: ['formatting', 'content', 'trade_relevance', 'impact'],
          description: 'Breakdown scores across 4 dimensions. Score each independently — a resume can be 9 on one and 6 on another. All scores 6-10, never below 6.',
        },
        motivation_note: {
          type: 'string',
          description: 'A warm, personalized 2-4 sentence encouragement that includes a personality read — what their resume reveals about their character, work ethic, and professional potential. Reference something specific and positive from their resume.',
        },
        strengths: {
          type: 'array',
          items: { type: 'string' },
          description: 'What is working well — each item MUST start with the CV section reference (e.g. "In your **Experience section**..."). Include personality insights where relevant. 3-5 items, each 2-3 sentences.',
        },
        improvements: {
          type: 'array',
          items: { type: 'string' },
          description: 'Areas to strengthen — each item MUST cite the CV section, explain the problem, why it hurts their chances, and a specific fix. 3-6 items.',
        },
        suggestions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Concrete recommendations with BEFORE → AFTER examples using their resume content. Cite which section each suggestion applies to. 4-6 items.',
        },
        trade_suggestions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Trade-specific tips — specific job titles to target, certifications to list, tools to mention, industry keywords. Reference resume sections where relevant. 3-5 items.',
        },
        actionable_steps: {
          type: 'array',
          items: { type: 'string' },
          description: 'Prioritized next steps with realistic timelines (do today, this week, next step). 4-6 items labeled Step 1, Step 2, etc.',
        },
      },
      required: ['overall_score', 'score_breakdown', 'motivation_note', 'strengths', 'improvements', 'suggestions', 'trade_suggestions', 'actionable_steps'],
    },
  },
};

// Interview questions prompt with tool_choice for structured output
export function buildInterviewQuestionsMessages(jobDescription: string, resumeText?: string, tradeProgram?: string): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const catalogJson = JSON.stringify(
    RESOURCE_CATALOG.map(r => ({ id: r.id, name: r.name, type: r.type, trade: r.trade, description: r.description })),
  );

  const hasResume = !!resumeText;
  const tradeNote = tradeProgram ? ` The candidate's trade is ${tradeProgram}.` : '';

  const systemPrompt = `You are a practical interview coach for Kraftworks — a platform EXCLUSIVELY for skilled trades careers: HVAC, electrical, plumbing, welding, carpentry, construction, masonry, roofing, painting, auto mechanics, diesel mechanics, heavy equipment operation, pipefitting, sheet metal, ironwork, millwright, and similar hands-on trade occupations.${tradeNote}

BEFORE generating questions, evaluate whether the job description is for a recognized skilled trade.

If the job is NOT a skilled trade (e.g., software engineer, marketing manager, data analyst, accountant, nurse, teacher, corporate roles, office jobs, tech jobs):
- Set trade_notice to: "This job description doesn't appear to be for a skilled trade. Kraftworks specializes in trade careers like HVAC, electrical, plumbing, welding, and carpentry. The questions below are general interview prep and may not be tailored to your specific field."
- Still generate generic interview questions that would apply to any job, but do NOT pretend to give trade-specific advice.

If the job IS a recognized skilled trade:
- Set trade_notice to null.
- Generate trade-specific, practical questions as described below.

Your goal: generate questions that interviewers ACTUALLY ask — from simple icebreakers to role-specific questions. Keep the difficulty varied and realistic. Do NOT make every question hard or overly academic.

Generate 5-7 questions for EACH of these 3 categories (15-21 total):

**Technical (5-7 questions):**
Mix these types, in roughly this order:
- 2-3 common/standard questions any interviewer would ask for this type of role (e.g., "What experience do you have with X?", "Walk me through your typical process for Y")
- 1-2 questions about specific tools, software, or methods mentioned in the job description
- 1-2 questions that probe the candidate's hands-on knowledge${hasResume ? ' — reference skills or tools from their resume to let them show what they know' : ''}

**Behavioral (5-7 questions):**
Mix these types:
- 2-3 classic behavioral questions commonly asked in interviews (e.g., "Tell me about a time you had to meet a tight deadline", "Describe a situation where you disagreed with a coworker")
- 1-2 questions about teamwork, communication, or work ethic relevant to this role${hasResume ? '\n- 1-2 questions that reference the candidate\'s past roles or experience from their resume (e.g., "At [company], how did you handle..."  or "Given your background in X, tell me about...")' : ''}

**Situational (5-7 questions):**
Mix these types:
- 2-3 practical "what would you do if..." scenarios relevant to daily work in this role
- 1-2 questions about handling common workplace challenges (safety, priorities, customer issues)${hasResume ? '\n- 1-2 questions that bridge the candidate\'s resume experience with this new role (e.g., "Given your experience with X, how would you approach Y in this position?")' : ''}

IMPORTANT RULES:
- Questions should sound like what a real hiring manager would ask, NOT like an exam.
- Keep questions concise — 1-2 sentences max. No long preambles.
- Start with easier/common questions, then get more specific.
- Only a few questions should reference the resume — most should be standard interview questions anyone applying for this job would face.${hasResume ? '\n- When referencing the resume, keep it natural (e.g., "I see you worked with X..." or "Your resume mentions Y...").' : ''}

Also select 3-5 resources from the RESOURCE_CATALOG below. Use only resource_id values from the catalog.

RESOURCE_CATALOG:
${catalogJson}`;

  let userContent = `Generate interview questions for this job:\n\n--- Job Description ---\n${jobDescription}`;
  if (resumeText) {
    userContent += `\n\n--- Candidate Resume/CV ---\n${resumeText}`;
  }

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userContent },
  ];
}

export const interviewQuestionsTool = {
  type: 'function' as const,
  function: {
    name: 'provide_interview_questions',
    description: 'Provide structured interview questions and recommended preparation resources. Generate 5-7 questions per category.',
    parameters: {
      type: 'object',
      properties: {
        technical: { type: 'array', items: { type: 'string' }, description: '5-7 technical questions — mix of common interview questions, role-specific questions, and a few referencing the candidate\'s resume skills' },
        behavioral: { type: 'array', items: { type: 'string' }, description: '5-7 behavioral questions — mix of classic "tell me about a time" questions, teamwork questions, and a few tied to the candidate\'s past experience' },
        situational: { type: 'array', items: { type: 'string' }, description: '5-7 situational questions — mix of practical "what would you do" scenarios, workplace challenges, and a few bridging resume experience to the new role' },
        recommended_resources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              resource_id: { type: 'string', description: 'The id from the RESOURCE_CATALOG' },
              reason: { type: 'string', description: '1-2 sentence explanation of why this resource helps the candidate' },
            },
            required: ['resource_id', 'reason'],
          },
          description: '3-5 most relevant resources from the RESOURCE_CATALOG to help the candidate prepare',
        },
        trade_notice: { type: ['string', 'null'], description: 'If the job description is NOT for a skilled trade, set this to a message explaining Kraftworks is for trades. If it IS a trade job, set to null.' },
      },
      required: ['technical', 'behavioral', 'situational', 'recommended_resources', 'trade_notice'],
    },
  },
};
