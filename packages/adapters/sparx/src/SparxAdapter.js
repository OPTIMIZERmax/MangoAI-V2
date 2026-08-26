import { BaseAdapter } from "@mango/engine";

import { BrowserManager } from "./browser/BrowserManager.js";
import { SparxClient } from "./services/SparxClient.js";
import { SessionManager } from "./auth/SessionManager.js";

import TaskRunner from "./tasks/TaskRunner.js";
import { SparxMathsWorkflow } from "./workflows/SparxMathsWorkflow.js";

export class SparxAdapter extends BaseAdapter {
  constructor() {
    super();

    this.browserManager = new BrowserManager();

    this.client = new SparxClient(
      this.browserManager
    );

    this.sessionManager = new SessionManager(
      this.browserManager
    );

    this.taskRunner = new TaskRunner(
      this.client,
      this.sessionManager
    );

    this.workflow = new SparxMathsWorkflow(this);
  }

  get metadata() {
    return {
      id: "sparx",
      name: "Sparx Adapter",
      version: "1.0.0-alpha",
      engineRange: "^1.0.0-alpha",
      capabilities: [
        "browser"
      ]
    };
  }

  async initialize(config = {}) {
  const storageStatePath =
    "packages/adapters/sparx/storageState.json";

  await this.browserManager.initialize({
    storageState: storageStatePath
  });

  await super.initialize(config);
  console.log("Sparx adapter initialized");
}

  async executeTask(taskPayload, context) {
    console.log(
      "Sparx executing:",
      taskPayload
    );

    await context.reportProgress(
      10,
      "Browser initialized"
    );

    // Cookie login
    if (
      taskPayload.action === "login" &&
      taskPayload.method === "cookies"
    ) {
      const cookies =
        this.parseCookies(taskPayload.cookies);

      return await this.sessionManager.loginWithCookies(
        cookies,
        context
      );
    }

    // Full workflow
    if (
      taskPayload.action === "workflow-start"
    ) {
      return await this.workflow.start(
        context
      );
    }

    // Individual tasks
    return await this.taskRunner.execute(
      taskPayload,
      context
    );
  }

  async shutdown() {
    await this.browserManager.shutdown();

    await super.shutdown();

    console.log(
      "Sparx adapter shut down"
    );
  }

  parseCookies(cookies) {
    if (Array.isArray(cookies)) {
      return cookies;
    }

    if (!cookies) {
      return [];
    }

    return String(cookies)
      .split(";")
      .map((cookie) => {
        const [name, ...rest] =
          cookie.trim().split("=");

        return {
          name,
          value: rest.join("=")
        };
      });
  }
}

export default SparxAdapter;











