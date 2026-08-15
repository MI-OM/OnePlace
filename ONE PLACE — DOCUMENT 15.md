# DOCUMENT 15 — OBSERVABILITY, ANALYTICS, AUDIT & OPERATIONAL MONITORING SPECIFICATION

**Product:** One Place
**Document:** 15
**Purpose:** Define how One Place measures system health, product usage, business activity, AI/agent performance, conversations, failures, and security-relevant events.

This document follows the previously established architecture: **Next.js + Supabase**, with the application designed to remain simple in the MVP and scale incrementally.

---

## 1. Purpose

One Place will generate a significant amount of operational information:

* customers searching for services;
* customers viewing businesses;
* customers starting conversations;
* AI agents answering questions;
* businesses receiving enquiries;
* customers requesting human assistance;
* bookings or enquiries being completed;
* conversations ending without resolution;
* businesses changing their information;
* administrators managing the platform;
* system errors and failed operations.

The platform therefore needs observability from the beginning.

However:

> **Analytics must not become a second product.**

The MVP should collect only information that helps answer important business and engineering questions.

---

# 2. Observability Principles

One Place follows six principles.

### 2.1 Collect what is useful

Do not collect data simply because it is technically possible.

### 2.2 Separate analytics from application data

Operational records and product analytics should not become unnecessarily intertwined.

### 2.3 Minimize personal data

Analytics should use identifiers rather than unnecessarily storing personal information.

### 2.4 Never store conversation audio by default

Voice is transient.

The system should not automatically retain voice recordings.

### 2.5 Business owners should see useful analytics

Analytics should help businesses understand:

> "What are customers asking me?"

rather than:

> "Here is a giant dashboard full of numbers."

### 2.6 Administrators need system-level visibility

The platform team must be able to identify:

* failures;
* abuse;
* performance degradation;
* AI problems;
* database problems;
* unusual activity.

---

# 3. Analytics Categories

One Place has five major analytics layers.

| Layer                  | Purpose                                 |
| ---------------------- | --------------------------------------- |
| Product Analytics      | Understand customer behaviour           |
| Business Analytics     | Help businesses understand demand       |
| AI Analytics           | Measure agent performance               |
| Operational Monitoring | Keep the platform running               |
| Security/Audit         | Track sensitive administrative activity |

---

# 4. MVP Analytics

The MVP should track the following.

### Customer events

* account created;
* search performed;
* category selected;
* business viewed;
* service viewed;
* conversation started;
* conversation ended;
* human requested;
* enquiry submitted;
* booking request submitted;
* feedback submitted.

### Business events

* business created;
* onboarding completed;
* profile published;
* service created;
* service updated;
* availability updated;
* conversation received;
* enquiry received;
* enquiry responded to.

### System events

* authentication failure;
* API failure;
* database failure;
* AI request failure;
* voice connection failure;
* unexpected application error.

---

# 5. Event Naming Convention

Events use:

```text
object.action
```

Examples:

```text
user.created
search.performed
business.viewed
service.viewed
conversation.started
conversation.ended
human.requested
enquiry.created
booking.requested
feedback.submitted
```

This keeps analytics predictable.

---

# 6. Event Structure

Every analytics event should conceptually contain:

```text
event_id
event_name
user_id
business_id
session_id
conversation_id
timestamp
metadata
```

Not every field will be populated for every event.

---

# 7. Example Event

A customer searches for a hair salon.

```json
{
  "event_name": "search.performed",
  "user_id": "user_id",
  "session_id": "session_id",
  "timestamp": "2026-08-15T14:00:00Z",
  "metadata": {
    "query": "hair salon",
    "category": "beauty",
    "location": "St. John's"
  }
}
```

The system should avoid storing unnecessary sensitive information.

---

# 8. Search Analytics

Search is one of the most important analytics areas.

Track:

```text
search.performed
```

with:

* search term;
* category;
* location;
* number of results;
* selected result;
* session identifier.

This allows One Place to determine:

> What are people actually looking for?

---

# 9. Zero-Result Searches

A particularly important metric is:

```text
search.zero_results
```

Example:

100 users search:

> "mobile dog grooming"

but there are no providers.

That is valuable marketplace intelligence.

It may indicate an opportunity to recruit businesses into that category.

---

