export class QuestionTypeDetector {
  detect(question) {
    const text = (
      question.questionText || ""
    )
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

    const answerFields =
      question.answerFields || [];

    const questionImages =
      (question.images || []).filter(image => {
        const src =
          (image.src || "").toLowerCase();

        return (
          !src.includes("sparx_maths_logo") &&
          !src.startsWith("data:image/svg+xml")
        );
      });

    const hasNumericFields =
      answerFields.some(
        field =>
          field.inputMode === "decimal" ||
          field.type === "text"
      );

    const hasTwoNumericFields =
      answerFields.length === 2 &&
      answerFields.every(
        field =>
          field.inputMode === "decimal"
      );

    // --------------------------------------------------------
    // GRADIENT / LINEAR EQUATIONS
    // --------------------------------------------------------

    if (
      text.includes("gradient") &&
      (
        text.includes("line") ||
        text.includes("equation")
      )
    ) {
      return {
        type: "gradient",
        confidence: 0.98,
        answerModel:
          hasNumericFields
            ? "numeric"
            : "unknown"
      };
    }

    if (
      (
        text.includes("gradient of the line") ||
        text.includes("gradient of a line") ||
        text.includes("gradient")
      ) &&
      /[xy]\s*[+=-]/i.test(text)
    ) {
      return {
        type: "gradient",
        confidence: 0.95,
        answerModel:
          hasNumericFields
            ? "numeric"
            : "unknown"
      };
    }

    // --------------------------------------------------------
    // FRACTIONS
    // --------------------------------------------------------

    if (
      text.includes("fraction") &&
      hasTwoNumericFields
    ) {
      return {
        type: "fraction",
        confidence: 0.95,
        answerModel: "two-number"
      };
    }

    // --------------------------------------------------------
    // PERCENTAGES
    // --------------------------------------------------------

    if (
      text.includes("%") ||
      text.includes("percent") ||
      text.includes("percentage")
    ) {
      return {
        type: "percentage",
        confidence: 0.95,
        answerModel:
          hasNumericFields
            ? "numeric"
            : "unknown"
      };
    }

    // --------------------------------------------------------
    // ROUNDING
    // --------------------------------------------------------

    if (
      /\bround\b/.test(text) &&
      (
        text.includes("decimal place") ||
        text.includes("decimal places")
      )
    ) {
      return {
        type: "rounding",
        confidence: 0.95,
        answerModel:
          hasNumericFields
            ? "numeric"
            : "visual-numeric"
      };
    }

    // --------------------------------------------------------
    // PYTHAGORAS
    // --------------------------------------------------------

    if (
      text.includes("pythagoras") ||
      text.includes("pythagorean")
    ) {
      return {
        type: "pythagoras",
        confidence: 0.95,
        answerModel:
          hasNumericFields
            ? "numeric"
            : "unknown"
      };
    }

    // --------------------------------------------------------
    // ALGEBRA / EQUATIONS
    // --------------------------------------------------------

    if (
      (
        text.includes("solve") ||
        text.includes("equation")
      ) &&
      /[xy]\s*[+=-]/i.test(text)
    ) {
      return {
        type: "algebra",
        confidence: 0.9,
        answerModel:
          hasNumericFields
            ? "numeric"
            : "unknown"
      };
    }

    // --------------------------------------------------------
    // MULTIPLE CHOICE
    // --------------------------------------------------------

    if (
      text.includes("which") ||
      text.includes("select")
    ) {
      return {
        type: "multiple-choice",
        confidence: 0.6,
        answerModel: "unknown"
      };
    }

    // --------------------------------------------------------
    // ARITHMETIC
    // --------------------------------------------------------

    const hasArithmeticExpression =
      /\d+\s*[+\-×÷*/]\s*\d+/.test(text);

    if (hasArithmeticExpression) {
      return {
        type: "arithmetic",
        confidence: 0.85,
        answerModel:
          hasNumericFields
            ? "numeric"
            : "unknown"
      };
    }

    // --------------------------------------------------------
    // VISUAL
    // --------------------------------------------------------

    if (questionImages.length > 0) {
      return {
        type: "visual",
        confidence: 0.7,
        answerModel: "unknown"
      };
    }

    // --------------------------------------------------------
    // GENERIC NUMERIC
    // --------------------------------------------------------

    if (hasNumericFields) {
      return {
        type: "numeric",
        confidence: 0.7,
        answerModel: "numeric"
      };
    }

    // --------------------------------------------------------
    // UNKNOWN
    // --------------------------------------------------------

    return {
      type: "unknown",
      confidence: 0,
      answerModel: "unknown"
    };
  }
}

export default QuestionTypeDetector;