# ONE PLACE — DOCUMENT 02

## Complete System Architecture & Technical Design

**Version:** 1.0
**Status:** Development Specification — MVP
**Product:** One Place
**Primary platform:** Responsive Web
**Architecture principle:** Simple first, modular from day one, scalable without premature complexity.

---

# 1. Architecture Decision Summary

The MVP will use:

| Layer                    | Technology                              |
| ------------------------ | --------------------------------------- |
| Frontend                 | Next.js + TypeScript                    |
| UI                       | Tailwind CSS                            |
| Components               | shadcn/ui                               |
| Backend                  | Next.js Server Actions + Route Handlers |
| Database                 | Supabase PostgreSQL                     |
| Authentication           | Supabase Auth                           |
| File storage             | Supabase Storage                        |
| Realtime database events | Supabase Realtime where needed          |
| Voice                    | LiveKit                                 |
| AI                       | Provider-agnostic LLM abstraction       |
| Validation               | Zod                                     |
| ORM/data access          | Supabase client / typed queries         |
| Hosting                  | Vercel                                  |
| Source control           | GitHub                                  |
| Monitoring               | Vercel + application logging            |
| Analytics                | First-party database events initially   |

### Explicit decision

**No NestJS for MVP.**

The application will be a single Next.js application.

---

# 2. High-Level Architecture

```text
                         ┌─────────────────────┐
                         │      CUSTOMER       │
                         │    Web Browser      │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │      NEXT.JS        │
                         │  App Router + UI    │
                         └──────────┬──────────┘
                                    │
             ┌──────────────────────┼──────────────────────┐
             │                      │                      │
             ▼                      ▼                      ▼
      ┌─────────────┐       ┌─────────────┐       ┌─────────────┐
      │   Supabase  │       │ AI Service  │       │   LiveKit   │
      │             │       │             │       │             │
      │ PostgreSQL  │       │ LLM         │       │ Voice       │
      │ Auth        │       │ Tools       │       │ Realtime    │
      │ Storage     │       │ Orchestrator│       │             │
      └─────────────┘       └──────┬──────┘       └──────┬──────┘
                                   │                     │
                                   └──────────┬──────────┘
                                              ▼
                                    ┌──────────────────┐
                                    │  One Place Data  │
                                    │ & Business Logic │
                                    └──────────────────┘
```

---

# 3. Architectural Principles

## 3.1 One application first

We do not start with:

```text
Next.js
+
NestJS
+
Redis
+
Kafka
+
Vector DB
+
microservices
+
Kubernetes
```

That would be unnecessary.

Instead:

```text
Next.js
+
Supabase
+
LiveKit
+
LLM
```

is sufficient for MVP.

---

# 4. Why Next.js Handles the Backend

Next.js will handle:

* authentication flows
* protected server operations
* database operations
* validation
* business logic
* AI orchestration
* LiveKit token generation
* webhooks
* analytics events
* administrative operations

The browser **never directly controls privileged operations**.

For example:

```text
Browser
   │
   │ create request
   ▼
Next.js Server Action
   │
   ├── authenticate
   ├── authorize
   ├── validate
   ├── execute business rules
   └── write database
```

---

# 5. When NestJS Becomes Necessary

NestJS should only be introduced when the architecture genuinely requires an independent backend.

Examples:

### Scenario A

Native mobile apps become major clients.

### Scenario B

Third-party developers need a public API.

### Scenario C

Background processing becomes substantial.

### Scenario D

Multiple applications need the same backend.

### Scenario E

The application becomes large enough that independent service deployment provides operational value.

Until then:

> **Next.js is the backend.**

---

# 6. Application Structure

Recommended project structure:

```text
one-place/
│
├── app/
│   ├── (marketing)/
│   │   ├── page.tsx
│   │   ├── businesses/
│   │   ├── categories/
│   │   └── about/
│   │
│   ├── (auth)/
│   │   ├── login/
│   │   ├── signup/
│   │   └── verify/
│   │
│   ├── (customer)/
│   │   ├── search/
│   │   ├── businesses/
│   │   ├── conversations/
│   │   ├── requests/
│   │   └── saved/
│   │
│   ├── (business)/
│   │   ├── dashboard/
│   │   ├── profile/
│   │   ├── services/
│   │   ├── conversations/
│   │   ├── requests/
│   │   ├── availability/
│   │   └── ai/
│   │
│   ├── admin/
│   │
│   └── api/
│       ├── ai/
│       ├── livekit/
│       └── webhooks/
│
├── components/
│   ├── ui/
│   ├── business/
│   ├── customer/
│   ├── conversation/
│   ├── voice/
│   └── dashboard/
│
├── lib/
│   ├── supabase/
│   ├── auth/
│   ├── ai/
│   ├── livekit/
│   ├── analytics/
│   ├── security/
│   └── validation/
│
├── actions/
│   ├── businesses/
│   ├── services/
│   ├── conversations/
│   ├── requests/
│   ├── reviews/
│   └── users/
│
├── types/
│
├── config/
│
├── hooks/
│
└── middleware.ts
```

