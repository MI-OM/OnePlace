-- L2: Audit logging — generic trigger that captures key mutations.

create or replace function public.audit_log_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_action text;
    v_entity_type text;
    v_entity_id uuid;
    v_business_id uuid;
    v_old jsonb;
    v_new jsonb;
begin
    if TG_OP = 'INSERT' then
        v_action := 'inserted';
        v_entity_type := TG_TABLE_NAME;
        v_entity_id := (NEW).id;
        v_new := to_jsonb(NEW);
    elsif TG_OP = 'UPDATE' then
        v_action := 'updated';
        v_entity_type := TG_TABLE_NAME;
        v_entity_id := (NEW).id;
        v_old := to_jsonb(OLD);
        v_new := to_jsonb(NEW);
    elsif TG_OP = 'DELETE' then
        v_action := 'deleted';
        v_entity_type := TG_TABLE_NAME;
        v_entity_id := (OLD).id;
        v_old := to_jsonb(OLD);
    end if;

    -- Resolve business_id from the row if the column exists.
    begin
        if TG_OP = 'DELETE' then
            v_business_id := (OLD).business_id;
        else
            v_business_id := (NEW).business_id;
        end if;
    exception when undefined_column then
        v_business_id := null;
    end;

    insert into public.audit_logs (
        actor_user_id,
        business_id,
        action,
        entity_type,
        entity_id,
        old_values,
        new_values
    ) values (
        auth.uid(),
        v_business_id,
        v_action || ' ' || TG_OP,
        v_entity_type,
        v_entity_id,
        v_old,
        v_new
    );

    return coalesce(NEW, OLD);
end;
$$;

-- Apply to business-critical tables.
create trigger audit_businesses
after insert or update or delete on public.businesses
for each row execute function public.audit_log_changes();

create trigger audit_business_members
after insert or update or delete on public.business_members
for each row execute function public.audit_log_changes();

create trigger audit_reviews
after insert or update or delete on public.reviews
for each row execute function public.audit_log_changes();

create trigger audit_conversations
after insert or update on public.conversations
for each row execute function public.audit_log_changes();

create trigger audit_user_roles
after insert or update or delete on public.user_roles
for each row execute function public.audit_log_changes();

create trigger audit_service_requests
after insert or update on public.service_requests
for each row execute function public.audit_log_changes();
