// Exercises real startup permissions using only explicitly labelled QA records.
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
const env = Object.fromEntries(readFileSync('.env.local','utf8').split(/\r?\n/).filter(line=>line.includes('=')).map(line=>{const i=line.indexOf('=');return [line.slice(0,i),line.slice(i+1).trim()];}));
const client = createClient(env.VITE_SUPABASE_URL,env.VITE_SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const checked = result => {if(result.error) throw new Error(result.error.message); return result.data;};
try {
  const auth = checked(await client.auth.signInAnonymously());
  const [profile] = checked(await client.rpc('claim_quick_access',{access_email:'test@testuser.co.uk'}));
  assert.equal(profile.role,'startup_member');
  console.log('Decision relation shape',JSON.stringify(checked(await client.from('potential_meetings').select('institution_name,potential_meeting_decisions(decision,admin_reviewed_at)'))));
  const meetings = checked(await client.from('potential_meetings').select('id,organisation_id,institution_name,potential_meeting_admin_details(contact_name,internal_note)'));
  assert.equal(meetings.length,3);
  assert(meetings.every(m=>m.organisation_id===profile.organisation_id && m.institution_name.startsWith('[TEST]')));
  assert(meetings.every(m=>!m.potential_meeting_admin_details?.length));
  const events = checked(await client.from('schedule_events').select('id,title,visibility_scope,schedule_item_organisations(organisation_id),event_responses(organisation_id,decision,note,updated_at,admin_reviewed_at)'));
  const fixtures=events.filter(e=>e.title.startsWith('[TEST]'));
  assert.equal(fixtures.length,3);
  assert(events.every(e=>e.visibility_scope==='cohort'||e.schedule_item_organisations.some(o=>o.organisation_id===profile.organisation_id)));
  const payload={potential_meeting_id:meetings[0].id,updated_by:auth.user.id,admin_reviewed_at:null,admin_reviewed_by:null};
  for(const decision of ['going','pass','undecided']) {
    checked(await client.from('potential_meeting_decisions').upsert({...payload,decision},{onConflict:'potential_meeting_id'}));
    const row=checked(await client.from('potential_meeting_decisions').select('decision,admin_reviewed_at').eq('potential_meeting_id',meetings[0].id).single());
    assert.equal(row.decision,decision);
    assert.equal(row.admin_reviewed_at,null);
  }
  for(const decision of ['going','pass','undecided']) {
    checked(await client.from('event_responses').upsert({schedule_item_id:fixtures[0].id,organisation_id:profile.organisation_id,decision,updated_by:auth.user.id,admin_reviewed_at:null},{onConflict:'schedule_item_id,organisation_id'}));
    const row=checked(await client.from('event_responses').select('decision').eq('schedule_item_id',fixtures[0].id).eq('organisation_id',profile.organisation_id).single());
    assert.equal(row.decision,decision);
  }
  console.log('PASS: test login; three isolated prospects; three targeted events; private contact data hidden; schedule and prospect accept/reject/pending persist. QA decisions restored to pending.');
} finally {
  await client.auth.signOut();
}
