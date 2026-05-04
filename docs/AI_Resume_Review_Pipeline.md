# AI Resume Review Pipeline — Technical Documentation

**Feature**: CV/Resume Feedback Generator  
**AI Model**: xAI Grok 3 Mini (`x-ai/grok-3-mini-beta`) via OpenRouter  
**Fallback Model**: Google Gemini 2.0 Flash (`google/gemini-2.0-flash-001`)  
**Average Response Time**: 15–25 seconds  
**Cost Per Review**: ~$0.10–0.25

---

## 1. End-to-End Flow

```
User uploads PDF resume (max 2MB)
        ↓
Frontend validates file type + size
        ↓
Backend checks AI credit quota (default: 3 credits per user)
        ↓
Backend retrieves the active resume PDF from R2 cloud storage
        ↓
PDF is converted to base64 and sent directly to the AI model
(the AI reads the actual PDF — not extracted text)
        ↓
AI processes resume using our detailed coaching prompt
        ↓
AI returns structured JSON via "tool calling" (function calling)
— this guarantees the output format is always consistent
        ↓
Backend clamps all scores to minimum of 6 (three-layer enforcement)
        ↓
Feedback stored in D1 database with model name + timestamp
        ↓
AI credit usage recorded for audit trail
        ↓
Admin notified via email (Resend) that a new review is pending
        ↓
User sees: score ring, 4 breakdown bars, 5 feedback sections, motivation note
        ↓
User can download HTML report or email it to themselves
```

---

## 2. AI Persona & Mission

The system prompt instructs the AI to behave as a **"world-class career coach who specializes in the skilled trades industry (HVAC, Electrical, Welding, Plumbing, Construction, etc.)"**.

### Five Non-Negotiable Rules

| # | Rule | Why It Matters |
|---|------|----------------|
| 1 | **Reference specific CV sections** — Every feedback point MUST cite the exact resume section (e.g., "In your **Experience section**, you wrote…") | Prevents generic, boilerplate advice. Forces hyper-personalization. |
| 2 | **Explain WHY** — Don't just say "improve your skills section" — explain what's missing and why it matters to a hiring manager | Builds understanding, not just a checklist. |
| 3 | **Give before/after examples** — Show exactly what to change using the candidate's own resume content | Actionable, not theoretical. |
| 4 | **Make them feel valued** — This might be their first resume ever. Be encouraging but honest. | Psychology-informed — entry-level candidates need encouragement to keep improving. |
| 5 | **Reveal personality** — Tell the candidate what their resume says about who they are, their work style, and professional mindset | The human touch that makes feedback feel like coaching, not a robot scan. |

---

## 3. Trade Context Injection

The AI tailors all feedback to the candidate's specific trade:

- **If trade selected**: *"The candidate is studying / graduated from: **[HVAC/Electrical/Welding/etc.]**. Tailor ALL feedback, certifications, tools, and job-role suggestions to this specific trade."*
- **If no trade selected**: *"The candidate has not specified a trade program. Infer the most likely trade from the resume content and tailor your feedback accordingly."*

This means every review includes trade-relevant certifications, tools, job titles, and industry terminology — not generic career advice.

---

## 4. Scoring Methodology

### 4.1 Scale: 6–10 (Never Below 6)

| Score | Meaning |
|-------|---------|
| 6 | Needs significant work |
| 7 | Decent foundation |
| 8 | Solid |
| 9 | Impressive |
| 10 | Exceptional |

**Why minimum 6?** Scores below 6 kill morale for entry-level candidates who may be submitting their very first resume. We encourage improvement, not discouragement.

### 4.2 Four Scoring Dimensions (Each Has Full Rubric)

#### Formatting & Layout (6–10)
| Score | Criteria |
|-------|----------|
| 6 | Raw text dump — no clear sections, inconsistent fonts/spacing, no bullet points or headers |
| 7 | Has basic sections (Education, Experience) but poor visual hierarchy, inconsistent bullets, cramped spacing |
| 8 | Clean, professional layout with logical sections, consistent bullets, readable font, functional but not optimized |
| 9 | Well-structured with clear visual hierarchy, strategic whitespace, section headers stand out, easy 6-second scan |
| 10 | ATS-optimized — standard section headings (no columns/tables that break ATS), perfect formatting, impeccable whitespace |

