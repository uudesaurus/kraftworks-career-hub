# AI Interview Question Generator Pipeline — Technical Documentation

**Feature**: Interview Prep Question Generator  
**AI Model**: xAI Grok 3 Mini (`x-ai/grok-3-mini-beta`) via OpenRouter  
**Fallback Model**: Google Gemini 2.0 Flash (`google/gemini-2.0-flash-001`)  
**Average Response Time**: 10–20 seconds  
**Output**: 15–21 tailored interview questions + 3–5 curated preparation resources

---

## 1. End-to-End Flow

```
User pastes a job description (10–2000 characters)
        ↓
Frontend validates minimum length
        ↓
Backend checks AI credit quota (default: 3 credits per user)
        ↓
Backend optionally retrieves user's active resume PDF from R2
(if they have one uploaded — this enriches the questions)
        ↓
AI receives: job description + resume PDF (if available) + trade program
        ↓
AI generates 15–21 interview questions across 3 categories
+ selects 3–5 preparation resources from our curated catalog
        ↓
Questions stored in D1 database with model name + timestamp
        ↓
AI credit usage recorded for audit trail
        ↓
User notified via email that questions are ready
        ↓
User sees questions organized by category on the frontend
```

---

## 2. AI Persona & Design Philosophy

The system prompt instructs the AI as a **"practical interview coach who helps candidates prepare for real-world job interviews in skilled trades."**

### Core Design Decisions

| Decision | Why |
|----------|-----|
| **Questions sound like a real hiring manager, NOT an exam** | We explicitly tell the AI this — candidates should practice with realistic questions |
| **Difficulty is varied and realistic** | Starts with easier/common questions, gets more specific — mirrors real interview flow |
| **Resume-aware when available** | If user uploaded a CV, some questions naturally reference it — but most remain standard questions anyone applying would face |
| **Concise questions** | 1–2 sentences per question max — no long academic preambles |
| **Trade-specific context** | If trade program is known, all questions are tailored to that trade |

---

## 3. The Three Question Categories

The AI generates **5–7 questions per category** (15–21 total), with a deliberate mix of question types that progresses from common to specific:

### 3.1 Technical Questions (5–7)

| Question Type | Count | Example |
|--------------|-------|---------|
| Common/standard questions any interviewer asks | 2–3 | "What experience do you have with X?", "Walk me through your typical process for Y" |
| Questions about specific tools/methods from the job description | 1–2 | "The job mentions [specific tool] — describe your experience with it" |
| Questions probing hands-on knowledge (optionally referencing resume) | 1–2 | "Your resume mentions working with [tool] — walk me through how you used it" |

### 3.2 Behavioral Questions (5–7)

| Question Type | Count | Example |
|--------------|-------|---------|
| Classic behavioral questions | 2–3 | "Tell me about a time you had to meet a tight deadline", "Describe when you disagreed with a coworker" |
| Teamwork, communication, work ethic | 1–2 | "How do you handle working with a team member who isn't pulling their weight?" |
| Resume-referencing (when CV available) | 1–2 | "At [company from resume], how did you handle…", "Given your background in X, tell me about…" |

### 3.3 Situational Questions (5–7)

| Question Type | Count | Example |
|--------------|-------|---------|
| Practical "what would you do if…" scenarios | 2–3 | "If you discovered materials delivered to site were incorrect, what steps would you take?" |
| Common workplace challenges | 1–2 | "How would you handle a client requesting changes that violate building codes?" |
| Bridge resume experience to new role (when CV available) | 1–2 | "Given your experience with X, how would you approach Y in this position?" |

---

## 4. Resume-Aware Intelligence

When the user has an uploaded resume, the system becomes significantly smarter:

- The **actual PDF** is sent to the AI alongside the job description
- The AI can reference **specific skills, tools, companies, and experience** from the resume
- Resume references are kept natural: "I see you worked with X…" or "Your resume mentions Y…"
- **Only a few questions** reference the resume — most remain standard interview questions for the role
- If no resume is uploaded, the system still works perfectly with just the job description

This means two candidates applying for the same job get **different, personalized question sets** based on their unique backgrounds.

---

## 5. AI-Curated Resource Recommendations

After generating questions, the AI selects **3–5 resources** from our curated catalog and explains why each one is relevant to the candidate's preparation.

### The Resource Catalog

The AI has access to our full resource library:

**General Resources:**
| Resource | Type | Description |
|----------|------|-------------|
| Trade Resume Template | Template | Entry-level friendly resume template for trade professionals |
| Reference List Template | Template | Professional reference sheet — most grads don't have this ready |
| Tools Readiness Checklist | Checklist | What to bring (and what not to) on your first day |
| Follow Up Email/Text Template | Template | Professional follow-up message to send after interview |

**Trade-Specific Resources:**
| Resource | Trade | Description |
|----------|-------|-------------|
| NEC Code Quick Reference | Electrical | Key National Electrical Code sections every new electrician should know |
| Electrician Tool Kit Checklist | Electrical | Must-have hand tools, meters, and safety gear |
| EPA 608 Certification Prep Guide | HVAC | Study guide for Section 608 refrigerant handling requirements |
| HVAC Tool & Safety Checklist | HVAC | Essential tools and PPE you need on day one |
| AWS Certification Overview | Welding | American Welding Society certifications and how to prepare |
| Welding Shop Safety Checklist | Welding | PPE, ventilation, and fire safety essentials |

**Career Articles:**
| Resource | Description |
|----------|-------------|
| Skilled Trades Interview Tips | Interview mindset, what managers listen for, how to stand out |
| Build a Strong Resume | Resume structure guide with practical examples for trades |
| What Employers Notice | What hiring managers look for in the first 30 days |
| Avoid New Hire Mistakes | 6 common pitfalls for new hires in skilled trades |
| Raises and Promotions | How pay and career advancement works in the trades |
| Keep Learning on the Job | How to keep developing your skills while working full-time |

The AI doesn't randomly pick resources — it evaluates the job description and candidate context, then selects the **most relevant** ones with a personalized 1–2 sentence explanation of why each helps.

**Example output:**
```json
{
  "recommended_resources": [
    {
      "resource_id": "article-interview-tips",
      "reason": "Covers interview mindset and what trade hiring managers listen for — directly relevant to your preparation."
    },
    {
      "resource_id": "followup-template",
      "reason": "A professional follow-up message template to send after your interview can make a strong impression."
    },
    {
      "resource_id": "epa-608-prep",
      "reason": "The job requires EPA 608 certification — this guide will help you review key concepts before the interview."
    }
  ]
}
```

---

## 6. Structured Output Schema

The AI is forced via function calling (`tool_choice`) to return exactly this JSON:

```json
{
  "technical": [
    "Question 1...",
    "Question 2...",
    "...5-7 total"
  ],
  "behavioral": [
    "Question 1...",
    "Question 2...",
    "...5-7 total"
  ],
  "situational": [
    "Question 1...",
    "Question 2...",
    "...5-7 total"
  ],
  "recommended_resources": [
    {
      "resource_id": "article-interview-tips",
      "reason": "1-2 sentence explanation of why this resource helps"
    }
  ]
}
```

All fields are required. The tool schema enforces the structure, so the output format is **always consistent** — no parsing failures, no missing fields.

---

## 7. Example Output

For an HVAC Technician job posting, with a candidate who has uploaded their resume:

```json
{
  "technical": [
    "What experience do you have with residential HVAC installation and service calls?",
    "Walk me through your typical process for diagnosing a system that's not cooling properly.",
    "The job mentions working with Carrier and Trane systems — have you worked with either brand? What was your experience?",
    "How do you approach reading and interpreting HVAC blueprints and wiring diagrams?",
    "Your resume mentions refrigerant handling — describe the procedure you follow when recovering and charging refrigerant.",
    "What safety protocols do you follow when working with high-voltage electrical components in HVAC systems?"
  ],
  "behavioral": [
    "Tell me about a time you had to work under a tight deadline to complete an installation or repair.",
    "Describe a situation where you disagreed with a coworker on the best approach to a repair. How did you resolve it?",
    "Give me an example of when you identified a safety hazard on a job site. What did you do?",
    "At your previous position, how did you handle a situation where multiple service calls came in at once?",
    "Tell me about a time you had to learn a new system or tool quickly to complete a job.",
    "Your resume shows you worked on both residential and light commercial — which do you prefer and why?"
  ],
  "situational": [
    "If you arrived at a service call and the customer described symptoms that could be either a thermostat issue or a compressor problem, how would you approach the diagnosis?",
    "How would you handle a situation where a homeowner asks you to install a system in a way that doesn't meet code requirements?",
    "If you were assigned to train a new apprentice while also handling your regular service calls, how would you manage your time?",
    "What would you do if you discovered a previous technician had incorrectly wired a unit you were servicing?",
    "Given your experience with residential systems, how would you approach transitioning to the light commercial work this position requires?"
  ],
  "recommended_resources": [
    {
      "resource_id": "article-interview-tips",
      "reason": "Covers what trade hiring managers listen for in interviews — gives you the mindset to approach these questions confidently."
    },
    {
      "resource_id": "epa-608-prep",
      "reason": "The job requires EPA 608 — reviewing key refrigerant handling concepts before the interview shows you're prepared."
    },
    {
      "resource_id": "followup-template",
      "reason": "Sending a professional follow-up after the interview makes a strong impression and sets you apart from other candidates."
    },
    {
      "resource_id": "hvac-toolkit",
      "reason": "Reviewing the tool checklist ensures you can speak confidently about the equipment you'll use on the job."
    }
  ]
}
```

