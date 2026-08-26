export class AnswerKeypadInspectTask {
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

    console.log("[Sparx] Inspecting answer keypad...");

    const visibleElements = await page
      .locator(
        'button:visible, [role="button"]:visible, [data-ref]:visible'
      )
      .evaluateAll(elements =>
        elements.map((element, index) => ({
          index,
          tag: element.tagName.toLowerCase(),
          text: element.innerText?.trim() || "",
          role: element.getAttribute("role"),
          type: element.getAttribute("type"),
          id: element.id || null,
          className:
            typeof element.className === "string"
              ? element.className
              : null,
          ariaLabel:
            element.getAttribute("aria-label"),
          dataRef:
            element.getAttribute("data-ref"),
          dataAttributes:
            Object.fromEntries(
              Array.from(element.attributes)
                .filter(attr =>
                  attr.name.startsWith("data-")
                )
                .map(attr => [
                  attr.name,
                  attr.value
                ])
            ),
          disabled:
            "disabled" in element
              ? element.disabled
              : false
        }))
      );

    const keypadCandidates = await page
      .locator(
        '[class*="Key"], [class*="key"], [class*="Keyboard"], [class*="keyboard"], [class*="Pad"], [class*="pad"]'
      )
      .evaluateAll(elements =>
        elements.map((element, index) => ({
          index,
          tag: element.tagName.toLowerCase(),
          text:
            element.innerText?.trim() || "",
          className:
            typeof element.className === "string"
              ? element.className
              : null,
          id: element.id || null,
          outerHTML:
            element.outerHTML.slice(0, 5000)
        }))
      );

    const readonlyInputs = await page
      .locator('input[readonly]:visible')
      .evaluateAll(elements =>
        elements.map((input, index) => ({
          index,
          placeholder: input.placeholder,
          dataRef:
            input.getAttribute("data-ref"),
          inputMode:
            input.getAttribute("inputmode"),
          pattern:
            input.getAttribute("pattern"),
          value: input.value,
          outerHTML: input.outerHTML
        }))
      );

    return {
      success: true,
      url: page.url(),
      title: await page.title(),
      readonlyInputs,
      visibleElements,
      keypadCandidates
    };
  }
}

export default AnswerKeypadInspectTask;