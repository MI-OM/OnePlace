# ONE PLACE — DOCUMENT 05

## API, Server Actions & Application Logic Specification

**Version:** 1.0
**Status:** Development Ready
**Architecture:** Next.js full-stack + Supabase + LiveKit
**Primary objective:** Define exactly how the frontend, application logic, database, AI layer, and real-time communication interact.

---

# 1. Purpose

Document 04 defined **where data lives**.

This document defines **how the application behaves**.

The core rule is:

> **The frontend displays and collects information. The application layer decides what is allowed to happen. PostgreSQL stores the result.**

The initial architecture is deliberately simple:

```text
Browser
   ↓
Next.js
   ↓
Application Logic
   ↓
Supabase
   ↓
PostgreSQL
```

For real-time communication:

```text
Browser
   ↓
LiveKit
   ↓
Chat / Voice
```

For AI:

```text
User
   ↓
Next.js
   ↓
Relevant business information
   ↓
LLM provider
   ↓
Next.js
   ↓
User
```

---

# 2. Architectural Decision

## We are NOT building a separate NestJS backend for MVP.

The MVP uses:

> **Next.js as the frontend and application backend.**

This means:

```text
Next.js App Router
├── Pages
├── Server Components
├── Client Components
├── Server Actions
├── Route Handlers
├── Authentication
├── Authorization
├── Business logic
└── External integrations
```

Supabase provides:

```text
PostgreSQL
Authentication
Realtime
Storage
Row-Level Security
```

LiveKit provides:

```text
Realtime audio/video
Rooms
Participants
Voice infrastructure
```

---

# 3. Why This Architecture?

Because the MVP needs speed.

We don't need:

```text
Next.js
+
NestJS
+
Redis
+
Kafka
+
Microservices
+
Kubernetes
```

That would increase:

* development time
* deployment complexity
* infrastructure cost
* debugging complexity
* operational overhead

without providing meaningful MVP value.

---

# 4. Core Application Layers

The application has six conceptual layers.

```text
┌─────────────────────────────┐
│          UI Layer           │
│ Next.js / React / Tailwind │
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│     Application Layer       │
│ Server Actions / Routes     │
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│      Domain Logic           │
│ Business rules / validation │
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│       Data Layer            │
│ Supabase / PostgreSQL       │
└─────────────────────────────┘

       ↘                 ↙
       AI              LiveKit
```

---

# 5. Request Lifecycle

Every important request follows:

```text
User action
    ↓
Authentication check
    ↓
Authorization check
    ↓
Input validation
    ↓
Business logic
    ↓
Database operation
    ↓
Side effects
    ↓
Response
```

Example:

```text
Customer clicks "Request Service"
        ↓
Is customer authenticated?
        ↓
Does service exist?
        ↓
Does business offer service?
        ↓
Is service active?
        ↓
Create request
        ↓
Notify business
        ↓
Return request
```

---

# 6. Authentication

Supabase Auth handles authentication.

Supported MVP authentication:

* email/password
* email verification
* password reset

Potential later additions:

* Google
* Apple
* magic links
* passkeys

Do not implement all of these initially.

---

# 7. Authentication Flow

```text
Sign Up
   ↓
Supabase Auth
   ↓
Email verification
   ↓
Profile created
   ↓
Onboarding
```

---

# 8. Sign-Up Logic

### Input

```text
first_name
last_name
email
password
```

### Process

```text
Validate input
↓
Create Supabase user
↓
Create profile
↓
Assign customer role
↓
Send verification email
```

### Success copy

> **You're in. Welcome to One Place.**

Supporting text:

> Let's get you connected with the services you need.

---

# 9. Login Logic

```text
Email
Password
   ↓
Supabase Auth
   ↓
Session
   ↓
Redirect
```

Customer:

```text
/
```

Business owner:

```text
/business/dashboard
```

Admin:

```text
/admin
```

---

# 10. Authentication Errors

Never expose technical errors.

Bad:

> `AuthApiError: Invalid login credentials`

Good:

> **We couldn't sign you in.**
> Check your email and password and try again.

---

# 11. Authorization

Authentication asks:

> Who are you?

Authorization asks:

> What are you allowed to do?

