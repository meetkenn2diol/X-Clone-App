import { useAuth, useSignIn, useSignUp } from "@clerk/expo";
import { Href, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ContinueScreen() {
  const router = useRouter();

  const { signOut } = useAuth();

  const {
    signUp,
    errors: signUpErrors,
    fetchStatus: signUpFetchStatus,
  } = useSignUp();

  const { signIn } = useSignIn();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isRestarting, setIsRestarting] = useState(false);

  /**
   * Redirect the user if authentication has already been completed.
   */
  if (signIn.status === "complete" || signUp.status === "complete") {
    return router.push("/");
  }

  /**
   * Completes the Clerk sign-up after the required
   * user information has been provided.
   */
  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert(
        "Missing Information",
        "Please enter your first and last name.",
      );
      return;
    }

    try {
      await signUp.update({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });

      if (signUp.status === "complete") {
        await signUp.finalize({
          navigate: ({ session, decorateUrl }) => {
            /**
             * Handle any Clerk session tasks.
             */
            if (session?.currentTask) {
              console.log("Clerk session task:", session.currentTask);
              return;
            }

            /**
             * Navigate the authenticated user to the home screen.
             */
            const url = decorateUrl("/");

            if (url.startsWith("http")) {
              window.location.href = url;
            } else {
              router.push(url as Href);
            }
          },
        });
      } else {
        console.error(
          "Sign-up is not complete:",
          signUp.status,
          signUp.missingFields,
        );
      }
    } catch (error) {
      console.error("Error completing sign-up:", error);

      Alert.alert(
        "Unable to Continue",
        "We couldn't complete your account setup. Please try again.",
      );
    }
  };

  /**
   * Restarts the Clerk registration flow by signing out
   * and returning the user to the social authentication screen.
   */
  const handleRestartRegistration = async () => {
    setIsRestarting(true);

    try {
      await signOut();

      setFirstName("");
      setLastName("");

      router.replace("/(auth)/auth-index");
    } catch (error) {
      console.error("Error restarting registration:", error);

      Alert.alert(
        "Unable to Restart",
        "We couldn't restart registration. Please try again.",
      );
    } finally {
      setIsRestarting(false);
    }
  };

  /**
   * Handle only the missing requirements state.
   */
  if (signUp.status !== "missing_requirements") {
    return null;
  }

  const isSubmitting = signUpFetchStatus === "fetching";

  const canSubmit =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    !isSubmitting &&
    !isRestarting;

  /**
   * Log Clerk errors instead of displaying the complete
   * error object in the UI.
   */
  if (signUpErrors) {
    console.error("Clerk sign-up errors:", signUpErrors);
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="flex-grow px-8"
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center">
          {/* TOP IMAGE */}
          <View className="items-center mb-4">
            <Image
              source={require("@/assets/images/auth2.png")}
              className="size-96"
              resizeMode="contain"
            />
          </View>

          {/* HEADER */}
          <View className="mb-8">
            <Text className="text-2xl font-bold text-black">
              Complete your account
            </Text>

            <Text className="text-gray-500 text-sm mt-2 leading-5">
              Just a few more details are needed to finish setting up your
              account.
            </Text>
          </View>

          {/* FIRST NAME */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              First name
            </Text>

            <TextInput
              className="border border-gray-300 rounded-full px-5 py-3 text-base text-black bg-white"
              value={firstName}
              placeholder="Enter your first name"
              placeholderTextColor="#9CA3AF"
              onChangeText={setFirstName}
              autoCapitalize="words"
              autoCorrect
              editable={!isSubmitting && !isRestarting}
            />

            {signUpErrors.fields?.firstName && (
              <Text className="text-red-500 text-xs mt-2 ml-4">
                {signUpErrors.fields.firstName.message}
              </Text>
            )}
          </View>

          {/* LAST NAME */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Last name
            </Text>

            <TextInput
              className="border border-gray-300 rounded-full px-5 py-3 text-base text-black bg-white"
              value={lastName}
              placeholder="Enter your last name"
              placeholderTextColor="#9CA3AF"
              onChangeText={setLastName}
              autoCapitalize="words"
              autoCorrect
              editable={!isSubmitting && !isRestarting}
            />

            {signUpErrors.fields?.lastName && (
              <Text className="text-red-500 text-xs mt-2 ml-4">
                {signUpErrors.fields.lastName.message}
              </Text>
            )}
          </View>

          {/* CONTINUE BUTTON */}
          <TouchableOpacity
            className={`rounded-full py-3 px-6 items-center justify-center ${
              canSubmit ? "bg-black" : "bg-gray-300"
            }`}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text className="text-white font-medium text-base">
                Continue
              </Text>
            )}
          </TouchableOpacity>

          {/* TERMS */}
          <Text className="text-center text-gray-500 text-xs leading-4 mt-6 px-2">
            By continuing, you agree to our{" "}
            <Text className="text-blue-500">Terms</Text>
            {", "}
            <Text className="text-blue-500">Privacy Policy</Text>
            {", and "}
            <Text className="text-blue-500">Cookie Use</Text>.
          </Text>

          {/* RESTART REGISTRATION */}
          <TouchableOpacity
            className="items-center mt-5"
            onPress={handleRestartRegistration}
            disabled={isRestarting || isSubmitting}
          >
            {isRestarting ? (
              <ActivityIndicator size="small" color="#6B7280" />
            ) : (
              <Text className="text-gray-500 text-sm">
                Start over
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}