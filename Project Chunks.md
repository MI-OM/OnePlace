One Place — MVP / Post-MVP Product Plan
1. MVP Scope (the product boundary)
One Place helps customers find a service, understand the service, communicate with the business, and make a request.

MVP proves: Discovery + Conversation + Request. Everything else (booking, payments, phone/PSTN, mobile apps) is deliberately out.

Core loop: Find → Understand → Ask → Chat/Voice → Request → Business completes → Review.

MVP success metric / North Star: Completed customer requests generated through One Place.

2. MVP Feature / Task / Priority / Progress
Priority: P0 = required to launch · P1 = important, ship if time allows · P2 = intentionally post-MVP. Progress: all features currently 0% — Not Started.

A. Project Foundation
ID	Task	Pri	Effort	Progress
A1	Scaffold Next.js (App Router, TS, Tailwind, shadcn/ui)	P0	S	0%
A2	Git repo, ESLint/Prettier, CI	P0	S	0%
A3	Env config (Supabase, AI provider, LiveKit) + feature flags	P0	S	0%
A4	Design system: tokens, typography, core components (calm/human, per Docs 03/07)	P0	M	0%
B. Authentication & Identity (Doc 12)
ID	Task	Pri	Effort	Progress
B1	Supabase Auth (email/password + magic link)	P0	S	0%
B2	Profiles + roles (customer / business_owner / staff / admin)	P0	M	0%
B3	Session middleware + protected routes	P0	S	0%
B4	Role-aware onboarding entry points	P0	S	0%
C. Data Model & Database (Docs 04, 09, 06)
ID	Task	Pri	Effort	Progress
C1	Schema migrations: categories, businesses, services, pricing, hours, knowledge, conversations, messages, requests, reviews, favorites, profiles, audit events	P0	L	0%
C2	RLS policies on every table	P0	M	0%
C3	Triggers/functions (updated_at, audit logging, request lifecycle)	P1	M	0%
C4	Seed data: NL categories + sample local businesses	P0	M	0%
D. Discovery & Search
ID	Task	Pri	Effort	Progress
D1	Landing page (headline, "Find a service" / "List your business" CTAs)	P0	M	0%
D2	Hierarchical category browse	P0	M	0%
D3	Search: category + service + natural language (PostgreSQL FTS, no AI search in MVP)	P0	L	0%
D4	Search results page (one answer per screen)	P0	M	0%
E. Business Profile
ID	Task	Pri	Effort	Progress
E1	Public profile: name, description, location, hours, services, pricing, about, contact, reviews	P0	L	0%
E2	"Ask about this business" / "Talk to us" / "Start a voice conversation" CTAs	P0	S	0%
E3	Save/favorite businesses	P1	S	0%
F. Conversation System (Doc 13, 14)
ID	Task	Pri	Effort	Progress
F1	Chat UI: thread, messages, suggested prompts, free typing	P0	M	0%
F2	AI orchestrator + provider abstraction (AIService → ModelProvider: OpenAI/Anthropic/Google)	P0	L	0%
F3	AI tools: get_business_profile, get_services, get_service_details, get_business_hours, get_business_knowledge, create_request, escalate_to_human	P0	L	0%
F4	AI must never invent facts — answers only from tool results, else offers to contact business	P0	S	0%
F5	Conversation persistence + Supabase Realtime	P0	M	0%
F6	Human handoff + business staff inbox replies	P0	M	0%
F7	Voice via LiveKit (browser, no recording, metadata only)	P1	L	0%
G. Requests
ID	Task	Pri	Effort	Progress
G1	Turn conversation into structured request (service, date, time, customer)	P0	M	0%
G2	Business accept / decline / complete	P0	M	0%
G3	Status change notifications	P1	S	0%
H. Business Onboarding & Dashboard
ID	Task	Pri	Effort	Progress
H1	4-step onboarding wizard (business, services, hours, AI config)	P0	L	0%
H2	Manage services, hours, profile, AI config (FAQ, policies, tone: Friendly/Professional/Casual)	P0	L	0%
H3	Conversations & requests inbox	P0	M	0%
H4	Dashboard overview + MVP analytics (views, conversations, requests, reviews)	P1	M	0%
I. Reviews
ID	Task	Pri	Effort	Progress
I1	1–5 star review after completed interaction	P1	M	0%
I2	Admin review moderation	P1	S	0%
J. Customer Dashboard
ID	Task	Pri	Effort	Progress
J1	My conversations, my requests, saved businesses, profile	P1	M	0%
K. Admin (minimal, per PRD §24)
ID	Task	Pri	Effort	Progress
K1	Manage categories, view/verify/suspend businesses, moderate reviews, basic platform analytics	P1	L	0%
L. Security, Privacy, Trust, Audit (Docs 06, 15)
ID	Task	Pri	Effort	Progress
L1	RLS hardening + data-minimization (AI gets only business context + conversation)	P0	M	0%
L2	Audit/event logging (first-party DB events)	P0	M	0%
L3	Privacy docs — voice conversations not recorded	P0	S	0%
L4	Rate limiting + basic abuse prevention	P1	S	0%
L5	Analytics instrumentation (discovery/engagement/conversion/quality metrics)	P1	M	0%
M. Deployment & Ops
ID	Task	Pri	Effort	Progress
M1	Vercel deployment + env config	P0	S	0%
M2	Supabase project setup (cloud or local via CLI)	P0	S	0%
M3	Error tracking + basic logging	P1	S	0%
3. Post-MVP Scope (explicitly deferred)
Phase 1 (after MVP proves demand):

Advanced/semantic search, recommendations, location-based discovery
Booking, calendar availability, reminders
Staff accounts, staff availability, calendar integrations
Richer AI config, knowledge documents, better retrieval, multilingual
Business dashboards: better analytics, automated booking
Phase 2: PSTN phone ("Call One Place"), AI phone agent.

Phase 3: Payments → One Place becomes service infrastructure (Discovery → Conversation → Booking → Payment → Service → Review).

Never in MVP: feed, followers, influencer platform, marketplace, CRM, direct messaging between random customers, self-hosted LLM, vector DB, native mobile.

4. Implementation Roadmap (dependency-ordered)
Milestone	Contents	Why this order
M0 — Foundation	A1–A4	Everything depends on the scaffold + design system
M1 — Data + Auth	C1–C4, B1–B4	DB and identity underpin every feature
M2 — Discovery	D1–D4, E1–E3	Read-side: customers can find & understand businesses
M3 — Conversation	F1–F6, G1–G3	The core differentiator: chat + AI tools + requests
M4 — Business tools	H1–H3, J1, I1	Businesses supply content; customers get dashboards
M5 — Admin, Voice, Hardening	K1, F7, H4, I2, L1–L5, M1–M3	Voice, admin, audit, analytics, deploy
Definition of "first working slice" (M0–M2): a deployed app where a visitor can land, browse categories, search, open a business profile, and see services/pricing/hours — business data coming from seeded records.

