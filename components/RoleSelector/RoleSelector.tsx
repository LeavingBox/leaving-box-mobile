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
  navLink?: RelativePathString ;
  onPress: () => void;
  imgLink: ImageSourcePropType;
  text: string;
};


export default function RoleSelector({ navLink, onPress, imgLink, text }: RoleSelectorProps) {
  
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
          style={styles.imageStyle}
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
    maxHeight:"50%",
  },
  link: {
    flex: 1,
    flexDirection: "column",
    flexWrap:'wrap',
    justifyContent:'space-between',
    alignItems:"center",
    alignContent:'center',
    width:'100%',
  },
  imageStyle: {
    height: "70%",
    maxWidth: "70%",
  },
  textStyle: {
    textAlign:'center',
    fontFamily: "TrainOne",
    fontSize: 25,
    fontWeight: "bold",
    color: "white",
  },
});
