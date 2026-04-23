import 'react-native-gesture-handler';
/**
 * @format
 */

import { AppRegistry, NativeModules, Platform } from 'react-native';

// Initialize Firebase before anything else
import firebase from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging'; // ✅ ADDED
import { firebaseConfig } from './src/constant/firebaseConfig';

// Ensure Firebase is initialized
if (!firebase.apps.length) {
  try {
    firebase.initializeApp(firebaseConfig);
    console.log('✅ Firebase initialized successfully');
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
    if (Platform.OS === 'android') {
      try {
        firebase.initializeApp();
        console.log('✅ Firebase initialized from google-services.json');
      } catch (retryError) {
        console.error('❌ Firebase initialization failed:', retryError);
      }
    }
  }
}

// ✅ ADD THIS BLOCK (BACKGROUND HANDLER)
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('📱 Background message:', remoteMessage);
});

// Safely set up Voice module mapping
try {
  const Voice = NativeModules.Voice || NativeModules.RCTVoice;
  if (Voice) {
    console.log('✅ Voice module available');
  }
} catch (error) {
  console.warn('⚠️ Voice module not available:', error.message);
}

import { name as appName } from './app.json';
import Navigation from './src/navigations/Navigation';
import DisplayCompanyProfileScreen from './src/screens/userScreens/jobSeekerScreens/DisplayCompanyProfileScreen';

AppRegistry.registerComponent(appName, () => Navigation);