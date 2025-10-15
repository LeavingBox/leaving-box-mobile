import NavigationButton from "@/components/NavigationButton";
import { ThemedView } from "@/components/ThemedView";
import { Socket } from "@/core/api/session.api";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";

export default function TimerPage() {
  const router = useRouter();
  const { sessionCode, maxTime, role } = useLocalSearchParams();
  const [minutes, setMinutes] = useState("0");
  const [seconds, setSeconds] = useState("0");

  useEffect(() => {
    handleTime(maxTime as any);
    setTimeout(() => {
      handleTimer();
    }, 1000);
  }, []);

  function formatTime(totalSeconds: number) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  const handleTime = (time: number) => {
    const formatted = formatTime(time);
    const [minutes, seconds] = formatted.split(":");
    setMinutes(minutes);
    setSeconds(seconds);
  };

  const handleTimer = () => {
    console.log("Starting timer");
    Socket.emit("startTimer", { sessionCode: sessionCode });
    Socket.on("timerUpdate", (data: any) => {
      console.log("Timer update", data);
      handleTime(data.remaining);
    });
    Socket.on("gameOver", (data: any) => {
      Alert.alert("Fin de la partie", data.message,[
        { text: "MENU", onPress: () => handleBack() },
      ]);
    });
  };

  const handleBack = () => {
    Socket.emit(
      "clearSession",
      { sessionCode: sessionCode },
      (res: { success: boolean }) => {
        if (!res.success) {
          Alert.alert(
            "Erreur",
            "Une erreur s'est produite lors de la fermeture de la session."
          );
          return;
        }
        Socket.disconnect();
        Socket.removeAllListeners();
        router.navigate({
          pathname: "/agent/dificulty",
        });
      }
    );
  };

  const handleEndGame = () => {

  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.backButton}>
        <NavigationButton color="red" label="Quitter" onPress={handleBack} />
      </View>
      <Text style={styles.title}>Timer</Text>
      <View style={styles.codeContainer}>
        <TextInput
          style={styles.codeInput}
          value={minutes.toString().charAt(0)}
          maxLength={1}
          editable={false}
        />
        <TextInput
          style={styles.codeInput}
          value={minutes.toString().charAt(1)}
          maxLength={1}
          editable={false}
        />
        <Text style={styles.separator}>:</Text>
        <TextInput
          style={styles.codeInput}
          value={seconds.toString().charAt(0)}
          maxLength={1}
          editable={false}
        />
        <TextInput
          style={styles.codeInput}
          value={seconds.toString().charAt(1)}
          maxLength={1}
          editable={false}
        />
      </View>
      <Text style={styles.text}>This is the timer page</Text>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 50,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 20,
  },
  text: {
    color: "white",
    fontSize: 18,
  },

  codeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  codeInput: {
    width: 40,
    height: 40,
    backgroundColor: "#eee",
    textAlign: "center",
    fontSize: 18,
    marginHorizontal: 5,
    borderRadius: 5,
  },
  separator: {
    fontSize: 20,
    color: "white",
  },
});
