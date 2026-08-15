# DOCUMENT 10 — FRONTEND ARCHITECTURE & UI/UX IMPLEMENTATION SPECIFICATION

**Product:** One Place
**Document:** 10 of the development documentation set
**Status:** Development-ready
**Frontend:** Next.js + TypeScript
**Styling:** Tailwind CSS
**Backend:** Next.js server-side application layer
**Database/Auth:** Supabase
**Voice:** LiveKit
**Primary device:** Mobile-first web
**Design philosophy:** Simple, human, trustworthy, conversational

---

# 1. Document Purpose

This document defines **exactly how the One Place frontend should be structured and implemented**.

It covers:

* application routes
* page hierarchy
* navigation
* UI components
* visual language
* typography
* colours
* spacing
* responsive behaviour
* forms
* business profiles
* discovery
* conversations
* voice
* AI interaction
* onboarding
* dashboards
* loading states
* empty states
* errors
* accessibility
* frontend state management
* frontend-to-backend interaction
* complete page copy

The objective is:

> A developer should be able to build the frontend without repeatedly asking what a page should contain or how an interaction should behave.

---

# 2. Product UX Philosophy

One Place should **not feel like a complicated marketplace**.

It should feel like:

> **"I need something. Let me find the right person and talk to them."**

The interface therefore prioritizes:

1. Discovery
2. Clarity
3. Conversation
4. Trust
5. Action

Not:

* dashboards everywhere
* excessive filters
* complicated forms
* social feeds
* unnecessary gamification
* overwhelming AI interfaces

---

# 3. Core UX Model

The customer journey is:

```text
I need something
      ↓
Tell One Place what I need
      ↓
See relevant services
      ↓
Choose a business
      ↓
Ask a question
      ↓
Chat or talk
      ↓
Get an answer
      ↓
Take action
```

The most important CTA throughout the product is therefore:

> **Talk to someone**

rather than:

> "Start AI conversation"

The AI is infrastructure.

The user should primarily experience **help**, not technology.

---

# 4. Primary User Types

## 4.1 Customer

Someone looking for a service.

Examples:

* "I need a barber."
* "I need a massage."
* "I need someone to clean my apartment."
* "I need a personal trainer."
* "I want to know whether this salon has availability."

---

## 4.2 Business Owner

Someone managing a service business.

They need to:

* create their business
* list services
* configure prices
* configure availability
* configure AI
* respond to customers
* manage requests
* see analytics

---

## 4.3 Business Staff

Staff members who handle conversations and requests.

---

## 4.4 Platform Administrator

Internal One Place administration.

Not part of the public MVP experience.

---

# 5. Visual Identity

One Place should feel:

* modern
* warm
* intelligent
* calm
* trustworthy
* approachable
* professional

It should **not** look like:

* a banking application
* a crypto application
* an enterprise CRM
* a social network
* an AI chatbot dashboard

---

# 6. Colour System

Use a restrained palette.

## Primary

**Deep Indigo**

```text
#3730A3
```

Use for:

* primary buttons
* active states
* links
* selected controls
* key interactive elements

---

## Primary Hover

```text
#312E81
```

---

## Main Text

```text
#111827
```

---

## Secondary Text

```text
#6B7280
```

---

## Background

```text
#F9FAFB
```

---

## Surface

```text
#FFFFFF
```

---

## Border

```text
#E5E7EB
```

---

## Success

```text
#16A34A
```

---

## Warning

```text
#D97706
```

---

## Error

```text
#DC2626
```

---

## Important visual rule

Do **not** use the primary colour everywhere.

The interface should remain predominantly:

```text
white
+
soft neutral background
+
dark typography
+
small amounts of indigo
```

This makes One Place feel calm rather than noisy.

---

# 7. Typography

Use:

**Inter**

Fallback:

```text
system-ui
sans-serif
```

---

# 8. Typography Scale

## Display

```text
48px
font-weight: 700
line-height: 1.1
```

Desktop only.

---

## H1

```text
36px
font-weight: 700
line-height: 1.2
```

Mobile:

```text
30px
```

---

## H2

