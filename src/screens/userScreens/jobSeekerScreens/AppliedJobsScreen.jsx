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
  ActivityIndicator,
  Linking,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import ReactNativeBlobUtil from 'react-native-blob-util';
import { Platform } from 'react-native';

// Try to import WebView for PDF viewing
let WebView = null;
try {
  const WebViewModule = require('react-native-webview');
  WebView = WebViewModule.WebView;
} catch (e) {
  // WebView not available
}
import { MyAlert } from "../../../components/commonComponents/MyAlert";
import { MyHeader } from "../../../components/commonComponents/MyHeader";
import { LOGO } from "../../../constant/imagePath";
import { BLACK, BRANDCOLOR, WHITE } from "../../../constant/color";
import { UBUNTUBOLD, UBUNTU, FIRASANSSEMIBOLD, ROBOTOSEMIBOLD, CANTARELLBOLD, FIRASANSBOLD } from "../../../constant/fontPath";
import { HEIGHT, WIDTH } from "../../../constant/config";
import { BASE_URL } from "../../../constant/url";
import { GETNETWORK } from "../../../utils/Network";
import { getObjByKey } from "../../../utils/Storage";
 
 
 
 
// Helper function to format date
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
 
const AppliedJobsScreen = ({ navigation }) => {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resumeModalVisible, setResumeModalVisible] = useState(false);
  const [resumeUrl, setResumeUrl] = useState(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeError, setResumeError] = useState(null);
  const [expandedStatusCards, setExpandedStatusCards] = useState(new Set());
 
  /* ---------- FETCH APPLIED JOBS ---------- */
  const fetchAppliedJobs = useCallback(async () => {
    try {
      setLoading(true);
      const url = `${BASE_URL}applications/mine`;
      const result = await GETNETWORK(url, true);
      
      if (result && !result.message) {
        // Handle various response structures
        const applications = result?.data || result?.applications || result?.list || result || [];
        setJobs(Array.isArray(applications) ? applications : []);
      } else {
        setJobs([]);
      }
    } catch (error) {
      setJobs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch data when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchAppliedJobs();
    }, [fetchAppliedJobs])
  );
 
  /* ---------- DELETE ---------- */
  const handleDeletePress = (id) => {
    setJobToDelete(id);
    setAlertVisible(true);
  };
 
  const confirmDelete = () => {
    setJobs((prev) => prev.filter((job) => (job.id || job._id) !== jobToDelete));
    setAlertVisible(false);
    setJobToDelete(null);
  };

  /* ---------- REFRESH ---------- */
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAppliedJobs();
  }, [fetchAppliedJobs]);

  /* ---------- GET FULL RESUME URL ---------- */
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

  /* ---------- CHECK IF URL IS PDF ---------- */
  const isPdfUrl = (url) => {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    return lowerUrl.endsWith('.pdf') || lowerUrl.includes('.pdf?') || lowerUrl.includes('application/pdf');
  };

  /* ---------- HANDLE RESUME PRESS ---------- */
  const handleResumePress = async (item) => {
    if (item && (item.resumeUrl || item.resume_url)) {
      try {
        const resumeUrl = getResumeUrl(item.resumeUrl || item.resume_url);
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

  /* ---------- CLOSE RESUME MODAL ---------- */
  const handleCloseResumeModal = () => {
    setResumeModalVisible(false);
    setSelectedJob(null);
    setResumeUrl(null);
    setResumeLoading(false);
    setResumeError(null);
  };
 
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
  const getStatusStages = (item) => {
    return [
      { 
        label: 'Applied', 
        completed: true,
        date: item.appliedAt || item.appliedDate || item.createdAt 
      },
      { 
        label: 'Resume Viewed By Recruiter', 
        completed: item.resumeViewed || item.resumeViewedAt || false,
        date: item.resumeViewedAt 
      },
      { 
        label: 'Recruiter Contacted Through Mail', 
        completed: item.recruiterContacted || item.recruiterContactedAt || false,
        date: item.recruiterContactedAt 
      },
      { 
        label: item.status === 'enrolled' ? 'Enrolled' : item.status === 'rejected' ? 'Rejected' : 'Pending',
        completed: item.status === 'enrolled' || item.status === 'rejected',
        date: item.statusUpdatedAt || item.updatedAt,
        isFinal: true
      }
    ];
  };
 
  /* ---------- JOB CARD ---------- */
  const renderJob = ({ item }) => {
    const jobId = (item.id || item._id)?.toString();
    const jobTitle = item.jobTitle || item.title || item.job?.jobTitle || item.job?.title || "N/A";
    const companyName = item.companyName || item.company || item.job?.companyName || item.job?.company || "N/A";
    const appliedAt = formatDate(item.appliedAt || item.appliedDate || item.createdAt);
    const isExpanded = expandedStatusCards.has(jobId);
    const statusStages = getStatusStages(item);
    const finalStatus = item.status || 'pending';
    const statusColor = finalStatus === 'enrolled' ? '#26AE61' : finalStatus === 'rejected' ? '#FF4444' : '#FFA500';
    const statusText = finalStatus === 'enrolled' ? 'Enrolled' : finalStatus === 'rejected' ? 'Rejected' : 'Pending';
    
    return (
      <TouchableOpacity
      style={styles.card}
      activeOpacity={0.95}
        onPress={() => setSelectedJob(item)}
      >
      {/* Header Section */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Image source={LOGO} style={styles.logo} />
          <View style={styles.headerTextContainer}>
            <Text style={styles.title} numberOfLines={1}>{jobTitle}</Text>
            <Text style={styles.company} numberOfLines={1}>{companyName}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
        </View>
      </View>

      {/* Applied Date */}
      <View style={styles.dateContainer}>
        <Ionicons name="calendar-outline" size={14} color="#666" />
        <Text style={styles.dateText}>Applied {appliedAt}</Text>
      </View>

      {/* Action Buttons Row */}
      <View style={styles.actionRow}>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => {
            const jobId = item.id || item._id || item.jobId || item.job_id || item.job?.id || item.job?._id;
            navigation.navigate('SeekerJobDetails', {
              jobId,
              jobData: item,
              isApplied: true,
            });
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="eye" size={18} color={BRANDCOLOR} />
          <Text style={styles.primaryButtonText}>View Details</Text>
        </TouchableOpacity>
 
        <TouchableOpacity
          style={styles.secondaryButton}
            onPress={() => handleDeletePress(jobId)}
          activeOpacity={0.7}
        >
          <Ionicons name="trash" size={18} color="#FF4444" />
          </TouchableOpacity>
      </View>

      {/* Status Tracking Section */}
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
    </TouchableOpacity>
  );
  };
 
 
  return (
    <View style={styles.container}>
      <MyHeader
        showCenterTitle={true}
        title="Applied Job"
      />
      {loading && jobs.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BRANDCOLOR} />
          <Text style={styles.loadingText}>Loading applied jobs...</Text>
        </View>
      ) : (
      <FlatList
        data={jobs}
          keyExtractor={(item, index) => (item.id || item._id || index).toString()}
        renderItem={renderJob}
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
          <Text style={styles.emptyText}>No applied jobs yet</Text>
        }
      />
      )}
 
      {/* ---------- DELETE ALERT ---------- */}
      <MyAlert
        visible={alertVisible}
        title="Delete Application"
        message="Are you sure you want to delete this applied job?"
        textLeft="DELETE"
        textRight="CANCEL"
        leftButtonBackgroundColor="#E53935"
        rightButtonBackgroundColor="#26AE61"
        onPressLeft={confirmDelete}
        onPressRight={() => {
          setAlertVisible(false);
          setJobToDelete(null);
        }}
      />
 
      {/* ---------- VIEW JOB ---------- */}
      {/* <Modal visible={!!selectedJob} animationType="slide">
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => setSelectedJob(null)}
          >
            <Ionicons name="close" size={26} />
          </TouchableOpacity>
 
          {selectedJob && (
            <ScrollView>
              <Image
                source={{ uri: selectedJob.companyLogo }}
                style={styles.modalLogo}
              />
 
              <Text style={styles.modalTitle}>
                {selectedJob.jobTitle}
              </Text>
              <Text style={styles.modalCompany}>
                {selectedJob.companyName}
              </Text>
 
              <View style={styles.modalSection}>
                <Text>📍 {selectedJob.location}</Text>
                <Text>💰 {selectedJob.salary}</Text>
                <Text>🕒 Applied {selectedJob.appliedAt}</Text>
              </View>
 
              <Text style={styles.modalDescription}>
                {selectedJob.description}
              </Text>
            </ScrollView>
          )}
        </View>
      </Modal> */}
      {/* ---------- VIEW JOB MODAL ---------- */}
<Modal
  visible={!!selectedJob}
  animationType="slide"
  onRequestClose={() => setSelectedJob(null)} // ANDROID BACK BUTTON
>
  <View style={styles.modalContainer}>
 
    {/* ---------- HEADER ---------- */}
    <View style={styles.modalHeader}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => setSelectedJob(null)}
      >
        <Ionicons name="arrow-back" size={26} color="#000" />
      </TouchableOpacity>
 
      <Text style={styles.headerTitle}>Job Details</Text>
    </View>
 
    {/* ---------- CONTENT ---------- */}
    {selectedJob && (
      <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScrollView}>
        <Image
          source={LOGO}
          style={styles.modalLogo}
        />
 
        <Text style={styles.modalTitle}>
          {selectedJob.jobTitle || selectedJob.title || "N/A"}
        </Text>
 
        <Text style={styles.modalCompany}>
          {selectedJob.companyName || selectedJob.company || "N/A"}
        </Text>
 
        <View style={styles.modalSection}>
          <Text style={styles.modalSectionText}>
            🕒 Applied: {formatDate(selectedJob.appliedAt || selectedJob.appliedDate || selectedJob.createdAt)}
          </Text>
        </View>
 
        {/* Resume URL */}
        {selectedJob.resumeUrl && (
          <View style={styles.modalSection}>
            <Text style={styles.modalSectionLabel}>Resume:</Text>
            <TouchableOpacity 
              onPress={() => handleResumePress(selectedJob)}
              style={styles.resumeButton}
            >
              <Ionicons name="document-text-outline" size={20} color={BRANDCOLOR} />
              <Text style={styles.resumeButtonText}>View Resume</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Pasted CV / Cover Letter */}
        {selectedJob.pastedCV && (
          <View style={styles.modalSection}>
            <Text style={styles.modalSectionLabel}>Cover Letter:</Text>
        <Text style={styles.modalDescription}>
              {selectedJob.pastedCV}
        </Text>
          </View>
        )}
      </ScrollView>
    )}
  </View>
</Modal>

      {/* ---------- RESUME MODAL ---------- */}
      <Modal
        visible={resumeModalVisible}
        animationType="slide"
        onRequestClose={handleCloseResumeModal}
        transparent={false}
      >
        <View style={styles.resumeModalContainer}>
          {/* Header */}
          <View style={styles.resumeModalHeader}>
            <TouchableOpacity
              style={styles.resumeBackBtn}
              onPress={handleCloseResumeModal}
            >
              <Ionicons name="arrow-back" size={26} color="#000" />
            </TouchableOpacity>
            <Text style={styles.resumeHeaderTitle}>
              {selectedJob?.jobTitle || selectedJob?.title || 'Resume'}
            </Text>
            <View style={{ width: 26 }} />
          </View>

          {/* Resume Content */}
          <ScrollView 
            style={styles.resumeScrollView}
            contentContainerStyle={styles.resumeScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {(selectedJob?.resumeUrl || selectedJob?.resume_url) ? (
              <View style={styles.resumeContentContainer}>
                {/* Info Card */}
                <View style={styles.resumeInfoCard}>
                  <View style={styles.resumeInfoRow}>
                    <Ionicons name="person" size={20} color={BRANDCOLOR} />
                    <Text style={styles.resumeInfoText}>{selectedJob.jobTitle || selectedJob.title || 'N/A'}</Text>
                  </View>
                  <View style={styles.resumeInfoRow}>
                    <Ionicons name="business" size={20} color={BRANDCOLOR} />
                    <Text style={styles.resumeInfoText}>{selectedJob.companyName || selectedJob.company || 'N/A'}</Text>
                  </View>
                  {selectedJob.appliedAt && (
                    <View style={styles.resumeInfoRow}>
                      <Ionicons name="calendar" size={20} color={BRANDCOLOR} />
                      <Text style={styles.resumeInfoText}>
                        Applied: {formatDate(selectedJob.appliedAt || selectedJob.appliedDate || selectedJob.createdAt)}
                      </Text>
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
                    const resumeUrl = getResumeUrl(selectedJob.resumeUrl || selectedJob.resume_url);
                    const isPdf = isPdfUrl(resumeUrl);
                    
                    if (isPdf && WebView) {
                      // Use Google Docs Viewer for PDF display (embedded in app)
                      const pdfViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(resumeUrl)}&embedded=true`;
                      
                      return (
                        <WebView
                          source={{ uri: pdfViewerUrl }}
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
                              <Text style={styles.loadingText}>Loading PDF...</Text>
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
                            setResumeError('Failed to load PDF');
                          }}
                          onHttpError={(syntheticEvent) => {
                            setResumeLoading(false);
                            setResumeError('Failed to load PDF');
                          }}
                        />
                      );
                    } else if (isPdf && !WebView) {
                      // PDF but WebView not available
                      return (
                        <View style={styles.pdfFallbackContainer}>
                          <Ionicons name="document-text" size={64} color={BRANDCOLOR} />
                          <Text style={styles.pdfFallbackText}>PDF Resume</Text>
                          <Text style={styles.pdfFallbackNote}>
                            Please install react-native-webview package to view PDF resumes.
                          </Text>
                          <Text style={styles.pdfUrlText} selectable>{resumeUrl}</Text>
                        </View>
                      );
                    } else {
                      // Display as Image (for non-PDF files)
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
                            setResumeError('Failed to load resume');
                          }}
                        />
                      );
                    }
                  })()}
                </View>
              </View>
            ) : (
              <View style={styles.noResumeContainer}>
                <Ionicons name="document-text-outline" size={64} color="#CCC" />
                <Text style={styles.noResumeText}>No resume available</Text>
              </View>
            )}
          </ScrollView>
  </View>
</Modal>
 
    </View>
  );
};
 
export default AppliedJobsScreen;
 
/* ---------- STYLES ---------- */
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
  logo: {
    width: 56,
    height: 56,
    borderRadius: 12,
    resizeMode: "contain",
    marginRight: 12,
    backgroundColor: "#F5F5F5",
  },
  headerTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontFamily: UBUNTUBOLD,
    color: "#1A1A1A",
    marginBottom: 6,
    lineHeight: 24,
  },
  company: {
    fontSize: 15,
    color: "#666",
    fontFamily: FIRASANSSEMIBOLD,
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
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F8F9FA",
    borderRadius: 10,
    alignSelf: "flex-start",
    gap: 6,
  },
  dateText: {
    fontSize: 13,
    color: "#666",
    fontFamily: FIRASANSSEMIBOLD,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  primaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#d1fae5",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: BRANDCOLOR,
    fontSize: 15,
    fontFamily: UBUNTUBOLD,
  },
  secondaryButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF5F5",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFE5E5",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 60,
    color: "#999",
    fontSize: 16,
    fontFamily: FIRASANSSEMIBOLD,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
 
  modalContainer: {
    flex: 1,
    padding: 20,
  },
  closeBtn: {
    alignSelf: "flex-end",
  },
  modalLogo: {
    width: 100,
    height: 100,
    borderRadius: 52,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#1f1d1dff",
    // marginBottom: 15,
    resizeMode: "contain",
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: UBUNTUBOLD,
  },
  modalCompany: {
    fontSize: 16,
    color: BRANDCOLOR,
    marginVertical: 4,
  },
  modalSection: {
    marginVertical: 12,
  },
  modalDescription: {
    fontSize: 14,
    color: "#444",
    lineHeight: 22,
    marginTop: 8,
  },
  modalScrollView: {
    flex: 1,
  },
  modalSectionLabel: {
    fontSize: 16,
    fontFamily: FIRASANSSEMIBOLD,
    color: "#333",
    marginBottom: 8,
  },
  modalSectionText: {
    fontSize: 14,
    color: "#666",
  },
  resumeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  resumeButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: BRANDCOLOR,
    fontFamily: FIRASANSSEMIBOLD,
  },
  modalHeader: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 15,
},
 
backBtn: {
  padding: 4,
},
 
headerTitle: {
  fontSize: 18,
  fontFamily: UBUNTUBOLD,
  marginLeft: 10,
},
  // Resume Modal Styles (matching ViewCandidateScreen)
  resumeModalContainer: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  resumeModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: BRANDCOLOR,
    paddingTop: HEIGHT * 0.015,
    paddingBottom: HEIGHT * 0.02,
    paddingHorizontal: WIDTH * 0.04,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  resumeBackBtn: {
    width: WIDTH * 0.1,
    height: WIDTH * 0.1,
    justifyContent: "center",
    alignItems: "center",
  },
  resumeHeaderTitle: {
    fontSize: HEIGHT * 0.022,
    fontFamily: UBUNTUBOLD,
    color: WHITE,
    flex: 1,
    textAlign: "center",
  },
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
    fontFamily: FIRASANSSEMIBOLD,
    flex: 1,
  },
  resumeImageContainer: {
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
    alignItems: "center",
    minHeight: HEIGHT * 0.5,
  },
  resumeImage: {
    width: WIDTH * 0.85,
    minHeight: HEIGHT * 0.5,
    maxHeight: HEIGHT * 1.5,
  },
  resumeWebView: {
    width: WIDTH * 0.85,
    minHeight: HEIGHT * 0.5,
    maxHeight: HEIGHT * 1.5,
    backgroundColor: '#F5F5F5',
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
  loadingResumeOverlay: {
    position: "absolute",
    top: HEIGHT * 0.25,
    alignItems: "center",
    zIndex: 1,
  },
  loadingText: {
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
    fontFamily: FIRASANSSEMIBOLD,
  },
  pdfFallbackContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: HEIGHT * 0.1,
    paddingHorizontal: WIDTH * 0.05,
    backgroundColor: WHITE,
  },
  pdfFallbackText: {
    fontSize: HEIGHT * 0.018,
    color: BLACK,
    textAlign: "center",
    marginTop: HEIGHT * 0.02,
    fontFamily: FIRASANSSEMIBOLD,
  },
  pdfFallbackNote: {
    fontSize: HEIGHT * 0.014,
    color: "#666",
    textAlign: "center",
    marginTop: HEIGHT * 0.01,
  },
  pdfUrlText: {
    fontSize: HEIGHT * 0.012,
    color: BRANDCOLOR,
    textAlign: "center",
    marginTop: HEIGHT * 0.02,
    padding: WIDTH * 0.03,
    backgroundColor: "#F5F5F5",
    borderRadius: WIDTH * 0.02,
  },
  // Status Tracking Styles
  statusSection: {
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingTop: 16,
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
    fontWeight: "600",
    color: "#1A1A1A",
  },
  statusTimeline: {
    marginTop: 16,
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 20,
  },
  timelineLeft: {
    alignItems: "center",
    marginRight: 16,
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
    width: 2,
    height: 28,
    backgroundColor: "#E0E0E0",
    marginTop: 4,
    position: "absolute",
    top: 24,
  },
  timelineLineCompleted: {
    backgroundColor: "#26AE61",
  },
  timelineContent: {
    flex: 1,
    paddingTop: 2,
  },
  timelineLabel: {
    fontSize: 14,
    color: "#999",
    marginBottom: 4,
    fontWeight: "500",
  },
  timelineLabelCompleted: {
    color: "#1A1A1A",
    fontWeight: "700",
  },
  timelineDate: {
    fontSize: 12,
    color: "#999",
    fontWeight: "400",
},
});