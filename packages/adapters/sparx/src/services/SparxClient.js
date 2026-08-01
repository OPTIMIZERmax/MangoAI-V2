export class SparxClient {
  constructor(browserManager) {
    this.browserManager = browserManager;
  }


  getPage() {
    return this.browserManager.getPage();
  }


  async acceptCookies() {
    const page = this.getPage();

    try {
      const acceptButton = page.getByRole("button", {
        name: /accept all/i
      });

      if (await acceptButton.count() > 0) {
        await acceptButton.first().click();

        await page.waitForTimeout(1000);

        console.log("Cookies accepted");

        return true;
      }

    } catch (error) {
      console.log("No cookie popup");
    }

    return false;
  }


  async goto(url) {
    return await this.browserManager.goto(url);
  }


  async gotoHome() {
    return await this.goto(
      "https://www.sparxmaths.uk"
    );
  }


  async gotoLogin() {
    const result = await this.goto(
      "https://login.sparxmaths.uk"
    );

    await this.acceptCookies();

    return result;
  }


  async getCurrentUrl() {
    return this.getPage().url();
  }


  async getTitle() {
    return await this.getPage().title();
  }


  detectPageType(url, title = "") {

    url = url.toLowerCase();
    title = title.toLowerCase();


    if (url.includes("welcome")) {
      return "welcome";
    }


    if (
      url.includes("selectschool") ||
      title.includes("select school")
    ) {
      return "school-selection";
    }


    if (
      url.includes("login") ||
      title.includes("login")
    ) {
      return "login";
    }


    if (
      url.includes("student") ||
      title.includes("dashboard")
    ) {
      return "dashboard";
    }


    return "unknown";
  }



  async getSiteInfo() {

    await this.gotoHome();

    const url = await this.getCurrentUrl();
    const title = await this.getTitle();


    return {
      success: true,
      url,
      title,
      pageType: this.detectPageType(url,title)
    };
  }



  async searchSchool(schoolName) {

    const page = this.getPage();


    if (!schoolName) {
      throw new Error(
        "School name was not provided"
      );
    }


    await page.waitForLoadState(
      "networkidle"
    );


    const input = page.getByPlaceholder(
      "Start typing your school's name..."
    ).first();


    await input.waitFor({
      state:"visible",
      timeout:10000
    });


    await input.fill(
      schoolName
    );


    await page.waitForTimeout(
      2000
    );


    return {
      success:true,
      schoolName
    };
  }



  async selectSchool(schoolName) {

    const page = this.getPage();


    const school = page.getByText(
      schoolName,
      {
        exact:true
      }
    ).first();


    await school.waitFor({
      state:"visible",
      timeout:10000
    });


    await school.click();



    const continueButton =
      page.getByRole(
        "button",
        {
          name:/continue/i
        }
      );


    await continueButton.waitFor({
      state:"visible",
      timeout:10000
    });



    await this.acceptCookies();


    await continueButton.click();



    await page.waitForLoadState(
      "networkidle"
    );


    return {
      success:true,
      schoolSelected:schoolName
    };
  }




  async enterUsername(username) {

    const page = this.getPage();

    await this.acceptCookies();


    const input =
      page.locator(
        "#username"
      );


    await input.waitFor({
      state:"visible",
      timeout:10000
    });


    await input.fill(
      username
    );


    return {
      success:true
    };
  }





  async enterPassword(password) {

    const page = this.getPage();

    await this.acceptCookies();


    const input =
      page.locator(
        "#password"
      );


    await input.waitFor({
      state:"visible",
      timeout:10000
    });


    await input.fill(
      password
    );


    return {
      success:true
    };
  }





  async submitLogin() {

    const page = this.getPage();


    await this.acceptCookies();


    const button =
      page.getByRole(
        "button",
        {
          name:/log in/i
        }
      ).last();



    await button.waitFor({
      state:"visible",
      timeout:10000
    });



    await button.click();


    await page.waitForTimeout(
      3000
    );


    return {
      success:true
    };
  }





  async loginWithMicrosoft() {

    const page = this.getPage();


    await this.acceptCookies();


    const button =
      page.getByRole(
        "button",
        {
          name:/Log in to Sparx using Microsoft/i
        }
      );


    await button.waitFor({
      state:"visible",
      timeout:10000
    });


    await button.click();


    return {
      success:true,
      method:"microsoft",
      message:"Microsoft login opened"
    };
  }





  async isLoggedIn() {

    const page = this.getPage();


    const url =
      page.url();


    return !url.includes(
      "login"
    );
  }





  async inspectLogin() {

    const page =
      this.getPage();


    await page.waitForLoadState(
      "networkidle"
    );


    return {
      success:true,
      url:page.url(),
      title:await page.title(),

      inputs:
        await page.locator("input")
        .evaluateAll(
          elements =>
            elements.map(
              input => ({
                type:input.type,
                name:input.name,
                id:input.id,
                placeholder:input.placeholder
              })
            )
        ),

      buttons:
        await page.locator("button")
        .allTextContents()
    };
  }





  async healthCheck() {

    return await this.getSiteInfo();

  }

}


export default SparxClient;