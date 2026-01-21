import ManualsNav from "@/components/manual/ManualsNav";
import ModuleInstructions from "@/components/manual/ModuleInstructions";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { Socket } from "@/core/api/session.api";
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
  const Manuals: ModuleManual[] = JSON.parse(moduleManuals as string);

  useEffect(() => {
    const handleSessionCleared = (res: any) => {
      Alert.alert(
        "Fermeture de la session",
        "L'agent hôte de la session a quitté la salle d'attente. La session va être fermée.",
      );
      handleDisconnected();
    };

    Socket.on("sessionCleared", handleSessionCleared);
    Socket.on("gameOver", (data: any) => {
      Alert.alert("Fin de la partie", data.message, [
        { text: "MENU", onPress: () => handleDisconnected() },
      ]);
    });

    return () => {
      Socket.off("sessionCleared", handleSessionCleared);
      Socket.on("gameOver", (data: any) => {
        Alert.alert("Fin de la partie", data.message, [
          { text: "MENU", onPress: () => handleDisconnected() },
        ]);
      });
    };
  }, []);

  const handleDisconnected = () => {
    Socket.disconnect();
    router.navigate({
      pathname: "/operator/joinGame",
    });
  };

  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", () => {
      myFunction();
    });

    return unsubscribe;
  }, [navigation]);

  const myFunction = () => {
    console.log("Screen is being exited");
  };

  return (
    <ParallaxScrollView>
      <View style={styles.mainContainer}>
        <View style={styles.navContainer}>
          <ScrollView>
            {Manuals.map((manual, index) => (
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
            ))}
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
            {selectedManual ? (
              <ModuleInstructions manual={selectedManual} />
            ) : (
              <Text style={styles.title}>
                Bomb Defusal Manual, for an Operator
              </Text>
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
});
