


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."app_role" AS ENUM (
    'startup_member',
    'lvnc_admin',
    'partner_observer'
);


ALTER TYPE "public"."app_role" OWNER TO "postgres";


CREATE TYPE "public"."attendance_rule" AS ENUM (
    'compulsory',
    'recommended',
    'optional'
);


ALTER TYPE "public"."attendance_rule" OWNER TO "postgres";


CREATE TYPE "public"."booking_status" AS ENUM (
    'not_required',
    'to_register',
    'register_interest',
    'approval_required',
    'invite_required',
    'to_arrange',
    'verified',
    'details_to_verify'
);


ALTER TYPE "public"."booking_status" OWNER TO "postgres";


CREATE TYPE "public"."cost_type" AS ENUM (
    'free',
    'paid',
    'not_applicable',
    'unknown'
);


ALTER TYPE "public"."cost_type" OWNER TO "postgres";


CREATE TYPE "public"."event_decision" AS ENUM (
    'going',
    'interested',
    'pass',
    'acknowledged',
    'undecided'
);


ALTER TYPE "public"."event_decision" OWNER TO "postgres";


CREATE TYPE "public"."item_priority" AS ENUM (
    'must_pursue',
    'strong_option',
    'conditional',
    'low_priority',
    'not_rated'
);


ALTER TYPE "public"."item_priority" OWNER TO "postgres";


CREATE TYPE "public"."item_status" AS ENUM (
    'draft',
    'proposed',
    'confirmed',
    'cancelled'
);


ALTER TYPE "public"."item_status" OWNER TO "postgres";


CREATE TYPE "public"."item_type" AS ENUM (
    'lvnc_core',
    'third_party',
    'business_meeting',
    'company_work'
);


ALTER TYPE "public"."item_type" OWNER TO "postgres";


CREATE TYPE "public"."potential_meeting_status" AS ENUM (
    'draft',
    'contacted',
    'agreed',
    'rejected',
    'paused'
);


ALTER TYPE "public"."potential_meeting_status" OWNER TO "postgres";


CREATE TYPE "public"."time_precision" AS ENUM (
    'exact',
    'morning',
    'afternoon',
    'evening',
    'all_day',
    'unknown'
);


ALTER TYPE "public"."time_precision" OWNER TO "postgres";


CREATE TYPE "public"."visibility_scope" AS ENUM (
    'cohort',
    'selected_organisations'
);


ALTER TYPE "public"."visibility_scope" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cap_startup_update_inbox"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  update public.startup_updates update_row
  set read_at = now()
  where update_row.id in (
    select id
    from public.startup_updates
    where organisation_id = new.organisation_id
      and read_at is null
    order by created_at desc, id desc
    offset 30
  );
  return new;
end;
$$;


ALTER FUNCTION "public"."cap_startup_update_inbox"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."claim_quick_access"("access_email" "text") RETURNS TABLE("id" "uuid", "email" "text", "full_name" "text", "role" "public"."app_role", "organisation_id" "uuid")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  invite public.allowed_invites%rowtype;
begin
  if auth.uid() is null then
    raise exception 'An anonymous session is required before claiming access';
  end if;

  select * into invite
  from public.allowed_invites ai
  where ai.email = lower(trim(access_email));

  if not found then
    raise exception 'This email is not on the LVCN allow-list';
  end if;

  insert into public.profiles (id, email, full_name, role, organisation_id)
  values (auth.uid(), invite.email, invite.full_name, invite.role, invite.organisation_id)
  on conflict on constraint profiles_pkey do update set
    email = excluded.email,
    full_name = excluded.full_name,
    role = excluded.role,
    organisation_id = excluded.organisation_id;

  return query
  select p.id, p.email, p.full_name, p.role, p.organisation_id
  from public.profiles p
  where p.id = auth.uid();
end;
$$;


ALTER FUNCTION "public"."claim_quick_access"("access_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_lvnc_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'lvnc_admin');
$$;


ALTER FUNCTION "public"."is_lvnc_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_partner_observer"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'partner_observer');
$$;


ALTER FUNCTION "public"."is_partner_observer"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_programme_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  record jsonb := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  kind text := case tg_table_name when 'schedule_items' then 'schedule_item' when 'event_responses' then 'event_response' else 'availability_block' end;
  affected_organisation uuid := null;
begin
  if tg_table_name in ('event_responses', 'availability_blocks') then
    affected_organisation := (record ->> 'organisation_id')::uuid;
  end if;

  insert into public.change_log (entity_type, action, record_id, organisation_id, actor_id, details)
  values (kind, case tg_op when 'INSERT' then 'created' when 'UPDATE' then 'updated' else 'deleted' end, (record ->> 'id')::uuid, affected_organisation, auth.uid(), record);
  return coalesce(new, old);
end;
$$;


ALTER FUNCTION "public"."log_programme_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."my_organisation_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select organisation_id from public.profiles where id = auth.uid();
$$;


ALTER FUNCTION "public"."my_organisation_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."normalise_schedule_item_time_range"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  if new.starts_at is not null
     and (new.ends_at is null or new.ends_at <= new.starts_at) then
    new.ends_at := new.starts_at + interval '1 hour';
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."normalise_schedule_item_time_range"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_potential_meeting_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare heading text; detail text;
begin
  if tg_op = 'UPDATE' and new.institution_name is not distinct from old.institution_name
    and new.status is not distinct from old.status and new.proposed_starts_at is not distinct from old.proposed_starts_at
    and new.proposed_ends_at is not distinct from old.proposed_ends_at and new.location is not distinct from old.location
    and new.startup_visible_note is not distinct from old.startup_visible_note and new.next_action is not distinct from old.next_action then
    return new;
  end if;
  heading := case when tg_op = 'INSERT' then 'New Potential Biz Meet: ' || new.institution_name
    when new.status = 'rejected' then 'Potential Biz Meet closed: ' || new.institution_name
    when new.proposed_starts_at is distinct from old.proposed_starts_at or new.proposed_ends_at is distinct from old.proposed_ends_at then 'Potential Biz Meet time changed: ' || new.institution_name
    else 'Potential Biz Meet updated: ' || new.institution_name end;
  detail := coalesce(new.startup_visible_note, new.next_action, 'Open Potential Biz Meets to review the latest details.');
  perform public.publish_startup_update(new.organisation_id, 'potential_biz_meet', heading, detail, null, new.id);
  return new;
end;
$$;


ALTER FUNCTION "public"."notify_potential_meeting_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_schedule_item_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare target record; heading text; detail text;
begin
  if tg_op = 'UPDATE' and new.title is not distinct from old.title and new.starts_at is not distinct from old.starts_at
    and new.ends_at is not distinct from old.ends_at and new.location is not distinct from old.location
    and new.status is not distinct from old.status and new.description is not distinct from old.description then
    return new;
  end if;
  heading := case when tg_op = 'INSERT' then 'New schedule item: ' || new.title
    when new.status = 'cancelled' then 'Cancelled: ' || new.title
    when new.starts_at is distinct from old.starts_at or new.ends_at is distinct from old.ends_at then 'Schedule time changed: ' || new.title
    else 'Schedule updated: ' || new.title end;
  detail := coalesce(new.description, case when new.status = 'cancelled' then 'This item has been removed from your live schedule.' else 'Open your schedule to review the latest details.' end);
  for target in
    select distinct organisation_id from public.schedule_item_organisations where schedule_item_id = new.id
    union
    select distinct p.organisation_id from public.profiles p where new.visibility_scope = 'cohort' and p.role = 'startup_member' and p.organisation_id is not null
  loop
    perform public.publish_startup_update(target.organisation_id, 'schedule', heading, detail, new.id, null);
  end loop;
  return new;
