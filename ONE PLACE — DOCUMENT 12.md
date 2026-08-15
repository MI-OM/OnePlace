# DOCUMENT 12 — AUTHENTICATION, AUTHORIZATION & IDENTITY MANAGEMENT SPECIFICATION

**Product:** One Place
**Document:** 12
**Status:** Development-ready
**Scope:** MVP + defined post-MVP extension path
**Primary authentication infrastructure:** Supabase Auth
**Application:** Next.js full-stack
**Database:** Supabase PostgreSQL + Row-Level Security (RLS)

---

# 1. Purpose

This document defines how One Place handles:

* account creation
* login
* logout
* sessions
* user identity
* user profiles
* business ownership
* business staff
* permissions
* roles
* authorization
* account status
* account deletion
* privacy
* security boundaries
* future authentication methods

The objective is simple:

> **A user should be able to create an account and use One Place without being exposed to unnecessary complexity, while the platform maintains strict control over what that user can access.**

---

# 2. Authentication Philosophy

One Place should not build its own authentication system.

Supabase Auth handles:

* passwords
* sessions
* refresh tokens
* email verification
* password reset
* authentication providers

One Place handles:

* profiles
* roles
* business relationships
* application permissions
* account state
* authorization

---

# 3. Identity Architecture

There are two distinct concepts.

### Authentication identity

Managed by:

```text
Supabase Auth
```

### Application identity

Managed by:

```text
One Place PostgreSQL
```

Relationship:

```text
Supabase auth.users
        │
        │ 1:1
        ▼
One Place profiles
```

The Supabase `user.id` is the permanent application identity.

---

# 4. User Identity

Every authenticated user receives a unique UUID.

Conceptually:

```text
user_id
```

This identifier should be used internally for relationships.

Do not use email addresses as foreign keys.

---

# 5. Why Email Is Not the Identity

Emails can change.

For example:

```text
old@example.com
        ↓
new@example.com
```

The user remains the same person.

Therefore:

```text
user_id = permanent identity
email = authentication/contact attribute
```

---

# 6. MVP Authentication Methods

Start with:

### Email + password

This is sufficient for MVP.

Do not initially implement:

* Google
* Apple
* Facebook
* Microsoft
* passkeys
* SMS authentication

unless user research shows a strong need.

---

# 7. Future Authentication Methods

Post-MVP:

```text
Email/password
Magic link
Google
Apple
Microsoft
Passkeys
```

The application identity remains unchanged regardless of authentication method.

---

# 8. Signup Flow

Customer:

```text
Landing page
      ↓
Sign up
      ↓
Email
Password
      ↓
Supabase Auth
      ↓
Email verification
      ↓
Profile creation
      ↓
Onboarding
      ↓
One Place
```

---

# 9. Signup Page Copy

## Heading

> **Create your One Place account**

## Supporting text

> Find services, talk to businesses, and get the help you need — all in one place.

## Email field

**Label:**

> Email address

**Placeholder:**

> [you@example.com](mailto:you@example.com)

## Password

**Label:**

> Password

**Placeholder:**

> Create a password

## Button

> **Create account**

## Existing account

> Already have an account? **Sign in**

---

# 10. Email Verification

After signup:

### Heading

> **Check your email**

### Copy

> We sent a verification link to **[email]**.

> Verify your email to continue.

Button:

> **Resend verification email**

Secondary:

> **Change email address**

---

# 11. Why Email Verification Matters

It reduces:

* fake accounts
* spam
* abuse
* automated account creation
* fraudulent reviews

It also gives businesses more confidence in customer interactions.

---

# 12. Login Page

## Heading

> **Welcome back**

## Supporting copy

> Sign in to continue to One Place.

Fields:

> Email address

> Password

Button:

> **Sign in**

Secondary:

> **Forgot password?**

Footer:

> Don't have an account? **Create one**

---

# 13. Password Requirements

Use reasonable requirements rather than unnecessarily complicated rules.

Recommended:

* minimum 8 characters
* reject known compromised/common passwords where supported
* allow password managers
* allow paste
* do not force arbitrary symbols/numbers unless necessary

Never implement:

> "Your password must contain exactly one uppercase character..."

unless security requirements justify it.

---

# 14. Password Reset

Flow:

```text
Login
 ↓
Forgot password
 ↓
Email
 ↓
Reset email
 ↓
Reset password
 ↓
New session
```

---

# 15. Forgot Password Copy

### Heading

> **Forgot your password?**

### Copy

> Enter your email and we'll send you a link to reset your password.

Button:

> **Send reset link**

Success:

> **Check your email**

> If an account exists for that email, we've sent instructions to reset your password.

This wording avoids unnecessarily revealing whether an account exists.

---

# 16. Logout

Logout should:

1. invalidate the authenticated session
2. clear local session state
3. redirect to an appropriate public page

Destination:

```text
/
```

or:

```text
/login
```

---

# 17. Session Management

Supabase manages authentication sessions.

The application should not manually implement:

* JWT generation
* refresh-token systems
* password hashing
* session expiration logic

---

# 18. Server Authentication

Every protected server operation should retrieve the authenticated user.

Conceptually:

```text
getAuthenticatedUser()
```

If no user exists:

```text
AUTHENTICATION_REQUIRED
```

---

# 19. Authentication Boundary

Public:

```text
Landing page
Categories
Public business profiles
Public services
Public informational content
```

Authenticated:

```text
Conversations
Requests
Reviews
Personal account
Saved businesses
Voice sessions
```

Business authenticated:

```text
Business dashboard
Service management
Conversation management
Business settings
```

---

# 20. Authorization

Authorization answers:

> "What can this user do?"

Authentication answers:

> "Who is this user?"

Never confuse the two.

---

# 21. Roles

MVP roles:

```text
customer
business_owner
business_staff
admin
```

Potential future:

```text
business_manager
business_location_manager
support_agent
moderator
platform_operator
```

---

# 22. Default Role

Every new user starts as:

```text
customer
```

A user does not become a business owner merely because they create a business.

The application creates the appropriate business relationship.

---

# 23. Important: User Can Have Multiple Roles

Do not design the system around:

```text
user.role = "business_owner"
```

only.

A person could be:

```text
Customer
+
Owner of Business A
+
Staff member of Business B
```

Therefore roles should be contextual.

---

# 24. Recommended Authorization Model

Use:

```text
User
 ↓
Business Membership
 ↓
Role
```

Example:

```text
Olalekan
   │
   ├── Business A → owner
   │
   └── Business B → staff
```

This is much more scalable than one global role field.

---

# 25. Business Membership

Conceptually:

```text
business_members
----------------
id
business_id
user_id
role
status
created_at
```

Roles:

```text
owner
manager
staff
```

MVP may only use:

```text
owner
staff
```

---

# 26. Ownership

A business should have one primary owner.

Conceptually:

```text
business.owner_id
```

Additionally:

```text
business_members
```

manages staff and future managers.

---

# 27. Business Ownership Rules

Owner can:

* edit business
* edit services
* configure AI
* manage staff
* view business requests
* manage conversations
* deactivate business

Staff can:

* handle authorized conversations
* view assigned business information
* update requests where permitted

Staff cannot:

* transfer ownership
* delete the business
* change billing ownership
* modify security settings

---

# 28. Admin

Admin is a platform-level role.

Admin can:

* moderate businesses
* suspend accounts
* review abuse
* manage categories
* inspect platform-level information
* manage platform configuration

Admin privileges should be tightly restricted.

---

# 29. Never Trust Client-Supplied Roles

Do not accept:

```text
{
  "role": "admin"
}
```

from the browser and trust it.

Roles must be determined server-side.

---

# 30. Authorization Flow

Every protected operation follows:

```text
Request
 ↓
Authenticate
 ↓
Identify user
 ↓
Determine resource
 ↓
Determine relationship
 ↓
Check permission
 ↓
Execute operation
```

---

# 31. Example: Edit Business

User requests:

> Edit Business A

System:

```text
Who are you?
        ↓
User 123
        ↓
Who owns Business A?
        ↓
User 123
        ↓
Allowed
```

If:

```text
Business A owner = User 999
```

then:

```text
FORBIDDEN
```

---

# 32. Example: Conversation Access

User attempts:

```text
GET conversation/ABC
```

System checks:

```text
Is user a participant?
OR
Is user authorized business staff?
OR
Is user an authorized admin?
```

If none:

```text
FORBIDDEN
```

---

# 33. Supabase RLS

RLS is the final database protection layer.

Even if application code accidentally contains a bug, RLS should prevent unauthorized records from being returned or modified.

---

# 34. RLS Philosophy

Think of it as:

```text
Application authorization
        +
Database authorization
```

Both should agree.

---

# 35. Profiles Table

Conceptual structure:

```text
profiles
---------
id
display_name
avatar_url
bio
location
status
created_at
updated_at
```

`id` references:

```text
auth.users.id
```

---

# 36. Profile Privacy

Public profile information should be deliberately limited.

