import type { FastifyInstance } from 'fastify';
import {
  createPostHandler,
  flakyPostsHandler,
  getPostHandler,
  listPostsHandler,
  pingHandler,
  slowPostsHandler,
} from './handlers.js';
import {
  createPostSchema,
  flakyPostsSchema,
  getPostParamsSchema,
  listPostsSchema,
  pingSchema,
  slowQuerySchema,
} from './models.js';
import type { PostStore } from './store.js';

export async function registerRoutes(app: FastifyInstance, store: PostStore): Promise<void> {
  app.get('/ping', { schema: pingSchema }, pingHandler());

  app.get('/v1/posts', { schema: listPostsSchema }, listPostsHandler(store));

  app.get('/v1/posts/slow', { schema: slowQuerySchema }, slowPostsHandler(store));

  app.get('/v1/posts/flaky', { schema: flakyPostsSchema }, flakyPostsHandler(store));

  app.post('/v1/posts', { schema: createPostSchema }, createPostHandler(store));

  app.get('/v1/posts/:id', { schema: getPostParamsSchema }, getPostHandler(store));
}
