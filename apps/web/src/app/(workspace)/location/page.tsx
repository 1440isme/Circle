'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useCircleStore } from '@/stores/circle.store';
import { useMyCirclesQuery } from '@/hooks/use-circle-queries';

const CircleLocationView = dynamic(
  () => import('@/components/tools/CircleLocationView').then((mod) => mod.CircleLocationView),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-circle-primary border-t-transparent" />
      </div>
    ),
  },
);

export default function LocationPage() {
  const activeCircle = useCircleStore((s) => s.activeCircle);
  const { data: circles = [] } = useMyCirclesQuery();
  const circleId = activeCircle?.id || circles[0]?.id;

  if (!circleId) return null;
  return <CircleLocationView circleId={circleId} />;
}
