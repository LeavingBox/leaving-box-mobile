import { ModuleManual } from "@/core/interface/module.interface";
import { Image, StyleSheet, Text, View } from "react-native";

export default function ModuleInstructions({
  manual,
}: Readonly<{
  manual: ModuleManual;
}>) {
  console.log("manual", manual);
  return (
    <View>
      <Text style={styles.title}>{manual.name}</Text>
      <Text style={styles.description}>{manual.description}</Text>
      {manual.rules?.map((rule, index) => (
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
