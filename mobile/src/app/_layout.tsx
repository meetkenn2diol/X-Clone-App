import "../../global.css";
import * as React from "react";
import * as WebBrowser from "expo-web-browser";
import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, Platform, View } from "react-native";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error("Add your Clerk Publishable Key to the .env file");
}

/**
 * The root navigator is the single authority for which route group — `(auth)`
 * or `(tabs)` — is mounted.
 *
 * `Stack.Protected` is used so that the unavailable group is not merely
 * hidden: its routes are removed from the navigation state *entirely*, which
 * guarantees that the Android back button (or iOS swipe-back) can never
 * return the user to a screen from the other group.
 *
 *   isSignedIn === false  →  (auth)  is available,  (tabs)  is protected
 *   isSignedIn === true   →  (tabs)  is available,  (auth)  is protected
 *
 * The loading spinner shown while Clerk restores the session prevents any
 * flash of the wrong group during initial auth-state hydration.
 */
export default function RootLayout() {
  // Pre-warm the native browser on Android so the auth session opens faster,
  // and cool it down once when the app tears down. Scoping this to the root
  // layout (which mounts for the app's whole lifetime) means the Custom Tabs
  // connection is never repeatedly torn down/recreated as the user navigates
  // between the auth screen and the authenticated app.
  React.useEffect(() => {
    if (Platform.OS !== "android") return;

    void WebBrowser.warmUpAsync();

    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <RootLayoutInner />
      <StatusBar style="dark" />
    </ClerkProvider>
  );
}

function RootLayoutInner() {
  const { isLoaded, isSignedIn } = useAuth();

  // Debug log for auth state transitions.
  React.useEffect(() => {
    if (isSignedIn) {
      console.log("========== CLERK AUTHENTICATED ==========");
    }
  }, [isSignedIn]);

  // While Clerk is restoring the session we show a spinner so that
  // neither (auth) nor (tabs) is ever briefly visible — preventing any
  // flash during initial auth-state hydration.
  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // `isSignedIn` can be `boolean | null`; coerce to a definite `boolean`
  // for the `guard` prop. When null (not yet loaded) we have already
  // early-returned above with the spinner.
  const isSignedInBool = isSignedIn === true;

  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
      <Stack.Protected guard={!isSignedInBool}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      <Stack.Protected guard={isSignedInBool}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
    </Stack>
  );
}

