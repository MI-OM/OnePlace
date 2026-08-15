# ONE PLACE — DOCUMENT 08

# COMPLETE API CONTRACT & APPLICATION BUSINESS LOGIC

**Version:** 1.0
**Status:** Development Ready
**Product:** One Place
**Scope:** MVP + Post-MVP extension points
**Frontend:** Next.js
**Backend:** Next.js Server / Route Handlers / Server Actions
**Database:** Supabase PostgreSQL
**Authentication:** Supabase Auth
**Realtime:** Supabase Realtime
**Voice:** LiveKit
**AI:** External LLM provider through a server-side abstraction layer
**Storage:** Supabase Storage
**Primary principle:** Keep the application simple, modular and inexpensive to operate.

---

# 1. Purpose of This Document

Document 08 defines **how One Place actually works internally**.

Document 07 described what users see.

This document defines:

* API contracts
* application services
* business rules
* authentication
* authorization
* database interactions
* validation
* error handling
* conversations
* AI interaction
* human handoff
* voice
* business onboarding
* reviews
* search
* notifications
* moderation
* analytics
* future extensions

The objective is that a developer should be able to take Documents 01–08 and begin implementation without having to invent the application's core behavior.

---

# 2. Core Architecture Decision

## No separate NestJS backend for MVP

The MVP uses:

```text
Next.js
   │
   ├── UI
   ├── Server Components
   ├── Server Actions
   ├── Route Handlers
   └── Application Services
          │
          ├── Supabase
          ├── LiveKit
          └── LLM Provider
```

Supabase handles:

```text
Authentication
PostgreSQL
Storage
Realtime
Row-Level Security
```

Next.js handles:

```text
Business logic
API endpoints
Server-side validation
AI orchestration
LiveKit token generation
Third-party integrations
Authorization
```

This keeps the MVP small.

---

# 3. API Design Principle

The frontend should **never directly control privileged infrastructure**.

For example:

### Incorrect

```text
Browser → LiveKit secret
```

### Correct

```text
Browser
   ↓
Next.js
   ↓
authorize user
   ↓
generate LiveKit token
   ↓
return token
   ↓
Browser → LiveKit
```

The same principle applies to AI.

### Incorrect

```text
Browser → LLM API
```

### Correct

```text
Browser
   ↓
Next.js
   ↓
retrieve permitted business information
   ↓
build controlled context
   ↓
LLM provider
   ↓
sanitize response
   ↓
Browser
```

---

# 4. API Base URL

Production:

```text
/api
```

Development:

```text
/api
```

Examples:

```text
/api/businesses
/api/conversations
/api/messages
/api/voice/token
/api/reviews
```

---

# 5. API Versioning

MVP:

```text
/api
```

When breaking changes become necessary:

```text
/api/v2
```

Do not introduce versioning complexity prematurely.

---

# 6. Response Format

Successful response:

```json
{
  "data": {},
  "error": null
}
```

Failed response:

```json
{
  "data": null,
  "error": {
    "code": "BUSINESS_NOT_FOUND",
    "message": "The business could not be found."
  }
}
```

---

# 7. HTTP Status Codes

Use conventional HTTP status codes.

| Code | Meaning                                  |
| ---- | ---------------------------------------- |
| 200  | Successful request                       |
| 201  | Resource created                         |
| 204  | Successful request with no response body |
| 400  | Invalid request                          |
| 401  | Authentication required                  |
| 403  | Not authorized                           |
| 404  | Resource not found                       |
| 409  | Conflict                                 |
| 422  | Validation failure                       |
| 429  | Rate limit                               |
| 500  | Internal server error                    |
| 503  | Temporary service unavailable            |

---

# 8. Error Code Convention

Use machine-readable codes.

Examples:

```text
AUTH_REQUIRED
AUTH_INVALID
FORBIDDEN
VALIDATION_ERROR
BUSINESS_NOT_FOUND
BUSINESS_NOT_VERIFIED
SERVICE_NOT_FOUND
CONVERSATION_NOT_FOUND
CONVERSATION_ACCESS_DENIED
MESSAGE_TOO_LONG
RATE_LIMITED
VOICE_UNAVAILABLE
AI_UNAVAILABLE
REVIEW_ALREADY_EXISTS
```

The frontend uses the code.

The user sees the human-friendly message.

---

# 9. Authentication

Supabase Auth manages authentication.

Supported MVP methods:

```text
Email + password
Email verification
Password reset
```

Future:

```text
Google
Apple
Passkeys
```

Do not implement all authentication providers initially.

---

# 10. Authentication Flow

```text
User
 ↓
Signup
 ↓
Supabase Auth
 ↓
Email verification
 ↓
Authenticated session
 ↓
Next.js server
 ↓
User profile
```

---

# 11. Authentication Rule

A user account and an application profile are separate concepts.

Supabase:

```text
auth.users
```

Application:

```text
profiles
```

The profile references the authenticated user.

---

# 12. User Roles

MVP roles:

```text
customer
business_owner
business_staff
admin
```

Do not create dozens of roles.

---

# 13. Role Rules

### Customer

Can:

* search
* view businesses
* save businesses
* start conversations
* send messages
* start voice conversations
* review businesses

