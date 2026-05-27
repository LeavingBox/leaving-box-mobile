import { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Pressable,
  Image,
} from "react-native";
import { router } from "expo-router";
import { useAudio } from "@/hooks/useAudio";

const { height } = Dimensions.get("window");

const COLORS = {
  bg: "#0D0D14",
  blue: "#787fff",
  red: "#ff5d4e",
  white: "#FFFFFF",
};

export default function CreditsScreen() {
  const translateY = useRef(new Animated.Value(height)).current;

  const { playMusic } = useAudio();

  useEffect(() => {
    Animated.loop(
      Animated.timing(translateY, {
        toValue: -1500,
        duration: 60000,
        useNativeDriver: true,
      }),
    ).start();
  }, []);

  const handleBack = () => {
    playMusic("menu");
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Diagonales branding */}
      <View style={styles.diagBlue} />
      <View style={styles.diagRed} />

      {/* Bouton close */}
      <Pressable style={styles.closeBtn} onPress={handleBack}>
        <Text style={styles.closeText}>✕</Text>
      </Pressable>

      {/* Scroll animé */}
      <Animated.View
        style={[styles.scrollContainer, { transform: [{ translateY }] }]}
      >
        <CreditsBlock />
      </Animated.View>

      {/* Footer dots */}
      <View style={styles.dots}>
        {[...Array(8)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i % 2 === 0 ? COLORS.blue : COLORS.red,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function CreditsBlock() {
  return (
    <View style={styles.content}>
      <Image
        source={require("@/assets/images/LOGO.png")}
        style={styles.firstLogo}
      />

      <Text style={styles.mainTitle}>LEAVING BOX</Text>
      <Text style={styles.version}>v1.0.0</Text>

      <Divider />

      <Header title="PROJET SIGNAL ZERO" />

      <Section title="Direction du projet" names={["Enzo Midonet"]} />

      <Section
        title="Développement"
        names={[
          "Samuel Guesdon",
          "Gabrielle Baquie",
          "Maxime Oriot",
          "Enzo Midonet",
        ]}
      />

      <Section
        title="Électronique & Impression 3D"
        names={[
          "Irwin Ticon Gaultier",
          "Dan Irnel",
          "Melkiade Ngnintedem Tsobeng",
          "Guilhem Raffanel",
        ]}
      />

      <Divider />

      <Header title="SON & DESIGN" />

      <Section
        title="Charte Graphique / Design"
        names={["Tiavina Rakoto Endor", "Noemie Eberle", "Benjamin Boulon"]}
      />

      <Section title="Sound Design / Musique" names={["Maxime Oriot"]} />

      <Divider />

      <Header title="MODULES" />

      <MiniModule label="Braille" />
      <MiniModule label="Suite Numérique" />
      <MiniModule label="Labyrinthe de fleches" />
      <MiniModule label="Simon" />

      <Divider />

      <Text style={styles.thanksTitle}>REMERCIEMENTS</Text>

      {[
        "Le café qui a tout rendu possible",
        "Nos très chers joueurs",
        "La daronne à Irwin (et son tonton)",
      ].map((t) => (
        <Text key={t} style={styles.thanks}>
          {t}
        </Text>
      ))}

      <Text style={styles.final}>Merci !!!</Text>

      <View style={{ height: 300 }} />
    </View>
  );
}

function Header({ title }: { title: string }) {
  return <Text style={styles.header}>{title}</Text>;
}

function Divider() {
  return <View style={styles.divider} />;
}

function Section({ title, names }: { title: string; names: string[] }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {names.map((n) => (
        <Text key={n} style={styles.name}>
          {n}
        </Text>
      ))}
    </View>
  );
}

function MiniModule({ label }: { label: string }) {
  return (
    <View style={styles.module}>
      <Text style={styles.moduleLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    overflow: "hidden",
  },

  diagBlue: {
    position: "absolute",
    top: -80,
    left: -80,
    width: 220,
    height: 220,
    backgroundColor: COLORS.blue,
    transform: [{ rotate: "45deg" }],
    opacity: 0.15,
  },

  diagRed: {
    position: "absolute",
    bottom: -100,
    right: -100,
    width: 250,
    height: 250,
    backgroundColor: COLORS.red,
    transform: [{ rotate: "45deg" }],
    opacity: 0.15,
  },

  badge: {
    position: "absolute",
    top: 60,
    left: 20,
    zIndex: 20,
  },

  badgeText: {
    color: COLORS.white,
    fontSize: 11,
    letterSpacing: 4,
    opacity: 0.5,
  },

  closeBtn: {
    position: "absolute",
    top: 55,
    right: 20,
    zIndex: 20,
  },

  closeText: {
    color: COLORS.white,
    fontSize: 24,
  },

  scrollContainer: {
    width: "100%",
    position: "absolute",
  },

  content: {
    alignItems: "center",
    paddingHorizontal: 30,
  },

  mainTitle: {
    color: COLORS.white,
    fontSize: 38,
    fontWeight: "900",
    marginTop: 120,
    letterSpacing: 2,
  },

  version: {
    color: COLORS.red,
    marginBottom: 30,
  },

  header: {
    color: COLORS.blue,
    fontSize: 12,
    letterSpacing: 3,
    marginBottom: 20,
  },

  divider: {
    width: "70%",
    height: 1,
    backgroundColor: COLORS.red,
    marginVertical: 25,
  },

  section: {
    alignItems: "center",
    marginBottom: 24,
  },

  sectionCode: {
    color: COLORS.red,
    fontSize: 30,
    fontWeight: "900",
  },

  sectionTitle: {
    color: COLORS.blue,
    fontSize: 13,
    letterSpacing: 2,
    marginBottom: 6,
  },

  name: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "bold",
  },

  module: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 12,
  },

  moduleNumber: {
    color: COLORS.red,
    fontSize: 22,
    fontWeight: "900",
  },

  moduleLabel: {
    color: COLORS.white,
    fontSize: 18,
  },

  thanksTitle: {
    color: COLORS.blue,
    marginBottom: 16,
    letterSpacing: 2,
  },

  thanks: {
    color: "#AAA",
    marginVertical: 4,
  },

  final: {
    color: COLORS.red,
    fontSize: 28,
    fontWeight: "900",
    marginTop: 50,
    letterSpacing: 3,
  },

  dots: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    flexDirection: "row",
    gap: 6,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  firstLogo: {
    width: 1000,
    height: 90,
    resizeMode: "contain",
    marginBottom: -100,
  },
});
