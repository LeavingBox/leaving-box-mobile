import {
  ModuleManual,
  ResolutionItem,
  SolutionWithIndex,
  StructuredSolution,
} from "@/core/interface/module.interface";
import { useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const isStructuredObj = (value: unknown): value is StructuredSolution =>
  typeof value === "object" &&
  value !== null &&
  "type" in (value as object) &&
  "items" in (value as object);

const isSolutionWithIndex = (
  solutions: unknown[],
): solutions is SolutionWithIndex[] =>
  solutions.length > 0 &&
  typeof solutions[0] === "object" &&
  solutions[0] !== null &&
  "index" in (solutions[0] as object);

function StructuredSolutionView({ sol }: { sol: StructuredSolution }) {
  if (sol.type === "resolution") {
    return <ResolutionTable items={sol.items as ResolutionItem[]} />;
  }
  return (
    <View>
      {(sol.items as string[]).map((cond, j) => (
        <Text key={j} style={styles.conditionItem}>
          {cond}
        </Text>
      ))}
    </View>
  );
}

function ResolutionTable({ items }: { items: ResolutionItem[] }) {
  return (
    <View style={styles.table}>
      <View style={[styles.tableRow, styles.tableHeader]}>
        <Text style={[styles.tableCell, styles.tableHeaderText]}>Parité</Text>
        <Text style={[styles.tableCell, styles.tableHeaderText]}>Comp.</Text>
        <Text
          style={[
            styles.tableCell,
            styles.tableHeaderText,
            styles.tableCellWide,
          ]}
        >
          Lettres
        </Text>
      </View>
      {items.map((item, i) => (
        <View
          key={i}
          style={[styles.tableRow, i % 2 === 0 && styles.tableRowAlt]}
        >
          <Text style={styles.tableCell}>{item.parity}</Text>
          <Text style={styles.tableCell}>{item.comparison}</Text>
          <Text style={[styles.tableCell, styles.tableCellWide]}>
            {item.letters.join(", ")}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function ModuleInstructions({
  manual,
  unlockedHints = [],
}: Readonly<{
  manual: ModuleManual;
  unlockedHints?: string[];
}>) {
  const [imageModalVisible, setImageModalVisible] = useState(false);

  const toArray = (value?: string | string[]): string[] => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  };

  const descriptionItems = toArray(manual.description);
  const rulesItems = toArray(manual.rules);
  const gameRulesItems = toArray(manual.gameRules);
  const hintsItems = toArray(manual.hints);
  const rawSolutions = manual.solutions ?? [];

  return (
    <ScrollView>
      <Text style={styles.title}>{manual.name}</Text>

      {manual.title && <Text style={styles.subtitle}>{manual.title}</Text>}

      {manual.Objectif && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Objectif</Text>
          <Text style={styles.body}>{manual.Objectif}</Text>
        </View>
      )}

      {descriptionItems.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          {descriptionItems.map((line, i) => (
            <Text key={i} style={styles.bulletItem}>
              {"• "}
              {line}
            </Text>
          ))}
        </View>
      )}

      {manual.imgUrl && (
        <>
          <TouchableOpacity onPress={() => setImageModalVisible(true)}>
            <Image
              resizeMode="contain"
              source={{
                uri: manual.imgUrl.startsWith("http")
                  ? manual.imgUrl
                  : `${process.env.EXPO_PUBLIC_API_URL}${manual.imgUrl}`,
              }}
              style={styles.image}
            />
          </TouchableOpacity>

          <Modal
            visible={imageModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setImageModalVisible(false)}
          >
            <Pressable
              style={styles.modalOverlay}
              onPress={() => setImageModalVisible(false)}
            >
              <Image
                resizeMode="contain"
                source={{
                  uri: manual.imgUrl.startsWith("http")
                    ? manual.imgUrl
                    : `${process.env.EXPO_PUBLIC_API_URL}${manual.imgUrl}`,
                }}
                style={styles.modalImage}
              />
            </Pressable>
          </Modal>
        </>
      )}

      {(rulesItems.length > 0 || gameRulesItems.length > 0) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Règles du jeu</Text>
          {[...rulesItems, ...gameRulesItems].map((rule, i) => (
            <Text key={i} style={styles.body}>
              {rule}
            </Text>
          ))}
        </View>
      )}

      {unlockedHints.length > 0 && (
        <View style={styles.hintsSection}>
          <Text style={styles.hintsSectionTitle}>💡 Indices débloqués</Text>
          {unlockedHints.map((hint, i) => (
            <View key={i} style={styles.hintRow}>
              <Text style={styles.hintNumber}>{i + 1}</Text>
              <Text style={styles.hintText}>{hint}</Text>
            </View>
          ))}
        </View>
      )}

      {rawSolutions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Solutions</Text>

          {isSolutionWithIndex(rawSolutions)
            ? rawSolutions.map((sol, i) => (
                <View key={i} style={styles.structuredBlock}>
                  {isStructuredObj(sol.text) ? (
                    <StructuredSolutionView sol={sol.text} />
                  ) : (
                    <View style={styles.solutionRow}>
                      <View style={styles.solutionBadge}>
                        <Text style={styles.solutionNumber}>{sol.index}</Text>
                      </View>
                      <Text style={styles.solutionText}>
                        {String(sol.text)}
                      </Text>
                    </View>
                  )}
                </View>
              ))
            : (rawSolutions as string[]).map((sol, i) => (
                <View key={i} style={styles.solutionRow}>
                  <View style={styles.solutionBadge}>
                    <Text style={styles.solutionNumber}>{i + 1}</Text>
                  </View>
                  <Text style={styles.solutionText}>{String(sol)}</Text>
                </View>
              ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 20,
  },
  subtitle: {
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 4,
    color: "#aaaaaa",
  },
  section: {
    color: "white",

    marginTop: 16,
  },
  sectionTitle: {
    color: "white",

    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  body: {
    color: "white",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  bulletItem: {
    color: "white",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  conditionItem: {
    color: "white",
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 6,
    paddingLeft: 4,
    borderLeftWidth: 3,
    borderLeftColor: "#4CAF50",
    paddingVertical: 2,
  },
  image: {
    zIndex: 100,
    width: 300,
    height: 300,
    alignSelf: "center",
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: {
    width: "95%",
    height: "80%",
  },
  structuredBlock: {
    marginBottom: 12,
  },
  table: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: "row",
  },
  tableRowAlt: {
    backgroundColor: "#f5f5f5",
  },
  tableHeader: {
    backgroundColor: "#333",
  },
  tableHeaderText: {
    color: "#fff",
    fontWeight: "700",
  },
  tableCell: {
    flex: 1,
    padding: 8,
    fontSize: 13,
    borderRightWidth: 1,
    borderRightColor: "#ccc",
  },
  tableCellWide: {
    flex: 2,
    borderRightWidth: 0,
  },
  hintsSection: {
    marginTop: 16,
    backgroundColor: "#FFF8E1",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
    padding: 12,
  },
  hintsSectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#92400E",
    marginBottom: 8,
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  hintNumber: {
    fontSize: 13,
    fontWeight: "700",
    color: "#B45309",
    marginRight: 8,
    minWidth: 16,
  },
  hintText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: "#78350F",
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
