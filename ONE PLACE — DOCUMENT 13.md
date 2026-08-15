# DOCUMENT 13 — CONVERSATION, CHAT, HUMAN HANDOFF & VOICE EXPERIENCE SPECIFICATION

**Product:** One Place
**Document:** 13
**Status:** Development-ready
**Scope:** MVP + Post-MVP
**Primary communication:** Web chat
**Voice infrastructure:** LiveKit
**Authentication:** Supabase Auth
**Application:** Next.js
**Realtime:** Supabase Realtime
**AI:** Provider-agnostic LLM abstraction

---

# 1. Purpose

This document defines the complete communication experience inside One Place.

It covers:

* customer-to-business conversations
* AI-assisted conversations
* human handoff
* business staff assignment
* chat states
* voice states
* LiveKit sessions
* conversation lifecycle
* message lifecycle
* availability
* failure scenarios
* notifications
* conversation closure
* post-conversation experience
* future phone/telephony integration
* exact user-facing copy

The central principle is:

> **One Place is not primarily a chat application. It is a communication layer between people looking for a service and the people capable of providing it.**

The communication channel should therefore remain invisible and simple.

The user should think:

> "I need something. One Place helped me find the right person."

—not:

> "I'm navigating a complicated communication platform."

---

# 2. Communication Philosophy

The communication system should follow five principles.

### Principle 1 — Start simple

The customer should never be confronted with:

* complicated menus
* unnecessary forms
* technical terminology
* complicated routing
* multiple communication modes at once

### Principle 2 — AI assists; it does not pretend

The AI can:

* answer questions
* collect information
* explain services
* qualify requests
* route conversations

It should not pretend to be human.

### Principle 3 — Humans remain available

When the customer needs a person:

> **Talk to someone**

should always be a clear option when the business supports it.

### Principle 4 — Voice is optional

Chat should work perfectly without voice.

Voice is an additional communication channel, not the foundation of the product.

### Principle 5 — The customer should never wonder what is happening

Every state needs clear feedback.

---

# 3. Communication Architecture

```text
                         CUSTOMER
                            │
                            ▼
                     ONE PLACE WEB
                            │
              ┌─────────────┴─────────────┐
              │                           │
             CHAT                        VOICE
              │                           │
              ▼                           ▼
       Conversation Service        Voice Service
              │                           │
              ▼                           ▼
       Supabase Realtime              LiveKit
              │                           │
        ┌─────┴──────┐              ┌─────┴─────┐
        │            │              │           │
        ▼            ▼              ▼           ▼
       AI          HUMAN           AI          HUMAN
```

---

# 4. Communication Modes

MVP supports:

### 1. Text chat

Customer ↔ AI

Customer ↔ Human

Customer ↔ AI → Human

### 2. Web voice

Customer ↔ AI

Customer ↔ Human

Depending on business configuration.

---

# 5. Future Communication Modes

Post-MVP:

* telephone
* SMS
* WhatsApp
* email
* video
* scheduled callback
* multilingual voice
* voice transcription
* voice summaries

These should not affect the core conversation model.

---

# 6. Conversation Entity

A conversation represents a communication context.

Conceptually:

```text
conversation
-------------
id
business_id
customer_id
status
channel
started_at
last_message_at
closed_at
created_at
updated_at
```

---

# 7. Conversation Channels

MVP:

```text
chat
voice
```

Future:

```text
phone
sms
whatsapp
email
video
```

---

# 8. Conversation Statuses

The conversation state machine is:

```text
NEW
 │
 ▼
ACTIVE
 │
 ├───────────────┐
 │               │
 ▼               ▼
WAITING       HUMAN_REQUESTED
 │               │
 │               ▼
 │          HUMAN_CONNECTED
 │               │
 └───────────────┘
         │
         ▼
       CLOSED
```

Failure:

```text
ACTIVE
  │
  ▼
FAILED
```

---

# 9. Meaning of Each State

## NEW

Conversation has just been created.

Usually lasts only briefly.

---

## ACTIVE

Conversation is currently being used.

---

## WAITING

