# ONE PLACE — DOCUMENT 04

## Database Architecture & Implementation Specification

**Version:** 1.0
**Status:** MVP + Post-MVP Foundation
**Database:** PostgreSQL via Supabase
**Backend:** Next.js server-side application layer
**ORM / DB access:** Supabase client + SQL migrations
**Authentication:** Supabase Auth
**Primary principle:** Build the MVP schema correctly once, but avoid creating unnecessary post-MVP infrastructure.

---

# 1. Purpose

This document defines the database that powers One Place.

It covers:

* customers
* businesses
* business profiles
* categories
* services
* locations
* business hours
* conversations
* messages
* voice sessions
* service requests
* reviews
* saved businesses
* AI knowledge
* reputation
* analytics
* moderation
* notifications
* future marketplace capabilities

The database must support the MVP without forcing us to build every future feature immediately.

---

# 2. Database Philosophy

The database should follow five rules:

### Rule 1 — PostgreSQL first

Use PostgreSQL as the source of truth.

### Rule 2 — Normalize important business data

Do not store critical information repeatedly inside JSON.

For example:

Bad:

```text
business
services = JSON containing everything
```

Better:

```text
businesses
    ↓
business_services
    ↓
services
```

### Rule 3 — JSONB only where flexibility is useful

Good candidates:

* AI configuration
* business FAQs
* optional metadata
* analytics metadata
* provider-specific configuration

### Rule 4 — Do not prematurely build microservices

Everything should initially live in one PostgreSQL database.

### Rule 5 — Every important user action should be traceable

For example:

```text
Customer
   ↓
Conversation
   ↓
Message
   ↓
Request
   ↓
Business response
   ↓
Review
```

---

# 3. High-Level Database Relationship

```text
auth.users
    │
    ▼
profiles
    │
    ├───────────────┐
    │               │
    ▼               ▼
businesses       customer activity
    │
    ├── business_categories
    ├── business_locations
    ├── business_services
    ├── business_hours
    ├── business_faqs
    ├── business_knowledge
    ├── conversations
    ├── service_requests
    └── reviews
```

---

# 4. Core Entity Model

The most important entities are:

```text
User
Profile
Business
Category
BusinessCategory
Location
Service
BusinessService
BusinessHours
Conversation
ConversationParticipant
Message
VoiceSession
ServiceRequest
Review
SavedBusiness
FAQ
KnowledgeItem
Notification
```

---

# 5. Authentication vs Application Profile

Supabase Auth owns authentication.

We should **not duplicate authentication credentials** in our database.

Supabase manages:

* email
* password
* OAuth
* verification
* password recovery
* sessions

Our application manages:

* profile
* role
* preferences
* reputation
* activity

Relationship:

```text
auth.users
     │
     │ 1:1
     ▼
profiles
```

---

# 6. `profiles`

Stores application-level user information.

### Columns

| Column       | Type        | Required |
| ------------ | ----------- | -------: |
| id           | uuid        |      Yes |
| first_name   | text        |      Yes |
| last_name    | text        |       No |
| display_name | text        |       No |
| avatar_url   | text        |       No |
| role         | enum        |      Yes |
| status       | enum        |      Yes |
| bio          | text        |       No |
| phone        | text        |       No |
| created_at   | timestamptz |      Yes |
| updated_at   | timestamptz |      Yes |
| last_seen_at | timestamptz |       No |

`id` references:

```text
auth.users(id)
```

---

# 7. User Roles

MVP:

```text
customer
business_owner
business_staff
admin
```

Future:

```text
moderator
support_agent
platform_admin
```

Do not create unnecessary roles now.

---

# 8. User Status

```text
active
suspended
deactivated
pending
```

---

# 9. Business Model

A business is separate from a user.

One person may own multiple businesses.

Therefore:

```text
profiles
   │
   └── business_members
              │
              ▼
          businesses
```

Do **not** put:

```text
business.owner_id
```

as the only relationship.

Use membership.

---

# 10. `businesses`

### Columns

