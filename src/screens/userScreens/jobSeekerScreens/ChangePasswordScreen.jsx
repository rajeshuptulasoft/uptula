import React, { useState, useCallback, useEffect } from "react";
import {
    StatusBar,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
    SafeAreaView,
    RefreshControl,
    BackHandler,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { COMICSBOLD } from "../../../constant/fontPath";
import { PASSWORD, HIDE, VIEW, LOGO } from "../../../constant/imagePath";
import { ToastMessage } from "../../../components/commonComponents/ToastMessage";
import { OtpInput } from "../../../components/otpComponets/OtpInput";
import { CustomButton } from "../../../components/commonComponents/Button";
import { MyAlert } from "../../../components/commonComponents/MyAlert";
import { MyHeader } from "../../../components/commonComponents/MyHeader";
import { HEIGHT, WIDTH } from "../../../constant/config";
import { BASE_URL } from "../../../constant/url";
import { POSTNETWORK, PUTNETWORK } from "../../../utils/Network";
import { getObjByKey } from "../../../utils/Storage";
import { BLACK, BRANDCOLOR, WHITE } from "../../../constant/color";
import { TextInputComponent } from "../../../components/commonComponents/TextInputComponent";

const ChangePasswordScreen = ({ navigation }) => {
    /* ---------- STATES ---------- */
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [showForgotSection, setShowForgotSection] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotStep, setForgotStep] = useState(1);
    const [otpValue, setOtpValue] = useState("");
    const [otpVerified, setOtpVerified] = useState(false);
    const [otpStatus, setOtpStatus] = useState("");
    const [otpTimer, setOtpTimer] = useState(0);
    const [resendCount, setResendCount] = useState(0);
    const MAX_RESEND_ATTEMPTS = 5;

    const [refreshing, setRefreshing] = useState(false);
    const [showConfirmAlert, setShowConfirmAlert] = useState(false);
    const [resetKey, setResetKey] = useState(0);

    const [toastMessage, setToastMessage] = useState({
        type: "",
        msg: "",
        visible: false,
    });

    /* ---------- RESET ALL FIELDS ---------- */
    const resetAllFields = () => {
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowOld(false);
        setShowNew(false);
        setShowConfirm(false);
        setResetKey((prev) => prev + 1); // Force re-render of TextInputComponents
    };

    /* ---------- BACK HANDLER ---------- */
    useEffect(() => {
        const backHandler = BackHandler.addEventListener(
            "hardwareBackPress",
            () => {
                navigation.goBack();
                return true;
            }
        );
        return () => backHandler.remove();
    }, [navigation]);

    useEffect(() => {
        if (otpTimer <= 0) return;

        const timerId = setTimeout(() => {
            setOtpTimer((prev) => Math.max(prev - 1, 0));
        }, 1000);

        return () => clearTimeout(timerId);
    }, [otpTimer]);

    /* ---------- RESET ON SCREEN FOCUS ---------- */
    useFocusEffect(
        useCallback(() => {
            resetAllFields();
        }, [])
    );

    /* ---------- PULL TO REFRESH ---------- */
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        resetAllFields();
        setTimeout(() => setRefreshing(false), 800);
    }, []);

    /* ---------- API CALL ---------- */
    const changePasswordAPI = async () => {
        setShowConfirmAlert(false);

        try {
            const storedData = await getObjByKey("loginResponse");
            const loginData =
                typeof storedData === "string"
                    ? JSON.parse(storedData)
                    : storedData;

            const token = loginData?.token;
            if (!token) {
                console.error("Change password error: No token found");
                setToastMessage({
                    type: "error",
                    msg: "Session expired. Please login again.",
                    visible: true,
                });
                return;
            }

            const url = `${BASE_URL}auth/change-password`;
            const payload = {
                currentPassword: oldPassword,
                newPassword: newPassword,
                confirmPassword: confirmPassword,
            };


            PUTNETWORK(url, payload, true)
                .then((result) => {

                    // Check for success in multiple possible response formats
                    const successMessage = result?.message || "";
                    const isSuccessMessage = successMessage.toLowerCase().includes("success") ||
                        successMessage.toLowerCase().includes("changed successfully");

                    const isSuccess =
                        result?.success === true ||
                        result?.statusCode === 200 ||
                        result?.statusCode === 201 ||
                        result?.status === "success" ||
                        result?.status === "Success" ||
                        isSuccessMessage;

                    if (isSuccess) {
                        // Reset fields first
                        resetAllFields();
                        // Show success toast
                        setTimeout(() => {
                            setToastMessage({
                                type: "success",
                                msg: result?.message || "Password changed successfully",
                                visible: true,
                            });
                        }, 100);
                    } else {
                        console.error("Change password failed:", result?.message || result?.error || "Unknown error");
                        setToastMessage({
                            type: "error",
                            msg: result?.message || result?.error || "Failed to change password",
                            visible: true,
                        });
                    }
                })
                .catch((error) => {
                    console.error("Change password error:", error);
                    setToastMessage({
                        type: "error",
                        msg: "Failed to change password. Please try again.",
                        visible: true,
                    });
                });
        } catch (error) {
            console.error("Change password exception:", error);
            setToastMessage({
                type: "error",
                msg: "Unable to process request",
                visible: true,
            });
        }
    };

    /* ---------- VALIDATION ---------- */
    const onChangePassword = () => {
        if (!oldPassword || !newPassword || !confirmPassword) {
            setToastMessage({
                type: "error",
                msg: "All fields are required",
                visible: true,
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            setToastMessage({
                type: "error",
                msg: "New password and confirm password do not match",
                visible: true,
            });
            return;
        }

        setShowConfirmAlert(true);
    };

    const onForgotPasswordPress = () => {
        setShowForgotSection(true);
        setForgotStep(1);
        setForgotEmail("");
        setOtpValue("");
        setOtpVerified(false);
        setOtpStatus("");
        setOtpTimer(0);
        setResendCount(0);
        setToastMessage({
            type: "info",
            msg: "Enter your registered email to get OTP",
            visible: true,
        });
        // console.log("[ChangePassword JobSeeker] Forgot flow opened");
    };

    // const handleProceedEmail = () => {
    //     if (!forgotEmail) {
    //         setToastMessage({
    //             type: "error",
    //             msg: "Please enter your email",
    //             visible: true,
    //         });
    //         console.log("[ChangePassword JobSeeker] handleProceedEmail – no email");
    //         return;
    //     }

    //     setForgotStep(2);
    //     setOtpTimer(60);
    //     setOtpStatus("OTP sent; enter 6-digit code");
    //     setResendCount(0);
    //     setOtpValue("");
    //     setOtpVerified(false);

    //     setToastMessage({
    //         type: "success",
    //         msg: "OTP sent to your email",
    //         visible: true,
    //     });
    //     console.log("[ChangePassword JobSeeker] handleProceedEmail – OTP requested", { forgotEmail });
    // };



    const handleProceedEmail = async () => {
        if (!forgotEmail) {
            setToastMessage({
                type: "error",
                msg: "Please enter your email",
                visible: true,
            });
            return;
        }

        try {
            const url = `${BASE_URL}auth/forgot-password`;

            const payload = {
                email: forgotEmail,
            };

            // console.log("[ChangePassword JobSeeker] Sending OTP request", { url, payload });
            const response = await POSTNETWORK(url, payload, false);
            // console.log("[ChangePassword JobSeeker] Send OTP response", response);

            const msg = (response?.message || "").toString();
            const isSuccess =
                response?.success === true ||
                response?.status === "success" ||
                response?.statusCode === 200 ||
                response?.statusCode === 201 ||
                // many APIs only return { message: "OTP sent ..." } on success
                (!!msg && !response?.error && !response?.errors) ||
                /otp\s*sent|otp\s*has\s*been\s*sent/i.test(msg);

            if (isSuccess) {
                // console.log("[ChangePassword JobSeeker] OTP request success → opening OTP step", { msg });
                setForgotStep(2);
                setOtpTimer(60);
                setOtpStatus("OTP sent. Enter 6-digit code");
                setResendCount(0);
                setOtpValue("");
                setOtpVerified(false);

                setToastMessage({
                    type: "success",
                    msg: msg || "OTP sent to your email",
                    visible: true,
                });
            } else {
                setToastMessage({
                    type: "error",
                    msg: msg || "Failed to send OTP",
                    visible: true,
                });
            }
        } catch (error) {
            // console.log("[ChangePassword JobSeeker] Send OTP error", error);
            setToastMessage({
                type: "error",
                msg: "Error sending OTP",
                visible: true,
            });
        }
    };


    const handleResendOtp = async () => {
        if (otpTimer > 0) return;

        if (resendCount >= MAX_RESEND_ATTEMPTS) {
            setToastMessage({
                type: "error",
                msg: "Max resend attempts reached",
                visible: true,
            });
            setOtpStatus("Max resend attempts reached");
            return;
        }

        try {
            const url = `${BASE_URL}auth/resend-otp`;

            const payload = {
                email: forgotEmail,
            };

            // console.log("[ChangePassword JobSeeker] Resend OTP request", { url, payload, resendCount });
            const response = await POSTNETWORK(url, payload, false);
            // console.log("[ChangePassword JobSeeker] Resend OTP response", response);

            const msg = (response?.message || "").toString();
            const isSuccess =
                response?.success === true ||
                response?.status === "success" ||
                /otp\s*sent|otp\s*resent/i.test(msg);

            if (isSuccess) {
                setResendCount((prev) => prev + 1);
                setOtpTimer(60);
                setOtpStatus("OTP resent successfully");

                setToastMessage({
                    type: "success",
                    msg: msg || "OTP resent successfully",
                    visible: true,
                });
            } else {
                setToastMessage({
                    type: "error",
                    msg: msg || "Failed to resend OTP",
                    visible: true,
                });
            }
        } catch (error) {
            // console.log("[ChangePassword JobSeeker] Resend OTP error", error);
            setToastMessage({
                type: "error",
                msg: "Error resending OTP",
                visible: true,
            });
        }
    };

    // useEffect(() => {
    //     if (otpValue.length === 6) {
    //         setOtpVerified(true);
    //         setOtpStatus("OTP verified successfully");
    //         setToastMessage({
    //             type: "success",
    //             msg: "OTP verified",
    //             visible: true,
    //         });
    //         console.log("[ChangePassword JobSeeker] OTP verified", { otpValue });
    //     } else {
    //         setOtpVerified(false);
    //         if (otpValue.length > 0) {
    //             setOtpStatus("Enter complete 6-digit OTP");
    //         } else {
    //             setOtpStatus("");
    //         }
    //     }
    // }, [otpValue]);


    useEffect(() => {
        const verifyOtp = async () => {
            if (otpValue.length === 6) {
                try {
                    const url = `${BASE_URL}auth/verify-otp`;

                    const payload = {
                        email: forgotEmail,
                        otp: otpValue,
                    };

                    // console.log("[ChangePassword JobSeeker] Verify OTP request", { url, payload });
                    const response = await POSTNETWORK(url, payload, false);
                    // console.log("[ChangePassword JobSeeker] Verify OTP response", response);

                    const msg = (response?.message || "").toString();
                    const isSuccess =
                        response?.success === true ||
                        response?.status === "success" ||
                        /otp\s*verified|verified\s*success/i.test(msg);

                    if (isSuccess) {
                        setOtpVerified(true);
                        setOtpStatus(msg || "OTP verified successfully");

                        setToastMessage({
                            type: "success",
                            msg: msg || "OTP verified",
                            visible: true,
                        });
                    } else {
                        setOtpVerified(false);
                        setOtpStatus(msg || "Invalid OTP");

                        setToastMessage({
                            type: "error",
                            msg: msg || "Invalid OTP",
                            visible: true,
                        });
                    }
                } catch (error) {
                    // console.log("[ChangePassword JobSeeker] Verify OTP error", error);
                    setToastMessage({
                        type: "error",
                        msg: "OTP verification failed",
                        visible: true,
                    });
                }
            }
        };

        verifyOtp();
    }, [otpValue]);


    // const handleForgotUpdatePassword = () => {
    //     if (!otpVerified) {
    //         setToastMessage({
    //             type: "error",
    //             msg: "Please enter valid 6-digit OTP",
    //             visible: true,
    //         });
    //         return;
    //     }

    //     if (!newPassword || !confirmPassword) {
    //         setToastMessage({
    //             type: "error",
    //             msg: "Please enter new and confirm password",
    //             visible: true,
    //         });
    //         return;
    //     }

    //     if (newPassword !== confirmPassword) {
    //         setToastMessage({
    //             type: "error",
    //             msg: "Passwords do not match",
    //             visible: true,
    //         });
    //         return;
    //     }

    //     // Use existing API for change password
    //     // Ideally call a dedicated endpoint for forgot reset. For now reuse changePasswordAPI to avoid duplicate code path.
    //     changePasswordAPI();
    //     setShowForgotSection(false);
    //     resetAllFields();
    // };


    const handleForgotUpdatePassword = async () => {
        if (!otpVerified) {
            setToastMessage({
                type: "error",
                msg: "Please enter valid OTP",
                visible: true,
            });
            return;
        }

        if (!newPassword || !confirmPassword) {
            setToastMessage({
                type: "error",
                msg: "Enter all fields",
                visible: true,
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            setToastMessage({
                type: "error",
                msg: "Passwords do not match",
                visible: true,
            });
            return;
        }

        try {
            const url = `${BASE_URL}auth/reset-password`;

            const payload = {
                email: forgotEmail,
                newPassword,
                confirmPassword,
            };

            // console.log("[ChangePassword JobSeeker] Update Password request", { url, payload });
            const response = await POSTNETWORK(url, payload, false);
            // console.log("[ChangePassword JobSeeker] Update Password response", response);

            const msg = (response?.message || "").toString();
            const isSuccess =
                response?.success === true ||
                response?.status === "success" ||
                /password\s*reset|changed\s*success/i.test(msg);

            if (isSuccess) {
                setToastMessage({
                    type: "success",
                    msg: msg || "Password reset successfully",
                    visible: true,
                });

                setShowForgotSection(false);
                resetAllFields();
            } else {
                setToastMessage({
                    type: "error",
                    msg: msg || "Reset failed",
                    visible: true,
                });
            }
        } catch (error) {
            // console.log("[ChangePassword JobSeeker] Update Password error", error);
            setToastMessage({
                type: "error",
                msg: "Error resetting password",
                visible: true,
            });
        }
    };


    const Container = Platform.OS === "ios" ? SafeAreaView : View;

    /* ---------- UI ---------- */
    return (
        <>
            <StatusBar backgroundColor={WHITE} barStyle="dark-content" />

            <Container style={{ flex: 1, backgroundColor: WHITE }}>
                <MyHeader
                    showBack
                    showCenterTitle
                    title="Change Password"
                    onBackPress={() => navigation.goBack()}
                />
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                >
                    <ScrollView
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={[BRANDCOLOR]}
                                tintColor={BRANDCOLOR}
                            />
                        }
                    >
                        <View style={styles.container}>

                            {/* OLD PASSWORD */}
                            <View style={styles.textInputView} key={`old-${resetKey}`}>
                                <TextInputComponent
                                    placeholder="Enter Your Old Password"
                                    type="password"
                                    inputdata={oldPassword}
                                    setInputdata={setOldPassword}
                                    image={PASSWORD}
                                    borderColor={BRANDCOLOR}
                                    showPassword={showOld}
                                    rightIcon={showOld ? VIEW : HIDE}
                                    onRightPress={() => setShowOld(!showOld)}
                                    width="95%"
                                />
                            </View>

                            {/* FORGOT PASSWORD */}
                            <TouchableOpacity
                                onPress={onForgotPasswordPress}
                                style={styles.forgotPasswordContainer}
                            >
                                <Text style={styles.forgotPasswordText}>
                                    Forgot Password?
                                </Text>
                            </TouchableOpacity>

                            {showForgotSection && (
                                <View style={styles.forgotSection}>
                                    <Text style={styles.title}>Reset via OTP</Text>

                                    <TextInputComponent
                                        placeholder="Enter Registered Email"
                                        type="email"
                                        inputdata={forgotEmail}
                                        setInputdata={setForgotEmail}
                                        image={PASSWORD}
                                        borderColor={BRANDCOLOR}
                                        width="100%"
                                        autoCapitalize="none"
                                    />

                                    {forgotStep === 1 && (
                                        <View style={{ width: '100%', marginTop: 12, alignItems: 'center' }}>
                                            <CustomButton
                                                text="Send OTP"
                                                onPress={handleProceedEmail}
                                                color={WHITE}
                                                width="70%"
                                            />
                                        </View>
                                    )}

                                    {forgotStep >= 2 && (
                                        <>
                                            <OtpInput
                                                onOtpChange={setOtpValue}
                                                value={otpValue}
                                            />

                                            {otpStatus ? (
                                                <Text
                                                    style={{
                                                        alignSelf: 'center',
                                                        color: otpStatus.toLowerCase().includes('verified') ? 'green' : '#333',
                                                        marginBottom: 8,
                                                        fontFamily: COMICSBOLD,
                                                    }}
                                                >
                                                    {otpStatus}
                                                </Text>
                                            ) : null}

                                            <View style={{ width: '100%', alignItems: 'center' }}>
                                                <Text style={{ marginVertical: 4, fontSize: 14, color: '#333' }}>
                                                    Time left: {otpTimer}s
                                                </Text>

                                                {resendCount > 0 && (
                                                    <Text style={{ marginBottom: 6, fontSize: 14, color: '#666' }}>
                                                        Resend attempts: {resendCount}/{MAX_RESEND_ATTEMPTS}
                                                    </Text>
                                                )}

                                                <CustomButton
                                                    text={otpTimer > 0 ? `Resend in ${otpTimer}s` : 'Resend OTP'}
                                                    onPress={handleResendOtp}
                                                    color={WHITE}
                                                    disabled={otpTimer > 0 || resendCount >= MAX_RESEND_ATTEMPTS || otpVerified}
                                                    width="60%"
                                                />
                                            </View>

                                            {otpVerified && (
                                                <Text style={styles.verifiedText}>OTP Verified Successfully</Text>
                                            )}
                                        </>
                                    )}

                                    {otpVerified && (
                                        <>
                                            <TextInputComponent
                                                placeholder="New Password"
                                                type="password"
                                                inputdata={newPassword}
                                                setInputdata={setNewPassword}
                                                image={PASSWORD}
                                                borderColor={BRANDCOLOR}
                                                showPassword={showNew}
                                                rightIcon={showNew ? VIEW : HIDE}
                                                onRightPress={() => setShowNew(!showNew)}
                                                width="100%"
                                            />

                                            <TextInputComponent
                                                placeholder="Confirm New Password"
                                                type="password"
                                                inputdata={confirmPassword}
                                                setInputdata={setConfirmPassword}
                                                image={PASSWORD}
                                                borderColor={BRANDCOLOR}
                                                showPassword={showConfirm}
                                                rightIcon={showConfirm ? VIEW : HIDE}
                                                onRightPress={() => setShowConfirm(!showConfirm)}
                                                width="100%"
                                            />

                                            <View style={{ width: '100%', marginTop: 12 }}>
                                                <CustomButton
                                                    text="Update Password"
                                                    onPress={handleForgotUpdatePassword}
                                                    color={WHITE}
                                                />
                                            </View>

                                            <TouchableOpacity
                                                onPress={() => setShowForgotSection(false)}
                                                style={{ marginTop: 10, alignItems: 'center' }}
                                            >
                                                <Text style={styles.forgotPasswordText}>Back to change password</Text>
                                            </TouchableOpacity>
                                        </>
                                    )}
                                </View>
                            )}

                            {/* NEW PASSWORD */}
                            <View style={styles.textInputView} key={`new-${resetKey}`}>
                                <TextInputComponent
                                    placeholder="Enter New Password"
                                    type="password"
                                    inputdata={newPassword}
                                    setInputdata={setNewPassword}
                                    image={PASSWORD}
                                    borderColor={BRANDCOLOR}
                                    showPassword={showNew}
                                    rightIcon={showNew ? VIEW : HIDE}
                                    onRightPress={() => setShowNew(!showNew)}
                                    width="95%"
                                />
                            </View>

                            {/* CONFIRM PASSWORD */}
                            <View style={styles.textInputView} key={`confirm-${resetKey}`}>
                                <TextInputComponent
                                    placeholder="Confirm New Password"
                                    type="password"
                                    inputdata={confirmPassword}
                                    setInputdata={setConfirmPassword}
                                    image={PASSWORD}
                                    borderColor={BRANDCOLOR}
                                    showPassword={showConfirm}
                                    rightIcon={showConfirm ? VIEW : HIDE}
                                    onRightPress={() =>
                                        setShowConfirm(!showConfirm)
                                    }
                                    width="95%"
                                />
                            </View>

                            {/* CENTER BUTTON */}
                            <View style={styles.buttonContainer}>
                                <CustomButton
                                    onPress={onChangePassword}
                                    text="Change Password"
                                    color={WHITE}
                                />
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </Container>

            {/* TOAST */}
            <ToastMessage
                message={toastMessage.msg}
                visible={toastMessage.visible}
                setVisible={({ visible }) =>
                    setToastMessage((prev) => ({ ...prev, visible }))
                }
                type={toastMessage.type}
                bacgroundColor={toastMessage.type === "success" ? "green" : "red"}
                textColor={WHITE}
                duration={3000}
                image={LOGO}
            />

            {/* CONFIRM ALERT */}
            <MyAlert
                visible={showConfirmAlert}
                title="Confirm"
                message="Are you sure you want to change your password?"
                textLeft="Cancel"
                textRight="Yes"
                showLeftButton
                showRightButton
                onPressLeft={() => setShowConfirmAlert(false)}
                onPressRight={changePasswordAPI}
            />
        </>
    );
};

export default ChangePasswordScreen;

/* ---------- STYLES ---------- */
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: WHITE,
        paddingHorizontal: WIDTH * 0.05,
        paddingTop: HEIGHT * 0.02,
    },
    textInputView: {
        height: HEIGHT * 0.07,
        width: "100%",
        marginBottom: HEIGHT * 0.02,
    },
    forgotPasswordContainer: {
        alignSelf: "flex-end",
        marginBottom: HEIGHT * 0.03,
        marginRight: WIDTH * 0.03,
    },
    forgotPasswordText: {
        color: BRANDCOLOR,
        fontSize: HEIGHT * 0.015,
        fontFamily: COMICSBOLD,
    },
    forgotSection: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 16,
        marginBottom: HEIGHT * 0.03,
        backgroundColor: '#FFFFFF',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
        color: BLACK,
        alignSelf: 'center',
    },
    verifiedText: {
        alignSelf: 'center',
        color: 'green',
        marginBottom: 10,
        fontFamily: COMICSBOLD,
    },
    buttonContainer: {
        marginTop: HEIGHT * 0.04,
        alignItems: "center",
    },
});