Customer has sent a request that requires a response.

Example:

> "Is there anyone available to speak with me?"

---

## HUMAN_REQUESTED

Customer explicitly wants a human.

---

## HUMAN_CONNECTED

A business staff member has joined.

---

## CLOSED

Conversation has ended.

---

## FAILED

A technical problem prevented normal communication.

---

# 10. Conversation State Rules

A conversation should never jump randomly between states.

Example:

```text
NEW
→ ACTIVE
→ HUMAN_REQUESTED
→ HUMAN_CONNECTED
→ CLOSED
```

is valid.

But:

```text
CLOSED
→ ACTIVE
```

should create a new conversation unless the product explicitly supports reopening.

---

# 11. Reopening Conversations

MVP:

> Closed conversations cannot be reopened.

Customer starts a new conversation.

Post-MVP:

> A previous conversation may be reopened within a configurable period.

---

# 12. Starting a Conversation

Customer visits a business.

They see:

> **Talk to [Business Name]**

Secondary:

> Ask a question, find out what's available, or get help choosing the right service.

---

# 13. Conversation Start Copy

### Button

> **Talk to us**

Alternative:

> **Ask a question**

For businesses supporting voice:

> **Talk to us**

opens the communication screen where the customer can choose:

> **Chat**

or:

> **Voice**

Do not show unnecessary options if only one is available.

---

# 14. Conversation Creation Flow

```text
Customer clicks Talk
        ↓
Authenticate
        ↓
Check business status
        ↓
Check communication availability
        ↓
Find existing active conversation
        ↓
If none → create conversation
        ↓
Load business context
        ↓
Start communication
```

---

# 15. Existing Conversation Rule

If the customer already has an active conversation with the same business:

> Continue that conversation.

Do not create duplicates simply because the user clicked the button again.

---

# 16. New Conversation Welcome

The AI or system may start with:

> **Hi! How can we help?**

For a specific business:

> **Hi! You're chatting with [Business Name]. What can we help you with?**

Avoid:

> "Welcome to our AI-powered intelligent conversational customer service interface."

Never.

---

# 17. Customer Chat Interface

Recommended layout:

```text
┌────────────────────────────────┐
│ ← Business Name       • Online │
├────────────────────────────────┤
│                                │
│  Business/AI message           │
│                                │
│              Customer message  │
│                                │
│  Business/AI message           │
│                                │
│                                │
├────────────────────────────────┤
│ Ask anything...           🎙   │
└────────────────────────────────┘
```

---

# 18. Chat Header

Display:

* business name
* logo/avatar
* communication status
* back button

Optional:

> AI assistant

or:

> Team available

---

# 19. AI Disclosure

If the customer is talking to AI:

> **AI assistant**

should be visible.

Do not intentionally make an AI appear human.

---

# 20. AI Introduction

Recommended:

> **I'm the One Place assistant for [Business Name]. I can help with services, pricing, availability, and general questions.**

Then:

> **What can I help you with?**

---

# 21. AI Scope

The assistant should primarily answer from business-defined information.

Examples:

* services
* pricing
* hours
* policies
* location
* availability where connected
* frequently asked questions

---

# 22. AI Unknown Answer

If information is unavailable:

> **I don't have that information yet.**

Then:

> **Would you like me to connect you with someone from the team?**

Buttons:

> **Talk to someone**

> **Keep chatting**

---

# 23. AI Confidence

Do not expose numerical confidence to customers.

Never display:

> "Confidence: 63%"

Instead:

> **I'm not completely sure about that.**

Then offer human assistance.

---

# 24. Human Request

The customer can type:

> "I want to speak to someone."

The system detects the intent.

It responds:

> **Absolutely. I'll see if someone from the team is available.**

Then:

```text
Conversation
→ HUMAN_REQUESTED
```

---

# 25. Explicit Human Button

Always provide a clear escape route where human assistance is supported.

Button:

> **Talk to a person**

This is important.

Users should never feel trapped inside an AI conversation.

---

# 26. Human Availability

Three basic states:

```text
AVAILABLE
BUSY
OFFLINE
```

---

# 27. Human Available

Message:

> **Someone from the team is available.**

Button:

> **Connect me**

---

# 28. Human Busy

Message:

> **The team is currently helping other customers.**

Then:

> **You can keep chatting here or leave a message for the team.**

Buttons:

> **Keep chatting**

> **Leave a message**

---

# 29. Human Offline

Message:

> **The team isn't available right now.**

Then:

> **You can leave a message and they'll be able to respond when they're back.**

Button:

> **Leave a message**

---

# 30. No AI, No Human

If the business has neither AI nor staff available:

> **We're unable to respond right now.**

Then:

> **You can leave a message and we'll get back to you.**

---

# 31. Staff Assignment

When human assistance is requested:

```text
Conversation
      ↓
Human requested
      ↓
Find eligible staff
      ↓
Check availability
      ↓
Select staff
      ↓
Assign
      ↓
Notify staff
```

---

# 32. Staff Selection

MVP can use simple assignment:

```text
first available authorized staff member
```

Future:

* round robin
* skill-based routing
* language
* category
* workload
* availability
* business location

---

# 33. Staff Notification

Example:

> **New customer waiting**

> Sarah is looking for help with your services.

Button:

> **Join conversation**

---

# 34. Staff Dashboard

Staff should see:

```text
┌──────────────────────────────┐
│ Conversations                │
├──────────────────────────────┤
│ Waiting (2)                  │
│                              │
│ ● Sarah — Pricing            │
│ ● John — Booking             │
│                              │
│ Active (3)                   │
│                              │
│ ● Michael                    │
│ ● David                      │
└──────────────────────────────┘
```

---

# 35. Staff Conversation Screen

Staff sees:

* customer name
* conversation history
* AI summary
* request context
* relevant business information
* messages
* customer request
* status
* action controls

---

# 36. AI-to-Human Handoff Context

The human should not have to ask:

> "What were you talking about?"

The system should provide:

> **Conversation summary**

Example:

> Customer is looking for a haircut next Saturday. They asked about pricing and availability and would like to speak with someone before booking.

---

# 37. AI Summary

The summary is generated server-side.

It should be concise.

Structure:

```text
Customer need:
Preferred service:
Important details:
Questions:
Outstanding issue:
```

---

# 38. Human Join Event

When staff joins:

Customer sees:

> **You're now connected with Sarah.**

Optional:

> **Sarah from [Business Name] has joined the conversation.**

---

# 39. Human Handoff Copy

AI:

> **I'm connecting you with someone from the team now.**

After connection:

> **You're connected.**

Simple.

---

# 40. AI Withdrawal

Once a human joins, the AI should stop responding automatically unless the business explicitly enables AI assistance.

The human becomes the primary responder.

---

# 41. AI as Human Assistant

Post-MVP, AI can assist the staff member privately.

For example:

```text
Customer asks question
       ↓
AI suggests response
       ↓
Staff reviews
       ↓
Staff sends
```

The customer does not necessarily see the AI suggestion.

---

# 42. Human Conversation Ending

Staff can close a conversation.

Copy:

> **Conversation closed**

Customer:

> **This conversation has ended. If you need anything else, you can start a new conversation.**

Button:

> **Done**

---

# 43. Customer Ending Conversation

Customer can select:

> **End conversation**

Confirmation:

> **End this conversation?**

> You can always start a new conversation with this business later.

Buttons:

> **End conversation**

> **Keep chatting**

---

# 44. Post-Conversation Experience

After closure:

```text
Conversation ended
        ↓
Optional review
        ↓
Return to business
```

---

# 45. Review Prompt

> **How was your experience?**

Five stars:

★★★★★

Optional:

> **Want to tell us more?**

Button:

> **Submit**

Secondary:

> **Not now**

---

# 46. Voice Experience

Voice should feel like a natural extension of chat.

The user should not need to understand LiveKit.

They should simply see:

> **Talk by voice**

---

# 47. Voice Button

Recommended:

> 🎙 **Talk by voice**

or:

> **Start voice chat**