---

# 7. Frontend Architecture

Use the Next.js App Router.

### Server Components

Use for:

* public business pages
* search results
* category pages
* static marketing pages
* dashboard initial data

### Client Components

Use only where interaction requires them:

* chat
* voice
* search filters
* forms
* modals
* interactive dashboards

Principle:

> **Do not turn the entire application into a client-side application.**

---

# 8. Rendering Strategy

## Public pages

Prefer server rendering.

Examples:

```text
/businesses/business-name
/categories/barbers
```

Benefits:

* SEO
* performance
* social sharing
* lower client JavaScript

## Authenticated dashboards

Server-rendered shell + interactive client components.

---

# 9. Authentication

Supabase Auth handles authentication.

MVP methods:

### Email/password

Primary.

### Email verification

Required.

Social login can be added later.

---

# 10. User Identity

Authentication identity:

```text
Supabase Auth User
        │
        ▼
profiles
```

The application never uses the Supabase auth user table as its primary business profile.

Instead:

```text
auth.users
     │
     ▼
profiles
```

---

# 11. User Roles

A user may have:

```text
customer
business_owner
business_staff
admin
```

Do not make the assumption that one user can only ever have one role.

A user may eventually:

```text
Customer
+
Business Owner
```

Therefore roles should be modeled separately.

---

# 12. Authorization

There are two layers.

## Application authorization

Next.js checks:

```text
Who is this user?
What are they trying to do?
Do they have permission?
```

## Database authorization

Supabase RLS independently checks:

```text
Can this user read/write this record?
```

Never rely exclusively on frontend checks.

---

# 13. Supabase Architecture

Supabase provides:

```text
PostgreSQL
Auth
Storage
Realtime
```

We should primarily use PostgreSQL as the source of truth.

---

# 14. Database Domains

The database can be conceptually divided into:

```text
IDENTITY
│
├── profiles
├── roles
└── user_roles

BUSINESS
│
├── businesses
├── business_members
├── categories
├── services
├── business_hours
└── business_knowledge

CONVERSATION
│
├── conversations
├── conversation_participants
├── messages
└── conversation_events

REQUEST
│
├── service_requests
└── request_events

ENGAGEMENT
│
├── favorites
├── reviews
└── ratings

VOICE
│
├── voice_sessions
└── voice_events

ANALYTICS
│
└── analytics_events
```

---

# 15. Database Relationship Model

```text
profiles
   │
   ├──────────────┐
   ▼              ▼
user_roles    business_members
                   │
                   ▼
               businesses
                   │
       ┌───────────┼────────────┐
       ▼           ▼            ▼
 categories     services    business_hours
                   │
                   ▼
             service_requests
                   │
                   ▼
              conversations
                   │
                   ▼
                messages
```

---

# 16. Businesses

A business represents the service provider.

Core fields:

```text
id
owner_id
name
slug
description
phone
email
website
address
city
province
postal_code
latitude
longitude
status
verification_status
created_at
updated_at
```

### Business status

```text
draft
active
suspended
archived
```

### Verification status

```text
unverified
pending
verified
rejected
```

---

# 17. Categories

Categories are platform-controlled.

Fields:

```text
id
parent_id
name
slug
description
icon
is_active
sort_order
created_at
updated_at
```

Hierarchical categories allow:

```text
Beauty
 └── Hair
      └── Braiding
```

without requiring structural changes later.

---

# 18. Services

Each business has services.

```text
id
business_id
category_id
name
description
price
price_type
duration_minutes
is_active
created_at
updated_at
```

Price type:

```text
fixed
starting_from
custom
free
```

---

# 19. Business Hours

Store recurring hours separately.

