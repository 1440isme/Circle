'use client';

import React from 'react';
import { CircleWheelView } from '@/components/tools/CircleWheelView';
import { useCircleStore } from '@/stores/circle.store';
import { useMyCirclesQuery } from '@/hooks/use-circle-queries';

export default function WheelPage() {
  const activeCircle = useCircleStore((s) => s.activeCircle);
  const { data: circles = [] } = useMyCirclesQuery();
  const circleId = activeCircle?.id || circles[0]?.id;

  if (!circleId) return null;
  return <CircleWheelView circleId={circleId} />;
}
