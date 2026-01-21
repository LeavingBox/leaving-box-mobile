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

/**
 * Salle d'attente pour une session de jeu
 * 
 * Règles des rôles :
 * - 1 seul agent par session (créateur de la session)
 * - 1 ou plusieurs opérateurs peuvent rejoindre la session
 */
export default function WaitingRoom() {
  const router = useRouter();
  const { sessionCode, maxTime, role } = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<any>();
  const [moduleManuals, setModuleManuals] = useState<ModuleManual[]>([]);

  const handleBack = () => {
    if (sessionCode) {
      Socket.emit("back", { 
        sessionCode: sessionCode as string,
        role: role // Indiquer le rôle de celui qui fait retour en arrière
      });
    }
    if (role === "operator") {
      Socket.disconnect();
    }
    router.back();
  };

  useEffect(() => {
    const interval = setInterval(() => {
      Socket.emit("getSession", { 
        sessionCode: sessionCode,
        role: role // Indiquer le rôle pour obtenir les bonnes informations
      });
    }, 1000);

    const handleCurrentSession = (data: any) => {
      setSession(data);
      setIsLoading(false);
    };

    Socket.on("currentSession", handleCurrentSession);

    Socket.on("gameStarted", (data: { moduleManuals: ModuleManual[] }) => {
      // Stocker les manuels pour pouvoir les réutiliser si l'opérateur revient
      if (data.moduleManuals) {
        setModuleManuals(data.moduleManuals);
      }
      
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
    return () => {
      // Nettoyage lors du démontage du composant
      if (sessionCode && role === "operator") {
        Socket.emit("back", { 
          sessionCode: sessionCode as string,
          role: role
        });
        Socket.disconnect();
      }
    };
  }, [sessionCode, role]);
  useEffect(() => {
    const handleSessionCleared = async (res: any) => {
      // La session se ferme automatiquement si :
      // - L'agent quitte (plus d'agent)
      // - Tous les opérateurs quittent (plus d'opérateur)
      // - Les conditions de validation ne sont plus remplies (moins de 1 agent + 1 opérateur)
      const message = res?.message || 
        (role === "agent" 
          ? "Tous les opérateurs ont quitté la session. La session va être fermée."
          : "L'agent hôte de la session a quitté. La session va être fermée.");
      
      Alert.alert("Fermeture de la session", message, [
        {
          text: "OK",
          onPress: async () => {
            await clearSession();
            Socket.removeAllListeners();
            Socket.disconnect();
            router.replace("/");
          }
        }
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

    Socket.on("sessionCleared", handleSessionCleared);
    Socket.on("sessionClosed", handleSessionClosed);

    return () => {
      Socket.off("sessionCleared", handleSessionCleared);
      Socket.off("sessionClosed", handleSessionClosed);
    };
  }, [role]);

  useEffect(() => {
    const handleOperatorBackNavigation = (data: any) => {
      console.log("Un opérateur a fait retour en arrière:", data);
    };

    Socket.on("operatorBackNavigation", handleOperatorBackNavigation);

    return () => {
      Socket.off("operatorBackNavigation", handleOperatorBackNavigation);
    };
  }, []);

  const handleNext = () => {
    Socket.emit("startGame", { 
      sessionCode: sessionCode,
      role: role // Indiquer le rôle de celui qui démarre le jeu (devrait être "agent")
    }, (res: any) => {
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

  const handleJoin = () => {
    // Vérifier si le jeu a déjà démarré et récupérer les manuels stockés
    if (moduleManuals.length > 0) {
      const serializedModules = JSON.stringify(moduleManuals);
      router.navigate({
        pathname: "/operator/manual",
        params: { 
          sessionCode: sessionCode, 
          role: "operator",
          moduleManuals: serializedModules,
          maxTime: maxTime
        },
      });
    } else {
      // Si le jeu n'a pas encore démarré, attendre l'événement gameStarted
      Alert.alert(
        "Partie non démarrée",
        "La partie n'a pas encore démarré. Attendez que l'agent lance la partie."
      );
    }
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
        <>
          {/* Structure avec players (recommandée) : 1 agent + 1 ou plusieurs opérateurs */}
          {session?.players ? (
            <>
              {/* Afficher l'agent (un seul) */}
              {session.players.find((p: any) => p.role === "agent") && (
                <PlayerConnected key="agent" role="agent" />
              )}
              {/* Afficher tous les opérateurs (un ou plusieurs) */}
              {session.players
                .filter((p: any) => p.role === "operator")
                .map((operator: any, index: number) => (
                  <PlayerConnected
                    key={`operator-${operator.id || index}`}
                    role="operator"
                  />
                ))}
            </>
          ) : (
            /* Fallback pour connectedClients (ancienne structure) */
            session?.connectedClients?.map((client: any, key: any) => (
              <PlayerConnected
                key={key}
                role={key === 0 ? "agent" : "operator"}
              />
            ))
          )}
        </>
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
        {role === "operator" && (
          <NavigationButton
            onPress={handleJoin}
            param={{ sessionCode: sessionCode }}
            label="Rejoindre la partie"
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
