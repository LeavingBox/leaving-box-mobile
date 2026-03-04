import { Image, StyleSheet, Pressable, View } from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { router } from "expo-router";
import RoleSelector from "@/components/RoleSelector/RoleSelector";

export default function HomeScreen() {
  return (
    <ThemedView style={styles.mainContainer}>
      <RoleSelector
        imgLink={require("@/assets/images/agent_DA.png")}
        text={"Agent"}
        onPress={() => router.navigate("/agent/joinGame")}
        isAgent={true}
      />
      <RoleSelector
        imgLink={require("@/assets/images/analyst_DA.png")}
        text={"Analyst"}
        onPress={() => router.navigate("/agent/joinGame")}
        isAgent={false}
      />
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
    gap: "5%",
  },
});
