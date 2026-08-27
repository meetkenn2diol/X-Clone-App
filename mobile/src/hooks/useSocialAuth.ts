import * as React from "react";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useAuth, useClerk } from "@clerk/expo";
import { useSSO } from "@clerk/expo/experimental";
import type { OAuthStrategy } from "@clerk/expo/types";
import { Alert } from "react-native";

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
 * run at a time, signalled through `loadingStrategy`. Navigation after a
 * successful sign-in is owned exclusively by the root layout's
 * `Stack.Protected` guard, which removes the `(auth)` group from the
 * navigation state and makes `(tabs)` available based on `isSignedIn`.
 *
 * `resetSocialAuth` abandons the current flow — it invalidates the in-flight
 * attempt (so any late OAuth result is ignored), clears the loading state, and
 * signs out the active session if one exists. The manual "Reset" button calls
 * this same reset.
 */
export const useSocialAuth = () => {
  const [loadingStrategy, setLoadingStrategy] =
    React.useState<OAuthStrategy | null>(null);

  const { startSSOFlow } = useSSO();
  const { setActive } = useClerk();
  const { isSignedIn, signOut } = useAuth();

  // Monotonic generation id for the current flow. Every reset bumps it so a
  // stale OAuth result that resolves later can never activate a session or
  // navigate a user from an abandoned attempt.
  const attemptRef = React.useRef(0);

  /**
   * Abandons the current authentication attempt and returns to a clean state.
   */
  const resetSocialAuth = React.useCallback(() => {
    // Invalidate any in-flight attempt: results resolving after this are dropped.
    attemptRef.current += 1;

    setLoadingStrategy(null);

    // Force-close any lingering auth session (e.g. a Custom Tab that failed to
    // open or redirect on Android). This is guarded because `dismissBrowser` is
    // unavailable on some platforms/versions, and it is fire-and-forget so it
    // can never block or undo the reset.
    if (typeof WebBrowser.dismissBrowser === "function") {
      try {
        void WebBrowser.dismissBrowser().catch((error) => {
          console.warn("Failed to dismiss auth browser on reset:", error);
        });
      } catch (error) {
        console.warn("Failed to dismiss auth browser on reset:", error);
      }
    }

    // Clear the active session through Clerk's public API. This also has Clerk
    // discard any in-progress sign-in/sign-up state. When there is no session
    // (e.g. the sign-in never finished) this is a safe no-op.
    if (isSignedIn) {
      void signOut().catch((error) => {
        console.error("Error signing out during auth reset:", error);
      });
    }
  }, [isSignedIn, signOut]);

  const handleSocialAuth = React.useCallback(
    async (strategy: OAuthStrategy) => {
      // Tag this invocation with a fresh attempt id. Bumping the ref up front
      // means any prior (pending) attempt is immediately invalidated.
      const attempt = attemptRef.current + 1;
      attemptRef.current = attempt;

      // Disable both buttons while this strategy is submitting.
      setLoadingStrategy(strategy);

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

        // The flow may have been reset while awaiting this result. A stale
        // attempt must never read createdSessionId or call setActive.
        if (attemptRef.current !== attempt) {
          console.log(
            `Ignoring stale ${strategy} OAuth result (attempt was reset).`,
          );
          return;
        }

        const { createdSessionId, authSessionResult, signIn, signUp } = result;

        console.log("========== SSO RESULT ==========");
        console.log("createdSessionId:", createdSessionId);
        console.log("authSessionResult:", authSessionResult);
        console.log("signIn status:", signIn?.status);
        console.log("signUp status:", signUp?.status);
        console.log(
          "firstFactor status:",
          signIn?.firstFactorVerification?.status,
        );
        console.log("========== END SSO RESULT ==========");

        // No session was created by this attempt. Inspect the returned auth
        // state rather than treating a missing createdSessionId as a hard
        // failure: a dismissed/cancelled browser session is a normal
        // user-initiated exit, and an existing session may have been activated
        // by the flow itself. Navigation still belongs exclusively to the root
        // layout's Stack.Protected guard via `isSignedIn` — never navigate
        // from here, and never fabricate a session id or call setActive with
        // null/undefined.
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
        if (attemptRef.current !== attempt) {
          console.log(
            `Aborting stale ${strategy} session activation (attempt was reset).`,
          );
          return;
        }

        console.log(
          `Clerk ${strategy} flow created session ${createdSessionId}.`,
        );

        // Activate the created session through Clerk's public API. This is
        // the single moment the session becomes active; once `isSignedIn` flips
        // to true the root layout's `Stack.Protected` guard removes the entire
        // `(auth)` group from the navigation state and makes `(tabs)` available.
        // We never navigate manually from here. The attempt guard is repeated
        // both before the call and inside the `navigate` callback so a stale
        // attempt can never activate or steer a newer one.
        await setActive({
          session: createdSessionId,
          navigate: async ({ session }) => {
            if (attemptRef.current !== attempt) {
              return;
            }
            // Never navigate on the hook's behalf. If Clerk reports a session
            // task (e.g. onboarding) we only log it; the root layout's
            // Stack.Protected owns navigation based purely on isSignedIn.
            if (session?.currentTask) {
              console.log("Clerk session task encountered:", session.currentTask);
            }
          },
        });
      } catch (error) {
        // Ignore failures from attempts that have since been reset. A stale
        // rejection must never surface a "Sign In Failed" alert.
        if (attemptRef.current !== attempt) return;

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
        if (attemptRef.current === attempt) {
          setLoadingStrategy(null);
        }
      }
    },
    [startSSOFlow, setActive],
  );

  return { handleSocialAuth, loadingStrategy, resetSocialAuth };
};