### Business owner

Can:

* manage business
* manage services
* respond to conversations
* manage business information
* view reviews

### Business staff

Can:

* access assigned business
* respond to conversations
* manage customer communication

### Admin

Can:

* moderate
* verify businesses
* manage platform resources
* investigate abuse

---

# 14. Authorization Model

Authorization must happen server-side.

Never trust:

```text
role
business_id
user_id
```

provided by the browser.

The server derives the authenticated user from the session and checks their permissions.

---

# 15. Business Ownership

A business has:

```text
owner
```

and optionally:

```text
staff members
```

A user cannot modify another business simply by changing:

```text
business_id
```

in a request.

---

# 16. Business Creation API

### Endpoint

```http
POST /api/businesses
```

Authentication:

```text
Required
```

Request:

```json
{
  "name": "Northside Hair Studio",
  "category_id": "uuid",
  "description": "Modern hair services...",
  "location": {
    "city": "St. John's",
    "province": "Newfoundland and Labrador",
    "country": "Canada"
  }
}
```

Response:

```json
{
  "data": {
    "id": "business_uuid",
    "status": "draft"
  },
  "error": null
}
```

---

# 17. Business Creation Logic

```text
authenticate user
       ↓
validate fields
       ↓
create business
       ↓
create owner relationship
       ↓
create audit event
       ↓
return business
```

---

# 18. Business Status

MVP:

```text
draft
pending_review
published
suspended
rejected
```

Business cannot appear publicly until:

```text
status = published
```

---

# 19. Business Update

```http
PATCH /api/businesses/:businessId
```

Authorization:

```text
owner
business_staff with permission
admin
```

Request example:

```json
{
  "description": "Updated description",
  "phone": "+1...",
  "website": "https://..."
}
```

---

# 20. Business Publication

```http
POST /api/businesses/:businessId/publish
```

Business must satisfy minimum requirements.

Required:

* business name
* category
* location
* description
* at least one service
* owner
* required verification information

If incomplete:

```text
BUSINESS_PROFILE_INCOMPLETE
```

---

# 21. Business Verification

Admin:

```http
POST /api/admin/businesses/:businessId/verify
```

Possible outcomes:

```text
published
rejected
```

The verification system should be deliberately simple in MVP.

---

# 22. Business Retrieval

Public:

```http
GET /api/businesses/:businessId
```

Only return public fields.

Never expose:

* internal notes
* private owner information
* internal IDs unnecessarily
* AI configuration secrets
* private analytics

---

# 23. Business Search

```http
GET /api/businesses
```

Query:

```text
?q=hair
&category=beauty
&city=st-johns
&sort=recommended
&page=1
&limit=20
```

---

# 24. Search Logic

MVP ranking:

```text
text relevance
+
category relevance
+
location relevance
+
verification
+
rating
```

Do not build a machine-learning recommendation engine.

---

# 25. Search Ranking

Conceptually:

```text
score =
  relevance
  + location_score
  + verification_score
  + rating_score
  + completeness_score
```

Weights should live in configuration.

Not hardcoded throughout the application.

---

# 26. Search Safety

Search should only return:

```text
published
```

businesses.

Draft or suspended businesses are excluded.

---

# 27. Category API

```http
GET /api/categories
```

Public.

Returns:

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Beauty & Wellness",
      "slug": "beauty-wellness"
    }
  ]
}
```

---

# 28. Category Detail

```http
GET /api/categories/:slug
```

Returns:

* category information
* businesses
* available subcategories

---

# 29. Services API

Public:

```http
GET /api/businesses/:businessId/services
```

Business owner:

```http
POST /api/businesses/:businessId/services
PATCH /api/businesses/:businessId/services/:serviceId
DELETE /api/businesses/:businessId/services/:serviceId
```

---

# 30. Service Object

Example:

```json
{
  "name": "Women's Haircut",
  "description": "Wash, cut and styling.",
  "pricing_type": "starting_from",
  "price": 45,
  "currency": "CAD",
  "duration_minutes": 45
}
```

---

# 31. Pricing Types

MVP:

```text
fixed
starting_from
range
quote
```

This avoids forcing every service into a fixed price.

---

# 32. Service Business Rules

A service cannot be published if:

```text
name is empty
```

Price is optional depending on pricing type.

For:

```text
fixed
starting_from
```

price must exist.

For:

```text
quote
```

price may be null.

---

# 33. Business Hours API

```http
GET /api/businesses/:businessId/hours
```

Owner:

```http
PUT /api/businesses/:businessId/hours
```

Example:

```json
{
  "monday": {
    "open": "09:00",
    "close": "18:00"
  },
  "tuesday": {
    "open": "09:00",
    "close": "18:00"
  }
}
```

---

# 34. Customer Saved Businesses

Add:

```http
POST /api/saved-businesses
```

Remove:

```http
DELETE /api/saved-businesses/:businessId
```

List:

```http
GET /api/saved-businesses
```

---

# 35. Save Business Logic

A user can only have one saved relationship with a business.

Database constraint:

```text
UNIQUE(user_id, business_id)
```

This prevents duplicates.

---

# 36. Conversation Model

A conversation belongs to:

```text
customer
business
```

and contains:

```text
messages
```

Optional participants:

```text
business staff
AI
```

---

# 37. Conversation Creation

```http
POST /api/conversations
```

Request:

```json
{
  "business_id": "uuid",
  "initial_message": "Do you have appointments this Saturday?"
}
```

---

# 38. Conversation Creation Logic

```text
authenticate
 ↓
