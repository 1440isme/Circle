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
  activeCallStageSession: any | null;
  setActiveCallStageSession: (session: any | null) => void;
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
  activeCallStageSession: null,
  setActiveCallStageSession: (session) => set({ activeCallStageSession: session }),
  isCreateModalOpen: false,
  isJoinModalOpen: false,
  isManageModalOpen: false,
  manageActiveTab: 'settings',
  setActiveCircleId: (id) => set({ activeCircleId: id }),
  setActiveCircle: (circle) => {
    set((state) => {
      if (!circle) {
        return {
          activeCircle: null,
          activeCircleId: null,
          activeChannelId: null,
        };
      }
      const mergedCircle =
        state.activeCircle && state.activeCircle.id === circle.id
          ? { ...state.activeCircle, ...circle }
          : circle;
      const channels = (mergedCircle as any)?.channels;
      const defaultChannelId =
        channels && channels.length > 0
          ? state.activeChannelId && channels.some((c: any) => c.id === state.activeChannelId)
            ? state.activeChannelId
            : channels[0].id
          : null;
      return {
        activeCircle: mergedCircle,
        activeCircleId: mergedCircle.id,
        activeCircleView: state.activeCircleId === mergedCircle.id ? state.activeCircleView : 'general',
        activeChannelId: defaultChannelId,
      };
    });
  },
  setActiveCircleView: (view) => set({ activeCircleView: view }),
  setActiveChannelId: (id) => set({ activeChannelId: id }),
  setCreateModalOpen: (open) => set({ isCreateModalOpen: open }),
  setJoinModalOpen: (open) => set({ isJoinModalOpen: open }),
  setManageModalOpen: (open, tab = 'settings') =>
    set({ isManageModalOpen: open, manageActiveTab: tab }),
}));

