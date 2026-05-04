# Kraftworks Career Hub

## Product Requirements and Backend Delivery Specification

## Document Control

| Field | Value |
| --- | --- |
| Document Name | Kraftworks Career Hub Product and Backend Requirements |
| Document Version | 2.0 |
| Document Date | March 26, 2026 |
| Prepared For | Kraftworks Stakeholders and Delivery Team |
| Prepared By | Product and Engineering Documentation |
| Document Type | Corporate-standard product, backend, and operational requirements baseline |

> This document is intended to serve as the working baseline for delivery, stakeholder alignment, engineering execution, review, and future scope control. It reflects the currently implemented platform and the backend responsibilities required to operate it to a professional standard.

## Table of Contents

1. Executive Summary
2. Business Context and Product Vision
3. Personas and User Segments
4. Scope Definition
5. Functional Requirements by Epic
6. Backend Architecture and Data Model
7. Integration Requirements
8. Non-Functional Requirements
9. Security, Privacy, and Governance
10. Delivery Assumptions, Risks, and Out of Scope
11. Delivery Roadmap
12. Revision History and Sign-off

## 1. Executive Summary

Kraftworks Career Hub is a trade-focused career support platform designed to help skilled workers and trade graduates improve job readiness through resume feedback, interview preparation, educational resources, and future employer engagement workflows.

This document upgrades the existing proposal into a structured corporate-standard requirements baseline. It is intended to remove ambiguity, define clear backend responsibilities, and document how the current platform should behave operationally, functionally, and administratively.

### 1.1 Current Product Position

The currently implemented application is a web platform built with React and Supabase that provides public content pages, authenticated career tools, AI-assisted workflows, administrative review functions, and waitlist capture for both trade graduates and employers.

### 1.2 Primary Product Objectives

- Increase job readiness for trade workers through actionable resume and interview support.
- Create a controlled AI workflow where generated outputs are reviewed before end-user consumption when appropriate.
- Capture early market demand from both candidates and employers prior to broader marketplace or career fair launch.
- Maintain operational simplicity with a serverless backend, auditable data model, and clear role-based access boundaries.

### 1.3 Executive Delivery Summary

| Area | Summary |
| --- | --- |
| Frontend Surface | Landing, auth, dashboard, resume review, interview prep, blog, toolkits, waitlist, contact, legal pages, admin portal. |
| Backend Platform | Supabase Auth, PostgreSQL, RLS, storage, edge functions, AI usage tracking, admin role gating, CSV exports. |
| AI Services | Resume feedback generation and interview question generation using edge functions with rate limiting and duplicate-input prevention. |
| Operational Controls | Admin approval flow for resume feedback, searchable admin tables, export capability, role-based access model. |
| Near-term Gaps | Email delivery completion, true PDF text extraction, richer analytics, employer workflows, and career fair execution layer. |

## 2. Business Context and Product Vision

### 2.1 Problem Statement

Trade graduates and skilled workers often lack affordable, immediate, and trade-specific support when preparing for employment opportunities. General career platforms are usually not optimized for certification-heavy roles, field-specific expectations, or early-career trade workflows. Employers also need a future path to reach this talent pool in a targeted way.

### 2.2 Product Vision

Kraftworks Career Hub should become a trusted digital career readiness platform for the skilled trades, combining practical learning resources, lightweight AI assistance, and controlled administrative review to produce career guidance that is useful, relevant, and safe enough for public rollout.

### 2.3 Success Outcomes

| Objective | Desired Outcome | Indicative Measurement |
| --- | --- | --- |
| User Activation | Users create an account and complete at least one guided career action. | Signup to first meaningful action conversion rate. |
| Career Tool Adoption | Users upload resumes and generate interview practice outputs. | Resume upload rate and interview generation rate. |
| Operational Quality | Admin can review and approve AI outputs quickly and reliably. | Median feedback review time and error rate. |
| Market Validation | Trade graduates and employers register early interest. | Waitlist growth by segment and geography. |
| Platform Reliability | Users can access core tools without service disruption. | Availability, failed request rate, edge function success rate. |

## 3. Personas and User Segments

### Trade Graduate / Skilled Worker