end;
$$;


ALTER FUNCTION "public"."notify_schedule_item_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_schedule_target_added"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare item record;
begin
  select * into item from public.schedule_items where id = new.schedule_item_id;
  if found then
    perform public.publish_startup_update(new.organisation_id, 'schedule', 'New schedule item: ' || item.title, coalesce(item.description, 'Open your schedule to review the details.'), item.id, null);
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."notify_schedule_target_added"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."provision_allowed_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare invite public.allowed_invites%rowtype;
begin
  select * into invite from public.allowed_invites where email = lower(new.email);
  if not found then return new; end if;
  insert into public.profiles (id, email, full_name, role, organisation_id)
  values (new.id, lower(new.email), invite.full_name, invite.role, invite.organisation_id)
  on conflict (id) do nothing;
  return new;
end;
$$;


ALTER FUNCTION "public"."provision_allowed_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."publish_startup_update"("target_organisation" "uuid", "update_kind" "text", "update_title" "text", "update_body" "text", "item_id" "uuid" DEFAULT NULL::"uuid", "meeting_id" "uuid" DEFAULT NULL::"uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  insert into public.startup_updates (organisation_id, kind, title, body, schedule_item_id, potential_meeting_id, created_by)
  values (target_organisation, update_kind, update_title, nullif(update_body, ''), item_id, meeting_id, auth.uid());
end;
$$;


ALTER FUNCTION "public"."publish_startup_update"("target_organisation" "uuid", "update_kind" "text", "update_title" "text", "update_body" "text", "item_id" "uuid", "meeting_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."queue_change_digest"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  insert into public.notification_digest_queue (recipient_email, change_log_id, deliver_after)
  select r.email, new.id, now() + interval '5 minutes'
  from public.notification_recipients r
  where r.receives_digest
    and (
      r.is_lvnc_admin
      or (
        new.entity_type in ('event_response', 'availability_block')
        and r.organisation_id = new.organisation_id
      )
      or (
        new.entity_type = 'schedule_item'
        and (
          new.details ->> 'visibility_scope' = 'cohort'
          or exists (
            select 1
            from public.schedule_item_organisations sio
            where sio.schedule_item_id = new.record_id
              and sio.organisation_id = r.organisation_id
          )
        )
      )
    )
  on conflict (recipient_email, change_log_id) do nothing;
  return new;
end;
$$;


ALTER FUNCTION "public"."queue_change_digest"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reopen_schedule_conversation_for_startup"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if new.author_role = 'startup_member' then
    update public.event_responses
      set conversation_status = 'awaiting_admin',
          admin_reviewed_at = null,
          admin_reviewed_by = null
    where id = new.event_response_id;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."reopen_schedule_conversation_for_startup"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin new.updated_at = now(); return new; end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."allowed_invites" (
    "email" "text" NOT NULL,
    "full_name" "text",
    "role" "public"."app_role" NOT NULL,
    "organisation_id" "uuid",
    "invited_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "allowed_invites_email_check" CHECK (("email" = "lower"("email"))),
    CONSTRAINT "startup_invite_has_org" CHECK ((("role" = 'lvnc_admin'::"public"."app_role") OR ("organisation_id" IS NOT NULL)))
);


ALTER TABLE "public"."allowed_invites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_activity_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "actor_id" "uuid" NOT NULL,
    "organisation_id" "uuid",
    "event_type" "text" NOT NULL,
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "app_activity_events_event_type_check" CHECK (("event_type" = 'session_started'::"text"))
);


ALTER TABLE "public"."app_activity_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_section_visibility" (
    "section_id" "text" NOT NULL,
    "visible_to_startups" boolean DEFAULT true NOT NULL,
    "updated_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "app_section_visibility_section_id_check" CHECK (("section_id" = ANY (ARRAY['calendar'::"text", 'business-meetings'::"text", 'decisions'::"text", 'location'::"text", 'hotel-recs'::"text", 'toilets'::"text", 'external-events'::"text"])))
);


ALTER TABLE "public"."app_section_visibility" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."availability_blocks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organisation_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "note" "text",
    "starts_at" timestamp with time zone NOT NULL,
    "ends_at" timestamp with time zone NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "admin_reviewed_at" timestamp with time zone,
    "admin_reviewed_by" "uuid",
    CONSTRAINT "availability_blocks_check" CHECK (("ends_at" > "starts_at")),
    CONSTRAINT "availability_blocks_title_check" CHECK ((("char_length"("title") >= 1) AND ("char_length"("title") <= 180)))
);


ALTER TABLE "public"."availability_blocks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."business_meeting_column_visibility" (
    "column_id" "text" NOT NULL,
    "visible_to_startups" boolean DEFAULT true NOT NULL,
    "updated_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."business_meeting_column_visibility" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."change_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "entity_type" "text" NOT NULL,
    "action" "text" NOT NULL,
    "record_id" "uuid" NOT NULL,
    "organisation_id" "uuid",
    "actor_id" "uuid",
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "details" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    CONSTRAINT "change_log_action_check" CHECK (("action" = ANY (ARRAY['created'::"text", 'updated'::"text", 'deleted'::"text"]))),
    CONSTRAINT "change_log_entity_type_check" CHECK (("entity_type" = ANY (ARRAY['schedule_item'::"text", 'event_response'::"text", 'availability_block'::"text"])))
);


ALTER TABLE "public"."change_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conflict_groups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "date" "date",
    "description" "text",
    "max_selections" integer DEFAULT 1 NOT NULL,
    CONSTRAINT "conflict_groups_max_selections_check" CHECK (("max_selections" > 0))
);


ALTER TABLE "public"."conflict_groups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_response_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_response_id" "uuid" NOT NULL,
    "body" "text" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "author_role" "public"."app_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "event_response_messages_body_check" CHECK ((("char_length"(TRIM(BOTH FROM "body")) >= 1) AND ("char_length"(TRIM(BOTH FROM "body")) <= 3000)))
);


ALTER TABLE "public"."event_response_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_responses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "schedule_item_id" "uuid" NOT NULL,
    "organisation_id" "uuid" NOT NULL,
    "decision" "public"."event_decision" DEFAULT 'undecided'::"public"."event_decision" NOT NULL,
    "note" "text",
    "updated_by" "uuid" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "admin_reviewed_at" timestamp with time zone,
    "admin_reviewed_by" "uuid",
    "attendance_plan" "text" DEFAULT 'not_set'::"text" NOT NULL,
    "attendance_starts_at" timestamp with time zone,
    "attendance_ends_at" timestamp with time zone,
    "conversation_status" "text" DEFAULT 'none'::"text" NOT NULL,
    "admin_response_status" "text",
    "admin_replied_at" timestamp with time zone,
    "admin_replied_by" "uuid",
    CONSTRAINT "event_responses_admin_response_status_check" CHECK ((("admin_response_status" IS NULL) OR ("admin_response_status" = ANY (ARRAY['approved'::"text", 'needs_details'::"text", 'not_possible'::"text", 'information'::"text"])))),
    CONSTRAINT "event_responses_attendance_plan_check" CHECK (("attendance_plan" = ANY (ARRAY['not_set'::"text", 'full_event'::"text", 'morning'::"text", 'afternoon'::"text", 'evening'::"text", 'custom_time'::"text"]))),
    CONSTRAINT "event_responses_attendance_range_check" CHECK ((("attendance_ends_at" IS NULL) OR ("attendance_starts_at" IS NULL) OR ("attendance_ends_at" > "attendance_starts_at"))),
    CONSTRAINT "event_responses_conversation_status_check" CHECK (("conversation_status" = ANY (ARRAY['none'::"text", 'awaiting_admin'::"text", 'awaiting_startup'::"text", 'resolved'::"text"])))
);


