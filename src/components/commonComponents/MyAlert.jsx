import React, { useEffect, useRef, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View, Animated, Image } from "react-native";
import { BLACK, BRANDCOLOR, WHITE } from "../../constant/color";
import { FIRASANSBOLD, FIRASANS, UBUNTUBOLD, UBUNTU } from "../../constant/fontPath";

export const MyAlert = ({
  visible = false,
  textRight = "Yes",
  textLeft = "Cancel",
  title = "",
  borderRadius = 16,
  message = "",
  showRightButton = true,
  showLeftButton = true,
  backgroundColor = BRANDCOLOR,
  color = WHITE,
  fontFamily = FIRASANSBOLD,
  fontSize = 16,
  image = null,
  onRequestClose = () => {
    console.log("Modal Closed");
  },
  onPressRight = () => {
    console.log("Modal Open");
  },
  onPressLeft = () => {
    console.log("Modal Closed");
  }
}) => {
  const [showModal, setShowModal] = useState(visible);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Determine button colors based on button text
  const getLeftButtonColor = () => {
    const leftText = textLeft.toLowerCase().trim();
    if (leftText === "cancel" || leftText === "no") {
      return "#E8E8E8"; // Light gray
    }
    return "#F0F0F0";
  };

  const getRightButtonColor = () => {
    const rightText = textRight.toLowerCase().trim();
    if (rightText === "yes" || rightText === "ok" || rightText === "delete" || rightText === "login" || rightText === "register" || rightText === "update") {
      return BRANDCOLOR;
    }
    return BRANDCOLOR;
  };

  const getLeftButtonTextColor = () => {
    const leftText = textLeft.toLowerCase().trim();
    if (leftText === "cancel" || leftText === "no") {
      return "#666666"; // Dark gray
    }
    return "#333333";
  };

  useEffect(() => {
    if (visible) {
      setShowModal(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setShowModal(false));
    }
  }, [visible]);

  return (
    <>
      {showModal && (
        <Modal
          transparent={true}
          animationType="none"
          visible={showModal}
          onRequestClose={onRequestClose}
          statusBarTranslucent={true}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalContent, { opacity: fadeAnim }]}>
              {image && (
                <Image source={image} style={styles.logo} />
              )}
              <Text allowFontScaling={false} style={styles.title}>{title}</Text>
              <Text allowFontScaling={false} style={styles.message}>{message}</Text>

          <View style={styles.btnView}>
                {showLeftButton && (
                  <Pressable
                    style={[styles.button, styles.leftButton, { backgroundColor: getLeftButtonColor(), borderRadius }]}
                    onPress={onPressLeft}
                  >
                    <Text
                    allowFontScaling={false}
                      style={[
                        styles.buttonText,
                        { color: getLeftButtonTextColor(), fontFamily: FIRASANSBOLD, fontSize: 14 },
                      ]}
                    >
                      {textLeft}
                    </Text>
                  </Pressable>
                )}

                {showRightButton && (
                  <Pressable
                    style={[styles.button, styles.rightButton, { backgroundColor: getRightButtonColor(), borderRadius }]}
                    onPress={onPressRight}
                  >
                    <Text
                    allowFontScaling={false}
                      style={[
                        styles.buttonText,
                        { color, fontFamily: FIRASANSBOLD, fontSize: 14 },
                      ]}
                    >
                      {textRight}
                    </Text>
                  </Pressable>
                )}
              </View>
            </Animated.View>
          </View>
        </Modal>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },
  modalContent: {
    width: "82%",
    backgroundColor: WHITE,
    padding: 28,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  logo: {
    width: 60,
    height: 60,
    resizeMode: "contain",
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    marginBottom: 12,
    color: BLACK,
    fontFamily: UBUNTUBOLD,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  message: {
    fontSize: 15,
    marginBottom: 20,
    color: "#555555",
    fontFamily: FIRASANS,
    textAlign: "center",
    lineHeight: 22,
    letterSpacing: 0.3,
  },
  btnView: {
    padding: 0,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 12,
  },
  buttonText: {
    textAlign: "center",
    fontWeight: "500",
  },
  button: {
    flex: 1,
    paddingVertical: 13,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  leftButton: {
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
  },
  rightButton: {
    shadowColor: BRANDCOLOR,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
});