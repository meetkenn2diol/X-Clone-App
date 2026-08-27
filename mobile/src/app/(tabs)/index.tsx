import { useAuth } from "@clerk/expo";
import { Text, TouchableOpacity, View } from "react-native";

export default function Home() {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    console.log("========== SIGN OUT START ==========");
    try {
      await signOut();
      console.log("========== SIGN OUT COMPLETE ==========");
      // No manual navigation here: the root layout's Stack.Protected guard
      // sees isSignedIn flip to false and removes the entire (tabs) group,
      // making (auth) available again.
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <View className="flex-1 justify-center items-center px-6">
      <Text className="text-2xl font-bold text-black mb-6">
        Home
      </Text>

      <TouchableOpacity
        onPress={handleSignOut}
        className="bg-black rounded-full px-8 py-4"
      >
        <Text className="text-white font-semibold">
          Sign Out
        </Text>
      </TouchableOpacity>
    </View>
  );
}