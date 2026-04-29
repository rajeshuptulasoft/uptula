import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StatusBar,
  FlatList,
  Image,
  Pressable,
  Modal,
  StyleSheet,
  RefreshControl,
  BackHandler,
  Platform,
  SafeAreaView,
  ScrollView,
  Linking,
  ActivityIndicator,
  TouchableOpacity,
  PermissionsAndroid,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import ReactNativeBlobUtil from 'react-native-blob-util';

// Try to import WebView for PDF viewing
let WebView = null;
try {
  const WebViewModule = require('react-native-webview');
  WebView = WebViewModule.WebView;
} catch (e) {
  // WebView not available
}

import { WHITE, BLACK, BRANDCOLOR } from "../../../constant/color";
import { UBUNTUBOLD, UBUNTU, FIRASANSSEMIBOLD, ROBOTOSEMIBOLD, CANTARELLBOLD, FIRASANSBOLD } from "../../../constant/fontPath";
import { HEIGHT, WIDTH } from "../../../constant/config";
import { MyHeader } from "../../../components/commonComponents/MyHeader";
import { MyAlert } from "../../../components/commonComponents/MyAlert";
import { CustomButton } from "../../../components/commonComponents/Button";
import { ToastMessage } from "../../../components/commonComponents/ToastMessage";
import { DELETE, LOGO, FILTER, VIEW } from "../../../constant/imagePath";
import { BASE_URL } from "../../../constant/url";
import { GETNETWORK, POSTNETWORK, DELETENETWORK } from "../../../utils/Network";
import { getObjByKey } from "../../../utils/Storage";

