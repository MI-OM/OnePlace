# DOCUMENT 9 — DATABASE IMPLEMENTATION SPECIFICATION

## One Place — Complete PostgreSQL / Supabase Database Implementation

**Document status:** Development-ready
**Product:** One Place
**Architecture:** Next.js + Supabase PostgreSQL + Supabase Auth + LiveKit
**Primary database:** PostgreSQL
**Database platform:** Supabase
**Scope:** MVP + post-MVP foundation
**Related document:** Document 8 — Complete API Contract & Application Business Logic

---

# 1. Purpose

This document converts the approved One Place data model into an implementation-level database specification.

The goal is that a developer should be able to take this document and implement the database without having to make major architectural decisions independently.

The database must support:

* Customers
* Service providers/businesses
* Business staff
* Service listings
* Categories
* Business availability
* Customer discovery
* Conversations
* Messaging
* Voice sessions
* Service requests
* Reviews
* AI-assisted business operations
* Knowledge bases
* Notifications
* Analytics
* Auditability
* Future bookings
* Future direct business calling
* Multi-business users
* Multi-location businesses
* Future marketplace expansion

The database should **not** be unnecessarily complex for the MVP.

The principle is:

> **Build the foundation once, but only activate functionality when the product actually needs it.**

---

# 2. Database Technology

## 2.1 Primary database

Use:

**PostgreSQL through Supabase.**

Reasons:

* relational integrity
* excellent indexing
* PostgreSQL full-text search
* JSONB where flexibility is genuinely required
* Row Level Security
* UUID support
* transactions
* database functions
* triggers
* strong Supabase integration
* easy migration management
* future scalability

---

# 3. Architectural Principle

The application has three major data domains.

### Identity

```text
auth.users
    ↓
profiles
    ↓
user_roles
```

### Marketplace/business

```text
businesses
    ↓
business_members
    ↓
business_services
    ↓
services
    ↓
categories
```

### Communication

```text
conversations
    ↓
conversation_participants
    ↓
messages
    ↓
voice_sessions
```

And the operational layer:

```text
service_requests
reviews
notifications
analytics_events
audit_logs
```

---

# 4. UUID Strategy

Every application-owned entity should use:

```sql
uuid
```

as its primary key.

Recommended default:

```sql
gen_random_uuid()
```

Example:

```sql
id uuid primary key default gen_random_uuid()
```

Do **not** expose sequential integer IDs.

This reduces predictable resource enumeration and makes distributed systems easier later.

---

# 5. Standard Timestamp Strategy

Every major table should have:

```sql
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

For soft-deletable entities:

```sql
deleted_at timestamptz
```

Use UTC internally.

The frontend converts timestamps into the user's local timezone.

---

# 6. Standard Status Strategy

Do not create PostgreSQL enums for every possible status.

For relatively stable, security-sensitive state machines, enums are acceptable.

For rapidly evolving product statuses, use:

```text
text + CHECK constraint
```

This makes future migrations easier.

Example:

```sql
status text not null
    check (status in ('active', 'inactive', 'suspended'))
```

---

# 7. COMPLETE TABLE INVENTORY

## MVP tables

### Identity

1. `profiles`
2. `user_roles`

### Business

3. `businesses`
4. `business_members`
5. `categories`
6. `business_categories`
7. `services`
8. `business_services`
9. `business_hours`
10. `availability_exceptions`

### Customer interaction

11. `favorites`
12. `conversations`
13. `conversation_participants`
14. `messages`
15. `voice_sessions`
16. `service_requests`
17. `reviews`

### AI

18. `ai_configurations`
19. `ai_knowledge_items`

### Platform

20. `notifications`
21. `analytics_events`
22. `audit_logs`

---

# 8. `profiles`

Connects Supabase authentication users to application-level information.

```sql
create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,

    display_name text,
    first_name text,
    last_name text,

    avatar_url text,

    bio text,

    phone text,

    timezone text,

    locale text default 'en',

    is_active boolean not null default true,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
