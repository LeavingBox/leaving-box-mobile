import { View, type ViewProps } from 'react-native';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({
  style,
  ...otherProps
}: ThemedViewProps) {
  const backgroundColor = 'rgba(43, 49, 53, 0)';

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}