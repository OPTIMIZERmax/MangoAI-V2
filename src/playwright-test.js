import { chromium } from "playwright";

const browser = await chromium.launch({
  headless: true
});

const page = await browser.newPage();

await page.goto("https://example.com");

console.log("Page title:", await page.title());

await browser.close();

console.log("✅ Playwright working");