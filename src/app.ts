import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
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

  await app.register(fastifySwagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'tp-devops API',
        description: 'TP DevOps REST API',
        version: process.env.APP_VERSION ?? '0.0.0',
      },
      tags: [
        { name: 'health', description: 'Health endpoints' },
        { name: 'posts', description: 'Post management' },
      ],
    },
  });

  await app.register(fastifySwaggerUi, { routePrefix: '/docs' });

  const store = options.store ?? createSeededStore();
  await registerRoutes(app, store);
  return app;
}
