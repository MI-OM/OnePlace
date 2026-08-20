# OnePlace — User Testing Document

## Overview

**Platform:** OnePlace (localhost:3000)
**Environment:** Local development with Supabase (Docker)
**Test accounts:** `hello@test.com` (customer, id: `6e136889-...`)
**Browser:** Chrome (latest) recommended for voice/WebRTC features
**Date:** August 2026

---

## Pre-Test Setup

| Step | Action | Expected |
|------|--------|----------|
| 1 | Run `npm run dev` | App loads at localhost:3000 |
| 2 | Verify Docker Supabase is running | `docker ps` shows `supabase_db_oneplace` |
| 3 | Verify all migrations applied | All 24+ tables exist (run `\dt public.*` in psql) |
| 4 | Login as `hello@test.com` | Redirects to `/dashboard` |

---

## Module A: Authentication & Onboarding

### A1 — Sign up

| # | Action | Expected Result | Pass |
|---|--------|-----------------|------|
| A1.1 | Navigate to `/signup` | Form with email + password fields shown | |
| A1.2 | Submit with valid email/password | Account created, redirected to onboarding or dashboard | |
| A1.3 | Submit with existing email | Error message "Email already in use" | |
| A1.4 | Submit with invalid email | Validation error shown | |

### A2 — Login

| # | Action | Expected Result | Pass |
|---|--------|-----------------|------|
| A2.1 | Navigate to `/login` | Login form shown | |
| A2.2 | Login with `hello@test.com` | Redirects to `/dashboard` | |
| A2.3 | Login with wrong password | Error message displayed | |
| A2.4 | Login then logout | Session cleared, redirect to home | |

### A3 — Business Onboarding

| # | Action | Expected Result | Pass |
|---|--------|-----------------|------|
| A3.1 | Click "Register your business" from dashboard | Onboarding wizard opens (Step 1: Business info) | |
| A3.2 | Fill business name, description, address, submit | Step 2 loads (Categories) | |
| A3.3 | Select 1-3 categories, submit | Step 3 loads (Services) | |
| A3.4 | Add services with prices/durations, submit | Step 4 loads (AI config) | |
| A3.5 | Toggle voice enabled, set greeting/personality | Step 4 completes, business created | |
| A3.6 | Business appears on `/dashboard` | Business name visible in dashboard list | |

---

## Module B: Customer Discovery & Search

### B1 — Search

| # | Action | Expected Result | Pass |
|---|--------|-----------------|------|
| B1.1 | Navigate to `/search` | Search box with placeholder shown | |
| B1.2 | Type "massage" and submit | Results grid with matching businesses | |
| B1.3 | Type gibberish "xyzqwerty" | Empty state: "No businesses matched" | |
| B1.4 | Click suggestion chip (e.g. "cleaning") | Navigates to `/search?q=cleaning` with results | |

### B2 — Near Me (Location)

| # | Action | Expected Result | Pass |
|---|--------|-----------------|------|
| B2.1 | Click "Near me" button on search page | Browser permission prompt appears | |
| B2.2 | Grant location permission | Results reload sorted by distance, distance shown on cards | |
| B2.3 | Click "Clear location" | Distance removed, results unsorted | |

### B3 — Business Profile

| # | Action | Expected Result | Pass |
|---|--------|-----------------|------|
| B3.1 | Click a business card from search results | Business profile page loads | |
| B3.2 | Verify: name, rating, description, hours, services, contact | All sections present and accurate | |
| B3.3 | Verify: Open/Closed status badge | Correctly reflects business hours | |
| B3.4 | Scroll to "Similar businesses" section | Related businesses shown (if available) | |
| B3.5 | Click a similar business card | Navigates to that business's profile | |

### B4 — Categories

| # | Action | Expected Result | Pass |
|---|--------|-----------------|------|
| B4.1 | Navigate to a category page | Businesses in that category listed | |
| B4.2 | Click category tag on a business profile | Category page loads with filtered businesses | |

---

## Module C: Chat & AI Assistant

### C1 — Start Conversation

| # | Action | Expected Result | Pass |
|---|--------|-----------------|------|
| C1.1 | Click "Start a conversation" on a business profile | Chat screen opens | |
| C1.2 | AI greeting message appears | Matches the configured greeting (or default) | |
| C1.3 | Business name shown in header | Correct business name | |

