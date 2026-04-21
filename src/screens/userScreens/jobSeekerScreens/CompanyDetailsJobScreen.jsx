import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  BackHandler,
  Platform,
  FlatList,
  Modal,
  Alert,
  TextInput,
  PermissionsAndroid,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { pick, isCancel } from '@react-native-documents/picker';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { BLACK, BRANDCOLOR, WHITE } from "../../../constant/color";
import { UBUNTUBOLD, UBUNTU, FIRASANSSEMIBOLD, FIRASANS } from "../../../constant/fontPath";
import {
  LOGO,
  BACK,
  USER,
  MAIL,
  PHONE,
  COVERLETTER,
  UPLOAD,
} from "../../../constant/imagePath";
import { HEIGHT, WIDTH } from "../../../constant/config";
import { MyHeader } from "../../../components/commonComponents/MyHeader";
import { TextInputComponent } from "../../../components/commonComponents/TextInputComponent";
import { CustomButton } from "../../../components/commonComponents/Button";
import { ToastMessage } from "../../../components/commonComponents/ToastMessage";
import { BASE_URL } from "../../../constant/url";
import { GETNETWORK, POSTNETWORK, DELETENETWORK } from "../../../utils/Network";
import { getObjByKey } from "../../../utils/Storage";
import { MyAlert } from "../../../components/commonComponents/MyAlert";

