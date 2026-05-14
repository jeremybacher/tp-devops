import type { Post } from './models.js';

export class PostStore {
  private posts: Post[];

  constructor(initial: Post[] = []) {
    this.posts = [...initial];
  }

  list(): Post[] {
    return [...this.posts];
  }

  get(id: string): Post | undefined {
    return this.posts.find((p) => p.id === id);
  }

  create(post: Post): void {
    this.posts.push(post);
  }
}

export function createSeededStore(): PostStore {
  return new PostStore([
    { id: 'pst-seed-1', title: 'Hello, DevOps!' },
    { id: 'pst-seed-2', title: 'CI/CD with GitHub Actions' },
  ]);
}
