export class AnswerFieldStructureInspectTask {
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

    await page.goto(taskPayload.url, {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });

    await page.waitForTimeout(1200);

    const answerButton = page
      .getByRole("button", {
        name: /^answer$/i
      })
      .first();

    await answerButton.click();
    await page.waitForTimeout(500);

    const fields = page.locator(
      'input[readonly][data-ref]'
    );

    const structures = await fields.evaluateAll(inputs =>
      inputs.map((input, index) => {
        const ancestors = [];

        let current = input;

        for (let level = 0; level < 5 && current; level++) {
          ancestors.push({
            level,
            tag: current.tagName.toLowerCase(),
            className:
              typeof current.className === "string"
                ? current.className
                : null,
            text:
              current.innerText?.trim() || "",
            outerHTML:
              current.outerHTML.slice(0, 4000)
          });

          current = current.parentElement;
        }

        return {
          index,
          dataRef:
            input.getAttribute("data-ref"),
          ancestors
        };
      })
    );

    return {
      success: true,
      url: page.url(),
      structures
    };
  }
}

export default AnswerFieldStructureInspectTask;