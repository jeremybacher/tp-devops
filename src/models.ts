export interface Post {
  id: string;
  title: string;
}

export interface CreatePostRequest {
  title: string;
}

export const createPostSchema = {
  body: {
    type: 'object',
    required: ['title'],
    properties: {
      title: { type: 'string', minLength: 1 },
    },
    additionalProperties: false,
  },
} as const;

export const getPostParamsSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' },
    },
  },
} as const;

export const slowQuerySchema = {
  querystring: {
    type: 'object',
    properties: {
      ms: { type: 'integer', minimum: 0 },
    },
  },
} as const;
