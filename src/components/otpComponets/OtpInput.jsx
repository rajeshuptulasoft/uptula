import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { COMICSBOLD } from "../../constant/fontPath";
import { BLACK, BRANDCOLOR, WHITE } from "../../constant/color";

export const OtpInput = ({ onOtpChange }) => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [focusedInput, setFocusedInput] = useState(null);
    const inputRefs = useRef([]);

    useEffect(() => {
        onOtpChange(otp.join(''));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [otp]);

    const handleChange = (value, index) => {
        const digit = value.replace(/[^0-9]/g, '').slice(0, 1);
        const newOtp = [...otp];
        newOtp[index] = digit;
        setOtp(newOtp);

        if (digit && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleFocus = (index) => {
        setFocusedInput(index);
    };

    const handleBlur = () => {
        setFocusedInput(null);
    };

    const handleKeyPress = (event, index) => {
        if (event.nativeEvent.key === 'Backspace') {
            if (otp[index] === '' && index > 0) {
                inputRefs.current[index - 1]?.focus();
                const newOtp = [...otp];
                newOtp[index - 1] = '';
                setOtp(newOtp);
            } else if (otp[index] !== '') {
                const newOtp = [...otp];
                newOtp[index] = '';
                setOtp(newOtp);
            }
        }
    };

    return (
        <View style={styles.container}>
            {otp.map((digit, index) => (
                <TextInput
                    key={index}
                    value={digit}
                    onChangeText={(value) => handleChange(value, index)}
                    onKeyPress={(event) => handleKeyPress(event, index)}
                    onFocus={() => handleFocus(index)}
                    onBlur={handleBlur}
                    style={[
                        styles.input,
                        focusedInput === index && styles.inputFocused,
                    ]}
                    keyboardType="numeric"
                    maxLength={1}
                    ref={(el) => (inputRefs.current[index] = el)}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 16,
        paddingHorizontal: 12,
        width: '100%',
    },
    input: {
        width: 45,
        height: 52,
        borderWidth: 1,
        borderColor: BRANDCOLOR,
        textAlign: 'center',
        fontSize: 18,
        marginHorizontal: 4,
        color: BLACK,
        borderRadius: 6,
        elevation: 3,
        backgroundColor: WHITE,
        fontFamily: COMICSBOLD,
    },
    inputFocused: {
        borderWidth: 2,
        borderColor: BLACK,
    },
});
