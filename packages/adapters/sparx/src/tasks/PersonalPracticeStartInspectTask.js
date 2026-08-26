export class PersonalPracticeStartInspectTask {
  constructor(client) {
    this.client = client;
  }

  async execute() {
    const page = this.client.getPage();

    console.log("[Sparx] Opening Personal Practice...");

    await page.goto(
      "https://maths.sparx-learning.com/student/personalpractice",
      {
        waitUntil: "domcontentloaded",
        timeout: 30000
      }
    );

    await page.waitForTimeout(1500);

    const startButton = page
      .getByRole("button", {
        name: /^start new$/i
      })
      .first();

    await startButton.waitFor({
      state: "visible",
      timeout: 10000
    });

    console.log("[Sparx] Start new button found.");

    await startButton.scrollIntoViewIfNeeded();
    await startButton.click();

    console.log("[Sparx] Start new clicked.");

    await page.waitForTimeout(2000);

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
            value: select.value
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

      links: await page
        .locator("a:visible")
        .evaluateAll(elements =>
          elements.map((a, index) => ({
            index,
            text: a.innerText.trim(),
            href: a.href
          }))
        )
    };
  }
}

export default PersonalPracticeStartInspectTask;