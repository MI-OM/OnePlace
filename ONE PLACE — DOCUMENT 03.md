# ONE PLACE — DOCUMENT 03

## Complete UI/UX, Visual Design & Copy Specification

**Version:** 1.0
**Status:** MVP Development Specification
**Platform:** Responsive Web Application
**Design philosophy:** Calm, human, useful, conversational
**Primary users:** Customers + local service businesses

---

# 1. Design Direction

One Place should **not look like a traditional business directory**.

It should not feel like:

* Yelp
* Yellow Pages
* a social network
* a generic AI chatbot
* a corporate CRM
* an online marketplace overloaded with cards and filters

The visual experience should communicate:

> **"I came here because I need something. Help me find it."**

The interface should feel:

**Warm · Intelligent · Local · Clean · Trustworthy · Human**

The AI should be present, but it should **not dominate the interface**.

---

# 2. Core UX Principle

The customer journey should be almost effortless:

```text
I need something
      ↓
Tell One Place
      ↓
See relevant businesses
      ↓
Understand my options
      ↓
Ask a question
      ↓
Talk if necessary
      ↓
Make a request
```

The product should always answer:

> **"What can I do next?"**

---

# 3. Visual Personality

### Brand characteristics

| Characteristic | Direction |
| -------------- | --------- |
| Modern         | Yes       |
| Minimal        | Yes       |
| Friendly       | Yes       |
| Corporate      | No        |
| Playful        | Slightly  |
| Premium        | Yes       |
| Cold           | No        |
| Futuristic     | Lightly   |
| AI-heavy       | No        |

The design should feel like a **well-designed local service concierge**, not an AI experiment.

---

# 4. Color System

I recommend a warm neutral foundation with a deep blue-green primary.

### Primary

**Deep Teal**

`#123C3A`

Used for:

* primary buttons
* headings where appropriate
* active navigation
* important UI elements

### Primary Hover

`#0E302E`

---

### Accent

**Warm Amber**

`#E7A83B`

Used sparingly for:

* highlights
* verification
* important status indicators
* selected states

---

### Background

**Warm White**

`#FAFAF7`

This prevents the product from feeling sterile.

---

### Surface

**White**

`#FFFFFF`

Used for:

* cards
* forms
* dialogs
* business profiles

---

### Text

Primary:

`#17201F`

Secondary:

`#5D6866`

Muted:

`#87918F`

---

### Borders

`#E5E9E7`

---

### Success

`#26734D`

### Warning

`#A96E16`

### Error

`#B64040`

---

# 5. Color Ratio

Do **not** make the application teal everywhere.

Recommended visual balance:

```text
70% neutral / white
20% dark text / surfaces
8% primary teal
2% accent
```

The primary color should guide the user rather than overwhelm them.

---

# 6. Typography

Recommended font:

## Inter

Why:

* excellent readability
* mature
* modern
* highly available
* works well across dashboards and consumer interfaces

Fallback:

```text
system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
```

---

# 7. Typography Scale

### Display

64px / 1.05

Weight: 600

Desktop hero only.

### H1

48px / 1.1

Weight: 600

### H2

36px / 1.2

Weight: 600

### H3

24px / 1.3

Weight: 600

### H4

18px / 1.4

Weight: 600

### Body Large

18px / 1.6

### Body

16px / 1.5

### Small

14px / 1.4

### Caption

12px / 1.4

Avoid excessive font-weight variation.

---

# 8. Border Radius

Use a consistent system.

```text
Small: 8px
Medium: 12px
Large: 16px
XL: 24px
Pill: 999px
```

Cards:

**16px**

Buttons:

**10px**

Inputs:

**10px**

---

# 9. Shadows

Keep shadows extremely subtle.

Default:

```text
0 1px 3px rgba(...)
```

Elevated cards:

```text
0 8px 24px rgba(...)
```

Do not make the product look like every component is floating.

---

# 10. Spacing System

Base unit:

**4px**

Common spacing:

```text
4
8
12
16
24
32
40
48
64
80
96
```

---

# 11. Desktop Layout

Maximum content width:

**1200px**

Primary content:

```text
┌───────────────────────────────────────────────┐
│                    Header                     │
├───────────────────────────────────────────────┤
│                                               │
│                 Main Content                  │
│                                               │
│                max-width 1200                │
│                                               │
└───────────────────────────────────────────────┘
```

---

# 12. Mobile Philosophy

Mobile is **not a reduced desktop**.

It should be designed independently.

Primary navigation:

```text
Home
Search
Requests
Saved
Profile
```

Business dashboard can use:

```text
Overview
Requests
Messages
Business
More
```

---

# 13. Global Header

Desktop:

```text
ONE PLACE

Search services...

Explore

For Businesses

[Sign in]

[Get started]
```

Mobile:

```text
ONE PLACE                         ☰
```

On discovery pages, the search interface should become prominent.

---

# 14. Header Copy

Logo:

> **One Place**

Search placeholder:

> **What service are you looking for?**

Business CTA:

> **List your business**

Login:

> **Sign in**

Signup:

> **Get started**

---

# 15. Homepage

## Hero

Headline:

> **Find the service you need. Ask anything.**

Supporting copy:

> Discover local businesses, explore their services, and get answers without making five different calls.

Search placeholder:

> **What do you need help with?**

Examples:

> Try “haircut near me”

> Try “massage this weekend”

> Try “cleaning service”

CTA:

> **Find a service**

---

# 16. Homepage Secondary CTA

For businesses:

> **Do you run a service business?**

Supporting text:

> Put your services in one place and make it easier for customers to find and contact you.

CTA:

> **List your business**

---

# 17. Homepage Categories

Heading:

> **What are you looking for?**

Supporting:

> Start with a category or tell us what you need.

Category cards should contain:

* icon
* category name
* number of businesses where useful

Example:

> **Beauty & Hair**

> **Health & Wellness**

> **Home Services**

> **Fitness**

> **Automotive**

> **Professional Services**

---

# 18. Homepage How It Works

Heading:

> **Finding help should be simple.**

### Step 1

**Tell us what you need**

> Search by service, category or simply describe what you're looking for.

### Step 2

**Explore your options**

> Compare local businesses, services and information in one place.

### Step 3

**Ask or talk**

> Get answers through chat or voice before you decide.

---

# 19. Homepage Trust Section

Heading:

> **Real businesses. Useful answers.**

Copy:

> One Place brings business information and conversations together, so you can spend less time searching and more time getting things done.

---

# 20. Homepage Business CTA

Heading:

> **Your customers are already looking for you.**

Copy:

> Give them one clear place to find your services, ask questions and get in touch.

CTA:

> **Bring your business to One Place**

---

# 21. Search Page

Top:

> **What are you looking for?**

Search field:

> **Search for a service, business or category**

Filters:

* Category
* Location
* Open now
* Service
* Price

Sort:

> **Recommended**

Alternative:

> **Closest**

---

# 22. Search Results

Heading:

> **Services near you**

Example:

> **24 businesses found**

Business card:

```text
[Image]

Business Name
★★★★★ 4.8

Hair Salon · St. John's

From $35

Haircuts · Braids · Styling

[View business]
```

---

# 23. Empty Search

> **We couldn't find exactly what you're looking for.**

Supporting:

> Try another service, category or a more general search.

CTA:

> **Try another search**

Secondary:

> **Ask One Place**

---

# 24. Business Profile

The business profile is one of the most important pages.

Structure:

```text
Cover / Gallery

Business Name
Verified
Category
Location
Rating

[Ask a question] [Talk]

About

Services

Hours

Reviews

Location

More information
```

---

# 25. Business Profile Hero

Example:

> **Maya Beauty Studio**

> Hair & Beauty · St. John's

> ★ 4.8 · 126 reviews

Primary CTA:

> **Ask a question**

Secondary:

> **Talk to us**

---

# 26. Business AI CTA

Supporting text below buttons:

> **Have a question? Ask us about services, pricing, hours or anything else you want to know.**

---

# 27. Business Services

Heading:

> **Services**

Each service:

```text
Haircut
Classic haircut and styling

From $35
```

CTA:

> **Ask about this service**

---

# 28. Business Hours

Heading:

> **Hours**

Example:

```text
Monday       9:00 AM – 6:00 PM
Tuesday      9:00 AM – 6:00 PM
Wednesday    9:00 AM – 6:00 PM
```