Primary end user seeking resume help, interview preparation, and trade-specific guidance. May be unauthenticated at first and later become an authenticated dashboard user.

### Admin / Reviewer

Internal operator responsible for approving resume feedback, reviewing captured leads, and maintaining data quality across the platform.

### Employer / Recruiter

Prospect user interested in hiring trade talent. Current system supports waitlist registration rather than a full employer workspace.

### Public Visitor

Unauthenticated visitor consuming content, discovering the brand, evaluating value, and potentially converting to waitlist or account signup.

### 3.1 Persona Expectations

| Persona | Needs | Platform Response |
| --- | --- | --- |
| Trade Graduate | Confidence, clarity, and relevant preparation help. | Resume upload, AI feedback workflow, interview question generator, career toolkit resources. |
| Admin | Control, auditability, quick review, manageable exports. | Role-restricted admin panel, searchable records, feedback approval, CSV export. |
| Employer | Low-friction expression of interest and future access to talent. | Employer waitlist capture and career fair interest path. |
| Public Visitor | Brand understanding and trust signals. | Landing page, blog, trade toolkit, contact, privacy, terms, future career fair messaging. |

## 4. Scope Definition

### 4.1 In-Scope Product Modules

| Module | Scope Status | Description |
| --- | --- | --- |
| Public Marketing and Content Experience | In Scope | Landing, blog, contact, toolkit, legal pages, career fair teaser experience. |
| Authentication and Session Management | In Scope | Email/password sign up, sign in, session persistence, sign out. |
| User Dashboard | In Scope | User summary state including resume status, AI usage remaining, and interview history snapshot. |
| Resume Review Workflow | In Scope | Resume upload, delete, feedback request, admin review, approved feedback display. |
| Interview Preparation Workflow | In Scope | Job description submission and structured AI-generated question sets. |
| Admin Operations | In Scope | Resume feedback management, lead review, search, and CSV export. |
| Waitlist Capture | In Scope | Trade graduate and employer public submission forms. |
| Supabase Backend Layer | In Scope | Auth, storage, database, edge functions, RLS policies, role checks, and operational controls. |

### 4.2 Out-of-Scope for This Baseline

- Production employer portal with job posting, applicant messaging, or candidate pipeline management.
- Live digital career fair execution workflow beyond the current promotional holding page and waitlist capture.
- Subscription billing, paid plans, or payment processing.
- Full resume text parsing and scoring against structured job taxonomy data.
- Native mobile application.
- Automated email infrastructure beyond the currently stubbed notification pattern unless explicitly implemented.

### 4.3 Scope Control Principle

Any requirement not explicitly defined in this document or traceably implied by a functional acceptance criterion should be treated as a future enhancement request rather than assumed delivery scope.

## 5. Functional Requirements by Epic

The following epics are written in a professional backlog format so engineering, product, and stakeholders can align on expected behavior. IDs are assigned for traceability.

### Epic 1. Public Experience and Content Delivery

#### PE1. Landing Page Experience

**User Story**

As a public visitor, I want to understand the value of Kraftworks quickly so that I can decide whether to sign up or explore further.

**Acceptance Criteria**

- PE1-AC1: Landing page shall communicate the platform purpose, target audience, and primary calls to action.
- PE1-AC2: Visitor shall be able to navigate to authentication, career toolkit, blog, career fair, and waitlist journeys.
- PE1-AC3: The page shall display trust-building content relevant to the trades audience.

#### PE2. Career Toolkit Access

**User Story**

As a visitor or user, I want trade-specific resource pages so that I can access practical career materials relevant to my field.

**Acceptance Criteria**

- PE2-AC1: System shall provide a toolkit hub and trade-specific routes for HVAC, Electrical, and Welding.
- PE2-AC2: Each route shall present resources or outbound materials in a clear category structure.
- PE2-AC3: Article pages shall support slug-based navigation for deeper educational content.

#### PE3. Blog and Informational Content

**User Story**

As a public visitor, I want to read educational or brand content so that I can evaluate the relevance of the platform.

**Acceptance Criteria**

