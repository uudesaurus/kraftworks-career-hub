# Kraftworks Career Hub

Career tools and resources built for skilled trade professionals.

## Features

- **Resume Review** — Upload your resume and get AI-powered feedback on strengths, gaps, and actionable improvements
- **Interview Prep** — Generate trade-specific interview questions from job descriptions
- **Career Toolkit** — Curated resources for HVAC, electrical, and welding professionals
- **Career Fair** — Browse job listings and connect with employers

## Tech Stack

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui
- **Auth:** Clerk
- **Backend:** Cloudflare Workers (Hono), D1, R2
- **AI:** Google Gemini API

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Production Deploy (Vercel)

Use separate deployments for main app and employer app.

### 1) Preflight checks

```bash
npm run build
npm run build:employer
npm run test
```

### 2) Set production environment variables in Vercel

- Main app project:
	- VITE_SANDBOX_MODE=false
	- VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
	- VITE_API_BASE_URL=https://<your-workers-domain>
	- VITE_EMPLOYER_URL=https://<your-employer-domain>

- Employer app project:
	- VITE_SANDBOX_MODE=false
	- VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
	- VITE_API_BASE_URL=https://<your-workers-domain>
	- VITE_MAIN_APP_URL=https://<your-main-domain>

### 3) Deploy to production

```bash
npm run deploy:prod:main
npm run deploy:prod:employer
```

Or run both in sequence:

```bash
npm run deploy:prod:all
```

Notes:
- Main deployment uses vercel.json.
- Employer deployment uses vercel.employer.json via --local-config.
