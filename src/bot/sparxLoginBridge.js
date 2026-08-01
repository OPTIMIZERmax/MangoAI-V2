export function buildSparxLoginPayload(input = {}) {
  const payload = {
    adapter: 'sparx',
    action: 'login',
    school: input.school?.trim() || '',
    method: input.method === 'microsoft' ? 'microsoft' : 'password'
  };

  if (payload.method === 'password') {
    if (input.username?.trim()) {
      payload.username = input.username.trim();
    }

    if (input.password?.trim()) {
      payload.password = input.password.trim();
    }
  }

  return payload;
}

export async function dispatchSparxLogin(engine, input = {}) {
  if (!engine || typeof engine.execute !== 'function') {
    throw new Error('Engine dispatcher is not available.');
  }

  const payload = buildSparxLoginPayload(input);

  return engine.execute('sparx', payload, {
    reportProgress: async () => {}
  });
}
