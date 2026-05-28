import { ThemedView } from "@/components/ThemedView";
import {
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Alert,
  Image,
  View,
} from "react-native";
export default function fake_victory() {
  return (
    <ThemedView style={styles.mainContainer}>
      <View style={styles.background}>
        <Image
          source={require("@/assets/images/Blue_grid_bg.png")}
          style={styles.backgroundImage}
        />
      </View>
      <View style={styles.victoryText}>
        <Text style={styles.title}>Bombe désamorcée avec succès !</Text>
        <Image
          source={require("@/assets/images/classified.png")}
          style={styles.titleImg}
        />
      </View>
    </ThemedView>
  );
}
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    height: "100%",
    width: "100%",
    flexDirection: "column",
    backgroundColor: "white",
    alignContent: "center",
    justifyContent: "center",
  },
  background: {
    position: "absolute",
    top: "0%",
    width: "100%",
    height: "100%",
  },
  backgroundImage: { width: "100%", height: "100%" },
  victoryText: {
    height: "100%",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 40,
    textAlign: "center",
    color: "white",
    fontWeight: "bold",
    marginBottom: 20,
  },
  titleImg: { width: "100%", height: "50%", resizeMode: "contain" },
});