| Column              | Type        |
| ------------------- | ----------- |
| id                  | uuid        |
| name                | text        |
| slug                | text        |
| description         | text        |
| status              | enum        |
| verification_status | enum        |
| logo_url            | text        |
| cover_image_url     | text        |
| website_url         | text        |
| email               | text        |
| phone               | text        |
| created_by          | uuid        |
| created_at          | timestamptz |
| updated_at          | timestamptz |

---

# 11. Business Status

```text
draft
pending_review
active
paused
suspended
closed
```

---

# 12. Business Verification

```text
unverified
pending
verified
rejected
```

Important:

**Verified does not mean government-certified.**

It simply means One Place has completed its verification process.

---

# 13. `business_members`

This allows multiple people to operate one business.

### Columns

```text
id
business_id
user_id
role
status
created_at
updated_at
```

Business member roles:

```text
owner
admin
manager
staff
```

Relationship:

```text
profiles
    │
    └────< business_members >────┐
                                 │
                                 ▼
                              businesses
```

---

# 14. Categories

Categories are foundational to discovery.

We should have two concepts:

### Parent category

Example:

> Beauty & Personal Care

### Child category

Example:

> Hair Salon

---

# 15. `categories`

### Columns

```text
id
parent_id
name
slug
description
icon
status
sort_order
created_at
updated_at
```

`parent_id` references:

```text
categories(id)
```

This allows unlimited category depth without redesigning the database.

---

# 16. Category Example

```text
Beauty & Personal Care
│
├── Hair Salon
├── Barber
├── Nail Salon
├── Spa
└── Makeup Artist
```

---

# 17. Category Rules

A category should have:

* unique slug
* human-readable name
* optional icon
* optional parent
* active/inactive state

Do not hard-code categories into frontend code.

---

# 18. `business_categories`

Many-to-many relationship.

One business can belong to multiple categories.

Example:

```text
Beauty Studio
   ├── Hair Salon
   ├── Makeup Artist
   └── Nail Salon
```

### Columns

```text
business_id
category_id
is_primary
created_at
```

Unique constraint:

```text
business_id + category_id
```

---

# 19. Locations

A business can eventually have multiple locations.

Therefore location must be its own table.

---

# 20. `business_locations`

### Columns

```text
id
business_id
name
address_line_1
address_line_2
city
province
postal_code
country
latitude
longitude
is_primary
created_at
updated_at
```

MVP can support one location.

The schema already supports multiple.

---

# 21. Why Separate Locations?

Because later:

```text
Maya Beauty Studio
   │
   ├── Downtown
   ├── Mount Pearl
   └── Paradise
```

can all exist under one business.

---

# 22. Services

There is an important distinction between a generic service and the service a business actually offers.

For MVP, we can simplify this by using:

```text
business_services
```

directly.

---

# 23. `business_services`

### Columns

```text
id
business_id
category_id
name
slug
description
price_type
price_min
price_max
currency
duration_minutes
status
sort_order
created_at
updated_at
```

---

# 24. Price Types

```text
fixed
starting_from
range
free
contact
```

Examples:

```text
fixed
$50

starting_from
$35+

range
$50–$100

contact
Contact business
```

---

# 25. Service Status

```text
active
inactive
archived
```

---

# 26. Business Hours

Hours need to be structured.

Do not store:

> "We're open Monday to Friday 9–5."

as the only source of truth.

---

# 27. `business_hours`

### Columns

```text
id
business_id
day_of_week
open_time
close_time
is_closed
created_at
updated_at
```

`day_of_week`:

```text
0 = Sunday
1 = Monday
...
6 = Saturday
```

---

# 28. Multiple Opening Periods

Eventually a business might have:

```text
9:00–12:00
13:00–17:00
```

Therefore the schema should permit multiple records for the same day.

Do not impose:

```text
business_id + day_of_week UNIQUE
```

---

# 29. Business FAQs

These become important for the AI.

---

# 30. `business_faqs`

### Columns

```text
id
business_id
question
answer
status
sort_order
created_at
updated_at
```

Example:

```text
Question:
Do you accept walk-ins?

Answer:
Yes, depending on availability.
```

---

# 31. Business Knowledge

FAQs aren't enough.

Businesses may need additional information.

