import React, { useState, useEffect, useRef, useCallback } from "react";
import { StatusBar, StyleSheet, Text, TouchableOpacity, View, Image, BackHandler, ScrollView, KeyboardAvoidingView, Platform, SafeAreaView } from "react-native";
import { useDispatch } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";
import { BLACK, BRANDCOLOR, WHITE } from "../../constant/color";
import { TextInputComponent } from "../../components/commonComponents/TextInputComponent";
import { OtpInput } from "../../components/otpComponets/OtpInput";
import { LOGO, MAIL, USER, PHONE, PASSWORD, VIEW, HIDE, JOBSEEKER, GOOGLE } from "../../constant/imagePath";
import { FIRASANSSEMIBOLD, FIRASANS, UBUNTUBOLD } from "../../constant/fontPath";
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import { ToastMessage } from "../../components/commonComponents/ToastMessage";
import { CustomButton } from "../../components/commonComponents/Button";
import { MyAlert } from "../../components/commonComponents/MyAlert";
import { HEIGHT, WIDTH } from "../../constant/config";
import { BASE_URL } from "../../constant/url";
import { POSTNETWORK } from "../../utils/Network";
import { storeObjByKey } from "../../utils/Storage";
import { checkuserToken } from "../../redux/actions/auth";

export default function RegisterScreen({ navigation }) {
    const dispatch = useDispatch();

    // State variables
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [contactNumber, setContactNumber] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [isOtpStep, setIsOtpStep] = useState(false);
    // const [generatedOtp, setGeneratedOtp] = useState("");
    const [enteredOtp, setEnteredOtp] = useState("");
    const [otpStatus, setOtpStatus] = useState("");
    // const [otpExpiresAt, setOtpExpiresAt] = useState(null);
    const [otpTimer, setOtpTimer] = useState(0);
    const [resendCount, setResendCount] = useState(0);

    const timerRef = useRef(null);

    // const sendOtp = (isResend = false) => {
    //     if (!name || !email || !contactNumber || !password || !confirmPassword) {
    //         setToastMessage({ type: "error", msg: "Please fill out all fields", visible: true });
    //         return;
    //     }

    //     if (password.length < 6) {
    //         setToastMessage({ type: "error", msg: "Password must be at least 6 characters", visible: true });
    //         return;
    //     }

    //     if (password !== confirmPassword) {
    //         setToastMessage({ type: "error", msg: "Passwords do not match", visible: true });
    //         return;
    //     }

    //     if (isResend && resendCount >= 5) {
    //         setOtpStatus("Maximum resend attempts reached.");
    //         setToastMessage({ type: "error", msg: "You can resend OTP only 5 times", visible: true });
    //         return;
    //     }

    //     const otp = Math.floor(100000 + Math.random() * 900000).toString();
    //     setGeneratedOtp(otp);
    //     setOtpExpiresAt(Date.now() + 1 * 60 * 1000); // 1 min expiry
    //     setOtpStatus("OTP sent. Please enter the OTP.");
    //     setIsOtpStep(true);
    //     setEnteredOtp("");
    //     setOtpTimer(60);
    //     if (isResend) {
    //         setResendCount((p) => p + 1);
    //     }

    //     console.log("🔐 Generated OTP (dev):", otp);
    //     setToastMessage({ type: "success", msg: "OTP has been sent to your contact", visible: true });
    // };

    const sendOtp = async (isResend = false) => {
        if (!name || !email || !contactNumber || !password || !confirmPassword) {
            setToastMessage({ type: "error", msg: "Please fill all fields", visible: true });
            return;
        }

        if (password !== confirmPassword) {
            setToastMessage({ type: "error", msg: "Passwords do not match", visible: true });
            return;
        }

        if (isResend && resendCount >= 5) {
            setToastMessage({ type: "error", msg: "Max 5 resend attempts reached", visible: true });
            return;
        }

        try {
            const url = isResend
                ? `${BASE_URL}auth/resend-register-otp`
                : `${BASE_URL}auth/register`;

            const payload = {
                role: userType === "JobSeeker" ? "seeker" : "provider",
                fullName: name,
                email: email,
                phone: contactNumber,
                password: password
            };

            // console.log("[RegisterScreen] sendOtp request", { url, payload, isResend });
            const result = await POSTNETWORK(url, payload, false);
            // console.log("[RegisterScreen] sendOtp response", result);

            const message = (result?.message || "").toString();
            const isSuccess =
                result?.success === true ||
                result?.status === "success" ||
                /otp\s*sent/i.test(message);

            if (isSuccess) {
                // console.log("[RegisterScreen] sendOtp success", {
                //     isResend,
                //     message: message || "OTP sent successfully",
                //     raw: result,
                // });

                setIsOtpStep(true);
                setEnteredOtp("");
                setOtpTimer(60); // 1 minute timer
                setOtpStatus("OTP sent. Please enter the OTP.");

                if (isResend) {
                    setResendCount(prev => prev + 1);
                }

                setToastMessage({
                    type: "success",
                    msg: result?.message || "OTP sent successfully",
                    visible: true
                });

            } else {
                // console.log("[RegisterScreen] sendOtp failed", {
                //     isResend,
                //     message: message || "Failed to send OTP",
                //     raw: result,
                // });
                setOtpStatus(message || "Failed to send OTP.");
                setToastMessage({
                    type: "error",
                    msg: result?.message || "Failed to send OTP",
                    visible: true
                });
            }

        } catch (error) {
            // console.log("[RegisterScreen] sendOtp error", {
            //     isResend,
            //     message: error?.message || "Network error",
            //     raw: error,
            // });
            setToastMessage({
                type: "error",
                msg: "Network error",
                visible: true
            });
        }
    };





    // const onOtpChange = ((value) => {
    //     setEnteredOtp(value);
    //     setOtpStatus("");

    //     if (value.length === 6) {
    //         if (otpExpiresAt && Date.now() > otpExpiresAt) {
    //             setOtpStatus("OTP expired. Please resend OTP.");
    //             setToastMessage({ type: "error", msg: "OTP expired. Please resend OTP.", visible: true });
    //             setOtpTimer(0);
    //             return;
    //         }
    //         if (value !== generatedOtp) {
    //             setOtpStatus("Enter Correct OTP");
    //             setToastMessage({ type: "error", msg: "Enter correct OTP", visible: true });
    //             return;
    //         }
    //         setOtpStatus("OTP Verified Successfully");
    //         setToastMessage({ type: "success", msg: "OTP Verified Successfully", visible: true });
    //         setOtpTimer(0);
    //         if (timerRef.current) {
    //             clearInterval(timerRef.current);
    //             timerRef.current = null;
    //         }
    //         return;
    //     }
    // }, []);


    const onOtpChange = (value) => {
        setEnteredOtp(value);
        setOtpStatus("");
    };


    useEffect(() => {
        if (!isOtpStep || otpTimer <= 0) {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            return;
        }

        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        timerRef.current = setInterval(() => {
            setOtpTimer((prev) => {
                if (prev <= 1) {
                    if (timerRef.current) {
                        clearInterval(timerRef.current);
                        timerRef.current = null;
                    }
                    setOtpStatus("OTP expired. Please resend OTP.");
                    setToastMessage({ type: "error", msg: "OTP expired. Please resend OTP.", visible: true });
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [isOtpStep, otpTimer]);

    const [userType, setUserType] = useState("JobSeeker"); // Default selection
    const [toastMessage, setToastMessage] = useState({ type: "", msg: "", visible: false });
    const [alertVisible, setAlertVisible] = useState(false);

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
                setAlertVisible(true);
                return true;
            };

            const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);

            return () => backHandler.remove();
        }
    }, [navigation]);

    // Reset state when the screen is focused
    useFocusEffect(
        useCallback(() => {
            // Reset the state to initial values
            setName("");
            setEmail("");
            setContactNumber("");
            setPassword("");
            setConfirmPassword("");
            setShowPassword(false);
            setShowConfirmPassword(false);
            setUserType("JobSeeker");
            setIsOtpStep(false);
            // setGeneratedOtp("");
            setEnteredOtp("");
            setOtpStatus("");
            // setOtpExpiresAt(null);
            setOtpTimer(0);
            setResendCount(0);
            setAlertVisible(false);
            setToastMessage({ type: "", msg: "", visible: false });
        }, [])
    );

    const handleAlertClose = () => {
        setAlertVisible(false);
    };

    const handleAlertConfirm = () => {
        setAlertVisible(false);
        BackHandler.exitApp();
    };

    const onLoginNavigate = () => {
        navigation.navigate("Login");
    };

    // API registration handler
    // const handleRegister = async () => {
    //     if (!isOtpStep || otpStatus !== "OTP Verified Successfully" || enteredOtp.length !== 4) {
    //         setToastMessage({
    //             type: "error",
    //             msg: "Please verify OTP before registering",
    //             visible: true
    //         });
    //         return;
    //     }

    //     if (!name || !email || !contactNumber || !password || !confirmPassword) {
    //         setToastMessage({
    //             type: "error",
    //             msg: "Please fill out all fields",
    //             visible: true
    //         });
    //         return;
    //     }

    //     if (password.length < 6) {
    //         setToastMessage({
    //             type: "error",
    //             msg: "Password must be at least 6 characters",
    //             visible: true
    //         });
    //         return;
    //     }

    //     if (password !== confirmPassword) {
    //         setToastMessage({
    //             type: "error",
    //             msg: "Passwords do not match",
    //             visible: true
    //         });
    //         return;
    //     }

    //     if (password.length < 6) {
    //         setToastMessage({
    //             type: "error",
    //             msg: "Password must be at least 6 characters",
    //             visible: true
    //         });
    //         return;
    //     }
    //     if (password !== confirmPassword) {
    //         setToastMessage({
    //             type: "error",
    //             msg: "Passwords do not match",
    //             visible: true
    //         });
    //         return;
    //     }

    //     try {
    //         const url = `${BASE_URL}auth/register`;

    //         // Map userType to role: "JobSeeker" -> "seeker", "JobProvider" -> "provider"
    //         const role = userType === "JobSeeker" ? "seeker" : "provider";

    //         const payload = {
    //             role: role,
    //             fullName: name,
    //             email: email,
    //             phone: contactNumber,
    //             password: password
    //         };

    //         // console.log("📤 Register request:", { url, payload });
    //         // console.log("📤 User Type:", userType);
    //         // console.log("📤 Mapped Role:", role);
    //         // console.log("📤 Selected Experience:", experience);
    //         // console.log("📤 Mapped Experience:", experienceValue);

    //         POSTNETWORK(url, payload, false)
    //             .then((result) => {
    //                 // console.log("📥 Register response:", JSON.stringify(result, null, 2));

    //                 // Check if there are errors in the response
    //                 if (result?.errors && Array.isArray(result.errors) && result.errors.length > 0) {
    //                     // Extract error messages from errors array
    //                     const errorMessages = result.errors.map(err => {
    //                         // Handle different error formats
    //                         if (typeof err === 'string') {
    //                             return err;
    //                         } else if (err?.msg) {
    //                             // Format: {type: 'field', value: 'Experienced', msg: 'invalid experience', path: 'experience', location: 'body'}
    //                             return err.msg;
    //                         } else if (err?.message) {
    //                             return err.message;
    //                         } else {
    //                             return JSON.stringify(err);
    //                         }
    //                     }).join(', ');

    //                     // console.error("❌ Registration failed with errors:", result.errors);
    //                     // console.error("❌ Error messages:", errorMessages);
    //                     // console.error("❌ Full error response:", JSON.stringify(result, null, 2));
    //                     setToastMessage({
    //                         type: "error",
    //                         msg: errorMessages || "Registration failed. Please check your input.",
    //                         visible: true,
    //                     });
    //                     return;
    //                 }

    //                 // Check if registration was successful
    //                 // Success indicators: id (user created), token, statusCode 200/201, or success flag
    //                 // Check for id in multiple possible locations
    //                 const hasId = result?.id || result?.data?.id || result?.user?.id;
    //                 const hasToken = result?.token || result?.data?.token;
    //                 const isSuccess = hasId ||
    //                     hasToken ||
    //                     result?.statusCode === 200 ||
    //                     result?.statusCode === 201 ||
    //                     result?.success === true ||
    //                     result?.status === "success" ||
    //                     result?.status === "Success";

    //                 // console.log("🔍 Success check - result?.id:", result?.id);
    //                 // console.log("🔍 Success check - result?.data?.id:", result?.data?.id);
    //                 // console.log("🔍 Success check - hasId:", hasId);
    //                 // console.log("🔍 Success check - hasToken:", hasToken ? "exists" : "none");
    //                 // console.log("🔍 Success check - isSuccess:", isSuccess);

    //                 if (isSuccess) {
    //                     // console.log("✅ Registration successful!");
    //                     // console.log("✅ User ID:", result?.id || "N/A");
    //                     // console.log("✅ Response status:", result?.statusCode || "N/A");
    //                     // console.log("✅ Token:", result?.token ? result.token.substring(0, 20) + "..." : "N/A");

    //                     // Transform response to include role at top level for navigation
    //                     const loginDataToStore = {
    //                         token: result?.token || result?.data?.token || null,
    //                         role: result?.user?.role || result?.role || role,
    //                         userType: result?.user?.role || result?.role || role,
    //                         user: result?.user || result?.data?.user || {},
    //                         ...result,
    //                     };

    //                     // console.log("✅ Register data to store:", JSON.stringify(loginDataToStore, null, 2));

    //                     // Store login response with token and user data
    //                     storeObjByKey("loginResponse", loginDataToStore)
    //                         .then(() => {
    //                             // console.log("✅ Registration response stored successfully");
    //                             // console.log("✅ Stored role:", loginDataToStore.role);
    //                             // console.log("✅ Stored userType:", loginDataToStore.userType);
    //                             setToastMessage({
    //                                 type: "success",
    //                                 msg: result?.message || "Registration successful!",
    //                                 visible: true,
    //                             });

    //                             // Navigate to Login screen after successful registration
    //                             setTimeout(() => {
    //                                 navigation.navigate("Login");
    //                             }, 1500);
    //                         })
    //                         .catch((error) => {
    //                             // console.error("❌ Error storing registration response:", error);
    //                             // console.error("❌ Error details:", JSON.stringify(error, null, 2));
    //                             setToastMessage({
    //                                 type: "error",
    //                                 msg: "Failed to save registration data. Please try again.",
    //                                 visible: true,
    //                             });
    //                         });
    //                 } else {
    //                     // Registration failed - no token and no statusCode 200/201
    //                     // console.error("❌ Registration failed");
    //                     // console.error("❌ Response message:", result?.message || "Unknown error");
    //                     // console.error("❌ Full response:", JSON.stringify(result, null, 2));
    //                     setToastMessage({
    //                         type: "error",
    //                         msg: result?.message || "Registration failed. Please try again.",
    //                         visible: true,
    //                     });
    //                 }
    //             })
    //             .catch((error) => {
    //                 // console.error("❌ Registration network error:", error);
    //                 // console.error("❌ Error message:", error.message);
    //                 // console.error("❌ Error stack:", error.stack);
    //                 setToastMessage({
    //                     type: "error",
    //                     msg: "Failed to register. Please check your connection and try again.",
    //                     visible: true,
    //                 });
    //             });
    //     } catch (error) {
    //         // console.error("❌ Registration exception:", error);
    //         // console.error("❌ Exception message:", error.message);
    //         // console.error("❌ Exception stack:", error.stack);
    //         setToastMessage({
    //             type: "error",
    //             msg: "An error occurred during registration. Please try again.",
    //             visible: true,
    //         });
    //     }
    // };

    const handleRegister = async () => {
        if (enteredOtp.length !== 6) {
            setToastMessage({
                type: "error",
                msg: "Enter valid 6-digit OTP",
                visible: true
            });
            return;
        }

        try {
            const url = `${BASE_URL}auth/verify-register-otp`;

            const payload = {
                email: email,
                otp: enteredOtp
            };

            // console.log("[RegisterScreen] handleRegister request", { url, payload });
            const result = await POSTNETWORK(url, payload, false);
            // console.log("[RegisterScreen] handleRegister response", result);

            const msg = (result?.message || "").toString();
            const isSuccess =
                result?.success === true ||
                result?.status === "success" ||
                result?.statusCode === 200 ||
                result?.statusCode === 201 ||
                // some APIs only return message on success
                (!!msg && !result?.error && !result?.errors && !/invalid/i.test(msg)) ||
                /otp\s*verified|registration\s*successful|success/i.test(msg);

            if (isSuccess) {
                setOtpStatus("OTP Verified Successfully");

                const loginDataToStore = {
                    token: result?.token,
                    role: result?.user?.role,
                    userType: result?.user?.role,
                    user: {
                        ...result?.user,
                        email: email, // Preserve the original email entered by user
                    },
                };

                await storeObjByKey("loginResponse", loginDataToStore);

                setToastMessage({
                    type: "success",
                    msg: result?.message || "Registration successful",
                    visible: true
                });

                setTimeout(() => {
                    navigation.navigate("Login");
                }, 1500);

            } else {
                // console.log("[RegisterScreen] handleRegister failed", result);
                setOtpStatus(result?.message || "Invalid OTP");
                setToastMessage({
                    type: "error",
                    msg: result?.message || "Invalid OTP",
                    visible: true
                });
            }

        } catch (error) {
            // console.log("[RegisterScreen] handleRegister error", error);
            setOtpStatus("Something went wrong");
            setToastMessage({
                type: "error",
                msg: "Something went wrong",
                visible: true
            });
        }
    };

    // removed OTP logic

    // removed OTP verification and redux logic

    // const onGoogleRegister = async () => {
    //     try {
    //         await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    //         await GoogleSignin.signOut();

    //         const userInfo = await GoogleSignin.signIn();

    //         const { idToken } = await GoogleSignin.getTokens();

    //         if (!idToken) {
    //             throw new Error("No ID token found");
    //         }

    //         const googleCredential = auth.GoogleAuthProvider.credential(idToken);

    //         const userCredential = await auth().signInWithCredential(googleCredential);

    //         const user = userCredential.user;
    //         const token = await user.getIdToken();

    //         const loginDataToStore = {
    //             token: token,
    //             role: userType === "JobSeeker" ? "seeker" : "provider",
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
    //             msg: "Google registration successful!",
    //             visible: true,
    //         });

    //         dispatch(checkuserToken());

    //     } catch (error) {
    //         console.error("Google Sign-Up error:", error);

    //         let errorMessage = "Google sign-up failed. Please try again.";

    //         if (error.code === 'SIGN_IN_CANCELLED') {
    //             errorMessage = "Google sign-up was cancelled.";
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

    const onGoogleRegister = async () => {
        // console.log("🔵 Google Register Started");

        try {
            // console.log("🟡 Checking Play Services...");
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
            // console.log("✅ Play Services OK");

            await GoogleSignin.signOut();

            // console.log("🟡 Signing in with Google...");
            await GoogleSignin.signIn();
            // console.log("✅ Google Sign-In Success");

            // console.log("🟡 Getting ID Token...");
            const { idToken } = await GoogleSignin.getTokens();

            if (!idToken) {
                // console.log("❌ No ID Token");
                throw new Error("No ID token found");
            }

            // console.log("🟡 Creating Firebase credential...");
            const googleCredential = auth.GoogleAuthProvider.credential(idToken);

            // console.log("🟡 Signing into Firebase...");
            const userCredential = await auth().signInWithCredential(googleCredential);
            // console.log("✅ Firebase Auth Success");

            const user = userCredential.user;
            // console.log("👤 User:", user);

            // console.log("🟡 Getting Firebase token...");
            const firebaseToken = await user.getIdToken();
            // console.log("✅ Firebase Token:", firebaseToken);

            // 🔥 BACKEND CALL (THIS WAS MISSING IN YOUR REGISTER)
            const apiUrl = `${BASE_URL}auth/firebase`;
            // console.log("🌐 API URL:", apiUrl);

            // console.log("🟡 Sending token to backend...");
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: firebaseToken,
                    role: userType === "JobSeeker" ? "seeker" : "provider",
                    // ✅ ADD THESE
                    fullName: user.displayName || "",
                    email: user.email || "",
                    phone: user.phoneNumber || contactNumber || ""
                })
            });

            // console.log("📡 Response Status:", response.status);

            const data = await response.json();
            // console.log("📡 Response Data:", data);

            if (response.ok) {
                // console.log("✅ Backend Register/Login Success");

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

                // console.log("💾 Storing user...");
                await storeObjByKey("loginResponse", loginDataToStore);

                setToastMessage({
                    type: "success",
                    msg: "Google registration successful!",
                    visible: true,
                });

                dispatch(checkuserToken());

                // console.log("🧭 Navigating...");
                if (userType === "JobProvider") {
                    navigation.navigate("EmployerProfile");
                } else {
                    navigation.navigate("Profile");
                }

            } else {
                // console.log("❌ Backend Error:", data?.message);

                setToastMessage({
                    type: "error",
                    msg: data?.message || "Google sign-up failed",
                    visible: true,
                });
            }

        } catch (error) {
            // console.log("🔥 Google Register Error:", error);
            // console.log("🔥 Code:", error.code);
            // console.log("🔥 Message:", error.message);

            let errorMessage = "Google sign-up failed. Please try again.";

            if (error.code === 'SIGN_IN_CANCELLED') {
                errorMessage = "Google sign-up was cancelled.";
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
            // console.log("🔵 Google Register Finished");
        }
    };

    const Container = Platform.OS === "ios" ? SafeAreaView : View;

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
            <StatusBar
                backgroundColor={WHITE}
                barStyle={Platform.OS === "ios" ? "dark-content" : "dark-content"}
                translucent={Platform.OS === "android"}
            />

            <Container style={[
                styles.container,
                Platform.OS === "ios" && styles.containerIOS,
                Platform.OS === "android" && styles.containerAndroid
            ]}>
                <ScrollView
                    contentContainerStyle={[
                        styles.scrollContainer,
                        Platform.OS === "ios" && styles.scrollContainerIOS,
                        Platform.OS === "android" && styles.scrollContainerAndroid,
                    ]}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={[
                        styles.childContainer,
                        Platform.OS === "ios" && styles.childContainerIOS,
                        Platform.OS === "android" && styles.childContainerAndroid
                    ]}>
                        <Image source={LOGO} style={[
                            styles.logo,
                            Platform.OS === "ios" && styles.logoIOS,
                            Platform.OS === "android" && styles.logoAndroid
                        ]} />
                        {/* <Text allowFontScaling={false} style={styles.txtHeader}>Registration Form</Text> */}

                        <View style={{ height: 10 }} />

                        {!isOtpStep && (
                            <>
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
                                            userType === "JobSeeker" && styles.userTypeButtonActive
                                        ]}
                                    >
                                        <Image source={JOBSEEKER} style={[
                                            styles.userIcon,
                                            Platform.OS === "ios" && styles.userIconIOS,
                                            Platform.OS === "android" && styles.userIconAndroid,
                                            userType === "JobSeeker" && styles.userIconActive
                                        ]} />
                                        <Text allowFontScaling={false} style={[
                                            styles.userTypeText,
                                            Platform.OS === "ios" && styles.userTypeTextIOS,
                                            Platform.OS === "android" && styles.userTypeTextAndroid,
                                            userType === "JobSeeker" && styles.userTypeTextActive
                                        ]}>
                                            Job Seeker
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => setUserType("JobProvider")}
                                        style={[
                                            styles.userTypeButton,
                                            Platform.OS === "ios" && styles.userTypeButtonIOS,
                                            Platform.OS === "android" && styles.userTypeButtonAndroid,
                                            userType === "JobProvider" && styles.userTypeButtonActive
                                        ]}
                                    >
                                        <Image source={JOBSEEKER} style={[
                                            styles.userIcon,
                                            Platform.OS === "ios" && styles.userIconIOS,
                                            Platform.OS === "android" && styles.userIconAndroid,
                                            userType === "JobProvider" && styles.userIconActive
                                        ]} />
                                        <Text allowFontScaling={false} style={[
                                            styles.userTypeText,
                                            Platform.OS === "ios" && styles.userTypeTextIOS,
                                            Platform.OS === "android" && styles.userTypeTextAndroid,
                                            userType === "JobProvider" && styles.userTypeTextActive
                                        ]}>
                                            Job Provider
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Name */}
                                <View style={[
                                    styles.txtInputContainer,
                                    Platform.OS === "ios" && styles.txtInputContainerIOS,
                                    Platform.OS === "android" && styles.txtInputContainerAndroid
                                ]}>
                                    <TextInputComponent
                                        placeholder=" Enter Your Full Name"
                                        type="name"
                                        inputdata={name}
                                        setInputdata={setName}
                                        image={USER}
                                        borderColor={BRANDCOLOR}
                                        width={"100%"}
                                    />
                                </View>

                                {/* Email */}
                                <View style={[
                                    styles.txtInputContainer,
                                    Platform.OS === "ios" && styles.txtInputContainerIOS,
                                    Platform.OS === "android" && styles.txtInputContainerAndroid
                                ]}>
                                    <TextInputComponent
                                        placeholder="Enter Your Email"
                                        type="email"
                                        inputdata={email}
                                        setInputdata={setEmail}
                                        autoCapitalize={'none'}
                                        image={MAIL}
                                        borderColor={BRANDCOLOR}
                                        width={"100%"}
                                        keyboardType={"email-address"}
                                    />
                                </View>

                                {/* Phone */}
                                <View style={[
                                    styles.txtInputContainer,
                                    Platform.OS === "ios" && styles.txtInputContainerIOS,
                                    Platform.OS === "android" && styles.txtInputContainerAndroid
                                ]}>
                                    <TextInputComponent
                                        placeholder="Enter Your Phone Number"
                                        type="number"
                                        inputdata={contactNumber}
                                        setInputdata={setContactNumber}
                                        image={PHONE}
                                        borderColor={BRANDCOLOR}
                                        width={"100%"}
                                        keyboardType={"phone-pad"}
                                        maxLength={10}
                                    />
                                </View>

                                {/* Password */}
                                <View style={[
                                    styles.txtInputContainer,
                                    Platform.OS === "ios" && styles.txtInputContainerIOS,
                                    Platform.OS === "android" && styles.txtInputContainerAndroid
                                ]}>
                                    <TextInputComponent
                                        placeholder="Enter Your Password"
                                        type="password"
                                        inputdata={password}
                                        setInputdata={setPassword}
                                        image={PASSWORD}
                                        borderColor={BRANDCOLOR}
                                        width={"100%"}
                                        showPassword={showPassword}
                                        rightIcon={showPassword ? VIEW : HIDE}
                                        onRightPress={() => setShowPassword(!showPassword)}
                                    />
                                </View>

                                {/* Confirm Password */}
                                <View style={[
                                    styles.txtInputContainer,
                                    Platform.OS === "ios" && styles.txtInputContainerIOS,
                                    Platform.OS === "android" && styles.txtInputContainerAndroid
                                ]}>
                                    <TextInputComponent
                                        placeholder="Enter Your Confirm Password"
                                        type="password"
                                        inputdata={confirmPassword}
                                        setInputdata={setConfirmPassword}
                                        image={PASSWORD}
                                        borderColor={BRANDCOLOR}
                                        width={"100%"}
                                        showPassword={showConfirmPassword}
                                        rightIcon={showConfirmPassword ? VIEW : HIDE}
                                        onRightPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                    />
                                </View>
                            </>
                        )}

                        <View style={{ height: HEIGHT * 0.03 }} />

                        {!isOtpStep ? (
                            <CustomButton
                                color={WHITE}
                                text="Send OTP"
                                onPress={() => sendOtp(false)}
                                fontFamily={FIRASANSSEMIBOLD}
                            />
                        ) : (
                            <>
                                <Text allowFontScaling={false} style={[styles.otpStatus, otpStatus === 'OTP Verified Successfully' ? styles.otpValid : styles.otpError]}>
                                    {otpStatus}
                                </Text>

                                <OtpInput onOtpChange={onOtpChange} />

                                {isOtpStep && otpTimer > 0 && (
                                    <Text allowFontScaling={false} style={styles.otpTimer}>
                                        OTP expires in {Math.floor(otpTimer / 60)}:{String(otpTimer % 60).padStart(2, '0')}
                                    </Text>
                                )}

                                {resendCount > 0 && (
                                    <Text allowFontScaling={false} style={styles.resendInfo}>
                                        {Math.max(0, 5 - resendCount)} attempt(s) left for resend
                                    </Text>
                                )}

                                <CustomButton
                                    color={WHITE}
                                    text="Register"
                                    onPress={handleRegister}
                                    fontFamily={FIRASANSSEMIBOLD}
                                />

                                {otpStatus !== "OTP Verified Successfully" && (
                                    <>
                                        <View style={{ height: HEIGHT * 0.02 }} />
                                        <CustomButton
                                            color={resendCount >= 5 ? "#cccccc" : WHITE}
                                            text={resendCount >= 5 ? "Resend OTP (limit reached)" : "Resend OTP"}
                                            onPress={() => {
                                                if (resendCount >= 5) {
                                                    setToastMessage({ type: "error", msg: "Maximum 5 resend attempts reached.", visible: true });
                                                } else {
                                                    sendOtp(true);
                                                }
                                            }}
                                            fontFamily={FIRASANSSEMIBOLD}
                                        />
                                    </>
                                )}
                            </>
                        )}

                        <View style={{ height: HEIGHT * 0.02 }} />

                        {/* OR SEPARATOR */}
                        <View style={styles.orContainer}>
                            <View style={styles.orLine} />
                            <Text style={styles.orText}>OR</Text>
                            <View style={styles.orLine} />
                        </View>

                        {/* GOOGLE REGISTER */}
                        <TouchableOpacity
                            style={[
                                styles.googleButton,
                                Platform.OS === "ios" && styles.googleButtonIOS,
                                Platform.OS === "android" && styles.googleButtonAndroid,
                            ]}
                            onPress={onGoogleRegister}
                            activeOpacity={0.85}
                        >
                            <Image source={GOOGLE} style={styles.googleIcon} />
                            <Text style={styles.googleButtonText}>Continue with Google Account</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{ height: Platform.OS === "ios" ? 25 : 20 }} />
                    <View style={[
                        styles.loginTxtView,
                        Platform.OS === "ios" && styles.loginTxtViewIOS,
                        Platform.OS === "android" && styles.loginTxtViewAndroid
                    ]}>
                        <Text
                            allowFontScaling={false}
                            onPress={onLoginNavigate}
                            style={[
                                styles.regText,
                                Platform.OS === "ios" && styles.regTextIOS,
                                Platform.OS === "android" && styles.regTextAndroid,
                                {
                                    fontSize: Platform.OS === "ios" ? 19 : 18,
                                    color: BLACK
                                }
                            ]}
                        >
                            Have an account?
                            <Text
                                allowFontScaling={false}
                                style={[
                                    styles.regText,
                                    Platform.OS === "ios" && styles.regTextIOS,
                                    Platform.OS === "android" && styles.regTextAndroid,
                                    {
                                        fontSize: Platform.OS === "ios" ? 19 : 18,
                                        color: BRANDCOLOR
                                    }
                                ]}
                            >
                                {" Login Here"}
                            </Text>
                        </Text>
                    </View>

                    {/* Date Picker removed for static registration */}

                </ScrollView>

                {/* Toast Message */}
                {toastMessage.visible && (
                    <ToastMessage
                        message={toastMessage.msg}
                        visible={toastMessage.visible}
                        setVisible={({ visible }) => setToastMessage((prev) => ({ ...prev, visible }))}
                        bacgroundColor={toastMessage.type === "success" ? "green" : "red"}
                        textColor={WHITE}
                        type={toastMessage.type}
                        duration={3000}
                        image={LOGO}
                    />
                )}

                {/* Alert */}
                <MyAlert
                    visible={alertVisible}
                    title="Exit App"
                    message="Are you sure you want to exit?"
                    textRight="Yes"
                    textLeft="Cancel"
                    onPressRight={handleAlertConfirm}
                    onPressLeft={handleAlertClose}
                    onRequestClose={handleAlertClose}
                    backgroundColor={BRANDCOLOR}
                    titleColor={WHITE}
                    textColor={WHITE}
                    buttonColor={WHITE}
                    borderColor={WHITE}
                />


            </Container>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'relative',
        backgroundColor: WHITE,
        justifyContent: "flex-start",
    },
    containerIOS: {
        paddingTop: Platform.OS === "ios" ? 0 : 0,
    },
    containerAndroid: {
        paddingTop: Platform.OS === "android" ? 0 : 0,
    },
    childContainer: {
        // backgroundColor: WHITE,
        alignItems: "center",
        marginTop: HEIGHT * 0.005
    },
    childContainerIOS: {
        marginTop: Platform.OS === "ios" ? HEIGHT * 0.01 : HEIGHT * 0.005,
    },
    childContainerAndroid: {
        marginTop: Platform.OS === "android" ? HEIGHT * 0.003 : HEIGHT * 0.005,
    },
    txtInputContainer: {
        width: "80%",
        marginVertical: HEIGHT * 0.005,
        alignSelf: "center"
    },
    txtInputContainerIOS: {
        width: Platform.OS === "ios" ? "82%" : "80%",
        marginVertical: Platform.OS === "ios" ? HEIGHT * 0.007 : HEIGHT * 0.005,
    },
    txtInputContainerAndroid: {
        width: Platform.OS === "android" ? "78%" : "80%",
        marginVertical: Platform.OS === "android" ? HEIGHT * 0.003 : HEIGHT * 0.005,
    },
    dropdownOption: {
        paddingVertical: 12,
        paddingHorizontal: 10,
    },
    dropdownOptionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dropdownIcon: {
        width: 18,
        height: 18,
        tintColor: BRANDCOLOR,
        resizeMode: 'contain',
    },
    dropdownOverlay: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        zIndex: 9999,
    },
    dropdownAbsolute: {
        position: 'absolute',
        backgroundColor: WHITE,
        borderWidth: 1,
        borderColor: BRANDCOLOR,
        borderRadius: 10,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        zIndex: 10000,
        overflow: 'hidden',
    },
    regText: {
        color: WHITE,
        fontSize: HEIGHT * 0.0085,
        fontFamily: FIRASANS
    },
    regTextIOS: {
        fontSize: Platform.OS === "ios" ? HEIGHT * 0.009 : HEIGHT * 0.0085,
    },
    regTextAndroid: {
        fontSize: Platform.OS === "android" ? HEIGHT * 0.008 : HEIGHT * 0.0085,
    },
    loginTxtView: {
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
        alignSelf: "center",
    },
    loginTxtViewIOS: {
        width: "100%",
        alignSelf: "center",
    },
    loginTxtViewAndroid: {
        width: "100%",
        alignSelf: "center",
    },
    editInfoContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: HEIGHT * 0.02,
    },
    penIconContainer: {
        backgroundColor: BRANDCOLOR,
        borderRadius: 200,
        padding: 5,
        marginRight: WIDTH * 0.02
    },
    penIcon: {
        height: 20,
        width: 20,
        tintColor: WHITE
    },
    editInfoText: {
        fontSize: HEIGHT * 0.013,
        color: BLACK,
        fontFamily: FIRASANSSEMIBOLD
    },
    logo: {
        width: 150,
        height: 150,
        resizeMode: "contain",
        alignSelf: "center",
        marginTop: HEIGHT * 0.01,
        marginBottom: -HEIGHT * 0.03,
    },
    logoIOS: {
        width: Platform.OS === "ios" ? 165 : 150,
        height: Platform.OS === "ios" ? 165 : 150,
        marginTop: Platform.OS === "ios" ? HEIGHT * 0.015 : HEIGHT * 0.01,
        marginBottom: Platform.OS === "ios" ? -HEIGHT * 0.035 : -HEIGHT * 0.03,
    },
    logoAndroid: {
        width: Platform.OS === "android" ? 140 : 150,
        height: Platform.OS === "android" ? 140 : 150,
        marginTop: Platform.OS === "android" ? HEIGHT * 0.008 : HEIGHT * 0.01,
        marginBottom: Platform.OS === "android" ? -HEIGHT * 0.025 : -HEIGHT * 0.03,
    },
    scrollContainer: {
        flexGrow: 1,
        paddingTop: HEIGHT * 0.01,
        paddingBottom: HEIGHT * 0.02,
    },
    scrollContainerIOS: {
        paddingTop: Platform.OS === "ios" ? HEIGHT * 0.015 : HEIGHT * 0.01,
        paddingBottom: Platform.OS === "ios" ? HEIGHT * 0.025 : HEIGHT * 0.02,
    },
    scrollContainerAndroid: {
        paddingTop: Platform.OS === "android" ? HEIGHT * 0.008 : HEIGHT * 0.01,
        paddingBottom: Platform.OS === "android" ? HEIGHT * 0.018 : HEIGHT * 0.02,
    },
    txtHeader: {
        fontFamily: UBUNTUBOLD,
        fontSize: HEIGHT * 0.025,
        color: BLACK,
        marginTop: -HEIGHT * 0.02
    },
    userTypeContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginVertical: HEIGHT * 0.015,
        width: "100%",
        paddingHorizontal: WIDTH * 0.05,
    },
    userTypeContainerIOS: {
        marginVertical: Platform.OS === "ios" ? HEIGHT * 0.018 : HEIGHT * 0.015,
        paddingHorizontal: Platform.OS === "ios" ? WIDTH * 0.06 : WIDTH * 0.05,
    },
    userTypeContainerAndroid: {
        marginVertical: Platform.OS === "android" ? HEIGHT * 0.013 : HEIGHT * 0.015,
        paddingHorizontal: Platform.OS === "android" ? WIDTH * 0.04 : WIDTH * 0.05,
    },
    userTypeButton: {
        flex: 1,
        height: HEIGHT * 0.055,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: BRANDCOLOR,
        justifyContent: "center",
        alignItems: "center",
        marginHorizontal: WIDTH * 0.02,
        backgroundColor: WHITE,
        flexDirection: 'row',
    },
    userTypeButtonIOS: {
        height: Platform.OS === "ios" ? HEIGHT * 0.06 : HEIGHT * 0.055,
        borderRadius: Platform.OS === "ios" ? 10 : 8,
        borderWidth: Platform.OS === "ios" ? 2.5 : 2,
    },
    userTypeButtonAndroid: {
        height: Platform.OS === "android" ? HEIGHT * 0.052 : HEIGHT * 0.055,
        borderRadius: Platform.OS === "android" ? 6 : 8,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    userIcon: {
        width: 20,
        height: 20,
        marginRight: 6,
        tintColor: BRANDCOLOR
    },
    userIconIOS: {
        width: Platform.OS === "ios" ? 22 : 20,
        height: Platform.OS === "ios" ? 22 : 20,
        marginRight: Platform.OS === "ios" ? 8 : 6,
    },
    userIconAndroid: {
        width: Platform.OS === "android" ? 18 : 20,
        height: Platform.OS === "android" ? 18 : 20,
        marginRight: Platform.OS === "android" ? 4 : 6,
    },
    userIconActive: {
        tintColor: WHITE
    },
    userTypeButtonActive: {
        backgroundColor: BRANDCOLOR,
    },
    userTypeText: {
        fontSize: HEIGHT * 0.015,
        fontFamily: FIRASANSSEMIBOLD,
        color: BRANDCOLOR,
    },
    userTypeTextIOS: {
        fontSize: Platform.OS === "ios" ? HEIGHT * 0.016 : HEIGHT * 0.015,
    },
    userTypeTextAndroid: {
        fontSize: Platform.OS === "android" ? HEIGHT * 0.014 : HEIGHT * 0.015,
    },
    userTypeTextActive: {
        color: WHITE,
    },
    experienceDropdown: {
        paddingVertical: HEIGHT * 0.018,
        paddingHorizontal: WIDTH * 0.04,
        borderWidth: 1,
        borderRadius: 10,
        borderColor: BRANDCOLOR,
        backgroundColor: WHITE,
        width: "92%",
        alignSelf: "center",
    },
    experienceDropdownIOS: {
        paddingVertical: Platform.OS === "ios" ? HEIGHT * 0.02 : HEIGHT * 0.018,
        paddingHorizontal: Platform.OS === "ios" ? WIDTH * 0.05 : WIDTH * 0.04,
        borderRadius: Platform.OS === "ios" ? 12 : 10,
        borderWidth: Platform.OS === "ios" ? 1.5 : 1,
    },
    experienceDropdownAndroid: {
        paddingVertical: Platform.OS === "android" ? HEIGHT * 0.017 : HEIGHT * 0.018,
        paddingHorizontal: Platform.OS === "android" ? WIDTH * 0.03 : WIDTH * 0.04,
        borderRadius: Platform.OS === "android" ? 8 : 10,
        elevation: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
    },
    experienceDropdownText: {
        fontSize: HEIGHT * 0.015,
        fontFamily: FIRASANSSEMIBOLD,
    },
    experienceDropdownTextIOS: {
        fontSize: Platform.OS === "ios" ? HEIGHT * 0.016 : HEIGHT * 0.015,
    },
    experienceDropdownTextAndroid: {
        fontSize: Platform.OS === "android" ? HEIGHT * 0.014 : HEIGHT * 0.015,
    },
    otpInputContainer: {
        justifyContent: "center",
        alignItems: "center",
    },
    orContainer: {
        marginTop: HEIGHT * 0.015,
        marginBottom: HEIGHT * 0.01,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        width: "80%",
        alignSelf: "center",
    },
    orLine: {
        flex: 1,
        height: 1,
        backgroundColor: "#E0E0E0",
    },
    orText: {
        fontSize: HEIGHT * 0.013,
        color: "#666",
        fontFamily: FIRASANS,
    },
    googleButton: {
        marginTop: HEIGHT * 0.015,
        minHeight: HEIGHT * 0.055,
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
        width: "80%",
    },
    googleButtonIOS: {
        minHeight: Platform.OS === "ios" ? HEIGHT * 0.06 : HEIGHT * 0.055,
        borderRadius: Platform.OS === "ios" ? 12 : 10,
    },
    googleButtonAndroid: {
        minHeight: Platform.OS === "android" ? HEIGHT * 0.052 : HEIGHT * 0.055,
        elevation: 2,
    },
    googleIcon: {
        width: 22,
        height: 22,
        resizeMode: "contain",
    },
    googleButtonText: {
        fontSize: HEIGHT * 0.014,
        color: "#666666",
        fontFamily: FIRASANS,
    },
    otpTimer: {
        fontSize: HEIGHT * 0.013,
        color: BRANDCOLOR,
        textAlign: "center",
        marginTop: HEIGHT * 0.005,
    },
    resendInfo: {
        fontSize: HEIGHT * 0.013,
        color: BLACK,
        textAlign: "center",
        marginTop: HEIGHT * 0.005,
    },
    otpStatus: {
        fontFamily: FIRASANSSEMIBOLD,
        fontSize: HEIGHT * 0.015,
        textAlign: 'center',
        marginVertical: HEIGHT * 0.01,
    },
    otpValid: {
        color: 'green',
    },
    otpError: {
        color: 'red',
    },
});