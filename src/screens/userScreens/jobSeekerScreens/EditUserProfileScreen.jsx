import React, { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  StatusBar,
  Platform,
  BackHandler,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Alert,
  PermissionsAndroid,
  Pressable,
  Linking,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { launchImageLibrary } from "react-native-image-picker";
import { pick, isCancel } from '@react-native-documents/picker';

import { BLACK, BRANDCOLOR, WHITE } from "../../../constant/color";
import { UBUNTUBOLD, FIRASANSSEMIBOLD, UBUNTU, FIRASANSBOLD } from "../../../constant/fontPath";
import { MyHeader } from "../../../components/commonComponents/MyHeader";
import { TextInputComponent } from "../../../components/commonComponents/TextInputComponent";
import { CustomButton } from "../../../components/commonComponents/Button";
import { ToastMessage } from "../../../components/commonComponents/ToastMessage";
import DateComponent from "../../../components/dateComponents/DateComponent";

import {
  PROFILE,
  USER,
  MAIL,
  PHONE,
  ADDRESS,
  DROPDOWN,
  CAMERA,
  SLOGAN,
  DOB,
  UPLOAD,
} from "../../../constant/imagePath";
import { getObjByKey, storeObjByKey } from "../../../utils/Storage";
import { BASE_URL } from "../../../constant/url";
import { GETNETWORK, PUTNETWORK } from "../../../utils/Network";
import ReactNativeBlobUtil from 'react-native-blob-util';

const PERMITTED_LANGUAGES = ["English", "Hindi", "Odia", "Bengali", "Telugu"];
const KEY_SKILL_OPTIONS = [
  "Java",
  "JavaScript",
  "C",
  "Kotlin",
  "C++",
  "HTML5",
  "CSS3",
  "React.js",
  "Next.js",
  "Bootstrap",
  "Node.js",
  "Tailwind CSS",
  "Express.js",
  "MySQL",
  "MongoDB",
  "Firebase",
  "Android Development",
  "iOS Development",
  "React Native"
];
const TECHNICAL_SKILL_OPTIONS = ["React Native", "JavaScript", "TypeScript", "Node.js", "Python", "AWS", "SQL", "Firebase"];

const capitalizeFirst = (str) => {
  if (!str || typeof str !== "string") return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const formatSkillName = (skill) => {
  if (!skill || typeof skill !== 'string') return skill || '';

  const lowerSkill = skill.toLowerCase().trim();

  // Special cases
  if (lowerSkill === 'html') return 'HTML';
  if (lowerSkill === 'css') return 'CSS';
  if (lowerSkill === 'mysql') return 'MySQL';
  if (lowerSkill === 'mongodb') return 'MongoDB';
  if (lowerSkill === 'ios development') return 'iOS Development';
  if (lowerSkill === 'android development') return 'Android Development';
  if (lowerSkill === 'tailwind css') return 'Tailwind CSS';

  // Default: capitalize each word
  return skill.split(' ').map(word => capitalizeFirst(word)).join(' ');
};

const formatDateToDDMMYYYY = (dateString) => {
  if (!dateString) return "";
  try {
    if (typeof dateString !== 'string') return '';
    if (dateString.includes("/") && dateString.split("/").length === 3) {
      return dateString;
    }
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
    return dateString;
  } catch {
    return dateString;
  }
};

const CircularProgress = ({ size, strokeWidth, progress, color }) => {
  const radius = size / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate which borders to show based on progress
  const progressPercent = progress / 100;
  const quarter1 = progressPercent >= 0.25;
  const quarter2 = progressPercent >= 0.5;
  const quarter3 = progressPercent >= 0.75;
  const quarter4 = progressPercent >= 1.0;
  
  // Calculate partial progress for the current quarter
  let currentQuarterProgress = 0;
  if (progressPercent < 0.25) {
    currentQuarterProgress = progressPercent / 0.25;
  } else if (progressPercent < 0.5) {
    currentQuarterProgress = (progressPercent - 0.25) / 0.25;
  } else if (progressPercent < 0.75) {
    currentQuarterProgress = (progressPercent - 0.5) / 0.25;
  } else {
    currentQuarterProgress = (progressPercent - 0.75) / 0.25;
  }

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

const calculateCompletionPercentage = ({
  name, email, phone, address, gender, dob, profilePicture,
  preferredLocation, currentSalary, expectedSalary, noticePeriod, bio,
  slogan, file, resumeUrl,
  experienceItems, educationItems, certificationItems, keySkills, languages
}) => {
  let percentage = 0;

  // Helper function to check if field is truly filled
  const isFieldFilled = (field) => {
    if (!field) return false;
    const strValue = String(field).trim();
    return strValue !== '' && strValue !== 'N/A';
  };

  // Personal Details Section: 20% (if name, email, phone, address, gender, dob are filled)
  const personalDetailsFields = [name, email, phone, address, gender, dob];
  const personalDetailsFilled = personalDetailsFields.filter(isFieldFilled).length;
  if (personalDetailsFilled === personalDetailsFields.length) {
    percentage += 20;
  }

  // Profile Picture: 10% (if profilePicture is set)
  if (profilePicture) {
    // Handle both object with uri and string URL
    const hasPicture = profilePicture.uri ? true : (typeof profilePicture === 'string' && profilePicture.trim() !== '');
    if (hasPicture) {
      percentage += 10;
    }
  }

  // Career Preference Section: 10% (if preferredLocation, currentSalary, expectedSalary, noticePeriod, bio are filled)
  const careerFields = [preferredLocation, currentSalary, expectedSalary, noticePeriod, bio];
  const careerFieldsFilled = careerFields.filter(isFieldFilled).length;
  if (careerFieldsFilled === careerFields.length) {
    percentage += 10;
  }

  // Profile Summary Section: 5% (if slogan is filled)
  if (isFieldFilled(slogan)) {
    percentage += 5;
  }

  // Resume Added: 10% (if file or resumeUrl is added and not empty)
  const hasResume = (file && file.uri && file.uri.trim() !== '') || (resumeUrl && String(resumeUrl).trim() !== '');
  if (hasResume) {
    percentage += 10;
  }

  // Employment History: 10% (if experienceItems has at least one filled entry)
  const filledExperience = experienceItems.filter(
    (exp) => exp.companyName && String(exp.companyName).trim() !== ''
  ).length;
  if (filledExperience > 0) {
    percentage += 10;
  }

  // Certification: 2% (if certificationItems has at least one filled entry)
  const filledCertifications = certificationItems.filter(
    (cert) => cert.name && String(cert.name).trim() !== ''
  ).length;
  if (filledCertifications > 0) {
    percentage += 2;
  }

  // Education: 20% (if educationItems has at least one filled entry)
  const filledEducation = educationItems.filter(
    (edu) => edu.degree && String(edu.degree).trim() !== ''
  ).length;
  if (filledEducation > 0) {
    percentage += 20;
  }

  // Skills: 20% (if keySkills array has at least one skill)
  if (keySkills && keySkills.length > 0) {
    percentage += 20;
  }

  // Language: 13% (if languages array has at least one language)
  if (languages && languages.length > 0) {
    percentage += 13;
  }

  return Math.min(Math.round(percentage), 100);
};

const EditUserProfileScreen = ({ navigation, route }) => {
  const params = route?.params || {};

  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [preferredLocation, setPreferredLocation] = useState("");
  const [preferredRole, setPreferredRole] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [experience, setExperience] = useState("");
  const [expectedSalary, setExpectedSalary] = useState("");
  const [currentSalary, setCurrentSalary] = useState("");
  const [noticePeriod, setNoticePeriod] = useState("");
  const [bio, setBio] = useState("");
  const [designation, setDesignation] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [slogan, setSlogan] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [languages, setLanguages] = useState([]);
  const [keySkills, setKeySkills] = useState([]);
  const [technicalSkills, setTechnicalSkills] = useState([]);
  const [newKeySkill, setNewKeySkill] = useState("");
  const [newTechnicalSkill, setNewTechnicalSkill] = useState("");
  const [experienceItems, setExperienceItems] = useState([{ companyName: "", industryType: "", startDate: "", endDate: "", stillWorking: false }]);
  const [projectItems, setProjectItems] = useState([{ projectName: "", companyName: "", startDate: "", endDate: "", stillInProgress: false }]);
  const [certificationItems, setCertificationItems] = useState([{ name: "", organization: "", certificationId: "", certificationUrl: "", validFrom: "", validTo: "", noEndDate: false }]);
  const [educationItems, setEducationItems] = useState([{ degree: "", institution: "", startDate: "", endDate: "", currentlyStudying: false }]);
  const [profilePicture, setProfilePicture] = useState(null);
  const [file, setFile] = useState(null);
  const [resumeUrl, setResumeUrl] = useState(null);
  const [resumeName, setResumeName] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [toastMessage, setToastMessage] = useState({ type: "", msg: "", visible: false });
  const [loading, setLoading] = useState(false);

  const parseToArray = (value) => {
    if (Array.isArray(value)) return value;
    if (!value) return [];
    if (typeof value === 'string') return value ? [value] : [];
    return [value];
  };

  const getRouteProfilePayload = () => {
    const payload = params.profileData || params.profile || params.user;
    if (payload) return payload;
    // If direct params have profilePicture or resume, use params
    if (params.profilePicture || params.resume) return params;
    return {};
  };

  const getBaseDomain = () => BASE_URL.replace(/\/api\/?$/, '/');

  const getResumeDownloadUrl = (resumePath) => {
    if (!resumePath) return null;
    if (resumePath.startsWith('http://') || resumePath.startsWith('https://')) return resumePath;
    const baseUrl = getBaseDomain();
    return resumePath.startsWith('/') ? `${baseUrl}${resumePath}` : `${baseUrl}/${resumePath}`;
  };

  const buildExperienceItems = (user) => {
    const items = parseToArray(user.experiences || user.experience || user.workExperience || []);
    if (items.length === 0) return [{ companyName: "", industryType: "", startDate: "", endDate: "", stillWorking: false }];
    return items.map((item) => ({
      companyName: item.companyName || item.company || item.company_name || "",
      industryType: item.industryType || item.industry || item.industry_type || "",
      startDate: item.startDate || item.start_date || item.from || "",
      endDate: item.endDate || item.end_date || item.to || "",
      stillWorking: item.stillWorking || item.currentlyWorking || item.isCurrent || false,
    }));
  };

  const buildProjectItems = (user) => {
    const items = parseToArray(user.projects || user.project || []);
    if (items.length === 0) return [{ projectName: "", companyName: "", startDate: "", endDate: "", stillInProgress: false }];
    return items.map((item) => ({
      projectName: item.name || item.projectName || item.title || "",
      companyName: item.company || item.client || "",
      startDate: item.startDate || item.start_date || item.from || "",
      endDate: item.endDate || item.end_date || item.to || "",
      stillInProgress: item.stillInProgress || item.inProgress || item.currentlyWorking || false,
    }));
  };

  const buildCertificationItems = (user) => {
    const items = parseToArray(user.certifications || user.certification || []);
    if (items.length === 0) return [{ name: "", organization: "", certificationId: "", certificationUrl: "", validFrom: "", validTo: "", noEndDate: false }];
    return items.map((item) => ({
      name: item.name || item.title || "",
      organization: item.organization || item.issuedBy || item.issuer || "",
      certificationId: item.certificationId || item.certificateId || item.id || "",
      certificationUrl: item.certificationUrl || item.url || item.link || "",
      validFrom: item.validFrom || item.valid_from || item.from || "",
      validTo: item.validTo || item.valid_to || item.to || "",
      noEndDate: item.noEndDate || item.no_end_date || item.currentlyValid || false,
    }));
  };

  const buildEducationItems = (user) => {
    const items = parseToArray(user.education || user.educations || []);
    if (items.length === 0) return [{ degree: "", institution: "", startDate: "", endDate: "", currentlyStudying: false }];
    return items.map((item) => ({
      degree: item.degree || item.qualification || item.title || "",
      institution: item.institution || item.school || item.college || item.university || "",
      startDate: item.startYear || item.startDate || item.from || "",
      endDate: item.endYear || item.endDate || item.to || "",
      currentlyStudying: item.currentlyStudying || item.inProgress || item.isStudying || false,
    }));
  };

  const loadProfileData = (user, fromParams = false) => {
    const data = user || {};
    const nameValue = data.name || `${data.firstName || ""} ${data.lastName || ""}`.trim();
    setCompletionPercentage(data.completionPercentage ?? data.profileCompletion ?? params.completionPercentage ?? 0);
    setName(capitalizeFirst(nameValue));
    setEmail(data.email || "");
    setPhone(data.phone || data.mobile || data.mobileNumber || "");
    setAddress(data.address || data.location || "");
    setPreferredLocation(data.preferredLocation || data.preferred_location || "");
    setPreferredRole(data.preferredRole || data.preferred_role || data.role || "");
    setEmploymentType(data.employmentType || data.employment_type || "");
    setExperience(data.experience || data.experienceYears || "");
    setExpectedSalary(data.expectedSalary || data.expected_salary || "");
    setCurrentSalary(data.currentSalary || data.current_salary || "");
    setNoticePeriod(data.noticePeriod || data.notice_period || "");
    setBio(data.bio || data.biography || data.about || "");
    setCompanyName(data.company || "");
    setDesignation(data.currentJobRole || data.designation || data.jobRole || "");
    setSlogan(data.slogan || data.slogans || data.summary || "");
    setGender(data.gender ? data.gender.toLowerCase() : '');
    setDob(formatDateToDDMMYYYY(data.dob || data.dateOfBirth || data.date_of_birth || data.birthDate || ""));
    setLinkedin(data.linkedin || data.linkedinUrl || "");
    setLanguages((() => {
      let languageValues = [];
      if (Array.isArray(data.languages)) languageValues = data.languages;
      else if (Array.isArray(data.language)) languageValues = data.language;
      else if (data.language) languageValues = String(data.language).split(',').map((x) => x.trim());
      return languageValues.map(capitalizeFirst);
    })());
    const parsedKeySkills = Array.isArray(data.keySkills)
      ? data.keySkills
      : typeof data.keySkills === 'string'
        ? data.keySkills.split(',').map((item) => item.trim()).filter(Boolean)
        : Array.isArray(data.skills)
          ? data.skills
          : typeof data.skills === 'string'
            ? data.skills.split(',').map((item) => item.trim()).filter(Boolean)
            : [];
    const parsedTechnicalSkills = Array.isArray(data.technicalSkills)
      ? data.technicalSkills
      : typeof data.technicalSkills === 'string'
        ? data.technicalSkills.split(',').map((item) => item.trim()).filter(Boolean)
        : [];
    setKeySkills(parsedKeySkills);
    setTechnicalSkills(parsedTechnicalSkills);
    setExperienceItems(buildExperienceItems(data));
    setProjectItems(buildProjectItems(data));
    setCertificationItems(buildCertificationItems(data));
    setEducationItems(buildEducationItems(data));

    const resumePath = data.resume || data.resumeUrl || data.resume_url || data.resumeLink || data.resume_link || (fromParams ? (params.resume || params.resumeUrl || params.resume_url) : null);
    const resumeDisplayName = data.resumeName || data.resume_name || (typeof resumePath === 'string' ? resumePath.split('/').pop() : '') || (fromParams ? params.resumeName || params.resume_name : '');
    if (resumePath) {
      setResumeUrl(resumePath);
      setResumeName(resumeDisplayName);
    } else if (!fromParams) {
      setResumeUrl(null);
      setResumeName("");
    }

    // Handle profile picture
    if (data.profilePicture || data.profile_picture || (fromParams && params.profilePicture)) {
      const img = data.profilePicture || data.profile_picture || (fromParams ? params.profilePicture : null);
      console.log('🖼️ Profile picture from data:', img);

      // Construct full URL if it's a relative path
      let fullUri;
      if (img.startsWith('http://') || img.startsWith('https://')) {
        // Already a full URL
        fullUri = img;
      } else {
        // Relative path - construct full URL
        const baseUrl = getBaseDomain();
        fullUri = `${baseUrl}${img.startsWith('/') ? '' : '/'}${img}`;
      }

      console.log('✅ Setting profile picture URI:', fullUri);
      setProfilePicture(fullUri);
    } else if (!fromParams && !profilePicture) {
      console.log('⚠️ No profile picture found in data and none previously set, setting to null');
      setProfilePicture(null);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const initialPayload = getRouteProfilePayload();
      if (Object.keys(initialPayload).length) {
        loadProfileData(initialPayload, true);
      }
      fetchProfile();
    }, [params.profileData, params.profile, params.user, params.profilePicture])
  );

  useEffect(() => {
    const payload = getRouteProfilePayload();
    if (Object.keys(payload).length) {
      loadProfileData(payload, true);
    }
  }, [params.profileData, params.profile, params.user, params.profilePicture]);

  // Calculate completion percentage whenever profile data changes
  useEffect(() => {
    const newPercentage = calculateCompletionPercentage({
      name,
      email,
      phone,
      address,
      gender,
      dob,
      profilePicture,
      preferredLocation,
      currentSalary,
      expectedSalary,
      noticePeriod,
      bio,
      slogan,
      file,
      resumeUrl,
      experienceItems,
      educationItems,
      certificationItems,
      keySkills,
      languages
    });
    setCompletionPercentage(newPercentage);
  }, [
    name,
    email,
    phone,
    address,
    gender,
    dob,
    profilePicture,
    preferredLocation,
    currentSalary,
    expectedSalary,
    noticePeriod,
    bio,
    slogan,
    file,
    resumeUrl,
    experienceItems,
    educationItems,
    certificationItems,
    keySkills,
    languages
  ]);

  const fetchProfile = async () => {
    try {
      const url = `${BASE_URL}profile`;
      const response = await GETNETWORK(url, true);
      // console.log('🔄 Fetch profile response:', response);

      // Handle different response structures
      let user = {};
      if (response?.profile) {
        user = response.profile;
      } else if (response?.data) {
        user = response.data;
      } else if (response?.user) {
        user = response.user;
      } else if (response && typeof response === 'object' && !response.message && !response.error) {
        // If response is the user object directly
        user = response;
      }

      // console.log('👤 Parsed user data:', user);
      // console.log('🖼️ Profile picture in response:', user?.profilePicture || user?.profile_picture);

      loadProfileData(user, false);
    } catch (error) {
      // console.log('❌ Fetch profile error:', error);
      const stored = await getObjByKey('loginResponse');
      const user = stored?.data || stored || {};
      loadProfileData(user, false);
    }
  };

  const pickImage = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.7 }, (response) => {
      if (response.didCancel || response.errorCode) return;
      const asset = response.assets?.[0];
      if (asset) setProfilePicture({ uri: asset.uri });
    });
  };

  const pickFile = async () => {
    // console.log('pickFile called');
    try {
      if (Platform.OS === 'android' && Platform.Version <= 32) {
        // console.log('Checking permissions for Android <= 32');
        const hasPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
        // console.log('Has permission:', hasPermission);
        if (!hasPermission) {
          const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
          // console.log('Permission granted:', granted);
          if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
            Alert.alert(
              "Permission Required",
              "Resume upload permission is required on this device. Please go to Settings > Apps > Uptula > Permissions and enable Storage permission.",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Open Settings", onPress: () => Linking.openSettings() }
              ]
            );
            return;
          } else if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert(
              "Permission Denied",
              "Please grant resume upload permission to select documents. You can enable it in app settings.",
              [{ text: "OK" }]
            );
            return;
          }
        }
      } else {
        // console.log('No Android storage permission required for this OS version');
      }

      try {
        // console.log('Calling pick function');
        const [result] = await pick({
          type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        });
        // console.log('Pick result:', result);

        if (result) {
          setFile({
            name: result.name || result.uri.split('/').pop() || 'document.pdf',
            uri: result.uri,
            type: result.type || 'application/pdf',
            size: result.size || 0,
          });
          // console.log('File set:', result);
        }
      } catch (pickerErr) {
        // console.log('Picker error:', pickerErr);
        if (isCancel(pickerErr)) {
          // User cancelled document picker
          // console.log('User cancelled');
        } else {
          Alert.alert(
            "Select Document",
            "Please navigate to your device's file manager and select a PDF, DOC, or DOCX file from your Downloads or Documents folder.",
            [{ text: "OK" }]
          );
        }
      }
    } catch (err) {
      // console.log('Outer catch error:', err);
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

  const handleUpdate = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const putUrl = `${BASE_URL}profile`;

      // Use react-native-blob-util multipart for reliable Android uploads
      const multipart = [];

      // Add text fields
      const addField = (field, value) => {
        const v = value == null ? '' : String(value);
        // Important: don't send empty strings for fields
        // that backend validates strictly (avoid 400s).
        if (v.trim().length === 0) return;
        multipart.push({ name: field, data: v });
      };

      addField('name', name);
      addField('email', email);
      addField('phone', phone);
      addField('address', address);
      addField('preferredLocation', preferredLocation);
      addField('preferredRole', preferredRole);
      addField('employmentType', employmentType);
      addField('expectedSalary', expectedSalary);
      addField('currentSalary', currentSalary);
      addField('noticePeriod', noticePeriod);
      addField('bio', bio);
      addField('companyName', companyName);
      addField('currentJobRole', designation);
      addField('slogan', slogan);
      addField('gender', gender ? gender.toLowerCase() : '');
      addField('dob', dob);
      addField('linkedin', linkedin);
      addField('skills', JSON.stringify(keySkills));
      addField('technicalSkills', Array.isArray(technicalSkills) ? technicalSkills.join(', ') : technicalSkills);
      addField('experience', JSON.stringify(experienceItems));
      addField('projectItems', JSON.stringify(projectItems));
      addField('certificationItems', JSON.stringify(certificationItems));
      addField('educationItems', JSON.stringify(educationItems));
      addField('languages', JSON.stringify(languages));

      // Add profile picture if it exists and is a new local file (not from backend)
      if (profilePicture && profilePicture.uri) {
        let uri = profilePicture.uri;
        // Check if it's a new local file (starts with file:// or content://)
        // If it starts with http, it's already on the server
        if (uri.startsWith('file://') || uri.startsWith('content://')) {
          // Android often returns content:// URIs which can break FormData+fetch.
          // Convert to a real file:// path when possible.
          if (Platform.OS === 'android' && uri.startsWith('content://')) {
            try {
              const stat = await ReactNativeBlobUtil.fs.stat(uri);
              if (stat?.path) {
                uri = `file://${stat.path}`;
              }
              // console.log('🧩 Converted content URI for upload:', { original: profilePicture.uri, uploadUri: uri });
            } catch (e) {
              // console.log('⚠️ Failed to convert content URI, uploading as-is:', { uri, error: e?.message || e });
            }
          }

          const filename = uri.split('/').pop() || 'profile.jpg';
          const mimeType = filename.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
          const pathForWrap = uri.startsWith('file://') ? uri.replace('file://', '') : uri;

          multipart.push({
            name: 'profilePicture',
            filename,
            type: mimeType,
            data: ReactNativeBlobUtil.wrap(pathForWrap),
          });
          // console.log('📸 Adding new profile picture (blob multipart):', { filename, mimeType, uri });
        } else {
          // console.log('✅ Profile picture already on server, skipping upload');
        }
      }

      if (file && file.uri) {
        let resumeUri = file.uri;
        if (resumeUri.startsWith('file://')) {
          resumeUri = resumeUri.replace('file://', '');
        }

        const resumeData = {
          name: 'resume',
          filename: file.name || `resume_${Date.now()}.pdf`,
          type: file.type || 'application/pdf',
          data: file.uri.startsWith('content://') ? file.uri : ReactNativeBlobUtil.wrap(resumeUri),
        };

        multipart.push(resumeData);
        // console.log('📄 Adding resume file to upload:', {
        //   filename: resumeData.filename,
        //   type: resumeData.type,
        //   uri: file.uri,
        // });
      }

      console.log('🟡 PUT profile request', {
        url: putUrl,
        hasToken: Boolean((await getObjByKey('loginResponse'))?.token),
        hasProfilePicture: Boolean(profilePicture?.uri),
      });
      console.log('🧾 PUT profile multipart parts:', multipart.map((p) => ({
        name: p.name,
        filename: p.filename,
        hasData: typeof p.data === 'string' ? p.data.length > 0 : Boolean(p.data),
      })));

      // Get auth token
      const loginRes = await getObjByKey('loginResponse');
      const authToken = loginRes?.token;

      const blobRes = await ReactNativeBlobUtil.fetch(
        'PUT',
        putUrl,
        {
          Accept: 'application/json',
          Authorization: `Bearer ${authToken}`,
          // react-native-blob-util sets multipart boundary automatically
        },
        multipart
      );

      const status = blobRes?.respInfo?.status;
      let responseData = null;
      try {
        responseData = blobRes.json();
      } catch (e) {
        responseData = blobRes?.data;
      }
      const ok = status >= 200 && status < 300;
      // console.log('🟢 PUT profile response', { ok, status, data: responseData });

      const responseMessage =
        responseData?.message ||
        responseData?.error ||
        responseData?.statusMessage ||
        (Array.isArray(responseData?.errors) ? responseData.errors.map((e) => e?.msg).filter(Boolean).join(', ') : null) ||
        (typeof responseData === 'string' ? responseData : null);

      if (ok && (responseData?.success || responseData?.message?.includes('success') || responseData?.profile || responseData?.data || responseData?.profilePicture)) {
        // console.log('✅ Profile update success:', responseMessage || 'Profile updated successfully');
        setToastMessage({ type: 'success', msg: responseMessage || 'Profile updated successfully', visible: true });

        // Postman returns { message, profilePicture: "/uploads/..." }
        // Ensure we reflect that in UI immediately.
        const returnedProfilePicture =
          responseData?.profilePicture ||
          responseData?.profile?.profilePicture ||
          responseData?.data?.profilePicture ||
          responseData?.user?.profilePicture;

        if (returnedProfilePicture && typeof returnedProfilePicture === 'string') {
          const baseUrl = getBaseDomain();
          const fullUri =
            returnedProfilePicture.startsWith('http://') || returnedProfilePicture.startsWith('https://')
              ? returnedProfilePicture
              : `${baseUrl}${returnedProfilePicture.startsWith('/') ? '' : '/'}${returnedProfilePicture}`;

          // console.log('🖼️ Updated profile picture from PUT response:', { returnedProfilePicture, fullUri });
          setProfilePicture(fullUri);

          // Persist to storage so other screens (fallback paths) see updated picture
          try {
            const stored = await getObjByKey('loginResponse');
            const next = stored && typeof stored === 'object' ? { ...stored } : {};
            const userObj =
              (next.user && typeof next.user === 'object') ? next.user :
                (next.data && typeof next.data === 'object') ? next.data :
                  (next.profile && typeof next.profile === 'object') ? next.profile :
                    {};

            const mergedUser = { ...userObj, profilePicture: returnedProfilePicture };
            if (next.user && typeof next.user === 'object') next.user = mergedUser;
            else if (next.data && typeof next.data === 'object') next.data = mergedUser;
            else next.user = mergedUser;

            await storeObjByKey('loginResponse', next);
            // console.log('💾 Stored updated profilePicture in loginResponse');
          } catch (e) {
            // console.log('⚠️ Failed to persist profilePicture:', e?.message || e);
          }
        } else {
          // console.log('ℹ️ No profilePicture in PUT response');
        }

        // Notify previous screen to refetch
        if (typeof params?.onProfileUpdate === 'function') {
          try {
            params.onProfileUpdate();
          } catch (e) {
            // console.log('⚠️ onProfileUpdate callback error:', e?.message || e);
          }
        }

        // Navigate back to profile screen after successful update
        setTimeout(() => {
          navigation.goBack();
        }, 1500);

        // Use the response data directly instead of fetching again
        let updatedUser = {};
        if (responseData?.profile) {
          updatedUser = responseData.profile;
        } else if (responseData?.data) {
          updatedUser = responseData.data;
        } else if (responseData && typeof responseData === 'object' && !responseData.message) {
          // If response is the user object directly
          updatedUser = responseData;
        }

        if (Object.keys(updatedUser).length > 0) {
          // console.log('✅ Using updated profile data from PUT response:', updatedUser);
          loadProfileData(updatedUser);
        } else {
          // Fallback to fetch if response doesn't contain user data
          fetchProfile();
        }
      } else {
        // console.log('❌ PUT profile error response:', { ok, status, data: responseData });
        setToastMessage({ type: 'error', msg: responseMessage || 'Update failed', visible: true });
      }
    } catch (error) {
      // console.log('🔥 PUT profile catch error:', { message: error?.message, raw: error });
      const errorMsg = error?.message || (typeof error === 'string' ? error : 'Update failed, try again');
      setToastMessage({ type: 'error', msg: errorMsg, visible: true });
    } finally {
      setLoading(false);
    }
  };

  const toggleLanguage = (lng) => {
    setLanguages((prev) => {
      if (prev.includes(lng)) return prev.filter((item) => item !== lng);
      return [...prev, lng];
    });
  };

  const toggleSkill = (skill, setter, currentSkills) => {
    setter((prev) => {
      if (prev.includes(skill)) return prev.filter((item) => item !== skill);
      return [...prev, skill];
    });
  };

  const addSkill = (skill, setter, clearer, currentSkills) => {
    const trimmed = String(skill).trim();
    if (!trimmed) return;
    setter((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    clearer("");
  };

  const renderInputField = (label, value, setter, icon = null, keyboardType = 'default') => (
    <View style={styles.inputWrapper}>
      <View style={styles.inputLabelRow}>
        {icon && <Image source={icon} style={styles.fieldIcon} />}
        <Text style={styles.inputLabel}>{label}</Text>
      </View>
      <TextInputComponent
        placeholder={label}
        image={icon || ''}
        inputdata={value}
        setInputdata={setter}
        keyboardType={keyboardType}
        width="100%"
        borderColor={BRANDCOLOR}
      />
    </View>
  );

  const renderDetailRow = (label, value, icon = null) => (
    <View style={styles.detailRow}>
      {icon && <Image source={icon} style={styles.detailIcon} />}
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || '--'}</Text>
      <Text style={styles.arrowIcon}>›</Text>
    </View>
  );

  const renderEditableRow = (label, value, setter, icon = null, keyboardType = 'default', editable = true) => (
    <View style={styles.editableRow}>
      {icon && <Image source={icon} style={styles.rowIcon} />}
      <View style={styles.rowContentWrapper}>
        <Text style={styles.rowLabel}>{label}</Text>
        <TextInput
          style={[styles.rowInput, !editable && styles.readOnlyInput]}
          value={value}
          onChangeText={setter}
          placeholder={label}
          keyboardType={keyboardType}
          placeholderTextColor="#9CA3AF"
          editable={editable}
        />
      </View>
      <Text style={styles.arrowIcon}>›</Text>
    </View>
  );

  const updateExperienceItem = (index, field, value) => {
    setExperienceItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const updateProjectItem = (index, field, value) => {
    setProjectItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const updateCertificationItem = (index, field, value) => {
    setCertificationItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const updateEducationItem = (index, field, value) => {
    setEducationItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const renderExperienceEntry = (exp, idx) => (
    <View key={idx} style={styles.subCard}>
      <View style={styles.entryHeaderRow}>
        <Text style={styles.subTitle}>Experience {idx + 1}</Text>
        {experienceItems.length > 1 && (
          <TouchableOpacity onPress={() => setExperienceItems((prev) => prev.filter((_, i) => i !== idx))}>
            <Text style={styles.removeText}>Remove</Text>
          </TouchableOpacity>
        )}
      </View>
      {renderInputField('Company Name', exp.companyName, (v) => updateExperienceItem(idx, 'companyName', v))}
      {renderInputField('Industry Type', exp.industryType, (v) => updateExperienceItem(idx, 'industryType', v))}
      <View style={styles.dateRow}>
        <View style={styles.dateCol}>
          <Text style={styles.dateLabel}>Start Date</Text>
          <DateComponent value={exp.startDate} onChange={(d) => updateExperienceItem(idx, 'startDate', d)} format="MMM YYYY" placeholder="Select Month & Year" />
        </View>
        {!exp.stillWorking && (
          <View style={styles.dateCol}>
            <Text style={styles.dateLabel}>End Date</Text>
            <DateComponent value={exp.endDate} onChange={(d) => updateExperienceItem(idx, 'endDate', d)} format="MMM YYYY" placeholder="Select Month & Year" />
          </View>
        )}
      </View>
      <TouchableOpacity style={styles.checkboxRow} activeOpacity={0.8} onPress={() => updateExperienceItem(idx, 'stillWorking', !exp.stillWorking)}>
        <View style={[styles.checkboxBox, exp.stillWorking && styles.checkboxBoxChecked]}>
          {exp.stillWorking && <Text style={styles.checkboxTick}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>I am currently working here</Text>
      </TouchableOpacity>
    </View>
  );

  const renderProjectEntry = (proj, idx) => (
    <View key={idx} style={styles.subCard}>
      <View style={styles.entryHeaderRow}>
        <Text style={styles.subTitle}>Project {idx + 1}</Text>
        {projectItems.length > 1 && (
          <TouchableOpacity onPress={() => setProjectItems((prev) => prev.filter((_, i) => i !== idx))}>
            <Text style={styles.removeText}>Remove</Text>
          </TouchableOpacity>
        )}
      </View>
      {renderInputField('Project Name', proj.projectName, (v) => updateProjectItem(idx, 'projectName', v))}
      {renderInputField('Company / Client Name', proj.companyName, (v) => updateProjectItem(idx, 'companyName', v))}
      <View style={styles.dateRow}>
        <View style={styles.dateCol}>
          <Text style={styles.dateLabel}>Start Date</Text>
          <DateComponent value={proj.startDate} onChange={(d) => updateProjectItem(idx, 'startDate', d)} format="MMM YYYY" placeholder="Select Month & Year" />
        </View>
        {!proj.stillInProgress && (
          <View style={styles.dateCol}>
            <Text style={styles.dateLabel}>End Date</Text>
            <DateComponent value={proj.endDate} onChange={(d) => updateProjectItem(idx, 'endDate', d)} format="MMM YYYY" placeholder="Select Month & Year" />
          </View>
        )}
      </View>
      <TouchableOpacity style={styles.checkboxRow} activeOpacity={0.8} onPress={() => updateProjectItem(idx, 'stillInProgress', !proj.stillInProgress)}>
        <View style={[styles.checkboxBox, proj.stillInProgress && styles.checkboxBoxChecked]}>
          {proj.stillInProgress && <Text style={styles.checkboxTick}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>This project is still in progress</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCertificationEntry = (cert, idx) => (
    <View key={idx} style={styles.subCard}>
      <View style={styles.entryHeaderRow}>
        <Text style={styles.subTitle}>Certification {idx + 1}</Text>
        {certificationItems.length > 1 && (
          <TouchableOpacity onPress={() => setCertificationItems((prev) => prev.filter((_, i) => i !== idx))}>
            <Text style={styles.removeText}>Remove</Text>
          </TouchableOpacity>
        )}
      </View>
      {renderInputField('Certification Name', cert.name, (v) => updateCertificationItem(idx, 'name', v))}
      {renderInputField('Certification By', cert.organization, (v) => updateCertificationItem(idx, 'organization', v))}
      {renderInputField('Certification ID', cert.certificationId, (v) => updateCertificationItem(idx, 'certificationId', v))}
      {renderInputField('Certification URL', cert.certificationUrl, (v) => updateCertificationItem(idx, 'certificationUrl', v))}
      <View style={styles.dateRow}>
        <View style={styles.dateCol}>
          <Text style={styles.dateLabel}>Valid From</Text>
          <DateComponent value={cert.validFrom} onChange={(d) => updateCertificationItem(idx, 'validFrom', d)} format="MMM YYYY" placeholder="Select Month & Year" />
        </View>
        {!cert.noEndDate && (
          <View style={styles.dateCol}>
            <Text style={styles.dateLabel}>Valid To</Text>
            <DateComponent value={cert.validTo} onChange={(d) => updateCertificationItem(idx, 'validTo', d)} format="MMM YYYY" placeholder="Select Month & Year" />
          </View>
        )}
      </View>
      <TouchableOpacity style={styles.checkboxRow} activeOpacity={0.8} onPress={() => updateCertificationItem(idx, 'noEndDate', !cert.noEndDate)}>
        <View style={[styles.checkboxBox, cert.noEndDate && styles.checkboxBoxChecked]}>
          {cert.noEndDate && <Text style={styles.checkboxTick}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>I do not have a valid end date</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEducationEntry = (edu, idx) => (
    <View key={idx} style={styles.subCard}>
      <View style={styles.entryHeaderRow}>
        <Text style={styles.subTitle}>Education {idx + 1}</Text>
        {educationItems.length > 1 && (
          <TouchableOpacity onPress={() => setEducationItems((prev) => prev.filter((_, i) => i !== idx))}>
            <Text style={styles.removeText}>Remove</Text>
          </TouchableOpacity>
        )}
      </View>
      {renderInputField('Degree', edu.degree, (v) => updateEducationItem(idx, 'degree', v))}
      {renderInputField('Institution', edu.institution, (v) => updateEducationItem(idx, 'institution', v))}
      <View style={styles.dateRow}>
        <View style={styles.dateCol}>
          <Text style={styles.dateLabel}>Start Date</Text>
          <DateComponent value={edu.startDate} onChange={(d) => updateEducationItem(idx, 'startDate', d)} format="MMM YYYY" placeholder="Select Month & Year" />
        </View>
        {!edu.currentlyStudying && (
          <View style={styles.dateCol}>
            <Text style={styles.dateLabel}>End Date</Text>
            <DateComponent value={edu.endDate} onChange={(d) => updateEducationItem(idx, 'endDate', d)} format="MMM YYYY" placeholder="Select Month & Year" />
          </View>
        )}
      </View>
      <TouchableOpacity style={styles.checkboxRow} activeOpacity={0.8} onPress={() => updateEducationItem(idx, 'currentlyStudying', !edu.currentlyStudying)}>
        <View style={[styles.checkboxBox, edu.currentlyStudying && styles.checkboxBoxChecked]}>
          {edu.currentlyStudying && <Text style={styles.checkboxTick}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>I am currently studying here</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={WHITE} barStyle="dark-content" />
      <MyHeader showBack showCenterTitle title="Edit Profile" onBackPress={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Profile Header */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.profileImageContainer}>
            <View style={styles.progressWrapper}>
              <CircularProgress
                size={110}
                strokeWidth={4}
                progress={completionPercentage}
                color={completionPercentage === 100 ? '#4CAF50' : BRANDCOLOR}
              />
              <View style={styles.profileImageWrapper}>
                {profilePicture ? (
                  <Image 
                    source={profilePicture.uri ? { uri: profilePicture.uri } : { uri: profilePicture }}
                    style={styles.profileImage}
                    defaultSource={PROFILE}
                    key={profilePicture.uri || profilePicture}
                    resizeMode="cover"
                  />
                ) : (
                  <Image source={PROFILE} style={styles.profileImage} resizeMode="cover" />
                )}
              </View>
            </View>
            <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
              <Image source={CAMERA} style={styles.cameraIcon} />
            </TouchableOpacity>
          </View>
          <View style={styles.profilePercentageWrapper}>
            <Text style={[styles.percentageText, { color: completionPercentage === 100 ? '#4CAF50' : BRANDCOLOR }]}>
              {completionPercentage ?? 0}%
            </Text>
          </View>
        </View>

        {/* Career Preferences Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Career Preferences</Text>
          <View style={styles.rowDivider} />
          {renderEditableRow('Preferred Location', preferredLocation, setPreferredLocation, ADDRESS)}
          <View style={styles.rowDivider} />
          {/* {renderEditableRow('Preferred Role', preferredRole, setPreferredRole)} */}
          {/* <View style={styles.rowDivider} /> */}
          <View style={styles.inputWrapper}>
            <View style={styles.inputLabelRow}>
              <Text style={styles.inputLabel}>Current Salary</Text>
            </View>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={currentSalary}
                onValueChange={setCurrentSalary}
                style={styles.picker}
                dropdownIconColor="#6B7280"
              >
                <Picker.Item label="Select Current Salary" value="" />
                <Picker.Item label="Below 5 LPA" value="Below 5 LPA" />
                <Picker.Item label="5-10 LPA" value="5-10 LPA" />
                <Picker.Item label="10-20 LPA" value="10-20 LPA" />
                <Picker.Item label="20-30 LPA" value="20-30 LPA" />
                <Picker.Item label="30+ LPA" value="30+ LPA" />
              </Picker>
            </View>
          </View>
          <View style={styles.rowDivider} />
          <View style={styles.inputWrapper}>
            <View style={styles.inputLabelRow}>
              <Text style={styles.inputLabel}>Expected Salary</Text>
            </View>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={expectedSalary}
                onValueChange={setExpectedSalary}
                style={styles.picker}
                dropdownIconColor="#6B7280"
              >
                <Picker.Item label="Select Expected Salary" value="" />
                <Picker.Item label="Below 5 LPA" value="Below 5 LPA" />
                <Picker.Item label="5-10 LPA" value="5-10 LPA" />
                <Picker.Item label="10-20 LPA" value="10-20 LPA" />
                <Picker.Item label="20-30 LPA" value="20-30 LPA" />
                <Picker.Item label="30+ LPA" value="30+ LPA" />
              </Picker>
            </View>
          </View>
          <View style={styles.rowDivider} />
          <View style={styles.inputWrapper}>
            <View style={styles.inputLabelRow}>
              <Text style={styles.inputLabel}>Notice Period</Text>
            </View>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={noticePeriod}
                onValueChange={setNoticePeriod}
                style={styles.picker}
                dropdownIconColor="#6B7280"
              >
                <Picker.Item label="Select Notice Period" value="" />
                <Picker.Item label="15 days" value="15 days" />
                <Picker.Item label="30 days" value="30 days" />
                <Picker.Item label="Immediate" value="Immediate" />
              </Picker>
            </View>
          </View>
          <View style={styles.rowDivider} />
          <TextInput
            style={styles.bioTextInput}
            value={bio}
            onChangeText={setBio}
            placeholder="Write a brief bio about yourself"
            multiline
            numberOfLines={3}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Personal Details Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Personal Details</Text>
          <View style={styles.rowDivider} />
          {renderEditableRow('Full Name', name, setName, USER, 'default', false)}
          <View style={styles.rowDivider} />
          {renderEditableRow('Email', email, setEmail, MAIL, 'email-address', false)}
          <View style={styles.rowDivider} />
          {renderEditableRow('Mobile Number', phone, setPhone, PHONE, 'phone-pad')}
          <View style={styles.rowDivider} />
          {renderEditableRow('Address', address, setAddress, ADDRESS)}
          <View style={styles.rowDivider} />
          <View style={styles.inputWrapper}>
            <View style={styles.inputLabelRow}>
              <Text style={styles.inputLabel}>Gender</Text>
            </View>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={gender}
                onValueChange={setGender}
                style={styles.picker}
                dropdownIconColor="#6B7280"
              >
                <Picker.Item label="Select Gender" value="" />
                <Picker.Item label="Male" value="male" />
                <Picker.Item label="Female" value="female" />
                <Picker.Item label="Other" value="other" />
              </Picker>
            </View>
          </View>
          <View style={styles.rowDivider} />
          <View style={styles.birthRow}>
            <View style={styles.birthLabelWrapper}>
              <Text style={styles.rowLabel}>Date of Birth</Text>
            </View>
            <DateComponent
              value={dob}
              onChange={setDob}
              format="DD/MM/YYYY"
              placeholder="Select Date"
              minDate={new Date(1956, 0, 1)}
              maxDate={new Date(2026, 11, 31)}
            />
          </View>
          <View style={styles.rowDivider} />
          {renderEditableRow('LinkedIn', linkedin, setLinkedin, MAIL)}
        </View>

        {/* Profile Summary Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Profile Summary</Text>
          <TextInput
            style={styles.summaryTextInput}
            value={slogan}
            onChangeText={setSlogan}
            placeholder="Experienced software developer with a background in web and mobile applications."
            multiline
            numberOfLines={4}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Resume Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Resume</Text>
          <View style={styles.fileBox}>
          {file ? (
            <View style={styles.selectedFile}>
              <Text style={styles.fileName}>{file.name}</Text>
              <Pressable onPress={removeFile} style={styles.removeBtn}>
                <Text style={styles.removeText}>Remove</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.resumeWrapper}>
              <Pressable style={styles.uploadArea} onPress={pickFile}>
                <Image source={UPLOAD} style={styles.uploadIcon} />
                <Text style={styles.fileText}>Upload Resume</Text>
              </Pressable>
              {resumeUrl ? (
                <View style={styles.selectedFile}>
                  <Text style={styles.fileName}>{resumeName || resumeUrl.split('/').pop()}</Text>
                  <Pressable
                    onPress={() => {
                      const url = getResumeDownloadUrl(resumeUrl);
                      if (url) Linking.openURL(url);
                    }}
                    style={styles.removeBtn}
                  >
                    <Text style={styles.removeText}>View</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          )}
        </View>
        </View>

        {/* Employment History Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderWithAction}>
            <Text style={styles.sectionHeader}>Employment History</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => setExperienceItems((prev) => [...prev, { companyName: "", industryType: "", startDate: "", endDate: "", stillWorking: false }])}>
              <Text style={styles.addButtonText}>Add Experience</Text>
            </TouchableOpacity>
          </View>
          {experienceItems.map(renderExperienceEntry)}
        </View>

        {/* Projects Section - COMMENTED OUT */}
        {/* <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderWithAction}>
            <Text style={styles.sectionHeader}>Projects</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => setProjectItems((prev) => [...prev, { projectName: "", companyName: "", startDate: "", endDate: "", stillInProgress: false }])}>
              <Text style={styles.addButtonText}>Add Project</Text>
            </TouchableOpacity>
          </View>
          {projectItems.map(renderProjectEntry)}
        </View> */}

        {/* Certifications Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderWithAction}>
            <Text style={styles.sectionHeader}>Certifications</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => setCertificationItems((prev) => [...prev, { name: "", organization: "", certificationId: "", certificationUrl: "", validFrom: "", validTo: "", noEndDate: false }])}>
              <Text style={styles.addButtonText}>Add Certification</Text>
            </TouchableOpacity>
          </View>
          {certificationItems.map(renderCertificationEntry)}
        </View>

        {/* Education Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderWithAction}>
            <Text style={styles.sectionHeader}>Education</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => setEducationItems((prev) => [...prev, { degree: "", institution: "", startDate: "", endDate: "", currentlyStudying: false }])}>
              <Text style={styles.addButtonText}>Add Education</Text>
            </TouchableOpacity>
          </View>
          {educationItems.map(renderEducationEntry)}
        </View>

        {/* Skills Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Skills</Text>
          <View style={styles.chipRow}>
            {keySkills.map((skill) => (
              <TouchableOpacity key={skill} style={styles.selectedChip} onPress={() => toggleSkill(skill, setKeySkills, keySkills)}>
                <Text style={styles.selectedChipText}>{formatSkillName(skill)}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.chipListRow}>
            {KEY_SKILL_OPTIONS.map((skill) => {
              const selected = keySkills.includes(skill);
              return (
                <TouchableOpacity
                  key={skill}
                  style={[styles.skillChip, selected && styles.skillChipSelected]}
                  onPress={() => toggleSkill(skill, setKeySkills, keySkills)}
                >
                  <Text style={[styles.skillChipText, selected && styles.skillChipTextSelected]}>{formatSkillName(skill)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.addSkillRow}>
            <TextInputComponent
              placeholder="Add custom skill"
              inputdata={newKeySkill}
              setInputdata={setNewKeySkill}
              width="70%"
              borderColor={BRANDCOLOR}
            />
            <TouchableOpacity style={styles.addSkillButton} onPress={() => addSkill(newKeySkill, setKeySkills, setNewKeySkill, keySkills)}>
              <Text style={styles.addSkillButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Technical Skills Section - COMMENTED OUT (Merged with Key Skills) */}
        {/* <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Technical Skills</Text>
          <View style={styles.chipRow}>
            {technicalSkills.map((skill) => (
              <TouchableOpacity key={skill} style={styles.selectedChip} onPress={() => toggleSkill(skill, setTechnicalSkills, technicalSkills)}>
                <Text style={styles.selectedChipText}>{skill}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.chipListRow}>
            {TECHNICAL_SKILL_OPTIONS.map((skill) => {
              const selected = technicalSkills.includes(skill);
              return (
                <TouchableOpacity
                  key={skill}
                  style={[styles.skillChip, selected && styles.skillChipSelected]}
                  onPress={() => toggleSkill(skill, setTechnicalSkills, technicalSkills)}
                >
                  <Text style={[styles.skillChipText, selected && styles.skillChipTextSelected]}>{skill}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.addSkillRow}>
            <TextInputComponent
              placeholder="Add custom technical skill"
              inputdata={newTechnicalSkill}
              setInputdata={setNewTechnicalSkill}
              width="70%"
              borderColor={BRANDCOLOR}
            />
            <TouchableOpacity style={styles.addSkillButton} onPress={() => addSkill(newTechnicalSkill, setTechnicalSkills, setNewTechnicalSkill, technicalSkills)}>
              <Text style={styles.addSkillButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View> */}

        {/* Languages Known Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Languages Known</Text>
          <View style={styles.languageRow}>
            {PERMITTED_LANGUAGES.map((lng) => {
              const selected = languages.includes(lng);
              return (
                <TouchableOpacity
                  key={lng}
                  onPress={() => toggleLanguage(lng)}
                  style={[styles.languageChip, selected && styles.languageChipSelected]}
                >
                  <Text style={[styles.languageChipText, selected && styles.languageChipTextSelected]}>
                    {lng}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Centered Save Button */}
        <View style={styles.saveButtonContainer}>
          <CustomButton text="Save Changes" color={WHITE} onPress={handleUpdate} />
        </View>

      </ScrollView>
      <ToastMessage
        message={toastMessage.msg}
        visible={toastMessage.visible}
        setVisible={({ visible }) => setToastMessage((prev) => ({ ...prev, visible }))}
        bacgroundColor={toastMessage.type === 'success' ? 'green' : 'red'}
        textColor={WHITE}
        type={toastMessage.type}
        duration={3000}
        image={PROFILE}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA'
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: '#F7F8FA'
  },

  // Profile Header - Image LEFT, Name/Email RIGHT
  profileHeaderCard: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E4E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1
  },
  profileImageContainer: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  progressWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
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
  circularProgressContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularProgressRing: {
    position: 'absolute',
  },
  profileLeftSection: {
    alignItems: 'center',
    marginRight: 16
  },
  profileRightSection: {
    flex: 1,
    justifyContent: 'center'
  },
  avatarWrapper: {
    position: 'relative',
    alignSelf: 'center'
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: '#E1E5EA'
  },
  cameraButton: {
    position: 'absolute',
    right: -5,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BRANDCOLOR,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 2,
  },
  cameraIcon: {
    width: 16,
    height: 16,
    tintColor: WHITE
  },
  profilePercentageWrapper: {
    marginTop: 14,
  },
  percentageText: {
    fontSize: 16,
    fontFamily: UBUNTUBOLD,
    color: BRANDCOLOR
  },
  profileName: {
    fontSize: 18,
    fontFamily: UBUNTUBOLD,
    color: BLACK,
    marginBottom: 4
  },
  profileEmail: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: UBUNTU
  },

  // Section Cards
  sectionCard: {
    backgroundColor: WHITE,
    borderRadius: 12,
    marginBottom: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E4E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1
  },
  sectionHeader: {
    fontSize: 15,
    fontFamily: UBUNTUBOLD,
    color: '#1F2937'
  },
  sectionHeaderWithAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },

  // Editable Row
  editableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 0
  },
  rowIcon: {
    width: 18,
    height: 18,
    marginRight: 10,
    tintColor: '#6B7280'
  },
  rowContentWrapper: {
    flex: 1,
    marginHorizontal: 0
  },
  rowLabel: {
    fontSize: 12,
    fontFamily: FIRASANSSEMIBOLD,
    color: '#374151',
    marginBottom: 4
  },
  rowInput: {
    fontSize: 13,
    color: BLACK,
    fontFamily: UBUNTU,
    paddingVertical: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E8F0',
    paddingBottom: 4
  },
  readOnlyInput: {
    color: '#374151',
    opacity: 0.85,
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#E4E8F0',
    marginVertical: 0
  },
  arrowIcon: {
    fontSize: 20,
    color: '#9CA3AF',
    marginLeft: 8
  },
  birthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10
  },
  birthLabelWrapper: {
    flex: 0.45
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8
  },
  dateCol: {
    flex: 1
  },
  dateLabel: {
    fontSize: 12,
    fontFamily: FIRASANSSEMIBOLD,
    color: '#374151',
    marginBottom: 6
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#E4E8F0',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: WHITE
  },
  checkboxBoxChecked: {
    backgroundColor: BRANDCOLOR,
    borderColor: BRANDCOLOR
  },
  checkboxTick: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '700'
  },
  checkboxLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: FIRASANSSEMIBOLD
  },
  subCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E4E8F0'
  },
  entryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  subTitle: {
    fontSize: 14,
    fontFamily: UBUNTUBOLD,
    color: '#111827'
  },
  removeText: {
    fontSize: 12,
    fontFamily: FIRASANSSEMIBOLD,
    color: BRANDCOLOR
  },

  // Detail Row
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E8F0'
  },
  detailIcon: {
    width: 18,
    height: 18,
    marginRight: 10,
    tintColor: '#6B7280'
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: FIRASANSSEMIBOLD,
    color: '#374151',
    flex: 0.5
  },
  detailValue: {
    fontSize: 13,
    fontFamily: FIRASANSBOLD,
    color: '#1F2937',
    flex: 1,
    textAlign: 'right'
  },

  // Bio Input
  bioTextInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    padding: 12,
    minHeight: 70,
    textAlignVertical: 'top',
    backgroundColor: '#FCFCFD',
    fontSize: 13,
    color: BLACK,
    fontFamily: UBUNTU,
    marginTop: 8
  },
  // Summary Input
  summaryTextInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    backgroundColor: '#FCFCFD',
    fontSize: 13,
    color: BLACK,
    fontFamily: UBUNTU
  },

  // Skills Input
  skillsInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    padding: 12,
    minHeight: 60,
    textAlignVertical: 'top',
    backgroundColor: '#FCFCFD',
    fontSize: 13,
    color: BLACK,
    fontFamily: UBUNTU
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#E4E8F0',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: WHITE,
    marginTop: 8
  },
  picker: {
    width: '100%',
    color: '#111827'
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10
  },
  chipListRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12
  },
  skillChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F3F4F6'
  },
  skillChipSelected: {
    backgroundColor: BRANDCOLOR,
    borderColor: BRANDCOLOR
  },
  skillChipText: {
    color: '#374151',
    fontSize: 12,
    fontFamily: FIRASANSSEMIBOLD
  },
  skillChipTextSelected: {
    color: WHITE
  },
  selectedChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E5F4FF',
    borderWidth: 1,
    borderColor: BRANDCOLOR,
    marginTop: 8
  },
  selectedChipText: {
    color: BRANDCOLOR,
    fontSize: 12,
    fontFamily: FIRASANSSEMIBOLD
  },
  addSkillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14
  },
  addSkillButton: {
    backgroundColor: BRANDCOLOR,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12
  },
  addSkillButtonText: {
    color: WHITE,
    fontSize: 13,
    fontFamily: FIRASANSSEMIBOLD
  },

  // Add Button
  addButton: {
    backgroundColor: 'transparent'
  },
  addButtonText: {
    color: BRANDCOLOR,
    fontSize: 13,
    fontFamily: FIRASANSSEMIBOLD
  },

  // Employment History
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E8F0'
  },
  companyIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E4E8F0'
  },
  companyIconImage: {
    width: 24,
    height: 24,
    resizeMode: 'contain'
  },
  historyContent: {
    flex: 1
  },
  companyName: {
    fontSize: 13,
    fontFamily: UBUNTUBOLD,
    color: '#1F2937',
    marginBottom: 2
  },
  jobRole: {
    fontSize: 11,
    fontFamily: FIRASANSSEMIBOLD,
    color: '#6B7280',
    marginBottom: 2
  },
  dateRange: {
    fontSize: 10,
    color: '#9CA3AF'
  },

  // Certifications
  certItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E8F0'
  },
  certIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E4E8F0'
  },
  certIconImage: {
    width: 24,
    height: 24,
    resizeMode: 'contain'
  },
  certContent: {
    flex: 1
  },
  certTitle: {
    fontSize: 13,
    fontFamily: UBUNTUBOLD,
    color: '#1F2937',
    marginBottom: 2
  },
  certIssuer: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: FIRASANSSEMIBOLD
  },

  // Education
  eduItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E8F0'
  },
  eduIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E4E8F0'
  },
  eduIconImage: {
    width: 24,
    height: 24,
    resizeMode: 'contain'
  },
  eduContent: {
    flex: 1
  },
  degree: {
    fontSize: 13,
    fontFamily: UBUNTUBOLD,
    color: '#1F2937',
    marginBottom: 2
  },
  university: {
    fontSize: 11,
    fontFamily: FIRASANSSEMIBOLD,
    color: '#6B7280',
    marginBottom: 2
  },
  duration: {
    fontSize: 10,
    color: '#9CA3AF'
  },

  // Languages
  languageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8
  },
  languageChip: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB'
  },
  languageChipSelected: {
    backgroundColor: BRANDCOLOR,
    borderColor: BRANDCOLOR
  },
  languageChipText: {
    color: '#374151',
    fontSize: 12,
    fontFamily: FIRASANSSEMIBOLD
  },
  languageChipTextSelected: {
    color: WHITE
  },

  // File Upload
  fileBox: {
    width: "100%",
    borderWidth: 1,
    borderColor: BRANDCOLOR,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 8,
    backgroundColor: WHITE,
    paddingVertical: 10,
  },
  resumeWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadArea: {
    flexDirection: 'row',
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    paddingVertical: 8,
  },
  uploadIcon: {
    width: 22,
    height: 22,
    marginRight: 8,
    resizeMode: "contain",
  },
  fileText: {
    color: BLACK,
    fontSize: 13,
    fontFamily: UBUNTU,
  },
  selectedFile: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 14,
  },
  fileName: {
    color: BLACK,
    fontSize: 14,
    fontFamily: FIRASANSSEMIBOLD,
    flex: 1,
  },
  removeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  removeText: {
    color: BRANDCOLOR,
    fontSize: 13,
    fontFamily: FIRASANSSEMIBOLD,
  },

  // Save Button
  saveButtonContainer: {
    marginTop: 20,
    marginBottom: 40,
    width: '100%',
    alignItems: 'center'
  }
});

export default EditUserProfileScreen;