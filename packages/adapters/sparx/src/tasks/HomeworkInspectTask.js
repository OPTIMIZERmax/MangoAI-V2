export class HomeworkInspectTask {
  constructor(client) {
    this.client = client;
  }

  async execute() {
    const page = this.client.getPage();

    console.log("[Sparx] Inspecting homework page...");

    await page.goto(
      "https://maths.sparx-learning.com/student/homework",
      {
        waitUntil: "domcontentloaded",
        timeout: 30000
      }
    );

    await page.waitForTimeout(2000);

    const url = page.url();
    const title = await page.title();

    console.log("[Sparx] Homework URL:", url);
    console.log("[Sparx] Homework title:", title);

    const bodyText = await page
      .locator("body")
      .innerText()
      .catch(() => "");

    const links = await page
      .locator("a")
      .evaluateAll(elements =>
        elements.map((a, index) => ({
          index,
          text: a.innerText.trim(),
          href: a.href,
          className: a.className,
          id: a.id,
          ariaLabel: a.getAttribute("aria-label"),
          dataAttributes: Object.fromEntries(
            Array.from(a.attributes)
              .filter(attr => attr.name.startsWith("data-"))
              .map(attr => [attr.name, attr.value])
          )
        }))
      );

    const buttons = await page
      .locator("button")
      .evaluateAll(elements =>
        elements.map((button, index) => ({
          index,
          text: button.innerText.trim(),
          type: button.type,
          className: button.className,
          id: button.id,
          ariaLabel: button.getAttribute("aria-label"),
          dataAttributes: Object.fromEntries(
            Array.from(button.attributes)
              .filter(attr => attr.name.startsWith("data-"))
              .map(attr => [attr.name, attr.value])
          )
        }))
      );

    const clickable = await page
      .locator("a, button")
      .evaluateAll(elements =>
        elements.map((element, index) => ({
          index,
          tag: element.tagName.toLowerCase(),
          text: element.innerText.trim(),
          href: element.tagName === "A"
            ? element.href
            : null,
          className: element.className,
          id: element.id,
          ariaLabel: element.getAttribute("aria-label"),
          dataAttributes: Object.fromEntries(
            Array.from(element.attributes)
              .filter(attr => attr.name.startsWith("data-"))
              .map(attr => [attr.name, attr.value])
          )
        }))
      );

    console.log(
      `[Sparx] Found ${links.length} links and ${buttons.length} buttons.`
    );

    return {
      success: true,
      authenticated: true,
      url,
      title,
      text: bodyText,
      links,
      buttons,
      clickable
    };
  }
}

export default HomeworkInspectTask;