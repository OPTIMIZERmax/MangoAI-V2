export class HomeworkTaskElementInspectTask {
  constructor(client) {
    this.client = client;
  }

  async execute(taskPayload = {}) {
    const page = this.client.getPage();

    const taskText =
      taskPayload.task ||
      "1. Mixed topic practice";

    console.log(
      `[Sparx] Inspecting task element: ${taskText}`
    );

    // Open the homework page.
    await page.goto(
      "https://maths.sparx-learning.com/student/homework",
      {
        waitUntil: "domcontentloaded",
        timeout: 30000
      }
    );

    await page.waitForTimeout(1500);

    // Expand older homework.
    const olderButton = page
      .getByRole("button", {
        name: /older homework/i
      })
      .first();

    if (
      await olderButton.count() > 0 &&
      await olderButton.isVisible().catch(() => false)
    ) {
      await olderButton.scrollIntoViewIfNeeded();
      await olderButton.click();
      await page.waitForTimeout(1500);
    }

    // Open the July 1st homework.
    const homeworkButton = page
      .getByRole("button", {
        name: /Homework due Wednesday 1st July 9am/i
      })
      .first();

    await homeworkButton.waitFor({
      state: "visible",
      timeout: 10000
    });

    if (
      (await homeworkButton.getAttribute("data-state")) !== "open"
    ) {
      await homeworkButton.click();
      await page.waitForTimeout(1500);
    }

    // Find the exact task text anywhere in the rendered DOM.
    const task = page
      .getByText(taskText, {
        exact: true
      })
      .first();

    await task.waitFor({
      state: "visible",
      timeout: 10000
    });

    console.log("[Sparx] Task element found.");

    const inspection = await task.evaluate(element => {
      const result = {
        tag: element.tagName.toLowerCase(),
        text: element.textContent?.trim() || "",
        id: element.id || null,
        className:
          typeof element.className === "string"
            ? element.className
            : null,
        role: element.getAttribute("role"),
        href: element.getAttribute("href"),
        ariaLabel:
          element.getAttribute("aria-label"),
        dataAttributes: {},
        attributes: {},
        outerHTML: element.outerHTML
      };

      for (const attribute of element.attributes) {
        result.attributes[attribute.name] =
          attribute.value;

        if (attribute.name.startsWith("data-")) {
          result.dataAttributes[attribute.name] =
            attribute.value;
        }
      }

      return result;
    });

    // Inspect ancestors to find where the interactive behaviour
    // might actually live.
    const ancestors = await task.evaluate(element => {
      const result = [];

      let current = element;

      for (let level = 0; level < 6 && current; level++) {
        result.push({
          level,
          tag: current.tagName.toLowerCase(),
          text:
            current.textContent?.trim().slice(0, 1000) || "",
          id: current.id || null,
          className:
            typeof current.className === "string"
              ? current.className
              : null,
          role: current.getAttribute("role"),
          href: current.getAttribute("href"),
          dataAttributes:
            Object.fromEntries(
              Array.from(current.attributes)
                .filter(attribute =>
                  attribute.name.startsWith("data-")
                )
                .map(attribute => [
                  attribute.name,
                  attribute.value
                ])
            ),
          outerHTML:
            current.outerHTML.slice(0, 5000)
        });

        current = current.parentElement;
      }

      return result;
    });

    return {
      success: true,
      task: taskText,
      url: page.url(),
      inspection,
      ancestors
    };
  }
}

export default HomeworkTaskElementInspectTask;