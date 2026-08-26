export class AnswerFieldInteractionInspectTask {
  constructor(client) {
    this.client = client;
  }

  async execute(taskPayload = {}) {
    const page = this.client.getPage();

    if (!taskPayload.url) {
      return {
        success: false,
        error: "Question URL was not provided."
      };
    }

    console.log("[Sparx] Opening question...");
    console.log(taskPayload.url);

    await page.goto(taskPayload.url, {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });

    await page.waitForTimeout(1500);

    const answerButton = page
      .getByRole("button", {
        name: /^answer$/i
      })
      .first();

    await answerButton.waitFor({
      state: "visible",
      timeout: 10000
    });

    await answerButton.click();
    await page.waitForTimeout(1000);

    const before = await page.locator("body").innerText();

    const fields = page.locator(
      'input[readonly][data-ref]'
    );

    const fieldCount = await fields.count();

    if (fieldCount === 0) {
      return {
        success: false,
        error: "No readonly answer fields found."
      };
    }

    console.log(
      `[Sparx] Found ${fieldCount} answer fields.`
    );

    // Click/focus the first field only.
    // We do NOT type anything.
    const firstField = fields.first();

    await firstField.scrollIntoViewIfNeeded();
    await firstField.click();

    // Give Sparx time to render any custom input UI.
    await page.waitForTimeout(500);

    const after = await page.locator("body").innerText();

    const dialogs = await page
      .locator(
        '[role="dialog"]:visible, [aria-modal="true"]:visible'
      )
      .evaluateAll(elements =>
        elements.map((element, index) => ({
          index,
          text: element.innerText.trim(),
          tag: element.tagName.toLowerCase(),
          role: element.getAttribute("role"),
          ariaLabel:
            element.getAttribute("aria-label"),
          className:
            typeof element.className === "string"
              ? element.className
              : null,
          outerHTML:
            element.outerHTML.slice(0, 10000)
        }))
      );

    const visibleButtons = await page
      .locator("button:visible")
      .evaluateAll(elements =>
        elements.map((button, index) => ({
          index,
          text: button.innerText.trim(),
          type: button.getAttribute("type"),
          id: button.id || null,
          ariaLabel:
            button.getAttribute("aria-label"),
          className:
            typeof button.className === "string"
              ? button.className
              : null,
          dataAttributes:
            Object.fromEntries(
              Array.from(button.attributes)
                .filter(attr =>
                  attr.name.startsWith("data-")
                )
                .map(attr => [
                  attr.name,
                  attr.value
                ])
            )
        }))
      );

    const visibleInputs = await page
      .locator("input:visible")
      .evaluateAll(elements =>
        elements.map((input, index) => ({
          index,
          type: input.type,
          placeholder: input.placeholder,
          readOnly: input.readOnly,
          dataRef:
            input.getAttribute("data-ref"),
          value: input.value,
          className:
            typeof input.className === "string"
              ? input.className
              : null
        }))
      );

    const focused = await page
      .evaluate(() => {
        const element = document.activeElement;

        if (!element) {
          return null;
        }

        return {
          tag: element.tagName.toLowerCase(),
          type:
            element.getAttribute("type"),
          placeholder:
            element.getAttribute("placeholder"),
          dataRef:
            element.getAttribute("data-ref"),
          className:
            typeof element.className === "string"
              ? element.className
              : null
        };
      });

    return {
      success: true,
      url: page.url(),
      title: await page.title(),
      before,
      after,
      changed:
        before !== after,
      fieldCount,
      focused,
      dialogs,
      visibleButtons,
      visibleInputs
    };
  }
}

export default AnswerFieldInteractionInspectTask;