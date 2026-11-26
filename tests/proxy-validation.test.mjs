import './helpers/register-routes.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {NextRequest} from 'next/server.js';
const routes = await Promise.all(['service', 'session'].map(name => import(`../src/app/api/${name}/route.ts`)));
function request(body) {return new NextRequest('https://example.test/api/service', {method: 'POST', headers: {'Content-Type': 'application/json'}, body});}
test('both proxy routes reject invalid JSON and invalid request shapes with 400', async () => {
  for (const route of routes) {
    for (const body of ['{broken', 'null', '[]', '{}', '{"path":1,"method":"GET"}', '{"path":"x","method":12}']) {
      assert.equal((await route.POST(request(body))).status, 400);
    }
  }
});
test('both proxy routes preserve valid falsy RPC parameters', async t => {
  const sent = [];
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    sent.push(JSON.parse(options.body).params);
    return new Response(JSON.stringify({result: {code: 0}}), {status: 200});
  });
  for (const route of routes) {
    for (const data of [false, 0, '']) {
      assert.equal((await route.POST(request(JSON.stringify({path: 'set_value', method: 'POST', data})))).status, 200);
    }
  }
  assert.deepEqual(sent, [false, 0, '', false, 0, '']);
});

test('invalid authentication and unsupported methods never reach the upstream API', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => {throw new Error('must not send');});
  for (const route of routes) {
    for (const input of [{path: 'x', method: 'POST', token: {}}, {path: 'x', method: 'TRACE'}, {path: ' ', method: 'GET'}]) {
      assert.equal((await route.POST(request(JSON.stringify(input)))).status, 400);
    }
  }
  assert.equal(fetch.mock.calls.length, 0);
});
