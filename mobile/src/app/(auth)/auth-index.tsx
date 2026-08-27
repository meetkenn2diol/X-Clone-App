import * as React from "react";
import { useSocialAuth } from "@/hooks/useSocialAuth";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

/**
 * Single-screen sign in with Clerk SSO — Google and Apple only.
 *
 * This screen owns the authentication attempt lifecycle and provider-specific
 * loading state. Each provider has its own spinner, and both buttons are
 * disabled while an OAuth flow is in progress so two flows never start at once.
 * It is also the native OAuth callback destination: the flow redirects back to
 * this same screen, which stays mounted (spinner running) while Clerk resolves
 * the session. Navigation after a successful sign-in is handled exclusively
 * by the root layout's `Stack.Protected` guard (via `isSignedIn`), never here.
 */
export default function AuthIndexScreen() {
  const { handleSocialAuth, loadingStrategy, resetSocialAuth } =
    useSocialAuth();

  // Debugging lifecycle: this screen must genuinely unmount when the session
  // activates, because the root layout removes the whole (auth) route tree.
  React.useEffect(() => {
    console.log("========== AUTH INDEX MOUNTED ==========");
    return () => {
      console.log("========== AUTH INDEX UNMOUNTED ==========");
    };
  }, []);

  const isGoogleLoading = loadingStrategy === "oauth_google";
  const isAppleLoading = loadingStrategy === "oauth_apple";
  const isAnyLoading = loadingStrategy !== null;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View className="flex-1 px-8 pb-10">
        {/* Hero image */}
        <View className="flex-1 items-center justify-center">
          <Image
            source={require("@/assets/images/auth2.png")}
            className="w-full h-80"
            resizeMode="contain"
            accessibilityLabel="X Clone hero illustration"
          />
        </View>

        {/* OAuth buttons */}
        <View className="gap-4">
          <TouchableOpacity
            onPress={() => handleSocialAuth("oauth_google")}
            disabled={isAnyLoading}
            className="flex-row items-center justify-center bg-white border border-gray-300 rounded-full py-3.5"
            accessibilityRole="button"
            accessibilityState={{ disabled: isAnyLoading }}
          >
            {isGoogleLoading ? (
              <ActivityIndicator size="small" color="#4285F4" />
            ) : (
              <View className="flex-row items-center">
                <Image
                  source={require("@/assets/images/google.png")}
                  className="size-5 mr-3"
                  resizeMode="contain"
                />
                <Text className="text-base font-medium text-black">
                  Continue with Google
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleSocialAuth("oauth_apple")}
            disabled={isAnyLoading}
            className="flex-row items-center justify-center bg-white border border-gray-300 rounded-full py-3.5"
            accessibilityRole="button"
            accessibilityState={{ disabled: isAnyLoading }}
          >
            {isAppleLoading ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <View className="flex-row items-center">
                <Image
                  source={require("@/assets/images/apple.png")}
                  className="size-5 mr-3"
                  resizeMode="contain"
                />
                <Text className="text-base font-medium text-black">
                  Continue with Apple
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Terms & privacy + Reset */}
        <View className="flex-row items-center justify-center mt-8 px-4 gap-3">
          <Text className="flex-1 text-center text-gray-500 text-xs leading-4">
            By continuing, you agree to our{" "}
            <Text className="text-blue-500">Terms</Text>
            {" and "}
            <Text className="text-blue-500">Privacy Policy</Text>.
          </Text>

          <TouchableOpacity
            onPress={resetSocialAuth}
            className="border border-gray-300 rounded-full px-3 py-1.5"
            accessibilityRole="button"
          >
            <Text className="text-gray-500 text-xs font-medium">Reset</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
