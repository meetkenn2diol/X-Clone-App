import * as React from "react";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useSSO } from "@clerk/expo";
import type { OAuthStrategy } from "@clerk/expo/types";
import { Href, useRouter } from "expo-router";
import { Alert, Platform } from "react-native";

WebBrowser.maybeCompleteAuthSession();

export const useSocialAuth = () => {
  const [loadingStrategy, setLoadingStrategy] =
    React.useState<OAuthStrategy | null>(null);

  const { startSSOFlow } = useSSO();
  const router = useRouter();

  React.useEffect(() => {
    if (Platform.OS !== "android") return;

    void WebBrowser.warmUpAsync();

    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

  const handleSocialAuth = async (strategy: OAuthStrategy) => {
    setLoadingStrategy(strategy);

    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy,

        redirectUrl: AuthSession.makeRedirectUri({
          scheme: "x-clone",
          path: "/(auth)/continue",
        }),
      });

      if (createdSessionId) {
        await setActive!({
          session: createdSessionId,

          navigate: async ({ session, decorateUrl }) => {
            if (session?.currentTask) {
              console.log("Clerk session task:", session.currentTask);
              return;
            }

            const url = decorateUrl("/");

            if (url.startsWith("http")) {
              window.location.href = url;
            } else {
              router.push(url as Href);
            }
          },
        });
      } else {
        router.push("/continue");
      }
    } catch (error) {
      console.error("Error in social authentication:", error);

      const provider =
        strategy === "oauth_google"
          ? "Google"
          : strategy === "oauth_apple"
            ? "Apple"
            : "social provider";

      Alert.alert(
        "Sign In Failed",
        `Failed to sign in with ${provider}. Please try again.`,
      );
    } finally {
      setLoadingStrategy(null);
    }
  };

  return {
    loadingStrategy,
    handleSocialAuth,
  };
};