```

### Important rule

Do not duplicate authentication credentials here.

Supabase Auth owns:

* email
* password
* authentication providers
* email verification
* authentication tokens

`profiles` owns application profile information.

---

# 9. `user_roles`

Users can have multiple roles.

```sql
create table public.user_roles (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references public.profiles(id)
        on delete cascade,

    role text not null
        check (
            role in (
                'customer',
                'business_owner',
                'business_staff',
                'platform_admin'
            )
        ),

    created_at timestamptz not null default now(),

    unique(user_id, role)
);
```

A user can therefore be:

```text
customer
+
business_owner
```

at the same time.

---

# 10. `businesses`

The central entity representing a service provider.

```sql
create table public.businesses (
    id uuid primary key default gen_random_uuid(),

    name text not null,

    slug text not null unique,

    description text,

    logo_url text,

    cover_image_url text,

    phone text,

    email text,

    website_url text,

    address_line_1 text,
    address_line_2 text,
    city text,
    province text,
    postal_code text,
    country text,

    latitude numeric(10,7),
    longitude numeric(10,7),

    timezone text not null default 'America/St_Johns',

    status text not null default 'draft'
        check (
            status in (
                'draft',
                'pending_review',
                'active',
                'suspended',
                'archived'
            )
        ),

    verification_status text not null default 'unverified'
        check (
            verification_status in (
                'unverified',
                'pending',
                'verified'
            )
        ),

    metadata jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz
);
```

### Why `metadata` exists

It should contain genuinely flexible information that does not justify another relational table.

It must **not** become a dumping ground for core business data.

---

# 11. `business_members`

Connects people to businesses.

```sql
create table public.business_members (
    id uuid primary key default gen_random_uuid(),

    business_id uuid not null
        references public.businesses(id)
        on delete cascade,

    user_id uuid not null
        references public.profiles(id)
        on delete cascade,

    role text not null
        check (
            role in (
                'owner',
                'manager',
                'staff'
            )
        ),

    status text not null default 'active'
        check (
            status in (
                'invited',
                'active',
                'suspended',
                'removed'
            )
        ),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    unique(business_id, user_id)
);
```

This allows:

```text
Michael → Business A
Michael → Business B
Michael → Business C
```

without creating separate accounts.

---

# 12. `categories`

Categories define what businesses offer.

Examples:

```text
Hair Salon
Barber
Spa
Massage
Fitness
Personal Training
Cleaning
Home Repair
Photography
Tutoring
Beauty
Automotive
Pet Services
Events
Professional Services
```

Schema:

```sql
create table public.categories (
    id uuid primary key default gen_random_uuid(),

    parent_id uuid
        references public.categories(id)
        on delete set null,

    name text not null,

    slug text not null unique,

    description text,

    icon text,

    is_active boolean not null default true,

    sort_order integer not null default 0,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
```

The self-reference allows:

```text
Beauty
 ├── Hair
 ├── Nails
 ├── Makeup
 └── Skincare
```

---

# 13. `business_categories`

Many-to-many relationship.

```sql
create table public.business_categories (
    business_id uuid not null
        references public.businesses(id)
        on delete cascade,

    category_id uuid not null
        references public.categories(id)
        on delete cascade,

    is_primary boolean not null default false,

    created_at timestamptz not null default now(),

    primary key (business_id, category_id)
);
```

---

# 14. `services`

Reusable service definitions.

```sql
create table public.services (
    id uuid primary key default gen_random_uuid(),

    category_id uuid
        references public.categories(id)
        on delete set null,

    name text not null,

    description text,

    duration_minutes integer,

    is_active boolean not null default true,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
```

Example:

```text
Women's Haircut
Massage
Manicure
Personal Training Session
Car Detailing
```

---

# 15. `business_services`

This is one of the most important tables.

A global service describes the service.

`business_services` describes how **this particular business** provides it.

```sql
create table public.business_services (
    id uuid primary key default gen_random_uuid(),

    business_id uuid not null
        references public.businesses(id)
        on delete cascade,

    service_id uuid
        references public.services(id)
        on delete set null,

    name text not null,

    description text,

    price numeric(12,2),

    currency char(3) not null default 'CAD',

    price_type text not null default 'fixed'
        check (
            price_type in (
                'fixed',
                'starting_from',
                'range',
                'quote_required'
            )
        ),

    min_price numeric(12,2),
    max_price numeric(12,2),

    duration_minutes integer,

    booking_required boolean not null default false,

    is_active boolean not null default true,

    metadata jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
```

This is critical for the AI agent.

The AI should query structured business information rather than inventing it.

---

# 16. `business_hours`

```sql
create table public.business_hours (
    id uuid primary key default gen_random_uuid(),

    business_id uuid not null
        references public.businesses(id)
        on delete cascade,

    day_of_week smallint not null
        check (day_of_week between 0 and 6),

    is_closed boolean not null default false,

    opens_at time,

    closes_at time,

    created_at timestamptz not null default now(),

    unique(business_id, day_of_week)
);
```

Convention:

```text
0 = Sunday
1 = Monday
...
6 = Saturday
```

---

# 17. `availability_exceptions`

For holidays, temporary closures, special hours, etc.

```sql
create table public.availability_exceptions (
    id uuid primary key default gen_random_uuid(),

    business_id uuid not null
        references public.businesses(id)
        on delete cascade,

    exception_date date not null,

    is_closed boolean not null default true,

    opens_at time,

    closes_at time,

    reason text,

    created_at timestamptz not null default now(),

    unique(business_id, exception_date)
);
```

---

# 18. `favorites`

Customer saves a business.

```sql
create table public.favorites (
    user_id uuid not null
        references public.profiles(id)
        on delete cascade,

    business_id uuid not null
        references public.businesses(id)
        on delete cascade,

    created_at timestamptz not null default now(),

    primary key(user_id, business_id)
);
```

---

# 19. `conversations`

A conversation represents a communication session.

```sql
create table public.conversations (
    id uuid primary key default gen_random_uuid(),

    business_id uuid
        references public.businesses(id)
        on delete set null,

    customer_id uuid
        references public.profiles(id)
        on delete set null,

    type text not null default 'customer_business'
        check (
            type in (
                'customer_business',
                'customer_support'
            )
        ),

    status text not null default 'active'
        check (
            status in (
                'active',
                'closed',
                'archived'
            )
        ),

    source text not null default 'web'
        check (
            source in (
                'web',
                'voice',
                'phone'
            )
        ),

    started_at timestamptz not null default now(),
    ended_at timestamptz,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
```

---

# 20. `conversation_participants`

```sql
create table public.conversation_participants (
    id uuid primary key default gen_random_uuid(),

    conversation_id uuid not null
        references public.conversations(id)
        on delete cascade,

    user_id uuid
        references public.profiles(id)
        on delete set null,

    participant_type text not null
        check (
            participant_type in (
                'customer',
                'business_staff',
                'ai_agent',
                'system'
            )
        ),

    joined_at timestamptz not null default now(),
    left_at timestamptz
);
```

This allows an interaction such as:

```text
Customer
   ↓
AI Agent
   ↓
Human Staff
```

within one conversation.

---

# 21. `messages`

```sql
create table public.messages (
    id uuid primary key default gen_random_uuid(),

    conversation_id uuid not null
        references public.conversations(id)
        on delete cascade,

    sender_user_id uuid
        references public.profiles(id)
        on delete set null,

    sender_type text not null
        check (
            sender_type in (
                'customer',
                'business_staff',
                'ai_agent',
                'system'
            )
        ),

    message_type text not null default 'text'
        check (
            message_type in (
                'text',
                'system',
                'file',
                'voice'
            )
        ),

    content text,

    metadata jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now()
);
```

---

# 22. Voice Sessions

Voice is deliberately separated from messages.

```sql
create table public.voice_sessions (
    id uuid primary key default gen_random_uuid(),

    conversation_id uuid not null
        references public.conversations(id)
        on delete cascade,

    livekit_room_name text,

    status text not null default 'created'
        check (
            status in (
                'created',
                'connecting',
                'active',
                'ended',
                'failed'
            )
        ),

    started_at timestamptz,

    ended_at timestamptz,

    duration_seconds integer,

    participant_count integer default 0,

    metadata jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now()
);
```

### Important privacy decision

The MVP should **not automatically store voice recordings**.

The database stores session metadata, not raw audio.

---

# 23. `service_requests`

A customer request is distinct from a conversation.

Example:

> "I want to know whether this salon has an appointment tomorrow."

```sql
create table public.service_requests (
    id uuid primary key default gen_random_uuid(),

    customer_id uuid
        references public.profiles(id)
        on delete set null,

    business_id uuid
        references public.businesses(id)
        on delete set null,

    conversation_id uuid
        references public.conversations(id)
        on delete set null,

    business_service_id uuid
        references public.business_services(id)
        on delete set null,

    request_type text not null
        check (
            request_type in (
                'information',
                'availability',
                'quote',
                'booking',
                'callback',
                'other'
            )
        ),

    status text not null default 'open'
        check (
            status in (
                'open',
                'in_progress',
                'completed',
                'cancelled',
                'expired'
            )
        ),

    notes text,

    requested_date date,

    requested_time time,

    metadata jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
```

---

# 24. Future `bookings`

Not required for MVP.

But the architecture reserves the concept.

Future relationship:

```text
service_request
      ↓
booking
      ↓
completed service
      ↓
review
```

Do not implement the full booking engine until the product validates the demand.

---

# 25. `reviews`

Reviews must be connected to actual interaction where possible.

```sql
create table public.reviews (
    id uuid primary key default gen_random_uuid(),

    business_id uuid not null
        references public.businesses(id)
        on delete cascade,

    reviewer_id uuid not null
        references public.profiles(id)
        on delete cascade,

    service_request_id uuid
        references public.service_requests(id)
        on delete set null,

    rating smallint not null
        check (rating between 1 and 5),

    title text,

    body text,

    status text not null default 'published'
        check (
            status in (
                'pending',
                'published',
                'hidden',
                'removed'
            )
        ),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
```

### Future reputation calculation

Do not store a manually editable "trust score" initially.

Calculate reputation from:

* completed interactions
* reviews
* rating average
* response quality
* cancellations
* complaints
* verified business status

This prevents users from simply manipulating a reputation field.

---

# 26. `ai_configurations`

Business-specific AI behaviour.

```sql
create table public.ai_configurations (
    id uuid primary key default gen_random_uuid(),

    business_id uuid not null unique
        references public.businesses(id)
        on delete cascade,

    enabled boolean not null default false,

    greeting text,

    personality text,

    instructions text,

    escalation_enabled boolean not null default true,

    escalation_message text,

    handoff_enabled boolean not null default true,

    language text not null default 'en',

    model_provider text,

    model_name text,

    configuration jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
```

---

# 27. `ai_knowledge_items`

Structured knowledge for the AI.

```sql
create table public.ai_knowledge_items (
    id uuid primary key default gen_random_uuid(),

    business_id uuid not null
        references public.businesses(id)
        on delete cascade,

    title text not null,

    content text not null,

    category text,

    source_url text,

    priority integer not null default 0,

    is_active boolean not null default true,

    metadata jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
```

Examples:

```text
Parking
Cancellation policy
Opening hours
Services
Pricing
Location
Payment methods
Accessibility
Frequently asked questions
```

---

# 28. AI Knowledge Principle

The AI must follow:

> **Retrieve → verify → respond.**

It should not treat the LLM's general knowledge as the authoritative source for business information.

For example:

Customer:

> "How much is a haircut?"

The AI should retrieve:

```text
business_services.price
```

rather than generate a price.

---

# 29. `notifications`

```sql
create table public.notifications (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references public.profiles(id)
        on delete cascade,

    type text not null,

    title text not null,

    body text not null,

    data jsonb not null default '{}'::jsonb,

    read_at timestamptz,

    created_at timestamptz not null default now()
);
```

---

# 30. `analytics_events`

Analytics should not be mixed with transactional tables.

```sql
create table public.analytics_events (
    id uuid primary key default gen_random_uuid(),

    user_id uuid
        references public.profiles(id)
        on delete set null,

    business_id uuid
        references public.businesses(id)
        on delete set null,

    session_id text,

    event_name text not null,

    event_category text,

    properties jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now()
);
```

Examples:

```text
business_viewed
service_viewed
search_performed
favorite_added
conversation_started
voice_started
voice_completed
request_created
review_created
ai_handoff
```

---

# 31. `audit_logs`

For administrative/security events.

```sql
create table public.audit_logs (
    id uuid primary key default gen_random_uuid(),

    actor_user_id uuid
        references public.profiles(id)
        on delete set null,

    business_id uuid
        references public.businesses(id)
        on delete set null,

    action text not null,

    entity_type text,

    entity_id uuid,

    old_values jsonb,

    new_values jsonb,

    ip_address inet,

    user_agent text,

    created_at timestamptz not null default now()
);
```

Examples:

```text
business_updated
business_suspended
service_created
service_deleted
staff_invited
staff_removed
ai_configuration_changed
review_hidden
```

---

# 32. Relationship Diagram

The core relationship is:

```text
                         auth.users
                             │
                             ▼
                         profiles
                         │       │
                 ┌───────┘       └──────────┐
                 ▼                          ▼
             user_roles               business_members
                                             │
                                             ▼
                                        businesses
                                      /     │      \
                                     /      │       \
                                    ▼       ▼        ▼
                              categories services business_hours
                                  │          │
                                  │          ▼
                                  └── business_services
                                             │
                                             ▼
                                      service_requests
                                             │
                                             ▼
                                          reviews


businesses
    │
    ├──────── conversations
    │                │
    │                ├── conversation_participants
    │                │
    │                ├── messages
    │                │
    │                └── voice_sessions
    │
    ├──────── ai_configurations
    │
    ├──────── ai_knowledge_items
    │
    ├──────── analytics_events
    │
    └──────── audit_logs
```

---

# 33. Index Strategy

Indexes should be created based on actual query patterns.

## Businesses

```sql
create index idx_businesses_status
on businesses(status);

create index idx_businesses_city
on businesses(city);

create index idx_businesses_location
on businesses(latitude, longitude);

create index idx_businesses_slug
on businesses(slug);
```

---

## Business categories

```sql
create index idx_business_categories_category
on business_categories(category_id);

create index idx_business_categories_business
on business_categories(business_id);
```

---

## Services

```sql
create index idx_business_services_business
on business_services(business_id);

create index idx_business_services_active
on business_services(business_id, is_active);
```

---

## Conversations

```sql
create index idx_conversations_customer
on conversations(customer_id);

create index idx_conversations_business
on conversations(business_id);

create index idx_conversations_status
on conversations(status);
```

---

## Messages

```sql
create index idx_messages_conversation_created
on messages(conversation_id, created_at);
```

This is particularly important.

The application will frequently query:

> Give me the messages in this conversation ordered chronologically.

---

## Requests

```sql
create index idx_requests_customer
on service_requests(customer_id);

create index idx_requests_business
on service_requests(business_id);

create index idx_requests_status
on service_requests(status);
```

---

## Reviews

```sql
create index idx_reviews_business
on reviews(business_id);

create index idx_reviews_reviewer
on reviews(reviewer_id);
```

---

# 34. Search

Do not introduce Elasticsearch/OpenSearch in MVP.

PostgreSQL is sufficient.

Start with:

```text
ILIKE
```

and PostgreSQL full-text search.

Later, if search becomes large:

```text
PostgreSQL FTS
       ↓
pgvector
       ↓
dedicated search engine
```

Only introduce another search infrastructure when PostgreSQL demonstrably becomes insufficient.

---

# 35. Row Level Security

RLS is mandatory.

Supabase should **not** be configured so that authenticated users can freely read/write all tables.

The basic principle:

### Customers can

* read public business information
* read public services
* manage their own favorites
* access their own conversations
* access their own requests
* create reviews according to review rules

### Business owners can

* manage their own business
* manage their services
* manage hours
* manage staff
* access conversations involving their business
* manage AI configuration
* manage knowledge items

### Staff can

* access business data according to role
* participate in conversations
* manage appropriate requests

### Platform administrators can

* access platform-wide administrative information

---

# 36. RLS Example

Customer reading own conversations:

```sql
create policy "Users can read their own conversations"
on public.conversations
for select
using (
    customer_id = auth.uid()
);
```

Business members require a membership check rather than simply checking whether the requester is authenticated.

Conceptually:

```sql
exists (
    select 1
    from business_members bm
    where bm.business_id = conversations.business_id
      and bm.user_id = auth.uid()
      and bm.status = 'active'
)
```

---

# 37. Never Trust Frontend Authorization

This is extremely important.

Do **not** do:

```typescript
if (user.role === "business_owner") {
    updateBusiness();
}
```

and assume security is complete.

The frontend is not the security boundary.

Authorization must be enforced through:

```text
Supabase RLS
+
server-side validation
+
business membership
+
application authorization
```

---

# 38. Database Functions

Use PostgreSQL functions only when they provide a real advantage.

Good candidates:

### `is_business_member()`

Determines whether a user belongs to a business.

### `is_business_admin()`

Determines whether the user has owner/manager privileges.

### `create_profile_after_signup()`

Automatically creates a profile after authentication.

### `calculate_business_rating()`

Calculates rating aggregates.

### `update_updated_at()`

Generic timestamp trigger.

---

# 39. Updated-at Trigger

Create a reusable function:

```sql
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;
```

Apply to tables that contain `updated_at`.

---

# 40. Business Slug

Business slugs must be unique.

Example:

```text
https://oneplace.com/business/harbour-hair-studio
```

Database:

```text
slug = harbour-hair-studio
```

Do not use business names directly as URLs.

---

# 41. Currency

Store monetary values as:

```sql
numeric(12,2)
```

Never:

```text
float
```

Example:

```text
39.99
```

Currency:

```text
CAD
```

This becomes important when One Place expands internationally.

---

# 42. Location

For MVP:

```text
latitude
longitude
city
province
postal_code
country
```

is sufficient.

Do not immediately introduce PostGIS unless location functionality becomes sufficiently advanced.

When needed, migrate to:

```text
PostGIS geography(Point, 4326)
```

for:

* distance queries
* radius searches
* map clustering
* geographic filtering

---

# 43. Soft Deletion

Do not physically delete important business records immediately.

For example:

```text
business.deleted_at
```

allows the business to be removed from normal application views while preserving historical relationships.

This is particularly important for:

* conversations
* requests
* reviews
* audit logs

---

# 44. Data Retention

The system should distinguish between:

### Operational data

Needed for the application.

### Analytics data

Used to understand product usage.

### Audit data

Used for accountability/security.

### Communication data

Potentially sensitive.

### Voice data

Should not be permanently retained by default.

---

# 45. Voice Data Policy

MVP:

```text
Voice audio
     ↓
LiveKit
     ↓
real-time conversation
     ↓
session ends
     ↓
no recording stored
```

Database:

```text
voice_sessions
```

stores:

* session ID
* conversation
* start
* end
* duration
* status
* participants

It does **not** store the audio itself.

---

# 46. AI Data Boundary

The database should make it possible to control what is sent to an external LLM.

The application should not blindly send the entire database record.

Instead:

```text
Customer request
       ↓
Business context retrieval
       ↓
Minimum required information
       ↓
LLM
       ↓
Response
```

For example, the LLM may receive:

```json
{
  "business_name": "Example Salon",
  "service": "Haircut",
  "price": 40,
  "currency": "CAD",
  "opening_hours": "9:00-17:00"
}
```

rather than the entire business database row.

---

# 47. JSONB Rules

JSONB is allowed for:

```text
metadata
configuration
AI configuration
analytics properties
integration-specific information
```

JSONB should **not** be used for:

```text
business name
price
service
user ID
business ID
status
created_at
relationships
```

Core business data remains relational.

---

# 48. Database Migration Structure

Use Supabase migrations.

Recommended structure:

```text
supabase/
└── migrations/
    ├── 001_extensions.sql
    ├── 002_profiles.sql
    ├── 003_roles.sql
    ├── 004_businesses.sql
    ├── 005_categories.sql
    ├── 006_services.sql
    ├── 007_business_hours.sql
    ├── 008_favorites.sql
    ├── 009_conversations.sql
    ├── 010_messages.sql
    ├── 011_voice_sessions.sql
    ├── 012_service_requests.sql
    ├── 013_reviews.sql
    ├── 014_ai.sql
    ├── 015_notifications.sql
    ├── 016_analytics.sql
    ├── 017_audit_logs.sql
    ├── 018_indexes.sql
    └── 019_rls.sql
```

Do not manually modify production tables through the Supabase dashboard.

Everything should eventually exist in version-controlled migrations.

---

# 49. Seed Data

The initial database should include:

### Categories

The initial service categories defined for One Place.

### Languages

Initially:

```text
English
```

Future:

```text
French
Spanish
Arabic
etc.
```

### System roles

```text
customer
business_owner
business_staff
platform_admin
```

---

# 50. MVP Data Flow

A typical customer journey:

```text
Customer opens One Place
        ↓
Searches "hair salon"
        ↓
categories
        ↓
businesses
        ↓
business_services
        ↓
Customer opens business
        ↓
Conversation
        ↓
messages
        ↓
AI/business staff
        ↓
service_request
        ↓
optional review
```

---

# 51. Voice Data Flow

```text
Customer
   ↓
Next.js
   ↓
Create conversation
   ↓
Create voice_session
   ↓
Generate LiveKit access token
   ↓
LiveKit room
   ↓
AI / business staff
   ↓
Conversation ends
   ↓
Update voice_session
   ↓
No recording retained by default
```

---

# 52. Future Direct Phone Architecture

This is deliberately **not required for MVP**.

Later:

```text
Customer telephone
       ↓
Telephony provider
       ↓
LiveKit
       ↓
AI Agent
       ↓
Business staff
```

The database already has enough structure to support this through:

```text
conversations
voice_sessions
businesses
business_members
```

Therefore we do not need to redesign the database when telephone support is introduced.

---

# 53. Future Booking Architecture

Later:

```text
service_requests
       ↓
booking
       ↓
appointment
       ↓
service completion
       ↓
review
```

The current `service_requests` table intentionally acts as the foundation.

---

# 54. Future Multi-location Architecture

The current MVP can initially treat one business as one location.

When required, introduce:

```text
business_locations
```

and migrate:

```text
business
    ↓
business_locations
    ↓
business_services
business_hours
availability
```

Do not add this complexity before it is necessary.

---

# 55. Future Staff Scheduling

Later:

```text
business_members
       ↓
staff_profiles
       ↓
staff_availability
       ↓
appointments
```

Again, do not implement the complete workforce scheduling engine in MVP.

---

# 56. Reputation Architecture

One Place's long-term reputation system should not be a single number stored in:

```text
businesses.reputation_score
```

Instead:

```text
reviews
service_requests
completed interactions
cancellations
complaints
response behaviour
verification
```

feed a reputation calculation.

Eventually:

```text
raw events
    ↓
reputation service
    ↓
calculated reputation
    ↓
business profile
```

This gives One Place a much stronger trust system than simply copying conventional star ratings.

---

# 57. Database Security Rules

The following are mandatory:

### Never

* expose service-role credentials to the browser
* allow unrestricted table access
* store passwords in application tables
* store raw payment card information
* store voice recordings by default
* trust client-provided ownership
* allow arbitrary users to modify business records

### Always

* use RLS
* validate IDs
* validate ownership
* validate business membership
* use parameterized queries
* log sensitive administrative actions
* minimize external AI data
* use migrations

---

# 58. Database Environment Strategy

Three environments:

```text
Development
     ↓
Staging
     ↓
Production
```

Each environment should have its own Supabase project/database.

Do not develop against production.

---

# 59. Backup Strategy

Production database must have:

* automated backups
* point-in-time recovery where available
* migration history
* disaster recovery procedure

Critical application data should never exist only in an individual developer's local environment.

---

# 60. What Belongs in Supabase Storage

Do not put large files directly into PostgreSQL.

Use Supabase Storage for:

```text
business logos
business images
service images
profile avatars
documents
future attachments
```

PostgreSQL stores:

```text
storage path
metadata
ownership
relationship
```

not the actual binary file.

---

# 61. MVP Database Boundary

The MVP should actually activate:

```text
profiles
user_roles

businesses
business_members

categories
business_categories

services
business_services

business_hours
availability_exceptions

favorites

conversations
conversation_participants
messages
voice_sessions

service_requests
reviews

ai_configurations
ai_knowledge_items

notifications
analytics_events
audit_logs
```

This is already enough to build the core One Place product.

---

# 62. What We Deliberately Do NOT Build Yet

Do not build:

```text
booking engine
payment processing
subscription billing
telephone numbers per business
advanced workforce scheduling
PostGIS
Elasticsearch
vector database
dedicated AI infrastructure
AI model training
complex recommendation engine
multi-location management
commission engine
payout system
full CRM
```

These are post-validation capabilities.

---

# 63. Final Database Architecture

The complete architecture is therefore:

```text
                    SUPABASE AUTH
                         │
                         ▼
                     PROFILES
                         │
             ┌───────────┴───────────┐
             ▼                       ▼
        USER ROLES              BUSINESSES
                                     │
                     ┌───────────────┼────────────────┐
                     ▼               ▼                ▼
                 CATEGORIES       SERVICES        MEMBERS
                     │               │
                     └───────┬───────┘
                             ▼
                    BUSINESS SERVICES
                             │
                ┌────────────┼─────────────┐
                ▼            ▼             ▼
             HOURS       REQUESTS       AI CONFIG
                             │             │
                             ▼             ▼
                          REVIEWS      KNOWLEDGE


CUSTOMER
   │
   ▼
CONVERSATION
   │
   ├── PARTICIPANTS
   ├── MESSAGES
   └── VOICE SESSIONS


PLATFORM
   │
   ├── NOTIFICATIONS
   ├── ANALYTICS
   └── AUDIT LOGS
```

## The important architectural decision

**The database is intentionally more capable than the MVP, but the application is not.**

That means we can build the MVP quickly without painting ourselves into a corner.
