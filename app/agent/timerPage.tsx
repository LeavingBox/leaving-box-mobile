import NavigationButton from "@/components/NavigationButton";
import { ThemedView } from "@/components/ThemedView";
import { Socket } from "@/core/api/session.api";
import { clearSession } from "@/core/service/session.service";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type TimerParams = {
  sessionCode: string;
  maxTime: string;
  role: string;
};

type ExtraHintGrantedPayload = {
  sessionCode: string;
  moduleId: string;
  moduleNumber: number;
  moduleName: string;
  hintIndex: number;
  hintText: string;
  hintNumber: number;
  maxHintsForDifficulty: number;
  timeCostSeconds: number;
  remainingTime: number;
  difficulty: string;
  extraHintsUsed: number;
  requestedBy: string;
  timestamp: string;
};

type ExtraHintModule = {
  moduleId: string;
  moduleNumber: number;
  moduleName: string;
};

type ExtraHintContextPayload = {
  sessionCode: string;
  difficulty: string;
  extraHintsUsed: number;
  maxHintsForDifficulty: number;
  nextHintNumber: number;
  nextHintCostSeconds: number;
  availableModules: ExtraHintModule[];
};

type RequestExtraHintResponse = {
  success: boolean;
  message?: string;
};

export default function TimerPage() {
  const router = useRouter();
  const { sessionCode, maxTime, role } = useLocalSearchParams<TimerParams>();
  const [minutes, setMinutes] = useState("0");
  const [seconds, setSeconds] = useState("0");
  const [remainingSeconds, setRemainingSeconds] = useState(
    Number(maxTime) || 0,
  );
  const [hasTimerStarted, setHasTimerStarted] = useState(false);
  const [isExtraHintModalVisible, setIsExtraHintModalVisible] = useState(false);
  const [isExtraHintContextLoading, setIsExtraHintContextLoading] =
    useState(false);
  const [extraHintContext, setExtraHintContext] =
    useState<ExtraHintContextPayload | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  const formatTime = (totalSeconds: number) =>
    `${Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0")}:${(totalSeconds % 60).toString().padStart(2, "0")}`;

  const handleTime = (time: number) => {
    const formatted = formatTime(time);
    const [minutes, seconds] = formatted.split(":");
    setMinutes(minutes);
    setSeconds(seconds);
    setRemainingSeconds(time);
  };

  const loadExtraHintContext = () => {
    if (!sessionCode || role !== "agent") return;
    setIsExtraHintContextLoading(true);
    setExtraHintContext(null);
    setSelectedModuleId(null);
    Socket.emit("getExtraHintContext", { sessionCode });
  };

  const handleOpenExtraHintModal = () => {
    setIsExtraHintModalVisible(true);
    loadExtraHintContext();
  };

  const handleCloseExtraHintModal = () => {
    setIsExtraHintModalVisible(false);
  };

  const hasReachedLimit =
    extraHintContext != null &&
    extraHintContext.extraHintsUsed >= extraHintContext.maxHintsForDifficulty;
  const isExtraHintDisabled =
    role !== "agent" ||
    !hasTimerStarted ||
    remainingSeconds <= 0 ||
    hasReachedLimit;

  useEffect(() => {
    handleTime(Number(maxTime) || 0);

    const timerTimeout = setTimeout(() => {
      Socket.emit("startTimer", { sessionCode, role });
    }, 1000);

    const handleTimerUpdate = (data: { remaining: number }) => {
      handleTime(data.remaining);
      setHasTimerStarted(true);
    };

    const handleGameOver = (data: { message: string }) => {
      Alert.alert("Fin de la partie", data.message, [
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

    const handleExtraHintGranted = (data: ExtraHintGrantedPayload) => {
      handleTime(data.remainingTime);
      Alert.alert(
        "Indice débloqué",
        `Indice module ${data.moduleNumber} débloqué (-${data.timeCostSeconds}s)`,
      );
      loadExtraHintContext();
    };

    const handleExtraHintContext = (data: ExtraHintContextPayload) => {
      setExtraHintContext(data);
      if (data.availableModules.length > 0)
        setSelectedModuleId(
          (prev) => prev ?? data.availableModules[0].moduleId,
        );
      setIsExtraHintContextLoading(false);
    };

    const handleSessionCleared = (res: { message?: string }) => {
      const message =
        res?.message || "La session a été fermée. Le timer s'arrête.";
      Alert.alert("Session fermée", message, [
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

    const handleSessionClosed = async () => {
      await clearSession();
      Socket.removeAllListeners();
      Socket.disconnect();
      router.replace("/");
    };

    Socket.on("timerUpdate", handleTimerUpdate);
    Socket.on("gameOver", handleGameOver);
    Socket.on("extraHintGranted", handleExtraHintGranted);
    Socket.on("extraHintContext", handleExtraHintContext);
    Socket.on("sessionCleared", handleSessionCleared);
    Socket.on("sessionClosed", handleSessionClosed);

    return () => {
      clearTimeout(timerTimeout);
      Socket.off("timerUpdate", handleTimerUpdate);
      Socket.off("gameOver", handleGameOver);
      Socket.off("extraHintGranted", handleExtraHintGranted);
      Socket.off("extraHintContext", handleExtraHintContext);
      Socket.off("sessionCleared", handleSessionCleared);
      Socket.off("sessionClosed", handleSessionClosed);
    };
  }, [sessionCode, role]);

  const handleRequestExtraHint = () => {
    if (!selectedModuleId || !sessionCode || isExtraHintDisabled) return;
    Socket.emit(
      "requestExtraHint",
      { sessionCode, moduleId: selectedModuleId },
      (res?: RequestExtraHintResponse) => {
        if (!res?.success) {
          Alert.alert(
            "Indice refusé",
            res?.message ?? "Impossible de demander un indice supplémentaire.",
          );
          return;
        }
        handleCloseExtraHintModal();
      },
    );
  };

  const handleBack = () => {
    Socket.emit(
      "clearSession",
      { sessionCode, role },
      (res: { success: boolean; message?: string }) => {
        if (!res.success) {
          Alert.alert(
            "Erreur",
            "Une erreur s'est produite lors de la fermeture de la session.",
          );
          return;
        }
        Socket.disconnect();
        Socket.removeAllListeners();
        router.navigate({ pathname: "/agent/dificulty" });
      },
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.backButton}>
        <NavigationButton color="red" label="Quitter" onPress={handleBack} />
      </View>
      <Text style={styles.title}>Timer</Text>
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

      {role === "agent" && (
        <View style={styles.hintContainer}>
          <NavigationButton
            color="red"
            label="Indice supplémentaire"
            onPress={handleOpenExtraHintModal}
          />
        </View>
      )}

      <Modal
        visible={isExtraHintModalVisible}
        animationType="slide"
        transparent
        onRequestClose={handleCloseExtraHintModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Indice supplémentaire</Text>
            {isExtraHintContextLoading && (
              <Text style={styles.modalText}>Chargement du contexte...</Text>
            )}
            {!isExtraHintContextLoading && extraHintContext != null && (
              <>
                <Text style={styles.modalText}>
                  Quota: {extraHintContext.extraHintsUsed} /{" "}
                  {extraHintContext.maxHintsForDifficulty}
                </Text>
                {!hasReachedLimit && extraHintContext.nextHintNumber > 0 ? (
                  <>
                    <Text style={styles.modalText}>
                      Prochain indice: {extraHintContext.nextHintCostSeconds}s
                    </Text>
                    <Text style={styles.modalText}>
                      Rang prochain achat: #{extraHintContext.nextHintNumber}
                    </Text>
                    <Text style={styles.modalText}>Choisissez un module:</Text>
                    <ScrollView style={styles.modulesList}>
                      {extraHintContext.availableModules.map((module) => {
                        const isSelected = selectedModuleId === module.moduleId;
                        return (
                          <Pressable
                            key={module.moduleId}
                            style={[
                              styles.moduleRow,
                              isSelected && styles.moduleRowSelected,
                            ]}
                            onPress={() => setSelectedModuleId(module.moduleId)}
                          >
                            <Text style={styles.moduleText}>
                              Module {module.moduleNumber} - {module.moduleName}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </>
                ) : (
                  <Text style={styles.modalText}>
                    Plus d'indices disponibles
                  </Text>
                )}
                <View style={styles.modalButtons}>
                  <NavigationButton
                    color="red"
                    label="Fermer"
                    onPress={handleCloseExtraHintModal}
                  />
                  {!hasReachedLimit && extraHintContext.nextHintNumber > 0 && (
                    <NavigationButton
                      color="red"
                      label="Confirmer l'achat"
                      onPress={handleRequestExtraHint}
                    />
                  )}
                </View>
                {isExtraHintDisabled && !hasReachedLimit && (
                  <Text style={styles.modalText}>
                    Action indisponible (quota atteint ou timer non démarré).
                  </Text>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 50,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 20,
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
  hintContainer: {
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#1f1f1f",
    borderRadius: 10,
    padding: 16,
    maxHeight: "80%",
  },
  modalTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  modalText: {
    color: "white",
    fontSize: 14,
    marginBottom: 8,
  },
  modulesList: {
    maxHeight: 220,
    marginBottom: 12,
  },
  moduleRow: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#2d2d2d",
    marginBottom: 8,
  },
  moduleRowSelected: {
    backgroundColor: "#AD1D2B",
  },
  moduleText: {
    color: "white",
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
    width: "100%",
  },
});
