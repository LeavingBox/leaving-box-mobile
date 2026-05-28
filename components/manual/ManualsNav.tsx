import { ModuleManual } from "@/core/interface/module.interface";
import { ThemedView } from "../ThemedView";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function ManualsNav({
  data,
  selectedManual,
  setSelectedManual,
}: Readonly<{
  data: ModuleManual[];
  selectedManual: ModuleManual | null;
  setSelectedManual: (manual: ModuleManual) => void;
}>) {
  return (
    <View style={styles.navbar}>
      {data.map((manual, index) => (
        <ThemedView
          key={manual.name}
          style={[
            index == 0 ? styles.buttonFirst : styles.button,
            { zIndex: data.length - index },
            selectedManual?.name === manual.name && styles.selectedButton,
          ]}
        >
          <Pressable
            onPress={() => setSelectedManual(manual)}
            style={styles.pressable}
          >
            <Text
              style={[
                styles.buttonText,
                selectedManual?.name === manual.name &&
                  styles.selectedButtonText,
              ]}
            >
              {index + 1}
            </Text>
          </Pressable>
        </ThemedView>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  buttonFirst: {
    width: 30,
    height: "100%",
    flex: 1,
    paddingTop: 10,
    backgroundColor: " rgba(242, 208, 167, 1)",
    boxShadow: "-2px 5px 3px 0px rgba(0, 0, 0, 0.50)",
    borderBottomLeftRadius: 20,
    borderTopLeftRadius: 20,
  },
  button: {
    width: 30,
    height: "100%",
    flex: 1,
    paddingTop: 30,
    marginTop: -20,
    backgroundColor: " rgba(242, 208, 167, 1)",
    boxShadow: "-2px 5px 3px 0px rgba(0, 0, 0, 0.50)",
    borderBottomLeftRadius: 20,
  },
  pressable: {
    height: "100%",
    width: "100%",
    display: "flex",
    alignContent: "center",
  },
  navbar: {
    height: "100%",
    display: "flex",
  },
  selectedButton: {
    backgroundColor: " rgba(29, 40, 242, 1)",
  },
  buttonText: {
    color: "#000",
    fontSize: 24,
    textAlign: "center",
  },
  selectedButtonText: {
    color: "#fff",
  },
});
