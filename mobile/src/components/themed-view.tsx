import { View, type ViewProps } from "react-native";

export type ThemedViewProps = ViewProps;

// Hardcoded color — no light/dark mode switching.
const BACKGROUND_COLOR = "#90dd2aff";

export function ThemedView({ style, ...rest }: ThemedViewProps) {
  return <View style={[{ backgroundColor: BACKGROUND_COLOR }, style]} {...rest} />;
}