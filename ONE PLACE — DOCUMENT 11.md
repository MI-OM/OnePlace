# DOCUMENT 11 — BACKEND & APPLICATION IMPLEMENTATION SPECIFICATION

**Product:** One Place
**Document:** 11 of the development documentation set
**Status:** Development-ready
**Primary architecture:** Next.js full-stack application
**Database:** Supabase PostgreSQL
**Authentication:** Supabase Auth
**Realtime:** Supabase Realtime
**Voice:** LiveKit
**AI:** External LLM provider through server-side abstraction
**Frontend:** Next.js + TypeScript + Tailwind CSS
**Validation:** Zod
**Forms:** React Hook Form where appropriate
**Deployment:** Vercel initially
**Architecture principle:** Keep the MVP monolithic, modular and easy to extract later.

---

# 1. Purpose

This document defines the **application/backend layer of One Place**.

It answers:

* How does the frontend communicate with the backend?
* Where does business logic live?
* Where do database queries live?
* How are users authenticated?
* How are permissions enforced?
* How are conversations created?
* How does AI participate?
* How does LiveKit participate?
* How are businesses discovered?
* How are requests handled?
* How are reviews and reputation calculated?
* What happens when something fails?
* What should be synchronous versus asynchronous?
* What belongs in MVP?
* What should wait until post-MVP?

The fundamental architectural decision is:

> **One Place will not use NestJS for the MVP.**

Next.js will provide both the frontend and application backend.

---

# 2. Core Architecture Decision

## MVP

```text
                    USER
                     │
                     ▼
                 NEXT.JS
        ┌────────────┼────────────┐
        │            │            │
    Frontend     Server       Route
   Components   Actions      Handlers
                     │
                     ▼
              APPLICATION LAYER
                     │
       ┌─────────────┼──────────────┐
       │             │              │
       ▼             ▼              ▼
   Supabase       LiveKit        LLM Provider
   PostgreSQL      Voice            AI
   Auth
   Realtime
```

There is no separate NestJS server.

---

# 3. Why No NestJS

NestJS is not inherently wrong.

The issue is that it creates another application boundary.

With:

```text
Next.js
   ↓
NestJS
   ↓
Supabase
```

we introduce:

* another deployment
* another authentication boundary
* another codebase structure
* additional API contracts
* additional monitoring
* additional infrastructure
* additional development overhead

For an MVP, that complexity is not justified.

Instead:

```text
Next.js
   ↓
Application Services
   ↓
Supabase
```

is sufficient.

---

# 4. When NestJS Becomes Justified

Consider extracting a dedicated backend when one or more of these become true:

* multiple independent frontend applications
* substantial third-party API ecosystem
* high-volume background processing
* complex microservice boundaries
* dedicated backend engineering team
* mobile applications requiring a large independent API
* significant real-time infrastructure
* enterprise deployments requiring isolated services
* backend workloads that should scale independently from Next.js

Until then:

> **Keep the application together.**

---

# 5. Backend Architectural Principles

One Place follows six principles.

### 1. Business logic must not live inside UI components.

### 2. Database access must be centralized.

### 3. External APIs must be abstracted.

### 4. Authorization must happen server-side.

### 5. The browser must never receive secrets.

### 6. Every major operation must have a predictable lifecycle.

---

# 6. Recommended Project Structure

```text
src/
│
├── app/
│   ├── (public)/
│   ├── (auth)/
│   ├── dashboard/
│   ├── conversation/
│   ├── business/
│   ├── api/
│   └── ...
│
├── components/
│
├── actions/
│   ├── auth/
│   ├── businesses/
│   ├── services/
│   ├── conversations/
│   ├── requests/
│   ├── reviews/
│   └── voice/
│
├── services/
│   ├── business.service.ts
│   ├── discovery.service.ts
│   ├── conversation.service.ts
│   ├── request.service.ts
│   ├── review.service.ts
│   ├── reputation.service.ts
│   ├── ai.service.ts
│   └── voice.service.ts
│
├── repositories/
│   ├── business.repository.ts
│   ├── conversation.repository.ts
│   ├── request.repository.ts
│   └── ...
│
├── lib/
│   ├── supabase/
│   ├── livekit/
│   ├── ai/
│   ├── auth/
│   ├── validation/
│   ├── logging/
│   └── errors/
│
├── validators/
│
├── types/
│
├── constants/
│
└── utils/
```

