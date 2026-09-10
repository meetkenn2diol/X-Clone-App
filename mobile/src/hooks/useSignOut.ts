import { useAuth } from "@clerk/expo";
import { Alert } from "react-native";

export const useSignOut = () => {
  const { signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => signOut(),
      },
    ]);
  };

  return { handleSignOut };
};