// Format jobType: full_time -> Full Time
const formatJobType = (jobType) => {
  if (!jobType) return '';
  return jobType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Format location: combine state and city
const formatLocation = (state, city) => {
  const formatState = (state) => {
    if (!state) return '';
    return state
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const formatCity = (city) => {
    if (!city) return '';
    return city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
  };

  const formattedState = formatState(state);
  const formattedCity = formatCity(city);
  
  if (formattedState && formattedCity) {
    return `${formattedCity}, ${formattedState}`;
  } else if (formattedState) {
    return formattedState;
  } else if (formattedCity) {
    return formattedCity;
  }
  return '';
};

// Format salary (no INR prefix, icon shows currency)
const formatSalary = (salaryRange) => {
  if (!salaryRange) return 'Salary not specified';
  return salaryRange.trim().replace(/^INR\s*/i, '');
};

// Job Card Component (Square Grid Style)
const JobCard = ({ item, onApply, onSave, onPress, isWishlisted, isApplied }) => {
  const logoUrl = item.companyLogoUrl || item.logo
    ? ((item.companyLogoUrl || item.logo).startsWith('http://') || (item.companyLogoUrl || item.logo).startsWith('https://') 
        ? (item.companyLogoUrl || item.logo) 
        : `${BASE_URL.replace('/api/', '/')}${(item.companyLogoUrl || item.logo).replace(/^\//, '')}`)
    : null;

  return (
    <View style={styles.jobCard}>
      <TouchableOpacity 
        style={styles.cardContent} 
        onPress={() => onPress(item)} 
        activeOpacity={0.7}
      >
        <TouchableOpacity 
          style={styles.wishlistButton} 
          onPress={(e) => { e.stopPropagation(); onSave(item); }}
        >
          <MaterialCommunityIcons 
            name={isWishlisted ? "heart" : "heart-outline"} 
            size={WIDTH * 0.05} 
            color={isWishlisted ? "#FF6B6B" : BRANDCOLOR} 
          />
        </TouchableOpacity>
        {logoUrl ? (
          <Image source={{ uri: logoUrl }} style={styles.cardLogo} defaultSource={LOGO} />
        ) : (
          <Image source={LOGO} style={styles.cardLogo} />
        )}
        <Text style={styles.cardCompany} numberOfLines={1}>
          {item.companyName || item.company || 'N/A'}
        </Text>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.jobTitle || item.title || 'N/A'}
        </Text>
        {item.jobType && (
          <View style={styles.cardInfoRow}>
            <MaterialCommunityIcons name="briefcase-outline" size={WIDTH * 0.03} color={BRANDCOLOR} />
            <Text style={styles.cardJobType} numberOfLines={1}>
              {formatJobType(item.jobType)}
            </Text>
          </View>
        )}
        {(item.state || item.city) && (
          <View style={styles.cardInfoRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={WIDTH * 0.03} color={BRANDCOLOR} />
            <Text style={styles.cardLocation} numberOfLines={1}>
              {formatLocation(item.state, item.city)}
            </Text>
          </View>
        )}
        <View style={styles.cardInfoRow}>
          <MaterialCommunityIcons name="currency-inr" size={WIDTH * 0.03} color={BRANDCOLOR} />
          <Text style={styles.cardSalary} numberOfLines={1}>
            {formatSalary(item.salaryRange || item.salary)}
          </Text>
        </View>
        {isApplied ? (
          <View style={styles.appliedContainer}>
            <MaterialCommunityIcons name="check-circle" size={WIDTH * 0.04} color="#26AE61" />
            <Text style={styles.appliedText}>Applied</Text>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.applyButton} 
            onPress={(e) => { e.stopPropagation(); onApply(item); }}
          >
            <Text style={styles.applyText}>Apply</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </View>
  );
};

const CompanyDetailsJobScreen = ({ navigation, route }) => {
  const { keyword, companyName, cityName } = route?.params || {};
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [wishlistedJobs, setWishlistedJobs] = useState(new Set());
  const [appliedJobs, setAppliedJobs] = useState(new Set());
  const [loginPromptVisible, setLoginPromptVisible] = useState(false);
  const [applyFormVisible, setApplyFormVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  
  // Apply form states
  const [applyName, setApplyName] = useState("");
  const [applyEmail, setApplyEmail] = useState("");
  const [applyPhone, setApplyPhone] = useState("");
  const [applyFile, setApplyFile] = useState(null);
  const [applyCoverLetter, setApplyCoverLetter] = useState("");
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyToastMessage, setApplyToastMessage] = useState({
    type: "",
    msg: "",
    visible: false,
  });

  // Fetch jobs filtered by jobTitle keyword or companyName
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const url = `${BASE_URL}jobs`;
      const result = await GETNETWORK(url, false);
      
      if (result && !result.message) {
        const allJobs = result?.data || result?.jobs || result?.list || result || [];
        const jobsArray = Array.isArray(allJobs) ? allJobs : [];
        
        // Filter jobs by cityName if provided
        if (cityName) {
          const cityNameLower = cityName.toLowerCase().trim();
          const bhubaneswarAliases = [
            'bhubaneswar',
            'bhubaneswara',
            'bhubaneshwar',
            'khordha',
            'khurda',
            'khorda',
            'khurdha',
          ];

          const filteredJobs = jobsArray.filter((job) => {
            const jobCity = (job.city || '').toLowerCase().trim();
            const jobLocation = (job.location || '').toLowerCase().trim();
            const jobAddress = (job.address || '').toLowerCase().trim();
            const jobState = (job.state || '').toLowerCase().trim();
            const jobArea = (job.area || '').toLowerCase().trim();
            const jobTown = (job.town || '').toLowerCase().trim();

            const jobSearchText = [
              jobCity,
              jobLocation,
              jobAddress,
              jobState,
              jobArea,
              jobTown,
            ]
              .filter(Boolean)
              .join(' ');

            if (!jobSearchText) return false;

            if (cityNameLower === 'bhubaneswar') {
              return bhubaneswarAliases.some((alias) => jobSearchText.includes(alias));
            }

            return jobSearchText.includes(cityNameLower) || cityNameLower.includes(jobSearchText);
          });
          setJobs(filteredJobs);
        }
        // Filter jobs by companyName if provided
        else if (companyName) {
          const companyNameLower = companyName.toLowerCase().trim();
          const filteredJobs = jobsArray.filter((job) => {
            const jobCompanyName = (job.companyName || job.company || '').toLowerCase().trim();
            // Only show jobs where companyName matches
            if (!jobCompanyName) return false;
            return jobCompanyName.includes(companyNameLower) || companyNameLower.includes(jobCompanyName);
          });
          setJobs(filteredJobs);
        }
        // Filter jobs by jobTitle keyword if provided
        else if (keyword) {
          const keywordLower = keyword.toLowerCase().trim();
          const filteredJobs = jobsArray.filter((job) => {
            const jobTitle = (job.jobTitle || job.title || '').toLowerCase().trim();
            // Only show jobs where jobTitle contains the keyword as a whole word
            // If keyword is "HR", it will match "HR", "HR Manager", "Senior HR", "HR Executive", etc.
            // But will NOT show "HRM Manager" because "HRM" is a different word
            if (!jobTitle || !keywordLower) return false;
            
            // Use word boundary matching to ensure exact keyword match
            // Split jobTitle into words and check if keyword matches any word exactly
            const words = jobTitle.split(/\s+/); // Split by whitespace
            const keywordMatches = words.some(word => {
              // Remove any punctuation from the word for comparison
              const cleanWord = word.replace(/[^\w]/g, '');
              // Check if the clean word exactly matches the keyword
              return cleanWord === keywordLower;
            });
            
            // Also check if jobTitle starts with the keyword (for cases like "HR Manager")
            const startsWithKeyword = jobTitle.startsWith(keywordLower + ' ') || jobTitle.startsWith(keywordLower + '-');
            
            // Return true if keyword matches as a whole word or at the start
            return keywordMatches || startsWithKeyword || jobTitle === keywordLower;
          });
          setJobs(filteredJobs);
        } else {
          // If no keyword or companyName, show all jobs
          setJobs(jobsArray);
        }
      } else {
        setJobs([]);
      }
    } catch (error) {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [keyword, companyName, cityName]);

  // Fetch wishlist status
  const fetchWishlistStatus = useCallback(async () => {
    try {
      const token = await getObjByKey("loginResponse");
      if (!token) {
        return;
      }
      
      const url = `${BASE_URL}wishlist`;
      const result = await GETNETWORK(url, true);
      
      if (result && !result.message) {
        const wishlistData = result?.wishlist || result?.data || result || [];
        const wishlistedIds = new Set();
        
        if (Array.isArray(wishlistData)) {
          wishlistData.forEach((item) => {
            const id = (item.id || item.job_id || item.jobId)?.toString();
            if (id) {
              wishlistedIds.add(id);
            }
          });
        }
        
        setWishlistedJobs(wishlistedIds);
      }
    } catch (error) {
      // Silently fail
    }
  }, []);

  // Fetch applied jobs status
  const fetchAppliedJobs = useCallback(async () => {
    try {
      const token = await getObjByKey("loginResponse");
      if (!token) {
        return;
      }
      
      const url = `${BASE_URL}applications/mine`;
      const result = await GETNETWORK(url, true);
      
      if (result && !result.message) {
        const applications = result?.data || result?.applications || result?.list || result || [];
        const appliedIds = new Set();
        
        if (Array.isArray(applications)) {
          applications.forEach((application) => {
            const jobId = (application.jobId || application.job_id || application.job?.id || application.job?._id)?.toString();
            if (jobId) {
              appliedIds.add(jobId);
            }
          });
        }
        
        setAppliedJobs(appliedIds);
      }
    } catch (error) {
      // Silently fail
    }
  }, []);

  // BackHandler
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      navigation.goBack();
      return true;
    });
    return () => backHandler.remove();
  }, [navigation]);

  // Fetch data when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchJobs();
      fetchWishlistStatus();
      fetchAppliedJobs();
    }, [fetchJobs, fetchWishlistStatus, fetchAppliedJobs])
  );

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchJobs(),
      fetchWishlistStatus(),
      fetchAppliedJobs(),
    ]);
    setRefreshing(false);
  }, [fetchJobs, fetchWishlistStatus, fetchAppliedJobs]);

  // Navigate to job details
  const handleJobPress = (item) => {
    const jobId = item.id || item._id;
    const jobData = item;
    navigation.navigate('SeekerJobDetails', {
      jobId: jobId,
      jobData: jobData,
    });
  };

  // Handle Apply
  const handleApply = async (item) => {
    const token = await getObjByKey("loginResponse");
    if (!token) {
      setLoginPromptVisible(true);
      return;
    }
    
    setSelectedJob(item);
    
    // Fetch user data and pre-fill form
    try {
      const loginResponse = await getObjByKey("loginResponse");
      
      if (!loginResponse) {
        setApplyName("");
        setApplyEmail("");
        setApplyPhone("");
        setApplyFile(null);
        setApplyCoverLetter("");
        setApplyFormVisible(true);
        return;
      }
      
      let firstName = "";
      let lastName = "";
      let phone = "";
      let email = "";
      
      try {
        const profileUrl = `${BASE_URL}profile`;
        const profileResult = await GETNETWORK(profileUrl, true);
        const profileData = profileResult?.profile || profileResult?.data || profileResult?.user || profileResult || {};
        
        firstName = profileData.firstName || profileData.first_name || "";
        lastName = profileData.lastName || profileData.last_name || "";
        phone = profileData.phone || profileData.phoneNumber || profileData.phone_number || profileData.mobile || profileData.mobileNumber || "";
        email = profileData.email || profileData.emailAddress || "";
        
        if (!firstName && !lastName) {
          const fullName = profileData.fullName || profileData.full_name || profileData.name || "";
          if (fullName) {
            const nameParts = fullName.trim().split(" ");
            if (nameParts.length >= 2) {
              firstName = nameParts[0];
              lastName = nameParts.slice(1).join(" ");
            } else if (nameParts.length === 1) {
              firstName = nameParts[0];
              lastName = "";
            }
          }
        }
        
        if (!firstName && !lastName && !phone && !email) {
          const userData = loginResponse?.user || loginResponse?.data || loginResponse || {};
          firstName = firstName || userData.firstName || userData.first_name || "";
          lastName = lastName || userData.lastName || userData.last_name || "";
          phone = phone || userData.phone || userData.phoneNumber || userData.phone_number || "";
          email = email || userData.email || "";
          
          if (!firstName && !lastName) {
            const fullName = userData.fullName || userData.full_name || userData.name || "";
            if (fullName) {
              const nameParts = fullName.trim().split(" ");
              if (nameParts.length >= 2) {
                firstName = nameParts[0];
                lastName = nameParts.slice(1).join(" ");
              } else if (nameParts.length === 1) {
                firstName = nameParts[0];
                lastName = "";
              }
            }
          }
        }
      } catch (profileError) {
        const userData = loginResponse?.user || loginResponse?.data || loginResponse || {};
        firstName = userData.firstName || userData.first_name || "";
        lastName = userData.lastName || userData.last_name || "";
        phone = userData.phone || userData.phoneNumber || userData.phone_number || "";
        email = userData.email || "";
        
        if (!firstName && !lastName) {
          const fullName = userData.fullName || userData.full_name || userData.name || "";
          if (fullName) {
            const nameParts = fullName.trim().split(" ");
            if (nameParts.length >= 2) {
              firstName = nameParts[0];
              lastName = nameParts.slice(1).join(" ");
            } else if (nameParts.length === 1) {
              firstName = nameParts[0];
              lastName = "";
            }
          }
        }
      }
      
      const capitalizeWords = (str) => {
        if (!str) return "";
        return str
          .split(" ")
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(" ");
      };
      
      const firstNameCapitalized = capitalizeWords(firstName);
      const lastNameCapitalized = capitalizeWords(lastName);
      const fullName = `${firstNameCapitalized} ${lastNameCapitalized}`.trim();
      
      setApplyName(fullName);
      setApplyEmail(email);
      setApplyPhone(phone);
      setApplyFile(null);
      setApplyCoverLetter("");
    } catch (error) {
      setApplyName("");
      setApplyEmail("");
      setApplyPhone("");
      setApplyFile(null);
      setApplyCoverLetter("");
    }
    
    setApplyFormVisible(true);
  };

  // Handle Save (Wishlist)
  const handleSave = async (item) => {
    const token = await getObjByKey("loginResponse");
    if (!token) {
      setLoginPromptVisible(true);
      return;
    }

    const jobId = item.id || item._id;
    if (!jobId) {
      return;
    }

    const isWishlisted = wishlistedJobs.has(jobId.toString());
    
    try {
      if (isWishlisted) {
        const url = `${BASE_URL}wishlist/${jobId}`;
        const result = await DELETENETWORK(url, true);
        
        const isSuccess = result && (
          !result.message || 
          (result.message && (result.message.toLowerCase().includes('success') || result.message.toLowerCase().includes('deleted'))) ||
          result.success === true ||
          result.statusCode === 200 ||
          result.statusCode === 201
        );
        
        if (isSuccess) {
          setWishlistedJobs(prev => {
            const newSet = new Set(prev);
            newSet.delete(jobId.toString());
            return newSet;
          });
        }
      } else {
        const url = `${BASE_URL}wishlist/${jobId}`;
        const result = await POSTNETWORK(url, {}, true);
        
        const isSuccess = result && (
          !result.message || 
          (result.message && result.message.toLowerCase().includes('success')) ||
          result.success === true ||
          result.statusCode === 200 ||
          result.statusCode === 201
        );
        
        if (isSuccess) {
          setWishlistedJobs(prev => new Set(prev).add(jobId.toString()));
        }
      }
    } catch (error) {
      // Silently fail
    }
  };

  // Request storage permission
  const requestStoragePermission = async () => {
    if (Platform.OS === "android") {
      // Use image/document picker directly instead of requesting READ_MEDIA_IMAGES.
      return true;
    }
    return true;
  };

  // Handle file picker
  const handlePickFile = async () => {
    try {
      if (Platform.OS === "android") {
        const hasPermission = await requestStoragePermission();
        if (!hasPermission) {
          Alert.alert(
            "Permission Denied",
            "Please grant storage permission to select documents.",
            [{ text: "OK" }]
          );
          return;
        }
      }

      try {
        const [result] = await pick({
          type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        });

        if (result) {
          setApplyFile({
            name: result.name || result.uri.split('/').pop() || 'document.pdf',
            uri: result.uri,
            type: result.type || 'application/pdf',
            size: result.size || 0,
          });
        }
      } catch (pickerErr) {
        if (isCancel(pickerErr)) {
          // User cancelled
        } else {
          Alert.alert(
            "Select Document",
            "Please navigate to your device's file manager and select a PDF, DOC, or DOCX file.",
            [{ text: "OK" }]
          );
        }
      }
    } catch (err) {
      Alert.alert(
        "File Selection",
        "Unable to open file picker. Please ensure you have granted storage permissions.",
        [{ text: "OK" }]
      );
    }
  };

  // Validate form
  const validateApplyForm = () => {
    if (!applyName.trim()) {
      Alert.alert("Validation Error", "Please enter your full name");
      return false;
    }
    if (!applyEmail.trim()) {
      Alert.alert("Validation Error", "Please enter your email address");
      return false;
    }
    if (!applyPhone.trim()) {
      Alert.alert("Validation Error", "Please enter your phone number");
      return false;
    }
    if (!applyFile) {
      Alert.alert("Validation Error", "Please upload your resume");
      return false;
    }
    return true;
  };

  // Submit application
  const handleSubmitApplication = async () => {
    if (!validateApplyForm()) {
      return;
    }

    if (!selectedJob) {
      Alert.alert("Error", "Job information is missing");
      return;
    }

    const jobId = selectedJob.id || selectedJob._id;
    if (!jobId) {
      Alert.alert("Error", "Job ID is missing");
      return;
    }

    try {
      setApplyLoading(true);

      const loginResponse = await getObjByKey('loginResponse');
      
      if (!loginResponse) {
        setApplyToastMessage({
          type: "error",
          msg: "Please login to apply for jobs",
          visible: true,
        });
        setApplyLoading(false);
        return;
      }

      let token = null;
      if (loginResponse.data) {
        if (typeof loginResponse.data === 'string') {
          token = loginResponse.data;
        } else if (typeof loginResponse.data === 'object' && loginResponse.data !== null) {
          token = loginResponse.data.token || loginResponse.data.data;
        }
      }
      if (!token || (typeof token === 'string' && token.trim() === '')) {
        if (loginResponse.token && typeof loginResponse.token === 'string') {
          token = loginResponse.token;
        }
      }

      if (!token || typeof token !== 'string' || token.trim() === '') {
        setApplyToastMessage({
          type: "error",
          msg: "Authentication token not found. Please login again.",
          visible: true,
        });
        setApplyLoading(false);
        return;
      }

      const formDataArray = [];
      
      formDataArray.push({ name: 'name', data: applyName.trim() });
      formDataArray.push({ name: 'email', data: applyEmail.trim() });
      formDataArray.push({ name: 'phone', data: applyPhone.trim() });
      formDataArray.push({ name: 'pastedCv', data: applyCoverLetter.trim() || '' });
      
      if (applyFile && applyFile.uri) {
        let fileUri = applyFile.uri;
        
        if (fileUri.startsWith('file://')) {
          fileUri = fileUri.replace('file://', '');
        }
        
        const fileData = {
          name: 'resume',
          filename: applyFile.name || `resume_${Date.now()}.pdf`,
          type: applyFile.type || 'application/pdf',
          data: fileUri.startsWith('content://') 
            ? fileUri 
            : ReactNativeBlobUtil.wrap(fileUri),
        };
        
        formDataArray.push(fileData);
      }
      
      const url = `${BASE_URL}jobs/${jobId}/apply`;
      const result = await ReactNativeBlobUtil.fetch(
        'POST',
        url,
        {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        formDataArray
      );
      
      let parsedResult;
      try {
        const responseText = result.text();
        parsedResult = JSON.parse(responseText);
      } catch (parseError) {
        parsedResult = {
          message: result.text() || 'Unknown error',
          statusCode: result.info().status,
        };
      }

      const responseStatus = result.info().status;
      const isSuccess = 
        responseStatus === 200 || 
        responseStatus === 201 ||
        parsedResult?.success === true || 
        parsedResult?.statusCode === 200 || 
        parsedResult?.statusCode === 201 ||
        parsedResult?.status === "success" ||
        parsedResult?.status === "Success" ||
        parsedResult?.id ||
        parsedResult?.application_id ||
        parsedResult?.message?.toLowerCase().includes('success') ||
        (!parsedResult?.error && !parsedResult?.errors);

      if (isSuccess) {
        const successMessage = parsedResult?.message || "Your application has been submitted successfully!";
        
        setApplyToastMessage({
          type: "success",
          msg: successMessage,
          visible: true,
        });
        
        setApplyName("");
        setApplyEmail("");
        setApplyPhone("");
        setApplyFile(null);
        setApplyCoverLetter("");
        setApplyLoading(false);
        
        fetchAppliedJobs();
        
        setTimeout(() => {
          handleCloseApplyForm();
        }, 2000);
      } else {
        const errorMessage = parsedResult?.errors?.[0]?.msg || parsedResult?.message || parsedResult?.error || "Failed to submit application. Please try again.";
        
        setApplyToastMessage({
          type: "error",
          msg: errorMessage,
          visible: true,
        });
        setApplyLoading(false);
      }
    } catch (error) {
      setApplyToastMessage({
        type: "error",
        msg: "An error occurred while submitting your application. Please try again.",
        visible: true,
      });
      setApplyLoading(false);
    }
  };

  const handleCloseApplyForm = () => {
    setApplyFormVisible(false);
    setSelectedJob(null);
    setApplyName("");
    setApplyEmail("");
    setApplyPhone("");
    setApplyFile(null);
    setApplyCoverLetter("");
    setApplyLoading(false);
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={WHITE} translucent={false} />
      <View style={styles.container}>
        <MyHeader
          showBack
          showCenterTitle
          title={cityName || companyName || keyword || "Jobs"}
          onBackPress={() => navigation.goBack()}
        />

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={BRANDCOLOR} />
            <Text style={styles.loadingText}>Loading jobs...</Text>
          </View>
        ) : (
          <FlatList
            data={jobs}
            keyExtractor={(item, index) => item.id?.toString() || item._id?.toString() || index.toString()}
            numColumns={2}
            columnWrapperStyle={styles.row}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[BRANDCOLOR]}
                tintColor={BRANDCOLOR}
              />
            }
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No jobs found for "{keyword}"</Text>
              </View>
            }
            renderItem={({ item }) => {
              const jobId = (item.id || item._id)?.toString();
              const isWishlisted = wishlistedJobs.has(jobId);
              const isApplied = appliedJobs.has(jobId);
              return (
                <JobCard 
                  item={item} 
                  onApply={handleApply} 
                  onSave={handleSave} 
                  onPress={handleJobPress}
                  isWishlisted={isWishlisted}
                  isApplied={isApplied}
                />
              );
            }}
          />
        )}
      </View>

      <MyAlert
        visible={loginPromptVisible}
        title="Login required"
        message="Please login or register to continue."
        textLeft="Login"
        textRight="Register"
        onPressLeft={() => {
          setLoginPromptVisible(false);
          navigation.navigate("Login");
        }}
        onPressRight={() => {
          setLoginPromptVisible(false);
          navigation.navigate("Register");
        }}
        onRequestClose={() => setLoginPromptVisible(false)}
      />

      {/* Apply Job Form Modal */}
      <Modal statusBarTranslucent={true} visible={applyFormVisible} animationType="slide" transparent>
        <View style={styles.applyModalOverlay}>
          <View style={styles.applyModalContainer}>
            <MyHeader
              showBack
              title="Apply Job"
              onBackPress={handleCloseApplyForm}
            />

            <ScrollView
              contentContainerStyle={styles.applyFormContainer}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {selectedJob && (
                <View style={styles.applyJobTitleContainer}>
                  <Text style={styles.applyJobTitle}>
                    {selectedJob.jobTitle || selectedJob.title || 'Job Application'}
                  </Text>
                </View>
              )}

              <TextInputComponent
                placeholder="Full Name"
                inputdata={applyName}
                setInputdata={setApplyName}
                borderColor={BRANDCOLOR}
                width="95%"
                image={USER}
              />

              <TextInputComponent
                placeholder="Email Address"
                inputdata={applyEmail}
                setInputdata={setApplyEmail}
                keyboardType="email-address"
                borderColor={BRANDCOLOR}
                width="95%"
                image={MAIL}
              />

              <TextInputComponent
                placeholder="Phone Number"
                inputdata={applyPhone}
                setInputdata={setApplyPhone}
                keyboardType="numeric"
                borderColor={BRANDCOLOR}
                width="95%"
                image={PHONE}
              />

              <View style={styles.applyFileBox}>
                {!applyFile ? (
                  <TouchableOpacity style={styles.applyUploadArea} onPress={handlePickFile}>
                    <Image source={UPLOAD} style={styles.applyUploadIcon} />
                    <Text style={styles.applyFileText}>Upload Resume</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.applySelectedFile}>
                    <Text style={styles.applyFileName}>{applyFile.name}</Text>
                    <TouchableOpacity onPress={() => setApplyFile(null)} style={styles.applyRemoveBtn}>
                      <Text style={styles.applyRemoveText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.applyCoverLetterContainer}>
                <View style={styles.applyCoverLetterHeader}>
                  <Image source={COVERLETTER} style={styles.applyCoverLetterIcon} />
                  <Text style={styles.applyCoverLetterLabel}>Cover Letter (Description)</Text>
                </View>
                <TextInput
                  placeholder="Enter your cover letter or description here..."
                  placeholderTextColor="#7A7A7A"
                  value={applyCoverLetter}
                  onChangeText={setApplyCoverLetter}
                  style={styles.applyCoverLetterInput}
                  multiline
                  numberOfLines={10}
                  maxLength={1000}
                  textAlignVertical="top"
                />
                <Text style={styles.applyCoverLetterCharCount}>
                  {applyCoverLetter.length}/1000
                </Text>
              </View>

              <View style={styles.applyButtonWrapper}>
                <CustomButton
                  text={applyLoading ? "Submitting..." : "Submit Application"}
                  color={WHITE}
                  onPress={handleSubmitApplication}
                  disabled={applyLoading}
                />
              </View>
            </ScrollView>
          </View>
        </View>

        <ToastMessage
          message={applyToastMessage.msg}
          visible={applyToastMessage.visible}
          setVisible={({ visible }) =>
            setApplyToastMessage((prev) => ({ ...prev, visible }))
          }
          bacgroundColor={applyToastMessage.type === "success" ? "green" : "red"}
          textColor={WHITE}
          type={applyToastMessage.type}
          duration={3000}
          image={LOGO}
        />
      </Modal>
    </>
  );
};