verify business is published
 ↓
verify customer isn't blocked
 ↓
check conversation limits
 ↓
create conversation
 ↓
create initial message
 ↓
trigger AI if enabled
 ↓
return conversation
```

---

# 39. Duplicate Conversation Rule

MVP recommendation:

Do not create a new conversation every time the customer clicks "Ask".

Instead:

```text
customer + business
```

can have an active conversation.

Future:

```text
multiple conversation threads
```

can be introduced.

---

# 40. Conversation Status

```text
active
waiting_for_business
waiting_for_customer
resolved
closed
```

---

# 41. Conversation Types

```text
text
voice
ai
mixed
```

A conversation can begin with AI and later become human.

---

# 42. Message API

```http
POST /api/conversations/:conversationId/messages
```

Request:

```json
{
  "content": "What time do you close?",
  "type": "text"
}
```

---

# 43. Message Validation

Maximum MVP message length:

```text
4,000 characters
```

Reject:

* empty message
* excessive repeated characters
* malicious payloads
* blocked content where applicable

---

# 44. Message Flow

```text
client
 ↓
authenticate
 ↓
authorize conversation
 ↓
validate message
 ↓
save message
 ↓
publish realtime event
 ↓
determine recipient
 ↓
optional AI processing
```

---

# 45. Realtime Messaging

Supabase Realtime can broadcast:

```text
new_message
message_updated
conversation_updated
typing
presence
```

Do not store typing indicators in PostgreSQL.

---

# 46. Message Persistence

Messages should be stored in PostgreSQL.

This is required for:

* conversation history
* moderation
* customer continuity
* business context

unless a specific privacy policy says otherwise.

---

# 47. AI Message Flow

When AI is enabled:

```text
customer message
       ↓
server
       ↓
retrieve business information
       ↓
retrieve relevant conversation context
       ↓
build controlled prompt
       ↓
LLM provider
       ↓
validate response
       ↓
store AI response
       ↓
Realtime delivery
```

---

# 48. AI Does Not Own the Truth

The business database is the source of truth.

AI is only an interpreter.

For example:

```text
Database:
Women's haircut = $45
```

AI:

> Women's haircuts start at $45.

AI should not invent:

> Women's haircuts cost $25.

---

# 49. AI Context

MVP context should contain only information necessary for the request.

Example:

```text
Business description
Services
Prices
Hours
FAQs
Relevant conversation history
```

Do not send the entire database to the LLM.

---

# 50. Data Minimization

Never send unnecessary personal information to the LLM.

Avoid:

* email
* phone number
* authentication identifiers
* internal IDs
* private business notes

unless required.

---

# 51. LLM Provider Abstraction

Create:

```text
AIProvider
```

Interface:

```text
generateResponse()
```

Possible implementations:

```text
OpenAIProvider
AnthropicProvider
GoogleProvider
LocalProvider
```

The application does not depend directly on one provider.

---

# 52. AI Configuration

Environment:

```text
AI_PROVIDER=openai
AI_MODEL=...
AI_API_KEY=...
```

Never expose the key to the browser.

---

# 53. AI System Instruction

Core principle:

> Answer only using information available in the supplied business context. If the information is unavailable, clearly say that you don't know and offer to connect the customer with the business.

This is more important than making the prompt complicated.

---

# 54. AI Response Example

Customer:

> Do you offer bridal makeup?

Database:

> Bridal makeup — $180.

AI:

> Yes. Bridal makeup is listed as one of their services at $180.

---

# 55. Unknown Information

Customer:

> Do you offer home visits?

Database:

> No information.

AI:

> I couldn't find information about home visits. Would you like to ask the business?

Button:

> **Ask the business**

---

# 56. AI Escalation

Escalate when:

```text
AI lacks information
customer explicitly requests human
customer asks for custom quote
customer disputes information
customer asks for something outside business knowledge
```

---

# 57. AI Safety

AI must not:

* fabricate prices
* fabricate availability
* claim a booking exists
* claim a payment succeeded
* impersonate a human
* claim certainty when information is missing

---

# 58. AI Disclosure

The UI must clearly label AI messages:

> **One Place AI**

The system must never make the customer believe they are speaking to a human when they are not.

---

# 59. Human Handoff

Customer clicks:

> **Talk to someone**

Server:

```text
set conversation status = waiting_for_business
```

Then:

```text
notify business
```

---

# 60. Business Availability

MVP does not require sophisticated agent scheduling.

Business can have:

```text
available
away
offline
```

---

# 61. Business Response

When staff responds:

```text
message.sender_type = human
```

UI displays:

> **Sarah · Northside Hair Studio**

---

# 62. Conversation Resolution

Business:

> **Mark as resolved**

Server:

```text
conversation.status = resolved
```

Customer can reopen if appropriate.

---

# 63. Voice Architecture

Voice is handled separately from normal messaging.

```text
Next.js
   ↓