---

# 7. Layer Responsibilities

The application has four primary layers.

```text
UI
 ↓
Actions / Route Handlers
 ↓
Services
 ↓
Repositories
 ↓
Database
```

External services sit beside the application:

```text
Services
 ├── AI Adapter
 └── Voice Adapter
```

---

# 8. UI Layer

The UI should:

* display data
* collect input
* show loading states
* show errors
* trigger actions

It should **not** contain complicated business decisions.

Bad:

```text
if user.role === ...
if business.owner...
if conversation.status...
```

repeated throughout components.

Instead, the backend/application layer should determine what the user is allowed to do.

---

# 9. Server Actions

Use Server Actions for operations initiated directly by application forms or UI interactions.

Examples:

```text
createBusiness()
updateBusiness()
createService()
updateService()
sendMessage()
createRequest()
submitReview()
updateAvailability()
```

Server Actions should:

1. authenticate
2. validate
3. authorize
4. execute service
5. return predictable result

---

# 10. Route Handlers

Use Route Handlers when an HTTP endpoint is more appropriate.

Examples:

```text
/api/search
/api/voice/session
/api/webhooks/livekit
/api/webhooks/payment
/api/webhooks/llm
```

Route Handlers are particularly useful for:

* external webhooks
* third-party callbacks
* machine-to-machine requests
* endpoints needed by future mobile applications

---

# 11. Service Layer

The service layer contains **business logic**.

Example:

```text
conversation.service.ts
```

might contain:

* create conversation
* determine participants
* determine initial state
* determine whether AI is available
* create system message
* return conversation

The UI should not implement this.

---

# 12. Repository Layer

Repositories are responsible for database interaction.

Example:

```text
business.repository.ts
```

contains operations such as:

```text
findBusinessById()
findBusinessBySlug()
createBusiness()
updateBusiness()
getBusinessServices()
```

The repository should not decide business policy.

---

# 13. Business Logic vs Database Logic

### Database layer

> "Find all active services belonging to business X."

### Service layer

> "A customer can only request an active service."

This distinction is important.

---

# 14. Authentication Architecture

Supabase Auth manages authentication.

Flow:

```text
User
 ↓
Login/signup
 ↓
Supabase Auth
 ↓
Session
 ↓
Next.js
 ↓
Authenticated user
```

The application should never implement its own password system.

---

# 15. Authentication Requirements

Customers can authenticate with:

* email/password initially

Future:

* magic link
* Google
* Apple
* passkeys

Do not implement all authentication methods in MVP.

---

# 16. User Identity

The authenticated Supabase user ID becomes the primary application identity.

Application profile:

```text
auth.users
     │
     ▼
profiles
```

The application must not create a second independent authentication identity.

---

# 17. Authorization

Authentication answers:

> Who are you?

Authorization answers:

> What are you allowed to do?

Example:

```text
Customer
→ can create conversation

Business owner
→ can edit own business

Business staff
→ can manage assigned conversations

Admin
→ can moderate businesses
```

---

# 18. Authorization Must Exist at Multiple Layers

Use:

```text
UI restrictions
+
Server-side authorization
+
Supabase RLS
```

Never trust the UI alone.

If the frontend hides a button, that does **not** mean the operation is secure.

---

# 19. Supabase Row-Level Security

RLS should protect application data.

Example conceptual rule:

```text
Business owner can update business
ONLY IF
business.owner_id = authenticated user
```

The database becomes the final security boundary.

---

# 20. Service-Role Key

The Supabase service-role key must only exist server-side.

Never:

```text
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
```

Never expose it to the browser.

---

# 21. Request Lifecycle

Every mutation follows:

```text
User action
    ↓
Server Action / Route Handler
    ↓
Authenticate
    ↓
Validate input
    ↓
Authorize
    ↓
Application service
    ↓
Repository
    ↓
Database
    ↓
Return result
    ↓
UI update
```

---

# 22. Standard Response Pattern

Use a predictable application result.

Conceptually:

```text
{
  success: true,
  data: ...
}
```

or:

```text
{
  success: false,
  error: {
    code: "...",
    message: "..."
  }
}
```

Avoid exposing raw database errors to users.

---

# 23. Error Classification

Use categories:

