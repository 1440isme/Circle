import { create } from 'zustand';
import { CircleEntity } from '@circle/types';

interface CircleState {
  activeCircleId: string | null;
  activeCircle: CircleEntity | null;
  activeCircleView: string; // 'general' | 'moments' | string
  isCreateModalOpen: boolean;
  isJoinModalOpen: boolean;
  isManageModalOpen: boolean;
  manageActiveTab: 'chatInfo' | 'members' | 'privacySupport' | 'circleSettings' | 'settings' | 'invites' | 'requests';
  setActiveCircleId: (id: string | null) => void;
  setActiveCircle: (circle: CircleEntity | null) => void;
  setActiveCircleView: (view: string) => void;
  setCreateModalOpen: (open: boolean) => void;
  setJoinModalOpen: (open: boolean) => void;
  setManageModalOpen: (
    open: boolean,
    tab?: 'chatInfo' | 'members' | 'privacySupport' | 'circleSettings' | 'settings' | 'invites' | 'requests',
  ) => void;
}

export const useCircleStore = create<CircleState>((set) => ({
  activeCircleId: null,
  activeCircle: null,
  activeCircleView: 'general',
  isCreateModalOpen: false,
  isJoinModalOpen: false,
  isManageModalOpen: false,
  manageActiveTab: 'settings',
  setActiveCircleId: (id) => set({ activeCircleId: id }),
  setActiveCircle: (circle) =>
    set({ activeCircle: circle, activeCircleId: circle ? circle.id : null, activeCircleView: 'general' }),
  setActiveCircleView: (view) => set({ activeCircleView: view }),
  setCreateModalOpen: (open) => set({ isCreateModalOpen: open }),
  setJoinModalOpen: (open) => set({ isJoinModalOpen: open }),
  setManageModalOpen: (open, tab = 'settings') =>
    set({ isManageModalOpen: open, manageActiveTab: tab }),
}));