---

# 32. `business_knowledge`

### Columns

```text
id
business_id
title
content
knowledge_type
status
created_at
updated_at
```

Knowledge types:

```text
general
policy
pricing
service
location
parking
payment
cancellation
accessibility
other
```

---

# 33. Why Separate FAQs and Knowledge?

FAQ:

> "Do you accept walk-ins?"

Knowledge:

> "Customers should arrive 10 minutes before their appointment."

The AI can use both.

---

# 34. AI Configuration

---

# 35. `business_ai_settings`

### Columns

```text
id
business_id
enabled
assistant_name
tone
welcome_message
fallback_message
human_escalation_enabled
created_at
updated_at
```

Tone:

```text
friendly
professional
casual
```

---

# 36. Important AI Rule

The AI must never be treated as the source of truth.

The source of truth is:

```text
Business data
     ↓
Knowledge
     ↓
AI
```

not:

```text
AI
     ↓
whatever it thinks is correct
```

---

# 37. Conversations

A conversation is a persistent logical interaction.

It can eventually contain:

* text messages
* voice sessions
* system events
* human messages

---

# 38. `conversations`

### Columns

```text
id
business_id
customer_id
channel
status
started_at
ended_at
last_message_at
created_at
updated_at
```

Channel:

```text
chat
voice
mixed
```

Status:

```text
active
closed
waiting
escalated
```

---

# 39. Conversation Participants

Don't assume every conversation only has two people.

---

# 40. `conversation_participants`

### Columns

```text
id
conversation_id
user_id
participant_type
joined_at
left_at
```

Participant types:

```text
customer
business_staff
ai_agent
admin
```

---

# 41. Messages

---

# 42. `messages`

### Columns

```text
id
conversation_id
sender_id
sender_type
message_type
content
metadata
created_at
```

Message types:

```text
text
system
voice_transcript
file
```

MVP should primarily use:

```text
text
system
```

---

# 43. Message Metadata

`metadata` can be JSONB.

Possible future information:

```json
{
  "language": "en",
  "ai_model": "provider-model",
  "confidence": 0.91
}
```

Do not depend on metadata for core relationships.

---

# 44. Voice Sessions

Voice should have its own table.

---

# 45. `voice_sessions`

### Columns

```text
id
conversation_id
provider
provider_room_id
status
started_at
ended_at
duration_seconds
recorded
created_at
```

Provider:

```text
livekit
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

# 46. Voice Privacy

MVP default:

```text
recorded = false
```

No voice recordings should be persisted unless explicitly required later.

---

# 47. Why Store Voice Sessions?

We don't need to store the audio.

We need to know:

* a voice conversation happened
* when it happened
* how long it lasted
* whether it succeeded

This supports analytics and billing later.

---

# 48. Service Requests

This is the bridge between conversation and business transaction.

---

# 49. `service_requests`

### Columns

```text
id
business_id
customer_id
service_id
conversation_id
status
requested_date
requested_time
notes
business_response
responded_at
created_at
updated_at
```

---

# 50. Request Status

```text
pending
accepted
declined
cancelled
completed
expired
```

---

# 51. Request Flow

```text
Customer
   ↓
Conversation
   ↓
"Can I book this?"
   ↓
Service Request
   ↓
Business
   ↓
Accept / Decline
   ↓
