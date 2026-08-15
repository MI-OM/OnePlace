-- One Place: indexes for common query patterns.

create index idx_businesses_status on businesses(status);
create index idx_businesses_city on businesses(city);
create index idx_businesses_location on businesses(latitude, longitude);
create index idx_businesses_slug on businesses(slug);

create index idx_business_members_user on business_members(user_id);
create index idx_business_members_business on business_members(business_id);

create index idx_business_categories_category on business_categories(category_id);
create index idx_business_categories_business on business_categories(business_id);

create index idx_business_services_business on business_services(business_id);
create index idx_business_services_active on business_services(business_id, is_active);

create index idx_business_hours_business on business_hours(business_id);

create index idx_conversations_customer on conversations(customer_id);
create index idx_conversations_business on conversations(business_id);
create index idx_conversations_status on conversations(status);

create index idx_conversation_participants_conversation
on conversation_participants(conversation_id);
create index idx_conversation_participants_user
on conversation_participants(user_id);

create index idx_messages_conversation_created
on messages(conversation_id, created_at);

create index idx_voice_sessions_conversation on voice_sessions(conversation_id);

create index idx_requests_customer on service_requests(customer_id);
create index idx_requests_business on service_requests(business_id);
create index idx_requests_status on service_requests(status);

create index idx_reviews_business on reviews(business_id);
create index idx_reviews_reviewer on reviews(reviewer_id);

create index idx_notifications_user on notifications(user_id, read_at);

create index idx_analytics_events_created on analytics_events(created_at);
create index idx_analytics_events_business on analytics_events(business_id);
create index idx_analytics_events_event on analytics_events(event_name);

create index idx_audit_logs_business on audit_logs(business_id);
create index idx_audit_logs_created on audit_logs(created_at);

-- Search support (PostgreSQL FTS + trigram). ILIKE and %word% both benefit.
create index idx_businesses_name_trgm on businesses using gin (name gin_trgm_ops);
create index idx_businesses_description_trgm on businesses using gin (coalesce(description, '') gin_trgm_ops);
create index idx_business_services_name_trgm on business_services using gin (name gin_trgm_ops);
