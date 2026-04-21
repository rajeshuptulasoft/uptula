# Voice Recording Fix Guide

## Problem
The CreateResumeScreen.jsx throws an error when trying to start voice recording:
```
Voice.start() failed with error:
Cannot read property 'startSpeech' of null
```

## Root Cause
The React Native Voice module's native bridge (`@react-native-voice/voice`) is not properly linked to the Android/iOS native code. This means the native libraries were not built and linked to the JavaScript bridge.

## Solution

### For Android Devices (RECOMMENDED - Easiest)

Follow these steps **exactly** in order:

#### Step 1: Close the App
- Close the running app completely from your device
- Close the Metro bundler (if running in terminal, press `Ctrl+C`)

#### Step 2: Clean Build Files
```bash
cd android
./gradlew clean
cd ..
```

#### Step 3: Uninstall Old App (IMPORTANT!)
```bash
# Connect your device or emulator
adb uninstall com.uptula
# or simply uninstall manually from device settings
```

#### Step 4: Rebuild the App
```bash
npx react-native run-android
```

This will:
- Install all dependencies
- Link the Voice module natively
- Build the Android app
- Deploy to your device

#### Step 5: Test Voice Recording
- Open the app
- Navigate to Create Resume screen
- Press "Start Recording"
- Speak clearly in English (or your selected language)
- Voice should now work!

### For iOS Devices

```bash
cd ios
pod install
cd ..
npx react-native run-ios
```

## What Changed in the Code

The following improvements were made to `CreateResumeScreen.jsx`:

### 1. **Better Null Checks**
```javascript
// Now checks if Voice is null explicitly
if (!Voice || Voice === null) {
  // Provides helpful error message
}
```

### 2. **Method Existence Validation**
```javascript
const hasStart = typeof Voice.start === 'function';
const hasStop = typeof Voice.stop === 'function';

if (!hasStart || !hasStop) {
  // Provides clear feedback
}
```

### 3. **Improved Error Messages**
- Clear indication of native module linking issue
- Step-by-step rebuild instructions in alert dialogs
- Platform-specific instructions (Android vs iOS)

### 4. **Pre-call Verification**
```javascript
// Final check before calling Voice.start()
if (!Voice || typeof Voice.start !== 'function') {
  throw new Error('Voice.start is not available. Native module may not be linked.');
}
```

## Troubleshooting

### Issue: Still getting the same error after rebuild
**Solution:**
1. Make sure you completely uninstalled the old app
2. Clear Metro cache: `npx react-native start --reset-cache`
3. Try the rebuild again

### Issue: Gradle build fails
**Solution:**
```bash
cd android
./gradlew clean --stop
./gradlew cleanBuildCache
cd ..
npx react-native run-android
```

### Issue: Metro bundler crashes
**Solution:**
1. Kill Metro bundler (Ctrl+C)
2. Delete `node_modules` folder
3. Run `npm install`
4. Run `npx react-native run-android` again

### Issue: "Google App Not Installed" (Android)
**Solution:**
- The voice recognition requires Google's Voice app to be installed
- Install from Google Play Store: "Google Recorder" or "Google Assistant"
- Or ensure "Google" app is installed

## What the Voice Module Does

The Voice module enables:
- 🎙️ **Microphone Input**: Records user speech
- 🔊 **Speech Recognition**: Converts speech to text
- 🌐 **Multiple Languages**: Supports 10+ languages including:
  - English (en-IN - Indian English)
  - Spanish, French, German
  - Mandarin Chinese, Hindi, Arabic
  - And more...

## Testing the Fix

After rebuilding:

1. **Open the App** → Navigate to "Create Resume"
2. **Select Language** (English recommended)
3. **Click "Start Recording"** button
4. **Speak clearly**: "My name is John Doe"
5. **Stop Recording** (if needed)
6. **Expected Result**: The text should appear and be saved

## Key Dependencies

- `@react-native-voice/voice`: v3.2.4 - Voice recognition
- `react-native-tts`: v4.1.1 - Text-to-speech
- React Native: 0.83.0

## Additional Notes

- **Language**: The app defaults to Indian English (en-IN) for better accent recognition
- **Permissions**: Microphone permission is requested automatically
- **Internet**: Voice recognition requires internet connection
- **Platform Auto-detection**: The code handles both Android and iOS

## Still Having Issues?

If the problem persists:

1. **Check device logs**:
   ```bash
   adb logcat | grep -i voice
   # or
   adb logcat | grep -i uptula
   ```

2. **Verify package installation**:
   ```bash
   npm list @react-native-voice/voice
   ```

3. **Check Android manifest** (auto-generated after rebuild):
   - Should include voice recognition permissions
   - Should be in `android/app/src/main/AndroidManifest.xml`

4. **Contact**: Ensure your device's Google services are up to date

---

**Version**: 1.0
**Last Updated**: February 4, 2026
**Status**: Ready for Production