- PE3-AC1: Blog index shall present multiple content cards with title, category, and summary metadata.
- PE3-AC2: Content must remain readable on both desktop and mobile layouts.
- PE3-AC3: Public users must not be required to authenticate to access informational content.

#### PE4. Career Fair Holding Experience

**User Story**

As a prospect, I want to register interest in a future career fair so that I can be contacted when the service is launched.

**Acceptance Criteria**

- PE4-AC1: Career fair page shall communicate that the feature is upcoming.
- PE4-AC2: Candidate and employer pathways shall route users into the waitlist submission process.
- PE4-AC3: The page may embed promotional media without blocking the call to action.

### Epic 2. Authentication and User Access

#### AU1. User Registration

**User Story**

As a new user, I want to create an account with my identity details so that I can access personalized career tools.

**Acceptance Criteria**

- AU1-AC1: System shall support email and password registration.
- AU1-AC2: Full name shall be captured and stored in user metadata at signup.
- AU1-AC3: Successful registration shall establish an authenticated session according to Supabase Auth behavior.

#### AU2. User Sign In and Session Persistence

**User Story**

As a returning user, I want to sign in and remain signed in so that I do not need to re-authenticate unnecessarily.

**Acceptance Criteria**

- AU2-AC1: Email/password sign in shall restore access to protected routes.
- AU2-AC2: Session state shall persist across refreshes according to the active auth provider implementation.
- AU2-AC3: Protected routes shall redirect unauthenticated users to the authentication experience.

#### AU3. Role-Restricted Admin Access

**User Story**

As an internal admin, I want admin-only access enforced so that sensitive operational data is not exposed to standard users.

**Acceptance Criteria**

- AU3-AC1: Admin route access shall require both authentication and presence of the admin role.
- AU3-AC2: Non-admin users attempting to access admin routes shall be redirected away from the admin area.
- AU3-AC3: Admin role validation shall be performed against the user roles data source.

### Epic 3. User Dashboard and Guided Career Tools

#### DT1. User Dashboard Overview

**User Story**

As an authenticated user, I want a single dashboard that summarizes my progress so that I can understand what to do next.

**Acceptance Criteria**

- DT1-AC1: Dashboard shall display a greeting using available user identity metadata.
- DT1-AC2: Dashboard shall show resume status, AI usage remaining, and latest interview preparation summary where data exists.
- DT1-AC3: Dashboard shall provide quick access to the major user journeys.

#### DT2. AI Usage Visibility

**User Story**

As a user, I want to know how many AI actions remain so that I can use limited functionality intentionally.

**Acceptance Criteria**

- DT2-AC1: System shall display remaining AI actions out of the configured maximum.
- DT2-AC2: Remaining count shall update after successful AI actions are recorded.
- DT2-AC3: Duplicate input attempts shall not silently consume quota and must return a clear reason to the user.

### Epic 4. Resume Review Workflow

#### RR1. Resume Upload and Storage

**User Story**

As a user, I want to upload my resume so that the platform can evaluate it and retain it for future career assistance flows.

**Acceptance Criteria**

- RR1-AC1: System shall accept a single resume per user in PDF format according to current product behavior.
- RR1-AC2: Upload must store file metadata including file name, size, path, and timestamps.
- RR1-AC3: User shall be able to delete and replace the uploaded resume.
- RR1-AC4: Storage access must respect private user scoping and backend security policies.

#### RR2. AI Feedback Generation

**User Story**

As a user, I want AI-generated resume feedback so that I can improve my resume before applying for jobs.

**Acceptance Criteria**

- RR2-AC1: Feedback generation shall require authentication and a valid uploaded resume record.
- RR2-AC2: The backend shall validate AI usage eligibility before invoking the AI service.
- RR2-AC3: Generated output shall include strengths, improvements, suggestions, overall score, trade suggestions, and actionable steps.
- RR2-AC4: Initial feedback status shall be stored as pending review rather than displayed immediately as approved output.

#### RR3. Feedback Status Lifecycle

**User Story**

As a user, I want to understand whether my feedback is under review or ready so that I know what to expect next.

**Acceptance Criteria**

