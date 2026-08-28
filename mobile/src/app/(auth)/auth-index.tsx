import { View, Text, Image, Pressable, ActivityIndicator } from 'react-native';
import { useClerkAuth } from '@/hooks/useClerkAuth';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AuthIndex() {
  const { signInWithGoogle, signInWithApple, isLoading } = useClerkAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }


return (
  <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
    <View className="flex-1 justify-center items-center px-6" style={{ paddingTop: 50, paddingBottom: 50 }}>
      <View className="gap-4 w-full">
        <Pressable
          className="h-14 flex-row items-center justify-center rounded-2xl border border-gray-200 bg-white px-5 active:opacity-70"
          onPress={signInWithGoogle}
          disabled={isLoading}
        >
          <Text className="text-base font-semibold text-black">
            Continue with Google
          </Text>
        </Pressable>

        <Pressable
          className="h-14 flex-row items-center justify-center rounded-2xl bg-black px-5 active:opacity-70"
          onPress={signInWithApple}
          disabled={isLoading}
        >
          <Text className="text-base font-semibold text-white">
            Continue with Apple
          </Text>
        </Pressable>
      </View>
    </View>
  </SafeAreaView>
);
}