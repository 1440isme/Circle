'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';

export interface MomentPipViewProps {
  pipUrl: string;
  initialCornerIndex?: number;
  onSwap: () => void;
  onCornerChange?: (newCornerIndex: number) => void;
  cornerClasses?: Record<number, string>;
  sizeClasses?: string;
  className?: string;
}

const DEFAULT_FEED_CORNERS: Record<number, string> = {
  0: 'top-3 left-3',
  1: 'top-3 right-3',
  2: 'bottom-3 right-3',
  3: 'bottom-3 left-3',
};

export const MomentPipView: React.FC<MomentPipViewProps> = ({
  pipUrl,
  initialCornerIndex = 0,
  onSwap,
  onCornerChange,
  cornerClasses = DEFAULT_FEED_CORNERS,
  sizeClasses = 'w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl',
  className = '',
}) => {
  const [currentCorner, setCurrentCorner] = useState<number>(initialCornerIndex % 4);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const pipRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ clientX: number; clientY: number } | null>(null);
  const hasMovedRef = useRef<boolean>(false);

  useEffect(() => {
    setCurrentCorner(initialCornerIndex % 4);
  }, [initialCornerIndex]);

  const isVideo =
    pipUrl.includes('.webm') ||
    pipUrl.includes('.mp4') ||
    pipUrl.startsWith('data:video/');

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    // Only handle primary pointer (left click or touch)
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    dragStartRef.current = { clientX: e.clientX, clientY: e.clientY };
    hasMovedRef.current = false;
    setDragOffset({ x: 0, y: 0 });

    try {
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return;
    e.stopPropagation();

    const dx = e.clientX - dragStartRef.current.clientX;
    const dy = e.clientY - dragStartRef.current.clientY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 5) {
      hasMovedRef.current = true;
      setIsDragging(true);
      setDragOffset({ x: dx, y: dy });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return;
    e.stopPropagation();

    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {}

    const moved = hasMovedRef.current;
    dragStartRef.current = null;
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });

    if (!moved) {
      // It's a click / tap -> Swap main and PiP!
      onSwap();
      return;
    }

    // It was a drag: snap to the nearest corner of the parent container
    const pipEl = pipRef.current;
    const parentEl = pipEl?.parentElement;
    if (pipEl && parentEl) {
      const parentRect = parentEl.getBoundingClientRect();
      const pipRect = pipEl.getBoundingClientRect();
      const pipCenterX = pipRect.left + pipRect.width / 2;
      const pipCenterY = pipRect.top + pipRect.height / 2;

      const parentCenterX = parentRect.left + parentRect.width / 2;
      const parentCenterY = parentRect.top + parentRect.height / 2;

      // Determine quadrant:
      // 0: Top-Left (x < center, y < center)
      // 1: Top-Right (x >= center, y < center)
      // 2: Bottom-Right (x >= center, y >= center)
      // 3: Bottom-Left (x < center, y >= center)
      let newCorner = 0;
      if (pipCenterX < parentCenterX && pipCenterY < parentCenterY) {
        newCorner = 0; // Top-Left
      } else if (pipCenterX >= parentCenterX && pipCenterY < parentCenterY) {
        newCorner = 1; // Top-Right
      } else if (pipCenterX >= parentCenterX && pipCenterY >= parentCenterY) {
        newCorner = 2; // Bottom-Right
      } else {
        newCorner = 3; // Bottom-Left
      }

      setCurrentCorner(newCorner);
      onCornerChange?.(newCorner);
    }
  };

  const cornerPosClass = cornerClasses[currentCorner] || cornerClasses[0] || 'top-3 left-3';

  return (
    <div
      ref={pipRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        transform: isDragging
          ? `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) scale(1.04)`
          : undefined,
        touchAction: 'none',
      }}
      className={`absolute ${cornerPosClass} ${sizeClasses} border-2 border-circle-primary shadow-xl overflow-hidden bg-stone-900 z-20 cursor-grab active:cursor-grabbing select-none group/pip transition-all ${
        isDragging ? 'shadow-2xl z-30 transition-none' : 'duration-300 ease-out hover:scale-105 active:scale-95'
      } ${className}`}
      title="Bấm để đổi góc trước / sau, hoặc kéo để đổi vị trí góc"
    >
      {/* PiP Media */}
      {isVideo ? (
        <video
          src={pipUrl}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover pointer-events-none"
        />
      ) : (
        <img
          src={pipUrl}
          alt="Dual PiP"
          className="w-full h-full object-cover pointer-events-none"
          loading="lazy"
        />
      )}

      {/* Hover Swap Indicator Overlay */}
      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/pip:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
        <div className="p-1.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 text-white shadow-sm">
          <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
        </div>
      </div>
    </div>
  );
};