# 10. Business Discovery Funnel

One Place should measure:

```text
Search
 ↓
Results
 ↓
Business View
 ↓
Service View
 ↓
Conversation
 ↓
Enquiry
 ↓
Booking
```

The platform can therefore calculate conversion between each stage.

---

# 11. Important Marketplace Metrics

### Discovery rate

```text
business_views / searches
```

### Conversation rate

```text
conversations / business_views
```

### Enquiry rate

```text
enquiries / conversations
```

### Booking conversion

```text
bookings / enquiries
```

These become important post-MVP.

---

# 12. Business Analytics Dashboard

Businesses should eventually see a simple dashboard.

### Header

**"Your business activity"**

Supporting copy:

> "See what customers are looking for and how they're discovering you."

---

## 12.1 Dashboard Cards

### Profile views

**"Profile views"**

> "How many people viewed your business."

### Conversations

**"Customer conversations"**

> "How many customers started a conversation with you."

### Enquiries

**"Enquiries"**

> "Customers who asked about your services."

### Bookings

**"Bookings"**

> "Bookings or booking requests received."

---

# 13. Customer Demand Section

Heading:

**"What customers are asking about"**

Copy:

> "Understand the services customers are most interested in."

Examples:

```text
Hair colouring        42 enquiries
Braiding              31 enquiries
Hair treatment        18 enquiries
```

---

# 14. AI Analytics

AI must be treated as a measurable component.

Track:

```text
ai.requested
ai.responded
ai.failed
ai.escalated
ai.human_requested
```

---

# 15. AI Resolution Rate

A key metric:

```text
AI Resolution Rate =
conversations resolved without human intervention
/
total AI conversations
```

However, this metric must be interpreted carefully.

A high resolution rate is not automatically good.

For example:

If customers stop responding because the AI was frustrating, the system might incorrectly interpret the conversation as successful.

Therefore, resolution should incorporate additional signals.

---

# 16. AI Quality Signals

Measure:

* customer feedback;
* human escalation;
* conversation abandonment;
* repeated questions;
* unanswered questions;
* incorrect information reports.

---

# 17. AI "I Don't Know" Events

The AI should explicitly record situations where it cannot confidently answer.

Event:

```text
ai.unknown
```

Example:

> Customer: "Do you offer wedding makeup packages?"

If the business knowledge base doesn't contain the answer:

```text
ai.unknown
```

This becomes a business improvement signal.

---

# 18. Knowledge Gap Analytics

Businesses should eventually see:

**"Questions your assistant couldn't answer"**

Example:

> "Do you offer Sunday appointments?"

> "How much does bridal makeup cost?"

> "Can I bring my own products?"

The business can then update its information.

This creates a powerful feedback loop:

```text
Customer question
       ↓
AI cannot answer
       ↓
Question recorded
       ↓
Business sees question
       ↓
Business updates information
       ↓
AI answers correctly next time
```

---

# 19. Human Handoff Analytics

Track:

```text
human.requested
human.connected
human.unavailable
human.accepted
human.declined
```

Important metric:

### Human escalation rate

```text
human_requested / conversations
```

---

# 20. Human Availability

The system should distinguish between:

### Business available

A human is currently available.

### Business unavailable

No human is available.

### Business offline

The business has deliberately disabled human conversations.

---

# 21. Human Handoff Copy

When available:

> **Talk to someone**

> "Want to speak with a member of the business? We'll connect you if someone is available."

When unavailable:

> **No one is available right now**

> "You can leave an enquiry and the business can respond when they're available."

---

# 22. Voice Analytics

Voice should generate operational metadata without storing conversations unnecessarily.

Track:

```text
voice.session.started
voice.session.connected
voice.session.ended
voice.connection.failed
voice.human_requested
```

---

# 23. Voice Metrics

Track:

* connection success rate;
* average session duration;
* failed connections;
* abandoned sessions;
* human handoffs;
* latency;
* interruptions;
* session termination reason.

---

# 24. Voice Privacy

Default rule:

> **One Place does not record or retain voice conversations.**

Unless a future product requirement explicitly introduces recording with appropriate consent and legal controls.

---

# 25. Conversation Duration

Store:

```text
started_at
ended_at
duration_seconds
```

Do not need to store the audio itself.

---

# 26. Operational Monitoring