export default CompanyDetailsJobScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WHITE,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: HEIGHT * 0.02,
    fontSize: WIDTH * 0.04,
    color: "#666",
  },
  listContent: {
    padding: WIDTH * 0.02,
    paddingBottom: HEIGHT * 0.05,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: HEIGHT * 0.015,
  },
  jobCard: {
    width: (WIDTH * 0.96 - WIDTH * 0.02) / 2,
    backgroundColor: "#F9FAFB",
    borderRadius: WIDTH * 0.03,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: WIDTH * 0.01,
    elevation: 2,
  },
  cardContent: {
    padding: WIDTH * 0.03,
    position: "relative",
  },
  wishlistButton: {
    position: "absolute",
    top: WIDTH * 0.02,
    right: WIDTH * 0.02,
    zIndex: 1,
    padding: WIDTH * 0.01,
  },
  cardLogo: {
    width: WIDTH * 0.12,
    height: WIDTH * 0.12,
    borderRadius: WIDTH * 0.02,
    alignSelf: "center",
    marginBottom: HEIGHT * 0.01,
    resizeMode: "contain",
  },
  cardCompany: {
    fontSize: WIDTH * 0.032,
    color: "#444",
    fontFamily: FIRASANSSEMIBOLD,
    textAlign: "center",
    marginBottom: HEIGHT * 0.005,
  },
  cardTitle: {
    fontSize: WIDTH * 0.035,
    fontFamily: UBUNTUBOLD,
    color: BLACK,
    textAlign: "center",
    marginBottom: HEIGHT * 0.005,
    minHeight: HEIGHT * 0.04,
  },
  cardInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: HEIGHT * 0.003,
  },
  cardJobType: {
    fontSize: WIDTH * 0.03,
    color: BRANDCOLOR,
    fontFamily: FIRASANSSEMIBOLD,
    marginLeft: WIDTH * 0.01,
  },
  cardLocation: {
    fontSize: WIDTH * 0.03,
    color: "#666",
    marginLeft: WIDTH * 0.01,
  },
  cardSalary: {
    fontSize: WIDTH * 0.03,
    color: "#666",
    marginLeft: WIDTH * 0.01,
  },
  applyButton: {
    backgroundColor: BRANDCOLOR,
    borderRadius: WIDTH * 0.02,
    paddingVertical: HEIGHT * 0.008,
    paddingHorizontal: WIDTH * 0.02,
    alignSelf: "center",
    width: "100%",
    alignItems: "center",
    marginTop: HEIGHT * 0.005,
  },
  applyText: {
    color: WHITE,
    fontFamily: UBUNTUBOLD,
    fontSize: WIDTH * 0.03,
  },
  appliedContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: HEIGHT * 0.005,
  },
  appliedText: {
    marginLeft: 6,
    fontSize: 12,
    color: "#26AE61",
    fontWeight: "600",
  },
  emptyContainer: {
    paddingVertical: HEIGHT * 0.1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: WIDTH * 0.04,
    color: "#999",
    textAlign: "center",
  },
  applyModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  applyModalContainer: {
    height: "90%",
    backgroundColor: WHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  applyFormContainer: {
    padding: 10,
    paddingBottom: 30,
    backgroundColor: WHITE,
  },
  applyJobTitleContainer: {
    width: "95%",
    alignSelf: "center",
    marginBottom: HEIGHT * 0.02,
    paddingBottom: HEIGHT * 0.015,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  applyJobTitle: {
    fontSize: WIDTH * 0.045,
    fontFamily: UBUNTUBOLD,
    color: BRANDCOLOR,
    textAlign: "center",
  },
  applyFileBox: {
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
  applyUploadArea: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  applyUploadIcon: {
    width: 30,
    height: 30,
    marginBottom: 6,
    resizeMode: "contain",
  },
  applyFileText: {
    color: BLACK,
    fontSize: 14,
  },
  applySelectedFile: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  applyFileName: {
    color: BLACK,
    fontSize: 14,
    paddingHorizontal: 10,
    textAlign: "center",
    flex: 1,
  },
  applyRemoveBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  applyRemoveText: {
    color: "red",
    fontSize: 13,
    fontFamily: FIRASANSSEMIBOLD,
  },
  applyCoverLetterContainer: {
    width: "95%",
    alignSelf: "center",
    marginVertical: 10,
    borderWidth: 1,
    borderColor: BRANDCOLOR,
    borderRadius: 12,
    padding: 12,
    backgroundColor: WHITE,
  },
  applyCoverLetterHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  applyCoverLetterIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
    resizeMode: "contain",
  },
  applyCoverLetterLabel: {
    fontSize: 14,
    fontFamily: FIRASANSSEMIBOLD,
    color: BLACK,
  },
  applyCoverLetterInput: {
    minHeight: 150,
    fontSize: 14,
    color: BLACK,
    textAlignVertical: "top",
    padding: 10,
  },
  applyCoverLetterCharCount: {
    fontSize: 12,
    color: "#666",
    textAlign: "right",
    marginTop: 5,
  },
  applyButtonWrapper: {
    alignItems: "center",
    marginTop: 20,
  },
});
