export class SessionStatusTask {
  constructor(sessionManager) {
    this.sessionManager = sessionManager;
  }

  async execute() {
    return {
      success: true,
      loggedIn: await this.sessionManager.isLoggedIn()
    };
  }
}

export default SessionStatusTask;