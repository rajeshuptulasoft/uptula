import { getStringByKey, storeStringByKey } from './Storage';
import { POSTNETWORK } from './Network';
import { BASE_URL } from '../constant/url';
import { Vibration } from 'react-native';
import firebase from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';

// ✅ ADD THIS IMPORT
// import { navigate } from '../navigation/NavigationService';


// Helper function to check if messaging is available and native module is linked
const isMessagingAvailable = () => {
    try {
        if (!firebase.apps.length) {
            console.warn('⚠️ Firebase app not initialized');
            return false;
        }

        if (!messaging || typeof messaging !== 'function') {
            console.warn('⚠️ Messaging module not available');
            return false;
        }

        const messagingInstance = messaging();
        return messagingInstance && typeof messagingInstance.requestPermission === 'function';
    } catch (error) {
        console.warn('⚠️ Firebase native module not linked:', error.message);
        return false;
    }
};

export const requestUserPermission = async () => {
    try {
        if (!isMessagingAvailable()) {
            console.error('❌ Firebase Messaging is not available.');
            return;
        }

        const authStatus = await messaging().requestPermission();
        const enabled =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        console.log('📱 Authorization status:', authStatus);

        if (enabled) {
            await getFCM();
        } else {
            console.log('⚠️ Notification permission not granted');
        }
    } catch (error) {
        console.error('❌ Error requesting notification permission:', error);
    }
};

const postFcmdetails = async () => {
    const url = `${BASE_URL}enterFCMTokenDetails?_format=json`;
    const user = await getStringByKey('fcmtoken');

    const obj = {
        token: user
    };

    POSTNETWORK(url, obj).then(res => {
        console.log("responseeeeeee", res);
    });
};

const getFCM = async () => {
    try {
        if (!isMessagingAvailable()) return;

        const storedToken = await getStringByKey('fcmtoken');

        if (storedToken) {
            // console.log('📱 Existing FCM Token:', storedToken);
            await postFcmdetails();
        } else {
            const fcmtoken = await messaging().getToken();

            if (fcmtoken) {
                await storeStringByKey('fcmtoken', fcmtoken);
                // console.log('✅ New FCM Token:', fcmtoken);
                await postFcmdetails();
            }
        }
    } catch (error) {
        console.error('❌ Error in getFCM:', error);
    }
};


// ✅ ADD THIS FUNCTION (Navigation Logic)
const handleNavigation = (data) => {
    if (!data) return;

    const { type, jobId, threadId, role } = data;

    // console.log('📦 Notification Data:', data);

    // Chat navigation
    if (type === 'message' && threadId) {
        if (role === 'provider') {
            navigate('ProviderChat', { threadId });
        } else {
            navigate('SeekerChat', { threadId });
        }
    }

    // Job details navigation
    if ((type === 'application' || type === 'job_update') && jobId) {
        if (role === 'provider') {
            navigate('JobDetails', { jobId });
        } else {
            navigate('SeekerJobDetails', { jobId });
        }
    }
};


export const NotificationListener = () => {
    try {
        if (!isMessagingAvailable()) {
            console.error('❌ Firebase Messaging not available');
            return;
        }

        // console.log("📱 Setting up notification listeners...");

        // ✅ BACKGROUND → USER TAPS NOTIFICATION
        messaging().onNotificationOpenedApp(remoteMessage => {
            // console.log('📱 Opened from background:', remoteMessage);

            handleNavigation(remoteMessage?.data);
        });

        // ✅ APP CLOSED → USER TAPS NOTIFICATION
        messaging()
            .getInitialNotification()
            .then(remoteMessage => {
                if (remoteMessage) {
                    // console.log('📱 Opened from quit state:', remoteMessage);

                    handleNavigation(remoteMessage?.data);
                }
            })
            .catch(error => {
                // console.error('❌ Error getting initial notification:', error);
            });

        // ✅ FOREGROUND
        messaging().onMessage(async remoteMessage => {
            // console.log('📱 Foreground notification:', remoteMessage);
            // optional navigation
            // handleNavigation(remoteMessage?.data);
        });

        // ✅ BACKGROUND HANDLER
        messaging().setBackgroundMessageHandler(async remoteMessage => {
            // console.log('📱 Background message:', remoteMessage);
        });

        // console.log('✅ Notification listeners ready');
    } catch (error) {
        // console.error('❌ Error setting notification listeners:', error);
    }
};