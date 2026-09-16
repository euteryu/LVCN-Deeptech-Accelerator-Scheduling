// Supabase Edge Function: send grouped schedule-change emails through Resend.
// Required secrets: RESEND_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
// DIGEST_FROM_EMAIL. Deploy with JWT verification disabled because Cron invokes it.

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendKey = Deno.env.get("RESEND_API_KEY")!;
const from = Deno.env.get("DIGEST_FROM_EMAIL")!;

const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" };

const label = (entry: any) => {
  const details = entry.change_log.details ?? {};
  const title = details.title ?? details.note ?? details.decision ?? "schedule item";
  return `${entry.change_log.action}: ${title}`;
};

Deno.serve(async () => {
  const due = new Date().toISOString();
  const response = await fetch(`${supabaseUrl}/rest/v1/notification_digest_queue?select=id,recipient_email,change_log(id,entity_type,action,details)&delivered_at=is.null&deliver_after=lte.${encodeURIComponent(due)}`, { headers });
  if (!response.ok) return new Response(await response.text(), { status: 500 });
  const rows = await response.json();
  const grouped = new Map<string, any[]>();
  for (const row of rows) grouped.set(row.recipient_email, [...(grouped.get(row.recipient_email) ?? []), row]);

  for (const [email, entries] of grouped) {
    const items = entries.slice(0, 20).map((entry) => `<li>${label(entry)}</li>`).join("");
    const more = entries.length > 20 ? `<p>Plus ${entries.length - 20} further changes.</p>` : "";
    const mail = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, to: [email], subject: `LVCN schedule update: ${entries.length} change${entries.length === 1 ? "" : "s"}`, html: `<h2>LVCN programme schedule</h2><p>Your grouped update:</p><ul>${items}</ul>${more}<p>Open the programme board for full details.</p>` }) });
    if (!mail.ok) continue;
    await fetch(`${supabaseUrl}/rest/v1/notification_digest_queue?id=in.(${entries.map((entry) => entry.id).join(",")})`, { method: "PATCH", headers: { ...headers, Prefer: "return=minimal" }, body: JSON.stringify({ delivered_at: new Date().toISOString() }) });
  }
  return Response.json({ queued: rows.length, recipients: grouped.size });
});
