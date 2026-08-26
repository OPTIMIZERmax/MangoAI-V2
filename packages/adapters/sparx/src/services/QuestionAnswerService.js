export class QuestionAnswerService {
  /**
   * Inspect the currently visible Sparx answer interface.
   *
   * This service intentionally does NOT submit answers.
   * It can inspect the interface and prepare an answer plan
   * from a solver result.
   */

  // ==========================================================
  // INSPECT
  // ==========================================================

  async inspect(page) {
    if (!page) {
      throw new Error(
        "Sparx page is not available."
      );
    }

    console.log(
      "[Answer] Inspecting answer interface..."
    );

    // --------------------------------------------------------
    // Find Answer button
    // --------------------------------------------------------

    const answerButton =
      page
        .getByRole("button", {
          name: /^answer$/i
        })
        .first();

    const answerButtonCount =
      await answerButton.count();

    if (answerButtonCount > 0) {
      const visible =
        await answerButton
          .isVisible()
          .catch(() => false);

      if (visible) {
        console.log(
          "[Answer] Answer button found."
        );

        await answerButton.click();

        console.log(
          "[Answer] Answer interface opened."
        );

        await page.waitForTimeout(500);
      }
    }

    // --------------------------------------------------------
    // Visible inputs
    // --------------------------------------------------------

    const fields =
      await page
        .locator("input:visible")
        .evaluateAll(
          elements =>
            elements.map(
              (input, index) => ({
                index,

                type:
                  input.type,

                name:
                  input.name,

                id:
                  input.id,

                placeholder:
                  input.placeholder,

                ariaLabel:
                  input.getAttribute(
                    "aria-label"
                  ),

                readOnly:
                  input.readOnly,

                disabled:
                  input.disabled,

                inputMode:
                  input.getAttribute(
                    "inputmode"
                  ),

                dataRef:
                  input.getAttribute(
                    "data-ref"
                  ),

                value:
                  input.value,

                className:
                  input.className
              })
            )
        );

    // --------------------------------------------------------
    // Visible buttons
    // --------------------------------------------------------

    const buttons =
      await page
        .locator("button:visible")
        .evaluateAll(
          elements =>
            elements.map(
              (button, index) => ({
                index,

                text:
                  button.innerText.trim(),

                type:
                  button.type,

                id:
                  button.id,

                ariaLabel:
                  button.getAttribute(
                    "aria-label"
                  ),

                disabled:
                  button.disabled,

                dataState:
                  button.getAttribute(
                    "data-state"
                  ),

                className:
                  button.className
              })
            )
        );

    // --------------------------------------------------------
    // Numeric keypad
    // --------------------------------------------------------

    const keypadButtons =
      await page
        .locator(
          [
            "#button-zero",
            "#button-one",
            "#button-two",
            "#button-three",
            "#button-four",
            "#button-five",
            "#button-six",
            "#button-seven",
            "#button-eight",
            "#button-nine",
            "#button-point",
            "#button-minus",
            "#button-back"
          ].join(",")
        )
        .evaluateAll(
          elements =>
            elements.map(
              (button, index) => ({
                index,

                id:
                  button.id,

                text:
                  button.innerText.trim(),

                disabled:
                  button.disabled,

                ariaLabel:
                  button.getAttribute(
                    "aria-label"
                  ),

                className:
                  button.className
              })
            )
        )
        .catch(() => []);

    // --------------------------------------------------------
    // Submit button
    // --------------------------------------------------------

    const submitButton =
      page
        .getByRole("button", {
          name: /submit answer/i
        })
        .first();

    const submitExists =
      (await submitButton.count()) > 0;

    const submitDisabled =
      submitExists
        ? await submitButton
            .isDisabled()
            .catch(() => false)
        : null;

    // --------------------------------------------------------
    // Focused element
    // --------------------------------------------------------

    const focused =
      await page
        .evaluate(() => {
          const element =
            document.activeElement;

          if (!element) {
            return null;
          }

          return {
            tag:
              element.tagName
                ?.toLowerCase() ??
              null,

            type:
              element.getAttribute(
                "type"
              ),

            placeholder:
              element.getAttribute(
                "placeholder"
              ),

            dataRef:
              element.getAttribute(
                "data-ref"
              ),

            id:
              element.id ||
              null,

            className:
              element.className ||
              null
          };
        })
        .catch(() => null);

    // --------------------------------------------------------
    // Determine interface type
    // --------------------------------------------------------

    let interfaceType =
      "unknown";

    if (
      keypadButtons.length >
      0
    ) {
      interfaceType =
        "numeric-keypad";
    } else if (
      fields.length >
      0
    ) {
      interfaceType =
        "text-input";
    } else if (
      buttons.some(
        button =>
          /submit answer/i.test(
            button.text
          )
      )
    ) {
      interfaceType =
        "button-based";
    }

    return {
      success: true,

      interfaceType,

      fields,

      keypadButtons,

      buttons,

      focused,

      submitExists,

      submitDisabled
    };
  }

  // ==========================================================
  // PREPARE ANSWER
  // ==========================================================

  /**
   * Convert a solver result into a normalized answer plan.
   *
   * This does NOT modify the page.
   */

  prepare(solution, answerInterface) {
    if (!solution) {
      return {
        success: false,
        method: "no-solution",
        interfaceType:
          answerInterface?.interfaceType ??
          "unknown",
        answers: null,
        actions: [],
        explanation:
          "No solver result was supplied."
      };
    }

    if (
      solution.success !== true
    ) {
      return {
        success: false,
        method: "solution-unresolved",
        interfaceType:
          answerInterface?.interfaceType ??
          "unknown",
        answers: null,
        actions: [],
        explanation:
          solution.explanation ??
          "The solver did not produce a usable answer."
      };
    }

    const interfaceType =
      answerInterface?.interfaceType ??
      "unknown";

    const answers =
      solution.answers ??
      {};

    // --------------------------------------------------------
    // Normalize solver answers
    // --------------------------------------------------------

    const normalizedAnswers =
      this.normalizeAnswers(
        answers
      );

    // --------------------------------------------------------
    // Build actions
    // --------------------------------------------------------

    const actions =
      [];

    switch (
      interfaceType
    ) {
      case "numeric-keypad": {
        for (
          const answer of
            normalizedAnswers
        ) {
          actions.push({
            type: "numeric-input",
            value:
              String(answer.value),
            fieldIndex:
              answer.fieldIndex ?? 0
          });
        }

        break;
      }

      case "text-input": {
        for (
          const answer of
            normalizedAnswers
        ) {
          actions.push({
            type: "text-input",
            value:
              String(answer.value),
            fieldIndex:
              answer.fieldIndex ?? 0
          });
        }

        break;
      }

      case "button-based": {
        for (
          const answer of
            normalizedAnswers
        ) {
          actions.push({
            type: "button-select",
            value:
              String(answer.value)
          });
        }

        break;
      }

      default: {
        return {
          success: false,
          method:
            "unsupported-interface",
          interfaceType,
          answers:
            normalizedAnswers,
          actions: [],
          explanation:
            `Unsupported answer interface: ${interfaceType}`
        };
      }
    }

    return {
      success: true,
      method:
        "prepared-answer",
      interfaceType,
      answers:
        normalizedAnswers,
      actions,
      submitReady:
        Boolean(
          actions.length > 0
        ),
      explanation:
        `Prepared ${actions.length} answer action(s) for the ${interfaceType} interface.`
    };
  }

  // ==========================================================
  // NORMALIZE ANSWERS
  // ==========================================================

  normalizeAnswers(
    answers
  ) {
    if (
      answers === null ||
      answers === undefined
    ) {
      return [];
    }

    // --------------------------------------------------------
    // Primitive answer
    // --------------------------------------------------------

    if (
      typeof answers ===
        "string" ||
      typeof answers ===
        "number" ||
      typeof answers ===
        "boolean"
    ) {
      return [
        {
          value: answers,
          fieldIndex: 0
        }
      ];
    }

    // --------------------------------------------------------
    // Array of answers
    // --------------------------------------------------------

    if (
      Array.isArray(
        answers
      )
    ) {
      return answers
        .map(
          (value, index) => ({
            value,
            fieldIndex:
              index
          })
        )
        .filter(
          item =>
            item.value !==
              null &&
            item.value !==
              undefined
        );
    }

    // --------------------------------------------------------
    // { value: ... }
    // --------------------------------------------------------

    if (
      answers.value !==
        undefined &&
      answers.value !==
        null
    ) {
      return [
        {
          value:
            answers.value,
          fieldIndex: 0
        }
      ];
    }

    // --------------------------------------------------------
    // { numerator, denominator }
    // --------------------------------------------------------

    if (
      answers.numerator !==
        undefined &&
      answers.denominator !==
        undefined
    ) {
      return [
        {
          value:
            `${answers.numerator}/${answers.denominator}`,
          fieldIndex: 0
        }
      ];
    }

    // --------------------------------------------------------
    // Explicit multi-field answers
    //
    // Example:
    //
    // {
    //   A: -2,
    //   B: 0,
    //   C: 4,
    //   D: 8
    // }
    // --------------------------------------------------------

    const entries =
      Object.entries(
        answers
      );

    if (
      entries.length >
      0
    ) {
      return entries
        .map(
          (
            [key, value],
            index
          ) => ({
            key,
            value,
            fieldIndex:
              index
          })
        )
        .filter(
          item =>
            item.value !==
              null &&
            item.value !==
              undefined
        );
    }

    return [];
  }

  // ==========================================================
  // VALIDATE ANSWER PLAN
  // ==========================================================

  validatePreparedAnswer(
    prepared,
    answerInterface
  ) {
    if (
      !prepared ||
      prepared.success !==
        true
    ) {
      return {
        valid: false,
        reasons: [
          "Answer plan is not valid."
        ]
      };
    }

    const reasons =
      [];

    if (
      !Array.isArray(
        prepared.actions
      ) ||
      prepared.actions.length ===
        0
    ) {
      reasons.push(
        "No answer actions were prepared."
      );
    }

    if (
      !answerInterface ||
      answerInterface.success !==
        true
    ) {
      reasons.push(
        "Answer interface inspection is unavailable."
      );
    }

    if (
      prepared.interfaceType ===
        "numeric-keypad" &&
      answerInterface?.keypadButtons
        ?.length === 0
    ) {
      reasons.push(
        "Numeric keypad was expected but no keypad buttons were found."
      );
    }

    if (
      prepared.interfaceType ===
        "text-input" &&
      answerInterface?.fields
        ?.length === 0
    ) {
      reasons.push(
        "Text input was expected but no input fields were found."
      );
    }

    if (
      prepared.interfaceType ===
        "button-based" &&
      answerInterface?.buttons
        ?.length === 0
    ) {
      reasons.push(
        "Button interface was expected but no buttons were found."
      );
    }

    return {
      valid:
        reasons.length ===
        0,
      reasons
    };
  }
}

export default QuestionAnswerService;