authorization
   ↓
LiveKit token
   ↓
LiveKit room
```

---

# 64. Voice Token API

```http
POST /api/voice/token
```

Request:

```json
{
  "conversation_id": "uuid"
}
```

---

# 65. Voice Token Logic

```text
authenticate
 ↓
verify conversation access
 ↓
verify voice allowed
 ↓
generate room name
 ↓
generate LiveKit participant token
 ↓
return token
```

---

# 66. Voice Response

```json
{
  "data": {
    "token": "temporary_token",
    "room_name": "conversation_uuid"
  },
  "error": null
}
```

The LiveKit API credentials remain server-side.

---

# 67. Voice Room Naming

Use an opaque internal identifier.

Example:

```text
conversation_<uuid>
```

Do not use:

```text
business-name-customer-name
```

because that leaks unnecessary information.

---

# 68. Voice Lifecycle

```text
requested
 ↓
connecting
 ↓
connected
 ↓
ended
```

If connection fails:

```text
failed
```

---

# 69. Voice Event Recording

Store only metadata needed for product functionality.

Example:

```text
conversation_id
started_at
ended_at
duration
participants
```

Do not store audio by default.

---

# 70. Voice Recording

MVP:

> **Disabled by default.**

If recording is introduced later, it requires:

* explicit consent
* legal review
* clear disclosure
* retention policy
* deletion mechanism

---

# 71. Direct PSTN Calls

Not MVP.

MVP:

```text
Web → LiveKit → Business
```

Post-MVP:

```text
Phone
 ↓
telephony provider
 ↓
LiveKit
 ↓
business
```

This prevents MVP infrastructure and telephony costs from becoming unnecessarily complex.

---

# 72. Voice Fallback

If voice cannot connect:

```text
Voice failed
 ↓
Offer chat
 ↓
Offer message
```

Copy:

> **We couldn't connect your call.**

> You can continue by chat or leave a message.

---

# 73. Review API

Create:

```http
POST /api/businesses/:businessId/reviews
```

Request:

```json
{
  "rating": 5,
  "content": "Great service and very friendly staff."
}
```

---

# 74. Review Eligibility

MVP should require a meaningful interaction.

Possible eligibility:

```text
customer had a conversation
```

or:

```text
customer completed a verified interaction
```

This reduces fake reviews.

---

# 75. One Review Rule

Recommended MVP:

```text
one active review per customer per business
```

The customer can edit the review later.

Database constraint:

```text
UNIQUE(customer_id, business_id)
```

---

# 76. Review Update

```http
PATCH /api/reviews/:reviewId
```

Only:

```text
review owner
admin
```

---

# 77. Review Moderation

Users can report:

```http
POST /api/reviews/:reviewId/report
```

Business cannot directly delete reviews.

Admin investigates.

---

# 78. Review Rating Calculation

Do not simply calculate average at request time at scale.

MVP can calculate normally.

Post-MVP:

```text
business_rating_summary
```

can cache:

```text
average
count
distribution
```

---

# 79. Notifications

MVP can use:

```text
in-app
email
```

Events:

```text
new message
business response
review
verification result
```

Voice notifications are handled by the application in real time.

---

# 80. Notification API

```http
GET /api/notifications
```

Mark read:

```http
PATCH /api/notifications/:id
```

---

# 81. Email Architecture

Emails should be triggered by server-side events.

Example:

```text
new business message
       ↓
create notification
       ↓
send email
```

Do not send email directly from the browser.

---

# 82. Analytics

MVP analytics should focus on product decisions.

Track:

```text
search
business_view
category_view
conversation_started
message_sent
ai_question
human_handoff
voice_started
voice_completed
business_signup
business_published
review_created
```

---

# 83. Analytics Principle

Do not collect everything.

Ask:

> What decision will this data help us make?

If there is no answer, don't collect it.

---

# 84. Event Format

Conceptually:

```json
{
  "event": "conversation_started",
  "user_id": "uuid",
  "business_id": "uuid",
  "timestamp": "..."
}
```

Avoid unnecessary personal data.

---

# 85. Rate Limiting

Rate-limit:

```text
login attempts
signup
search
message sending
AI requests
voice token requests
reviews
```

AI and voice require particularly strict limits because they have direct infrastructure cost.

---

# 86. AI Rate Limit

Example MVP policy:

```text
per authenticated user:
X AI requests / minute
X AI requests / day
```

Exact values should be configured after observing usage.

---

# 87. Abuse Prevention

Potential abuse:

* spam messages
* fake businesses
* fake reviews
* harassment
* AI prompt abuse
* voice abuse
* account farming

MVP controls:

```text
email verification
rate limits
reporting
blocking
moderation
business verification
```

---

# 88. User Blocking

Future/MVP depending on implementation time:

```http
POST /api/blocks
DELETE /api/blocks/:userId
```

A blocked user cannot initiate communication with the blocker where the relationship applies.

---

# 89. Business Blocking

Businesses may block abusive customers.

But blocking must not be used to suppress legitimate reviews or complaints.

---

# 90. Account Deletion

```http
DELETE /api/account
```

Process:

```text
authenticate
 ↓
