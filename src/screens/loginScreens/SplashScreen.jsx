import React, { useEffect, useRef } from "react";
import {
    Animated,
    Dimensions,
    Image,
    ImageBackground,
    StatusBar,
    StyleSheet,
    Text,
    View,
    Platform,
    SafeAreaView,
} from "react-native";
import { SPLASHSCREEN, UP } from "../../constant/imagePath";
import { UBUNTUBOLD, UBUNTU } from "../../constant/fontPath";
import { PermissionsAndroid } from "react-native";
import { getStringByKey } from "../../utils/Storage";
import { NotificationListener, requestUserPermission } from "../../utils/PushNotification";
import SpInAppUpdates, { IAUUpdateKind } from "sp-react-native-in-app-updates";
import { BASE_URL } from "../../constant/url";
import messaging from "@react-native-firebase/messaging";
import { useTranslation } from "../../hooks/useTranslation";
import { ensureLanguageLoaded } from "../../i18n";

const TEXT_GREEN = "#1B5E3B";
const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function SplashScreen({ navigation, onFinish }) {
    const { t } = useTranslation();
    const logoScale = useRef(new Animated.Value(0.7)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const textOpacity = useRef(new Animated.Value(0)).current;
    const textTranslate = useRef(new Animated.Value(16)).current;
    const contentOpacity = useRef(new Animated.Value(1)).current;
    const finishedRef = useRef(false);
    const inAppUpdates = useRef(new SpInAppUpdates(false)).current;

    const finishSplash = async () => {
        if (finishedRef.current) return;
        finishedRef.current = true;

        if (typeof onFinish === "function") {
            onFinish();
            return;
        }

        if (!navigation?.navigate) return;

        const hasSeenOnboarding = await getStringByKey("hasSeenOnboarding");
        if (hasSeenOnboarding === "true") {
            navigation.navigate("MainTabs");
        } else {
            navigation.navigate("OnBoarding");
        }
    };

    /* Play Store in-app update check */
    const triggerInAppUpdate = async () => {
        try {
            const result = await inAppUpdates.checkNeedsUpdate();
            if (result?.shouldUpdate) {
                await inAppUpdates.startUpdate({
                    updateType: IAUUpdateKind.FLEXIBLE,
                });
            }
        } catch (error) {
            console.log("Update check error:", error?.message || error);
        }
    };

    useEffect(() => {
        triggerInAppUpdate();

        const onStatusUpdate = (status) => {
            console.log("Update status:", status);
        };

        try {
            inAppUpdates.addStatusUpdateListener(onStatusUpdate);
        } catch (_) {
            /* ignore */
        }

        return () => {
            try {
                inAppUpdates.removeStatusUpdateListener(onStatusUpdate);
            } catch (_) {
                /* ignore */
            }
        };
    }, []);

    useEffect(() => {
        let cancelled = false;
        let safetyTimer = null;

        const prepareSplash = async () => {
            try {
                await ensureLanguageLoaded();
            } catch (_) {
                /* continue with English */
            }

            if (cancelled) return;

            Animated.sequence([
                Animated.parallel([
                    Animated.timing(logoOpacity, {
                        toValue: 1,
                        duration: 450,
                        useNativeDriver: true,
                    }),
                    Animated.spring(logoScale, {
                        toValue: 1,
                        friction: 6,
                        tension: 80,
                        useNativeDriver: true,
                    }),
                ]),
                Animated.delay(180),
                Animated.parallel([
                    Animated.timing(textOpacity, {
                        toValue: 1,
                        duration: 450,
                        useNativeDriver: true,
                    }),
                    Animated.timing(textTranslate, {
                        toValue: 0,
                        duration: 450,
                        useNativeDriver: true,
                    }),
                ]),
                Animated.delay(1700),
                Animated.timing(contentOpacity, {
                    toValue: 0,
                    duration: 350,
                    useNativeDriver: true,
                }),
            ]).start(({ finished }) => {
                if (finished && !cancelled) {
                    finishSplash();
                }
            });

            // Never leave the user stuck on splash
            safetyTimer = setTimeout(() => {
                if (!cancelled) finishSplash();
            }, 5000);
        };

        prepareSplash();

        return () => {
            cancelled = true;
            if (safetyTimer) clearTimeout(safetyTimer);
        };
    }, []);

    useEffect(() => {
        const initializeNotifications = async () => {
            try {
                if (Platform.OS === "android") {
                    await PermissionsAndroid.request(
                        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
                    );
                }

                await requestUserPermission();
                NotificationListener();

                const token = await messaging().getToken();
                const user = await getStringByKey("user");
                const parsedUser = user ? JSON.parse(user) : null;

                if (token) {
                    await fetch(`${BASE_URL}profile/save-fcm-token`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            userId: parsedUser?.id,
                            token: token,
                        }),
                    });
                }
            } catch (error) {
                console.error("Error initializing notifications:", error);
            }
        };
        initializeNotifications();
    }, []);

    const Container = Platform.OS === "ios" ? SafeAreaView : View;
    const sloganLine1 = t("splash.sloganLine1");
    const sloganLine2 = t("splash.sloganLine2");

    return (
        <>
            <StatusBar
                backgroundColor="transparent"
                barStyle="dark-content"
                translucent
            />

            <ImageBackground
                source={SPLASHSCREEN}
                style={styles.background}
                resizeMode="cover"
            >
                <Container style={styles.container}>
                    <Animated.View
                        style={[
                            styles.brandBlock,
                            { opacity: contentOpacity },
                        ]}
                    >
                        <Animated.View
                            style={[
                                styles.logoWrap,
                                {
                                    opacity: logoOpacity,
                                    transform: [{ scale: logoScale }],
                                },
                            ]}
                        >
                            <Image
                                style={styles.logo}
                                source={UP}
                                resizeMode="contain"
                            />
                        </Animated.View>

                        <Animated.View
                            style={[
                                styles.textWrap,
                                {
                                    opacity: textOpacity,
                                    transform: [{ translateY: textTranslate }],
                                },
                            ]}
                        >
                            <Text style={styles.brandName}>Uptula</Text>
                            <Text style={styles.tagline}>
                                {sloganLine1}
                                {"\n"}
                                {sloganLine2}
                            </Text>
                        </Animated.View>
                    </Animated.View>
                </Container>
            </ImageBackground>
        </>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        width: "100%",
        height: "100%",
    },
    container: {
        flex: 1,
        backgroundColor: "transparent",
        alignItems: "center",
        // Place logo + text inside the white glow area of the splash art
        paddingTop: SCREEN_HEIGHT * 0.26,
    },
    brandBlock: {
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        paddingHorizontal: 28,
    },
    logoWrap: {
        alignItems: "center",
        justifyContent: "center",
    },
    logo: {
        height: 92,
        width: 92,
    },
    textWrap: {
        alignItems: "center",
        marginTop: 8,
    },
    brandName: {
        color: TEXT_GREEN,
        fontSize: 30,
        fontFamily: UBUNTUBOLD,
        textAlign: "center",
        letterSpacing: 0.3,
        lineHeight: 34,
    },
    tagline: {
        marginTop: 4,
        color: TEXT_GREEN,
        fontSize: 13,
        fontFamily: UBUNTU,
        textAlign: "center",
        lineHeight: 18,
    },
});