Current status:

> **Open now**

or

> **Closed**

---

# 29. Business Profile Empty States

No reviews:

> **No reviews yet.**

Supporting:

> Be one of the first people to share your experience.

No services:

> **Services haven't been added yet.**

No description:

> **This business hasn't added a description yet.**

---

# 30. Chat Interface

The chat page should feel like messaging, not an AI dashboard.

Header:

> **Ask about Maya Beauty Studio**

Subtitle:

> **Usually responds quickly**

---

# 31. Initial AI Message

> **Hi! I can help you learn more about this business.**

Second line:

> **Ask me about services, pricing, hours or anything else you'd like to know.**

Suggested questions:

> What services do you offer?

> How much is a haircut?

> Are you open Saturday?

> I'd like to make a request.

---

# 32. AI Unknown Answer

> **I don't have that information yet.**

Then:

> **Would you like me to help you contact the business?**

Buttons:

> **Yes, contact them**

> **No, thanks**

---

# 33. Chat Human Escalation

When customer asks for a human:

> **I'll pass this along to the business.**

If the business isn't currently available:

> **The business isn't available right now, but I've saved your request. They'll be able to respond when they return.**

---

# 34. Voice UI

The voice interface should be extremely simple.

Screen:

```text
        Maya Beauty Studio

             ◉

       Listening...

       00:42

    [Mute]   [End]
```

No unnecessary controls.

---

# 35. Voice Introduction

Before connecting:

> **Talk instead of typing.**

Supporting:

> Ask questions naturally and get answers by voice.

Button:

> **Start voice conversation**

Privacy:

> **Your voice conversation isn't recorded.**

---

# 36. Voice Connecting

> **Connecting you...**

Subtext:

> **Just a moment.**

---

# 37. Voice Active

> **You're connected**

Status:

> **Listening**

or

> **Speaking**

---

# 38. Voice End

> **Conversation ended**

Supporting:

> **Was this helpful?**

Buttons:

> **Yes**

> **Not really**

Then:

> **What would you like to do next?**

Buttons:

> **Continue by chat**

> **Back to business**

---

# 39. Request Flow

When customer wants to request a service:

### Step 1

> **What would you like to request?**

Service selector.

### Step 2

> **When would you like it?**

Date/time.

### Step 3

> **Anything else we should know?**

Optional notes.

CTA:

> **Send request**

---

# 40. Request Confirmation

> **Request sent.**

Supporting:

> Your request has been sent to Maya Beauty Studio.

Status:

> **Waiting for response**

CTA:

> **View request**

---

# 41. Request Status

### Pending

> **Waiting for the business**

### Accepted

> **Your request was accepted**

### Declined

> **The business couldn't accept this request**

### Completed

> **Service completed**

---

# 42. Review Flow

Heading:

> **How was your experience?**

Rating:

★★★★★

Then:

> **Tell us a little more**

Placeholder:

> **What did you like or dislike?**

CTA:

> **Submit review**

Skip:

> **Maybe later**

---

# 43. Customer Dashboard

Heading:

> **Good to see you.**

Sections:

### Conversations

> **Your recent conversations**

### Requests

> **Your service requests**

### Saved

> **Businesses you've saved**

Empty:

> **Nothing here yet.**

Supporting:

> Businesses you save will appear here.

---

# 44. Business Signup

Heading:

> **Put your business in One Place.**

Supporting:

> Make it easier for customers to discover your services, ask questions and get in touch.

CTA:

> **Get started**

Secondary:

> **Already have an account? Sign in**

---

# 45. Business Onboarding — Step 1

Heading:

> **Let's start with the basics.**

Fields:

**Business name**

Placeholder:

> e.g. Maya Beauty Studio

**Business category**

Placeholder:

> Select a category

**Description**

Placeholder:

> Tell customers what your business does...

CTA:

> **Continue**

---

# 46. Business Onboarding — Step 2

Heading:

> **What do you offer?**

Supporting:

> Add the services customers can ask you about.

CTA:

> **Add a service**

Service fields:

> Service name

> Description

> Price

> Duration

Button:

> **Save service**

Continue:

> **Continue**

---

# 47. Business Onboarding — Step 3

Heading:

> **When are you available?**

Supporting:

> Add your regular business hours. You can change these later.

CTA:

> **Continue**

---

# 48. Business Onboarding — Step 4

Heading:

> **Help customers get answers.**

Supporting:

> Add information customers commonly ask about. One Place can use this information to answer questions for you.

Fields:

> Frequently asked questions

> Policies

> Payment information

> Parking information

> Other useful information

CTA:

> **Finish setup**

---

# 49. Business Onboarding Completion

Heading:

> **You're ready to be discovered.**

Supporting:

> Your business is now set up on One Place. You can continue adding services, information and availability from your dashboard.

CTA:

> **View my business**

Secondary:

> **Go to dashboard**

---

# 50. Business Dashboard

Header:

> **Good morning, Maya.**

Supporting:

> Here's what's happening with your business.

Cards:

```text
Profile views
24

Conversations
8

Requests
3

Reviews
12
```

---

# 51. Business Dashboard Navigation

```text
Overview
Profile
Services
Availability
Conversations
Requests
AI
Settings
```

---

# 52. Business Services Page

Heading:

> **Your services**

CTA:

> **Add service**

Empty state:

> **Your services are waiting to be added.**

Supporting:

> Add the services you offer so customers know what they can ask you about.

CTA:

> **Add your first service**

---

# 53. Business Conversations

Heading:

> **Conversations**

Filters:

> All

> New

> Active

> Completed

Empty state:

> **No conversations yet.**

Supporting:

> When customers start talking to your business, their conversations will appear here.

---

# 54. Business Requests

Heading:

> **Service requests**

Tabs:

> Pending

> Accepted

> Completed

> Declined

Empty:

> **No requests yet.**

Supporting:

> Customer requests will appear here when someone wants to use your service.

---

# 55. Business AI Page

Heading:

> **Your AI assistant**

Supporting:

> Give your assistant the information it needs to answer customer questions accurately.

Section:

> **Business information**

Section:

> **Frequently asked questions**

Section:

> **Policies**

Section:

> **Assistant style**

Options:

```text
Friendly
Professional
Casual
```

Save:

> **Save changes**

---

# 56. AI Safety Copy

Important notice:

> **Your assistant only uses information you've provided or information available in your One Place business profile.**

Secondary:

> **Keep your business information up to date so customers receive accurate answers.**

---

# 57. Business Profile Editing

Heading:

> **Your business profile**

CTA:

> **Save changes**

Fields:

* Business name
* Description
* Category
* Address
* Contact
* Website
* Hours

Success:

> **Your changes have been saved.**

---

# 58. Authentication

## Login

Heading:

> **Welcome back.**

Supporting:

> **Sign in to continue to One Place.**

Email placeholder:

> **Your email address**

Password:

> **Your password**

CTA:

> **Sign in**

Forgot:

> **Forgot your password?**

Signup:

> **Create an account**

---

# 59. Signup

Heading:

> **Welcome to One Place.**

Supporting:

> **Create an account and make finding services easier.**

Fields:

> First name

> Last name

> Email

> Password

CTA:

> **Create account**

Terms:

> By creating an account, you agree to our Terms and Privacy Policy.

---

# 60. Email Verification

> **Check your email.**

Supporting:

> We've sent a verification link to your email address.

CTA:

> **Resend email**

---

# 61. Loading States

Do not display generic:

> "Loading..."

where a better message exists.

Search:

> **Finding businesses...**

Business:

> **Loading business information...**

Chat:

> **Getting things ready...**

Voice:

> **Connecting you...**

Request:

> **Sending your request...**

---

# 62. General Error

Heading:

> **Something went wrong.**

Supporting:

> We couldn't complete that action. Please try again.

CTA:

> **Try again**

---

# 63. 404

Heading:

> **We couldn't find that page.**

Supporting:

> It may have moved or no longer exists.

CTA:

> **Back to One Place**

---

# 64. Business Not Found

> **This business isn't available right now.**

Supporting:

> The business may have been removed, paused or moved.

CTA:

> **Explore other businesses**

---

# 65. Navigation Philosophy

Navigation should never expose every feature.

Customers primarily need:

```text
Home
Search
Requests
Saved
Profile
```

Businesses:

