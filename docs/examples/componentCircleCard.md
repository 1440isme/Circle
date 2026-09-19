# Example: CircleCard Component

Reference implementation of a reusable UI component in Next.js web application (`web/src/components/circle/CircleCard.tsx`).

---

```tsx
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface CircleCardProps {
  id: string;
  name: string;
  handle: string;
  avatarUrl?: string;
  memberCount: number;
}

export const CircleCard: React.FC<CircleCardProps> = ({
  id,
  name,
  handle,
  avatarUrl,
  memberCount,
}) => {
  return (
    <Link href={`/circle/${id}`} className="group block p-4 rounded-xl border border-border bg-card hover:border-primary transition-all">
      <div className="flex items-center space-x-3">
        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-muted">
          {avatarUrl ? (
            <Image src={avatarUrl} alt={name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-bold text-lg text-foreground">
              {name.charAt(0)}
            </div>
          )}
        </div>
        <div>
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{name}</h3>
          <p className="text-sm text-muted-foreground">@{handle} · {memberCount} members</p>
        </div>
      </div>
    </Link>
  );
};
```