Customer
```

---

# 52. Saved Businesses

---

# 53. `saved_businesses`

### Columns

```text
user_id
business_id
created_at
```

Primary key:

```text
user_id + business_id
```

---

# 54. Reviews

Reviews must be linked to a business and customer.

---

# 55. `reviews`

### Columns

```text
id
business_id
customer_id
request_id
rating
title
content
status
created_at
updated_at
```

Rating:

```text
1–5
```

---

# 56. Review Verification

If a review comes from a completed service request:

```text
request_id != null
```

we can later display:

> **Verified experience**

This is much stronger than simply allowing unrestricted reviews.

---

# 57. Review Status

```text
pending
published
hidden
removed
flagged
```

---

# 58. Reputation

We should **not create a complicated reputation algorithm in MVP**.

But the database should be capable of supporting it.

---

# 59. `user_reputation`

### Columns

```text
user_id
reputation_score
successful_conversations
completed_requests
reviews_received
reports_received
last_calculated_at
```

However:

**Do not make this the source of truth.**

It is a calculated summary.

---

# 60. Reputation Philosophy

Reputation should eventually consider:

```text
Positive reviews
Successful conversations
Completed requests
Response quality
Reports
Cancellations
Spam
Account age
```

Never simply:

```text
number_of_reviews = reputation
```

---

# 61. Business Reputation

Businesses also need a summary.

---

# 62. `business_reputation`

### Columns

```text
business_id
average_rating
review_count
response_rate
response_time_seconds
completed_requests
calculated_at
```

This can initially be maintained using database queries or scheduled jobs.

---

# 63. Notifications

---

# 64. `notifications`

### Columns

```text
id
user_id
type
title
body
data
read_at
created_at
```

Types:

```text
new_message
request_received
request_updated
review_received
business_update
system
```

---

# 65. Analytics Events

Do not build a huge analytics system in MVP.

But event tracking is valuable.

---

# 66. `analytics_events`

### Columns

```text
id
user_id
session_id
event_name
entity_type
entity_id
metadata
created_at
```

Examples:

```text
business_viewed
search_performed
category_selected
conversation_started
voice_started
request_created
review_submitted
```

---

# 67. Session ID

Anonymous visitors should still be measurable.

Use a random session identifier.

Do not store unnecessary personal information.

---

# 68. Reports

Moderation requires reports.

---

# 69. `reports`

### Columns

```text
id
reporter_id
target_type
target_id
reason
description
status
resolved_by
resolved_at
created_at
```

Reasons:

```text
spam
harassment
fraud
misinformation
inappropriate_content
fake_business
other
```

---

# 70. Admin Audit Log

For important administrative actions.

---

# 71. `audit_logs`

### Columns

```text
id
actor_id
action
entity_type
entity_id
metadata
created_at
```

Example:

```text
admin
business.suspended
business
123
```

---

# 72. Database Relationship Map

```text
profiles
 │
 ├───────────────┐
 │               │
 ▼               ▼
business_members  saved_businesses
 │                       │
 ▼                       ▼
businesses ◄──────────── users
 │
 ├── business_categories ── categories
 │
 ├── business_locations
 │
 ├── business_services
 │
 ├── business_hours
 │
 ├── business_faqs
 │
 ├── business_knowledge
 │
 ├── business_ai_settings
 │
 ├── business_reputation
 │
 ├── conversations
 │       │
 │       ├── conversation_participants
 │       ├── messages
 │       └── voice_sessions
 │
 ├── service_requests
 │
 └── reviews
```

---

# 73. Foreign-Key Rules

Core relationships should use foreign keys.

Examples:

```text
businesses.created_by
    → profiles.id
```

```text
business_members.business_id
    → businesses.id
```

```text
business_members.user_id
    → profiles.id
```

```text
business_services.business_id
    → businesses.id
```

```text
reviews.business_id
    → businesses.id
```

---

# 74. Delete Strategy

Be careful with cascading deletes.

### Generally:

Business deletion should **not immediately destroy historical conversations, requests and reviews**.

Use soft deletion/status where appropriate.

For example:

```text
business.status = closed
```

rather than deleting the row.

---

# 75. Timestamps

Every major table should contain:

```text
created_at
updated_at
```

Use database defaults.

---

# 76. UUIDs

Use UUID primary keys.

Advantages:

* distributed-safe
* difficult to enumerate
* works well with Supabase
* good for future scaling

---

# 77. Slugs

Public resources should use slugs.

Example:

```text
/businesses/maya-beauty-studio
```

not:

```text
/businesses/38294729
```

But the UUID remains the database identity.

---

# 78. Indexing Strategy

MVP indexes:

```text
businesses.slug
businesses.status
businesses.verification_status

categories.slug
categories.parent_id

business_categories.business_id
business_categories.category_id

business_services.business_id
business_services.status

business_locations.business_id
business_locations.city
business_locations.province

conversations.business_id
conversations.customer_id
conversations.last_message_at

