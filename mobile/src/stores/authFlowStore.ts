import { create } from "zustand";
import type { OAuthStrategy } from "@clerk/expo/types";

/**
 * Local OAuth-flow state ONLY.
 *
 * Clerk remains the single source of truth for authentication:
 *   - signed-in state
 *   - active session
 *   - Clerk user
 *   - sign-in / sign-up state
 *   - createdSessionId
 *   - setActive
 *   - OAuth session data
 *
 * This store contains NONE of those things. It only tracks our own UI-level
 * flow metadata across remounts and external-browser round-trips:
 *
 *   loadingStrategy: which provider button shows the spinner, or null.
 *   attemptId:       monotonically increasing id used to invalidate stale /
 *                    cancelled OAuth attempts.
 *
 * The auth flow returns to auth-index as a normal part of the OAuth callback,
 * so nothing here is reset on mount/focus. A reset only happens via an
 * explicit reset / sign-out action, or when the current attempt finishes.
 */
type AuthFlowState = {
  loadingStrategy: OAuthStrategy | null;
  attemptId: number;

  /**
   * Kick off a fresh OAuth attempt for `strategy`.
   * Increments attemptId, sets loadingStrategy, and returns the new id.
   */
  startAttempt: (strategy: OAuthStrategy) => number;

  /**
   * Clear the loading state and invalidate the current attempt by bumping
   * attemptId. Any async OAuth operation still in flight becomes stale.
   */
  reset: () => void;
};

export const useAuthFlowStore = create<AuthFlowState>((set, get) => ({
  loadingStrategy: null,
  attemptId: 0,

  startAttempt: (strategy) => {
    const nextAttemptId = get().attemptId + 1;
    set({ loadingStrategy: strategy, attemptId: nextAttemptId });
    return nextAttemptId;
  },

  reset: () => {
    console.log("AUTH FLOW RESET");
    set((state) => ({
      loadingStrategy: null,
      attemptId: state.attemptId + 1,
    }));
  },
}));