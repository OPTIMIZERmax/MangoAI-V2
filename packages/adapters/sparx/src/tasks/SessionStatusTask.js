export class SessionStatusTask {
  constructor(sessionManager) {
    this.sessionManager = sessionManager;
  }

  async execute() {
    console.log("[Sparx] Checking session...");

    try {
      const result = await this.sessionManager.verifySession();

      console.log("[Sparx] Session verification:", result);

      return result;
    } catch (error) {
      console.error(
        "[Sparx] Session verification failed:",
        error.message
      );

      return {
        success: false,
        loggedIn: false,
        error: error.message
      };
    }
  }
}

export default SessionStatusTask;