messages.conversation_id
messages.created_at

service_requests.business_id
service_requests.customer_id
service_requests.status

reviews.business_id
reviews.customer_id

notifications.user_id
notifications.read_at
```

---

# 79. Search

Do **not** introduce Elasticsearch/Meilisearch/Typesense in MVP.

Start with PostgreSQL.

Use:

* PostgreSQL full-text search
* trigram search where appropriate
* indexes

Later, if discovery becomes large enough, introduce a dedicated search engine.

---

# 80. Location Search

For MVP, PostgreSQL coordinates can support basic location functionality.

Eventually consider:

**PostGIS**

for:

* radius searches
* distance sorting
* geographic boundaries
* advanced location filtering

Do not add unnecessary infrastructure until needed.

---

# 81. Row-Level Security

Because Supabase is involved, RLS is critical.

Users should **never automatically receive access to every database row**.

---

# 82. Customer RLS

Customers can:

### Read

* public business profiles
* active services
* published reviews
* active categories

### Create

* conversations
* messages
* requests
* reviews
* saved businesses

### Read own

* conversations
* requests
* reviews
* saved businesses
* notifications

---

# 83. Business RLS

Business owners can access data belonging to businesses where they are members.

For example:

```text
business_members.user_id = auth.uid()
```

Then they can manage:

* business profile
* services
* hours
* FAQs
* knowledge
* conversations
* requests

---

# 84. Business Conversation Security

A business owner should only access conversations where:

```text
conversation.business_id
```

belongs to one of their businesses.

Never expose conversations based solely on:

```text
user_id
```

---

# 85. Admin Access

Admins can access everything necessary for moderation.

But admin actions should be logged.

---

# 86. Public Business Data

The public should be able to see:

* business name
* description
* categories
* services
* hours
* location
* images
* published reviews
* verification status

The public should **not** see:

* internal notes
* AI configuration
* private business data
* customer conversations
* customer contact information
* internal analytics

---

# 87. Customer Privacy

Never expose a customer's email or phone number simply because they interacted with a business.

The platform should act as the communication boundary.

---

# 88. AI Data Boundary

The AI application layer should retrieve only the information necessary for the conversation.

Example:

Customer asks:

> "Are you open Saturday?"

The AI only needs:

```text
business_hours
```

It does not need:

```text
customer profile
business financial data
internal analytics
```

---

# 89. AI Context Pipeline

```text
User question
      ↓
Identify business
      ↓
Retrieve relevant business data
      ↓
Build minimal context
      ↓
LLM
      ↓
Response
```

This is important for privacy and cost.

---

# 90. External LLM Data

The database architecture must **not assume that an LLM provider receives the entire database**.

Instead:

```text
PostgreSQL
   ↓
Relevant records
   ↓
Application context builder
   ↓
LLM request
```

Only necessary context should leave the application.

---

# 91. Voice Architecture Relationship

Voice doesn't require a separate user database.

```text
conversation
      │
      └── voice_session