ALTER TABLE "public"."event_responses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."meeting_category_visibility" (
    "category" "text" NOT NULL,
    "visible_to_startups" boolean DEFAULT true NOT NULL,
    "updated_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "meeting_category_visibility_category_check" CHECK ((("char_length"(TRIM(BOTH FROM "category")) >= 1) AND ("char_length"(TRIM(BOTH FROM "category")) <= 120)))
);


ALTER TABLE "public"."meeting_category_visibility" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_digest_queue" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "recipient_email" "text" NOT NULL,
    "change_log_id" "uuid" NOT NULL,
    "deliver_after" timestamp with time zone DEFAULT ("now"() + '00:05:00'::interval) NOT NULL,
    "delivered_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notification_digest_queue" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_recipients" (
    "email" "text" NOT NULL,
    "organisation_id" "uuid",
    "full_name" "text",
    "is_lvnc_admin" boolean DEFAULT false NOT NULL,
    "is_schedule_poc" boolean DEFAULT false NOT NULL,
    "receives_digest" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notification_recipients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organisations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "organisations_slug_check" CHECK (("slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'::"text"))
);


ALTER TABLE "public"."organisations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."potential_meeting_admin_details" (
    "potential_meeting_id" "uuid" NOT NULL,
    "contact_name" "text",
    "contact_email" "text",
    "internal_note" "text",
    "updated_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."potential_meeting_admin_details" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."potential_meeting_decisions" (
    "potential_meeting_id" "uuid" NOT NULL,
    "decision" "public"."event_decision" DEFAULT 'undecided'::"public"."event_decision" NOT NULL,
    "note" "text",
    "updated_by" "uuid" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "admin_reviewed_at" timestamp with time zone,
    "admin_reviewed_by" "uuid",
    "priority_rating" smallint,
    CONSTRAINT "potential_meeting_decisions_priority_rating_check" CHECK ((("priority_rating" >= 1) AND ("priority_rating" <= 3)))
);


ALTER TABLE "public"."potential_meeting_decisions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."potential_meetings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organisation_id" "uuid" NOT NULL,
    "institution_name" "text" NOT NULL,
    "category" "text" DEFAULT 'Other'::"text" NOT NULL,
    "status" "public"."potential_meeting_status" DEFAULT 'draft'::"public"."potential_meeting_status" NOT NULL,
    "proposed_starts_at" timestamp with time zone,
    "proposed_ends_at" timestamp with time zone,
    "location" "text",
    "external_url" "text",
    "startup_visible_note" "text",
    "next_action" "text",
    "owner_profile_id" "uuid",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "legacy_schedule_item_id" "uuid",
    CONSTRAINT "potential_meetings_check" CHECK ((("proposed_ends_at" IS NULL) OR ("proposed_starts_at" IS NULL) OR ("proposed_ends_at" > "proposed_starts_at"))),
    CONSTRAINT "potential_meetings_institution_name_check" CHECK ((("char_length"(TRIM(BOTH FROM "institution_name")) >= 1) AND ("char_length"(TRIM(BOTH FROM "institution_name")) <= 180)))
);


ALTER TABLE "public"."potential_meetings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text",
    "role" "public"."app_role" NOT NULL,
    "organisation_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "startup_profile_has_org" CHECK ((("role" = 'lvnc_admin'::"public"."app_role") OR ("organisation_id" IS NOT NULL)))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."schedule_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "item_type" "public"."item_type" NOT NULL,
    "visibility_scope" "public"."visibility_scope" DEFAULT 'cohort'::"public"."visibility_scope" NOT NULL,
    "attendance_rule" "public"."attendance_rule" DEFAULT 'optional'::"public"."attendance_rule" NOT NULL,
    "starts_at" timestamp with time zone,
    "ends_at" timestamp with time zone,
    "time_precision" "public"."time_precision" DEFAULT 'unknown'::"public"."time_precision" NOT NULL,
    "location" "text",
    "meeting_link" "text",
    "event_url" "text",
    "cost_type" "public"."cost_type" DEFAULT 'unknown'::"public"."cost_type" NOT NULL,
    "cost_note" "text",
    "status" "public"."item_status" DEFAULT 'draft'::"public"."item_status" NOT NULL,
    "booking_status" "public"."booking_status" DEFAULT 'details_to_verify'::"public"."booking_status" NOT NULL,
    "priority" "public"."item_priority" DEFAULT 'not_rated'::"public"."item_priority" NOT NULL,
    "fit" "text",
    "next_action" "text",
    "source_note" "text",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "tags" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "registration_deadline" timestamp with time zone,
    "meeting_category" "text",
    "meeting_status" "text",
    "contact_name" "text",
    "meeting_note" "text",
    "contact_email" "text",
    "review_by" "date",
    "created_organisation_id" "uuid",
    CONSTRAINT "schedule_items_master_template_core_only" CHECK ((("visibility_scope" <> 'cohort'::"public"."visibility_scope") OR ("item_type" = 'lvnc_core'::"public"."item_type"))),
    CONSTRAINT "schedule_items_tags_allowed" CHECK (("tags" <@ ARRAY['Fintech'::"text", 'Medtech'::"text", 'AI'::"text", 'Investor'::"text", 'Enterprise'::"text", 'Workshop'::"text", 'Networking'::"text", 'Site visit'::"text"])),
    CONSTRAINT "schedule_items_title_check" CHECK ((("char_length"("title") >= 1) AND ("char_length"("title") <= 180))),
    CONSTRAINT "unknown_time_consistency" CHECK ((("time_precision" <> 'unknown'::"public"."time_precision") OR ("starts_at" IS NULL))),
    CONSTRAINT "valid_time_range" CHECK ((("ends_at" IS NULL) OR ("starts_at" IS NULL) OR ("ends_at" > "starts_at")))
);


ALTER TABLE "public"."schedule_items" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."schedule_events" WITH ("security_invoker"='true') AS
 SELECT "id",
    "title",
    "description",
    "item_type",
    "visibility_scope",
    "attendance_rule",
    "starts_at",
    "ends_at",
    "time_precision",
    "location",
    "meeting_link",
    "event_url",
    "cost_type",
    "cost_note",
    "status",
    "booking_status",
    "priority",
    "fit",
    "next_action",
    "source_note",
    "created_by",
    "created_at",
    "updated_at",
    "tags",
    "registration_deadline",
    "meeting_category",
    "meeting_status",
    "contact_name",
    "meeting_note",
    "contact_email",
    "review_by",
    "created_organisation_id"
   FROM "public"."schedule_items"
  WHERE (("item_type" <> 'business_meeting'::"public"."item_type") AND ("starts_at" IS NOT NULL) AND ("status" <> 'cancelled'::"public"."item_status"));


ALTER VIEW "public"."schedule_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."schedule_item_conflict_groups" (
    "schedule_item_id" "uuid" NOT NULL,
    "conflict_group_id" "uuid" NOT NULL
);


ALTER TABLE "public"."schedule_item_conflict_groups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."schedule_item_organisations" (
    "schedule_item_id" "uuid" NOT NULL,
    "organisation_id" "uuid" NOT NULL,
    "meeting_outreach_status" "text" DEFAULT 'Contacted'::"text" NOT NULL,
    "availability_note" "text",
    "coordination_note" "text",
    CONSTRAINT "schedule_item_organisations_meeting_outreach_status_check" CHECK (("meeting_outreach_status" = ANY (ARRAY['Contacted'::"text", 'Agreed'::"text", 'Rejected'::"text"])))
);


ALTER TABLE "public"."schedule_item_organisations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."schedule_item_participation" (
    "schedule_item_id" "uuid" NOT NULL,
    "organisation_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'expected'::"text" NOT NULL,
    "updated_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "schedule_item_participation_status_check" CHECK (("status" = ANY (ARRAY['expected'::"text", 'not_attending'::"text"])))
);