```text
28px
font-weight: 700
```

---

## H3

```text
20px
font-weight: 600
```

---

## Body Large

```text
18px
line-height: 1.6
```

---

## Body

```text
16px
line-height: 1.5
```

---

## Small

```text
14px
line-height: 1.4
```

---

## Caption

```text
12px
```

---

# 9. Font Weight

Use only:

```text
400 — Regular
500 — Medium
600 — Semibold
700 — Bold
```

Avoid excessive bolding.

---

# 10. Spacing System

Use Tailwind's spacing system.

Primary spacing values:

```text
4
8
12
16
20
24
32
40
48
64
80
```

Avoid arbitrary spacing unless genuinely necessary.

---

# 11. Border Radius

One Place should feel friendly.

Use:

```text
sm: 6px
md: 10px
lg: 14px
xl: 20px
full: 9999px
```

Cards:

```text
14px
```

Buttons:

```text
10px
```

Pills:

```text
9999px
```

---

# 12. Shadows

Use subtle shadows only.

Default card:

```text
0 1px 3px rgba(0,0,0,0.06)
```

Elevated:

```text
0 8px 24px rgba(0,0,0,0.08)
```

Avoid heavy shadows.

---

# 13. Application Structure

Recommended Next.js App Router:

```text
app/
├── page.tsx
├── discover/
│   └── page.tsx
│
├── business/
│   └── [slug]/
│       └── page.tsx
│
├── conversation/
│   └── [id]/
│       └── page.tsx
│
├── voice/
│   └── [id]/
│       └── page.tsx
│
├── login/
│   └── page.tsx
│
├── signup/
│   └── page.tsx
│
├── onboarding/
│   └── page.tsx
│
├── dashboard/
│   ├── page.tsx
│   ├── business/
│   ├── services/
│   ├── conversations/
│   ├── requests/
│   ├── availability/
│   ├── ai/
│   └── settings/
│
└── admin/
    └── ...
```

---

# 14. Global Layout

The public application uses:

```text
┌─────────────────────────────────────┐
│ Logo          Discover    Sign in   │
├─────────────────────────────────────┤
│                                     │
│             PAGE CONTENT            │
│                                     │
├─────────────────────────────────────┤
│ About | Businesses | Help | Privacy │
└─────────────────────────────────────┘
```

On mobile:

```text
┌───────────────────────────┐
│ One Place           ☰     │
├───────────────────────────┤
│                           │
│       PAGE CONTENT        │
│                           │
└───────────────────────────┘
```

---

# 15. Homepage

Route:

```text
/
```

Purpose:

Immediately communicate:

> Find the right service. Ask questions. Talk to someone.

---

## Hero copy

### Heading

> **Find the right service. Talk to the right people.**

### Supporting text

> Search for a service, ask a question, or talk directly with a business — all in one place.

### Primary CTA

> **Find a service**

### Secondary CTA

> **I'm a business owner**

---

# 16. Homepage Search

The central interaction should be conversational.

Placeholder:

> **What are you looking for?**

Examples shown underneath:

> Try "hair salon near me"

> "I need a personal trainer"

> "Find a massage service"

---

# 17. Homepage Secondary CTA

Below search:

> **Not sure where to start?**

Supporting:

> Tell us what you need and we'll help you find the right place.

Button:

> **Help me find it**

---

# 18. Homepage Category Section

Heading:

> **Explore services**

Supporting:

> Browse popular services or search for exactly what you need.

Display approximately 8–12 categories initially.

CTA:

> **View all services**

---

# 19. Homepage Business Section

Heading:

> **Businesses people are talking to**

Supporting:

> Discover local businesses and connect with them when you have questions.

Cards show:

* image
* business name
* category
* location
* rating
* service count
* availability indicator if applicable

CTA:

> **Explore businesses**

---

# 20. Business Owner CTA

Heading:

> **Have a service to offer?**

Copy:

> Put your business in front of people who are actively looking for what you do.

Button:

> **List your business**

---

# 21. Footer

Columns:

### One Place

* About
* How it works
* Contact

### Explore

* Services
* Businesses
* Categories