```text
id
business_id
day_of_week
opens_at
closes_at
is_closed
```

This allows the AI to answer:

> "Are you open tomorrow?"

without asking the LLM to guess.

---

# 20. Business Knowledge

Business-specific information for AI.

Examples:

* parking
* cancellation policy
* payment methods
* accessibility
* FAQs
* special instructions

Fields:

```text
id
business_id
title
content
knowledge_type
is_active
created_at
updated_at
```

---

# 21. Conversation Architecture

Conversation:

```text
conversation
      │
      ├── participants
      │
      └── messages
```

Conversation fields:

```text
id
customer_id
business_id
channel
status
started_at
ended_at
created_at
updated_at
```

Channel:

```text
chat
voice
```

---

# 22. Messages

```text
id
conversation_id
sender_type
sender_id
message_type
content
metadata
created_at
```

Sender:

```text
customer
business
ai
system
```

Message type:

```text
text
system
tool_result
```

For voice, we do not store audio as message content.

---

# 23. Service Requests

```text
id
customer_id
business_id
service_id
conversation_id
requested_date
requested_time
notes
status
created_at
updated_at
```

Status:

```text
pending
accepted
declined
cancelled
completed
```

---

# 24. Reviews

Reviews should reference a real interaction/request.

```text
id
customer_id
business_id
request_id
rating
title
content
status
created_at
```

This reduces fake reviews.

---

# 25. Favorites

```text
id
customer_id
business_id
created_at
```

Unique constraint:

```text
(customer_id, business_id)
```

---

# 26. Voice Sessions

```text
id
conversation_id
customer_id
business_id
livekit_room_name
started_at
ended_at
duration_seconds
status
```

Status:

```text
connecting
active
completed
failed
cancelled
```

---

# 27. Voice Events

Useful for diagnostics.

```text
id
voice_session_id
event_type
metadata
created_at
```

Examples:

```text
session_created
token_issued
participant_joined
agent_joined
participant_left
agent_left
connection_failed
session_ended
```

---

# 28. Analytics

MVP analytics should use a generic event model.

```text
analytics_events
```

Fields:

```text
id
user_id
business_id
event_name
session_id
metadata
created_at
```

Examples:

```text
business_viewed
search_performed
conversation_started
voice_started
request_created
request_completed
review_created
```

---

# 29. RLS Strategy

Every sensitive table gets RLS.

Examples:

### Businesses

Public users:

```text
SELECT active businesses
```

Owners:

```text
SELECT/UPDATE own business
```

Admin:

```text
full access
```

### Conversations

Customer:

```text
only conversations they participate in
```

Business:

```text
only conversations involving their business
```

### Messages

Only participants can read messages.

This is critical.

---

# 30. API Strategy

We should prefer **Server Actions** for internal application mutations.

Example:

```text
createService()
updateBusiness()
createRequest()
sendMessage()
createReview()
```

Use Route Handlers where an HTTP endpoint is genuinely useful.

Examples:

```text
/api/livekit/token
/api/ai/respond
/api/webhooks/...
```

---

# 31. Validation

Every mutation must validate input.

Use Zod.

Example conceptual flow:

```text
Form
 ↓
Zod validation
 ↓
Authentication
 ↓
Authorization
 ↓
Business rule validation
 ↓
Database
```

Never trust client-provided data.

---

# 32. Business Logic

Business logic belongs on the server.

For example:

A customer cannot mark their own request as:

```text
completed
```

The business must do it.

Similarly:

A customer cannot create a review unless:

```text
request.status = completed
```

---

# 33. AI Architecture

The AI layer should be isolated:

```text
lib/ai/
│
├── provider.ts
├── orchestrator.ts
├── prompts.ts
├── tools/
│   ├── business.ts
│   ├── services.ts
│   ├── availability.ts
│   ├── requests.ts
│   └── escalation.ts
└── types.ts
```

---

# 34. LLM Provider Abstraction

Do not scatter:

```text
OPENAI_API_KEY
```

throughout the application.

Instead:

```text
AIProvider
   │
   ├── OpenAIProvider
   ├── AnthropicProvider
   └── FutureProvider
```

The rest of One Place communicates with:

```text
AIProvider.generate()
```

rather than a particular vendor.

---

# 35. AI Request Flow

