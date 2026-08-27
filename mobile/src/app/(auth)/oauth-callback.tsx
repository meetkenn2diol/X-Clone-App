import * as React from "react";
import { ActivityIndicator, View } from "react-native";

/**
 * Dedicated callback screen for native OAuth redirects.
 *
 * When Google/Apple redirects back to the app via `x-clone://oauth-callback`,
 * this screen provides a clean visual target while Clerk completes session creation
 * and the app navigates to the authenticated state.
 */
export default function OAuthCallbackScreen() {
  React.useEffect(() => {
    console.log("OAUTH CALLBACK MOUNTED");
    return () => {
      console.log("OAUTH CALLBACK UNMOUNTED");
    };
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" color="#000000" />
    </View>
  );
}

