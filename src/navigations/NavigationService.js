import { createNavigationContainerRef } from '@react-navigation/native';

// ✅ Create a global navigation reference
export const navigationRef = createNavigationContainerRef();

// ✅ Function to navigate from anywhere (like PushNotification.js)
export function navigate(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  } else {
    console.log('⚠️ Navigation not ready');
  }
}