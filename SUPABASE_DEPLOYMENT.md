# Supabase deployment

Migrations must not be pasted into the browser SQL editor. The repository is the source of truth and the deployment script applies pending migrations in timestamp order.

One-time setup:

1. Create a Supabase personal access token with access to project `afoybntrtowmvpjwjvjh`.
2. In PowerShell, set the credentials for the current session. Do not commit either secret:

```powershell
$env:SUPABASE_ACCESS_TOKEN = "your-personal-access-token"
$env:SUPABASE_DB_PASSWORD = "your-database-password"
```

Deploy all pending schema migrations and the idempotent HME Square records:

```powershell
.\scripts\deploy-supabase.ps1 -IncludeHmeSquare
```

The script uses `supabase db push --include-all`, which reads Supabase migration history and only runs missing timestamped migrations in dependency order. It then runs the idempotent HME data seed. To deploy schema only, omit `-IncludeHmeSquare`.
