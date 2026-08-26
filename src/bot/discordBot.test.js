import { expect, test } from '@jest/globals';

import { DiscordBot } from './discordBot.js';
import ScheduleManager from '../session/scheduleManager.js';

test('schedule buttons render the interacting user’s schedules', async () => {
  const scheduleManager = new ScheduleManager();
  scheduleManager.createSchedule('user-1', {
    platform: 'sparxMaths',
    time: '18:30'
  });

  const bot = {
    app: { scheduleManager },
    respondToInteraction: async (_interaction, payload) => payload
  };

  const payload = await DiscordBot.prototype.handleScheduleButton.call(
    bot,
    { user: { id: 'user-1' } },
    'manage'
  );

  expect(payload.embeds).toHaveLength(1);
  expect(payload.components).toHaveLength(1);
});
