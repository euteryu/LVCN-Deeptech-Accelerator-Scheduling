# LVCN Programme Board — project handover

Last updated: 2026-09-16

## Current state

- Local app is implemented in this folder and uses React, TypeScript, Vite, Tailwind, and Supabase.
- `.env.local` is present and configured for the Supabase project URL `https://afoybntrtowmvpjwjvjh.supabase.co`.
- `VITE_DEMO_MODE=false`, so the app will use Supabase rather than demo memory when started locally.
- The publishable Supabase browser key is stored only in `.env.local`. `.env.local` is gitignored and must not be copied into source, SQL, screenshots, or documentation.
- Authentication now uses lightweight allow-listed email entry: no magic-link email is sent. Anonymous Sign-ins are enabled in Supabase Auth, and `202609160003` through `202609160005` are applied to support it.
- Calendar UI has day/week/month views, view-aware previous/next navigation, a compact colour key, focus mode, and Excel/PDF export.
- The desktop sidebar starts collapsed as a 72px icon rail, so the calendar gets maximum width. The dedicated Menu button above Calendar expands it to show labels; the same control collapses it again.
- Last verified: production build passed after the latest sidebar and calendar refinements.

## Run locally

From PowerShell:

```powershell
Set-Location -LiteralPath 'C:\Users\minse\Downloads\LVCN_WEBAPP'
npm run dev
```

Open the URL Vite prints, normally `http://localhost:5173`.

## Supabase setup still required

1. In Supabase SQL Editor, run migration files in filename order (including `202609160003_quick_email_access.sql`; the two following files are corrective replacements for projects that ran the initial version).
2. Run `supabase/seed.sql` once for the base organisation rows.
3. Run `supabase/contacts_invites.sql` to add the LVCN administrators and the 22 SVC UK Q22 participants from `SVC_UK_Programme_Contacts.xlsx`.
4. The contacts file flags Namhyun Kang's PA Robotics email as needing confirmation. The Q22 address is included; the alternate Basic Information address is intentionally not included.
5. Each attendee enters the same allow-listed email address in the app and enters immediately; no email is sent or verified. This is intentionally a convenience gate, not secure identity verification.
6. After an LVCN admin has signed in, optionally run `supabase/seed_demo.sql` for representative schedule data.

## Administrator addresses prepared

- Dan Idhenga — `dan@lvcn.co.uk`
- Aadam Sumer — `aadam@lvcn.co.uk`
- Aadam Sumer shared alias — `admin@londonvcnetwork.com`
- Leo Henghes — `leo@lvcn.co.uk`
- Minseok Ryu — `minseok@lvcn.co.uk`

Both Aadam addresses are included as admin allow-list entries. If only one should be active, remove the other row from `supabase/contacts_invites.sql` before running it.

## Important files

- `supabase/contacts_invites.sql` — prepared organisation and invite allow-list.
- `supabase/migrations/202609160001_initial_schema.sql` — schema and provisioning trigger.
- `supabase/migrations/202609160002_row_level_security.sql` — row-level security policies.
- `supabase/seed_demo.sql` — optional sample schedule records.
- `README.md` — setup, deployment, import, testing, and shutdown guidance.
- `LVCN_Programme_Board_Runbook.docx` — Word follow-up runbook.

## Next session checklist

1. Start the local app with `npm run dev`.
2. Run the migration and seed SQL in Supabase if not already done.
3. Run `supabase/contacts_invites.sql`.
4. Test direct email entry as one admin and one startup member in separate private browser windows.
5. Verify an admin can see the cohort and a startup member can see only its own organisation's private responses/availability.
6. Review the UI on desktop and mobile, then deploy to Cloudflare Pages when ready.
7. Before public launch, rotate/reissue any exposed credentials, review Supabase Auth redirect URLs, confirm RLS with two real startup accounts, and tighten production secrets/roles.
8. Keep the sidebar collapsed by default unless LVCN decides labels should be visible initially; it is deliberately a narrow icon rail on desktop to prioritise calendar space.

## Do not do

- Do not commit `.env.local`.
- Do not use a Supabase `service_role` or `sb_secret` key in the browser app.
- Do not run `supabase/seed_demo.sql` until an admin profile exists.
- Do not enable grouped schedule emails before LVCN's domain owner approves it. See `EMAIL_DIGEST_SETUP.md`; the app is fully usable without email delivery.
- Before sharing a hosted link, complete the Cloudflare Turnstile setup documented in `README.md`; anonymous sign-in alone is not sufficient bot protection.
