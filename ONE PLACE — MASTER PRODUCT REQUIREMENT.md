# ONE PLACE — MASTER PRODUCT REQUIREMENTS DOCUMENT

### Version 1.0 — MVP

---

# 1. Product Definition

**Product name:** One Place

**Product type:** Service discovery and intelligent customer communication platform.

**MVP platform:** Responsive web application.

**Primary market:** Local service businesses and their customers.

**Initial geographic focus:** Newfoundland and Labrador, Canada.

**Initial business categories:** Salons, spas, barbers, fitness/gym businesses, beauty professionals, wellness providers, cleaning services, repair/service businesses and similar appointment/information-driven businesses.

### One-sentence description

> **One Place helps people find local services, understand what businesses offer, and talk to them instantly through AI-powered chat or voice.**

The long-term vision is:

> **One Place becomes the place people go when they need a service — rather than searching across dozens of websites, social-media pages and phone numbers.**

---

# 2. The Problem

Today, discovering a local service often looks like:

```text
Google
   ↓
Website
   ↓
Instagram
   ↓
Facebook
   ↓
Phone number
   ↓
Call
   ↓
Wait
   ↓
Ask basic questions
   ↓
Maybe discover they don't provide the service
```

Businesses also repeatedly answer the same questions:

* What services do you offer?
* How much does it cost?
* Are you open today?
* Are you available tomorrow?
* Where are you located?
* Do you accept walk-ins?
* Do you have parking?
* How long does it take?
* Can I book?
* What is your cancellation policy?

One Place creates a common interface between the customer and service provider.

---

# 3. Product Philosophy

One Place should **not feel like another social network.**

It should not become:

* a feed
* a follower system
* an influencer platform
* a complicated marketplace
* a business CRM disguised as a consumer application

Instead:

> **Find → Understand → Ask → Request → Connect.**

The product should feel:

**Simple. Local. Human. Intelligent. Fast.**

---

# 4. Target Users

## 4.1 Customer

Someone looking for a service.

Example:

> "I need a barber near me tomorrow."

They should be able to:

1. Search.
2. Find businesses.
3. Understand their services.
4. Ask questions.
5. Talk through chat or voice.
6. Request a service.
7. Eventually book.
8. Leave a review.

---

## 4.2 Business Owner

A local service provider who wants:

* visibility
* customer discovery
* fewer repetitive calls
* automated answers
* customer communication
* requests
* eventually bookings and payments.

---

## 4.3 Business Staff

Employees who need to:

* respond to conversations
* manage requests
* update services
* manage availability

without necessarily having ownership privileges.

---

# 5. MVP Goal

The MVP does **not** attempt to solve everything.

Its job is to prove three things:

### Hypothesis 1

Customers want one place to discover local services.

### Hypothesis 2

Customers will use conversational interaction instead of manually navigating business websites.

### Hypothesis 3

Businesses see enough value in being represented on One Place to maintain their information and use the communication system.

---

# 6. MVP Core Loop

```text
CUSTOMER
   ↓
Discover
   ↓
Business
   ↓
Services
   ↓
Ask
   ↓
Chat / Voice
   ↓
Request
   ↓
Business
   ↓
Completion
   ↓
Review
```

That is the product's core loop.

---

# 7. MVP Features

## A. Landing Page

Customer sees:

**Headline**

> **Find the service you need. Ask anything.**

Supporting copy:

> Discover local businesses, explore their services, and get answers without making five different calls.

Primary CTA:

> **Find a service**

Secondary CTA:

> **List your business**

---

# 8. Search

Customers can search using:

### Category

> Hair Salon

### Service

> Braids

### Natural language

> "I need somewhere to get my hair done this Saturday."

MVP does not require an advanced AI search engine.

We begin with PostgreSQL search and structured categories.

AI-powered semantic discovery comes later.

---

# 9. Categories

Categories are centrally managed.

Businesses select categories during onboarding.

Customers can browse categories.

Example:

```text
Beauty & Personal Care
 ├── Hair
 ├── Barber
 ├── Nails
 ├── Makeup
 └── Spa

Health & Wellness
 ├── Fitness
 ├── Massage
 ├── Wellness
 └── Personal Training

Home Services
 ├── Cleaning
 ├── Repairs
 ├── Moving
 └── Maintenance
```

The database already supports hierarchical categories.

---

# 10. Business Profile

Every business receives a public profile.

### Sections

**Business name**

**Description**

**Location**

