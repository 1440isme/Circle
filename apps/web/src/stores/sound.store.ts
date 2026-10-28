import { create } from 'zustand';

interface SoundState {
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  toggleSound: () => void;
}

const SOUND_STORAGE_KEY = 'circle_sound_enabled';

export const useSoundStore = create<SoundState>((set, get) => {
  let initial = true;
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(SOUND_STORAGE_KEY);
    if (stored !== null) {
      initial = stored === 'true';
    }
  }

  return {
    soundEnabled: initial,
    setSoundEnabled: (enabled: boolean) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(SOUND_STORAGE_KEY, String(enabled));
      }
      set({ soundEnabled: enabled });
    },
    toggleSound: () => {
      const next = !get().soundEnabled;
      if (typeof window !== 'undefined') {
        localStorage.setItem(SOUND_STORAGE_KEY, String(next));
      }
      set({ soundEnabled: next });
    },
  };
});
