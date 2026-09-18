# Application architecture

The programme board is a role-aware React client backed by Supabase Row Level Security. The browser UI improves usability, but database policies remain the privacy boundary.

## Roles and data boundaries

- `lvnc_admin`: operates the programme and can coordinate all participating companies.
- `startup_member`: can see shared programme data plus only its own targeted records, responses, messages, and availability.
- `partner_observer`: receives the shared, read-only programme and opportunity view. It is not a participating company and must never inherit startup write actions or private coordination data.

Any new feature should be checked from all three perspectives. Hiding a control is not sufficient; its underlying Supabase table or RPC must enforce the same boundary.

## Frontend modules

- `components/AuthGate.tsx` resolves the signed-in profile before loading the programme application.
- `components/AppEntry.tsx` is the lazy-loading boundary, keeping the large operational bundle out of the unauthenticated entry path.
- `App.tsx` owns application state and coordinates the operational views.
- `components/form-controls.tsx` contains shared form primitives.
- `components/programme-info-pages.tsx` contains low-coupling information and resource pages.
- `lib/schedule-domain.ts` contains pure schedule and meeting rules.
- `lib/schedule-persistence.ts` converts client models into database write payloads.
- `lib/supabase-mappers.ts` converts database query results into client models and handles legacy PostgREST relation shapes.
- `types.ts` defines the shared role and programme data contracts.

Pure domain, persistence, and mapping changes should receive unit tests beside their module. Role or workflow changes should also receive a browser check.

## Change checklist

1. Decide which roles and organisations may read and write the new data.
2. Update RLS first when the data boundary changes.
3. Keep database row shapes inside `lib/supabase-mappers.ts`, not presentation components.
4. Keep database write payloads inside `lib/schedule-persistence.ts`.
5. Put reusable business rules in `lib/schedule-domain.ts` and test edge cases.
6. Run `npm run test`, `npm run lint`, `npm run typecheck`, and `npm run build`.
7. Smoke-test administrator, startup, and partner-observer views before production deployment.

## Refactoring direction

`App.tsx` still coordinates the most coupled calendar, meeting, and dialog workflows. Extract a view only when its state contract is clear; prefer small, tested boundaries over moving tightly coupled code without reducing complexity. The next useful seams are the calendar views and the business-meeting workspace.