ALTER TABLE "public"."schedule_item_participation" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."startup_updates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organisation_id" "uuid" NOT NULL,
    "kind" "text" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text",
    "schedule_item_id" "uuid",
    "potential_meeting_id" "uuid",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "read_at" timestamp with time zone,
    CONSTRAINT "startup_updates_kind_check" CHECK (("kind" = ANY (ARRAY['schedule'::"text", 'potential_biz_meet'::"text", 'admin_message'::"text"]))),
    CONSTRAINT "startup_updates_title_check" CHECK ((("char_length"(TRIM(BOTH FROM "title")) >= 1) AND ("char_length"(TRIM(BOTH FROM "title")) <= 240)))
);


ALTER TABLE "public"."startup_updates" OWNER TO "postgres";


ALTER TABLE ONLY "public"."allowed_invites"
    ADD CONSTRAINT "allowed_invites_pkey" PRIMARY KEY ("email");



ALTER TABLE ONLY "public"."app_activity_events"
    ADD CONSTRAINT "app_activity_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_section_visibility"
    ADD CONSTRAINT "app_section_visibility_pkey" PRIMARY KEY ("section_id");



ALTER TABLE ONLY "public"."availability_blocks"
    ADD CONSTRAINT "availability_blocks_pkey" PRIMARY KEY ("id");



ALTER TABLE "public"."business_meeting_column_visibility"
    ADD CONSTRAINT "business_meeting_column_visibility_column_id_check" CHECK (("column_id" = ANY (ARRAY['institution'::"text", 'startup'::"text", 'category'::"text", 'decision'::"text", 'status'::"text", 'person'::"text", 'email'::"text", 'time'::"text", 'note'::"text", 'priority'::"text", 'why'::"text", 'next'::"text"]))) NOT VALID;



ALTER TABLE ONLY "public"."business_meeting_column_visibility"
    ADD CONSTRAINT "business_meeting_column_visibility_pkey" PRIMARY KEY ("column_id");



ALTER TABLE ONLY "public"."change_log"
    ADD CONSTRAINT "change_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conflict_groups"
    ADD CONSTRAINT "conflict_groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_response_messages"
    ADD CONSTRAINT "event_response_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_responses"
    ADD CONSTRAINT "event_responses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_responses"
    ADD CONSTRAINT "event_responses_schedule_item_id_organisation_id_key" UNIQUE ("schedule_item_id", "organisation_id");



ALTER TABLE ONLY "public"."meeting_category_visibility"
    ADD CONSTRAINT "meeting_category_visibility_pkey" PRIMARY KEY ("category");



ALTER TABLE ONLY "public"."notification_digest_queue"
    ADD CONSTRAINT "notification_digest_queue_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_digest_queue"
    ADD CONSTRAINT "notification_digest_queue_recipient_email_change_log_id_key" UNIQUE ("recipient_email", "change_log_id");



ALTER TABLE ONLY "public"."notification_recipients"
    ADD CONSTRAINT "notification_recipients_pkey" PRIMARY KEY ("email");



ALTER TABLE ONLY "public"."organisations"
    ADD CONSTRAINT "organisations_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."organisations"
    ADD CONSTRAINT "organisations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organisations"
    ADD CONSTRAINT "organisations_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."potential_meeting_admin_details"
    ADD CONSTRAINT "potential_meeting_admin_details_pkey" PRIMARY KEY ("potential_meeting_id");



ALTER TABLE ONLY "public"."potential_meeting_decisions"
    ADD CONSTRAINT "potential_meeting_decisions_pkey" PRIMARY KEY ("potential_meeting_id");



ALTER TABLE ONLY "public"."potential_meetings"
    ADD CONSTRAINT "potential_meetings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."schedule_item_conflict_groups"
    ADD CONSTRAINT "schedule_item_conflict_groups_pkey" PRIMARY KEY ("schedule_item_id", "conflict_group_id");



ALTER TABLE ONLY "public"."schedule_item_organisations"
    ADD CONSTRAINT "schedule_item_organisations_pkey" PRIMARY KEY ("schedule_item_id", "organisation_id");



ALTER TABLE ONLY "public"."schedule_item_participation"
    ADD CONSTRAINT "schedule_item_participation_pkey" PRIMARY KEY ("schedule_item_id", "organisation_id");



ALTER TABLE ONLY "public"."schedule_items"
    ADD CONSTRAINT "schedule_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."startup_updates"
    ADD CONSTRAINT "startup_updates_pkey" PRIMARY KEY ("id");



CREATE INDEX "app_activity_events_org_time_idx" ON "public"."app_activity_events" USING "btree" ("organisation_id", "occurred_at" DESC);



CREATE INDEX "availability_blocks_admin_inbox_idx" ON "public"."availability_blocks" USING "btree" ("admin_reviewed_at") WHERE ("admin_reviewed_at" IS NULL);



CREATE INDEX "availability_org_time_idx" ON "public"."availability_blocks" USING "btree" ("organisation_id", "starts_at", "ends_at");



CREATE INDEX "change_log_occurred_at_idx" ON "public"."change_log" USING "btree" ("occurred_at" DESC);



CREATE INDEX "change_log_organisation_idx" ON "public"."change_log" USING "btree" ("organisation_id", "occurred_at" DESC);



CREATE INDEX "event_response_messages_response_created_idx" ON "public"."event_response_messages" USING "btree" ("event_response_id", "created_at");



CREATE INDEX "event_responses_admin_inbox_idx" ON "public"."event_responses" USING "btree" ("admin_reviewed_at") WHERE ("admin_reviewed_at" IS NULL);



CREATE INDEX "notification_digest_pending_idx" ON "public"."notification_digest_queue" USING "btree" ("deliver_after") WHERE ("delivered_at" IS NULL);



CREATE INDEX "potential_meeting_decisions_admin_inbox_idx" ON "public"."potential_meeting_decisions" USING "btree" ("admin_reviewed_at") WHERE ("admin_reviewed_at" IS NULL);



CREATE INDEX "potential_meetings_institution_idx" ON "public"."potential_meetings" USING "btree" ("institution_name");



CREATE UNIQUE INDEX "potential_meetings_legacy_schedule_organisation_idx" ON "public"."potential_meetings" USING "btree" ("legacy_schedule_item_id", "organisation_id") WHERE ("legacy_schedule_item_id" IS NOT NULL);



CREATE INDEX "potential_meetings_org_idx" ON "public"."potential_meetings" USING "btree" ("organisation_id", "status");



CREATE INDEX "responses_item_idx" ON "public"."event_responses" USING "btree" ("schedule_item_id");



CREATE INDEX "responses_org_idx" ON "public"."event_responses" USING "btree" ("organisation_id");



CREATE INDEX "schedule_item_organisations_outreach_idx" ON "public"."schedule_item_organisations" USING "btree" ("organisation_id", "meeting_outreach_status");



CREATE INDEX "schedule_item_orgs_org_idx" ON "public"."schedule_item_organisations" USING "btree" ("organisation_id");



CREATE INDEX "schedule_item_participation_org_idx" ON "public"."schedule_item_participation" USING "btree" ("organisation_id", "status");



CREATE INDEX "schedule_items_review_by_idx" ON "public"."schedule_items" USING "btree" ("review_by") WHERE (("review_by" IS NOT NULL) AND ("status" <> 'cancelled'::"public"."item_status"));



CREATE INDEX "schedule_items_starts_at_idx" ON "public"."schedule_items" USING "btree" ("starts_at");



CREATE INDEX "schedule_items_status_idx" ON "public"."schedule_items" USING "btree" ("status");