### C2 — AI Responses

| # | Action | Expected Result | Pass |
|---|--------|-----------------|------|
| C2.1 | Send "What services do you offer?" | AI lists services from business knowledge | |
| C2.2 | Send "What are your hours?" | AI responds with business hours | |
| C2.3 | Send "How much does X cost?" | AI provides pricing from services | |
| C2.4 | Send a question outside business scope | AI says it doesn't know, offers to connect to team | |
| C2.5 | Send message in French (e.g. "Bonjour, vos tarifs?") | AI responds in French (if language is auto) | |

### C3 — Human Handoff

| # | Action | Expected Result | Pass |
|---|--------|-----------------|------|
| C3.1 | Click "Talk to a person" | Status changes to "Waiting for team" | |
| C3.2 | System message appears in chat | "Customer is requesting to speak with a person" | |
| C3.3 | Staff opens conversation in dashboard | Conversation visible with "human_requested" badge | |

### C4 — Request Service

| # | Action | Expected Result | Pass |
|---|--------|-----------------|------|
| C4.1 | Click "Request a service" | Dialog opens with type, date, time, notes fields | |
| C4.2 | Fill form and submit | Success toast, request logged in conversation | |
| C4.3 | Click "View conversation" from account page | Opens the correct conversation | |

### C5 — End Conversation

| # | Action | Expected Result | Pass |
|---|--------|-----------------|------|
| C5.1 | Click "End conversation" | Confirmation dialog appears | |
| C5.2 | Confirm | Conversation status → "closed", "Conversation closed" shown | |
| C5.3 | Try to send message after close | Input disabled or shows closed state | |

---

## Module D: Voice Calls

### D1 — Customer Initiates Call

| # | Action | Expected Result | Pass |
|---|--------|-----------------|------|
| D1.1 | Click "Start voice" in chat | Voice session panel appears with "Waiting for team..." | |
| D1.2 | Timer counts up (0s → 60s) | Timer visible and incrementing | |
| D1.3 | System message in chat | "📞 Voice call requested by customer. Waiting for a team member to join…" | |
| D1.4 | Business members receive notification | Bell icon shows unread count, notification body visible | |
| D1.5 | Ringing tone plays (if enabled) | Audible soft ring while waiting | |

### D2 — Staff Accepts Call

| # | Action | Expected Result | Pass |
|---|--------|-----------------|------|
| D2.1 | Staff opens conversation with pending call | Blue banner: "Incoming voice call — [Customer] wants to talk" with Join/Decline | |
| D2.2 | Staff clicks "Join" | "Joining call..." spinner → connects to LiveKit | |
| D2.3 | Customer hears "connected" tone | Two-note chime plays | |
| D2.4 | Both parties in call | Mute/End buttons visible, timer running | |
| D2.5 | Customer can mute/unmute | Microphone toggles, audio stops/resumes | |
| D2.6 | Staff can mute/unmute | Same behavior | |
| D2.7 | System message in chat | "📞 [Staff name] joined the call." | |

### D3 — Staff Declines Call

| # | Action | Expected Result | Pass |
|---|--------|-----------------|------|
| D3.1 | Staff clicks "Decline" | Banner disappears | |
| D3.2 | Customer sees "Call declined" | Message: "The team is currently unavailable" | |
| D3.3 | System message in chat | "📞 Voice call declined — the team is currently unavailable." | |

### D4 — Call Timeout (60 seconds)

| # | Action | Expected Result | Pass |
|---|--------|-----------------|------|
| D4.1 | Customer starts call, no staff joins for 60s | Auto-timeout after 60 seconds | |
| D4.2 | Customer sees timeout state | "No one joined the call — The team didn't respond within 60 seconds" | |
| D4.3 | System message in chat | "📞 Call not connected — no team member responded. Try again later or send a message." | |

### D5 — Call End & Logging

| # | Action | Expected Result | Pass |
|---|--------|-----------------|------|
| D5.1 | Staff ends active call | Both parties see "Call ended" | |
| D5.2 | "ended" tone plays | Audible descending tone | |
| D5.3 | Duration shown on both sides | Accurate duration in M:SS format | |
| D5.4 | System message in chat | "📞 Call ended — Duration: Xm XXs with [Staff name]" | |