Every protected operation requires both.

---

# 12. Authorization Example

A business owner attempting:

```text
Update business
```

must satisfy:

```text
authenticated
AND
member of business
AND
member role allows editing
```

---

# 13. Business Membership Permissions

### Owner

Can:

* edit business
* manage services
* manage staff
* manage knowledge
* manage AI
* view requests
* respond to conversations
* view analytics

### Admin

Same as owner except ownership-sensitive operations.

### Manager

Can:

* manage services
* manage requests
* manage conversations
* manage business information

### Staff

Can:

* view assigned conversations
* respond
* manage permitted requests

---

# 14. Public Business API

Public business data is intentionally limited.

Conceptually:

```text
GET /api/businesses/:slug
```

Returns:

```json
{
  "id": "...",
  "name": "Example Studio",
  "description": "...",
  "categories": [],
  "services": [],
  "hours": [],
  "location": {},
  "rating": 4.8,
  "review_count": 32
}
```

Never return:

```text
customer information
internal notes
AI configuration
private analytics
```

---

# 15. Business Search

Conceptually:

```text
GET /api/businesses
```

Parameters:

```text
q
category
city
province
lat
lng
radius
sort
page
limit
```

Example:

```text
/api/businesses?q=hair&category=hair-salon
```

---

# 16. Search Algorithm — MVP

Do not build AI-powered discovery initially.

Use:

```text
name relevance
+
description relevance
+
category relevance
+
location
+
business status
```

Later:

```text
behavior
+
reviews
+
availability
+
personalization
```

---

# 17. Category Retrieval

```text
GET /api/categories
```

Returns active categories.

For nested categories:

```text
GET /api/categories/:slug
```

---

# 18. Business Onboarding

This is one of the most important flows.

Business owner clicks:

> **List your business**

---

# 19. Onboarding Step 1 — Basic Information

Fields:

```text
Business name
Business description
Email
Phone
Website
```

Copy:

### Heading

> **Tell people what you do.**

### Supporting text

> Give customers a clear picture of your business before they reach out.

---

# 20. Onboarding Step 2 — Category

User selects:

> **What kind of service do you provide?**

Allow:

* primary category
* additional categories

Copy:

> **Choose what best describes your business.**

---

# 21. Onboarding Step 3 — Location

Fields:

```text
Address
City
Province
Postal code
```

Optional:

```text
Map location
```

Copy:

> **Where can customers find you?**

---

# 22. Onboarding Step 4 — Services

Business enters:

```text
Service name
Description
Price
Duration
```

Copy:

> **What can customers get from you?**

---

# 23. Onboarding Step 5 — Hours

Business defines:

```text
Monday
Tuesday
Wednesday
...
Sunday
```

Copy:

> **When are you available?**

---

# 24. Onboarding Step 6 — FAQs

Ask:

> **What do customers ask you most often?**

Examples:

> Do you accept walk-ins?

> Do you offer appointments?

> What payment methods do you accept?

---

# 25. Onboarding Step 7 — AI Assistant

Optional during MVP.

Business can activate:

> **Let One Place answer common questions for you.**

Supporting copy:

> Give your assistant the information it needs to answer customers accurately.

---

# 26. Business Publishing

Before publishing:

```text
Validate required fields
↓
Create business
↓
Create categories
↓
Create location
↓
Create services
↓
Create hours
↓
Create FAQs
↓
Publish
```

Business status:

```text
pending_review
```

or:

```text
active
```

depending on verification policy.

---

# 27. Business Dashboard

Dashboard sections:

```text
Overview
Business
Services
Hours
Questions & Answers
Conversations
Requests
Reviews
Settings
```

MVP should avoid excessive dashboard complexity.

---

# 28. Business Update Logic

Every update:

```text
Authenticate
↓
Verify business membership
↓
Validate fields
↓
Update database
↓
Invalidate cache
```

---

# 29. Service Management

Business can:

```text
Create service
Edit service
Deactivate service
Archive service
```

API concept:

```text
POST   /api/businesses/:id/services
PATCH  /api/services/:id
DELETE /api/services/:id
```

For deletion, prefer archival:

```text
status = archived
```

---

# 30. Business Hours

Business can:

```text
Set hours
Edit hours
Close specific days
```

The AI must read this data dynamically.

Never hard-code:

> "We're open from 9 to 5."

inside the AI prompt.

---

# 31. Business Knowledge

Business owners can create:

```text
FAQ
Policy
Pricing information
Parking information
Accessibility information
Cancellation policy
Other information
```

---

# 32. Knowledge Update

When information changes:

```text
Business edits knowledge
        ↓
Database updated
        ↓
Next AI request retrieves new information
```

No model retraining.

This is critical.

---

# 33. AI Architecture

The AI layer is **retrieval-first**.

```text
Customer question
       ↓
Identify intent
       ↓
Identify business
       ↓
Retrieve relevant records
       ↓
Build context
       ↓
LLM
       ↓
Validate response
       ↓
Customer
```

---

# 34. AI Context

For:

> "Are you open tomorrow?"

Retrieve:

```text
business_hours
```

For:

> "How much is a haircut?"

Retrieve:

```text
business_services
```

For:

> "Do you take credit cards?"

Retrieve:

```text
business_knowledge
```

---

# 35. AI Never Invents Business Information

System instruction:

> Answer only from the business information supplied to you. If the information is unavailable, clearly tell the customer that you don't have that information and offer to connect them with the business.

---

# 36. AI Fallback

If information isn't available:

> **I don't have that information yet.**

Then:

> **Would you like me to connect you with the business?**

This is better than hallucinating.

---

# 37. AI Conversation Endpoint

Conceptually:

```text
POST /api/conversations/:id/ai
```

Input:

```json
{
  "message": "Are you open tomorrow?"
}
```

Application:

```text
Authenticate
↓
Verify conversation
↓
Identify business
↓
Retrieve relevant information
↓
Build minimal context
↓
Call LLM
↓
Store response
↓
Return response
```

---

# 38. AI Message Storage

Store:

```text
message_type = text
sender_type = ai_agent
```

Potential metadata:

```json
{
  "source": "business_knowledge"
}
```

Don't store sensitive LLM payloads unnecessarily.

---

# 39. LLM Provider Abstraction

Do not hard-code the entire application around one provider.

Use an internal interface:

```text
AIProvider
```

Conceptually:

```text
generateResponse()
```

Then:

```text
OpenAIProvider
AnthropicProvider
GoogleProvider
LocalProvider
```

can implement the same interface later.

This lets us switch providers without rewriting the application.

---

# 40. AI Cost Control

MVP rules:

* retrieve only relevant information
* limit conversation context
* limit output tokens
* don't send entire business profile
* don't send irrelevant customer data
* cache static business information where practical

---

# 41. Chat Flow

Customer clicks:

> **Talk to this business**

Then:

```text
Create conversation
↓
Add customer
↓
Add business context
↓
Display chat
```

---

# 42. Chat UI States

### Connecting

> **Connecting you…**

### Connected

> **You're connected.**

### Business unavailable

> **They're not available right now.**

Then:

> You can leave a message and they'll get back to you.

---

# 43. Human Conversation

Messages flow:

```text
Customer
   ↓
Next.js / Realtime
   ↓
Supabase Realtime
   ↓
Business dashboard
```

and reverse.

---

# 44. Real-Time Messaging

Supabase Realtime can handle MVP messaging.

We don't need a separate WebSocket server.

---

# 45. Voice Architecture

LiveKit handles voice transport.

Our application handles:

```text
authentication
authorization
room creation
participant permissions
conversation metadata
```

---

# 46. Starting Voice

Customer clicks:

> **Talk by voice**

Application:

```text
Authenticate
↓
Verify conversation
↓
Create/retrieve LiveKit room
↓
Generate short-lived access token
↓
Return token
↓
Browser joins LiveKit
```

---

# 47. LiveKit Token

Never expose permanent credentials to the browser.

The browser receives a short-lived token.

Conceptually:

```text
POST /api/voice/token
```

Input:

```json
{
  "conversation_id": "..."
}
```

Server verifies:

```text
user
conversation
business
permissions
```

Then generates token.

---

# 48. Voice Session Creation

When voice starts:

```text
voice_sessions
```

is created.

```text
status = connecting
```

