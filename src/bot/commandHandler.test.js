import { expect, test } from '@jest/globals';

import CommandHandler from './commandHandler.js';
import ScheduleManager from '../session/scheduleManager.js';

test('registers all public prefix commands', () => {
  const handler = new CommandHandler({});

  handler.registerCommands();

  expect(Array.from(handler.commands.keys())).toEqual([
    'homework',
    'tasks',
    'pastpapers',
    'pastpaper',
    'premium',
    'trial',
    'schedule',
    'support',
    'ticket',
    'stats'
  ]);
});

test('creates a validated reminder schedule', async () => {
  const scheduleManager = new ScheduleManager();
  const sent = [];
  const handler = new CommandHandler({ scheduleManager });
  const message = {
    author: { id: 'user-1' },
    channel: { send: async payload => sent.push(payload) }
  };

  await handler.handleSchedule(message, [
    'create',
    'sparxMaths',
    '18:30',
    'Monday,Wednesday'
  ]);

  expect(scheduleManager.getUserSchedules('user-1')).toEqual([
    expect.objectContaining({
      platform: 'sparxMaths',
      time: '18:30',
      daysOfWeek: ['Monday', 'Wednesday']
    })
  ]);
  expect(sent).toHaveLength(1);
});

test('rejects invalid reminder times and weekdays', async () => {
  const scheduleManager = new ScheduleManager();
  const handler = new CommandHandler({ scheduleManager });
  const replies = [];
  const message = {
    author: { id: 'user-1' },
    reply: async payload => replies.push(payload)
  };

  await handler.handleSchedule(message, [
    'create', 'sparxMaths', '25:00', 'Funday'
  ]);

  expect(scheduleManager.getUserSchedules('user-1')).toHaveLength(0);
  expect(replies[0]).toContain('Usage:');
});
