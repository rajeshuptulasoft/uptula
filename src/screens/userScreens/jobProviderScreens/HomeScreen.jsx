import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  TextInput,
  Image,
  StatusBar,
  Platform,
  Modal,
  KeyboardAvoidingView,
  Pressable,
  BackHandler,
  RefreshControl,
  PermissionsAndroid,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  Animated,
  Easing,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { DrawerActions } from "@react-navigation/native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { Picker } from "@react-native-picker/picker";
import { launchImageLibrary } from "react-native-image-picker";
import { BLACK, BRANDCOLOR, WHITE } from "../../../constant/color";
import { UBUNTUBOLD, UBUNTU, FIRASANSSEMIBOLD, ROBOTOSEMIBOLD, CANTARELLBOLD, FIRASANSBOLD } from "../../../constant/fontPath";
import { HEIGHT, WIDTH } from "../../../constant/config";
import { 
  LOGO,
  MECHANICAL,
  HEALTHCARE,
  INFORMATIONTECHNOLOGY,
  EDUCATION,
  FINANCE,
  HARDWARE,
  IT,
  CATAGORY,
  MARKETING,
  OTHERS,
  MUMBAI,
  HYDREBAD,
  AHAMEDABAD,
  BHUBANESWAR,
  KOLKATA,
  BANGALORE,
  MUKIT,
  VIKASH,
  VDEAL,
  YUBI,
  GC,
  UPTULASOFT,
  VIKASHFOUNDATION,
  VERIFIEDPROVIDER,
} from "../../../constant/imagePath";
import { getObjByKey } from "../../../utils/Storage";
import { BASE_URL } from "../../../constant/url";
import { GETNETWORK, PUTNETWORK } from "../../../utils/Network";
import { MyAlert } from "../../../components/commonComponents/MyAlert";
import { MyHeader } from "../../../components/commonComponents/MyHeader";
import { handleProfilePress } from "../../../navigations/CustomDrawerContent";
import { CustomButton } from "../../../components/commonComponents/Button";
import { TextInputComponent } from "../../../components/commonComponents/TextInputComponent";
import { ToastMessage } from "../../../components/commonComponents/ToastMessage";
import {
  COMPANYNAME,
  JOBDESCRIPTION,
  JOBTITLE,
  QUALIFICATION,
  SKILLS,
  VACANCY,
  MAIL,
  PHONE,
  FACEBOOK,
  GOOGLE,
  TWITTER,
  LINKEDIN,
  PRINTREST,
  INSTAGRAM,
  WEBSITE,
  ADDRESS,
  PINCODE,
  STATE,
  COUNTRY,
  DROPDOWN,
  GENERALINFORMATION,
  UPLOADIMAGE,
  SOCIALACCOUNT,
  EDIT,
  DELETE,
} from "../../../constant/imagePath";

const normalizeJobSocialFields = (job) => {
  if (!job || typeof job !== "object") return job;

  const normalizedJob = { ...job };
  normalizedJob.facebook = normalizedJob.facebook || normalizedJob.facebook_url || normalizedJob.facebookUrl || "";
  normalizedJob.twitter = normalizedJob.twitter || normalizedJob.twitter_url || normalizedJob.twitterUrl || normalizedJob.x || "";
  normalizedJob.linkedin = normalizedJob.linkedin || normalizedJob.linkedIn || normalizedJob.linkedin_url || normalizedJob.linkedinUrl || "";
  normalizedJob.instagram = normalizedJob.instagram || normalizedJob.instagram_url || normalizedJob.instagramUrl || "";

  return normalizedJob;
};

// Removed static companies data - now fetching from API

// Format jobType: full_time -> Full Time
  const formatJobType = (jobType) => {
  if (!jobType) return '';
  return jobType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Format state: west_bengal -> West Bengal
const formatState = (state) => {
  if (!state) return '';
  return state
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Format city: first letter capitalized
const formatCity = (city) => {
  if (!city) return '';
  return city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
  };

// Format location: combine state and city
const formatLocation = (state, city) => {
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

const getCompactAddress = (address) => {
  if (!address) return '';
  const parts = address
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length <= 3) return parts.join(', ');
  return parts.slice(-3).join(', ');
};

const getCompanyLocationText = (item) => {
  const rawAddress = item.address || item.location || '';
  const compactAddress = getCompactAddress(rawAddress);
  if (compactAddress) return compactAddress;
  return formatLocation(item.state, item.city);
};

// Format salary (no INR prefix, icon shows currency)
  const formatSalary = (salaryRange) => {
  if (!salaryRange) return 'Salary not specified';
  // Remove INR prefix if present
  let salary = salaryRange.trim().replace(/^INR\s*/i, '');
  
  if (salary === "Negotiable" || salary.toLowerCase() === "negotiable") {
      return "Negotiable";
    }
  if (salary.includes("-")) {
    const [min, max] = salary.split("-");
      const minNum = parseInt(min);
      const maxNum = parseInt(max);
      if (minNum >= 1000) {
      return `${(minNum / 1000).toFixed(0)}k - ${(maxNum / 1000).toFixed(0)}k`;
      }
    return `${minNum.toLocaleString()} - ${maxNum.toLocaleString()}`;
    }
  if (salary.includes("+")) {
    const amount = parseInt(salary.replace("+", ""));
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}k+`;
    }
    return `${amount.toLocaleString()}+`;
  }
  return salary;
};

const PostedJobCard = ({ item, onPress, onEdit, onDelete }) => {
  // Construct logo URL if it's a relative path
  const logoUrl = item.company_logo 
    ? (item.company_logo.startsWith('http://') || item.company_logo.startsWith('https://') 
        ? item.company_logo 
        : `${BASE_URL.replace('/api/', '/')}${item.company_logo.replace(/^\//, '')}`)
    : null;

  // Get status badge color
  const getStatusColor = (status) => {
    if (status === "active") return "#4CAF50";
    if (status === "inactive") return "#FF5252";
    return "#9E9E9E";
  };

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => onPress(item)} 
      activeOpacity={0.8}
    >
      {/* Card Content */}
      <View style={styles.cardContent}>
        {/* Logo Section */}
        <View style={styles.cardLogoContainer}>
          {logoUrl ? (
            <Image source={{ uri: logoUrl }} style={styles.cardLogo} defaultSource={LOGO} />
          ) : (
            <Image source={LOGO} style={styles.cardLogo} />
          )}
          {/* Status Indicator */}
          {item.status && (
            <View style={styles.statusIndicatorContainer}>
              <View 
                style={[
                  styles.statusDot, 
                  { backgroundColor: item.status === "active" ? "#4CAF50" : "#FF5252" }
                ]} 
              />
              <Text style={styles.statusText}>
                {item.status === "active" ? "Active" : "Inactive"}
              </Text>
    </View>
          )}
        </View>

        {/* Main Content */}
    <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.job_title || item.title}
          </Text>
          
          <View style={styles.companyRow}>
            <MaterialCommunityIcons 
              name="office-building" 
              size={HEIGHT * 0.016} 
              color="#666" 
              style={styles.companyIcon}
            />
            <Text style={styles.cardSubtitle} numberOfLines={1}>
              {item.company_name || item.company}
            </Text>
    </View>

          {(item.job_type || item.jobType) && (
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="briefcase-outline" size={HEIGHT * 0.016} color={BRANDCOLOR} />
              <Text style={styles.cardMeta}>{formatJobType(item.job_type || item.jobType)}</Text>
            </View>
          )}
          
          {(item.state || item.city) && (
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="map-marker-outline" size={HEIGHT * 0.016} color={BRANDCOLOR} />
              <Text style={styles.cardLocation}>{formatLocation(item.state, item.city)}</Text>
            </View>
          )}
          
            <View style={styles.salaryContainer}>
              <MaterialCommunityIcons name="currency-inr" size={HEIGHT * 0.014} color="#4CAF50" />
              <Text style={styles.cardSalary}>
                {formatSalary(item.salary_range || item.salaryRange)}
              </Text>
          </View>
        </View>

        {/* Action Buttons */}
    <View style={styles.cardActions}>
          <TouchableOpacity 
            onPress={() => onEdit(item)} 
            style={styles.cardActionButton}
            activeOpacity={0.7}
          >
            <View style={[styles.actionButtonInner, styles.editButton]}>
              <MaterialCommunityIcons name="pencil" size={HEIGHT * 0.018} color={WHITE} />
            </View>
      </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => onDelete(item)} 
            style={styles.cardActionButton}
            activeOpacity={0.7}
          >
            <View style={[styles.actionButtonInner, styles.deleteButton]}>
              <MaterialCommunityIcons name="delete-outline" size={HEIGHT * 0.018} color={WHITE} />
            </View>
      </TouchableOpacity>
    </View>
  </View>
    </TouchableOpacity>
);
};

const SearchOverlay = ({ onClose, navigation, onExitRequest }) => {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // BackHandler: use navigation.goBack()
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      navigation.goBack();
      return true;
    });

    return () => backHandler.remove();
  }, [navigation]);

  const handleSearch = useCallback(async (searchQuery, searchLocation) => {
    // If both are empty, clear results
    if (!searchQuery.trim() && !searchLocation.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      
      // Build search URL with query parameters for employer/jobs
      let searchUrl = `${BASE_URL}employer/jobs`;
      const params = [];
      
      if (searchQuery.trim()) {
        // Search in jobTitle, companyName, skills, designation
        params.push(`search=${encodeURIComponent(searchQuery.trim())}`);
      }
      
      if (searchLocation.trim()) {
        params.push(`location=${encodeURIComponent(searchLocation.trim())}`);
      }
      
      if (params.length > 0) {
        searchUrl += `?${params.join('&')}`;
      }

      const result = await GETNETWORK(searchUrl, true);
      
      if (result && !result.message) {
        const jobs = result?.data || result?.jobs || result?.list || result || [];
        
        // Filter jobs by jobTitle if searchQuery is provided
        // This ensures only jobs with jobTitle matching the search are shown
        let filteredJobs = Array.isArray(jobs) ? jobs : [];
        
        if (searchQuery.trim()) {
          const searchLower = searchQuery.trim().toLowerCase();
          filteredJobs = filteredJobs.filter((job) => {
            const jobTitle = (job.job_title || job.jobTitle || job.title || '').toLowerCase();
            const companyName = (job.company_name || job.companyName || job.company || '').toLowerCase();
            // Match if jobTitle or companyName starts with the search query
            return jobTitle.startsWith(searchLower) || companyName.startsWith(searchLower);
          });
        }
        
        setSearchResults(filteredJobs);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Real-time search with debouncing - triggers as user types
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      handleSearch(query, location);
    }, 500); // 500ms debounce delay

    return () => clearTimeout(debounceTimer);
  }, [query, location, handleSearch]);

  const handleJobPress = (item) => {
    navigation.navigate("JobDetails", { jobData: normalizeJobSocialFields(item) });
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={WHITE} translucent={false} />
    <View style={styles.overlay}>
      <View style={styles.overlayHeader}>
        <TouchableOpacity onPress={onClose}>
          <MaterialCommunityIcons name="arrow-left" size={26} color={BLACK} />
        </TouchableOpacity>
        <Text style={styles.overlayTitle}>Search</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Skills, Designation, Companies</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="e.g. Backend, Engineer, Uptula"
          placeholderTextColor="#7A7A7A"
          style={styles.input}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Location</Text>
        <TextInput
          value={location}
          onChangeText={setLocation}
          placeholder="City, state, or remote"
          placeholderTextColor="#7A7A7A"
          style={styles.input}
        />
      </View>

        {loading && (
          <View style={styles.loadingIndicatorContainer}>
            <ActivityIndicator size="small" color={BRANDCOLOR} />
            <Text style={styles.loadingIndicatorText}>Searching...</Text>
          </View>
        )}

        {searchResults.length > 0 && (
          <View style={styles.searchResultsContainer}>
            <Text style={styles.searchResultsTitle}>Search Results</Text>
            <FlatList
              data={searchResults}
              keyExtractor={(item, index) => item?.id || item?._id || `job-${index}`}
              numColumns={2}
              columnWrapperStyle={styles.searchRow}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const logoUrl = item.company_logo || item.companyLogo
                  ? ((item.company_logo || item.companyLogo).startsWith('http://') || (item.company_logo || item.companyLogo).startsWith('https://') 
                      ? (item.company_logo || item.companyLogo) 
                      : `${BASE_URL.replace('/api/', '/')}${(item.company_logo || item.companyLogo).replace(/^\//, '')}`)
                  : null;
                
                return (
                  <TouchableOpacity 
                    style={styles.searchResultCard} 
                    onPress={() => handleJobPress(item)}
                    activeOpacity={0.7}
                  >
                    {logoUrl ? (
                      <Image source={{ uri: logoUrl }} style={styles.searchResultLogo} defaultSource={LOGO} />
                    ) : (
                      <Image source={LOGO} style={styles.searchResultLogo} />
                    )}
                    <Text style={styles.searchResultCompany} numberOfLines={1}>
                      {item.company_name || item.companyName || 'N/A'}
                    </Text>
                    <Text style={styles.searchResultTitle} numberOfLines={2}>
                      {item.job_title || item.title || 'N/A'}
                    </Text>
                    {(item.job_type || item.jobType) && (
                      <View style={styles.searchResultInfoRow}>
                        <MaterialCommunityIcons name="briefcase-outline" size={WIDTH * 0.03} color={BRANDCOLOR} />
                        <Text style={styles.searchResultJobType} numberOfLines={1}>
                          {formatJobType(item.job_type || item.jobType)}
                        </Text>
                      </View>
                    )}
                    {(item.state || item.city) && (
                      <View style={styles.searchResultInfoRow}>
                        <MaterialCommunityIcons name="map-marker-outline" size={WIDTH * 0.03} color={BRANDCOLOR} />
                        <Text style={styles.searchResultLocation} numberOfLines={1}>
                          {formatLocation(item.state, item.city)}
                        </Text>
                      </View>
                    )}
                    <View style={styles.searchResultInfoRow}>
                      <MaterialCommunityIcons name="currency-inr" size={WIDTH * 0.03} color={BRANDCOLOR} />
                    <Text style={styles.searchResultSalary} numberOfLines={1}>
                        {formatSalary(item.salary_range || item.salaryRange)}
                    </Text>
                    </View>
      </TouchableOpacity>
                );
              }}
            />
          </View>
        )}

        {!loading && searchResults.length === 0 && (query.trim() !== '' || location.trim() !== '') && (
          <View style={styles.emptySearchContainer}>
            <Text style={styles.emptySearchText}>No jobs found matching your search</Text>
          </View>
        )}
      </View>
    </>
  );
};

