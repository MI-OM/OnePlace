#!/usr/bin/env python3
"""Generate the Supabase seed migration for 8 St. John's organizations.

Output: supabase/migrations/20260821020000_seed_8_organizations.sql

Schema notes baked into the generator (verified against the live DB):
- business_hours:      no updated_at column
- business_services:   requires service_id (NULL) and currency ('CAD')
- business_photos:     uses alt_text (no caption), no updated_at
- ai_configurations:   uses `enabled` (NOT is_active); greeting +
                       system_prompt live in the `configuration` jsonb
- ai_knowledge_items:  `title` is NOT NULL and always included
"""

import json
from pathlib import Path

OUT_PATH = Path(__file__).resolve().parent / "supabase" / "migrations" / "20260821020000_seed_8_organizations.sql"


# ---------------------------------------------------------------------------
# SQL helpers
# ---------------------------------------------------------------------------

def esc(value: str) -> str:
    """Escape a string for a single-quoted SQL literal (doubled apostrophes)."""
    return value.replace("'", "''")


def q(value) -> str:
    """Quote a Python value as a SQL string literal."""
    return "'" + esc(str(value)) + "'"


def j(obj) -> str:
    """Render a Python object as a jsonb literal."""
    return q(json.dumps(obj, ensure_ascii=False)) + "::jsonb"


def lit(value) -> str:
    """Render any scalar Python value as a SQL literal."""
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return str(value)
    return q(value)


# ---------------------------------------------------------------------------
# New categories (IF NOT EXISTS pattern)
# ---------------------------------------------------------------------------

NEW_CATEGORIES = [
    ("Coaching", "coaching", "Target", 20),
    ("Publishing", "publishing", "BookOpen", 21),
    ("Church & Faith", "church", "Church", 22),
    ("Career Services", "career-services", "Briefcase", 23),
    ("Technology & Innovation", "technology", "Cpu", 24),
]


def categories_sql() -> str:
    lines = [
        "",
        "-- ============================================================",
        "-- NEW CATEGORIES",
        "-- ============================================================",
    ]
    for name, slug, icon, sort in NEW_CATEGORIES:
        lines.append(
            "INSERT INTO categories (id, name, slug, icon, is_active, sort_order, created_at, updated_at)\n"
            f"SELECT gen_random_uuid(), {q(name)}, {q(slug)}, {q(icon)}, true, {sort}, now(), now()\n"
            f"WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = {q(slug)});\n"
        )
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Business data
# ---------------------------------------------------------------------------

def svc(name, desc, ptype, price=None, mins=None, meta=None):
    return {"name": name, "desc": desc, "ptype": ptype, "price": price, "mins": mins, "meta": meta or {}}


def know(title, content, cat):
    return {"title": title, "content": content, "cat": cat}


def weekdays(opens="09:00", closes="17:00"):
    """Mon-Fri open, Sat/Sun closed -> 7 (day, opens, closes, is_closed) tuples."""
    return [(d, opens, closes, d >= 5) for d in range(7)]


