import QuestionParser from "../services/QuestionParser.js";

export class QuestionInspectTask {
  constructor(client) {
  this.client = client;
  this.parser = new QuestionParser();
}

  async execute(taskPayload = {}) {
    const page = this.client.getPage();

    await this.client.ensureAuthenticated();

    const url = taskPayload.url;

    if (!url) {
      return {
        success: false,
        error: "Question URL was not provided."
      };
    }

    console.log("[Sparx] Opening question:");
    console.log(url);

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });

    await page.waitForTimeout(1500);

    const parsed =
  await this.parser.parse(page);

return {
  success: true,
  url: page.url(),
  title: await page.title(),
  ...parsed
};

    const inputs = await page
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
      );

    const buttons = await page
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
      );

    const selects = await page
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
      );

    const textareas = await page
      .locator("textarea:visible")
      .evaluateAll(elements =>
        elements.map((textarea, index) => ({
          index,
          name: textarea.name,
          id: textarea.id,
          placeholder: textarea.placeholder,
          value: textarea.value
        }))
      );

    const images = await page
      .locator("img:visible")
      .evaluateAll(elements =>
        elements.map((img, index) => ({
          index,
          alt: img.alt,
          src: img.src,
          width: img.naturalWidth,
          height: img.naturalHeight
        }))
      );

    const links = await page
      .locator("a:visible")
      .evaluateAll(elements =>
        elements.map((a, index) => ({
          index,
          text: a.innerText.trim(),
          href: a.href
        }))
      );

    return {
      success: true,
      url: page.url(),
      title: await page.title(),
      questionText,
      inputs,
      textareas,
      selects,
      buttons,
      images,
      links
    };
  }
}

export default QuestionInspectTask;