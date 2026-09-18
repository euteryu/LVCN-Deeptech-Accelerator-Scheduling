import { chromium } from '../tmp/qa-browser/node_modules/playwright/index.mjs';
const browser=await chromium.launch({channel:'chrome',headless:true});
const p=await browser.newPage({viewport:{width:1440,height:1000}});
p.on('console',m=>{if(m.type()==='error'||m.type()==='warning')console.log(m.type(),m.text().replace(/access_token=[^&\s]+/g,'access_token=REDACTED'));});
p.on('websocket',ws=>{console.log('Socket created');ws.on('socketerror',e=>console.log('Socket error',e));ws.on('framereceived',f=>{try{const m=JSON.parse(String(f.payload));if(['system','phx_reply'].includes(m.event))console.log(m.event,JSON.stringify(m.payload));}catch{}});});
try{
await p.goto('https://lvcn-deeptech-accelerator-scheduling.pages.dev');
await p.getByPlaceholder('you@company.com').fill('test@testuser.co.uk');
await p.getByRole('button',{name:'Open programme board'}).click();
await p.getByRole('button',{name:'Open account menu'}).waitFor();
await p.waitForTimeout(20000);
}catch(e){console.log('Page',await p.locator('body').innerText());throw e;}finally{await browser.close();}
