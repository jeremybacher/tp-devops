import type { FastifyReply, FastifyRequest } from 'fastify';
import { setTimeout as sleep } from 'node:timers/promises';
import xid from 'xid-js';
import type { CreatePostRequest, Post } from './models.js';
import type { PostStore } from './store.js';

export function pingHandler() {
  return async () => ({ status: 'ok' });
}

export function listPostsHandler(store: PostStore) {
  return async () => store.list();
}

export function getPostHandler(store: PostStore) {
  return async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = req.params;
    const post = store.get(id);
    if (post) {
      req.log.info({ id }, 'post found');
      return post;
    }
    req.log.warn({ id }, 'post not found');
    return reply.code(404).send({ error: 'post not found', id });
  };
}

export function createPostHandler(store: PostStore) {
  return async (req: FastifyRequest<{ Body: CreatePostRequest }>, reply: FastifyReply) => {
    const title = req.body.title.trim();
    if (title.length === 0) {
      req.log.warn('create_post: empty title rejected');
      return reply.code(400).send({ error: 'title must not be empty' });
    }
    const post: Post = { id: `pst-${xid.next()}`, title };
    store.create(post);
    req.log.info({ id: post.id }, 'post created');
    return reply.code(201).send(post);
  };
}

export function slowPostsHandler(store: PostStore) {
  return async (req: FastifyRequest<{ Querystring: { ms?: number } }>) => {
    const ms = Math.min(req.query.ms ?? 2000, 10000);
    req.log.info({ ms }, 'slow endpoint sleeping');
    await sleep(ms);
    return store.list();
  };
}

export function flakyPostsHandler(store: PostStore) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    if (Math.random() < 0.5) {
      req.log.error('flaky endpoint: simulated failure');
      return reply.code(500).send({ error: 'random failure' });
    }
    return store.list();
  };
}