const EditJobModal = ({ visible, jobData, onClose, onSave }) => {
  // General Information Section
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyLogo, setCompanyLogo] = useState(null);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [salary, setSalary] = useState("");
  const [vacancy, setVacancy] = useState("");
  const [experience, setExperience] = useState("");
  const [jobType, setJobType] = useState("");
  const [qualification, setQualification] = useState("");
  const [skills, setSkills] = useState("");
  const [status, setStatus] = useState("active");

  // Company Address Section
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [pinCode, setPinCode] = useState("");

  // Social Account Section
  const [facebook, setFacebook] = useState("");
  const [google, setGoogle] = useState("");
  const [twitter, setTwitter] = useState("");
  const [linkedIn, setLinkedIn] = useState("");
  const [pinterest, setPinterest] = useState("");
  const [instagram, setInstagram] = useState("");

  // Loading state
  const [isUpdating, setIsUpdating] = useState(false);

  // Load job data when modal opens, reset to defaults when modal closes
  React.useEffect(() => {
    if (visible && jobData) {
      // console.log('📝 Edit Job Modal Opened');
      // console.log('📦 Loading job data:', JSON.stringify(jobData, null, 2));
      setJobTitle(jobData.job_title || jobData.title || "");
      setCompanyName(jobData.company_name || jobData.companyName || "");
      setCompanyLogo(jobData.company_logo || jobData.companyLogo || null);
      setCategory(jobData.category || "");
      setDescription(jobData.description || "");
      setSalary(jobData.salary_range || jobData.salaryRange || "");
      setVacancy(jobData.no_of_vacancy?.toString() || jobData.vacancy || "");
      setExperience(jobData.experience || "");
      setJobType(jobData.job_type || jobData.jobType || "");
      setQualification(jobData.qualification || "");
      setSkills(jobData.skills || "");
      setStatus(jobData.status || "active");
      setEmail(jobData.email || "");
      setPhoneNumber(jobData.phone || jobData.phoneNumber || "");
      setWebsite(jobData.website || "");
      setAddress(jobData.address || "");
      setCity(jobData.city || "");
      setState(jobData.state || "");
      setCountry(jobData.country || "");
      setPinCode(jobData.zip_code || jobData.pinCode || "");
      setFacebook(jobData.facebook || "");
      setGoogle(jobData.google || "");
      setTwitter(jobData.twitter || "");
      setLinkedIn(jobData.linkedin || jobData.linkedIn || "");
      setPinterest(jobData.pinterest || "");
      setInstagram(jobData.instagram || "");
      // console.log('✅ Job data loaded into form');
    } else if (!visible) {
      // console.log('❌ Edit Job Modal Closed - Resetting form');
      // Reset all fields to default when modal closes
      setJobTitle("");
      setCompanyName("");
      setCompanyLogo(null);
      setCategory("");
      setDescription("");
      setSalary("");
      setVacancy("");
      setExperience("");
      setJobType("");
      setQualification("");
      setSkills("");
      setStatus("active");
      setEmail("");
      setPhoneNumber("");
      setWebsite("");
      setAddress("");
      setCity("");
      setState("");
      setCountry("");
      setPinCode("");
      setFacebook("");
      setGoogle("");
      setTwitter("");
      setLinkedIn("");
      setPinterest("");
      setInstagram("");
    }
  }, [visible, jobData]);

  const pickCompanyLogo = async () => {
    // console.log('🖼️ Opening image picker for company logo...');
    const res = await launchImageLibrary({ mediaType: "photo" });
    if (!res.didCancel && res.assets?.length) {
      // console.log('✅ Logo selected:', res.assets[0].uri);
      setCompanyLogo(res.assets[0]);
    } else {
      // console.log('❌ Logo selection cancelled');
    }
  };

  const handlePinCodeChange = async (pin) => {
    setPinCode(pin);
    if (pin && pin.length === 6) {
      // TODO: Replace with actual API call
      // console.log("📍 Pin code entered:", pin);
    }
  };

  const handleSave = async () => {
    try {
      setIsUpdating(true);
      // console.log('🔄 Starting job update process...');
      
      // Get token from storage
      const loginResponse = await getObjByKey('loginResponse');
      if (!loginResponse || !loginResponse.token) {
        // console.error('❌ Error: No token found in loginResponse');
        // console.error('❌ Update failed: Authentication token is missing');
        onClose();
        return;
      }
      // console.log('✅ Token found:', loginResponse.token.substring(0, 20) + '...');

      // Get job ID
      const jobId = jobData?.id || jobData?._id;
      if (!jobId) {
        // console.error('❌ Error: No job ID found in jobData');
        // console.error('❌ Update failed: Job ID is required');
        onClose();
        return;
      }
      // console.log('✅ Job ID found:', jobId);

      // Prepare the data for API (only include fields with values)
      const updateData = {
        jobTitle: jobTitle,
        jobType: jobType,
        qualification: qualification,
        skills: skills,
        companyName: companyName,
        category: category,
        salaryRange: salary,
        noOfVacancy: parseInt(vacancy) || 0,
        status: status,
      };

      // Only add optional fields if they have values
      if (companyLogo && companyLogo !== null) {
        updateData.companyLogo = companyLogo;
      }
      if (email && email.trim() !== "") {
        updateData.email = email;
      }
      if (phoneNumber && phoneNumber.trim() !== "") {
        updateData.phone = phoneNumber;
      }
      if (website && website.trim() !== "") {
        updateData.website = website;
      }
      if (address && address.trim() !== "") {
        updateData.address = address;
      }
      if (city && city.trim() !== "") {
        updateData.city = city;
      }
      if (state && state.trim() !== "") {
        updateData.state = state;
      }
      if (country && country.trim() !== "") {
        updateData.country = country;
      }
      if (pinCode && pinCode.trim() !== "") {
        updateData.zipCode = pinCode;
      }
      if (facebook && facebook.trim() !== "") {
        updateData.facebook = facebook;
      }
      if (google && google.trim() !== "") {
        updateData.google = google;
      }
      if (twitter && twitter.trim() !== "") {
        updateData.twitter = twitter;
      }
      if (linkedIn && linkedIn.trim() !== "") {
        updateData.linkedin = linkedIn;
      }
      if (pinterest && pinterest.trim() !== "") {
        updateData.pinterest = pinterest;
      }
      if (instagram && instagram.trim() !== "") {
        updateData.instagram = instagram;
      }

      const url = `${BASE_URL}employer/jobs/${jobId}`;
      // console.log('📡 Update URL:', url);
      // console.log('📦 Update payload:', JSON.stringify(updateData, null, 2));

      const result = await PUTNETWORK(url, updateData, true);
      // console.log('📥 API Response:', JSON.stringify(result, null, 2));

      if (result && !result.error && !result.errors) {
        // console.log('✅ SUCCESS: Job updated successfully!');
        // console.log('✅ Updated job title:', jobTitle);
        // console.log('✅ Updated status:', status);
        
        // Update the job in the local state
        const updatedJob = {
          ...jobData,
          job_title: jobTitle,
          company_name: companyName,
          company_logo: companyLogo,
          category: category,
          description: description,
          salary_range: salary,
          no_of_vacancy: parseInt(vacancy) || 0,
          experience: experience,
          job_type: jobType,
          qualification: qualification,
          skills: skills,
          status: status,
          email: email,
          phone: phoneNumber,
          website: website,
          address: address,
          city: city,
          state: state,
          country: country,
          zip_code: pinCode,
          facebook: facebook,
          google: google,
          twitter: twitter,
          linkedin: linkedIn,
          pinterest: pinterest,
          instagram: instagram,
        };
        
        // console.log('✅ Local state updated successfully');
        onSave(updatedJob);
      } else {
        // console.error('❌ ERROR: Failed to update job');
        
        // Check if there are errors array
        if (result?.errors && Array.isArray(result.errors)) {
          // console.error('❌ API returned', result.errors.length, 'error(s):');
          // result.errors.forEach((error, index) => {
          //   console.error(`❌ Error ${index + 1}:`, {
          //     field: error.path || error.field || 'unknown',
          //     message: error.msg || error.message || 'No message',
          //     value: error.value || 'N/A',
          //     type: error.type || 'N/A',
          //     fullError: error
          //   });
          // });
        } else if (result?.error) {
          // console.error('❌ API returned single error:', result.error);
        } else {
          // console.error('❌ Unknown error format');
        }
        
        // console.error('❌ Full response:', JSON.stringify(result, null, 2));
        onClose();
      }
    } catch (error) {
      // console.error('❌ ERROR: Exception occurred while updating job');
      // console.error('❌ Error details:', error);
      // console.error('❌ Error message:', error.message);
      // console.error('❌ Error stack:', error.stack);
      onClose();
    } finally {
      setIsUpdating(false);
      // console.log('🏁 Job update process completed');
    }
  };

  return (
    <Modal
    statusBarTranslucent={true}
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Job</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color={BLACK} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
          >
            {/* ========== GENERAL INFORMATION SECTION ========== */}
            <View style={styles.sectionHeadingContainer}>
              <Image source={GENERALINFORMATION} style={styles.sectionIcon} />
              <Text style={styles.sectionHeading}>General Information</Text>
            </View>

            <TextInputComponent
              placeholder="Job Title"
              inputdata={jobTitle}
              setInputdata={setJobTitle}
              borderColor={BRANDCOLOR}
              width="95%"
              image={JOBTITLE}
            />

            <TextInputComponent
              placeholder="Company Name"
              inputdata={companyName}
              setInputdata={setCompanyName}
              borderColor={BRANDCOLOR}
              width="95%"
              image={COMPANYNAME}
            />

            <Pressable style={styles.logoBox} onPress={pickCompanyLogo}>
              {companyLogo ? (
                <Image
                  source={{ uri: companyLogo.uri || companyLogo }}
                  style={styles.logoImage}
                />
              ) : (
                <View style={styles.logoTextContainer}>
                  <Image source={UPLOADIMAGE} style={styles.uploadIcon} />
                  <Text style={styles.logoText}>Choose Company Logo</Text>
                </View>
              )}
            </Pressable>

            <Text style={styles.label}>Company Category</Text>
            <View style={styles.pickerWrapper}>
              <View style={styles.pickerContainer}>
                <Picker 
                  selectedValue={category} 
                  onValueChange={setCategory} 
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                >
                  <Picker.Item label="Select Company category" value="" />
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

            <TextInputComponent
              placeholder="Job Description"
              inputdata={description}
              setInputdata={setDescription}
              borderColor={BRANDCOLOR}
              width="95%"
              maxLength={500}
              image={JOBDESCRIPTION}
            />

            <Text style={styles.label}>Salary Range</Text>
            <View style={styles.pickerWrapper}>
              <View style={styles.pickerContainer}>
                <Picker 
                  selectedValue={salary} 
                  onValueChange={setSalary} 
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                >
                  <Picker.Item label="Select salary range" value="" />
                  <Picker.Item label="20,000 - 30,000" value="20000-30000" />
                  <Picker.Item label="50,000 - 80,000" value="50000-80000" />
                  <Picker.Item label="80,000 - 120,000" value="80000-120000" />
                  <Picker.Item label="120,000+" value="120000+" />
                  <Picker.Item label="Negotiable" value="Negotiable" />
                </Picker>
                <Image source={DROPDOWN} style={styles.dropdownIcon} />
              </View>
            </View>

            <TextInputComponent
              placeholder="Number of Vacancies"
              type="number"
              keyboardType="numeric"
              inputdata={vacancy}
              setInputdata={setVacancy}
              borderColor={BRANDCOLOR}
              width="95%"
              image={VACANCY}
            />

            <Text style={styles.label}>Experience Required</Text>
            <View style={styles.pickerWrapper}>
              <View style={styles.pickerContainer}>
                <Picker 
                  selectedValue={experience} 
                  onValueChange={setExperience} 
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                >
                  <Picker.Item label="Select experience" value="" />
                  <Picker.Item label="0–6 Months" value="0-6 months" />
                  <Picker.Item label="1 Year" value="1 year" />
                  <Picker.Item label="2 Years" value="2 years" />
                  <Picker.Item label="3 Years" value="3 years" />
                  <Picker.Item label="4 Years" value="4 years" />
                  <Picker.Item label="5+ Years" value="5+ years" />
                </Picker>
                <Image source={DROPDOWN} style={styles.dropdownIcon} />
              </View>
            </View>

            <Text style={styles.label}>Job Type</Text>
            <View style={styles.pickerWrapper}>
              <View style={styles.pickerContainer}>
                <Picker 
                  selectedValue={jobType} 
                  onValueChange={setJobType} 
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                >
                  <Picker.Item label="Select job type" value="" />
                  <Picker.Item label="Full Time" value="FullTime" />
                  <Picker.Item label="Part Time" value="PartTime" />
                  <Picker.Item label="Freelancer" value="Freelancer" />
                  <Picker.Item label="Contract" value="Contract" />
                  <Picker.Item label="Internship" value="Internship" />
                </Picker>
                <Image source={DROPDOWN} style={styles.dropdownIcon} />
              </View>
            </View>

            <TextInputComponent
              placeholder="Qualification Required"
              inputdata={qualification}
              setInputdata={setQualification}
              borderColor={BRANDCOLOR}
              width="95%"
              image={QUALIFICATION}
            />

            <TextInputComponent
              placeholder="Skills (comma separated)"
              inputdata={skills}
              setInputdata={setSkills}
              borderColor={BRANDCOLOR}
              width="95%"
              image={SKILLS}
            />

            {/* ========== COMPANY ADDRESS SECTION ========== */}
            <View style={styles.sectionHeadingContainer}>
              <Image source={COMPANYNAME} style={styles.sectionIcon} />
              <Text style={styles.sectionHeading}>Company Address</Text>
            </View>

            <TextInputComponent
              placeholder="Email"
              type="email"
              keyboardType="email-address"
              autoCapitalize="none"
              inputdata={email}
              setInputdata={setEmail}
              borderColor={BRANDCOLOR}
              width="95%"
              image={MAIL}
            />

            <TextInputComponent
              placeholder="Phone Number"
              type="number"
              keyboardType="phone-pad"
              inputdata={phoneNumber}
              setInputdata={setPhoneNumber}
              borderColor={BRANDCOLOR}
              width="95%"
              image={PHONE}
            />

            <TextInputComponent
              placeholder="Website Links"
              type="url"
              keyboardType="url"
              autoCapitalize="none"
              inputdata={website}
              setInputdata={setWebsite}
              borderColor={BRANDCOLOR}
              width="95%"
              image={WEBSITE}
            />

            <TextInputComponent
              placeholder="Address"
              inputdata={address}
              setInputdata={setAddress}
              borderColor={BRANDCOLOR}
              width="95%"
              image={ADDRESS}
            />

            <Text style={styles.label}>City</Text>
            <View style={styles.pickerWrapper}>
              <View style={styles.pickerContainer}>
                <Picker 
                  selectedValue={city} 
                  onValueChange={setCity} 
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                >
                  <Picker.Item label="Select city" value="" />
                  <Picker.Item label="Mumbai" value="Mumbai" />
                  <Picker.Item label="Delhi" value="Delhi" />
                  <Picker.Item label="Bangalore" value="Bangalore" />
                  <Picker.Item label="Hyderabad" value="Hyderabad" />
                  <Picker.Item label="Chennai" value="Chennai" />
                  <Picker.Item label="Kolkata" value="Kolkata" />
                  <Picker.Item label="Pune" value="Pune" />
                  <Picker.Item label="Ahmedabad" value="Ahmedabad" />
                  <Picker.Item label="Jaipur" value="Jaipur" />
                  <Picker.Item label="Surat" value="Surat" />
                </Picker>
                <Image source={DROPDOWN} style={styles.dropdownIcon} />
              </View>
            </View>

            <TextInputComponent
              placeholder="PinCode"
              type="number"
              keyboardType="numeric"
              inputdata={pinCode}
              setInputdata={handlePinCodeChange}
              borderColor={BRANDCOLOR}
              width="95%"
              image={PINCODE}
            />

            <TextInputComponent
              placeholder="State"
              inputdata={state}
              setInputdata={setState}
              borderColor={BRANDCOLOR}
              width="95%"
              image={STATE}
              editable={true}
            />

            <TextInputComponent
              placeholder="Country"
              inputdata={country}
              setInputdata={setCountry}
              borderColor={BRANDCOLOR}
              width="95%"
              image={COUNTRY}
              editable={true}
            />

            {/* ========== SOCIAL ACCOUNT SECTION ========== */}
            <View style={styles.sectionHeadingContainer}>
              <Image source={SOCIALACCOUNT} style={styles.sectionIcon} />
              <Text style={styles.sectionHeading}>Social Account</Text>
            </View>

            <TextInputComponent
              placeholder="Facebook Link"
              type="url"
              keyboardType="url"
              autoCapitalize="none"
              inputdata={facebook}
              setInputdata={setFacebook}
              borderColor={BRANDCOLOR}
              width="95%"
              image={FACEBOOK}
            />

            <TextInputComponent
              placeholder="Google Link"
              type="url"
              keyboardType="url"
              autoCapitalize="none"
              inputdata={google}
              setInputdata={setGoogle}
              borderColor={BRANDCOLOR}
              width="95%"
              image={GOOGLE}
            />

            <TextInputComponent
              placeholder="Twitter Link"
              type="url"
              keyboardType="url"
              autoCapitalize="none"
              inputdata={twitter}
              setInputdata={setTwitter}
              borderColor={BRANDCOLOR}
              width="95%"
              image={TWITTER}
            />

            <TextInputComponent
              placeholder="LinkedIn Link"
              type="url"
              keyboardType="url"
              autoCapitalize="none"
              inputdata={linkedIn}
              setInputdata={setLinkedIn}
              borderColor={BRANDCOLOR}
              width="95%"
              image={LINKEDIN}
            />

            <TextInputComponent
              placeholder="Pinterest Link"
              type="url"
              keyboardType="url"
              autoCapitalize="none"
              inputdata={pinterest}
              setInputdata={setPinterest}
              borderColor={BRANDCOLOR}
              width="95%"
              image={PRINTREST}
            />

            <TextInputComponent
              placeholder="Instagram Link"
              type="url"
              keyboardType="url"
              autoCapitalize="none"
              inputdata={instagram}
              setInputdata={setInstagram}
              borderColor={BRANDCOLOR}
              width="95%"
              image={INSTAGRAM}
            />

            {/* ========== STATUS SECTION ========== */}
            <View style={styles.sectionHeadingContainer}>
              <MaterialCommunityIcons name="information" size={24} color={BRANDCOLOR} />
              <Text style={styles.sectionHeading}>Job Status</Text>
            </View>

            <View style={styles.statusContainer}>
              <Text style={styles.statusLabel}>Status:</Text>
              <View style={styles.statusToggleContainer}>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    status === "active" && styles.statusButtonActive,
                  ]}
                  onPress={() => setStatus("active")}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.statusButtonText,
                      status === "active" && styles.statusButtonTextActive,
                    ]}
                  >
                    Active
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    status === "inactive" && styles.statusButtonInactive,
                  ]}
                  onPress={() => setStatus("inactive")}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.statusButtonText,
                      status === "inactive" && styles.statusButtonTextInactive,
                    ]}
                  >
                    Inactive
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
      </ScrollView>

          <View style={styles.modalButtons}>
            <CustomButton
              text="Cancel"
              onPress={onClose}
              backgroundColor="#E0E0E0"
              color={BLACK}
              width="45%"
              disabled={isUpdating}
            />
            <CustomButton
              text={isUpdating ? "Updating..." : "Save"}
              onPress={handleSave}
              backgroundColor={BRANDCOLOR}
              color={WHITE}
              width="45%"
              disabled={isUpdating}
            />
    </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// Recommended Job Card (Square, 2-column grid, NO apply/wishlist buttons)
