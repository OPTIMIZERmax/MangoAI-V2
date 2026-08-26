import { expect, test } from '@jest/globals';

import QuestionTutorService from '../src/services/QuestionTutorService.js';

test('builds a focused maths tutoring plan', () => {
  const service = new QuestionTutorService();
  const plan = service.build({
    platform: 'sparxMaths',
    questionType: { type: 'algebra', confidence: 0.9 },
    content: { normalizedText: 'Solve 3x + 5 = 20' },
    solution: { success: true }
  });

  expect(plan).toMatchObject({
    domain: 'maths',
    topic: 'algebra',
    solutionAvailable: true,
    needsReview: false
  });
  expect(plan.steps).toContain('Keep both sides of the equation balanced.');
});

test('uses evidence-based guidance for Sparx Reader', () => {
  const plan = new QuestionTutorService().build({
    platform: 'sparxReader',
    questionType: { type: 'unknown', confidence: 0.2 },
    content: { text: 'What can you infer from this paragraph?' }
  });

  expect(plan.domain).toBe('reader');
  expect(plan.steps).toHaveLength(4);
  expect(plan.selfCheck).toContain('specific word');
});

test('uses unit-aware guidance for Sparx Science', () => {
  const plan = new QuestionTutorService().build({
    platform: 'sparxScience',
    questionType: { type: 'unknown', confidence: 0.3 },
    content: { text: 'Calculate the force using mass and acceleration.' }
  });

  expect(plan).toMatchObject({ domain: 'science', topic: 'physics' });
  expect(plan.selfCheck).toContain('units');
});
