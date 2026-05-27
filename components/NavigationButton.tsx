import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { Link, LinkProps } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

interface NavigationButtonProps {
  href?: LinkProps["href"];
  label: string;
  color?: "blue" | "red" | "gray"; // Couleur du bouton
  textColor?: "black" | "white"; // Couleur du texte
  gradientDirection?: "top-to-bottom" | "bottom-to-top"; // Orientation du gradient
  param?: any;
  onPress?: () => void;
  disabled?: boolean;
}

const NavigationButton: React.FC<NavigationButtonProps> = ({
  href,
  label,
  param,
  onPress,
  color = "blue",
  textColor = "white",
  gradientDirection = "top-to-bottom",
  disabled = false, // Valeur par défaut
}) => {
  // Définition des couleurs du gradient en fonction de la couleur choisie
  const gradientColors: readonly [string, string, ...string[]] =
    color === "blue"
      ? ["#2D38F2", "#131CBB", "#11188D"]
      : color === "red"
        ? ["#F22D2D", "#BB1313", "#8D1111"]
        : color === "gray"
          ? ["#4B4847", "#575656", "#2C2B29"]
          : ["#ff512f", "#000000"]; // fallback
  // Définition du sens du gradient
  const gradientStart =
    gradientDirection === "top-to-bottom" ? { x: 0, y: 0 } : { x: 0, y: 1 };

  const gradientEnd =
    gradientDirection === "top-to-bottom" ? { x: 0, y: 1 } : { x: 0, y: 0 };
  const gradientLocations: readonly [number, number, ...number[]] =
    color === "blue"
      ? [0, 0.1442, 1]
      : color === "red"
        ? [0, 0.1442, 1]
        : color === "gray"
          ? [0, 0.0673, 1]
          : [0, 1];
  return (
    <TouchableOpacity
      style={styles.buttonContainer}
      onPress={onPress}
      disabled={disabled}
    >
      <LinearGradient
        colors={gradientColors}
        start={gradientStart}
        end={gradientEnd}
        locations={gradientLocations}
        style={styles.gradientButton}
      >
        <Text style={[styles.buttonText, { color: textColor }]}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    borderRadius: 5,
    overflow: "hidden",
    elevation: 5,
    minWidth: "100%",
  },
  gradientButton: {
    paddingVertical: 20,
    paddingHorizontal: 50,
    alignItems: "center",
    borderRadius: 5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default NavigationButton;
