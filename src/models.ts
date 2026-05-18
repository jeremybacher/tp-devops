export interface Post {
  id: string;
  title: string;
}

export interface CreatePostRequest {
  title: string;
}

const postSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    title: { type: 'string' },
  },
} as const;

const postArraySchema = {
  type: 'array',
  items: postSchema,
} as const;

const notFoundSchema = {
  type: 'object',
  properties: {
    error: { type: 'string' },
    id: { type: 'string' },
  },
} as const;

export const createPostSchema = {
  tags: ['posts'],
  summary: 'Create a post',
  body: {
    type: 'object',
    required: ['title'],
    properties: {
      title: { type: 'string', minLength: 1 },
    },
    additionalProperties: false,
  },
  response: {
    201: postSchema,
  },
} as const;

export const getPostParamsSchema = {
  tags: ['posts'],
  summary: 'Get a post by ID',
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' },
    },
  },
  response: {
    200: postSchema,
    404: notFoundSchema,
  },
} as const;

export const slowQuerySchema = {
  tags: ['posts'],
  summary: 'List posts (with simulated delay)',
  querystring: {
    type: 'object',
    properties: {
      ms: { type: 'integer', minimum: 0, maximum: 10000 },
    },
  },
  response: {
    200: postArraySchema,
  },
} as const;

export const listPostsSchema = {
  tags: ['posts'],
  summary: 'List all posts',
  response: {
    200: postArraySchema,
  },
} as const;

export const flakyPostsSchema = {
  tags: ['posts'],
  summary: 'List posts (50% failure rate)',
  response: {
    200: postArraySchema,
  },
} as const;

export const pingSchema = {
  tags: ['health'],
  summary: 'Health check',
  response: {
    200: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['ok'] },
      },
    },
  },
} as const;
