import ManualsNav from "@/components/manual/ManualsNav";
import ModuleInstructions from "@/components/manual/ModuleInstructions";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { Socket } from "@/core/api/session.api";
import { clearSession } from "@/core/service/session.service";
import { ModuleManual } from "@/core/interface/module.interface";
import {
  Stack,
  useLocalSearchParams,
  useNavigation,
  useRouter,
} from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { ThemedView } from "@/components/ThemedView";

const { width } = Dimensions.get("window");

export default function Manual() {
  const router = useRouter();

  const { sessionCode, maxTime, role, moduleManuals } = useLocalSearchParams();
  const [selectedManual, setSelectedManual] = useState<ModuleManual | null>(
    null,
  );
  const [unlockedHints, setUnlockedHints] = useState<Record<string, string[]>>(
    {},
  );
  // Parser les manuels seulement s'ils existent et sont valides
  let Manuals: ModuleManual[] = [];
  try {
    if (
      moduleManuals &&
      typeof moduleManuals === "string" &&
      moduleManuals !== "undefined"
    ) {
      Manuals = JSON.parse(moduleManuals as string);
    }
  } catch (error) {
    console.error("Erreur lors du parsing des manuels:", error);
    Manuals = [];
  }

  useEffect(() => {
    const handleSessionCleared = async (res: any) => {
      // La session se ferme automatiquement si les conditions de validation ne sont plus remplies
      const message =
        res?.message ||
        "L'agent hôte de la session a quitté. La session va être fermée.";

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

    const handleGameOver = async (data: {
      message: string;
      gameResult?: "Win" | "Lose";
    }) => {
      const isWin = data.gameResult === "Win";
      const title = isWin ? "Victoire" : "Défaite";
      const message = data.gameResult ? `${data.message}\n${title}` : data.message;

      Alert.alert(title, message, [
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

    const handleSessionClosed = async () => {
      await clearSession();
      Socket.removeAllListeners();
      Socket.disconnect();
      router.replace("/");
    };

    const handleExtraHintAlert = (data: {
      moduleId: string;
      moduleNumber: number;
      message?: string;
    }) => {
      const targetManual = Manuals.find(
        (m) => String(m._id ?? m.moduleId) === String(data.moduleId),
      );

      setUnlockedHints((prev) => {
        const current = prev[data.moduleId] ?? [];
        const hintIndex = current.length;
        const hintText =
          targetManual?.hints?.[hintIndex] ??
          data.message ??
          `Indice #${hintIndex + 1} pour le module ${data.moduleNumber}.`;

        Alert.alert("💡 Nouvel indice débloqué", hintText, [
          targetManual
            ? {
                text: "Voir le module",
                onPress: () => setSelectedManual(targetManual),
              }
            : { text: "OK" },
        ]);

        return {
          ...prev,
          [data.moduleId]: [...current, hintText],
        };
      });
    };

    Socket.on("sessionCleared", handleSessionCleared);
    Socket.on("gameOver", handleGameOver);
    Socket.on("sessionClosed", handleSessionClosed);
    Socket.on("extraHintAlert", handleExtraHintAlert);

    return () => {
      Socket.off("sessionCleared", handleSessionCleared);
      Socket.off("gameOver", handleGameOver);
      Socket.off("sessionClosed", handleSessionClosed);
      Socket.off("extraHintAlert", handleExtraHintAlert);
    };
  }, []);

  const handleDisconnected = async () => {
    await clearSession();
    Socket.removeAllListeners();
    Socket.disconnect();
    router.replace("/");
  };
  const handleBack = () => {
    if (sessionCode) {
      Socket.emit("back", {
        sessionCode: sessionCode as string,
        role: role, // Indiquer que c'est un analyste qui fait retour en arrière
      });
    }
    // Retourner à la salle d'attente pour pouvoir rejoindre à nouveau
    // Ne pas fermer la session, juste quitter le manuel
    router.navigate({
      pathname: "/agent/waitingRoom",
      params: {
        sessionCode: sessionCode,
        role: "analyste",
        maxTime: maxTime,
      },
    });
  };

  // Ne pas appeler handleBack automatiquement au démontage
  // L'utilisateur doit explicitement cliquer sur retour pour rejoindre

  return (
    <ThemedView style={styles.container}>
      <View style={styles.background}>
        <Image
          source={require("@/assets/images/Blue_grid_bg.png")}
          style={styles.backgroundImage}
        />
      </View>
      <View style={styles.mainContainer}>
        <View style={styles.navContainer}>
          {Manuals.length > 0 ? (
            <ManualsNav
              data={Manuals}
              selectedManual={selectedManual}
              setSelectedManual={(manual: ModuleManual) => {
                setSelectedManual(manual);
              }}
            />
          ) : (
            <></>
          )}
        </View>
        <View
          style={[
            styles.contentContainer,
            selectedManual && styles.selectedcontent,
          ]}
        >
          {Manuals.length > 0 ? (
            selectedManual ? (
              <ModuleInstructions
                manual={selectedManual}
                unlockedHints={
                  unlockedHints[
                    String(selectedManual._id ?? selectedManual.moduleId ?? "")
                  ] ?? []
                }
              />
            ) : (
              <Text style={styles.title}>
                Bomb Defusal Manual, for an Analyst
              </Text>
            )
          ) : (
            <View style={styles.errorContainer}>
              <Text style={styles.title}>Manuel non disponible</Text>
              <Text style={styles.errorText}>
                Les manuels n'ont pas pu être chargés. Retournez à la salle
                d'attente pour les récupérer.
              </Text>
            </View>
          )}
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxHeight: "100%",
    height: "100%",
  },
  navbar: {
    height: "100%",
    display: "flex",
  },
  navbarButton: {
    height: "100%",
    display: "flex",
  },
  backgroundImage: { width: "100%", height: "100%" },
  background: {
    position: "absolute",
    top: "0%",
    width: "100%",
    height: "100%",
  },
  mainContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "flex-start",
    flex: 1,
    marginVertical: 60,
    height: "100%",
  },
  navContainer: {
    flexDirection: "column",
    zIndex: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 20,
    marginVertical: 100,
  },
  verticalText: {
    transform: [{ rotate: "-90deg" }],
    fontSize: 24,
    position: "absolute",
  },
  folderBackground: {
    position: "absolute",
    left: 0,
    top: 0,
    width: width,
    minHeight: 650,
    height: "100%",
    justifyContent: "flex-start",
  },
  contentContainer: {
    width: width * 0.91,
    backgroundColor: "white",
    height: "100%",
    padding: 15,
  },
  selectedcontent: {
    backgroundColor: "rgba(29, 40, 242, 1)",
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 20,
  },
});
