export class SiteInfoTask {
  constructor(client) {
    this.client = client;
  }

  async execute() {
    return await this.client.getSiteInfo();
  }
}

export default SiteInfoTask;