export class HealthCheckTask {
  constructor(client) {
    this.client = client;
  }

  async execute() {
    return await this.client.healthCheck();
  }
}

export default HealthCheckTask;