Avoid:

> "Initialize LiveKit session"

Obviously.

---

# 48. Voice Start Flow

```text
Customer
 ↓
Tap Talk by voice
 ↓
Microphone permission
 ↓
Create voice session
 ↓
Connect LiveKit
 ↓
Show voice interface
```

---

# 49. Microphone Permission

If permission has not been granted:

> **Allow microphone access to start a voice conversation.**

Browser handles the actual permission prompt.

---

# 50. Permission Denied

If denied:

> **Microphone access is turned off.**

Then:

> You can enable microphone access in your browser settings or continue by chat.

Button:

> **Continue with chat**

---

# 51. Voice Connecting State

Display:

```text
Connecting...
```

Secondary:

> We're getting your conversation ready.

Do not show technical errors like:

> WebRTC ICE negotiation failed.

---

# 52. Voice Connected State

```text
      ●
      
  Connected

  04:32

 [Mute] [End]
```

If AI:

> **AI assistant**

If human:

> **Sarah from [Business Name]**

---

# 53. Voice Controls

MVP:

* mute/unmute
* end call

Potential later:

* speaker
* device selection
* reconnect
* transfer
* keypad
* hold

---

# 54. Voice Mute

When muted:

> **You're muted**

The control should visibly change.

---

# 55. Ending Voice

Button:

> **End**

Confirmation is generally unnecessary for a voice call.

Instead, use a short press/click target and clear visual hierarchy.

---

# 56. Voice End State

> **Call ended**

Then:

> **Was this helpful?**

Buttons:

> **Yes**

> **Not really**

Optional review.

---

# 57. Voice Connection Failure

If connection fails:

> **We couldn't connect the call.**

Then:

> **You can try again or continue by chat.**

Buttons:

> **Try again**

> **Continue with chat**

---

# 58. Voice Disconnection

If unexpectedly disconnected:

> **Your connection was interrupted.**

Buttons:

> **Reconnect**

> **Continue by chat**

---

# 59. Reconnection

If technically possible, automatically attempt reconnection.

Display:

> **Reconnecting...**

Do not immediately terminate the conversation.

---

# 60. Reconnection Failure

After reasonable retries:

> **We couldn't reconnect the call.**

> Your conversation is still available by chat.

Button:

> **Continue by chat**

---

# 61. Voice Session Metadata

MVP stores:

```text
voice_session_id
conversation_id
channel
started_at
ended_at
duration
status
```

Do not store audio by default.

---

# 62. No Automatic Recording

The MVP does not automatically record conversations.

Reason:

* privacy
* security
* storage
* compliance
* user trust
* unnecessary complexity

---

# 63. Transcription

Not required for MVP.

Post-MVP:

```text
voice
 ↓
transcription
 ↓
conversation transcript
```

Only after appropriate privacy/consent policies are defined.

---

# 64. Voice + AI

There are two primary configurations.

### Configuration A

```text
Customer
 ↓
Voice
 ↓
AI Agent
```

### Configuration B

```text
Customer
 ↓
Voice
 ↓
Human
```

Future:

```text
Customer
 ↓
AI
 ↓
Human
```

---

# 65. AI Voice Agent

The AI voice agent should have access to the same business knowledge used by chat.

Do not create a completely separate knowledge system.

```text
Business Knowledge
       │
 ┌─────┴─────┐
 ▼           ▼
Chat AI    Voice AI
```

---

# 66. Voice AI Handoff

Customer says:

> "I need to speak to someone."

AI:

> **Of course. I'll see if someone from the team is available.**

System checks availability.

If available:

> **I'm connecting you now.**

---

# 67. Voice Human Unavailable

AI:

> **No one from the team is available right now.**

Then:

> **I can help you here, or you can leave a message for the team.**

---

# 68. Voice AI Failure

If the AI voice agent fails:

> **I'm having trouble with the voice connection.**

Then:

> **Would you like to continue by chat?**

---

# 69. Conversation Notifications

MVP:

### Customer

Notify when:

* human responds
* request is updated
* staff sends message while customer is away

