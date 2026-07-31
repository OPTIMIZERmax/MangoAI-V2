export class SchoolSelectionTask {
  constructor(client) {
    this.client = client;
  }

  async execute(taskPayload) {
    if (!taskPayload.school) {
      return {
        success: false,
        error: "School name was not provided"
      };
    }

    return await this.client.selectSchool(
      taskPayload.school
    );
  }
}

export default SchoolSelectionTask;