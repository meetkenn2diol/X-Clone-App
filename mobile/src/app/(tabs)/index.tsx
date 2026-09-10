import { Text } from "react-native";
import SignOutButton from "@/components/SignOutButton";
import { SafeAreaView } from "react-native-safe-area-context";


export default function Home() {
    return (
        <SafeAreaView>
            <Text> You are Signed in</Text>

            <SignOutButton />
        </SafeAreaView>
    );
}