BUSINESSES = [
    # -------------------------------------------------------------- 1
    {
        "name": "OA Dynasty Group",
        "slug": "oa-dynasty-group",
        "desc": (
            "The OA-Dynasty Group Inc. is a publishing, media, and education enterprise "
            "producing books, journals, courses, media content, and counselling services. "
            "They specialize in marriage coaching, relationship counseling, pre-marital "
            "preparation, and faith-based community programs for individuals, couples, and families."
        ),
        "phone": "709-722-8899",
        "email": "info@oadynasty.com",
        "site": "https://oadynasty.com/",
        "addr1": None,
        "city": "St. John's",
        "postal": None,
        "lat": 47.5615,
        "lng": -52.7126,
        "founded": None,
        "template": "modern",
        "cats": ["coaching", "publishing"],
        "meta": {
            "facebook": "https://www.facebook.com/OA-Dynasty-Forum-103605569017113",
            "twitter": "https://twitter.com/oa_dynasty",
            "instagram": "https://www.instagram.com/oa_dynasty/",
            "youtube": "http://youtube.com/@marriagewithbliss",
            "tags": ["marriage coaching", "publishing", "counseling", "books", "courses",
                     "faith-based", "relationships", "pre-marital", "family"],
        },
        "hours": weekdays(),
        "services": [
            svc("Relationship Clarity Session",
                "One-on-one session for singles and engaged clients to gain clarity on "
                "relationship challenges.",
                "starting_from", 150, 60, {"format": "in-person or virtual"}),
            svc("Marriage Assessment",
                "Structured assessment evaluating communication patterns, emotional intimacy, "
                "and conflict resolution styles, with a personalized written report.",
                "starting_from", 200, 60, {"format": "in-person or virtual"}),
            svc("Pre-Marital Coaching Classes",
                "10-module programme over 3 months covering values, vision, finances, family, "
                "faith, and conflict resolution.",
                "starting_from", 800, 60, {"format": "10 sessions over 3 months", "modules": 10}),
            svc("Restorative Coaching",
                "6-session programme for couples navigating deeper wounds such as betrayal, "
                "prolonged conflict, emotional distance, and trust breakdown.",
                "starting_from", 1200, 60, {"format": "6 sessions x 60 minutes"}),
            svc("Corporate Training",
                "Half-day or full-day workshops for organizations on work-life integration, "
                "communication, conflict resolution, and emotional intelligence.",
                "quote_required", None, None, {"format": "workshop"}),
            svc("Book Publishing Consultation",
                "Step-by-step guidance through the publishing journey, from manuscript to "
                "published book.",
                "quote_required"),
        ],
        "photos": [
            ("https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&h=600&fit=crop",
             "Marriage coaching session"),
            ("https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=600&fit=crop",
             "Family and relationship support"),
            ("https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&h=600&fit=crop",
             "Published books and reading materials"),
        ],
        "ai_greeting": ("Welcome to OA Dynasty Group! We help individuals, couples, and families "
                        "thrive through coaching, books, and courses. How can I help you today?"),
        "ai_personality": ("Warm, supportive relationship coach who is faith-friendly, inclusive, "
                           "and encouraging."),
        "ai_prompt": ("You are a helpful assistant for OA Dynasty Group, a marriage coaching and "
                      "publishing enterprise in St. John's, NL. You help with information about "
                      "coaching services (relationship clarity, marriage assessment, pre-marital "
                      "coaching, restorative coaching), corporate training, book publishing "
                      "consultations, books, and courses. You are warm, supportive, and "
                      "faith-friendly while being inclusive."),
        "knowledge": [
            know("Coaching Programs",
                 "OA Dynasty Group offers five coaching packages: Relationship Clarity (single "
                 "60-minute session for singles and engaged clients), Marriage Assessment "
                 "(structured evaluation with written report), Pre-Marital Coaching Classes "
                 "(10 modules over 3 months), Restorative Coaching (6 sessions for couples "
                 "navigating deeper wounds), and Corporate Training workshops for organizations.",
                 "services"),
            know("About the Founders",
                 "Founded by Dr. Anthony Akerele (scientist and published author) and Dr. Tolulope "
                 "Akerele (scholar and planning professional). Both are trained marriage coaches "
                 "and published authors who co-host the Cleave to Bliss Podcast.",
                 "about"),
            know("Contact & Who They Serve",
                 "Phone 709-722-8899, email info@oadynasty.com. OA Dynasty Group serves individuals "
                 "stepping into purpose, couples building lasting marriages, and families raising "
                 "the next generation. Faith-rooted but welcoming to everyone regardless of "
                 "background.",
                 "contact"),
            know("Booking Policy",
                 "48+ hours notice for free cancellation; 24-48 hours notice carries a 50% fee; "
                 "under 24 hours is charged in full. Payment is required at booking and all "
                 "sessions are strictly confidential. An intake form is required before the first "
                 "session.",
                 "policies"),
        ],
    },
    # -------------------------------------------------------------- 2
    {
        "name": "CMFI NL",
        "slug": "cmfi-nl",
        "desc": (
            "Christian Missionary Fellowship International Newfoundland is a non-denominational "
            "church in St. John's offering Sunday services (9 AM and 12 PM, with French "
            "translation at noon), Wednesday Bible study, house churches, couples retreats, "
            "premarital counseling, and community outreach. An authentic family where you are "
            "taught God's Word, encouraged in spiritual growth, and empowered to serve."
        ),
        "phone": "(709) 700-7019",
        "email": "info@cmfinl.org",
        "site": "https://cmfinl.org/",
        "addr1": "40 International Place",
        "city": "St. John's",
        "postal": "A1A 0R6",
        "lat": 47.5660,
        "lng": -52.7430,
        "founded": None,
        "template": "classic",
        "cats": ["church", "non-profit"],
        "meta": {
            "facebook": "https://www.facebook.com/cmfinl",
            "instagram": "https://www.instagram.com/cmfinl/",
            "twitter": "https://twitter.com/cmfinl",
            "youtube": "https://www.youtube.com/@CMFINL",
            "tags": ["church", "non-denominational", "worship", "bible study", "prayer",
                     "couples retreat", "premarital counseling", "french service", "community"],
        },
        "hours": [
            (0, "09:00", "17:00", True),    # Mon closed
            (1, "09:00", "17:00", True),    # Tue closed
            (2, "18:00", "20:30", False),   # Wed Bible study 6-8:30 PM
            (3, "09:00", "17:00", True),    # Thu closed
            (4, "09:00", "17:00", True),    # Fri closed
            (5, "09:00", "14:00", True),    # Sat closed
            (6, "09:00", "14:00", False),   # Sun services 9 AM-2 PM
        ],
        "services": [
            svc("Sunday AM Service",
                "First service of the day with Spirit-filled worship and teaching.",
                "fixed", 0, 120, {"time": "9:00 AM"}),
            svc("Sunday Noon Service",
                "Second service with French translation available.",
                "fixed", 0, 120, {"time": "12:00 PM", "languages": ["English", "French"]}),
            svc("Wednesday Bible Study",
                "Midweek Bible study and teaching. Pre-service prayers start at 6 PM.",
                "fixed", 0, 120, {"time": "7:00 PM", "pre_service": "6:00 PM"}),
            svc("Couples Retreat",
                "Faith-based retreat helping married couples strengthen their relationship.",
                "quote_required"),
            svc("Premarital Counseling",
                "Structured preparation for engaged or seriously dating couples.",
                "quote_required"),
            svc("House Churches",
                "Small-group gatherings across the city for deeper community and spiritual growth.",
                "fixed", 0, 90),
        ],
        "photos": [
            ("https://images.unsplash.com/photo-1438032005730-c779502df39b?w=800&h=600&fit=crop",
             "Sunday worship service"),
            ("https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=800&h=600&fit=crop",
             "Congregation gathered in fellowship"),
            ("https://images.unsplash.com/photo-1473177104440-ffee2f376098?w=800&h=600&fit=crop",
             "Worship night atmosphere"),
        ],
        "ai_greeting": ("Welcome to CMFI NL! We are a non-denominational church family in "
                        "St. John's. How can I help you today?"),
        "ai_personality": "Warm, welcoming church host who is faith-centered and community-minded.",
        "ai_prompt": ("You are a helpful assistant for CMFI NL (Christian Missionary Fellowship "
                      "International Newfoundland), a non-denominational church in St. John's, NL. "
                      "You provide information about service times, Wednesday Bible study, house "
                      "churches, couples retreats, premarital counseling, and community outreach. "
                      "You are warm, welcoming, and faith-centered."),
        "knowledge": [
            know("Service Times",
                 "Sunday AM Service at 9:00 AM, Sunday Noon Service at 12:00 PM (with French "
                 "translation), and Wednesday Bible Study at 7:00 PM with pre-service prayers at "
                 "6:00 PM.",
                 "services"),
            know("Location & Contact",
                 "Located at 40 International Place, St. John's, NL A1A 0R6. Phone (709) 700-7019, "
                 "email info@cmfinl.org.",
                 "contact"),
            know("Ministries & Programs",
                 "Beyond weekly services, CMFI NL runs house churches, an annual couples retreat, "
                 "premarital counseling, children's programs, and community outreach initiatives.",
                 "services"),
        ],
    },
    # -------------------------------------------------------------- 3
    {
        "name": "ININ",
        "slug": "inin",
        "desc": (
            "Insight Nexus Integration Network (ININ) Inc. is a Black-led, immigrant-focused "
            "non-profit supporting integration through research, empowerment, and community "
            "services. ININ advances the socio-cultural and economic integration and "
            "participation of Black and immigrant communities, starting in Newfoundland and "
            "Labrador."
        ),
        "phone": None,
        "email": None,
        "site": "https://ininetwork.ca/",
        "addr1": None,
        "city": "St. John's",
        "postal": None,
        "lat": 47.5615,
        "lng": -52.7126,
        "founded": 2024,
        "template": "minimal",
        "cats": ["non-profit"],
        "meta": {
            "linkedin": "https://www.linkedin.com/company/ininetwork",
            "instagram": "https://www.instagram.com/ininetwork_ca",
            "tags": ["non-profit", "immigration", "integration", "research", "empowerment",
                     "Black-led", "community services", "immigrants", "Newfoundland"],
        },
        "hours": weekdays(),
        "services": [
            svc("Community Integration Programs",
                "Programs designed to support the socio-cultural and economic integration of "
                "immigrants in Newfoundland and Labrador.",
                "fixed", 0),
            svc("Research & Advocacy",
                "Evidence-based research on immigrant experiences and integration outcomes, "
                "paired with advocacy.",
                "quote_required"),
            svc("Empowerment Workshops",
                "Practical workshops that strengthen individuals and families.",
                "fixed", 0),
            svc("Community Surveys",
                "Participatory surveys to understand and address immigrant community needs.",
                "fixed", 0),
        ],
        "photos": [
            ("https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&h=600&fit=crop",
             "Volunteers supporting newcomer communities"),
            ("https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=600&fit=crop",
             "Diverse community group"),
            ("https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&h=600&fit=crop",
             "Community workshop discussion"),
        ],
        "ai_greeting": ("Welcome to ININ! We support the integration of Black and immigrant "
                        "communities through research, empowerment, and community services. "
                        "How can I help you?"),
        "ai_personality": "Inclusive, encouraging community advocate who is evidence-driven.",
        "ai_prompt": ("You are a helpful assistant for ININ (Insight Nexus Integration Network), "
                      "a Black-led, immigrant-focused non-profit in St. John's, NL. You help with "
                      "information about community integration programs, research and advocacy, "
                      "empowerment workshops, community surveys, and how to get involved or "
                      "partner. You are inclusive, supportive, and evidence-driven."),
        "knowledge": [
            know("About ININ",
                 "ININ is a Black-led, immigrant-focused non-profit founded in 2024 and based in "
                 "St. John's, NL. Its mission is to support integration through research and "
                 "empowerment services that strengthen individuals and families and build thriving "
                 "communities across Newfoundland and Labrador.",
                 "about"),
            know("Programs & Services",
                 "ININ offers community integration programs, research and advocacy, empowerment "
                 "workshops, and community surveys. Community programs are offered free of charge.",
                 "services"),
            know("Get Involved",
                 "ININ collaborates with volunteers, researchers, community organizations, and "
                 "settlement partners. Reach out through ininetwork.ca or LinkedIn to participate "
                 "in surveys, workshops, or partnerships.",
                 "faq"),
        ],
    },
    # -------------------------------------------------------------- 4
    {
        "name": "Dikan Tech Corporation",
        "slug": "dikan-tech-corporation",
        "desc": (
            "Dikan Tech Corporation is a non-profit, Black-owned technology education and "
            "consulting company equipping individuals — especially immigrants, underrepresented "
            "minorities, career transitioners, and students — with critical digital skills "
            "through coding workshops, career transition programs, and customized curricula."
        ),
        "phone": "+1 709 219 2999",
        "email": "info@dikantech.ca",
        "site": "https://dikantech.ca/",
        "addr1": "76 Halls Road",
        "city": "St. John's",
        "postal": "A1A 5Y8",
        "lat": 47.5800,
        "lng": -52.7500,
        "founded": 2024,
        "template": "modern",
        "cats": ["non-profit", "technology"],
        "meta": {
            "linkedin": "https://www.linkedin.com/company/dikan-tech-corp/",
            "instagram": "https://www.instagram.com/dikantech/",
            "youtube": "https://youtube.com/@dikantechcorp",
            "tags": ["non-profit", "technology", "education", "coding", "digital skills",
                     "mentorship", "career transition", "Black-owned", "immigrants", "seniors"],
        },
        "hours": weekdays(),
        "services": [
            svc("Mentorship Over Coffee",
                "Small-group mentorship connecting participants directly with industry "
                "professionals.",
                "fixed", 0, None, {"format": "small-group mentorship"}),
            svc("Beyond the Degree",
                "Career-focused program helping students and recent graduates transition from "
                "education into the tech workforce.",
                "fixed", 0),
            svc("Talk Tech to Me",
                "Interactive workshop and panel-style event that breaks down the tech industry "
                "for newcomers.",
                "fixed", 0),
            svc("Digital Makers Lab",
                "Hands-on learning lab where participants build practical tech skills through "
                "real projects.",
                "fixed", 0),
            svc("Safety Today for Seniors",
                "Community program helping seniors confidently and safely navigate today's "
                "digital world.",
                "fixed", 0),
            svc("Project Collective Work Term",
                "52-week team-based work term providing real-world experience on tech projects.",
                "fixed", 0, None, {"duration": "52 weeks"}),
        ],
        "photos": [
            ("https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=600&fit=crop",
             "Coding on a laptop"),
            ("https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&h=600&fit=crop",
             "Mentor guiding a learner"),
            ("https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop",
             "Team collaborating on a tech project"),
        ],
        "ai_greeting": ("Welcome to Dikan Tech! We help people build real tech skills through "
                        "free mentorship, workshops, and hands-on programs. How can I help you?"),
        "ai_personality": ("Encouraging, practical tech educator who believes anyone can learn "
                           "digital skills."),
        "ai_prompt": ("You are a helpful assistant for Dikan Tech Corporation, a non-profit tech "
                      "education company in St. John's, NL. You help with information about their "
                      "free programs (Mentorship Over Coffee, Beyond the Degree, Talk Tech to Me, "
                      "Digital Makers Lab, Safety Today for Seniors, Project Collective Work "
                      "Term), how to join, and partnership opportunities. You are encouraging, "
                      "practical, and inclusive."),
        "knowledge": [
            know("Programs Overview",
                 "Dikan Tech offers six free programs: Mentorship Over Coffee (small-group "
                 "mentorship with industry professionals), Beyond the Degree (career transition "
                 "for students and grads), Talk Tech to Me (interactive panels), Digital Makers "
                 "Lab (hands-on tech skills), Safety Today for Seniors (digital literacy for "
                 "seniors), and Project Collective (52-week team work term).",
                 "services"),
            know("About & Contact",
                 "Founded by Gillian Ogyiri and incorporated in 2024. Located at 76 Halls Road, "
                 "St. John's, NL A1A 5Y8. Phone +1 709 219 2999, email info@dikantech.ca.",
                 "about"),
            know("Who We Serve",
                 "Programs are designed for immigrants, underrepresented minorities, career "
                 "transitioners, students, and seniors. No prior tech experience is needed for "
                 "most programs.",
                 "faq"),
        ],
    },
    # -------------------------------------------------------------- 5
    {
        "name": "Verisult",
        "slug": "verisult",
        "desc": (
            "Verisult is an EdTech company addressing the global talent shortage by helping "
            "individuals and organizations build skills and talent pipelines. Through Verisult "
            "College (career accelerator programs), Verisult Talent (recruitment and workforce "
            "development), and SkillMatch AI, they deliver training, work-integrated learning, "
            "mentorship, and AI-powered job matching."
        ),
        "phone": None,
        "email": "info@verisult.com",
        "site": "https://verisult.com/",
        "addr1": None,
        "city": "St. John's",
        "postal": None,
        "lat": 47.5615,
        "lng": -52.7126,
        "founded": None,
        "template": "modern",
        "cats": ["career-services"],
        "meta": {
            "facebook": "https://www.facebook.com/Verisult",
            "linkedin": "https://www.linkedin.com/company/verisult-inc/",
            "instagram": "https://www.instagram.com/verisult_inc/",
            "youtube": "https://www.youtube.com/@verisult",
            "tags": ["career services", "EdTech", "career accelerator", "project management",
                     "business analysis", "product management", "recruitment", "training",
                     "mentorship", "job placement", "PMP"],
        },
        "hours": weekdays(),
        "services": [
            svc("Career Accelerator Program (CAP)",
                "12-week mentor-led career accelerator with portfolio building, mock interviews, "
                "and job search support until placement. Pathways: Business Analysis, Product "
                "Management, Project Management.",
                "fixed", 1750, None,
                {"duration": "12 weeks", "placement_rate": "70%+",
                 "pathways": ["Business Analysis", "Product Management", "Project Management"]}),
            svc("PMP Group Coaching",
                "Group coaching for PMP certification preparation led by experienced project "
                "managers.",
                "starting_from"),
            svc("Thrive Tribe Free Community",
                "Free community for professionals focused on job searching, upskilling, and "
                "thought leadership.",
                "fixed", 0, None, {"members": "3000+"}),
            svc("Recruitment Services",
                "Inclusive recruitment and workforce development strategies for employers.",
                "quote_required"),
            svc("Corporate Training",
                "Customized training programs that upskill teams and organizations.",
                "quote_required"),
            svc("Get Hired Bootcamp",
                "Intensive bootcamp covering resume, LinkedIn, interview prep, and a fast "
                "job-search sprint.",
                "starting_from", 500, None, {"duration": "1 week"}),
        ],
        "photos": [
            ("https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&h=600&fit=crop",
             "Professionals celebrating a career milestone"),
            ("https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop",
             "Career strategy planning session"),
            ("https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&h=600&fit=crop",
             "One-on-one career coaching"),
        ],
        "ai_greeting": ("Welcome to Verisult! We help professionals build meaningful careers and "
                        "organizations find skilled talent. How can I help you today?"),
        "ai_personality": "Professional, results-oriented career strategist.",
        "ai_prompt": ("You are a helpful assistant for Verisult, an EdTech career services company "
                      "in St. John's, NL. You help with information about the Career Accelerator "
                      "Program (CAP), PMP group coaching, the Thrive Tribe free community, "
                      "recruitment services, corporate training, and the Get Hired Bootcamp. You "
                      "are professional, results-oriented, and supportive."),
        "knowledge": [
            know("Career Accelerator Program",
                 "CAP is a 12-week mentor-led program with a 70%+ placement rate. Three pathways: "
                 "Business Analysis, Product Management, and Project Management. Includes live "
                 "projects, 1:1 mentorship, portfolio building, resume and LinkedIn overhaul, mock "
                 "interviews, and job placement support. Investment: C$1,750.",
                 "services"),
            know("About Verisult",
                 "Founded by Ogaga Johnson, PMP. Verisult has trained thousands of professionals "
                 "across multiple countries through three divisions: Verisult College (training), "
                 "Verisult Talent (recruitment), and SkillMatch AI (job-matching product). Email "
                 "info@verisult.com.",
                 "about"),
            know("Who CAP Is For",
                 "Designed for career shifters, career starters, career relaunchers, and "
                 "experienced newcomers to Canada who want Canadian experience and faster "
                 "placement.",
                 "faq"),
        ],
    },
    # -------------------------------------------------------------- 6
    {
        "name": "Vezibility",
        "slug": "vezibility",
        "desc": (
            "Vezibility helps brands, creatives, and entrepreneurs cut through the noise with "
            "clarity-driven visibility strategies. Offerings include clarity sessions, the "
            "Visibility Vault template library, done-with-you support, and email marketing "
            "setup — all designed for sustainable growth without burnout."
        ),
        "phone": None,
        "email": None,
        "site": "https://www.vezibility.com/",
        "addr1": None,
        "city": "St. John's",
        "postal": None,
        "lat": 47.5615,
        "lng": -52.7126,
        "founded": None,
        "template": "minimal",
        "cats": ["coaching"],
        "meta": {
            "facebook": "https://web.facebook.com/Vezibility/",
            "instagram": "https://www.instagram.com/vezibility/",
            "linkedin": "https://www.linkedin.com/company/vezibility/",
            "tags": ["coaching", "visibility", "marketing", "branding", "content strategy",
                     "personal branding", "email marketing"],
        },
        "hours": weekdays(),
        "services": [
            svc("Clarity Session",
                "60-minute session to audit your online presence, fix bio and positioning, map "
                "your client journey, and leave with a tailored action plan.",
                "starting_from", 150, 60,
                {"includes": ["Online presence audit", "Bio & positioning fix",
                              "Client journey mapping", "Tailored action steps"]}),
            svc("Visibility Vault",
                "One-time purchase digital library: 100+ carousel templates across 20+ content "
                "categories, fully customizable, with quarterly updates.",
                "fixed", 59, None, {"type": "digital product", "access": "lifetime"}),
            svc("Done-With-You Support",
                "Quarterly ongoing support with monthly strategy sessions, content review, "
                "performance analysis, and direct access to the team.",
                "starting_from", 500, None, {"cadence": "quarterly"}),
            svc("Email Marketing Setup",
                "One-time setup of your email system: sequences, list building, welcome series, "
                "and funnel optimization.",
                "starting_from", 800, None, {"type": "one-time setup"}),
            svc("Free Visibility Audit",
                "Take the Visibility Scorecard for a quick snapshot of your brand visibility and "
                "what to fix first.",
                "fixed", 0, None,
                {"type": "free resource", "url": "https://www.vezibility.com/scorecard"}),
        ],
        "photos": [
            ("https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=800&h=600&fit=crop",
             "Social media marketing planning"),
            ("https://images.unsplash.com/photo-1553028826-f4804a6dba3b?w=800&h=600&fit=crop",
             "Content creation workspace"),
            ("https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=600&fit=crop",
             "Entrepreneur working on a laptop"),
        ],
        "ai_greeting": ("Hey! Welcome to Vezibility. We help you get seen, get trusted, and grow "
                        "— without the burnout. What can I help you with?"),
        "ai_personality": "Energetic, encouraging visibility coach who keeps things practical.",
        "ai_prompt": ("You are a helpful assistant for Vezibility, a visibility marketing coaching "
                      "business in St. John's, NL. You help with information about clarity "
                      "sessions, the Visibility Vault template library, done-with-you support, "
                      "email marketing setup, and the free visibility scorecard. You are "
                      "energetic, encouraging, and practical."),
        "knowledge": [
            know("Services Overview",
                 "Vezibility offers: Clarity Session (60-minute audit and action plan, from $150), "
                 "Visibility Vault ($59 template library), Done-With-You Support (quarterly, from "
                 "$500), Email Marketing Setup (one-time, from $800), and a free Visibility "
                 "Scorecard audit.",
                 "services"),
            know("Approach",
                 "Vezibility focuses on sustainable growth without burnout: audit your visibility, "
                 "create a strategy, implement with support, and optimize based on results. Over "
                 "1,500 people have used their frameworks to show up consistently online.",
                 "about"),
            know("Connect Online",
                 "Follow Vezibility on Instagram @vezibility, Facebook /Vezibility, and LinkedIn, "
                 "or visit vezibility.com to take the free Visibility Scorecard.",
                 "contact"),
        ],
    },
    # -------------------------------------------------------------- 7
    {
        "name": "SeniorsNL",
        "slug": "seniors-nl",
        "desc": (
            "SeniorsNL is a non-profit charitable organization supporting people aged 50 and "
            "older across Newfoundland and Labrador. They offer trusted information and referral "
            "services, committed peer support volunteers, and a robust community outreach and "
            "engagement program, so every senior can access the programs, supports, and services "
            "they need."
        ),
        "phone": "1-800-563-5599",
        "email": "info@seniorsnl.ca",
        "site": "https://www.seniorsnl.ca/",
        "addr1": "243 Topsail Road, Suite 110",
        "city": "St. John's",
        "postal": "A1E 0G5",
        "lat": 47.5220,
        "lng": -52.7350,
        "founded": 1989,
        "template": "classic",
        "cats": ["non-profit"],
        "meta": {
            "facebook": "https://www.facebook.com/SeniorsNL/",
            "instagram": "https://www.instagram.com/seniorsnl/",
            "linkedin": "https://www.linkedin.com/company/106485113",
            "youtube": "https://www.youtube.com/@seniorsnl6047",
            "phone_secondary": "709-737-2333",
            "fax": "709-737-3717",
            "tags": ["seniors", "non-profit", "charitable", "information and referral",
                     "peer support", "community outreach", "social prescribing", "50+",
                     "health", "wellness"],
        },
        "hours": weekdays("08:30", "16:30"),
        "services": [
            svc("Information & Referral",
                "Trusted information and referral to programs, supports, and services for seniors "
                "aged 50+. Call 1-800-563-5599.",
                "fixed", 0, None, {"phone": "1-800-563-5599"}),
            svc("Peer Support",
                "Volunteer-led peer support programs for seniors across the province.",
                "fixed", 0),
            svc("Community Outreach",
                "Events, workshops, and engagement programs for older adults in communities "
                "across NL.",
                "fixed", 0),
            svc("Social Prescribing",
                "Connecting seniors with community-based activities and supports through "
                "healthcare pathways.",
                "fixed", 0),
            svc("NL 50+ Federation Programs",
                "Provincial federation programming and a network of 50+ clubs across Newfoundland "
                "and Labrador.",
                "fixed", 0),
            svc("Brochures & Documents",
                "Downloadable brochures and documents on topics that matter to seniors.",
                "fixed", 0, None, {"url": "https://www.seniorsnl.ca/brochures"}),
        ],
        "photos": [
            ("https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&h=600&fit=crop",
             "Community support gathering"),
            ("https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=600&fit=crop",
             "Senior wellness program"),
            ("https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=800&h=600&fit=crop",
             "Older adults enjoying a group activity"),
        ],
        "ai_greeting": ("Welcome to SeniorsNL! We support people aged 50 and older across "
                        "Newfoundland and Labrador. How can I help you today?"),
        "ai_personality": "Warm, patient, and caring assistant experienced with seniors' needs.",
        "ai_prompt": ("You are a helpful assistant for SeniorsNL, a non-profit charitable "
                      "organization supporting people aged 50+ in Newfoundland and Labrador. You "
                      "help with information about information and referral services, peer "
                      "support, community outreach, social prescribing, the NL 50+ Federation, "
                      "and volunteering. You are warm, patient, and caring."),
        "knowledge": [
            know("Services",
                 "SeniorsNL offers Information & Referral (call 1-800-563-5599 or 709-737-2333), "
                 "Peer Support Programs, Community Outreach & Engagement, Social Prescribing, "
                 "NL 50+ Federation Programs, and free downloadable brochures. All services are "
                 "free.",
                 "services"),
            know("History & Location",
                 "Founded in 1989, SeniorsNL is located at 243 Topsail Road, Suite 110, "
                 "St. John's, NL A1E 0G5. Open Monday to Friday, 8:30 AM to 4:30 PM. It is the "
                 "only information and referral service in NL dedicated specifically to older "
                 "adults.",
                 "about"),
            know("Leadership & People",
                 "SeniorsNL is governed by a volunteer Board of Directors and staffed by "
                 "information specialists, peer support volunteers, social prescribing link "
                 "workers, and community outreach coordinators.",
                 "about"),
        ],
    },
    # -------------------------------------------------------------- 8
    {
        "name": "techNL",
        "slug": "technl",
        "desc": (
            "techNL is a not-for-profit membership association accelerating the growth of the "
            "technology sector in Newfoundland and Labrador. It provides member companies with "
            "business growth services, visibility, a collective voice, and community, and "
            "delivers workforce programs including the AI Skills Launchpad, Mentorship Program, "
            "Graduate Transition Initiative, High School Tech Immersion, and Innovation Week."
        ),
        "phone": "709-772-8324",
        "email": "info@technl.ca",
        "site": "https://technl.ca/",
        "addr1": "710 Torbay Road, Co. Innovation Centre",
        "city": "St. John's",
        "postal": "A1A 5G9",
        "lat": 47.5950,
        "lng": -52.7130,
        "founded": None,
        "template": "modern",
        "cats": ["non-profit", "technology"],
        "meta": {
            "facebook": "https://www.facebook.com/NLTechNL",
            "youtube": "https://www.youtube.com/@technl1433",
            "linkedin": "https://www.linkedin.com/company/nltechnl/",
            "instagram": "https://www.instagram.com/_technl/",
            "fax": "709-757-6284",
            "tags": ["technology", "non-profit", "membership", "association", "AI", "mentorship",
                     "talent", "startups", "innovation", "health plan", "graduates", "jobs"],
        },
        "hours": weekdays(),
        "services": [
            svc("Tech Company Membership",
                "Full membership for NL tech companies: growth services, visibility, advocacy, "
                "and community.",
                "quote_required"),
            svc("AI Skills Launchpad",
                "Program building applied AI skills across the NL workforce.",
                "quote_required"),
            svc("Mentorship Program",
                "Connects mentees with experienced tech professionals for career guidance.",
                "quote_required"),
            svc("Graduate Transition Initiative",
                "Helps recent graduates transition into tech careers in NL.",
                "quote_required"),
            svc("High School Tech Immersion",
                "Introduces high school students to technology careers through hands-on "
                "experiences.",
                "quote_required"),
            svc("Innovation Week",
                "Annual celebration of innovation and technology in Newfoundland and Labrador.",
                "quote_required", None, None, {"frequency": "annual"}),
            svc("Job Listings Board",
                "Free job board for tech positions in NL; employers can post openings.",
                "fixed", 0, None, {"url": "https://technl.ca/job-seekers/"}),
            svc("Tech Sector Group Health Plan",
                "Group health and dental insurance plan designed for tech sector employees.",
                "quote_required"),
        ],
        "photos": [
            ("https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop",
             "Modern tech office"),
            ("https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop",
             "Tech conference audience"),
            ("https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&h=600&fit=crop",
             "Tech mentorship conversation"),
        ],
        "ai_greeting": ("Welcome to techNL! We accelerate the growth of Newfoundland and "
                        "Labrador's tech sector through membership, programs, and community. "
                        "How can I help you today?"),
        "ai_personality": "Knowledgeable, professional ecosystem connector with a community focus.",
        "ai_prompt": ("You are a helpful assistant for techNL, a not-for-profit membership "
                      "association for the technology sector in Newfoundland and Labrador. You "
                      "help with information about membership options, workforce programs (AI "
                      "Skills Launchpad, Mentorship Program, Graduate Transition Initiative, High "
                      "School Tech Immersion), Innovation Week, the job board, and the group "
                      "health plan. You are knowledgeable, professional, and community-focused."),
        "knowledge": [
            know("Programs",
                 "techNL delivers the AI Skills Launchpad, Mentorship Program, Graduate Transition "
                 "Initiative, High School Tech Immersion Program, Innovation Week, and the Tech "
                 "Sector Group Health Plan.",
                 "services"),
            know("Membership & Contact",
                 "Membership types include Tech Company, Sponsored Startup, Service Provider, and "
                 "Alliance Partner, plus a free Student Network. Located at 710 Torbay Road, "
                 "Co. Innovation Centre, St. John's, NL A1A 5G9. Phone 709-772-8324, email "
                 "info@technl.ca.",
                 "about"),
            know("Sector Impact",
                 "techNL has driven NL tech sector growth for 30+ years. NL has attracted $780M+ "
                 "in tech investment over the past decade and is home to Canada's first AI "
                 "unicorn.",
                 "about"),
            know("Events & Resources",
                 "techNL hosts Innovation Week and the annual Industry Awards, publishes The "
                 "State of Tech Report, and maintains a free job board at technl.ca/job-seekers.",
                 "faq"),
        ],
    },
]


