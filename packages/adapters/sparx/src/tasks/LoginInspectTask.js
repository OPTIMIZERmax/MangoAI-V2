export class LoginInspectTask {
  constructor(client) {
    this.client = client;
  }

  async execute(taskPayload, context) {

    if (!taskPayload.school) {
      return {
        success: false,
        error: "School name required"
      };
    }

    await context.reportProgress(
      20,
      "Opening Sparx login page"
    );

    // Open Sparx login/school selection page first
    await this.client.gotoLogin();

    await context.reportProgress(
      40,
      "Searching school"
    );

    await this.client.searchSchool(
      taskPayload.school
    );

    await context.reportProgress(
      60,
      "Selecting school"
    );

    const schoolResult =
      await this.client.selectSchool(
        taskPayload.school
      );

    if (!schoolResult.success) {
      return schoolResult;
    }

    await context.reportProgress(
      80,
      "Inspecting login page"
    );

    return await this.client.inspectLogin();
  }
}

export default LoginInspectTask;