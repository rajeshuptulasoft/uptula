import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  StatusBar,
  Platform,
  BackHandler,
  TextInput,
  KeyboardAvoidingView,
  TouchableOpacity,
  PermissionsAndroid,
  Alert,
  SafeAreaView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { launchImageLibrary } from "react-native-image-picker";
import { BLACK, BRANDCOLOR, WHITE } from "../../../constant/color";
import { HEIGHT, WIDTH } from "../../../constant/config";
import { UBUNTUBOLD, UBUNTU, FIRASANSSEMIBOLD, ROBOTOSEMIBOLD, CANTARELLBOLD, FIRASANSBOLD } from "../../../constant/fontPath";
import { TextInputComponent } from "../../../components/commonComponents/TextInputComponent";
import { CustomButton } from "../../../components/commonComponents/Button";
import {
  PROFILE,
  COMPANYNAME,
  ADDRESS,
  USER,
  MAIL,
  PHONE,
  WEBSITE,
  JOBDESCRIPTION,
  DROPDOWN,
  INDUSTRY,
  COMPANYSIZE,
  COMPANYTYPE,
  FOUNDED,
  CAMERA,
  BACK,
  GENERALINFORMATION,
  LINKEDIN,
  TWITTER,
  FACEBOOK,
  INSTAGRAM,
} from "../../../constant/imagePath";
import { getObjByKey, storeObjByKey } from "../../../utils/Storage";
import { BASE_URL } from "../../../constant/url";
import { GETNETWORK, PUTNETWORK } from "../../../utils/Network";
import { ToastMessage } from "../../../components/commonComponents/ToastMessage";
import ReactNativeBlobUtil from 'react-native-blob-util';

const EditProfileScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params || {};

  // State for all form fields
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [contactPersonName, setContactPersonName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [companyType, setCompanyType] = useState("");
  const [founded, setFounded] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [toastMessage, setToastMessage] = useState({
    type: "",
    msg: "",
    visible: false,
  });
  const [loading, setLoading] = useState(true);

  // Additional Information fields
  const [taxId, setTaxId] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [twitter, setTwitter] = useState("");
  const [facebook, setFacebook] = useState("");
  const [instagram, setInstagram] = useState("");

  // Fetch employer profile from API
  const fetchEmployerProfile = useCallback(async () => {
    try {
      setLoading(true);
      const url = `${BASE_URL}employer/profile`;
      // console.log('📝 Edit Profile: Fetching employer profile:', url);

      // Get token from storage
      const loginResponse = await getObjByKey('loginResponse');
      if (!loginResponse || !loginResponse.token) {
        // console.error('❌ Error: No token found in loginResponse');
        setLoading(false);
        return;
      }

      const result = await GETNETWORK(url, true);
      // console.log('📝 Edit Profile: API Response:', JSON.stringify(result, null, 2));

      // API response structure: { profile: { ... } }
      const profileData = result?.profile || result;

      if (profileData && profileData.companyName) {
        // console.log('✅ Success: Employer profile fetched for editing');

        // Populate all form fields with API data
        setCompanyName(profileData.companyName || "");
        setCompanyAddress(profileData.address || "");
        setContactPersonName(profileData.contactPerson || "");
        setCompanyEmail(profileData.email || "");
        setCompanyPhone(profileData.phone || "");
        setCompanyWebsite(profileData.website || "");
        setIndustry(profileData.industry || "");
        setCompanySize(profileData.companySize || "");
        setCompanyType(profileData.companyType || "");
        // Handle founded year - check multiple possible field names and convert to string
        const foundedValue = profileData.foundedYear || profileData.founded || profileData.founded_year || "";
        const foundedString = foundedValue ? String(foundedValue).trim() : "";
        // console.log('📅 Founded Year from API:', {
        //   foundedYear: profileData.foundedYear,
        //   founded: profileData.founded,
        //   founded_year: profileData.founded_year,
        //   finalValue: foundedString
        // });
        setFounded(foundedString);
        setCompanyDescription(profileData.description || "");

        // Additional Information
        setTaxId(profileData.taxId || "");
        setLinkedin(profileData.linkedin || profileData.linkedIn || "");
        setTwitter(profileData.twitter || "");
        setFacebook(profileData.facebook || "");
        setInstagram(profileData.instagram || profileData.insta || "");

        // Handle profile image/logo - check multiple possible field names
        const fetchedLogoUrl =
          profileData.logoUrl ||
          profileData.logo ||
          profileData.companyLogo ||
          profileData.company_logo ||
          result?.logoUrl ||
          result?.logo ||
          result?.companyLogo ||
          result?.company_logo ||
          '';

        if (fetchedLogoUrl && fetchedLogoUrl.trim() !== '') {
          // Construct full URL if it's a relative path
          let logoUrlToSet = fetchedLogoUrl;
          if (!fetchedLogoUrl.startsWith('http://') && !fetchedLogoUrl.startsWith('https://')) {
            // If it's a relative path, prepend BASE_URL (remove /api/ if present)
            const baseUrl = BASE_URL.replace('/api/', '/');
            logoUrlToSet = baseUrl + fetchedLogoUrl.replace(/^\//, '');
          }
          // console.log('✅ Edit Profile: Setting logo URL:', logoUrlToSet);
          setProfileImage({ uri: logoUrlToSet });
        } else {
          // console.log('⚠️ Edit Profile: No logo URL found in response');
          setProfileImage(null);
        }

        // console.log('✅ Profile data loaded into edit form');
      } else if (result?.errors) {
        // console.error('❌ Error: API returned errors:', result.errors);
        setToastMessage({
          type: "error",
          msg: "Failed to load profile data. Please try again.",
          visible: true,
        });
      } else {
        // console.error('❌ Error: Invalid response from API');
        setToastMessage({
          type: "error",
          msg: "Failed to load profile data. Please try again.",
          visible: true,
        });
      }
    } catch (error) {
      // console.error('❌ Error fetching employer profile:', error);
      setToastMessage({
        type: "error",
        msg: "Failed to load profile data. Please try again.",
        visible: true,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch profile data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // console.log('📝 Edit Profile Screen focused - Fetching profile data');
      fetchEmployerProfile();
    }, [fetchEmployerProfile])
  );

  // Handle back button press
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      navigation.goBack();
      return true;
    });

    return () => backHandler.remove();
  }, [navigation]);

  const handleBackPress = () => {
    navigation.goBack();
  };

  // Check and request permissions for accessing image library
  // const requestImagePermission = async () => {
  //   if (Platform.OS === "android") {
  //     try {
  //       let permission;

  //       // For Android 13+ (API 33+), use READ_MEDIA_IMAGES
  //       if (Platform.Version >= 33) {
  //         permission = PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES;
  //       } else {
  //         // For Android 12 and below, use READ_EXTERNAL_STORAGE
  //         permission = PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
  //       }

  //       // Check if permission is already granted
  //       const checkResult = await PermissionsAndroid.check(permission);
  //       if (checkResult) {
  //         return true;
  //       }

  //       // Request permission if not granted
  //       const granted = await PermissionsAndroid.request(
  //         permission,
  //         {
  //           title: "Photo Library Permission",
  //           message: "This app needs access to your photo library to select profile image.",
  //           buttonNeutral: "Ask Me Later",
  //           buttonNegative: "Cancel",
  //           buttonPositive: "OK",
  //         }
  //       );

  //       return granted === PermissionsAndroid.RESULTS.GRANTED;
  //     } catch (err) {
  //       // console.warn("Permission error:", err);
  //       return false;
  //     }
  //   } else {
  //     // iOS permissions are handled automatically by react-native-image-picker
  //     return true;
  //   }
  // };



  // Pick profile image
  // const pickProfileImage = async () => {
  //   const hasPermission = await requestImagePermission();
  //   if (!hasPermission) {
  //     Alert.alert(
  //       "Permission Denied",
  //       "Please grant photo library permission to select profile image."
  //     );
  //     return;
  //   }

  //   const options = {
  //     mediaType: "photo",
  //     quality: 0.8,
  //     maxWidth: 800,
  //     maxHeight: 800,
  //   };

  //   launchImageLibrary(options, (response) => {
  //     if (response.didCancel) {
  //       // console.log("User cancelled image picker");
  //     } else if (response.errorMessage) {
  //       // console.log("ImagePicker Error: ", response.errorMessage);
  //     } else if (response.assets && response.assets[0]) {
  //       setProfileImage(response.assets[0]);
  //     }
  //   });
  // };

  const pickProfileImage = async () => {
    const options = {
      mediaType: "photo",
      quality: 0.8,
      maxWidth: 800,
      maxHeight: 800,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        return;
      } else if (response.errorCode) {
        Alert.alert(
          "Error",
          response.errorMessage || "Failed to pick image"
        );
      } else if (response.assets && response.assets[0]) {
        setProfileImage(response.assets[0]);
      }
    });
  };

  // Handle save profile
  const handleSaveProfile = async () => {
    try {
      // console.log('🔄 Starting profile update process...');

      // Get token from storage
      const loginResponse = await getObjByKey('loginResponse');
      if (!loginResponse || !loginResponse.token) {
        // console.error('❌ Error: No token found in loginResponse');
        setToastMessage({
          type: "error",
          msg: "Authentication token missing. Please login again.",
          visible: true,
        });
        return;
      }
      // console.log('✅ Token found for profile update');

      // Prepare update payload
      const updateData = {
        companyName: companyName,
        address: companyAddress,
        contactPerson: contactPersonName,
        email: companyEmail,
        phone: companyPhone,
      };

      // Add optional fields only if they have values
      if (companyWebsite && String(companyWebsite).trim()) {
        updateData.website = companyWebsite;
      }
      if (industry && String(industry).trim()) {
        updateData.industry = industry;
      }
      if (companySize && String(companySize).trim()) {
        updateData.companySize = companySize;
      }
      if (linkedin && String(linkedin).trim()) {
        updateData.linkedin = String(linkedin).trim();
      }
      if (twitter && String(twitter).trim()) {
        updateData.twitter = String(twitter).trim();
      }
      if (facebook && String(facebook).trim()) {
        updateData.facebook = String(facebook).trim();
      }
      if (instagram && String(instagram).trim()) {
        updateData.instagram = String(instagram).trim();
      }
      // Note: companyType is excluded as it causes validation errors with the API
      // The API doesn't accept values like "Private", "Public", etc.
      // if (companyType && companyType.trim()) {
      //   updateData.companyType = companyType;
      // }
      if (founded && String(founded).trim()) {
        updateData.foundedYear = founded;
      }
      if (companyDescription && String(companyDescription).trim()) {
        updateData.description = companyDescription;
      }

      // Additional Information
      if (taxId && String(taxId).trim()) {
        updateData.taxId = taxId;
      }

      // Note: Company Statistics fields are read-only and not included in update

      const url = `${BASE_URL}employer/profile`;
      let result;

      // Check if a new logo was selected (file:// or content:// URI indicates new file)
      const hasNewLogo = profileImage && profileImage.uri && !profileImage.uri.startsWith('http');

      if (hasNewLogo) {
        // Use react-native-blob-util for file upload
        // console.log('📤 Uploading profile with new logo using react-native-blob-util...');

        // Prepare form data array for react-native-blob-util
        const formDataArray = [];

        // Add all text fields to form data array
        formDataArray.push({ name: 'companyName', data: companyName || '' });
        formDataArray.push({ name: 'address', data: companyAddress || '' });
        formDataArray.push({ name: 'contactPerson', data: contactPersonName || '' });
        formDataArray.push({ name: 'email', data: companyEmail || '' });
        formDataArray.push({ name: 'phone', data: companyPhone || '' });

        if (companyWebsite && String(companyWebsite).trim()) {
          formDataArray.push({ name: 'website', data: String(companyWebsite).trim() });
        }
        if (industry && String(industry).trim()) {
          formDataArray.push({ name: 'industry', data: String(industry).trim() });
        }
        if (companySize && String(companySize).trim()) {
          formDataArray.push({ name: 'companySize', data: String(companySize).trim() });
        }
        if (linkedin && String(linkedin).trim()) {
          formDataArray.push({ name: 'linkedin', data: String(linkedin).trim() });
        }
        if (twitter && String(twitter).trim()) {
          formDataArray.push({ name: 'twitter', data: String(twitter).trim() });
        }
        if (facebook && String(facebook).trim()) {
          formDataArray.push({ name: 'facebook', data: String(facebook).trim() });
        }
        if (instagram && String(instagram).trim()) {
          formDataArray.push({ name: 'instagram', data: String(instagram).trim() });
        }
        if (companyType && String(companyType).trim()) {
          formDataArray.push({ name: 'companyType', data: String(companyType).trim() });
        }
        if (founded && String(founded).trim()) {
          formDataArray.push({ name: 'foundedYear', data: String(founded).trim() });
        }
        if (companyDescription && String(companyDescription).trim()) {
          formDataArray.push({ name: 'description', data: String(companyDescription).trim() });
        }

        // Additional Information
        if (taxId && String(taxId).trim()) {
          formDataArray.push({ name: 'taxId', data: String(taxId).trim() });
        }

        // Prepare file object with proper URI format
        let imageUri = profileImage.uri;
        let fileUri = imageUri;

        // Remove file:// prefix for file:// URIs
        if (fileUri.startsWith('file://')) {
          fileUri = fileUri.replace('file://', '');
        }

        // For content:// URIs, use as-is
        // For file paths, wrap with ReactNativeBlobUtil.wrap()
        const fileData = {
          name: 'companyLogo',
          filename: profileImage.fileName || profileImage.name || `logo_${Date.now()}.${imageUri.includes('.png') ? 'png' : 'jpg'}`,
          type: profileImage.type || profileImage.mimeType || 'image/jpeg',
          data: fileUri.startsWith('content://')
            ? fileUri
            : ReactNativeBlobUtil.wrap(fileUri),
        };

        formDataArray.push(fileData);

        // console.log('📡 Update URL:', url);
        // console.log('📦 Uploading with FormData (includes companyLogo file)');

        // Use react-native-blob-util for reliable file uploads
        const uploadResult = await ReactNativeBlobUtil.fetch(
          'PUT',
          url,
          {
            'Accept': 'application/json',
            'Authorization': `Bearer ${loginResponse.token}`,
          },
          formDataArray
        );

        // console.log('📥 Upload response status:', uploadResult.info().status);

        try {
          const responseText = uploadResult.text();
          if (responseText && responseText.trim() !== '') {
            if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
              result = JSON.parse(responseText);
            } else {
              result = { message: responseText.trim(), success: true };
            }
          } else {
            result = { message: 'Profile updated successfully', success: true };
          }
        } catch (parseError) {
          // console.error('❌ Parse error:', parseError);
          result = { message: 'Profile updated successfully', success: true };
        }

        // console.log('📥 API Response:', JSON.stringify(result, null, 2));
      } else {
        // No new logo - use regular PUTNETWORK for JSON payload
        // console.log('📡 Update URL:', url);
        // console.log('📦 Update payload:', JSON.stringify(updateData, null, 2));

        result = await PUTNETWORK(url, updateData, true);
        // console.log('📥 API Response:', JSON.stringify(result, null, 2));
      }

      if (result && !result.error && !result.errors) {
        // console.log('✅ SUCCESS: Profile updated successfully!');
        // console.log('✅ Updated company name:', companyName);
        // console.log('✅ Updated contact person:', contactPersonName);

        // Update logoUrl if returned in the response
        if (result.logoUrl && result.logoUrl.trim() !== '') {
          let logoUrlToSet = result.logoUrl;
          // Construct full URL if it's a relative path
          if (!result.logoUrl.startsWith('http://') && !result.logoUrl.startsWith('https://')) {
            const baseUrl = BASE_URL.replace('/api/', '/');
            logoUrlToSet = baseUrl + result.logoUrl.replace(/^\//, '');
          }
          // console.log('✅ Updating logo URL to:', logoUrlToSet);
          setProfileImage({ uri: logoUrlToSet });
        }

        setToastMessage({
          type: "success",
          msg: "Profile updated successfully!",
          visible: true,
        });

        // Refetch profile data to ensure everything is up-to-date
        // console.log('🔄 Refetching profile data after update...');
        await fetchEmployerProfile();

        // Navigate back after a short delay
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        // console.error('❌ ERROR: Failed to update profile');

        // Check if there are errors array
        if (result?.errors && Array.isArray(result.errors)) {
          // console.error('❌ API returned', result.errors.length, 'error(s):');
          result.errors.forEach((error, index) => {
            // console.error(`❌ Error ${index + 1}:`, {
            //   field: error.path || error.field || 'unknown',
            //   message: error.msg || error.message || 'No message',
            //   value: error.value || 'N/A',
            //   type: error.type || 'N/A',
            //   fullError: error
            // });
          });

          // Show first error message to user
          const firstError = result.errors[0];
          const errorMsg = firstError.msg || firstError.message || 'Failed to update profile';
          setToastMessage({
            type: "error",
            msg: errorMsg,
            visible: true,
          });
        } else if (result?.error) {
          // console.error('❌ API returned single error:', result.error);
          setToastMessage({
            type: "error",
            msg: result.error || "Failed to update profile. Please try again.",
            visible: true,
          });
        } else if (result?.message) {
          // console.error('❌ API returned message:', result.message);
          setToastMessage({
            type: "error",
            msg: result.message || "Failed to update profile. Please try again.",
            visible: true,
          });
        } else {
          // console.error('❌ Unknown error format');
          setToastMessage({
            type: "error",
            msg: "Failed to update profile. Please try again.",
            visible: true,
          });
        }

        // console.error('❌ Full response:', JSON.stringify(result, null, 2));
      }
    } catch (error) {
      // console.error('❌ ERROR: Exception occurred while updating profile');
      // console.error('❌ Error details:', error);
      // console.error('❌ Error message:', error.message);
      // console.error('❌ Error stack:', error.stack);
      setToastMessage({
        type: "error",
        msg: "Failed to update profile. Please try again.",
        visible: true,
      });
    } finally {
      // console.log('🏁 Profile update process completed');
    }
  };

  // Calculate profile completion percentage (must match ProfileScreen calculation)
  const calculateCompletion = () => {
    const sections = [
      companyName, // Company Name
      companyEmail, // Email
      companyPhone, // Phone
      contactPersonName, // Contact Person
      companyAddress, // Address
      companyWebsite, // Website
      industry, // Industry
      companySize, // Company Size
      companyType, // Company Type
      founded, // Founded Year
      companyDescription, // Company Description
    ];

    const completedSections = sections.filter(Boolean).length;
    const totalSections = sections.length;
    const percentage = Math.round((completedSections / totalSections) * 100);
    return percentage;
  };

  const completionPercentage = calculateCompletion();
  const companyTypeLabel = companyType === "" ? "Select company type" :
    companyType === "small_business" ? "Small Business" :
    companyType === "medium_business" ? "Medium Business" :
    companyType === "large_corporation" ? "Large Corporation" :
    companyType === "non_profit" ? "Non-Profit" :
    companyType;

  const Container = Platform.OS === "ios" ? SafeAreaView : View;

  return (
    <>
      <StatusBar
        barStyle={Platform.OS === "ios" ? "dark-content" : "dark-content"}
        backgroundColor={WHITE}
        translucent={Platform.OS === "android"}
      />
      <Container style={[
        styles.container,
        Platform.OS === "ios" && styles.containerIOS,
        Platform.OS === "android" && styles.containerAndroid
      ]}>
        <View style={styles.topHeader}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Image source={BACK} style={styles.backIcon} />
          </TouchableOpacity>
          <Text style={styles.topHeaderTitle}>Edit Profile</Text>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading profile data...</Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={[
                styles.scrollContent,
                Platform.OS === "ios" && styles.scrollContentIOS,
                Platform.OS === "android" && styles.scrollContentAndroid
              ]}
              showsVerticalScrollIndicator={false}
            >
              {/* Profile Image Section with Completion Percentage */}
              <View style={styles.profileImageContainer}>
                <View style={styles.progressWrapper}>
                  <CircularProgress
                    size={110}
                    strokeWidth={4}
                    progress={completionPercentage}
                    color={completionPercentage === 100 ? '#4CAF50' : BRANDCOLOR}
                  />
                  <View style={styles.profileImageWrapper}>
                    {profileImage ? (
                      <Image
                        source={typeof profileImage === 'string' ? { uri: profileImage } : { uri: profileImage.uri }}
                        style={styles.profileImage}
                        defaultSource={PROFILE}
                        onError={(error) => {
                          // console.log('❌ Error loading profile image:', error);
                          setProfileImage(null);
                        }}
                      />
                    ) : (
                      <Image source={PROFILE} style={styles.profileImage} />
                    )}
                  </View>
                  {/* <TouchableOpacity
                  style={styles.editIconOverlay}
                  onPress={pickProfileImage}
                  activeOpacity={0.7}
                > */}
                  <TouchableOpacity
                    style={styles.editIconOverlay}
                    onPress={pickProfileImage}
                  >
                    <Image source={CAMERA} style={styles.editIcon} />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.progressText, { color: completionPercentage === 100 ? '#4CAF50' : BRANDCOLOR }]}> 
                  {completionPercentage}%
                </Text>
              </View>

              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Basic Information</Text>
                <TextInputComponent
                  placeholder="Company Name"
                  inputdata={companyName}
                  setInputdata={setCompanyName}
                  borderColor={BRANDCOLOR}
                  width="100%"
                  image={COMPANYNAME}
                  iconTintColor={null}
                  editable={false}
                />
                <TextInputComponent
                  placeholder="Company Address"
                  inputdata={companyAddress}
                  setInputdata={setCompanyAddress}
                  borderColor={BRANDCOLOR}
                  width="100%"
                  image={ADDRESS}
                  iconTintColor={null}
                />
                <TextInputComponent
                  placeholder="Contact Person Name"
                  inputdata={contactPersonName}
                  setInputdata={setContactPersonName}
                  borderColor={BRANDCOLOR}
                  width="100%"
                  image={USER}
                  iconTintColor={null}
                />
                <TextInputComponent
                  placeholder="Company Email"
                  type="email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  inputdata={companyEmail}
                  setInputdata={setCompanyEmail}
                  borderColor={BRANDCOLOR}
                  width="100%"
                  image={MAIL}
                  iconTintColor={null}
                  editable={false}
                />
                <TextInputComponent
                  placeholder="Company Phone Number"
                  type="number"
                  keyboardType="phone-pad"
                  inputdata={companyPhone}
                  setInputdata={setCompanyPhone}
                  borderColor={BRANDCOLOR}
                  width="100%"
                  image={PHONE}
                  iconTintColor={null}
                  editable={false}
                />
                <TextInputComponent
                  placeholder="Company Website"
                  type="url"
                  keyboardType="url"
                  autoCapitalize="none"
                  inputdata={companyWebsite}
                  setInputdata={setCompanyWebsite}
                  borderColor={BRANDCOLOR}
                  width="100%"
                  image={WEBSITE}
                  iconTintColor={null}
                  editable={false}
                />
              </View>

              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Company Details</Text>
                <View style={styles.rowContainer}>
                  <View style={styles.halfWidth}>
                    <Text style={styles.label}>Industry</Text>
                    <View style={styles.pickerWrapper}>
                      <View style={styles.pickerContainer}>
                        <View style={styles.pickerTextContainer}>
                          <Text style={styles.pickerSelectedText} numberOfLines={1}>
                            {industry === "" ? "Select industry" : industry === "IT" ? "Information Technology" : industry === "HealthCare" ? "Health Care" : industry}
                          </Text>
                        </View>
                        <Picker
                          selectedValue={industry}
                          onValueChange={setIndustry}
                          style={styles.picker}
                          itemStyle={styles.pickerItem}
                        >
                          <Picker.Item label="Select industry" value="" />
                          <Picker.Item label="Information Technology" value="IT" />
                          <Picker.Item label="Hardware" value="Hardware" />
                          <Picker.Item label="Mechanical" value="Mechanical" />
                          <Picker.Item label="Health Care" value="HealthCare" />
                          <Picker.Item label="Finance" value="Finance" />
                          <Picker.Item label="Education" value="Education" />
                          <Picker.Item label="Marketing" value="Marketing" />
                          <Picker.Item label="Other" value="Other" />
                        </Picker>
                        <Image source={DROPDOWN} style={styles.dropdownIcon} />
                      </View>
                    </View>
                  </View>
                  <View style={styles.halfWidth}>
                    <Text style={styles.label}>Company Size</Text>
                    <View style={styles.pickerWrapper}>
                      <View style={styles.pickerContainer}>
                        <View style={styles.pickerTextContainer}>
                          <Text style={styles.pickerSelectedText} numberOfLines={1}>
                            {companySize === "" ? "Select company size" : companySize}
                          </Text>
                        </View>
                        <Picker
                          selectedValue={companySize}
                          onValueChange={setCompanySize}
                          style={styles.picker}
                          itemStyle={styles.pickerItem}
                        >
                          <Picker.Item label="Select company size" value="" />
                          <Picker.Item label="1-10 employees" value="1-10 employees" />
                          <Picker.Item label="11-50 employees" value="11-50 employees" />
                          <Picker.Item label="51-100 employees" value="51-100 employees" />
                          <Picker.Item label="101-500 employees" value="101-500 employees" />
                          <Picker.Item label="501-1000 employees" value="501-1000 employees" />
                          <Picker.Item label="1000+ employees" value="1000+ employees" />
                        </Picker>
                        <Image source={DROPDOWN} style={styles.dropdownIcon} />
                      </View>
                    </View>
                  </View>
                </View>
                <View style={styles.rowContainer}>
                  <View style={styles.halfWidth}>
                    <Text style={styles.label}>Company Type</Text>
                    <View style={styles.pickerWrapper}>
                      <View style={styles.pickerContainer}>
                        <View style={styles.pickerTextContainer}>
                          <Text style={styles.pickerSelectedText} numberOfLines={1}>
                            {companyTypeLabel}
                          </Text>
                        </View>
                        <Picker
                          selectedValue={companyType}
                          onValueChange={setCompanyType}
                          style={styles.picker}
                          itemStyle={styles.pickerItem}
                        >
                          <Picker.Item label="Select company type" value="" />
                          <Picker.Item label="Private" value="Private" />
                          <Picker.Item label="Public" value="Public" />
                          <Picker.Item label="Startup" value="Startup" />
                          <Picker.Item label="Small Business" value="Small Business" />
                          <Picker.Item label="Medium Business" value="Medium Business" />
                          <Picker.Item label="Large Corporation" value="Large Corporation" />
                          <Picker.Item label="Non-Profit" value="Non-Profit" />
                          <Picker.Item label="Government" value="Government" />
                        </Picker>
                        <Image source={DROPDOWN} style={styles.dropdownIcon} />
                      </View>
                    </View>
                  </View>
                  <View style={styles.halfWidth}>
                    <Text style={styles.label}>Founded</Text>
                    <TextInputComponent
                      placeholder="Founded Year"
                      type="number"
                      keyboardType="numeric"
                      inputdata={founded}
                      setInputdata={setFounded}
                      borderColor={BRANDCOLOR}
                      width="100%"
                      image={FOUNDED}
                      iconTintColor={null}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Company Description</Text>
                <View style={styles.descriptionContainerCard}>
                  <TextInput
                    style={styles.descriptionInput}
                    placeholder="Enter company description..."
                    placeholderTextColor="#999"
                    value={companyDescription}
                    onChangeText={setCompanyDescription}
                    multiline={true}
                    numberOfLines={6}
                    textAlignVertical="top"
                    maxLength={1000}
                  />
                  <Text style={styles.characterCount}>
                    {companyDescription.length}/1000
                  </Text>
                </View>
              </View>

              {/* ========== ADDITIONAL INFORMATION SECTION ========== */}
              <View style={styles.sectionHeadingContainer}>
                <Image source={INDUSTRY} style={styles.sectionIcon} />
                <Text style={styles.sectionHeading}>Additional Information</Text>
              </View>

              {/* GSTIN */}
              <TextInputComponent
                placeholder="GSTIN"
                inputdata={taxId}
                setInputdata={setTaxId}
                borderColor={BRANDCOLOR}
                width="95%"
                image={COMPANYNAME}
                iconTintColor={null}
              />

              {/* Social Media Section */}
              <View style={styles.sectionHeadingContainer}>
                <Image source={INDUSTRY} style={styles.sectionIcon} />
                <Text style={styles.sectionHeading}>Social Media</Text>
              </View>
              <TextInputComponent
                placeholder="LinkedIn"
                inputdata={linkedin}
                setInputdata={setLinkedin}
                borderColor={BRANDCOLOR}
                width="95%"
                image={LINKEDIN}
                iconTintColor={null}
              />
              <TextInputComponent
                placeholder="X"
                inputdata={twitter}
                setInputdata={setTwitter}
                borderColor={BRANDCOLOR}
                width="95%"
                image={TWITTER}
                iconTintColor={null}
              />
              <TextInputComponent
                placeholder="Facebook"
                inputdata={facebook}
                setInputdata={setFacebook}
                borderColor={BRANDCOLOR}
                width="95%"
                image={FACEBOOK}
                iconTintColor={null}
              />
              <TextInputComponent
                placeholder="Instagram"
                inputdata={instagram}
                setInputdata={setInstagram}
                borderColor={BRANDCOLOR}
                width="95%"
                image={INSTAGRAM}
                iconTintColor={null}
              />

              {/* Save Button */}
              <View style={styles.buttonWrapper}>
                <CustomButton
                  text="Save Profile"
                  color={WHITE}
                  onPress={handleSaveProfile}
                />
              </View>
            </ScrollView>
          )}
        </KeyboardAvoidingView>

        {/* Toast Message */}
        <ToastMessage
          type={toastMessage.type}
          message={toastMessage.msg}
          visible={toastMessage.visible}
          setVisible={({ visible }) =>
            setToastMessage((prev) => ({ ...prev, visible }))
          }
          bacgroundColor={toastMessage.type === "success" ? "green" : toastMessage.type === "error" ? "red" : "#2196F3"}
          textColor={WHITE}
          duration={3000}
        />
      </Container>
    </>
  );
};

