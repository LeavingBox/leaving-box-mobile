import {
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ThemedView } from "../ThemedView";
import { RelativePathString, router } from "expo-router";

type RoleSelectorProps = {
  isAgent: boolean;
};

export default function RoleSelector({ isAgent }: RoleSelectorProps) {
  function handleComponentClick() {
    if (isAgent) {
      router.navigate("/agent/dificulty");
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
  const title = isAgent
    ? require("@/assets/images/agent-title.png")
    : require("@/assets/images/analyste-title.png");
  return (
    <ThemedView style={styles.container}>
      <Pressable onPress={handleComponentClick} style={styles.click}>
        <Image source={bg} style={styles.imgBG} />
        <View
          style={isAgent ? styles.imageStyleAgent : styles.imageStyleAnalyste}
        >
          <Image source={profil} resizeMode="contain" />
        </View>

        <View style={isAgent ? styles.textAgent : styles.textAnalyst}>
          <Image source={title} style={styles.text} resizeMode="contain" />
        </View>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxHeight: "50%",
    height: "50%",
  },
  click: {
    width: "100%",
    height: "100%",
  },
  textAgent: {
    position: "absolute",
    top: "0%",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    alignContent: "flex-end",
    width: "100%",
    height: "100%",
    paddingRight: 30,
  },
  text: {
    width: "10%",
    zIndex: 3,
  },
  img: { width: "100%" },
  textAnalyst: {
    position: "absolute",
    top: "0%",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    alignContent: "flex-start",
    width: "100%",
    height: "100%",
    paddingLeft: 30,
  },
  imgBG: {
    width: "100%",
    height: "100%",
    position: "absolute",
    top: "0%",
  },
  imageStyleAnalyste: {
    position: "absolute",
    top: "0%",
    width: "100%",
    height: "100%",
    justifyContent: "flex-end",
    alignItems: "flex-end",
  },
  imageStyleAgent: {
    position: "absolute",
    bottom: "0%",
    left: "0%",
    justifyContent: "flex-end",
    alignItems: "center",
    alignContent: "flex-start",
  },
  title: {
    textAlign: "center",
    fontFamily: "TrainOne",
    fontSize: 25,
    fontWeight: "bold",
    color: "white",
  },
});
