import { Image, StyleSheet, Pressable, View } from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { router } from "expo-router";
import RoleSelector from "@/components/RoleSelector/RoleSelector";

export default function HomeScreen() {
  return (
    <ThemedView style={styles.mainContainer}>
      <RoleSelector imgLink={require("@/assets/images/femaleAgent.png")} text={"Agent"} onPress={() => router.navigate("/agent/joinGame")}/>
      <RoleSelector imgLink={require("@/assets/images/maleScientist.png")} text={"Analyst"} onPress={() => router.navigate("/agent/joinGame")}/>
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
    gap:'10%',    
  }
});
