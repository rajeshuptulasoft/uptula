import React, { useState } from "react";
import { Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { BLACK, BRANDCOLOR, GREY, WHITE } from "../../constant/color";
import { COMICS, COMICSBOLD, UBUNTU, UBUNTUBOLD } from "../../constant/fontPath";

export const TextInputComponent = ({
    placeholder = "",
    image = "",
    type = "",
    inputdata = "",
    setInputdata = {},
    keyboardType = 'default',
    editable = true,
    borderColor = "green",
    maxLength = 100,
    onTouch = "",
    width = "80%",
    autoCapitalize = "",
    // New props
    rightIcon = "",
    onRightPress = null,
    showPassword = false,
    iconTintColor = "#6B7280",
}) => {
    const [tap, setTap] = useState(false);
    return (
        <Pressable
            onPress={onTouch != "" ? onTouch : () => { }}
            style={[
                Styles.container,
                {
                    borderWidth: tap ? 1.5 : 1,
                    borderColor: tap ? BRANDCOLOR : "#E5E7EB",
                    width: width,
                }
            ]}
        >
            {/* Floating Label */}
            {(tap || inputdata !== "") && (
                <View style={Styles.labelWrapper}>
                    <Text allowFontScaling={false} style={Styles.label}>
                        {placeholder}
                    </Text>
                </View>
            )}

            <View style={Styles.row}>

                {/* Left Icon */}
                {image !== '' && (
                    <View style={Styles.imgContainer}>
                        <Image
                            style={[
                                Styles.icon,
                                iconTintColor !== null ? { tintColor: iconTintColor } : {},
                            ]}
                            source={image}
                        />
                    </View>
                )}

                {/* Input */}
                <TextInput
                    secureTextEntry={type === 'password' ? !showPassword : false}
                    style={Styles.input}
                    onChangeText={(res) => {
                        // ✅ YOUR ORIGINAL LOGIC (UNCHANGED)
                        if (type == 'name') {
                            if (res[0] != " " && (/[a-zA-Z" "]/.test(res[res.length - 1]))) {
                                setInputdata(res);
                            } else if ((/[a-zA-Z" "]/.test(res[res.length - 1]))) {
                                setInputdata(res.slice(0, 0));
                            } else {
                                setInputdata('');
                            }
                        } else if (type == 'number') {
                            if (res[0] != 0 && (/[0-9]/.test(res[res.length - 1]))) {
                                setInputdata(res);
                            } else if ((/[0-9]/.test(res[res.length - 1]))) {
                                setInputdata(res.slice(0, 0));
                            } else {
                                setInputdata('');
                            }
                        } else if (type == 'email') {
                            if ((/[a-zA-Z@0-9_.-]/.test(res[res.length - 1]))) {
                                setInputdata(res);
                            } else {
                                setInputdata('');
                            }
                        } else if (type == 'password') {
                            if ((/[a-zA-Z@$#!%*0-9]/.test(res[res.length - 1]))) {
                                setInputdata(res);
                            } else {
                                setInputdata('');
                            }
                        } else {
                            setInputdata(res);
                        }
                    }}
                    value={inputdata}
                    editable={editable}
                    maxLength={maxLength}
                    keyboardType={keyboardType}
                    placeholder={tap ? "" : placeholder}
                    placeholderTextColor="#9CA3AF"
                    onFocus={() => setTap(true)}
                    onEndEditing={() => setTap(false)}
                    autoCapitalize={autoCapitalize}
                />

                {/* Right Icon */}
                {rightIcon !== '' && (
                    <Pressable onPress={onRightPress} style={Styles.rightIcon}>
                        <Image style={Styles.rightImg} source={rightIcon} />
                    </Pressable>
                )}
            </View>
        </Pressable>
    )
}
const Styles = StyleSheet.create({
    container: {
        height: 50, // ✅ reduced
        backgroundColor: WHITE,
        borderRadius: 10,
        marginVertical: 8,
        paddingHorizontal: 12,

        // ✅ modern light shadow
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
    },

    labelWrapper: {
        position: "absolute",
        top: -8,
        left: 12,
        backgroundColor: WHITE,
        paddingHorizontal: 6,
        borderRadius: 6,
    },

    label: {
        fontSize: 12,
        color: BRANDCOLOR,
        fontFamily: UBUNTUBOLD, // ✅ updated font
    },

    row: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },

    imgContainer: {
        marginRight: 8,
        justifyContent: "center",
        alignItems: "center",
    },

    icon: {
        height: 20, // ✅ smaller icon
        width: 20,
    },

    input: {
        flex: 1,
        fontSize: 15,
        color: BLACK,
        fontFamily: UBUNTU,
        textAlignVertical: "center", // ✅ optional
    },

    rightIcon: {
        padding: 6,
    },

    rightImg: {
        height: 20,
        width: 20,
    },
})