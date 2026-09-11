import { Text } from "react-native";
import SignOutButton from "@/components/SignOutButton";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUserSync } from "@/hooks/useUserSync";

export default function Home() {
    useUserSync();
    return (
        <SafeAreaView>
            <Text> You are Signed in</Text>

            <SignOutButton />
        </SafeAreaView>
    );
}