```text
Customer message
       ↓
Authentication
       ↓
Conversation retrieval
       ↓
Business context retrieval
       ↓
Relevant service data
       ↓
AI system prompt
       ↓
LLM
       ↓
Tool call if necessary
       ↓
Tool validates permissions
       ↓
Database
       ↓
Result returned to LLM
       ↓
Response
       ↓
Message saved
```

---

# 36. AI Must Not Directly Access PostgreSQL

The model does not receive unrestricted database access.

Instead:

```text
LLM
 ↓
Tool
 ↓
Authorization
 ↓
Database
```

This is a major security boundary.

---

# 37. AI Tool Example

Tool:

```text
get_business_services
```

Input:

```text
business_id
```

Server:

1. Validate ID.
2. Confirm business exists.
3. Retrieve active services.
4. Return structured data.

The model receives only the relevant result.

---

# 38. AI Escalation

When AI cannot confidently answer:

> "I don't have enough information to answer that accurately."

Then:

> "Would you like to send this to the business?"

This is preferable to hallucination.

---

# 39. Human Escalation

MVP can support:

```text
AI
 ↓
Customer requests human
 ↓
Business conversation/request
```

The business receives the request in their dashboard.

Real-time human takeover can remain a later enhancement unless validation proves it necessary.

---

# 40. Voice Architecture

LiveKit handles the realtime communication layer.

```text
Browser
  │
  │ microphone
  ▼
LiveKit Room
  │
  ├── Customer
  │
  └── AI Agent
```

The AI agent communicates with One Place tools.

---

# 41. Voice Session Flow

```text
Customer clicks "Talk"
        ↓
Check authentication
        ↓
Create conversation
        ↓
Create voice session
        ↓
Generate LiveKit token
        ↓
Browser connects
        ↓
AI agent joins
        ↓
Agent receives business context
        ↓
Conversation begins
        ↓
Customer speaks
        ↓
Agent responds
        ↓
Customer ends call
        ↓
Session finalized
```

---

# 42. Voice Context

The voice agent should receive:

```text
business identity
business description
services
pricing
hours
business knowledge
conversation context
```

It should **not** receive the entire database.

---

# 43. Voice Failure Scenarios

### Microphone denied

Display:

> **Microphone access is required for a voice conversation.**

CTA:

> **Try again**

### LiveKit connection failure

> **We couldn't connect the voice conversation. Please try again.**

### AI unavailable

> **We're having trouble starting the conversation. You can continue by chat instead.**

### Customer disconnects

Session marked:

```text
completed
```

if it was successfully established.

---

# 44. No Voice Recording

MVP default:

```text
Audio recording = OFF
```

This reduces:

* storage
* privacy risk
* compliance complexity
* operational cost

---

# 45. Realtime Chat

Chat does not need a complex messaging infrastructure.

MVP can use:

```text
PostgreSQL
+
Supabase Realtime
```

Messages are stored in PostgreSQL.

Realtime events update the UI.

---

# 46. Notification Strategy

MVP:

* in-app notifications
* email notifications where necessary

Do not build:

* SMS infrastructure
* push notification infrastructure
* complex notification preferences

until usage justifies them.

---

# 47. Storage

Supabase Storage can store:

* business logos
* business images
* user profile images

Storage buckets:

```text
business-assets
profile-assets
```

Access policies must prevent unauthorized uploads.

---

# 48. Image Upload Rules

Server should validate:

* file type
* file size
* ownership
* allowed extensions

Do not trust MIME type supplied by browser alone.

---

# 49. Search Architecture

MVP:

```text
PostgreSQL
+
indexes
+
structured category filtering
+
text search
```

Do not introduce a vector database initially.

---

# 50. Future Search

Later:

```text
Natural language query
        ↓
Embedding
        ↓
Semantic search
        ↓
PostgreSQL/vector layer
        ↓
Business ranking
```

But only when ordinary search becomes insufficient.

---

# 51. Ranking

MVP ranking can use deterministic factors:

```text
relevance
+
category match
+
location
+
verification
+
activity
```

Avoid machine-learning ranking initially.

---

# 52. Location

Store:

```text
latitude
longitude
city
province
postal_code
```

MVP can perform basic geographic filtering.

Advanced geospatial ranking can be introduced later.

---

# 53. Analytics Architecture

Every important interaction should produce an event.

Example:

```text
trackEvent({
  name: "conversation_started",
  businessId,
  userId,
  metadata
})
```

Analytics must not contain unnecessary sensitive conversation content.

