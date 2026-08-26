export class QuestionParser {
  async parse(page) {
    const questionText = await page
      .locator("body")
      .innerText()
      .catch(() => "");

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
          value: input.value,
          readOnly: input.readOnly,
          inputMode:
            input.getAttribute("inputmode"),
          dataRef:
            input.getAttribute("data-ref")
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

    const answerFields = inputs
      .filter(input => input.dataRef)
      .map(input => ({
        ref: input.dataRef,
        type: input.type,
        readOnly: input.readOnly,
        inputMode: input.inputMode,
        placeholder: input.placeholder
      }));

    return {
      questionText,
      inputs,
      textareas,
      selects,
      buttons,
      images,
      links,
      answerFields
    };
  }
}

export default QuestionParser;