Operational monitoring answers:

> "Is One Place working?"

Track:

### Application

* request latency;
* error rate;
* HTTP failures;
* server exceptions.

### Database

* query latency;
* connection errors;
* failed transactions;
* database availability.

### Authentication

* failed login attempts;
* authentication failures;
* suspicious authentication patterns.

### AI

* request failures;
* latency;
* provider errors;
* token/cost metrics where available.

---

# 27. Error Classification

Errors should be categorized.

```text
AUTHENTICATION_ERROR
AUTHORIZATION_ERROR
VALIDATION_ERROR
NOT_FOUND
RATE_LIMITED
DATABASE_ERROR
AI_ERROR
VOICE_ERROR
INTERNAL_ERROR
```

This allows developers to diagnose problems quickly.

---

# 28. Error Handling UX

Never expose technical errors to customers.

Bad:

> `500 INTERNAL_SERVER_ERROR`

Good:

> **Something went wrong**

> "We couldn't complete that request. Please try again."

Button:

**Try again**

---

# 29. Administrator Monitoring

The platform administrator needs visibility into:

* active users;
* active businesses;
* conversations;
* AI usage;
* system errors;
* suspicious activity;
* business onboarding;
* service categories;
* marketplace gaps.

---

# 30. Audit Logging

Audit logs are different from analytics.

Analytics asks:

> "What are users doing?"

Audit logging asks:

> "Who changed something important?"

---

# 31. Actions That Require Audit Logs

Examples:

```text
business.created
business.deleted
business.suspended
business.approved
business.updated
user.suspended
user.role_changed
service.deleted
knowledge_base.updated
admin.login
admin.permission_changed
```

---

# 32. Audit Log Structure

Conceptually:

```text
audit_id
actor_id
actor_type
action
resource_type
resource_id
timestamp
metadata
ip_address
user_agent
```

Sensitive information should be minimized.

---

# 33. Audit Log Example

```text
Actor:
Business Administrator

Action:
service.updated

Resource:
Service #1234

Time:
2026-08-15 14:20

Change:
Price updated
```

---

# 34. Retention

Not every event needs to be retained forever.

Recommended approach:

### Product analytics

Retain according to the analytics/business requirements.

### Operational logs

Shorter retention.

### Security/audit logs

Longer retention according to security and legal requirements.

The exact retention period should be configurable.

---

# 35. Database Tables

The previously defined core database should be supplemented with operational tables where appropriate.

Recommended:

```text
analytics_events
audit_logs
system_errors
conversation_metrics
```

---

# 36. `analytics_events`

Conceptual structure:

```text
id
event_name
user_id
business_id
session_id
conversation_id
metadata
created_at
```

Indexes:

```text
event_name
user_id
business_id
conversation_id
created_at
```

---

# 37. `audit_logs`

```text
id
actor_id
actor_type
action
resource_type
resource_id
metadata
created_at
```

Indexes:

```text
actor_id
resource_type
resource_id
action
created_at
```

---

# 38. `system_errors`

```text
id
error_code
severity
message
request_id
user_id
business_id
metadata
created_at
resolved_at
```

Severity:

```text
INFO
WARNING
ERROR
CRITICAL
```

---

# 39. Request IDs

Every backend operation should ideally have a request identifier.

Example:

```text
req_8f72a9...
```

If a customer reports:

> "The assistant stopped working."

the engineering team can trace the request through the system.

---

# 40. Correlation IDs

For complex operations:

```text
request_id
   ↓
API request
   ↓
database operation
   ↓
AI request
   ↓
conversation
```

This makes debugging dramatically easier.

---

# 41. Performance Targets

MVP targets should be practical rather than excessive.

### Standard API requests

Target:

```text
p95 < 500ms
```

for ordinary database-backed operations.

### Search

Target:

```text
p95 < 700ms
```

### AI

AI latency is inherently variable and should therefore have separate monitoring.

### Voice

Focus initially on:

> successful connection + acceptable conversational latency

rather than an arbitrary API latency number.

---

# 42. Availability

The MVP does not need an elaborate multi-region architecture.

Initial goal:

> Keep the platform reliably available using managed infrastructure.

Supabase and the chosen hosting infrastructure handle much of the underlying availability burden.

---

# 43. Cost Monitoring