Once connected:

```text
status = active
```

When finished:

```text
status = completed
duration_seconds = ...
```

---

# 49. Voice Does NOT Automatically Mean Recording

Default:

```text
recorded = false
```

No recording.

No storage.

No unnecessary privacy burden.

---

# 50. Ending Voice

When customer leaves:

```text
LiveKit disconnect
↓
application receives session completion
↓
voice_session updated
↓
conversation remains available
```

---

# 51. Voice Failure

If LiveKit fails:

> **We couldn't connect the call.**

Then:

> You can continue by chat instead.

This is important.

Voice should never become a dead end.

---

# 52. Business Availability

If business is unavailable:

```text
voice disabled
```

Display:

> **They're not available for voice right now.**

Then:

> Send a message instead.

---

# 53. Request Flow

Customer can request a service from:

* business page
* conversation
* service page

---

# 54. Request Creation

Input:

```text
service
date
time
notes
```

Then:

```text
Validate
↓
Create service_request
↓
Notify business
```

---

# 55. Request Confirmation

Customer sees:

> **Request sent.**

Supporting text:

> We'll let you know when the business responds.

---

# 56. Business Request Response

Business sees:

> **New service request**

Actions:

```text
Accept
Decline
Message customer
```

---

# 57. Accept

Customer:

> **Your request was accepted.**

---

# 58. Decline

Customer:

> **The business couldn't accept this request.**

Optional:

> You can explore similar services nearby.

---

# 59. Reviews

Customer can review after:

```text
completed request
```

or another approved qualifying interaction.

---

# 60. Review Submission

Input:

```text
rating
title
comment
```

Validation:

```text
rating = 1–5
```

---

# 61. Review Copy

Heading:

> **How was your experience?**

Supporting:

> Your feedback helps other customers make better decisions.

Button:

> **Post review**

---

# 62. Review Moderation

Review:

```text
pending
```

or automatically:

```text
published
```

depending on moderation rules.

Flagged content enters:

```text
moderation queue
```

---

# 63. Saved Businesses

Customer clicks:

> **Save**

Application:

```text
insert saved_business
```

Click again:

```text
delete saved_business
```

---

# 64. Notifications

Notifications can be triggered by:

```text
new message
new request
request accepted
request declined
review
system event
```

---

# 65. Notification Architecture

```text
Business event
     ↓
Application logic
     ↓
Notification record
     ↓
Realtime UI update
```

Email notifications can be added later.

---

# 66. Search Flow

```text
User enters search
        ↓
Debounce
        ↓
Search API
        ↓
PostgreSQL
        ↓
Rank results
        ↓
Display
```

Don't call an LLM for every search.

---

# 67. Discovery Ranking — MVP

Basic ranking:

```text
relevance
+
category match
+
location
+
verification
+
rating
```

Avoid making rating the dominant factor.

---

# 68. Business Page

Business page requests:

```text
business
categories
services
location
hours
reviews
```

Use parallel database queries where appropriate.

---

# 69. Business Page Actions

Primary:

> **Talk to us**

Secondary:

> **Request a service**

Other:

> **Save**

> **View services**

> **Get directions**

---

# 70. Error Handling Architecture

Every application error belongs to one of:

```text
VALIDATION_ERROR
AUTHENTICATION_ERROR
AUTHORIZATION_ERROR
NOT_FOUND
CONFLICT
RATE_LIMITED
EXTERNAL_SERVICE_ERROR
INTERNAL_ERROR
```

---

# 71. Error Response Format

Use a consistent structure:

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "We couldn't find that business."
  }
}
```

Never expose:

* database errors
* stack traces
* API secrets
* provider errors

to users.

---

# 72. Validation

Use a schema validation library such as Zod.

Every external input should be validated.

Examples:

```text
email
password
business name
service price
rating
request date
```

---

# 73. Rate Limiting

MVP should protect:

* login attempts
* account creation
* AI requests
* message creation
* voice-token creation
* reviews
* search abuse

Start simple.

Later use a dedicated Redis-based rate limiter if scale requires it.

---

# 74. AI Rate Limits

AI should have per-user limits.

Example conceptual policy:

```text
Anonymous:
limited

Authenticated:
higher limit

