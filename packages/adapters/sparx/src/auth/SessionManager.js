import fs from "node:fs";

export class SessionManager {
  constructor(browserManager) {
    this.browserManager = browserManager;

    this.storageStatePath =
      "packages/adapters/sparx/storageState.json";
  }

  async isLoggedIn() {
    const page = this.browserManager.getPage();

    if (!page) {
      console.log("[Sparx] Browser page is not available.");
      return false;
    }

    console.log("[Sparx] Checking session...");

    try {
      await page.goto(
        "https://maths.sparx-learning.com/student/homework",
        {
          waitUntil: "domcontentloaded",
          timeout: 30000
        }
      );

      await page.waitForTimeout(1500);

      const url = page.url();
      const title = await page.title();

      console.log("[Sparx] Final URL:", url);
      console.log("[Sparx] Page title:", title);

      const isAuthDomain =
        url.includes("auth.sparx-learning.com");

      const isStudentDomain =
        url.includes("maths.sparx-learning.com/student/");

      const isHomeworkPage =
        url.includes(
          "maths.sparx-learning.com/student/homework"
        );

      const pageText = (
        await page.locator("body").innerText().catch(() => "")
      ).toLowerCase();

      const loginIndicators = [
        "log in",
        "login",
        "username",
        "password",
        "sign in"
      ];

      const hasLoginIndicator = loginIndicators.some(
        (indicator) => pageText.includes(indicator)
      );

      const loggedIn =
        !isAuthDomain &&
        isStudentDomain &&
        isHomeworkPage &&
        !hasLoginIndicator;

      if (loggedIn) {
        console.log("[Sparx] Session is authenticated.");
      } else {
        console.log("[Sparx] Session is NOT authenticated.");
      }

      return loggedIn;
    } catch (error) {
      console.error(
        "[Sparx] Session check failed:",
        error.message
      );

      return false;
    }
  }
  async verifySession() {
    console.log(
      "[SessionManager] Verifying saved Sparx session..."
    );

    const page = this.browserManager.getPage();

    if (!page) {
      return {
        success: false,
        loggedIn: false,
        url: null,
        error: "Browser page is not available."
      };
    }

    const loggedIn = await this.isLoggedIn();

    const result = {
      success: true,
      loggedIn,
      url: page.url()
    };

    console.log(
      "[Sparx] Session verification:",
      result
    );

    return result;
  }

  async loginWithCookies(cookies, context) {
    if (!Array.isArray(cookies) || cookies.length === 0) {
      return {
        success: false,
        loggedIn: false,
        error: "No cookies supplied."
      };
    }

    const browserContext =
      this.browserManager.getContext();

    const page = this.browserManager.getPage();

    try {
      console.log(
        "[Sparx] Installing supplied cookies..."
      );

      await browserContext.addCookies(
        cookies.map((cookie) => ({
          ...cookie,
          domain:
            cookie.domain ||
            ".sparx-learning.com",
          path: cookie.path || "/"
        }))
      );

      if (context?.reportProgress) {
        await context.reportProgress(
          50,
          "Cookies installed"
        );
      }

      const loggedIn = await this.isLoggedIn();

      if (!loggedIn) {
        return {
          success: false,
          loggedIn: false,
          url: page.url(),
          error:
            "Supplied cookies did not produce an authenticated Sparx session."
        };
      }

      await this.saveSession();

      if (context?.reportProgress) {
        await context.reportProgress(
          100,
          "Sparx session authenticated"
        );
      }

      return {
        success: true,
        loggedIn: true,
        url: page.url()
      };
    } catch (error) {
      console.error(
        "[Sparx] Cookie login failed:",
        error.message
      );

      return {
        success: false,
        loggedIn: false,
        error: error.message
      };
    }
  }

  async waitForLogin(options = {}) {
    const page = this.browserManager.getPage();

    if (!page) {
      throw new Error(
        "Browser page is not available."
      );
    }

    const timeout =
      options.timeout || 120000;

    const interval =
      options.interval || 1500;

    const start = Date.now();

    console.log(
      "[Sparx] Waiting for successful login..."
    );

    while (Date.now() - start < timeout) {
      await page.waitForTimeout(interval);

      const url = page.url();

      /*
       * NEVER detect login merely because the user
       * interacted with the auth page.
       *
       * We require the authenticated student URL.
       */
      const authenticatedUrl =
        url.includes(
          "maths.sparx-learning.com/student/"
        ) &&
        !url.includes(
          "auth.sparx-learning.com"
        );

      if (authenticatedUrl) {
        const loggedIn =
          await this.isLoggedIn();

        if (loggedIn) {
          console.log(
            "[Sparx] Login detected."
          );

          console.log(
            "[Sparx] Authenticated URL:",
            page.url()
          );

          await this.saveSession();

          console.log(
            "[Sparx] ✅ New session saved."
          );

          return {
            success: true,
            loggedIn: true,
            url: page.url()
          };
        }
      }
    }

    console.log(
      "[Sparx] ❌ Login timeout."
    );

    return {
      success: false,
      loggedIn: false,
      url: page.url(),
      error:
        "Timed out waiting for successful Sparx login."
    };
  }

  async saveSession() {
    const context =
      this.browserManager.getContext();

    if (!context) {
      throw new Error(
        "Browser context is not available."
      );
    }

    await context.storageState({
      path: this.storageStatePath
    });

    console.log(
      "Session saved:",
      this.storageStatePath
    );

    return this.storageStatePath;
  }

  async loadSession() {
    if (
      !fs.existsSync(
        this.storageStatePath
      )
    ) {
      return false;
    }

    return true;
  }

  async clearSession() {
    if (
      fs.existsSync(
        this.storageStatePath
      )
    ) {
      fs.unlinkSync(
        this.storageStatePath
      );

      console.log(
        "[Sparx] Saved session cleared."
      );
    }

    return true;
  }
}

export default SessionManager;



