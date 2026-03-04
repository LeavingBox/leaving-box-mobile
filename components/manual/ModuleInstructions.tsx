import { ModuleManual } from "@/core/interface/module.interface";
import { Image, StyleSheet, Text, View } from "react-native";

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
  const solutions = normalizeToArray(manual.solutions);

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

      <Image
        resizeMode="contain"
        source={{ uri: manual.imgUrl }}
        style={styles.image}
      />
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
    borderColor: "red",
    borderWidth: 1,
    alignSelf: "center",
  },
});