# ---------------------------------------------------------------------------
# SQL generation
# ---------------------------------------------------------------------------

HOURS_COLS = "(id, business_id, day_of_week, opens_at, closes_at, is_closed, created_at)"
SERVICES_COLS = ("(id, business_id, service_id, name, description, price, currency, price_type, "
                 "duration_minutes, booking_required, is_active, metadata, created_at, updated_at)")
PHOTOS_COLS = "(id, business_id, url, alt_text, is_cover, sort_order, created_at)"
AI_COLS = ("(id, business_id, enabled, greeting, personality, escalation_enabled, handoff_enabled, "
           "language, model_provider, model_name, configuration, voice_enabled, preferred_language, "
           "created_at, updated_at)")
KNOWLEDGE_COLS = "(id, business_id, title, content, category, is_active, metadata, created_at)"


def business_insert_sql(b: dict) -> str:
    cols = ("(id, name, slug, description, phone, email, website_url, address_line_1, "
            "city, province, postal_code, country, latitude, longitude, timezone, status, "
            "founded_year, website_template, metadata, created_at, updated_at)")
    meta = dict(b["meta"])
    values = [
        "gen_random_uuid()",
        q(b["name"]),
        q(b["slug"]),
        q(b["desc"]),
        lit(b["phone"]),
        lit(b["email"]),
        q(b["site"]),
        lit(b["addr1"]),
        q(b["city"]),
        "'NL'",
        lit(b["postal"]),
        "'Canada'",
        str(b["lat"]),
        str(b["lng"]),
        "'America/St_Johns'",
        "'active'",
        lit(b["founded"]),
        q(b["template"]),
        j(meta),
        "now(), now()",
    ]
    body = ",\n    ".join(values)
    return (
        "  INSERT INTO businesses " + cols + "\n"
        "  VALUES (\n"
        "    " + body + "\n"
        "  ) RETURNING id INTO b_id;"
    )


