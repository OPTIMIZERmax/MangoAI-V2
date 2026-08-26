export class HomeworkTaskInspectTask {
  constructor(client) {
    this.client = client;
  }

  async execute(taskPayload = {}) {
    const page = this.client.getPage();

    if (!taskPayload.url) {
      return {
        success: false,
        error: "Task URL was not provided"
      };
    }

    console.log("[Sparx] Opening homework task:");
    console.log(taskPayload.url);

    await page.goto(taskPayload.url, {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });

    await page.waitForTimeout(2000);

    const url = page.url();
    const title = await page.title();

    const text = await page
      .locator("body")
      .innerText()
      .catch(() => "");

    const inputs = await page
      .locator("input")
      .evaluateAll(elements =>
        elements.map((input, index) => ({
          index,
          type: input.type,
          name: input.name,
          id: input.id,
          placeholder: input.placeholder,
          value: input.value
        }))
      );

    const buttons = await page
      .locator("button")
      .evaluateAll(elements =>
        elements.map((button, index) => ({
          index,
          text: button.innerText.trim(),
          type: button.type,
          id: button.id,
          ariaLabel: button.getAttribute("aria-label"),
          disabled: button.disabled
        }))
      );

    const links = await page
      .locator("a")
      .evaluateAll(elements =>
        elements.map((a, index) => ({
          index,
          text: a.innerText.trim(),
          href: a.href
        }))
      );

    const textareas = await page
      .locator("textarea")
      .evaluateAll(elements =>
        elements.map((textarea, index) => ({
          index,
          name: textarea.name,
          id: textarea.id,
          placeholder: textarea.placeholder,
          value: textarea.value
        }))
      );

    console.log("[Sparx] Task title:", title);
    console.log("[Sparx] Task URL:", url);
    console.log(
      `[Sparx] Found ${inputs.length} inputs, ${buttons.length} buttons.`
    );

    return {
      success: true,
      url,
      title,
      text,
      inputs,
      textareas,
      buttons,
      links
    };
  }
}

export default HomeworkTaskInspectTask;