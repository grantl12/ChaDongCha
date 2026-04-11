import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SettingsStore = {
  privacyShieldEnabled: boolean;
  togglePrivacyShield: () => void;
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      // On by default — privacy-first default matches App Store guidelines
      privacyShieldEnabled: true,
      togglePrivacyShield: () => set(s => ({ privacyShieldEnabled: !s.privacyShieldEnabled })),
    }),
    { name: 'settings-store', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