CREATE INDEX "schedule_items_type_idx" ON "public"."schedule_items" USING "btree" ("item_type");



CREATE INDEX "startup_updates_org_created_idx" ON "public"."startup_updates" USING "btree" ("organisation_id", "created_at" DESC);



CREATE OR REPLACE TRIGGER "app_section_visibility_updated" BEFORE UPDATE ON "public"."app_section_visibility" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "availability_change_log" AFTER INSERT OR DELETE OR UPDATE ON "public"."availability_blocks" FOR EACH ROW EXECUTE FUNCTION "public"."log_programme_change"();



CREATE OR REPLACE TRIGGER "availability_updated" BEFORE UPDATE ON "public"."availability_blocks" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "business_meeting_column_visibility_updated" BEFORE UPDATE ON "public"."business_meeting_column_visibility" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "change_log_digest_queue" AFTER INSERT ON "public"."change_log" FOR EACH ROW EXECUTE FUNCTION "public"."queue_change_digest"();



CREATE OR REPLACE TRIGGER "event_response_change_log" AFTER INSERT OR DELETE OR UPDATE ON "public"."event_responses" FOR EACH ROW EXECUTE FUNCTION "public"."log_programme_change"();



CREATE OR REPLACE TRIGGER "event_response_message_reopens_conversation" AFTER INSERT ON "public"."event_response_messages" FOR EACH ROW EXECUTE FUNCTION "public"."reopen_schedule_conversation_for_startup"();



CREATE OR REPLACE TRIGGER "event_responses_updated" BEFORE UPDATE ON "public"."event_responses" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "meeting_category_visibility_updated" BEFORE UPDATE ON "public"."meeting_category_visibility" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "potential_meeting_admin_details_updated" BEFORE UPDATE ON "public"."potential_meeting_admin_details" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "potential_meeting_decisions_updated" BEFORE UPDATE ON "public"."potential_meeting_decisions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "potential_meeting_startup_updates" AFTER INSERT OR UPDATE ON "public"."potential_meetings" FOR EACH ROW EXECUTE FUNCTION "public"."notify_potential_meeting_change"();



CREATE OR REPLACE TRIGGER "potential_meetings_updated" BEFORE UPDATE ON "public"."potential_meetings" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "schedule_item_change_log" AFTER INSERT OR DELETE OR UPDATE ON "public"."schedule_items" FOR EACH ROW EXECUTE FUNCTION "public"."log_programme_change"();



CREATE OR REPLACE TRIGGER "schedule_item_startup_updates" AFTER INSERT OR UPDATE ON "public"."schedule_items" FOR EACH ROW EXECUTE FUNCTION "public"."notify_schedule_item_change"();



CREATE OR REPLACE TRIGGER "schedule_items_normalise_time_range" BEFORE INSERT OR UPDATE ON "public"."schedule_items" FOR EACH ROW EXECUTE FUNCTION "public"."normalise_schedule_item_time_range"();



CREATE OR REPLACE TRIGGER "schedule_items_updated" BEFORE UPDATE ON "public"."schedule_items" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "schedule_target_startup_updates" AFTER INSERT ON "public"."schedule_item_organisations" FOR EACH ROW EXECUTE FUNCTION "public"."notify_schedule_target_added"();



CREATE OR REPLACE TRIGGER "startup_updates_inbox_cap" AFTER INSERT ON "public"."startup_updates" FOR EACH ROW EXECUTE FUNCTION "public"."cap_startup_update_inbox"();



