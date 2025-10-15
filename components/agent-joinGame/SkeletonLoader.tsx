import React, { useEffect } from "react";
import { View, StyleSheet, Dimensions, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
  ReduceMotion,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");

export default function SkeletonLoader({ style }: { style: ViewStyle }) {
  const translateX = useSharedValue(-width);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(width, {
        duration: 1500,
        easing: Easing.linear,
        reduceMotion: ReduceMotion.System,
      }),
      -1,
      false
    );
  }, [translateX, width]);

  const shimmerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={[StyleSheet.absoluteFillObject, styles.shimmer, shimmerStyle]}
      ></Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    backgroundColor: "#2a2a2a",
    overflow: "hidden",
  },
  shimmer: {
    position: "absolute",
    left: 0,
    top: 0,
    width: "30%",
    height: "100%",
    backgroundColor: "#FFFFFF",
    opacity: 0.2,
  },
});
