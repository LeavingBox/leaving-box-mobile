import {
  ModuleManual,
  SolutionWithIndex,
} from "@/core/interface/module.interface";
import { Image, StyleSheet, Text, View } from "react-native";

const normalizeSolutions = (
  solutions?: string[] | SolutionWithIndex[],
): Array<{ number: number; text: string }> => {
  if (!solutions || !Array.isArray(solutions)) return [];
  return solutions.map((sol, i) => {
    if (typeof sol === "object" && "index" in sol && "text" in sol) {
      return { number: sol.index, text: sol.text };
    }
    return { number: i + 1, text: String(sol) };
  });
};

export default function ModuleInstructions({
  manual,
}: Readonly<{
  manual: ModuleManual;
}>) {
  const normalizeToArray = (value?: string[] | string) => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  };

  const rules = normalizeToArray(manual.rules);
  const solutions = normalizeSolutions(manual.solutions);

  return (
    <View>
      <Text style={styles.title}>{manual.name}</Text>
      <Text style={styles.description}>{manual.description}</Text>
      {manual.rules &&
        Array.isArray(manual.rules) &&
        manual.rules.length > 0 &&
        manual.rules.map((rule, index) => (
          <Text key={index} style={styles.rules}>
            {rule}
          </Text>
        ))}

      {manual.imgUrl && (
        <Image
          resizeMode="contain"
          source={{ uri: manual.imgUrl }}
          style={styles.image}
        />
      )}

      {solutions.length > 0 && (
        <View style={styles.solutionsSection}>
          <Text style={styles.sectionTitle}>Solutions</Text>
          {solutions.map((sol, i) => (
            <View key={i} style={styles.solutionRow}>
              <View style={styles.solutionBadge}>
                <Text style={styles.solutionNumber}>{sol.number}</Text>
              </View>
              <Text style={styles.solutionText}>{sol.text}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 20,
  },
  description: {
    fontStyle: "italic",
  },
  block: {
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },
  rules: {
    fontSize: 14,
    marginTop: 10,
  },
  instructions: {
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 5,
    fontSize: 16,
    marginTop: 10,
    padding: 10,
  },
  image: {
    zIndex: 100,
    width: 300,
    height: 300,
    alignSelf: "center",
    marginTop: 16,
  },
  solutionsSection: {
    marginTop: 20,
  },
  solutionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  solutionBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  solutionNumber: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  solutionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
