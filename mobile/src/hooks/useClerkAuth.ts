import { useSSO } from '@clerk/expo';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';

// Ensures the browser session can be completed if the app was backgrounded
WebBrowser.maybeCompleteAuthSession();

export function useClerkAuth() {
  const { startSSOFlow } = useSSO();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // IMPORTANT: Replace 'your-app-scheme' with the exact scheme defined in your app.json
  const scheme = 'xclone'; 

  const signInWithGoogle = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log("inside useclerkAuth Google");
      const redirectUrl = Linking.createURL('/(tabs)', { scheme });
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl,
      });
      
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace('/(tabs)');
      }
    } catch (err) {
      console.error('Google OAuth error:', err);
      // Handle error UI (e.g., show a toast)
    } finally {
      setIsLoading(false);
    }
  }, [startSSOFlow, router, scheme]);

  const signInWithApple = useCallback(async () => {
    setIsLoading(true);
    try {
      const redirectUrl = Linking.createURL('/(tabs)', { scheme });
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: 'oauth_apple',
        redirectUrl,
      });
      
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace("/(tabs)");
      }
    } catch (err) {
      console.error('Apple OAuth error:', err);
      // Handle error UI (e.g., show a toast)
    } finally {
      setIsLoading(false);
    }
  }, [startSSOFlow, router, scheme]);

  return { signInWithGoogle, signInWithApple, isLoading };
}