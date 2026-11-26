import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {once} from 'node:events';
import fetcher from '../src/utils/fetch/server/fetcher.ts';
async function endpoint(t) {
  const received = [];
  const server = createServer(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    received.push({method: req.method, token: req.headers.authorization, body: JSON.parse(body)});
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({result: {code: 0}}));
  });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const old = process.env.NEXT_PUBLIC_API_URL;
  process.env.NEXT_PUBLIC_API_URL = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => {if (old === undefined) delete process.env.NEXT_PUBLIC_API_URL; else process.env.NEXT_PUBLIC_API_URL = old; server.closeAllConnections(); await new Promise(resolve => server.close(resolve));});
  return received;
}
test('GET and HEAD RPC calls send their envelopes over POST', async t => {
  const received = await endpoint(t);
  for (const method of ['GET', 'HEAD']) {
    const result = await fetcher.request(method, 'list_items', {page: 2}, 'Bearer demo');
    assert.equal(result.status, 200);
  }
  assert.equal(received.length, 2);
  for (const request of received) {
    assert.equal(request.method, 'POST');
    assert.equal(request.token, 'Bearer demo');
    assert.deepEqual(request.body, {id: 0, jsonrpc: '2.0', method: 'list_items', params: {page: 2}});
  }
});