- RR3-AC1: Pending review state shall be visible in the UI with clear messaging.
- RR3-AC2: Approved feedback shall become visible after admin approval.
- RR3-AC3: Feedback state transitions must persist in the database and be reflected consistently on dashboard and resume review surfaces.

### Epic 5. Interview Preparation Workflow

#### IP1. Job Description Intake

**User Story**

As a user, I want to submit a target job description so that the platform can generate role-relevant interview practice.

**Acceptance Criteria**

- IP1-AC1: User shall be able to enter a job description in a long-form text area.
- IP1-AC2: Input must satisfy the minimum validation threshold before generation is allowed.
- IP1-AC3: The feature shall require an uploaded resume when current UX logic depends on resume context.

#### IP2. Structured Question Generation

**User Story**

As a user, I want categorized interview questions so that I can practice multiple dimensions of an interview.

**Acceptance Criteria**

- IP2-AC1: Backend shall generate grouped questions across technical, behavioral, and situational categories.
- IP2-AC2: Generated results shall be stored for retrieval as the user's latest session history.
- IP2-AC3: The platform shall prevent duplicate submission with identical input according to usage tracking rules.

### Epic 6. Admin Operations

#### AD1. Resume Feedback Review Queue

**User Story**

As an admin, I want to review all generated feedback so that only acceptable content is surfaced to users.

**Acceptance Criteria**

- AD1-AC1: Admin panel shall list resume feedback entries sorted by most recent submission.
- AD1-AC2: Admin shall be able to search records and inspect detailed output contents.
- AD1-AC3: Admin shall be able to edit structured feedback fields and approve pending items.
- AD1-AC4: Approval must update the persistent feedback status used by the user-facing interface.

#### AD2. Waitlist Review for Trade Graduates

**User Story**

As an admin, I want to review candidate interest submissions so that the business can evaluate audience demand.

**Acceptance Criteria**

- AD2-AC1: Admin shall be able to list trade graduate waitlist records with search capability.
- AD2-AC2: Records shall include identity, trade program, location, and submission timestamp.
- AD2-AC3: Admin shall be able to export records as CSV.

#### AD3. Waitlist Review for Employers

**User Story**

As an admin, I want to review employer interest submissions so that go-to-market activity can be prioritized intelligently.

**Acceptance Criteria**

- AD3-AC1: Admin shall be able to list employer waitlist records with search capability.
- AD3-AC2: Records shall include contact and hiring intent metadata.
- AD3-AC3: Admin shall be able to export records as CSV.

### Epic 7. Waitlist and Contact Capture

#### WL1. Trade Graduate Waitlist Submission

**User Story**

As a prospective candidate, I want to register interest without creating an account so that I can be contacted later.

**Acceptance Criteria**

- WL1-AC1: Public form shall collect full name, email, trade program, state, city, and consent.
- WL1-AC2: Submission shall persist to the correct backend table without requiring authentication.
- WL1-AC3: The user shall receive a clear success notification after submission.

#### WL2. Employer Waitlist Submission

**User Story**

As an employer, I want to express hiring interest so that I can be contacted regarding future platform opportunities.

**Acceptance Criteria**

- WL2-AC1: Public form shall collect full name, job title, company email, trades hiring for, hiring volume, state, city, and consent.
- WL2-AC2: Submission shall persist to the employer waitlist data source without requiring authentication.
- WL2-AC3: The user shall receive confirmation that their information was captured successfully.

#### WL3. Contact Accessibility

**User Story**

As a public visitor, I want a straightforward way to contact Kraftworks so that I can ask questions without friction.

**Acceptance Criteria**

- WL3-AC1: Contact page shall expose a clear contact mechanism.
- WL3-AC2: Contact information must remain available without authentication.
- WL3-AC3: Legal pages must be reachable from the public site to support basic trust and compliance expectations.

## 6. Backend Architecture and Data Model

### 6.1 Architecture Summary

The current platform is implemented as a React web application backed by Supabase services. Backend responsibilities are distributed across Supabase Auth, PostgreSQL tables with row-level security, private storage for resume files, and edge functions for AI-assisted workflows.

### 6.2 Core Technology Stack

