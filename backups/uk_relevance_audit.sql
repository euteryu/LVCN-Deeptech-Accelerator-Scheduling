-- UK relevance audit for potential business meetings.
-- Read-only: this query does not modify database records.

WITH meetings AS (
  SELECT
    pm.id,
    o.name AS startup,
    pm.institution_name,
    pm.category,
    pm.status,
    pm.location,
    pm.external_url,
    pm.next_action,
    pm.startup_visible_note,
    d.contact_name,
    d.contact_email,
    d.internal_note,
    lower(concat_ws(' ',
      pm.institution_name,
      pm.location,
      pm.external_url,
      pm.next_action,
      pm.startup_visible_note,
      d.internal_note
    )) AS evidence
  FROM public.potential_meetings AS pm
  JOIN public.organisations AS o
    ON o.id = pm.organisation_id
  LEFT JOIN public.potential_meeting_admin_details AS d
    ON d.potential_meeting_id = pm.id
)
SELECT
  *,
  CASE
    WHEN evidence ~ '\m(london|cambridge|oxford|manchester|birmingham|bristol|leeds|edinburgh|glasgow|england|scotland|wales|northern ireland|united kingdom|uk)\M'
      OR evidence ~ '\.co\.uk\M'
      THEN 'UK evidence recorded'
    WHEN evidence ~ '\m(united states|usa|new york|san francisco|california|boston|austin|miami)\M'
      THEN 'Review - US-only indicator'
    ELSE 'Unverified - confirm UK office, subsidiary, or UK meeting location'
  END AS uk_relevance_assessment
FROM meetings
ORDER BY
  CASE
    WHEN evidence ~ '\m(united states|usa|new york|san francisco|california|boston|austin|miami)\M' THEN 1
    WHEN evidence ~ '\m(london|cambridge|oxford|manchester|birmingham|bristol|leeds|edinburgh|glasgow|england|scotland|wales|northern ireland|united kingdom|uk)\M'
      OR evidence ~ '\.co\.uk\M' THEN 3
    ELSE 2
  END,
  institution_name;