def hours_sql(hours) -> str:
    rows = []
    for day, opens, closes, closed in hours:
        rows.append(
            f"    (gen_random_uuid(), b_id, {day}, {q(opens)}::time, {q(closes)}::time, "
            f"{'true' if closed else 'false'}, now())"
        )
    return ("  INSERT INTO business_hours " + HOURS_COLS + "\n"
            "  VALUES\n" + ",\n".join(rows) + ";")


def services_sql(services) -> str:
    rows = []
    for s in services:
        price = "NULL" if s["price"] is None else f"{float(s['price']):.2f}"
        mins = "NULL" if s["mins"] is None else str(s["mins"])
        rows.append(
            f"    (gen_random_uuid(), b_id, NULL, {q(s['name'])}, {q(s['desc'])}, "
            f"{price}, 'CAD', {q(s['ptype'])}, {mins}, true, true, {j(s['meta'])}, now(), now())"
        )
    return ("  INSERT INTO business_services " + SERVICES_COLS + "\n"
            "  VALUES\n" + ",\n".join(rows) + ";")


def categories_link_sql(slugs) -> str:
    slug_list = ", ".join(q(s) for s in slugs)
    return ("  INSERT INTO business_categories (business_id, category_id, created_at)\n"
            f"  SELECT b_id, c.id, now() FROM categories c WHERE c.slug IN ({slug_list});")