Business:
higher operational limit
```

Actual numbers should be determined after observing usage and LLM costs.

---

# 75. Voice Rate Limits

Prevent:

```text
room creation spam
token generation abuse
automated calling
```

---

# 76. Business Onboarding Security

A user cannot simply claim:

> "I own McDonald's."

and gain access.

MVP verification should include an appropriate business verification process.

The exact verification level can evolve.

---

# 77. Business Verification Flow

```text
Business submitted
       ↓
Pending verification
       ↓
Admin / automated verification
       ↓
Verified
       ↓
Published
```

---

# 78. Admin Operations

Admin needs:

```text
Business management
User management
Reports
Reviews
Categories
Verification
Audit logs
```

Do not build a giant admin dashboard initially.

Build operational tools only.

---

# 79. Admin Business Actions

```text
Approve
Reject
Suspend
Reactivate
```

Every sensitive action produces an audit log.

---

# 80. Data Deletion

Customer requests account deletion:

```text
Verify user
↓
Deactivate account
↓
Anonymize eligible records
↓
Remove authentication account
```

Exact retention must follow the platform's privacy/legal policy.

---

# 81. Business Deactivation

Business owner selects:

> **Pause my business**

Status:

```text
paused
```

Public listing becomes unavailable.

Historical requests and conversations remain intact.

---

# 82. Business Closure

Business selects:

> **Business is permanently closed**

Status:

```text
closed
```

Historical data remains according to retention policy.

---

# 83. Conversation Lifecycle

```text
created
   ↓
active
   ↓
waiting
   ↓
escalated
   ↓
closed
```

Not every conversation needs every state.

---

# 84. AI → Human Escalation

This is a core feature.

Customer says:

> "I want to speak to someone."

AI responds:

> **Absolutely. I'll connect you with someone from the business.**

Then:

```text
conversation.status = escalated
```

Business receives notification.

---

# 85. Business Unavailable During Escalation

AI:

> **No one is available right now.**

Then:

> You can leave a message and the business can respond when they're back.

Never promise an immediate human response.

---

# 86. AI Confidence

Do not initially create a complicated confidence model.

Use simple conditions:

```text
Known information → answer
Unknown information → fallback
Sensitive/ambiguous → human
Explicit human request → human
```

---

# 87. Sensitive Requests

The AI should avoid making authoritative claims in areas such as:

* medical diagnosis
* legal advice
* financial advice
* emergencies

Instead:

> **I can help you find the right service, but I can't provide professional advice on that.**

---

# 88. Application Services

Internally organize logic approximately as:

```text
/lib
   /auth
   /businesses
   /categories
   /services
   /conversations
   /messages
   /voice
   /ai
   /reviews
   /notifications
   /search
   /analytics
```

This is organization, not microservices.

---

# 89. Repository Structure

Recommended:

```text
app/
  (marketing)/
  (customer)/
  business/
  admin/
  api/

components/
  ui/
  business/
  chat/
  voice/
  forms/

lib/
  auth/
  businesses/
  categories/
  services/
  conversations/
  voice/
  ai/
  reviews/
  notifications/
  search/

supabase/
  migrations/
  seed/