A customer does not need access to:

* authentication metadata
* private email
* security information
* internal account status
* private identifiers

---

# 37. Customer Profile

MVP fields:

```text
display_name
avatar
location
```

Optional:

```text
bio
languages
interests
```

Do not collect unnecessary personal information.

---

# 38. Business Staff Profile

Staff may have:

```text
display_name
avatar
role
```

The business determines how much of that information is publicly displayed.

---

# 39. Account Status

Recommended states:

```text
active
suspended
deactivated
deleted
```

MVP can simplify to:

```text
active
suspended
deactivated
```

---

# 40. Suspended Account

A suspended user:

* cannot initiate new conversations
* cannot create requests
* cannot submit reviews
* cannot create businesses
* may be prevented from logging into the application

Existing records should generally remain intact for moderation/audit purposes.

---

# 41. Deactivation

Deactivation means:

> User voluntarily disables their account.

The system should preserve necessary records according to the platform's retention policy while removing the user's active access.

---

# 42. Account Deletion

Deletion is more complex than simply deleting:

```text
auth.users
```

because the user may have:

* conversations
* reviews
* requests
* business memberships
* businesses
* messages

Therefore deletion must follow a defined data-retention policy.

---

# 43. Recommended Deletion Strategy

Do not immediately hard-delete all historical records.

Instead:

```text
User requests deletion
        ↓
Account deactivated
        ↓
Deletion workflow
        ↓
Personal information anonymized/deleted where appropriate
        ↓
Business/legal records retained where required
```

---

# 44. Message Ownership After Deletion

A conversation may need to remain for business integrity.

Instead of:

```text
Michael said:
"Can you..."
```

the system could eventually display:

> **Former One Place user**

where appropriate.

The exact retention/anonymization policy should be finalized before launch.

---

# 45. Privacy Principle

Collect the minimum information needed to provide the service.

Do not ask:

> "What is your date of birth?"

unless there is a genuine product/legal reason.

---

# 46. Customer Onboarding

MVP onboarding should be extremely short.

Recommended:

```text
Account
 ↓
Name
 ↓
Optional location
 ↓
Done
```

Do not force users through a 10-step profile wizard.

---

# 47. Onboarding Copy

### Heading

> **Let's get you set up**

### Copy

> A few details will help us make One Place more useful for you.

Name:

> **What should we call you?**

Location:

> **Where are you located?**

Button:

> **Continue**

Optional skip:

> **I'll do this later**

---

# 48. Business Onboarding

Business onboarding is different.

The business needs:

```text
Business name
Category
Location
Description
Services
Pricing
Hours
Contact preferences
```

This belongs to the business onboarding system, not personal identity.

---

# 49. Business Account Creation

Flow:

```text
User
 ↓
Create account
 ↓
Dashboard
 ↓
"Add your business"
 ↓
Business details
 ↓
Services
 ↓
Hours
 ↓
AI configuration
 ↓
Preview
 ↓
Publish
```

---

# 50. Switching Between Customer and Business

A user may have both experiences.

Example:

```text
One Place
 ├── Explore
 └── My Business
```

Do not require separate accounts.

---

# 51. Business Context

When the user accesses:

```text
/business/my-business
```

the application determines which businesses the user can manage.

If multiple:

```text
Business A
Business B
Business C
```

the user can select the active business.

---

# 52. Staff Invitation

Post-MVP or late MVP.

Flow:

```text
Owner
 ↓
Invite staff
 ↓
Email
 ↓
User accepts
 ↓
Membership created
 ↓
Staff can access business
```

---

# 53. Staff Invitation Security

Invitation must be:

* unique
* expirable
* single-use
* tied to business
* tied to intended role

Never create a staff account simply because someone knows an email address.

---

# 54. Email Address Changes

If supported:

```text
User requests change
 ↓
Verify new email
 ↓
Update Supabase Auth
 ↓
Update profile/contact information
```

The immutable user ID remains unchanged.

---

# 55. Password Changes

Authenticated user:

```text
Settings
 ↓
Change password
 ↓
Verify current session
 ↓
New password
 ↓
Supabase Auth update
```

---

# 56. Session Security

Use secure cookies/session mechanisms provided by Supabase and Next.js.

Do not store authentication tokens in:

```text
localStorage
```

unless there is a specific, well-understood requirement.

---

# 57. CSRF / Request Security

For state-changing requests:

* use framework-provided protections
* verify authentication
* validate origin where appropriate
* do not accept arbitrary cross-origin mutations

---

# 58. Input Validation