### Businesses

* List your business
* Business login
* Help

### Legal

* Privacy
* Terms
* Accessibility

Footer statement:

> **One Place helps people find services and connect with businesses.**

---

# 22. Discovery Page

Route:

```text
/discover
```

Header:

> **What are you looking for?**

Search input:

> **Search services, businesses, or describe what you need**

---

# 23. Discovery Search Behaviour

The customer can type:

> "I need someone to cut my hair."

The frontend sends the query to the backend.

The backend resolves:

```text
intent
→ category
→ service
→ location
→ businesses
```

The frontend should not implement the business matching algorithm.

---

# 24. Discovery Results

Top:

> **Results for "hair salon"**

Filter controls:

* Category
* Distance
* Open now
* Price
* Rating

MVP should keep filters limited.

---

# 25. Business Card

Each card:

```text
┌────────────────────────────┐
│        Business Image      │
├────────────────────────────┤
│ Harbour Hair Studio        │
│ Hair Salon · St. John's    │
│                            │
│ ★ 4.8                     │
│ From $35                   │
│                            │
│ [View business]            │
└────────────────────────────┘
```

---

# 26. Business Card CTA

Primary:

> **View business**

Do not use:

> "Learn more"

"View business" is clearer.

---

# 27. Business Profile

Route:

```text
/business/[slug]
```

This is one of the most important pages.

---

## Header

Show:

* cover image
* logo
* business name
* category
* location
* rating
* verification status

CTA:

> **Talk to us**

Secondary:

> **View services**

---

# 28. Business Profile Copy

Example:

> **Harbour Hair Studio**

> Hair salon · St. John's

> ★ 4.8 · 42 reviews

Description:

> A friendly local salon offering haircuts, styling, colouring and more.

CTA:

> **Ask a question**

Voice CTA:

> **Talk by voice**

---

# 29. Business Services

Heading:

> **Services**

Each service:

```text
Haircut
From $35
30–45 min

[Ask about this service]
```

If exact price:

> **$40**

If starting price:

> **From $40**

If quote:

> **Request a quote**

Never display fabricated prices.

---

# 30. Business Availability

Heading:

> **Hours**

Example:

```text
Monday       9:00 AM – 5:00 PM
Tuesday      9:00 AM – 5:00 PM
Wednesday    9:00 AM – 5:00 PM
```

Current status:

> **Open now**

or:

> **Closed · Opens Monday at 9:00 AM**

---

# 31. Business Conversation CTA

Clicking:

> **Talk to us**

creates/reuses a conversation.

The user should not be forced through a long form.

---

# 32. Conversation Page

Route:

```text
/conversation/[id]
```

This is the heart of One Place.

---

# 33. Conversation UI

```text
┌─────────────────────────────┐
│ ← Harbour Hair Studio       │
│   Usually replies quickly   │
├─────────────────────────────┤
│                             │
│ Business/AI messages        │
│                             │
│                    User     │
│                             │
│ Business/AI messages        │
│                             │
├─────────────────────────────┤
│ +  Message...          🎤   │
└─────────────────────────────┘
```

---

# 34. Conversation Intro

First system message:

> **Hi! How can we help?**

If AI is enabled:

> **Hi! I'm here to help with questions about this business.**

Then:

> **You can ask about services, prices, hours, availability, or anything else you'd like to know.**

---

# 35. AI Disclosure

Do not pretend the AI is human.

Use:

> **You're chatting with One Place's AI assistant.**

If business-configured:

> **You're chatting with this business's virtual assistant.**

When a human joins:

> **A member of the team has joined the conversation.**

---

# 36. Message Composer

Placeholder:

> **Ask a question...**

Voice icon:

> **Talk**

Attachment icon should not exist in MVP unless required.

---

# 37. Voice UI

Voice should feel extremely simple.

Button:

> **Talk instead**

After clicking:

> **Connecting...**

Then:

> **You're connected**

During conversation:

> **Listening**

or:

> **Speaking**

Mute:

> **Mute**

End:

> **End conversation**

---

# 38. Voice Permission Copy