**Opening hours**

**Services**

**Pricing**

**About**

**Contact**

**Ask a question**

**Start a conversation**

**Voice**

**Reviews**

---

# 11. Business Profile Copy

### CTA

> **Ask about this business**

Secondary:

> **Talk to us**

For voice:

> **Start a voice conversation**

Supporting text:

> Get quick answers about services, pricing, availability and more.

---

# 12. Business Onboarding

The MVP onboarding should be deliberately short.

### Step 1

> **Tell us about your business**

Fields:

* Business name
* Category
* Description
* Location
* Contact information

### Step 2

> **What do you offer?**

Add services:

* Name
* Description
* Price
* Price type
* Duration

### Step 3

> **When are you available?**

Business hours.

### Step 4

> **Let customers ask questions**

AI configuration.

### Final screen

> **You're ready to be discovered.**

CTA:

> **View my business**

---

# 13. Business AI

The business owner should not have to understand AI.

Instead, they configure:

### Business description

> Tell customers about your business.

### Frequently asked questions

> Add information customers ask about often.

### Policies

> Add cancellation, payment, parking or other important information.

### AI tone

Options:

* Friendly
* Professional
* Casual

Default:

> **Friendly**

---

# 14. AI Principle

The AI must **never invent business information.**

For example, if the database says:

> Haircut — $35

the AI can answer:

> "A haircut is listed at $35."

But if the customer asks:

> "Do you offer student discounts?"

and no information exists:

The AI should say:

> **"I don't have information about a student discount yet. I can help you contact the business if you'd like."**

This principle is fundamental.

---

# 15. Chat

Chat is the primary conversational interface.

Customer opens:

> **What can we help you with?**

Suggested prompts:

> What services do you offer?

> How much does it cost?

> Are you open today?

> Do you have availability?

> I want to request a service.

The customer can also type freely.

---

# 16. Voice

MVP voice is **browser-based**.

No PSTN.

No business telephone number.

No external phone routing.

Architecture:

```text
Customer Browser
      ↓
One Place
      ↓
LiveKit
      ↓
AI Voice Agent
      ↓
One Place tools
      ↓
Supabase
```

The customer clicks:

> **Talk instead**

The browser requests permission for microphone access.

---

# 17. Voice Privacy

MVP:

**Voice conversations are not recorded by One Place.**

We store:

* conversation ID
* start time
* end time
* duration
* status
* technical metadata

We do not intentionally store the audio recording.

This should be reflected clearly in the privacy documentation.

---

# 18. Requests

The customer can turn a conversation into a structured request.

Example:

> "I'd like to get a haircut tomorrow afternoon."

The system creates:

```text
Service: Haircut
Date: Tomorrow
Time: Afternoon
Customer: Michael
Status: Pending
```

The business can then accept, decline or complete the request.

---

# 19. MVP Booking Decision

**Do not make complex booking infrastructure mandatory for MVP.**

We have designed the database so bookings can be introduced later.

MVP proves:

```text
Discovery
+
Conversation
+
Request
```

Post-MVP proves:

```text
Request
→
Availability
→
Booking
→
Calendar
```

This keeps the initial product substantially simpler.

---

# 20. Reviews

Customers can rate completed interactions.

Rating:

**1–5 stars**

Optional:

* title
* written review

Reviews appear on the business profile.

We should eventually require a legitimate completed interaction before allowing a review.

---

# 21. Favorites

Customers can save businesses.

CTA:

> **Save**

This is useful but should remain lightweight.

---

# 22. Business Dashboard

The business dashboard contains:

```text
Overview
Services
Availability
Conversations
Requests
AI
Profile
```

MVP analytics:

* profile views
* conversations
* voice conversations
* requests
* completed requests
* reviews

Don't build a massive analytics platform.

---

# 23. Customer Dashboard

```text
My conversations
My requests
Saved businesses
Profile
```

That's enough for MVP.

---

# 24. Admin

MVP admin needs only essential functionality:

* manage categories
* view businesses
* verify businesses
* suspend businesses
* moderate reviews
* inspect basic platform analytics

No giant administrative CMS.

---

# 25. MVP Technical Architecture

```text
                 ┌──────────────┐
                 │   Customer   │
                 │    Browser   │
                 └──────┬───────┘
                        │
                        ▼
                ┌───────────────┐
                │    Next.js    │
                │   App Router  │
                └───────┬───────┘
                        │
             ┌──────────┼──────────┐
             ▼          ▼          ▼
        Supabase      AI Layer   LiveKit
             │          │          │
             ▼          ▼          ▼
        PostgreSQL    LLM/API    Voice
             │
             ▼
          Storage
```

