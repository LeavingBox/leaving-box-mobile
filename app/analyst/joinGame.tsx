import { useState, useEffect, useRef } from "react";
import { Image, View, Text, TextInput, StyleSheet, Alert } from "react-native";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { LinearGradient } from "expo-linear-gradient";
import NavigationButton from "@/components/NavigationButton";
import { Socket } from "@/core/api/session.api";
import { clearSession } from "@/core/service/session.service";
import { useRouter } from "expo-router";
import { ThemedView } from "@/components/ThemedView";

/**
 * Page de connexion pour les opérateurs
 *
 * Les opérateurs rejoignent une session existante créée par un agent.
 * Plusieurs opérateurs peuvent rejoindre la même session.
 */
export default function JoinGame() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const lastJoinErrorRef = useRef<{ message: string; at: number } | null>(null);
  const isJoinErrorVisibleRef = useRef(false);
  const showJoinError = (message?: string) => {
    if (isJoinErrorVisibleRef.current) return;
    const finalMessage = message ?? "Connexion refusée";
    const now = Date.now();
    const last = lastJoinErrorRef.current;
    if (last && last.message === finalMessage && now - last.at < 1000) return;
    lastJoinErrorRef.current = { message: finalMessage, at: now };
    isJoinErrorVisibleRef.current = true;
    Alert.alert(
      "Connexion refusée",
      finalMessage,
      [
        {
          text: "OK",
          onPress: () => {
            isJoinErrorVisibleRef.current = false;
          },
        },
      ],
      {
        cancelable: true,
      },
    );
  };

  useEffect(() => {
    const handleSessionClosed = async (data: any) => {
      await clearSession();
      Socket.removeAllListeners();
      Socket.disconnect();
      router.replace("/");
    };
    const handleJoinSessionRejected = (payload?: { message?: string }) => {
      showJoinError(payload?.message);
    };
    const handleSessionFull = (payload?: { message?: string }) => {
      showJoinError(payload?.message);
    };

    Socket.on("sessionClosed", handleSessionClosed);
    Socket.on("joinSessionRejected", handleJoinSessionRejected);
    Socket.on("sessionFull", handleSessionFull);

    return () => {
      Socket.off("sessionClosed", handleSessionClosed);
      Socket.off("joinSessionRejected", handleJoinSessionRejected);
      Socket.off("sessionFull", handleSessionFull);
    };
  }, []);

  const joinGame = () => {
    Socket.connect();
    Socket.emit(
      "getSession",
      { sessionCode: code },
      (response: { success: boolean; message?: string }) => {
        if (response.success) {
          Socket.off("playerJoined");
          Socket.emit(
            "joinSession",
            {
              sessionCode: code,
              player: "analyste",
              role: "analyste",
            },
            (joinResponse?: {
              success?: boolean;
              message?: string;
              alert?: { message?: string };
            }) => {
              if (joinResponse?.success !== false) return;
              const message =
                joinResponse.alert?.message ??
                joinResponse.message ??
                "Connexion refusée";
              showJoinError(message);
            },
          );
          Socket.once(
            "playerJoined",
            (data: {
              playerId?: string;
              playerLabel?: string;
              playerRole?: string;
              role?: string;
              session?: any;
            }) => {
              // Le serveur envoie "playerRole" au lieu de "role"
              const role = data.playerRole || data.role;

              // Vérifier que le rôle est présent et valide
              if (!role || role !== "analyste") {
                console.error("Erreur: Rôle invalide dans playerJoined:", role);
                Alert.alert(
                  "Erreur serveur",
                  role
                    ? `Rôle invalide reçu: "${role}". Attendu: "analyste".`
                    : "Le serveur n'a pas envoyé le rôle dans playerJoined.",
                );
                return;
              }

              router.navigate({
                pathname: "/agent/waitingRoom",
                params: {
                  sessionCode: code,
                  role: "analyste",
                  maxTime: data.session?.maxTime || "0",
                },
              });
            },
          );
        } else {
          Alert.alert("Error while joining session", response.message);
        }
      },
    );
  };

  const handleBack = () => {
    if (code) {
      Socket.emit("back", {
        sessionCode: code,
        role: "analyste", // Indiquer que c'est un analyste qui fait retour en arrière
      });
    }
    Socket.off("playerJoined");
    Socket.off("currentSession");
    Socket.emit("leaveSession", { sessionCode: code, player: "analyste" });
    Socket.disconnect();
    router.navigate("/");
  };

  const handleNext = () => {
    if (code.length > 0) {
      joinGame();
    }
  };
  return (
    <ThemedView style={styles.mainContainer}>
      <View style={styles.background}>
        <Image
          source={require("@/assets/images/Blue_grid_bg.png")}
          style={styles.backgroundImage}
        />
      </View>
      <View style={styles.container}>
        <Text style={styles.title}>Join the session</Text>

        {/* TO DO, make a real text !! */}
        {/* <Text style={styles.description}>
          Proident est dolore ullamco cupidatat non ullamco anim. Laborum ea
          aliquip magna deserunt qui. Elit mollit elit deserunt velit labore
          proident adipisicing nisi esse sunt laboris. Magna eu dolore ad. Aute
          Lorem aute tempor dolore nisi aliqua reprehenderit commodo ut laborum
          nostrud laboris pariatur. Duis amet in minim sunt amet adipisicing
          velit consectetur amet pariatur sunt ut.
        </Text> */}
        <TextInput
          style={styles.input}
          placeholder="Enter code"
          placeholderTextColor="#ffffff"
          value={code}
          onChangeText={setCode}
        />
        <View style={styles.navigationContainer}>
          <NavigationButton
            disabled={code.length < 1}
            label="Rejoindre la partie"
            color="blue"
            onPress={handleNext}
          />
          <NavigationButton label="Retour" onPress={handleBack} color="gray" />
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
  backgroundImage: { width: "100%", height: "100%" },
  background: {
    position: "absolute",
    top: "0%",
    width: "100%",
    height: "100%",
  },
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 50,
    gap: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginVertical: 10,
    marginBottom: 40,
  },
  description: {
    fontSize: 14,
    color: "white",
    textAlign: "center",
    marginBottom: 50,
    marginTop: 20,
    paddingHorizontal: 15,
  },
  inputContainer: {
    width: "80%",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignSelf: "center",
    marginVertical: 20,
  },
  input: {
    color: "#ffffff",
    fontSize: 16,
    textAlign: "center",
    borderRadius: 10,
    minWidth: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  navigationContainer: {
    display: "flex",
    marginTop: 30,
    flexDirection: "column",
    justifyContent: "center",
    gap: 20,
  },
});
