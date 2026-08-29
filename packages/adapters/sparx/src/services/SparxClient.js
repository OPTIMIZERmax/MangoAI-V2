import smartLogin from "../../../../../src/utils/smartLogin.js";
import { QuestionParser } from "./QuestionParser.js";

export class SparxClient {
  constructor(
    browserManager,
    options = {}
  ) {
    this.browserManager =
      browserManager;

    this.questionParser =
      options.questionParser ??
      new QuestionParser();
  }

  // ============================================================
  // PAGE
  // ============================================================

  getPage() {
    return this.browserManager.getPage();
  }

  // ============================================================
  // QUESTION INSPECTION
  // ============================================================

  async inspectQuestion(
    url
  ) {
    const page =
      this.getPage();

    if (!page) {
      throw new Error(
        "Sparx page is not available."
      );
    }

    if (!url) {
      throw new Error(
        "Question URL was not provided."
      );
    }

    await page.goto(
      url,
      {
        waitUntil:
          "domcontentloaded",

        timeout:
          30000
      }
    );

    await page.waitForTimeout(
      1200
    );

    return await this.questionParser.parse(
      page
    );
  }

  // ============================================================
  // AUTHENTICATION
  // ============================================================

  async ensureAuthenticated() {
    const existingSession =
      await this.isLoggedIn();

    if (
      existingSession
    ) {
      console.log(
        "[Sparx] Existing session is authenticated."
      );

      return true;
    }

    console.log(
      "[Sparx] No active authenticated session found."
    );

    console.log(
      "[Sparx] Opening Sparx login flow..."
    );

    const page =
      this.getPage();

    if (!page) {
      console.log(
        "[Sparx] Browser page is unavailable."
      );

      return false;
    }

    try {
      await this.gotoLogin();

      await page
        .bringToFront()
        .catch(
          () => {}
        );

      console.log(
        "[Sparx] Please complete Sparx authentication in the browser."
      );

      console.log(
        "[Sparx] Waiting up to 5 minutes for authentication..."
      );

      try {
        await page.waitForURL(
          url =>
            url
              .toString()
              .includes(
                "maths.sparx-learning.com/student/"
              ),
          {
            timeout:
              300000
          }
        );
      } catch {
        /*
         * The authentication flow may use an intermediate
         * redirect, so perform an explicit login check too.
         */
      }

      await page.waitForTimeout(
        1500
      );

      const authenticated =
        await this.isLoggedIn(
          page
        );

      if (
        !authenticated
      ) {
        console.log(
          "[Sparx] Authentication was not detected."
        );

        return false;
      }

      console.log(
        "[Sparx] Manual authentication successful ✅"
      );

      const storageStatePath =
        "packages/adapters/sparx/storageState.json";

      await this.browserManager.saveStorageState(
        storageStatePath
      );

      console.log(
        "[Sparx] ✅ Authentication state saved:"
      );

      console.log(
        `         ${storageStatePath}`
      );

      return true;
    } catch (
      error
    ) {
      console.error(
        "[Sparx] Authentication flow failed:",
        error?.message ??
          error
      );

      return false;
    }
  }

  // ============================================================
  // COOKIES
  // ============================================================

  async acceptCookies() {
    const page =
      this.getPage();

    if (!page) {
      return false;
    }

    console.log(
      "[Sparx] Checking for cookie consent..."
    );

    const buttons =
      page.getByRole(
        "button"
      );

    const count =
      await buttons.count();

    for (
      let i = 0;
      i < count;
      i++
    ) {
      const button =
        buttons.nth(i);

      const text = (
        await button
          .innerText()
          .catch(
            () => ""
          )
      ).trim();

      if (
        !/accept all|accept|agree/i.test(
          text
        )
      ) {
        continue;
      }

      if (
        !(
          await button
            .isVisible()
            .catch(
              () => false
            )
        )
      ) {
        continue;
      }

      console.log(
        `[Sparx] Cookie button found: "${text}"`
      );

      await button
        .scrollIntoViewIfNeeded()
        .catch(
          () => {}
        );

      await page.waitForTimeout(
        500
      );

      try {
        await button.click({
          timeout:
            10000
        });

        await page.waitForTimeout(
          1000
        );

        console.log(
          "[Sparx] Cookies accepted."
        );

        return true;
      } catch (
        error
      ) {
        console.log(
          "[Sparx] Cookie button click failed:",
          error?.message ??
            error
        );
      }
    }

    console.log(
      "[Sparx] No visible cookie button found."
    );

    return false;
  }