Before microphone permission:

> **One Place needs access to your microphone so you can talk.**

Button:

> **Allow microphone**

If denied:

> **Microphone access is required for voice conversations.**

Secondary:

> **Continue with chat**

---

# 39. Voice Failure

> **We couldn't connect the call.**

Supporting:

> Check your internet connection and try again.

Buttons:

> **Try again**

> **Continue with chat**

---

# 40. Human Handoff

When AI cannot answer:

> **I don't want to guess. Let me connect you with someone from the team.**

If staff available:

> **Connecting you now...**

If unavailable:

> **No one is available right now. You can leave a message and the business can respond later.**

---

# 41. Service Request UI

If a customer needs an actual action:

> **Would you like us to help with this?**

Options:

* Ask a question
* Request availability
* Request a quote
* Request a callback

---

# 42. Request Confirmation

After request:

> **Request sent**

> We've sent your request to the business.

CTA:

> **View conversation**

---

# 43. Login Page

Heading:

> **Welcome back**

Supporting:

> Sign in to continue using One Place.

Fields:

> Email address

> Password

CTA:

> **Sign in**

Secondary:

> **Forgot password?**

Bottom:

> Don't have an account?

> **Create an account**

---

# 44. Signup Page

Heading:

> **Create your One Place account**

Copy:

> Create an account so you can keep track of your conversations, requests and saved businesses.

Fields:

> First name

> Last name

> Email address

> Password

CTA:

> **Create account**

Consent:

> By creating an account, you agree to our Terms and Privacy Policy.

---

# 45. Customer Onboarding

Do not make onboarding mandatory unless necessary.

After signup:

> **What brings you to One Place?**

Options:

* Find a service
* Ask a business a question
* Save businesses I like
* I'm exploring

Button:

> **Continue**

This information can improve personalization later.

---

# 46. Business Owner Onboarding

Route:

```text
/onboarding/business
```

Step 1:

> **Let's get your business on One Place.**

Supporting:

> It only takes a few minutes to create your profile.

---

## Step 1 — Business information

Fields:

> Business name

> Business description

> Location

> Contact email

> Phone number

---

## Step 2 — Category

Heading:

> **What kind of service do you provide?**

Search:

> **Search categories**

Button:

> **Continue**

---

# 47. Business Service Setup

Heading:

> **What services do you offer?**

CTA:

> **Add a service**

Form:

> Service name

> Description

> Price

> Pricing type

> Duration

---

# 48. Pricing Type

Options:

> Fixed price

> Starting from

> Price range

> Quote required

Helper text:

> Choose "Quote required" if the price depends on the customer's needs.

---

# 49. Business Hours

Heading:

> **When are you available?**

Supporting:

> Set your regular opening hours. You can change these anytime.

CTA:

> **Save hours**

---

# 50. AI Setup

Do not overwhelm the owner.

Heading:

> **Let One Place answer common questions for you.**

Supporting:

> Your assistant can answer questions using the information you provide about your business.

CTA:

> **Set up assistant**

Secondary:

> **I'll do this later**

---

# 51. AI Configuration

Fields:

### Greeting

Placeholder:

> "Hi! How can I help you today?"

### Business instructions

Placeholder:

> "Answer questions about our services, prices and opening hours. If you're unsure, offer to connect the customer with our team."

---

# 52. AI Safety Copy

Display:

> **Your assistant should never guess.**

Supporting:

> If it doesn't have enough information to answer confidently, it should ask for clarification or offer to connect the customer with your team.

---

# 53. Business Dashboard

Route:

```text
/dashboard
```

Heading:

> **Good morning, [Name]**

Supporting:

> Here's what's happening with your business.

Cards:

* Conversations
* Requests
* Profile views
* Rating

---

# 54. Dashboard Navigation

Desktop sidebar:

```text
Overview
Conversations
Requests
Services
Availability
AI Assistant
Business Profile
Settings
```

Mobile:

Bottom navigation:

```text
Home
Inbox
Requests
Business
More
```

---

# 55. Conversations Dashboard

Heading:

> **Conversations**

Tabs:

> All

> Active

