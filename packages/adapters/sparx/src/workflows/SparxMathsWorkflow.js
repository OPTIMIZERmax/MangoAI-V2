import { TaskRunner } from "../tasks/TaskRunner.js";

export class SparxMathsWorkflow {
  constructor(adapter) {
    this.adapter = adapter;
    this.taskRunner = new TaskRunner(adapter);
  }

  async start(context) {
    console.log("Starting Sparx Maths workflow");

    const site = await this.taskRunner.run(
      "site-info",
      {},
      context
    );

    console.log("Site:", site);

    const session = await this.taskRunner.run(
      "session-status",
      {},
      context
    );

    console.log("Session:", session);

    return {
      success: true,
      site,
      session
    };
  }
}