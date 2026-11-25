'use client';

import React from 'react';
import { DailyMomentsFeed } from '@/components/moments/DailyMomentsFeed';
import { useCircleStore } from '@/stores/circle.store';
import { useMyCirclesQuery } from '@/hooks/use-circle-queries';

export default function MomentsPage() {
  const activeCircle = useCircleStore((s) => s.activeCircle);
  const { data: circles = [] } = useMyCirclesQuery();
  const circleId = activeCircle?.id || circles[0]?.id;

  if (!circleId) return null;
  return <DailyMomentsFeed circleId={circleId} />;
}
