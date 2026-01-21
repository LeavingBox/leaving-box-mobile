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

const { width } = Dimensions.get("window");

export default function Manual() {
  const router = useRouter();

  const { sessionCode, maxTime, role, moduleManuals } = useLocalSearchParams();
  const [selectedManual, setSelectedManual] = useState<ModuleManual | null>(
    null,
  );
  
  // Parser les manuels seulement s'ils existent et sont valides
  let Manuals: ModuleManual[] = [];
  try {
    if (moduleManuals && typeof moduleManuals === "string" && moduleManuals !== "undefined") {
      Manuals = JSON.parse(moduleManuals as string);
    }
  } catch (error) {
    console.error("Erreur lors du parsing des manuels:", error);
    Manuals = [];
  }

  useEffect(() => {
    const handleSessionCleared = async (res: any) => {
      // La session se ferme automatiquement si les conditions de validation ne sont plus remplies
      const message = res?.message || 
        "L'agent hôte de la session a quitté. La session va être fermée.";
      
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

    const handleGameOver = async (data: any) => {
      Alert.alert("Fin de la partie", data.message, [
        { 
          text: "MENU", 
          onPress: async () => {
            await clearSession();
            Socket.removeAllListeners();
            Socket.disconnect();
            router.replace("/");
          }
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

    Socket.on("sessionCleared", handleSessionCleared);
    Socket.on("gameOver", handleGameOver);
    Socket.on("sessionClosed", handleSessionClosed);

    return () => {
      Socket.off("sessionCleared", handleSessionCleared);
      Socket.off("gameOver", handleGameOver);
      Socket.off("sessionClosed", handleSessionClosed);
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
        role: role // Indiquer que c'est un opérateur qui fait retour en arrière
      });
    }
    // Retourner à la salle d'attente pour pouvoir rejoindre à nouveau
    // Ne pas fermer la session, juste quitter le manuel
    router.navigate({
      pathname: "/agent/waitingRoom",
      params: { 
        sessionCode: sessionCode,
        role: "operator",
        maxTime: maxTime
      },
    });
  };

  // Ne pas appeler handleBack automatiquement au démontage
  // L'utilisateur doit explicitement cliquer sur retour pour rejoindre

  return (
    <ParallaxScrollView>
      <View style={styles.mainContainer}>
        <View style={styles.navContainer}>
          <ScrollView>
            {Manuals.length > 0 ? (
              Manuals.map((manual, index) => (
                <ManualsNav
                  key={index}
                  index={index}
                  manual={manual}
                  selectedManual={selectedManual}
                  length={Manuals.length}
                  setSelectedManual={(manual: ModuleManual) => {
                    setSelectedManual(manual);
                  }}
                />
              ))
            ) : (
              <Text style={styles.errorText}>Aucun manuel disponible</Text>
            )}
          </ScrollView>
        </View>

        <ImageBackground
          source={require("../../assets/images/folder_background.png")}
          style={styles.folderBackground}
          resizeMode="repeat"
        >
          <Image
            source={require("../../assets/images/paperclip.png")}
            style={styles.paperclip}
          />

          <View style={styles.contentContainer}>
            {Manuals.length > 0 ? (
              selectedManual ? (
                <ModuleInstructions manual={selectedManual} />
              ) : (
                <Text style={styles.title}>
                  Bomb Defusal Manual, for an Operator
                </Text>
              )
            ) : (
              <View style={styles.errorContainer}>
                <Text style={styles.title}>
                  Manuel non disponible
                </Text>
                <Text style={styles.errorText}>
                  Les manuels n'ont pas pu être chargés. Retournez à la salle d'attente pour les récupérer.
                </Text>
              </View>
            )}
          </View>
        </ImageBackground>
      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "flex-start",
    flex: 1,
    marginVertical: 60,
  },
  navContainer: {
    flexDirection: "column",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 20,
    marginVertical: 100,
  },
  folderBackground: {
    zIndex: 10,
    width: width * 0.91,
    minHeight: 650,
    paddingVertical: 20,
    paddingHorizontal: 10,
    justifyContent: "flex-start",
    boxShadow: "1px 5px 3px 5px rgba(0, 0, 0, 0.50)",
  },
  paperclip: {
    position: "absolute",
    zIndex: 1,
    top: -20,
    right: 10,
    width: 100,
    height: 100,
    transform: [{ rotate: "12deg" }],
    resizeMode: "contain",
  },
  contentContainer: {
    backgroundColor: "white",
    padding: 15,
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
