import { create } from 'zustand';
import { CircleEntity } from '@circle/types';

export type CircleManageTab =
  | 'menu'
  | 'chatInfo'
  | 'members'
  | 'privacySupport'
  | 'circleSettings'
  | 'supportReports'
  | 'info'
  | 'requests'
  | 'settings';

interface CircleState {
  activeCircleId: string | null;
  activeCircle: CircleEntity | null;
  createModalVisible: boolean;
  joinModalVisible: boolean;
  manageModalVisible: boolean;
  manageActiveTab: CircleManageTab;
  clearChatRequested: boolean;
  setActiveCircleId: (id: string | null) => void;
  setActiveCircle: (circle: CircleEntity | null) => void;
  setCreateModalVisible: (open: boolean) => void;
  setJoinModalVisible: (open: boolean) => void;
  setManageModalVisible: (open: boolean, tab?: CircleManageTab) => void;
  setManageActiveTab: (tab: CircleManageTab) => void;
  setClearChatRequested: (requested: boolean) => void;
}

export const useCircleStore = create<CircleState>((set) => ({
  activeCircleId: null,
  activeCircle: null,
  createModalVisible: false,
  joinModalVisible: false,
  manageModalVisible: false,
  manageActiveTab: 'menu',
  clearChatRequested: false,
  setActiveCircleId: (id) => set({ activeCircleId: id }),
  setActiveCircle: (circle) =>
    set({
      activeCircle: circle,
      activeCircleId: circle ? circle.id : null,
    }),
  setCreateModalVisible: (open) => set({ createModalVisible: open }),
  setJoinModalVisible: (open) => set({ joinModalVisible: open }),
  setManageModalVisible: (open, tab = 'menu') =>
    set({ manageModalVisible: open, manageActiveTab: tab }),
  setManageActiveTab: (tab) => set({ manageActiveTab: tab }),
  setClearChatRequested: (requested) => set({ clearChatRequested: requested }),
}));
