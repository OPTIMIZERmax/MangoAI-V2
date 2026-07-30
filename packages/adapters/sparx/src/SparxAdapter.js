import { BaseAdapter } from "@mango/engine";
import { BrowserManager } from "./browser/BrowserManager.js";

export class SparxAdapter extends BaseAdapter {
  constructor() {
    super();

    this.browserManager = new BrowserManager();
  }

  get metadata() {
    return {
      id: "sparx",
      name: "Sparx Adapter",
      version: "1.0.0-alpha",
      engineRange: "^1.0.0-alpha",
      capabilities: ["browser"]
    };
  }

  async initialize(config = {}) {
    await this.browserManager.initialize();

    await super.initialize(config);

    console.log("Sparx adapter initialized");
  }

  async executeTask(taskPayload, context) {
    console.log("Sparx executing:", taskPayload);

    // Temporary test - opens Google to verify Playwright works
    await this.browserManager.goto("https://www.google.com");

    await context.reportProgress(
      10,
      "Browser initialized"
    );

    return {
      success: true,
      task: taskPayload
    };
  }

  async shutdown() {
    await this.browserManager.shutdown();

    await super.shutdown();

    console.log("Sparx adapter shut down");
  }
}

export default SparxAdapter;