#### Content Quality (6–10)
| Score | Criteria |
|-------|----------|
| 6 | Lists job duties only ("Responsible for…"), no action verbs, zero quantified achievements |
| 7 | Some action verbs but vague descriptions ("helped with projects"), few measurable results |
| 8 | Consistent action verbs, some quantified results (e.g., "installed 50+ units"), clear role descriptions |
| 9 | Strong power verbs, multiple quantified achievements with numbers/percentages, compelling descriptions showing impact |
| 10 | Every bullet leads with power verb + measurable result (e.g., "Installed 200+ HVAC units across 15 commercial sites, reducing callback rate by 30%") |

#### Trade Relevance (6–10)
| Score | Criteria |
|-------|----------|
| 6 | Generic resume — no trade-specific skills, certifications, tools, or industry terminology |
| 7 | Mentions the trade field but lacks specific certifications, tools, or industry keywords |
| 8 | Lists relevant certifications (e.g., OSHA 10) and some tools/equipment, uses industry terminology |
| 9 | Strong trade content — industry certs (OSHA 30, EPA 608, NATE, NCCER, AWS), specific tools, safety protocols, project experience |
| 10 | Comprehensive trade portfolio — multiple certs with credential numbers, specific equipment/systems, project metrics (scope, scale, complexity), code compliance |

#### Hiring Impact (6–10)
| Score | Criteria |
|-------|----------|
| 6 | A hiring manager would likely pass — doesn't communicate job-readiness or value |
| 7 | Would get a second glance but wouldn't stand out — missing the "hook" |
| 8 | Would make the interview shortlist for entry-level positions |
| 9 | Stands out among peers — compelling narrative, foreman/supervisor would want to interview |
| 10 | Immediate callback — clearly communicates what this person brings to the jobsite |

### 4.3 Three-Layer Score Floor Enforcement

| Layer | How It Works |
|-------|-------------|
| **Layer 1: Prompt** | AI prompt explicitly instructs: *"Use score range 6 to 10 ONLY. Never give any score below 6."* |
| **Layer 2: Schema** | Tool schema sets `minimum: 6` on every score field — AI structurally cannot output below 6 |
| **Layer 3: Code** | Backend runs `Math.max(6, score)` before storing — even if AI somehow outputs 5, it's clamped to 6 |

**Result**: Score floor is impossible to break through any path.

---

## 5. Structured Output — The 8 Fields

The AI is forced via OpenAI-compatible function calling (`tool_choice`) to return exactly this JSON structure:

| Field | Description | Count |
|-------|-------------|-------|
| `overall_score` | Single number 6–10, independently evaluated | 1 number |
| `score_breakdown` | 4 sub-scores: formatting, content, trade_relevance, impact (each 6–10) | 4 numbers |
| `motivation_note` | Personalized 2–4 sentence encouragement + personality read about the candidate | 1 paragraph |
| `strengths` | What's working well — each cites the exact CV section | 3–5 items |
| `improvements` | Areas to strengthen — problem → impact on hiring → specific fix | 3–6 items |
| `suggestions` | Concrete recommendations with BEFORE → AFTER examples using actual CV content | 4–6 items |
| `trade_suggestions` | Trade-specific tips — certifications, job titles, tools, industry keywords | 3–5 items |
| `actionable_steps` | Prioritized steps: "Step 1 (do today):", "Step 2 (this week):", "Step 3 (next step):" | 4–6 items |

Every field has detailed descriptions in the tool schema telling the AI exactly what format and depth is expected. This is **constrained, validated JSON** — not free-form text.

---

## 6. Personality Insights — The Human Touch

The prompt explicitly instructs the AI to weave in observations about the candidate:

- What does their **choice of words** say about their communication style?
- What does their **experience history** reveal about their work ethic and reliability?
- What **traits** does their resume project (detail-oriented, hands-on, team player, self-starter)?

These personality reads appear naturally in the `motivation_note` and within feedback sections. This makes every report feel like a **one-on-one coaching session**, not an automated scan.

---

## 7. Delivery Channels

| Channel | Details |
|---------|---------|
| **Web UI** | Score ring (SVG), breakdown bars, 5 expandable sections, motivation banner |
| **HTML Download** | Printable Kraftworks-branded report, filename: `Resume-Feedback-YYYY-MM-DD.html` |
| **Email** | Styled HTML report sent via Resend to user's registered email |

---

## 8. Example Output

Here's what the AI produces for a typical HVAC graduate's resume:

