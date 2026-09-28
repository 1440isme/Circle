import { create } from 'zustand';
import { CircleEntity } from '@circle/types';

interface CircleState {
  activeCircleId: string | null;
  activeCircle: CircleEntity | null;
  isCreateModalOpen: boolean;
  isJoinModalOpen: boolean;
  setActiveCircleId: (id: string | null) => void;
  setActiveCircle: (circle: CircleEntity | null) => void;
  setCreateModalOpen: (open: boolean) => void;
  setJoinModalOpen: (open: boolean) => void;
}

export const useCircleStore = create<CircleState>((set) => ({
  activeCircleId: null,
  activeCircle: null,
  isCreateModalOpen: false,
  isJoinModalOpen: false,
  setActiveCircleId: (id) => set({ activeCircleId: id }),
  setActiveCircle: (circle) =>
    set({ activeCircle: circle, activeCircleId: circle ? circle.id : null }),
  setCreateModalOpen: (open) => set({ isCreateModalOpen: open }),
  setJoinModalOpen: (open) => set({ isJoinModalOpen: open }),
}));
