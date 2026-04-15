import { Image, StyleSheet, Pressable, View } from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { router } from "expo-router";
import RoleSelector from "@/components/RoleSelector/RoleSelector";
import { useEffect } from "react";
import { useAudio } from "@/hooks/useAudio";

export default function HomeScreen() {
  const { playMusic } = useAudio();

  useEffect(() => {
    playMusic("menu");
  }, []);
  
  return (
    <ThemedView style={styles.mainContainer}>
      <Pressable
        onPress={() => router.navigate("/audio/audioMenu")}
        style={styles.settingsButton}
      >
        <Image
          source={require("@/assets/images/parameters.png")}
          style={styles.icon}
        />
      </Pressable>
      <RoleSelector
        imgLink={require("@/assets/images/femaleAgent.png")}
        text={"Agent"}
        onPress={() => router.navigate("/agent/dificulty")}
      />
      <RoleSelector
        imgLink={require("@/assets/images/maleScientist.png")}
        text={"Analyst"}
        onPress={() => router.navigate("/analyst/joinGame")}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    marginTop: "20%",
    marginBottom: "10%",
    flex: 1,
    height: "100%",
    flexDirection: "column",
    gap: "10%",
  },
  settingsButton: {
    position: "absolute",
    top: 30,
    right: 20,
    zIndex: 10,
  },
  icon: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },
});