```text
VALIDATION_ERROR
AUTHENTICATION_REQUIRED
FORBIDDEN
NOT_FOUND
CONFLICT
RATE_LIMITED
EXTERNAL_SERVICE_ERROR
DATABASE_ERROR
INTERNAL_ERROR
```

---

# 24. Customer Discovery

Discovery is one of the core application functions.

Input:

> "I need a barber."

Application flow:

```text
Search input
 ↓
discovery.service
 ↓
Interpret query
 ↓
Determine category/service
 ↓
Apply location
 ↓
Find eligible businesses
 ↓
Rank results
 ↓
Return results
```

---

# 25. MVP Discovery Strategy

Do not build an advanced recommendation engine.

Initially use:

```text
category
+
service
+
location
+
business status
+
basic relevance
```

Example:

```text
Query:
"barber in St. John's"

Category:
Hair & Beauty

Service:
Barber

Location:
St. John's

Results:
active businesses
ordered by relevance
```

---

# 26. Conversational Discovery

For:

> "I need someone to clean my apartment next weekend."

The system can extract:

```text
service = home cleaning
date = next weekend
location = user-selected/current location
```

But if the system is uncertain, it should ask:

> **What type of cleaning do you need?**

rather than guessing.

---

# 27. Business Discovery Ranking

MVP ranking:

```text
1. Matching category
2. Matching service
3. Location
4. Business active status
5. Availability
6. Rating
7. Response reliability
```

Later:

* personalized relevance
* conversation success
* conversion rate
* reputation
* distance
* price compatibility

---

# 28. Business Creation

Business creation:

```text
Customer/Owner signup
 ↓
createBusiness()
 ↓
validate
 ↓
create business
 ↓
assign owner
 ↓
create default settings
 ↓
return business
```

---

# 29. Business Status

Business lifecycle:

```text
draft
 ↓
pending_review
 ↓
active
 ↓
suspended
 ↓
archived
```

MVP can simplify this to:

```text
draft
active
suspended
```

if manual approval is not initially required.

---

# 30. Business Profile

Business profile consists of:

```text
Identity
Description
Category
Location
Services
Hours
Contact
Images
AI configuration
```

Only active/public information should appear publicly.

---

# 31. Service Management

Business owner creates:

```text
Service
 ↓
name
description
price
pricing_type
duration
availability
status
```

Pricing types:

```text
fixed
starting_from
range
quote
```

---

# 32. Conversation Creation

When a customer clicks:

> **Talk to us**

Flow:

```text
Customer
 ↓
createConversation()
 ↓
Check existing active conversation
 ↓
Reuse if appropriate
OR
Create new conversation
 ↓
Add participants
 ↓
Create initial system/assistant message
 ↓
Return conversation
```

---

# 33. Conversation States

Recommended:

```text
active
waiting
human_requested
human_connected
closed
```

Future:

```text
escalated
archived
```

---

# 34. Conversation Participants

Participants may include:

```text
Customer
AI Agent
Business Staff
System
```

The system must distinguish these roles.

---

# 35. Message Creation

Message flow:

```text
User sends message
 ↓
Validate
 ↓
Check conversation membership
 ↓
Persist message
 ↓
Realtime event
 ↓
AI processing if applicable
 ↓
AI response
 ↓
Persist AI message
 ↓
Realtime update
```

---

# 36. Realtime Chat

Supabase Realtime should initially handle:

* new messages
* message updates
* conversation status
* basic presence where necessary

Do not introduce another realtime provider for chat unless required.

---

# 37. AI Processing

AI should not be directly embedded throughout the application.

Create an abstraction:

```text
AIService
```

Conceptually:

```text
AIService
   │
   ├── generateResponse()
   ├── classifyIntent()
   ├── extractRequest()
   └── summarizeConversation()
```

---

# 38. LLM Provider Abstraction

The application should not depend directly on one LLM provider.

Use:

```text
Application
    ↓
AI Adapter
    ↓
Provider
```

Possible providers:

```text
OpenAI
Anthropic
Google
local model
future provider
```

Changing provider should not require rewriting the conversation system.

---

# 39. AI Data Minimization

Do not send the entire user database to an LLM.

Only send the information required for the current task.

For a salon question:

```text
business name
business description
relevant services
prices
hours
relevant policies
conversation context
```

Not:

```text
entire customer database
all business records
unrelated conversations
internal analytics
```

---

# 40. AI Prompt Context

The AI context should be assembled server-side.

Conceptually:

```text
System instructions
+
Business information
+
Relevant knowledge
+
Conversation history
+
Current user message
```

---

# 41. AI Knowledge Retrieval

MVP should avoid unnecessary vector infrastructure.

Start with structured business information:

```text
services
hours
policies
FAQs
business description
```

Only introduce vector search when there is enough unstructured information to justify it.

---

# 42. AI Hallucination Policy

The assistant must follow:

> **If the information isn't available, don't invent it.**

Fallback:

> "I don't have that information."

Then:

> "Would you like me to connect you with the team?"

---

# 43. Human Handoff

Handoff occurs when:

* user explicitly requests human
* AI confidence is insufficient
* user asks something outside configured scope
* business-defined escalation condition occurs

Flow:

```text
AI
 ↓
handoff requested
 ↓
conversation status = human_requested
 ↓
check staff availability
 ↓
assign staff if available
 ↓
human_connected
```

---

# 44. If No Human Is Available

Do not pretend.

Response:

> **No one from the team is available right now.**

Then:

> **You can leave a message and they'll be able to respond later.**

---

# 45. Voice Architecture

Voice is separate from normal chat.

```text
Customer
 ↓
Next.js
 ↓
Voice Service
 ↓
LiveKit
 ↓
AI Agent / Human
```

---

# 46. Voice Session Creation

Customer clicks:

> **Talk**

Frontend requests:

```text
POST /api/voice/session
```

Backend:

1. authenticates user
2. verifies conversation
3. verifies voice availability
4. creates/gets LiveKit room
5. generates participant token
6. returns connection information

---

# 47. LiveKit Secrets

LiveKit credentials remain server-side.

The browser receives only the information necessary to join the authorized session.

---

# 48. Voice Session Lifecycle

```text
requested
 ↓
connecting
 ↓
connected
 ↓
active
 ↓
ending
 ↓
ended
```

Failure:

```text
failed
```

---

# 49. Voice Session Persistence

MVP should store metadata, not audio.

Store:

```text
conversation_id
started_at
ended_at
participant
duration
status
```

Do not automatically record calls.

This reduces:

* storage cost
* privacy risk
* compliance complexity
* security burden

---

# 50. Voice Recording

Recording should be **post-MVP**.

If introduced later, it must require:

* explicit consent
* clear disclosure
* retention policy
* deletion policy
* access controls

---

# 51. Direct Business Phone Calls

Not MVP.

MVP:

```text
Web
 ↓
LiveKit
 ↓
AI / human
```

Post-MVP:

```text
Telephone
 ↓
Telephony provider
 ↓
LiveKit
 ↓
Business
```

This avoids assigning a dedicated phone number to every business initially.

---

# 52. Business Requests

A request could be:

```text
quote
booking
availability
callback
information
```

Creation:

```text
Customer
 ↓
createRequest()
 ↓
validate
 ↓
attach conversation
 ↓
attach business
 ↓
persist
 ↓
notify business
```

---

# 53. Request State Machine

```text
pending
 ↓
accepted
 ↓
in_progress
 ↓
completed
```

Alternative:

```text
pending
 ↓
declined
```

Cancellation:

```text
pending/in_progress
 ↓
cancelled
```

---

# 54. Reviews

A customer should only be able to review a business under defined eligibility rules.

MVP eligibility could require:

```text
completed conversation
OR
completed request
```

This prevents arbitrary review spam.

---

# 55. Review Creation

```text
Customer
 ↓
Review eligibility check
 ↓
Rating
 ↓
Optional text
 ↓
Moderation rules
 ↓
Persist
 ↓
Update aggregate rating
```

---

# 56. Reputation

Reputation should not be based solely on star ratings.

Future reputation can incorporate:

```text
rating
review volume
response rate
response time
completed requests
complaints
account age
verification
conversation outcomes
```

MVP should keep this simple.

---

# 57. Notifications

MVP notification types:

* new conversation
* new request
* human handoff
* request update

Start with:

```text
in-app
+
email where necessary
```

Do not build push notifications initially unless required.

---

# 58. Email Architecture

Email should be abstracted.

```text
NotificationService
       ↓
EmailProvider
```

This allows the provider to change later.