ALTER TABLE ONLY "public"."allowed_invites"
    ADD CONSTRAINT "allowed_invites_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."app_activity_events"
    ADD CONSTRAINT "app_activity_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_activity_events"
    ADD CONSTRAINT "app_activity_events_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_section_visibility"
    ADD CONSTRAINT "app_section_visibility_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."availability_blocks"
    ADD CONSTRAINT "availability_blocks_admin_reviewed_by_fkey" FOREIGN KEY ("admin_reviewed_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."availability_blocks"
    ADD CONSTRAINT "availability_blocks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."availability_blocks"
    ADD CONSTRAINT "availability_blocks_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."business_meeting_column_visibility"
    ADD CONSTRAINT "business_meeting_column_visibility_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."change_log"
    ADD CONSTRAINT "change_log_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."change_log"
    ADD CONSTRAINT "change_log_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."event_response_messages"
    ADD CONSTRAINT "event_response_messages_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."event_response_messages"
    ADD CONSTRAINT "event_response_messages_event_response_id_fkey" FOREIGN KEY ("event_response_id") REFERENCES "public"."event_responses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_responses"
    ADD CONSTRAINT "event_responses_admin_replied_by_fkey" FOREIGN KEY ("admin_replied_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."event_responses"
    ADD CONSTRAINT "event_responses_admin_reviewed_by_fkey" FOREIGN KEY ("admin_reviewed_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."event_responses"
    ADD CONSTRAINT "event_responses_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_responses"
    ADD CONSTRAINT "event_responses_schedule_item_id_fkey" FOREIGN KEY ("schedule_item_id") REFERENCES "public"."schedule_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_responses"
    ADD CONSTRAINT "event_responses_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."meeting_category_visibility"
    ADD CONSTRAINT "meeting_category_visibility_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."notification_digest_queue"
    ADD CONSTRAINT "notification_digest_queue_change_log_id_fkey" FOREIGN KEY ("change_log_id") REFERENCES "public"."change_log"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_digest_queue"
    ADD CONSTRAINT "notification_digest_queue_recipient_email_fkey" FOREIGN KEY ("recipient_email") REFERENCES "public"."notification_recipients"("email") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_recipients"
    ADD CONSTRAINT "notification_recipients_email_fkey" FOREIGN KEY ("email") REFERENCES "public"."allowed_invites"("email") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_recipients"
    ADD CONSTRAINT "notification_recipients_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."potential_meeting_admin_details"
    ADD CONSTRAINT "potential_meeting_admin_details_potential_meeting_id_fkey" FOREIGN KEY ("potential_meeting_id") REFERENCES "public"."potential_meetings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."potential_meeting_admin_details"
    ADD CONSTRAINT "potential_meeting_admin_details_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."potential_meeting_decisions"
    ADD CONSTRAINT "potential_meeting_decisions_admin_reviewed_by_fkey" FOREIGN KEY ("admin_reviewed_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."potential_meeting_decisions"
    ADD CONSTRAINT "potential_meeting_decisions_potential_meeting_id_fkey" FOREIGN KEY ("potential_meeting_id") REFERENCES "public"."potential_meetings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."potential_meeting_decisions"
    ADD CONSTRAINT "potential_meeting_decisions_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."potential_meetings"
    ADD CONSTRAINT "potential_meetings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."potential_meetings"
    ADD CONSTRAINT "potential_meetings_legacy_schedule_item_id_fkey" FOREIGN KEY ("legacy_schedule_item_id") REFERENCES "public"."schedule_items"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."potential_meetings"
    ADD CONSTRAINT "potential_meetings_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."potential_meetings"
    ADD CONSTRAINT "potential_meetings_owner_profile_id_fkey" FOREIGN KEY ("owner_profile_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."schedule_item_conflict_groups"
    ADD CONSTRAINT "schedule_item_conflict_groups_conflict_group_id_fkey" FOREIGN KEY ("conflict_group_id") REFERENCES "public"."conflict_groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."schedule_item_conflict_groups"
    ADD CONSTRAINT "schedule_item_conflict_groups_schedule_item_id_fkey" FOREIGN KEY ("schedule_item_id") REFERENCES "public"."schedule_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."schedule_item_organisations"
    ADD CONSTRAINT "schedule_item_organisations_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."schedule_item_organisations"
    ADD CONSTRAINT "schedule_item_organisations_schedule_item_id_fkey" FOREIGN KEY ("schedule_item_id") REFERENCES "public"."schedule_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."schedule_item_participation"
    ADD CONSTRAINT "schedule_item_participation_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."schedule_item_participation"
    ADD CONSTRAINT "schedule_item_participation_schedule_item_id_fkey" FOREIGN KEY ("schedule_item_id") REFERENCES "public"."schedule_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."schedule_item_participation"
    ADD CONSTRAINT "schedule_item_participation_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."schedule_items"
    ADD CONSTRAINT "schedule_items_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."schedule_items"
    ADD CONSTRAINT "schedule_items_created_organisation_id_fkey" FOREIGN KEY ("created_organisation_id") REFERENCES "public"."organisations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."startup_updates"
    ADD CONSTRAINT "startup_updates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."startup_updates"
    ADD CONSTRAINT "startup_updates_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."startup_updates"
    ADD CONSTRAINT "startup_updates_potential_meeting_id_fkey" FOREIGN KEY ("potential_meeting_id") REFERENCES "public"."potential_meetings"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."startup_updates"
    ADD CONSTRAINT "startup_updates_schedule_item_id_fkey" FOREIGN KEY ("schedule_item_id") REFERENCES "public"."schedule_items"("id") ON DELETE SET NULL;



CREATE POLICY "admins delete responses" ON "public"."event_responses" FOR DELETE TO "authenticated" USING ("public"."is_lvnc_admin"());



CREATE POLICY "admins manage business meeting column visibility" ON "public"."business_meeting_column_visibility" TO "authenticated" USING ("public"."is_lvnc_admin"()) WITH CHECK ("public"."is_lvnc_admin"());



CREATE POLICY "admins manage conflict groups" ON "public"."conflict_groups" TO "authenticated" USING ("public"."is_lvnc_admin"()) WITH CHECK ("public"."is_lvnc_admin"());



CREATE POLICY "admins manage conflict memberships" ON "public"."schedule_item_conflict_groups" TO "authenticated" USING ("public"."is_lvnc_admin"()) WITH CHECK ("public"."is_lvnc_admin"());



CREATE POLICY "admins manage invites" ON "public"."allowed_invites" TO "authenticated" USING ("public"."is_lvnc_admin"()) WITH CHECK ("public"."is_lvnc_admin"());



CREATE POLICY "admins manage meeting category visibility" ON "public"."meeting_category_visibility" TO "authenticated" USING ("public"."is_lvnc_admin"()) WITH CHECK ("public"."is_lvnc_admin"());



CREATE POLICY "admins manage notification recipients" ON "public"."notification_recipients" TO "authenticated" USING ("public"."is_lvnc_admin"()) WITH CHECK ("public"."is_lvnc_admin"());



CREATE POLICY "admins manage organisations" ON "public"."organisations" TO "authenticated" USING ("public"."is_lvnc_admin"()) WITH CHECK ("public"."is_lvnc_admin"());



CREATE POLICY "admins manage potential meeting decisions" ON "public"."potential_meeting_decisions" TO "authenticated" USING ("public"."is_lvnc_admin"()) WITH CHECK ("public"."is_lvnc_admin"());



CREATE POLICY "admins manage potential meeting details" ON "public"."potential_meeting_admin_details" TO "authenticated" USING ("public"."is_lvnc_admin"()) WITH CHECK ("public"."is_lvnc_admin"());



CREATE POLICY "admins manage potential meetings" ON "public"."potential_meetings" TO "authenticated" USING ("public"."is_lvnc_admin"()) WITH CHECK ("public"."is_lvnc_admin"());



CREATE POLICY "admins manage profiles" ON "public"."profiles" TO "authenticated" USING ("public"."is_lvnc_admin"()) WITH CHECK ("public"."is_lvnc_admin"());



CREATE POLICY "admins manage schedule items" ON "public"."schedule_items" TO "authenticated" USING ("public"."is_lvnc_admin"()) WITH CHECK ("public"."is_lvnc_admin"());



CREATE POLICY "admins manage schedule participation" ON "public"."schedule_item_participation" TO "authenticated" USING ("public"."is_lvnc_admin"()) WITH CHECK ("public"."is_lvnc_admin"());



CREATE POLICY "admins manage section visibility" ON "public"."app_section_visibility" TO "authenticated" USING ("public"."is_lvnc_admin"()) WITH CHECK ("public"."is_lvnc_admin"());



CREATE POLICY "admins manage targeting" ON "public"."schedule_item_organisations" TO "authenticated" USING ("public"."is_lvnc_admin"()) WITH CHECK ("public"."is_lvnc_admin"());



CREATE POLICY "admins see engagement activity" ON "public"."app_activity_events" FOR SELECT TO "authenticated" USING ("public"."is_lvnc_admin"());



CREATE POLICY "admins see notification queue" ON "public"."notification_digest_queue" FOR SELECT TO "authenticated" USING ("public"."is_lvnc_admin"());



CREATE POLICY "admins see programme changes" ON "public"."change_log" FOR SELECT TO "authenticated" USING ("public"."is_lvnc_admin"());



CREATE POLICY "admins see schedule conversation messages" ON "public"."event_response_messages" FOR SELECT TO "authenticated" USING ("public"."is_lvnc_admin"());



CREATE POLICY "admins see startup updates" ON "public"."startup_updates" FOR SELECT TO "authenticated" USING ("public"."is_lvnc_admin"());



CREATE POLICY "admins send schedule conversation messages" ON "public"."event_response_messages" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_lvnc_admin"() AND ("author_id" = "auth"."uid"()) AND ("author_role" = 'lvnc_admin'::"public"."app_role")));



CREATE POLICY "admins send startup updates" ON "public"."startup_updates" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_lvnc_admin"());



ALTER TABLE "public"."allowed_invites" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_activity_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_section_visibility" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "authenticated users see business meeting column visibility" ON "public"."business_meeting_column_visibility" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated users see meeting category visibility" ON "public"."meeting_category_visibility" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated users see organisation names" ON "public"."organisations" FOR SELECT TO "authenticated" USING (("public"."is_lvnc_admin"() OR ("id" = "public"."my_organisation_id"())));



CREATE POLICY "authenticated users see section visibility" ON "public"."app_section_visibility" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."availability_blocks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."business_meeting_column_visibility" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."change_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conflict_groups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_response_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_responses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."meeting_category_visibility" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "members and admins record own session" ON "public"."app_activity_events" FOR INSERT TO "authenticated" WITH CHECK ((("actor_id" = "auth"."uid"()) AND (("organisation_id" = "public"."my_organisation_id"()) OR (("organisation_id" IS NULL) AND "public"."is_lvnc_admin"()))));



CREATE POLICY "members and observers see allowed schedule items" ON "public"."schedule_items" FOR SELECT TO "authenticated" USING (("public"."is_lvnc_admin"() OR "public"."is_partner_observer"() OR (((("item_type" = 'lvnc_core'::"public"."item_type") AND ("status" = 'confirmed'::"public"."item_status")) OR (("item_type" <> 'lvnc_core'::"public"."item_type") AND ("status" = ANY (ARRAY['proposed'::"public"."item_status", 'confirmed'::"public"."item_status"])))) AND (("visibility_scope" = 'cohort'::"public"."visibility_scope") OR (EXISTS ( SELECT 1
   FROM "public"."schedule_item_organisations" "sio"
  WHERE (("sio"."schedule_item_id" = "schedule_items"."id") AND ("sio"."organisation_id" = "public"."my_organisation_id"()))))))));



CREATE POLICY "members and observers see schedule targeting" ON "public"."schedule_item_organisations" FOR SELECT TO "authenticated" USING (("public"."is_lvnc_admin"() OR "public"."is_partner_observer"() OR ("organisation_id" = "public"."my_organisation_id"())));



ALTER TABLE "public"."notification_digest_queue" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_recipients" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organisations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "partner observers see meeting decisions" ON "public"."potential_meeting_decisions" FOR SELECT TO "authenticated" USING ("public"."is_partner_observer"());



CREATE POLICY "partner observers see potential meetings" ON "public"."potential_meetings" FOR SELECT TO "authenticated" USING ("public"."is_partner_observer"());



ALTER TABLE "public"."potential_meeting_admin_details" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."potential_meeting_decisions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."potential_meetings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."schedule_item_conflict_groups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."schedule_item_organisations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."schedule_item_participation" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."schedule_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "startup members add own availability" ON "public"."availability_blocks" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_lvnc_admin"() OR ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'startup_member'::"public"."app_role")))) AND ("organisation_id" = "public"."my_organisation_id"()) AND ("created_by" = "auth"."uid"()))));



