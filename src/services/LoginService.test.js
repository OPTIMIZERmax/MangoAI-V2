import { expect, test } from '@jest/globals';

import LoginService from './LoginService.js';

test('parses cookie-header logins without losing values containing equals signs', () => {
  const service = new LoginService({});

  expect(service.parseCookies('session=abc=123; preference=dark')).toEqual([
    { name: 'session', value: 'abc=123' },
    { name: 'preference', value: 'dark' }
  ]);
});

test('accepts Cookie Editor JSON exports', () => {
  const service = new LoginService({});
  const cookies = [{ name: 'session', value: 'abc', domain: '.example.test' }];

  expect(service.parseCookies(JSON.stringify(cookies))).toEqual(cookies);
});

test('rejects malformed cookie input', () => {
  const service = new LoginService({});

  expect(() => service.parseCookies('not-a-cookie')).toThrow(
    'Invalid cookie: not-a-cookie'
  );
});