---

# 26. Why Next.js Instead of NestJS

For MVP:

**Next.js is the backend.**

We do **not** need NestJS initially.

Next.js can handle:

* server actions
* route handlers
* authentication integration
* database access
* business logic
* AI orchestration
* LiveKit token generation
* webhooks

Adding NestJS immediately would introduce another deployable system and another codebase without solving an immediate problem.

### Later

If One Place grows into:

```text
web
mobile
public API
partner integrations
large background processing
complex microservices
```

then we can extract backend services.

But:

> **Don't pay today's complexity cost for tomorrow's hypothetical scale.**

---

# 27. AI Architecture

The application owns the business logic.

The LLM provides reasoning/language.

```text
Customer
   ↓
Next.js
   ↓
AI Orchestrator
   ↓
LLM
   ↓
Tool
   ↓
Supabase
```

Tools:

```text
get_business_profile
get_services
get_service_details
get_business_hours
get_availability
get_business_knowledge
create_request
escalate_to_human
```

The model provider should be **abstracted**.

Therefore:

```text
AIService
   ↓
ModelProvider
   ├── OpenAI
   ├── Anthropic
   ├── Google
   └── Future local model
```

We don't hard-code One Place to one LLM vendor.

---

# 28. Data Privacy Principle

The MVP may use third-party AI APIs.

However:

**Do not send unnecessary data.**

The AI should receive only what is required:

```text
business context
+
relevant service information
+
current conversation
```

Not:

```text
entire database
customer's unrelated conversations
internal business records
unnecessary personal information
```

---

# 29. LiveKit Architecture

LiveKit is responsible for realtime voice transport.

It is **not** the business database.

It is **not** the business intelligence layer.

It is **not** the source of truth.

```text
One Place
   │
   ├── Supabase → data
   ├── LLM → reasoning
   └── LiveKit → realtime voice
```

This separation is important.

---

# 30. MVP Explicitly Excludes

We will **not** initially build:

* native mobile apps
* PSTN calling
* business phone numbers
* complex IVR
* payments
* subscriptions
* complex booking engine
* calendar integrations
* multi-location management
* marketplace payouts
* advanced recommendation engine
* vector database
* self-hosted LLM
* custom AI training
* social feed
* followers
* direct messaging between random customers
* complicated CRM

This is intentional.

---

# 31. MVP Success Metrics

The first question isn't:

> "How many users do we have?"

The first question is:

> **"Does this actually make finding and communicating with a service business easier?"**

Measure:

### Discovery

* searches
* business profile views
* service views

### Engagement

* conversations started
* voice sessions
* average conversation duration

### Conversion

* requests created
* requests completed

### Business value

* businesses onboarded
* active businesses
* repeat business usage

### Quality

* successful AI answers
* human escalations
* failed conversations
* reviews
* customer satisfaction

---

# 32. MVP North Star Metric

I would use:

> **Completed customer requests generated through One Place.**

Because:

```text
Search alone ≠ value

Conversation alone ≠ value

Request alone ≠ value

Completed service interaction = real value
```

---

# 33. Phase 1 Post-MVP

Once MVP proves demand:

### Customer

* advanced search
* better recommendations
* location-based discovery
* booking
* calendar availability
* reminders

### Business

* staff accounts
* staff availability
* calendar integration
* automated booking
* better analytics
* richer AI configuration

### AI

* better retrieval
* semantic search
* knowledge documents
* improved voice agent
* multilingual support

---

# 34. Phase 2

Then introduce:

### Phone

```text
Customer phone
     ↓
PSTN
     ↓
LiveKit
     ↓
AI
     ↓
Business
```

Potentially:

> "Call One Place and let the AI handle the basic questions."

Only after the economics make sense.

---

# 35. Phase 3

Eventually:

```text
One Place
    ↓
Discovery
    ↓
Conversation
    ↓
Booking
    ↓
Payment
    ↓
Service
    ↓
Review
```

At that point, One Place is no longer merely a directory.

It becomes **service infrastructure**.

---

# 36. The MVP Product Boundary

This is the line I want us to protect throughout development:

> **One Place helps customers find a service, understand the service, communicate with the business and make a request.**

Everything else must justify why it belongs in the MVP.

