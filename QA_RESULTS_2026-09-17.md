# Live TEST_COMPANY browser test

Tested Cloudflare production using two isolated headless Chrome contexts: TEST_COMPANY startup and the authorised Minseok admin role. Only labelled QA records were changed. Latest tested deployment: 54770edb.

## Result: 12 checks passed, 2 failed

Passed: admin landing page; sample costs and both overlap labels; correct company name in decision drawer; rejected schedule item disappears; rejection persists after reload; rejected item remains in My Decisions; accepted prospect persists after reload; admin inbox identifies TEST_COMPANY after refresh; mark reviewed clears the prospect; a message submitted before a decision is visible to admin after refresh; four tutorial images load; mobile page has no document-width overflow.

Failed: prospect acceptance does not automatically arrive in the other browser's admin inbox; a later changed decision does not automatically return after review. Reloading the admin page shows current records. Database publication now includes both prospect tables, but this alone did not resolve live delivery in this browser test. The live transport still needs investigation. Tests do not establish whether the cause is deployment configuration, network connectivity or client subscription behaviour.

## Fixes deployed during testing

- Handle PostgREST one-to-one relation objects so decisions, review markers and private contact fields load correctly.
- Read live company names in the drawer and action inbox.
- Marking a prospect reviewed updates review fields without overwriting the saved decision or its actor.
- Sending a note before choosing a decision now creates a pending response instead of doing nothing.
- Publish potential meeting and decision changes to Supabase Realtime.

Build and five unit tests passed. Lint has no errors and two existing unused-disable warnings. No browser JavaScript exceptions were observed. Backend isolation/decision persistence checks also passed in the previous run.

## Limits and remaining release issues

This is not full release certification. Verified identity, imported institution aliases/URLs, remaining hard-coded company lists, network failure handling, editing/creation, exports, all zoom levels and all roles still need coverage. The current email-only quick access does not verify email ownership. Test data contributes to cohort metrics until removed/excluded. Browser width was tested at 390px; actual browser zoom was not tested in this run.
