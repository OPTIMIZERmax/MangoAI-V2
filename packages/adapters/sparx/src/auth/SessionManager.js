export class SessionManager {
  constructor(browserManager) {
    this.browserManager = browserManager;
  }

  async isLoggedIn() {
    const page = this.browserManager.getPage();

    // Placeholder implementation
    // Later we'll detect login based on the real Sparx UI.
    return !page.url().includes("login");
  }

  async saveSession() {
    const context = this.browserManager.getContext();

    await context.storageState({
      path: "packages/adapters/sparx/storageState.json"
    });

    console.log("Session saved.");
  }

  async loadSession() {
    console.log("Session loading will be implemented in BrowserManager.");
  }

  async clearSession() {
    console.log("Session cleared (placeholder).");
  }
}

export default SessionManager;