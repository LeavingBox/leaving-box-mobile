import { View, Text, StyleSheet } from "react-native";
import Slider from "@react-native-community/slider";
import { useAudio } from "@/hooks/useAudio";
import { ThemedView } from "@/components/ThemedView";
import NavigationButton from "@/components/NavigationButton";
import { router } from "expo-router";

export default function AudioMenu() {
  const { setMusicVolume, volume } = useAudio();

  const handleBack = () => {
    router.navigate("/");
  };

  return (
    <ThemedView style={styles.container}>
      <Text style={styles.title}>Volume de la musique</Text>

      <Slider
        style={{ width: "80%" }}
        minimumValue={0}
        maximumValue={1}
        value={volume}
        onValueChange={setMusicVolume}
      />

      <Text style={styles.value}>{Math.round(volume * 100)}%</Text>
      <View style={styles.navigationContainer}>
          <NavigationButton onPress={handleBack} label="Retour" color="red" />
        </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    title: {
        fontSize: 24,
        color: "white",
        margin: 10,
        marginTop: 100,
    },
    value: {
        fontSize: 18,
        color: "white",
        margin: 10,
    },
    navigationContainer: {
      marginTop: 30,
      flexDirection: "row",
      justifyContent: "center",
      gap: 20,
      padding: 20,
    },
});