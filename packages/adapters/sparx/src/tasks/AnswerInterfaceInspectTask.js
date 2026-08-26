export class AnswerInterfaceInspectTask {
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

    console.log("[Sparx] Answer button found.");

    await answerButton.scrollIntoViewIfNeeded();
    await answerButton.click();

    console.log("[Sparx] Answer interface opened.");

    await page.waitForTimeout(1000);

    return {
      success: true,
      url: page.url(),
      title: await page.title(),

      text: await page
        .locator("body")
        .innerText()
        .catch(() => ""),

      inputs: await page
        .locator("input:visible")
        .evaluateAll(elements =>
          elements.map((input, index) => ({
            index,
            type: input.type,
            name: input.name,
            id: input.id,
            placeholder: input.placeholder,
            ariaLabel:
              input.getAttribute("aria-label"),
            value: input.value
          }))
        ),

      textareas: await page
        .locator("textarea:visible")
        .evaluateAll(elements =>
          elements.map((textarea, index) => ({
            index,
            name: textarea.name,
            id: textarea.id,
            placeholder: textarea.placeholder,
            ariaLabel:
              textarea.getAttribute("aria-label"),
            value: textarea.value
          }))
        ),

      selects: await page
        .locator("select:visible")
        .evaluateAll(elements =>
          elements.map((select, index) => ({
            index,
            name: select.name,
            id: select.id,
            value: select.value,
            options: Array.from(select.options).map(
              option => ({
                text: option.text,
                value: option.value
              })
            )
          }))
        ),

      buttons: await page
        .locator("button:visible")
        .evaluateAll(elements =>
          elements.map((button, index) => ({
            index,
            text: button.innerText.trim(),
            type: button.type,
            id: button.id,
            ariaLabel:
              button.getAttribute("aria-label"),
            disabled: button.disabled
          }))
        ),

      images: await page
        .locator("img:visible")
        .evaluateAll(elements =>
          elements.map((img, index) => ({
            index,
            alt: img.alt,
            src: img.src,
            width: img.naturalWidth,
            height: img.naturalHeight
          }))
        )
    };
  }
}

export default AnswerInterfaceInspectTask;