---

# 54. Error Architecture

All server operations should return predictable errors.

Categories:

```text
VALIDATION_ERROR
UNAUTHORIZED
FORBIDDEN
NOT_FOUND
CONFLICT
RATE_LIMITED
INTERNAL_ERROR
AI_ERROR
VOICE_ERROR
```

Frontend converts these into human-friendly messages.

---

# 55. User-Facing Error Principle

Never expose:

```text
PostgreSQL error
Supabase error
LiveKit stack trace
LLM exception
```

Instead:

> **Something went wrong. Please try again.**

Detailed technical information goes to logs.

---

# 56. Rate Limiting

MVP should rate-limit:

* login attempts
* AI requests
* voice session creation
* message sending
* review creation
* public search endpoints where necessary

This becomes especially important once the application is public.

---

# 57. Abuse Prevention

MVP should include:

* account verification
* report business
* report conversation
* report review
* block user where applicable
* admin suspension

Do not build an elaborate moderation AI system initially.

---

# 58. Security Boundaries

```text
Browser
   ↓
Public data only

Authenticated Server
   ↓
User-authorized data

Admin Server
   ↓
Administrative data
```

Secrets must never be exposed to browser JavaScript.

---

# 59. Environment Variables

Conceptually:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY

SUPABASE_SERVICE_ROLE_KEY

LIVEKIT_API_KEY
LIVEKIT_API_SECRET
LIVEKIT_URL

AI_PROVIDER_API_KEY
```

Only variables explicitly marked public may reach the browser.

---

# 60. Deployment

MVP:

```text
GitHub
   ↓
Vercel
   ↓
Next.js
```

Supabase runs separately.

LiveKit runs separately.

AI provider runs separately.

This is acceptable because these are infrastructure services rather than application microservices we have to operate ourselves.

---

# 61. Development Environments

Three environments eventually:

```text
Local
Staging
Production
```

Initially, development can use:

```text
Local
Production
```

but staging should be introduced before public launch.

---

# 62. Migration Strategy

Database changes must be migration-based.

Never manually modify production schema.

Flow:

```text
Developer
 ↓
Migration
 ↓
Local testing
 ↓
Staging
 ↓
Production
```

---

# 63. Backup Strategy

Supabase database backups should be enabled.

Critical business data must not exist only in application memory or third-party AI systems.

The database remains the source of truth.

---

# 64. Observability

Monitor:

### Application

* errors
* response times
* failed actions

### AI

* requests
* failures
* latency
* token usage
* estimated cost

### Voice

* sessions
* connection failures
* duration
* agent failures

### Business

* requests
* conversations
* conversions

---

# 65. Cost-Control Architecture

The MVP intentionally avoids expensive infrastructure.

### Avoid initially:

* dedicated servers
* Kubernetes
* Redis cluster
* Kafka
* self-hosted LLM
* vector database
* PSTN numbers
* voice recording
* separate backend deployment

The core infrastructure is:

```text
Vercel
+
Supabase
+
LiveKit
+
LLM API
```

---

# 66. Scalability Strategy

We scale **vertically first, then horizontally.**

### Stage 1

```text
One Next.js application
One Supabase project
LiveKit
LLM provider
```

### Stage 2

Introduce:

* caching
* background jobs
* dedicated AI service if needed
* improved search

### Stage 3

Potentially:

```text
Next.js
       │
       ├── API service
       ├── AI service
       ├── worker service
       └── realtime/voice infrastructure
```

### Stage 4

Only if genuinely necessary:

microservices.

---

# 67. Architectural Rule

We should not say:

> "We need microservices because we want to scale."

Instead:

> **"We introduce a separate service when there is a demonstrated operational or scaling reason."**

That keeps One Place cheap and maintainable.

---

# 68. MVP Request Lifecycle

```text
Customer discovers business
        ↓
Customer asks question
        ↓
AI answers
        ↓
Customer wants service
        ↓
Customer creates request
        ↓
Business receives request
        ↓
Business accepts
        ↓
Service occurs
        ↓
Business completes request
        ↓
Customer reviews
```

This should be the primary end-to-end test of the MVP.

---

# 69. MVP Voice Lifecycle

```text
Customer
   ↓
Business profile
   ↓
"Talk to us"
   ↓
Create conversation
   ↓
Create voice session
   ↓
LiveKit token
   ↓
LiveKit room
   ↓