  // ============================================================
  // NAVIGATION
  // ============================================================

  async goto(url) {
    if (!url) {
      throw new Error(
        "Sparx navigation URL was not provided."
      );
    }

    return await this.browserManager.goto(
      url
    );
  }

  async gotoHome() {
    return await this.goto(
      "https://www.sparxmaths.uk"
    );
  }

  // ============================================================
  // SPARX LOGIN FLOW
  // ============================================================

  async gotoLogin() {
    /*
     * IMPORTANT:
     *
     * Do NOT navigate directly to:
     *
     * https://maths.sparx-learning.com/student/homework
     *
     * That URL can redirect straight into the OAuth
     * flow when a school/domain is already known.
     *
     * We need the explicit school-selection page first
     * because the NexusAI login flow asks the user for
     * their school.
     *
     * Current Sparx school selector:
     *
     * https://selectschool.sparx-learning.com/
     */

    const schoolSelectorUrl =
      "https://selectschool.sparx-learning.com/";

    console.log(
      "[Sparx] Opening school selection page..."
    );

    const result =
      await this.goto(
        schoolSelectorUrl
      );

    const page =
      this.getPage();

    if (!page) {
      throw new Error(
        "Sparx page is unavailable after navigation."
      );
    }

    await page
      .waitForLoadState(
        "domcontentloaded"
      )
      .catch(
        () => {}
      );

    await page.waitForTimeout(
      1500
    );

    await this.acceptCookies();

    console.log(
      `[Sparx] School selection URL: ${page.url()}`
    );

    console.log(
      `[Sparx] School selection title: ${await page.title()}`
    );

    return result;
  }

  async getCurrentUrl() {
    const page =
      this.getPage();

    if (!page) {
      return "";
    }

    return page.url();
  }

  async getTitle() {
    const page =
      this.getPage();

    if (!page) {
      return "";
    }

    return await page.title();
  }

  // ============================================================
  // PAGE TYPE
  // ============================================================

  detectPageType(
    url,
    title = ""
  ) {
    url =
      String(
        url ??
          ""
      ).toLowerCase();

    title =
      String(
        title ??
          ""
      ).toLowerCase();

    if (
      url.includes(
        "welcome"
      )
    ) {
      return "welcome";
    }

    if (
      url.includes(
        "selectschool"
      ) ||
      title.includes(
        "select school"
      )
    ) {
      return "school-selection";
    }

    if (
      url.includes(
        "login"
      ) ||
      title.includes(
        "login"
      ) ||
      title.includes(
        "sparx maths login"
      )
    ) {
      return "login";
    }

    if (
      url.includes(
        "student"
      ) ||
      title.includes(
        "dashboard"
      )
    ) {
      return "dashboard";
    }

    return "unknown";
  }

  // ============================================================
  // SITE INFO
  // ============================================================

  async getSiteInfo() {
    await this.gotoHome();

    const url =
      await this.getCurrentUrl();

    const title =
      await this.getTitle();

    return {
      success:
        true,

      url,

      title,

      pageType:
        this.detectPageType(
          url,
          title
        )
    };
  }

  // ============================================================
  // SCHOOL SELECTION
  // ============================================================

