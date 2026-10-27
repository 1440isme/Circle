import { create } from 'zustand';
import { getItem, setItem } from '../services/storage';

interface MobileSoundState {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  toggleSound: () => void;
  toggleHaptics: () => void;
  initSoundSettings: () => Promise<void>;
}

const SOUND_ENABLED_KEY = 'circle_mobile_sound_enabled';
const HAPTICS_ENABLED_KEY = 'circle_mobile_haptics_enabled';

export const useMobileSoundStore = create<MobileSoundState>((set, get) => ({
  soundEnabled: true,
  hapticsEnabled: true,

  setSoundEnabled: (enabled: boolean) => {
    setItem(SOUND_ENABLED_KEY, String(enabled));
    set({ soundEnabled: enabled });
  },

  setHapticsEnabled: (enabled: boolean) => {
    setItem(HAPTICS_ENABLED_KEY, String(enabled));
    set({ hapticsEnabled: enabled });
  },

  toggleSound: () => {
    const next = !get().soundEnabled;
    setItem(SOUND_ENABLED_KEY, String(next));
    set({ soundEnabled: next });
  },

  toggleHaptics: () => {
    const next = !get().hapticsEnabled;
    setItem(HAPTICS_ENABLED_KEY, String(next));
    set({ hapticsEnabled: next });
  },

  initSoundSettings: async () => {
    try {
      const storedSound = await getItem(SOUND_ENABLED_KEY);
      const storedHaptics = await getItem(HAPTICS_ENABLED_KEY);
      set({
        soundEnabled: storedSound !== null ? storedSound === 'true' : true,
        hapticsEnabled: storedHaptics !== null ? storedHaptics === 'true' : true,
      });
    } catch {}
  },
}));

export const useSoundStore = useMobileSoundStore;