| Layer | Technology | Responsibility |
| --- | --- | --- |
| Client Application | React 18, TypeScript, Vite | Route-driven web experience and user interaction layer. |
| UI Foundation | Tailwind CSS, shadcn/ui, Radix UI | Consistent component system and responsive layouts. |
| Authentication | Supabase Auth | User account lifecycle and session management. |
| Database | Supabase PostgreSQL | Transactional data persistence for users, feedback, questions, waitlists, and roles. |
| Storage | Supabase Storage | Private resume file storage. |
| Serverless Logic | Supabase Edge Functions | AI invocation, business validation, and notification hooks. |
| State/Data Fetching | TanStack Query and local hooks | Client data synchronization and reactive UI states. |
| Testing | Vitest, Testing Library, Playwright | Unit, component, and end-to-end testing coverage foundation. |

### 6.3 Logical System View

`User Browser -> React Routes -> Supabase Auth / Database / Storage -> Edge Functions -> AI Provider`

`Admin Browser -> Admin Route Guard -> Supabase Role Check -> Feedback and Waitlist Operations`

### 6.4 Data Entities

| Entity | Purpose | Key Fields |
| --- | --- | --- |
| resumes | Canonical user resume record. | user_id, file_name, file_path, file_size, file_hash, trade_program, timestamps |
| resume_feedback | Structured AI feedback and review lifecycle state. | user_id, resume_id, resume_hash, status, strengths, improvements, suggestions, overall_score, trade_suggestions, actionable_steps |
| interview_questions | Persisted question sets for user review. | user_id, resume_id, job_description, technical, behavioral, situational, created_at |
| ai_usage | Quota and deduplication tracking. | user_id, action_type, input_hash, created_at |
| trade_grad_waitlist | Candidate market-interest capture. | full_name, email, trade_program, state, city, consent, created_at |
| employer_waitlist | Employer market-interest capture. | full_name, job_title, company_email, trades_hiring_for, hiring_volume, state, city, consent, created_at |
| user_roles | Role-based access control mapping. | user_id, role |

### 6.5 AI Usage Policy Logic

| Rule | Expected System Behavior |
| --- | --- |
| Quota | Each user is limited to three AI actions during the current beta logic. |
| Deduplication | Repeated submission of the same action type with the same logical input is rejected using a hashed key. |
| Visibility | Remaining quota is displayed back to the user in the dashboard experience. |
| Persistence | Successful AI invocations create a durable usage record. |

## 7. Integration Requirements

### 7.1 Edge Functions

| Function | Purpose | Required Behavior |
| --- | --- | --- |
| generate-resume-feedback | Generate structured resume feedback. | Must authenticate the caller, validate usage eligibility, generate structured output, and persist a pending review record. |
| generate-questions | Generate interview questions from a job description and resume context. | Must authenticate the caller, validate usage eligibility, call the AI provider, normalize categorized output, and persist the result. |
| notify-admin-resume | Support operational notification on new resume-related activity. | Currently behaves as a stub and requires production email integration before it can be treated as an operational dependency. |

### 7.2 AI Service Expectations

- AI outputs must be requested in a structured machine-parseable format rather than inferred from free-form text.
- Prompts should remain trade-aware and reflect the intended user audience.
- All AI interactions must fail safely and return user-readable errors when the downstream provider is unavailable.
- AI invocation must not bypass quota enforcement or duplicate-input controls.

### 7.3 Storage and File Handling Requirements

- Resume files must be stored in a private storage location with user-scoped paths.
- Deletion of a resume should not leave orphaned operational records without intentional policy.
- File metadata must remain queryable for dashboard and admin views.

## 8. Non-Functional Requirements

| Category | Requirement |
| --- | --- |
| Performance | Core dashboard and admin data retrieval should feel responsive under normal load, with standard data views rendering without material delay for typical dataset sizes. |
| Scalability | The platform must support growth in users, waitlist records, AI generation history, and content volume without requiring fundamental re-architecture in the near term. |
| Availability | Public pages and authenticated workflows should remain accessible except for planned maintenance or third-party service outages. |
| Reliability | Failed AI invocations, upload issues, or admin actions must not silently corrupt state. Errors must be surfaced and partial updates avoided. |
| Security | All sensitive operations must rely on authenticated access, scoped storage, and row-level security or equivalent policy enforcement. |
| Usability | Users should understand current state, remaining actions, pending review status, and next actions without specialist training. |
| Maintainability | The codebase and backend objects should remain understandable to future contributors with clear separation between public flows, user tools, admin operations, and edge logic. |
| Auditability | Admin state changes, AI-generated artifacts, and waitlist submissions must remain reviewable through persisted records. |
| Testability | Critical flows should remain executable through unit or end-to-end tests, with local and CI-friendly test commands available. |

