export class QuestionTutorService {
  build({ platform, questionType = {}, content = {}, solution = null } = {}) {
    const text = String(content.normalizedText || content.text || '');
    const domain = this.detectDomain(platform, text, questionType.type);
    const topic = this.detectTopic(domain, text, questionType.type);
    const solutionAvailable = solution?.success === true;

    return {
      success: true,
      domain,
      topic,
      confidence: this.getConfidence(questionType, solutionAvailable),
      learnerPrompt: this.getLearnerPrompt(domain, topic),
      steps: this.getSteps(domain, topic),
      selfCheck: this.getSelfCheck(domain, topic),
      solutionAvailable,
      needsReview: !solutionAvailable || questionType.confidence < 0.75
    };
  }

  detectDomain(platform, text, type) {
    const value = `${platform || ''} ${type || ''} ${text}`.toLowerCase();
    if (/sparxreader|inference|retrieval|language technique|quotation|character|paragraph/.test(value)) return 'reader';
    if (/sparxscience|biology|chemistry|physics|atom|cell|force|energy|reaction|organism/.test(value)) return 'science';
    return 'maths';
  }

  detectTopic(domain, text, detectedType) {
    if (detectedType && detectedType !== 'unknown' && detectedType !== 'visual') return detectedType;
    const value = text.toLowerCase();
    if (domain === 'reader') return 'reading comprehension';
    if (domain === 'science') {
      if (/force|motion|speed|energy/.test(value)) return 'physics';
      if (/atom|element|reaction|acid|alkali/.test(value)) return 'chemistry';
      return 'biology';
    }
    return 'problem solving';
  }

  getConfidence(questionType, solutionAvailable) {
    const detection = Number(questionType.confidence || 0);
    return solutionAvailable ? Math.max(detection, 0.8) : detection;
  }

  getLearnerPrompt(domain, topic) {
    if (domain === 'reader') return `Find the exact part of the text that supports your answer about ${topic}, then explain it in your own words.`;
    if (domain === 'science') return `State the scientific idea involved in ${topic}, identify the evidence or variables, then apply it to the question.`;
    return `Identify what the question asks, choose the maths method for ${topic}, and write each calculation clearly.`;
  }

  getSteps(domain, topic) {
    if (domain === 'reader') return ['Underline the command word and key phrase.', 'Re-read the relevant sentence or paragraph.', 'Use a short quotation or precise detail as evidence.', 'Explain how that evidence answers the question.'];
    if (domain === 'science') return ['Write down the quantities, units, or scientific terms provided.', 'Choose the relevant rule, process, or equation.', 'Apply it carefully and keep units with numerical values.', 'Check that the conclusion matches the context.'];
    return this.mathsSteps(topic);
  }

  mathsSteps(topic) {
    const strategies = {
      percentage: ['Identify the original amount.', 'Convert the percentage to a multiplier or fraction.', 'Calculate the change, then check if the result is reasonable.'],
      fraction: ['Find a common denominator where needed.', 'Apply the required operation.', 'Simplify the result fully.'],
      algebra: ['Keep both sides of the equation balanced.', 'Undo operations in reverse order.', 'Substitute your value back to check it.'],
      gradient: ['Choose two clear points on the line.', 'Calculate rise divided by run.', 'Check the sign matches the direction of the line.'],
      rounding: ['Locate the requested place value.', 'Check the digit immediately to its right.', 'Round up only when that digit is 5 or more.']
    };
    return strategies[topic] || ['List the values and units given.', 'Choose the operation or formula that links them.', 'Calculate one step at a time.', 'Check the answer against the question wording.'];
  }

  getSelfCheck(domain, topic) {
    if (domain === 'reader') return 'Can you point to a specific word, phrase, or sentence that proves your answer?';
    if (domain === 'science') return 'Does your explanation use the correct scientific vocabulary and units?';
    if (topic === 'algebra') return 'Does substituting your answer back into the original equation make both sides equal?';
    return 'Does your answer have the correct unit, sign, precision, and scale?';
  }
}

export default QuestionTutorService;
