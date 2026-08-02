import { test, expect } from "@jest/globals";
import assert from "node:assert";

import { buildSparxLoginPayload } from './sparxLoginBridge.js';

test('buildSparxLoginPayload includes credentials only for password login', () => {
  const passwordPayload = buildSparxLoginPayload({
    school: 'Test School',
    platform: 'sparxMaths',
    method: 'password',
    username: 'student',
    password: 'secret'
  });

  expect(passwordPayload).toEqual({
    adapter: 'sparx',
    action: 'login',
    school: 'Test School',
    platform: 'sparxMaths',
    method: 'password',
    username: 'student',
    password: 'secret'
  });

  const microsoftPayload = buildSparxLoginPayload({
    school: 'Test School',
    platform: 'sparxMaths',
    method: 'microsoft'
  });

  expect(microsoftPayload).toEqual({
    adapter: 'sparx',
    action: 'login',
    school: 'Test School',
    platform: 'sparxMaths',
    method: 'microsoft'
  });
});