const ViewCandidate = () => {
  const navigation = useNavigation();
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedJob, setSelectedJob] = useState("");
  const [deleteAlertVisible, setDeleteAlertVisible] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [resumeViewVisible, setResumeViewVisible] = useState(false);
  const [resumeCandidate, setResumeCandidate] = useState(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterDropdownVisible, setFilterDropdownVisible] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [toastMessage, setToastMessage] = useState({
    type: "",
    msg: "",
    visible: false,
  });
  const [applicationDecisionMap, setApplicationDecisionMap] = useState({});

  // Fetch applications from API
  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const url = `${BASE_URL}employer/applications`;

      const loginResponse = await getObjByKey('loginResponse');
      if (!loginResponse || !loginResponse.token) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const result = await GETNETWORK(url, true);

      let applicationsData = [];
      if (Array.isArray(result)) {
        applicationsData = result;
      } else if (result?.data && Array.isArray(result.data)) {
        applicationsData = result.data;
      } else if (result?.applications && Array.isArray(result.applications)) {
        applicationsData = result.applications;
      } else if (result?.data?.applications && Array.isArray(result.data.applications)) {
        applicationsData = result.data.applications;
      }

      if (applicationsData && applicationsData.length > 0) {
        setCandidates(applicationsData);
        applicationsData.forEach((candidate) => {
          const applicationId = candidate?.applicationId || candidate?.id || candidate?._id;
          if (applicationId) {
            fetchApplicationDecision(applicationId);
          }
        });
      } else {
        setCandidates([]);
      }
    } catch (error) {
      setCandidates([]);
      setToastMessage({
        type: "error",
        msg: "Failed to load applications. Please try again.",
        visible: true,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const normalizeDecision = (decisionValue) => {
    const decision = (decisionValue || "").toString().trim().toLowerCase();
    if (!decision) return "";
    if (decision === "accepted") return "accept";
    if (decision === "rejected") return "reject";
    if (decision === "viewed") return "view";
    return decision;
  };

  const fetchApplicationDecision = useCallback(async (applicationId) => {
    if (!applicationId) return;
    try {
      const loginResponse = await getObjByKey("loginResponse");
      if (!loginResponse || !loginResponse.token) return;

      const url = `${BASE_URL}applications/${applicationId}`;
      const result = await GETNETWORK(url, true);
      const decision =
        result?.decision ||
        result?.data?.decision ||
        result?.application?.decision ||
        result?.data?.application?.decision ||
        result?.status ||
        result?.data?.status ||
        "";

      setApplicationDecisionMap((prev) => ({
        ...prev,
        [String(applicationId)]: normalizeDecision(decision),
      }));
    } catch (error) {
      // Keep card actions usable if one decision lookup fails
    }
  }, []);

  const getActionVisibility = (candidate) => {
    const applicationId = candidate?.applicationId || candidate?.id || candidate?._id;
    const decision = normalizeDecision(applicationDecisionMap[String(applicationId)]);
    if (decision === "accept" || decision === "reject") {
      return { showApprove: false, showReject: true, showView: false };
    }
    if (decision === "view") {
      return { showApprove: true, showReject: true, showView: false };
    }
    return { showApprove: true, showReject: true, showView: true };
  };

  // Format category name: replace underscores, capitalize each word, keep acronyms uppercase
  const formatCategoryName = (category) => {
    if (!category) return 'N/A';

    // Replace underscores with spaces
    let formatted = category.replace(/_/g, ' ');

    // Split into words
    const words = formatted.split(' ');

    // Capitalize each word, but keep acronyms (2-3 letter words) in uppercase
    const capitalizedWords = words.map(word => {
      const trimmedWord = word.trim();
      if (trimmedWord.length <= 3 && trimmedWord.toUpperCase() === trimmedWord) {
        // Keep acronyms as uppercase (like IT, HR)
        return trimmedWord.toUpperCase();
      } else if (trimmedWord.length <= 3) {
        // Convert short words to uppercase (like it -> IT)
        return trimmedWord.toUpperCase();
      } else {
        // Capitalize first letter of longer words
        return trimmedWord.charAt(0).toUpperCase() + trimmedWord.slice(1).toLowerCase();
      }
    });

    return capitalizedWords.join(' ');
  };

  // Fetch categories from API
  const fetchCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      const url = `${BASE_URL}jobs/categories`;
      const result = await GETNETWORK(url, false); // No token required

      if (result && !result.message) {
        const categoriesData = result?.data || result?.categories || result?.list || result || [];
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      } else {
        setCategories([]);
      }
    } catch (error) {
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  // Fetch applications on component mount
  useEffect(() => {
    fetchApplications();
    fetchCategories();
  }, [fetchApplications, fetchCategories]);

  // Refetch applications when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchApplications();
    }, [fetchApplications])
  );

  // Handle back button press - navigate to ProviderHome
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (resumeViewVisible) {
        setResumeViewVisible(false);
        setResumeCandidate(null);
        return true;
      }
      if (detailModalVisible) {
        setDetailModalVisible(false);
        setSelectedCandidate(null);
        return true;
      }
      if (deleteAlertVisible) {
        setDeleteAlertVisible(false);
        setSelectedCandidate(null);
        return true;
      }
      if (filterDropdownVisible) {
        setFilterDropdownVisible(false);
        return true;
      }
      // Navigate to ProviderHome tab
      navigation.navigate("ProviderHome");
      return true;
    });

    return () => backHandler.remove();
  }, [navigation, resumeViewVisible, detailModalVisible, deleteAlertVisible, filterDropdownVisible]);

  // Helper function to get category from candidate
  const getCandidateCategory = (candidate) => {
    // Try multiple possible field names for category
    return candidate?.category ||
      candidate?.jobCategory ||
      candidate?.job_category ||
      candidate?.job?.category ||
      candidate?.job?.jobCategory ||
      candidate?.job?.job_category ||
      candidate?.job?.jobCategory ||
      candidate?.jobId?.category ||
      candidate?.jobId?.jobCategory ||
      candidate?.application?.job?.category ||
      candidate?.application?.category ||
      "";
  };

  // Helper function to normalize category for comparison
  const normalizeCategory = (cat) => {
    if (!cat) return "";
    // Normalize: lowercase, replace underscores/hyphens with spaces, trim
    return cat.toString().toLowerCase().replace(/[_-]/g, ' ').trim();
  };

  // Helper function to check if two categories match
  const categoriesMatch = (cat1, cat2) => {
    if (!cat1 || !cat2) return false;

    const normalized1 = normalizeCategory(cat1);
    const normalized2 = normalizeCategory(cat2);

    // Exact normalized match
    if (normalized1 === normalized2) return true;

    // Match without spaces
    if (normalized1.replace(/\s/g, '') === normalized2.replace(/\s/g, '')) return true;

    // Match original case-insensitive
    if (cat1.toString().toLowerCase() === cat2.toString().toLowerCase()) return true;

    // Match without underscores/hyphens
    const noSpecial1 = cat1.toString().toLowerCase().replace(/[_-]/g, '');
    const noSpecial2 = cat2.toString().toLowerCase().replace(/[_-]/g, '');
    if (noSpecial1 === noSpecial2) return true;

    return false;
  };

  // Filter candidates based on selected category
  const filteredCandidates = useMemo(() => {
    let filtered = candidates;

    // Filter by category if selected
    if (selectedCategory !== "") {
      filtered = filtered.filter((candidate) => {
        const candidateCategory = getCandidateCategory(candidate);
        return categoriesMatch(candidateCategory, selectedCategory);
      });
    }

    return filtered;
  }, [candidates, selectedCategory]);

  // Handle category selection from dropdown
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setFilterDropdownVisible(false);
    // Force re-render of filtered list
    if (category === "") {
      // If "All Categories" selected, show all candidates
      // The filteredCandidates useMemo will handle this
    }
  };

  // Handle filter icon press
  const handleFilterPress = () => {
    setFilterDropdownVisible(!filterDropdownVisible);
    if (!filterDropdownVisible && categories.length === 0) {
      fetchCategories();
    }
  };

  // Reset filters and refresh candidates
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Reset filters
    setSelectedCategory("");
    // Fetch fresh data from API
    fetchApplications();
  }, [fetchApplications]);

  const handleDelete = (candidate) => {
    setSelectedCandidate(candidate);
    setDeleteAlertVisible(true);
  };

  const handleApproveCandidate = (candidate) => {
    const candidateName = candidate?.name || "Candidate";
    setToastMessage({
      type: "success",
      msg: `${candidateName} approved`,
      visible: true,
    });
  };

  const handleRejectCandidate = (candidate) => {
    const candidateName = candidate?.name || "Candidate";
    setToastMessage({
      type: "error",
      msg: `${candidateName} rejected`,
      visible: true,
    });
  };

  const confirmDelete = async () => {
    if (!selectedCandidate) {
      return;
    }

    try {
      const applicantId = selectedCandidate?.id || selectedCandidate?._id || selectedCandidate?.applicationId;
      if (!applicantId) {
        setToastMessage({
          type: "error",
          msg: "Applicant ID not found",
          visible: true,
        });
        setDeleteAlertVisible(false);
        setSelectedCandidate(null);
        return;
      }

      const loginResponse = await getObjByKey('loginResponse');
      if (!loginResponse || !loginResponse.token) {
        setToastMessage({
          type: "error",
          msg: "Authentication required. Please login again.",
          visible: true,
        });
        setDeleteAlertVisible(false);
        setSelectedCandidate(null);
        return;
      }

      const url = `${BASE_URL}employer/applications/${applicantId}`;

      setToastMessage({
        type: "success",
        msg: "Deleting candidate...",
        visible: true,
      });

      const result = await DELETENETWORK(url, true);

      if (result && !result.error && !result.errors) {
        // Remove candidate from list
        setCandidates(candidates.filter((c) => {
          const cId = c?.id || c?._id || c?.applicationId;
          return cId !== applicantId;
        }));

        setDeleteAlertVisible(false);
        setSelectedCandidate(null);

        // Show success toast
        setToastMessage({
          type: "success",
          msg: result?.message || "Candidate deleted successfully!",
          visible: true,
        });
      } else {
        // Show error toast
        setToastMessage({
          type: "error",
          msg: result?.message || "Failed to delete candidate",
          visible: true,
        });
        setDeleteAlertVisible(false);
        setSelectedCandidate(null);
      }
    } catch (error) {
      console.error('Error deleting candidate:', error);
      setToastMessage({
        type: "error",
        msg: "Failed to delete candidate. Please try again.",
        visible: true,
      });
      setDeleteAlertVisible(false);
      setSelectedCandidate(null);
    }
  };

  // Get full resume URL
  const getResumeUrl = (resumeUrl) => {
    if (!resumeUrl) {
      return null;
    }
    if (resumeUrl.startsWith('http')) {
      return resumeUrl;
    }
    const baseDomain = BASE_URL.replace('/api/', '');
    const fullUrl = resumeUrl.startsWith('/') ? `${baseDomain}${resumeUrl}` : `${baseDomain}/${resumeUrl}`;
    return fullUrl;
  };

  // Check if URL is PDF
  const isPdfUrl = (url) => {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    return lowerUrl.endsWith('.pdf') || lowerUrl.includes('.pdf?') || lowerUrl.includes('application/pdf');
  };

  // Request storage permission for Android
  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        if (Platform.Version >= 33) {
          return true;
        }

        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'App needs access to your storage to download resume',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          return true;
        } else {
          return false;
        }
      } catch (err) {
        return false;
      }
    }
    return true;
  };

  // Handle resume download via API and save to device
  const handleDownloadResume = async (candidate) => {
    try {
      const applicantId = candidate?.id || candidate?._id || candidate?.applicationId;
      if (!applicantId) {
        setToastMessage({
          type: "error",
          msg: "Applicant ID not found",
          visible: true,
        });
        return;
      }

      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        setToastMessage({
          type: "error",
          msg: "Storage permission is required to download resume",
          visible: true,
        });
        return;
      }

      const loginResponse = await getObjByKey('loginResponse');
      if (!loginResponse || !loginResponse.token) {
        setToastMessage({
          type: "error",
          msg: "Authentication required. Please login again.",
          visible: true,
        });
        return;
      }

      const url = `${BASE_URL}employer/download-resume/${applicantId}`;

      setToastMessage({
        type: "success",
        msg: "Downloading resume...",
        visible: true,
      });

      const result = await POSTNETWORK(url, {}, true);

      if (result && !result.error && !result.errors) {
        let downloadUrl = result.downloadUrl || result.url || result.resume_url;

        if (!downloadUrl && candidate?.resume_url) {
          downloadUrl = getResumeUrl(candidate.resume_url);
        }

        if (!downloadUrl) {
          throw new Error("Resume URL not available");
        }

        const urlParts = downloadUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const fileExtension = fileName.includes('.') ? fileName.split('.').pop() : 'pdf';
        const candidateName = candidate?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Resume';
        const finalFileName = `${candidateName}_Resume_${Date.now()}.${fileExtension}`;

        const downloadDir = Platform.OS === 'ios'
          ? ReactNativeBlobUtil.fs.dirs.DocumentDir
          : ReactNativeBlobUtil.fs.dirs.DownloadDir;
        const filePath = `${downloadDir}/${finalFileName}`;

        const configOptions = {
          fileCache: true,
          addAndroidDownloads: Platform.OS === 'android' ? {
            useDownloadManager: true,
            notification: true,
            path: filePath,
            description: `Downloading ${candidateName}'s resume`,
            title: finalFileName,
            mediaScannable: true,
          } : undefined,
          path: filePath,
        };

        const response = await ReactNativeBlobUtil
          .config(configOptions)
          .fetch('GET', downloadUrl, {
            Authorization: `Bearer ${loginResponse.token}`,
          });

        setToastMessage({
          type: "success",
          msg: `Resume downloaded to ${Platform.OS === 'android' ? 'Downloads' : 'Documents'} folder`,
          visible: true,
        });
      } else {
        setToastMessage({
          type: "error",
          msg: result?.message || "Failed to download resume",
          visible: true,
        });
      }
    } catch (error) {
      setToastMessage({
        type: "error",
        msg: "Failed to download resume",
        visible: true,
      });
    }
  };

  // Handle card press - show detail modal
  const handleCardPress = (item) => {
    setSelectedCandidate(item);
    setDetailModalVisible(true);
  };

  // Handle view resume from modal or card - open in Google Drive or default PDF viewer
  const handleViewResume = async (item) => {
    if (item && item.resume_url) {
      try {
        const resumeUrl = getResumeUrl(item.resume_url);
        if (resumeUrl) {
          // Get authentication token
          const loginResponse = await getObjByKey('loginResponse');
          const token = loginResponse?.token || (typeof loginResponse?.data === 'string' ? loginResponse.data : loginResponse?.data?.token) || loginResponse?.data;

          // Download PDF to temporary location
          const downloadDir = Platform.OS === 'ios'
            ? ReactNativeBlobUtil.fs.dirs.CacheDir
            : ReactNativeBlobUtil.fs.dirs.CacheDir;

          const fileName = `resume_${Date.now()}.pdf`;
          const filePath = `${downloadDir}/${fileName}`;

          const configOptions = {
            fileCache: true,
            path: filePath,
          };

          const headers = {};
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }

          // Download the PDF file
          const response = await ReactNativeBlobUtil
            .config(configOptions)
            .fetch('GET', resumeUrl, headers);

          // Get the file path
          const downloadedPath = response.path();

          // Open the downloaded file - this will trigger system app picker
          if (Platform.OS === 'android') {
            // For Android, use ReactNativeBlobUtil to open file which triggers app picker
            ReactNativeBlobUtil.android.actionViewIntent(
              downloadedPath,
              'application/pdf'
            );
          } else {
            // For iOS, use file:// URL
            await Linking.openURL(`file://${downloadedPath}`);
          }
        }
      } catch (error) {
        // Silently fail
      }
    }
  };

  const renderCandidate = ({ item, index }) => {
    // Extract data from API response
    const candidateName = item?.name || "Candidate";
    const jobTitle = item?.job_title || "Job Title";
    const companyName = item?.company_name || "";
    const actionVisibility = getActionVisibility(item);

    return (
      <Pressable
        style={[
          styles.card,
          index % 2 === 0 ? styles.cardLeft : styles.cardRight
        ]}
        onPress={() => handleCardPress(item)}
        onLongPress={() => handleDelete(item)}
      >
        <View style={styles.cardContent}>
          {/* Card Info - Vertical Layout */}
          <View style={styles.cardInfo}>
            <Text style={styles.candidateName} numberOfLines={2}>{candidateName}</Text>
            <Text style={styles.jobTitle} numberOfLines={1}>{jobTitle}</Text>
            {companyName ? (
              <Text style={styles.companyName} numberOfLines={1}>{companyName}</Text>
            ) : null}
          </View>

          {/* Card Action Buttons */}
          <View style={styles.cardActionRow}>
            {actionVisibility.showApprove ? (
              <Pressable
                style={[styles.actionIconBtn, styles.approveBtn]}
                onPress={(e) => {
                  e.stopPropagation();
                  handleApproveCandidate(item);
                }}
              >
                <MaterialCommunityIcons name="check" size={HEIGHT * 0.022} color={WHITE} />
              </Pressable>
            ) : null}

            {actionVisibility.showReject ? (
              <Pressable
                style={[styles.actionIconBtn, styles.rejectBtn]}
                onPress={(e) => {
                  e.stopPropagation();
                  handleRejectCandidate(item);
                }}
              >
                <MaterialCommunityIcons name="close" size={HEIGHT * 0.022} color={WHITE} />
              </Pressable>
            ) : null}

            {actionVisibility.showView ? (
              <Pressable
                style={[styles.actionIconBtn, styles.viewBtn]}
                onPress={(e) => {
                  e.stopPropagation();
                  handleViewResume(item);
                }}
              >
                <Image source={VIEW} style={styles.viewIcon} />
              </Pressable>
            ) : null}
          </View>
        </View>
      </Pressable>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>There is no Application applied by applicant</Text>
    </View>
  );

  const Container = Platform.OS === "ios" ? SafeAreaView : View;

  return (
    <Container style={[
      styles.container,
      Platform.OS === "ios" && styles.containerIOS,
      Platform.OS === "android" && styles.containerAndroid
    ]}>
      <StatusBar
        backgroundColor={WHITE}
        barStyle={Platform.OS === "ios" ? "dark-content" : "dark-content"}
        translucent={Platform.OS === "android"}
      />

      {/* HEADER */}
      <View style={[
        styles.headerWrapper,
        Platform.OS === "ios" && styles.headerWrapperIOS,
        Platform.OS === "android" && styles.headerWrapperAndroid
      ]}>
        <MyHeader
          showNotification={false}
          showCenterTitle
          title="Candidate List"
        />
      </View>

      {/* FILTER ICON */}
      <View style={styles.filterWrapper}>
        <View style={styles.filterHeader}>
          <Text style={styles.filterTitle}>Candidate List</Text>
          <TouchableOpacity
            style={styles.filterIconButton}
            onPress={handleFilterPress}
            activeOpacity={0.7}
          >
            <Image source={FILTER} style={styles.filterIcon} />
            {selectedCategory !== "" && (
              <View style={styles.filterBadge} />
            )}
          </TouchableOpacity>
        </View>

        {/* FILTER DROPDOWN */}
        {filterDropdownVisible && (
          <View style={styles.filterDropdownContainer}>
            <View style={styles.filterDropdown}>
              {loadingCategories ? (
                <View style={styles.filterLoadingContainer}>
                  <ActivityIndicator size="small" color={BRANDCOLOR} />
                  <Text style={styles.filterLoadingText}>Loading categories...</Text>
                </View>
              ) : categories.length > 0 ? (
                <ScrollView
                  style={styles.filterDropdownScroll}
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                >
                  {/* All Categories Option */}
                  <TouchableOpacity
                    style={[
                      styles.filterDropdownItem,
                      selectedCategory === "" && styles.filterDropdownItemSelected
                    ]}
                    onPress={() => handleCategorySelect("")}
                  >
                    <Text style={[
                      styles.filterDropdownItemText,
                      selectedCategory === "" && styles.filterDropdownItemTextSelected
                    ]}>
                      All Categories
                    </Text>
                  </TouchableOpacity>

                  {categories.map((item, index) => {
                    const categoryValue = item.category || item.name || "";
                    const isSelected = selectedCategory.toLowerCase() === categoryValue.toLowerCase() ||
                      selectedCategory.toLowerCase().replace(/_/g, ' ') === categoryValue.toLowerCase().replace(/_/g, ' ');

                    return (
                      <TouchableOpacity
                        key={`${categoryValue}-${index}`}
                        style={[
                          styles.filterDropdownItem,
                          isSelected && styles.filterDropdownItemSelected
                        ]}
                        onPress={() => handleCategorySelect(categoryValue)}
                      >
                        <Text style={[
                          styles.filterDropdownItemText,
                          isSelected && styles.filterDropdownItemTextSelected
                        ]}>
                          {formatCategoryName(categoryValue)}
                        </Text>
                        <Text style={[
                          styles.filterDropdownItemCount,
                          isSelected && styles.filterDropdownItemCountSelected
                        ]}>
                          {item.job_count || 0} Jobs
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              ) : (
                <View style={styles.filterEmptyContainer}>
                  <Text style={styles.filterEmptyText}>No categories available</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Overlay to close dropdown when clicking outside */}
      {filterDropdownVisible && (
        <Pressable
          style={styles.filterOverlay}
          onPress={() => setFilterDropdownVisible(false)}
        />
      )}

      {/* FILTER INDICATOR */}
      {selectedCategory !== "" && (
        <View style={styles.filterIndicator}>
          <View style={styles.filterIndicatorContent}>
            <Text style={styles.filterIndicatorText}>
              Filtered by: <Text style={styles.filterIndicatorCategory}>{formatCategoryName(selectedCategory)}</Text>
            </Text>
            <Text style={styles.filterIndicatorCount}>
              {filteredCandidates.length} {filteredCandidates.length === 1 ? 'candidate' : 'candidates'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.filterClearButton}
            onPress={() => handleCategorySelect("")}
          >
            <MaterialCommunityIcons name="close-circle" size={HEIGHT * 0.02} color={BRANDCOLOR} />
            <Text style={styles.filterClearText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* LIST */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading applications...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCandidates}
          keyExtractor={(item, index) => item?.id || item?._id || item?.applicationId || `candidate-${index}`}
          renderItem={renderCandidate}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[
            styles.listContent,
            filteredCandidates.length === 0 && styles.emptyListContent
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[BRANDCOLOR]}
              tintColor={BRANDCOLOR}
            />
          }
        />
      )}

      {/* DETAIL MODAL - FULL SCREEN */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={() => {
          setDetailModalVisible(false);
          setSelectedCandidate(null);
        }}
      >
        <View style={styles.fullScreenModal}>
          <StatusBar
            backgroundColor={WHITE}
            barStyle="dark-content"
            translucent={true}
          />

          {/* Professional Header */}
          <View style={styles.fullScreenHeader}>
            <TouchableOpacity
              onPress={() => {
                setDetailModalVisible(false);
                setSelectedCandidate(null);
              }}
              style={styles.professionalBackButton}
            >
              <MaterialCommunityIcons name="arrow-left" size={HEIGHT * 0.028} color={BLACK} />
            </TouchableOpacity>
            <View style={styles.professionalHeaderTitleContainer}>
              <Text style={styles.professionalHeaderTitle}>Candidate Details</Text>
            </View>
            <View style={styles.professionalBackButton} />
          </View>

          <ScrollView
            style={styles.fullScreenContent}
            contentContainerStyle={styles.fullScreenScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {selectedCandidate && (
              <>
                {/* Application Details Section */}
                <View style={styles.modernSectionContainer}>
                  <View style={styles.modernSectionHeader}>
                    <MaterialCommunityIcons name="briefcase-outline" size={HEIGHT * 0.022} color={BRANDCOLOR} />
                    <Text style={styles.modernSectionTitle}>Application Details</Text>
                  </View>

                  <View style={styles.modernDetailCard}>
                    <View style={[styles.modernDetailRow, styles.modernDetailRowWithBorder]}>
                      <View style={styles.modernIconWrapper}>
                        <MaterialCommunityIcons name="briefcase" size={HEIGHT * 0.022} color={BRANDCOLOR} />
                      </View>
                      <View style={styles.modernDetailContent}>
                        <Text style={styles.modernDetailLabel}>Position</Text>
                        <Text style={styles.modernDetailValue}>{selectedCandidate.job_title || "N/A"}</Text>
                      </View>
                    </View>

                    {selectedCandidate.company_name && (
                      <View style={styles.modernDetailRow}>
                        <View style={styles.modernIconWrapper}>
                          <MaterialCommunityIcons name="office-building" size={HEIGHT * 0.022} color={BRANDCOLOR} />
                        </View>
                        <View style={styles.modernDetailContent}>
                          <Text style={styles.modernDetailLabel}>Company</Text>
                          <Text style={styles.modernDetailValue}>{selectedCandidate.company_name}</Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>

                {/* Contact Information Section */}
                <View style={styles.modernSectionContainer}>
                  <View style={styles.modernSectionHeader}>
                    <MaterialCommunityIcons name="card-account-details-outline" size={HEIGHT * 0.022} color={BRANDCOLOR} />
                    <Text style={styles.modernSectionTitle}>Contact Information</Text>
                  </View>

                  <View style={styles.modernDetailCard}>
                    <View style={[styles.modernDetailRow, styles.modernDetailRowWithBorder]}>
                      <View style={styles.modernIconWrapper}>
                        <MaterialCommunityIcons name="account" size={HEIGHT * 0.022} color={BRANDCOLOR} />
                      </View>
                      <View style={styles.modernDetailContent}>
                        <Text style={styles.modernDetailLabel}>Full Name</Text>
                        <Text style={styles.modernDetailValue}>{selectedCandidate.name || "N/A"}</Text>
                      </View>
                    </View>

                    {selectedCandidate.email && (
                      <View style={[styles.modernDetailRow, !selectedCandidate.phone && styles.modernDetailRowNoBorder]}>
                        <View style={styles.modernIconWrapper}>
                          <MaterialCommunityIcons name="email-outline" size={HEIGHT * 0.022} color={BRANDCOLOR} />
                        </View>
                        <View style={styles.modernDetailContent}>
                          <Text style={styles.modernDetailLabel}>Email Address</Text>
                          <Text style={styles.modernDetailValue}>{selectedCandidate.email}</Text>
                        </View>
                      </View>
                    )}

                    {selectedCandidate.phone && (
                      <View style={styles.modernDetailRow}>
                        <View style={styles.modernIconWrapper}>
                          <MaterialCommunityIcons name="phone-outline" size={HEIGHT * 0.022} color={BRANDCOLOR} />
                        </View>
                        <View style={styles.modernDetailContent}>
                          <Text style={styles.modernDetailLabel}>Phone Number</Text>
                          <Text style={styles.modernDetailValue}>{selectedCandidate.phone}</Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>

                {/* CV Summary Section */}
                {selectedCandidate.pasted_cv && (
                  <View style={styles.modernSectionContainer}>
                    <View style={styles.modernSectionHeader}>
                      <MaterialCommunityIcons name="file-document-edit-outline" size={HEIGHT * 0.022} color={BRANDCOLOR} />
                      <Text style={styles.modernSectionTitle}>CV Summary</Text>
                    </View>
                    <View style={styles.modernCvCard}>
                      <Text style={styles.modernCvText}>{selectedCandidate.pasted_cv}</Text>
                    </View>
                  </View>
                )}
              </>
            )}
          </ScrollView>

          {/* Bottom Action Buttons */}
          <View style={styles.fullScreenActions}>
            <TouchableOpacity
              style={[styles.fullScreenActionButton, styles.viewResumeButton]}
              onPress={() => {
                setDetailModalVisible(false);
                setTimeout(() => {
                  handleViewResume(selectedCandidate);
                }, 300);
              }}
            >
              <MaterialCommunityIcons name="file-document" size={HEIGHT * 0.025} color={WHITE} />
              <Text style={styles.fullScreenActionText}>View Resume</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.fullScreenActionButton, styles.deleteButton]}
              onPress={() => {
                setDetailModalVisible(false);
                handleDelete(selectedCandidate);
              }}
            >
              <MaterialCommunityIcons name="delete" size={HEIGHT * 0.025} color={WHITE} />
              <Text style={styles.fullScreenActionText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* RESUME VIEW MODAL - FULL SCREEN */}
      <Modal
        visible={resumeViewVisible}
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={() => {
          setResumeViewVisible(false);
          setResumeCandidate(null);
        }}
      >
        <View style={styles.fullScreenModal}>
          <StatusBar
            backgroundColor={BRANDCOLOR}
            barStyle="light-content"
            translucent={true}
          />

          {/* Header */}
          <View style={styles.fullScreenHeader}>
            <TouchableOpacity
              onPress={() => {
                setResumeViewVisible(false);
                setResumeCandidate(null);
              }}
              style={styles.backButton}
            >
              <MaterialCommunityIcons name="arrow-left" size={HEIGHT * 0.03} color={WHITE} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.fullScreenTitle} numberOfLines={1}>
                {resumeCandidate?.name || 'Candidate'}'s Resume
              </Text>
            </View>
            <View style={styles.backButton} />
          </View>

          {/* Resume Content */}
          <ScrollView
            style={styles.resumeScrollView}
            contentContainerStyle={styles.resumeScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {resumeCandidate?.resume_url ? (
              <View style={styles.resumeContentContainer}>
                {/* Info Card */}
                <View style={styles.resumeInfoCard}>
                  <View style={styles.resumeInfoRow}>
                    <MaterialCommunityIcons name="account" size={HEIGHT * 0.022} color={BRANDCOLOR} />
                    <Text style={styles.resumeInfoText}>{resumeCandidate.name}</Text>
                  </View>
                  <View style={styles.resumeInfoRow}>
                    <MaterialCommunityIcons name="briefcase" size={HEIGHT * 0.022} color={BRANDCOLOR} />
                    <Text style={styles.resumeInfoText}>{resumeCandidate.job_title}</Text>
                  </View>
                  {resumeCandidate.email && (
                    <View style={styles.resumeInfoRow}>
                      <MaterialCommunityIcons name="email" size={HEIGHT * 0.022} color={BRANDCOLOR} />
                      <Text style={styles.resumeInfoText}>{resumeCandidate.email}</Text>
                    </View>
                  )}
                </View>

                {/* Resume Display Container - PDF or Image */}
                <View style={styles.resumeImageContainer}>
                  {resumeLoading && (
                    <View style={styles.loadingResumeOverlay}>
                      <ActivityIndicator size="large" color={BRANDCOLOR} />
                      <Text style={styles.loadingText}>Loading resume...</Text>
                    </View>
                  )}
                  {(() => {
                    const resumeUrl = getResumeUrl(resumeCandidate.resume_url);
                    const isPdf = isPdfUrl(resumeUrl);

                    if (isPdf) {
                      // For PDF files, use WebView to display the actual PDF content
                      if (WebView) {
                        // Use Google Docs Viewer for PDF display (more reliable)
                        const pdfViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(resumeUrl)}&embedded=true`;

                        return (
                          <WebView
                            source={{
                              uri: pdfViewerUrl,
                            }}
                            style={styles.resumeWebView}
                            startInLoadingState={true}
                            javaScriptEnabled={true}
                            domStorageEnabled={true}
                            allowsInlineMediaPlayback={true}
                            mediaPlaybackRequiresUserAction={false}
                            scalesPageToFit={true}
                            originWhitelist={['*']}
                            mixedContentMode="always"
                            renderLoading={() => (
                              <View style={styles.webViewLoading}>
                                <ActivityIndicator size="large" color={BRANDCOLOR} />
                                <Text style={styles.webViewLoadingText}>Loading PDF Resume...</Text>
                              </View>
                            )}
                            onLoadStart={() => {
                              setResumeLoading(true);
                            }}
                            onLoadEnd={() => {
                              setResumeLoading(false);
                            }}
                            onError={(syntheticEvent) => {
                              setResumeLoading(false);
                              setToastMessage({
                                type: "error",
                                msg: "Failed to load PDF resume",
                                visible: true,
                              });
                            }}
                            onHttpError={(syntheticEvent) => {
                              setResumeLoading(false);
                              setToastMessage({
                                type: "error",
                                msg: "Failed to load PDF resume",
                                visible: true,
                              });
                            }}
                          />
                        );
                      } else {
                        // WebView not available - show error message
                        return (
                          <View style={styles.pdfFallbackContainer}>
                            <MaterialCommunityIcons name="file-document" size={64} color={BRANDCOLOR} />
                            <Text style={styles.pdfFallbackText}>PDF Resume</Text>
                            <Text style={styles.pdfFallbackNote}>
                              Please install react-native-webview package to view PDF resumes.
                            </Text>
                            <Text style={styles.pdfUrlText} selectable>{resumeUrl}</Text>
                          </View>
                        );
                      }
                    } else if (isPdf && !WebView) {
                      // PDF but WebView not available - show message
                      return (
                        <View style={styles.pdfFallbackContainer}>
                          <MaterialCommunityIcons name="file-document" size={64} color={BRANDCOLOR} />
                          <Text style={styles.pdfFallbackText}>PDF Resume</Text>
                          <Text style={styles.pdfFallbackNote}>
                            To view PDF resumes, please install react-native-webview package.
                          </Text>
                          <Text style={styles.pdfUrlText} selectable>{resumeUrl}</Text>
                        </View>
                      );
                    } else {
                      // Use Image for image files
                      return (
                        <Image
                          source={{ uri: resumeUrl }}
                          style={styles.resumeImage}
                          resizeMode="contain"
                          onLoadStart={() => {
                            setResumeLoading(true);
                          }}
                          onLoadEnd={() => {
                            setResumeLoading(false);
                          }}
                          onError={(error) => {
                            setResumeLoading(false);
                            setToastMessage({
                              type: "error",
                              msg: "Failed to load resume image",
                              visible: true,
                            });
                          }}
                        />
                      );
                    }
                  })()}
                </View>
              </View>
            ) : (
              <View style={styles.noResumeContainer}>
                <MaterialCommunityIcons name="file-document-outline" size={HEIGHT * 0.08} color="#CCC" />
                <Text style={styles.noResumeText}>No resume available</Text>
                <Text style={styles.debugText}>Resume URL: {resumeCandidate?.resume_url || 'null'}</Text>
                <Text style={styles.debugText}>Candidate: {resumeCandidate?.name || 'null'}</Text>
              </View>
            )}
          </ScrollView>

          {/* Download Button */}
          {resumeCandidate?.resume_url && (
            <View style={styles.resumeActionContainer}>
              <TouchableOpacity
                style={styles.downloadButton}
                onPress={() => handleDownloadResume(resumeCandidate)}
              >
                <MaterialCommunityIcons name="download" size={HEIGHT * 0.025} color={WHITE} />
                <Text style={styles.downloadButtonText}>Download Resume</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {/* Delete Confirmation Alert */}
      <MyAlert
        visible={deleteAlertVisible}
        title="Delete Candidate"
        message="Do you want to Delete this candidate?"
        textLeft="Cancel"
        textRight="Delete"
        onPressLeft={() => {
          setDeleteAlertVisible(false);
          setSelectedCandidate(null);
        }}
        onPressRight={confirmDelete}
        onRequestClose={() => {
          setDeleteAlertVisible(false);
          setSelectedCandidate(null);
        }}
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
  );
};

export default ViewCandidate;

/* ---------- STYLES ---------- */
const styles = StyleSheet.create({
  /* ROOT FIX */
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

  headerWrapper: {
    backgroundColor: WHITE,
    paddingTop: HEIGHT * 0.025,
  },
  headerWrapperIOS: {
    paddingTop: Platform.OS === "ios" ? HEIGHT * 0.028 : HEIGHT * 0.025,
  },
  headerWrapperAndroid: {
    paddingTop: Platform.OS === "android" ? HEIGHT * 0.022 : HEIGHT * 0.025,
  },

  filterWrapper: {
    padding: WIDTH * 0.03,
    backgroundColor: WHITE,
    position: "relative",
    zIndex: 10,
  },
  filterOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    zIndex: 998,
  },
  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  filterTitle: {
    fontSize: HEIGHT * 0.02,
    fontFamily: UBUNTUBOLD,
    color: BLACK,
  },
  filterIconButton: {
    width: WIDTH * 0.1,
    height: WIDTH * 0.1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  filterIcon: {
    width: WIDTH * 0.06,
    height: WIDTH * 0.06,
    resizeMode: "contain",
    tintColor: BRANDCOLOR,
  },
  filterBadge: {
    position: "absolute",
    top: WIDTH * 0.01,
    right: WIDTH * 0.01,
    width: WIDTH * 0.02,
    height: WIDTH * 0.02,
    borderRadius: WIDTH * 0.01,
    backgroundColor: "#FF5252",
  },
  filterDropdownContainer: {
    position: "absolute",
    top: WIDTH * 0.13,
    right: WIDTH * 0.03,
    width: WIDTH * 0.5,
    zIndex: 1000,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  filterDropdown: {
    backgroundColor: WHITE,
    borderRadius: WIDTH * 0.03,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    maxHeight: HEIGHT * 0.5,
    overflow: "hidden",
  },
  filterDropdownScroll: {
    maxHeight: HEIGHT * 0.5,
  },
  filterDropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: HEIGHT * 0.015,
    paddingHorizontal: WIDTH * 0.04,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  filterDropdownItemSelected: {
    backgroundColor: `${BRANDCOLOR}15`,
  },
  filterDropdownItemText: {
    fontSize: HEIGHT * 0.016,
    color: BLACK,
    fontFamily: FIRASANSSEMIBOLD,
    flex: 1,
  },
  filterDropdownItemTextSelected: {
    color: BRANDCOLOR,
    fontFamily: UBUNTUBOLD,
  },
  filterDropdownItemCount: {
    fontSize: HEIGHT * 0.014,
    color: "#666",
    fontFamily: FIRASANSSEMIBOLD,
    marginLeft: WIDTH * 0.02,
  },
  filterDropdownItemCountSelected: {
    color: BRANDCOLOR,
    fontFamily: FIRASANSSEMIBOLD,
  },
  filterLoadingContainer: {
    paddingVertical: HEIGHT * 0.03,
    alignItems: "center",
    justifyContent: "center",
  },
  filterLoadingText: {
    marginTop: HEIGHT * 0.01,
    fontSize: HEIGHT * 0.014,
    color: "#666",
  },
  filterEmptyContainer: {
    paddingVertical: HEIGHT * 0.03,
    alignItems: "center",
    justifyContent: "center",
  },
  filterEmptyText: {
    fontSize: HEIGHT * 0.014,
    color: "#999",
  },

  filterIndicator: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: `${BRANDCOLOR}15`,
    marginHorizontal: WIDTH * 0.03,
    marginBottom: HEIGHT * 0.01,
    paddingVertical: HEIGHT * 0.012,
    paddingHorizontal: WIDTH * 0.04,
    borderRadius: WIDTH * 0.02,
    borderLeftWidth: 4,
    borderLeftColor: BRANDCOLOR,
  },
  filterIndicatorContent: {
    flex: 1,
  },
  filterIndicatorText: {
    fontSize: HEIGHT * 0.014,
    color: "#666",
    fontFamily: FIRASANSSEMIBOLD,
  },
  filterIndicatorCategory: {
    fontSize: HEIGHT * 0.015,
    color: BRANDCOLOR,
    fontFamily: UBUNTUBOLD,
  },
  filterIndicatorCount: {
    fontSize: HEIGHT * 0.013,
    color: "#999",
    marginTop: HEIGHT * 0.003,
  },
  filterClearButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: WIDTH * 0.01,
    paddingHorizontal: WIDTH * 0.02,
    paddingVertical: HEIGHT * 0.005,
  },
  filterClearText: {
    fontSize: HEIGHT * 0.014,
    color: BRANDCOLOR,
    fontFamily: FIRASANSSEMIBOLD,
  },
  listContent: {
    paddingHorizontal: WIDTH * 0.03,
    paddingBottom: HEIGHT * 0.025,
    backgroundColor: WHITE,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: HEIGHT * 0.015,
  },

  /* CARD — SQUARE GRID LAYOUT (2 COLUMNS) */
  card: {
    backgroundColor: WHITE,
    borderRadius: WIDTH * 0.03,
    padding: WIDTH * 0.035,
    borderWidth: 1,
    borderColor: "#E6E6E6",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: (WIDTH - WIDTH * 0.06 - WIDTH * 0.015) / 2, // Account for padding and gap between cards
    aspectRatio: 1, // Square shape
    justifyContent: "space-between",
  },
  cardLeft: {
    // No additional styling needed - handled by row
  },
  cardRight: {
    // No additional styling needed - handled by row
  },
  cardContent: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardInfo: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: HEIGHT * 0.01,
    marginBottom: HEIGHT * 0.015,
  },
  candidateName: {
    color: BLACK,
    fontSize: HEIGHT * 0.018,
    fontFamily: UBUNTUBOLD,
    marginBottom: HEIGHT * 0.008,
    textAlign: "center",
    lineHeight: HEIGHT * 0.024,
  },
  jobTitle: {
    color: "#666",
    fontSize: HEIGHT * 0.014,
    fontFamily: FIRASANSSEMIBOLD,
    marginBottom: HEIGHT * 0.006,
    textAlign: "center",
  },
  companyName: {
    color: "#999",
    fontSize: HEIGHT * 0.012,
    fontFamily: FIRASANSSEMIBOLD,
    textAlign: "center",
    marginBottom: HEIGHT * 0.01,
  },
  cardActionRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: WIDTH * 0.02,
  },
  actionIconBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: WIDTH * 0.02,
    paddingVertical: HEIGHT * 0.01,
  },
  approveBtn: {
    backgroundColor: "#26AE61",
  },
  rejectBtn: {
    backgroundColor: "#E53935",
  },
  viewBtn: {
    backgroundColor: BRANDCOLOR,
  },
  viewIcon: {
    width: HEIGHT * 0.022,
    height: HEIGHT * 0.022,
    resizeMode: "contain",
    tintColor: WHITE,
  },

  modalWrapper: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },

  /* FULL SCREEN MODAL STYLES */
  fullScreenModal: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  fullScreenHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: WHITE,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + HEIGHT * 0.02 : HEIGHT * 0.05,
    paddingBottom: HEIGHT * 0.02,
    paddingHorizontal: WIDTH * 0.04,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  professionalBackButton: {
    width: WIDTH * 0.11,
    height: WIDTH * 0.11,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: WIDTH * 0.055,
    backgroundColor: "#F5F7FA",
  },
  professionalHeaderTitleContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: WIDTH * 0.02,
  },
  professionalHeaderTitle: {
    fontSize: HEIGHT * 0.022,
    fontFamily: UBUNTUBOLD,
    color: BLACK,
    letterSpacing: 0.3,
  },
  backButton: {
    width: WIDTH * 0.1,
    height: WIDTH * 0.1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: WIDTH * 0.02,
  },
  fullScreenTitle: {
    fontSize: HEIGHT * 0.022,
    fontFamily: UBUNTUBOLD,
    color: BLACK,
    letterSpacing: 0.5,
  },
  fullScreenContent: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  fullScreenScrollContent: {
    paddingBottom: HEIGHT * 0.1,
  },

  /* Modern Section Container */
  modernSectionContainer: {
    marginTop: HEIGHT * 0.02,
    marginHorizontal: WIDTH * 0.04,
  },
  modernSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: HEIGHT * 0.015,
    paddingBottom: HEIGHT * 0.01,
    borderBottomWidth: 2,
    borderBottomColor: BRANDCOLOR,
  },
  modernSectionTitle: {
    fontSize: HEIGHT * 0.02,
    fontFamily: UBUNTUBOLD,
    color: BLACK,
    marginLeft: WIDTH * 0.015,
    letterSpacing: 0.3,
  },
  modernDetailCard: {
    backgroundColor: WHITE,
    borderRadius: WIDTH * 0.035,
    padding: WIDTH * 0.04,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  modernDetailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: HEIGHT * 0.015,
  },
  modernDetailRowWithBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modernDetailRowNoBorder: {
    borderBottomWidth: 0,
  },
  modernIconWrapper: {
    width: WIDTH * 0.1,
    height: WIDTH * 0.1,
    borderRadius: WIDTH * 0.025,
    backgroundColor: `${BRANDCOLOR}15`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: WIDTH * 0.035,
    marginTop: HEIGHT * 0.002,
  },
  modernDetailContent: {
    flex: 1,
  },
  modernDetailLabel: {
    fontSize: HEIGHT * 0.014,
    color: "#888",
    fontFamily: FIRASANSSEMIBOLD,
    marginBottom: HEIGHT * 0.006,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modernDetailValue: {
    fontSize: HEIGHT * 0.018,
    color: BLACK,
    fontFamily: FIRASANSSEMIBOLD,
    lineHeight: HEIGHT * 0.025,
  },
  modernCvCard: {
    backgroundColor: WHITE,
    borderRadius: WIDTH * 0.035,
    padding: WIDTH * 0.04,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: BRANDCOLOR,
  },
  modernCvText: {
    fontSize: HEIGHT * 0.016,
    color: "#444",
    lineHeight: HEIGHT * 0.026,
    textAlign: "justify",
  },

  /* Professional Bottom Actions */
  fullScreenActions: {
    flexDirection: "row",
    paddingHorizontal: WIDTH * 0.04,
    paddingVertical: HEIGHT * 0.018,
    paddingBottom: Platform.OS === "ios" ? HEIGHT * 0.035 : HEIGHT * 0.018,
    backgroundColor: WHITE,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    gap: WIDTH * 0.03,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  fullScreenActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: HEIGHT * 0.016,
    borderRadius: WIDTH * 0.03,
    gap: WIDTH * 0.018,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  viewResumeButton: {
    backgroundColor: BRANDCOLOR,
  },
  deleteButton: {
    backgroundColor: "#FF5252",
  },
  fullScreenActionText: {
    fontSize: HEIGHT * 0.017,
    fontFamily: UBUNTUBOLD,
    color: WHITE,
    letterSpacing: 0.5,
  },

  /* OLD MODAL STYLES (for resume modal) */
  detailModalContent: {
    backgroundColor: WHITE,
    borderTopLeftRadius: WIDTH * 0.05,
    borderTopRightRadius: WIDTH * 0.05,
    maxHeight: "90%",
    paddingBottom: Platform.OS === "ios" ? HEIGHT * 0.025 : HEIGHT * 0.015,
  },
  resumeModalContent: {
    backgroundColor: WHITE,
    borderTopLeftRadius: WIDTH * 0.05,
    borderTopRightRadius: WIDTH * 0.05,
    maxHeight: "95%",
    paddingBottom: Platform.OS === "ios" ? HEIGHT * 0.025 : HEIGHT * 0.015,
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
    color: BLACK,
    fontSize: HEIGHT * 0.02,
    fontFamily: UBUNTUBOLD,
  },
  closeIcon: {
    color: BLACK,
    fontSize: HEIGHT * 0.025,
    fontFamily: FIRASANSSEMIBOLD,
    padding: WIDTH * 0.01,
  },
  modalScrollView: {
    maxHeight: HEIGHT * 0.5,
    padding: WIDTH * 0.04,
  },

  /* RESUME MODAL STYLES */
  resumeScrollView: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  resumeScrollContent: {
    paddingBottom: HEIGHT * 0.02,
  },
  resumeContentContainer: {
    flex: 1,
  },
  resumeInfoCard: {
    backgroundColor: WHITE,
    marginHorizontal: WIDTH * 0.04,
    marginTop: HEIGHT * 0.015,
    marginBottom: HEIGHT * 0.015,
    padding: WIDTH * 0.04,
    borderRadius: WIDTH * 0.03,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resumeInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: HEIGHT * 0.01,
    gap: WIDTH * 0.02,
  },
  resumeInfoText: {
    fontSize: HEIGHT * 0.016,
    color: BLACK,
    fontWeight: "500",
    flex: 1,
  },
  resumeImageContainer: {
    flex: 1,
    backgroundColor: WHITE,
    marginHorizontal: WIDTH * 0.04,
    marginBottom: HEIGHT * 0.015,
    borderRadius: WIDTH * 0.03,
    padding: WIDTH * 0.04,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: HEIGHT * 0.5,
  },
  resumeImage: {
    width: WIDTH * 0.85,
    minHeight: HEIGHT * 0.5,
    maxHeight: HEIGHT * 1.5,
  },
  resumeWebView: {
    flex: 1,
    width: '100%',
    backgroundColor: WHITE,
  },
  webViewLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: WHITE,
  },
  webViewLoadingText: {
    marginTop: HEIGHT * 0.01,
    fontSize: HEIGHT * 0.016,
    color: BRANDCOLOR,
  },
  pdfFallbackContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: WIDTH * 0.05,
  },
  pdfFallbackText: {
    fontSize: HEIGHT * 0.02,
    fontWeight: "700",
    color: BLACK,
    marginTop: HEIGHT * 0.02,
  },
  pdfFallbackNote: {
    fontSize: HEIGHT * 0.014,
    color: "#666",
    textAlign: "center",
    marginTop: HEIGHT * 0.01,
    fontStyle: "italic",
  },
  pdfUrlText: {
    fontSize: HEIGHT * 0.012,
    color: BRANDCOLOR,
    textAlign: "center",
    marginTop: HEIGHT * 0.02,
  },
  loadingResumeOverlay: {
    position: "absolute",
    top: HEIGHT * 0.25,
    alignItems: "center",
    zIndex: 1,
  },
  resumeActionContainer: {
    paddingHorizontal: WIDTH * 0.04,
    paddingVertical: HEIGHT * 0.015,
    paddingBottom: Platform.OS === "ios" ? HEIGHT * 0.03 : HEIGHT * 0.015,
    backgroundColor: WHITE,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BRANDCOLOR,
    paddingVertical: HEIGHT * 0.017,
    borderRadius: WIDTH * 0.03,
    gap: WIDTH * 0.02,
    shadowColor: BRANDCOLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  downloadButtonText: {
    fontSize: HEIGHT * 0.018,
    fontWeight: "700",
    color: WHITE,
  },
  resumeActions: {
    paddingHorizontal: WIDTH * 0.04,
    paddingTop: HEIGHT * 0.015,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  loadingResume: {
    position: "absolute",
    top: HEIGHT * 0.25,
    alignSelf: "center",
    alignItems: "center",
    zIndex: 1,
  },
  loadingResumeText: {
    marginTop: HEIGHT * 0.01,
    fontSize: HEIGHT * 0.016,
    color: BRANDCOLOR,
  },
  noResumeContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: HEIGHT * 0.1,
    paddingHorizontal: WIDTH * 0.05,
    backgroundColor: WHITE,
    marginHorizontal: WIDTH * 0.04,
    marginTop: HEIGHT * 0.015,
    borderRadius: WIDTH * 0.03,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noResumeText: {
    fontSize: HEIGHT * 0.018,
    color: "#666",
    textAlign: "center",
    marginTop: HEIGHT * 0.02,
    fontWeight: "600",
  },
  debugText: {
    fontSize: HEIGHT * 0.014,
    color: "#999",
    textAlign: "center",
    marginTop: HEIGHT * 0.01,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: HEIGHT * 0.1,
    paddingHorizontal: WIDTH * 0.05,
  },
  emptyText: {
    fontSize: HEIGHT * 0.018,
    color: "#666",
    textAlign: "center",
    fontWeight: "500",
  },
  emptyListContent: {
    flexGrow: 1,
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
    fontWeight: "500",
  },
});