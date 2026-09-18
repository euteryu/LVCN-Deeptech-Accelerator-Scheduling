param(
  [string]$ProjectRef = "afoybntrtowmvpjwjvjh",
  [switch]$IncludeHmeSquare
)

$ErrorActionPreference = "Stop"

if (-not $env:SUPABASE_ACCESS_TOKEN) {
  throw "Set SUPABASE_ACCESS_TOKEN to a Supabase personal access token, then run this script again."
}
if (-not $env:SUPABASE_DB_PASSWORD) {
  throw "Set SUPABASE_DB_PASSWORD to the remote database password, then run this script again."
}

# db push uses migration timestamps and Supabase's migration history, so it
# applies missing prerequisites in order and never reruns an applied migration.
npx.cmd supabase db push --project-ref $ProjectRef --include-all --password $env:SUPABASE_DB_PASSWORD
if ($LASTEXITCODE -ne 0) { throw "Migration deployment failed." }

if ($IncludeHmeSquare) {
  npx.cmd supabase db query --project-ref $ProjectRef --file "supabase/hme_square_2026.sql"
  if ($LASTEXITCODE -ne 0) { throw "HME Square data deployment failed." }
}

Write-Host "Supabase deployment completed."
