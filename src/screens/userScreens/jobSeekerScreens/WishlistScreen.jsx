import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  RefreshControl,
  Platform,
  PermissionsAndroid,
  Alert,
  KeyboardAvoidingView,
  Pressable,
  TextInput,
  BackHandler,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { pick, isCancel } from '@react-native-documents/picker';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { LOGO, USER, MAIL, PHONE, COVERLETTER, UPLOAD } from "../../../constant/imagePath";
import { BRANDCOLOR, WHITE, BLACK } from "../../../constant/color";
import { UBUNTUBOLD, UBUNTU, FIRASANSSEMIBOLD, ROBOTOSEMIBOLD, CANTARELLBOLD, FIRASANSBOLD } from "../../../constant/fontPath";
import { MyHeader } from "../../../components/commonComponents/MyHeader";
import { BASE_URL } from "../../../constant/url";
import { GETNETWORK, DELETENETWORK, POSTNETWORK } from "../../../utils/Network";
import { getObjByKey } from "../../../utils/Storage";
import { WIDTH, HEIGHT } from "../../../constant/config";
import { TextInputComponent } from "../../../components/commonComponents/TextInputComponent";
import { CustomButton } from "../../../components/commonComponents/Button";
import { ToastMessage } from "../../../components/commonComponents/ToastMessage";

// Helper function to capitalize words and handle underscores
const capitalizeWords = (str = "") => {
  const normalized = str?.toString()?.replace(/_/g, " ") || "";
  return normalized
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
};

// Helper function to format location (state, city)
const formatLocation = (city, state) => {
  const cityFormatted = capitalizeWords(city || "");
  const stateFormatted = capitalizeWords(state || "");
  if (stateFormatted && cityFormatted) return `${stateFormatted}, ${cityFormatted}`;
  if (stateFormatted) return stateFormatted;
  if (cityFormatted) return cityFormatted;
  return "NA";
};

// Helper function to format date as relative time
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  } catch (error) {
    return dateString;
  }
};
 