export default EditProfileScreen;

/* -------------------------------------------------------------------------- */
/*                              REUSABLE COMPONENTS                            */
/* -------------------------------------------------------------------------- */

// Circular Progress Component
const CircularProgress = ({ size, strokeWidth, progress, color }) => {
  const radius = size / 2;

  // Calculate which borders to show based on progress
  const progressPercent = progress / 100;
  const quarter1 = progressPercent >= 0.25;
  const quarter2 = progressPercent >= 0.5;
  const quarter3 = progressPercent >= 0.75;
  const quarter4 = progressPercent >= 1.0;

  return (
    <View style={[styles.circularProgressContainer, { width: size, height: size }]}>
      {/* Background circle */}
      <View
        style={[
          styles.circularProgressRing,
          {
            width: size,
            height: size,
            borderRadius: radius,
            borderWidth: strokeWidth,
            borderColor: '#E0E0E0',
          },
        ]}
      />
      {/* Progress circle - using border colors to show progress */}
      <View
        style={[
          styles.circularProgressRing,
          {
            width: size,
            height: size,
            borderRadius: radius,
            borderWidth: strokeWidth,
            borderColor: 'transparent',
            borderTopColor: quarter1 ? color : 'transparent',
            borderRightColor: quarter2 ? color : 'transparent',
            borderBottomColor: quarter3 ? color : 'transparent',
            borderLeftColor: quarter4 ? color : 'transparent',
            position: 'absolute',
            transform: [{ rotate: '-90deg' }],
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WHITE,
  },
  containerIOS: {
    paddingTop: Platform.OS === "ios" ? 50 : 0,
  },
  containerAndroid: {
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  keyboardView: {
    flex: 1,
  },
  topHeader: {
    width: '100%',
    backgroundColor: WHITE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: WIDTH * 0.04,
    paddingVertical: HEIGHT * 0.02,
  },
  backButton: {
    padding: WIDTH * 0.01,
  },
  backIcon: {
    width: WIDTH * 0.05,
    height: WIDTH * 0.05,
    resizeMode: 'contain',
    tintColor: BLACK,
  },
  topHeaderTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: HEIGHT * 0.022,
    color: BLACK,
    fontFamily: UBUNTUBOLD,
  },
  headerSaveButton: {
    padding: WIDTH * 0.01,
  },
  headerSaveText: {
    color: WHITE,
    fontSize: HEIGHT * 0.016,
    fontFamily: FIRASANSSEMIBOLD,
  },
  profileActionButton: {
    width: '100%',
    alignItems: 'center',
    marginTop: HEIGHT * 0.02,
  },
  scrollContent: {
    padding: WIDTH * 0.04,
    paddingBottom: HEIGHT * 0.04,
    backgroundColor: '#F5F8FF',
  },
  scrollContentIOS: {
    padding: Platform.OS === "ios" ? WIDTH * 0.03 : WIDTH * 0.025,
    paddingBottom: Platform.OS === "ios" ? HEIGHT * 0.045 : HEIGHT * 0.04,
  },
  scrollContentAndroid: {
    padding: Platform.OS === "android" ? WIDTH * 0.025 : WIDTH * 0.025,
    paddingBottom: Platform.OS === "android" ? HEIGHT * 0.038 : HEIGHT * 0.04,
  },
  sectionCard: {
    backgroundColor: WHITE,
    borderRadius: 20,
    paddingVertical: HEIGHT * 0.025,
    paddingHorizontal: WIDTH * 0.05,
    marginBottom: HEIGHT * 0.02,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: HEIGHT * 0.02,
    fontFamily: UBUNTUBOLD,
    color: BLACK,
    marginBottom: HEIGHT * 0.02,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: WIDTH * 0.03,
  },
  halfWidth: {
    width: '48%',
  },
  descriptionContainerCard: {
    borderWidth: 1,
    borderColor: '#E4E8F0',
    borderRadius: WIDTH * 0.03,
    padding: WIDTH * 0.04,
    minHeight: HEIGHT * 0.18,
    justifyContent: 'space-between',
  },
  profileImageContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: HEIGHT * 0.025,
    marginRight: WIDTH * 0.02, // Add margin right to center the image
  },
  progressWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  circularProgressContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularProgressRing: {
    position: 'absolute',
  },
  profileImageWrapper: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: WHITE,
    zIndex: 1,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    resizeMode: 'cover',
  },
  editIconOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: BRANDCOLOR,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: WHITE,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 2,
  },
  editIcon: {
    width: 20,
    height: 20,
    resizeMode: "contain",
  },
  progressText: {
    fontSize: 14,
    fontFamily: UBUNTUBOLD,
    textAlign: 'center',
    marginTop: 4,
  },
  editIcon: {
    width: WIDTH * 0.05,
    height: WIDTH * 0.05,
    resizeMode: "contain",
    tintColor: WHITE,
  },
  sectionHeadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: HEIGHT * 0.025,
    marginBottom: HEIGHT * 0.018,
    marginLeft: WIDTH * 0.03,
    borderBottomWidth: 2,
    borderBottomColor: BRANDCOLOR,
    paddingBottom: HEIGHT * 0.01,
  },
  sectionIcon: {
    width: WIDTH * 0.06,
    height: WIDTH * 0.06,
    marginRight: WIDTH * 0.02,
    resizeMode: "contain",
  },
  sectionHeading: {
    fontSize: HEIGHT * 0.02,
    fontFamily: UBUNTUBOLD,
    color: BLACK,
  },
  label: {
    marginLeft: WIDTH * 0.03,
    marginTop: HEIGHT * 0.012,
    marginBottom: HEIGHT * 0.005,
    fontSize: HEIGHT * 0.018,
    fontFamily: FIRASANSSEMIBOLD,
    color: BLACK,
  },
  pickerWrapper: {
    marginHorizontal: WIDTH * 0.025,
    marginBottom: HEIGHT * 0.012,
    borderWidth: 1,
    borderColor: BRANDCOLOR,
    borderRadius: WIDTH * 0.03,
    backgroundColor: WHITE,
    minHeight: HEIGHT * 0.06,
  },
  pickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: WIDTH * 0.03,
    paddingLeft: WIDTH * 0.01,
    position: "relative",
  },
  pickerTextContainer: {
    position: "absolute",
    left: WIDTH * 0.01,
    right: WIDTH * 0.1,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    zIndex: 1,
    paddingLeft: WIDTH * 0.02,
    pointerEvents: "none",
  },
  pickerSelectedText: {
    fontSize: HEIGHT * 0.018,
    color: BLACK,
    fontFamily: UBUNTU,
  },
  picker: {
    flex: 1,
    color: "transparent",
    fontSize: HEIGHT * 0.018,
    paddingVertical: HEIGHT * 0.012,
    paddingHorizontal: WIDTH * 0.03,
    height: HEIGHT * 0.06,
  },
  pickerItem: {
    color: BLACK,
    fontSize: HEIGHT * 0.018,
  },
  dropdownIcon: {
    width: WIDTH * 0.05,
    height: WIDTH * 0.05,
    resizeMode: "contain",
    marginLeft: WIDTH * 0.02,
  },
  descriptionContainer: {
    width: "95%",
    alignSelf: "center",
    marginVertical: HEIGHT * 0.012,
  },
  descriptionLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: HEIGHT * 0.01,
    marginLeft: WIDTH * 0.01,
  },
  descriptionIcon: {
    width: WIDTH * 0.06,
    height: WIDTH * 0.06,
    marginRight: WIDTH * 0.02,
    resizeMode: "contain",
  },
  descriptionLabel: {
    fontSize: HEIGHT * 0.018,
    fontFamily: FIRASANSSEMIBOLD,
    color: BLACK,
  },
  descriptionInputWrapper: {
    borderWidth: 1,
    borderRadius: WIDTH * 0.03,
    backgroundColor: WHITE,
    minHeight: HEIGHT * 0.18,
    padding: WIDTH * 0.03,
    paddingTop: WIDTH * 0.03,
  },
  descriptionInput: {
    flex: 1,
    fontSize: HEIGHT * 0.018,
    color: BLACK,
    minHeight: HEIGHT * 0.16,
    textAlignVertical: "top",
  },
  characterCount: {
    fontSize: HEIGHT * 0.016,
    color: "#999",
    textAlign: "right",
    marginTop: HEIGHT * 0.01,
  },
  buttonWrapper: {
    alignItems: "center",
    marginTop: HEIGHT * 0.025,
    marginBottom: HEIGHT * 0.037,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: HEIGHT * 0.1,
  },
  loadingText: {
    fontSize: HEIGHT * 0.018,
    color: BRANDCOLOR,
    fontFamily: FIRASANSSEMIBOLD,
  },
  readOnlyContainer: {
    width: "95%",
    alignSelf: "center",
    marginBottom: HEIGHT * 0.015,
    padding: WIDTH * 0.03,
    backgroundColor: "#F5F5F5",
    borderRadius: WIDTH * 0.03,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  readOnlyLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: HEIGHT * 0.008,
  },
  readOnlyIcon: {
    width: WIDTH * 0.05,
    height: WIDTH * 0.05,
    marginRight: WIDTH * 0.02,
    resizeMode: "contain",
    tintColor: "#999",
  },
  readOnlyLabel: {
    fontSize: HEIGHT * 0.016,
    fontFamily: FIRASANSSEMIBOLD,
    color: "#666",
  },
  readOnlyValue: {
    fontSize: HEIGHT * 0.018,
    fontFamily: UBUNTUBOLD,
    color: BLACK,
    marginLeft: WIDTH * 0.07,
  },
});