### D6 — Sound Settings

| # | Action | Expected Result | Pass |
|---|--------|-----------------|------|
| D6.1 | Navigate to Account → Sounds section | 5 toggle switches visible | |
| D6.2 | Toggle "Incoming call ring" off | Toggle switches, toast confirms | |
| D6.3 | Click "Test" on any sound | Corresponding tone plays | |
| D6.4 | Toggle all sounds off | No tones play during voice call flow | |
| D6.5 | Reload page | Preferences persist (localStorage) | |

---

## Module E: Staff Dashboard & Inbox

### E1 — Dashboard Overview

| # | Action | Expected Result | Pass |
|---|--------|-----------------|------|
| E1.1 | Login as business owner/staff | Dashboard shows business list | |
| E1.2 | Click into a business | Inbox loads with conversation list | |
| E1.3 | Stats cards visible | Conversations, Requests, Reviews counts shown | |

### E2 — Conversation Management

| # | Action | Expected Result | Pass |
|---|--------|-----------------|------|
| E2.1 | Click a conversation | Chat thread opens with full history | |
| E2.2 | Send a reply | Message appears in thread, status → "human_connected" | |
| E2.3 | System messages (voice, handoff) | Rendered as centered gray text | |
| E2.4 | Back to inbox | Conversation list updated | |

### E3 — Settings

| # | Action | Expected Result | Pass |
|---|--------|-----------------|------|
| E3.1 | Navigate to Settings | Tabbed form: Profile, AI, Hours, Services | |
| E3.2 | Profile tab: edit name, save | "Profile updated" toast, name persists | |
| E3.3 | AI tab: toggle voice, save | "AI settings updated" toast | |
| E3.4 | Hours tab: change open/close times, save | "Hours updated" toast | |
| E3.5 | Services tab: add new service, fill name + price + type + duration, save | "Services updated" toast, no errors | |
| E3.6 | Services tab: delete a service, save | Service removed | |
| No | Duplicate key error in console | Zero React key warnings | |

### E4 — Knowledge Base

| # | Action | Expected Result | Pass |
|---|--------|-----------------|------|
| E4.1 | Navigate to Knowledge | Knowledge base page loads with empty state or existing docs | |
| E4.2 | Click "Add document" | Form opens: title, content, category, priority | |
| E4.3 | Fill form, click "Add" | "Document added" toast, item appears in list | |
| E4.4 | Click edit (pencil icon) on a doc | Form opens pre-filled with doc data | |
| E4.5 | Update and save | "Document updated" toast, item updated in list | |
| E4.6 | Click eye icon to toggle active/inactive | Item dims (opacity), toggles back | |
| E4.7 | Click trash icon, confirm | "Document deleted" toast, item removed | |

### E5 — Team Management

| # | Action | Expected Result | Pass |
|---|--------|-----------------|------|
| E5.1 | Navigate to Team | Team page loads with member list | |
| E5.2 | Invite a member by email | "Invitation sent" toast (or error if already member) | |
| E5.3 | Change a member's role | Role updates in list | |
| E5.4 | Set availability for a member | Day/time toggles saved | |
| E5.5 | Remove a member | Member removed from list | |

### E6 — Bookings

| # | Action | Expected Result | Pass |
|---|--------|-----------------|------|
| E6.1 | Navigate to Bookings | Bookings page loads with date picker | |
| E6.2 | Select a date filter | Bookings for that date shown | |
| E6.3 | Click "All dates" | All bookings listed | |
| E6.4 | Confirm a pending booking | Status → "confirmed" | |
| E6.5 | Decline a pending booking | Status → "cancelled" | |
| E6.6 | Complete a confirmed booking | Status → "completed" | |

### E7 — Analytics

| # | Action | Expected Result | Pass |
|---|--------|-----------------|------|
| E7.1 | Navigate to Analytics | Full analytics dashboard loads | |
| E7.2 | Verify stat cards | Conversations, Requests, Reviews, Messages, Voice calls, Request completion | |
| E7.3 | Verify 7-day activity chart | Bar chart with conversations + messages bars | |
| E7.4 | Verify rating distribution (if reviews exist) | Star bars with correct counts | |

---

## Module F: Customer Booking

### F1 — Book Appointment