const RecommendedJobCard = ({ item, onPress }) => {
  const logoUrl = item.company_logo || item.companyLogoUrl 
    ? ((item.company_logo || item.companyLogoUrl).startsWith('http://') || (item.company_logo || item.companyLogoUrl).startsWith('https://') 
        ? (item.company_logo || item.companyLogoUrl) 
        : `${BASE_URL.replace('/api/', '/')}${(item.company_logo || item.companyLogoUrl).replace(/^\//, '')}`)
    : null;

  return (
    <TouchableOpacity 
      style={styles.recommendedCard} 
      onPress={() => onPress(item)} 
      activeOpacity={0.7}
    >
      {logoUrl ? (
        <Image source={{ uri: logoUrl }} style={styles.recommendedCardLogo} defaultSource={LOGO} />
      ) : (
        <Image source={LOGO} style={styles.recommendedCardLogo} />
      )}
      <Text style={styles.recommendedCardCompany} numberOfLines={1}>
        {item.company_name || item.companyName || 'N/A'}
      </Text>
      <Text style={styles.recommendedCardTitle} numberOfLines={2}>
        {item.job_title || item.jobTitle || 'N/A'}
      </Text>
      {(item.job_type || item.jobType) && (
        <View style={styles.recommendedCardInfoRow}>
          <MaterialCommunityIcons name="briefcase-outline" size={WIDTH * 0.03} color={BRANDCOLOR} />
          <Text style={styles.recommendedCardJobType} numberOfLines={1}>
            {formatJobType(item.job_type || item.jobType)}
          </Text>
        </View>
      )}
      {(item.state || item.city) && (
        <View style={styles.recommendedCardInfoRow}>
          <MaterialCommunityIcons name="map-marker-outline" size={WIDTH * 0.03} color={BRANDCOLOR} />
          <Text style={styles.recommendedCardLocation} numberOfLines={1}>
            {formatLocation(item.state, item.city)}
          </Text>
        </View>
      )}
      <View style={styles.recommendedCardInfoRow}>
        <MaterialCommunityIcons name="currency-inr" size={WIDTH * 0.03} color={BRANDCOLOR} />
      <Text style={styles.recommendedCardSalary} numberOfLines={1}>
          {formatSalary(item.salary_range || item.salaryRange)}
      </Text>
      </View>
    </TouchableOpacity>
  );
};

// Latest Job Card (Square, 2-column grid, NO apply/wishlist buttons)
const LatestJobCard = ({ item, onPress }) => {
  const logoUrl = item.company_logo || item.logo 
    ? ((item.company_logo || item.logo).startsWith('http://') || (item.company_logo || item.logo).startsWith('https://') 
        ? (item.company_logo || item.logo) 
        : `${BASE_URL.replace('/api/', '/')}${(item.company_logo || item.logo).replace(/^\//, '')}`)
    : null;

  return (
    <TouchableOpacity 
      style={styles.latestCard} 
      onPress={() => onPress(item)} 
      activeOpacity={0.7}
    >
      {logoUrl ? (
        <Image source={{ uri: logoUrl }} style={styles.latestCardLogo} defaultSource={LOGO} />
      ) : (
        <Image source={LOGO} style={styles.latestCardLogo} />
      )}
      <Text style={styles.latestCardCompany} numberOfLines={1}>
        {item.company_name || item.company || 'N/A'}
      </Text>
      <Text style={styles.latestCardTitle} numberOfLines={2}>
        {item.job_title || item.title || 'N/A'}
      </Text>
      {(item.job_type || item.jobType) && (
        <View style={styles.latestCardInfoRow}>
          <MaterialCommunityIcons name="briefcase-outline" size={WIDTH * 0.03} color={BRANDCOLOR} />
          <Text style={styles.latestCardJobType} numberOfLines={1}>
            {formatJobType(item.job_type || item.jobType)}
          </Text>
        </View>
      )}
      {(item.state || item.city) && (
        <View style={styles.latestCardInfoRow}>
          <MaterialCommunityIcons name="map-marker-outline" size={WIDTH * 0.03} color={BRANDCOLOR} />
          <Text style={styles.latestCardLocation} numberOfLines={1}>
            {formatLocation(item.state, item.city)}
          </Text>
        </View>
      )}
      <View style={styles.latestCardInfoRow}>
        <MaterialCommunityIcons name="currency-inr" size={WIDTH * 0.03} color={BRANDCOLOR} />
      <Text style={styles.latestCardSalary} numberOfLines={1}>
          {formatSalary(item.salary_range || item.salary || item.salaryRange)}
      </Text>
      </View>
    </TouchableOpacity>
  );
};

const CompanyCard = ({ item }) => {
  const logo = item.company_logo || item.logo || item.logoUrl || item.companyLogo;
  const logoUrl = logo
    ? (logo.startsWith('http://') || logo.startsWith('https://')
        ? logo
        : `${BASE_URL.replace('/api/', '/')}${logo.replace(/^\//, '')}`)
    : null;
  const industryText = typeof item?.industry === "string" && item.industry.trim()
    ? item.industry.trim().charAt(0).toUpperCase() + item.industry.trim().slice(1).toLowerCase()
    : "";
  const companyName = item.company_name || item.company || item.name || industryText || 'N/A';
  const locationText = getCompanyLocationText(item) || formatLocation(item.state, item.city);
  const openings = item.openings || item.no_of_vacancy || item.vacancy || item.jobs_count || item.total_jobs || item.total_job_openings || 0;
  const isVerified = item?.isVerified === true || item?.is_verified === true || String(item?.isVerified).toLowerCase() === "true";

  return (
    <View style={styles.companyCard}>
      {logoUrl ? (
        <Image source={{ uri: logoUrl }} style={styles.companyLogo} defaultSource={LOGO} />
      ) : (
        <Image source={LOGO} style={styles.companyLogo} />
      )}
      <View style={styles.companyNameRow}>
        <Text style={styles.companyName} numberOfLines={1}>{companyName}</Text>
        {isVerified ? (
          <Image source={VERIFIEDPROVIDER} style={styles.companyVerifiedIcon} />
        ) : null}
      </View>
      {locationText ? (
        <View style={styles.companyLocationRow}>
          <MaterialCommunityIcons name="map-marker-outline" size={WIDTH * 0.032} color={BRANDCOLOR} />
          <Text style={styles.companyMeta} numberOfLines={2}>{locationText}</Text>
        </View>
      ) : null}
      <Text style={styles.companyOpenings} numberOfLines={2}>
        {openings ? `${openings} openings` : 'No openings info'}
      </Text>
    </View>
  );
};

