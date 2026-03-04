import { useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet, Alert } from "react-native";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { LinearGradient } from "expo-linear-gradient";
import NavigationButton from "@/components/NavigationButton";
import { Socket } from "@/core/api/session.api";
import { clearSession } from "@/core/service/session.service";
import { useRouter } from "expo-router";

/**
 * Page de connexion pour les opérateurs
 *
 * Les opérateurs rejoignent une session existante créée par un agent.
 * Plusieurs opérateurs peuvent rejoindre la même session.
 */
export default function JoinGame() {
  const router = useRouter();
  const [code, setCode] = useState("");

  useEffect(() => {
    const handleSessionClosed = async (data: any) => {
      await clearSession();
      Socket.removeAllListeners();
      Socket.disconnect();
      router.replace("/");
    };

    Socket.on("sessionClosed", handleSessionClosed);

    return () => {
      Socket.off("sessionClosed", handleSessionClosed);
    };
  }, []);

  const joinGame = () => {
    Socket.connect();
    Socket.emit(
      "getSession",
      { sessionCode: code },
      (response: { success: boolean; message?: string }) => {
        if (response.success) {
          // Rejoindre la session en tant qu'opérateur
          Socket.emit("joinSession", {
            sessionCode: code,
            player: "Operator",
            role: "operator", // Indiquer explicitement que c'est un opérateur
          });
          Socket.on(
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
              if (!role || role !== "operator") {
                console.error("Erreur: Rôle invalide dans playerJoined:", role);
                Alert.alert(
                  "Erreur serveur",
                  role
                    ? `Rôle invalide reçu: "${role}". Attendu: "operator".`
                    : "Le serveur n'a pas envoyé le rôle dans playerJoined.",
                );
                return;
              }

              Socket.off("playerJoined");
              router.navigate({
                pathname: "/agent/waitingRoom",
                params: {
                  sessionCode: code,
                  role: "operator",
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
        role: "operator", // Indiquer que c'est un opérateur qui fait retour en arrière
      });
    }
    Socket.off("playerJoined");
    Socket.off("currentSession");
    Socket.emit("leaveSession", { sessionCode: code, player: "Operator" });
    Socket.disconnect();
    router.navigate("/");
  };

  const handleNext = () => {
    if (code.length > 0) {
      joinGame();
    }
  };
  return (
    <ParallaxScrollView>
      <View style={styles.container}>
        <Text style={styles.title}>Why do we use it?</Text>

        <LinearGradient
          colors={["#66a6ff", "#89f7fe"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.inputContainer}
        >
          <TextInput
            style={styles.input}
            placeholder="Enter code"
            placeholderTextColor="#000000"
            value={code}
            onChangeText={setCode}
          />
        </LinearGradient>

        <Text style={styles.description}>
          Proident est dolore ullamco cupidatat non ullamco anim. Laborum ea
          aliquip magna deserunt qui. Elit mollit elit deserunt velit labore
          proident adipisicing nisi esse sunt laboris. Magna eu dolore ad. Aute
          Lorem aute tempor dolore nisi aliqua reprehenderit commodo ut laborum
          nostrud laboris pariatur. Duis amet in minim sunt amet adipisicing
          velit consectetur amet pariatur sunt ut.
        </Text>
        <View style={styles.navigationContainer}>
          <NavigationButton
            label="Retour"
            onPress={handleBack}
            color="blue"
            textColor="black"
          />
          {code.length > 0 && (
            <NavigationButton
              label="Rejoindre la partie"
              color="blue"
              onPress={handleNext}
            />
          )}
        </View>
      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    marginVertical: 50,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginVertical: 10,
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
    color: "#000000",
    fontSize: 16,
    textAlign: "center",
    borderRadius: 10,
  },
  navigationContainer: {
    marginTop: 30,
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    padding: 20,
  },
});