---

# 59. Background Processing

Not everything should happen during the HTTP request.

Background tasks eventually handle:

* email notifications
* analytics aggregation
* reputation recalculation
* AI summaries
* cleanup
* scheduled reminders

MVP can initially use simple asynchronous mechanisms before introducing a full queue.

---

# 60. What Must Be Synchronous

These should complete before returning:

```text
create account
create business
update service
send message persistence
create conversation
create request
submit review
create voice session
```

---

# 61. What Can Be Asynchronous

These can happen after the main operation:

```text
send email
analytics event
AI conversation summary
reputation recalculation
non-critical notifications
```

---

# 62. Transactions

Use database transactions when multiple records must succeed together.

Example business creation:

```text
Create business
+
Create owner relationship
+
Create default settings
```

If one critical operation fails, the whole transaction should roll back.

---

# 63. Idempotency

Important operations should avoid accidental duplication.

Especially:

```text
create conversation
create request
voice session creation
webhook processing
payment operations later
```

Example:

A user double-clicking:

> **Request service**

should not create two identical requests.

---

# 64. Rate Limiting

Rate-limit:

```text
login attempts
signup
search
message sending
AI requests
voice session creation
review creation
```

The most important MVP protections are:

* message spam
* AI abuse
* account creation abuse
* voice session abuse

---

# 65. AI Cost Protection

Never allow unlimited AI requests.

Implement:

```text
per-user limits
per-business limits
per-IP protection
conversation limits
```

The exact limits should be configurable rather than hard-coded throughout the application.

---

# 66. Voice Cost Protection

Voice sessions should also have configurable limits.

Potential MVP controls:

```text
maximum session duration
maximum concurrent sessions
maximum sessions per user
```

This prevents unexpected infrastructure bills.

---

# 67. Business AI Limits

A business should eventually have configurable AI usage limits.

For example:

```text
Basic
→ limited AI conversations

Professional
→ higher AI usage

Enterprise
→ custom
```

Do not implement complex billing in MVP unless required.

---

# 68. Caching

Cache relatively stable data:

```text
categories
public business profiles
service listings
static pages
```

Do not aggressively cache:

```text
active conversations
availability that changes frequently
voice state
requests
```

---

# 69. Cache Invalidation

When a business changes:

```text
business profile
services
hours
```

invalidate relevant cached public data.

Do not rely on stale data for information such as current availability if accuracy matters.

---

# 70. Logging

Every important backend operation should produce structured logs.

Example:

```text
event: conversation_created
user_id: ...
business_id: ...
conversation_id: ...
timestamp: ...
```

Never log:

* passwords
* access tokens
* API keys
* full private conversation contents unnecessarily
* sensitive personal information unnecessarily

---

# 71. Error Logging

Internal logs should contain enough information to diagnose failures without exposing private information.

Example:

```text
event: ai_request_failed
provider: ...
conversation_id: ...
error_code: ...
request_id: ...
```

---

# 72. Request IDs

Generate/request a correlation ID for backend operations.

Useful for:

```text
frontend error
 ↓
server log
 ↓
database event
 ↓
external provider request
```

This makes debugging dramatically easier.

---

# 73. Monitoring

Initial monitoring should track:

### Application

* response time
* error rate
* server errors

### Database

* query performance
* connection issues

### AI

* latency
* failures
* token usage
* cost

### Voice

* connection failures
* session duration
* dropped sessions

---

# 74. Security Boundary

```text
                 INTERNET
                     │
                     ▼
                 NEXT.JS
                     │
          ┌──────────┴──────────┐
          │                     │
      Public data          Authenticated
                              │
                              ▼
                     Application Services
                              │
                 ┌────────────┼────────────┐
                 ▼            ▼            ▼
             Supabase      LiveKit        AI
```

Secrets never cross into the browser.

---

# 75. External API Abstraction

Create adapters.

Example:

```text
lib/
├── ai/
│   ├── ai.interface.ts
│   ├── provider.ts
│   └── ...
│
└── livekit/
    ├── livekit.interface.ts
    └── livekit.service.ts
```

The business logic should call:

```text
voiceService.createSession()
```

not:

```text
LiveKitSDK.someSpecificFunction()
```

everywhere.

---

# 76. Why This Matters

If LiveKit changes:

```text
LiveKit
 ↓
another voice provider
```