```

LiveKit handles real-time communication.

Our database stores metadata.

---

# 92. MVP Voice Data

Store:

```text
conversation_id
provider
room_id
status
start time
end time
duration
```

Do not store audio.

---

# 93. Future Voice Data

Post-MVP may add:

```text
transcription_available
transcription_id
language
quality_score
```

But only if there is a legitimate product requirement.

---

# 94. Seed Categories

The category system should be seeded from day one.

Initial categories can include:

### Beauty & Personal Care

* Hair Salon
* Barber
* Nail Salon
* Spa
* Makeup Artist
* Massage

### Health & Wellness

* Fitness
* Yoga
* Physiotherapy
* Wellness

### Home Services

* Cleaning
* Plumbing
* Electrical
* Landscaping
* Moving
* Handyman

### Automotive

* Auto Repair
* Car Wash
* Detailing
* Tire Service

### Professional Services

* Accounting
* Legal
* Consulting
* Marketing
* Photography

### Education

* Tutoring
* Music Lessons
* Language Lessons
* Professional Training

### Events

* Catering
* Event Planning
* Photography
* DJ
* Decorations

This list can expand without changing the schema.

---

# 95. Category Administration

Categories should be database-driven.

Admin should eventually be able to:

```text
Create category
Edit category
Deactivate category
Reorder category
Create child category
```

No deployment should be required simply to change a category name.

---

# 96. Database Migration Order

Build migrations in this order:

### Migration 001

Extensions + utility functions

### Migration 002

Enums

### Migration 003

Profiles

### Migration 004

Businesses + business members

### Migration 005

Categories

### Migration 006

Locations

### Migration 007

Services

### Migration 008

Hours

### Migration 009

FAQs + knowledge

### Migration 010

AI settings

### Migration 011

Conversations

### Migration 012

Participants + messages

### Migration 013

Voice sessions

### Migration 014

Service requests

### Migration 015

Reviews

### Migration 016

Saved businesses

### Migration 017

Reputation

### Migration 018

Notifications

### Migration 019

Analytics

### Migration 020

Reports + audit logs

### Migration 021

Indexes

### Migration 022

RLS policies

### Migration 023

Seed data

---

# 97. What Should NOT Be Built in MVP

Do not create complex tables for:

* payments
* subscriptions
* commissions
* coupons
* loyalty
* marketplace settlements
* advanced booking
* multi-provider scheduling
* AI training
* vector databases
* recommendation engines
* external search infrastructure

unless the MVP actually requires them.

---

# 98. Why We Still Prepare for Them

The schema should leave room for:

```text
business
    ↓
service
    ↓
request
    ↓
booking
    ↓
payment
```

But we don't need to build:

```text
payment
booking
subscription
commission
```

on day one.

---

# 99. Post-MVP Tables

When required, add:

```text
appointments
availability_rules
payments
orders
subscriptions
business_plans
commissions
coupons
promotions
payouts
```

These should be separate modules.

---

# 100. Future Multi-Location

Already supported through:

```text
business_locations
```

Eventually services can be location-specific:

```text
business_service_locations
```

Don't create this in MVP unless businesses actually require it.

---

# 101. Future Staff Scheduling

Eventually:

```text
business_staff
staff_services
staff_availability
appointments
```

Again, this is post-MVP.

---

# 102. Future Marketplace

If One Place evolves into actual transaction infrastructure:

```text
Customer
   ↓
Request
   ↓
Appointment
   ↓
Payment
   ↓
Business
   ↓
Payout
```

The existing request architecture gives us the foundation.

---

# 103. Future Recommendation Engine

The existing events allow:

```text
search
business view
category
conversation
request
review
```

to become recommendation signals later.

We don't need machine learning now.

---

# 104. Reputation Evolution

MVP:

```text
rating
reviews
completed requests
reports
```

Post-MVP:

```text
response rate
response time
successful conversations
cancellation rate
verified interactions
customer satisfaction
```

Eventually:

```text
reputation_score
```

can become a weighted calculation.

---

# 105. Important Rule About Reputation

Never allow the reputation system to become a black box.

A business should eventually be able to understand:

> **Why is my reputation score what it is?**

This protects trust in the marketplace.

---

# 106. Database-Level Constraints

Important constraints include:

### Rating

```text
rating >= 1
rating <= 5
```

### Price

```text
price_min >= 0
price_max >= 0
```

### Email

Handled primarily through Supabase Auth.

### Slug

Unique.

### Business membership

Unique:

```text
business_id + user_id
```

### Saved business

Unique:

```text
user_id + business_id
```

---

# 107. Review Constraint

Eventually enforce:

```text
one customer → one review per request
```

This prevents review spam.

---

# 108. Conversation Constraint

A conversation should always belong to:

```text
business
```

and normally have:

```text
customer
```

This keeps business context explicit.

---

# 109. Auditability

Important state changes should produce audit records.

Examples:

```text
business_verified
business_suspended
review_removed
user_suspended
request_cancelled
```

This becomes increasingly important as One Place grows.

---

# 110. Data Retention

MVP policy should distinguish:

### Active operational data

Keep normally.

### Historical business interactions

Retain according to privacy policy and legal requirements.

### Voice recordings

**Do not store by default.**

### Deleted accounts

Apply the platform's documented deletion/anonymization policy.

---

# 111. Soft Deletion

For important entities, prefer status fields.

Instead of:

```sql
DELETE FROM businesses
```

use:

```text
status = closed
```

This preserves historical relationships.

---

# 112. Data Ownership

The platform owns the application infrastructure.

Businesses control the information they provide about their business.

Customers control their personal information subject to platform/legal requirements.

The architecture should support:

* data export
* account deletion
* privacy requests
* correction of personal data

---

# 113. Performance Principle

Do not optimize prematurely.

Start with:

```text
Supabase PostgreSQL
        +
