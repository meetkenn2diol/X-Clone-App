import { useAuth } from "@clerk/expo";
import { Redirect } from "expo-router";

/**
 * Redirect entry point — the single navigation authority for the
 * auth → tabs (and tabs → auth) transition.
 *
 * `Stack.Protected` in the root layout guarantees that only the
 * appropriate group is mounted, so a plain `Redirect` here is enough:
 * the protected group is guaranteed to be available.
 */
export default function Index() {
  const { isSignedIn } = useAuth();

  if (isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/auth-index" />;
}

