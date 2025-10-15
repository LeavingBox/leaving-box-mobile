import { ScrollView, Text, Image, StyleSheet, View, Modal, TouchableOpacity } from 'react-native';

interface ManualScreenProps {
  isVisible: boolean;
  onClose: () => void;
}

const ManualScreen = ({ isVisible, onClose }: ManualScreenProps) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          
          <ScrollView style={styles.container}>
            <Image
              source={require('@/assets/images/homePageLogo.png')}
              style={styles.logo}
            />

            <Text style={styles.title}>Manuel de Désamorçage</Text>

            <Text style={styles.sectionTitle}>📘 Introduction</Text>
            <Text style={styles.paragraph}>
              Bienvenue dans l’univers périlleux de Leaving Box. 
            </Text>
            <Text  style={styles.paragraph} >Ce manuel est votre guide essentiel pour désamorcer les modules complexes de la boîte. Étudiez-le attentivement, car une seule erreur pourrait être fatale.</Text>

            <Text style={styles.sectionTitle}>🎮 Règles du Jeu</Text>
            
            <Text style={styles.paragraph}>
              - Désamorceur : Interagit avec la boîte via l'application mobile.
              </Text>

              <Text style={styles.paragraph}>
              - Experts : Consultent ce manuel pour guider le désamorceur.
                </Text>

                <Text style={styles.paragraph}>
              - Communication : Le désamorceur décrit les modules ; les experts fournissent les instructions pour les désamorcer. 
                </Text>

                <Text style={styles.paragraph}>
              - Objectif : Désamorcer tous les modules avant la fin du temps imparti ou avant d'atteindre le nombre maximal d'erreurs.
            </Text>

            {/* Ajoutez d'autres sections du manuel ici */}

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  logo: {
    width: "100%",
    height: 40,
    alignSelf: 'center',
    marginBottom: 16,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    color: 'white',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: 'white',
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'rgba(43, 49, 53, 1)',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    right: 10,
    top: 10,
    zIndex: 1,
    padding: 10,
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default ManualScreen;