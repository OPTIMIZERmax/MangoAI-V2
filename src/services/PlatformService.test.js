import { expect, test } from '@jest/globals';

import PlatformService from './PlatformService.js';

test('registers the Sparx adapter without launching a browser', async () => {
  const service = new PlatformService();

  await service.adapterInitialization;

  expect(service.registry.registeredAdapters.has('sparx')).toBe(true);
  expect(service.registry.registeredAdapters.get('sparx').instance.state)
    .toBe('UNINITIALIZED');

  await service.shutdown();
});

test('rejects missing and unavailable platforms before executing a task', async () => {
  const service = new PlatformService();

  await expect(service.execute()).rejects.toThrow('A platform is required.');
  await expect(service.execute('seneca')).rejects
    .toThrow("No adapter is installed for 'seneca'.");

  await service.shutdown();
});