Because One Place is intentionally cost-conscious, costs must be monitored.

Track:

```text
AI requests
AI token usage
voice minutes
database usage
storage
bandwidth
authentication activity
```

---

# 44. AI Cost Protection

The system should have configurable limits.

Examples:

```text
maximum AI requests per conversation
maximum conversation duration
maximum daily AI usage per business
```

This protects against:

* accidental runaway usage;
* abuse;
* automated attacks;
* unexpected bills.

---

# 45. Rate Limiting

Rate limits should exist at multiple levels.

### Anonymous user

Limited requests.

### Authenticated customer

Higher limit.

### Business

Higher operational limit.

### Administrator

Administrative limits.

---

# 46. Abuse Detection

Monitor unusual patterns such as:

```text
hundreds of searches/minute
hundreds of conversations
rapid account creation
repeated failed authentication
AI request flooding
```

The objective is not surveillance.

The objective is protecting the platform and its users.

---

# 47. Dashboard Architecture

The MVP does not require a separate analytics application.

Use:

```text
Next.js
   ↓
Supabase
   ↓
analytics_events
```

The dashboard queries aggregated information.

---

# 48. Avoid Expensive Queries

Do not repeatedly calculate huge datasets in real time.

As usage grows, introduce:

```text
daily_metrics
business_metrics
category_metrics
```

These can be generated periodically.

---

# 49. Aggregated Metrics

Example:

```text
business_daily_metrics

business_id
date
profile_views
conversations
enquiries
bookings
human_handoffs
ai_resolutions
```

This makes dashboards substantially cheaper and faster.

---

# 50. Marketplace Intelligence

One Place should eventually understand:

### Demand

What customers want.

### Supply

What businesses provide.

### Gap

What customers want but businesses don't currently provide.

For example:

```text
Demand:
Dog grooming — 1,240 searches

Available providers:
3

Conversation conversion:
High
```

This is valuable marketplace intelligence.

---

# 51. Category Analytics

Track:

```text
category_views
category_searches
business_count
conversation_count
enquiry_count
booking_count
```

This helps determine which categories deserve expansion.

---

# 52. Geographic Analytics

Where appropriate, analyze:

```text
city
region
postal-code-level aggregation
```

Avoid unnecessarily storing precise location.

The purpose is:

> "Where is demand coming from?"

not:

> "Where exactly is this person?"

---

# 53. Privacy-Preserving Analytics

Analytics should use:

```text
user_id
session_id
business_id
```

instead of repeatedly storing:

```text
name
email
phone
```

in event metadata.

---

# 54. Customer Feedback

After a conversation:

### Question

**"Was this helpful?"**

Buttons:

**Yes**

**No**

If "No":

> **What went wrong?**

Options:

* "It didn't understand me"
* "The information wasn't correct"
* "I need to speak to someone"
* "Something else"

This provides extremely valuable AI training/evaluation data without requiring formal model training.

---

# 55. Conversation Feedback

Store:

```text
conversation_id
rating
reason
created_at
```

Do not automatically expose private feedback to other customers.

---

# 56. Business Reputation

The analytics system should eventually contribute to reputation.

Possible signals:

```text
customer ratings
response rate
response time
completed bookings
cancellations
complaints
verified business status
```

However:

> Reputation must never be calculated purely from volume.

A business with 10,000 conversations should not automatically outrank a business with 100 excellent conversations.

---

# 57. MVP Reputation

Keep it simple.

Initially:

* verified business;
* customer rating;
* review count;
* completed activity.

Avoid building an elaborate reputation algorithm in MVP.

---

# 58. Post-MVP Reputation

Later:

```text
Business Reputation Score
```

could incorporate:

```text
customer satisfaction
+
response reliability
+
information accuracy
+
booking completion
+
verified status
-
complaints
-
cancellations
```

Weights should be carefully designed.

---

# 59. Analytics Copy

### Dashboard empty state

**"Your activity will appear here"**

> "As customers discover your business and start conversations, you'll see the activity here."

### No conversations

**"No conversations yet"**

> "When customers talk to your assistant, their conversations will appear here."

### No enquiries

**"No enquiries yet"**

> "Customer enquiries will appear here when people reach out about your services."

---

# 60. Error Dashboard Copy

**"Something needs attention"**

