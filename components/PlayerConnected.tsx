import { Image, StyleSheet, Text, View } from "react-native";
import { ThemedView } from "./ThemedView";

export default function PlayerConnected({
  role,
}: Readonly<{
  role: "analyste" | "agent";
}>) {
  const agent = role === "agent";
  const image = agent
    ? require("@/assets/images/OP.png")
    : require("@/assets/images/COP.png");

  return (
    <ThemedView style={styles.container}>
      <Image source={image} style={styles.image} />

      <Text style={styles.text}>{role.toUpperCase()}</Text>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "white",
  },

  image: {
    width: 50,
    height: 50,
    borderColor: "black",
    borderWidth: 2,
    borderRadius: 50,
  },

  text: {
    color: "black",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});
