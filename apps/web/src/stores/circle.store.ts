import { create } from 'zustand';
import { CircleEntity } from '@circle/types';

interface CircleState {
  activeCircleId: string | null;
  activeCircle: CircleEntity | null;
  activeCircleView: string; // 'general' | 'moments' | string
  activeChannelId: string | null;
  isCreateModalOpen: boolean;
  isJoinModalOpen: boolean;
  isManageModalOpen: boolean;
  manageActiveTab: 'chatInfo' | 'members' | 'privacySupport' | 'circleSettings' | 'supportReports' | 'settings' | 'invites' | 'requests';
  setActiveCircleId: (id: string | null) => void;
  setActiveCircle: (circle: CircleEntity | null) => void;
  setActiveCircleView: (view: string) => void;
  setActiveChannelId: (id: string | null) => void;
  setCreateModalOpen: (open: boolean) => void;
  setJoinModalOpen: (open: boolean) => void;
  setManageModalOpen: (
    open: boolean,
    tab?: 'chatInfo' | 'members' | 'privacySupport' | 'circleSettings' | 'supportReports' | 'settings' | 'invites' | 'requests',
  ) => void;
}

export const useCircleStore = create<CircleState>((set) => ({
  activeCircleId: null,
  activeCircle: null,
  activeCircleView: 'general',
  activeChannelId: null,
  isCreateModalOpen: false,
  isJoinModalOpen: false,
  isManageModalOpen: false,
  manageActiveTab: 'settings',
  setActiveCircleId: (id) => set({ activeCircleId: id }),
  setActiveCircle: (circle) => {
    const channels = (circle as any)?.channels;
    const defaultChannelId = channels && channels.length > 0 ? channels[0].id : null;
    set({
      activeCircle: circle,
      activeCircleId: circle ? circle.id : null,
      activeCircleView: 'general',
      activeChannelId: defaultChannelId,
    });
  },
  setActiveCircleView: (view) => set({ activeCircleView: view }),
  setActiveChannelId: (id) => set({ activeChannelId: id }),
  setCreateModalOpen: (open) => set({ isCreateModalOpen: open }),
  setJoinModalOpen: (open) => set({ isJoinModalOpen: open }),
  setManageModalOpen: (open, tab = 'settings') =>
    set({ isManageModalOpen: open, manageActiveTab: tab }),
}));

