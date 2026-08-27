import { Tabs } from "expo-router";

/**
 * Tab navigator layout.
 *
 * The auth ↔ tabs transition is owned exclusively by the root layout's
 * `Stack.Protected` guards — this layout no longer performs any redirect.
 * When the user signs out, the root layout's guard removes the entire
 * `(tabs)` group from the navigation state, so pressing Back can never
 * return to these screens.
 */
export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