> Waiting

> Closed

Empty state:

> **No conversations yet**

> When customers reach out, you'll see their conversations here.

---

# 56. Requests Dashboard

Heading:

> **Requests**

Tabs:

> Open

> In progress

> Completed

Empty:

> **No requests yet**

> Customer requests will appear here when someone needs help from your business.

---

# 57. Services Dashboard

Heading:

> **Your services**

CTA:

> **Add service**

Empty:

> **Add your first service**

> Tell customers what you offer, how much it costs and what they can expect.

---

# 58. Availability Dashboard

Heading:

> **Availability**

Copy:

> Let customers know when you're normally available.

CTA:

> **Save changes**

---

# 59. AI Dashboard

Heading:

> **Your assistant**

Status:

> **Assistant is active**

Description:

> Your assistant uses the information you've provided to answer customer questions.

Sections:

### Greeting

### Instructions

### Knowledge

### Human handoff

---

# 60. AI Knowledge Management

Heading:

> **What should your assistant know?**

CTA:

> **Add information**

Examples:

> Cancellation policy

> Parking instructions

> Payment methods

> Frequently asked questions

Empty state:

> **Your assistant doesn't have much information yet.**

> Add useful details so it can give customers better answers.

---

# 61. Business Profile Editor

Sections:

```text
Basic information
Location
Contact details
Services
Hours
Photos
AI assistant
```

Save button:

> **Save changes**

Success:

> **Changes saved**

---

# 62. Settings

Sections:

* Account
* Business
* Notifications
* Privacy
* Security

Danger zone:

> **Delete business**

Confirmation:

> **Are you sure you want to delete this business?**

> This action will remove the business from One Place.

Button:

> **Delete business**

---

# 63. Loading States

Do not show blank screens.

Use skeletons.

Business card:

```text
████████████
████████
██████
```

Conversation:

Show message skeletons.

Button loading:

> **Saving...**

> **Connecting...**

> **Sending...**

Never:

> "Please wait..."

without context.

---

# 64. Empty States

Every major page needs a deliberate empty state.

Format:

```text
Icon
Heading
Explanation
Action
```

Example:

> **No saved businesses**

> Businesses you save will appear here so you can find them quickly.

Button:

> **Explore businesses**

---

# 65. Error States

Generic:

> **Something went wrong**

Supporting:

> We couldn't complete that request. Please try again.

Button:

> **Try again**

For network failure:

> **You're offline**

> Check your internet connection and try again.

---

# 66. Toast Messages

Use short messages.

Success:

> **Saved successfully**

Error:

> **Couldn't save changes**

Request:

> **Request sent**

Conversation:

> **Message sent**

Never display huge notifications.

---

# 67. Mobile Design

Mobile is the primary design target.

Minimum touch target:

```text
44 × 44px
```

Important actions should be reachable with one hand.

Voice controls should be large.

---

# 68. Desktop Design

At desktop width:

```text
max-width: 1200px
```

Use a centered content container.

Avoid excessive full-width layouts.

---

# 69. Responsive Breakpoints

Use Tailwind defaults:

```text
sm
md
lg
xl
2xl
```

Primary design decisions:

```text
< 768px = mobile
768–1023px = tablet
≥ 1024px = desktop
```

---

# 70. Component Architecture

Recommended:

```text
components/
├── ui/
│   ├── Button
│   ├── Input
│   ├── Select
│   ├── Modal
│   ├── Toast
│   ├── Card
│   ├── Badge
│   └── Skeleton
│
├── business/
│   ├── BusinessCard
│   ├── BusinessHeader
│   ├── BusinessServices
│   ├── BusinessHours
│   └── BusinessRating
│
├── discovery/
│   ├── SearchBox
│   ├── CategoryGrid
│   ├── FilterBar
│   └── SearchResults
│
├── conversation/
│   ├── ConversationHeader
│   ├── MessageList
│   ├── MessageBubble
│   ├── MessageComposer
│   ├── VoiceButton
│   └── HandoffNotice
│
├── dashboard/
│   ├── DashboardSidebar
│   ├── DashboardHeader
│   ├── StatCard
│   └── MobileNav
│
└── ai/
    ├── AssistantStatus
    ├── KnowledgeList
    └── AIConfiguration
```

