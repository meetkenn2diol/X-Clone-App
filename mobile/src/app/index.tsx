import { useAuth } from '@clerk/expo';
import { Redirect } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

// CRITICAL: This ensures the web browser can complete the auth session 
// and resolve the startSSOFlow promise when the app is reopened from the browser.
WebBrowser.maybeCompleteAuthSession();

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    // You can replace this with a custom loading spinner component
    return null; 
  }

  if (isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  // Redirect to the auth screen
  return <Redirect href="/(auth)/auth-index" />;
}