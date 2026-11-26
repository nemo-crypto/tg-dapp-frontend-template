import test from 'node:test';
import assert from 'node:assert/strict';
import fetcher from '../src/utils/fetch/client/fetcher.ts';
function browser(t, bodies) {
  const oldStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {configurable: true, value: {getItem() {return null;}, setItem() {}, removeItem() {}}});
  t.after(() => {if (oldStorage) Object.defineProperty(globalThis, 'localStorage', oldStorage); else delete globalThis.localStorage;});
  t.mock.method(globalThis, 'fetch', async () => new Response(bodies.shift(), {status: 200}));
}
test('HTML, empty and malformed response bodies return an error envelope without throwing', async t => {
  browser(t, ['<html>upstream unavailable</html>', '', '{broken', 'null']);
  for (let i = 0; i < 4; i++) {
    const response = await fetcher.get('items');
    assert.equal(response.status, 200);
    assert.equal(response.json.err, 'unknownError');
  }
});
test('structured API errors without a result are returned intact', async t => {
  browser(t, [JSON.stringify({success: false, err: 'RequestInvalid'})]);
  const response = await fetcher.get('items');
  assert.equal(response.json.err, 'RequestInvalid');
});

test('malformed token refresh responses do not crash the original request', async t => {
  browser(t, [JSON.stringify({result: {code: 10101}}), '<html>refresh unavailable</html>']);
  const response = await fetcher.get('items');
  assert.equal(response.json.result.code, 10101);
  assert.equal(fetch.mock.calls.length, 2);
});