---

# 71. Server vs Client Components

Default:

> **Use Server Components wherever possible.**

Use Client Components only where interaction requires them.

### Server Component examples

* Business profile
* Service listing
* Category page
* Static marketing pages

### Client Component examples

* Search input
* Chat
* Voice
* Filters
* Forms
* Dashboard interactions

This reduces unnecessary JavaScript.

---

# 72. Frontend State

Do not introduce Redux for MVP.

Use:

### URL state

For:

* search
* filters
* pagination

### React state

For:

* modal
* form
* temporary UI state

### Server state

Use Next.js/Supabase data fetching and appropriate caching.

### Authentication

Supabase Auth.

---

# 73. API Interaction

The frontend should not directly manipulate sensitive business logic.

Preferred:

```text
Frontend
   ↓
Next.js server action / route handler
   ↓
validation
   ↓
business logic
   ↓
Supabase
```

For public read-only information, direct Supabase queries may be acceptable where RLS is sufficient.

---

# 74. Validation

Use:

**Zod**

for request validation.

Example conceptual flow:

```text
Form
 ↓
Zod validation
 ↓
Server Action
 ↓
Authorization
 ↓
Database
```

---

# 75. Forms

Use:

**React Hook Form + Zod**

for complex forms.

Simple forms can use native React form handling.

Do not introduce a form framework for every tiny input.

---

# 76. Search UX

Search should support both:

### Structured

> Hair salons

and conversational:

> I need someone to cut my hair tomorrow.

The user should not need to understand categories.

---

# 77. Search Suggestions

While typing:

```text
Looking for...

Hair salons
Barbers
Hair styling
Beauty salons
```

For conversational query:

> **Tell us what you need**

---

# 78. Category Selection

Categories should be visually simple.

Example:

```text
Hair & Beauty
Health & Wellness
Fitness
Home Services
Automotive
Professional Services
Events
Education
Pets
Photography
```

Each category can have an icon.

---

# 79. No Social Feed

The frontend must not introduce:

* posts
* followers
* likes
* public status updates
* endless feeds
* stories

One Place is a **service discovery and communication platform**, not a social network.

---

# 80. Reviews UI

Business page:

> **Reviews**

Show:

> ★ 4.8

> 42 reviews

Review:

```text
★★★★★
Great experience

"Very friendly and professional."

— Verified customer
```

Do not allow arbitrary users to claim "verified."

Verification should be generated by actual platform interaction.

---

# 81. Trust Indicators

Possible indicators:

> **Verified business**

> **Usually responds quickly**

> **AI assistant available**

> **Recently active**

These should only be shown when backed by actual data.

Never manufacture trust indicators.

---

# 82. Accessibility

The application must target WCAG 2.2 AA principles.

Requirements:

* keyboard navigation
* visible focus states
* semantic HTML
* labels for inputs
* accessible dialogs
* sufficient contrast
* screen-reader labels
* no colour-only information
* proper heading hierarchy
* captions/transcripts where applicable for future recorded content

---

# 83. Voice Accessibility

Voice must never be the only communication method.

Always provide:

> **Continue with chat**

If microphone permission fails:

> **Use chat instead**

---

# 84. Authentication UX

Authentication should be frictionless.

Do not ask for:

* business information during normal customer signup
* phone number unless required
* unnecessary demographic data

Collect the minimum required information.

---

# 85. Business Signup UX

Do not force every business configuration at signup.

Use progressive onboarding:

```text
Account
 ↓
Business
 ↓
Category
 ↓
Services
 ↓
Hours
 ↓
AI
```

Allow:

> **Skip for now**

where the information is not immediately required.

---

# 86. Navigation Principle

The user should always understand:

1. Where am I?
2. What can I do here?
3. What happens if I click this?

If an interface requires explanation, simplify it.

---

# 87. SEO

Public pages should be indexable.

Important routes:

```text
/
 /discover
 /business/[slug]
 /category/[slug]
```

