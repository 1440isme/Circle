'use client';

import React from 'react';
import { CircleAlbumsView } from '@/components/tools/CircleAlbumsView';
import { useCircleStore } from '@/stores/circle.store';
import { useMyCirclesQuery } from '@/hooks/use-circle-queries';

export default function AlbumsPage() {
  const activeCircle = useCircleStore((s) => s.activeCircle);
  const { data: circles = [] } = useMyCirclesQuery();
  const circleId = activeCircle?.id || circles[0]?.id;

  if (!circleId) return null;
  return <CircleAlbumsView circleId={circleId} />;
}