// Sponsorship Card
const SponsorshipCard = ({ item }) => {
  const logoUrl = item.company_logo || item.logo 
    ? ((item.company_logo || item.logo).startsWith('http://') || (item.company_logo || item.logo).startsWith('https://') 
        ? (item.company_logo || item.logo) 
        : `${BASE_URL.replace('/api/', '/')}${(item.company_logo || item.logo).replace(/^\//, '')}`)
    : null;

  return (
    <View style={styles.sponsorshipCard}>
      {logoUrl ? (
        <Image source={{ uri: logoUrl }} style={styles.sponsorshipCardLogo} defaultSource={LOGO} />
      ) : (
        <Image source={LOGO} style={styles.sponsorshipCardLogo} />
      )}
      <Text style={styles.sponsorshipCardCompany} numberOfLines={1}>
        {item.company_name || item.company || item.companyName || 'N/A'}
      </Text>
      <Text style={styles.sponsorshipCardTitle} numberOfLines={2}>
        {item.job_title || item.title || item.jobTitle || 'N/A'}
      </Text>
      {(item.job_type || item.jobType) && (
        <View style={styles.sponsorshipCardInfoRow}>
          <MaterialCommunityIcons name="briefcase-outline" size={WIDTH * 0.03} color={BRANDCOLOR} />
          <Text style={styles.sponsorshipCardJobType} numberOfLines={1}>
            {formatJobType(item.job_type || item.jobType)}
          </Text>
        </View>
      )}
      {(item.state || item.city) && (
        <View style={styles.sponsorshipCardInfoRow}>
          <MaterialCommunityIcons name="map-marker-outline" size={WIDTH * 0.03} color={BRANDCOLOR} />
          <Text style={styles.sponsorshipCardLocation} numberOfLines={1}>
            {formatLocation(item.state, item.city)}
          </Text>
        </View>
      )}
      <View style={styles.sponsorshipCardInfoRow}>
        <MaterialCommunityIcons name="currency-inr" size={WIDTH * 0.03} color={BRANDCOLOR} />
      <Text style={styles.sponsorshipCardSalary} numberOfLines={1}>
          {formatSalary(item.salary_range || item.salary || item.salaryRange)}
      </Text>
      </View>
    </View>
  );
};

// Category Card
const CategoryCard = ({ item, onPress }) => {
  const formatCategoryName = (category) => {
    if (!category) return 'N/A';
    
    // Check if category is one of the "Other" sub-categories
    const categoryLower = category.toLowerCase().replace(/_/g, ' ');
    if (categoryLower.includes('cook') || categoryLower.includes('security guard') || categoryLower.includes('security_guard') || categoryLower.includes('supervisor') || categoryLower.includes('plumber')) {
      return 'Other';
    }
    
    // If it's already "other", return "Other"
    if (categoryLower === 'other' || categoryLower.trim() === 'other') {
      return 'Other';
    }
    
    let formatted = category.replace(/_/g, ' ');
    const words = formatted.split(' ');
    const capitalizedWords = words.map(word => {
      const trimmedWord = word.trim();
      if (trimmedWord.length <= 3 && trimmedWord.toUpperCase() === trimmedWord) {
        return trimmedWord.toUpperCase();
      } else if (trimmedWord.length <= 3) {
        return trimmedWord.toUpperCase();
      } else {
        return trimmedWord.charAt(0).toUpperCase() + trimmedWord.slice(1).toLowerCase();
      }
    });
    return capitalizedWords.join(' ');
  };

  const getCategoryIcon = (category) => {
    const categoryLower = (category || '').toLowerCase().replace(/_/g, ' ');
    if (categoryLower.includes('mechanical') || categoryLower.includes('mechanic')) {
      return MECHANICAL;
    } else if (categoryLower.includes('health') || categoryLower.includes('medical') || categoryLower.includes('healthcare')) {
      return HEALTHCARE;
    } else if (categoryLower.includes('information technology') || categoryLower.includes('information_technology')) {
      return INFORMATIONTECHNOLOGY;
    } else if (categoryLower.includes('education') || categoryLower.includes('teach')) {
      return EDUCATION;
    } else if (categoryLower.includes('finance') || categoryLower.includes('account')) {
      return FINANCE;
    } else if (categoryLower.includes('hardware')) {
      return HARDWARE;
    } else if (categoryLower === 'it' || categoryLower.trim() === 'it' || categoryLower.includes('software') || categoryLower.includes('tech')) {
      return IT;
    } else if (categoryLower.includes('marketing')) {
      return MARKETING;
    } else if (categoryLower === 'other' || categoryLower.includes('cook') || categoryLower.includes('security guard') || categoryLower.includes('security_guard') || categoryLower.includes('supervisor') || categoryLower.includes('plumber')) {
      return OTHERS;
    } else {
      return CATAGORY;
    }
  };

  return (
    <TouchableOpacity style={styles.categoryCard} onPress={() => onPress(item)} activeOpacity={0.7}>
      <View style={styles.categoryIconContainer}>
        <Image 
          source={getCategoryIcon(item.category)} 
          style={styles.categoryIcon}
        />
      </View>
      <Text style={styles.categoryName} numberOfLines={2}>
        {formatCategoryName(item.category)}
      </Text>
      <Text style={styles.categoryJobCount}>
        {item.job_count || 0} Jobs
      </Text>
    </TouchableOpacity>
  );
};