Business pages should generate:

* title
* description
* Open Graph metadata
* canonical URL

Example:

> Harbour Hair Studio — Hair Salon in St. John's | One Place

---

# 88. Performance

Targets:

* fast initial page load
* optimized images
* lazy-load non-critical components
* avoid unnecessary client JavaScript
* server-render public pages

Voice components should only load when needed.

Do not load LiveKit on the homepage.

---

# 89. LiveKit Loading Strategy

Critical rule:

```text
Homepage
    ↓
NO LiveKit SDK required

Business page
    ↓
NO LiveKit SDK required

Conversation
    ↓
Load voice capability only when requested
```

This keeps the initial application lightweight.

---

# 90. Voice Component Lifecycle

```text
User clicks "Talk"
        ↓
Request microphone permission
        ↓
Request voice session from backend
        ↓
Receive LiveKit token
        ↓
Load/connect LiveKit
        ↓
Join room
        ↓
Show connected state
        ↓
Conversation
        ↓
End
        ↓
Disconnect
        ↓
Update voice session
```

---

# 91. AI Loading UX

Never show:

> "AI is thinking..."

for long periods.

Use:

> **Working on that...**

If response is streaming, display it naturally.

---

# 92. AI Error UX

If the AI cannot answer:

> **I don't have enough information to answer that confidently.**

Then:

> **Would you like me to connect you with the business?**

Buttons:

> **Talk to someone**

> **Ask another question**

This is much better than hallucinating.

---

# 93. Business Offline State

If the business is offline:

> **This business isn't available right now.**

Then:

> You can still leave a message and we'll let the business know.

CTA:

> **Leave a message**

---

# 94. Business Online State

If a human staff member is available:

> **Someone from the team is available**

CTA:

> **Talk to the team**

If AI is available but humans aren't:

> **Assistant available**

CTA:

> **Ask a question**

---

# 95. Customer Account Dashboard

Future customer dashboard:

```text
/dashboard/customer
```

Sections:

* Conversations
* Requests
* Saved businesses
* Reviews
* Account

This does not need to be elaborate in MVP.

---

# 96. MVP Customer Pages

The minimum customer frontend is:

```text
Homepage
Discovery
Business profile
Login
Signup
Conversation
Voice conversation
Customer account
```

Everything else should be secondary.

---

# 97. MVP Business Pages

Minimum:

```text
Business onboarding
Business dashboard
Business profile editor
Services
Availability
Conversations
Requests
AI assistant
Settings
```

---

# 98. MVP Admin

Minimal internal interface:

```text
/admin
```

Only:

* business approval
* business suspension
* category management
* user management
* review moderation

No giant admin platform.

---

# 99. Frontend Security Rules

Never put in client-side code:

* Supabase service role key
* LiveKit API secret
* LLM API key
* privileged database credentials

Only public client configuration belongs in the browser.

---

# 100. Environment Variables

Example:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY

SUPABASE_SERVICE_ROLE_KEY

LIVEKIT_API_KEY
LIVEKIT_API_SECRET
LIVEKIT_URL

