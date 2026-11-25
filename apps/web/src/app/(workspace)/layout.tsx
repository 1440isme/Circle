'use client';

import React, { useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Sidebar } from '@/components/navigation/Sidebar';
import { PresenceRail } from '@/components/presence/PresenceRail';
import { useCircleStore } from '@/stores/circle.store';
import { useMyCirclesQuery } from '@/hooks/use-circle-queries';

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const activeCircle = useCircleStore((s) => s.activeCircle);
  const setActiveCircle = useCircleStore((s) => s.setActiveCircle);
  const { data: circles = [], isLoading } = useMyCirclesQuery();

  // If user visits /chat or any workspace page directly, auto-select first circle if none active
  useEffect(() => {
    if (!activeCircle && circles.length > 0) {
      setActiveCircle(circles[0]);
    }
  }, [activeCircle, circles, setActiveCircle]);

  return (
    <AppShell>
      {/* 3 columns sticky together in the center of the screen */}
      <div className="flex w-full max-w-[1400px] 2xl:max-w-[1600px] h-full min-h-0 justify-center mx-auto overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col h-full min-h-0 overflow-hidden relative min-w-0">
          {children}
        </main>
        <PresenceRail />
      </div>
    </AppShell>
  );
}
