import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import logger from '../utils/logger.js';
import { AIError } from '../utils/errorHandler.js';
import config from '../utils/config.js';

export class BedrockSolver {
  constructor() {
    this.client = new BedrockRuntimeClient({
      region: config.bedrock.region,
    });
    this.modelId = config.bedrock.modelId;
    this.requestCount = 0;
    this.tokenUsage = {
      input: 0,
      output: 0,
    };
  }

  /**
   * Solve a question using Bedrock Claude
   */
  async solveQuestion(question, context = {}) {
    try {
      const systemPrompt = this._buildSystemPrompt(context);
      const userPrompt = this._buildUserPrompt(question);

      const params = {
        modelId: this.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-06-01',
          max_tokens: 2048,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: userPrompt,
            },
          ],
        }),
      };

      const command = new InvokeModelCommand(params);
      const response = await this.client.send(command);

      const result = JSON.parse(new TextDecoder().decode(response.body));

      this.requestCount++;
      this.tokenUsage.input += result.usage?.input_tokens || 0;
      this.tokenUsage.output += result.usage?.output_tokens || 0;

      logger.info(
        {
          requestCount: this.requestCount,
          inputTokens: result.usage?.input_tokens,
          outputTokens: result.usage?.output_tokens,
        },
        'Bedrock request completed'
      );

      return {
        answer: result.content[0]?.text || '',
        confidence: this._calculateConfidence(result.content[0]?.text),
        tokens: result.usage,
        raw: result,
      };
    } catch (error) {
      throw new AIError(`Bedrock request failed: ${error.message}`, {
        question: question.substring(0, 100),
        error: error.toString(),
      });
    }
  }

  /**
   * Batch solve multiple questions
   */
  async solveMultiple(questions, context = {}) {
    const results = [];

    for (const question of questions) {
      try {
        const result = await this.solveQuestion(question, context);
        results.push({
          question,
          success: true,
          result,
        });
      } catch (error) {
        results.push({
          question,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Build system prompt
   */
  _buildSystemPrompt(context = {}) {
    const platform = context.platform || 'unknown';
    const subject = context.subject || 'general';

    return `You are an expert homework solver assistant specialized in ${platform} tasks for ${subject}.

Your responsibilities:
1. Provide accurate, educational answers
2. Explain your reasoning clearly
3. When appropriate, include steps for learning
4. Format answers according to platform requirements
5. Flag ambiguous questions

Context:
- Platform: ${platform}
- Subject: ${subject}
- Difficulty: ${context.difficulty || 'unknown'}

Respond with clear, concise answers suitable for submission.`;
  }

  /**
   * Build user prompt
   */
  _buildUserPrompt(question) {
    return `Please solve this question:\n\n${question}\n\nProvide the answer in a format ready for submission.`;
  }

  /**
   * Calculate confidence score
   */
  _calculateConfidence(answer) {
    if (!answer) return 0;

    let score = 0.5; // Base score

    // Factors that increase confidence
    if (answer.length > 20) score += 0.1;
    if (answer.includes('step') || answer.includes('therefore')) score += 0.15;
    if (!/\?/.test(answer)) score += 0.15; // No unanswered questions
    if (answer.length < 1000) score += 0.1; // Concise answer

    return Math.min(score, 1);
  }

  /**
   * Get usage statistics
   */
  getStats() {
    return {
      requestCount: this.requestCount,
      tokenUsage: this.tokenUsage,
      averageOutputTokens: this.requestCount > 0 ? this.tokenUsage.output / this.requestCount : 0,
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.requestCount = 0;
    this.tokenUsage = { input: 0, output: 0 };
  }
}

export default BedrockSolver;