LLM_API_KEY
```

Only `NEXT_PUBLIC_*` variables are allowed in browser code.

---

# 101. Error Boundary Strategy

Use route-level error boundaries.

Example:

```text
app/
├── error.tsx
├── global-error.tsx
```

Business page:

```text
business/[slug]/
├── page.tsx
├── loading.tsx
└── error.tsx
```

---

# 102. Not Found Pages

Business doesn't exist:

> **We couldn't find that business.**

> It may have been removed or the link may be incorrect.

CTA:

> **Explore businesses**

---

# 103. Confirmation Philosophy

Destructive actions should require confirmation.

Normal actions should not.

Do not ask:

> "Are you sure?"

after every interaction.

---

# 104. Copywriting Rules

One Place copy must be:

### Human

Say:

> Talk to someone

instead of:

> Initiate communication session

### Clear

Say:

> Add a service

instead of:

> Create service entity

### Warm

Say:

> Tell us what you need

instead of:

> Enter your search query

### Honest

Say:

> AI assistant

instead of:

> Your personal expert

unless the system genuinely provides that expertise.

---

# 105. Words We Should Avoid

Avoid excessive technical/product language:

* AI-powered
* revolutionary
* next-generation
* intelligent ecosystem
* omnichannel
* conversational commerce
* neural
* automated intelligence

The technology should disappear behind the experience.

---

# 106. Primary Product Language

Prefer:

> Find

> Ask

> Talk

> Connect

> Request

> Save

> Explore

> Help

These become the core One Place vocabulary.

---

# 107. Design Principle for AI

The user should think:

> "One Place helped me."

Not:

> "I just interacted with an LLM."

That distinction is extremely important to the product.

---

# 108. Design Principle for Voice

Voice should feel like:

> **calling someone without having to know who to call.**

The user should not need to understand:

* LiveKit
* agents
* rooms
* tokens
* AI
* routing

They simply tap:

> **Talk**

---

# 109. Design Principle for Businesses

A business should feel:

> "One Place helps me handle customers without creating more work."

Not:

> "I have another dashboard I have to maintain."

Therefore the business dashboard should focus on:

```text
What needs my attention?
```

rather than:

```text
Here's everything the platform can do.
```

---

# 110. Post-MVP UI Evolution

Future capabilities can introduce:

### Bookings

> **Book now**

### Payments

> **Pay securely**

### Direct telephone

> **Call the business**

### Staff scheduling

> **Choose a team member**

### Multi-location

> **Choose a location**

### Advanced AI

> **Ask the assistant**

But these should be added incrementally.

---

# 111. Component Dependency Rule

A component should not directly know about the database.

Bad:

```text
BusinessCard
   ↓
Supabase
```

Better:

```text
Supabase
   ↓
Server/API
   ↓
Business data
   ↓
BusinessCard
```

This keeps the frontend replaceable and testable.

---

# 112. Page Dependency Model

```text
Homepage
   ↓
Search
   ↓
Business Profile
   ↓
Conversation
   ├── Chat
   └── Voice
       ↓
Service Request
       ↓
Review
```

Business:

```text
Onboarding
   ↓
Business Profile
   ├── Services
   ├── Hours
   └── AI
        ↓
Conversations
        ↓
Requests
```

---

# 113. Frontend Development Order

Develop in this exact order:

### Sprint 1

```text
Design system
Global layout
Navigation
Authentication
```

### Sprint 2

```text
Homepage
Categories
Discovery
Business cards
```

### Sprint 3

```text
Business profile
Services
Hours
```

### Sprint 4

```text
Conversation
Messages
Real-time updates
```

### Sprint 5

```text
Voice
LiveKit
Voice states
```

### Sprint 6

```text
Business onboarding
Dashboard
Services management
```

### Sprint 7

```text
AI configuration
Knowledge
Human handoff
```

### Sprint 8

```text
Requests
Reviews
Notifications
Analytics
```

---

# 114. Definition of Frontend Completion

The MVP frontend is complete when:

* a customer can discover a service
* view a business
* view its services
* start a conversation
* send messages
* receive responses
* initiate a voice session
* transition from AI to human
* submit a request
* create an account
* save a business
* leave a review where eligible

And a business can:

* create an account
* create a business
* configure services
* configure prices
* configure hours
* configure AI
* manage conversations
* manage requests
* edit its profile

---

# 115. Final Frontend Architecture

```text
                         NEXT.JS
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
       PUBLIC            CUSTOMER          BUSINESS
          │                 │                 │
       Homepage          Account          Dashboard
       Discover          Saved            Services
       Business          Requests         Requests
       Categories        Reviews          Conversations
          │                                  AI
          └───────────────┬──────────────────┘
                          │
                    CONVERSATION
                     /         \
                   CHAT       VOICE
                              │
                           LIVEKIT
                          │
                    AI / HUMAN AGENT
```

---

# 116. Final UX Principle

The entire frontend can be reduced to four primary actions:

> **Find something.**

> **Ask something.**

> **Talk to someone.**

> **Get something done.**

Everything else in One Place exists to support those four things.
