export class HomeworkOpenTask {
  constructor(client) {
    this.client = client;
  }

  async execute(taskPayload = {}) {
    const page = this.client.getPage();

    const homeworkText =
      taskPayload.homework ||
      "Homework due Wednesday 26th August 9am";

    console.log(
      `[Sparx] Opening homework entry: ${homeworkText}`
    );

    await page.goto(
      "https://maths.sparx-learning.com/student/homework",
      {
        waitUntil: "domcontentloaded",
        timeout: 30000
      }
    );

    await page.waitForTimeout(1500);

    // ==========================================================
    // SPECIAL CASE: OPEN OLDER HOMEWORK DROPDOWN
    // ==========================================================

    if (/^older homework/i.test(homeworkText)) {
      const olderButton = page
        .getByRole("button", {
          name: /older homework/i
        })
        .first();

      await olderButton.waitFor({
        state: "visible",
        timeout: 10000
      });

      console.log(
        "[Sparx] Older homework control found."
      );

      await olderButton.scrollIntoViewIfNeeded();
      await olderButton.click();

      console.log(
        "[Sparx] Older homework control clicked."
      );

      await page.waitForTimeout(2000);

      return await this.inspectVisibleHomework(page);
    }

    // ==========================================================
    // FIND REQUESTED HOMEWORK
    // ==========================================================

    let accordion = await this.findHomeworkAccordion(
      page,
      homeworkText
    );

    // ----------------------------------------------------------
    // If not visible, expand Older Homework
    // ----------------------------------------------------------

    if (!accordion) {
      console.log(
        `[Sparx] Homework not currently visible: ${homeworkText}`
      );

      const olderButton = page
        .getByRole("button", {
          name: /older homework/i
        })
        .first();

      if (
        await olderButton.count() > 0 &&
        await olderButton.isVisible().catch(() => false)
      ) {
        console.log(
          "[Sparx] Expanding Older homework..."
        );

        await olderButton.scrollIntoViewIfNeeded();
        await olderButton.click();

        await page.waitForTimeout(2000);

        accordion = await this.findHomeworkAccordion(
          page,
          homeworkText
        );
      }
    }

    // ----------------------------------------------------------
    // Still not found
    // ----------------------------------------------------------

    if (!accordion) {
      const visibleText = await page
        .locator("body")
        .innerText()
        .catch(() => "");

      return {
        success: false,
        homework: homeworkText,
        error:
          `Homework "${homeworkText}" was not found.`,
        visibleText
      };
    }

    // ==========================================================
    // OPEN THE HOMEWORK ACCORDION
    // ==========================================================

    console.log(
      `[Sparx] Homework accordion found: ${homeworkText}`
    );

    await accordion.scrollIntoViewIfNeeded();
    await accordion.click();

    console.log(
      "[Sparx] Homework accordion clicked."
    );

    await page.waitForTimeout(1500);

    // ==========================================================
    // INSPECT TASKS INSIDE THE HOMEWORK
    // ==========================================================

    const visibleTaskElements = await page
      .locator("a:visible, button:visible")
      .evaluateAll(elements =>
        elements
          .map((element, index) => ({
            index,
            tag: element.tagName.toLowerCase(),
            text: element.innerText.trim(),
            href:
              element.tagName === "A"
                ? element.href
                : null,
            className: element.className,
            id: element.id,
            ariaLabel:
              element.getAttribute("aria-label"),
            dataState:
              element.getAttribute("data-state")
          }))
          .filter(element => {
            const text =
              element.text.toLowerCase();

            return (
              /^\d+\./.test(element.text) ||
              text.includes("complete") ||
              text.includes("bookwork") ||
              text.includes("start") ||
              text.includes("continue")
            );
          })
      );

    const taskLinks = await page
      .locator("a:visible")
      .evaluateAll(elements =>
        elements
          .map(a => ({
            text: a.innerText.trim(),
            href: a.href,
            className: a.className
          }))
          .filter(a =>
            a.href.includes(
              "/student/package/"
            )
          )
      );

    const bodyText = await page
      .locator("body")
      .innerText()
      .catch(() => "");

    console.log(
      `[Sparx] Found ${visibleTaskElements.length} task-looking elements.`
    );

    console.log(
      `[Sparx] Found ${taskLinks.length} task links.`
    );

    return {
      success: true,
      homework: homeworkText,
      accordionState:
        await accordion.getAttribute("data-state"),
      visibleTaskElements,
      taskLinks,
      text: bodyText
    };
  }

  // ==========================================================
  // FIND HOMEWORK ACCORDION
  // ==========================================================

  async findHomeworkAccordion(page, homeworkText) {
    const escaped =
      homeworkText.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

    const matches = page.getByRole("button", {
      name: new RegExp(escaped, "i")
    });

    const count = await matches.count();

    for (let i = 0; i < count; i++) {
      const button = matches.nth(i);

      if (
        await button.isVisible().catch(() => false)
      ) {
        return button;
      }
    }

    return null;
  }

  // ==========================================================
  // INSPECT VISIBLE HOMEWORK
  // ==========================================================

  async inspectVisibleHomework(page) {
    const text = await page
      .locator("body")
      .innerText()
      .catch(() => "");

    const buttons = await page
      .locator("button:visible")
      .evaluateAll(elements =>
        elements.map((button, index) => ({
          index,
          text: button.innerText.trim(),
          type: button.type,
          className: button.className,
          id: button.id,
          ariaLabel:
            button.getAttribute("aria-label"),
          dataState:
            button.getAttribute("data-state")
        }))
      );

    const links = await page
      .locator("a:visible")
      .evaluateAll(elements =>
        elements.map((a, index) => ({
          index,
          text: a.innerText.trim(),
          href: a.href,
          className: a.className,
          id: a.id
        }))
      );

    return {
      success: true,
      url: page.url(),
      title: await page.title(),
      text,
      buttons,
      links
    };
  }
}

export default HomeworkOpenTask;