const WishlistScreen = ({ navigation }) => {
  const [wishlist, setWishlist] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [modalWishState, setModalWishState] = useState(true); // modal-local heart state
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [applyFormVisible, setApplyFormVisible] = useState(false);
  const [appliedJobs, setAppliedJobs] = useState(new Map()); // Track applied jobs with their status
  const [expandedStatusCards, setExpandedStatusCards] = useState(new Set()); // Track which status cards are expanded
  
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
  const [requestChatLoading, setRequestChatLoading] = useState(false);
  const [chatToastMessage, setChatToastMessage] = useState({
    type: "",
    msg: "",
    visible: false,
  });
 
  /* ---------- FETCH WISHLIST DATA ---------- */
  const fetchWishlist = useCallback(async () => {
    try {
      setLoading(true);
      const url = `${BASE_URL}wishlist`;
      // console.log('Fetching wishlist:', url);
      
      // Get token from storage
      const loginResponse = await getObjByKey('loginResponse');
      if (!loginResponse || !loginResponse.token) {
        // console.error('❌ Error: No token found in loginResponse');
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      const result = await GETNETWORK(url, true);
      // console.log('🔍 WishlistScreen: Full API response:', JSON.stringify(result, null, 2));
      
      // Handle response structure - API returns { wishlist: [...] }
      let wishlistData = [];
      if (result?.wishlist && Array.isArray(result.wishlist)) {
        wishlistData = result.wishlist;
      } else if (Array.isArray(result)) {
        wishlistData = result;
      } else if (result?.data && Array.isArray(result.data)) {
        wishlistData = result.data;
      }
      
      // console.log('🔍 WishlistScreen: Extracted wishlistData count:', wishlistData.length);
      // if (wishlistData.length > 0) {
      //   console.log('🔍 WishlistScreen: First item sample:', JSON.stringify(wishlistData[0], null, 2));
      // }
      
      // Transform data to match UI structure based on actual API response
      const transformedData = wishlistData.map((item, index) => {
        // Format location using helper function (handles underscores and capitalization)
        const locationStr = formatLocation(item.city, item.state);
        
        // Format salary range
        const salaryDisplay = item.salary_range 
          ? `₹${item.salary_range}` 
          : 'Salary not specified';
        
        // Format job type
        const jobTypeDisplay = item.job_type 
          ? item.job_type.replace('_', ' ').toUpperCase() 
          : 'Not specified';
        
        // Construct logo URL - check ALL possible field names
        const logoSource = item.company_logo || item.companyLogo || item.companyLogoUrl || item.logo || item.company_logo_url || null;
        
        // console.log(`🔍 WishlistScreen: Item ${index} - company_logo:`, item.company_logo);
        // console.log(`🔍 WishlistScreen: Item ${index} - companyLogo:`, item.companyLogo);
        // console.log(`🔍 WishlistScreen: Item ${index} - companyLogoUrl:`, item.companyLogoUrl);
        // console.log(`🔍 WishlistScreen: Item ${index} - logo:`, item.logo);
        // console.log(`🔍 WishlistScreen: Item ${index} - Selected logoSource:`, logoSource);
        
        const logoUrl = logoSource 
          ? (logoSource.startsWith('http://') || logoSource.startsWith('https://') 
              ? logoSource 
              : `${BASE_URL.replace('/api/', '/')}${logoSource.replace(/^\//, '')}`)
          : null;
        
        // console.log(`🔍 WishlistScreen: Item ${index} - Final logoUrl:`, logoUrl);
        
        return {
          id: String(item.id),
          wishlistId: item.wishlist_id,
          companyLogo: logoUrl,
          companyLogoUrl: logoUrl, // Keep for compatibility
          jobTitle: item.job_title || 'Job Title',
          companyName: item.company_name || 'Company',
          employerCompanyName: item.employer_company_name || item.company_name || 'Company',
          location: locationStr,
          city: item.city,
          state: item.state,
          country: item.country,
          salary: salaryDisplay,
          salaryRange: item.salary_range,
          jobType: jobTypeDisplay,
          jobTypeRaw: item.job_type || '',
          description: item.description || 'No description available',
          skills: item.skills || null,
          experience: item.experience || null,
          status: item.status || 'active',
          postedAt: item.posted_at,
          savedAt: item.saved_at,
          isWishlisted: true,
        };
      });
      
      setWishlist(transformedData);
    } catch (error) {
      // console.error('❌ Error fetching wishlist:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
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
        const appliedJobsMap = new Map();
        
        if (Array.isArray(applications)) {
          applications.forEach((application) => {
            const jobId = (application.jobId || application.job_id || application.job?.id || application.job?._id)?.toString();
            if (jobId) {
              appliedJobsMap.set(jobId, {
                status: application.status || 'pending',
                appliedAt: application.appliedAt || application.appliedDate || application.createdAt,
                resumeViewed: application.resumeViewed || false,
                resumeViewedAt: application.resumeViewedAt,
                recruiterContacted: application.recruiterContacted || false,
                recruiterContactedAt: application.recruiterContactedAt,
                statusUpdatedAt: application.statusUpdatedAt || application.updatedAt,
                ...application
              });
            }
          });
        }
        
        setAppliedJobs(appliedJobsMap);
      }
    } catch (error) {
      // Silently fail
    }
  }, []);

  // Toggle status card expansion
  const handleToggleStatus = (jobId) => {
    setExpandedStatusCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId.toString())) {
        newSet.delete(jobId.toString());
      } else {
        newSet.add(jobId.toString());
      }
      return newSet;
    });
  };

  // Get status stages for a job
  const getStatusStages = (applicationStatus) => {
    const status = applicationStatus || {};
    return [
      { 
        label: 'Applied', 
        completed: true,
        date: status.appliedAt || status.appliedDate || status.createdAt 
      },
      { 
        label: 'Resume Viewed By Recruiter', 
        completed: status.resumeViewed || status.resumeViewedAt || false,
        date: status.resumeViewedAt 
      },
      { 
        label: 'Recruiter Contacted Through Mail', 
        completed: status.recruiterContacted || status.recruiterContactedAt || false,
        date: status.recruiterContactedAt 
      },
      { 
        label: status.status === 'enrolled' ? 'Enrolled' : status.status === 'rejected' ? 'Rejected' : 'Pending',
        completed: status.status === 'enrolled' || status.status === 'rejected',
        date: status.statusUpdatedAt,
        isFinal: true
      }
    ];
  };

  /* ---------- FETCH ON MOUNT ---------- */
  useEffect(() => {
    fetchWishlist();
    fetchAppliedJobs();
  }, [fetchWishlist, fetchAppliedJobs]);

  // BackHandler for apply form modal
  useEffect(() => {
    if (Platform.OS === "android" && applyFormVisible) {
      const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
        // console.log("🔙 ApplyForm: Back button pressed, closing form");
        handleCloseApplyForm();
        return true;
      });
      return () => backHandler.remove();
    }
  }, [applyFormVisible]);

  /* ---------- CARD ---------- */
  const renderItem = ({ item }) => {
    const jobId = item.id?.toString();
    const isApplied = appliedJobs.has(jobId);
    const applicationStatus = appliedJobs.get(jobId);
    const isExpanded = expandedStatusCards.has(jobId);
    const statusStages = getStatusStages(applicationStatus);
    const finalStatus = applicationStatus?.status || 'pending';
    const statusColor = finalStatus === 'enrolled' ? '#26AE61' : finalStatus === 'rejected' ? '#FF4444' : '#FFA500';
    const statusText = finalStatus === 'enrolled' ? 'Enrolled' : finalStatus === 'rejected' ? 'Rejected' : 'Pending';

    return (
    <TouchableOpacity
        style={styles.card}
        activeOpacity={0.95}
      onPress={() => {
        setSelectedJob(item);
          setModalWishState(item.isWishlisted);
      }}
    >
        {/* Header Section */}
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.logoContainer}>
              {item.companyLogo ? (
                <Image 
                  source={{ uri: item.companyLogo }} 
                  style={styles.logo} 
                  defaultSource={LOGO}
                  onError={(error) => {
                    // console.log('❌ WishlistScreen: Image load error for:', item.companyLogo);
                    // console.log('❌ WishlistScreen: Error details:', error);
                  }}
                  onLoad={() => {
                    // console.log('✅ WishlistScreen: Image loaded successfully:', item.companyLogo);
                  }}
                />
              ) : (
                <Image source={LOGO} style={styles.logo} />
              )}
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.title} numberOfLines={2}>{item.jobTitle}</Text>
              <View style={styles.companyRow}>
                <Ionicons name="business-outline" size={14} color="#666" />
                <Text style={styles.company} numberOfLines={1}>{item.companyName}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={styles.heartButton}
            onPress={async (e) => {
              e.stopPropagation();
              await handleRemoveWishlist(item);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="heart" size={22} color="#FF4444" />
          </TouchableOpacity>
        </View>

        {/* Badges Row */}
        <View style={styles.badgesRow}>
                {isApplied && (
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
                  </View>
                )}
            {item.jobType && item.jobType !== 'NOT SPECIFIED' && (
              <View style={styles.jobTypeBadge}>
              <Ionicons name="briefcase-outline" size={12} color={BRANDCOLOR} />
              <Text style={styles.jobTypeText} numberOfLines={1}>{item.jobType}</Text>
              </View>
            )}
            {item.salaryRange && (
              <View style={styles.salaryBadge}>
                <Ionicons name="cash-outline" size={12} color="#27AE60" />
              <Text style={styles.salaryText} numberOfLines={1}>{item.salary}</Text>
              </View>
            )}
          </View>

        {/* Location and Posted Date */}
        <View style={styles.locationDateRow}>
          {item.location && item.location !== 'NA' && (
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={14} color="#666" />
              <Text style={styles.locationText}>{item.location}</Text>
            </View>
          )}
          {item.postedAt && (
            <View style={styles.dateContainer}>
              <Ionicons name="calendar-outline" size={14} color="#666" />
              <Text style={styles.dateText}>Posted {formatDate(item.postedAt)}</Text>
            </View>
          )}
        </View>

        {/* Status Tracking Section */}
          {isApplied && (
          <View style={styles.statusSection}>
              <TouchableOpacity 
              style={styles.statusToggle}
                onPress={(e) => {
                  e.stopPropagation();
                  handleToggleStatus(jobId);
                }}
                activeOpacity={0.7}
              >
              <View style={styles.statusToggleLeft}>
                <MaterialCommunityIcons 
                  name="timeline-check-outline" 
                  size={18} 
                  color={BRANDCOLOR} 
                />
                <Text style={styles.statusToggleText}>Track Application</Text>
              </View>
              <MaterialCommunityIcons 
                name={isExpanded ? "chevron-up" : "chevron-down"} 
                size={22} 
                color="#999" 
                />
              </TouchableOpacity>
              
              {isExpanded && (
              <View style={styles.statusTimeline}>
                  {statusStages.map((stage, index) => (
                  <View key={index} style={styles.timelineItem}>
                    <View style={styles.timelineLeft}>
                      <View style={[
                        styles.timelineDot,
                        stage.completed && styles.timelineDotCompleted
                      ]}>
                        {stage.completed && (
                          <MaterialCommunityIcons name="check" size={12} color={WHITE} />
                        )}
                      </View>
                        {index < statusStages.length - 1 && (
                        <View style={[
                          styles.timelineLine,
                          stage.completed && styles.timelineLineCompleted
                        ]} />
                        )}
                      </View>
                    <View style={styles.timelineContent}>
                      <Text style={[
                        styles.timelineLabel,
                        stage.completed && styles.timelineLabelCompleted
                      ]}>
                          {stage.label}
                        </Text>
                        {stage.date && (
                        <Text style={styles.timelineDate}>
                          {new Date(stage.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
      </TouchableOpacity>
    );
  };
 
  /* ---------- MODAL HEART TOGGLE ---------- */
  const toggleModalHeart = () => {
    setModalWishState((prev) => !prev);
  };
 
  /* ---------- REMOVE FROM WISHLIST ---------- */
  const handleRemoveWishlist = async (item) => {
    const jobId = item.id || item.wishlistId;
    if (!jobId) {
      // console.log('❌ WishlistScreen: No job ID found for delete operation');
      return;
    }

    try {
      const url = `${BASE_URL}wishlist/${jobId}`;
      // console.log('🗑️ WishlistScreen: Deleting from wishlist:', url);
      // console.log('🗑️ WishlistScreen: Job ID:', jobId);
      
      const result = await DELETENETWORK(url, true);
      // console.log('🗑️ WishlistScreen: DELETE wishlist response:', JSON.stringify(result, null, 2));
      
      if (result && !result.message) {
        setWishlist((prev) => prev.filter((i) => i.id !== item.id));
        // console.log('✅ WishlistScreen: Successfully removed from wishlist');
      } else {
        // console.log('⚠️ WishlistScreen: Failed to remove from wishlist:', result?.message);
        // Still remove from UI even if API fails
        setWishlist((prev) => prev.filter((i) => i.id !== item.id));
      }
    } catch (error) {
      // console.error('❌ WishlistScreen: Error removing from wishlist:', error);
      // Still remove from UI even if API fails
      setWishlist((prev) => prev.filter((i) => i.id !== item.id));
    }
  };
 
  /* ---------- CLOSE MODAL AND APPLY CHANGES ---------- */
  const closeModal = async () => {
    if (!modalWishState && selectedJob) {
      // remove from wishlist if user toggled off
      await handleRemoveWishlist(selectedJob);
    }
    setSelectedJob(null);
  };

  /* ---------- HANDLE APPLY JOB ---------- */
  const handleApplyJob = async () => {
    if (!selectedJob) {
      return;
    }
    
    const token = await getObjByKey("loginResponse");
    if (!token) {
      Alert.alert("Login Required", "Please login to apply for jobs");
      return;
    }
    
    // Set selected job and show apply form
    const jobToApply = selectedJob;
    setSelectedJob(null); // Close job details modal first
    
    // Fetch user data and pre-fill form from token
    try {
      const loginResponse = await getObjByKey("loginResponse");
      
      // console.log("🔍 ApplyForm: Full loginResponse:", JSON.stringify(loginResponse, null, 2));
      
      if (!loginResponse) {
        // console.log("❌ ApplyForm: No loginResponse found");
        setApplyName("");
        setApplyEmail("");
        setApplyPhone("");
        setApplyFile(null);
        setApplyCoverLetter("");
      setApplyFormVisible(true);
        return;
      }
      
      // Extract email from token first (we know this works)
      let email = loginResponse.user?.email || loginResponse.data?.email || loginResponse.email || "";
      
      // Try to get firstName, lastName, phone from profile endpoint
      let firstName = "";
      let lastName = "";
      let phone = "";
      
      try {
        const profileUrl = `${BASE_URL}profile`;
        // console.log("📡 ApplyForm: Fetching profile from:", profileUrl);
        const profileResult = await GETNETWORK(profileUrl, true);
        // console.log("📥 ApplyForm: Profile response:", JSON.stringify(profileResult, null, 2));
        
        if (profileResult && !profileResult.message) {
          const profileData = profileResult?.data || profileResult || {};
          // console.log("📋 ApplyForm: Profile data:", JSON.stringify(profileData, null, 2));
          
          // Get firstName and lastName from profile
          firstName = profileData.firstName || profileData.first_name || "";
          lastName = profileData.lastName || profileData.last_name || "";
          phone = profileData.phone || "";
          email = email || profileData.email || "";
          
          // console.log("✅ ApplyForm: From profile - firstName:", firstName, "lastName:", lastName, "phone:", phone);
        }
      } catch (profileError) {
        // console.error("❌ ApplyForm: Error fetching profile:", profileError);
        // If profile fetch fails, try to get from loginResponse
        const userData = loginResponse?.user || loginResponse?.data || loginResponse || {};
        firstName = userData.firstName || userData.first_name || "";
        lastName = userData.lastName || userData.last_name || "";
        phone = userData.phone || "";
      }
      
      // If still no firstName/lastName, try to split fullName
      if (!firstName && !lastName) {
        const userData = loginResponse?.user || loginResponse?.data || loginResponse || {};
        const fullName = userData.fullName || userData.full_name || "";
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
      
      // console.log("✅ ApplyForm: Final extracted - firstName:", firstName, "lastName:", lastName, "email:", email, "phone:", phone);
      
      // Capitalize first letter of each word
      const capitalizeWords = (str) => {
        if (!str) return "";
        return str
          .split(" ")
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(" ");
      };
      
      const firstNameCapitalized = capitalizeWords(firstName);
      const lastNameCapitalized = capitalizeWords(lastName);
      
      // Combine firstName + lastName for Full Name
      const fullName = `${firstNameCapitalized} ${lastNameCapitalized}`.trim();
      
      // console.log("✅ ApplyForm: Setting form - Full Name:", fullName, "Email:", email, "Phone:", phone);
      
      // Pre-fill form fields
      setApplyName(fullName);
      setApplyEmail(email);
      setApplyPhone(phone);
      setApplyFile(null);
      setApplyCoverLetter("");
      
      // Store job to apply in a way we can access it later
      setSelectedJob(jobToApply);
    } catch (error) {
      // console.error("❌ ApplyForm: Error fetching user data:", error);
      // If error, just show empty form
      setApplyName("");
      setApplyEmail("");
      setApplyPhone("");
      setApplyFile(null);
      setApplyCoverLetter("");
      setSelectedJob(jobToApply);
    }
    
    setApplyFormVisible(true);
  };

  const handleCloseApplyForm = () => {
    // console.log("🔒 ApplyForm: Closing form and resetting all fields");
    setApplyFormVisible(false);
    setSelectedJob(null);
    setApplyName("");
    setApplyEmail("");
    setApplyPhone("");
    setApplyFile(null);
    setApplyCoverLetter("");
    setApplyLoading(false);
  };

  // Request storage permission for Android
  const requestStoragePermission = async () => {
    if (Platform.OS === "android") {
      // Use document picker directly instead of requesting READ_MEDIA_IMAGES.
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
    // console.log("🚀 ApplyForm: Starting application submission...");
    
    if (!validateApplyForm()) {
      // console.log("❌ ApplyForm: Form validation failed");
      return;
    }

    if (!selectedJob) {
      // console.log("❌ ApplyForm: No selected job");
      Alert.alert("Error", "Job information is missing");
      return;
    }

    const jobId = selectedJob.id || selectedJob._id;
    if (!jobId) {
      // console.log("❌ ApplyForm: No job ID found");
      Alert.alert("Error", "Job ID is missing");
      return;
    }

    // console.log("📋 ApplyForm: Job ID:", jobId);
    // console.log("📋 ApplyForm: Form data - Name:", applyName, "Email:", applyEmail, "Phone:", applyPhone);
    // console.log("📋 ApplyForm: Has file:", !!applyFile, "File name:", applyFile?.name);
    // console.log("📋 ApplyForm: Cover letter length:", applyCoverLetter.length);

    try {
      setApplyLoading(true);
      // console.log("⏳ ApplyForm: Loading state set to true");

      // Get token from storage
      const loginResponse = await getObjByKey('loginResponse');
      // console.log("🔑 ApplyForm: LoginResponse retrieved:", !!loginResponse);
      
      if (!loginResponse) {
        // console.log("❌ ApplyForm: No loginResponse found");
        setApplyToastMessage({
          type: "error",
          msg: "Please login to apply for jobs",
          visible: true,
        });
        setApplyLoading(false);
        return;
      }

      // Extract token
      let token = null;
      if (loginResponse.data) {
        if (typeof loginResponse.data === 'string') {
          token = loginResponse.data;
          // console.log("🔑 ApplyForm: Token from loginResponse.data (string)");
        } else if (typeof loginResponse.data === 'object' && loginResponse.data !== null) {
          token = loginResponse.data.token || loginResponse.data.data;
          // console.log("🔑 ApplyForm: Token from loginResponse.data (object)");
        }
      }
      if (!token || (typeof token === 'string' && token.trim() === '')) {
        if (loginResponse.token && typeof loginResponse.token === 'string') {
          token = loginResponse.token;
          // console.log("🔑 ApplyForm: Token from loginResponse.token");
        }
      }

      if (!token || typeof token !== 'string' || token.trim() === '') {
        // console.log("❌ ApplyForm: No valid token found");
        setApplyToastMessage({
          type: "error",
          msg: "Authentication token not found. Please login again.",
          visible: true,
        });
        setApplyLoading(false);
        return;
      }

      // console.log("✅ ApplyForm: Token extracted, length:", token.length);
      // console.log("✅ ApplyForm: Token preview:", token.substring(0, 20) + "...");

      // Prepare form data for react-native-blob-util
      const formDataArray = [];
      
      // Add text fields
      formDataArray.push({ name: 'name', data: applyName.trim() });
      formDataArray.push({ name: 'email', data: applyEmail.trim() });
      formDataArray.push({ name: 'phone', data: applyPhone.trim() });
      formDataArray.push({ name: 'pastedCv', data: applyCoverLetter.trim() || '' });
      
      // Add file if exists
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
        // console.log("📎 ApplyForm: File added to form data array");
      }
      
      // console.log("📦 ApplyForm: Form data array prepared with", formDataArray.length, "fields");
      
      // Use react-native-blob-util for upload
      const url = `${BASE_URL}jobs/${jobId}/apply`;
      // console.log("📡 ApplyForm: Submitting to URL:", url);
      
      const result = await ReactNativeBlobUtil.fetch(
        'POST',
        url,
        {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        formDataArray
      );
      
      // console.log("📥 ApplyForm: Response status:", result.info().status);
      
      let parsedResult;
      try {
        const responseText = result.text();
        parsedResult = JSON.parse(responseText);
        // console.log("📥 ApplyForm: Parsed response:", JSON.stringify(parsedResult, null, 2));
      } catch (parseError) {
        // console.error("❌ ApplyForm: Error parsing response:", parseError);
        parsedResult = {
          message: result.text() || 'Unknown error',
          statusCode: result.info().status,
        };
      }

      // Check success
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

      // console.log("✅ ApplyForm: Response status:", responseStatus);
      // console.log("✅ ApplyForm: Success check result:", isSuccess);

      if (isSuccess) {
        const successMessage = parsedResult?.message || "Your application has been submitted successfully!";
        // console.log("✅ ApplyForm: Application submitted successfully!");
        
        setApplyToastMessage({
          type: "success",
          msg: successMessage,
          visible: true,
        });
        
        // Reset form
        setApplyName("");
        setApplyEmail("");
        setApplyPhone("");
        setApplyFile(null);
        setApplyCoverLetter("");
        setApplyLoading(false);
        
        // console.log("🔄 ApplyForm: Form reset, closing in 2 seconds...");
        
        // Refresh applied jobs list
        fetchAppliedJobs();
        
        // Close form after delay
        setTimeout(() => {
          // console.log("🔒 ApplyForm: Closing form modal");
          handleCloseApplyForm();
        }, 2000);
      } else {
        const errorMessage = parsedResult?.errors?.[0]?.msg || parsedResult?.message || parsedResult?.error || "Failed to submit application. Please try again.";
        // console.log("❌ ApplyForm: Application submission failed");
        // console.log("❌ ApplyForm: Error message:", errorMessage);
        
        setApplyToastMessage({
          type: "error",
          msg: errorMessage,
          visible: true,
        });
        setApplyLoading(false);
      }
    } catch (error) {
      // console.error("❌ ApplyForm: Exception during application submission");
      // console.error("❌ ApplyForm: Error:", error);
      
      const errorMessage = error?.message || "An error occurred while submitting your application. Please try again.";
      setApplyToastMessage({
        type: "error",
        msg: errorMessage,
        visible: true,
      });
      setApplyLoading(false);
    }
  };

  // Handle Request Chat
  const handleRequestChat = async () => {
    if (!selectedJob) {
      return;
    }

    const token = await getObjByKey("loginResponse");
    if (!token) {
      Alert.alert("Login Required", "Please login to request chat");
      return;
    }

    const jobId = selectedJob.id || selectedJob._id;
    if (!jobId) {
      // console.log('❌ WishlistScreen: No job ID found for chat request');
      return;
    }

    try {
      setRequestChatLoading(true);
      const url = `${BASE_URL}chat/request`;
      
      // Get jobTitle from selectedJob and sanitize it to remove any URL-like patterns
      let jobTitle = selectedJob?.title || selectedJob?.jobTitle || "this role";
      
      // Remove any URL patterns from job title to avoid "External links are not allowed" error
      jobTitle = jobTitle.replace(/https?:\/\/[^\s]+/gi, ''); // Remove http:// or https:// URLs
      jobTitle = jobTitle.replace(/www\.[^\s]+/gi, ''); // Remove www. URLs
      jobTitle = jobTitle.replace(/[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/gi, ''); // Remove domain-like patterns
      jobTitle = jobTitle.replace(/\.com|\.net|\.org|\.io|\.co|\.in/gi, ''); // Remove common TLDs
      jobTitle = jobTitle.trim();
      
      // If jobTitle is empty after sanitization, use default
      if (!jobTitle || jobTitle.length === 0) {
        jobTitle = "this role";
      }
      
      // Create message with jobTitle: "Hi, I would like to discuss the {jobTitle} role"
      const message = `Hi, I would like to discuss the ${jobTitle} role`;
      
      const payload = {
        jobId: jobId,
        message: message,
      };

      // console.log('📡 WishlistScreen: Requesting chat:', url);
      // console.log('📋 WishlistScreen: Payload being sent:', JSON.stringify(payload, null, 2));

      const result = await POSTNETWORK(url, payload, true);
      // console.log('📥 WishlistScreen: Chat request response:', JSON.stringify(result, null, 2));

      // Check for success
      const isSuccess = result && (
        !result.message ||
        (result.message && result.message.toLowerCase().includes('success')) ||
        result.success === true ||
        result.statusCode === 200 ||
        result.statusCode === 201 ||
        result.id ||
        result.chatId ||
        result.threadId
      );

      if (isSuccess) {
        const chatId = result?.id || result?.chatId || result?.threadId || result?.data?.id || result?.data?.chatId || result?.data?.threadId;
        const successMessage = result?.message || "Chat request sent successfully!";
        
        // console.log('✅ WishlistScreen: Chat request successful!');
        // console.log('✅ WishlistScreen: Chat ID:', chatId);
        // console.log('✅ WishlistScreen: Success message:', successMessage);
        
        setChatToastMessage({
          type: "success",
          msg: successMessage,
          visible: true,
        });
        
        // Close modal and navigate to UserChatScreen with chat ID after a short delay
        setTimeout(() => {
          handleCloseApplyForm();
          if (chatId) {
            // console.log('🚀 WishlistScreen: Navigating to SeekerChat with chatId:', chatId);
            navigation.navigate('SeekerChat', { chatId: chatId });
          } else {
            // console.log('⚠️ WishlistScreen: No chat ID in response, navigating to SeekerChat without chatId');
            navigation.navigate('SeekerChat');
          }
        }, 1500);
      } else {
        const errorMessage = result?.message || result?.error || "Failed to send chat request. Please try again.";
        // console.log('❌ WishlistScreen: Chat request failed');
        // console.log('❌ WishlistScreen: Error message:', errorMessage);
        // console.log('❌ WishlistScreen: Full error response:', JSON.stringify(result, null, 2));
        
        setChatToastMessage({
          type: "error",
          msg: errorMessage,
          visible: true,
        });
      }
    } catch (error) {
      // console.error('❌ WishlistScreen: Exception during chat request:', error);
      // console.error('❌ WishlistScreen: Error message:', error?.message);
      // console.error('❌ WishlistScreen: Error stack:', error?.stack);
      
      setChatToastMessage({
        type: "error",
        msg: "An error occurred while sending chat request. Please try again.",
        visible: true,
      });
    } finally {
      setRequestChatLoading(false);
    }
  };

  /* ---------- REFRESH ---------- */
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchWishlist();
    fetchAppliedJobs();
  }, [fetchWishlist, fetchAppliedJobs]);
 
  return (
    <View style={styles.container}>
      <MyHeader
        showCenterTitle={true}
        title="Wishlist"
      />
      <FlatList
        data={wishlist}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[BRANDCOLOR]}
            tintColor={BRANDCOLOR}
          />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No jobs in wishlist</Text>
        }
      />
 
      {/* ---------- JOB DETAILS MODAL ---------- */}
      <Modal
        visible={!!selectedJob}
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeModal}>
              <Ionicons name="arrow-back" size={26} />
            </TouchableOpacity>
 
            <TouchableOpacity onPress={async () => {
              if (modalWishState) {
                // Remove from wishlist
                await handleRemoveWishlist(selectedJob);
                setSelectedJob(null);
              } else {
                toggleModalHeart();
              }
            }}>
              <Ionicons
                name="heart"
                size={26}
                color={modalWishState ? "red" : "#ccc"}
              />
            </TouchableOpacity>
          </View>
 
          {selectedJob && (
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <View style={styles.center}>
                {selectedJob.companyLogo ? (
                <Image
                    source={{ uri: selectedJob.companyLogo }}
                  style={styles.modalLogo}
                    defaultSource={LOGO}
                    onError={(error) => {
                      // console.log('❌ WishlistScreen: Modal image load error for:', selectedJob.companyLogo);
                      // console.log('❌ WishlistScreen: Error details:', error);
                    }}
                    onLoad={() => {
                      // console.log('✅ WishlistScreen: Modal image loaded successfully:', selectedJob.companyLogo);
                    }}
                  />
                ) : (
                  <Image
                    source={LOGO}
                    style={styles.modalLogo}
                />
                )}
                <Text style={styles.modalTitle}>
                  {selectedJob.jobTitle}
                </Text>
                <Text style={styles.modalCompany}>
                  {selectedJob.companyName}
                </Text>
                {selectedJob.employerCompanyName && (
                  <Text style={styles.employerName}>
                    {selectedJob.employerCompanyName}
                  </Text>
                )}
              </View>

              {/* Job Details Grid */}
              <View style={styles.detailsGrid}>
                {/* Job Type */}
                <View style={styles.detailItem}>
                  <Ionicons name="briefcase-outline" size={20} color={BRANDCOLOR} />
                  <Text style={styles.detailLabel}>Job Type</Text>
                  <Text style={styles.detailValue}>
                    {selectedJob.jobTypeRaw ? selectedJob.jobTypeRaw.replace('_', ' ').toUpperCase() : 'Not specified'}
                  </Text>
                </View>
                
                {/* Salary Range */}
                {selectedJob.salaryRange && (
                  <View style={styles.detailItem}>
                    <Ionicons name="cash-outline" size={20} color="#27AE60" />
                    <Text style={styles.detailLabel}>Salary Range</Text>
                    <Text style={styles.detailValue}>₹{selectedJob.salaryRange}</Text>
                  </View>
                )}
                
                {/* Location (City, State) */}
                {(selectedJob.city || selectedJob.state) && (
                  <View style={styles.detailItem}>
                    <Ionicons name="location-outline" size={20} color="#E74C3C" />
                    <Text style={styles.detailLabel}>Location</Text>
                    <Text style={styles.detailValue}>
                      {formatLocation(selectedJob.city, selectedJob.state)}
                    </Text>
                  </View>
                )}
                
                {/* Country */}
                {selectedJob.country && (
                  <View style={styles.detailItem}>
                    <Ionicons name="globe-outline" size={20} color="#9B59B6" />
                    <Text style={styles.detailLabel}>Country</Text>
                    <Text style={styles.detailValue}>{selectedJob.country}</Text>
                  </View>
                )}
                
                {/* Experience */}
                {selectedJob.experience && (
                  <View style={styles.detailItem}>
                    <Ionicons name="time-outline" size={20} color="#F39C12" />
                    <Text style={styles.detailLabel}>Experience</Text>
                    <Text style={styles.detailValue}>{selectedJob.experience}</Text>
                  </View>
                )}
                
                {/* Status */}
                <View style={styles.detailItem}>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#27AE60" />
                  <Text style={styles.detailLabel}>Status</Text>
                  <Text style={styles.detailValue}>
                    {selectedJob.status ? selectedJob.status.toUpperCase() : 'Active'}
                  </Text>
                </View>
              </View>

              {/* Description Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Job Description</Text>
                <Text style={styles.description}>
                  {selectedJob.description}
                </Text>
              </View>

              {/* Skills Section */}
              {selectedJob.skills && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Required Skills</Text>
                  <View style={styles.skillsContainer}>
                    <Text style={styles.skillsText}>{selectedJob.skills}</Text>
                  </View>
                </View>
              )}

              {/* Posted Date */}
              {selectedJob.postedAt && (
                <View style={styles.dateInfo}>
                  <Ionicons name="calendar-outline" size={16} color="#999" />
                  <Text style={styles.dateText}>
                    Posted {formatDate(selectedJob.postedAt)}
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
 
          {/* ---------- ACTION BUTTONS ---------- */}
          <View style={styles.bottomActions}>
            {selectedJob && (() => {
              const jobId = selectedJob.id?.toString();
              const isApplied = appliedJobs.has(jobId);
              
              return isApplied ? (
                <View style={styles.appliedButtonContainer}>
                  <MaterialCommunityIcons name="check-circle" size={20} color="#26AE61" />
                  <Text style={styles.appliedButtonText}>Applied</Text>
                </View>
              ) : (
            <TouchableOpacity 
              style={styles.applyBtn}
              onPress={handleApplyJob}
            >
              <Text style={styles.applyText}>APPLY NOW</Text>
            </TouchableOpacity>
              );
            })()}

            <TouchableOpacity 
              style={[styles.chatBtn, requestChatLoading && styles.chatBtnDisabled]}
              onPress={handleRequestChat}
              disabled={requestChatLoading}
            >
              <Text style={styles.chatText}>
                {requestChatLoading ? "REQUESTING..." : "REQUEST CHAT"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ---------- APPLY JOB FORM MODAL ---------- */}
      <Modal statusBarTranslucent={true} visible={applyFormVisible} animationType="slide" transparent>
        <View style={styles.applyModalOverlay}>
          <View style={styles.applyModalContainer}>
            <MyHeader
              showBack
              title="Apply Job"
              onBackPress={handleCloseApplyForm}
            />

            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
              <ScrollView
                contentContainerStyle={styles.applyFormContainer}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {/* Job Title Heading */}
                {selectedJob && (
                  <View style={styles.applyJobTitleContainer}>
                    <Text style={styles.applyJobTitle}>
                      {selectedJob.jobTitle || selectedJob.title || 'Job Application'}
                    </Text>
                  </View>
                )}

                {/* Full Name */}
                <TextInputComponent
                  placeholder="Full Name"
                  inputdata={applyName}
                  setInputdata={setApplyName}
                  borderColor={BRANDCOLOR}
                  width="95%"
                  image={USER}
                />

                {/* Email */}
                <TextInputComponent
                  placeholder="Email Address"
                  inputdata={applyEmail}
                  setInputdata={setApplyEmail}
                  keyboardType="email-address"
                  borderColor={BRANDCOLOR}
                  width="95%"
                  image={MAIL}
                />

                {/* Phone */}
                <TextInputComponent
                  placeholder="Phone Number"
                  inputdata={applyPhone}
                  setInputdata={setApplyPhone}
                  keyboardType="numeric"
                  borderColor={BRANDCOLOR}
                  width="95%"
                  image={PHONE}
                />

                {/* File Upload */}
                <View style={styles.applyFileBox}>
                  {!applyFile ? (
                    <Pressable style={styles.applyUploadArea} onPress={handlePickFile}>
                      <Image source={UPLOAD} style={styles.applyUploadIcon} />
                      <Text style={styles.applyFileText}>Upload Resume</Text>
                    </Pressable>
                  ) : (
                    <View style={styles.applySelectedFile}>
                      <Text style={styles.applyFileName}>{applyFile.name}</Text>
                      <Pressable onPress={() => setApplyFile(null)} style={styles.applyRemoveBtn}>
                        <Text style={styles.applyRemoveText}>Remove</Text>
                      </Pressable>
                    </View>
                  )}
                </View>

                {/* Cover Letter - Description Style */}
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

                {/* Submit Button */}
                <View style={styles.applyButtonWrapper}>
                  <CustomButton
                    text={applyLoading ? "Submitting..." : "Submit Application"}
                    color={WHITE}
                    onPress={handleSubmitApplication}
                    disabled={applyLoading}
                  />
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </View>

        {/* Toast Message */}
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

      {/* Toast Message for Chat Request */}
      <ToastMessage
        message={chatToastMessage.msg}
        visible={chatToastMessage.visible}
        setVisible={({ visible }) =>
          setChatToastMessage((prev) => ({ ...prev, visible }))
        }
        bacgroundColor={chatToastMessage.type === "success" ? "green" : "red"}
        textColor={WHITE}
        type={chatToastMessage.type}
        duration={3000}
        image={LOGO}
      />
    </View>
  );
};
 
export default WishlistScreen;
 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    paddingHorizontal: WIDTH * 0.04,
    paddingTop: HEIGHT * 0.02,
  },
  card: {
    backgroundColor: WHITE,
    borderRadius: 20,
    marginBottom: 16,
    padding: 18,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    borderWidth: 0.5,
    borderColor: "#E5E5E5",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: "row",
    flex: 1,
    marginRight: 12,
  },
  logoContainer: {
    backgroundColor: "#F5F5F5",
    padding: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    alignSelf: "flex-start",
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 8,
    resizeMode: "contain",
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontFamily: UBUNTUBOLD,
    color: "#1A1A1A",
    marginBottom: 6,
    lineHeight: 24,
  },
  companyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  company: {
    fontSize: 14,
    color: "#666",
    fontFamily: FIRASANSSEMIBOLD,
    flex: 1,
  },
  heartButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#FFF5F5",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: UBUNTUBOLD,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  jobTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BRANDCOLOR + "15",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  jobTypeText: {
    fontSize: 12,
    fontFamily: FIRASANSSEMIBOLD,
    color: BRANDCOLOR,
    textTransform: "uppercase",
  },
  salaryBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#27AE6015",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  salaryText: {
    fontSize: 12,
    fontFamily: FIRASANSSEMIBOLD,
    color: "#27AE60",
  },
  locationDateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F8F9FA",
    borderRadius: 10,
    gap: 12,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 6,
  },
  locationText: {
    fontSize: 13,
    color: "#666",
    fontFamily: FIRASANSSEMIBOLD,
    flex: 1,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateText: {
    fontSize: 13,
    color: "#666",
    fontFamily: FIRASANSSEMIBOLD,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 60,
    color: "#999",
    fontSize: 16,
    fontFamily: FIRASANSSEMIBOLD,
  },
  // Status Tracking Styles
  statusSection: {
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingTop: 16,
    marginTop: 4,
  },
  statusToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  statusToggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statusToggleText: {
    fontSize: 15,
    fontFamily: FIRASANSSEMIBOLD,
    color: "#1A1A1A",
  },
  statusTimeline: {
    marginTop: 16,
    paddingLeft: 4,
    backgroundColor: "#FAFBFC",
    borderRadius: 12,
    padding: 12,
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  timelineLeft: {
    alignItems: "center",
    marginRight: 14,
    position: "relative",
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    backgroundColor: WHITE,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineDotCompleted: {
    backgroundColor: "#26AE61",
    borderColor: "#26AE61",
  },
  timelineLine: {
    width: 3,
    height: 28,
    backgroundColor: "#E0E0E0",
    marginTop: 4,
    position: "absolute",
    top: 24,
    borderRadius: 2,
  },
  timelineLineCompleted: {
    backgroundColor: "#26AE61",
  },
  timelineContent: {
    flex: 1,
    paddingTop: 2,
  },
  timelineLabel: {
    fontSize: 13,
    color: "#999",
    marginBottom: 4,
    lineHeight: 18,
    fontFamily: FIRASANSSEMIBOLD,
  },
  timelineLabelCompleted: {
    color: "#1A1A1A",
    fontFamily: UBUNTUBOLD,
  },
  timelineDate: {
    fontSize: 11,
    color: "#999",
  },
 
  /* ---------- MODAL ---------- */
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  center: {
    alignItems: "center",
    marginBottom: 30,
  },
  modalLogo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    resizeMode: "contain",
    marginBottom: 16,
    backgroundColor: "#F5F7F9",
    borderWidth: 3,
    borderColor: "#E0E0E0",
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: UBUNTUBOLD,
    color: "#2C3E50",
    textAlign: "center",
    marginBottom: 8,
  },
  modalCompany: {
    fontSize: 18,
    color: BRANDCOLOR,
    fontFamily: FIRASANSSEMIBOLD,
    marginBottom: 4,
  },
  employerName: {
    fontSize: 14,
    color: "#7F8C8D",
    marginTop: 4,
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 24,
    marginHorizontal: -6,
  },
  detailItem: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#F8F9FA",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E9ECEF",
    margin: 6,
  },
  detailLabel: {
    fontSize: 12,
    color: "#7F8C8D",
    marginTop: 8,
    marginBottom: 4,
    fontFamily: FIRASANSSEMIBOLD,
  },
  detailValue: {
    fontSize: 14,
    color: "#2C3E50",
    fontFamily: FIRASANSSEMIBOLD,
    textAlign: "center",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: UBUNTUBOLD,
    color: "#2C3E50",
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: "#555",
    textAlign: "justify",
  },
  skillsContainer: {
    backgroundColor: "#F8F9FA",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  skillsText: {
    fontSize: 15,
    color: "#2C3E50",
    lineHeight: 22,
  },
  dateInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E9ECEF",
  },
  dateText: {
    fontSize: 13,
    color: "#999",
    marginLeft: 8,
  },
 
  /* ---------- ACTIONS ---------- */
  bottomActions: {
    paddingVertical: 12,
  },
  applyBtn: {
    backgroundColor: "#27AE60",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  applyText: {
    color: "#fff",
    fontFamily: UBUNTUBOLD,
  },
  chatBtn: {
    borderWidth: 1,
    borderColor: BRANDCOLOR,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  chatBtnDisabled: {
    opacity: 0.6,
  },
  chatText: {
    color: BRANDCOLOR,
    fontFamily: UBUNTUBOLD,
  },
  appliedButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E6F7EF",
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  appliedButtonText: {
    color: "#26AE61",
    fontFamily: UBUNTUBOLD,
    marginLeft: 8,
    fontSize: 16,
  },
  // Apply Form Modal Styles
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
  applyButtonWrapper: {
    alignItems: "center",
    marginTop: 20,
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
});