only the adapter needs substantial modification.

Same principle applies to LLMs.

---

# 77. Database Access Rule

Do not scatter Supabase queries throughout the application.

Bad:

```text
component
 ↓
supabase.from(...)
```

Better:

```text
component
 ↓
server action
 ↓
service
 ↓
repository
 ↓
Supabase
```

---

# 78. Public Data Exception

For simple public data, direct server-side Supabase queries may be acceptable.

Still avoid putting complex business logic inside pages.

---

# 79. Application Business Rules

Important rules include:

### Customer

* must be authenticated for protected actions
* can access own conversations
* can create eligible reviews
* cannot edit business data

### Business owner

* can edit owned businesses
* can manage services
* can configure AI
* can manage eligible conversations

### Staff

* can handle authorized business conversations
* cannot change ownership

### Admin

* platform moderation authority

---

# 80. Conversation Privacy

A customer can only access conversations where they are a participant.

A business staff member can only access conversations belonging to businesses they are authorized to manage.

No public conversation endpoints.

---

# 81. AI Privacy

AI requests must be scoped to the conversation.

The AI should not automatically have access to:

```text
other customers
other businesses
internal business analytics
private staff conversations
```

unless explicitly required.

---

# 82. Business Knowledge Privacy

Business information may have visibility levels:

```text
public
assistant_only
internal
```

The AI may only retrieve information it is authorized to use.

---

# 83. Human Handoff Security

When a human joins:

```text
verify staff authorization
 ↓
grant conversation access
 ↓
record assignment
```

Never allow arbitrary staff accounts to open conversations simply by knowing the conversation ID.

---

# 84. Business Onboarding State

Track onboarding progress.

Example:

```text
account_created
business_created
category_selected
service_added
hours_configured
profile_completed
assistant_configured
published
```

This lets the UI show:

> **You're 70% ready to publish your business.**

Future only.

---

# 85. Publishing Rules

A business should not necessarily become public immediately.

Minimum publish requirements could be:

```text
business name
category
location
at least one service
```

Optional:

```text
description
photos
hours
AI assistant
```

---

# 86. Business Visibility

A business can be:

```text
visible
hidden
suspended
```

Hidden businesses should not appear in discovery.

---

# 87. Search Indexing

MVP can rely on PostgreSQL queries.

Future:

```text
PostgreSQL
 ↓
Search engine
```

Only introduce Elasticsearch/OpenSearch/Algolia/etc. when scale demands it.

Do not build a search infrastructure problem before having a search-scale problem.

---

# 88. Analytics Events

Track product events such as:

```text
search_performed
business_viewed
conversation_started
message_sent
voice_started
voice_completed
request_created
request_completed
review_submitted
```

Events should be lightweight.

---

# 89. Analytics Separation

Do not make analytics tables part of the transactional business logic unnecessarily.

The application should be able to function if analytics processing fails.

---

# 90. Example: Customer Starts Conversation

Full lifecycle:

```text
1. Customer opens business page
2. Clicks "Talk to us"
3. Frontend calls createConversation()
4. Server authenticates user
5. Server validates business
6. Server checks business visibility
7. Server finds existing active conversation
8. If none, creates conversation
9. Adds customer participant
10. Adds AI/system participant if configured
11. Creates initial message
12. Returns conversation ID
13. Frontend navigates to /conversation/[id]
14. Realtime subscription begins
15. Customer sends message
16. Message is persisted
17. AI service receives relevant context
18. AI responds
19. Response is persisted
20. UI receives realtime update
```

---

# 91. Example: Customer Requests Human

```text
Customer
 ↓
"Can I speak to someone?"
 ↓
Frontend
 ↓
requestHuman()
 ↓
Conversation service
 ↓
authorize
 ↓
status = human_requested
 ↓
find available staff
 ↓
assign
 ↓
staff notification
 ↓
staff joins
 ↓
status = human_connected
```

---

# 92. Example: Business Adds Service

```text
Owner
 ↓
Add service
 ↓
Frontend validation
 ↓
Server Action
 ↓
Authentication
 ↓
Authorization
 ↓
Zod validation
 ↓
Business service
 ↓
Service repository
 ↓
Supabase
 ↓
Cache invalidation
 ↓
Success
```

---

# 93. Example: Voice Session