| # | Action | Expected Result | Pass |
|---|--------|-----------------|------|
| F1.1 | Navigate to `/business/[id]/book` | Booking form with step indicator (1-4) | |
| F1.2 | Select a service | Step advances to date picker | |
| F1.3 | Pick a date on calendar | Step advances to time slots | |
| F1.4 | Available time slots load | Slots shown (grid of times with staff names) | |
| F1.5 | Select a time slot | Step advances to details form | |
| F1.6 | Fill name (required), optional email/phone/notes | Form fields accept input | |
| F1.7 | Click "Request booking" | "Booking request submitted!" toast, redirected to business page | |

### F2 — Booking Edge Cases

| # | Action | Expected Result | Pass |
|---|--------|-----------------|------|
| F2.1 | Business is closed on selected date | "Business is closed on this date" message | |
| F2.2 | No staff available for service | "No staff available for this service" message | |
| F2.3 | All slots booked for date | "No available times for this date" message | |

---

## Module G: Admin Panel

### G1 — Admin Access

| # | Action | Expected Result | Pass |
|---|--------|-----------------|------|
| G1.1 | Login as platform_admin | Admin link visible on dashboard | |
| G1.2 | Click admin link | Admin overview loads with platform stats | |
| G1.3 | Non-admin user tries `/admin` | Redirected or access denied | |

### G2 — Business Management

| # | Action | Expected Result | Pass |
|---|--------|-----------------|------|
| G2.1 | Navigate to Admin → Businesses | Business list with status badges | |
| G2.2 | Verify a pending business | Status changes to "verified" | |
| G2.3 | Suspend an active business | Status changes to "suspended" | |

### G3 — Review Moderation

| # | Action | Expected Result | Pass |
|---|--------|-----------------|------|
| G3.1 | Navigate to Admin → Reviews | Pending reviews listed | |
| G3.2 | Approve a review | Status → "published" | |
| G3.3 | Reject a review | Status → "rejected" | |

---

## Module H: Notifications

### H1 — Notification Bell

| # | Action | Expected Result | Pass |
|---|--------|-----------------|------|
| H1.1 | Observe header bell icon | Badge shows unread count when notifications exist | |
| H1.2 | Click bell | Dropdown with notification list | |
| H1.3 | Click a notification | Navigates to relevant page | |
| H1.4 | Click "Mark all read" | Badge clears | |
| H1.5 | New notification arrives (e.g. voice call request) | Bell updates in realtime, tone plays (if enabled) | |

---

## Acceptance Criteria Summary

| Module | Critical Criteria |
|--------|-------------------|
| **Auth** | Signup, login, logout work. Sessions persist across refresh. |
| **Discovery** | Search returns relevant results. Near Me sorts by distance. Business profiles display complete info. |
| **Chat** | AI responds grounded in business data. Human handoff works. Messages persist. |
| **Voice** | Handshake flow: request → notification → accept/decline/timeout. Both sides hear tones. Chat logs all voice events. 60s timeout auto-drops. |
| **Staff** | Inbox shows conversations. Settings save without errors. Knowledge CRUD works. Team invite/role/availability works. Bookings can be confirmed/declined/completed. |
| **Customer Booking** | 4-step flow completes. Available slots reflect staff schedule. Booking submits successfully. |
| **Analytics** | Dashboard shows accurate counts. 7-day chart renders. Rating distribution shown. |
| **Recommendations** | Similar businesses section appears on profiles with shared categories. |
| **Notifications** | Bell shows unread count. Realtime updates work. Sound plays (if enabled). |
| **Admin** | Admin-only access. Business verify/suspend. Review approve/reject. |

---

## Known Limitations

- Voice requires LiveKit cloud credentials in `.env` (configured)
- Geolocation ("Near Me") requires browser permission — won't work in headless testing
- Sound features use Web Audio API — test in a real browser with audio
- No automated E2E tests yet — this document serves as manual regression coverage
- Booking requires staff availability to be set; otherwise no slots appear

---

## Bug Reporting Template

```
**Module:** [A-H]
**Test #:** [e.g. D2.3]
**Browser:** Chrome 120 / Firefox 121 / Safari 17
**Description:** [What happened]
**Expected:** [What should have happened]
**Screenshot:** [If applicable]
**Console errors:** [Any JS errors in DevTools]
```
