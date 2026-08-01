import test from 'node:test';
import assert from 'node:assert/strict';

import { buildSparxLoginPayload } from './sparxLoginBridge.js';

test('buildSparxLoginPayload includes credentials only for password login', () => {
  const passwordPayload = buildSparxLoginPayload({
    school: 'Test School',
    method: 'password',
    username: 'student',
    password: 'secret'
  });

  assert.deepEqual(passwordPayload, {
    adapter: 'sparx',
    action: 'login',
    school: 'Test School',
    method: 'password',
    username: 'student',
    password: 'secret'
  });

  const microsoftPayload = buildSparxLoginPayload({
    school: 'Test School',
    method: 'microsoft'
  });

  assert.deepEqual(microsoftPayload, {
    adapter: 'sparx',
    action: 'login',
    school: 'Test School',
    method: 'microsoft'
  });
});