CREATE POLICY "startup members delete company event proposals" ON "public"."schedule_items" FOR DELETE TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'startup_member'::"public"."app_role")))) AND ("created_organisation_id" = "public"."my_organisation_id"()) AND ("item_type" = 'third_party'::"public"."item_type") AND ("status" = 'proposed'::"public"."item_status")));



CREATE POLICY "startup members delete own availability" ON "public"."availability_blocks" FOR DELETE TO "authenticated" USING (("public"."is_lvnc_admin"() OR ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'startup_member'::"public"."app_role")))) AND ("organisation_id" = "public"."my_organisation_id"()))));



CREATE POLICY "startup members insert own responses" ON "public"."event_responses" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_lvnc_admin"() OR ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'startup_member'::"public"."app_role")))) AND ("organisation_id" = "public"."my_organisation_id"()) AND ("updated_by" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."schedule_items" "si"
  WHERE ("si"."id" = "event_responses"."schedule_item_id"))))));



CREATE POLICY "startup members manage own potential meeting decision" ON "public"."potential_meeting_decisions" TO "authenticated" USING (("public"."is_lvnc_admin"() OR ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'startup_member'::"public"."app_role")))) AND (EXISTS ( SELECT 1
   FROM "public"."potential_meetings" "pm"
  WHERE (("pm"."id" = "potential_meeting_decisions"."potential_meeting_id") AND ("pm"."organisation_id" = "public"."my_organisation_id"()))))))) WITH CHECK (("public"."is_lvnc_admin"() OR ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'startup_member'::"public"."app_role")))) AND (EXISTS ( SELECT 1
   FROM "public"."potential_meetings" "pm"
  WHERE (("pm"."id" = "potential_meeting_decisions"."potential_meeting_id") AND ("pm"."organisation_id" = "public"."my_organisation_id"())))))));



CREATE POLICY "startup members mark own updates read" ON "public"."startup_updates" FOR UPDATE TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'startup_member'::"public"."app_role")))) AND ("organisation_id" = "public"."my_organisation_id"()))) WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'startup_member'::"public"."app_role")))) AND ("organisation_id" = "public"."my_organisation_id"())));



CREATE POLICY "startup members propose company external events" ON "public"."schedule_items" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_lvnc_admin"() OR ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'startup_member'::"public"."app_role")))) AND ("created_by" = "auth"."uid"()) AND ("created_organisation_id" = "public"."my_organisation_id"()) AND ("item_type" = 'third_party'::"public"."item_type") AND ("status" = 'proposed'::"public"."item_status") AND ("visibility_scope" = 'selected_organisations'::"public"."visibility_scope"))));



CREATE POLICY "startup members remove company event proposal targets" ON "public"."schedule_item_organisations" FOR DELETE TO "authenticated" USING ((("organisation_id" = "public"."my_organisation_id"()) AND (EXISTS ( SELECT 1
   FROM "public"."schedule_items" "item"
  WHERE (("item"."id" = "schedule_item_organisations"."schedule_item_id") AND ("item"."created_organisation_id" = "public"."my_organisation_id"()) AND ("item"."item_type" = 'third_party'::"public"."item_type") AND ("item"."status" = 'proposed'::"public"."item_status"))))));



CREATE POLICY "startup members see own availability" ON "public"."availability_blocks" FOR SELECT TO "authenticated" USING (("public"."is_lvnc_admin"() OR ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'startup_member'::"public"."app_role")))) AND ("organisation_id" = "public"."my_organisation_id"()))));



CREATE POLICY "startup members see own responses" ON "public"."event_responses" FOR SELECT TO "authenticated" USING (("public"."is_lvnc_admin"() OR ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'startup_member'::"public"."app_role")))) AND ("organisation_id" = "public"."my_organisation_id"()))));



CREATE POLICY "startup members see own schedule conversation messages" ON "public"."event_response_messages" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."event_responses" "response"
     JOIN "public"."profiles" "profile" ON (("profile"."id" = "auth"."uid"())))
  WHERE (("response"."id" = "event_response_messages"."event_response_id") AND ("profile"."role" = 'startup_member'::"public"."app_role") AND ("response"."organisation_id" = "profile"."organisation_id")))));



CREATE POLICY "startup members see their updates" ON "public"."startup_updates" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'startup_member'::"public"."app_role")))) AND ("organisation_id" = "public"."my_organisation_id"())));



CREATE POLICY "startup members target company event proposals" ON "public"."schedule_item_organisations" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_lvnc_admin"() OR ((EXISTS ( SELECT 1
   FROM "public"."schedule_items" "item"
  WHERE (("item"."id" = "schedule_item_organisations"."schedule_item_id") AND ("item"."created_organisation_id" = "public"."my_organisation_id"()) AND ("item"."item_type" = 'third_party'::"public"."item_type") AND ("item"."status" = 'proposed'::"public"."item_status") AND ("item"."visibility_scope" = 'selected_organisations'::"public"."visibility_scope")))) AND ("organisation_id" = "public"."my_organisation_id"()))));



CREATE POLICY "startup members update company event proposals" ON "public"."schedule_items" FOR UPDATE TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'startup_member'::"public"."app_role")))) AND ("created_organisation_id" = "public"."my_organisation_id"()) AND ("item_type" = 'third_party'::"public"."item_type") AND ("status" = 'proposed'::"public"."item_status"))) WITH CHECK ((("created_organisation_id" = "public"."my_organisation_id"()) AND ("item_type" = 'third_party'::"public"."item_type") AND ("status" = 'proposed'::"public"."item_status") AND ("visibility_scope" = 'selected_organisations'::"public"."visibility_scope")));



CREATE POLICY "startup members update own availability" ON "public"."availability_blocks" FOR UPDATE TO "authenticated" USING (("public"."is_lvnc_admin"() OR ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'startup_member'::"public"."app_role")))) AND ("organisation_id" = "public"."my_organisation_id"())))) WITH CHECK (("public"."is_lvnc_admin"() OR ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'startup_member'::"public"."app_role")))) AND ("organisation_id" = "public"."my_organisation_id"()))));



CREATE POLICY "startup members update own responses" ON "public"."event_responses" FOR UPDATE TO "authenticated" USING (("public"."is_lvnc_admin"() OR ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'startup_member'::"public"."app_role")))) AND ("organisation_id" = "public"."my_organisation_id"())))) WITH CHECK (("public"."is_lvnc_admin"() OR ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'startup_member'::"public"."app_role")))) AND ("organisation_id" = "public"."my_organisation_id"()) AND ("updated_by" = "auth"."uid"()))));



ALTER TABLE "public"."startup_updates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "startups see own schedule participation" ON "public"."schedule_item_participation" FOR SELECT TO "authenticated" USING (("organisation_id" = "public"."my_organisation_id"()));