proper indexes
        +
server-side queries
```

This can support a surprisingly large MVP.

---

# 114. Caching

MVP:

Use Next.js/server caching where appropriate.

Cache:

* categories
* public business information
* static content

Do not cache:

* private conversations
* sensitive requests
* user-specific information without proper controls

---

# 115. Database Access Pattern

The frontend should **not directly perform arbitrary privileged database operations**.

Use:

```text
Frontend
   ↓
Next.js Server Action / Route Handler
   ↓
Authorization
   ↓
Supabase
   ↓
PostgreSQL
```

For public, safe reads, direct Supabase access can be considered where RLS is correctly configured.

---

# 116. Server-Side Business Logic

Examples:

### Create request

```text
Validate customer
↓
Validate business
↓
Validate service
↓
Create request
↓
Notify business
```

### Start conversation

```text
Validate business
↓
Create conversation
↓
Add customer
↓
Create system message
```

### Submit review

```text
Validate customer
↓
Validate request
↓
Validate completed status
↓
Create review
↓
Update reputation summary
```

---

# 117. TypeScript Type Generation

Do not manually maintain duplicate database interfaces wherever possible.

Use Supabase-generated types.

Conceptually:

```text
PostgreSQL
    ↓
Supabase schema
    ↓
Generated TypeScript types
    ↓
Next.js
```

This reduces database/frontend mismatch.

---

# 118. Database Environment

Development:

```text
Local Supabase / development project
```

Staging:

```text
Separate Supabase project
```

Production:

```text
Production Supabase project
```

Never develop directly against production.

---

# 119. Environment Separation

At minimum:

```text
.env.local
.env.staging
.env.production
```

Secrets must never be committed to Git.

---

# 120. Final MVP Database

The MVP core is approximately:

```text
profiles
businesses
business_members
categories
business_categories
business_locations
business_services
business_hours
business_faqs
business_knowledge
business_ai_settings
conversations
conversation_participants
messages
voice_sessions
service_requests
reviews
saved_businesses
notifications
```

With:

```text
reputation
analytics
reports
audit_logs
```

supporting the platform.

---

# 121. Final Relationship Diagram

```text
                           ┌──────────────┐
                           │  auth.users  │
                           └──────┬───────┘
                                  │
                                  ▼
                           ┌──────────────┐
                           │   profiles   │
                           └──────┬───────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
             business_members             saved_businesses
                    │                           │
                    ▼                           │
              ┌───────────┐                     │
              │ businesses │◄──────────────────┘
              └─────┬─────┘
                    │
       ┌────────────┼─────────────┬───────────────┐
       ▼            ▼             ▼               ▼
 categories     locations      services         hours
       │
       ▼
business_categories

                    │
          ┌─────────┼────────────┐
          ▼         ▼            ▼
        FAQs    knowledge     AI settings

                    │
                    ▼
             conversations
                    │
          ┌─────────┼─────────┐
          ▼         ▼         ▼
     participants messages voice_sessions

                    │
                    ▼
             service_requests
                    │
                    ▼
                 reviews

```

---

# 122. The Database's Core Philosophy

The entire One Place database should ultimately support one simple chain:

> **Discover → Ask → Talk → Request → Experience → Review**

Everything else is infrastructure around that loop.

```text
Business
   ↓
Discovery
   ↓
Conversation
   ↓
Voice / Chat
   ↓
Request
   ↓
Service
   ↓
Review
   ↓
Reputation
   ↓
Better discovery
```

That is the foundation we should build around.