  async searchSchool(
    schoolName
  ) {
    const page =
      this.getPage();

    if (!page) {
      throw new Error(
        "Sparx page is unavailable."
      );
    }

    if (
      !schoolName
    ) {
      throw new Error(
        "School name was not provided."
      );
    }

    console.log(
      `[Sparx] Searching for school: ${schoolName}`
    );

    console.log(
      `[Sparx] School page: ${page.url()}`
    );

    console.log(
      `[Sparx] Page title: ${await page.title()}`
    );

    await page
      .waitForLoadState(
        "domcontentloaded"
      )
      .catch(
        () => {}
      );

    /*
     * --------------------------------------------------------
     * CURRENT SPARX SCHOOL SELECTOR
     * --------------------------------------------------------
     */

    const possibleInputs = [
      page
        .getByPlaceholder(
          "Start typing your school's name...",
          {
            exact:
              true
          }
        )
        .first(),

      page
        .locator(
          'input[placeholder*="school" i]'
        )
        .first(),

      page
        .locator(
          'input[aria-label*="school" i]'
        )
        .first(),

      page
        .locator(
          'input[name*="school" i]'
        )
        .first(),

      page
        .locator(
          'input[type="text"]'
        )
        .first()
    ];

    let input =
      null;

    for (
      const candidate of
        possibleInputs
    ) {
      try {
        if (
          await candidate.isVisible()
        ) {
          input =
            candidate;

          break;
        }
      } catch {
        /*
         * Try the next selector.
         */
      }
    }

    if (!input) {
      const bodyText =
        await page
          .locator(
            "body"
          )
          .innerText()
          .catch(
            () => ""
          );

      console.log(
        "[Sparx] ❌ School search input was not found."
      );

      console.log(
        `[Sparx] Current URL: ${page.url()}`
      );

      console.log(
        `[Sparx] Current title: ${await page.title()}`
      );

      console.log(
        "[Sparx] Page text preview:"
      );

      console.log(
        bodyText.slice(
          0,
          3000
        )
      );

      throw new Error(
        "Could not find the Sparx school search input."
      );
    }

    console.log(
      "[Sparx] School search input found."
    );

    await input.fill(
      schoolName
    );

    console.log(
      `[Sparx] Entered school name: ${schoolName}`
    );

    /*
     * Give Sparx time to populate the school results.
     */
    await page.waitForTimeout(
      2000
    );

    console.log(
      "[Sparx] Search results should now be visible."
    );

    return {
      success:
        true,

      schoolName
    };
  }

  async selectSchool(
    schoolName
  ) {
    const page =
      this.getPage();

    if (!page) {
      throw new Error(
        "Sparx page is unavailable."
      );
    }

    if (
      !schoolName
    ) {
      throw new Error(
        "School name was not provided."
      );
    }

    console.log(
      `[Sparx] Selecting school: ${schoolName}`
    );

    /*
     * Try an exact text match first.
     */
    const exactSchool =
      page
        .getByText(
          schoolName,
          {
            exact:
              true
          }
        )
        .first();

    try {
      await exactSchool.waitFor({
        state:
          "visible",

        timeout:
          10000
      });

      console.log(
        "[Sparx] Exact school result found."
      );

      await exactSchool.click();

      console.log(
        "[Sparx] School clicked."
      );
    } catch {
      /*
       * Some Sparx versions wrap the school name in
       * a selectable element. Use a looser text match.
       */

      console.log(
        "[Sparx] Exact school result not found. Trying a broader match..."
      );

      const schoolResult =
        page
          .getByText(
            schoolName,
            {
              exact:
                false
            }
          )
          .filter({
            visible:
              true
          })
          .first();

      try {
        await schoolResult.waitFor({
          state:
            "visible",

          timeout:
            10000
        });

        console.log(
          "[Sparx] Broader school result found."
        );

        await schoolResult.click();

        console.log(
          "[Sparx] School result clicked."
        );
      } catch {
        const text =
          await page
            .locator(
              "body"
            )
            .innerText()
            .catch(
              () => ""
            );

        console.log(
          "[Sparx] ❌ Could not find the requested school."
        );

        console.log(
          "[Sparx] Current page text:"
        );

        console.log(
          text.slice(
            0,
            5000
          )
        );

        return {
          success:
            false,

          error:
            `School "${schoolName}" was not found`
        };
      }
    }

    /*
     * --------------------------------------------------------
     * CONTINUE
     * --------------------------------------------------------
     */

    const continueButton =
      page
        .getByRole(
          "button",
          {
            name:
              /^continue$/i
          }
        )
        .first();

    try {
      await continueButton.waitFor({
        state:
          "visible",

        timeout:
          10000
      });
    } catch {
      /*
       * Fallback for a possible input/button implementation.
       */

      const fallbackContinue =
        page
          .locator(
            'button, input[type="submit"]'
          )
          .filter({
            hasText:
              /continue/i
          })
          .first();

      if (
        await fallbackContinue
          .isVisible()
          .catch(
            () => false
          )
      ) {
        await fallbackContinue.click();

        console.log(
          "[Sparx] Fallback Continue clicked."
        );
      } else {
        throw new Error(
          "Could not find the Sparx Continue button after selecting the school."
        );
      }
    }

    if (
      await continueButton
        .isVisible()
        .catch(
          () => false
        )
    ) {
      console.log(
        "[Sparx] Continue button found."
      );

      await this.acceptCookies();

      await continueButton.click();

      console.log(
        "[Sparx] Continue clicked."
      );
    }

    await page.waitForTimeout(
      2000
    );

    console.log(
      `[Sparx] After school selection: ${page.url()}`
    );

    console.log(
      `[Sparx] New page title: ${await page.title()}`
    );

    return {
      success:
        true,

      schoolSelected:
        schoolName,

      url:
        page.url()
    };
  }

