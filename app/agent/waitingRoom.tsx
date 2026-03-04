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
type SolutionWithIndex = { index: number; text: string };

type AnalystSolution = {
  moduleId: string;
  solutions: string[] | SolutionWithIndex[];
};

const attachSolutionsToManuals = (
  manuals: ModuleManual[],
  analystSolutions: AnalystSolution[],
): ModuleManual[] =>
  manuals.map((manual) => {
    const manualId = manual._id ?? manual.moduleId ?? manual.name;
    const matched = analystSolutions.find(
      (solution) =>
        solution.moduleId === manualId || solution.moduleId === manual.moduleId,
    );

    return {
      ...manual,
      solutions: matched?.solutions ?? manual.solutions ?? [],
    };
  });

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
        role: role, // Indiquer le rôle de celui qui fait retour en arrière
      });
    }
    if (role === "analyste") {
      Socket.disconnect();
    }
    router.back();
  };

  useEffect(() => {
    const interval = setInterval(() => {
      Socket.emit("getSession", {
        sessionCode: sessionCode,
        role: role, // Indiquer le rôle pour obtenir les bonnes informations
      });
    }, 1000);

    const handleCurrentSession = (data: any) => {
      setSession(data);
      setIsLoading(false);
    };

    Socket.on("currentSession", handleCurrentSession);

    Socket.on(
      "gameStarted",
      (data: {
        moduleManuals: any[]; // Peut être des objets Mongoose avec _doc
        solutionsByAnalyste?: Record<string, AnalystSolution[]>;
        session?: any;
        solutionsDistribution?: Array<{
          moduleId: string;
          allocations?: Record<string, string[]>; // Format: { operatorId: solutions[] }
          operatorId?: string; // Format alternatif
          solutions?: string[]; // Format alternatif
        }>;
      }) => {
        // Fonction helper pour extraire les données d'un module (gère Mongoose)
        const extractModuleData = (module: any): ModuleManual => {
          // Si c'est un objet Mongoose, extraire depuis _doc
          if (module?._doc) {
            return {
              _id: module._doc._id,
              moduleId: module._doc._id,
              name: module._doc.name,
              description: module._doc.description,
              rules:
                typeof module._doc.rules === "string"
                  ? [module._doc.rules]
                  : Array.isArray(module._doc.rules)
                    ? module._doc.rules
                    : [],
              imgUrl: module._doc.imgUrl,
              solutions: module.solutions || [], // Solutions fusionnées plus tard
            };
          }
          // Sinon, utiliser directement
          return {
            _id: module._id || module.moduleId,
            moduleId: module.moduleId || module._id,
            name: module.name,
            description: module.description,
            rules:
              typeof module.rules === "string"
                ? [module.rules]
                : Array.isArray(module.rules)
                  ? module.rules
                  : [],
            imgUrl: module.imgUrl,
            solutions: module.solutions || [],
          };
        };

        // Normaliser les modules (extraire depuis _doc si Mongoose)
        const normalizedModules: ModuleManual[] =
          data.moduleManuals?.map(extractModuleData) || [];

        // Fusionner les solutions avec les manuels pour l'opérateur actuel
        let manualsWithSolutions: ModuleManual[] = [];

        if (normalizedModules.length > 0) {
          if (role === "analyste" && data.solutionsByAnalyste && Socket.id) {
            // Récupérer les solutions de cet opérateur
            const mySolutions = data.solutionsByAnalyste[Socket.id] || [];

            // Fusionner les solutions avec les manuels normalisés
            manualsWithSolutions = normalizedModules.map((manual) => {
              const manualId = String(manual._id || manual.moduleId);
              const matchedSolutions = mySolutions.find(
                (sol) =>
                  String(sol.moduleId) === manualId ||
                  String(sol.moduleId) === String(manual._id) ||
                  String(sol.moduleId) === String(manual.moduleId),
              );

              return {
                ...manual,
                solutions: matchedSolutions?.solutions || [],
              };
            });
          } else {
            // Pour l'agent, pas de solutions
            manualsWithSolutions = normalizedModules;
          }

          // Stocker les manuels (avec solutions pour opérateur) pour réutilisation
          setModuleManuals(manualsWithSolutions);
        }

        if (role === "analyste") {
          const serializedModules = JSON.stringify(manualsWithSolutions);

          router.navigate({
            pathname: "/analyst/manual",
            params: {
              sessionCode: sessionCode,
              maxTime: maxTime,
              role: role,
              moduleManuals: serializedModules,
            },
          });
        }
      },
    );

    return () => {
      clearInterval(interval);
      Socket.off("currentSession", handleCurrentSession);
    };
  }, [sessionCode]);
  useEffect(() => {
    return () => {
      // Nettoyage lors du démontage du composant
      if (sessionCode && role === "analyste") {
        Socket.emit("back", {
          sessionCode: sessionCode as string,
          role: role,
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
      const message =
        res?.message ||
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
          },
        },
      ]);
    };

    const handleSessionClosed = async (data: any) => {
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
      // Opérateur a fait retour en arrière
    };

    Socket.on("operatorBackNavigation", handleOperatorBackNavigation);

    return () => {
      Socket.off("operatorBackNavigation", handleOperatorBackNavigation);
    };
  }, []);

  const handleNext = () => {
    Socket.emit(
      "startGame",
      {
        sessionCode: sessionCode,
        role: role, // Indiquer le rôle de celui qui démarre le jeu (devrait être "agent")
      },
      (res: any) => {
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
      },
    );
  };

  const handleJoin = () => {
    // Vérifier si le jeu a déjà démarré et récupérer les manuels stockés
    if (moduleManuals.length > 0) {
      const serializedModules = JSON.stringify(moduleManuals);
      router.navigate({
        pathname: "/analyst/manual",
        params: {
          sessionCode: sessionCode,
          role: "analyste",
          moduleManuals: serializedModules,
          maxTime: maxTime,
        },
      });
    } else {
      // Si le jeu n'a pas encore démarré, attendre l'événement gameStarted
      Alert.alert(
        "Partie non démarrée",
        "La partie n'a pas encore démarré. Attendez que l'agent lance la partie.",
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
                .filter((p: any) => p.role === "analyste")
                .map((operator: any, index: number) => (
                  <PlayerConnected
                    key={`operator-${operator.id || index}`}
                    role="analyste"
                  />
                ))}
            </>
          ) : (
            /* Fallback pour connectedClients (ancienne structure) */
            session?.connectedClients?.map((client: any, key: any) => (
              <PlayerConnected
                key={key}
                role={key === 0 ? "agent" : "analyste"}
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
        {role === "analyste" && (
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
