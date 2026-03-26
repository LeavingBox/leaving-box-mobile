import ParallaxScrollView from "@/components/ParallaxScrollView";
import { Link, useRouter } from "expo-router";
import {
  Image,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
} from "react-native";
import { useState, useRef } from "react";
import NavigationButton from "@/components/NavigationButton";
import { Socket } from "@/core/api/session.api";
import { ThemedView } from "@/components/ThemedView";

export default function DifficultyScreen() {
  const router = useRouter();
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");
  const [selectedGameMode, setSelectedGameMode] = useState<string>(
    "ONE_OPERATOR_ONE_MODULE",
  );
  const windowWidth = Dimensions.get("window").width;
  const animatedWidth = useRef(new Animated.Value(windowWidth * 0.3)).current;
  const animatedPosition = useRef(new Animated.Value(0)).current;

  const difficultyDetails: Record<string, string> = {
    Easy: "Un mode relaxant, parfait pour les débutants.",
    Medium: "Un bon challenge avec quelques difficultés.",
    Hard: "Un mode extrême, réservé aux experts !",
  };

  const gameModeDetails: Record<string, string> = {
    ONE_OPERATOR_ONE_MODULE:
      "Chaque opérateur reçoit des modules complets avec toutes leurs solutions.",
    RANDOM_ONE_MODULE_SPLIT:
      "Tous les opérateurs voient tous les modules, solutions réparties en round-robin.",
  };

  const handleDifficultySelect = (difficulty: string) => {
    if (selectedDifficulty === difficulty) {
      // Si on clique sur le même bouton, on réinitialise
      Animated.parallel([
        Animated.timing(animatedWidth, {
          toValue: windowWidth * 0.3,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(animatedPosition, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
      setSelectedDifficulty("");
    } else {
      // Sinon, on sélectionne le nouveau bouton
      setSelectedDifficulty(difficulty);
      Animated.parallel([
        Animated.timing(animatedWidth, {
          toValue: windowWidth * 0.9,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(animatedPosition, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    }
  };

  const handleBack = () => {
    router.navigate("/");
  };

  const handleNext = () => {
    if (selectedDifficulty) {
      // Vérifier que l'URL WebSocket est définie avant de connecter
      const websocketUrl = process.env.EXPO_PUBLIC_WEBSOCKET_URL;
      if (!websocketUrl) {
        Alert.alert(
          "Configuration manquante",
          "EXPO_PUBLIC_WEBSOCKET_URL n'est pas défini. Veuillez créer un fichier .env avec cette variable.",
          [{ text: "OK" }],
        );
        return;
      }

      // Connecter le socket avant de naviguer
      try {
        Socket.connect();
        router.navigate({
          pathname: "/agent/joinGame",
          params: {
            difficulty: selectedDifficulty,
            gameMode: selectedGameMode,
          },
        });
      } catch (error) {
        console.error("Erreur lors de la connexion:", error);
        Alert.alert(
          "Erreur de connexion",
          "Impossible de se connecter au serveur. Vérifiez que le serveur est démarré et que l'URL est correcte.",
          [{ text: "OK" }],
        );
      }
    }
  };

  return (
    <ThemedView style={styles.mainContainer}>
      <View style={styles.background}>
        <Image
          source={require("@/assets/images/Red_grid_bg.png")}
          style={styles.backgroundImage}
        />
      </View>
      <View>
        <View style={styles.difficultyContainer}>
          <TouchableOpacity
            onPress={() => handleDifficultySelect("Easy")}
            style={styles.buttonContent}
          >
            <Image
              source={require("@/assets/images/Bombe_Facile.png")}
              style={styles.buttonImage}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleDifficultySelect("Medium")}
            style={styles.buttonContent}
          >
            <Image
              source={require("@/assets/images/Bombe_Moyen.png")}
              style={styles.buttonImage}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleDifficultySelect("Hard")}
            style={styles.buttonContent}
          >
            <Image
              source={require("@/assets/images/Bombe_Difficile.png")}
              style={styles.buttonImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        {selectedDifficulty && (
          <View style={styles.detailsContainer}>
            <Text style={styles.detailsText}>
              {difficultyDetails[selectedDifficulty]}
            </Text>
          </View>
        )}

        {selectedDifficulty && (
          <View style={styles.gameModeContainer}>
            <Text style={styles.gameModeTitle}>Mode de jeu</Text>
            <View style={styles.gameModeButtons}>
              <TouchableOpacity
                style={[
                  styles.gameModeButton,
                  selectedGameMode === "ONE_OPERATOR_ONE_MODULE" &&
                    styles.gameModeButtonSelected,
                ]}
                onPress={() => setSelectedGameMode("ONE_OPERATOR_ONE_MODULE")}
              >
                <Text
                  style={[
                    styles.gameModeText,
                    selectedGameMode === "ONE_OPERATOR_ONE_MODULE" &&
                      styles.gameModeTextSelected,
                  ]}
                >
                  Standard
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.gameModeButton,
                  selectedGameMode === "RANDOM_ONE_MODULE_SPLIT" &&
                    styles.gameModeButtonSelected,
                ]}
                onPress={() => setSelectedGameMode("RANDOM_ONE_MODULE_SPLIT")}
              >
                <Text
                  style={[
                    styles.gameModeText,
                    selectedGameMode === "RANDOM_ONE_MODULE_SPLIT" &&
                      styles.gameModeTextSelected,
                  ]}
                >
                  Split
                </Text>
              </TouchableOpacity>
            </View>
            {selectedGameMode && (
              <View style={styles.gameModeDetailsContainer}>
                <Text style={styles.gameModeDetailsText}>
                  {gameModeDetails[selectedGameMode]}
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.navigationContainer}>
          <NavigationButton onPress={handleBack} label="Retour" color="red" />
          {selectedDifficulty && (
            <NavigationButton
              href="/agent/joinGame"
              label="Suivant"
              color="red"
              onPress={handleNext}
            />
          )}
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    marginTop: "0%",
    marginBottom: "0%",
    flex: 1,
    height: "100%",
    width: "100%",
    flexDirection: "column",
    backgroundColor: "white",
    alignContent: "center",
    justifyContent: "center",
  },
  logoContainer: {
    marginTop: 100,
    alignItems: "center",
    marginBottom: 50,
  },
  background: {
    position: "absolute",
    top: "0%",
    width: "100%",
    height: "100%",
  },
  backgroundImage: { width: "100%", height: "100%" },
  image: {
    alignSelf: "center",
    width: 200,
    height: 60,
    resizeMode: "contain",
  },

  difficultyContainer: {
    flexDirection: "row",
    width: "100%",
    alignSelf: "center",
    justifyContent: "space-around",
    alignItems: "center",
    maxHeight: "40%",
  },

  buttonContent: {
    width: "30%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonImage: { width: "100%", zIndex: 4 },

  easyButton: {
    backgroundColor: "#4CAF50",
    zIndex: 2,
  },

  mediumButton: {
    backgroundColor: "#FF9800",
    zIndex: 3,
    marginHorizontal: -10,
  },

  hardButton: {
    backgroundColor: "#F44336",
    zIndex: 1,
  },

  difficultyText: {
    color: "black",
    fontSize: 18,
    fontWeight: "bold",
    transform: [{ skewX: "10deg" }],
  },

  detailsContainer: {
    marginTop: 30,
    padding: 20,
    alignItems: "center",
  },

  detailsTitle: {
    color: "tomato",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },

  detailsText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
  },

  navigationContainer: {
    marginTop: 30,
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    padding: 20,
  },

  navigationButton: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 4,
    width: 130,
  },

  navigationText: {
    color: "#1E1E1E",
    fontWeight: "bold",
    textAlign: "center",
  },

  gameModeContainer: {
    marginTop: 30,
    padding: 20,
    alignItems: "center",
  },

  gameModeTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },

  gameModeButtons: {
    flexDirection: "row",
    gap: 15,
    width: "100%",
    justifyContent: "center",
  },

  gameModeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#666",
    backgroundColor: "transparent",
    minWidth: 120,
    alignItems: "center",
  },

  gameModeButtonSelected: {
    borderColor: "#4CAF50",
    backgroundColor: "#4CAF50",
  },

  gameModeText: {
    color: "#999",
    fontSize: 16,
    fontWeight: "600",
  },

  gameModeTextSelected: {
    color: "white",
  },

  gameModeDetailsContainer: {
    marginTop: 15,
    paddingHorizontal: 20,
  },

  gameModeDetailsText: {
    color: "#ccc",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
