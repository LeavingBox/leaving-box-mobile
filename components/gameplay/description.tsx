import { Text, StyleSheet, View } from "react-native";

export default function Description() {
  return (
    <View style={{ marginTop: 20 }}>
      <Text style={styles.title}>Désarmorcer des bombes</Text>
      <Text style={styles.description}>
        Une bombe explose lorsque son compte à rebours atteint 0:00 ou lorsque trop d'erreurs ont été commises.
      </Text>
      <Text style={styles.description}>
        Le seul moyen de désamorcer une bombe avant qu'elle n'explose est de désarmer chaque module séparément avant que le compte à rebours ne se termine.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginVertical: 10,
  },

  description: {
    fontSize: 16,
    color: "white",
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 15,
  },
});