## 9. Security, Privacy, and Governance

### 9.1 Access Control

- Protected routes must require authentication.
- Administrative workflows must require explicit admin role assignment.
- Backend data access must be constrained by row-level security policies wherever appropriate.

### 9.2 Data Sensitivity

- Resume files and associated feedback are user-sensitive data and must not be publicly exposed.
- Waitlist submissions contain personal and business contact data and must be treated as controlled internal data.
- Job descriptions entered by users may contain employer-sensitive details and should be handled as private user input.

### 9.3 Governance Requirements

| Area | Requirement |
| --- | --- |
| AI Output Governance | Resume feedback shall pass through admin review before approved content is exposed to users. |
| Legal Visibility | Privacy policy and terms of service pages must remain public and accessible. |
| Operational Logging | Edge functions and admin actions should be observable enough for troubleshooting and support. |
| Change Management | Schema, role, and AI prompt changes should be version-controlled and released intentionally. |

## 10. Delivery Assumptions, Risks, and Out of Scope

### 10.1 Delivery Assumptions

- Supabase remains the authoritative backend platform for auth, database, storage, and edge functions.
- Existing route structure and product positioning remain substantially unchanged during this documentation baseline period.
- AI provider behavior and model availability may change over time, but structured output contracts remain mandatory.
- Admin review remains part of the quality-control model for resume feedback.

### 10.2 Key Risks

- Current resume feedback quality is limited by the absence of full resume text extraction and deeper parsing.
- Email notification workflow is not yet production-complete, which creates operational visibility gaps.
- AI quota is deliberately small and may constrain user value if beta usage grows before policy changes are introduced.
- Employer functionality is currently demand-capture only, which may create expectation gaps if not communicated clearly.

### 10.3 Explicit Out-of-Scope Items

- Real-time chat or messaging between employers and candidates.
- Payment collection, invoicing, or subscription billing.
- Automated hiring workflow or applicant tracking system capability.
- Advanced analytics dashboards beyond current lightweight summaries and CSV export patterns.

## 11. Delivery Roadmap

| Phase | Focus | Expected Outcome |
| --- | --- | --- |
| Phase 1 | Core Platform Stabilization | Confirm schema integrity, RLS correctness, storage behavior, and AI edge function reliability. |
| Phase 2 | Operational Completion | Complete admin notification pathway, strengthen monitoring, and improve failure handling. |
| Phase 3 | Experience Enhancement | Improve resume parsing depth, analytics visibility, and user profile maturity. |
| Phase 4 | Go-to-Market Expansion | Extend employer workflows and evolve the career fair experience into an executable product module. |

### 11.1 Recommended Immediate Next Priorities

1. Align stakeholders on this requirements baseline and approve scope boundaries.
2. Close operational gaps in notification and observability.
3. Improve backend handling of resume content to raise feedback quality.
4. Establish release criteria for beta-to-production readiness.

## 12. Revision History and Sign-off

### 12.1 Revision History

| Date | Version | Summary |
| --- | --- | --- |
| March 26, 2026 | 2.0 | Replaced lightweight proposal content with a detailed corporate-standard product and backend requirements document aligned to the current codebase. |
| Prior version | 1.0 | Initial proposal shell with styling and high-level backend concepts not fully aligned to the implemented stack. |

### 12.2 Sign-off

| Role | Name | Date | Signature |
| --- | --- | --- | --- |
| Product Owner |  |  |  |
| Engineering Lead |  |  |  |
| Operations / Admin Lead |  |  |  |
| Stakeholder Approval |  |  |  |

End of document. This specification should be maintained as the authoritative baseline until superseded by an approved revision.