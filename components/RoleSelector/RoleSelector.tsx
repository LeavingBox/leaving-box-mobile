import {
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
} from "react-native";
import { ThemedView } from "../ThemedView";
import { RelativePathString, router } from "expo-router";

type RoleSelectorProps = {
  isAgent: boolean;
};

export default function RoleSelector({ isAgent }: RoleSelectorProps) {
  function handleComponentClick() {
    if (isAgent) {
      router.navigate("/agent/joinGame");
    } else {
      router.navigate("/analyst/joinGame");
    }
  }
  const bg = isAgent
    ? require("@/assets/images/Red_BG.png")
    : require("@/assets/images/Blue_BG.png");

  const profil = isAgent
    ? require("@/assets/images/agent_DA.png")
    : require("@/assets/images/analyst_DA.png");
  return (
    <ThemedView style={styles.container}>
      <Pressable onPress={handleComponentClick} style={styles.link}>
        <Image source={bg} style={styles.imgBG} />
        <Image
          source={profil}
          style={isAgent ? styles.imageStyleAgent : styles.imageStyleAnalyste}
          resizeMode="contain"
        />
        <Text style={isAgent ? styles.titleAgent : styles.titleAnalyst}>
          {isAgent ? "Agent" : "Analyst"}
        </Text>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxHeight: "50%",
    height: "50%",
    backgroundColor: "black",
  },
  link: {
    flex: 1,
    flexDirection: "column",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    alignContent: "center",
    width: "100%",
  },
  imgBG: {
    width: "100%",
    height: "100%",
    position: "absolute",
    top: "0%",
  },
  imageStyleAnalyste: {
    height: "70%",
    maxWidth: "70%",
    position: "absolute",
    top: "32%",
    right: "0%",
  },
  imageStyleAgent: {
    height: "70%",
    maxWidth: "70%",
    position: "absolute",
    bottom: "50%",
    left: "0%",
  },
  titleAgent: {
    textAlign: "center",
    fontFamily: "TrainOne",
    fontSize: 25,
    fontWeight: "bold",
    color: "white",
  },
  titleAnalyst: {
    textAlign: "center",
    fontFamily: "TrainOne",
    fontSize: 25,
    fontWeight: "bold",
    color: "white",
  },
});