  // ============================================================
  // LOGIN PAGE INSPECTION
  // ============================================================

  async inspectLogin() {
    const page =
      this.getPage();

    if (!page) {
      throw new Error(
        "Sparx page is unavailable."
      );
    }

    await page
      .waitForLoadState(
        "networkidle"
      )
      .catch(
        () => {}
      );

    return {
      success:
        true,

      url:
        page.url(),

      title:
        await page.title(),

      inputs:
        await page
          .locator(
            "input"
          )
          .evaluateAll(
            elements =>
              elements.map(
                input => ({
                  type:
                    input.type,

                  name:
                    input.name,

                  id:
                    input.id,

                  placeholder:
                    input.placeholder
                })
              )
          ),

      buttons:
        await page
          .locator(
            "button"
          )
          .allTextContents()
    };
  }

  // ============================================================
  // NORMAL SPARX USERNAME
  // ============================================================

  async enterUsername(
    username
  ) {
    const page =
      this.getPage();

    if (!page) {
      throw new Error(
        "Sparx page is unavailable."
      );
    }

    if (!username) {
      throw new Error(
        "Username was not provided."
      );
    }

    console.log(
      `[Sparx] Entering username: ${username}`
    );

    const input =
      page
        .locator(
          'input[name="username"]'
        )
        .first();

    await input.waitFor({
      state:
        "visible",

      timeout:
        15000
    });

    await input.fill(
      username
    );

    console.log(
      "[Sparx] Username entered."
    );

    return {
      success:
        true
    };
  }

  // ============================================================
  // NORMAL SPARX PASSWORD
  // ============================================================

  async enterPassword(
    password
  ) {
    const page =
      this.getPage();

    if (!page) {
      throw new Error(
        "Sparx page is unavailable."
      );
    }

    if (!password) {
      throw new Error(
        "Password was not provided."
      );
    }

    console.log(
      "[Sparx] Entering password..."
    );

    const input =
      page
        .locator(
          'input[name="password"]'
        )
        .first();

    await input.waitFor({
      state:
        "visible",

      timeout:
        15000
    });

    await input.fill(
      password
    );

    console.log(
      "[Sparx] Password entered."
    );

    return {
      success:
        true
    };
  }

  // ============================================================
  // NORMAL SPARX LOGIN
  // ============================================================

