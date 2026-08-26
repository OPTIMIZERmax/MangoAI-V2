import { chromium } from "playwright";

const browser = await chromium.launch({
  headless: false
});

const page = await browser.newPage();

await page.goto(
  "https://maths.sparx-learning.com/student/homework",
  {
    waitUntil: "domcontentloaded",
    timeout: 30000
  }
);

await page.waitForTimeout(5000);

console.log("\n=== URL ===");
console.log(page.url());

console.log("\n=== TITLE ===");
console.log(await page.title());

console.log("\n=== INPUTS ===");
console.log(
  await page.locator("input").evaluateAll(elements =>
    elements.map((e, i) => ({
      index: i,
      type: e.type,
      id: e.id,
      name: e.name,
      placeholder: e.placeholder,
      ariaLabel: e.getAttribute("aria-label"),
      value: e.value
    }))
  )
);

console.log("\n=== BUTTONS ===");
console.log(
  await page.locator("button").evaluateAll(elements =>
    elements.map((e, i) => ({
      index: i,
      text: e.innerText,
      ariaLabel: e.getAttribute("aria-label"),
      type: e.type
    }))
  )
);

console.log("\n=== TEXTAREA ===");
console.log(
  await page.locator("textarea").evaluateAll(elements =>
    elements.map((e, i) => ({
      index: i,
      placeholder: e.placeholder,
      ariaLabel: e.getAttribute("aria-label")
    }))
  )
);

console.log("\n=== SELECTS ===");
console.log(
  await page.locator("select").evaluateAll(elements =>
    elements.map((e, i) => ({
      index: i,
      id: e.id,
      name: e.name
    }))
  )
);

console.log("\n=== PAGE TEXT ===");
console.log(
  (await page.locator("body").innerText()).slice(0, 10000)
);

console.log("\nBrowser left open.");
await new Promise(() => {});
