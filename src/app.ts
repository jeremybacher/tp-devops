import Fastify, { type FastifyInstance } from 'fastify';
import { registerRoutes } from './routes.js';
import { createSeededStore, type PostStore } from './store.js';

export interface BuildAppOptions {
  store?: PostStore;
  logger?: boolean;
}

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger:
      options.logger === false
        ? false
        : {
            level: process.env.LOG_LEVEL || 'info',
          },
  });
  const store = options.store ?? createSeededStore();
  await registerRoutes(app, store);
  return app;
}
