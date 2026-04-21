import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { BLACK, BRANDCOLOR, WHITE } from "../../constant/color";

import {
    CANTARELLBOLD,
    CANTARELL,
    FIRASANSBOLD,
    FIRASANS,
    FIRASANSSEMIBOLD,
    OXYGENBOLD,
    OXYGEN,
    ROBOTOBOLD,
    ROBOTOSEMIBOLD,
    ROBOTO,
    UBUNTUBOLD,
    UBUNTU,
} from "../../constant/fontPath";

export const CustomButton = ({
    text = "",
    width = "70%",
    backgroundColor = BRANDCOLOR,
    fontSize = 16,
    fontFamily = UBUNTUBOLD, // ✅ default font
    color = WHITE,
    onPress = () => {
        console.log("onPress not set");
    }
}) => {
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.btnView,
                {
                    width: width,
                    backgroundColor: backgroundColor,
                    opacity: pressed ? 0.85 : 1,
                },
            ]}
        >
            <Text
                allowFontScaling={false}
                numberOfLines={1}
                adjustsFontSizeToFit
                style={[
                    styles.text,
                    {
                        fontFamily: fontFamily,
                        color: color,
                        fontSize: fontSize,
                    },
                ]}
            >
                {text}
            </Text>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    btnView: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",

        // ✅ modern shadow
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },

    text: {
        fontSize: 16,
        fontFamily: UBUNTUBOLD, // ✅ updated
        color: BLACK,
    },
});