  async submitLogin() {
    const page =
      this.getPage();

    if (!page) {
      throw new Error(
        "Sparx page is unavailable."
      );
    }

    console.log(
      "[Sparx] Submitting login..."
    );

    const loginButton =
      page
        .getByRole(
          "button",
          {
            name:
              /^log in$/i
          }
        )
        .first();

    await loginButton.waitFor({
      state:
        "visible",

      timeout:
        10000
    });

    await loginButton.click();

    console.log(
      "[Sparx] Login button clicked."
    );

    await page.waitForTimeout(
      3000
    );

    await page
      .waitForLoadState(
        "domcontentloaded"
      )
      .catch(
        () => {}
      );

    console.log(
      `[Sparx] URL after login: ${page.url()}`
    );

    console.log(
      `[Sparx] Title after login: ${await page.title()}`
    );

    return {
      success:
        true,

      url:
        page.url()
    };
  }

  // ============================================================
  // MICROSOFT LOGIN
  // ============================================================

  async loginWithMicrosoft({
    email
  } = {}) {
    let page =
      this.getPage();

    if (!page) {
      throw new Error(
        "Sparx page is unavailable."
      );
    }

    console.log(
      "[Sparx] Starting Microsoft login..."
    );

    /*
     * The school-selection step should already have completed.
     *
     * At this point Sparx should show:
     *
     * "Log in to Sparx using Microsoft"
     *
     * We use several fallbacks because text/ARIA labels can
     * differ slightly between Sparx deployments.
     */

    const possibleMicrosoftButtons = [
      page
        .getByRole(
          "button",
          {
            name:
              /log in to sparx using microsoft/i
          }
        )
        .first(),

      page
        .getByRole(
          "button",
          {
            name:
              /microsoft/i
          }
        )
        .first(),

      page
        .getByText(
          /log in to sparx using microsoft/i
        )
        .first(),

      page
        .locator(
          'button:has-text("Microsoft")'
        )
        .first()
    ];

    let microsoftButton =
      null;

    for (
      const candidate of
        possibleMicrosoftButtons
    ) {
      try {
        if (
          await candidate
            .isVisible()
        ) {
          microsoftButton =
            candidate;

          break;
        }
      } catch {
        /*
         * Try the next candidate.
         */
      }
    }

    if (
      !microsoftButton
    ) {
      const bodyText =
        await page
          .locator(
            "body"
          )
          .innerText()
          .catch(
            () => ""
          );

      console.log(
        "[Sparx] ❌ Microsoft login button was not found."
      );

      console.log(
        `[Sparx] Current URL: ${page.url()}`
      );

      console.log(
        `[Sparx] Current title: ${await page.title()}`
      );

      console.log(
        "[Sparx] Page text preview:"
      );

      console.log(
        bodyText.slice(
          0,
          5000
        )
      );

      throw new Error(
        "Could not find the 'Log in to Sparx using Microsoft' button."
      );
    }

    console.log(
      "[Sparx] Microsoft login button found."
    );

    const context =
      page.context();

    const pagesBefore =
      context.pages();

    /*
     * Start listening before clicking so we don't miss a
     * newly-created authentication page.
     */

    let newPagePromise =
      null;

    try {
      newPagePromise =
        context.waitForEvent(
          "page",
          {
            timeout:
              10000
          }
        );
    } catch {
      newPagePromise =
        null;
    }

    await microsoftButton.click();

    console.log(
      "[Sparx] Microsoft login button clicked."
    );

    let loginPage =
      page;

    /*
     * Detect a newly opened page.
     */

    if (
      newPagePromise
    ) {
      try {
        const newPage =
          await newPagePromise;

        if (
          newPage &&
          newPage !== page
        ) {
          loginPage =
            newPage;

          console.log(
            "[Sparx] Microsoft opened a new page."
          );
        }
      } catch {
        /*
         * No new page. Microsoft may have navigated
         * the current page instead.
         */
      }
    }

    /*
     * Give the existing page/navigation some time.
     */

    await page.waitForTimeout(
      1500
    );

    const pagesAfter =
      context.pages();

    if (
      pagesAfter.length >
        pagesBefore.length
    ) {
      const newestPage =
        pagesAfter[
          pagesAfter.length - 1
        ];

      if (
        newestPage &&
        newestPage !== page
      ) {
        loginPage =
          newestPage;
      }
    }

    await loginPage
      .waitForLoadState(
        "domcontentloaded"
      )
      .catch(
        () => {}
      );

    console.log(
      `[Sparx] Microsoft page: ${loginPage.url()}`
    );

    console.log(
      `[Sparx] Microsoft title: ${await loginPage.title()}`
    );

    // ----------------------------------------------------------
    // OPTIONAL EMAIL
    // ----------------------------------------------------------

    if (
      email
    ) {
      const emailInput =
        loginPage
          .locator(
            'input[type="email"], input[name="loginfmt"]'
          )
          .first();

      if (
        await emailInput.count() >
          0 &&
        await emailInput
          .isVisible()
          .catch(
            () => false
          )
      ) {
        await emailInput.fill(
          email
        );

        console.log(
          "[Sparx] Microsoft email entered."
        );

        const nextButton =
          loginPage
            .getByRole(
              "button",
              {
                name:
                  /next/i
              }
            )
            .first();

        if (
          await nextButton.count() >
            0 &&
          await nextButton
            .isVisible()
            .catch(
              () => false
            )
        ) {
          await nextButton.click();

          console.log(
            "[Sparx] Microsoft Next clicked."
          );
        }
      }
    }

    console.log(
      "[Sparx] Complete Microsoft authentication in the browser."
    );

    /*
     * Allow Microsoft authentication to proceed.
     */
    await loginPage.waitForTimeout(
      10000
    );

    let loggedIn =
      await this.isLoggedIn(
        loginPage
      );

    if (
      !loggedIn
    ) {
      console.log(
        "[Sparx] Microsoft authentication has not completed yet."
      );

      console.log(
        "[Sparx] Waiting for authentication redirect..."
      );

      try {
        await loginPage.waitForURL(
          url =>
            url
              .toString()
              .includes(
                "maths.sparx-learning.com/student/"
              ),
          {
            timeout:
              60000
          }
        );
      } catch {
        console.log(
          "[Sparx] No Sparx redirect detected within 60 seconds."
        );
      }

      loggedIn =
        await this.isLoggedIn(
          loginPage
        );
    }

    console.log(
      `[Sparx] Microsoft login successful: ${loggedIn}`
    );

    return {
      success:
        loggedIn,

      loggedIn,

      method:
        "microsoft",

      url:
        loginPage.url()
    };
  }

