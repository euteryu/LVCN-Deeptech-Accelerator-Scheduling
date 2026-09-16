-- Temporary notification setup: every current startup contact receives the
-- single grouped digest for their organisation. Replace this with the final
-- one or two POCs per startup when those are confirmed.

update public.notification_recipients
set is_schedule_poc = true,
    receives_digest = true,
    updated_at = now()
where is_lvnc_admin = false;

update public.notification_recipients
set receives_digest = true,
    updated_at = now()
where is_lvnc_admin = true;
