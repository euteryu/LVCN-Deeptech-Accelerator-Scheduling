import { chromium } from '../tmp/qa-browser/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
const startup=await browser.newPage({viewport:{width:1440,height:1000}});
const admin=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[]; const findings=[];
for(const p of [startup,admin]) { p.setDefaultTimeout(12000); p.on('pageerror',e=>errors.push(e.message)); p.on('dialog',d=>d.accept()); p.on('websocket',ws=>{ws.on('framereceived',frame=>{try{const m=JSON.parse(String(frame.payload));if(m.event==='system'||m.event==='phx_reply')console.log(p===admin?'ADMIN_WS':'STARTUP_WS',JSON.stringify(m.payload));}catch{}});}); }
const settle=p=>p.waitForTimeout(1600);
const nav=(p,name)=>p.getByRole('button',{name,exact:true}).first().click();
async function login(p,email){await p.goto('https://lvcn-deeptech-accelerator-scheduling.pages.dev');await p.getByPlaceholder('you@company.com').fill(email);await nav(p,'Open programme board');await p.getByRole('button',{name:'Open account menu'}).waitFor();await settle(p);}
async function resetQaFixtures(p){
  const result=await p.evaluate(async()=>{
    const storage=Object.entries(localStorage).find(([key])=>key.endsWith('-auth-token'))?.[1];
    if(!storage) throw new Error('No authenticated session was found for the QA user.');
    const token=JSON.parse(storage).access_token;
    const userId=JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).sub;
    const url='https://afoybntrtowmvpjwjvjh.supabase.co/rest/v1';
    const headers={apikey:'sb_publishable_uTwRzL770ChM0akgYK2fDw_6Ta0v0Fy',Authorization:`Bearer ${token}`,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=representation'};
    const get=async(path)=>{const response=await fetch(`${url}${path}`,{headers});if(!response.ok)throw new Error(await response.text());return response.json();};
    const put=async(path,body)=>{const response=await fetch(`${url}${path}`,{method:'POST',headers,body:JSON.stringify(body)});if(!response.ok)throw new Error(await response.text());};
    const [profile]=await get(`/profiles?id=eq.${userId}&select=organisation_id`);
    const schedule=await get("/schedule_items?title=like.%5BTEST%5D*&select=id");
    await Promise.all(schedule.map((item)=>put('/event_responses?on_conflict=schedule_item_id,organisation_id',{schedule_item_id:item.id,organisation_id:profile.organisation_id,decision:'undecided',note:null,updated_by:userId,admin_reviewed_at:null,admin_reviewed_by:null})));
    const meetings=await get('/potential_meetings?institution_name=like.%5BTEST%5D*&select=id');
    await Promise.all(meetings.map((meeting)=>put('/potential_meeting_decisions?on_conflict=potential_meeting_id',{potential_meeting_id:meeting.id,decision:'undecided',note:null,updated_by:userId,admin_reviewed_at:null,admin_reviewed_by:null})));
    const cleanup=await fetch(`${url}/availability_blocks?title=like.%5BTEST%5D*`,{method:'DELETE',headers});
    if(!cleanup.ok) throw new Error(await cleanup.text());
    return {schedule: schedule.length, meetings: meetings.length};
  });
  if(result.schedule!==3 || result.meetings!==3) throw new Error(`QA fixture setup is incomplete: found ${result.schedule} schedule events and ${result.meetings} prospects.`);
}
async function check(name,fn){try{await fn();findings.push({name,result:'PASS'});}catch(e){findings.push({name,result:'FAIL',reason:e.message.slice(0,500)});}}
try{
 await login(startup,'test@testuser.co.uk');
 await login(admin,'minseok@lvcn.co.uk');
 await resetQaFixtures(startup); await startup.reload(); await admin.reload(); await settle(startup); await settle(admin);
 await check('Admin lands on Admin hub',async()=>assert(await admin.getByRole('heading',{name:'Admin hub',exact:true}).isVisible()));
 await check('Sample costs and both overlap labels render',async()=>{assert(await startup.getByText('Test ticket: GBP 95; fictional event, do not book.',{exact:true}).isVisible());assert.equal(await startup.getByText('Time overlap',{exact:true}).count(),2);});
 await startup.getByText('[TEST] Research partner workshop',{exact:true}).click();
 await check('Decision panel identifies TEST_COMPANY',async()=>assert((await startup.locator('body').innerText()).includes('Saves immediately for TEST_COMPANY')));
 await nav(startup,'Reject'); await settle(startup); await startup.keyboard.press('Escape');
 await check('Rejected event disappears from Schedule',async()=>assert.equal(await startup.getByText('[TEST] Research partner workshop',{exact:true}).count(),0));
 await startup.reload(); await settle(startup);
 await check('Rejection survives reload',async()=>assert.equal(await startup.getByText('[TEST] Research partner workshop',{exact:true}).count(),0));
 await nav(startup,'My decisions');
 await check('Rejected event remains in My Decisions',async()=>assert(await startup.getByText('[TEST] Research partner workshop',{exact:true}).isVisible()));
 await nav(startup,'Potential Biz Meets'); await settle(startup);
 const prospect='[TEST] Sample Robotics Investor';
 await startup.getByRole('row').filter({hasText:prospect}).click();
 await nav(startup,'Accept'); await settle(startup);
 await check('Prospect accept persists after reload',async()=>{await startup.reload();await settle(startup);await nav(startup,'Potential Biz Meets');await settle(startup);assert((await startup.getByRole('row').filter({hasText:prospect}).innerText()).includes('Accepted'));});
 await nav(admin,'Open action inbox'); await settle(admin);
 const article=admin.locator('article').filter({hasText:prospect});
 await check('Startup acceptance appears in admin inbox without reload',async()=>await article.waitFor({state:'visible',timeout:20000}));
 await check('Inbox identifies correct company',async()=>assert((await article.innerText()).includes('TEST_COMPANY')));
 await article.getByRole('button',{name:'Mark reviewed'}).click();await settle(admin);
 await check('Mark reviewed clears prospect update',async()=>await article.waitFor({state:'hidden',timeout:12000}));
 await startup.getByRole('row').filter({hasText:prospect}).click();await nav(startup,'Reject');await settle(startup);await settle(admin);
 await check('Later decision returns to admin inbox automatically',async()=>await article.waitFor({state:'visible',timeout:20000}));
 await nav(startup,'Schedule');
 await startup.getByRole('row').filter({hasText:'[TEST] Investor roundtable - overlapping afternoon'}).locator('td:visible').first().click();
 await startup.getByPlaceholder('Optional context for the programme team').fill('[TEST] Can I attend the afternoon session only?');
 await nav(startup,'Send message to LVCN'); await settle(startup);await settle(admin);
 await check('Message without an earlier decision reaches admin automatically',async()=>await admin.getByText('[TEST] Can I attend the afternoon session only?',{exact:false}).waitFor({state:'visible',timeout:20000}));
 await startup.keyboard.press('Escape');
 await check('Tutorial loads four images',async()=>{await nav(startup,'Tutorial');await settle(startup);const imgs=await startup.getByRole('dialog').locator('img').evaluateAll(ns=>ns.map(n=>({loaded:n.complete&&n.naturalWidth>0,src:n.getAttribute('src')})));assert.equal(imgs.length,4);assert(imgs.every(i=>i.loaded));await startup.keyboard.press('Escape');});
 await startup.getByRole('button',{name:'Add company work'}).click();
 await startup.locator('input[name="title"]').fill('[TEST] QA company availability');
 await startup.locator('input[name="startDate"]').fill('2026-09-18');
 await startup.locator('input[name="endDate"]').fill('2026-09-18');
 await startup.getByRole('button',{name:'Block time'}).click(); await settle(startup); await settle(admin);
 await check('Company time block is readable by the admin',async()=>assert(await admin.evaluate(async()=>{
   const storage=Object.entries(localStorage).find(([key])=>key.endsWith('-auth-token'))?.[1]; const token=JSON.parse(storage).access_token;
   const response=await fetch('https://afoybntrtowmvpjwjvjh.supabase.co/rest/v1/availability_blocks?title=eq.%5BTEST%5D%20QA%20company%20availability&select=id',{headers:{apikey:'sb_publishable_uTwRzL770ChM0akgYK2fDw_6Ta0v0Fy',Authorization:`Bearer ${token}`}});
   return response.ok && (await response.json()).length===1;
 })));
 await startup.screenshot({path:'tmp/qa-startup-final.png',fullPage:true});
 await admin.screenshot({path:'tmp/qa-admin-inbox.png',fullPage:true});
 await startup.setViewportSize({width:390,height:844});
 await check('Mobile page fits viewport',async()=>assert(await startup.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)));
 console.log(JSON.stringify({findings,errors},null,2));
}catch(e){console.log(JSON.stringify({findings,errors,fatal:e.message,startupText:(await startup.locator('body').innerText()).slice(0,10000),adminText:(await admin.locator('body').innerText()).slice(0,5000)},null,2));throw e;}finally{await browser.close();}
