import { useSSO } from "@clerk/expo";
import { useState } from "react";
import { Alert } from "react-native";
import * as Linking from "expo-linking";

export const useSocialAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStrategy, setLoadingStrategy] = useState("");
  const { startSSOFlow } = useSSO();

  const handleSocialAuth = async (strategy: "oauth_google" | "oauth_apple") => {
    setIsLoading(true);
    setLoadingStrategy(strategy);

    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy,
        redirectUrl: Linking.createURL("/(auth)/sso-callback"),
      });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (err) {
      console.log("Error in social auth", err);
      const provider = strategy === "oauth_google" ? "Google" : "Apple";
      Alert.alert(
        "Error",
        `Failed to sign in with ${provider}. Please try again.`,
      );
    } finally {
      setIsLoading(false);
      setLoadingStrategy("");
    }
  };

  return { isLoading, handleSocialAuth, loadingStrategy };
};
