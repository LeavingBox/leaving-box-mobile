import { Image, StyleSheet, Pressable } from "react-native";
import { ThemedView } from "@/components/ThemedView";
import HomeAgent from "@/components/unique/HomeAgent";
import HomeOperator from "@/components/unique/HomeOperator";
import { router } from "expo-router";

export default function HomeScreen() {
  return (
    <ThemedView style={{ flex: 1 }}>
      <Image
        resizeMode="contain"
        source={require("@/assets/images/homePageLogo.png")}
        style={styles.mainLogo}
      />
      <Image
        resizeMode="contain"
        source={require("@/assets/images/agentBG.png")}
        style={styles.agentBackground}
      />
      <Image
        resizeMode="contain"
        source={require("@/assets/images/opBG.png")}
        style={styles.operatorBackground}
      />
      <Image
        source={require("@/assets/images/homeLightning.png")}
        style={styles.lightBackground}
      />

      <ThemedView style={styles.mainContainer}>
        <HomeAgent onPress={() => router.navigate("/agent/dificulty")} />
        <HomeOperator onPress={() => router.navigate("/operator/joinGame")} />
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  mainLogo: {
    zIndex: 100,
    width: "80%",
    top: 10,
    alignSelf: "center",
    position: "absolute",
  },
  agentBackground: {
    position: "absolute",
    top: 0,
    zIndex: 1,
  },
  operatorBackground: {
    position: "absolute",
    bottom: 0,
    // width: "100%",
    zIndex: 9,
  },
  lightBackground: {
    position: "absolute",
    bottom: 175,
    alignSelf: "center",
    width: "110%",
    zIndex: 9,
    transform: [{ rotate: "1deg" }],
  },

  mainContainer: {
    flex: 1,
    maxHeight: "100%",
    flexDirection: "column",
  },
});
