import { ModuleManual } from "@/core/interface/module.interface";
import { ThemedView } from "../ThemedView";
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";

export default function ManualsNav({
  manual,
  selectedManual,
  setSelectedManual,
  index,
  length,
}: Readonly<{
  manual: ModuleManual;
  selectedManual: ModuleManual | null;
  setSelectedManual: (manual: ModuleManual) => void;
  index: number;
  length: number;
}>) {
  return (
    <ThemedView
      style={[
        styles.button,
        styles.shadow,
        { zIndex: length - index},
        selectedManual?.name === manual.name && styles.selected,
      ]}
    >
      <Pressable onPress={() => setSelectedManual(manual)}>
        <ImageBackground
          source={require("../../assets/images/folder_background.png")}
          style={styles.backgroundImage}
          resizeMode="stretch"
        >
          <Text
            style={[
              styles.buttonText,
              selectedManual?.name === manual.name && styles.selectedButtonText,
            ]}
          >
            {index + 1}.
          </Text>
        </ImageBackground>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 30,
    height: 70,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    overflow: "hidden",
    shadowColor: "black",
  },
  shadow: {
    boxShadow: "-2px 5px 3px 0px rgba(0, 0, 0, 0.50)",
  },
  selected: {
    zIndex: 100,
  },

  backgroundImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  selectedButton: {},
  buttonText: {
    color: "#000",
    fontSize: 16,
  },
  selectedButtonText: {
    color: "#fff",
  },
});
