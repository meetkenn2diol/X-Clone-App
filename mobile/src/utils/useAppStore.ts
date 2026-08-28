import { create } from 'zustand';

interface AppState {
  hasCompletedOnboarding: boolean;
  setOnboardingComplete: (completed: boolean) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  hasCompletedOnboarding: false,
  setOnboardingComplete: (completed) => set({ hasCompletedOnboarding: completed }),
  reset: () => set({ hasCompletedOnboarding: false }),
}));