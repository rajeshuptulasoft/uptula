import React, { useState, useEffect, useRef, useCallback } from "react";
import { StatusBar, StyleSheet, Text, TouchableOpacity, View, Image, BackHandler, ScrollView, KeyboardAvoidingView, Platform, SafeAreaView, Modal, FlatList } from "react-native";
import { useDispatch } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "../../hooks/useTranslation";
import { useLanguageRefresh } from "../../hooks/useLanguageRefresh";
import { translateRecordLabel } from "../../i18n/translateApiLabel";
import { translateText } from "../../i18n/googleTranslate";
import i18n, { getCurrentLanguage } from "../../i18n";
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
import { POSTNETWORK, GETNETWORK } from "../../utils/Network";
import { storeObjByKey } from "../../utils/Storage";
import { checkuserToken } from "../../redux/actions/auth";

const extractCategories = (result) => {
    if (Array.isArray(result?.categories)) return result.categories;
    if (Array.isArray(result?.data?.categories)) return result.data.categories;
    if (Array.isArray(result?.data?.data)) return result.data.data;
    if (Array.isArray(result?.data)) return result.data;
    if (result?.success && Array.isArray(result?.data)) return result.data;
    if (Array.isArray(result)) return result;
    return [];
};

const extractSubcategories = (result) => {
    if (Array.isArray(result?.subcategories)) return result.subcategories;
    if (Array.isArray(result?.data?.subcategories)) return result.data.subcategories;
    if (Array.isArray(result?.data?.data)) return result.data.data;
    if (Array.isArray(result?.data)) return result.data;
    if (result?.success && Array.isArray(result?.data)) return result.data;
    if (Array.isArray(result)) return result;
    return [];
};

const getCategoryId = (item) => {
    if (!item) return null;
    const raw = item.id ?? item._id ?? item.categoryId ?? item.category_id;
    if (raw == null || raw === "") return null;
    const num = Number(raw);
    return Number.isNaN(num) ? raw : num;
};

const getSubcategoryId = (item) => {
    if (!item) return null;
    const raw = item.id ?? item._id ?? item.subcategoryId ?? item.subcategory_id;
    if (raw == null || raw === "") return null;
    const num = Number(raw);
    return Number.isNaN(num) ? raw : num;
};

const getRecordId = (item) => getCategoryId(item) ?? getSubcategoryId(item);

const normalizeCategoryItem = (item) => {
    if (item == null) return null;

    if (typeof item === "string" || typeof item === "number") {
        const id = getRecordId({ id: item });
        return id != null ? { id, name: String(item) } : null;
    }

    const id = getRecordId(item);
    if (id == null) return null;
    const name =
        item.name ??
        item.label ??
        item.title ??
        item.category_name ??
        item.categoryName ??
        item.subcategory_name ??
        item.subcategoryName ??
        "";
    return { ...item, id, name: name || `Item ${id}` };
};

const isNotFoundResponse = (result) =>
    result?.httpStatus === 404 ||
    result?.status === 404 ||
    result?.statusCode === 404 ||
    /not\s*found/i.test(String(result?.message || ""));

const buildCategoryPayload = (category, subcategory) => {
    const categoryId = getCategoryId(category);
    const subcategoryId = getSubcategoryId(subcategory);
    if (!categoryId || !subcategoryId) return null;
    return {
        categoryId,
        subcategoryId,
        categoryIds: [categoryId],
        subcategoryIds: [subcategoryId],
    };
};

