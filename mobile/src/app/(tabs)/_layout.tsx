import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen 
        name="index" 
        options={{ title: 'Home' }} 
      />
      {/* Add other tab screens here as needed */}
    </Tabs>
  );
}