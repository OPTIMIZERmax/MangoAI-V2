export class LoginPageTask {
  constructor(client) {
    this.client = client;
  }

  async execute() {
    return await this.client.getLoginPageInfo();
  }
}

export default LoginPageTask;