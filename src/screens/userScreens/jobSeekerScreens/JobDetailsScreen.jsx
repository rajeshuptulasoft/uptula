import React, { useState, useEffect, useCallback, useRef } from "react";
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
  SafeAreaView,
  Linking,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { BLACK, BRANDCOLOR, WHITE } from "../../../constant/color";
import { UBUNTUBOLD, UBUNTU, FIRASANSSEMIBOLD, ROBOTOSEMIBOLD, CANTARELLBOLD, FIRASANSBOLD } from "../../../constant/fontPath";
import {
  LOGO,
  JOBTITLE,
  COMPANYNAME,
  JOBDESCRIPTION,
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
  GENERALINFORMATION,
  SOCIALACCOUNT,
  VIEW,
  APPLICATION,
  CATAGORY,
  SALARYRANGE,
  EXPERIENCED,
  CITY,
  JOBTYPE,
} from "../../../constant/imagePath";
import { HEIGHT, WIDTH } from "../../../constant/config";
import { MyHeader } from "../../../components/commonComponents/MyHeader";
import { CustomButton } from "../../../components/commonComponents/Button";
import { BASE_URL } from "../../../constant/url";
import { GETNETWORK, POSTNETWORK, DELETENETWORK } from "../../../utils/Network";
import { ToastMessage } from "../../../components/commonComponents/ToastMessage";
import { getObjByKey } from "../../../utils/Storage";
import ApplyJobForm from "../../../components/jobSeekerComponents/ApplyJobForm";
// import DocumentPicker from "react-native-document-picker";

