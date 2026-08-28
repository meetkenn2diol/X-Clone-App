import * as React from "react";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useAuth, useClerk, useSSO } from "@clerk/expo";
import type { OAuthStrategy } from "@clerk/expo/types";
import { Alert } from "react-native";
import { useAuthFlowStore } from "@/stores/authFlowStore";

WebBrowser.maybeCompleteAuthSession();

// auth-index is BOTH the authentication UI and the native OAuth callback
// destination: after the provider browser flow completes, the OS redirects
// back to this route and Clerk resolves the session there.
const OAUTH_REDIRECT_PATH = "(auth)/auth-index";

/**
 * Encapsulates Clerk SSO (Google / Apple) for the entire app.
 *
 * `handleSocialAuth` runs Clerk's `startSSOFlow` and, on success, activates the
 * created session through Clerk's public `setActive`. Only one OAuth flow may
 * run at a time; the provider spinner comes from the Zustand auth-flow store.
 *
 * All local OAuth-flow UI/attempt metadata (loadingStrategy, attemptId) lives
 * in `useAuthFlowStore` — NOT in React state here. Zustand owns our local flow
 * state; Clerk owns the session. This hook never navigates to `/(tabs)`.
 * Navigation is owned by the (auth) layout's Clerk `isSignedIn` guard.
 *
 * `resetSocialAuth` abandons the current flow — it invalidates the in-flight
 * attempt (so any late OAuth result is ignored), clears the loading state, and
 * signs out the active session if one exists. The manual "Reset" button calls
 * this same reset.
 */
export const useSocialAuth = () => {
  const { startSSOFlow } = useSSO();
  const { setActive } = useClerk();
  const { isSignedIn, signOut } = useAuth();

  // Local OAuth-flow loading state comes exclusively from Zustand. There is no
  // React `useState<OAuthStrategy | null>` for loadingStrategy in this hook.
  const loadingStrategy = useAuthFlowStore((state) => state.loadingStrategy);

  /**
   * Current attempt id via Zustand. Reading it through the store's `getState`
   * (rather than a closure snapshot) guarantees we compare against the latest
   * attempt even after the hook has re-rendered or a reset has happened.
   */
  const currentAttempt = () => useAuthFlowStore.getState().attemptId;

  /**
   * Abandons the current authentication attempt and returns to a clean state.
   */
  const resetSocialAuth = React.useCallback(() => {
    // Invalidate any in-flight attempt + clear loadingStrategy.
    useAuthFlowStore.getState().reset();

    // Force-close any lingering auth session (e.g. a Custom Tab that failed to
    // open or redirect on Android). This is guarded because `dismissBrowser` is
    // unavailable on some platforms/versions, and is fire-and-forget so it can
    // never block or undo the reset.
    if (typeof WebBrowser.dismissBrowser === "function") {
      try {
        void WebBrowser.dismissBrowser().catch((error) => {
          console.warn("Failed to dismiss auth browser on reset:", error);
        });
      } catch (error) {
        console.warn("Failed to dismiss auth browser on reset:", error);
      }
    }

    // Clear the active session through Clerk's public API. When there is no
    // session (e.g. the sign-in never finished) this is a safe no-op.
    if (isSignedIn) {
      void signOut().catch((error) => {
        console.error("Error signing out during auth reset:", error);
      });
    }
  }, [isSignedIn, signOut]);


  const handleSocialAuth = React.useCallback(
    async (strategy: OAuthStrategy) => {
      // Start a fresh Zustand attempt: bump attemptId, set loadingStrategy, and
      // return the new id. We do NOT use a React state update as the id.
      const attempt = useAuthFlowStore.getState().startAttempt(strategy);

      console.log("========== START SSO ==========");
      console.log("strategy:", strategy);
      console.log("attempt:", attempt);

      try {
        const redirectUrl = AuthSession.makeRedirectUri({
          scheme: "x-clone",
          path: OAUTH_REDIRECT_PATH,
        });

        // Guard against a native-layer stall (e.g. the Custom Tabs connection
        // silently failing to present): race the flow against a timeout so a
        // future hang fails loudly instead of leaving the UI spinning forever.
        const ssoTimeout = 15000;
        const result = await Promise.race([
          startSSOFlow({
            strategy,
            redirectUrl,
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("SSO timed out")), ssoTimeout),
          ),
        ]);

        // The flow may have been reset while awaiting the result. A stale
        // attempt must never read createdSessionId or call setActive.
        if (currentAttempt() !== attempt) {
          console.log("Ignoring stale OAuth result:", strategy, attempt);
          return;
        }

        const { createdSessionId, authSessionResult, signIn, signUp } = result;

        console.log("========== SSO RESULT ==========");
        console.log("createdSessionId:", createdSessionId);
        console.log("authSessionResult:", authSessionResult);
        console.log("signIn status:", signIn?.status);
        console.log("signUp status:", signUp?.status);
        console.log("========== END SSO RESULT ==========");

        // Do NOT assume authSessionResult.type === "success" means the user is
        // authenticated. The authoritative success sequence is:
        //   createdSessionId → setActive() → Clerk isSignedIn === true
        if (!createdSessionId) {
          if (
            authSessionResult?.type === "dismiss" ||
            authSessionResult?.type === "cancel"
          ) {
            console.log(
              `OAuth browser session was ${authSessionResult.type}ed by user.`,
            );
            return;
          }

          console.log(
            `Clerk ${strategy} flow returned no new session.`,
            {
              signIn: signIn?.status,
              signUp: signUp?.status,
              authSessionResult,
            },
          );
          return;
        }

        // Re-verify right before activating the session: a reset could have
        // happened after the flow resolved and before we got here.
        if (currentAttempt() !== attempt) {
          console.log("Ignoring stale OAuth result:", strategy, attempt);
          return;
        }

        console.log(
          `Clerk ${strategy} flow created session ${createdSessionId}.`,
        );

        // Activate the created session through Clerk's public API. This is the
        // single moment the session becomes active; once `isSignedIn` flips
        // true the (auth) layout's guard redirects to `/(tabs)` and the root's
        // Stack.Protected guard removes the `(auth)` group. We never navigate
        // manually from here. The attempt guard is repeated both before the
        // call and inside the `navigate` callback so a stale attempt can never
        // activate or steer a newer one.
        await setActive({
          session: createdSessionId,
          navigate: async ({ session }) => {
            if (currentAttempt() !== attempt) {
              return;
            }
            // Never navigate on the hook's behalf. If Clerk reports a session
            // task (e.g. onboarding) we only log it; the (auth) layout owns
            // navigation based purely on isSignedIn.
            if (session?.currentTask) {
              console.log("Clerk session task encountered:", session.currentTask);
            }
          },
        });
      } catch (error) {
        // Ignore failures from attempts that have since been reset. A stale
        // rejection must never surface a "Sign In Failed" alert.
        if (currentAttempt() !== attempt) return;

        console.error("Social authentication error:", error);

        const provider =
          strategy === "oauth_google"
            ? "Google"
            : strategy === "oauth_apple"
              ? "Apple"
              : "social provider";

        Alert.alert(
          "Sign In Failed",
          `Failed to continue with ${provider}. Please try again.`,
        );
      } finally {
        // Only the current attempt may clear its own loading state. If the
        // attempt was reset, resetSocialAuth owns the cleanup already and the
        // old promise must not undo it.
        if (currentAttempt() === attempt) {
          useAuthFlowStore.getState().reset();
        }
      }
    },
    [startSSOFlow, setActive],
  );

  return { handleSocialAuth, loadingStrategy, resetSocialAuth };
};
