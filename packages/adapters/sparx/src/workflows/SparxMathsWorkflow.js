export class SparxMathsWorkflow {
  constructor(adapter) {
    this.adapter = adapter;
  }

  async start(context = {}) {
    console.log("[SparxWorkflow] Starting Sparx Maths workflow...");

    if (!this.adapter.taskRunner) {
      throw new Error(
        "Sparx TaskRunner has not been initialized."
      );
    }

    const taskRunner = this.adapter.taskRunner;

    /*
     * ------------------------------------------------------------
     * 1. Check basic Sparx site information
     * ------------------------------------------------------------
     */
    console.log("[SparxWorkflow] Checking site...");

    const site = await taskRunner.execute(
      {
        action: "site-info"
      },
      context
    );

    console.log("[SparxWorkflow] Site:", site);

    if (!site?.success) {
      return {
        success: false,
        stage: "site-info",
        site,
        error: "Unable to inspect Sparx site."
      };
    }

    /*
     * ------------------------------------------------------------
     * 2. Check authentication/session
     * ------------------------------------------------------------
     */
    console.log("[SparxWorkflow] Checking session...");

    const session = await taskRunner.execute(
      {
        action: "session-status"
      },
      context
    );

    console.log("[SparxWorkflow] Session:", session);

    if (!session?.success || !session.loggedIn) {
      console.log(
        "[SparxWorkflow] Sparx session is not authenticated."
      );

      return {
        success: false,
        stage: "session-status",
        site,
        session,
        requiresLogin: true,
        error: "Sparx session is not authenticated."
      };
    }

    /*
     * ------------------------------------------------------------
     * 3. Inspect homework
     * ------------------------------------------------------------
     *
     * HomeworkInspectTask should ONLY inspect/read the homework
     * page at this stage.
     *
     * It should not submit answers or modify homework.
     */
    console.log("[SparxWorkflow] Inspecting homework...");

    const homework = await taskRunner.execute(
      {
        action: "homework-inspect"
      },
      context
    );

    console.log("[SparxWorkflow] Homework:", homework);

    if (!homework?.success) {
      return {
        success: false,
        stage: "homework-inspect",
        site,
        session,
        homework,
        error: "Unable to inspect Sparx homework."
      };
    }

    /*
     * ------------------------------------------------------------
     * 4. Workflow complete
     * ------------------------------------------------------------
     */
    console.log(
      "[SparxWorkflow] Sparx Maths workflow completed successfully."
    );

    return {
      success: true,

      site,

      session: {
        success: session.success,
        loggedIn: session.loggedIn
      },

      homework,

      authenticated: true,

      /*
       * Useful for future stages:
       *
       * inspect -> understand -> solve -> review -> submit
       *
       * For now we stop after inspection.
       */
      nextStage: "solve"
    };
  }
}

export default SparxMathsWorkflow;