const JobDetailsScreen = ({ navigation, route }) => {
  const { jobId, jobData } = route?.params || {};
  const [jobDetails, setJobDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [applyFormVisible, setApplyFormVisible] = useState(false);
  const [requestChatLoading, setRequestChatLoading] = useState(false);
  const [chatToastMessage, setChatToastMessage] = useState({
    type: "",
    msg: "",
    visible: false,
  });
  const [activeTab, setActiveTab] = useState("Job Details");
  const [followCompany, setFollowCompany] = useState(false);
  const [isApplied, setIsApplied] = useState(
    route?.params?.isApplied ? true : false
  );
  const [similarJobs, setSimilarJobs] = useState([]);
  const [similarJobsWishlist, setSimilarJobsWishlist] = useState(new Map());

  // Ensure applied flag from navigation persists
  useEffect(() => {
    if (route?.params?.isApplied) {
      setIsApplied(true);
    }
  }, [route?.params?.isApplied]);

  const capitalizeWords = (str = "") => {
    const normalized = str?.toString()?.replace(/_/g, " ") || "";
    return normalized
      .split(" ")
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  };

  const formatLocation = (city, state) => {
    const cityFormatted = capitalizeWords(city || "");
    const stateFormatted = capitalizeWords(state || "");
    if (stateFormatted && cityFormatted) return `${stateFormatted}, ${cityFormatted}`;
    if (stateFormatted) return stateFormatted;
    if (cityFormatted) return cityFormatted;
    return "NA";
  };

  const normalizeSocialValue = (value) => {
    if (!value) return null;
    const trimmed = value.toString().trim();
    if (!trimmed) return null;
    return trimmed;
  };

  const getSocialUrls = (platform, value) => {
    const normalized = normalizeSocialValue(value);
    if (!normalized) return null;

    const hasHttp = /^https?:\/\//i.test(normalized);
    const cleanValue = normalized.replace(/(^https?:\/\/|^www\.)/i, "").replace(/\/+$/g, "");

    switch (platform) {
      case "facebook": {
        const web = hasHttp ? normalized : `https://www.facebook.com/${cleanValue}`;
        const app = hasHttp
          ? `fb://facewebmodal/f?href=${web}`
          : `fb://profile/${cleanValue}`;
        return { app, web };
      }
      case "instagram": {
        const web = hasHttp ? normalized : `https://www.instagram.com/${cleanValue}`;
        const app = `instagram://user?username=${cleanValue}`;
        return { app, web };
      }
      case "twitter": {
        const web = hasHttp ? normalized : `https://twitter.com/${cleanValue}`;
        const app = `twitter://user?screen_name=${cleanValue}`;
        return { app, web };
      }
      case "linkedin": {
        const web = hasHttp ? normalized : `https://www.linkedin.com/in/${cleanValue}`;
        const app = `linkedin://in/${cleanValue}`;
        return { app, web };
      }
      default:
        return null;
    }
  };

  const openSocialLink = async (platform, value) => {
    const urls = getSocialUrls(platform, value);
    if (!urls) return;

    try {
      if (urls.app && (await Linking.canOpenURL(urls.app))) {
        await Linking.openURL(urls.app);
      } else {
        await Linking.openURL(urls.web);
      }
    } catch (error) {
      if (urls.web) {
        await Linking.openURL(urls.web);
      }
    }
  };

  // Log route params when component receives them
  useEffect(() => {
    // console.log('🟢 JobDetailsScreen: Route params received:');
    // console.log('📥 JobDetailsScreen: jobId from params:', jobId);
    // console.log('📥 JobDetailsScreen: jobData from params:', JSON.stringify(jobData, null, 2));
    if (jobData) {
      // console.log('📥 JobDetailsScreen: Job Title from params:', jobData?.jobTitle || jobData?.title);
      // console.log('📥 JobDetailsScreen: Company from params:', jobData?.companyName || jobData?.company);
      // console.log('📥 JobDetailsScreen: Salary from params:', jobData?.salaryRange || jobData?.salary);
      // console.log('📥 JobDetailsScreen: Logo from params:', jobData?.companyLogoUrl || jobData?.logo);
      // console.log('📥 JobDetailsScreen: Location from params:', jobData?.location);
      // console.log('📥 JobDetailsScreen: Description from params:', jobData?.description);
    }
  }, [jobId, jobData]);

  const fetchJobDetails = useCallback(async () => {
    // console.log('🟡 JobDetailsScreen: Starting fetchJobDetails');
    // console.log('🟡 JobDetailsScreen: jobId:', jobId);
    // console.log('🟡 JobDetailsScreen: jobData exists:', !!jobData);
    
    if (!jobId) {
      if (jobData) {
        // console.log('✅ JobDetailsScreen: No jobId, using jobData from params');
        // console.log('📝 JobDetailsScreen: Setting jobDetails from params:', JSON.stringify(jobData, null, 2));
        setJobDetails(jobData);
        setLoading(false);
        return;
      }
      // console.log('⚠️ JobDetailsScreen: No jobId and no jobData');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Fetch job details using GETNETWORK, BASE_URL, token, and endpoint api/jobs/{id}
      const url = `${BASE_URL}jobs/${jobId}`;
      // console.log('📡 JobDetailsScreen: Fetching from API endpoint:', url);
      // console.log('📡 JobDetailsScreen: Using GETNETWORK with token');
      
      const result = await GETNETWORK(url, true);
      // console.log('📥 JobDetailsScreen: API response from api/jobs/{id}:', JSON.stringify(result, null, 2));

      if (result && !result.message) {
        // Handle various response structures
        const jobDataFromAPI = result?.data || result?.job || result;
        // console.log('✅ JobDetailsScreen: Successfully fetched job details:', JSON.stringify(jobDataFromAPI, null, 2));
        // console.log('📋 JobDetailsScreen: Job Title:', jobDataFromAPI?.title || jobDataFromAPI?.jobTitle);
        // console.log('📋 JobDetailsScreen: Company:', jobDataFromAPI?.company || jobDataFromAPI?.companyName);
        // console.log('📋 JobDetailsScreen: Category:', jobDataFromAPI?.category);
        // console.log('📋 JobDetailsScreen: Salary Range:', jobDataFromAPI?.salaryRange || jobDataFromAPI?.salary);
        // console.log('📋 JobDetailsScreen: No. of Vacancy:', jobDataFromAPI?.noOfVacancy);
        // console.log('📋 JobDetailsScreen: Experience:', jobDataFromAPI?.experience);
        // console.log('📋 JobDetailsScreen: Job Type:', jobDataFromAPI?.jobType);
        // console.log('📋 JobDetailsScreen: Qualification:', jobDataFromAPI?.qualification);
        // console.log('📋 JobDetailsScreen: Skills:', jobDataFromAPI?.skills);
        // console.log('📋 JobDetailsScreen: Description:', jobDataFromAPI?.description);
        // console.log('📋 JobDetailsScreen: Email:', jobDataFromAPI?.email);
        // console.log('📋 JobDetailsScreen: Phone:', jobDataFromAPI?.phone);
        // console.log('📋 JobDetailsScreen: Website:', jobDataFromAPI?.website);
        // console.log('📋 JobDetailsScreen: Address:', jobDataFromAPI?.address);
        // console.log('📋 JobDetailsScreen: City:', jobDataFromAPI?.city);
        // console.log('📋 JobDetailsScreen: State:', jobDataFromAPI?.state);
        // console.log('📋 JobDetailsScreen: Country:', jobDataFromAPI?.country);
        // console.log('📋 JobDetailsScreen: Zip Code:', jobDataFromAPI?.zipCode);
        // console.log('📋 JobDetailsScreen: Status:', jobDataFromAPI?.status);
        // console.log('📋 JobDetailsScreen: Is Featured:', jobDataFromAPI?.isFeatured);
        // console.log('📋 JobDetailsScreen: Views Count:', jobDataFromAPI?.viewsCount);
        // console.log('📋 JobDetailsScreen: Applications Count:', jobDataFromAPI?.applicationsCount);
        setJobDetails(jobDataFromAPI);

        // If API indicates applied status, mark applied
        const appliedFlag =
          jobDataFromAPI?.isApplied ||
          jobDataFromAPI?.applied ||
          jobDataFromAPI?.status === "applied" ||
          jobDataFromAPI?.status === "enrolled" ||
          jobDataFromAPI?.hasApplied;
        if (appliedFlag) {
          setIsApplied(true);
        }
      } else {
        // console.log('⚠️ JobDetailsScreen: API returned error or no data:', result?.message);
        // Fallback to jobData from params if API fails
        if (jobData) {
          // console.log('✅ JobDetailsScreen: Using jobData from params as fallback:', JSON.stringify(jobData, null, 2));
          setJobDetails(jobData);
        } else {
          // console.log('❌ JobDetailsScreen: No data available from API or params');
        }
      }
    } catch (error) {
      // console.error('❌ JobDetailsScreen: Error fetching job details:', error);
      // Fallback to jobData from params if error occurs
      if (jobData) {
        // console.log('✅ JobDetailsScreen: Error occurred, using jobData from params:', JSON.stringify(jobData, null, 2));
        setJobDetails(jobData);
        const appliedFlag =
          jobData?.isApplied ||
          jobData?.applied ||
          jobData?.status === "applied" ||
          jobData?.status === "enrolled" ||
          jobData?.hasApplied;
        if (appliedFlag) {
          setIsApplied(true);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [jobId, jobData]);

  // Log when jobDetails state changes
  useEffect(() => {
    if (jobDetails) {
      // console.log('🟢 JobDetailsScreen: jobDetails state updated:');
      // console.log('📋 JobDetailsScreen: Final jobDetails:', JSON.stringify(jobDetails, null, 2));
      // console.log('📋 JobDetailsScreen: Title:', jobDetails?.title || jobDetails?.jobTitle);
      // console.log('📋 JobDetailsScreen: Company:', jobDetails?.company || jobDetails?.companyName);
      // console.log('📋 JobDetailsScreen: Category:', jobDetails?.category);
      // console.log('📋 JobDetailsScreen: Salary Range:', jobDetails?.salaryRange || jobDetails?.salary);
      // console.log('📋 JobDetailsScreen: No. of Vacancy:', jobDetails?.noOfVacancy);
      // console.log('📋 JobDetailsScreen: Experience:', jobDetails?.experience);
      // console.log('📋 JobDetailsScreen: Job Type:', jobDetails?.jobType);
      // console.log('📋 JobDetailsScreen: Qualification:', jobDetails?.qualification);
      // console.log('📋 JobDetailsScreen: Skills:', jobDetails?.skills);
      // console.log('📋 JobDetailsScreen: Description:', jobDetails?.description);
      // console.log('📋 JobDetailsScreen: Email:', jobDetails?.email);
      // console.log('📋 JobDetailsScreen: Phone:', jobDetails?.phone);
      // console.log('📋 JobDetailsScreen: Website:', jobDetails?.website);
      // console.log('📋 JobDetailsScreen: Address:', jobDetails?.address);
      // console.log('📋 JobDetailsScreen: City:', jobDetails?.city);
      // console.log('📋 JobDetailsScreen: State:', jobDetails?.state);
      // console.log('📋 JobDetailsScreen: Country:', jobDetails?.country);
      // console.log('📋 JobDetailsScreen: Zip Code:', jobDetails?.zipCode);
      // console.log('📋 JobDetailsScreen: Status:', jobDetails?.status);
      // console.log('📋 JobDetailsScreen: Is Featured:', jobDetails?.isFeatured);
      // console.log('📋 JobDetailsScreen: Views Count:', jobDetails?.viewsCount);
      // console.log('📋 JobDetailsScreen: Applications Count:', jobDetails?.applicationsCount);
    }
  }, [jobDetails]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchJobDetails();
    setRefreshing(false);
  }, [fetchJobDetails]);

  useFocusEffect(
    useCallback(() => {
      fetchJobDetails();
    }, [fetchJobDetails])
  );

  // Check wishlist status and applied status when jobDetails changes
  useEffect(() => {
    const checkStatuses = async () => {
      const currentJobId = jobDetails?.id || jobDetails?._id || jobId;
      if (currentJobId) {
        try {
          // Check wishlist status
          const wishlistUrl = `${BASE_URL}wishlist`;
          const wishlistResult = await GETNETWORK(wishlistUrl, true);
          if (wishlistResult && Array.isArray(wishlistResult.wishlist)) {
            const isInWishlist = wishlistResult.wishlist.some(
              (item) => (item.id || item.job_id || item.jobId)?.toString() === currentJobId.toString()
            );
            setIsWishlisted(isInWishlist);
          } else if (wishlistResult?.data && Array.isArray(wishlistResult.data)) {
            const isInWishlist = wishlistResult.data.some(
              (item) => (item.id || item.job_id || item.jobId)?.toString() === currentJobId.toString()
            );
            setIsWishlisted(isInWishlist);
          }

          // Check applied status
          const applicationsUrl = `${BASE_URL}applications/mine`;
          const applicationsResult = await GETNETWORK(applicationsUrl, true);
          if (applicationsResult && !applicationsResult.message) {
            const applications = applicationsResult?.data || applicationsResult?.applications || applicationsResult?.list || applicationsResult || [];
            if (Array.isArray(applications)) {
              const hasApplied = applications.some(
                (app) => (app.jobId || app.job_id || app.job?.id || app.job?._id)?.toString() === currentJobId.toString()
              );
              setIsApplied(hasApplied);
            }
          }
        } catch (error) {
          // Silently fail - status checks are optional
        }
      }
    };
    if (jobDetails) {
      checkStatuses();
    }
  }, [jobDetails, jobId]);

  // Fetch similar jobs and their wishlist status
  useEffect(() => {
    const fetchSimilarJobs = async () => {
      if (!jobDetails) return;
      
      try {
        const url = `${BASE_URL}jobs/latest`;
        const result = await GETNETWORK(url, false);
        
        if (result && !result.message) {
          const jobs = result?.data || result?.jobs || result?.list || result || [];
          const allJobs = Array.isArray(jobs) ? jobs : [];
          
          const currentJobTitle = (jobDetails.title || jobDetails.jobTitle || '').toLowerCase();
          const currentCategory = (jobDetails.category || '').toLowerCase();
          const currentJobId = (jobDetails.id || jobDetails._id || jobId)?.toString();
          
          // Filter similar jobs by title or category, exclude current job
          let filteredJobs = allJobs.filter(job => {
            const jobIdStr = (job.id || job._id)?.toString();
            if (jobIdStr === currentJobId) return false;
            
            const jobTitle = (job.title || job.jobTitle || '').toLowerCase();
            const jobCategory = (job.category || '').toLowerCase();
            
            // Check if title or category matches
            if (currentJobTitle && jobTitle.includes(currentJobTitle) || currentJobTitle.includes(jobTitle)) {
              return true;
            }
            if (currentCategory && jobCategory === currentCategory) {
              return true;
            }
            return false;
          });
          
          // If no similar jobs found, show other category jobs
          if (filteredJobs.length === 0 && currentCategory) {
            filteredJobs = allJobs
              .filter(job => {
                const jobIdStr = (job.id || job._id)?.toString();
                return jobIdStr !== currentJobId && (job.category || '').toLowerCase() === currentCategory;
              })
              .slice(0, 4);
          }
          
          // If still no jobs, show any other jobs
          if (filteredJobs.length === 0) {
            filteredJobs = allJobs
              .filter(job => {
                const jobIdStr = (job.id || job._id)?.toString();
                return jobIdStr !== currentJobId;
              })
              .slice(0, 4);
          }
          
          setSimilarJobs(filteredJobs.slice(0, 4));
          
          // Fetch wishlist status for similar jobs
          const token = await getObjByKey("loginResponse");
          if (token) {
            try {
              const wishlistUrl = `${BASE_URL}wishlist`;
              const wishlistResult = await GETNETWORK(wishlistUrl, true);
              const wishlistMap = new Map();
              
              if (wishlistResult && Array.isArray(wishlistResult.wishlist)) {
                wishlistResult.wishlist.forEach((item) => {
                  const itemJobId = (item.id || item.job_id || item.jobId)?.toString();
                  if (itemJobId) {
                    wishlistMap.set(itemJobId, true);
                  }
                });
              } else if (wishlistResult?.data && Array.isArray(wishlistResult.data)) {
                wishlistResult.data.forEach((item) => {
                  const itemJobId = (item.id || item.job_id || item.jobId)?.toString();
                  if (itemJobId) {
                    wishlistMap.set(itemJobId, true);
                  }
                });
              }
              
              setSimilarJobsWishlist(wishlistMap);
            } catch (error) {
              // Silently fail - wishlist check is optional
            }
          }
        }
      } catch (error) {
        console.error('Error fetching similar jobs:', error);
      }
    };
    
    if (jobDetails && activeTab === "Job Details") {
      fetchSimilarJobs();
    }
  }, [jobDetails, activeTab, jobId]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        navigation.goBack();
        return true;
      }
    );
    return () => backHandler.remove();
  }, [navigation]);

  const handleWishlist = async () => {
    const token = await getObjByKey("loginResponse");
    if (!token) {
      navigation.navigate("Login");
      return;
    }

    const currentJobId = jobDetails?.id || jobDetails?._id || jobId;
    if (!currentJobId) {
      // console.log('❌ JobDetailsScreen: No job ID found for wishlist operation');
      return;
    }

    try {
      if (isWishlisted) {
        // Remove from wishlist - DELETE
        const url = `${BASE_URL}wishlist/${currentJobId}`;
        // console.log('🗑️ JobDetailsScreen: Deleting from wishlist:', url);
        // console.log('🗑️ JobDetailsScreen: Job ID:', currentJobId);
        
        const result = await DELETENETWORK(url, true);
        // console.log('🗑️ JobDetailsScreen: DELETE wishlist response:', JSON.stringify(result, null, 2));
        
        // Check for success - either no message, or message contains "success" or "deleted"
        const isSuccess = result && (
          !result.message || 
          (result.message && (result.message.toLowerCase().includes('success') || result.message.toLowerCase().includes('deleted'))) ||
          result.success === true ||
          result.statusCode === 200 ||
          result.statusCode === 201
        );
        
        if (isSuccess) {
          setIsWishlisted(false);
          // console.log('✅ JobDetailsScreen: Successfully removed from wishlist');
        } else {
          // console.log('⚠️ JobDetailsScreen: Failed to remove from wishlist:', result?.message);
        }
      } else {
        // Add to wishlist - POST
        const url = `${BASE_URL}wishlist/${currentJobId}`;
        // console.log('❤️ JobDetailsScreen: Adding to wishlist:', url);
        // console.log('❤️ JobDetailsScreen: Job ID:', currentJobId);
        
        const result = await POSTNETWORK(url, {}, true);
        // console.log('❤️ JobDetailsScreen: POST wishlist response:', JSON.stringify(result, null, 2));
        
        // Check for success - either no message, or message contains "success"
        const isSuccess = result && (
          !result.message || 
          (result.message && result.message.toLowerCase().includes('success')) ||
          result.success === true ||
          result.statusCode === 200 ||
          result.statusCode === 201
        );
        
        if (isSuccess) {
          setIsWishlisted(true);
          // console.log('✅ JobDetailsScreen: Successfully added to wishlist');
        } else {
          // console.log('⚠️ JobDetailsScreen: Failed to add to wishlist:', result?.message);
        }
      }
    } catch (error) {
      // console.error('❌ JobDetailsScreen: Error in wishlist operation:', error);
    }
  };

  // Handle wishlist for similar jobs
  const handleSimilarJobWishlist = async (similarJobId, similarJobIndex) => {
    const token = await getObjByKey("loginResponse");
    if (!token) {
      navigation.navigate("Login");
      return;
    }

    if (!similarJobId) {
      return;
    }

    const jobIdStr = similarJobId.toString();
    const isCurrentlyWishlisted = similarJobsWishlist.get(jobIdStr) || false;

    try {
      if (isCurrentlyWishlisted) {
        // Remove from wishlist - DELETE
        const url = `${BASE_URL}wishlist/${similarJobId}`;
        const result = await DELETENETWORK(url, true);
        
        const isSuccess = result && (
          !result.message || 
          (result.message && (result.message.toLowerCase().includes('success') || result.message.toLowerCase().includes('deleted'))) ||
          result.success === true ||
          result.statusCode === 200 ||
          result.statusCode === 201
        );
        
        if (isSuccess) {
          setSimilarJobsWishlist(prev => {
            const newMap = new Map(prev);
            newMap.set(jobIdStr, false);
            return newMap;
          });
        }
      } else {
        // Add to wishlist - POST
        const url = `${BASE_URL}wishlist/${similarJobId}`;
        const result = await POSTNETWORK(url, {}, true);
        
        const isSuccess = result && (
          !result.message || 
          (result.message && result.message.toLowerCase().includes('success')) ||
          result.success === true ||
          result.statusCode === 200 ||
          result.statusCode === 201
        );
        
        if (isSuccess) {
          setSimilarJobsWishlist(prev => {
            const newMap = new Map(prev);
            newMap.set(jobIdStr, true);
            return newMap;
          });
        }
      }
    } catch (error) {
      // Silently fail
    }
  };

  const handleApply = async () => {
    const token = await getObjByKey("loginResponse");
    if (!token) {
      navigation.navigate("Login");
      return;
    }
    
    // Show apply form modal
    setApplyFormVisible(true);
  };

  const handleCloseApplyForm = () => {
    setApplyFormVisible(false);
  };

  const handleSubmitApplication = (result) => {
    if (result?.success) {
      // Application submitted successfully
      setIsApplied(true);
      setApplyFormVisible(false);
      // Navigate to RecommendedJobScreen
      const currentJobId = jobDetails?.id || jobDetails?._id || jobId;
      navigation.navigate('RecommendedJob', { 
        jobId: currentJobId,
        jobData: jobDetails 
      });
    }
  };

  // Handle Request Chat
  const handleRequestChat = async () => {
    const token = await getObjByKey("loginResponse");
    if (!token) {
      navigation.navigate("Login");
      return;
    }

    const currentJobId = jobDetails?.id || jobDetails?._id || jobId;
    if (!currentJobId) {
      console.log('❌ JobDetailsScreen: No job ID found for chat request');
      return;
    }

    try {
      setRequestChatLoading(true);
      const url = `${BASE_URL}chat/request`;
      
      // Get jobTitle from jobDetails and sanitize it to remove any URL-like patterns
      let jobTitle = jobDetails?.title || jobDetails?.jobTitle || "this role";
      
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
      
      // Create message with jobTitle: "Hi, I would like to discuss the [jobTitle] role"
      const message = `Hi, I would like to discuss the ${jobTitle} role`;
      
      const payload = {
        jobId: currentJobId,
        message: message,
      };

      console.log('📡 JobDetailsScreen: Requesting chat:', url);
      console.log('📋 JobDetailsScreen: Payload being sent:', JSON.stringify(payload, null, 2));

      const result = await POSTNETWORK(url, payload, true);
      console.log('📥 JobDetailsScreen: Chat request response:', JSON.stringify(result, null, 2));

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
        
        console.log('✅ JobDetailsScreen: Chat request successful!');
        console.log('✅ JobDetailsScreen: Chat ID:', chatId);
        console.log('✅ JobDetailsScreen: Success message:', successMessage);
        
        setChatToastMessage({
          type: "success",
          msg: successMessage,
          visible: true,
        });
        
        // Navigate to UserChatScreen with chat ID after a short delay
        setTimeout(() => {
          if (chatId) {
            console.log('🚀 JobDetailsScreen: Navigating to SeekerChat with chatId:', chatId);
            navigation.navigate('SeekerChat', { chatId: chatId });
          } else {
            console.log('⚠️ JobDetailsScreen: No chat ID in response, navigating to SeekerChat without chatId');
            navigation.navigate('SeekerChat');
          }
        }, 1500);
      } else {
        const errorMessage = result?.message || result?.error || "Failed to send chat request. Please try again.";
        console.log('❌ JobDetailsScreen: Chat request failed');
        console.log('❌ JobDetailsScreen: Error message:', errorMessage);
        console.log('❌ JobDetailsScreen: Full error response:', JSON.stringify(result, null, 2));
        
        setChatToastMessage({
          type: "error",
          msg: errorMessage,
          visible: true,
        });
      }
    } catch (error) {
      console.error('❌ JobDetailsScreen: Exception during chat request:', error);
      console.error('❌ JobDetailsScreen: Error message:', error?.message);
      console.error('❌ JobDetailsScreen: Error stack:', error?.stack);
      
      setChatToastMessage({
        type: "error",
        msg: "An error occurred while sending chat request. Please try again.",
        visible: true,
      });
    } finally {
      setRequestChatLoading(false);
    }
  };

  // Construct logo URL - handle different field names (logo, companyLogoUrl, companyLogo)
  const logoUrl = jobDetails?.logo || jobDetails?.companyLogoUrl || jobDetails?.companyLogo
    ? (() => {
        const logo = jobDetails?.logo || jobDetails?.companyLogoUrl || jobDetails?.companyLogo;
        return logo.startsWith('http://') || logo.startsWith('https://') 
          ? logo 
          : `${BASE_URL.replace('/api/', '/')}${logo.replace(/^\//, '')}`;
      })()
    : null;

  // Format job type for display
  const formatJobType = (jobType) => {
    if (!jobType) return "NA";
    return jobType.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  // Format salary for display
  const formatSalary = (salaryRange) => {
    if (!salaryRange) return "NA";
    if (salaryRange.includes("-")) {
      const [min, max] = salaryRange.split("-");
      const minNum = parseInt(min);
      const maxNum = parseInt(max);
      if (minNum >= 1000) {
        return `₹${(minNum / 1000).toFixed(0)}k - ₹${(maxNum / 1000).toFixed(0)}k`;
      }
      return `₹${minNum.toLocaleString()} - ₹${maxNum.toLocaleString()}`;
    }
    return `₹${salaryRange}`;
  };

  // Format date to DD/MM/YYYY
  const formatDate = (dateString) => {
    if (!dateString) return "";
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "";
      }
      
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      
      return `${day}/${month}/${year}`;
    } catch (error) {
      return "";
    }
  };

  // Calculate average salary from range (in monthly format)
  const calculateAvgSalary = (salaryRange) => {
    if (!salaryRange || salaryRange === "NA") {
      // Default values in monthly (assuming annual was 2.4L - 3.6L)
      return { avg: 25000, min: 20000, max: 30000 };
    }
    if (salaryRange.includes("-")) {
      const [min, max] = salaryRange.split("-");
      const minNum = parseInt(min);
      const maxNum = parseInt(max);
      if (minNum && maxNum) {
        // Convert annual to monthly (divide by 12)
        const minMonthly = Math.round(minNum / 12);
        const maxMonthly = Math.round(maxNum / 12);
        const avgMonthly = Math.round((minMonthly + maxMonthly) / 2);
        return { avg: avgMonthly, min: minMonthly, max: maxMonthly };
      }
    } else {
      // Single salary value - convert to monthly
      const annual = parseInt(salaryRange);
      if (annual) {
        const monthly = Math.round(annual / 12);
        return { avg: monthly, min: monthly, max: monthly };
      }
    }
    return { avg: 25000, min: 20000, max: 30000 }; // Default values in monthly
  };

  const Container = Platform.OS === "ios" ? SafeAreaView : View;

  // Derived flag to show applied state even when passed from navigation
  const appliedFromRoute = route?.params?.isApplied === true;
  const displayApplied = appliedFromRoute || isApplied;

  if (loading && !jobDetails) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={BRANDCOLOR} />
        <Text style={styles.loadingText}>Loading job details...</Text>
      </View>
    );
  }

  if (!jobDetails) {
    return (
      <View style={styles.container}>
        <MyHeader
          showBack
          showCenterTitle
          title="Job Details"
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Job details not found</Text>
        </View>
      </View>
    );
  }

  return (
    <Container style={[
      styles.container,
      Platform.OS === "ios" && styles.containerIOS,
      Platform.OS === "android" && styles.containerAndroid
    ]}>
      <StatusBar
        barStyle={Platform.OS === "ios" ? "dark-content" : "dark-content"}
        backgroundColor={WHITE}
        translucent={Platform.OS === "android"}
      />

      <MyHeader
        showBack
        showCenterTitle
        title="Job Details"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[BRANDCOLOR]}
            tintColor={BRANDCOLOR}
          />
        }
      >
        {/* Header Section: Company Logo, Job Title, Company Name, Rating */}
        <View style={styles.headerSection}>
          <View style={styles.headerTopRow}>
            {logoUrl ? (
              <Image source={{ uri: logoUrl }} style={styles.companyLogo} defaultSource={LOGO} />
            ) : (
              <Image source={LOGO} style={styles.companyLogo} />
            )}
            <View style={styles.headerInfo}>
              <Text style={styles.jobTitleHeader}>
                {jobDetails.title || jobDetails.jobTitle || "NA"}
              </Text>
              <Text style={styles.companyNameHeader}>
                {(jobDetails.companyName || jobDetails.company) && (jobDetails.companyName || jobDetails.company).trim() !== "" 
                  ? (jobDetails.companyName || jobDetails.company) 
                  : "NA"}
              </Text>
              <View style={styles.ratingContainer}>
                <MaterialCommunityIcons name="star" size={16} color="#FFB800" />
                <Text style={styles.ratingText}>3.8</Text>
                <Text style={styles.reviewsText}>({jobDetails.applicationsCount || 423} reviews)</Text>
              </View>
              {(jobDetails.facebook || jobDetails.twitter || jobDetails.instagram || jobDetails.linkedin) && (
                <View style={styles.socialLinksRow}>
                  {jobDetails.facebook ? (
                    <TouchableOpacity
                      style={styles.socialLinkButton}
                      onPress={() => openSocialLink("facebook", jobDetails.facebook)}
                      activeOpacity={0.7}
                    >
                      <Image source={FACEBOOK} style={styles.socialLinkIcon} />
                    </TouchableOpacity>
                  ) : null}
                  {jobDetails.twitter ? (
                    <TouchableOpacity
                      style={styles.socialLinkButton}
                      onPress={() => openSocialLink("twitter", jobDetails.twitter)}
                      activeOpacity={0.7}
                    >
                      <Image source={TWITTER} style={styles.socialLinkIcon} />
                    </TouchableOpacity>
                  ) : null}
                  {jobDetails.instagram ? (
                    <TouchableOpacity
                      style={styles.socialLinkButton}
                      onPress={() => openSocialLink("instagram", jobDetails.instagram)}
                      activeOpacity={0.7}
                    >
                      <Image source={INSTAGRAM} style={styles.socialLinkIcon} />
                    </TouchableOpacity>
                  ) : null}
                  {jobDetails.linkedin ? (
                    <TouchableOpacity
                      style={styles.socialLinkButton}
                      onPress={() => openSocialLink("linkedin", jobDetails.linkedin)}
                      activeOpacity={0.7}
                    >
                      <Image source={LINKEDIN} style={styles.socialLinkIcon} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.headerStatsRow}>
            <Text style={styles.postedText}>Posted 21d ago</Text>
            <TouchableOpacity
              style={styles.wishlistButtonHeader}
              onPress={handleWishlist}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={isWishlisted ? "heart" : "heart-outline"}
                size={WIDTH * 0.06}
                color={isWishlisted ? "#FF6B6B" : BRANDCOLOR}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScrollContent}>
            {["Job Details", "About Company", "Reviews", "Benefits", "Salaries"].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.activeTab]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                  {tab}
                </Text>
                {activeTab === tab && <View style={styles.tabIndicator} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Content based on active tab */}
        {activeTab === "Job Details" && (
          <>
            {/* Job Highlights Card */}
            <View style={styles.highlightsCard}>
              <Text style={styles.highlightsTitle}>Job highlights</Text>
              <View style={styles.highlightsList}>
                <Text style={styles.highlightItem}>
                  • {jobDetails.experience || "1-3 years"} of experience in software development with proficiency in {jobDetails.skills?.split(",")[0] || "React.js"}, JavaScript, HTML5, and CSS
                </Text>
                <Text style={styles.highlightItem}>
                  • Design, build, and maintain high-performance front-end applications; ensure code quality and responsiveness; coordinate with back-end developers
                </Text>
              </View>
            </View>

            {/* Job Information Section */}
            <View style={styles.jobInfoSection}>
              <View style={styles.infoItem}>
                <MaterialCommunityIcons name="briefcase-outline" size={20} color={BRANDCOLOR} />
                <Text style={styles.infoItemText}>{jobDetails.experience || "1-3 Yrs"}</Text>
              </View>
              <View style={styles.infoItem}>
                <MaterialCommunityIcons name="account-outline" size={20} color={BRANDCOLOR} />
                <Text style={styles.infoItemText}>{jobDetails.noOfVacancy || 1} vacancy</Text>
              </View>
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="map-marker-outline" size={20} color={BRANDCOLOR} />
              <Text style={styles.infoItemText}>
                {formatLocation(jobDetails.city, jobDetails.state)}
              </Text>
            </View>
              <View style={styles.infoItem}>
                <MaterialCommunityIcons name="currency-inr" size={20} color={BRANDCOLOR} />
                <Text style={styles.infoItemText}>
                  {formatSalary(jobDetails.salaryRange || jobDetails.salary) !== "NA" 
                    ? formatSalary(jobDetails.salaryRange || jobDetails.salary) 
                    : "Not disclosed"}
                </Text>
              </View>
            </View>

            {/* Skills Section */}
            {jobDetails.skills && (
              <View style={styles.skillsSection}>
                <Text style={styles.skillsLabel}>Must have skills:</Text>
                <View style={styles.skillsContainer}>
                  {jobDetails.skills.split(",").slice(0, 5).map((skill, index) => (
                    <View key={index} style={styles.skillTag}>
                      <Text style={styles.skillText}>{skill.trim()}</Text>
                    </View>
                  ))}
                </View>
                {jobDetails.skills.split(",").length > 5 && (
                  <>
                    <Text style={styles.skillsLabel}>Good to have skills:</Text>
                    <View style={styles.skillsContainer}>
                      {jobDetails.skills.split(",").slice(5).map((skill, index) => (
                        <View key={index} style={styles.skillTag}>
                          <Text style={styles.skillText}>{skill.trim()}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}
              </View>
            )}

            {/* Job Description Section */}
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>Job description</Text>
              
              {jobDetails.description && (
                <Text style={styles.descriptionText}>{jobDetails.description}</Text>
              )}

              {/* What you'll do */}
              <Text style={styles.subsectionTitle}>What you'll do:</Text>
              <Text style={styles.descriptionText}>Join our Inclusive Team</Text>

              {/* Get To Know Us First */}
              <Text style={styles.subsectionTitle}>Get To Know Us First!</Text>
              <Text style={styles.descriptionText}>
                We are looking for highly motivated Front-end developer who is proficient with React.js, with a keen eye for user interface and layout and ability to challenge the status quo. You will create web and mobile User interface, design and develop UI framework for our product development needs.
              </Text>

              {/* Do You Make The Cut? */}
              <Text style={styles.subsectionTitle}>Do You Make The Cut?</Text>
              <Text style={styles.descriptionText}>
                You will ensure that these components and the overall application are robust and easy to maintain. You will involve in code reviews and coordinate with the rest of the team working on different layers of the infrastructure.
              </Text>

              {/* Responsibilities */}
              <Text style={styles.subsectionTitle}>Responsibilities:</Text>
              <View style={styles.responsibilitiesList}>
                <Text style={styles.responsibilityItem}>
                  • Analyze specifications and business needs to determine appropriate technologies and configurations to meet those business requirements
                </Text>
                <Text style={styles.responsibilityItem}>
                  • Lead, Design, build, and maintain high performance, reusable, and reliable code
                </Text>
                <Text style={styles.responsibilityItem}>
                  • Ensure the best possible performance, quality, and responsiveness of the application
                </Text>
                <Text style={styles.responsibilityItem}>
                  • Help maintain code quality using best Coding practices while playing an Individual contributor role
                </Text>
                <Text style={styles.responsibilityItem}>
                  • Translate storyboards and use cases into functional applications
                </Text>
                <Text style={styles.responsibilityItem}>
                  • Coordinate with back-end developers in integrating with front-end code
                </Text>
              </View>

              {/* Skills Set */}
              <Text style={styles.subsectionTitle}>Skills Set:</Text>
              <View style={styles.skillsList}>
                <Text style={styles.skillListItem}>
                  • 1+ years of software development experience with excellent coding skills experience with JavaScript, HTML5 & CSS
                </Text>
                <Text style={styles.skillListItem}>
                  • 1+ experience of MERN application development (preferably Reactjs, React Native)
                </Text>
                <Text style={styles.skillListItem}>
                  • Experience in mentoring a small team and code review
                </Text>
                <Text style={styles.skillListItem}>
                  • Hands-on experience in designing and good knowledge in OOPs concept
                </Text>
                <Text style={styles.skillListItem}>
                  • Strong understanding of native JavaScript, data structures, and algorithm problem-solving
                </Text>
                <Text style={styles.skillListItem}>
                  • Good understanding of JS frameworks and MVC frameworks
                </Text>
                <Text style={styles.skillListItem}>
                  • Thorough understanding of State management tools like Redux
                </Text>
                <Text style={styles.skillListItem}>
                  • Understanding of responsive design principles for UI rendering on desktop, tablet and mobile devices
                </Text>
                <Text style={styles.skillListItem}>
                  • Good to have experience in writing test cases
                </Text>
              </View>
            </View>

            {/* Apply and Request Chat Buttons - Below Job Description, Above Similar Jobs */}
            <View style={styles.buttonsSection}>
              {displayApplied ? (
                <View style={styles.appliedButton}>
                  <MaterialCommunityIcons name="check-circle" size={WIDTH * 0.05} color="#28a745" />
                  <Text style={styles.appliedButtonText}>Applied</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.applyNowButton}
                  onPress={handleApply}
                  activeOpacity={0.8}
                >
                  <Text style={styles.applyNowButtonText}>Apply now</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.requestChatButton,
                  requestChatLoading && styles.requestChatButtonDisabled
                ]}
                onPress={handleRequestChat}
                disabled={requestChatLoading}
                activeOpacity={0.8}
              >
                {requestChatLoading ? (
                  <View style={styles.requestChatButtonContent}>
                    <ActivityIndicator size="small" color={WHITE} />
                    <Text style={styles.requestChatButtonText}>Requesting...</Text>
                  </View>
                ) : (
                  <View style={styles.requestChatButtonContent}>
                    <MaterialCommunityIcons name="message-text-outline" size={WIDTH * 0.04} color={WHITE} />
                    <Text style={styles.requestChatButtonText}>Request Chat</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}

        {activeTab === "About Company" && (
          <View style={styles.aboutCompanySection}>
            <Text style={styles.sectionTitle}>About Company</Text>
            <Text style={styles.descriptionText}>
              Company information will be displayed here.
            </Text>
          </View>
        )}

        {activeTab === "Reviews" && (
          <View style={styles.reviewsSection}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.sectionTitle}>Reviews</Text>
              <TouchableOpacity
                style={styles.wishlistButtonInReviews}
                onPress={handleWishlist}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={isWishlisted ? "heart" : "heart-outline"}
                  size={WIDTH * 0.06}
                  color={isWishlisted ? "#FF6B6B" : BRANDCOLOR}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeTab === "Benefits" && (
          <View style={styles.benefitsSection}>
            <Text style={styles.sectionTitle}>Benefits</Text>
            <Text style={styles.descriptionText}>
              Benefits information will be displayed here.
            </Text>
          </View>
        )}

        {activeTab === "Salaries" && (() => {
          const salaryData = calculateAvgSalary(jobDetails.salaryRange || jobDetails.salary);
          const rangePercentage = salaryData.max > salaryData.min 
            ? ((salaryData.avg - salaryData.min) / (salaryData.max - salaryData.min)) * 100 
            : 50;
          
          return (
            <View style={styles.salariesSection}>
              <Text style={styles.sectionTitle}>Salary insights</Text>
              <Text style={styles.salaryDescription}>
                Compare salaries of {jobDetails.title || jobDetails.jobTitle || "Software Development Engineer"} with similar companies.
              </Text>
              
              <View style={styles.salaryCard}>
                <Text style={styles.avgSalaryText}>
                  Avg. Salary - ₹ {salaryData.avg.toLocaleString()}
                </Text>
                <View style={styles.salaryRangeContainer}>
                  <View style={styles.salaryRangeBar}>
                    <View style={[styles.salaryRangeFill, { width: `${Math.min(Math.max(rangePercentage, 0), 100)}%` }]} />
                  </View>
                  <View style={styles.salaryRangeLabels}>
                    <Text style={styles.salaryRangeLabel}>
                      Min ₹{salaryData.min.toLocaleString()}
                    </Text>
                    <Text style={styles.salaryRangeLabel}>
                      Max ₹{salaryData.max.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          );
        })()}

        {/* Similar Jobs Section */}
        {activeTab === "Job Details" && (
          <View style={styles.similarJobsSection}>
            <Text style={styles.sectionTitle}>Similar jobs</Text>
            {similarJobs.length > 0 ? (
              similarJobs.map((job, index) => {
                const similarJobId = job.id || job._id;
                const similarLogoUrl = job.logo || job.companyLogoUrl || job.companyLogo
                  ? (() => {
                      const logo = job.logo || job.companyLogoUrl || job.companyLogo;
                      return logo.startsWith('http://') || logo.startsWith('https://') 
                        ? logo 
                        : `${BASE_URL.replace('/api/', '/')}${logo.replace(/^\//, '')}`;
                    })()
                  : null;
                
                return (
                  <TouchableOpacity
                    key={similarJobId || index}
                    style={styles.similarJobCard}
                    onPress={() => {
                      navigation.push('SeekerJobDetails', {
                        jobId: similarJobId,
                        jobData: job,
                      });
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.similarJobLeft}>
                      <Text style={styles.similarJobTitle}>
                        {job.title || job.jobTitle || "NA"}
                      </Text>
                      <Text style={styles.similarJobCompany}>
                        {job.companyName || job.company || "NA"}
                      </Text>
                      <View style={styles.similarJobInfo}>
                        {job.rating && (
                          <View style={styles.similarJobInfoItem}>
                            <MaterialCommunityIcons name="star" size={14} color="#FFB800" />
                            <Text style={styles.similarJobInfoText}>
                              {job.rating} ({job.reviewsCount || 0} Reviews)
                            </Text>
                          </View>
                        )}
                        {job.city && (
                          <View style={styles.similarJobInfoItem}>
                            <MaterialCommunityIcons name="map-marker-outline" size={14} color={BRANDCOLOR} />
                            <Text style={styles.similarJobInfoText}>{job.city}</Text>
                          </View>
                        )}
                        {job.experience && (
                          <View style={styles.similarJobInfoItem}>
                            <MaterialCommunityIcons name="briefcase-outline" size={14} color={BRANDCOLOR} />
                            <Text style={styles.similarJobInfoText}>{job.experience}</Text>
                          </View>
                        )}
                        {(job.salaryRange || job.salary) && (
                          <View style={styles.similarJobInfoItem}>
                            <MaterialCommunityIcons name="currency-inr" size={14} color={BRANDCOLOR} />
                            <Text style={styles.similarJobInfoText}>
                              {formatSalary(job.salaryRange || job.salary)}
                            </Text>
                          </View>
                        )}
                      </View>
                      {job.skills && (
                        <Text style={styles.similarJobSkills} numberOfLines={1}>
                          {job.skills}
                        </Text>
                      )}
                      {(job.createdAt || job.postedAt || job.created_at || job.posted_at) && (
                        <Text style={styles.similarJobPosted}>
                          {formatDate(job.createdAt || job.postedAt || job.created_at || job.posted_at)}
                        </Text>
                      )}
                    </View>
                    <View style={styles.similarJobRight}>
                      {similarLogoUrl ? (
                        <Image source={{ uri: similarLogoUrl }} style={styles.similarJobLogo} defaultSource={LOGO} />
                      ) : (
                        <View style={styles.similarJobLogo}>
                          <Text style={styles.similarJobLogoText}>
                            {(job.companyName || job.company || "N")[0].toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <TouchableOpacity 
                        style={styles.similarJobWishlistButton} 
                        activeOpacity={0.7}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleSimilarJobWishlist(similarJobId, index);
                        }}
                      >
                        <MaterialCommunityIcons 
                          name={similarJobsWishlist.get(similarJobId?.toString()) ? "heart" : "heart-outline"} 
                          size={20} 
                          color={similarJobsWishlist.get(similarJobId?.toString()) ? "#FF6B6B" : BRANDCOLOR} 
                        />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.noSimilarJobs}>
                <Text style={styles.noSimilarJobsText}>No similar jobs found</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

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

      {/* Apply Job Form Modal */}
      <ApplyJobForm
        visible={applyFormVisible}
        onClose={handleCloseApplyForm}
        onSubmit={handleSubmitApplication}
        jobId={jobDetails?.id || jobDetails?._id || jobId}
        jobTitle={jobDetails?.title || jobDetails?.jobTitle}
        companyName={jobDetails?.companyName || jobDetails?.company}
      />
    </Container>
  );
};

export default JobDetailsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WHITE,
  },
  containerIOS: {
    paddingTop: Platform.OS === "ios" ? 0 : 0,
  },
  containerAndroid: {
    paddingTop: Platform.OS === "android" ? 0 : 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: WHITE,
  },
  loadingText: {
    marginTop: HEIGHT * 0.02,
    fontSize: WIDTH * 0.04,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: WIDTH * 0.04,
    color: "#999",
  },
  scrollContent: {
    paddingBottom: HEIGHT * 0.05,
  },
  headerSection: {
    padding: WIDTH * 0.04,
    paddingBottom: HEIGHT * 0.02,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: HEIGHT * 0.015,
  },
  companyLogo: {
    width: WIDTH * 0.15,
    height: WIDTH * 0.15,
    borderRadius: WIDTH * 0.02,
    resizeMode: "contain",
    marginRight: WIDTH * 0.03,
    backgroundColor: "#F5F5F5",
  },
  headerInfo: {
    flex: 1,
  },
  jobTitleHeader: {
    fontSize: WIDTH * 0.045,
    fontFamily: UBUNTUBOLD,
    color: BLACK,
    marginBottom: HEIGHT * 0.008,
  },
  companyNameHeader: {
    fontSize: WIDTH * 0.038,
    fontFamily: FIRASANSSEMIBOLD,
    color: BRANDCOLOR,
    marginBottom: HEIGHT * 0.008,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: WIDTH * 0.015,
  },
  ratingText: {
    fontSize: WIDTH * 0.035,
    fontFamily: FIRASANSSEMIBOLD,
    color: BLACK,
  },
  reviewsText: {
    fontSize: WIDTH * 0.032,
    color: "#666",
  },
  socialLinksRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: WIDTH * 0.03,
    marginTop: HEIGHT * 0.012,
  },
  socialLinkButton: {
    width: WIDTH * 0.095,
    height: WIDTH * 0.095,
    borderRadius: WIDTH * 0.03,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  socialLinkIcon: {
    width: WIDTH * 0.05,
    height: WIDTH * 0.05,
    resizeMode: "contain",
  },
  headerStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: HEIGHT * 0.01,
  },
  postedText: {
    fontSize: WIDTH * 0.032,
    color: "#666",
  },
  wishlistButtonHeader: {
    padding: WIDTH * 0.02,
  },
  tabContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    backgroundColor: WHITE,
  },
  tabScrollContent: {
    paddingHorizontal: WIDTH * 0.02,
  },
  tab: {
    paddingVertical: HEIGHT * 0.015,
    paddingHorizontal: WIDTH * 0.04,
    marginRight: WIDTH * 0.02,
    position: "relative",
  },
  activeTab: {
    // Active tab styling
  },
  tabText: {
    fontSize: WIDTH * 0.035,
    fontFamily: FIRASANSSEMIBOLD,
    color: "#666",
  },
  activeTabText: {
    color: BRANDCOLOR,
    fontFamily: UBUNTUBOLD,
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: WIDTH * 0.04,
    right: WIDTH * 0.04,
    height: 3,
    backgroundColor: BRANDCOLOR,
    borderRadius: 2,
  },
  highlightsCard: {
    backgroundColor: "#F8F9FA",
    margin: WIDTH * 0.04,
    padding: WIDTH * 0.04,
    borderRadius: WIDTH * 0.025,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  highlightsTitle: {
    fontSize: WIDTH * 0.04,
    fontFamily: UBUNTUBOLD,
    color: BLACK,
    marginBottom: HEIGHT * 0.015,
  },
  highlightsList: {
    gap: HEIGHT * 0.01,
  },
  highlightItem: {
    fontSize: WIDTH * 0.035,
    color: "#333",
    lineHeight: HEIGHT * 0.025,
  },
  jobInfoSection: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: WIDTH * 0.04,
    paddingVertical: HEIGHT * 0.02,
    gap: WIDTH * 0.03,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: WIDTH * 0.02,
    width: "48%",
  },
  infoItemText: {
    fontSize: WIDTH * 0.033,
    color: "#333",
    flex: 1,
  },
  skillsSection: {
    padding: WIDTH * 0.04,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  skillsLabel: {
    fontSize: WIDTH * 0.035,
    fontFamily: FIRASANSSEMIBOLD,
    color: BLACK,
    marginBottom: HEIGHT * 0.01,
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: WIDTH * 0.02,
    marginBottom: HEIGHT * 0.015,
  },
  skillTag: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: WIDTH * 0.03,
    paddingVertical: HEIGHT * 0.008,
    borderRadius: WIDTH * 0.02,
    borderWidth: 1,
    borderColor: BRANDCOLOR,
  },
  skillText: {
    fontSize: WIDTH * 0.032,
    color: BRANDCOLOR,
    fontFamily: FIRASANSSEMIBOLD,
  },
  descriptionSection: {
    padding: WIDTH * 0.04,
  },
  sectionTitle: {
    fontSize: WIDTH * 0.04,
    fontFamily: UBUNTUBOLD,
    color: BLACK,
    marginBottom: HEIGHT * 0.015,
  },
  subsectionTitle: {
    fontSize: WIDTH * 0.038,
    fontFamily: FIRASANSSEMIBOLD,
    color: BLACK,
    marginTop: HEIGHT * 0.02,
    marginBottom: HEIGHT * 0.01,
  },
  descriptionText: {
    fontSize: WIDTH * 0.035,
    color: "#333",
    lineHeight: HEIGHT * 0.025,
    marginBottom: HEIGHT * 0.015,
  },
  responsibilitiesList: {
    gap: HEIGHT * 0.01,
    marginBottom: HEIGHT * 0.015,
  },
  responsibilityItem: {
    fontSize: WIDTH * 0.035,
    color: "#333",
    lineHeight: HEIGHT * 0.025,
  },
  skillsList: {
    gap: HEIGHT * 0.01,
  },
  skillListItem: {
    fontSize: WIDTH * 0.035,
    color: "#333",
    lineHeight: HEIGHT * 0.025,
  },
  aboutCompanySection: {
    padding: WIDTH * 0.04,
  },
  reviewsSection: {
    padding: WIDTH * 0.04,
  },
  benefitsSection: {
    padding: WIDTH * 0.04,
  },
  reviewsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: HEIGHT * 0.015,
  },
  wishlistButtonInReviews: {
    padding: WIDTH * 0.02,
  },
  similarJobsSection: {
    padding: WIDTH * 0.04,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    marginTop: HEIGHT * 0.02,
  },
  similarJobCard: {
    flexDirection: "row",
    backgroundColor: "#F8F9FA",
    borderRadius: WIDTH * 0.025,
    padding: WIDTH * 0.04,
    marginBottom: HEIGHT * 0.015,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  similarJobLeft: {
    flex: 1,
    marginRight: WIDTH * 0.03,
  },
  similarJobTitle: {
    fontSize: WIDTH * 0.04,
    fontFamily: UBUNTUBOLD,
    color: BLACK,
    marginBottom: HEIGHT * 0.005,
  },
  similarJobCompany: {
    fontSize: WIDTH * 0.035,
    fontFamily: FIRASANSSEMIBOLD,
    color: "#666",
    marginBottom: HEIGHT * 0.01,
  },
  similarJobInfo: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: WIDTH * 0.03,
    marginBottom: HEIGHT * 0.01,
  },
  similarJobInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: WIDTH * 0.01,
  },
  similarJobInfoText: {
    fontSize: WIDTH * 0.032,
    color: "#666",
  },
  similarJobSkills: {
    fontSize: WIDTH * 0.032,
    color: "#666",
    marginBottom: HEIGHT * 0.005,
  },
  similarJobPosted: {
    fontSize: WIDTH * 0.03,
    color: "#999",
  },
  similarJobRight: {
    alignItems: "center",
    justifyContent: "flex-start",
    gap: HEIGHT * 0.01,
  },
  similarJobLogo: {
    width: WIDTH * 0.12,
    height: WIDTH * 0.12,
    borderRadius: WIDTH * 0.02,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  similarJobLogoText: {
    fontSize: WIDTH * 0.05,
    fontFamily: UBUNTUBOLD,
    color: WHITE,
  },
  similarJobWishlistButton: {
    padding: WIDTH * 0.02,
  },
  salariesSection: {
    padding: WIDTH * 0.04,
  },
  salaryDescription: {
    fontSize: WIDTH * 0.035,
    color: "#666",
    marginBottom: HEIGHT * 0.02,
    lineHeight: HEIGHT * 0.025,
  },
  salaryCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: WIDTH * 0.025,
    padding: WIDTH * 0.04,
    marginBottom: HEIGHT * 0.02,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  avgSalaryText: {
    fontSize: WIDTH * 0.05,
    fontFamily: UBUNTUBOLD,
    color: BLACK,
    marginBottom: HEIGHT * 0.015,
    textAlign: "center",
  },
  salaryRangeContainer: {
    marginTop: HEIGHT * 0.015,
  },
  salaryRangeBar: {
    height: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    marginBottom: HEIGHT * 0.01,
    overflow: "hidden",
  },
  salaryRangeFill: {
    height: "100%",
    width: "85%",
    backgroundColor: BRANDCOLOR,
    borderRadius: 4,
  },
  salaryRangeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  salaryRangeLabel: {
    fontSize: WIDTH * 0.032,
    color: "#666",
    fontFamily: FIRASANSSEMIBOLD,
  },
  buttonsSection: {
    padding: WIDTH * 0.04,
    paddingTop: HEIGHT * 0.02,
    paddingBottom: HEIGHT * 0.02,
    flexDirection: "row",
    gap: WIDTH * 0.03,
  },
  applyNowButton: {
    flex: 1,
    backgroundColor: BRANDCOLOR,
    borderRadius: WIDTH * 0.025,
    paddingVertical: HEIGHT * 0.018,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  applyNowButtonText: {
    color: WHITE,
    fontSize: WIDTH * 0.04,
    fontFamily: UBUNTUBOLD,
  },
  appliedButton: {
    flex: 1,
    backgroundColor: "#E8F5E9",
    borderRadius: WIDTH * 0.025,
    paddingVertical: HEIGHT * 0.018,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: WIDTH * 0.02,
    borderWidth: 2,
    borderColor: "#28a745",
  },
  appliedButtonText: {
    color: "#28a745",
    fontSize: WIDTH * 0.04,
    fontFamily: UBUNTUBOLD,
  },
  requestChatButton: {
    flex: 1,
    backgroundColor: BRANDCOLOR,
    borderRadius: WIDTH * 0.025,
    paddingVertical: HEIGHT * 0.018,
    paddingHorizontal: WIDTH * 0.04,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  requestChatButtonDisabled: {
    opacity: 0.6,
  },
  requestChatButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: WIDTH * 0.02,
  },
  requestChatButtonText: {
    color: WHITE,
    fontSize: WIDTH * 0.037,
    fontFamily: UBUNTUBOLD,
  },
});



