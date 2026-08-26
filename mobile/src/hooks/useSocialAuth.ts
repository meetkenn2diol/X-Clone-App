import * as React from "react";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useSSO } from "@clerk/expo";
import type { OAuthStrategy } from "@clerk/expo/types";
import { useRouter } from "expo-router";
import { Alert, Platform } from "react-native";

WebBrowser.maybeCompleteAuthSession();

// Where the browser hands the OAuth result back to the app. Points at the
// existing auth screen so no extra callback route (e.g. /continue) is needed.
const OAUTH_REDIRECT_PATH = "(auth)/auth-index";

/**
 * Encapsulates Clerk SSO (Google / Apple) for the entire app.
 *
 * Returns an async handler that runs Clerk's `startSSOFlow`, activates the
 * created session, and routes the user to the authenticated part of the app.
 * Only one OAuth flow may run at a time (`loadingStrategy`).
 */
export const useSocialAuth = () => {
  const [loadingStrategy, setLoadingStrategy] =
    React.useState<OAuthStrategy | null>(null);

  const { startSSOFlow } = useSSO();
  const router = useRouter();

  // Pre-warm the native browser on Android so the auth session opens faster,
  // and cool it down when the hook unmounts.
  React.useEffect(() => {
    if (Platform.OS !== "android") return;

    void WebBrowser.warmUpAsync();

    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

  const handleSocialAuth = async (strategy: OAuthStrategy) => {
    // Disable both buttons while this strategy is submitting.
    setLoadingStrategy(strategy);

    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy,
        redirectUrl: AuthSession.makeRedirectUri({
          scheme: "x-clone",
          path: OAUTH_REDIRECT_PATH,
        }),
      });

      if (createdSessionId && setActive) {
        await setActive({
          session: createdSessionId,
          navigate: async ({ session }) => {
            // Clerk may return a session task (e.g. onboarding). By design there
            // is no form for it — log it and continue to the app.
            if (session?.currentTask) {
              console.error(
                "Clerk session task encountered:",
                session.currentTask,
              );
              return;
            }

            router.replace("/(tabs)");
          },
        });
      } else {
        console.error(
          `Clerk ${strategy} flow finished without a createdSessionId.`,
        );
      }
    } catch (error) {
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
      setLoadingStrategy(null);
    }
  };

  return { handleSocialAuth, loadingStrategy };
};