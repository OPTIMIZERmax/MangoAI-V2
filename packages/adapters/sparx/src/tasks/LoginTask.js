export class LoginTask {
  constructor(client, sessionManager) {
    this.client = client;
    this.sessionManager = sessionManager;
  }

  async execute(taskPayload = {}, context = {}) {
    const {
      school,
      email,
      username,
      password,
      method = "password"
    } = taskPayload;

    try {
      // --------------------------------------------------------
      // 1. Check whether the saved browser session is already
      //    authenticated.
      // --------------------------------------------------------

      console.log("[Sparx] Checking existing session...");

      const alreadyLoggedIn =
        await this.client.isLoggedIn();

      if (alreadyLoggedIn) {
        console.log(
          "[Sparx] Existing saved session is authenticated."
        );

        if (context.reportProgress) {
          await context.reportProgress(
            100,
            "Existing Sparx session is already authenticated"
          );
        }

        return {
          success: true,
          loggedIn: true,
          method: "saved-session",
          url: await this.client.getCurrentUrl?.()
        };
      }

      // --------------------------------------------------------
      // 2. No authenticated session exists.
      // --------------------------------------------------------

      if (!school) {
        return {
          success: false,
          loggedIn: false,
          error: "School name was not provided"
        };
      }

      if (context.reportProgress) {
        await context.reportProgress(
          20,
          "Opening Sparx login page"
        );
      }

      await this.client.gotoLogin();

      // --------------------------------------------------------
      // 3. Select school.
      // --------------------------------------------------------

      if (context.reportProgress) {
        await context.reportProgress(
          40,
          "Selecting school"
        );
      }

      await this.client.searchSchool(school);

      const schoolResult =
        await this.client.selectSchool(school);

      if (schoolResult && !schoolResult.success) {
        return {
          success: false,
          loggedIn: false,
          stage: "school-selection",
          ...schoolResult
        };
      }

      // --------------------------------------------------------
      // 4. Microsoft authentication.
      // --------------------------------------------------------

      if (method === "microsoft") {
        if (context.reportProgress) {
          await context.reportProgress(
            60,
            "Opening Microsoft login"
          );
        }

        const result =
          await this.client.loginWithMicrosoft({
            email
          });

        if (result?.success || result?.loggedIn) {
          await this.sessionManager.saveSession();

          if (context.reportProgress) {
            await context.reportProgress(
              100,
              "Sparx authentication complete"
            );
          }
        }

        return result;
      }

      if (method === "password") {
        if (!username || !password) {
          return {
            success: false,
            loggedIn: false,
            method,
            error: "Username and password are required."
          };
        }

        await this.client.enterUsername(username);
        await this.client.enterPassword(password);
        await this.client.submitLogin();

        const loggedIn = await this.client.isLoggedIn();

        if (loggedIn) {
          await this.sessionManager?.saveSession?.();
        }

        return {
          success: loggedIn,
          loggedIn,
          method
        };
      }

      return {
        success: false,
        loggedIn: false,
        method,
        error: `Unsupported login method: ${method}`
      };

    } catch (error) {
      console.error(
        "[Sparx] Login error:",
        error
      );

      return {
        success: false,
        loggedIn: false,
        error: error.message
      };
    }
  }
}

export default LoginTask;