confirm deletion
 ↓
schedule deletion
 ↓
remove/anonymize personal data
 ↓
retain legally required records
```

Do not instantly destroy data that must legally be retained.

---

# 91. Data Export

Post-MVP:

```http
GET /api/account/export
```

Provide:

* profile
* conversations
* reviews
* saved businesses

where legally and technically appropriate.

---

# 92. Business Staff

Add staff:

```http
POST /api/businesses/:businessId/staff
```

Remove:

```http
DELETE /api/businesses/:businessId/staff/:userId
```

Future permission model:

```text
owner
manager
agent
```

MVP can simply use:

```text
owner
staff
```

---

# 93. Staff Authorization

Staff can access:

```text
business profile
services
conversations
reviews
```

depending on assigned permissions.

They cannot:

```text
transfer ownership
delete business
access platform administration
```

---

# 94. Business Settings

```http
GET /api/businesses/:businessId/settings
PATCH /api/businesses/:businessId/settings
```

Settings may include:

```text
AI enabled
voice enabled
auto-response enabled
contact preferences
```

---

# 95. AI Business Configuration

Example:

```json
{
  "ai_enabled": true,
  "human_handoff_enabled": true
}
```

Do not expose provider configuration to business owners.

They configure behavior, not infrastructure.

---

# 96. Business FAQs

Post-MVP:

```http
GET /api/businesses/:businessId/faqs
POST /api/businesses/:businessId/faqs
PATCH /api/faqs/:id
DELETE /api/faqs/:id
```

FAQ structure:

```json
{
  "question": "Do you offer home visits?",
  "answer": "Yes, within 10 km of our location."
}
```

---

# 97. AI Knowledge Priority

When answering a question, prioritize:

```text
1. Explicit business data
2. Services
3. Pricing
4. Hours
5. FAQs
6. Approved business knowledge
7. Conversation context
```

Never use generic world knowledge to override business-specific information.

---

# 98. Business Availability

MVP:

```text
business hours
```

Post-MVP:

```text
real calendar
appointments
staff schedules
service availability
```

---

# 99. Booking Architecture

Do not build full booking in MVP.

Future:

```text
Customer
 ↓
service
 ↓
date
 ↓
availability
 ↓
booking
 ↓
confirmation
```

This will require a dedicated booking service rather than embedding scheduling logic everywhere.

---

# 100. Payment Architecture

MVP:

> No payment processing.

Post-MVP:

```text
Stripe
```

Payment should be isolated behind:

```text
PaymentService
```

so the rest of One Place does not depend directly on Stripe.

---

# 101. Application Service Layer

Do not put all business logic inside route handlers.

Structure:

```text
Route Handler
     ↓
Validation
     ↓
Application Service
     ↓
Repository / Supabase
     ↓
External Service
```

Example:

```text
POST /api/conversations
       ↓
ConversationController
       ↓
ConversationService
       ↓
ConversationRepository
       ↓
Supabase
```

---

# 102. Suggested Next.js Structure

Conceptually:

```text
app/
  api/
    businesses/
    categories/
    conversations/
    reviews/
    voice/
    notifications/

lib/
  auth/
  db/
  services/
  ai/
  voice/
  validation/
  permissions/
  analytics/
  notifications/

components/
  business/
  chat/
  voice/
  search/
  reviews/
```

---

# 103. Business Service

Responsibilities:

```text
createBusiness()
updateBusiness()
publishBusiness()
getBusiness()
searchBusinesses()
verifyBusiness()
```

It should not handle UI logic.

---

# 104. Conversation Service

Responsibilities:

```text
createConversation()
getConversation()
sendMessage()
resolveConversation()
reopenConversation()
handoffToHuman()
```

---

# 105. AI Service

Responsibilities:

```text
answerQuestion()
buildContext()
detectHandoff()
sanitizeResponse()
```

It should not directly manage authentication.

---

# 106. Voice Service

Responsibilities:

```text
createRoom()
generateParticipantToken()
validateVoiceAccess()
recordCallMetadata()
```

It should not expose LiveKit credentials.

---

# 107. Review Service

Responsibilities:

```text
createReview()
updateReview()
calculateRating()
reportReview()
moderateReview()
```

---

# 108. Search Service

Responsibilities:

```text
searchBusinesses()
searchCategories()
rankResults()
applyFilters()
```

---

# 109. Repository Layer

The repository layer abstracts database operations.

Example:

```text
BusinessRepository
ConversationRepository
MessageRepository
ReviewRepository
UserRepository
```

This gives us flexibility to change database implementation later without rewriting business logic.

---

# 110. Important Architecture Rule

Do **not** create abstractions just for the sake of abstraction.

The MVP should remain simple.

Use abstraction where it protects a future change:

```text
AI provider
voice provider
payment provider
email provider
```

Don't abstract trivial things unnecessarily.

---

# 111. Database Transaction Rules

Use database transactions for operations that must succeed together.

Example:

Business creation:

```text
business
+
owner relationship
```

must be consistent.

Conversation creation:

```text
conversation
+
initial message
```

should be atomic where possible.

---

# 112. Idempotency

Important operations should eventually support idempotency.

Especially:

```text
payments
bookings
voice session creation
external notifications
```

MVP doesn't need excessive idempotency infrastructure for ordinary CRUD.

---

# 113. Concurrency

Potential issue:

Two business staff members respond simultaneously.

The application should allow both messages but preserve ordering using:

```text
created_at
```

plus a stable message ID.

---

# 114. Message Ordering

Do not rely solely on browser timestamps.

Server-generated timestamps should determine canonical order.

---

# 115. Optimistic UI

Chat can use optimistic message rendering:

```text
user sends message
 ↓
