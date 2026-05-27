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
      <View style={styles.topBar}>
        <Image
          source={require("@/assets/images/LOGO.png")}
          style={styles.logo}
        />
        <Pressable
          onPress={() => router.navigate("/audio/audioMenu")}
          style={styles.settingsButton}
        >
          <Image
            source={require("@/assets/images/parameters.png")}
            style={styles.icon}
          />
        </Pressable>
      </View>

      <RoleSelector isAgent={true} />
      <RoleSelector isAgent={false} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    marginTop: "0%",
    marginBottom: "0%",
    flex: 1,
    height: "100%",
    flexDirection: "column",
    backgroundColor: "white",
    gap: 20,
  },
  topBar: {
    position: "absolute",
    top: 30,
    left: 0,
    paddingLeft: 10,
    paddingRight: 10,
    width: "100%",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 10,
  },
  settingsButton: {},
  logo: {
    width: 50,
    height: 50,
    resizeMode: "contain",
  },
  icon: {
    width: 60,
    height: 60,
    resizeMode: "contain",
  },
});
