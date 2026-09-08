import { useClerk } from "@clerk/expo";
import { Button, Text, View } from "react-native";


export default function Home() {
    const { signOut } = useClerk();
    return (
        <View>
            <Text> You are Signed in</Text>

            <Button title="Logout" onPress={() => signOut()} />
        </View>
    );
}