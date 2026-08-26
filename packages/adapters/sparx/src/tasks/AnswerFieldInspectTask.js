export class AnswerFieldInspectTask {
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

    const fields = await page
      .locator('input:visible[placeholder="Enter number"]')
      .evaluateAll(inputs =>
        inputs.map((input, index) => {
          const parent = input.parentElement;

          return {
            index,
            type: input.type,
            name: input.name,
            id: input.id,
            placeholder: input.placeholder,
            ariaLabel:
              input.getAttribute("aria-label"),
            autocomplete:
              input.getAttribute("autocomplete"),
            inputMode:
              input.getAttribute("inputmode"),
            min:
              input.getAttribute("min"),
            max:
              input.getAttribute("max"),
            step:
              input.getAttribute("step"),
            value: input.value,

            parentText:
              parent?.innerText?.trim() || "",

            parentHTML:
              parent?.outerHTML?.slice(0, 3000) || ""
          };
        })
      );

    const nearbyText = await page
      .locator('input:visible[placeholder="Enter number"]')
      .evaluateAll(inputs =>
        inputs.map(input => {
          let element = input;

          for (let i = 0; i < 3 && element; i++) {
            element = element.parentElement;
          }

          return element?.innerText?.trim() || "";
        })
      );

    const buttons = await page
      .locator("button:visible")
      .allTextContents();

    return {
      success: true,
      url: page.url(),
      title: await page.title(),
      fields,
      nearbyText,
      buttons
    };
  }
}

export default AnswerFieldInspectTask;