  // ============================================================
  // LOGIN STATUS
  // ============================================================

  async isLoggedIn(
    targetPage = null
  ) {
    const page =
      targetPage ||
      this.getPage();

    if (!page) {
      return false;
    }

    const url =
      page
        .url()
        .toLowerCase();

    const title =
      (
        await page
          .title()
          .catch(
            () => ""
          )
      ).toLowerCase();

    const isAuthDomain =
      url.includes(
        "auth.sparx-learning.com"
      );

    const isStudentDomain =
      url.includes(
        "maths.sparx-learning.com/student/"
      );

    const loginIndicators = [
      "log in",
      "login",
      "username",
      "password",
      "sparx maths login"
    ];

    const pageText =
      await page
        .locator(
          "body"
        )
        .innerText()
        .catch(
          () => ""
        );

    const lowerText =
      pageText.toLowerCase();

    const hasLoginIndicator =
      loginIndicators.some(
        indicator =>
          lowerText.includes(
            indicator
          )
      );

    const loggedIn =
      !isAuthDomain &&
      isStudentDomain &&
      !hasLoginIndicator;

    console.log(
      `[Sparx] Auth domain: ${isAuthDomain}`
    );

    console.log(
      `[Sparx] Student domain: ${isStudentDomain}`
    );

    console.log(
      `[Sparx] Login indicators: ${hasLoginIndicator}`
    );

    console.log(
      `[Sparx] Current title: ${title}`
    );

    console.log(
      `[Sparx] Current URL: ${url}`
    );

    console.log(
      `[Sparx] Logged in: ${loggedIn}`
    );

    return loggedIn;
  }

  // ============================================================
  // HEALTH CHECK
  // ============================================================

  async healthCheck() {
    return await this.getSiteInfo();
  }
}

export default SparxClient;