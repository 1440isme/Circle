import { create } from 'zustand';

export type FriendModalTab = 'friends' | 'requests' | 'search';

interface FriendState {
  isFriendsModalOpen: boolean;
  activeTab: FriendModalTab;
  initialSearchQuery: string;
  setFriendsModalOpen: (open: boolean, tab?: FriendModalTab, query?: string) => void;
  setActiveTab: (tab: FriendModalTab) => void;
}

export const useFriendStore = create<FriendState>((set) => ({
  isFriendsModalOpen: false,
  activeTab: 'friends',
  initialSearchQuery: '',
  setFriendsModalOpen: (open, tab = 'friends', query = '') =>
    set({ isFriendsModalOpen: open, activeTab: tab, initialSearchQuery: query }),
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
