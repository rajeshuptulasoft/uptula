import React, { useState, useEffect, useCallback } from "react";
import {
    StatusBar,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    BackHandler,
    Image,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
    SafeAreaView,
    Modal,
} from "react-native";
import { useDispatch } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";

import { BLACK, BRANDCOLOR, WHITE } from "../../constant/color";
import {
    UBUNTUBOLD,
    FIRASANSSEMIBOLD,
    FIRASANS
} from "../../constant/fontPath";
import { TextInputComponent } from "../../components/commonComponents/TextInputComponent";
import {
    MAIL,
    PASSWORD,
    JOBSEEKER,
    HIDE,
    VIEW,
    LOGO,
    GOOGLE,
} from "../../constant/imagePath";
import { ToastMessage } from "../../components/commonComponents/ToastMessage";
import { CustomButton } from "../../components/commonComponents/Button";
import { MyAlert } from "../../components/commonComponents/MyAlert";
import { HEIGHT, WIDTH } from "../../constant/config";
import { storeObjByKey } from "../../utils/Storage";
import { checkuserToken } from "../../redux/actions/auth";
import { BASE_URL } from "../../constant/url";
import { POSTNETWORK } from "../../utils/Network";
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import { OtpInput } from "../../components/otpComponets/OtpInput";

const LoginScreen = ({ navigation }) => {
    const dispatch = useDispatch();

    /* ---------- STATES ---------- */
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [userType, setUserType] = useState("JobSeeker");
    const [isExitAlertVisible, setIsExitAlertVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState({
        type: "",
        msg: "",
        visible: false,
    });

    // ✅ ADD HERE ONLY (IMPORTANT)
    const [forgotModalVisible, setForgotModalVisible] = useState(false);
    const [forgotStep, setForgotStep] = useState(1);
    const [forgotEmail, setForgotEmail] = useState("");
    const [otpValue, setOtpValue] = useState("");
    const [generatedOtp, setGeneratedOtp] = useState("");
    const [otpTimer, setOtpTimer] = useState(0);
    const [resendCount, setResendCount] = useState(0);
    const [otpStatus, setOtpStatus] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const MAX_RESEND_ATTEMPTS = 5;

    // ✅ ADD YOUR PASSWORD TOGGLE STATES HERE
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [screenReady, setScreenReady] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);

    /* ---------- EFFECT ---------- */
    useEffect(() => {
        // Configure Google Sign-In
        GoogleSignin.configure({
            webClientId: '193282547247-o8ccoi23uh80eb4vnb8sdnit0hnvd10l.apps.googleusercontent.com',
            offlineAccess: true,
            scopes: ['profile', 'email'],
            forceCodeForRefreshToken: true,
        });

        if (Platform.OS === "android") {
            const backAction = () => {
                if (navigation.canGoBack()) {
                    navigation.goBack();
                    return true;
                }
                setIsExitAlertVisible(true);
                return true;
            };

            const subscription = BackHandler.addEventListener(
                "hardwareBackPress",
                backAction
            );

            return () => subscription.remove();
        }
    }, [navigation]);

    // Reset state when the screen is focused
    useFocusEffect(
        useCallback(() => {

            // ✅ Reset everything FIRST
            setForgotModalVisible(false);
            setForgotStep(1);

            setEmail("");
            setPassword("");
            setShowPassword(false);
            setUserType("JobSeeker");
            setIsExitAlertVisible(false);
            setToastMessage({
                type: "",
                msg: "",
                visible: false,
            });

            // ✅ Allow UI after reset
            setTimeout(() => {
                setScreenReady(true);
            }, 0);

            return () => {
                setScreenReady(false);
            };

        }, [])
    );

    /* ---------- ACTIONS ---------- */
    const onForgotPasswordPress = () => {
        // ✅ Open modal
        setForgotModalVisible(true);
        setForgotStep(1);
        setForgotEmail("");
        setOtpValue("");
        setGeneratedOtp("");
        setOtpTimer(0);
        setResendCount(0);
        setOtpStatus("");
        setOtpVerified(false);

        // // ✅ Show toast (optional)
        // setToastMessage({
        //     type: "info",
        //     msg: "Enter your registered email",
        //     visible: true,
        // });
    };

    // const handleProceedEmail = () => {
    //     if (!forgotEmail) {
    //         setToastMessage({
    //             type: "error",
    //             msg: "Please enter email",
    //             visible: true,
    //         });
    //         return;
    //     }
    //     setForgotStep(2);
    // };

    const generate6DigitOtp = () => {
        return Math.floor(100000 + Math.random() * 900000).toString();
    };

    // const startOtpProcess = (isResend = false) => {
    //     if (!forgotEmail) {
    //         setToastMessage({
    //             type: "error",
    //             msg: "Please enter email or mobile number",
    //             visible: true,
    //         });
    //         return;
    //     }

    //     if (isResend && resendCount >= MAX_RESEND_ATTEMPTS) {
    //         setOtpStatus("Maximum resend attempts reached. Please try later.");
    //         setToastMessage({
    //             type: "error",
    //             msg: "Maximum resend attempts reached.",
    //             visible: true,
    //         });
    //         return;
    //     }

    //     const otp = generate6DigitOtp();

    //     setGeneratedOtp(otp);
    //     setOtpValue("");
    //     setOtpVerified(false);
    //     setOtpStatus("OTP sent. Enter the 6-digit code.");
    //     setOtpTimer(60);
    //     setForgotStep(2);

    //     setResendCount((prev) => (isResend ? prev + 1 : prev));

    //     setToastMessage({
    //         type: "success",
    //         msg: `OTP sent: ${otp}`,
    //         visible: true,
    //     });

    //     console.log("Forgot Password OTP:", otp);
    // };

    // const handleProceedEmail = () => startOtpProcess(false);
    // const handleResendOtp = () => {
    //     if (otpVerified) return;
    //     if (otpTimer > 0) {
    //         setToastMessage({
    //             type: "error",
    //             msg: "Please wait until countdown ends before resending",
    //             visible: true,
    //         });
    //         return;
    //     }
    //     startOtpProcess(true);
    // };

    const startOtpProcess = async (isResend = false) => {
        if (!forgotEmail) {
            setToastMessage({
                type: "error",
                msg: "Please enter email",
                visible: true,
            });
            console.log("[ForgotPassword] startOtpProcess failed: forgotEmail missing");
            return;
        }

        if (isResend && resendCount >= MAX_RESEND_ATTEMPTS) {
            setOtpStatus("Maximum resend attempts reached. Please try later.");
            setToastMessage({
                type: "error",
                msg: "Maximum resend attempts reached.",
                visible: true,
            });
            console.log("[ForgotPassword] startOtpProcess blocked: max resend attempts reached", { resendCount, MAX_RESEND_ATTEMPTS });
            return;
        }

        try {
            const url = isResend
                ? `${BASE_URL}resend-otp`
                : `${BASE_URL}auth/forgot-password`;

            const payload = {
                email: forgotEmail,
            };

            console.log("[ForgotPassword] startOtpProcess calling API", { url, payload, isResend });
            const response = await POSTNETWORK(url, payload, false);
            console.log("[ForgotPassword] startOtpProcess response", response);

            if (response?.success || response?.message) {
                setOtpValue("");
                setOtpVerified(false);
                setOtpStatus("OTP sent. Enter the 6-digit code.");
                setOtpTimer(60);
                setForgotStep(2);

                // increase resend count only when resend
                if (isResend) {
                    setResendCount((prev) => prev + 1);
                }

                setToastMessage({
                    type: "success",
                    msg: isResend
                        ? "OTP resent successfully"
                        : "OTP sent to your email",
                    visible: true,
                });

                console.log("[ForgotPassword] OTP send success", { email: forgotEmail, isResend });
            } else {
                setToastMessage({
                    type: "error",
                    msg: response?.message || "Failed to send OTP",
                    visible: true,
                });
                console.log("[ForgotPassword] OTP send failed", { response });
            }

        } catch (error) {
            setToastMessage({
                type: "error",
                msg: "Error sending OTP",
                visible: true,
            });
            console.log("[ForgotPassword] startOtpProcess error", error);
        }
    };

    // 👉 SAME FUNCTION CALL (NO CHANGE)
    const handleProceedEmail = () => startOtpProcess(false);

    // 👉 UPDATED RESEND FUNCTION
    // const handleResendOtp = () => {
    //     if (otpVerified) return;

    //     if (otpTimer > 0) {
    //         setToastMessage({
    //             type: "error",
    //             msg: "Please wait until countdown ends before resending",
    //             visible: true,
    //         });
    //         return;
    //     }

    //     startOtpProcess(true);
    // };

    const handleResendOtp = async () => {
        if (otpTimer > 0) {
            console.log("[ForgotPassword] resend blocked, timer active", { otpTimer });
            return;
        }

        try {
            const url = `${BASE_URL}resend-otp`;
            const payload = { email: forgotEmail };

            console.log("[ForgotPassword] handleResendOtp calling API", { url, payload });
            const response = await POSTNETWORK(url, payload, false);
            console.log("[ForgotPassword] handleResendOtp response", response);

            if (response?.success || response?.message) {
                setOtpTimer(60);

                setToastMessage({
                    type: "success",
                    msg: "OTP resent successfully",
                    visible: true,
                });
                console.log("[ForgotPassword] OTP resent", { email: forgotEmail });
            } else {
                setToastMessage({
                    type: "error",
                    msg: response?.message || "Failed to resend OTP",
                    visible: true,
                });
                console.log("[ForgotPassword] resend OTP failed", { response });
            }

        } catch (error) {
            setToastMessage({
                type: "error",
                msg: "Error resending OTP",
                visible: true,
            });
            console.log("[ForgotPassword] handleResendOtp error", error);
        }
    };

    // const handleSubmitOtp = () => {
    //     if (otpValue.length !== 4) {
    //         setToastMessage({
    //             type: "error",
    //             msg: "Enter valid OTP",
    //             visible: true,
    //         });
    //         return;
    //     }
    //     setForgotStep(3);
    // };

    // useEffect(() => {
    //     if (otpValue.length === 6) {
    //         if (otpValue === generatedOtp) {
    //             setOtpVerified(true);
    //             setOtpStatus("OTP verified successfully.");
    //             setToastMessage({
    //                 type: "success",
    //                 msg: "OTP Verified Successfully",
    //                 visible: true,
    //             });
    //         } else {
    //             setOtpVerified(false);
    //             setOtpStatus("Invalid OTP. Please try again.");
    //             setToastMessage({
    //                 type: "error",
    //                 msg: "Invalid OTP. Please try again.",
    //                 visible: true,
    //             });
    //         }
    //     } else {
    //         if (otpVerified) {
    //             setOtpVerified(false);
    //         }
    //     }
    // }, [otpValue, generatedOtp]);


    useEffect(() => {
        const verifyOtp = async () => {
            if (otpValue.length === 6) {
                try {
                    const url = `${BASE_URL}auth/verify-otp`;
                    const payload = { email: forgotEmail, otp: otpValue };

                    console.log("[ForgotPassword] verifyOtp calling API", { url, payload });
                    const response = await POSTNETWORK(url, payload, false);
                    console.log("[ForgotPassword] verifyOtp response", response);

                    if (response?.success || response?.message) {
                        setOtpVerified(true);
                        setOtpStatus("OTP Verified Successfully");

                        setToastMessage({
                            type: "success",
                            msg: "OTP Verified Successfully",
                            visible: true,
                        });

                        console.log("[ForgotPassword] OTP verification success", { email: forgotEmail });
                    } else {
                        setOtpVerified(false);
                        setOtpStatus("Invalid OTP");

                        setToastMessage({
                            type: "error",
                            msg: "Invalid OTP",
                            visible: true,
                        });

                        console.log("[ForgotPassword] OTP verification failed", { response });
                    }
                } catch (error) {
                    setToastMessage({
                        type: "error",
                        msg: "OTP verification failed",
                        visible: true,
                    });
                    console.log("[ForgotPassword] verifyOtp error", error);
                }
            }
        };

        verifyOtp();
    }, [otpValue]);

    useEffect(() => {
        if (otpTimer <= 0) {
            return;
        }

        const timerId = setTimeout(() => {
            setOtpTimer((prev) => Math.max(prev - 1, 0));
        }, 1000);

        return () => clearTimeout(timerId);
    }, [otpTimer]);

    // const handleResetPassword = () => {
    //     if (!newPassword || !confirmPassword) {
    //         setToastMessage({
    //             type: "error",
    //             msg: "Enter all fields",
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

    //     setToastMessage({
    //         type: "success",
    //         msg: "Password Reset Successfully",
    //         visible: true,
    //     });

    //     setForgotModalVisible(false);
    // };


    const handleResetPassword = async () => {
        if (!newPassword || !confirmPassword) {
            setToastMessage({
                type: "error",
                msg: "Enter all fields",
                visible: true,
            });
            console.log("[ForgotPassword] handleResetPassword failed: empty password fields");
            return;
        }

        if (newPassword !== confirmPassword) {
            setToastMessage({
                type: "error",
                msg: "Passwords do not match",
                visible: true,
            });
            console.log("[ForgotPassword] handleResetPassword failed: passwords mismatch");
            return;
        }

        try {
            const url = `${BASE_URL}auth/reset-password`;
            const payload = {
                email: forgotEmail,
                newPassword,
                confirmPassword,
            };

            console.log("[ForgotPassword] handleResetPassword calling API", { url, payload });
            const response = await POSTNETWORK(url, payload, false);
            console.log("[ForgotPassword] handleResetPassword response", response);

            if (response?.success || response?.message) {
                setToastMessage({
                    type: "success",
                    msg: "Password reset successful",
                    visible: true,
                });

                console.log("[ForgotPassword] password reset success", { email: forgotEmail });
                setForgotModalVisible(false);
            } else {
                setToastMessage({
                    type: "error",
                    msg: response?.message || "Reset failed",
                    visible: true,
                });
                console.log("[ForgotPassword] password reset failed", { response });
            }

        } catch (error) {
            setToastMessage({
                type: "error",
                msg: "Error resetting password",
                visible: true,
            });
            console.log("[ForgotPassword] handleResetPassword error", error);
        }
    };

    const onExitApp = () => {
        setIsExitAlertVisible(false);
        BackHandler.exitApp();
    };

    const onAlertClose = () => {
        setIsExitAlertVisible(false);
    };

    const onRegisterNavigate = () => {
        navigation.navigate("Register");
    };

    // const onGoogleLogin = async () => {
    //     try {
    //         await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    //         await GoogleSignin.signOut(); // optional but safe

    //         const userInfo = await GoogleSignin.signIn();

    //         // ✅ FIX: correct way to get idToken
    //         const { idToken } = await GoogleSignin.getTokens();

    //         if (!idToken) {
    //             throw new Error("No ID token found");
    //         }

    //         // ✅ FIX: proper credential creation
    //         const googleCredential = auth.GoogleAuthProvider.credential(idToken);

    //         const userCredential = await auth().signInWithCredential(googleCredential);

    //         const user = userCredential.user;
    //         const token = await user.getIdToken();

    //         const loginDataToStore = {
    //             token: token,
    //             role: userType === "JobSeeker" ? "JobSeeker" : "JobProvider",
    //             userType: userType,
    //             user: {
    //                 uid: user.uid,
    //                 email: user.email,
    //                 displayName: user.displayName,
    //                 photoURL: user.photoURL,
    //                 emailVerified: user.emailVerified,
    //             },
    //         };

    //         await storeObjByKey("loginResponse", loginDataToStore);

    //         setToastMessage({
    //             type: "success",
    //             msg: "Google login successful!",
    //             visible: true,
    //         });

    //         dispatch(checkuserToken());

    //     } catch (error) {
    //         console.error("Google Sign-In error:", error);

    //         let errorMessage = "Google sign-in failed. Please try again.";

    //         if (error.code === 'SIGN_IN_CANCELLED') {
    //             errorMessage = "Google sign-in was cancelled.";
    //         } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
    //             errorMessage = "Google Play Services not available.";
    //         } else if (error.code === 'DEVELOPER_ERROR') {
    //             errorMessage = "Fix SHA-1 / webClientId in Firebase.";
    //         }

    //         setToastMessage({
    //             type: "error",
    //             msg: errorMessage,
    //             visible: true,
    //         });
    //     }
    // };

    const onGoogleLogin = async () => {
        console.log("🔵 Google Login Started");

        try {
            console.log("🟡 Checking Google Play Services...");
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
            console.log("✅ Play Services OK");

            console.log("🟡 Signing out previous session...");
            await GoogleSignin.signOut();

            console.log("🟡 Signing in with Google...");
            await GoogleSignin.signIn();
            console.log("✅ Google Sign-In Success");

            console.log("🟡 Fetching Google ID Token...");
            const { idToken } = await GoogleSignin.getTokens();

            if (!idToken) {
                console.log("❌ ERROR: No ID Token received");
                throw new Error("No ID token found");
            }
            console.log("✅ ID Token received");

            console.log("🟡 Creating Firebase credential...");
            const googleCredential = auth.GoogleAuthProvider.credential(idToken);

            console.log("🟡 Signing into Firebase...");
            const userCredential = await auth().signInWithCredential(googleCredential);
            console.log("✅ Firebase login success");

            const user = userCredential.user;
            console.log("👤 Firebase User:", user);

            console.log("🟡 Getting Firebase ID token...");
            const firebaseToken = await user.getIdToken();
            console.log("✅ Firebase Token:", firebaseToken);

            console.log("🟡 Sending token to backend...");
            const response = await fetch(`${BASE_URL}auth/firebase`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: firebaseToken,
                    role: userType === "JobSeeker" ? "JobSeeker" : "JobProvider"
                })
            });

            console.log("📡 API Response Status:", response.status);

            const data = await response.json();
            console.log("📡 API Response Data:", data);

            if (response.ok) {
                console.log("✅ Backend authentication success");

                const loginDataToStore = {
                    token: data.token,
                    role: data.user?.role,
                    userType: data.user?.role,
                    user: {
                        ...data.user,
                        displayName: data.user?.displayName || user.displayName || '',
                        photoURL: data.user?.photoURL || user.photoURL || '',
                    },
                };

                console.log("💾 Storing login data...");
                await storeObjByKey("loginResponse", loginDataToStore);
                console.log("✅ Data stored successfully");

                setToastMessage({
                    type: "success",
                    msg: "Google login successful!",
                    visible: true,
                });

                dispatch(checkuserToken());

                console.log("🧭 Navigating user...");
                if (userType === "JobProvider") {
                    navigation.navigate("EmployerProfile");
                } else {
                    navigation.navigate("Profile");
                }

            } else {
                console.log("❌ Backend error:", data?.message);

                setToastMessage({
                    type: "error",
                    msg: data?.message || "Google sign-in failed",
                    visible: true,
                });
            }

        } catch (error) {
            console.log("🔥 Google Login Error:", error);
            console.log("🔥 Error Code:", error.code);
            console.log("🔥 Error Message:", error.message);

            let errorMessage = "Google sign-in failed. Please try again.";

            if (error.code === 'SIGN_IN_CANCELLED') {
                errorMessage = "Google sign-in was cancelled.";
            } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
                errorMessage = "Google Play Services not available.";
            } else if (error.code === 'DEVELOPER_ERROR') {
                errorMessage = "Fix SHA-1 / Firebase config.";
            }

            setToastMessage({
                type: "error",
                msg: errorMessage,
                visible: true,
            });
        } finally {
            console.log("🔵 Google Login Finished");
        }
    };


    /* ---------- API LOGIN ---------- */
    // const onLogin = async () => {
    //     if (!email || !password) {
    //         setToastMessage({
    //             type: "error",
    //             msg: "Please enter both email and password",
    //             visible: true,
    //         });
    //         return;
    //     }

    //     // We accept email or mobile number, no forced @gmail.com validation
    //     // (as per requirement)

    //     try {
    //         const url = `${BASE_URL}auth/login`;
    //         const payload = {
    //             email: email,
    //             password: password,
    //         };

    //         // console.log("Login request:", { url, payload });

    //         POSTNETWORK(url, payload, false)
    //             .then((result) => {
    //                 // console.log("Login response:", result);

    //                 // Check if token exists in response (successful login)
    //                 if (result?.token) {
    //                     // console.log("Login successful! Token received.");

    //                     // Transform response to include role at top level for navigation
    //                     const loginDataToStore = {
    //                         token: result.token,
    //                         role: result?.user?.role || result?.role || null, // Extract role from user object
    //                         userType: result?.user?.role || result?.role || null, // Also store as userType for compatibility
    //                         user: result.user || {},
    //                         ...result, // Include all other properties
    //                     };

    //                     // console.log("Login data to store:", loginDataToStore);

    //                     // Store login response with token and user data
    //                     storeObjByKey("loginResponse", loginDataToStore)
    //                         .then(() => {
    //                             // console.log("Login response stored successfully:", loginDataToStore);
    //                             setToastMessage({
    //                                 type: "success",
    //                                 msg: "Login successful!",
    //                                 visible: true,
    //                             });
    //                             // Update auth status to trigger navigation switch to AuthNavigation
    //                             dispatch(checkuserToken());
    //                         })
    //                         .catch((error) => {
    //                             // console.error("Error storing login response:", error);
    //                             setToastMessage({
    //                                 type: "error",
    //                                 msg: "Failed to save login data. Please try again.",
    //                                 visible: true,
    //                             });
    //                         });
    //                 } else {
    //                     // Login failed - no token in response
    //                     // console.error("Login failed: No token in response", result);
    //                     setToastMessage({
    //                         type: "error",
    //                         msg: result?.message || "Login failed. Please check your credentials.",
    //                         visible: true,
    //                     });
    //                 }
    //             })
    //             .catch((error) => {
    //                 // console.error("Login error:", error);
    //                 setToastMessage({
    //                     type: "error",
    //                     msg: "Failed to login. Please check your connection and try again.",
    //                     visible: true,
    //                 });
    //             });
    //     } catch (error) {
    //         // console.error("Login exception:", error);
    //         setToastMessage({
    //             type: "error",
    //             msg: "An error occurred during login. Please try again.",
    //             visible: true,
    //         });
    //     }
    // };


    const onLogin = async () => {
        if (!email || !password) {
            setToastMessage({
                type: "error",
                msg: "Please enter email/phone and password",
                visible: true,
            });
            return;
        }

        // Detect input type
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        const isPhone = /^[0-9]{10}$/.test(email);

        if (!isEmail && !isPhone) {
            setToastMessage({
                type: "error",
                msg: "Enter valid email or 10-digit mobile number",
                visible: true,
            });
            return;
        }

        try {
            const url = `${BASE_URL}auth/login`;

            // Dynamic payload
            const payload = {
                password: password,
                ...(isEmail
                    ? { email: email }
                    : { phone: email })
            };

            console.log("Login request:", { url, payload });

            POSTNETWORK(url, payload, false)
                .then((result) => {

                    if (result?.token) {

                        const loginDataToStore = {
                            token: result.token,
                            role: result?.user?.role || result?.role || null,
                            userType: result?.user?.role || result?.role || null,
                            user: result.user || {},
                            ...result,
                        };

                        storeObjByKey("loginResponse", loginDataToStore)
                            .then(() => {
                                setToastMessage({
                                    type: "success",
                                    msg: "Login successful!",
                                    visible: true,
                                });

                                dispatch(checkuserToken());
                            })
                            .catch(() => {
                                setToastMessage({
                                    type: "error",
                                    msg: "Failed to save login data",
                                    visible: true,
                                });
                            });

                    } else {
                        setToastMessage({
                            type: "error",
                            msg: result?.message || "Invalid credentials",
                            visible: true,
                        });
                    }
                })
                .catch(() => {
                    setToastMessage({
                        type: "error",
                        msg: "Network error. Please try again",
                        visible: true,
                    });
                });

        } catch (error) {
            setToastMessage({
                type: "error",
                msg: "Something went wrong",
                visible: true,
            });
        }
    };

    /* ---------- UI ---------- */
    const Container = Platform.OS === "ios" ? SafeAreaView : View;

    return (
        <>
            <StatusBar
                backgroundColor={WHITE}
                barStyle={Platform.OS === "ios" ? "dark-content" : "dark-content"}
                translucent={Platform.OS === "android"}
            />

            <Container style={{ flex: 1, backgroundColor: WHITE }}>
                <KeyboardAvoidingView
                    style={{ flex: 1, backgroundColor: WHITE }}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
                >
                    <ScrollView
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={{ flexGrow: 1 }}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={[
                            styles.container,
                            Platform.OS === "ios" && styles.containerIOS,
                            Platform.OS === "android" && styles.containerAndroid
                        ]}>
                            {/* LOGO */}
                            <Image source={LOGO} style={[
                                styles.logo,
                                Platform.OS === "ios" && styles.logoIOS,
                                Platform.OS === "android" && styles.logoAndroid
                            ]} />

                            {/* LOGIN TEXT */}
                            <Text style={[
                                styles.headerText,
                                Platform.OS === "ios" && styles.headerTextIOS,
                                Platform.OS === "android" && styles.headerTextAndroid
                            ]}>Login</Text>

                            {/* USER TYPE */}
                            <View style={[
                                styles.userTypeContainer,
                                Platform.OS === "ios" && styles.userTypeContainerIOS,
                                Platform.OS === "android" && styles.userTypeContainerAndroid
                            ]}>
                                <TouchableOpacity
                                    onPress={() => setUserType("JobSeeker")}
                                    style={[
                                        styles.userTypeButton,
                                        Platform.OS === "ios" && styles.userTypeButtonIOS,
                                        Platform.OS === "android" && styles.userTypeButtonAndroid,
                                        userType === "JobSeeker" && styles.userTypeButtonActive,
                                    ]}
                                >
                                    <Image
                                        source={JOBSEEKER}
                                        style={[
                                            styles.userIcon,
                                            Platform.OS === "ios" && styles.userIconIOS,
                                            Platform.OS === "android" && styles.userIconAndroid,
                                            userType === "JobSeeker" && styles.userIconActive,
                                        ]}
                                    />
                                    <Text
                                        style={[
                                            styles.userTypeText,
                                            Platform.OS === "ios" && styles.userTypeTextIOS,
                                            Platform.OS === "android" && styles.userTypeTextAndroid,
                                            userType === "JobSeeker" && styles.userTypeTextActive,
                                        ]}
                                    >
                                        Job Seeker
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => setUserType("JobProvider")}
                                    style={[
                                        styles.userTypeButton,
                                        Platform.OS === "ios" && styles.userTypeButtonIOS,
                                        Platform.OS === "android" && styles.userTypeButtonAndroid,
                                        userType === "JobProvider" && styles.userTypeButtonActive,
                                    ]}
                                >
                                    <Image
                                        source={JOBSEEKER}
                                        style={[
                                            styles.userIcon,
                                            Platform.OS === "ios" && styles.userIconIOS,
                                            Platform.OS === "android" && styles.userIconAndroid,
                                            userType === "JobProvider" && styles.userIconActive,
                                        ]}
                                    />
                                    <Text
                                        style={[
                                            styles.userTypeText,
                                            Platform.OS === "ios" && styles.userTypeTextIOS,
                                            Platform.OS === "android" && styles.userTypeTextAndroid,
                                            userType === "JobProvider" && styles.userTypeTextActive,
                                        ]}
                                    >
                                        Job Provider
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* SPACING */}
                            <View style={{ height: HEIGHT * 0.025 }} />

                            {/* INPUTS */}
                            <View style={styles.childContainer}>
                                <View style={[
                                    styles.textInputView,
                                    Platform.OS === "ios" && styles.textInputViewIOS,
                                    Platform.OS === "android" && styles.textInputViewAndroid
                                ]}>
                                    <TextInputComponent
                                        placeholder="Enter Your Email or Mobile Number"
                                        type="email"
                                        inputdata={email}
                                        setInputdata={setEmail}
                                        image={MAIL}
                                        borderColor={BRANDCOLOR}
                                        autoCapitalize="none"
                                        width="95%"
                                    />
                                </View>

                                <View style={{ height: Platform.OS === "ios" ? HEIGHT * 0.04 : HEIGHT * 0.035 }} />

                                <View style={[
                                    styles.textInputView,
                                    Platform.OS === "ios" && styles.textInputViewIOS,
                                    Platform.OS === "android" && styles.textInputViewAndroid
                                ]}>
                                    <TextInputComponent
                                        placeholder="Enter Your Password"
                                        type="password"
                                        inputdata={password}
                                        setInputdata={setPassword}
                                        image={PASSWORD}
                                        borderColor={BRANDCOLOR}
                                        showPassword={showPassword}
                                        rightIcon={showPassword ? VIEW : HIDE}
                                        onRightPress={() => setShowPassword(!showPassword)}
                                        width="95%"
                                        autoCapitalize="none"
                                    />
                                </View>

                                <View style={{ height: HEIGHT * 0.02 }} />

                                {/* FORGOT PASSWORD */}
                                <TouchableOpacity
                                    onPress={onForgotPasswordPress}
                                    style={[
                                        styles.forgotPasswordContainer,
                                        Platform.OS === "ios" && styles.forgotPasswordContainerIOS,
                                        Platform.OS === "android" && styles.forgotPasswordContainerAndroid
                                    ]}
                                >
                                    <Text style={[
                                        styles.forgotPasswordText,
                                        Platform.OS === "ios" && styles.forgotPasswordTextIOS,
                                        Platform.OS === "android" && styles.forgotPasswordTextAndroid
                                    ]}>
                                        Forgot Password?
                                    </Text>
                                </TouchableOpacity>

                                <View style={{ height: Platform.OS === "ios" ? HEIGHT * 0.04 : HEIGHT * 0.035 }} />

                                {/* LOGIN BUTTON */}
                                <CustomButton onPress={onLogin} text="Login" color={WHITE} />

                                <View style={{ height: HEIGHT * 0.02 }} />

                                {/* OR SEPARATOR */}
                                <View style={styles.orContainer}>
                                    <View style={styles.orLine} />
                                    <Text style={styles.orText}>OR</Text>
                                    <View style={styles.orLine} />
                                </View>

                                {/* GOOGLE LOGIN */}
                                <TouchableOpacity
                                    style={[
                                        styles.googleButton,
                                        Platform.OS === "ios" && styles.googleButtonIOS,
                                        Platform.OS === "android" && styles.googleButtonAndroid,
                                    ]}
                                    onPress={onGoogleLogin}
                                    activeOpacity={0.85}
                                >
                                    <Image source={GOOGLE} style={styles.googleIcon} />
                                    <Text style={styles.googleButtonText}>Continue with Google Account</Text>
                                </TouchableOpacity>

                                <View style={{ height: HEIGHT * 0.02 }} />

                                {/* REGISTER */}
                                <TouchableOpacity
                                    onPress={onRegisterNavigate}
                                    style={[
                                        styles.registerContainer,
                                        Platform.OS === "ios" && styles.registerContainerIOS,
                                        Platform.OS === "android" && styles.registerContainerAndroid
                                    ]}
                                >
                                    <Text style={[
                                        styles.registerText,
                                        Platform.OS === "ios" && styles.registerTextIOS,
                                        Platform.OS === "android" && styles.registerTextAndroid
                                    ]}>
                                        Don't Have an account ?
                                        <Text style={styles.registerHighlight}> Register</Text>
                                    </Text>
                                </TouchableOpacity>
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
                bacgroundColor={toastMessage.type === "success" ? "green" : "red"}
                textColor={WHITE}
                type={toastMessage.type}
                duration={3000}
                image={LOGO}
            />

            {/* EXIT ALERT */}
            <MyAlert
                visible={isExitAlertVisible}
                title="Exit App"
                message="Are you sure you want to exit?"
                textRight="Yes"
                textLeft="Cancel"
                showRightButton
                showLeftButton
                onPressRight={onExitApp}
                onPressLeft={onAlertClose}
            />

            {screenReady && (
                <Modal
                    statusBarTranslucent={true}
                    visible={forgotModalVisible}
                    transparent={false}
                    animationType="slide"
                    presentationStyle="fullScreen"
                    hardwareAccelerated
                    onRequestClose={() => setForgotModalVisible(false)}
                >
                    <View style={styles.modalContainerFull}>
                        <ScrollView
                            contentContainerStyle={{
                                flexGrow: 1,
                                width: "100%",
                                alignItems: "center",
                                paddingBottom: 40,
                            }}
                            keyboardShouldPersistTaps="handled"
                            keyboardDismissMode="interactive"
                            showsVerticalScrollIndicator={false}
                        >
                            {/* STEP 1 */}
                            {/* {forgotStep === 1 && (
                                <View style={styles.stepContainer}>
                                    <Text style={styles.title}>Enter Email</Text>

                                    <TextInputComponent
                                        placeholder="Enter Registered Email"
                                        inputdata={forgotEmail}
                                        setInputdata={setForgotEmail}
                                        image={MAIL}
                                        borderColor={BRANDCOLOR}
                                        width="92%"
                                        keyboardType={email}
                                        autoCapitalize="none"
                                    />

                                    <View style={styles.buttonContainer}>
                                        <CustomButton
                                            text="Send OTP"
                                            color={WHITE}
                                            onPress={handleProceedEmail}
                                        />
                                    </View>
                                </View>
                            )}

                            {/* STEP 2 */}
                            {/* {forgotStep === 2 && (
                                <View style={styles.stepContainer}>
                                    <Text style={styles.title}>Enter OTP</Text>

                                    <OtpInput onOtpChange={setOtpValue} />

                                    <View style={styles.buttonContainer}>
                                        <CustomButton
                                            color={WHITE}
                                            text="Submit OTP"
                                            onPress={handleSubmitOtp}
                                        />
                                    </View>
                                </View>
                            )} */}

                            {/* STEP 3 */}
                            {/* {forgotStep === 3 && (
                                <View style={styles.stepContainer}>
                                    <Text style={styles.title}>Reset Password</Text>

                                    <TextInputComponent
                                        borderColor={BRANDCOLOR}
                                        width="92%"
                                        placeholder="New Password"
                                        inputdata={newPassword}
                                        setInputdata={setNewPassword}
                                        image={PASSWORD}
                                        type="password"
                                        showPassword={showNewPassword}
                                        rightIcon={showNewPassword ? VIEW : HIDE}
                                        onRightPress={() => setShowNewPassword(!showNewPassword)}
                                    />

                                    <View style={{ height: 10 }} />

                                    <TextInputComponent
                                        borderColor={BRANDCOLOR}
                                        width="92%"
                                        placeholder="Confirm Password"
                                        inputdata={confirmPassword}
                                        setInputdata={setConfirmPassword}
                                        image={PASSWORD}
                                        type="password"
                                        showPassword={showConfirmPassword}
                                        rightIcon={showConfirmPassword ? VIEW : HIDE}
                                        onRightPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                    />

                                    <View style={styles.buttonContainer}>
                                        <CustomButton
                                            color={WHITE}
                                            text="Submit"
                                            onPress={handleResetPassword}
                                        />
                                    </View>
                                </View>
                            )} */}




                            {/* CANCEL BUTTON */}
                            {/* <TouchableOpacity
                            onPress={() => setForgotModalVisible(false)}
                            style={styles.cancelButton}
                        >
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity> */}

                            {/* <View style={styles.buttonContainer}>
                                <CustomButton
                                    color={WHITE}
                                    text="Cancel"
                                    onPress={() => setForgotModalVisible(false)}
                                />
                            </View>


                        </View> */}


                            {/* ❌ CLOSE ICON */}
                            <TouchableOpacity
                                style={{ alignSelf: "flex-end" }}
                                onPress={() => setForgotModalVisible(false)}
                            >
                                <Text style={{ fontSize: 22 }}>✕</Text>
                            </TouchableOpacity>

                            <Text style={styles.title}>Forgot Password</Text>

                            {/* EMAIL */}
                            <TextInputComponent
                                placeholder="Enter Registered Email"
                                inputdata={forgotEmail}
                                setInputdata={setForgotEmail}
                                image={MAIL}
                                borderColor={BRANDCOLOR}
                                width="100%"
                                autoCapitalize="none"
                            />

                            {forgotStep === 1 && (
                                <>
                                    <View style={{ height: 16 }} />
                                    <CustomButton text="Send OTP" onPress={handleProceedEmail} />
                                </>
                            )}

                            {/* OTP */}
                            {forgotStep >= 2 && (
                                <>
                                    <OtpInput onOtpChange={setOtpValue} />

                                    {otpStatus ? (
                                        <Text
                                            style={{
                                                color: otpStatus.toLowerCase().includes("invalid")
                                                    ? "red"
                                                    : "green",
                                                marginTop: 10,
                                            }}
                                        >
                                            {otpStatus}
                                        </Text>
                                    ) : null}

                                    <Text style={{ marginTop: 8, fontSize: 14, color: "#333" }}>
                                        Time left: {otpTimer}s
                                    </Text>

                                    {resendCount > 0 && (
                                        <Text style={{ marginTop: 4, fontSize: 14, color: "#666" }}>
                                            Resend attempts: {resendCount}/{MAX_RESEND_ATTEMPTS}
                                        </Text>
                                    )}

                                    <View style={{ height: 8 }} />

                                    <CustomButton
                                        text={otpTimer > 0 ? `Resend OTP in ${otpTimer}s` : "Resend OTP"}
                                        onPress={handleResendOtp}
                                        color={WHITE}
                                        disabled={otpTimer > 0 || resendCount >= MAX_RESEND_ATTEMPTS || otpVerified}
                                    />

                                    {otpVerified && (
                                        <Text style={{ color: "green", marginTop: 10 }}>
                                            ✔ OTP Verified Successfully
                                        </Text>
                                    )}
                                </>
                            )}

                            {/* PASSWORD */}
                            {otpVerified && (
                                <>
                                    <TextInputComponent
                                        placeholder="New Password"
                                        inputdata={newPassword}
                                        setInputdata={setNewPassword}
                                        image={PASSWORD}
                                        type="password"
                                        showPassword={showNewPassword}
                                        rightIcon={showNewPassword ? VIEW : HIDE}
                                        onRightPress={() => setShowNewPassword(!showNewPassword)}
                                        width="100%"
                                    />

                                    <TextInputComponent
                                        placeholder="Confirm Password"
                                        inputdata={confirmPassword}
                                        setInputdata={setConfirmPassword}
                                        image={PASSWORD}
                                        type="password"
                                        showPassword={showConfirmPassword}
                                        rightIcon={showConfirmPassword ? VIEW : HIDE}
                                        onRightPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                        width="100%"
                                    />

                                    <View style={{ height: 16 }} />

                                    <CustomButton text="Update Password" onPress={handleResetPassword} />

                                    <View style={{ height: 12 }} />

                                    <TouchableOpacity
                                        onPress={() => setForgotModalVisible(false)}
                                        style={styles.forgotPasswordContainer}
                                    >
                                        <Text style={styles.forgotPasswordText}>Back To Login</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </ScrollView>
                    </View>
                </Modal>
            )}
        </>
    );
};

