import { View, Dimensions, Image, StyleSheet } from 'react-native';

interface Props {
  imgUrl: string;
}

const ImageURL = ({ imgUrl }: Props) => {
  console.log("🖼️ Affichage image depuis URL :", imgUrl);
  return (
    <View style={{ flex: 1, height: 600 }}>
      <Image
        source={{ uri: imgUrl }}
        style={styles.image}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    width: "auto",
    height: '100%',
    resizeMode: 'cover',
  },
});

export default ImageURL;