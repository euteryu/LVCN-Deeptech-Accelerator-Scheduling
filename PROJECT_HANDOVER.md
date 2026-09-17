# LVCN Programme Board — project handover

Last updated: 2026-09-17

## Current state

- Local app is implemented in this folder and uses React, TypeScript, Vite, Tailwind, and Supabase.
- `.env.local` is present and configured for the Supabase project URL `https://afoybntrtowmvpjwjvjh.supabase.co`.
- `VITE_DEMO_MODE=false`, so the app will use Supabase rather than demo memory when started locally.
- The publishable Supabase browser key is stored only in `.env.local`. `.env.local` is gitignored and must not be copied into source, SQL, screenshots, or documentation.
- Authentication now uses lightweight allow-listed email entry: no magic-link email is sent. Anonymous Sign-ins are enabled in Supabase Auth, and `202609160003` through `202609160005` are applied to support it.
- Calendar UI has day/week/month views, view-aware previous/next navigation, a compact colour key, focus mode, and Excel/PDF export.
- The desktop sidebar starts collapsed as a 72px icon rail, so the calendar gets maximum width. The dedicated Menu button above Calendar expands it to show labels; the same control collapses it again.
- Admins open directly into the spreadsheet schedule mode. Potential Biz Meets has expanded, collapsible (open by default) admin guidance; Hammersmith hotel recommendations include Hilton London Olympia and K West Hotel & Spa.
- Pending decisions and time/conflict warnings use a deliberately slow, high-contrast yellow on/off alert to make required action clear, with a non-animated high-contrast fallback for reduced-motion users.
- Last verified: lint and production build passed after the latest schedule and coordination refinements.

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

1. Tackle maintenance/modularity refactoring next: split the large `App.tsx` into maintainable modules while preserving existing behaviour and database compatibility.
2. Iron out the remaining URI/routing and UX details.
3. Run the full lint/build checks before any deployment.
4. Keep all changes local until explicit approval to go live.

## Priority rollout work after the refactor

1. Complete a data-audit worksheet for every remaining startup: name, owner, contact, opportunities, meetings, dates/times, location, source link, status, and which organisations may see it. Deep Fusion AI and First Lab can be treated as the completed baseline, then load and verify the remaining startups one at a time.
2. Add the outstanding institutions, named contacts, and meeting opportunities only after an LVCN owner confirms the source and audience. Use the existing Potential Biz Meets workflow rather than inventing a second record type.
3. Add an admin-only completeness view: per startup, show missing schedule/meeting information and items still awaiting a decision. This is more useful than trying to infer completeness from the calendar itself.
4. Before deployment, test the operational paths with realistic data: one admin coordinating several startups, an individual startup updating a decision, overlap/conflict warnings, mobile/tablet use, and links opened directly or shared.

## Performance and reliability guardrails

- This is a small, known cohort, so correctness, clear permissions, and simple queries matter more than premature infrastructure scaling. Keep the current data model and add pagination/server-side filtering only when the real data volume demonstrates a need.
- The production build currently warns about a large main JavaScript bundle. During the modularity refactor, lazy-load the PDF/Excel export code and any non-default admin-only views; that gives the clearest first-load improvement without changing user-facing behaviour.
- Keep Supabase queries scoped to the signed-in user's organisation where applicable, preserve the existing RLS checks, and avoid polling. Add targeted indexes only after inspecting a real slow query.
- Keep `App.tsx` as orchestration only. Move views, data mapping, decision/conflict logic, and export UI into focused modules with tests around the mapping and permissions-sensitive logic.

## Do not do

- Do not commit `.env.local`.
- Do not use a Supabase `service_role` or `sb_secret` key in the browser app.
- Do not run `supabase/seed_demo.sql` until an admin profile exists.
- Do not enable grouped schedule emails before LVCN's domain owner approves it. See `EMAIL_DIGEST_SETUP.md`; the app is fully usable without email delivery.
- Before sharing a hosted link, complete the Cloudflare Turnstile setup documented in `README.md`; anonymous sign-in alone is not sufficient bot protection.
