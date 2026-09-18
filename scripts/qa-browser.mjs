import { chromium } from '../tmp/qa-browser/node_modules/playwright/index.mjs';
const browser = await chromium.launch({channel:'chrome',headless:true});
const page = await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
try {
 await page.goto('https://lvcn-deeptech-accelerator-scheduling.pages.dev');
 await page.getByPlaceholder('you@company.com').fill('test@testuser.co.uk');
 await page.getByRole('button',{name:'Open programme board'}).click();
 await page.getByRole('button',{name:'Log out'}).count();
 await page.waitForTimeout(3500);
 console.log('BUTTONS',await page.getByRole('button').evaluateAll(nodes=>nodes.map(n=>({text:n.textContent,label:n.getAttribute('aria-label'),title:n.getAttribute('title')}))));
 await page.getByText('[TEST] Research partner workshop',{exact:true}).click();
 console.log('DETAILS',(await page.locator('body').innerText()).slice(-11000));
 console.log('ERRORS',errors);
 await page.screenshot({path:'tmp/qa-startup.png',fullPage:true});
} finally { await browser.close(); }