CREATE POLICY "startups see their potential meetings" ON "public"."potential_meetings" FOR SELECT TO "authenticated" USING (("organisation_id" = "public"."my_organisation_id"()));



CREATE POLICY "startups send own schedule conversation messages" ON "public"."event_response_messages" FOR INSERT TO "authenticated" WITH CHECK ((("author_id" = "auth"."uid"()) AND ("author_role" = 'startup_member'::"public"."app_role") AND (EXISTS ( SELECT 1
   FROM "public"."event_responses" "response"
  WHERE (("response"."id" = "event_response_messages"."event_response_id") AND ("response"."organisation_id" = "public"."my_organisation_id"()))))));



CREATE POLICY "users see own profile" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((("id" = "auth"."uid"()) OR "public"."is_lvnc_admin"()));



CREATE POLICY "visible conflict groups" ON "public"."conflict_groups" FOR SELECT TO "authenticated" USING (("public"."is_lvnc_admin"() OR (EXISTS ( SELECT 1
   FROM ("public"."schedule_item_conflict_groups" "sicg"
     JOIN "public"."schedule_items" "si" ON (("si"."id" = "sicg"."schedule_item_id")))
  WHERE ("sicg"."conflict_group_id" = "conflict_groups"."id")))));



CREATE POLICY "visible conflict memberships" ON "public"."schedule_item_conflict_groups" FOR SELECT TO "authenticated" USING (("public"."is_lvnc_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."schedule_items" "si"
  WHERE ("si"."id" = "schedule_item_conflict_groups"."schedule_item_id")))));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."availability_blocks";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."event_responses";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."potential_meeting_decisions";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."potential_meetings";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."schedule_items";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."cap_startup_update_inbox"() TO "anon";
GRANT ALL ON FUNCTION "public"."cap_startup_update_inbox"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cap_startup_update_inbox"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."claim_quick_access"("access_email" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."claim_quick_access"("access_email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."claim_quick_access"("access_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."claim_quick_access"("access_email" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_lvnc_admin"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_lvnc_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_lvnc_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_lvnc_admin"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_partner_observer"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_partner_observer"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_partner_observer"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_partner_observer"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_programme_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_programme_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_programme_change"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."my_organisation_id"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."my_organisation_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."my_organisation_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."my_organisation_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."normalise_schedule_item_time_range"() TO "anon";
GRANT ALL ON FUNCTION "public"."normalise_schedule_item_time_range"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."normalise_schedule_item_time_range"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_potential_meeting_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_potential_meeting_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_potential_meeting_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_schedule_item_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_schedule_item_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_schedule_item_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_schedule_target_added"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_schedule_target_added"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_schedule_target_added"() TO "service_role";



GRANT ALL ON FUNCTION "public"."provision_allowed_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."provision_allowed_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."provision_allowed_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."publish_startup_update"("target_organisation" "uuid", "update_kind" "text", "update_title" "text", "update_body" "text", "item_id" "uuid", "meeting_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."publish_startup_update"("target_organisation" "uuid", "update_kind" "text", "update_title" "text", "update_body" "text", "item_id" "uuid", "meeting_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."publish_startup_update"("target_organisation" "uuid", "update_kind" "text", "update_title" "text", "update_body" "text", "item_id" "uuid", "meeting_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."queue_change_digest"() TO "anon";
GRANT ALL ON FUNCTION "public"."queue_change_digest"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."queue_change_digest"() TO "service_role";



GRANT ALL ON FUNCTION "public"."reopen_schedule_conversation_for_startup"() TO "anon";
GRANT ALL ON FUNCTION "public"."reopen_schedule_conversation_for_startup"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."reopen_schedule_conversation_for_startup"() TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."allowed_invites" TO "authenticated";
GRANT ALL ON TABLE "public"."allowed_invites" TO "service_role";



GRANT ALL ON TABLE "public"."app_activity_events" TO "authenticated";
GRANT ALL ON TABLE "public"."app_activity_events" TO "service_role";



GRANT ALL ON TABLE "public"."app_section_visibility" TO "anon";
GRANT ALL ON TABLE "public"."app_section_visibility" TO "authenticated";
GRANT ALL ON TABLE "public"."app_section_visibility" TO "service_role";



GRANT ALL ON TABLE "public"."availability_blocks" TO "authenticated";
GRANT ALL ON TABLE "public"."availability_blocks" TO "service_role";



GRANT ALL ON TABLE "public"."business_meeting_column_visibility" TO "anon";
GRANT ALL ON TABLE "public"."business_meeting_column_visibility" TO "authenticated";
GRANT ALL ON TABLE "public"."business_meeting_column_visibility" TO "service_role";



GRANT ALL ON TABLE "public"."change_log" TO "authenticated";
GRANT ALL ON TABLE "public"."change_log" TO "service_role";



GRANT ALL ON TABLE "public"."conflict_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."conflict_groups" TO "service_role";



GRANT ALL ON TABLE "public"."event_response_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."event_response_messages" TO "service_role";



GRANT ALL ON TABLE "public"."event_responses" TO "authenticated";
GRANT ALL ON TABLE "public"."event_responses" TO "service_role";



GRANT ALL ON TABLE "public"."meeting_category_visibility" TO "anon";
GRANT ALL ON TABLE "public"."meeting_category_visibility" TO "authenticated";
GRANT ALL ON TABLE "public"."meeting_category_visibility" TO "service_role";



GRANT ALL ON TABLE "public"."notification_digest_queue" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_digest_queue" TO "service_role";



GRANT ALL ON TABLE "public"."notification_recipients" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_recipients" TO "service_role";



GRANT ALL ON TABLE "public"."organisations" TO "authenticated";
GRANT ALL ON TABLE "public"."organisations" TO "service_role";



GRANT ALL ON TABLE "public"."potential_meeting_admin_details" TO "anon";
GRANT ALL ON TABLE "public"."potential_meeting_admin_details" TO "authenticated";
GRANT ALL ON TABLE "public"."potential_meeting_admin_details" TO "service_role";



GRANT ALL ON TABLE "public"."potential_meeting_decisions" TO "anon";
GRANT ALL ON TABLE "public"."potential_meeting_decisions" TO "authenticated";
GRANT ALL ON TABLE "public"."potential_meeting_decisions" TO "service_role";



GRANT ALL ON TABLE "public"."potential_meetings" TO "anon";
GRANT ALL ON TABLE "public"."potential_meetings" TO "authenticated";
GRANT ALL ON TABLE "public"."potential_meetings" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."schedule_items" TO "authenticated";
GRANT ALL ON TABLE "public"."schedule_items" TO "service_role";



GRANT ALL ON TABLE "public"."schedule_events" TO "anon";
GRANT ALL ON TABLE "public"."schedule_events" TO "authenticated";
GRANT ALL ON TABLE "public"."schedule_events" TO "service_role";



GRANT ALL ON TABLE "public"."schedule_item_conflict_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."schedule_item_conflict_groups" TO "service_role";



GRANT ALL ON TABLE "public"."schedule_item_organisations" TO "authenticated";
GRANT ALL ON TABLE "public"."schedule_item_organisations" TO "service_role";



GRANT ALL ON TABLE "public"."schedule_item_participation" TO "anon";
GRANT ALL ON TABLE "public"."schedule_item_participation" TO "authenticated";
GRANT ALL ON TABLE "public"."schedule_item_participation" TO "service_role";



GRANT ALL ON TABLE "public"."startup_updates" TO "authenticated";
GRANT ALL ON TABLE "public"."startup_updates" TO "service_role";



GRANT UPDATE("read_at") ON TABLE "public"."startup_updates" TO "authenticated";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































