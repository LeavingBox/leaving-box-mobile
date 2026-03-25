import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Socket } from "@/core/api/session.api";
import { clearSession } from "@/core/service/session.service";
import { Session } from "@/core/interface/session.interface";
import Description from "@/components/gameplay/description";
import ManualScreen from "@/components/gameplay/ManualScreen";
import CustomButton from "@/components/CustomButton";
import NavigationButton from "@/components/NavigationButton";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import CodeGame from "@/components/CodeGame";
import SkeletonLoader from "@/components/agent-joinGame/SkeletonLoader";

const CONNECTION_ERROR_MSG =
  "Vérifiez que le serveur est démarré, EXPO_PUBLIC_WEBSOCKET_URL est défini, et que vous êtes sur le même réseau.";

const formatTime = (s: number) =>
  `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

export default function JoinGame() {
  const router = useRouter();
  const { difficulty, gameMode } = useLocalSearchParams();
  const [session, setSession] = useState<Session>();
  const [isLoading, setIsLoading] = useState(true);
  const [isManualVisible, setIsManualVisible] = useState(false);

  const payload = {
    difficulty,
    gameMode: gameMode || "ONE_OPERATOR_ONE_MODULE",
    role: "agent" as const,
  };

  const showConnectionError = (title: string, onRetry?: () => void) => {
    Alert.alert(title, CONNECTION_ERROR_MSG, [
      ...(onRetry ? [{ text: "Réessayer", onPress: onRetry }] : []),
      { text: "Retour", onPress: () => router.back(), style: "cancel" as const },
    ]);
  };

  useEffect(() => {
    if (!Socket.connected) Socket.connect();

    const timeout = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
        showConnectionError("Erreur de connexion", () => {
          setIsLoading(true);
          Socket.connect();
          Socket.emit("createSession", payload);
        });
      }
    }, 10000);

    const onConnect = () => Socket.emit("createSession", payload);
    const onConnectError = (err: Error) => {
      setIsLoading(false);
      clearTimeout(timeout);
      showConnectionError(`Impossible de se connecter: ${err.message}`, () => {
        setIsLoading(true);
        Socket.connect();
      });
    };
    const onSessionClosed = async () => {
      clearTimeout(timeout);
      await clearSession();
      Socket.removeAllListeners();
      Socket.disconnect();
      router.replace("/");
    };

    Socket.connected ? onConnect() : Socket.once("connect", onConnect);
    Socket.on("connect_error", onConnectError);
    Socket.on("sessionCreated", (s: Session) => {
      clearTimeout(timeout);
      setSession(s);
      setIsLoading(false);
    });
    Socket.on("sessionClosed", onSessionClosed);

    return () => {
      clearTimeout(timeout);
      Socket.off("connect", onConnect);
      Socket.off("connect_error", onConnectError);
      Socket.off("sessionCreated");
      Socket.off("sessionClosed", onSessionClosed);
    };
  }, [difficulty, gameMode]);

  const handleBack = () => {
    Socket.emit("clearSession", { sessionCode: session?.code, role: "agent" }, (res: { success: boolean }) => {
      if (res.success) {
        Socket.removeAllListeners();
        Socket.disconnect();
        router.replace("/agent/dificulty");
      } else Alert.alert("Erreur", "Impossible de fermer la session.");
    });
  };

  const handleNext = () => {
    if (session) {
      router.navigate({
        pathname: "/agent/waitingRoom",
        params: { sessionCode: session.code, maxTime: String(session.maxTime), role: "agent" },
      });
    }
  };

  const timeStr = formatTime(session?.maxTime ?? 0);
  const [m1, m2, s1, s2] = timeStr.replace(":", "").split("");

  if (isLoading) {
    return (
      <ParallaxScrollView>
        <View style={styles.container}>
          <SkeletonLoader style={skeletonStyles.text} />
          <View style={skeletonStyles.textContainer}>
            <SkeletonLoader style={skeletonStyles.title} />
            <SkeletonLoader style={skeletonStyles.description} />
          </View>
          <View style={styles.codeContainer}>
            {[1, 2, 3, 4].map((i) => (
              <SkeletonLoader key={i} style={skeletonStyles.codeInput} />
            ))}
          </View>
        </View>
      </ParallaxScrollView>
    );
  }

  return (
    <ParallaxScrollView>
      <View style={styles.container}>
        <CodeGame code={session?.code} />
        <Description />
        <CustomButton onPress={() => setIsManualVisible(true)} buttonText="Ouvrir le manuel" />
        <ManualScreen isVisible={isManualVisible} onClose={() => setIsManualVisible(false)} />

        <View style={styles.codeContainer}>
          <TextInput style={styles.codeInput} value={m1} maxLength={1} editable={false} />
          <TextInput style={styles.codeInput} value={m2} maxLength={1} editable={false} />
          <Text style={styles.separator}>:</Text>
          <TextInput style={styles.codeInput} value={s1} maxLength={1} editable={false} />
          <TextInput style={styles.codeInput} value={s2} maxLength={1} editable={false} />
        </View>

        <View style={styles.navigationContainer}>
          <NavigationButton onPress={handleBack} color="red" label="Retour" />
          <NavigationButton onPress={handleNext} color="red" label="Voir la salle d'attente" />
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
  separator: { fontSize: 20, color: "white" },
  navigationContainer: {
    marginTop: 30,
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
  },
});

const skeletonStyles = StyleSheet.create({
  text: { width: 170, height: 80, borderRadius: 10 },
  textContainer: { marginVertical: 20 },
  title: { alignSelf: "center", width: 100, height: 40, marginVertical: 10 },
  description: { width: 350, height: "30%", marginBottom: 20, paddingHorizontal: 15 },
  codeInput: { width: 40, height: 40, marginHorizontal: 5, borderRadius: 5 },
});
