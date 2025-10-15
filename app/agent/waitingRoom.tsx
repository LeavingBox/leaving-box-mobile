import { useState, useEffect } from "react";
import {
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Alert,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Socket } from "@/core/api/session.api";
import NavigationButton from "@/components/NavigationButton";
import { ThemedView } from "@/components/ThemedView";
import PlayerConnected from "@/components/PlayerConnected";
import * as Clipboard from "expo-clipboard";
import { ModuleManual } from "@/core/interface/module.interface";

export default function WaitingRoom() {
  const router = useRouter();
  const { sessionCode, maxTime, role } = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<any>();

  const handleBack = () => {
    if (role === "operator") {
      Socket.disconnect();
    }
    router.back();
  };

  useEffect(() => {
    const interval = setInterval(() => {
      Socket.emit("getSession", { sessionCode: sessionCode });
    }, 1000);

    const handleCurrentSession = (data: any) => {
      setSession(data);
      setIsLoading(false);
    };

    Socket.on("currentSession", handleCurrentSession);

    Socket.on("gameStarted", (data: { moduleManuals: ModuleManual[] }) => {
      if (role === "operator") {
        const serializedModules = JSON.stringify(data.moduleManuals);

        router.navigate({
          pathname: "/operator/manual",
          params: {
            sessionCode: sessionCode,
            maxTime: maxTime,
            role: role,
            moduleManuals: serializedModules,
          },
        });
      } else {
        console.log("Game started, but not operator");
      }
    });

    return () => {
      clearInterval(interval);
      Socket.off("currentSession", handleCurrentSession);
    };
  }, [sessionCode]);

  useEffect(() => {
    const handleSessionCleared = (res: any) => {
      Alert.alert(
        "Fermeture de la session",
        "L'agent hôte de la session a quitté la salle d'attente. La session va être fermée."
      );
      handleBack();
    };

    Socket.on("sessionCleared", handleSessionCleared);

    return () => {
      Socket.off("sessionCleared", handleSessionCleared);
    };
  }, []);

  const handleNext = () => {
    Socket.emit("startGame", { sessionCode: sessionCode }, (res: any) => {
      if (!res.success) {
        Alert.alert("Erreur", res.message);
      } else {
        router.navigate({
          pathname: "/agent/timerPage",
          params: {
            sessionCode: sessionCode,
            maxTime: maxTime,
            role: role,
          },
        });
      }
    });
  };

  return (
    <ThemedView style={styles.container}>
      <Text style={styles.title}>Salle d'attente</Text>
      <TouchableOpacity
        style={[
          styles.codeButton,
          { backgroundColor: role === "agent" ? "red" : "blue" },
        ]}
        onPress={() => Clipboard.setStringAsync(sessionCode as string)}
      >
        <Text style={styles.codeText}>{sessionCode}</Text>
      </TouchableOpacity>
      {isLoading ? (
        <ActivityIndicator
          size="large"
          color="#ffffff"
          style={{ marginBottom: 20 }}
        />
      ) : (
        session?.connectedClients.map((client: any, key: any) => (
          <PlayerConnected key={key} role={key === 0 ? "agent" : "operator"} />
        ))
      )}
      <View style={styles.buttonContainer}>
        {role === "agent" && (
          <NavigationButton
            onPress={handleNext}
            param={{ sessionCode: sessionCode }}
            label="Lancer la partie"
            color={"red"}
          />
        )}

        <NavigationButton
          onPress={handleBack}
          param={{ sessionCode: sessionCode }}
          label="Quitter la salle d'attente"
          color={role === "agent" ? "red" : "blue"}
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  codeButton: {
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 5,
    marginVertical: 20,
    elevation: 5,
    position: "absolute",
    top: 20,
    right: 20,
  },
  codeText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  buttonContainer: {
    gap: 20,
  },
  title: {
    fontSize: 24,
    color: "white",
    fontWeight: "bold",
    marginBottom: 20,
  },
  message: {
    fontSize: 18,
    color: "white",
    marginBottom: 20,
  },
});