### Business

Notify when:

* new conversation
* human handoff
* new request

---

# 70. Notification Strategy

Do not notify users for every tiny event.

For example:

If a customer is actively viewing the conversation:

> No email notification is necessary for every message.

If they leave:

> Notification can be sent when a meaningful response arrives.

---

# 71. Presence

MVP presence can be simple.

Customer may see:

> **Online**

> **Available**

> **Usually responds quickly**

Avoid promising exact response times unless the system has enough data.

---

# 72. Typing Indicators

Chat can show:

> **Sarah is typing...**

AI:

> **Thinking...**

Keep it subtle.

---

# 73. AI Typing State

Avoid making the AI appear artificially human.

Use:

> **Thinking…**

rather than:

> **Sarah is typing…**

---

# 74. Message States

Customer message:

```text
sending
sent
failed
```

---

# 75. Failed Message

Display:

> **Message failed to send**

Button:

> **Retry**

Do not silently discard it.

---

# 76. Empty Conversation State

If conversation has no messages:

> **Start the conversation**

> Ask about services, pricing, availability, or anything else you'd like to know.

---

# 77. Long Conversations

MVP can use standard chronological scrolling.

Future:

* message search
* conversation summaries
* jump to latest
* pagination
* AI-generated history

---

# 78. Conversation Pagination

Do not load thousands of messages at once.

Load recent messages first.

Example:

```text
Latest 50
     ↓
Load earlier messages
```

---

# 79. Attachments

MVP:

> No attachments.

Post-MVP:

* images
* documents
* screenshots
* PDFs

Attachments introduce:

* malware risks
* storage
* scanning
* permissions
* privacy

Therefore they should not delay MVP.

---

# 80. Links

Users may send links.

Future moderation/security should consider:

* phishing
* malicious links
* spam

---

# 81. Spam Protection

Conversation rate limits:

```text
messages/minute
messages/hour
new conversations/day
voice sessions/day
```

Limits should be configurable.

---

# 82. Abuse Reporting

Post-MVP or late MVP:

> **Report conversation**

Reasons:

* harassment
* spam
* inappropriate content
* scam
* other

---

# 83. Blocking

Post-MVP:

Customer can block a business.

Business can block a customer where justified.

This should be carefully designed because businesses may serve the public and blocking can have consequences.

---

# 84. Business Closing Hours

If the business has configured hours, the system can display:

> **Closed right now**

But do not automatically prevent chat.

The customer may still:

> Leave a message.

---

# 85. Business Open

Display:

> **Open now**

If human staff are available:

> **Team available**

These are different concepts.

A business can be open while staff are unavailable for chat.

---

# 86. Business Availability Model

Distinguish:

```text
business_open
```

from:

```text
communication_available
```

and:

```text
human_available
```

This is important.

---

# 87. Example

Business:

> Open

AI:

> Available

Human:

> Unavailable

Customer sees:

> **We're open. You can chat with our assistant or leave a message for the team.**

---

# 88. Business Closed but AI Available

Display:

> **We're currently closed, but our assistant can answer questions about our services.**

---

# 89. Business Closed and AI Unavailable

Display:

> **We're currently closed.**

> Leave a message and the team can get back to you.

---

# 90. Business Temporarily Unavailable

If disabled:

> **This business isn't available right now.**

Do not expose internal reasons.

---

# 91. Customer Abandons Conversation

If customer simply leaves the page:

Conversation remains:

```text
ACTIVE
```

for a configurable period.

Later:

```text
INACTIVE
```

Post-MVP.

---

# 92. Conversation Timeout

Do not automatically close conversations too aggressively.

Recommended MVP:

* conversation remains active
* business/customer can return
* explicit closure determines final state

Future inactivity rules can be added.

---

# 93. Duplicate Conversation Prevention

If:

```text
customer + business
```

already has an active conversation, reuse it.

This prevents:

```text
Conversation #1
Conversation #2
Conversation #3
```

for the same issue.

---

# 94. Separate Requests From Conversations

This is an important architecture decision.

A conversation is communication.