message appears immediately
 ↓
server confirms
```

If server fails:

> **Message couldn't be sent. Tap to retry.**

---

# 116. API Security

Every protected endpoint must verify:

```text
authentication
authorization
input validation
resource ownership
rate limits
```

---

# 117. Input Validation

Use a schema validation library such as:

```text
Zod
```

Example conceptual:

```text
CreateBusinessSchema
CreateServiceSchema
SendMessageSchema
CreateReviewSchema
```

Validation must happen server-side.

---

# 118. SQL Injection

Supabase/PostgreSQL queries must use parameterized operations.

Never construct raw SQL using user input without proper parameterization.

---

# 119. XSS

User-generated content must be escaped/sanitized before rendering.

Particularly:

* reviews
* business descriptions
* messages
* FAQs

Do not render arbitrary HTML from users.

---

# 120. CSRF

Use the authentication/session model and Next.js protections appropriately.

State-changing requests must not rely on an untrusted browser-provided identity.

---

# 121. RLS

Supabase Row-Level Security should be enabled on sensitive tables.

Examples:

```text
profiles
businesses
business_staff
conversations
messages
reviews
saved_businesses
notifications
```

---

# 122. RLS Principle

The database should assume:

> **The client may be malicious.**

Even if the frontend hides a button, the database must still prevent unauthorized access.

---

# 123. Public Business Data

Only published business data should be publicly queryable.

Potentially:

```text
business name
description
category
services
pricing
hours
public reviews
public location
```

---

# 124. Private Business Data

Never expose publicly:

```text
owner user ID
internal notes
AI configuration
private staff data
private analytics
moderation information
```

---

# 125. Conversation Privacy

Only:

```text
customer
business staff
authorized administrators
```

can access the conversation.

AI receives only the context required to perform its function.

---

# 126. Admin API

Administrative routes:

```text
/api/admin/*
```

Require:

```text
admin role
```

Examples:

```text
GET /api/admin/businesses/pending
POST /api/admin/businesses/:id/verify
POST /api/admin/businesses/:id/suspend
GET /api/admin/reports
```

---

# 127. Moderation Reports

Report object:

```text
reporter
target
reason
description
status
created_at
resolved_at
```

Statuses:

```text
open
reviewing
resolved
dismissed
```

---

# 128. Audit Logs

Important administrative events should be recorded.

Examples:

```text
business_verified
business_suspended
review_removed
user_suspended
admin_login
```

Do not create audit logs for every trivial UI action.

---

# 129. Application Event Model

Internally, important events can follow:

```text
business.created
business.published
conversation.created
message.created
conversation.handoff
voice.started
voice.ended
review.created
```

This gives us an extension point for notifications and analytics.

---

# 130. MVP Event Processing

Do not introduce Kafka, RabbitMQ, or another large message broker.

Use:

```text
Next.js
Supabase
database events/jobs
```

and simple asynchronous processing.

Introduce a dedicated queue only when real volume requires it.

---

# 131. Background Jobs

Potential jobs:

```text
send email
generate analytics
process moderation
AI processing
cleanup expired sessions
```

MVP can use lightweight scheduled/background mechanisms.

---

# 132. API Logging

Log:

```text
request ID
endpoint
status
duration
authenticated user ID where appropriate
error code
```

Do not log:

```text
passwords
tokens
LLM API keys
LiveKit tokens
private message content
```

unless explicitly required for debugging and protected.

---

# 133. Request ID

Every request should have:

```text
request_id
```

This helps trace failures.

---

# 134. Example Complete Request

Customer sends a message:

```text
POST /api/conversations/123/messages
```

System:

```text
1. Authenticate
2. Check conversation
3. Check customer permission
4. Validate message
5. Check rate limit
6. Store message
7. Broadcast realtime event
8. Determine whether AI is enabled
9. Build business context
10. Call AI provider
11. Validate AI response
12. Store AI response
13. Broadcast AI message
14. Return result
```

---

# 135. Human Handoff Request

```text
POST /api/conversations/:id/handoff
```

Server:

```text
authenticate
 ↓
authorize
 ↓
verify business accepts handoff
 ↓
set status
 ↓
notify business
 ↓
return
```

Response:

```json
{
  "data": {
    "status": "waiting_for_business"
  },
  "error": null
}
```

---

# 136. Voice Request

```text
POST /api/voice/token
```

Server:

```text
authenticate
 ↓
authorize conversation
 ↓
check voice availability
 ↓
create room
 ↓
generate temporary token
 ↓
return token
```

Then the browser connects directly to LiveKit.

This is important:

> **The One Place application server does not proxy the actual voice audio.**

That keeps the infrastructure cheaper and simpler.

---

# 137. AI Cost Control

AI calls are potentially one of the largest variable costs.

Therefore:

```text
Do not call AI unnecessarily.
```

Use:

* short context
* small/efficient models for routine questions
* caching where appropriate
* rate limits
* human handoff
* provider abstraction

---

# 138. AI Cache

Potential future:

```text
"What are your opening hours?"
```

If the answer hasn't changed, the system can reuse a cached response.

Do not implement sophisticated semantic caching in MVP unless needed.

---

# 139. Voice Cost Control

MVP:

```text
Web voice only
```

No business phone numbers.

This removes:

* PSTN number costs
* inbound call costs
* outbound call costs
* telephony routing complexity

from the initial launch.

---

# 140. External Provider Boundary

One Place owns:

```text
customer
business
conversation
message
service
review
permissions
business knowledge
```

Providers own:

```text
LLM inference
voice transport
email delivery
payments
```

This distinction is architecturally important.

---

# 141. Provider Replacement Strategy

If the LLM provider changes:

```text
AIProvider
```

changes.

The rest of the application should not.

If LiveKit changes:

```text
VoiceProvider
```

changes.

The conversation system should not.

---

# 142. What We Do NOT Build in MVP

Do not build:

```text
microservices
Kubernetes
Kafka
Redis cluster
vector database
custom recommendation engine
custom LLM
custom voice infrastructure
PSTN routing
complex booking engine
payment infrastructure
```

unless actual product requirements force them.

---

# 143. MVP Deployment Architecture

```text
                    Internet
                       │
                       ▼
                  Next.js App
                       │
             ┌─────────┼─────────┐
             ▼         ▼         ▼
         Supabase    LiveKit    LLM
         Postgres
         Auth
         Storage
         Realtime
```

This is enough.

---

# 144. Scaling Path

When traffic grows:

### Stage 1

```text
Next.js
Supabase
LiveKit
LLM provider
```

### Stage 2

Introduce:

```text
background job processing
Redis/cache
```

only when necessary.

### Stage 3

Separate heavy workloads.

### Stage 4

Extract services only where operationally justified.

---

# 145. Business Logic Rule

The application should not assume:

> Every business wants the same workflow.

MVP therefore supports configurable business information:

```text
services
pricing
hours
FAQs
AI enabled
voice enabled
```

Future can introduce:

```text
booking
quotes
payments
custom workflows
```

---

# 146. Business Workflow Engine

Do **not** build a general-purpose workflow engine in MVP.

It would dramatically increase complexity.

Instead use explicit application logic.

Future:

```text
BusinessWorkflow
WorkflowStep
WorkflowTrigger
WorkflowAction
```

only after real businesses demonstrate the need.

---

# 147. Customer Request Lifecycle

The core lifecycle is:

```text
DISCOVER
   ↓
VIEW
   ↓
ASK
   ↓
AI ANSWER
   ↓
HUMAN HANDOFF
   ↓
CONVERSATION
   ↓
RESOLUTION
   ↓
REVIEW
```

This is the fundamental One Place loop.

---

# 148. Business Lifecycle

```text
SIGN UP
   ↓
CREATE PROFILE
   ↓
ADD SERVICES
   ↓
ADD PRICING
   ↓
ADD HOURS
   ↓
SUBMIT
   ↓
VERIFY
   ↓
PUBLISH
   ↓
RECEIVE QUESTIONS
   ↓
RECEIVE CONVERSATIONS
   ↓
BUILD REPUTATION
```

---

# 149. API Surface — MVP

The initial API should remain approximately this size:

### Authentication

Handled by Supabase Auth.

### Businesses

```text
GET    /api/businesses
POST   /api/businesses
GET    /api/businesses/:id
PATCH  /api/businesses/:id
POST   /api/businesses/:id/publish
```

### Services

```text
GET    /api/businesses/:id/services
POST   /api/businesses/:id/services
PATCH  /api/businesses/:id/services/:serviceId
DELETE /api/businesses/:id/services/:serviceId
```

### Categories

```text
GET /api/categories
GET /api/categories/:slug
```

### Saved

```text
GET    /api/saved-businesses
POST   /api/saved-businesses
DELETE /api/saved-businesses/:id
```

### Conversations

```text
GET  /api/conversations
POST /api/conversations
GET  /api/conversations/:id
POST /api/conversations/:id/messages
POST /api/conversations/:id/handoff
POST /api/conversations/:id/resolve
```

### Voice

```text
POST /api/voice/token
POST /api/voice/session
POST /api/voice/session/:id/end
```

### Reviews

```text
GET    /api/businesses/:id/reviews
POST   /api/businesses/:id/reviews
PATCH  /api/reviews/:id
POST   /api/reviews/:id/report
```

### Notifications

```text
GET   /api/notifications
PATCH /api/notifications/:id
```

---

# 150. What Should Be Server Actions Instead?

Not every mutation needs a public REST endpoint.

Internal authenticated actions can use:

```text
Next.js Server Actions
```

for things such as:

* saving profile changes
* updating business hours
* adding a service

Use Route Handlers where:

* the browser needs a conventional API
* an external service needs a callback
* the operation is naturally resource-oriented
* mobile clients may eventually consume the API

---

# 151. Recommended MVP Rule

Don't obsess over:

> REST vs Server Actions.

The important separation is:

```text
UI
 ↓
application logic
 ↓
data/infrastructure
```

not whether every operation is technically REST.

---

# 152. API Contract Documentation Standard

Every endpoint added later must document:

```text
Endpoint
HTTP method
Authentication
Authorization
Request
Validation
Business logic
Database operations
External calls
Response
Errors
Rate limit
Audit requirements
```

No undocumented production endpoint.

---

# 153. Development Definition of Done

An API feature is not complete until:

* validation exists
* authorization exists
* database operation works
* errors are handled
* loading state exists
* empty state exists where applicable
* frontend integration works
* audit/analytics event is considered
* rate limiting is considered
* security implications are reviewed
* tests exist

---

# 154. Testing Strategy

## Unit tests

Test:

```text
pricing rules
permissions
ranking
AI context construction
review eligibility
conversation state transitions
```

## Integration tests

Test:

```text
API → database
authentication → API
conversation → message
voice token → authorization
```

## E2E tests

Test:

```text
customer signup
search
business profile
conversation
business response
voice connection
review
business onboarding
```

---

# 155. Critical End-to-End Test

The most important MVP test is:

```text
Customer
 ↓
Finds business
 ↓
Opens profile
 ↓
Asks question
 ↓
AI answers
 ↓
Customer requests human
 ↓
Business receives request
 ↓
Business responds
 ↓
Customer receives response
 ↓
Customer starts voice conversation
 ↓
Voice ends
 ↓
Customer reviews business
```

If this works reliably, the core product works.

---

# 156. Critical Business Test

```text
Business owner
 ↓
Creates account
 ↓
Creates business
 ↓
Adds category
 ↓
Adds services
 ↓
Adds pricing
 ↓
Adds hours
 ↓
Publishes
 ↓
Customer discovers business
 ↓
Customer asks question
 ↓
Business receives conversation
 ↓
Business responds
```

---

# 157. Final Application Logic

The entire MVP can ultimately be reduced to:

```text
                    ONE PLACE
                        │
             ┌──────────┴──────────┐
             │                     │
        CUSTOMER                BUSINESS
             │                     │
          SEARCH                PROFILE
             │                     │
          DISCOVER              SERVICES
             │                     │
           ASK                  PRICING
             │                     │
            AI                   HOURS
             │                     │
          HUMAN                KNOWLEDGE
             │                     │
        CHAT / VOICE          CHAT / VOICE
             │                     │
             └──────────┬──────────┘
                        │
                   CONVERSATION
                        │
                     REVIEW
```

That is the application.

---

# 158. Final Technical Principle

We should resist the temptation to turn One Place into a giant technology platform too early.

The MVP should remain:

> **Next.js + Supabase + LiveKit + one LLM provider.**

And architecturally:

> **One application, one database, one voice infrastructure, one AI abstraction.**

No unnecessary microservices.

No custom AI.

No custom voice infrastructure.

No complex orchestration engine.

No phone-number infrastructure in MVP.

---

# 159. Final Business Logic Principle

The most important thing One Place owns is **the relationship and context around the service interaction**, not the underlying infrastructure.

One Place knows:

> Who is looking?

> What are they looking for?

> Which business can help?

> What does that business offer?

> What did the customer ask?

> Did AI answer?

> Did a human need to intervene?

> Did the interaction result in a useful connection?

That information becomes the foundation for the later product.

---

# 160. POST-MVP API EXTENSIONS

The architecture intentionally leaves room for:

```text
Bookings
Quotes
Payments
Business calendars
Staff management
Direct PSTN calling
French language
Advanced AI agents
Business automation
Maps
Subscriptions
Promotions
Advanced analytics
Customer CRM
```

These should be added as **new application capabilities**, not allowed to contaminate the MVP architecture.

---

# DOCUMENT 08 COMPLETE

### The development stack is now concretely defined as:

```text
                    ┌──────────────────────┐
                    │      CUSTOMER        │
                    │ Web / Mobile Browser │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │       NEXT.JS        │
                    │                      │
                    │ UI                   │
                    │ Route Handlers       │
                    │ Server Actions       │
                    │ Application Services │
                    │ Auth/Permissions     │
                    └──────┬───────┬───────┘
                           │       │
              ┌────────────┘       └─────────────┐
              ▼                                  ▼
      ┌───────────────┐                  ┌───────────────┐
      │   SUPABASE    │                  │    LIVEKIT    │
      │               │                  │               │
      │ PostgreSQL    │                  │ Voice         │
      │ Auth          │                  │ Rooms         │
      │ Storage       │                  │ Realtime media│
      │ Realtime      │                  │               │
      │ RLS           │                  └───────────────┘
      └───────────────┘
              │
              │ controlled server-side request
              ▼
      ┌───────────────┐
      │ LLM PROVIDER  │
      │               │
      │ AI inference  │
      └───────────────┘
```

**The key architectural decision remains:** the browser never receives privileged credentials for Supabase, LiveKit or the LLM provider. Next.js is the controlled application boundary.
