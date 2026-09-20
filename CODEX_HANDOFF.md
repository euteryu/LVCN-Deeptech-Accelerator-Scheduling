# LVCN Programme Board — Current Handoff

Last updated: 19 September 2026 (Europe/London)

## Live services

- Live frontend: `https://lvcn-deeptech-accelerator-scheduling.pages.dev`
- Cloudflare Pages project: `lvcn-deeptech-accelerator-scheduling`
- Latest production deployment: `https://930f7260.lvcn-deeptech-accelerator-scheduling.pages.dev`
- The linked Supabase project is accessible through the Supabase Management API using the process-level `SUPABASE_ACCESS_TOKEN`. Never print, commit, or add that token to frontend environment variables.

## Current business-meeting workflow

- Potential Business Meetings are visible to the relevant startup for a 1–3 star priority rating.
- The rating is how LVCN prioritises outreach. Do not hide a pending/unreviewed queue from startup accounts.
- Admins can create, edit, and delete Potential Business Meetings. Startup users can view and rate their own records only.
- Organisation names, contacts, notes, and relationship status are all managed in the live Supabase database. Admin contact details are private.

## Live, management-approved meeting-list merges

The following migrations have been applied directly to the live Supabase database. They merge management-supplied targets with existing relevant records and avoid exact-name duplicates:

- `202609190008_restore_boss_approved_deep_fusion_meetings.sql`
- `202609190009_merge_boss_approved_pa_robotics_meetings.sql`
- `202609190010_merge_boss_approved_fust_lab_meetings.sql`
- `202609190011_merge_boss_approved_jiro_meetings.sql`
- `202609190012_merge_boss_approved_yepbio_meetings.sql`
- `202609190013_merge_boss_approved_hme_square_meetings.sql`
- `202609190014_merge_boss_approved_dotter_meetings.sql`
- `202609190015_merge_boss_approved_seoul_labs_meetings.sql`

Specified `contacted` and `agreed` statuses are preserved where management explicitly supplied them (notably Dotter and Seoul Labs). Other supplied targets are normally `draft` and available for rating.

## Frontend state in the latest deployment

- Korean mode has improved startup-facing Potential Business Meetings translations: controls, categories, statuses, rating UI, standard next steps, and relevance summaries.
- Investor Showcase has no explanatory sentence below its title.
- Programme Record makes clear that exports are point-in-time backups of the live schedule. Admins can select either a programme week or a custom date range and export a startup-specific Excel or PDF snapshot.
- Any schedule-item title with an `event_url` is a direct link for both admins and startups; the row itself still opens the in-app detail view. This includes Programme rows such as EBS and third-party events such as the SUEZ Satellite User Forum.

## Safe continuation

1. Build before a frontend release: `npm.cmd run typecheck` then `npm.cmd run build`.
2. Deploy the built `dist` directory to the existing production Pages project:
   `npx.cmd --yes wrangler@latest pages deploy dist --project-name lvcn-deeptech-accelerator-scheduling`
3. For live database changes, create a dated migration under `supabase/migrations/`, apply it transactionally through the Management API, then query the live database to verify counts and duplicates.
4. Do not use database dumps, migrations, or frontend deployments to overwrite unrelated working-tree changes.
