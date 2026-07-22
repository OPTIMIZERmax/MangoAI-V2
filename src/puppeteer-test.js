import puppeteer from "puppeteer";

const browser = await puppeteer.launch({
  headless: true
});

const page = await browser.newPage();

await page.goto("https://example.com");

console.log("Page title:", await page.title());

await browser.close();

console.log("✅ Puppeteer working");