types/
```

---

# 90. Server Actions vs API Routes

Use **Server Actions** for internal application mutations where appropriate:

```text
createBusiness()
updateBusiness()
createService()
submitReview()
saveBusiness()
```

Use **Route Handlers** for:

* LiveKit token generation
* AI endpoints
* webhooks
* external integrations
* APIs potentially consumed outside the application

---

# 91. Webhooks

Future integrations may send events to:

```text
/api/webhooks/*
```

Examples:

```text
LiveKit webhook
payment webhook
email webhook
```

Webhook processing must be idempotent.

---

# 92. Idempotency

Important operations should not accidentally execute twice.

For example:

```text
Payment received
```

should not create two orders.

Similarly:

```text
LiveKit session completed
```

should not create duplicate records.

---

# 93. Background Jobs

MVP should avoid introducing a job queue unless required.

Simple operations can happen inside requests.

Later, introduce background processing for:

```text
emails
analytics aggregation
AI processing
large imports
search indexing
scheduled notifications
```

---

# 94. Analytics

Every meaningful event should be captured through a single analytics function.

Conceptually:

```text
trackEvent()
```

Examples:

```text
business_viewed
search_performed
conversation_started
voice_started
request_created
request_completed
review_submitted
```

---

# 95. Analytics Must Not Block UX

Analytics failure should never cause:

> "Your request failed."

If analytics fails:

```text
log internally
continue operation
```

---

# 96. Business Metrics

MVP dashboard:

```text
Profile views
Conversations
Voice conversations
Service requests
Reviews
Average rating
```

Later:

```text
conversion rate
response time
AI resolution rate
customer acquisition
repeat customers
```

---

# 97. AI Metrics

Track:

```text
AI conversations
AI responses
human escalations
fallbacks
average response latency
estimated AI cost
```

Do not store unnecessary prompt content just for analytics.

---

# 98. Voice Metrics

Track:

```text
voice sessions
successful connections
failed connections
duration
```

Do not store audio by default.

---

# 99. Application-Level Logging

Log:

```text
request ID
user ID where appropriate
operation
duration
success/failure
error category
```

Never log:

```text
passwords
access tokens
private API keys
full sensitive message contents
```

---

# 100. Request Correlation

Each server request should have a correlation/request ID.

This makes debugging:

```text
Frontend
 ↓
Next.js
 ↓
Supabase
 ↓
LiveKit
```

much easier.

---

# 101. Caching Strategy

Cache:

```text
categories
public business information
public services
static marketing content
```

Do not blindly cache:

```text
private messages
service requests
notifications
user-specific information
```

---

# 102. Optimistic UI

Use optimistic updates selectively.

Good:

```text
Save business
```

Potentially:

```text
Like/favorite
```

Avoid optimistic updates for:

```text
service requests
payments
verification
important business changes
```

---

# 103. Loading States

Every asynchronous operation needs a loading state.

Instead of a blank screen:

> **Loading…**

Use meaningful UI where possible.

Example:

> **Finding businesses near you…**

---

# 104. Empty States

No businesses:

> **We couldn't find a match yet.**

Supporting:

> Try another category, location or search term.

No conversations:

> **No conversations yet.**

Supporting:

> Start a conversation with a business when you're ready.

---

# 105. Business Empty State

No requests:

> **No service requests yet.**

Supporting:

> Requests from customers will appear here.

---

# 106. Voice Empty/Error State

If microphone permission is denied:

> **Microphone access is needed for voice conversations.**

Button:

> **Allow microphone**

---

# 107. Offline Handling

If network drops during chat:

> **You're offline. Reconnecting…**

After recovery:

> **You're back online.**

---

# 108. Mobile-First Behavior

All core operations must work on mobile:

```text
Search
Business discovery
Chat
Voice
Service request
Reviews
Business management
```

Desktop improves the experience but is not the primary dependency.

---

# 109. Core Customer Journey

The entire MVP should support this:

```text
Landing page
      ↓
Search / category
      ↓
Business listing
      ↓
Business profile
      ↓
Talk
   ↙     ↘
Chat    Voice
   ↓
Request service
      ↓
Business responds
      ↓
Service completed
      ↓
Review
```

---

# 110. Core Business Journey

```text
List business
     ↓
Create profile
     ↓
Add services
     ↓
Add hours
     ↓
Add knowledge
     ↓
Publish
     ↓
Customers discover
     ↓
Customers ask questions
     ↓
AI / human responds
     ↓
Requests arrive
     ↓
Business converts customers
```

---

# 111. What Makes One Place Different

The application logic should reinforce one central idea:

> **Don't make customers figure out how to contact a service provider. Let them simply ask.**

The experience is:

```text
Search
↓
Ask
↓
Understand
↓
Talk
↓
Request
```

rather than:

```text
Google
↓
Website
↓
Find phone number
↓
Call
↓
Wait
↓
Ask
↓
Repeat
```

---

# 112. MVP Integration Boundary

The MVP has only a few external dependencies:

### Supabase

* authentication
* database
* realtime
* storage

### LiveKit

* voice

### LLM provider

* AI responses

### Email provider

* transactional email, if needed

That is enough.

---

# 113. What We Are Explicitly NOT Building

No:

```text
microservices
Kubernetes
Kafka
custom WebSocket infrastructure
custom voice infrastructure
self-hosted LLM
vector database
dedicated search engine
complex recommendation engine
complex booking engine
payment infrastructure
```

unless actual product usage proves we need them.

---

# 114. Scaling Path

### Stage 1

```text
Next.js
Supabase
LiveKit
LLM API
```

### Stage 2

Introduce:

```text
Redis
background jobs
dedicated search
observability
```

only when justified.

### Stage 3

Potentially separate:

```text
AI service
voice service
search service
analytics
```

### Stage 4

Only if scale requires it:

```text
independent backend services
regional infrastructure
advanced event architecture
```

---

# 115. The Most Important Engineering Principle

**Do not architect for imaginary scale.**

Architect for:

> **the first 100 businesses, then 1,000, then 10,000.**

At every stage ask:

> What is actually breaking?

Then solve that problem.

---

# 116. Definition of MVP Completion

The MVP application is technically complete when a customer can:

* create an account
* search for businesses
* browse categories
* view a business
* view services
* view hours
* chat with a business
* initiate voice
* request a service
* receive responses
* save a business
* leave a review

and a business can:

* create an account
* create a business
* add services
* add hours
* add FAQs
* manage knowledge
* receive conversations
* answer customers
* receive requests
* manage requests
* receive reviews

---

# 117. MVP Technical Definition

The complete loop must work:

```text
DISCOVER
   ↓
BUSINESS
   ↓
CONVERSATION
   ↓
CHAT / VOICE
   ↓
REQUEST
   ↓
BUSINESS RESPONSE
   ↓
REVIEW
```

If this works reliably, we have an MVP.

Everything else is secondary.

---

# 118. Development Order

The development team should implement in this order:

### Sprint 1

```text
Project setup
Authentication
Database
RLS
Profiles
```

### Sprint 2

```text
Businesses
Categories
Locations
Services
Hours
Business onboarding
```

### Sprint 3

```text
Search
Business listings
Business profile
```

### Sprint 4

```text
Chat
Conversations
Messages
Realtime
```

### Sprint 5

```text
LiveKit voice
Voice sessions
Voice permissions
```

### Sprint 6

```text
Service requests
Notifications
Business dashboard
```

### Sprint 7

```text
Reviews
Saved businesses
Basic analytics
```

### Sprint 8

```text
AI assistant
Business knowledge
AI escalation
```

### Sprint 9

```text
Security hardening
RLS audit
Rate limiting
Error handling
Performance
```

### Sprint 10

```text
Testing
Production deployment
Monitoring
Launch
```

---

# 119. AI Timing Decision

Although AI is important to One Place, **it should not block the initial marketplace infrastructure**.

Build:

```text
business data
services
hours
FAQs
conversation
```

first.

Then plug AI into that information.

This makes AI an enhancement rather than a dependency.

---

# 120. LiveKit Timing Decision

Likewise:

```text
Chat
↓
Voice
```

is the correct development order.

Chat provides a fallback whenever voice is unavailable.

---

# 121. Final Application Architecture

```text
                         ┌───────────────────┐
                         │      Customer     │
                         └─────────┬─────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │     Next.js       │
                         │   Web Application │
                         └───────┬─┬─┬───────┘
                                 │ │ │
                  ┌──────────────┘ │ └───────────────┐
                  ▼                ▼                 ▼
             Supabase           LiveKit             AI
                  │                │                 │
         ┌────────┼──────┐         │          ┌──────┴─────┐
         ▼        ▼      ▼         ▼          ▼            ▼
       Auth     DB    Realtime   Voice       LLM       Knowledge
         │        │      │         │          │            │
         └────────┴──────┴─────────┴──────────┴────────────┘
                              │
                              ▼
                        One Place Core
```

---

# 122. Final Principle

One Place should feel like a **simple application**, even though considerable infrastructure exists underneath.

The user should never think about:

* Supabase
* LiveKit
* APIs
* LLMs
* databases
* authentication tokens
* WebSockets
* server actions

They should simply experience:

> **“I need something. I found someone who provides it. I can ask them a question. I can talk to them. I can request the service.”**

