import React, { useEffect, useRef } from "react";
import { Animated, Image, StatusBar, StyleSheet, Text, View, Platform, SafeAreaView } from "react-native";
import { BLACK, BRANDCOLOR, WHITE } from "../../constant/color";
import { LOGO, UP } from "../../constant/imagePath";
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
    UBUNTU 
} from "../../constant/fontPath";
// import 'firebase/auth'
import { PermissionsAndroid } from 'react-native';
import { getStringByKey } from "../../utils/Storage";
import { NotificationListener, requestUserPermission } from "../../utils/PushNotification";
import SpInAppUpdates, { IAUUpdateKind } from "sp-react-native-in-app-updates";
import { BASE_URL } from "../../constant/url";
import messaging from '@react-native-firebase/messaging';

export default SplashScreen = ({ navigation }) => {

    const logoScale = useRef(new Animated.Value(0.8)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const sloganOpacity = useRef(new Animated.Value(0)).current;
    const sloganTranslate = useRef(new Animated.Value(-10)).current;
    const screenOpacity = useRef(new Animated.Value(0)).current;
    const inAppUpdates = new SpInAppUpdates(false);

    /* ✅ PlayStore Update Concept Start */
    const triggerInAppUpdate = async () => {
        try {
            console.log("🔍 Checking for update...");

            const result = await inAppUpdates.checkNeedsUpdate();

            console.log("📦 Update result:", result);

            if (result.shouldUpdate) {
                console.log("🚀 Update available → launching Play Store UI");

                await inAppUpdates.startUpdate({
                    updateType: IAUUpdateKind.FLEXIBLE,
                });

                console.log("✅ Update flow started");
            } else {
                console.log("✅ App is already up to date");
            }
        } catch (error) {
            console.log("❌ Update error:", error);
        }
    };
    /* ✅ PlayStore Update Concept Start */

      /* ✅ PlayStore App Update Check Starts */
      useEffect(() => {
        triggerInAppUpdate();
    
        inAppUpdates.addStatusUpdateListener((status) => {
            console.log("📊 Update status:", status);
    
            if (status === 11) {
                console.log("✅ Update downloaded (ready to install)");
            }
        });
    
        return () => {
            try {
                inAppUpdates.removeStatusUpdateListener();
            } catch (e) {
                console.log("⚠️ Listener cleanup error:", e);
            }
        };
    }, []);
    /* ✅ Playstore App Update Check Ends */


    useEffect(() => {
        // Zoom-in then zoom-out for logo, then show text
        // Ensure slogan is hidden during zoom-in
        sloganOpacity.setValue(0);

        Animated.sequence([
            Animated.parallel([
                Animated.timing(logoOpacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(logoScale, {
                    toValue: 1.4,
                    duration: 800,
                    easing: undefined,
                    useNativeDriver: true,
                }),
            ]),
            Animated.delay(300),
            Animated.timing(logoScale, {
                toValue: 0.95,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(logoScale, {
                toValue: 1,
                duration: 180,
                useNativeDriver: true,
            }),
            Animated.parallel([
                Animated.timing(sloganOpacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(sloganTranslate, {
                    toValue: 12,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ]),
            Animated.delay(1600),
            Animated.timing(screenOpacity, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            }),
        ]).start(async () => {
            // Check if user has seen onboarding before
            const hasSeenOnboarding = await getStringByKey("hasSeenOnboarding");
            
            if (hasSeenOnboarding === "true") {
                // User has seen onboarding, go directly to MainTabs (HomeScreen)
                navigation.navigate('MainTabs');
            } else {
                // First time user, show OnBoarding
            navigation.navigate('OnBoarding');
            }
        });
    }, [navigation]);

    // Your Firebase configuration
    const firebaseConfig = {
        apiKey: "AIzaSyCxDi368BvYNPrFb0n_OWN54iw16-eTSaM",
        authDomain: "uptula-d1894.firebaseapp.com",
        projectId: "uptula-d1894",
        storageBucket: "uptula-d1894.firebasestorage.app",
        messagingSenderId: "193282547247",
        appId: "1:193282547247:android:54aee546fa7e7e4bbbb0da"
    };

    useEffect(() => {
       const initializeNotifications = async () => {
        try {
            if (Platform.OS === 'android') {
                await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
                );
            }

            console.log('📱 Initializing push notifications...');
            await requestUserPermission();
            NotificationListener();

            // ✅ GET FCM TOKEN
            const token = await messaging().getToken();
            console.log('🔥 FCM Token:', token);

            // ⚠️ make sure you have user info
            const user = await getStringByKey("user"); // or however you store user
            const parsedUser = user ? JSON.parse(user) : null;

            // ✅ SEND TO BACKEND USING BASE_URL
            await fetch(`${BASE_URL}profile/save-fcm-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // optionally add auth token
                    // Authorization: `Bearer ${parsedUser?.token}`
                },
                body: JSON.stringify({
                    userId: parsedUser?.id,
                    token: token
                })
            });

        } catch (error) {
            console.error('❌ Error initializing notifications:', error);
        }
    };
        initializeNotifications();
    }, []);

    const Container = Platform.OS === "ios" ? SafeAreaView : View;

    return (
        <>
            <StatusBar 
                backgroundColor={WHITE} 
                barStyle={Platform.OS === "ios" ? "dark-content" : "dark-content"}
                translucent={Platform.OS === "android"}
            />

            {/* Conatiner */}
            <Container style={[
                styles.container,
                Platform.OS === "ios" && styles.containerIOS,
                Platform.OS === "android" && styles.containerAndroid
            ]}>
                {/* Child Conatiner */}
                <View style={[
                    styles.childConatiner,
                    Platform.OS === "ios" && styles.childConatinerIOS,
                    Platform.OS === "android" && styles.childConatinerAndroid
                ]}>

                    <Animated.View
                        style={[
                            styles.imgConatiner,
                            Platform.OS === "ios" && styles.imgConatinerIOS,
                            Platform.OS === "android" && styles.imgConatinerAndroid,
                            {
                                transform: [{ scale: logoScale }],
                                opacity: logoOpacity,
                            },
                        ]}
                    >
                        <Animated.Image
                            style={[
                                styles.imgLogo,
                                Platform.OS === "ios" && styles.imgLogoIOS,
                                Platform.OS === "android" && styles.imgLogoAndroid
                            ]}
                            source={UP}
                            resizeMode="contain"
                        />
                    </Animated.View>

                    <Animated.View style={[
                        styles.txtConatiner,
                        Platform.OS === "ios" && styles.txtConatinerIOS,
                        Platform.OS === "android" && styles.txtConatinerAndroid,
                        {
                            opacity: sloganOpacity,
                        }]
                    }
                    >
                        <Animated.Image
                            source={LOGO}
                            style={[
                                styles.sloganLogo,
                                Platform.OS === "ios" && styles.sloganLogoIOS,
                                Platform.OS === "android" && styles.sloganLogoAndroid,
                                { transform: [{ translateY: sloganTranslate }] }
                            ]}
                            resizeMode="contain"
                        />
                    </Animated.View>
                </View>
            </Container>
        </>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: WHITE
    },
    containerIOS: {
        paddingTop: Platform.OS === "ios" ? 0 : 0,
    },
    containerAndroid: {
        paddingTop: Platform.OS === "android" ? 0 : 0,
    },
    childConatiner: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: "center",
        alignItems: 'center',
    },
    childConatinerIOS: {
        paddingTop: Platform.OS === "ios" ? 20 : 0,
    },
    childConatinerAndroid: {
        paddingTop: Platform.OS === "android" ? 10 : 0,
    },
    imgLogo: {
        height: 340,
        width: 340,
    },
    imgLogoIOS: {
        height: Platform.OS === "ios" ? 360 : 340,
        width: Platform.OS === "ios" ? 360 : 340,
    },
    imgLogoAndroid: {
        height: Platform.OS === "android" ? 320 : 340,
        width: Platform.OS === "android" ? 320 : 340,
    },
    imgConatiner: {
        overflow: 'visible',
        alignItems: 'center',
        justifyContent: 'center',
    },
    imgConatinerIOS: {
        marginBottom: Platform.OS === "ios" ? 15 : 0,
    },
    imgConatinerAndroid: {
        marginBottom: Platform.OS === "android" ? 10 : 0,
    },
    txtConatiner: {
        justifyContent: "center",
        alignItems: "center",
        marginTop: 10,
        width: 300
    },
    txtConatinerIOS: {
        marginTop: Platform.OS === "ios" ? 15 : 10,
        width: Platform.OS === "ios" ? 320 : 300,
    },
    txtConatinerAndroid: {
        marginTop: Platform.OS === "android" ? 8 : 10,
        width: Platform.OS === "android" ? 280 : 300,
    },
    sloganLogo: {
        width: 280,
        height: 280,
    },
    sloganLogoIOS: {
        width: Platform.OS === "ios" ? 300 : 280,
        height: Platform.OS === "ios" ? 300 : 280,
    },
    sloganLogoAndroid: {
        width: Platform.OS === "android" ? 260 : 280,
        height: Platform.OS === "android" ? 260 : 280,
    },
    sloganTxt: {
        color: BLACK,
        fontSize: 20,
        textAlign: "center",
        fontFamily: UBUNTUBOLD
    }
})