Every mutation must validate input server-side.

Recommended:

```text
Zod
```

Example:

```text
createBusinessSchema
createServiceSchema
sendMessageSchema
createReviewSchema
```

Client validation improves UX.

Server validation provides security.

You need both.

---

# 59. Authorization Errors

Do not expose:

> "Business 7823 belongs to John Smith and you are not allowed."

Use:

> **You don't have permission to perform this action.**

---

# 60. Authentication Errors

For protected resources:

> **Please sign in to continue.**

Button:

> **Sign in**

---

# 61. Session Expiration

If the session expires while the user is using One Place:

Show:

> **Your session has expired. Please sign in again.**

Do not silently lose unsent conversation messages.

Where possible, preserve draft text locally until authentication is restored.

---

# 62. Conversation Authentication Edge Case

Suppose a visitor starts browsing without an account.

They click:

> Talk to business

The platform can decide between:

### Option A — Require signup first

Simple and secure.

### Option B — Allow temporary guest conversation

Better UX but more complexity.

---

# 63. Recommended MVP Decision

Use:

> **Authentication required before starting a persistent conversation.**

Why?

It simplifies:

* identity
* abuse prevention
* conversation ownership
* history
* reviews
* requests

The user can browse freely without an account.

---

# 64. Voice Authentication

Voice must follow the same identity model.

```text
Authenticated user
 ↓
Request voice session
 ↓
Server validates authorization
 ↓
LiveKit token generated
 ↓
User connects
```

Never give unauthenticated users arbitrary room access.

---

# 65. LiveKit Room Security

The server determines:

* room name
* participant identity
* permissions
* expiration
* whether the user can publish audio
* whether the user can subscribe

The browser does not choose unrestricted permissions.

---

# 66. AI Authentication

AI does not become a separate user account.

It is a system/application participant.

Example:

```text
conversation_participants
-------------------------
customer
assistant
staff
```

---

# 67. AI Permissions

The AI can access only:

* current conversation
* permitted business knowledge
* permitted service information

The AI cannot:

* access arbitrary customer records
* access admin information
* access private staff data

---

# 68. Audit Trail

Security-sensitive actions should eventually be recorded.

Examples:

```text
business_suspended
staff_invited
staff_removed
business_owner_changed
account_suspended
review_moderated
conversation_accessed_by_staff
```

---

# 69. Audit Log

Conceptual structure:

```text
audit_logs
----------
id
actor_user_id
action
resource_type
resource_id
metadata
created_at
```

Do not store unnecessary sensitive payloads in audit metadata.

---

# 70. Admin Authentication

Admin accounts should have stronger protection.

Post-MVP:

* MFA
* passkeys
* stricter session policies
* audit logging
* IP/device monitoring where justified

---

# 71. Multi-Factor Authentication

Not mandatory for every customer in MVP.

Strongly recommended for:

```text
admins
business owners
high-value enterprise accounts
```

---

# 72. Future Passkeys

Passkeys are an excellent future authentication option because they can improve:

* security
* login convenience
* phishing resistance

But they do not need to delay MVP.

---

# 73. Account Recovery

The account recovery path must never depend solely on customer support manually changing credentials.

Primary:

```text
verified email
```

Future:

```text
passkey recovery
backup methods
```

---

# 74. Anti-Abuse Controls

Authentication should work with platform abuse protection.

Controls:

```text
email verification
rate limiting
CAPTCHA/challenge when suspicious
IP throttling
device/browser signals where justified
review abuse detection
message rate limits
```

Don't punish legitimate users with unnecessary CAPTCHA on every login.

---

# 75. Business Verification

MVP:

```text
email verification
```

Post-MVP:

```text
business verification
identity verification
phone verification
document verification
```

The platform should eventually distinguish:

> **Email verified**

from:

> **Business verified**

These are not the same.

---

# 76. Verification Badges

Do not call an account:

> "Verified"

unless the verification criteria are clearly defined.

Possible badges:

```text
Email verified
Business verified
Identity verified
Established business
```

---

# 77. Trust Model

The reputation system should eventually combine:

```text
Identity signals
+
Business verification
+
Reviews
+
Successful interactions
+
Response reliability
+
Platform behavior
```

Authentication is therefore the foundation of the reputation system.

---

# 78. Relationship to Reviews

Only authenticated users can submit reviews.

Further restriction:

```text
User
 ↓
Eligible interaction
 ↓
Review
```

This significantly reduces fake reviews.

---

# 79. Relationship to Conversations

Every persistent conversation has:

```text
customer_id
business_id
```

and participants.

Therefore the identity layer becomes the foundation of:

* conversation history
* requests
* reviews
* reputation
* analytics

---

# 80. Relationship to Requests

Requests belong to an authenticated customer.

Example:

```text
request.customer_id
```

A business can only access requests belonging to itself.

---

# 81. Relationship to Saved Businesses

Future:

```text
saved_businesses
----------------
user_id
business_id
created_at
```

A user can save businesses.

This requires authentication.

---

# 82. Relationship to Notifications

Notifications belong to a user:

```text
notifications.user_id
```

The system determines what that user is allowed to receive.

---

# 83. Data Access Matrix

| Resource               |   Customer |        Owner |      Staff |      Admin |
| ---------------------- | ---------: | -----------: | ---------: | ---------: |
| Public businesses      |       Read |         Read |       Read |       Read |
| Own profile            |       Full |         Full |       Full |       Full |
| Other profiles         |    Limited |      Limited |    Limited |      Admin |
| Own conversations      |       Full |            — |          — | Controlled |
| Business conversations |          — |         Full | Authorized | Controlled |
| Business settings      |          — |         Full |    Limited |      Admin |
| Services               |       Read |         Full |    Limited |      Admin |
| Requests               |        Own |     Business | Authorized |      Admin |
| Reviews                | Create own | Read/respond |       Read |   Moderate |
| User accounts          |        Own |            — |          — |      Admin |

---

# 84. Recommended Database Relationships

```text
auth.users
     │
     ▼
profiles
     │
     ├──────────────┐
     ▼              ▼
business_members   conversations
     │              │
     ▼              ▼
businesses       messages
     │
     ├── services
     ├── requests
     └── reviews
```

---

# 85. Security Principle

The most important rule in the entire identity architecture is:

> **Never assume that because the UI doesn't show something, the user cannot access it.**

Every protected operation must be protected server-side and, where applicable, at the database level.

---

# 86. MVP Authentication Checklist

### Required

* [x] Supabase Auth
* [x] email/password signup
* [x] login
* [x] logout
* [x] email verification
* [x] password reset
* [x] profiles
* [x] authenticated sessions
* [x] customer identity
* [x] business ownership
* [x] basic roles
* [x] RLS
* [x] server-side authorization
* [x] protected conversations
* [x] protected requests
* [x] protected reviews

### Not required initially

* [ ] social login
* [ ] passkeys
* [ ] MFA for everyone
* [ ] identity verification
* [ ] business document verification
* [ ] complex staff hierarchy

---

# 87. Post-MVP Authentication Roadmap

## Phase 1

Add:

* Google login
* Apple login
* staff invitations
* MFA for business owners
* improved account management

## Phase 2

Add:

* passkeys
* business verification
* identity verification
* advanced staff permissions

## Phase 3

Add:

* enterprise SSO
* SAML/OIDC
* organization-level identity management
* advanced audit controls

---

# 88. Final Identity Architecture

```text
                         USER
                          │
                          ▼
                    SUPABASE AUTH
                          │
                          ▼
                    authenticated
                         user
                          │
                          ▼
                       PROFILE
                          │
             ┌────────────┼─────────────┐
             │            │             │
             ▼            ▼             ▼
         CUSTOMER     BUSINESS       ADMIN
                         │
                         ▼
                  BUSINESS MEMBERSHIP
                         │
                 ┌───────┴───────┐
                 ▼               ▼
               OWNER            STAFF
                 │
                 ▼
             BUSINESS
                 │
        ┌────────┼────────┐
        ▼        ▼        ▼
    SERVICES   REQUESTS  CONVERSATIONS
                            │
                    ┌───────┼────────┐
                    ▼       ▼        ▼
                 CUSTOMER   AI      STAFF
```

---

# 89. Final Decision

For One Place, the identity system should remain deliberately boring.

That's a good thing.

We are **not** building an authentication company.

We are building a service discovery and communication platform.

Therefore:

> **Supabase Auth handles authentication. PostgreSQL/RLS + application services handle authorization. Business memberships handle contextual roles.**

This gives us a secure foundation without creating unnecessary infrastructure.

---

## Document 12 Completion

**Development status: Ready**

We now have defined:

* authentication
* signup
* login
* logout
* password recovery
* sessions
* profiles
* roles
* business memberships
* authorization
* RLS
* account lifecycle
* deletion strategy
* staff access
* voice authentication
* AI access boundaries
* review eligibility foundation
* security controls
* future MFA/passkeys
* future enterprise authentication