def photos_sql(photos) -> str:
    rows = []
    for idx, (url, alt) in enumerate(photos):
        rows.append(
            f"    (gen_random_uuid(), b_id, {q(url)}, {q(alt)}, "
            f"{'true' if idx == 0 else 'false'}, {idx}, now())"
        )
    return ("  INSERT INTO business_photos " + PHOTOS_COLS + "\n"
            "  VALUES\n" + ",\n".join(rows) + ";")


def ai_config_sql(b: dict) -> str:
    config = {"system_prompt": b["ai_prompt"], "greeting": b["ai_greeting"]}
    return (
        "  INSERT INTO ai_configurations " + AI_COLS + "\n"
        "  VALUES (\n"
        "    gen_random_uuid(), b_id, true,\n"
        f"    {q(b['ai_greeting'])},\n"
        f"    {q(b['ai_personality'])},\n"
        "    true, false,\n"
        "    'en', 'openai', 'gpt-4o-mini',\n"
        f"    {j(config)},\n"
        "    false, 'en', now(), now()\n"
        "  );"
    )


def knowledge_sql(items) -> str:
    rows = []
    for k in items:
        rows.append(
            f"    (gen_random_uuid(), b_id, {q(k['title'])}, {q(k['content'])}, "
            f"{q(k['cat'])}, true, '{{}}'::jsonb, now())"
        )
    return ("  INSERT INTO ai_knowledge_items " + KNOWLEDGE_COLS + "\n"
            "  VALUES\n" + ",\n".join(rows) + ";")