A request is an actionable business object.

Example:

```text
Conversation:
"Do you have Saturday availability?"

Request:
"Book haircut Saturday at 2 PM."
```

They should not be the same entity.

---

# 95. Conversation Can Produce Request

```text
Conversation
     ↓
Customer wants to book
     ↓
Request created
     ↓
Conversation continues
```

---

# 96. Voice Can Produce Request

Exactly the same.

```text
Voice
 ↓
AI/Human
 ↓
Request
```

The request layer should not care whether the conversation originated from chat or voice.

---

# 97. Communication Architecture Principle

This is critical:

> **Chat and voice are channels. Conversation is the underlying business object.**

Therefore:

```text
               Conversation
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
        Chat                 Voice
          │                   │
          └─────────┬─────────┘
                    ▼
                 Request
```

---

# 98. Future Phone Architecture

Post-MVP:

```text
Customer Phone
      │
      ▼
Telephony Provider
      │
      ▼
LiveKit
      │
      ▼
Conversation
      │
 ┌────┴────┐
 ▼         ▼
AI       Human
```

This means the phone channel becomes another interface to the same conversation engine.

---

# 99. Why This Architecture Matters

We do **not** want:

```text
Chat system
Voice system
Phone system
```

all having separate business logic.

We want:

```text
Communication Engine
       │
 ┌─────┼─────┐
 ▼     ▼     ▼
Chat  Voice Phone
```

---

# 100. Conversation Service API

Core application operations:

```text
createConversation()
getConversation()
getConversationMessages()
sendMessage()
closeConversation()
requestHuman()
assignStaff()
acceptConversation()
leaveConversation()
```

---

# 101. Voice Service API

Core operations:

```text
createVoiceSession()
getVoiceSession()
endVoiceSession()
reconnectVoiceSession()
```

The voice service does not decide business permissions independently.

It receives authorization context from the application.

---

# 102. Human Handoff Service

Conceptually:

```text
requestHuman()
findAvailableStaff()
assignStaff()
notifyStaff()
connectStaff()
releaseStaff()
```

---

# 103. Assignment Rules

MVP:

```text
business
+
authorized staff
+
available
=
eligible
```

Select the first available eligible staff member.

Post-MVP ranking:

```text
availability
+
skill
+
language
+
category
+
workload
+
response history
```

---

# 104. Staff Capacity

Post-MVP each staff member can have:

```text
max_concurrent_conversations
```

Example:

```text
Sarah → 3
John → 5
```

MVP can use a simple available/unavailable state.

---

# 105. Human Handoff Timeout

If nobody accepts:

```text
human_requested
       ↓
waiting
       ↓
timeout
```

Customer sees:

> **No one is available right now.**

Then:

> You can continue with the assistant or leave a message.

---

# 106. Customer Canceling Handoff

Customer can cancel while waiting:

> **Stop waiting**

Then:

> **Continue with the assistant**

---

# 107. Staff Rejects Conversation

If staff cannot handle it:

```text
staff rejects
 ↓
find next eligible staff
```

If none:

> **No one else is available right now.**

---

# 108. Staff Disconnects

If staff unexpectedly disconnects:

> **Your connection to the team was interrupted.**

Then:

> **We're checking whether someone else is available.**

System attempts reassignment.

---

# 109. Customer Disconnects

The conversation remains available.

If voice:

> Voice session ends.

Chat:

> Conversation remains accessible.

---

# 110. AI Escalation Rules

Businesses can configure escalation triggers.

Examples:

```text
customer requests human
pricing uncertainty
booking request
complaint
refund question
sensitive issue
AI confidence below threshold
```

---

# 111. Business AI Configuration

Business owner should eventually configure:

### Assistant name

Example:

> Maya

### Tone

```text
friendly
professional
concise
warm
```

### Scope

```text
services
pricing
hours
booking
FAQ
```

### Human escalation

```text
enabled
disabled
```

---

# 112. AI Configuration Copy

### Heading

> **Set up your assistant**

### Copy

> Give your assistant the information it needs to answer customer questions accurately.

Field:

> **Assistant name**

Field:

> **What should your assistant help with?**

Toggle:

> **Let customers ask for a person**

---

# 113. AI Must Not Invent Business Policies

If a business has not provided:

* refund policy
* cancellation policy
* availability
* pricing

the AI must not invent them.

Instead:

> **I don't have that information. Would you like to speak with the team?**

---

# 114. AI System Prompt Principle

The prompt should contain rules like:

```text
You represent the business accurately.
Only use provided business information.
Do not invent prices, availability, policies or services.
Clearly identify yourself as an AI assistant when relevant.
Escalate when the customer asks for a person.
```

Exact prompts belong in the AI implementation document.

---

# 115. Voice AI Conversation Style

Voice responses should be shorter than chat responses.

Instead of:

> "We offer three different packages..."

Use:

> "We have three packages. I can walk you through them."

Voice should sound conversational.

---

# 116. Voice Latency Target

The goal should be:

> **Fast enough that conversation feels natural.**

Track:

* time to connect
* time to first response
* response latency
* interruption handling

Exact infrastructure targets should be validated during implementation.

---

# 117. Voice Interruption

Post-MVP, AI should support:

> customer interruption / barge-in

If the AI is speaking and customer says:

> "Wait, no..."

the system should stop/adjust the response.

This is essential for a polished voice agent.

---

# 118. Voice MVP Recommendation

For the first implementation:

> **Prioritize reliable connection and human/AI conversation over advanced voice intelligence.**

Do not spend weeks perfecting:

* emotion detection
* complex interruptions
* advanced voice analytics

before the basic experience works.

---

# 119. Communication Analytics

Track:

```text
conversation_started
message_sent
human_requested
human_connected
conversation_closed
voice_started
voice_connected
voice_failed
voice_ended
request_created
```

---

# 120. Important Metrics

### Customer

* conversations started
* conversations completed
* human handoff rate
* response time
* voice failure rate

### Business

* conversations received
* human requests
* successful handoffs
* requests generated
* conversion to service

### Platform

* AI usage
* voice usage
* infrastructure cost
* failed sessions
* abuse

---

# 121. Conversation Success

Do not define success simply as:

> Conversation lasted 20 minutes.

Better signals:

```text
question answered
request created
booking completed
human connected
customer indicated satisfaction
```

---

# 122. AI Success

Potential future metric:

```text
AI resolved conversation
```

Meaning:

> Customer received an answer without requiring human intervention.

But don't optimize aggressively for this metric.

A successful handoff can also be a successful conversation.

---

# 123. Customer Experience Principle

The platform should never make customers feel:

> "I am being forced to talk to AI."

Instead:

> "I can get help quickly, and I can talk to a person when I need one."

---

# 124. Complete Customer Journey

```text
Discover business
      ↓
View business
      ↓
Talk to business
      ↓
Choose chat/voice
      ↓
AI or human
      ↓
Question answered
      │
      ├── Done
      │
      ├── Request service
      │
      └── Talk to human
                 ↓
             Human joins
                 ↓
             Resolution
                 ↓
             Conversation closes
                 ↓
               Review
```

---

# 125. Complete Human Handoff Journey

```text
Customer
   ↓
AI
   ↓
"I want to speak to someone."
   ↓
HUMAN_REQUESTED
   ↓
Check availability
   │
   ├── Available
   │      ↓
   │   Assign staff
   │      ↓
   │   Notify staff
   │      ↓
   │   Staff joins
   │      ↓
   │   HUMAN_CONNECTED
   │
   └── Unavailable
          ↓
       Leave message
          OR
       Continue AI
```

---

# 126. Complete Voice Journey

```text
Customer
   ↓
Talk by voice
   ↓
Microphone permission
   ↓
Create voice session
   ↓
LiveKit connection
   ↓
AI/Human
   ↓
Conversation
   ↓
End
   ↓
Persist metadata
   ↓
Optional feedback
```

---

# 127. Complete Failure Journey

```text
Customer
   ↓
Voice
   ↓
Connection fails
   ↓
Retry
   │
   ├── Success → continue
   │
   └── Failure
          ↓
      Continue chat
```

