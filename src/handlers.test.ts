import { strict as assert } from 'node:assert';
import { after, before, describe, it } from 'node:test';
import type { FastifyInstance } from 'fastify';
import { buildApp } from './app.js';

describe('handlers', () => {
  let app: FastifyInstance;

  before(async () => {
    app = await buildApp({ logger: false });
    await app.ready();
  });

  after(async () => {
    await app.close();
  });

  it('GET /ping returns ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/ping' });
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.json(), { status: 'ok' });
  });

  it('GET /v1/posts returns seeded posts', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/posts' });
    assert.equal(res.statusCode, 200);
    const body = res.json() as Array<{ id: string; title: string }>;
    assert.equal(body.length, 2);
  });

  it('POST /v1/posts creates a post', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/posts',
      payload: { title: 'new post' },
    });
    assert.equal(res.statusCode, 201);
    const body = res.json() as { id: string; title: string };
    assert.equal(body.title, 'new post');
    assert.match(body.id, /^pst-/);
  });

  it('POST /v1/posts rejects empty title', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/posts',
      payload: { title: '' },
    });
    assert.equal(res.statusCode, 400);
  });

  it('POST /v1/posts rejects whitespace-only title', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/posts',
      payload: { title: '   ' },
    });
    assert.equal(res.statusCode, 400);
  });

  it('GET /v1/posts/:id returns 404 for missing post', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/posts/nope' });
    assert.equal(res.statusCode, 404);
    const body = res.json() as { error: string; id: string };
    assert.equal(body.error, 'post not found');
    assert.equal(body.id, 'nope');
  });

  it('GET /v1/posts/:id returns the seeded post', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/posts/pst-seed-1' });
    assert.equal(res.statusCode, 200);
    const body = res.json() as { id: string; title: string };
    assert.equal(body.id, 'pst-seed-1');
  });

  it('GET /v1/posts/slow respects ms param', async () => {
    const started = Date.now();
    const res = await app.inject({ method: 'GET', url: '/v1/posts/slow?ms=50' });
    const elapsed = Date.now() - started;
    assert.equal(res.statusCode, 200);
    assert.ok(elapsed >= 50, `expected >=50ms, got ${elapsed}`);
  });

  it('GET /v1/posts/flaky returns 200 or 500', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/posts/flaky' });
    assert.ok(res.statusCode === 200 || res.statusCode === 500);
  });
});
