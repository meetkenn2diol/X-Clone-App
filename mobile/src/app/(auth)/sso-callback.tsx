import React, { useEffect } from "react";
import {
  View,
  Image,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import { useAuth } from "@clerk/expo";
import { useRouter } from "expo-router";

export default function SSOCallbackScreen() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn) {
      router.replace("/(tabs)");
    } else {
      const timer = setTimeout(() => {
        if (!isSignedIn) {
          Alert.alert(
            "Authentication Failed",
            "Unable to complete sign in. Please try again.",
          );
          router.replace("/(auth)");
        }
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isLoaded, isSignedIn, router]);

  return (
    <View style={styles.container}>
      <Image
        source={require("@/assets/images/auth2.png")}
        style={styles.image}
        resizeMode="contain"
      />
      <ActivityIndicator size="large" color="#000000" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  image: {
    width: "100%",
    height: "50%",
    marginBottom: 24,
  },
  loader: {
    marginTop: 8,
  },
});
