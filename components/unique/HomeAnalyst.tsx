import { Image, Pressable, StyleSheet, Text } from "react-native";
import { ThemedView } from "../ThemedView";
import { router } from "expo-router";
import { Socket } from "@/core/api/session.api";

type HomeAnalystProps = {
  navLink?: string;
  onPress?: () => void;
};

export default function HomeAnalyst({ navLink, onPress }: HomeAnalystProps) {
  function handleComponentClick() {
    if (onPress) {
      onPress();
    } else if (navLink) {
      router.navigate(navLink);
    }
    Socket.connect();
  }

  return (
    <ThemedView style={styles.container}>
      <Pressable onPress={handleComponentClick} style={styles.link}>
        <Image
          source={require("@/assets/images/maleScientist.png")}
          style={styles.image1Style}
          resizeMode="contain"
        />
        <Image
          source={require("@/assets/images/femaleScientist.png")}
          style={styles.image2Style}
          resizeMode="contain"
        />
        <Text style={styles.textStyle}>Analyst</Text>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  link: {
    flex: 1,
    zIndex: 10,
    flexDirection: "column-reverse",
  },
  image1Style: {
    zIndex: 10,
    height: 300,
    maxWidth: "100%",
    left: 60,
    position: "relative",
  },
  image2Style: {
    zIndex: 10,
    height: 300,
    maxWidth: "100%",
    left: -60,
    position: "absolute",
  },
  textStyle: {
    fontFamily: "TrainOne",
    position: "absolute",
    top: 100,
    right: 20,
    fontSize: 25,
    fontWeight: "700",
    color: "black",
  },
});
