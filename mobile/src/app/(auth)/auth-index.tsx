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
 * Each provider has its own loading state, and both buttons are disabled while
 * an OAuth flow is in progress so two flows never start at once.
 */
export default function AuthIndexScreen() {
  const { handleSocialAuth, loadingStrategy } = useSocialAuth();

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

        {/* Terms & privacy */}
        <Text className="text-center text-gray-500 text-xs leading-4 mt-8 px-4">
          By continuing, you agree to our{" "}
          <Text className="text-blue-500">Terms</Text>
          {" and "}
          <Text className="text-blue-500">Privacy Policy</Text>.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}