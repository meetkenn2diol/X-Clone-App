import * as React from "react";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useAuth, useSSO } from "@clerk/expo";
import type { OAuthStrategy } from "@clerk/expo/types";
import { useRouter } from "expo-router";
import { Alert, Platform } from "react-native";

WebBrowser.maybeCompleteAuthSession();

// Dedicated callback route for native OAuth redirects
const OAUTH_REDIRECT_PATH = "oauth-callback";

/**
 * Encapsulates Clerk SSO (Google / Apple) for the entire app.
 *
 * `handleSocialAuth` runs Clerk's `startSSOFlow`, activates the created session,
 * and routes the user to the authenticated part of the app. Only one OAuth flow
 * may run at a time, signalled through `loadingStrategy`.
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
  const { isSignedIn, signOut } = useAuth();
  const router = useRouter();

  // Monotonic generation id for the current flow. Every reset bumps it so a
  // stale OAuth result that resolves later can never activate a session or
  // navigate a user from an abandoned attempt.
  const attemptRef = React.useRef(0);

  // Pre-warm the native browser on Android so the auth session opens faster,
  // and cool it down when the hook unmounts.
  React.useEffect(() => {
    if (Platform.OS !== "android") return;

    void WebBrowser.warmUpAsync();

    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

  /**
   * Abandons the current authentication attempt and returns to a clean state.
   */
  const resetSocialAuth = React.useCallback(() => {
    // Invalidate any in-flight attempt: results resolving after this are dropped.
    attemptRef.current += 1;

    setLoadingStrategy(null);

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

      try {
        const redirectUrl = AuthSession.makeRedirectUri({
          scheme: "x-clone",
          path: OAUTH_REDIRECT_PATH,
        });

        console.error("OAUTH REDIRECT URL:", redirectUrl);
        console.error("===== OAUTH START =====");
        console.error("Strategy:", strategy);
        console.error("Redirect URL:", redirectUrl);

        const result = await startSSOFlow({
          strategy,
          redirectUrl,
        });

        console.error("===== OAUTH RESULT =====");
        console.error(JSON.stringify(result));
        console.error("createdSessionId:", result.createdSessionId);
        console.error("hasSetActive:", !!result.setActive);
        console.error("authSessionResult:", result.authSessionResult);
        console.error("signIn status:", result.signIn?.status);
        console.error("signUp status:", result.signUp?.status);
        console.error(
          "firstFactor status:",
          result.signIn?.firstFactorVerification?.status,
        );
        console.error("===== END OAUTH RESULT =====");

        // The flow may have been reset while awaiting this result. A stale
        // attempt must never read createdSessionId or call setActive.
        if (attemptRef.current !== attempt) {
          console.error(
            `Ignoring stale ${strategy} OAuth result (attempt was reset).`,
          );
          return;
        }

        const {
          createdSessionId,
          setActive,
          authSessionResult,
        } = result;

        // If no createdSessionId was returned, check if browser session was dismissed/cancelled
        if (!createdSessionId || !setActive) {
          if (
            authSessionResult?.type === "dismiss" ||
            authSessionResult?.type === "cancel"
          ) {
            console.error(
              `OAuth browser session was ${authSessionResult.type}ed by user.`,
            );
            return;
          }

          console.error(
            `Clerk ${strategy} flow finished without a createdSessionId.`,
          );
          return;
        }

        // Re-verify right before activating the session: a reset could have
        // happened after the startSSOFlow resolved and before we got here.
        if (attemptRef.current !== attempt) {
          console.error(
            `Aborting stale ${strategy} session activation (attempt was reset).`,
          );
          return;
        }

        await setActive({
          session: createdSessionId,
          navigate: async ({ session }) => {
            // Guard inside the navigate callback too: setActive may resolve
            // after a reset, so never let a stale attempt touch the app.
            if (attemptRef.current !== attempt) {
              return;
            }

            // Clerk may return a session task (e.g. onboarding). By design
            // there is no form for it — log it and continue to the app.
            if (session?.currentTask) {
              console.error(
                "Clerk session task encountered:",
                session.currentTask,
              );
              return;
            }

            // Final guard before navigating: a stale attempt must never push
            // the user into the authenticated area.
            if (attemptRef.current !== attempt) {
              return;
            }

            router.replace("/(tabs)");
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
    [router, startSSOFlow],
  );

  return { handleSocialAuth, loadingStrategy, resetSocialAuth };
};