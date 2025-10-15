import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Button,
  Alert,
} from "react-native";
import NavigationButton from "@/components/NavigationButton";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import CodeGame from "@/components/CodeGame";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Socket } from "@/core/api/session.api";
import { Session } from "@/core/interface/sesssion.interface";
import Description from "@/components/gameplay/description";
import ManualScreen from "@/components/gameplay/ManualScreen";
import CustomButton from "@/components/CustomButton";
import { LinearGradient } from "expo-linear-gradient";
import SkeletonLoader from "@/components/agent-joinGame/SkeletonLoader";

export default function JoinGame() {
  const router = useRouter();
  const { difficulty } = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session>();
  const [minutes, setMinutes] = useState("0");
  const [seconds, setSeconds] = useState("0");
  const [isManualVisible, setIsManualVisible] = useState(false);

  useEffect(() => {
    Socket.emit("createSession", { difficulty: difficulty });
    Socket.on("sessionCreated", (session) => {
      setSession(session);
      handleTime(session.maxTime);
      console.log("sessionCreated", session);
      setIsLoading(false);
    });

    return () => {
      Socket.off("sessionCreated");
    };
  }, []);

  function formatTime(totalSeconds: number) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  const handleTime = (time: number) => {
    const formatted = formatTime(time);
    const [minutes, seconds] = formatted.split(":");
    setMinutes(minutes);
    setSeconds(seconds);
  };

  const handleBack = () => {
    Socket.emit(
      "clearSession",     
      { sessionCode: session?.code },
      (res: { success: boolean }) => { 
        if (!res.success) {
          Alert.alert(
            "Erreur",
            "Une erreur s'est produite lors de la fermeture de la session."
          );
          return;
        }
        Socket.removeAllListeners();
        Socket.disconnect();
        router.replace("/agent/dificulty");
      }
    );
  };

  const handleNext = () => {
    router.navigate({
      pathname: "/agent/waitingRoom",
      params: {
        sessionCode: session?.code,
        maxTime: session?.maxTime,
        role: "agent",
      },
    });
  };

  if (isLoading) {
    return (
      <ParallaxScrollView>
        <View
          style={styles.container}
          // onPointerEnter={() => setIsLoading(false)}
          // onPointerLeave={() => setIsLoading(true)}
        >
          <SkeletonLoader style={skeletonStyles.text} />
          <View style={skeletonStyles.textContainer}>
            <SkeletonLoader style={skeletonStyles.title} />
            <SkeletonLoader style={skeletonStyles.description} />
          </View>
          <View style={styles.codeContainer}>
            <SkeletonLoader style={skeletonStyles.codeInput} />
            <SkeletonLoader style={skeletonStyles.codeInput} />
            <SkeletonLoader style={skeletonStyles.codeInput} />
            <SkeletonLoader style={skeletonStyles.codeInput} />
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

        <TouchableOpacity style={{ marginBottom: 20 }}>
            <CustomButton onPress={() => setIsManualVisible(true)}
             buttonText="Ouvrir le manuel" />
        </TouchableOpacity>

          <ManualScreen 
            isVisible={isManualVisible} 
            onClose={() => setIsManualVisible(false)} 
          />

        <View style={styles.codeContainer}>
          <TextInput
            style={styles.codeInput}
            value={minutes.toString().charAt(0)}
            maxLength={1}
            editable={false}
          />
          <TextInput
            style={styles.codeInput}
            value={minutes.toString().charAt(1)}
            maxLength={1}
            editable={false}
          />
          <Text style={styles.separator}>:</Text>
          <TextInput
            style={styles.codeInput}
            value={seconds.toString().charAt(0)}
            maxLength={1}
            editable={false}
          />
          <TextInput
            style={styles.codeInput}
            value={seconds.toString().charAt(1)}
            maxLength={1}
            editable={false}
          />
        </View>

        <View style={styles.navigationContainer}>
          <NavigationButton onPress={handleBack} color="red" label="Retour" />
          <NavigationButton
            onPress={handleNext}
            color="red"
            label="Voir la salle d'attente"
          />
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
  codeButton: {
    backgroundColor: "red",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 5,
    marginVertical: 20,
    elevation: 5, // Effet d'ombre
  },
  codeText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
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
    marginBottom: 20,
    paddingHorizontal: 15,
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
  separator: {
    fontSize: 20,
    color: "white",
  },

  navigationContainer: {
    marginTop: 30,
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
  },
});

const skeletonStyles = StyleSheet.create({
  text: {
    width: 170,
    height: 80,
    borderRadius: 10,
  },
  textContainer: {
    marginVertical: 20,
  },
  title: {
    alignSelf: "center",
    width: 100,
    height: 40,
    marginVertical: 10,
  },
  description: {
    width: 350,
    height: "30%",
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  codeInput: {
    width: 40,
    height: 40,
    marginHorizontal: 5,
    borderRadius: 5,
  },
});