```text
Overview
Conversations
Requests
Business
More
```

---

# 66. Primary Button Rules

Primary buttons use:

**Deep Teal**

Examples:

> Find a service

> Start voice conversation

> Send request

> List your business

Secondary:

White/neutral with border.

Destructive:

Error red.

---

# 67. Iconography

Use a single icon system.

Recommended:

**Lucide Icons**

Style:

* 1.75–2px stroke
* rounded
* simple

Avoid mixing icon libraries.

---

# 68. Cards

Business cards should not be excessively decorative.

Structure:

```text
Image
Business name
Verification
Rating
Category
Location
Price/service summary
Primary action
```

---

# 69. Business Image Treatment

Use:

* 16px radius
* consistent aspect ratio
* object-cover

Avoid excessive image galleries in MVP.

---

# 70. AI Visual Language

AI messages should be visually distinct but subtle.

Do **not** use:

* robot avatars everywhere
* glowing gradients
* "AI" badges on every sentence
* futuristic animations

Instead:

```text
One Place
```

or a simple conversational indicator.

The user should feel:

> "I'm getting help."

not:

> "I'm talking to a machine."

---

# 71. Voice Visual Language

Voice should feel human and calm.

Use:

* large central microphone/orb
* subtle waveform
* clear connection status

Avoid flashy visualizers.

---

# 72. Accessibility

Minimum target:

**WCAG 2.2 AA**

Requirements:

* keyboard navigation
* visible focus
* sufficient contrast
* semantic HTML
* labels for inputs
* screen-reader-friendly controls
* reduced motion support
* accessible error messages
* buttons must have clear labels

---

# 73. Responsive Breakpoints

Recommended:

```text
Mobile: <640px
Tablet: 640–1024px
Desktop: >1024px
Large desktop: >1280px
```

Do not design around dozens of breakpoints.

---

# 74. Mobile Search

On mobile, search becomes the primary interaction.

Homepage:

```text
ONE PLACE

What are you looking for?

[ Search........................ ]

Browse categories
```

The search bar should be immediately visible without scrolling.

---

# 75. Mobile Business Profile

Order:

```text
Image

Business name
Rating
Location

[Ask] [Talk]

Services

About

Hours

Reviews
```

The primary action should remain accessible.

---

# 76. Sticky Mobile CTA

On a business profile:

```text
┌─────────────────────────────┐
│ Ask a question   Talk       │
└─────────────────────────────┘
```

This can remain fixed at the bottom while browsing.

---

# 77. Conversation Mobile UI

Header:

```text
← Maya Beauty Studio
```

Messages:

```text
                 Customer
                     │
                     ▼

One Place
Hi! How can I help?
```

Input:

> **Ask anything...**

Microphone:

🎙

Send:

➤

---

# 78. Business Verification

Verified badge:

**✓ Verified**

Tooltip:

> **This business has been verified by One Place.**

Do not imply government certification.

---

# 79. Trust Signals

Use:

* verified business
* real reviews
* service information
* business location
* response information

Avoid meaningless badges.

---

# 80. Empty-State Philosophy

Every empty state should answer:

1. What happened?
2. Why does it matter?
3. What should I do next?

Example:

> **No conversations yet.**

> When customers start talking to your business, they'll appear here.

> **View your business profile**

---

# 81. Confirmation Dialogs

Avoid:

> "Are you sure?"

Instead:

### Delete service

> **Delete this service?**

> Customers will no longer see this service on your profile.

Buttons:

> **Delete service**

> **Keep service**

---

# 82. Toast Messages

Short.

Success:

> **Saved successfully.**

Request:

> **Request sent.**

Favorite:

> **Saved to your favorites.**

Remove:

> **Removed from your favorites.**

Error:

> **Couldn't save your changes. Try again.**

---

# 83. Copywriting Rules

One Place copy should be:

### Short

Don't say:

> "Please proceed to click the button below in order to continue."

Say:

> **Continue**

### Human

Don't say:

> "Initiate conversational interaction."

Say:

> **Start a conversation**

### Direct

Don't say:

> "Utilize our platform to discover service providers."

Say:

> **Find a service**

---

# 84. Words to Avoid

Avoid excessive use of:

* leverage
* utilize
* ecosystem
* revolutionary
* cutting-edge
* AI-powered
* seamless
* solution
* platform
* innovative

The product should **show value rather than announce it**.

---

# 85. Brand Voice

One Place sounds like:

> **A smart person helping you get something done.**

Not:

> A salesperson.

Not:

> A robot.

Not:

> A government department.

Not:

> A social media influencer.

---

# 86. Microcopy Principles

Instead of:

> **Submit**

Use:

> **Send request**

Instead of:

> **Create**

Use:

> **Add service**

Instead of:

> **Interact with AI**

Use:

> **Ask a question**

Instead of:

> **Initiate voice session**

Use:

> **Talk instead**

---

# 87. MVP Page Inventory

The MVP should contain approximately:

### Public

```text
/
 /search
 /categories/[category]
 /businesses/[slug]
 /about
 /for-businesses
```

### Authentication

```text
/login
/signup
/verify
/forgot-password
```

### Customer

```text
/dashboard
/conversations
/conversations/[id]
/requests
/requests/[id]
/saved
/profile
```

### Business

```text
/business
/business/onboarding
/business/dashboard
/business/profile
/business/services
/business/availability
/business/conversations
/business/requests
/business/ai
/business/settings
```

### Admin

```text
/admin
/admin/businesses
/admin/categories
/admin/reviews
```

---

# 88. Design System Component Inventory

Build reusable components rather than styling every page independently.

### Core

```text
Button
Input
Textarea
Select
Checkbox
Radio
Switch
Badge
Avatar
Tooltip
Modal
Drawer
Dropdown
Tabs
Toast
Alert
```

### Product

```text
BusinessCard
ServiceCard
CategoryCard
ReviewCard
ConversationMessage
ConversationComposer
VoiceInterface
RequestCard
Rating
BusinessStatus
```

### Layout

```text
Header
Footer
Sidebar
MobileNav
PageHeader
Section
Container
EmptyState
LoadingState
ErrorState
```

---

# 89. Design Tokens

The implementation should define tokens rather than hard-code values throughout the application.

Example:

```text
colors.primary
colors.background
colors.surface
colors.text
colors.muted
colors.border
colors.success
colors.warning
colors.error
```

Likewise:

```text
radius.sm
radius.md
radius.lg

spacing.xs
spacing.sm
spacing.md
spacing.lg
```

This makes future redesign much easier.

---

# 90. Animation

Animations should be subtle.

Use for:

* page transitions
* modal appearance
* voice connection
* loading
* toast

Avoid:

* excessive parallax
* bouncing buttons
* continuous movement
* distracting AI animations

Respect:

```text
prefers-reduced-motion
```

---

# 91. Design Principle for AI

The AI should **disappear when it isn't needed**.

If the customer simply wants:

> "What time do you close?"

they should get:

> **We close at 6:00 PM today.**

Not:

> "According to the information available to me..."

Keep the intelligence invisible.

---

# 92. Design Principle for Voice

Voice should be an **alternative input method**, not a separate product.

The same conversation should conceptually support:

```text
Chat
  ↕
Voice
```

A user should be able to start in chat and continue through voice later.

---

# 93. Final UX Architecture

```text
                     ONE PLACE
                         │
        ┌────────────────┼────────────────┐
        │                │                │
     Discover          Ask              Request
        │                │                │
     Search          Chat/Voice        Service
        │                │                │
        └────────────────┼────────────────┘
                         │
                      Business
                         │
                      Review
```

That is the UX loop.

---

# 94. MVP Visual Identity Summary

**Primary:** `#123C3A`
**Accent:** `#E7A83B`
**Background:** `#FAFAF7`
**Surface:** `#FFFFFF`
**Primary text:** `#17201F`
**Secondary text:** `#5D6866`
**Border:** `#E5E9E7`

**Font:** Inter

**Border radius:** 8 / 12 / 16 / 24

**Max content width:** 1200px

**Design style:** Minimal, warm, conversational, premium.

---

# 95. The Most Important UX Decision

One Place should **not make users learn One Place**.

A person should arrive and immediately understand:

> **"Tell me what you need."**

That is why the homepage, search, business profile and conversation interface should all revolve around that single idea.

The product's complexity belongs **behind the interface**, not inside it.