> "We've detected an issue affecting part of the platform."

Status:

**Investigating**

or

**Resolved**

---

# 61. Admin Analytics Copy

### Page title

**Platform overview**

Subtitle:

> "See how One Place is being used across customers, businesses and conversations."

Cards:

* Active customers
* Active businesses
* Conversations
* Enquiries
* Bookings
* AI conversations

---

# 62. Business Analytics Copy

Page:

**Insights**

Subtitle:

> "Understand what your customers need and how they're finding you."

Sections:

```text
Your activity
Customer questions
Popular services
Conversation outcomes
```

---

# 63. AI Insight Copy

**"Questions your assistant couldn't answer"**

> "These questions may help you improve your business information."

Button:

**Update business information**

This turns analytics into an actionable workflow.

---

# 64. Operational Architecture

The conceptual flow is:

```text
                    ┌───────────────┐
                    │    Customer   │
                    └───────┬───────┘
                            │
                            ▼
                     ┌────────────┐
                     │  Next.js   │
                     └─────┬──────┘
                           │
              ┌────────────┼─────────────┐
              │            │             │
              ▼            ▼             ▼
          Business      Conversation    Search
            Data           Data          Data
              │            │             │
              └────────────┼─────────────┘
                           ▼
                  ┌────────────────┐
                  │    Supabase    │
                  └───────┬────────┘
                          │
            ┌─────────────┼─────────────┐
            ▼             ▼             ▼
      Analytics       Audit Logs    Error Logs
```

---

# 65. Development Rule

Every significant feature developed after this document should answer four questions:

### 1. What happens?

Functional behaviour.

### 2. What is stored?

Database state.

### 3. What is measured?

Analytics event.

### 4. What happens if it fails?

Error handling.

This becomes a standard engineering rule for One Place.

---

# 66. Feature Definition Template

Every future feature specification should contain:

```text
Feature name
Purpose
User story
Entry point
UI
Copy
Validation
Business logic
Database changes
API requirements
Analytics events
Security requirements
Failure states
Empty states
Success states
Audit requirements
Performance requirements
Testing requirements
```

This will significantly speed development.

---

# 67. MVP Implementation Priority

### Must have

* analytics events;
* system error logging;
* audit logging for administrative actions;
* basic business metrics;
* conversation metrics;
* AI usage metrics;
* basic cost monitoring.

### Should have

* business insights dashboard;
* zero-result search reporting;
* AI unanswered-question reporting.

### Later

* advanced marketplace intelligence;
* predictive analytics;
* sophisticated reputation scoring;
* automated business recommendations.

---

# 68. What We Deliberately Do NOT Build

The MVP will **not** include:

* a separate analytics microservice;
* a data warehouse;
* Kafka;
* event streaming infrastructure;
* complicated ETL pipelines;
* machine-learning analytics;
* custom observability infrastructure;
* custom logging infrastructure.

That would violate the fundamental One Place principle:

> **Build the simplest system that can support the business.**

---

# 69. Final Architecture Decision

For MVP:

```text
Next.js
   +
Supabase
   +
Supabase Database
   +
Supabase Auth
   +
Simple analytics/event tables
   +
Application logging
```

No additional analytics backend is required.

As One Place grows:

```text
Next.js
       │
       ▼
Application
       │
       ├── PostgreSQL
       ├── Analytics
       ├── Audit
       ├── AI
       └── Voice
                │
                ▼
        Aggregated metrics
                │
                ▼
        Business intelligence
```

---

# 70. Definition of Done

Document 15 is implemented when:

* [ ] Core product events are defined.
* [ ] Analytics event naming is standardized.
* [ ] `analytics_events` exists.
* [ ] `audit_logs` exists.
* [ ] `system_errors` exists.
* [ ] Request IDs are implemented.
* [ ] Conversation metrics are captured.
* [ ] AI metrics are captured.
* [ ] Voice session metrics are captured.
* [ ] Business dashboard metrics are defined.
* [ ] Cost monitoring is defined.
* [ ] Rate limiting is defined.
* [ ] Security-relevant actions are audited.
* [ ] Error UX is defined.
* [ ] Privacy rules are enforced.
* [ ] MVP analytics remain intentionally lightweight.

---

## Document 15 conclusion

This document closes an important gap in the engineering specification.
