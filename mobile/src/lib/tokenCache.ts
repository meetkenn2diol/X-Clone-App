import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Define the type locally to avoid any version mismatch issues with Clerk's internal exports
export interface TokenCache {
  getToken: (key: string) => Promise<string | null | undefined>;
  saveToken: (key: string, token: string) => Promise<void>;
}

const createTokenCache = (): TokenCache => {
  return {
    getToken: async (key: string) => {
      try {
        const item = await SecureStore.getItemAsync(key);
        if (item) {
          console.log(`${key} was used 🔐`);
        } else {
          console.log('No values stored under key: ' + key);
        }
        return item;
      } catch (error) {
        console.error('Secure store get item error: ', error);
        await SecureStore.deleteItemAsync(key);
        return null;
      }
    },
    saveToken: (key: string, token: string) => {
      return SecureStore.setItemAsync(key, token);
    },
  };
};

// Web doesn't need SecureStore, so we return undefined for web builds
export const tokenCache = Platform.OS !== 'web' ? createTokenCache() : undefined;