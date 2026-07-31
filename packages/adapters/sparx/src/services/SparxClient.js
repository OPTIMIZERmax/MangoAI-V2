export class SparxClient {
  constructor(browserManager) {
    this.browserManager = browserManager;
  }

  async goto(url) {
    return await this.browserManager.goto(url);
  }

  async gotoHome() {
    return await this.goto("https://www.sparxmaths.uk");
  }

  async gotoLogin() {
    return await this.goto(
      "https://login.sparxmaths.uk"
    );
  }

  async getCurrentUrl() {
    return this.browserManager.getPage().url();
  }

  async getTitle() {
    return await this.browserManager.getPage().title();
  }

  detectPageType(url, title = "") {
    url = url.toLowerCase();
    title = title.toLowerCase();

    if (url.includes("welcome")) {
      return "welcome";
    }

    if (url.includes("selectschool") || title.includes("select school")) {
      return "school-selection";
    }

    if (url.includes("login") || title.includes("login")) {
      return "login";
    }

    if (url.includes("student") || title.includes("dashboard")) {
      return "dashboard";
    }

    return "unknown";
}

  async getLoginPageInfo() {
    await this.gotoLogin();

    const url = await this.getCurrentUrl();
    const title = await this.getTitle();

    return {
  success: true,
  url,
  title,
  pageType: this.detectPageType(url, title)
};
  }

  async getSiteInfo() {
    await this.gotoHome();

    const url = await this.getCurrentUrl();
    const title = await this.getTitle();

    return {
      success: true,
      url,
      title,
      pageType: this.detectPageType(url, title)
    };
  }

  async selectSchool(schoolName) {
  const page = this.browserManager.getPage();

  const title = await page.title();

  if (!title.includes("Select School")) {
    return {
      success: false,
      error: "Not on school selection page"
    };
  }

  const schools = await page.locator("a").allTextContents();

  return {
    success: true,
    availableSchools: schools,
    requestedSchool: schoolName ?? null
  };
}

  async healthCheck() {
    return await this.getSiteInfo();
  }
}

export default SparxClient;