import { BaseAdapter } from "@mango/engine";
import { BrowserManager } from "./browser/BrowserManager.js";
import { SparxClient } from "./services/SparxClient.js";
import { SessionManager } from "./auth/SessionManager.js";
import TaskRunner from "./tasks/TaskRunner.js";

export class SparxAdapter extends BaseAdapter {
  constructor() {
    super();

    this.browserManager = new BrowserManager();
    this.client = new SparxClient(this.browserManager);
    this.sessionManager = new SessionManager(this.browserManager);

    this.taskRunner = new TaskRunner(
      this.client,
      this.sessionManager
    );
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

    await context.reportProgress(
      10,
      "Browser initialized"
    );

    return await this.taskRunner.execute(taskPayload);
  }

  async shutdown() {
    await this.browserManager.shutdown();

    await super.shutdown();

    console.log("Sparx adapter shut down");
  }
}

export default SparxAdapter;