---

## 8. The Actual System Prompt

Below is the exact system prompt sent to the AI for every interview question generation:

```
You are a practical interview coach who helps candidates prepare for real-world
job interviews in skilled trades. The candidate's trade is [trade program].

Your goal: generate questions that interviewers ACTUALLY ask — from simple
icebreakers to role-specific questions. Keep the difficulty varied and realistic.
Do NOT make every question hard or overly academic.

Generate 5-7 questions for EACH of these 3 categories (15-21 total):

**Technical (5-7 questions):**
Mix these types, in roughly this order:
- 2-3 common/standard questions any interviewer would ask for this type of role
- 1-2 questions about specific tools, software, or methods from the job description
- 1-2 questions that probe the candidate's hands-on knowledge — reference skills
  or tools from their resume to let them show what they know

**Behavioral (5-7 questions):**
Mix these types:
- 2-3 classic behavioral questions commonly asked in interviews
- 1-2 questions about teamwork, communication, or work ethic
- 1-2 questions that reference the candidate's past roles or experience from
  their resume

**Situational (5-7 questions):**
Mix these types:
- 2-3 practical "what would you do if..." scenarios relevant to daily work
- 1-2 questions about handling common workplace challenges
- 1-2 questions that bridge the candidate's resume experience with this new role

IMPORTANT RULES:
- Questions should sound like what a real hiring manager would ask, NOT an exam
- Keep questions concise — 1-2 sentences max
- Start with easier/common questions, then get more specific
- When referencing resume, keep it natural ("I see you worked with X...")

Also select 3-5 resources from the RESOURCE_CATALOG below.

RESOURCE_CATALOG:
[Full JSON array of 16 resources with id, name, type, trade, description]
```

---

## 9. Resilience & Safety

| Feature | Implementation |
|---------|---------------|
| **Model Fallback** | If Grok 3 Mini fails (non-429 error), automatically retries with Gemini 2.0 Flash |
| **Rate Limit Handling** | Exponential backoff with random jitter, up to 3 retries on 429 errors |
| **Input Validation** | Job description must be 10–2000 characters |
| **Credit System** | Every generation costs 1 credit, configurable per-user limit |
| **Audit Trail** | Every AI action recorded: user ID, action type, input hash, model, timestamp |
| **Resume Optional** | Works with just job description; resume enriches but isn't required |
| **Sandbox Mode** | Returns realistic mock data for development |
| **Email Notification** | User emailed when questions are ready (non-blocking, fire-and-forget) |

---

## 10. What Makes This Thoughtful

| Design Choice | Reasoning |
|---------------|-----------|
| **Varied difficulty** | Real interviews mix easy and hard questions — our AI mirrors this |
| **Resume-aware but not resume-dependent** | Most questions are standard for the role; resume adds personalization, not dependency |
| **Natural resume references** | "I see you worked with X…" not "Based on line 14 of your CV…" |
| **Resource curation, not random selection** | AI evaluates context and picks the most relevant resources with explanations |
| **Trade-specific coaching** | Questions reference actual certifications, tools, codes, and industry practices |
| **Progressive difficulty** | Common questions first → role-specific → resume-bridging — mirrors real interview structure |
| **Concise question format** | 1–2 sentences — no academic preambles that don't reflect real interviews |

---

*Source code: `workers/src/lib/openrouter.ts` (prompt, schema & resource catalog), `workers/src/routes/questions.ts` (orchestration)*
