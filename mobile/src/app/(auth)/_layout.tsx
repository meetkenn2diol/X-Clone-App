import { Stack } from "expo-router";

/**
 * Authentication screen layout.
 *
 * The auth ↔ tabs transition is owned exclusively by the root layout's
 * `Stack.Protected` guards — this layout no longer performs any redirect.
 * When the user signs in, the root layout's guard removes the entire
 * `(auth)` group from the navigation state, so pressing Back can never
 * return to these screens.
 */
export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="auth-index" />
    </Stack>
  );
}

