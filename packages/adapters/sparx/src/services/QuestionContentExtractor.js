export class QuestionContentExtractor {
  extract(questionText = "") {
    const rawLines = String(questionText)
      .replace(/\r/g, "")
      .split("\n")
      .map(line => line.trim())
      .filter(Boolean);

    const ignored = new Set([
      "menu",
      "summary",
      "watch video",
      "answer",
      "zoom"
    ]);

    const contentLines = rawLines.filter(line => {
      const lower = line.toLowerCase();

      if (ignored.has(lower)) {
        return false;
      }

      // Navigation items such as 1A, 1B, ... 1J
      if (/^\d+[A-J]$/i.test(line)) {
        return false;
      }

      // XP display
      if (/^\d{1,3}(,\d{3})*\s*XP$/i.test(line)) {
        return false;
      }

      // Site chrome
      if (lower.includes("calculator not allowed")) {
        return false;
      }

      return true;
    });

    const text = contentLines.join("\n");

    return {
      lines: contentLines,
      text,
      normalizedText: this.normalizeMathText(text),
      tokens: this.extractMathTokens(text),
      rounding: this.detectRounding(text),
      expressions: this.detectExpressions(text)
    };
  }

  normalizeMathText(text) {
    return String(text)
      .replace(/\u200B/g, "")
      .replace(/\u2060/g, "")
      .replace(/[−–—]/g, "-")
      .replace(/\s+/g, " ")
      .trim();
  }

  extractMathTokens(text) {
    const normalized = this.normalizeMathText(text);

    return {
      numbers: [...normalized.matchAll(
        /(?<![A-Za-z])[-+]?\d+(?:\.\d+)?/g
      )].map(match => Number(match[0])),

      variables: [...new Set(
        normalized.match(/\b[A-Za-z]\b/g) ?? []
      )],

      operators: [
        ...new Set(
          normalized.match(/[+\-*/×÷=]/g) ?? []
        )
      ]
    };
  }

  detectRounding(text) {
    const normalized = this.normalizeMathText(text);

    const targets = [];

    const pattern =
      /nearest\s+(10|100|1,000|1000|10,000|10000)\b/gi;

    for (const match of normalized.matchAll(pattern)) {
      targets.push(Number(match[1].replace(/,/g, "")));
    }

    return {
      present: targets.length > 0,
      targets
    };
  }

  detectExpressions(text) {
    const normalized = this.normalizeMathText(text);

    const expressions = [];

    // Standard visible arithmetic expression.
    const standard = normalized.match(
      /\b\d+(?:\.\d+)?\s*[+\-*/×÷]\s*\d+(?:\.\d+)?(?:\s*[+\-*/×÷]\s*\d+(?:\.\d+)?)*\b/
    );

    if (standard) {
      expressions.push({
        type: "arithmetic",
        expression: standard[0]
      });
    }

    /*
     * Sparx sometimes flattens visually separated numbers.
     *
     * Example:
     *   Calculate
     *   7
     *   2
     *   7
     *   2
     *
     * We deliberately keep this as a candidate rather than
     * guessing whether it means 72 × 72, 72 ÷ 72, etc.
     */
    const calculateIndex = normalized
      .toLowerCase()
      .indexOf("calculate");

    if (calculateIndex !== -1) {
      const remainder = normalized
        .slice(calculateIndex + "calculate".length)
        .trim();

      const numberTokens = [
        ...remainder.matchAll(/\b\d+\b/g)
      ].map(match => match[0]);

      if (numberTokens.length >= 2) {
        expressions.push({
          type: "flattened-number-sequence",
          tokens: numberTokens.slice(0, 12)
        });
      }
    }

    return expressions;
  }
}

export default QuestionContentExtractor;