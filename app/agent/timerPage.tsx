import NavigationButton from "@/components/NavigationButton";
import { ThemedView } from "@/components/ThemedView";
import { Socket } from "@/core/api/session.api";
import { clearSession } from "@/core/service/session.service";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";

export default function TimerPage() {
  const router = useRouter();
  const { sessionCode, maxTime, role } = useLocalSearchParams();
  const [minutes, setMinutes] = useState("0");
  const [seconds, setSeconds] = useState("0");

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

  useEffect(() => {
    handleTime(maxTime as any);

    // Démarrer le timer après 1 seconde
    const timerTimeout = setTimeout(() => {
      Socket.emit("startTimer", {
        sessionCode: sessionCode,
        role: role, // Indiquer le rôle de celui qui démarre le timer (devrait être "agent")
      });
    }, 1000);

    // Gestionnaires d'événements Socket
    const handleTimerUpdate = (data: { remaining: number }) => {
      handleTime(data.remaining);
    };

    const handleGameOver = async (data: any) => {
      Alert.alert("Fin de la partie", data.message, [
        {
          text: "MENU",
          onPress: async () => {
            await clearSession();
            Socket.removeAllListeners();
            Socket.disconnect();
            router.replace("/");
          },
        },
      ]);
    };

    const handleSessionCleared = async (res: any) => {
      // La session se ferme automatiquement si les conditions de validation ne sont plus remplies
      const message =
        res?.message || "La session a été fermée. Le timer s'arrête.";
      Alert.alert("Session fermée", message, [
        {
          text: "OK",
          onPress: async () => {
            await clearSession();
            Socket.removeAllListeners();
            Socket.disconnect();
            router.replace("/");
          },
        },
      ]);
    };

    const handleSessionClosed = async (data: any) => {
      // Événement "sessionClosed" - fin de partie, tous les joueurs retournent à la home
      console.log("Session closed détecté:", data);
      await clearSession();
      Socket.removeAllListeners();
      Socket.disconnect();
      router.replace("/");
    };

    Socket.on("timerUpdate", handleTimerUpdate);
    Socket.on("gameOver", handleGameOver);
    Socket.on("sessionCleared", handleSessionCleared);
    Socket.on("sessionClosed", handleSessionClosed);

    return () => {
      clearTimeout(timerTimeout);
      Socket.off("timerUpdate", handleTimerUpdate);
      Socket.off("gameOver", handleGameOver);
      Socket.off("sessionCleared", handleSessionCleared);
      Socket.off("sessionClosed", handleSessionClosed);
    };
  }, [sessionCode, role]);

  const handleBack = () => {
    console.log("quitting session");
    Socket.emit(
      "clearSession",
      {
        sessionCode: sessionCode,
        role: role, // Indiquer le rôle de celui qui ferme la session
      },
      (res: { success: boolean }) => {
        if (!res.success) {
          Alert.alert(
            "Erreur",
            "Une erreur s'est produite lors de la fermeture de la session.",
          );
          return;
        }
        Socket.disconnect();
        Socket.removeAllListeners();
        router.navigate({
          pathname: "/agent/dificulty",
        });
      },
    );
  };
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
