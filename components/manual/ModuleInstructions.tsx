import { ModuleManual } from "@/core/interface/module.interface";
import { StyleSheet, Text, View, Modal, TouchableOpacity, Image, Dimensions, Pressable } from "react-native";
import ImageURL from "@/components/manual/imageUrl"; 
import { useState } from "react";

export default function ModuleInstructions({
  manual,
}: Readonly<{
  manual: ModuleManual;
}>) {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View>
      <Text style={styles.title}>{manual.name}</Text>
      <Text style={styles.description}>{manual.description}</Text>
      {manual.rules?.map((rule, index) => (
        <Text key={index} style={styles.rules}>
          - {rule}
        </Text>

      ))}
      {manual.imgUrl && (
        <>
          <TouchableOpacity onPress={() => setModalVisible(true)} style={{ borderWidth: 1, borderColor: 'red', marginTop: 10 }}>
            <Image source={{ uri: manual.imgUrl }} style={{ height: 150, width: '100%', resizeMode: 'cover' }} />
          </TouchableOpacity>

          <Modal visible={modalVisible} transparent={true}>
            <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' }} onPress={() => setModalVisible(false)}>
              <Image
                source={{ uri: manual.imgUrl }}
                style={{ width: Dimensions.get("window").width * 0.9, height: Dimensions.get("window").height * 0.8, resizeMode: "contain" }}
              />
            </Pressable>
          </Modal>
        </>
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
});