// All Categories Slider
const AllCategoriesSlider = ({ categories, onCategoryPress }) => {
  const scrollViewRef = React.useRef(null);
  const scrollPositionRef = React.useRef(0);
  const animationRef = React.useRef(null);

  const formatCategoryName = (category) => {
    if (!category) return 'N/A';
    
    // Check if category is one of the "Other" sub-categories
    const categoryLower = category.toLowerCase().replace(/_/g, ' ');
    if (categoryLower.includes('cook') || categoryLower.includes('security guard') || categoryLower.includes('security_guard') || categoryLower.includes('supervisor') || categoryLower.includes('plumber')) {
      return 'Other';
    }
    
    // If it's already "other", return "Other"
    if (categoryLower === 'other' || categoryLower.trim() === 'other') {
      return 'Other';
    }
    
    let formatted = category.replace(/_/g, ' ');
    const words = formatted.split(' ');
    const capitalizedWords = words.map(word => {
      const trimmedWord = word.trim();
      if (trimmedWord.length <= 3 && trimmedWord.toUpperCase() === trimmedWord) {
        return trimmedWord.toUpperCase();
      } else if (trimmedWord.length <= 3) {
        return trimmedWord.toUpperCase();
      } else {
        return trimmedWord.charAt(0).toUpperCase() + trimmedWord.slice(1).toLowerCase();
      }
    });
    return capitalizedWords.join(' ');
  };

  const getCategoryIcon = (category) => {
    const categoryLower = (category || '').toLowerCase().replace(/_/g, ' ');
    if (categoryLower.includes('mechanical') || categoryLower.includes('mechanic')) {
      return MECHANICAL;
    } else if (categoryLower.includes('health') || categoryLower.includes('medical') || categoryLower.includes('healthcare')) {
      return HEALTHCARE;
    } else if (categoryLower.includes('information technology') || categoryLower.includes('information_technology')) {
      return INFORMATIONTECHNOLOGY;
    } else if (categoryLower.includes('education') || categoryLower.includes('teach')) {
      return EDUCATION;
    } else if (categoryLower.includes('finance') || categoryLower.includes('account')) {
      return FINANCE;
    } else if (categoryLower.includes('hardware')) {
      return HARDWARE;
    } else if (categoryLower === 'it' || categoryLower.trim() === 'it' || categoryLower.includes('software') || categoryLower.includes('tech')) {
      return IT;
    } else if (categoryLower.includes('marketing')) {
      return MARKETING;
    } else if (categoryLower === 'other' || categoryLower.includes('cook') || categoryLower.includes('security guard') || categoryLower.includes('security_guard') || categoryLower.includes('supervisor') || categoryLower.includes('plumber')) {
      return OTHERS;
    } else {
      return CATAGORY;
    }
  };

  const duplicatedCategories = [...categories, ...categories, ...categories];

  React.useEffect(() => {
    if (categories.length === 0) return;

    const cardWidth = (WIDTH * 0.92 - WIDTH * 0.02) / 2 + WIDTH * 0.02;
    const singleSetWidth = cardWidth * categories.length;
    
    animationRef.current = setInterval(() => {
      if (scrollViewRef.current) {
        scrollPositionRef.current += 1;
        if (scrollPositionRef.current >= singleSetWidth) {
          scrollPositionRef.current = 0;
        }
        scrollViewRef.current.scrollTo({ 
          x: scrollPositionRef.current, 
          animated: false 
        });
      }
    }, 20);

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [categories.length]);

  if (categories.length === 0) {
    return null;
  }

  return (
    <View style={styles.allCategoriesSliderContainer}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
      >
        <View style={styles.allCategoriesSliderContent}>
          {duplicatedCategories.map((item, index) => (
            <TouchableOpacity 
              key={`${item.category}-${index}`} 
              style={styles.allCategoryCard} 
              onPress={() => onCategoryPress(item)}
              activeOpacity={0.7}
            >
              <View style={styles.allCategoryIconContainer}>
                <Image 
                  source={getCategoryIcon(item.category)} 
                  style={styles.allCategoryIcon}
                />
              </View>
              <Text style={styles.allCategoryName} numberOfLines={2}>
                {formatCategoryName(item.category)}
              </Text>
              <Text style={styles.allCategoryJobCount}>
                {item.job_count || 0} Jobs
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

// Cities Section Component
const CitiesSection = ({ navigation }) => {
  const [cityJobCounts, setCityJobCounts] = useState({});
  const [loading, setLoading] = useState(true);

  const cities = [
    { name: 'Bhubaneswar', image: BHUBANESWAR },
    { name: 'Mumbai', image: MUMBAI },
    { name: 'Ahmedabad', image: AHAMEDABAD },
    { name: 'Bangalore', image: BANGALORE },
    { name: 'Hyderabad', image: HYDREBAD },
    { name: 'Kolkata', image: KOLKATA },
  ];

  // Fetch job counts by city
  useEffect(() => {
    const fetchCityJobCounts = async () => {
      try {
        setLoading(true);
        const url = `${BASE_URL}jobs`;
        const result = await GETNETWORK(url, false);
        
        if (result && !result.message) {
          const allJobs = result?.data || result?.jobs || result?.list || result || [];
          const jobsArray = Array.isArray(allJobs) ? allJobs : [];
          
          // Count jobs by city
          const counts = {};
          cities.forEach(city => {
            const cityNameLower = city.name.toLowerCase();
            const count = jobsArray.filter((job) => {
              const jobCity = (job.city || '').toLowerCase();
              return jobCity.includes(cityNameLower) || cityNameLower.includes(jobCity);
            }).length;
            counts[city.name] = count;
          });
          
          setCityJobCounts(counts);
        } else {
          // Set default counts if API fails
          const defaultCounts = {};
          cities.forEach(city => {
            defaultCounts[city.name] = 0;
          });
          setCityJobCounts(defaultCounts);
        }
      } catch (error) {
        // Set default counts on error
        const defaultCounts = {};
        cities.forEach(city => {
          defaultCounts[city.name] = 0;
        });
        setCityJobCounts(defaultCounts);
      } finally {
        setLoading(false);
      }
    };

    fetchCityJobCounts();
  }, []);

  const handleCityPress = (cityName) => {
    // Navigate to CompanyDetailsJobScreen with city name as filter
    navigation.navigate('CompanyDetailsJob', { cityName: cityName });
  };

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Get your jobs through the City</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.citiesScrollContent}
      >
        {cities.map((city, index) => {
          const jobCount = cityJobCounts[city.name] || 0;
          return (
            <TouchableOpacity 
              key={city.name}
              style={styles.cityCard}
              activeOpacity={0.7}
              onPress={() => handleCityPress(city.name)}
            >
              <View style={styles.cityImageContainer}>
                <Image source={city.image} style={styles.cityImage} resizeMode="cover" />
                {/* Job count at top left - no white overlay */}
                <View style={styles.cityJobCountTopLeft}>
                  <MaterialCommunityIcons name="briefcase" size={WIDTH * 0.035} color={BRANDCOLOR} />
                  <Text style={styles.cityJobCountText}>{jobCount} JOBS</Text>
                </View>
                {/* Right arrow icon on top right */}
                <TouchableOpacity 
                  style={styles.cityArrowButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleCityPress(city.name);
                  }}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="arrow-right" size={WIDTH * 0.05} color={BRANDCOLOR} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

// Poster Section Component
const PosterSection = () => {
  return (
    <View style={styles.posterContainer}>
      <View style={styles.posterGradient}>
        <View style={styles.posterContent}>
          <View style={styles.posterIconContainer}>
            <MaterialCommunityIcons name="chart-line" size={WIDTH * 0.12} color={WHITE} />
          </View>
          <Text style={styles.posterTitle}>70% hiring happen any Job post</Text>
          <Text style={styles.posterSlogan}>Find your dream job today!</Text>
          <Text style={styles.posterSlogan}>Join thousands of successful candidates</Text>
          <View style={styles.posterBadge}>
            <MaterialCommunityIcons name="star" size={WIDTH * 0.04} color={WHITE} />
            <Text style={styles.posterBadgeText}>Trusted by 10,000+ Job Seekers</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const HomeScreen = ({ navigation }) => {
  const nav = useNavigation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [loginPromptVisible, setLoginPromptVisible] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteAlertVisible, setDeleteAlertVisible] = useState(false);
  const [exitAlertVisible, setExitAlertVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [toastMessage, setToastMessage] = useState({
    type: "",
    msg: "",
    visible: false,
  });

  // Profile completion alert state
  const [profileCompletionAlertVisible, setProfileCompletionAlertVisible] = useState(false);
  const [profileCompletionPercentage, setProfileCompletionPercentage] = useState(100);
  const [profileCompletionCheckDone, setProfileCompletionCheckDone] = useState(false);

  // New state for recommended jobs, latest jobs, sponsorships, categories
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [latestJobs, setLatestJobs] = useState([]);
  const [sponsorships, setSponsorships] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [loadingRecommended, setLoadingRecommended] = useState(false);
  const [loadingLatest, setLoadingLatest] = useState(false);
  const [loadingSponsorships, setLoadingSponsorships] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [companyList, setCompanyList] = useState([]);
  const [companyPage, setCompanyPage] = useState(1);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [companyLoadingMore, setCompanyLoadingMore] = useState(false);
  const [companyHasMore, setCompanyHasMore] = useState(true);
  const companyScrollRef = React.useRef(null);
  const companyScrollIndexRef = React.useRef(0);

  // Static companies data
  const companies = [
    { name: "Mukti", logo: require("../../../assets/images/mukti.png"), location: "Bhubaneswar, Odisha", openings: 5, isVerified: true },
    { name: "Vikash", logo: require("../../../assets/images/vikash.png"), location: "Bhubaneswar, Odisha", openings: 4, isVerified: true },
    { name: "VDeal", logo: require("../../../assets/images/vdeal.png"), location: "Mumbai, Maharashtra", openings: 3, isVerified: false },
    { name: "Yubi", logo: require("../../../assets/images/yubi.png"), location: "Bengaluru, Karnataka", openings: 6, isVerified: true },
    { name: "GC", logo: require("../../../assets/images/gc2.png"), location: "Kolkata, West Bengal", openings: 2, isVerified: false },
    { name: "UptulaSoft", logo: require("../../../assets/images/uptulasoft1.png"), location: "Bhubaneswar, Odisha", openings: 7, isVerified: true },
    { name: "Vikash Foundation", logo: require("../../../assets/images/vf.png"), location: "Puri, Odisha", openings: 1, isVerified: false },
  ];

  const topCompanies = companies;
  const featuredCompanies = companies;
  const sponsorCompanies = companies;

  // Fetch jobs from API
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const url = `${BASE_URL}employer/jobs`;
      // console.log('Fetching jobs:', url);
      
      // Get token from storage
      const loginResponse = await getObjByKey('loginResponse');
      if (!loginResponse || !loginResponse.token) {
        // console.error('❌ Error: No token found in loginResponse');
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      const result = await GETNETWORK(url, true);
      // console.log('Jobs response:', JSON.stringify(result, null, 2));
      
      // Handle different response structures
      let jobsData = [];
      if (Array.isArray(result)) {
        jobsData = result;
      } else if (result?.data && Array.isArray(result.data)) {
        jobsData = result.data;
      } else if (result?.jobs && Array.isArray(result.jobs)) {
        jobsData = result.jobs;
      } else if (result?.data?.jobs && Array.isArray(result.data.jobs)) {
        jobsData = result.data.jobs;
      }
      
      if (jobsData && jobsData.length > 0) {
        // console.log('✅ Success: Jobs fetched successfully');
        // console.log('Total jobs:', jobsData.length);
        setJobs(jobsData.map(normalizeJobSocialFields));
      } else {
        // console.log('ℹ️ Info: No jobs found');
        setJobs([]);
      }
    } catch (error) {
      // console.error('❌ Error fetching jobs:', error);
      setJobs([]);
      setToastMessage({
        type: "error",
        msg: "Failed to load jobs. Please try again.",
        visible: true,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch jobs and companies on component mount
  useEffect(() => {
    fetchJobs();
    fetchCompanies();
  }, [fetchJobs, fetchCompanies]);

  // Calculate profile completion percentage
  const calculateCompletionPercentage = useCallback((profileData) => {
    if (!profileData) return 0;

    let percentage = 0;

    // Helper function to check if field is truly filled
    const isFieldFilled = (field) => {
      if (!field) return false;
      const strValue = String(field).trim();
      return strValue !== '' && strValue !== 'N/A';
    };

    // Company Details Section: 20% (if companyName, email, phone are filled)
    const companyDetailsFields = [
      profileData.companyName || profileData.company_name,
      profileData.email,
      profileData.phone || profileData.phoneNumber || profileData.phone_number
    ];
    const companyDetailsFilled = companyDetailsFields.filter(isFieldFilled).length;
    if (companyDetailsFilled === companyDetailsFields.length) {
      percentage += 20;
    }

    // Profile Picture: 10% (if companyLogo is set)
    const companyLogo = profileData.companyLogo || profileData.company_logo || profileData.logo;
    if (companyLogo) {
      const hasLogo = companyLogo.uri ? true : (typeof companyLogo === 'string' && companyLogo.trim() !== '');
      if (hasLogo) {
        percentage += 10;
      }
    }

    // Company Information Section: 15% (if address, city, state are filled)
    const companyInfoFields = [
      profileData.address,
      profileData.city,
      profileData.state || profileData.state_name
    ];
    const companyInfoFilled = companyInfoFields.filter(isFieldFilled).length;
    if (companyInfoFilled === companyInfoFields.length) {
      percentage += 15;
    }

    // Company Description: 10% (if description/about is filled)
    if (isFieldFilled(profileData.description || profileData.about || profileData.company_description)) {
      percentage += 10;
    }

    // Website: 5% (if website is filled)
    if (isFieldFilled(profileData.website || profileData.website_url)) {
      percentage += 5;
    }

    // Social Media Links: 10% (if at least one social link is filled)
    const socialLinks = [
      profileData.facebook || profileData.facebook_url,
      profileData.twitter || profileData.twitter_url,
      profileData.linkedin || profileData.linkedin_url,
      profileData.instagram || profileData.instagram_url
    ];
    const filledSocialLinks = socialLinks.filter(isFieldFilled).length;
    if (filledSocialLinks > 0) {
      percentage += 10;
    }

    // Company Size: 5% (if company size/employees is filled)
    if (isFieldFilled(profileData.companySize || profileData.company_size || profileData.employees)) {
      percentage += 5;
    }

    // Industry: 5% (if industry/category is filled)
    if (isFieldFilled(profileData.industry || profileData.category)) {
      percentage += 5;
    }

    // Founded Year: 5% (if founded year is filled)
    if (isFieldFilled(profileData.foundedYear || profileData.founded_year)) {
      percentage += 5;
    }

    return Math.min(Math.round(percentage), 100);
  }, []);

  // Check profile completion and show alert if not complete
  const checkProfileCompletion = useCallback(async () => {
    try {
      const token = await getObjByKey("loginResponse");
      if (!token) {
        return;
      }

      const url = `${BASE_URL}employer/profile`;
      const result = await GETNETWORK(url, true);

      if (result && !result.message) {
        const profileData = result?.profile || result?.data || result?.user || result || {};
        const completionPercentage = calculateCompletionPercentage(profileData);
        setProfileCompletionPercentage(completionPercentage);

        // Show alert only if profile is not 100% complete and not already checked
        if (completionPercentage < 100 && !profileCompletionCheckDone) {
          setProfileCompletionAlertVisible(true);
          setProfileCompletionCheckDone(true);
        }
      }
    } catch (error) {
      // Silently fail
    }
  }, [calculateCompletionPercentage, profileCompletionCheckDone]);

  // Fetch recommended jobs
  const fetchRecommendedJobs = useCallback(async () => {
    try {
      setLoadingRecommended(true);
      const url = `${BASE_URL}jobs`;
      const result = await GETNETWORK(url, false);
      
      if (result && !result.message) {
        const jobs = result?.data || result?.jobs || result?.list || result || [];
        setRecommendedJobs(Array.isArray(jobs) ? jobs.map(normalizeJobSocialFields) : []);
      } else {
        setRecommendedJobs([]);
      }
    } catch (error) {
      setRecommendedJobs([]);
    } finally {
      setLoadingRecommended(false);
    }
  }, []);

  // Fetch latest jobs
  const fetchLatestJobs = useCallback(async () => {
    try {
      setLoadingLatest(true);
      const url = `${BASE_URL}jobs/latest`;
      const result = await GETNETWORK(url, false);
      
      if (result && !result.message) {
        const jobs = result?.data || result?.jobs || result?.list || result || [];
        setLatestJobs(Array.isArray(jobs) ? jobs.map(normalizeJobSocialFields) : []);
      } else {
        setLatestJobs([]);
      }
    } catch (error) {
      setLatestJobs([]);
    } finally {
      setLoadingLatest(false);
    }
  }, []);

  // Fetch sponsorships
  const fetchSponsorships = useCallback(async () => {
    try {
      setLoadingSponsorships(true);
      const url = `${BASE_URL}sponsorships`;
      const result = await GETNETWORK(url, true);
      
      if (result && !result.message) {
        const sponsorshipsData = result?.data || result?.sponsorships || result?.list || result || [];
        setSponsorships(Array.isArray(sponsorshipsData) ? sponsorshipsData.map(normalizeJobSocialFields) : []);
      } else {
        setSponsorships([]);
      }
    } catch (error) {
      setSponsorships([]);
    } finally {
      setLoadingSponsorships(false);
    }
  }, []);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      const url = `${BASE_URL}jobs/categories`;
      const result = await GETNETWORK(url, false);
      
      if (result && !result.message) {
        const categoriesData = result?.data || result?.categories || result?.list || result || [];
        const categoriesArray = Array.isArray(categoriesData) ? categoriesData : [];
        setCategories(categoriesArray);
        setAllCategories(categoriesArray);
      } else {
        setCategories([]);
        setAllCategories([]);
      }
    } catch (error) {
      setCategories([]);
      setAllCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  const fetchCompanies = useCallback(async (page = 1, refreshing = false) => {
    try {
      if (refreshing) {
        setCompanyLoading(true);
      } else if (page === 1) {
        setCompanyLoading(true);
      } else {
        setCompanyLoadingMore(true);
      }

      const url = `${BASE_URL}companies?page=${page}&limit=10`;
      const result = await GETNETWORK(url, false);
      const companiesData = Array.isArray(result)
        ? result
        : result?.data || result?.companies || result?.list || [];

      const companyArray = Array.isArray(companiesData) ? companiesData : [];
      const hasMoreItems = companyArray.length === 10;

      if (page === 1) {
        setCompanyList(companyArray);
      } else {
        setCompanyList((prev) => [...prev, ...companyArray]);
      }

      setCompanyHasMore(hasMoreItems);
    } catch (error) {
      if (page === 1) {
        setCompanyList([]);
      }
      setCompanyHasMore(false);
    } finally {
      setCompanyLoading(false);
      setCompanyLoadingMore(false);
    }
  }, []);

  const loadMoreCompanies = useCallback(() => {
    if (!companyLoading && !companyLoadingMore && companyHasMore) {
      const nextPage = companyPage + 1;
      setCompanyPage(nextPage);
      fetchCompanies(nextPage);
    }
  }, [companyHasMore, companyLoading, companyLoadingMore, companyPage, fetchCompanies]);

  const handleScroll = useCallback(({ nativeEvent }) => {
    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
    const paddingToBottom = 100;
    if (
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom
    ) {
      loadMoreCompanies();
    }
  }, [loadMoreCompanies]);

  // Refetch jobs when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // console.log('Screen focused - Refetching jobs');
      fetchJobs();
      fetchCompanies();
      fetchRecommendedJobs();
      fetchLatestJobs();
      fetchSponsorships();
      fetchCategories();
      checkProfileCompletion();
    }, [fetchJobs, fetchCompanies, fetchRecommendedJobs, fetchLatestJobs, fetchSponsorships, fetchCategories, checkProfileCompletion])
  );

  // Request location permission
  const requestLocationPermission = async () => {
    if (Platform.OS === "android") {
      try {
        // Check if permission is already granted
        const fineLocationGranted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        const coarseLocationGranted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
        );

        if (fineLocationGranted && coarseLocationGranted) {
          return true;
        }

        // Request permissions
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ]);

        if (
          granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] ===
            PermissionsAndroid.RESULTS.GRANTED
        ) {
          return true;
        } else {
          Alert.alert(
            "Location Permission Denied",
            "Please grant location permission to use location-based features. You can enable it in app settings.",
            [{ text: "OK" }]
          );
          return false;
        }
      } catch (err) {
        // console.warn("Location permission error:", err);
        return false;
      }
    } else {
      // iOS - permissions are handled through Info.plist
      // You can use react-native-geolocation-service or similar library for iOS
      return true;
    }
  };

  // Request location permission on component mount
  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (!companyList.length || !companyScrollRef.current) return;

    const interval = setInterval(() => {
      if (!companyList.length || !companyScrollRef.current) return;
      const nextIndex = (companyScrollIndexRef.current + 1) % companyList.length;
      companyScrollIndexRef.current = nextIndex;
      companyScrollRef.current.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [companyList]);

  // Handle back button press
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (searchOpen) {
        setSearchOpen(false);
        return true;
      }
      if (editModalVisible) {
        setEditModalVisible(false);
        return true;
      }
      if (deleteAlertVisible) {
        setDeleteAlertVisible(false);
        return true;
      }
      // Show exit confirmation
      setExitAlertVisible(true);
      return true;
    });

    return () => backHandler.remove();
  }, [searchOpen, editModalVisible, deleteAlertVisible]);

  const handleExitApp = () => {
    BackHandler.exitApp();
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchJobs(),
      fetchRecommendedJobs(),
      fetchLatestJobs(),
      fetchSponsorships(),
      fetchCategories(),
    ]);
    setRefreshing(false);
  }, [fetchJobs, fetchRecommendedJobs, fetchLatestJobs, fetchSponsorships, fetchCategories]);

  const requireAuth = async () => {
    const token = await getObjByKey("loginResponse");
    if (!token) {
      setLoginPromptVisible(true);
      return false;
    }
    return true;
  };

  const handleViewJob = (job) => {
    // Navigate to JobDetailsScreen with job data as params
    nav.navigate("JobDetails", { jobData: normalizeJobSocialFields(job) });
  };

  const handleEdit = (job) => {
    setSelectedJob(job);
    setEditModalVisible(true);
  };

  const handleDelete = (job) => {
    setSelectedJob(job);
    setDeleteAlertVisible(true);
  };

  const confirmDelete = async () => {
    if (!selectedJob) {
      // console.log('❌ Delete failed: No job selected');
      return;
    }

    try {
      // console.log('🔄 Starting job delete process...');
      
      // Get job ID
      const jobId = selectedJob.id || selectedJob.job_id || selectedJob._id;
      if (!jobId) {
        // console.error('❌ Error: No job ID found in selectedJob');
        // console.error('❌ Delete failed: Job ID is required');
        setToastMessage({
          type: "error",
          msg: "Job ID not found",
          visible: true,
        });
        setDeleteAlertVisible(false);
        setSelectedJob(null);
        return;
      }
      // console.log('✅ Job ID found:', jobId);

      // Get token from storage
      const loginResponse = await getObjByKey('loginResponse');
      if (!loginResponse || !loginResponse.token) {
        // console.error('❌ Error: No token found in loginResponse');
        // console.error('❌ Delete failed: Authentication token is missing');
        setToastMessage({
          type: "error",
          msg: "Authentication required",
          visible: true,
        });
        setDeleteAlertVisible(false);
        setSelectedJob(null);
        return;
      }
      // console.log('✅ Token found:', loginResponse.token.substring(0, 20) + '...');

      const url = `${BASE_URL}employer/jobs/${jobId}`;
      // console.log('📡 Delete URL:', url);
      
      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": `Bearer ${loginResponse.token}`,
        },
      });

      const result = await response.json();
      // console.log('📥 API Response:', JSON.stringify(result, null, 2));

      if (response.ok || result.statusCode === 200 || result.statusCode === 201) {
        // console.log('✅ SUCCESS: Job deleted successfully!');
        // console.log('✅ Deleted job ID:', jobId);
        
        // Remove job from list
        setJobs(jobs.filter((job) => {
          const currentJobId = job.id || job.job_id || job._id;
          return currentJobId !== jobId;
        }));
        setDeleteAlertVisible(false);
        setSelectedJob(null);
        
        // Show success toast
        setToastMessage({
          type: "success",
          msg: "Job deleted successfully!",
          visible: true,
        });
      } else {
        // console.error('❌ ERROR: Failed to delete job');
        // console.error('❌ Response status:', response.status);
        // console.error('❌ Response message:', result.message);
        // console.error('❌ Full response:', JSON.stringify(result, null, 2));
        
        setToastMessage({
          type: "error",
          msg: result.message || "Failed to delete job",
          visible: true,
        });
        setDeleteAlertVisible(false);
        setSelectedJob(null);
      }
    } catch (error) {
      // console.error('❌ ERROR: Exception occurred while deleting job');
      // console.error('❌ Error details:', error);
      // console.error('❌ Error message:', error.message);
      // console.error('❌ Error stack:', error.stack);
      
      setToastMessage({
        type: "error",
        msg: "Failed to delete job. Please try again.",
        visible: true,
      });
      setDeleteAlertVisible(false);
      setSelectedJob(null);
    } finally {
      // console.log('🏁 Job delete process completed');
    }
  };

  const formatSalaryForDisplay = (salaryRange) => {
    if (!salaryRange) return "Not specified";
    if (salaryRange === "Negotiable" || salaryRange.toLowerCase() === "negotiable") {
      return "Negotiable";
    }
    if (salaryRange.includes("-")) {
      const [min, max] = salaryRange.split("-");
      const minNum = parseInt(min);
      const maxNum = parseInt(max);
      // Format as ₹90k - ₹120k for display
      if (minNum >= 1000) {
        return `₹${(minNum / 1000).toFixed(0)}k - ₹${(maxNum / 1000).toFixed(0)}k`;
      }
      return `₹${minNum.toLocaleString()} - ₹${maxNum.toLocaleString()}`;
    }
    if (salaryRange.includes("+")) {
      const amount = parseInt(salaryRange.replace("+", ""));
      if (amount >= 1000) {
        return `₹${(amount / 1000).toFixed(0)}k+`;
      }
      return `₹${amount.toLocaleString()}+`;
    }
    const amount = parseInt(salaryRange);
    if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(0)}k`;
    }
    return `₹${amount.toLocaleString()}`;
  };

  const handleSaveJob = (updatedJob) => {
    // Format salary for display
    const formattedSalary = formatSalaryForDisplay(updatedJob.salaryRange);
    const jobWithFormattedSalary = {
      ...updatedJob,
      salary: formattedSalary,
    };
    
    // Update job in list
    setJobs(jobs.map((job) => (job.id === updatedJob.id ? jobWithFormattedSalary : job)));
    setEditModalVisible(false);
    setSelectedJob(null);
    
    // Show success toast
    setToastMessage({
      type: "success",
      msg: "Job updated successfully!",
      visible: true,
    });
  };

  const openDrawer = () => {
    // Try to open drawer - if user is authenticated, they're in DrawerNavigator
    // Method 1: Try to get drawer parent directly
    try {
      const drawerParent = nav.getParent('Drawer');
      if (drawerParent && typeof drawerParent.openDrawer === 'function') {
        drawerParent.openDrawer();
        return;
      }
    } catch (e) {
      // Continue to next method
    }
    
    // Method 2: Traverse up the parent chain to find drawer
    try {
      let parent = nav.getParent();
      let depth = 0;
      while (parent && depth < 5) {
        if (typeof parent.openDrawer === 'function') {
          parent.openDrawer();
          return;
        }
        parent = parent.getParent();
        depth++;
      }
    } catch (e) {
      // Continue to next method
    }
    
    // Method 3: Try to dispatch the action directly
    try {
      nav.dispatch(DrawerActions.openDrawer());
      return;
    } catch (error) {
      // Drawer not available - check if user is authenticated
      // If not authenticated, show login prompt
      getObjByKey("loginResponse").then((token) => {
        if (!token) {
          setLoginPromptVisible(true);
        } else {
          // User is authenticated but drawer didn't open - log for debugging
          // console.log('User authenticated but drawer not accessible');
        }
      });
    }
  };

  const handleProfileIconPress = () => {
    handleProfilePress(navigation, openDrawer);
  };

  const handleNotificationPress = () => {
    nav.navigate("ProviderNotifications");
  };

  const handleCategoryPress = (category) => {
    // Navigate to CategoriesScreen with category filter
    nav.navigate("CategoriesScreen", { category: category?.category || category });
  };

  const handleRecommendedJobPress = (item) => {
    // Navigate to job details (if needed)
    // console.log('Recommended job pressed:', item);
  };

  const handleLatestJobPress = (item) => {
    // Navigate to job details (if needed)
    // console.log('Latest job pressed:', item);
  };

  if (searchOpen) {
    return <SearchOverlay onClose={() => setSearchOpen(false)} navigation={nav} onExitRequest={() => setExitAlertVisible(true)} />;
  }

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
        <View style={[
          styles.headerSpacer,
          Platform.OS === "ios" && styles.headerSpacerIOS,
          Platform.OS === "android" && styles.headerSpacerAndroid
        ]} />
        <MyHeader
          showLogo={true}
          onProfilePress={handleProfileIconPress}
          onNotificationPress={handleNotificationPress}
        />

        <ScrollView 
          style={styles.listContainer}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={handleScroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[BRANDCOLOR]}
              tintColor={BRANDCOLOR}
            />
          }
        >
          <Text style={styles.sectionTitle}>Posted Jobs</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading jobs...</Text>
            </View>
          ) : jobs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No jobs posted yet</Text>
            </View>
          ) : (
            <FlatList
              data={jobs}
              keyExtractor={(item, index) => item?.id || item?._id || `job-${index}`}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <PostedJobCard
                  item={item}
                  onPress={handleViewJob}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              )}
            />
          )}

          {/* Recommended Jobs Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Recommended Jobs</Text>
            {loadingRecommended ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={BRANDCOLOR} />
                <Text style={styles.loadingText}>Loading jobs...</Text>
              </View>
            ) : recommendedJobs.length > 0 ? (
              <FlatList
                data={recommendedJobs}
                keyExtractor={(item, index) => item.id?.toString() || item._id?.toString() || index.toString()}
                numColumns={2}
                columnWrapperStyle={styles.row}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <RecommendedJobCard 
                    item={item} 
                    onPress={handleRecommendedJobPress}
                  />
                )}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No recommended jobs available</Text>
              </View>
          )}
      </View>

          {/* Latest Jobs Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Latest Jobs</Text>
            {loadingLatest ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={BRANDCOLOR} />
                <Text style={styles.loadingText}>Loading latest jobs...</Text>
              </View>
            ) : latestJobs.length > 0 ? (
              <FlatList
                data={latestJobs}
                keyExtractor={(item, index) => item.id?.toString() || item._id?.toString() || index.toString()}
                numColumns={2}
                columnWrapperStyle={styles.row}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <LatestJobCard 
                    item={item} 
                    onPress={handleLatestJobPress}
                  />
                )}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No latest jobs available</Text>
              </View>
            )}
          </View>

          {/* Dream Company section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.companySectionTitle}>Your Dream Company Is Hiring</Text>
            {companyLoading && companyList.length === 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={BRANDCOLOR} />
                <Text style={styles.loadingText}>Loading companies...</Text>
              </View>
            ) : companyList.length > 0 ? (
              <FlatList
                ref={companyScrollRef}
                data={companyList}
                keyExtractor={(item, index) => item.id?.toString() || item._id?.toString() || item.company_name || item.name || `company-${index}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToAlignment="start"
                decelerationRate="fast"
                snapToInterval={WIDTH * 0.45}
                contentContainerStyle={styles.companyCarouselContent}
                renderItem={({ item }) => <CompanyCard item={item} />}
                getItemLayout={(data, index) => ({
                  length: WIDTH * 0.45,
                  offset: WIDTH * 0.45 * index,
                  index,
                })}
                ListFooterComponent={companyLoadingMore ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={BRANDCOLOR} />
                  </View>
                ) : null}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No companies available</Text>
              </View>
            )}
          </View>

          {/* Sponsorships Section */}
          {sponsorships.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Sponsorships</Text>
              {loadingSponsorships ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={BRANDCOLOR} />
                  <Text style={styles.loadingText}>Loading sponsorships...</Text>
                </View>
              ) : (
                <FlatList
                  data={sponsorships}
                  keyExtractor={(item, index) => item.id?.toString() || item._id?.toString() || index.toString()}
                  numColumns={2}
                  columnWrapperStyle={styles.row}
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={false}
                  renderItem={({ item }) => (
                    <SponsorshipCard item={item} />
                  )}
                />
              )}
            </View>
          )}

          {/* All Categories Sliding Banner */}
          {allCategories.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>All Categories</Text>
              <AllCategoriesSlider 
                categories={allCategories} 
                onCategoryPress={handleCategoryPress}
              />
            </View>
          )}

          {/* Cities Section */}
          <CitiesSection navigation={navigation} />

          {/* Poster Section */}
          <PosterSection />
        </ScrollView>

      <MyAlert
        visible={loginPromptVisible}
        title="Login required"
        message="Please login or register to continue."
        textLeft="Login"
        textRight="Register"
        image={LOGO}
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

        {/* Delete Confirmation Alert */}
        <MyAlert
          visible={deleteAlertVisible}
          title="Delete Job"
          message="Are you sure you want to delete this job posting?"
          textLeft="Cancel"
          textRight="Delete"
          image={LOGO}
          onPressLeft={() => {
            setDeleteAlertVisible(false);
            setSelectedJob(null);
          }}
          onPressRight={confirmDelete}
          onRequestClose={() => {
            setDeleteAlertVisible(false);
            setSelectedJob(null);
          }}
        />

        {/* Exit App Confirmation Alert */}
        <MyAlert
          visible={exitAlertVisible}
          title="Exit App"
          message="Are you sure you want to exit the app?"
          textLeft="No"
          textRight="Yes"
          image={LOGO}
          onPressLeft={() => {
            setExitAlertVisible(false);
          }}
          onPressRight={handleExitApp}
          onRequestClose={() => {
            setExitAlertVisible(false);
          }}
        />

        {/* Profile Completion Alert */}
        <MyAlert
          visible={profileCompletionAlertVisible}
          title="Complete Your Profile"
          message={`Your profile is ${profileCompletionPercentage}% complete. Please update your profile to get better job matches.`}
          textLeft="Cancel"
          textRight="Update"
          showLeftButton
          showRightButton
          image={LOGO}
          onPressLeft={() => setProfileCompletionAlertVisible(false)}
          onPressRight={() => {
            setProfileCompletionAlertVisible(false);
            navigation.navigate("EditEmployerProfile", {
              onProfileUpdate: () => {
                setProfileCompletionCheckDone(false);
                checkProfileCompletion();
              },
            });
          }}
          onRequestClose={() => setProfileCompletionAlertVisible(false)}
        />


        {/* Edit Job Modal */}
        <EditJobModal
          visible={editModalVisible}
          jobData={selectedJob}
          onClose={() => {
            setEditModalVisible(false);
            setSelectedJob(null);
          }}
          onSave={handleSaveJob}
        />

        {/* Toast Message */}
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
      </Container>
    </>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WHITE,
    paddingHorizontal: WIDTH * 0.04,
  },
  containerIOS: {
    paddingHorizontal: Platform.OS === "ios" ? WIDTH * 0.042 : WIDTH * 0.04,
  },
  containerAndroid: {
    paddingHorizontal: Platform.OS === "android" ? WIDTH * 0.038 : WIDTH * 0.04,
  },
  headerSpacer: {
    height: HEIGHT * 0.02,
  },
  headerSpacerIOS: {
    height: Platform.OS === "ios" ? HEIGHT * 0.025 : HEIGHT * 0.02,
  },
  headerSpacerAndroid: {
    height: Platform.OS === "android" ? HEIGHT * 0.02 : HEIGHT * 0.02,
  },
  listContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: HEIGHT * 0.017,
    fontFamily: FIRASANSSEMIBOLD,
    color: BLACK,
    marginBottom: HEIGHT * 0.01,
    paddingHorizontal: WIDTH * 0.01,
  },
  card: {
    backgroundColor: WHITE,
    borderRadius: WIDTH * 0.03,
    marginBottom: HEIGHT * 0.015,
    marginHorizontal: WIDTH * 0.01,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  cardContent: {
    flexDirection: "row",
    padding: WIDTH * 0.03,
    position: "relative",
  },
  cardLogoContainer: {
    marginRight: WIDTH * 0.025,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  cardLogo: {
    width: WIDTH * 0.12,
    height: WIDTH * 0.12,
    borderRadius: WIDTH * 0.02,
    resizeMode: "contain",
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  cardBody: {
    flex: 1,
    paddingRight: WIDTH * 0.015,
  },
  cardTitle: {
    fontSize: HEIGHT * 0.018,
    fontFamily: UBUNTUBOLD,
    color: BLACK,
    marginBottom: HEIGHT * 0.006,
    lineHeight: HEIGHT * 0.022,
  },
  companyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: HEIGHT * 0.006,
  },
  companyIcon: {
    marginRight: WIDTH * 0.012,
  },
  cardSubtitle: {
    fontSize: HEIGHT * 0.014,
    color: "#666",
    fontFamily: FIRASANSSEMIBOLD,
    flex: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: HEIGHT * 0.006,
    flexWrap: "wrap",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: HEIGHT * 0.003,
    flex: 1,
  },
  cardMeta: {
    fontSize: HEIGHT * 0.013,
    color: BRANDCOLOR,
    marginLeft: WIDTH * 0.008,
    fontFamily: FIRASANSSEMIBOLD,
  },
  cardLocation: {
    fontSize: HEIGHT * 0.013,
    color: "#666",
    marginLeft: WIDTH * 0.008,
    fontFamily: FIRASANSSEMIBOLD,
  },
  salaryContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: HEIGHT * 0.003,
  },
  cardSalary: {
    fontSize: HEIGHT * 0.012,
    color: "#4CAF50",
    fontFamily: FIRASANSSEMIBOLD,
    marginLeft: WIDTH * 0.005,
  },
  cardActions: {
    alignItems: "center",
    justifyContent: "flex-start",
    gap: HEIGHT * 0.008,
    flexDirection: "column",
    paddingLeft: WIDTH * 0.015,
  },
  cardActionButton: {
    marginBottom: HEIGHT * 0.003,
  },
  actionButtonInner: {
    width: WIDTH * 0.08,
    height: WIDTH * 0.08,
    borderRadius: WIDTH * 0.015,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  editButton: {
    backgroundColor: BRANDCOLOR,
  },
  deleteButton: {
    backgroundColor: "#FF5252",
  },
  statusIndicatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: HEIGHT * 0.006,
    gap: WIDTH * 0.008,
  },
  statusDot: {
    width: WIDTH * 0.018,
    height: WIDTH * 0.018,
    borderRadius: WIDTH * 0.009,
  },
  statusText: {
    fontSize: HEIGHT * 0.012,
    fontFamily: FIRASANSSEMIBOLD,
    color: "#666",
    textTransform: "capitalize",
  },
  overlay: {
    flex: 1,
    backgroundColor: WHITE,
    padding: WIDTH * 0.04,
  },
  overlayHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: HEIGHT * 0.02,
    gap: WIDTH * 0.03,
    marginTop: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + HEIGHT * 0.005 : HEIGHT * 0.01,
  },
  overlayTitle: {
    fontSize: HEIGHT * 0.02,
    fontFamily: UBUNTUBOLD,
    color: BLACK,
  },
  inputGroup: {
    marginBottom: HEIGHT * 0.015,
  },
  inputLabel: {
    color: "#444",
    marginBottom: HEIGHT * 0.007,
    fontFamily: FIRASANSSEMIBOLD,
    fontSize: HEIGHT * 0.018,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E2E4E8",
    borderRadius: WIDTH * 0.025,
    paddingHorizontal: WIDTH * 0.03,
    paddingVertical: HEIGHT * 0.012,
    color: BLACK,
    fontSize: HEIGHT * 0.018,
  },
  searchButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BRANDCOLOR,
    borderRadius: WIDTH * 0.025,
    paddingVertical: HEIGHT * 0.015,
    marginBottom: HEIGHT * 0.015,
    gap: WIDTH * 0.02,
  },
  searchButtonText: {
    color: WHITE,
    fontFamily: UBUNTUBOLD,
    fontSize: HEIGHT * 0.018,
  },
  sectionContainer: {
    marginBottom: HEIGHT * 0.03,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: HEIGHT * 0.01,
  },
  viewAll: {
    color: BRANDCOLOR,
    fontFamily: FIRASANSSEMIBOLD,
    fontSize: HEIGHT * 0.018,
  },
  squareCard: {
    width: WIDTH * 0.3,
    height: WIDTH * 0.3,
    backgroundColor: "#F2F4F5",
    borderRadius: WIDTH * 0.03,
    marginRight: WIDTH * 0.025,
    justifyContent: "center",
    alignItems: "center",
    padding: WIDTH * 0.025,
  },
  squareCardText: {
    marginTop: HEIGHT * 0.01,
    fontFamily: FIRASANSSEMIBOLD,
    color: BLACK,
    textAlign: "center",
    fontSize: HEIGHT * 0.018,
  },
  squareCardTag: {
    marginTop: HEIGHT * 0.005,
    color: "#666",
    fontSize: HEIGHT * 0.016,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: WHITE,
    borderTopLeftRadius: WIDTH * 0.05,
    borderTopRightRadius: WIDTH * 0.05,
    maxHeight: "90%",
    paddingBottom: Platform.OS === "ios" ? HEIGHT * 0.025 : HEIGHT * 0.012,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: WIDTH * 0.04,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  modalTitle: {
    fontSize: HEIGHT * 0.02,
    fontFamily: UBUNTUBOLD,
    color: BLACK,
  },
  modalScrollContent: {
    padding: WIDTH * 0.025,
    paddingBottom: HEIGHT * 0.025,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: WIDTH * 0.04,
    paddingVertical: HEIGHT * 0.015,
    gap: WIDTH * 0.025,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
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
  pickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: WIDTH * 0.03,
    paddingLeft: WIDTH * 0.01,
  },
  picker: {
    flex: 1,
    color: BLACK,
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
  logoTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadIcon: {
    width: WIDTH * 0.06,
    height: WIDTH * 0.06,
    marginRight: WIDTH * 0.02,
    resizeMode: "contain",
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
    overflow: "hidden",
    minHeight: HEIGHT * 0.06,
  },
  logoBox: {
    width: "95%",
    height: HEIGHT * 0.15,
    borderWidth: 1,
    borderColor: BRANDCOLOR,
    borderRadius: WIDTH * 0.03,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: HEIGHT * 0.012,
    backgroundColor: WHITE,
  },
  logoText: {
    color: BLACK,
    fontSize: HEIGHT * 0.018,
  },
  logoImage: {
    width: WIDTH * 0.25,
    height: WIDTH * 0.25,
    resizeMode: "contain",
  },
  // View Job Details Modal Styles
  viewModalContainer: {
    flex: 1,
    backgroundColor: WHITE,
  },
  viewModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: WIDTH * 0.04,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + HEIGHT * 0.02 : HEIGHT * 0.02,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    backgroundColor: WHITE,
  },
  closeButton: {
    padding: WIDTH * 0.01,
  },
  viewModalTitle: {
    fontSize: HEIGHT * 0.02,
    fontFamily: UBUNTUBOLD,
    color: BLACK,
  },
  viewModalContent: {
    padding: WIDTH * 0.04,
    paddingBottom: HEIGHT * 0.12,
  },
  viewModalLogo: {
    width: WIDTH * 0.25,
    height: WIDTH * 0.25,
    borderRadius: WIDTH * 0.03,
    alignSelf: "center",
    marginBottom: HEIGHT * 0.025,
    resizeMode: "contain",
  },
  viewSection: {
    marginBottom: HEIGHT * 0.03,
    paddingBottom: HEIGHT * 0.02,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  viewSectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: HEIGHT * 0.02,
  },
  viewSectionIcon: {
    width: WIDTH * 0.06,
    height: WIDTH * 0.06,
    marginRight: WIDTH * 0.02,
    resizeMode: "contain",
  },
  viewSectionTitle: {
    fontSize: HEIGHT * 0.02,
    fontFamily: UBUNTUBOLD,
    color: BRANDCOLOR,
  },
  viewInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: HEIGHT * 0.015,
    flexWrap: "wrap",
  },
  viewInfoIcon: {
    width: WIDTH * 0.05,
    height: WIDTH * 0.05,
    marginRight: WIDTH * 0.02,
    resizeMode: "contain",
  },
  viewInfoLabel: {
    fontSize: HEIGHT * 0.018,
    fontFamily: FIRASANSSEMIBOLD,
    color: "#666",
    minWidth: WIDTH * 0.3,
    marginRight: WIDTH * 0.02,
  },
  viewInfoValue: {
    fontSize: HEIGHT * 0.018,
    color: BLACK,
    flex: 1,
    flexWrap: "wrap",
  },
  viewModalButtons: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: WIDTH * 0.04,
    paddingVertical: HEIGHT * 0.015,
    paddingBottom: Platform.OS === "ios" ? HEIGHT * 0.037 : HEIGHT * 0.015,
    backgroundColor: WHITE,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    gap: WIDTH * 0.025,
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: HEIGHT * 0.1,
  },
  emptyText: {
    fontSize: HEIGHT * 0.018,
    color: "#666",
    textAlign: "center",
    fontFamily: FIRASANSSEMIBOLD,
  },
  statusContainer: {
    marginHorizontal: WIDTH * 0.025,
    marginBottom: HEIGHT * 0.012,
    padding: WIDTH * 0.04,
    backgroundColor: "#F9FAFB",
    borderRadius: WIDTH * 0.03,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  statusLabel: {
    fontSize: HEIGHT * 0.018,
    fontFamily: FIRASANSSEMIBOLD,
    color: BLACK,
    marginBottom: HEIGHT * 0.012,
  },
  statusToggleContainer: {
    flexDirection: "row",
    gap: WIDTH * 0.03,
  },
  statusButton: {
    flex: 1,
    paddingVertical: HEIGHT * 0.012,
    borderRadius: WIDTH * 0.02,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: WHITE,
    alignItems: "center",
    justifyContent: "center",
  },
  statusButtonActive: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  statusButtonInactive: {
    backgroundColor: "#FF5252",
    borderColor: "#FF5252",
  },
  statusButtonText: {
    fontSize: HEIGHT * 0.016,
    fontFamily: FIRASANSSEMIBOLD,
    color: "#666",
  },
  statusButtonTextActive: {
    color: WHITE,
  },
  statusButtonTextInactive: {
    color: WHITE,
  },
  searchResultsContainer: {
    marginTop: HEIGHT * 0.02,
    flex: 1,
  },
  searchResultsTitle: {
    fontSize: HEIGHT * 0.02,
    fontFamily: FIRASANSSEMIBOLD,
    color: BLACK,
    marginBottom: HEIGHT * 0.01,
    paddingHorizontal: WIDTH * 0.01,
  },
  searchRow: {
    justifyContent: "space-between",
    marginBottom: HEIGHT * 0.015,
  },
  searchResultCard: {
    width: (WIDTH * 0.92 - WIDTH * 0.02) / 2,
    backgroundColor: "#F9FAFB",
    borderRadius: WIDTH * 0.03,
    padding: WIDTH * 0.03,
    marginBottom: HEIGHT * 0.015,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: WIDTH * 0.01,
    elevation: 2,
  },
  searchResultLogo: {
    width: WIDTH * 0.12,
    height: WIDTH * 0.12,
    borderRadius: WIDTH * 0.02,
    alignSelf: "center",
    marginBottom: HEIGHT * 0.01,
    resizeMode: "contain",
  },
  searchResultCompany: {
    fontSize: HEIGHT * 0.016,
    color: "#444",
    fontFamily: FIRASANSSEMIBOLD,
    textAlign: "center",
    marginBottom: HEIGHT * 0.005,
  },
  searchResultTitle: {
    fontSize: HEIGHT * 0.018,
    fontFamily: UBUNTUBOLD,
    color: BLACK,
    textAlign: "center",
    marginBottom: HEIGHT * 0.005,
    minHeight: HEIGHT * 0.04,
  },
  searchResultInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: HEIGHT * 0.003,
  },
  searchResultJobType: {
    fontSize: HEIGHT * 0.015,
    color: BRANDCOLOR,
    fontFamily: FIRASANSSEMIBOLD,
    marginLeft: WIDTH * 0.01,
  },
  searchResultLocation: {
    fontSize: HEIGHT * 0.015,
    color: "#666",
    marginLeft: WIDTH * 0.01,
  },
  searchResultSalary: {
    fontSize: HEIGHT * 0.015,
    color: "#666",
    marginLeft: WIDTH * 0.01,
  },
  emptySearchContainer: {
    paddingVertical: HEIGHT * 0.1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptySearchText: {
    fontSize: HEIGHT * 0.018,
    color: "#666",
    textAlign: "center",
  },
  loadingIndicatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: HEIGHT * 0.015,
    gap: WIDTH * 0.02,
  },
  loadingIndicatorText: {
    fontSize: HEIGHT * 0.018,
    color: BRANDCOLOR,
  },
  // Recommended Job Card Styles
  row: {
    justifyContent: "space-between",
    marginBottom: HEIGHT * 0.015,
  },
  recommendedCard: {
    width: (WIDTH * 0.92 - WIDTH * 0.02) / 2,
    backgroundColor: "#F9FAFB",
    borderRadius: WIDTH * 0.03,
    padding: WIDTH * 0.03,
    marginBottom: HEIGHT * 0.015,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: WIDTH * 0.01,
    elevation: 2,
    position: "relative",
  },
  recommendedCardLogo: {
    width: WIDTH * 0.12,
    height: WIDTH * 0.12,
    borderRadius: WIDTH * 0.02,
    alignSelf: "center",
    marginBottom: HEIGHT * 0.01,
    resizeMode: "contain",
  },
  recommendedCardCompany: {
    fontSize: HEIGHT * 0.016,
    color: "#444",
    fontFamily: FIRASANSSEMIBOLD,
    textAlign: "center",
    marginBottom: HEIGHT * 0.005,
  },
  recommendedCardTitle: {
    fontSize: HEIGHT * 0.018,
    fontFamily: UBUNTUBOLD,
    color: BLACK,
    textAlign: "center",
    marginBottom: HEIGHT * 0.005,
    minHeight: HEIGHT * 0.04,
  },
  recommendedCardInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: HEIGHT * 0.003,
  },
  recommendedCardJobType: {
    fontSize: HEIGHT * 0.015,
    color: BRANDCOLOR,
    fontFamily: FIRASANSSEMIBOLD,
    marginLeft: WIDTH * 0.01,
  },
  recommendedCardLocation: {
    fontSize: HEIGHT * 0.015,
    color: "#666",
    marginLeft: WIDTH * 0.01,
  },
  recommendedCardSalary: {
    fontSize: HEIGHT * 0.015,
    color: "#666",
    marginLeft: WIDTH * 0.01,
  },
  // Latest Job Card Styles
  latestCard: {
    width: (WIDTH * 0.92 - WIDTH * 0.02) / 2,
    backgroundColor: "#F9FAFB",
    borderRadius: WIDTH * 0.03,
    padding: WIDTH * 0.03,
    marginBottom: HEIGHT * 0.015,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: WIDTH * 0.01,
    elevation: 2,
    position: "relative",
  },
  latestCardLogo: {
    width: WIDTH * 0.12,
    height: WIDTH * 0.12,
    borderRadius: WIDTH * 0.02,
    alignSelf: "center",
    marginBottom: HEIGHT * 0.01,
    resizeMode: "contain",
  },
  latestCardCompany: {
    fontSize: HEIGHT * 0.016,
    color: "#444",
    fontFamily: FIRASANSSEMIBOLD,
    textAlign: "center",
    marginBottom: HEIGHT * 0.005,
  },
  latestCardTitle: {
    fontSize: HEIGHT * 0.018,
    fontFamily: UBUNTUBOLD,
    color: BLACK,
    textAlign: "center",
    marginBottom: HEIGHT * 0.005,
    minHeight: HEIGHT * 0.04,
  },
  latestCardInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: HEIGHT * 0.003,
  },
  latestCardJobType: {
    fontSize: HEIGHT * 0.015,
    color: BRANDCOLOR,
    fontFamily: FIRASANSSEMIBOLD,
    marginLeft: WIDTH * 0.01,
  },
  latestCardLocation: {
    fontSize: HEIGHT * 0.015,
    color: "#666",
    marginLeft: WIDTH * 0.01,
  },
  latestCardSalary: {
    fontSize: HEIGHT * 0.015,
    color: "#666",
    marginLeft: WIDTH * 0.01,
  },
  // Sponsorship Card Styles
  sponsorshipCard: {
    width: (WIDTH * 0.92 - WIDTH * 0.02) / 2,
    backgroundColor: "#F9FAFB",
    borderRadius: WIDTH * 0.03,
    padding: WIDTH * 0.03,
    marginBottom: HEIGHT * 0.015,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: WIDTH * 0.01,
    elevation: 2,
  },
  sponsorshipCardLogo: {
    width: WIDTH * 0.12,
    height: WIDTH * 0.12,
    borderRadius: WIDTH * 0.02,
    alignSelf: "center",
    marginBottom: HEIGHT * 0.01,
    resizeMode: "contain",
  },
  sponsorshipCardCompany: {
    fontSize: HEIGHT * 0.016,
    color: "#444",
    fontFamily: FIRASANSSEMIBOLD,
    textAlign: "center",
    marginBottom: HEIGHT * 0.005,
  },
  sponsorshipCardTitle: {
    fontSize: HEIGHT * 0.018,
    fontWeight: "700",
    color: BLACK,
    textAlign: "center",
    marginBottom: HEIGHT * 0.005,
    minHeight: HEIGHT * 0.04,
  },
  sponsorshipCardInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: HEIGHT * 0.003,
  },
  sponsorshipCardJobType: {
    fontSize: HEIGHT * 0.015,
    color: BRANDCOLOR,
    fontFamily: FIRASANSSEMIBOLD,
    marginLeft: WIDTH * 0.01,
  },
  sponsorshipCardLocation: {
    fontSize: HEIGHT * 0.015,
    color: "#666",
    marginLeft: WIDTH * 0.01,
  },
  sponsorshipCardSalary: {
    fontSize: HEIGHT * 0.015,
    color: "#666",
    marginLeft: WIDTH * 0.01,
  },
  // Category Card Styles
  categoryCard: {
    width: (WIDTH * 0.92 - WIDTH * 0.02) / 2,
    backgroundColor: "#F9FAFB",
    borderRadius: WIDTH * 0.03,
    padding: WIDTH * 0.04,
    marginBottom: HEIGHT * 0.015,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: WIDTH * 0.01,
    elevation: 2,
    alignItems: "center",
    justifyContent: "center",
    minHeight: HEIGHT * 0.15,
  },
  categoryIconContainer: {
    width: WIDTH * 0.16,
    height: WIDTH * 0.16,
    borderRadius: WIDTH * 0.08,
    backgroundColor: WHITE,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: HEIGHT * 0.01,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: WIDTH * 0.01,
    elevation: 1,
  },
  categoryIcon: {
    width: WIDTH * 0.12,
    height: WIDTH * 0.12,
    resizeMode: "contain",
  },
  categoryName: {
    fontSize: WIDTH * 0.036,
    fontWeight: "700",
    color: BLACK,
    textAlign: "center",
    marginBottom: HEIGHT * 0.005,
    minHeight: HEIGHT * 0.04,
  },
  categoryJobCount: {
    fontSize: WIDTH * 0.032,
    color: BRANDCOLOR,
    fontWeight: "600",
    textAlign: "center",
  },
  // All Categories Slider Styles
  allCategoriesSliderContainer: {
    height: HEIGHT * 0.22,
    overflow: "visible",
    paddingBottom: HEIGHT * 0.02,
  },
  allCategoriesSliderContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: HEIGHT * 0.005,
  },
  allCategoryCard: {
    width: (WIDTH * 0.92 - WIDTH * 0.02) / 2,
    backgroundColor: "#F9FAFB",
    borderRadius: WIDTH * 0.03,
    padding: WIDTH * 0.04,
    marginRight: WIDTH * 0.02,
    marginBottom: HEIGHT * 0.005,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: WIDTH * 0.01,
    elevation: 2,
    alignItems: "center",
    justifyContent: "center",
    minHeight: HEIGHT * 0.16,
  },
  allCategoryIconContainer: {
    width: WIDTH * 0.16,
    height: WIDTH * 0.16,
    borderRadius: WIDTH * 0.08,
    backgroundColor: WHITE,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: HEIGHT * 0.01,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: WIDTH * 0.01,
    elevation: 1,
  },
  allCategoryIcon: {
    width: WIDTH * 0.12,
    height: WIDTH * 0.12,
    resizeMode: "contain",
  },
  allCategoryName: {
    fontSize: WIDTH * 0.036,
    fontWeight: "700",
    color: BLACK,
    textAlign: "center",
    marginBottom: HEIGHT * 0.005,
    minHeight: HEIGHT * 0.04,
  },
  allCategoryJobCount: {
    fontSize: WIDTH * 0.032,
    color: BRANDCOLOR,
    fontWeight: "600",
    textAlign: "center",
  },
  // Cities Section Styles
  citiesScrollContent: {
    paddingRight: WIDTH * 0.04,
  },
  cityCard: {
    width: WIDTH * 0.65,
    backgroundColor: "#F9FAFB",
    borderRadius: WIDTH * 0.03,
    marginRight: WIDTH * 0.02,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: WIDTH * 0.01,
    elevation: 2,
  },
  cityImageContainer: {
    width: "100%",
    height: HEIGHT * 0.18,
    backgroundColor: "#E8F4F8",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
  },
  cityImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  cityJobCountTopLeft: {
    position: "absolute",
    top: WIDTH * 0.02,
    left: WIDTH * 0.02,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: WIDTH * 0.025,
    paddingVertical: HEIGHT * 0.006,
    borderRadius: WIDTH * 0.02,
    borderWidth: 1,
    borderColor: "rgba(38, 174, 97, 0.3)",
    zIndex: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cityJobCountText: {
    fontSize: WIDTH * 0.032,
    fontFamily: FIRASANSSEMIBOLD,
    color: "#26AE61",
    marginLeft: WIDTH * 0.01,
  },
  cityArrowButton: {
    position: "absolute",
    top: WIDTH * 0.02,
    right: WIDTH * 0.02,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: WIDTH * 0.04,
    width: WIDTH * 0.08,
    height: WIDTH * 0.08,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  // Poster Section Styles
  posterContainer: {
    borderRadius: WIDTH * 0.04,
    marginBottom: HEIGHT * 0.02,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: WIDTH * 0.02,
    elevation: 5,
  },
  posterGradient: {
    backgroundColor: BRANDCOLOR,
    padding: WIDTH * 0.05,
    position: "relative",
  },
  posterContent: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  posterIconContainer: {
    width: WIDTH * 0.2,
    height: WIDTH * 0.2,
    borderRadius: WIDTH * 0.1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: HEIGHT * 0.015,
  },
  posterTitle: {
    fontSize: WIDTH * 0.055,
    fontFamily: UBUNTUBOLD,
    color: WHITE,
    textAlign: "center",
    marginBottom: HEIGHT * 0.015,
    lineHeight: WIDTH * 0.07,
  },
  posterSlogan: {
    fontSize: WIDTH * 0.038,
    fontFamily: FIRASANSSEMIBOLD,
    color: WHITE,
    textAlign: "center",
    marginTop: HEIGHT * 0.008,
    opacity: 0.95,
  },
  posterBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: WIDTH * 0.04,
    paddingVertical: HEIGHT * 0.008,
    borderRadius: WIDTH * 0.05,
    marginTop: HEIGHT * 0.015,
  },
  posterBadgeText: {
    fontSize: WIDTH * 0.032,
    fontFamily: FIRASANSSEMIBOLD,
    color: WHITE,
    marginLeft: WIDTH * 0.015,
  },
  // Companies Section Styles
  companiesSection: {
    marginBottom: HEIGHT * 0.02,
  },
  companySectionTitle: {
    fontSize: HEIGHT * 0.028,
    fontFamily: UBUNTUBOLD,
    color: BLACK,
    marginBottom: HEIGHT * 0.015,
    paddingHorizontal: WIDTH * 0.04,
    textAlign: "center",
  },
  companySectionSubtitle: {
    fontSize: HEIGHT * 0.016,
    fontFamily: FIRASANSSEMIBOLD,
    color: "#555",
    marginBottom: HEIGHT * 0.015,
    paddingHorizontal: WIDTH * 0.04,
    textAlign: "center",
  },
  companyCarouselContent: {
    paddingLeft: WIDTH * 0.04,
    paddingRight: WIDTH * 0.04,
  },
  companiesRow: {
    justifyContent: "space-around",
    marginBottom: HEIGHT * 0.01,
  },
  companyCard: {
    width: (WIDTH * 0.92 - WIDTH * 0.02) / 2,
    minHeight: WIDTH * 0.42,
    backgroundColor: "#F9FAFB",
    borderRadius: WIDTH * 0.03,
    padding: WIDTH * 0.03,
    marginRight: WIDTH * 0.02,
    alignItems: "center",
    justifyContent: "flex-start",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: WIDTH * 0.01,
    elevation: 2,
  },
  companyLogo: {
    width: WIDTH * 0.16,
    height: WIDTH * 0.16,
    borderRadius: WIDTH * 0.03,
    marginBottom: HEIGHT * 0.006,
    resizeMode: "contain",
  },
  companyName: {
    fontSize: HEIGHT * 0.016,
    fontFamily: FIRASANSSEMIBOLD,
    color: BLACK,
    textAlign: "center",
    marginBottom: HEIGHT * 0.006,
    maxWidth: "88%",
  },
  companyNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  companyVerifiedIcon: {
    width: WIDTH * 0.035,
    height: WIDTH * 0.035,
    marginLeft: WIDTH * 0.01,
    marginBottom: HEIGHT * 0.006,
    resizeMode: "contain",
  },
  companyMeta: {
    fontSize: HEIGHT * 0.014,
    color: "#666",
    textAlign: "center",
    flex: 1,
    flexWrap: "wrap",
    marginLeft: WIDTH * 0.02,
    marginBottom: HEIGHT * 0.006,
    width: "80%",
  },
  companyLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    width: "90%",
    marginBottom: HEIGHT * 0.006,
  },
  companyAddressBlock: {
    alignItems: "center",
    width: "100%",
    marginBottom: HEIGHT * 0.01,
  },
  companyAddressLabel: {
    fontSize: HEIGHT * 0.014,
    color: "#444",
    fontFamily: FIRASANSSEMIBOLD,
    marginBottom: HEIGHT * 0.005,
    textAlign: "center",
  },
  companyOpenings: {
    fontSize: HEIGHT * 0.014,
    color: BRANDCOLOR,
    textAlign: "center",
    fontFamily: FIRASANSSEMIBOLD,
    width: "100%",
    flexWrap: "wrap",
    marginTop: HEIGHT * 0.005,
  },
  viewMoreButton: {
    alignSelf: "center",
    marginTop: HEIGHT * 0.01,
    paddingVertical: HEIGHT * 0.008,
    paddingHorizontal: WIDTH * 0.04,
  },
  viewMoreText: {
    fontSize: HEIGHT * 0.016,
    fontFamily: FIRASANSSEMIBOLD,
    color: BRANDCOLOR,
  },
});