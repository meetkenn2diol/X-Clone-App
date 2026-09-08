import { useSocialAuth } from "@/hooks/useSocialAuth";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AuthScreen() {
  const { handleSocialAuth, isLoading, loadingStrategy } = useSocialAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Auth Image */}
        <Image
          source={require("@/assets/images/auth2.png")}
          style={styles.image}
          resizeMode="contain"
        />

        <View style={styles.bottomContainer}>
          {/* Google Button */}
          <TouchableOpacity
            style={styles.pillButton}
            onPress={() => handleSocialAuth("oauth_google")}
          >
            {isLoading && loadingStrategy === "oauth_google" ? (
              <ActivityIndicator color={"#000"} />
            ) : (
              <Image
                source={require("@/assets/images/google.png")}
                style={styles.icon}
              />
            )}
            <Text style={styles.buttonText}>Continue with Google</Text>
          </TouchableOpacity>

          {/* Apple Button */}
          <TouchableOpacity
            style={styles.pillButton}
            onPress={() => handleSocialAuth("oauth_apple")}
          >
            {isLoading && loadingStrategy === "oauth_apple" ? (
              <ActivityIndicator color={"#000"} />
            ) : (
              <Image
                source={require("@/assets/images/apple.png")}
                style={styles.icon}
                resizeMode="contain"
              />
            )}
            <Text style={styles.buttonText}>Continue with Apple</Text>
          </TouchableOpacity>

          {/*Terms, Privacy, and Cookie Text */}
          <Text className="text-center text-gray-500 text-xs leading-4 mt-6 px-2">
            By signing up, you agree to our{" "}
            <Text className="text-blue-500">Terms</Text>
            {", "}
            <Text className="text-blue-500">Privacy Policy</Text>
            {", and "}
            <Text className="text-blue-500">Cookie Use</Text>.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  image: {
    width: "100%",
    height: "50%",
    marginBottom: 24,
  },
  bottomContainer: {
    width: "100%",
    alignItems: "center",
  },
  pillButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: 52,
    borderRadius: 26,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 16,
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
});
