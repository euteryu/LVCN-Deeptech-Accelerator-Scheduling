# LVCN-Deeptech-Accelerator-Scheduling

A private, short-lived scheduling and decision app for LVCN's Korea-UK startup cohort. It replaces per-company spreadsheets with a shared operational calendar while keeping every startup's targeting, responses, notes, and availability isolated from the other startups.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for role boundaries, module ownership, and the change checklist used to keep future work maintainable.

## What is included

- Week, day, and agenda views with mobile-first agenda behaviour
- Separate LVCN programme, third-party opportunity, business meeting, company work, and private availability treatments
- Immediate startup decisions and private notes
- Admin programme pulse, filters, named response lists, and availability-conflict summaries
- Admin item creation, duplication, cancellation, deletion, and reviewed CSV import
- Excel and print-ready PDF exports
- Lightweight allow-listed email access (no verification email)
- Postgres schema, indexes, representative organisation seed data, and Row Level Security policies
- Local demo mode with representative data for all eight startups

## Run locally

Requirements: Node.js 20 or newer and npm.

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

With `VITE_DEMO_MODE=true`, no backend is required. Use the profile menu at the top right to switch between an LVCN administrator and a Seoul Labs startup member. Demo changes are held in browser memory and reset on refresh.

Before handover or deployment, run:

```powershell
npm run test
npm run lint
npm run typecheck
npm run build
```

## Supabase setup

1. Create a Supabase project in the UK or an appropriate region for the programme's data handling requirements.
2. In **Authentication > Providers > Anonymous**, enable anonymous sign-ins. This app uses an anonymous browser session plus an allow-listed email entry, so it sends no login emails.
3. Add users only to `public.allowed_invites`. A user enters their registered email address to select their profile. This is a convenience gate, not proof of email ownership.
4. Apply the migrations in filename order using the Supabase CLI:

   ```powershell
   supabase link --project-ref YOUR_PROJECT_REF
   supabase db push
   supabase db seed
   ```

   Alternatively, paste each file in `supabase/migrations` into the SQL editor in order, followed by `supabase/seed.sql`. After an admin has signed in, run `supabase/seed_demo.sql` for representative schedule items, conflicts, responses, and private availability.
5. Run the migrations in filename order, including `202609160003_quick_email_access.sql`, then run the seed and contacts files. For each startup member, use the correct `organisation_id`; admins must have `organisation_id = null`.
6. Copy only the Project URL and public anonymous key into `.env.local`:

   ```dotenv
   VITE_SUPABASE_URL=https://PROJECT_REF.supabase.co
   VITE_SUPABASE_ANON_KEY=PUBLIC_ANON_KEY
   VITE_DEMO_MODE=false
   ```

Never put the service-role key in this project or in Cloudflare Pages. The frontend intentionally uses the public anonymous key; RLS is the enforcement boundary.

### Add an organisation and invited user

Run as a database administrator:

```sql
insert into public.organisations (name, slug)
values ('Company name', 'company-name')
returning id;

insert into public.allowed_invites (email, full_name, role, organisation_id)
values ('founder@company.com', 'Founder Name', 'startup_member', 'ORGANISATION_UUID');
```

For an LVCN administrator, use role `lvnc_admin` and a null organisation. Email values must be lowercase.

## Import a normalised spreadsheet

Export the source sheet as CSV or copy its itemised rows. In the admin app, choose **Import**, paste rows, review the parsed preview, and confirm. Useful headings include:

- `Event`, `Date`, `Start`, `End`
- `Type`, `Location`
- `Booking status`, `Next action`

Rows without an event title or date are flagged and skipped. Imported rows are marked `proposed`, retain an import source note, and should be verified by LVCN. Do not upload or depend on visual weekly-grid spreadsheets.

## Cloudflare Pages deployment

1. Push the project to a Git repository.
2. In Cloudflare Pages, create a project from that repository.
3. Set **Build command** to `npm run build` and **Build output directory** to `dist`.
4. Add the three `VITE_` variables shown above. The anonymous key is designed to be public; do not add a service-role key.
5. Deploy, then add the Pages URL to Supabase's authentication redirect allow-list.

`public/_redirects` provides the SPA fallback required for direct navigation.

## Deferred: grouped schedule emails

Do not enable email digests before the LVCN owner approves the sender setup. The app works without this feature.

When approved, read `EMAIL_DIGEST_SETUP.md` and complete its steps using an LVCN-controlled subdomain such as `notify.lvcn.co.uk`. The integration uses Resend's free tier, Supabase Edge Functions, and a five-minute grouped digest queue so recipients receive one update rather than one email per edit. The sender domain, Resend account, API key, and DNS records must be created by, or with approval from, the LVCN domain owner. Never put the Resend API key in browser environment variables.

## Before sharing a hosted link: bot protection

Create a free Cloudflare Turnstile widget for `localhost` and the final hosted domain. In Supabase Authentication > Bot and Abuse Protection, enable CAPTCHA protection, select Cloudflare Turnstile, and add its secret key. Give the public site key to the developer to add the browser widget. Do not share the Turnstile secret or put it in frontend variables.

## Verify startup-to-startup isolation

Use two different private browser sessions with two invited startup accounts.

1. Create a targeted event, response note, and availability block for Startup A.
2. Confirm that Startup A sees them.
3. Sign in as Startup B and confirm that the targeted item, response, note, availability block, and any busy indicator are absent.
4. Attempt direct REST queries for Startup A's organisation UUID while authenticated as Startup B; they must return no rows or an RLS error.
5. Sign in as an LVCN admin and confirm that both organisations' records and named conflicts are visible.

The manual query checklist in `supabase/tests/rls_isolation.sql` supports this test. Repeat it whenever RLS policies change.

## Export, deletion, and shutdown

Admins can export the currently filtered programme to Excel or PDF from the calendar toolbar. Treat exported files as programme data and store them according to LVCN policy.

At programme close:

1. Export the final operational record if it must be retained.
2. Remove Cloudflare environment variables and delete or unpublish the Pages project.
3. Revoke active sessions and remove rows from `allowed_invites`.
4. Export any database archive that LVCN is required to keep.
5. Delete the Supabase project to remove authentication and programme data, or truncate application tables if the project will be reused.

Deleting a Supabase project is irreversible. Confirm the retention owner and archive before doing so.