export default function RegisterScreen({ navigation }) {
    const dispatch = useDispatch();
    const { t, i18n } = useTranslation();

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
    const [otpStatusKind, setOtpStatusKind] = useState(null);
    const [otpStatusCustom, setOtpStatusCustom] = useState("");
    // const [otpExpiresAt, setOtpExpiresAt] = useState(null);
    const [otpTimer, setOtpTimer] = useState(0);
    const [resendCount, setResendCount] = useState(0);

    const timerRef = useRef(null);

    // Category and SubCategory states
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedSubcategory, setSelectedSubcategory] = useState(null);
    const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);
    const [subcategoriesDropdownOpen, setSubcategoriesDropdownOpen] = useState(false);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [loadingSubcategories, setLoadingSubcategories] = useState(false);
    const selectedCategoryRef = useRef(null);
    const selectedSubcategoryRef = useRef(null);
    const categoriesLoadedRef = useRef(false);

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

    const localizeMessage = async (message, fallbackKey) => {
        if (!message) return t(fallbackKey);
        const lang = getCurrentLanguage();
        if (lang === 'en') return message;
        try {
            return await translateText(message, lang);
        } catch {
            return message;
        }
    };

    const setOtpStatusMessage = async (kind, customMsg = "") => {
        setOtpStatusKind(kind);
        if (kind === "custom" && customMsg) {
            setOtpStatusCustom(await localizeMessage(customMsg, "register.somethingWentWrong"));
        } else {
            setOtpStatusCustom("");
        }
    };

    const shownOtpStatus = (() => {
        switch (otpStatusKind) {
            case "sent":
                return t("register.otpSent");
            case "verified":
                return t("register.otpVerified");
            case "expired":
                return t("register.otpExpired");
            case "custom":
                return otpStatusCustom;
            default:
                return "";
        }
    })();

    const sendOtp = async (isResend = false) => {
        if (!name || !email || !contactNumber || !password || !confirmPassword) {
            setToastMessage({ type: "error", msg: t('register.fillAllFields'), visible: true });
            return;
        }

        if (password !== confirmPassword) {
            setToastMessage({ type: "error", msg: t('register.passwordMismatch'), visible: true });
            return;
        }

        if (isResend && resendCount >= 5) {
            setToastMessage({ type: "error", msg: t('register.maxResend'), visible: true });
            return;
        }

        const category = selectedCategoryRef.current ?? selectedCategory;
        const subcategory = selectedSubcategoryRef.current ?? selectedSubcategory;
        let categoryPayload = null;

        if (userType === "JobSeeker") {
            categoryPayload = buildCategoryPayload(category, subcategory);
            console.log("[Register] Send OTP — category selection", {
                categoryName: category?.name,
                subcategoryName: subcategory?.name,
                categoryPayload,
            });
            if (!categoryPayload) {
                console.log("[Register] Send OTP blocked — category or subcategory missing");
                setToastMessage({
                    type: "error",
                    msg: t('register.selectCategorySub'),
                    visible: true,
                });
                return;
            }
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
                password: password,
                ...(categoryPayload || {}),
            };

            console.log("[Register] Send OTP — posting", {
                isResend,
                url,
                payload: {
                    ...payload,
                    password: "***",
                },
            });

            const result = await POSTNETWORK(url, payload, false);

            console.log("[Register] Send OTP — response", {
                isResend,
                success: result?.success,
                status: result?.status,
                message: result?.message,
                raw: result,
            });

            const message = (result?.message || "").toString();
            const isSuccess =
                result?.success === true ||
                result?.status === "success" ||
                /otp\s*sent/i.test(message);

            if (isSuccess) {
                console.log("[Register] Send OTP — success", { isResend, message: message || "OTP sent" });

                setIsOtpStep(true);
                setEnteredOtp("");
                setOtpTimer(60); // 1 minute timer
                await setOtpStatusMessage("sent");

                if (isResend) {
                    setResendCount(prev => prev + 1);
                }

                setToastMessage({
                    type: "success",
                    msg: await localizeMessage(result?.message, 'register.otpSentSuccess'),
                    visible: true
                });

            } else {
                console.log("[Register] Send OTP — failed", {
                    isResend,
                    message: message || "Failed to send OTP",
                    raw: result,
                });
                const failMsg = await localizeMessage(message, 'register.failedSendOtp');
                await setOtpStatusMessage("custom", failMsg);
                setToastMessage({
                    type: "error",
                    msg: failMsg,
                    visible: true
                });
            }

        } catch (error) {
            console.log("[Register] Send OTP — error", {
                isResend,
                message: error?.message,
                raw: error,
            });
            setToastMessage({
                type: "error",
                msg: t('register.networkError'),
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
        setOtpStatusKind(null);
        setOtpStatusCustom("");
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
                    setOtpStatusKind("expired");
                    setOtpStatusCustom("");
                    setToastMessage({ type: "error", msg: t('register.otpExpired'), visible: true });
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
    }, [isOtpStep, otpTimer, t]);

    const [userType, setUserType] = useState("JobSeeker"); // Default selection
    const [toastMessage, setToastMessage] = useState({ type: "", msg: "", visible: false });
    const [alertVisible, setAlertVisible] = useState(false);

    useEffect(() => {
        // Configure Google Sign-In (web client = type WEB from Firebase / Google Cloud)
        const webClientId = '193282547247-o8ccoi23uh80eb4vnb8sdnit0hnvd10l.apps.googleusercontent.com';
        GoogleSignin.configure({
            webClientId,
            offlineAccess: true,
            scopes: ['profile', 'email'],
            forceCodeForRefreshToken: true,
        });
        // console.log("[GoogleRegister] GoogleSignin.configure done", {
        //     platform: Platform.OS,
        //     webClientIdSuffix: webClientId.slice(-20),
        // });

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

    // Fetch categories on component mount
    const fetchCategories = useCallback(async ({ silent = false } = {}) => {
        const showLoader = !silent && !categoriesLoadedRef.current;

        try {
            if (showLoader) setLoadingCategories(true);
            const url = `${BASE_URL}categories/categories`;
            const result = await GETNETWORK(url, false);
            const list = extractCategories(result)
                .map(normalizeCategoryItem)
                .filter(Boolean);

            if (list.length > 0) {
                categoriesLoadedRef.current = true;
                setCategories(list);
            } else if (isNotFoundResponse(result)) {
                setCategories([]);
                setToastMessage({
                    type: "error",
                    msg: i18n.t('register.failedLoadCategories'),
                    visible: true,
                });
            } else {
                setCategories([]);
                setToastMessage({
                    type: "error",
                    msg: result?.message || i18n.t('register.noCategories'),
                    visible: true,
                });
            }
        } catch (error) {
            setCategories([]);
            setToastMessage({
                type: "error",
                msg: i18n.t('register.failedLoadCategories'),
                visible: true,
            });
        } finally {
            if (showLoader) setLoadingCategories(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

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
            setOtpStatusKind(null);
            setOtpStatusCustom("");
            // setOtpExpiresAt(null);
            setOtpTimer(0);
            setResendCount(0);
            setAlertVisible(false);
            setToastMessage({ type: "", msg: "", visible: false });
            setSelectedCategory(null);
            setSelectedSubcategory(null);
            selectedCategoryRef.current = null;
            selectedSubcategoryRef.current = null;
            setSubcategories([]);
            setCategoriesDropdownOpen(false);
            setSubcategoriesDropdownOpen(false);
            setLoadingCategories(false);
            setLoadingSubcategories(false);
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
        const category = selectedCategoryRef.current ?? selectedCategory;
        const subcategory = selectedSubcategoryRef.current ?? selectedSubcategory;

        if (userType === "JobSeeker") {
            const categoryPayload = buildCategoryPayload(category, subcategory);
            console.log("[Register] Verify OTP — category selection", {
                categoryName: category?.name,
                subcategoryName: subcategory?.name,
                categoryPayload,
            });
            if (!categoryPayload) {
                console.log("[Register] Verify OTP blocked — category or subcategory missing");
                setToastMessage({
                    type: "error",
                    msg: t('register.selectCategorySub'),
                    visible: true,
                });
                return;
            }
        }

        if (enteredOtp.length !== 6) {
            setToastMessage({
                type: "error",
                msg: t('register.enterValidOtp'),
                visible: true
            });
            return;
        }

        try {
            const url = `${BASE_URL}auth/verify-register-otp`;
            const categoryPayload = userType === "JobSeeker"
                ? buildCategoryPayload(category, subcategory)
                : null;

            const payload = {
                email: email,
                otp: enteredOtp,
                ...(categoryPayload || {}),
            };

            console.log("[Register] Verify OTP — posting", {
                url,
                payload: {
                    ...payload,
                    otp: "******",
                },
            });

            const result = await POSTNETWORK(url, payload, false);

            console.log("[Register] Verify OTP — response", {
                success: result?.success,
                status: result?.status,
                statusCode: result?.statusCode,
                message: result?.message,
                hasToken: !!result?.token,
                raw: result,
            });

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
                console.log("[Register] Verify OTP — success, storing login data", {
                    role: result?.user?.role,
                    categoryPayload,
                });
                await setOtpStatusMessage("verified");

                const loginDataToStore = {
                    token: result?.token,
                    role: result?.user?.role,
                    userType: result?.user?.role,
                    user: {
                        ...result?.user,
                        email: email,
                        ...(categoryPayload || {}),
                    },
                };

                await storeObjByKey("loginResponse", loginDataToStore);

                setToastMessage({
                    type: "success",
                    msg: await localizeMessage(result?.message, 'register.registrationSuccess'),
                    visible: true
                });

                setTimeout(() => {
                    navigation.navigate("Login");
                }, 1500);

            } else {
                console.log("[Register] Verify OTP — failed", result);
                const failMsg = result?.message || t('register.invalidOtp');
                await setOtpStatusMessage("custom", failMsg);
                setToastMessage({
                    type: "error",
                    msg: await localizeMessage(failMsg, 'register.invalidOtp'),
                    visible: true
                });
            }

        } catch (error) {
            console.log("[Register] Verify OTP — error", {
                message: error?.message,
                raw: error,
            });
            await setOtpStatusMessage("custom", t('register.somethingWentWrong'));
            setToastMessage({
                type: "error",
                msg: t('register.somethingWentWrong'),
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
        const apiUrl = `${BASE_URL}auth/firebase`;
        const rolePayload = userType === "JobSeeker" ? "JobSeeker" : "JobProvider";

        // console.log("[GoogleRegister] Started", {
        //     platform: Platform.OS,
        //     userType,
        //     rolePayload,
        //     apiUrl,
        // });

        try {
            // console.log("[GoogleRegister] Step 1: hasPlayServices...");
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
            // console.log("[GoogleRegister] Step 1: Play Services OK");

            // console.log("[GoogleRegister] Step 2: signOut (clear prior session)...");
            await GoogleSignin.signOut();
            // console.log("[GoogleRegister] Step 2: signOut done");

            // console.log("[GoogleRegister] Step 3: signIn...");
            const signInResult = await GoogleSignin.signIn();
            // console.log("[GoogleRegister] Step 3: signIn result", {
            //     type: signInResult?.type,
            //     hasData: !!signInResult?.data,
            //     email: signInResult?.data?.user?.email ?? signInResult?.user?.email ?? "(none)",
            //     cancelled: signInResult?.type === "cancelled",
            // });

            if (signInResult?.type === "cancelled") {
                throw Object.assign(new Error("User cancelled Google sign-up"), { code: "SIGN_IN_CANCELLED" });
            }

            // console.log("[GoogleRegister] Step 4: getTokens...");
            const tokens = await GoogleSignin.getTokens();
            const { idToken } = tokens || {};

            // console.log("[GoogleRegister] Step 4: tokens", {
            //     hasIdToken: !!idToken,
            //     idTokenLength: idToken?.length ?? 0,
            // });

            if (!idToken) {
                // console.log("[GoogleRegister] ERROR: No idToken from getTokens()");
                throw new Error("No ID token found");
            }

            // console.log("[GoogleRegister] Step 5: Firebase credential...");
            const googleCredential = auth.GoogleAuthProvider.credential(idToken);

            // console.log("[GoogleRegister] Step 6: signInWithCredential...");
            const userCredential = await auth().signInWithCredential(googleCredential);
            const user = userCredential.user;
            // console.log("[GoogleRegister] Step 6: Firebase auth OK", {
            //     uid: user?.uid,
            //     email: user?.email,
            // });

            // console.log("[GoogleRegister] Step 7: getIdToken...");
            const firebaseToken = await user.getIdToken();
            // console.log("[GoogleRegister] Step 7: Firebase idToken length:", firebaseToken?.length ?? 0);

            const requestBody = {
                token: firebaseToken,
                role: rolePayload,
                fullName: user.displayName || "",
                email: user.email || "",
            };

            // console.log("[GoogleRegister] Step 8: POST backend...", apiUrl, {
            //     role: requestBody.role,
            //     fullName: requestBody.fullName,
            //     email: requestBody.email,
            //     tokenLength: firebaseToken?.length ?? 0,
            // });
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            const responseText = await response.text();
            // console.log("[GoogleRegister] Step 8: API response", {
            //     status: response.status,
            //     ok: response.ok,
            //     bodyPreview: responseText?.slice(0, 500),
            // });

            let data = {};
            try {
                data = responseText ? JSON.parse(responseText) : {};
            } catch (parseErr) {
                // console.log("[GoogleRegister] ERROR: API response is not JSON", parseErr?.message);
                throw new Error(`Invalid API response (status ${response.status})`);
            }

            // console.log("[GoogleRegister] Step 8: parsed API data", {
            //     success: data?.success,
            //     message: data?.message,
            //     hasToken: !!data?.token,
            //     userRole: data?.user?.role,
            // });

            if (response.ok) {
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

                await storeObjByKey("loginResponse", loginDataToStore);
                // console.log("[GoogleRegister] SUCCESS: registration stored, navigating as", userType);

                setToastMessage({
                    type: "success",
                    msg: "Google registration successful!",
                    visible: true,
                });

                dispatch(checkuserToken());

                if (userType === "JobProvider") {
                    navigation.navigate("EmployerProfile");
                } else {
                    navigation.navigate("Profile");
                }

            } else {
                // console.log("[GoogleRegister] FAILED: backend rejected signup", {
                //     status: response.status,
                //     message: data?.message,
                //     error: data?.error,
                // });

                setToastMessage({
                    type: "error",
                    msg: data?.message || "Google sign-up failed",
                    visible: true,
                });
            }

        } catch (error) {
            // console.log("[GoogleRegister] ERROR caught", {
            //     code: error?.code,
            //     message: error?.message,
            //     nativeErrorCode: error?.nativeErrorCode,
            //     name: error?.name,
            // });
            if (error?.stack) {
                // console.log("[GoogleRegister] stack:", error.stack);
            }

            let errorMessage = "Google sign-up failed. Please try again.";

            if (error.code === 'SIGN_IN_CANCELLED' || error.code === '12501') {
                errorMessage = "Google sign-up was cancelled.";
            } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
                errorMessage = "Google Play Services not available.";
            } else if (error.code === 'DEVELOPER_ERROR' || error.code === '10') {
                errorMessage = "Developer error: add Play Store signing SHA-1 to Firebase / Google Cloud.";
                // console.log("[GoogleRegister] HINT: Release build needs App signing key SHA-1 from Play Console → App integrity.");
            } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/account-exists-with-different-credential') {
                errorMessage = `Firebase: ${error.message}`;
            }

            setToastMessage({
                type: "error",
                msg: errorMessage,
                visible: true,
            });
        } finally {
            // console.log("[GoogleRegister] Finished");
        }
    };

    const Container = Platform.OS === "ios" ? SafeAreaView : View;

    const loadSubcategories = useCallback(async (categoryId) => {
        if (categoryId == null || categoryId === "") return;

        try {
            setLoadingSubcategories(true);
            const url = `${BASE_URL}categories/categories/${categoryId}/subcategories`;
            const result = await GETNETWORK(url, false);
            const list = extractSubcategories(result)
                .map(normalizeCategoryItem)
                .filter(Boolean);

            const activeCategoryId = getCategoryId(selectedCategoryRef.current);
            if (activeCategoryId != null && String(activeCategoryId) !== String(categoryId)) {
                return;
            }

            setSubcategories(list);

            if (list.length === 0 && isNotFoundResponse(result)) {
                setToastMessage({
                    type: "error",
                    msg: i18n.t("register.failedLoadSubcategories"),
                    visible: true,
                });
            }
        } catch (error) {
            const activeCategoryId = getCategoryId(selectedCategoryRef.current);
            if (activeCategoryId != null && String(activeCategoryId) !== String(categoryId)) {
                return;
            }
            setSubcategories([]);
            setToastMessage({
                type: "error",
                msg: i18n.t("register.failedLoadSubcategories"),
                visible: true,
            });
        } finally {
            const activeCategoryId = getCategoryId(selectedCategoryRef.current);
            if (activeCategoryId == null || String(activeCategoryId) === String(categoryId)) {
                setLoadingSubcategories(false);
            }
        }
    }, []);

    const openSubcategoryPicker = useCallback(async () => {
        setCategoriesDropdownOpen(false);

        const category = selectedCategoryRef.current ?? selectedCategory;
        const categoryId = getCategoryId(category);
        if (!categoryId) {
            setToastMessage({
                type: "error",
                msg: i18n.t("register.selectCategorySub"),
                visible: true,
            });
            return;
        }

        setSubcategoriesDropdownOpen(true);

        if (!subcategories.length) {
            await loadSubcategories(categoryId);
        }
    }, [loadSubcategories, selectedCategory, subcategories.length]);

    const refreshRegisterApiData = useCallback(async () => {
        await fetchCategories({ silent: true });
        const category = selectedCategoryRef.current;
        const categoryId = getCategoryId(selectedCategoryRef.current);
        if (categoryId) {
            await loadSubcategories(categoryId);
        }
    }, [fetchCategories, loadSubcategories]);

    useLanguageRefresh(refreshRegisterApiData);

    // Fetch subcategories when category is selected
    const handleCategorySelect = async (category) => {
        const categoryId = getCategoryId(category);
        console.log("[Register] Category selected", {
            id: categoryId,
            name: category?.name,
            raw: category,
        });

        setSelectedCategory(category);
        selectedCategoryRef.current = category;
        setCategoriesDropdownOpen(false);
        setSelectedSubcategory(null);
        selectedSubcategoryRef.current = null;
        setSubcategories([]);

        if (!categoryId) {
            setToastMessage({
                type: "error",
                msg: i18n.t("register.selectCategorySub"),
                visible: true,
            });
            return;
        }

        await loadSubcategories(categoryId);
    };

    const renderPickerModal = ({
        visible,
        title,
        items,
        loading,
        emptyText,
        onClose,
        onSelect,
        centered = false,
        getItemLabel,
    }) => {
        const listContent = loading && !items?.length ? (
            <View style={styles.pickerModalBody}>
                <Text style={styles.pickerModalEmpty}>{t('common.loading')}</Text>
            </View>
        ) : !items?.length ? (
            <View style={styles.pickerModalBody}>
                <Text style={styles.pickerModalEmpty}>{emptyText}</Text>
            </View>
        ) : (
            <FlatList
                style={styles.pickerModalList}
                data={items}
                keyExtractor={(item, index) => `${getCategoryId(item) ?? getSubcategoryId(item) ?? item?.slug ?? index}`}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.pickerModalItem}
                        onPress={() => onSelect(item)}
                    >
                        <Text style={styles.pickerModalItemText}>
                            {getItemLabel ? getItemLabel(item) : (item?.name || item?.label || "—")}
                        </Text>
                    </TouchableOpacity>
                )}
                showsVerticalScrollIndicator
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.pickerModalListContent}
            />
        );

        const sheetContent = (
            <View style={styles.pickerModalSheet}>
                <View style={[styles.pickerModalHeader, centered && styles.pickerModalHeaderCenter]}>
                    <Text style={styles.pickerModalTitle}>{title}</Text>
                    <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                        <Text style={styles.pickerModalClose}>✕</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.pickerModalSheetBody}>
                    {listContent}
                </View>
            </View>
        );

        return (
            <Modal
                visible={visible}
                transparent={centered}
                animationType={centered ? "fade" : "slide"}
                statusBarTranslucent
                onRequestClose={onClose}
            >
                {centered ? (
                    <View style={styles.pickerModalCenterRoot}>
                        <TouchableOpacity
                            style={styles.pickerModalDismissArea}
                            activeOpacity={1}
                            onPress={onClose}
                        />
                        <View style={styles.pickerModalCenterSheet}>
                            {sheetContent}
                        </View>
                    </View>
                ) : (
                    <View style={styles.pickerModalRoot}>
                        <StatusBar backgroundColor={WHITE} barStyle="dark-content" />
                        {sheetContent}
                    </View>
                )}
            </Modal>
        );
    };

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
                                            {t('register.jobSeeker')}
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
                                            {t('register.jobProvider')}
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
                                        placeholder={t('register.fullName')}
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
                                        placeholder={t('register.email')}
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
                                        placeholder={t('register.phone')}
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
                                        placeholder={t('register.password')}
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
                                        placeholder={t('register.confirmPassword')}
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

                                {/* Category Dropdown - Only for JobSeeker */}
                                {userType === "JobSeeker" && (
                                    <View style={[
                                        styles.txtInputContainer,
                                        Platform.OS === "ios" && styles.txtInputContainerIOS,
                                        Platform.OS === "android" && styles.txtInputContainerAndroid,
                                    ]}>
                                        <TouchableOpacity
                                            style={[
                                                styles.categoryDropdown,
                                                Platform.OS === "ios" && styles.categoryDropdownIOS,
                                                Platform.OS === "android" && styles.categoryDropdownAndroid
                                            ]}
                                            onPress={() => {
                                                setSubcategoriesDropdownOpen(false);
                                                setCategoriesDropdownOpen(true);
                                            }}
                                        >
                                            <Text style={[
                                                styles.categoryDropdownText,
                                                Platform.OS === "ios" && styles.categoryDropdownTextIOS,
                                                Platform.OS === "android" && styles.categoryDropdownTextAndroid,
                                                !selectedCategory && { color: "#999" }
                                            ]}>
                                                {loadingCategories && !categories.length ? t('common.loading') : (selectedCategory ? translateRecordLabel(selectedCategory) : t('register.selectCategory'))}
                                            </Text>
                                            <Image source={require("../../assets/images/downarrow.png")} style={styles.dropdownIcon} />
                                        </TouchableOpacity>
                                    </View>
                                )}

                                {/* SubCategory Dropdown - Only for JobSeeker and when Category is selected */}
                                {userType === "JobSeeker" && selectedCategory && (
                                    <View style={[
                                        styles.txtInputContainer,
                                        Platform.OS === "ios" && styles.txtInputContainerIOS,
                                        Platform.OS === "android" && styles.txtInputContainerAndroid,
                                    ]}>
                                        <TouchableOpacity
                                            style={[
                                                styles.categoryDropdown,
                                                Platform.OS === "ios" && styles.categoryDropdownIOS,
                                                Platform.OS === "android" && styles.categoryDropdownAndroid
                                            ]}
                                            onPress={openSubcategoryPicker}
                                        >
                                            <Text style={[
                                                styles.categoryDropdownText,
                                                Platform.OS === "ios" && styles.categoryDropdownTextIOS,
                                                Platform.OS === "android" && styles.categoryDropdownTextAndroid,
                                                !selectedSubcategory && { color: "#999" }
                                            ]}>
                                                {loadingSubcategories && !subcategories.length ? t('common.loading') : (selectedSubcategory ? translateRecordLabel(selectedSubcategory) : t('register.selectSubCategory'))}
                                            </Text>
                                            <Image source={require("../../assets/images/downarrow.png")} style={styles.dropdownIcon} />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </>
                        )}

                        <View style={{ height: HEIGHT * 0.03 }} />

                        {!isOtpStep ? (
                            <CustomButton
                                color={WHITE}
                                text={t('register.sendOtp')}
                                onPress={() => sendOtp(false)}
                                fontFamily={FIRASANSSEMIBOLD}
                            />
                        ) : (
                            <View key={i18n.language}>
                                <Text allowFontScaling={false} style={styles.otpStepTitle}>
                                    {t('register.enterOtp')}
                                </Text>
                                <Text allowFontScaling={false} style={styles.otpStepHint}>
                                    {t('register.otpInstruction')}
                                </Text>

                                {!!shownOtpStatus && (
                                    <Text
                                        allowFontScaling={false}
                                        style={[
                                            styles.otpStatus,
                                            otpStatusKind === "verified" ? styles.otpValid : styles.otpError,
                                        ]}
                                    >
                                        {shownOtpStatus}
                                    </Text>
                                )}

                                <OtpInput onOtpChange={onOtpChange} />

                                {isOtpStep && otpTimer > 0 && (
                                    <Text allowFontScaling={false} style={styles.otpTimer}>
                                        {t('register.otpExpires', {
                                            time: `${Math.floor(otpTimer / 60)}:${String(otpTimer % 60).padStart(2, '0')}`,
                                        })}
                                    </Text>
                                )}

                                {resendCount > 0 && (
                                    <Text allowFontScaling={false} style={styles.resendInfo}>
                                        {t('register.resendAttempts', { count: Math.max(0, 5 - resendCount) })}
                                    </Text>
                                )}

                                <CustomButton
                                    color={WHITE}
                                    text={t('register.registerBtn')}
                                    onPress={handleRegister}
                                    fontFamily={FIRASANSSEMIBOLD}
                                />

                                {otpStatusKind !== "verified" && (
                                    <>
                                        <View style={{ height: HEIGHT * 0.02 }} />
                                        <CustomButton
                                            color={resendCount >= 5 ? "#cccccc" : WHITE}
                                            text={resendCount >= 5 ? t('register.resendLimit') : t('register.resendOtp')}
                                            onPress={() => {
                                                if (resendCount >= 5) {
                                                    setToastMessage({ type: "error", msg: t('register.maxResendToast'), visible: true });
                                                } else {
                                                    sendOtp(true);
                                                }
                                            }}
                                            fontFamily={FIRASANSSEMIBOLD}
                                        />
                                    </>
                                )}
                            </View>
                        )}

                        <View style={{ height: HEIGHT * 0.02 }} />

                        {/* OR SEPARATOR */}
                        <View style={styles.orContainer}>
                            <View style={styles.orLine} />
                            <Text style={styles.orText}>{t('register.or')}</Text>
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
                            <Text style={styles.googleButtonText}>{t('register.continueGoogle')}</Text>
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
                            {t('register.haveAccount')}
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
                                {` ${t('register.loginHere')}`}
                            </Text>
                        </Text>
                    </View>

                    {/* Date Picker removed for static registration */}

                </ScrollView>

                {/* Category picker popup */}
                {renderPickerModal({
                    visible: categoriesDropdownOpen,
                    title: t('register.selectCategory'),
                    items: categories,
                    loading: loadingCategories && !categories.length,
                    emptyText: t('register.noCategories'),
                    onClose: () => setCategoriesDropdownOpen(false),
                    onSelect: handleCategorySelect,
                    getItemLabel: (item) => translateRecordLabel(item),
                })}

                {/* Subcategory picker popup */}
                {renderPickerModal({
                    visible: subcategoriesDropdownOpen,
                    title: t('register.selectSubCategory'),
                    items: subcategories,
                    loading: loadingSubcategories && !subcategories.length,
                    emptyText: t('register.noSubcategories'),
                    onClose: () => setSubcategoriesDropdownOpen(false),
                    onSelect: (subcategory) => {
                        console.log("[Register] Subcategory selected", {
                            id: getSubcategoryId(subcategory),
                            name: subcategory?.name,
                            raw: subcategory,
                        });
                        setSelectedSubcategory(subcategory);
                        selectedSubcategoryRef.current = subcategory;
                        setSubcategoriesDropdownOpen(false);
                    },
                    centered: true,
                    getItemLabel: (item) => translateRecordLabel(item),
                })}

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
    otpStepTitle: {
        fontFamily: FIRASANSSEMIBOLD,
        fontSize: HEIGHT * 0.02,
        color: BLACK,
        textAlign: "center",
        marginBottom: HEIGHT * 0.008,
    },
    otpStepHint: {
        fontFamily: FIRASANS,
        fontSize: HEIGHT * 0.014,
        color: "#666666",
        textAlign: "center",
        marginBottom: HEIGHT * 0.012,
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
    categoryDropdown: {
        paddingVertical: HEIGHT * 0.018,
        paddingHorizontal: WIDTH * 0.04,
        borderWidth: 1,
        borderRadius: 10,
        borderColor: BRANDCOLOR,
        backgroundColor: WHITE,
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    categoryDropdownIOS: {
        paddingVertical: Platform.OS === "ios" ? HEIGHT * 0.02 : HEIGHT * 0.018,
        paddingHorizontal: Platform.OS === "ios" ? WIDTH * 0.05 : WIDTH * 0.04,
        borderRadius: Platform.OS === "ios" ? 12 : 10,
        borderWidth: Platform.OS === "ios" ? 1.5 : 1,
    },
    categoryDropdownAndroid: {
        paddingVertical: Platform.OS === "android" ? HEIGHT * 0.017 : HEIGHT * 0.018,
        paddingHorizontal: Platform.OS === "android" ? WIDTH * 0.03 : WIDTH * 0.04,
        borderRadius: Platform.OS === "android" ? 8 : 10,
        elevation: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
    },
    categoryDropdownText: {
        fontSize: HEIGHT * 0.015,
        fontFamily: FIRASANSSEMIBOLD,
        color: BLACK,
        flex: 1,
    },
    categoryDropdownTextIOS: {
        fontSize: Platform.OS === "ios" ? HEIGHT * 0.016 : HEIGHT * 0.015,
    },
    categoryDropdownTextAndroid: {
        fontSize: Platform.OS === "android" ? HEIGHT * 0.014 : HEIGHT * 0.015,
    },
    dropdownOptionText: {
        fontSize: HEIGHT * 0.014,
        fontFamily: FIRASANS,
        color: BLACK,
    },
    pickerModalRoot: {
        flex: 1,
        backgroundColor: WHITE,
    },
    pickerModalCenterRoot: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: WIDTH * 0.06,
    },
    pickerModalDismissArea: {
        ...StyleSheet.absoluteFillObject,
    },
    pickerModalCenterSheet: {
        width: "100%",
        height: HEIGHT * 0.5,
        backgroundColor: WHITE,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: BRANDCOLOR,
        overflow: "hidden",
        zIndex: 2,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
            },
            android: { elevation: 10 },
        }),
    },
    pickerModalSheet: {
        flex: 1,
        backgroundColor: WHITE,
    },
    pickerModalSheetBody: {
        flex: 1,
        backgroundColor: WHITE,
    },
    pickerModalBody: {
        flex: 1,
        backgroundColor: WHITE,
        justifyContent: "center",
        alignItems: "center",
    },
    pickerModalList: {
        flex: 1,
        backgroundColor: WHITE,
    },
    pickerModalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: WIDTH * 0.05,
        paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + HEIGHT * 0.012 : HEIGHT * 0.02,
        paddingBottom: HEIGHT * 0.018,
        borderBottomWidth: 1,
        borderBottomColor: "#E8E8E8",
        backgroundColor: WHITE,
    },
    pickerModalHeaderCenter: {
        paddingTop: HEIGHT * 0.018,
    },
    pickerModalTitle: {
        fontSize: HEIGHT * 0.018,
        fontFamily: FIRASANSSEMIBOLD,
        color: BLACK,
        flex: 1,
    },
    pickerModalClose: {
        fontSize: HEIGHT * 0.02,
        color: "#666",
        paddingLeft: 12,
    },
    pickerModalListContent: {
        flexGrow: 1,
        paddingBottom: HEIGHT * 0.03,
        backgroundColor: WHITE,
    },
    pickerModalItem: {
        paddingVertical: HEIGHT * 0.018,
        paddingHorizontal: WIDTH * 0.05,
        borderBottomWidth: 1,
        borderBottomColor: "#F0F0F0",
        backgroundColor: WHITE,
    },
    pickerModalItemText: {
        fontSize: HEIGHT * 0.016,
        fontFamily: FIRASANS,
        color: BLACK,
    },
    pickerModalEmpty: {
        padding: WIDTH * 0.05,
        fontSize: HEIGHT * 0.015,
        fontFamily: FIRASANS,
        color: "#666",
        textAlign: "center",
        backgroundColor: WHITE,
    },
});