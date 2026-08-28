import { useAuth } from "@clerk/expo";
import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";

/**
 * Authentication screen layout.
 *
 * The (auth) layout observes Clerk directly and is one half of the
 * auth ↔ tabs authority:
 *
 *   isLoaded === false  →  spinner (avoid flashing the wrong group)
 *   isSignedIn === true →  Redirect to /(tabs)
 *   isSignedIn === false→  render the auth stack (auth-index)
 *
 * The root layout also guards these groups with `Stack.Protected`, so once
 * `isSignedIn` flips the whole (auth) tree is removed from the navigation
 * state and Back can never return to these screens. The explicit guard here
 * guarantees a single, Clerk-driven source of truth for routing.
 */
export default function AuthLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="auth-index" />
    </Stack>
  );
}

