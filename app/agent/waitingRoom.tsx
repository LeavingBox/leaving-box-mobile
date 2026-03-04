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
import { clearSession } from "@/core/service/session.service";
import NavigationButton from "@/components/NavigationButton";
import { ThemedView } from "@/components/ThemedView";
import PlayerConnected from "@/components/PlayerConnected";
import * as Clipboard from "expo-clipboard";
import { ModuleManual } from "@/core/interface/module.interface";
import { Player, Session } from "@/core/interface/session.interface";
import {
  AnalystSolution,
  GameStartedData,
} from "@/core/interface/solution.interface";

const toModuleManual = (raw: Record<string, unknown>): ModuleManual => {
  const src = (raw._doc ?? raw) as Record<string, unknown>;
  const rules = src.rules;
  return {
    _id: (src._id ?? src.moduleId) as string | undefined,
    moduleId: (src.moduleId ?? src._id) as string | undefined,
    name: String(src.name ?? ""),
    description: String(src.description ?? ""),
    rules: typeof rules === "string" ? [rules] : Array.isArray(rules) ? (rules as string[]) : [],
    imgUrl: src.imgUrl as string | undefined,
    solutions: (src.solutions as ModuleManual["solutions"]) ?? [],
  };
};

export default function WaitingRoom() {
  const router = useRouter();
  const goToHome = async () => {
    await clearSession();
    Socket.removeAllListeners();
    Socket.disconnect();
    router.replace("/");
  };
  const { sessionCode, maxTime, role } = useLocalSearchParams();
  const [session, setSession] = useState<Session | undefined>();
  const [moduleManuals, setModuleManuals] = useState<ModuleManual[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleBack = () => {
    if (sessionCode) Socket.emit("back", { sessionCode: sessionCode as string, role });
    if (role === "analyste") Socket.disconnect();
    router.back();
  };

  useEffect(() => {
    const interval = setInterval(() => Socket.emit("getSession", { sessionCode, role }), 1000);

    const handleCurrentSession = (data: Session) => {
      setSession(data);
      setIsLoading(false);
    };

    const handleGameStarted = (data: GameStartedData) => {
      const modules = data.moduleManuals?.map((m) => toModuleManual(m as Record<string, unknown>)) ?? [];
      if (modules.length === 0) {
        setModuleManuals([]);
        if (role === "analyste") {
          Alert.alert(
            "Erreur",
            "Aucun module reçu. La partie n'a pas pu démarrer correctement.",
            [{ text: "OK" }],
          );
        }
        return;
      }

      const socketId = Socket.id;
      if (role === "analyste" && !socketId && data.solutionsByAnalyste) {
        console.warn("[WaitingRoom] Socket.id indéfini : solutions par analyste non appliquées.");
      }
      const mySolutions = socketId ? data.solutionsByAnalyste?.[socketId] : undefined;
      const manuals =
        role === "analyste" && mySolutions
          ? modules.map((manual) => {
              const match = mySolutions.find(
                (s: AnalystSolution) =>
                  String(s.moduleId) === String(manual._id ?? manual.moduleId),
              );
              return { ...manual, solutions: match?.solutions ?? [] };
            })
          : modules;

      setModuleManuals(manuals);
      if (role === "analyste") {
        router.navigate({
          pathname: "/analyst/manual",
          params: { sessionCode, maxTime, role, moduleManuals: JSON.stringify(manuals) },
        });
      }
    };

    Socket.on("currentSession", handleCurrentSession);
    Socket.on("gameStarted", handleGameStarted);

    return () => {
      clearInterval(interval);
      Socket.off("currentSession", handleCurrentSession);
      Socket.off("gameStarted", handleGameStarted);
    };
  }, [sessionCode, role]);

  useEffect(() => {
    return () => {
      if (sessionCode && role === "analyste") {
        Socket.emit("back", { sessionCode: sessionCode as string, role });
        Socket.disconnect();
      }
    };
  }, [sessionCode, role]);

  useEffect(() => {
    const onSessionEnd = (res?: { message?: string }) => {
      const msg =
        res?.message ??
        (role === "agent"
          ? "Tous les opérateurs ont quitté. La session va être fermée."
          : "L'agent a quitté. La session va être fermée.");
      Alert.alert("Fermeture de la session", msg, [
        { text: "OK", onPress: () => goToHome() },
      ]);
    };
    Socket.on("sessionCleared", onSessionEnd);
    Socket.on("sessionClosed", () => goToHome());
    return () => {
      Socket.off("sessionCleared", onSessionEnd);
      Socket.off("sessionClosed");
    };
  }, [role]);

  const handleNext = () => {
    Socket.emit("startGame", { sessionCode, role }, (res: { success: boolean; message?: string }) => {
      if (res.success) {
        router.navigate({
          pathname: "/agent/timerPage",
          params: { sessionCode, maxTime, role },
        });
      } else Alert.alert("Erreur", res.message);
    });
  };

  const handleJoin = () => {
    if (moduleManuals.length > 0) {
      router.navigate({
        pathname: "/analyst/manual",
        params: {
          sessionCode,
          role: "analyste",
          moduleManuals: JSON.stringify(moduleManuals),
          maxTime,
        },
      });
    } else {
      Alert.alert("Partie non démarrée", "Attendez que l'agent lance la partie.");
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Text style={styles.title}>Salle d'attente</Text>
      <TouchableOpacity
        style={[styles.codeButton, { backgroundColor: role === "agent" ? "red" : "blue" }]}
        onPress={() => Clipboard.setStringAsync(sessionCode as string)}
      >
        <Text style={styles.codeText}>{sessionCode}</Text>
      </TouchableOpacity>
      {isLoading ? (
        <ActivityIndicator size="large" color="#ffffff" style={{ marginBottom: 20 }} />
      ) : (
        <>
          {session?.players ? (
            <>
              {session.players.some((p: Player) => p.role === "agent") && (
                <PlayerConnected key="agent" role="agent" />
              )}
              {session.players
                .filter((p: Player) => p.role === "analyste")
                .map((p: Player, i: number) => (
                  <PlayerConnected key={p.id ?? i} role="analyste" />
                ))}
            </>
          ) : (
            session?.connectedClients?.map((_, i) => (
              <PlayerConnected key={i} role={i === 0 ? "agent" : "analyste"} />
            ))
          )}
        </>
      )}
      <View style={styles.buttonContainer}>
        {role === "agent" && (
          <NavigationButton onPress={handleNext} param={{ sessionCode }} label="Lancer la partie" color="red" />
        )}
        {role === "analyste" && (
          <NavigationButton onPress={handleJoin} param={{ sessionCode }} label="Rejoindre la partie" color="red" />
        )}
        <NavigationButton onPress={handleBack} param={{ sessionCode }} label="Quitter" color={role === "agent" ? "red" : "blue"} />
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
  buttonContainer: { gap: 20 },
  title: {
    fontSize: 24,
    color: "white",
    fontWeight: "bold",
    marginBottom: 20,
  },
});