The system should always provide a fallback.

---

# 128. Critical UX Rule

**Every communication failure must have an alternative.**

Examples:

```text
Voice fails
→ Chat

Human unavailable
→ AI / message

AI doesn't know
→ Human / message

Staff disconnects
→ Reassign / message

Message fails
→ Retry
```

This is one of the most important design principles in One Place.

---

# 129. MVP Communication Scope

### Build

* [x] Text chat
* [x] AI chat
* [x] Human handoff
* [x] Staff assignment
* [x] Realtime messages
* [x] Conversation state
* [x] Basic notifications
* [x] Web voice
* [x] LiveKit session management
* [x] Voice failure fallback
* [x] Conversation closure
* [x] Review prompt

### Do not build yet

* [ ] telephone numbers
* [ ] PSTN
* [ ] SMS
* [ ] WhatsApp
* [ ] video
* [ ] automatic recording
* [ ] transcription
* [ ] complex call center routing
* [ ] advanced workforce management
* [ ] advanced voice analytics

---

# 130. Post-MVP Phase 1

Add:

* scheduled callbacks
* better staff routing
* staff capacity
* conversation summaries
* AI staff assistant
* transcription
* improved voice interruption
* better notification system

---

# 131. Post-MVP Phase 2

Add:

* direct phone numbers
* PSTN
* IVR
* multilingual voice
* SMS
* WhatsApp
* advanced scheduling
* voice recording where appropriate
* advanced business routing

---

# 132. Post-MVP Phase 3

Potentially:

```text
One Place Communication Infrastructure
```

where businesses can receive:

* web chat
* web voice
* phone
* SMS
* WhatsApp
* AI
* human calls

through one unified conversation engine.

---

# 133. The Long-Term Architecture

```text
                         CUSTOMER
                            │
        ┌───────────────────┼────────────────────┐
        │                   │                    │
       WEB                 PHONE               MOBILE
        │                   │                    │
       CHAT               PSTN                 CHAT
        │                   │                    │
        └───────────────────┼────────────────────┘
                            │
                            ▼
                 ONE PLACE COMMUNICATION
                         ENGINE
                            │
             ┌──────────────┼──────────────┐
             │              │              │
             ▼              ▼              ▼
             AI           HUMAN          REQUEST
             │              │              │
             └──────────────┼──────────────┘
                            ▼
                         BUSINESS
```

This is the deeper strategic value of the architecture.

---

# 134. Final Product Principle

One Place should never be positioned as:

> **"An AI chatbot for businesses."**

That is too narrow.

The communication layer is:

> **A simple way for customers to reach the right business, get answers quickly, and speak to a person when they need one.**

AI and LiveKit are infrastructure enabling that experience.

They are not the product itself.

---

# 135. Final Technical Principle

The communication engine must remain **channel-independent**.

```text
Conversation
    │
    ├── Chat
    ├── Voice
    ├── Phone
    ├── SMS
    ├── WhatsApp
    └── Future channels
```

All channels eventually feed into the same:

```text
Conversation
     ↓
AI
     ↓
Human
     ↓
Request
     ↓
Resolution
```

That decision should remain fixed as One Place evolves.

---

# DOCUMENT 13 — COMPLETION STATUS

**Development-ready for MVP communication architecture.**

Defined:

* [x] conversation model
* [x] conversation states
* [x] chat architecture
* [x] message lifecycle
* [x] AI interaction
* [x] AI disclosure
* [x] human handoff
* [x] staff assignment
* [x] staff availability
* [x] business availability
* [x] voice architecture
* [x] LiveKit lifecycle
* [x] microphone permissions
* [x] connection failures
* [x] reconnection
* [x] voice fallback
* [x] conversation closure
* [x] review transition
* [x] notifications
* [x] analytics events
* [x] abuse/rate-limit considerations
* [x] future PSTN architecture
* [x] future SMS/WhatsApp architecture
* [x] post-MVP roadmap
* [x] customer-facing copy for communication states
