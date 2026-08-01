export class LoginTask {
  constructor(client) {
    this.client = client;
  }

  async execute(taskPayload = {}) {
    const {
      school,
      username,
      password,
      method = "password"
    } = taskPayload;

    if (!school) {
      return {
        success: false,
        error: "School name was not provided"
      };
    }

    try {
      await this.client.gotoLogin();

      await this.client.searchSchool(
        school
      );

      await this.client.selectSchool(
        school
      );


      // Microsoft login
      if (method === "microsoft") {

        await this.client.loginWithMicrosoft();

        return {
          success: true,
          method: "microsoft",
          message: "Microsoft login opened"
        };
      }


      // Normal login
      if (!username) {
        return {
          success: false,
          error: "Username was not provided"
        };
      }

      if (!password) {
        return {
          success: false,
          error: "Password was not provided"
        };
      }


      await this.client.enterUsername(
        username
      );

      await this.client.enterPassword(
        password
      );

      await this.client.submitLogin();


      const loggedIn =
        await this.client.isLoggedIn();


      return {
        success: loggedIn,
        loggedIn,
        method: "password"
      };


    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default LoginTask;