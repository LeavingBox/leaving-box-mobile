import {
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
} from "react-native";
import { ThemedView } from "../ThemedView";
import { RelativePathString, router } from "expo-router";
import { useEffect } from "react";

type RoleSelectorProps = {
  navLink?: RelativePathString;
  onPress: () => void;
  imgLink: ImageSourcePropType;
  text: string;
  isAgent: boolean;
};

export default function RoleSelector({
  navLink,
  onPress,
  imgLink,
  text,
  isAgent,
}: RoleSelectorProps) {
  function handleComponentClick() {
    if (onPress) {
      onPress();
    } else if (navLink) {
      router.navigate(navLink);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <Pressable onPress={handleComponentClick} style={styles.link}>
        <Image
          source={imgLink}
          style={isAgent ? styles.imageStyleAgent : styles.imageStyleAnalyste}
          resizeMode="contain"
        />
        <Text style={styles.textStyle}>{text || "agent"}</Text>
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
  link: {
    flex: 1,
    flexDirection: "column",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    alignContent: "center",
    width: "100%",
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
  textStyle: {
    textAlign: "center",
    fontFamily: "TrainOne",
    fontSize: 25,
    fontWeight: "bold",
    color: "white",
  },
});