```json
{
  "overall_score": 7,
  "score_breakdown": {
    "formatting": 7,
    "content": 7,
    "trade_relevance": 6,
    "impact": 7
  },
  "motivation_note": "You've already taken the most important step — putting yourself out there and investing in your career. Your resume shows real potential, and with a few targeted improvements, you'll be standing out to employers in no time.",
  "strengths": [
    "**Clear section structure** — Your resume uses consistent headers (Education, Experience, Skills) which makes it easy for hiring managers to scan quickly.",
    "**Education prominently placed** — You've listed your trade program front and center, which is exactly what employers in the skilled trades want to see first."
  ],
  "improvements": [
    "**Your objective statement needs a rewrite** — Right now it reads too generic (e.g., 'seeking a challenging position'). Employers see hundreds of these. Write a 2–3 sentence professional summary that mentions your trade, your strongest skill, and target role.",
    "**Skills section is too vague** — Listing 'communication' and 'teamwork' doesn't set you apart. Replace with trade-specific technical skills, tools, and certifications."
  ],
  "suggestions": [
    "**Replace your objective with a professional summary** — Instead of 'Seeking a challenging position in HVAC,' try: 'Motivated HVAC graduate with hands-on training in residential and commercial systems, EPA 608 certification, and a strong work ethic.'",
    "**Quantify your experience** — Change 'Helped with installations' to 'Assisted in 15+ residential HVAC installations over 3 months, including ductwork layout and refrigerant line connections.'"
  ],
  "trade_suggestions": [
    "**HVAC Technician roles** — Focus toward residential service calls, preventive maintenance, and system diagnostics. Highlight hands-on lab work from your program.",
    "**Apprenticeship applications** — Many HVAC apprenticeships value attitude over experience. Highlight eagerness to learn, reliability, and mentor relationships."
  ],
  "actionable_steps": [
    "**Step 1 (Do today):** Rewrite your objective as a professional summary — 2-3 sentences, mention HVAC specifically.",
    "**Step 2 (This week):** Audit your skills section — replace generic soft skills with 5-8 technical HVAC skills.",
    "**Step 3 (This week):** Revise every experience bullet to include at least one number.",
    "**Step 4 (Next step):** Add a Certifications section — list everything including 'in progress' certs."
  ]
}
```

---

## 9. Resilience & Safety

| Feature | Implementation |
|---------|---------------|
| **Model Fallback** | If Grok 3 Mini fails (non-429 error), automatically retries with Gemini 2.0 Flash |
| **Rate Limit Handling** | Exponential backoff with random jitter, up to 3 retries on 429 errors |
| **Credit System** | Configurable per-user limit, every generation costs 1 credit, admin can adjust |
| **Audit Trail** | Every AI action recorded: user ID, action type, input hash, model, timestamp |
| **PDF Processing** | Base64 PDF sent directly to AI — evaluates formatting/layout, not just text |
| **Sandbox Mode** | Returns realistic mock data for development, toggled by environment variable |

---

## 10. The Actual System Prompt

Below is the exact system prompt sent to the AI model for every resume review:

```
You are a world-class career coach who specializes in the skilled trades industry
(HVAC, Electrical, Welding, Plumbing, Construction, etc.). You genuinely care about
helping trade graduates land their first job. Your feedback is warm, specific, and
actionable — never generic or boilerplate.

## YOUR MISSION
Analyze this candidate's resume in depth and provide HYPER-PERSONALIZED feedback that:
1. References specific CV sections — always state which section you're referencing.
2. Explains WHY something works or doesn't
3. Gives concrete before/after examples
4. Makes them feel valued and motivated
5. Reveals personality & professional character

## CANDIDATE CONTEXT
[Trade-specific injection or inference instruction]

## SCORING RULES
- Use score range 6 to 10 ONLY. Never give any score below 6.
- Differentiate meaningfully — not every resume deserves the same score.

[Full rubrics for all 4 dimensions: Formatting, Content, Trade Relevance, Hiring Impact]

## RESPONSE GUIDELINES
- Every strength references something SPECIFIC and NAMES the section
- Every improvement cites SECTION, PROBLEM, IMPACT, and FIX
- Suggestions include BEFORE → AFTER with actual resume content
- Trade suggestions list SPECIFIC certifications, tools, job titles
- Action steps are PRIORITIZED with realistic timelines
- Motivation note includes personality read

## PERSONALITY INSIGHTS
- What does their choice of words say about communication style?
- What does experience history reveal about work ethic?
- What traits does their resume project?

## FORMATTING RULES
- Use **bold** for key terms and section references
- Keep each point detailed (2-4 sentences)
- Write as if sitting across from them giving one-on-one coaching
```

---

*Source code: `workers/src/lib/openrouter.ts` (prompt & schema), `workers/src/routes/feedback.ts` (orchestration)*
