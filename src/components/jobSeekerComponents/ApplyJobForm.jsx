import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  KeyboardAvoidingView,
  Platform,
  PermissionsAndroid,
  Alert,
  BackHandler,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { pick, isCancel } from '@react-native-documents/picker';
import ReactNativeBlobUtil from 'react-native-blob-util';
 
import { WHITE, BLACK, BRANDCOLOR } from "../../constant/color";
import { TextInputComponent } from "../commonComponents/TextInputComponent";
import { CustomButton } from "../commonComponents/Button";
import { MyHeader } from "../commonComponents/MyHeader";
import { MyAlert } from "../commonComponents/MyAlert";
import { ToastMessage } from "../commonComponents/ToastMessage";
import { BASE_URL } from "../../constant/url";
import { POSTNETWORKFORM, GETNETWORK } from "../../utils/Network";
import { getObjByKey } from "../../utils/Storage";
 
// icons (replace with your own if needed)
import {
  USERFORM,
  USER,
  MAIL,
  PHONE,
  COVERLETTER,
  UPLOAD,
  LOGO,
} from "../../constant/imagePath";
 
const ApplyJobForm = ({ visible, onClose, onSubmit, jobId, jobTitle, companyName }) => {
  const navigation = useNavigation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [file, setFile] = useState(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmAlertVisible, setConfirmAlertVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState({
    type: "",
    msg: "",
    visible: false,
  });

  // Handle back button press
  useEffect(() => {
    if (Platform.OS === "android" && visible) {
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          if (confirmAlertVisible) {
            setConfirmAlertVisible(false);
            return true;
          }
          if (visible) {
            onClose && onClose();
            navigation.goBack();
            return true;
          }
          return false;
        }
      );

      return () => backHandler.remove();
    }
  }, [visible, confirmAlertVisible, navigation, onClose]);

  // Fetch user profile and populate form when modal opens
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (visible) {
        try {
          // Reset form first
          setFile(null);
          setCoverLetter("");
          setLoading(false);
          setConfirmAlertVisible(false);
          setToastMessage({
            type: "",
            msg: "",
            visible: false,
          });

          // Fetch user profile data
          const token = await getObjByKey("loginResponse");
          if (token) {
            const url = `${BASE_URL}profile`;
            const result = await GETNETWORK(url, true);
            
            if (result && !result.message) {
              // Extract profile data from various possible response structures
              const profileData = result?.profile || result?.data || result?.user || result || {};
              
              // Populate name field with firstName + lastName
              const firstName = profileData.firstName || profileData.first_name || '';
              const lastName = profileData.lastName || profileData.last_name || '';
              const fullName = `${firstName} ${lastName}`.trim();
              if (fullName) {
                setName(fullName);
              }
              
              // Populate email field
              const userEmail = profileData.email || '';
              if (userEmail) {
                setEmail(userEmail);
              }
              
              // Populate phone field
              const userPhone = profileData.phone || profileData.phoneNumber || profileData.phone_number || '';
              if (userPhone) {
                setPhone(userPhone);
              }
            } else {
              // If API fails, try to get data from stored loginResponse
              const loginResponse = await getObjByKey("loginResponse");
              const storedData = loginResponse?.data || loginResponse?.user || loginResponse || {};
              
              const firstName = storedData.firstName || storedData.first_name || '';
              const lastName = storedData.lastName || storedData.last_name || '';
              const fullName = `${firstName} ${lastName}`.trim();
              if (fullName) {
                setName(fullName);
              }
              
              if (storedData.email) {
                setEmail(storedData.email);
              }
              
              if (storedData.phone || storedData.phoneNumber || storedData.phone_number) {
                setPhone(storedData.phone || storedData.phoneNumber || storedData.phone_number);
              }
            }
          } else {
            // No token, reset form fields
            setName("");
            setEmail("");
            setPhone("");
          }
        } catch (error) {
          // If error occurs, try to get data from stored loginResponse
          try {
            const loginResponse = await getObjByKey("loginResponse");
            const storedData = loginResponse?.data || loginResponse?.user || loginResponse || {};
            
            const firstName = storedData.firstName || storedData.first_name || '';
            const lastName = storedData.lastName || storedData.last_name || '';
            const fullName = `${firstName} ${lastName}`.trim();
            if (fullName) {
              setName(fullName);
            }
            
            if (storedData.email) {
              setEmail(storedData.email);
            }
            
            if (storedData.phone || storedData.phoneNumber || storedData.phone_number) {
              setPhone(storedData.phone || storedData.phoneNumber || storedData.phone_number);
            }
          } catch (e) {
            // Silently fail and leave fields empty
            setName("");
            setEmail("");
            setPhone("");
          }
        }
      }
    };

    fetchUserProfile();
  }, [visible]);
 
  // const pickFile = async () => {
  //   try {
  //     const res = await DocumentPicker.pick({
  //       type: [
  //         DocumentPicker.types.pdf,
  //         DocumentPicker.types.doc,
  //         DocumentPicker.types.docx,
  //       ],
  //     });
 
  //     setFile(res[0]);
  //   } catch (err) {
  //     if (err?.code === 'DOCUMENT_PICKER_CANCELED') {
  //     // user cancelled picker – do nothing
  //       console.log("File picker cancelled");
  //     } else {
  //       console.log("File picker error:", err);
  //     }
  //   }
  // };
  // Request storage permission for Android
  const requestStoragePermission = async () => {
    if (Platform.OS === "android") {
      // Use document picker directly instead of requesting READ_MEDIA_IMAGES.
      return true;
    }
    // iOS permissions are handled automatically
    return true;
  };
 
  const pickFile = async () => {
    try {
      // Request permission first (for Android)
      if (Platform.OS === "android") {
        const hasPermission = await requestStoragePermission();
        if (!hasPermission) {
          Alert.alert(
            "Permission Denied",
            "Please grant storage permission to select documents. You can enable it in app settings.",
            [{ text: "OK" }]
          );
          return;
        }
      }
 
      // Use DocumentPicker to select documents
      try {
        const [result] = await pick({
          type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        });

        if (result) {
          setFile({
            name: result.name || result.uri.split('/').pop() || 'document.pdf',
            uri: result.uri,
            type: result.type || 'application/pdf',
            size: result.size || 0,
          });
        }
      } catch (pickerErr) {
        if (isCancel(pickerErr)) {
          // console.log('User cancelled document picker');
        } else {
          // console.log('Document picker error:', pickerErr);
          // Fallback: Show instructions if native picker fails
          Alert.alert(
            "Select Document",
            "Please navigate to your device's file manager and select a PDF, DOC, or DOCX file from your Downloads or Documents folder.",
            [{ text: "OK" }]
          );
        }
      }
    } catch (err) {
      // console.log('File picker error:', err);
      Alert.alert(
        "File Selection",
        "Unable to open file picker. Please ensure you have granted storage permissions and try again.",
        [{ text: "OK" }]
      );
    }
  };
 
  const removeFile = () => {
    setFile(null);
  };

  /* ---------- VALIDATE FORM ---------- */
  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert("Validation Error", "Please enter your full name");
      return false;
    }
    if (!email.trim()) {
      Alert.alert("Validation Error", "Please enter your email address");
      return false;
    }
    if (!phone.trim()) {
      Alert.alert("Validation Error", "Please enter your phone number");
      return false;
    }
    if (!file) {
      Alert.alert("Validation Error", "Please upload your resume");
      return false;
    }
    return true;
  };

  /* ---------- SHOW CONFIRMATION ALERT ---------- */
  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }
    if (!jobId) {
      Alert.alert("Error", "Job ID is missing");
      return;
    }
    // Just show the alert, POST will happen when user presses Submit in MyAlert
    setConfirmAlertVisible(true);
  };

  /* ---------- SUBMIT APPLICATION - Called from MyAlert Submit button ---------- */
  const submitApplication = async () => {
    try {
      setLoading(true);
      setConfirmAlertVisible(false);

      // Get token from storage
      const loginResponse = await getObjByKey('loginResponse');
      if (!loginResponse) {
        console.log('❌ ApplyJobForm: No login response found');
        setToastMessage({
          type: "error",
          msg: "Please login to apply for jobs",
          visible: true,
        });
        setLoading(false);
        return;
      }

      // Get token - Check loginResponse structure
      // POSTNETWORKFORM uses loginResponse.data, GETNETWORK uses loginResponse.token
      let token = null;
      
      // Debug: Log the full loginResponse structure
      console.log('🔍 ApplyJobForm: Full loginResponse:', JSON.stringify(loginResponse, null, 2));
      
      // Try loginResponse.data first (as POSTNETWORKFORM expects)
      if (loginResponse.data) {
        if (typeof loginResponse.data === 'string') {
          token = loginResponse.data;
        } else if (typeof loginResponse.data === 'object' && loginResponse.data !== null) {
          // If data is an object, try to extract the actual token string
          token = loginResponse.data.token || loginResponse.data.data;
        }
      }
      
      // Fallback to loginResponse.token
      if (!token || (typeof token === 'string' && token.trim() === '')) {
        if (loginResponse.token && typeof loginResponse.token === 'string') {
          token = loginResponse.token;
        }
      }
      
      // Final validation
      if (!token || typeof token !== 'string' || token.trim() === '') {
        console.log('❌ ApplyJobForm: No valid token found in loginResponse');
        console.log('📋 ApplyJobForm: loginResponse keys:', Object.keys(loginResponse || {}));
        setToastMessage({
          type: "error",
          msg: "Authentication token not found. Please login again.",
          visible: true,
        });
        setLoading(false);
        return;
      }
      
      console.log('🔑 ApplyJobForm: Token type:', typeof token);
      console.log('🔑 ApplyJobForm: Token length:', token.length);
      console.log('🔑 ApplyJobForm: Token preview:', token.substring(0, 20) + '...');

      // Prepare form data array for react-native-blob-util (more reliable for file uploads)
      const formDataArray = [];
      
      // Add text fields
      formDataArray.push({ name: 'name', data: name.trim() });
      formDataArray.push({ name: 'email', data: email.trim() });
      formDataArray.push({ name: 'phone', data: phone.trim() });
      formDataArray.push({ name: 'pastedCv', data: coverLetter.trim() || '' });
      
      // Add file if exists
      if (file && file.uri) {
        let fileUri = file.uri;
        
        // Handle different URI formats
        // Remove file:// prefix for file:// URIs
        if (fileUri.startsWith('file://')) {
          fileUri = fileUri.replace('file://', '');
        }
        
        // For react-native-blob-util, handle content:// and file:// URIs
        const fileData = {
          name: 'resume',
          filename: file.name || `resume_${Date.now()}.pdf`,
          type: file.type || 'application/pdf',
          data: fileUri.startsWith('content://') 
            ? fileUri 
            : ReactNativeBlobUtil.wrap(fileUri),
        };
        
        formDataArray.push(fileData);
        console.log("📎 ApplyJobForm: File added to form data array");
        console.log("📎 ApplyJobForm: File name:", fileData.filename);
        console.log("📎 ApplyJobForm: File type:", fileData.type);
        console.log("📎 ApplyJobForm: File URI:", fileUri);
      }

      // Use react-native-blob-util for upload (more reliable for file uploads on React Native)
      const url = `${BASE_URL}jobs/${jobId}/apply`;
      console.log('📡 ApplyJobForm: Submitting application to:', url);
      console.log('📋 ApplyJobForm: FormData entries:', {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        pastedCv: coverLetter.trim() || '',
        resume: file ? file.name : 'No file',
        fileUri: file ? file.uri : 'No file',
      });
      console.log('📦 ApplyJobForm: Form data array prepared with', formDataArray.length, 'fields');

      // Use react-native-blob-util for upload
      let result;
      try {
        console.log('📤 ApplyJobForm: Sending request using react-native-blob-util');
        console.log('📤 ApplyJobForm: Using token:', token ? token.substring(0, 20) + '...' : 'No token');

        const response = await ReactNativeBlobUtil.fetch(
          'POST',
          url,
          {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          formDataArray
        );

        const status = response.info().status;
        console.log('📥 ApplyJobForm: Response status:', status);
        console.log('📥 ApplyJobForm: Response headers:', JSON.stringify(response.info().headers, null, 2));
        
        // Parse response
        let responseText;
        try {
          responseText = response.text();
          if (responseText && responseText.trim()) {
            result = JSON.parse(responseText);
            console.log('📥 ApplyJobForm: API response:', JSON.stringify(result, null, 2));
          } else {
            // Empty response but success status
            if (status >= 200 && status < 300) {
              result = { success: true, message: "Application submitted successfully!" };
            } else {
              result = { error: true, message: `Server error: ${status}`, statusCode: status };
            }
          }
        } catch (parseError) {
          console.error('❌ ApplyJobForm: Error parsing response:', parseError);
          // If status is success, treat as success even if parsing fails
          if (status >= 200 && status < 300) {
            result = { success: true, message: "Application submitted successfully!" };
          } else {
            result = { 
              error: true, 
              message: `Server error: ${status}`,
              statusCode: status
            };
          }
        }
        
      } catch (error) {
        console.error('❌ ApplyJobForm: Upload error:', error);
        console.error('❌ ApplyJobForm: Error details:', {
          message: error?.message,
          name: error?.name,
          stack: error?.stack,
        });
        setToastMessage({
          type: "error",
          msg: error?.message || "Network request failed. Please check your internet connection and try again.",
          visible: true,
        });
        setLoading(false);
        return;
      }

      // Handle response - Use exact same success detection as AddJobScreen.jsx
      console.log('📋 ApplyJobForm: API response:', JSON.stringify(result, null, 2));
      
      // Check success using same logic as AddJobScreen.jsx
      const isSuccess = 
        result?.success === true || 
        result?.statusCode === 200 || 
        result?.statusCode === 201 ||
        result?.status === "success" ||
        result?.status === "Success" ||
        result?.id ||
        result?.application_id ||
        result?.message?.toLowerCase().includes('success') ||
        (!result?.error && !result?.errors);

      if (isSuccess) {
        const successMessage = result?.message || "Your application has been submitted successfully!";
        console.log('✅ ApplyJobForm: Application submitted successfully:', successMessage);
        console.log('✅ ApplyJobForm: Full success response:', JSON.stringify(result, null, 2));
        
        setToastMessage({
          type: "success",
          msg: successMessage,
          visible: true,
        });
        
        // Reset form
        setName("");
        setEmail("");
        setPhone("");
        setFile(null);
        setCoverLetter("");
        setLoading(false);
        
        // Close form after a delay
        setTimeout(() => {
          onClose && onClose();
          onSubmit && onSubmit({ jobId, success: true });
        }, 2000);
      } else {
        const errorMessage = result?.errors?.[0]?.msg || result?.message || result?.error || "Failed to submit application. Please try again.";
        console.log('❌ ApplyJobForm: Application submission failed:', errorMessage);
        console.log('❌ ApplyJobForm: Full error response:', JSON.stringify(result, null, 2));
        setToastMessage({
          type: "error",
          msg: errorMessage,
          visible: true,
        });
        setLoading(false);
      }
    } catch (error) {
      console.error('❌ ApplyJobForm: Application submission error:', error);
      const errorMessage = error?.message || "An error occurred while submitting your application. Please try again.";
      setToastMessage({
        type: "error",
        msg: errorMessage,
        visible: true,
      });
      setLoading(false);
    }
  };
 
  return (
    <Modal statusBarTranslucent={true} visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <MyHeader
            showBack
            title="Apply Job"
            onBackPress={onClose}
          />
 
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <ScrollView
              contentContainerStyle={styles.container}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Name */}
              <TextInputComponent
                placeholder="Full Name"
                inputdata={name}
                setInputdata={setName}
                borderColor={BRANDCOLOR}
                width="95%"
                image={USER}
              />
 
              {/* Email */}
              <TextInputComponent
                placeholder="Email Address"
                inputdata={email}
                setInputdata={setEmail}
                keyboardType="email-address"
                borderColor={BRANDCOLOR}
                width="95%"
                image={MAIL}
              />
 
              {/* Phone */}
              <TextInputComponent
                placeholder="Phone Number"
                inputdata={phone}
                setInputdata={setPhone}
                keyboardType="numeric"
                borderColor={BRANDCOLOR}
                width="95%"
                image={PHONE}
              />
 
              {/* File Upload */}
              {/* File Upload */}
              <View style={styles.fileBox}>
                {!file ? (
                  <Pressable style={styles.uploadArea} onPress={pickFile}>
                    <Image source={UPLOAD} style={styles.uploadIcon} />
                    <Text style={styles.fileText}>Upload Resume</Text>
                  </Pressable>
                ) : (
                  <View style={styles.selectedFile}>
                    <Text style={styles.fileName}>{file.name}</Text>
 
                    <Pressable onPress={removeFile} style={styles.removeBtn}>
                      <Text style={styles.removeText}>Remove</Text>
                    </Pressable>
                  </View>
                )}
              </View>
 
 
              {/* Cover Letter */}
              <TextInputComponent
                placeholder="Cover Letter"
                inputdata={coverLetter}
                setInputdata={setCoverLetter}
                borderColor={BRANDCOLOR}
                width="95%"
                multiline
                maxLength={1000}
                image={COVERLETTER}
              />
 
              {/* Submit Button */}
              <View style={styles.buttonWrapper}>
                <CustomButton
                  text={loading ? "Submitting..." : "Submit Application"}
                  color={WHITE}
                  onPress={handleSubmit}
                  disabled={loading}
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </View>

      {/* ---------- CONFIRMATION ALERT ---------- */}
      <MyAlert
        visible={confirmAlertVisible}
        title="Confirm Application"
        message={`Are you sure you want to submit your application for ${jobTitle || 'this job'}?`}
        textLeft="Cancel"
        textRight="Submit"
        leftButtonBackgroundColor="#E0E0E0"
        rightButtonBackgroundColor={BRANDCOLOR}
        onPressLeft={() => {
          setConfirmAlertVisible(false);
          setLoading(false);
        }}
        onPressRight={submitApplication}
        onRequestClose={() => {
          setConfirmAlertVisible(false);
          setLoading(false);
        }}
      />

      {/* ---------- TOAST MESSAGE ---------- */}
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
    </Modal>
  );
};
 
export default ApplyJobForm;
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    height: "90%",
    backgroundColor: WHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  container: {
    padding: 10,
    paddingBottom: 30,
    backgroundColor: WHITE,
  },
  fileBox: {
    width: "95%",
    height: 120,
    borderWidth: 1,
    borderColor: BRANDCOLOR,
    borderRadius: 12,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
    backgroundColor: WHITE,
  },
  filePlaceholder: {
    alignItems: "center",
  },
  uploadIcon: {
    width: 30,
    height: 30,
    marginBottom: 6,
    resizeMode: "contain",
  },
  fileText: {
    color: BLACK,
    fontSize: 14,
  },
  fileName: {
    color: BLACK,
    fontSize: 14,
    paddingHorizontal: 10,
    textAlign: "center",
  },
  buttonWrapper: {
    alignItems: "center",
    marginTop: 20,
  },
  selectedFile: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
 
  removeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
 
  removeText: {
    color: "red",
    fontSize: 13,
    fontWeight: "600",
  },
 
});