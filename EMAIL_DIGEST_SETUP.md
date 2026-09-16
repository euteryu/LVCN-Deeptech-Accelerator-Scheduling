# LVCN digest email setup

Use a verified LVCN subdomain, for example `notify.lvcn.co.uk`. No separate domain purchase is needed if LVCN controls `lvcn.co.uk`.

1. Create a free Resend account and add `notify.lvcn.co.uk` as a sending domain.
2. Add the DNS records Resend provides at the LVCN domain host and wait for verification.
3. In Supabase Edge Function secrets, add `RESEND_API_KEY` and `DIGEST_FROM_EMAIL=updates@notify.lvcn.co.uk`.
4. Deploy `supabase/functions/send-digests` with JWT verification disabled.
5. Create a Supabase Cron job to invoke `send-digests` every five minutes.

The database migration queue groups changes by recipient. The function marks rows delivered only after Resend accepts the email.
