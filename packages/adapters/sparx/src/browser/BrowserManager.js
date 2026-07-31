import { chromium } from "playwright";

export class BrowserManager {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  async initialize() {
    this.browser = await chromium.launch({
      headless: false
    });

    this.context = await this.browser.newContext();

    this.page = await this.context.newPage();

    console.log("Browser started");
  }

  async goto(url) {
    if (!this.page) {
      throw new Error("Browser has not been initialized.");
    }

    await this.page.goto(url);

    return this.page.url();
  }

  getBrowser() {
  if (!this.browser) {
    throw new Error("Browser has not been initialized.");
  }

  return this.browser;
}

getContext() {
  if (!this.context) {
    throw new Error("Browser context has not been initialized.");
  }

  return this.context;
}

getPage() {
  if (!this.page) {
    throw new Error("Browser page has not been initialized.");
  }

  return this.page;
}
  
  async shutdown() {
    if (this.browser) {
      await this.browser.close();
    }

    this.browser = null;
    this.context = null;
    this.page = null;

    console.log("Browser closed");
  }
}