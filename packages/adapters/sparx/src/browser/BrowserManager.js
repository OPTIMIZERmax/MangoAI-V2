import { chromium } from "playwright";
import fs from "node:fs";

export class BrowserManager {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  async initialize(options = {}) {
    this.browser = await chromium.launch({
  headless: false,
  args: [
    "--start-maximized"
  ]
});

    const contextOptions = {};

    // Load a previously saved Playwright session if available.
    if (
      options.storageState &&
      fs.existsSync(options.storageState)
    ) {
      contextOptions.storageState = options.storageState;

      console.log(
        "Loading saved browser session:",
        options.storageState
      );
    } else if (options.storageState) {
      console.log(
        "No saved browser session found. Starting a fresh session."
      );
    }

    this.context = await this.browser.newContext({
  ...contextOptions,
  viewport: null
});

    this.page = await this.context.newPage();

    console.log("Browser started");
  }

  async goto(url) {
    if (!this.page) {
      throw new Error(
        "Browser has not been initialized."
      );
    }

    await this.page.goto(url);

    return this.page.url();
  }

  getBrowser() {
    if (!this.browser) {
      throw new Error(
        "Browser has not been initialized."
      );
    }

    return this.browser;
  }

  getContext() {
    if (!this.context) {
      throw new Error(
        "Browser context has not been initialized."
      );
    }

    return this.context;
  }

  getPage() {
    if (!this.page) {
      throw new Error(
        "Browser has not been initialized."
      );
    }

    return this.page;
  }

  async saveStorageState(filePath) {
    if (!this.context) {
      throw new Error(
        "Browser context has not been initialized."
      );
    }

    await this.context.storageState({
      path: filePath
    });

    console.log(
      "Browser session saved:",
      filePath
    );
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

export default BrowserManager;