export default LoginScreen;

/* ---------- STYLES ---------- */
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: WHITE,
        paddingHorizontal: WIDTH * 0.05,
        justifyContent: "flex-start",
        paddingTop: HEIGHT * 0.06,
    },
    containerIOS: {
        paddingTop: Platform.OS === "ios" ? HEIGHT * 0.08 : HEIGHT * 0.06,
    },
    containerAndroid: {
        paddingTop: Platform.OS === "android" ? HEIGHT * 0.05 : HEIGHT * 0.06,
    },
    logo: {
        width: 200,
        height: 150,
        resizeMode: "contain",
        alignSelf: "center",
        marginBottom: HEIGHT * 0.02,
    },
    logoIOS: {
        width: Platform.OS === "ios" ? 220 : 200,
        height: Platform.OS === "ios" ? 165 : 150,
        marginBottom: Platform.OS === "ios" ? HEIGHT * 0.025 : HEIGHT * 0.02,
    },
    logoAndroid: {
        width: Platform.OS === "android" ? 190 : 200,
        height: Platform.OS === "android" ? 140 : 150,
        marginBottom: Platform.OS === "android" ? HEIGHT * 0.018 : HEIGHT * 0.02,
    },
    headerText: {
        fontSize: HEIGHT * 0.035,
        fontFamily: UBUNTUBOLD,
        color: BLACK,
        alignSelf: "center",
        marginBottom: HEIGHT * 0.025,
    },
    headerTextIOS: {
        fontSize: Platform.OS === "ios" ? HEIGHT * 0.038 : HEIGHT * 0.035,
        marginBottom: Platform.OS === "ios" ? HEIGHT * 0.03 : HEIGHT * 0.025,
    },
    headerTextAndroid: {
        fontSize: Platform.OS === "android" ? HEIGHT * 0.032 : HEIGHT * 0.035,
        marginBottom: Platform.OS === "android" ? HEIGHT * 0.022 : HEIGHT * 0.025,
    },
    userTypeContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: HEIGHT * 0.025,
    },
    userTypeContainerIOS: {
        marginBottom: Platform.OS === "ios" ? HEIGHT * 0.03 : HEIGHT * 0.025,
    },
    userTypeContainerAndroid: {
        marginBottom: Platform.OS === "android" ? HEIGHT * 0.022 : HEIGHT * 0.025,
    },
    userTypeButton: {
        flex: 1,
        height: HEIGHT * 0.06,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: BRANDCOLOR,
        justifyContent: "center",
        alignItems: "center",
        marginHorizontal: WIDTH * 0.02,
        backgroundColor: WHITE,
        flexDirection: "row",
    },
    userTypeButtonIOS: {
        height: Platform.OS === "ios" ? HEIGHT * 0.065 : HEIGHT * 0.06,
        borderRadius: Platform.OS === "ios" ? 10 : 8,
        borderWidth: Platform.OS === "ios" ? 2.5 : 2,
    },
    userTypeButtonAndroid: {
        height: Platform.OS === "android" ? HEIGHT * 0.058 : HEIGHT * 0.06,
        borderRadius: Platform.OS === "android" ? 6 : 8,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    userTypeButtonActive: {
        backgroundColor: BRANDCOLOR,
    },
    userIcon: {
        width: 22,
        height: 22,
        marginRight: 8,
        tintColor: BRANDCOLOR,
    },
    userIconIOS: {
        width: Platform.OS === "ios" ? 24 : 22,
        height: Platform.OS === "ios" ? 24 : 22,
        marginRight: Platform.OS === "ios" ? 10 : 8,
    },
    userIconAndroid: {
        width: Platform.OS === "android" ? 20 : 22,
        height: Platform.OS === "android" ? 20 : 22,
        marginRight: Platform.OS === "android" ? 6 : 8,
    },
    userIconActive: {
        tintColor: WHITE,
    },
    userTypeText: {
        fontSize: HEIGHT * 0.018,
        fontFamily: FIRASANSSEMIBOLD,
        color: BRANDCOLOR,
    },
    userTypeTextIOS: {
        fontSize: Platform.OS === "ios" ? HEIGHT * 0.019 : HEIGHT * 0.018,
    },
    userTypeTextAndroid: {
        fontSize: Platform.OS === "android" ? HEIGHT * 0.017 : HEIGHT * 0.018,
    },
    userTypeTextActive: {
        color: WHITE,
    },
    childContainer: {
        alignItems: "center",
    },
    textInputView: {
        height: HEIGHT * 0.07,
        width: "100%",
    },
    textInputViewIOS: {
        height: Platform.OS === "ios" ? HEIGHT * 0.075 : HEIGHT * 0.07,
    },
    textInputViewAndroid: {
        height: Platform.OS === "android" ? HEIGHT * 0.068 : HEIGHT * 0.07,
    },
    forgotPasswordContainer: {
        marginTop: HEIGHT * 0.02,
        alignSelf: "center",
    },
    forgotPasswordContainerIOS: {
        marginTop: Platform.OS === "ios" ? HEIGHT * 0.025 : HEIGHT * 0.02,
    },
    forgotPasswordContainerAndroid: {
        marginTop: Platform.OS === "android" ? HEIGHT * 0.018 : HEIGHT * 0.02,
    },
    forgotPasswordText: {
        color: BRANDCOLOR,
        fontSize: HEIGHT * 0.016,
        fontFamily: FIRASANS,
    },
    forgotPasswordTextIOS: {
        fontSize: Platform.OS === "ios" ? HEIGHT * 0.017 : HEIGHT * 0.016,
    },
    forgotPasswordTextAndroid: {
        fontSize: Platform.OS === "android" ? HEIGHT * 0.015 : HEIGHT * 0.016,
    },
    registerContainer: {
        marginTop: HEIGHT * 0.03,
        alignSelf: "center",
    },
    registerContainerIOS: {
        marginTop: Platform.OS === "ios" ? HEIGHT * 0.035 : HEIGHT * 0.03,
    },
    registerContainerAndroid: {
        marginTop: Platform.OS === "android" ? HEIGHT * 0.028 : HEIGHT * 0.03,
    },
    registerText: {
        fontFamily: FIRASANS,
        color: BLACK,
        fontSize: HEIGHT * 0.016,
    },
    registerTextIOS: {
        fontSize: Platform.OS === "ios" ? HEIGHT * 0.017 : HEIGHT * 0.016,
    },
    registerTextAndroid: {
        fontSize: Platform.OS === "android" ? HEIGHT * 0.015 : HEIGHT * 0.016,
    },
    registerHighlight: {
        color: BRANDCOLOR,
    },
    googleButton: {
        marginTop: HEIGHT * 0.018,
        minHeight: HEIGHT * 0.06,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#E0E0E0",
        backgroundColor: "#FFFFFF",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "center",
        paddingHorizontal: WIDTH * 0.04,
        gap: WIDTH * 0.025,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    googleButtonIOS: {
        minHeight: Platform.OS === "ios" ? HEIGHT * 0.065 : HEIGHT * 0.06,
        borderRadius: Platform.OS === "ios" ? 12 : 10,
    },
    googleButtonAndroid: {
        minHeight: Platform.OS === "android" ? HEIGHT * 0.058 : HEIGHT * 0.06,
        elevation: 2,
    },
    googleIcon: {
        width: 24,
        height: 24,
        resizeMode: "contain",
    },
    googleButtonText: {
        fontSize: HEIGHT * 0.018,
        color: "#666666",
        fontFamily: FIRASANS,
    },
    orContainer: {
        marginTop: HEIGHT * 0.02,
        marginBottom: HEIGHT * 0.01,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    orLine: {
        flex: 1,
        height: 1,
        backgroundColor: "#E0E0E0",
    },
    orText: {
        fontSize: HEIGHT * 0.016,
        color: "#666",
        fontFamily: FIRASANS,
    },

    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
    },

    // modalContainer: {
    //     width: "90%",
    //     backgroundColor: WHITE,
    //     borderRadius: 12,
    //     padding: 20,
    //     elevation: 5,
    // },

    modalContainerFull: {
        flex: 1,
        backgroundColor: WHITE,
        padding: 20,
        justifyContent: "flex-start",
        alignItems: "stretch",
    },

    stepContainer: {
        alignItems: "center",
    },

    title: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 15,
        color: BLACK,
    },

    buttonContainer: {
        width: "100%",
        marginTop: 15,
        alignItems: "center", // ✅ ADD THIS
    },

    cancelButton: {
        marginTop: 20,
        alignSelf: "center",
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: BRANDCOLOR,
    },

    cancelText: {
        color: BRANDCOLOR,
        fontSize: 16,
        fontWeight: "600",
    },

    closeIcon: {
        alignSelf: "flex-end",
        marginBottom: 10,
    },

    verifiedText: {
        color: "green",
        fontSize: 14,
        marginTop: 10,
        fontFamily: FIRASANSSEMIBOLD,
    },
});