```text
Customer
 ↓
Talk
 ↓
POST /api/voice/session
 ↓
Authenticate
 ↓
Verify conversation
 ↓
Verify voice eligibility
 ↓
Create LiveKit room/session
 ↓
Generate token
 ↓
Persist session
 ↓
Return token
 ↓
Browser connects
 ↓
Conversation
 ↓
Disconnect
 ↓
Session finalized
```

---

# 94. Webhook Architecture

Future third-party events should enter through:

```text
/api/webhooks/[provider]
```

Examples:

```text
/api/webhooks/livekit
/api/webhooks/payment
/api/webhooks/email
```

Every webhook must:

1. verify authenticity
2. validate payload
3. check idempotency
4. process event
5. record result

---

# 95. Webhook Rule

Never trust a webhook merely because it came to your URL.

Always verify its signature/authentication mechanism.

---

# 96. Application Configuration

Centralize configuration.

Example:

```text
config/
├── app.ts
├── ai.ts
├── voice.ts
├── limits.ts
└── features.ts
```

This prevents configuration values from being scattered across the codebase.

---

# 97. Feature Flags

Use feature flags for functionality that may be rolled out gradually.

Examples:

```text
VOICE_ENABLED
AI_ENABLED
REVIEWS_ENABLED
DIRECT_PHONE_ENABLED
```

MVP can use environment/config-based flags.

A sophisticated feature flag platform is unnecessary initially.

---

# 98. Feature Flag Example

If voice is disabled:

```text
Business page
    ↓
Talk button hidden
```

The rest of the application continues operating.

---

# 99. Testing Strategy

Testing occurs at four levels.

### Unit

Test:

* pricing logic
* permission logic
* ranking logic
* state transitions

### Integration

Test:

* database
* services
* authentication

### End-to-end

Test:

```text
signup
→ discover
→ business
→ conversation
→ request
```

### Voice

Test:

```text
permission
→ session
→ connection
→ disconnect
```

---

# 100. Critical MVP Tests

Before launch, verify:

### Authentication

* signup
* login
* logout
* unauthorized access

### Business

* creation
* editing
* service management

### Discovery

* search
* category filtering
* business visibility

### Conversation

* creation
* messaging
* authorization

### Voice

* connection
* disconnect
* failure
* permissions

### Security

* unauthorized business modification
* unauthorized conversation access
* RLS enforcement

---

# 101. Development Environment

Recommended:

```text
Node.js
TypeScript
Next.js
Tailwind
Supabase local development
Git
GitHub
```

Environment separation:

```text
development
staging
production
```

Do not develop directly against production data.

---

# 102. Git Structure

Recommended:

```text
main
develop
feature/*
fix/*
```

For a small team, even:

```text
main
feature/*
```

may be sufficient.

Avoid process for process's sake.

---

# 103. Code Quality

Use:

* TypeScript strict mode
* ESLint
* Prettier
* Zod
* meaningful naming
* small service functions
* explicit types

Avoid:

* `any`
* giant files
* deeply nested conditionals
* duplicated business rules

---

# 104. Type Strategy

Generate or maintain strong types for database structures.

The application should have a single reliable representation of:

```text
User
Business
Service
Conversation
Message
Request
Review
VoiceSession
```

---

# 105. API Versioning

MVP does not need:

```text
/api/v1
/api/v2
```

everywhere.

Use versioning only when there is a real compatibility requirement.

If a public API is eventually exposed to external developers:

```text
/api/v1
```

becomes appropriate.

---

# 106. Mobile App Future

The architecture should not prevent future mobile clients.

When mobile becomes necessary:

```text
Mobile App
     │
     ▼
Next.js API
     │
     ▼
Services
     │
     ▼
Supabase
```

At that point, some Server Actions may need equivalent API endpoints.

This is another reason to keep core business logic in services rather than inside Server Actions.

---

# 107. Extraction Strategy

If the application grows:

### Stage 1

```text
Next.js monolith
```

### Stage 2

```text
Next.js
+
background worker
```

### Stage 3

```text
Next.js
+
Application API
+
Workers
```

### Stage 4

Only if justified:

```text
Frontend
Backend API
Voice service
AI service
Search service
Analytics
```

Do not start at Stage 4.

---

# 108. MVP Infrastructure

The initial infrastructure should be approximately:

```text
Vercel
    │
    └── Next.js

Supabase
    ├── PostgreSQL
    ├── Auth
    └── Realtime

LiveKit
    └── Voice

LLM Provider
    └── AI
```

That's enough.

---

# 109. What We Explicitly Do NOT Build Yet

MVP does **not** require:

* NestJS
* Kubernetes
* microservices
* Elasticsearch
* Kafka
* Redis cluster
* dedicated AI server
* self-hosted LLM
* dedicated telephony infrastructure
* complex workflow engine
* custom recommendation engine
* custom vector database
* event-driven microservice architecture

This is intentional.

---

# 110. MVP Backend Scope

The backend needs to support:

```text
Authentication
Business management
Service management
Categories
Discovery
Conversations
Realtime messaging
AI assistant
Human handoff
Voice sessions
Requests
Reviews
Basic analytics
Notifications
Authorization
Security
```

---

# 111. Post-MVP Backend Scope

Later:

```text
Bookings
Payments
Direct phone numbers
Advanced scheduling
Multi-location businesses
Staff scheduling
Advanced reputation
Personalization
Advanced search
AI memory
Knowledge ingestion
Voice recording
Transcription
Enterprise accounts
Multi-region infrastructure
```

---

# 112. Business Logic Ownership

This is critical.

### Frontend owns:

> Presentation.

### Server Actions own:

> Request entry point.

### Services own:

> Business decisions.

### Repositories own:

> Database interaction.

### Supabase RLS owns:

> Final database authorization boundary.

### External adapters own:

> Third-party integrations.

---

# 113. Final Application Architecture

```text
                         USER
                           │
                           ▼
                    ┌─────────────┐
                    │   Next.js   │
                    │   Frontend  │
                    └──────┬──────┘
                           │
                 ┌─────────┴─────────┐
                 │                   │
          Server Actions       Route Handlers
                 │                   │
                 └─────────┬─────────┘
                           │
                           ▼
                 ┌───────────────────┐
                 │ Application Layer │
                 │                   │
                 │ Business Service  │
                 │ Discovery Service │
                 │ Conversation      │
                 │ Request Service   │
                 │ Review Service    │
                 │ AI Service        │
                 │ Voice Service     │
                 └─────────┬─────────┘
                           │
             ┌─────────────┼─────────────┐
             │             │             │
             ▼             ▼             ▼
       Repositories    AI Adapter   Voice Adapter
             │             │             │
             ▼             ▼             ▼
         Supabase       LLM API       LiveKit
             │
       ┌─────┴─────┐
       │           │
   PostgreSQL    Realtime
       │
       ▼
      RLS
```

---

# 114. The Most Important Architectural Rule

The application should be designed so that **the technology can change without changing the product logic**.

For example:

```text
LiveKit
```

can eventually become another voice provider.

```text
OpenAI
```

can eventually become Anthropic, Google, or a self-hosted model.

```text
Supabase
```

could eventually be replaced or supplemented.

But:

```text
ConversationService
BusinessService
DiscoveryService
RequestService
```

should remain conceptually stable.

That is what makes the architecture scalable.

---

# 115. Final MVP Backend Principle

The goal is not to build the most sophisticated backend.

The goal is to build the **smallest backend that can reliably support the complete One Place experience**.

Therefore:

> **Next.js + Supabase + LiveKit + one LLM provider is enough to launch.**

The architecture should be **modular, not distributed**.

That distinction is important.

A modular monolith gives us:

* low cost
* fast development
* simple deployment
* simple debugging
* fewer failure points
* easy iteration

while still allowing us to extract services later if the business actually demands it.

---

## Document 11 completion checklist

At this point, the development team has a defined approach for:

* [x] Next.js backend architecture
* [x] application layers
* [x] folder structure
* [x] authentication
* [x] authorization
* [x] RLS
* [x] business logic
* [x] repositories
* [x] discovery
* [x] conversations
* [x] realtime
* [x] AI
* [x] human handoff
* [x] LiveKit
* [x] voice lifecycle
* [x] requests
* [x] reviews
* [x] reputation foundation
* [x] notifications
* [x] caching
* [x] rate limiting
* [x] security
* [x] logging
* [x] testing
* [x] deployment architecture
* [x] scaling strategy
* [x] MVP boundaries
* [x] post-MVP extraction strategy