AI agent
   ↓
Business tools
   ↓
Conversation
   ↓
End
   ↓
Store metadata
```

No phone infrastructure is involved.

---

# 70. Future PSTN Architecture

**Not MVP.**

When introduced:

```text
Customer Phone
      ↓
Telephone Network
      ↓
Telephony/PSTN
      ↓
LiveKit
      ↓
Voice Agent
      ↓
One Place
```

Business direct numbers can eventually be introduced as an optional premium capability.

---

# 71. Business Direct Calling — Future Decision

We should not immediately give every business a telephone number.

Instead, later:

### Option A

One Place number:

> "Call One Place."

### Option B

Business-specific number:

> "Call [Business] through One Place."

### Option C

Existing business number forwarding.

Each has different economics.

This should be evaluated after MVP voice usage is understood.

---

# 72. What the MVP Does NOT Depend On

The MVP does not require:

```text
NestJS
Redis
Kafka
Kubernetes
ElasticSearch
Pinecone
custom LLM
AI training
PSTN
Twilio
native apps
payment processing
calendar APIs
```

That is deliberate.

---

# 73. Core Technical Dependency Graph

```text
                    ┌──────────────┐
                    │    Next.js   │
                    └──────┬───────┘
                           │
             ┌─────────────┼─────────────┐
             │             │             │
             ▼             ▼             ▼
        ┌─────────┐   ┌─────────┐   ┌─────────┐
        │ Supabase│   │ AI Layer│   │ LiveKit │
        └─────────┘   └─────────┘   └─────────┘
             │             │             │
             ▼             ▼             ▼
           Data          Reasoning      Voice
```

---

# 74. Source-of-Truth Rules

This is one of the most important sections.

| Information       | Source of truth       |
| ----------------- | --------------------- |
| Business name     | Database              |
| Service           | Database              |
| Price             | Database              |
| Opening hours     | Database              |
| Business policies | Database              |
| Customer account  | Database/Auth         |
| Conversation      | Database              |
| Request           | Database              |
| Review            | Database              |
| Voice state       | Application + LiveKit |
| AI response       | AI                    |
| AI knowledge      | Database              |

**The AI never becomes the authoritative source of business information.**

---

# 75. Development Order

The developer should build in this order:

### Sprint 1

```text
Project
Authentication
Supabase
Database
RLS
Basic UI system
```

### Sprint 2

```text
Business onboarding
Business profile
Categories
Services
Business hours
```

### Sprint 3

```text
Search
Business discovery
Customer profile
Favorites
```

### Sprint 4

```text
Chat
Conversation database
AI layer
AI tools
```

### Sprint 5

```text
Requests
Business dashboard
Request management
```

### Sprint 6

```text
LiveKit
Voice sessions
AI voice agent
```

### Sprint 7

```text
Reviews
Analytics
Admin
Moderation
```

### Sprint 8

```text
Security audit
Performance
Error handling
Testing
Launch preparation
```

---

# 76. Definition of Done

A feature is **not done** merely because it works in the happy path.

For every feature we require:

```text
UI
+
mobile responsive
+
loading state
+
empty state
+
error state
+
validation
+
authorization
+
database
+
analytics
+
accessibility
+
testing
```

Where applicable.

---

# 77. Final MVP Architecture

The final architecture is intentionally small:

```text
                       ONE PLACE
                           │
                 ┌─────────┴─────────┐
                 │                   │
              Customer            Business
                 │                   │
                 └─────────┬─────────┘
                           │
                        Next.js
                           │
          ┌────────────────┼────────────────┐
          │                │                │
       Supabase           AI             LiveKit
          │                │                │
     PostgreSQL        LLM API         Voice Agent
     Auth              Tools
     Storage
     Realtime
```

And that is **enough to build the MVP properly**.

---

# 78. Architecture Decision Record

### Decision

Use **Next.js + Supabase + LiveKit + provider-agnostic LLM**.

### Reason

It minimizes:

* development time
* infrastructure cost
* operational complexity
* deployment complexity
* engineering overhead

while still leaving clear extraction points for future scaling.

### Rejected for MVP

**NestJS:** unnecessary second backend.

**Self-hosted LLM:** unnecessary cost and operational burden.

**Vector database:** premature.

**PSTN:** adds cost and complexity before product-market validation.

**Microservices:** premature.

**Native apps:** web provides the fastest route to market.