def business_block_sql(num: int, b: dict) -> str:
    parts = [
        "",
        "-- ============================================================",
        f"-- {num}. {b['name'].upper()}",
        "-- ============================================================",
        "DO $$ DECLARE b_id uuid; BEGIN",
        business_insert_sql(b),
        "",
        hours_sql(b["hours"]),
        "",
        services_sql(b["services"]),
        "",
        categories_link_sql(b["cats"]),
        "",
        photos_sql(b["photos"]),
        "",
        ai_config_sql(b),
        "",
        knowledge_sql(b["knowledge"]),
        "",
        "END $$;",
    ]
    return "\n".join(parts)


# ---------------------------------------------------------------------------
# Validation (catches unterminated literals / broken $$ blocks)
# ---------------------------------------------------------------------------

def validate_literal_integrity(sql: str) -> None:
    i, n = 0, len(sql)
    state = "normal"  # normal | dollar | sq-normal | sq-dollar
    line = 1
    while i < n:
        ch = sql[i]
        if ch == "\n":
            line += 1
            i += 1
            continue
        if state.startswith("sq-"):
            if ch == "'":
                if i + 1 < n and sql[i + 1] == "'":
                    i += 2
                    continue
                state = "dollar" if state == "sq-dollar" else "normal"
            i += 1
            continue
        # code context (normal or dollar)
        if ch == "-" and i + 1 < n and sql[i + 1] == "-":  # line comment
            while i < n and sql[i] != "\n":
                i += 1
            continue
        if ch == "'":
            state = "sq-dollar" if state == "dollar" else "sq-normal"
            i += 1
            continue
        if ch == "$" and i + 1 < n and sql[i + 1] == "$":
            state = "dollar" if state == "normal" else "normal"
            i += 2
            continue
        i += 1
    if state != "normal":
        raise ValueError(
            f"Invalid SQL near line {line}: unterminated string or $$ block (state={state})")


