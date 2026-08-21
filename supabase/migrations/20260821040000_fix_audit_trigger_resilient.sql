-- Fix: make audit_log_changes() resilient to FK violations during bulk seeds.
-- Audit logging should never break the actual operation.

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

    begin
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
    exception when foreign_key_violation or unique_violation then
        -- Skip audit entry if FK targets don't exist yet (e.g. during bulk seeds)
        null;
    end;

    return coalesce(NEW, OLD);
end;
$$;
