import { create } from 'zustand';

export type FriendModalTab = 'friends' | 'requests' | 'search';

interface FriendState {
  isFriendsModalOpen: boolean;
  activeTab: FriendModalTab;
  setFriendsModalOpen: (open: boolean, tab?: FriendModalTab) => void;
  setActiveTab: (tab: FriendModalTab) => void;
}

export const useFriendStore = create<FriendState>((set) => ({
  isFriendsModalOpen: false,
  activeTab: 'friends',
  setFriendsModalOpen: (open, tab = 'friends') =>
    set({ isFriendsModalOpen: open, activeTab: tab }),
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