def validate_structure(sql: str) -> None:
    assert sql.count("DO $$ DECLARE b_id uuid; BEGIN") == len(BUSINESSES), "wrong DO block count"
    assert sql.count("END $$;") == len(BUSINESSES), "wrong END $$ count"
    assert sql.count("RETURNING id INTO b_id") == len(BUSINESSES), "missing RETURNING INTO"
    assert sql.count(HOURS_COLS) == len(BUSINESSES), "business_hours column list mismatch"
    assert sql.count(SERVICES_COLS) == len(BUSINESSES), "business_services column list mismatch"
    assert sql.count(PHOTOS_COLS) == len(BUSINESSES), "business_photos column list mismatch"
    assert sql.count(AI_COLS) == len(BUSINESSES), "ai_configurations column list mismatch"
    assert sql.count(KNOWLEDGE_COLS) == len(BUSINESSES), "ai_knowledge_items column list mismatch"
    for slug in (b["slug"] for b in BUSINESSES):
        assert q(slug) in sql, f"missing business slug {slug}"
    for _, slug, _, _ in NEW_CATEGORIES:
        assert f"WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = {q(slug)});" in sql
    assert "updated_at)" not in HOURS_COLS and "updated_at)" not in PHOTOS_COLS
    assert "is_active" not in AI_COLS and "enabled" in AI_COLS
    assert "service_id" in SERVICES_COLS and "currency" in SERVICES_COLS
    assert "title" in KNOWLEDGE_COLS
    assert "caption" not in sql, "caption column must not be used"
    assert "'St. John''s'" in sql, "apostrophes must be doubled inside DO blocks"


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    header = (
        "-- OnePlace seed data: 8 St. John's organizations (researched from web)\n"
        "-- Separate from the 28 NL businesses.\n"
    )
    sections = [header, categories_sql()]
    for num, biz in enumerate(BUSINESSES, start=1):
        sections.append(business_block_sql(num, biz))
    sql = "\n".join(sections)

    validate_literal_integrity(sql)
    validate_structure(sql)

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(sql, encoding="utf-8", newline="\n")

    size = OUT_PATH.stat().st_size
    print("Migration SQL generated successfully!")
    print(f"File: {OUT_PATH}")
    print(f"Size: {size:,} bytes ({size / 1024:.1f} KB)")


if __name__ == "__main__":
    main()
