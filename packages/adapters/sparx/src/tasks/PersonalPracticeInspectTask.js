export class PersonalPracticeInspectTask {
  constructor(client) {
    this.client = client;
  }

  async execute() {
    const page = this.client.getPage();

    console.log("[Sparx] Opening Personal Practice...");

    await page.goto(
      "https://maths.sparx-learning.com/student/homework",
      {
        waitUntil: "domcontentloaded",
        timeout: 30000
      }
    );

    await page.waitForTimeout(1500);

    const practiceButton = page
      .getByRole("button", {
        name: /^personal practice$/i
      })
      .first();

    if (await practiceButton.count() === 0) {
      return {
        success: false,
        error: "Personal Practice button was not found."
      };
    }

    await practiceButton.click();

    await page.waitForTimeout(1500);

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
            placeholder: input.placeholder
          }))
        ),
      buttons: await page
        .locator("button:visible")
        .allTextContents()
    };
  }
}

export default PersonalPracticeInspectTask;