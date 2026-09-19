# Example: Feed Page (Server Component)

Reference implementation of a Next.js Server Component page in `web/src/app/(main)/feed/page.tsx`.

---

```tsx
import React from 'react';
import { PostCard } from '@/components/feed/PostCard';
import { CreatePostBar } from '@/components/feed/CreatePostBar';

async function fetchInitialFeed() {
  const res = await fetch(`${process.env.INTERNAL_API_URL || 'http://localhost:4000'}/api/v1/posts`, {
    next: { revalidate: 30 },
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data || [];
}

export default async function FeedPage() {
  const posts = await fetchInitialFeed();

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6">
      <CreatePostBar />
      <div className="space-y-4">
        {posts.map((post: any) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
```
