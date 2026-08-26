import { expect, test } from '@jest/globals';

import { BaseAdapter } from '../core/adapters/BaseAdapter.js';
import { AdapterRegistry } from '../core/registry/AdapterRegistry.js';

class TestAdapter extends BaseAdapter {
  get metadata() {
    return { id: 'test', name: 'Test adapter' };
  }

  async executeTask(payload) {
    if (payload.fail) {
      throw new Error('task failed');
    }

    return { success: true };
  }
}

test('executes a ready adapter and restores its ready state', async () => {
  const registry = new AdapterRegistry();
  const adapter = new TestAdapter();
  await adapter.initialize();
  registry.register(adapter);

  await expect(registry.execute('test', {}, {})).resolves
    .toEqual({ success: true });
  expect(adapter.state).toBe('READY');
});

test('marks a failing adapter as failed', async () => {
  const registry = new AdapterRegistry();
  const adapter = new TestAdapter();
  await adapter.initialize();
  registry.register(adapter);

  await expect(registry.execute('test', { fail: true }, {})).rejects
    .toThrow('task failed');
  expect(adapter.state).toBe('FAILED');
});
