import test from 'node:test';
import assert from 'node:assert/strict';
import fetcher from '../src/utils/fetch/client/fetcher.ts';
let sequence = 0;
function session(t) {
  const suffix = ++sequence;
  const oldToken = `old-${suffix}`, oldRefresh = `refresh-${suffix}`;
  const values = new Map([['token', oldToken], ['refreshToken', oldRefresh]]);
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {configurable: true, value: {getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key)}});
  t.after(() => {if (previous) Object.defineProperty(globalThis, 'localStorage', previous); else delete globalThis.localStorage;});
  let releaseLate;
  const late = new Promise(resolve => {releaseLate = resolve;});
  let release;
  const gate = new Promise(resolve => {release = resolve;});
  let refreshes = 0;
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    const body = JSON.parse(options.body);
    if (body.path === 'user_refreshToken') {
      refreshes++;
      await gate;
      return new Response(JSON.stringify({result: {code: 0, data: {token: `new-${suffix}`, refreshToken: `renewed-${suffix}`, refreshTokenExpireAt: 123}}}));
    }
    if (body.path === 'late' && body.token === `Bearer ${oldToken}`) await late;
    return new Response(JSON.stringify({result: {code: body.token === `Bearer ${oldToken}` ? 10101 : 0}}));
  });
  return {values, release, releaseLate, get refreshes() {return refreshes;}, suffix};
}
test('concurrent expired requests share one refresh and both retry with the renewed token', async t => {
  const s = session(t);
  const first = fetcher.get('one'), second = fetcher.get('two');
  await new Promise(resolve => setImmediate(resolve));
  s.release();
  const results = await Promise.all([first, second]);
  assert.ok(results.every(response => response.json.result.code === 0));
  assert.equal(s.refreshes, 1);
});

test('late expired responses reuse the refresh that already completed', async t => {
  const s = session(t);
  const first = fetcher.get('one'), late = fetcher.get('late');
  await new Promise(resolve => setImmediate(resolve));
  s.release();
  assert.equal((await first).json.result.code, 0);
  s.releaseLate();
  assert.equal((await late).json.result.code, 0);
  assert.equal(s.refreshes, 1);
});

test('a refresh completing after an account switch cannot restore the old session', async t => {
  const s = session(t);
  const result = fetcher.get('one');
  await new Promise(resolve => setImmediate(resolve));
  s.values.set('token', 'other-account');
  s.values.set('refreshToken', 'other-refresh');
  s.release();
  assert.equal((await result).json.result.code, 10101);
  assert.equal(s.values.get('token'), 'other-account');
  assert.equal(s.values.get('refreshToken'), 'other-refresh');
});
