import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  StatusBar,
  Platform,
  BackHandler,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { BLACK, BRANDCOLOR, WHITE } from "../../../constant/color";
import { HEIGHT, WIDTH } from "../../../constant/config";
import { UBUNTUBOLD, UBUNTU, FIRASANSSEMIBOLD, ROBOTOSEMIBOLD, CANTARELLBOLD, FIRASANSBOLD } from "../../../constant/fontPath";
import { LOGO } from "../../../constant/imagePath";
import { getObjByKey } from "../../../utils/Storage";
import { BASE_URL } from "../../../constant/url";
import { GETNETWORK } from "../../../utils/Network";
import { MyHeader } from "../../../components/commonComponents/MyHeader";
import { MyAlert } from "../../../components/commonComponents/MyAlert";
import { ToastMessage } from "../../../components/commonComponents/ToastMessage";

// Square Job Card Component with Edit/Delete buttons
const CategoryJobCard = ({ item, onPress, onEdit, onDelete }) => {
  // Format job type for display
  const formatJobType = (jobType) => {
    if (!jobType) return "Not specified";
    return jobType.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  // Format salary for display
  const formatSalary = (salaryRange) => {
    if (!salaryRange) return "Not specified";
    if (salaryRange === "Negotiable" || salaryRange.toLowerCase() === "negotiable") {
      return "Negotiable";
    }
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

  // Get logo URL
  const logoUrl = item.company_logo || item.companyLogo || item.logo
    ? ((item.company_logo || item.companyLogo || item.logo).startsWith('http://') || (item.company_logo || item.companyLogo || item.logo).startsWith('https://') 
        ? (item.company_logo || item.companyLogo || item.logo) 
        : `${BASE_URL.replace('/api/', '/')}${(item.company_logo || item.companyLogo || item.logo).replace(/^\//, '')}`)
    : null;

  return (
    <TouchableOpacity 
      style={styles.squareCard} 
      onPress={() => onPress(item)} 
      activeOpacity={0.8}
    >
      {/* Logo */}
      <View style={styles.cardLogoContainer}>
        {logoUrl ? (
          <Image source={{ uri: logoUrl }} style={styles.cardLogo} defaultSource={LOGO} />
        ) : (
          <Image source={LOGO} style={styles.cardLogo} />
        )}
        {/* Status Indicator */}
        {item.status && (
          <View style={styles.statusBadge}>
            <View 
              style={[
                styles.statusDot, 
                { backgroundColor: item.status === "active" ? "#4CAF50" : "#FF5252" }
              ]} 
            />
            <Text style={styles.statusBadgeText}>
              {item.status === "active" ? "Active" : "Inactive"}
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.job_title || item.jobTitle || item.title || 'N/A'}
        </Text>
        
        <Text style={styles.cardCompany} numberOfLines={1}>
          {item.company_name || item.companyName || item.company || 'N/A'}
        </Text>

        <View style={styles.cardMeta}>
          <MaterialCommunityIcons name="briefcase-outline" size={HEIGHT * 0.014} color={BRANDCOLOR} />
          <Text style={styles.cardMetaText} numberOfLines={1}>
            {formatJobType(item.job_type || item.jobType)}
          </Text>
        </View>

        <View style={styles.cardSalaryRow}>
          <MaterialCommunityIcons name="currency-inr" size={HEIGHT * 0.013} color="#4CAF50" />
          <Text style={styles.cardSalary} numberOfLines={1}>
            {formatSalary(item.salary_range || item.salaryRange || item.salary)}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.cardActions}>
        <TouchableOpacity 
          onPress={(e) => {
            e.stopPropagation();
            onEdit(item);
          }} 
          style={styles.actionButton}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="pencil" size={HEIGHT * 0.018} color={BRANDCOLOR} />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={(e) => {
            e.stopPropagation();
            onDelete(item);
          }} 
          style={styles.actionButton}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="delete-outline" size={HEIGHT * 0.018} color="#FF5252" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const CategoriesScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const category = route.params?.category || "";

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [deleteAlertVisible, setDeleteAlertVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState({
    type: "",
    msg: "",
    visible: false,
  });

  // Helper function to normalize category for comparison
  const normalizeCategory = (cat) => {
    if (!cat) return "";
    return cat.toString().toLowerCase().replace(/[_-]/g, ' ').trim();
  };

  // Helper function to check if two categories match
  const categoriesMatch = (cat1, cat2) => {
    if (!cat1 || !cat2) return false;
    const normalized1 = normalizeCategory(cat1);
    const normalized2 = normalizeCategory(cat2);
    return normalized1 === normalized2 ||
           cat1.toString().toLowerCase() === cat2.toString().toLowerCase() ||
           normalized1.replace(/\s/g, '') === normalized2.replace(/\s/g, '');
  };

  // Fetch jobs from all three endpoints
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const allJobs = [];

      // 1. Fetch from employer/jobs (with token)
      try {
        const loginResponse = await getObjByKey('loginResponse');
        if (loginResponse && loginResponse.token) {
          const url1 = `${BASE_URL}employer/jobs`;
          const result1 = await GETNETWORK(url1, true);
          
          let jobsData1 = [];
          if (Array.isArray(result1)) {
            jobsData1 = result1;
          } else if (result1?.data && Array.isArray(result1.data)) {
            jobsData1 = result1.data;
          } else if (result1?.jobs && Array.isArray(result1.jobs)) {
            jobsData1 = result1.jobs;
          } else if (result1?.data?.jobs && Array.isArray(result1.data.jobs)) {
            jobsData1 = result1.data.jobs;
          }
          allJobs.push(...jobsData1);
        }
      } catch (error) {
        // Silently fail for employer/jobs
      }

      // 2. Fetch from jobs (no token)
      try {
        const url2 = `${BASE_URL}jobs`;
        const result2 = await GETNETWORK(url2, false);
        
        if (result2 && !result2.message) {
          const jobsData2 = result2?.data || result2?.jobs || result2?.list || result2 || [];
          allJobs.push(...(Array.isArray(jobsData2) ? jobsData2 : []));
        }
      } catch (error) {
        // Silently fail for jobs
      }

      // 3. Fetch from jobs/latest (no token)
      try {
        const url3 = `${BASE_URL}jobs/latest`;
        const result3 = await GETNETWORK(url3, false);
        
        if (result3 && !result3.message) {
          const jobsData3 = result3?.data || result3?.jobs || result3?.list || result3 || [];
          allJobs.push(...(Array.isArray(jobsData3) ? jobsData3 : []));
        }
      } catch (error) {
        // Silently fail for jobs/latest
      }

      // Filter by category
      let filteredJobs = allJobs;
      if (category) {
        filteredJobs = allJobs.filter((job) => {
          const jobCategory = job.category || job.jobCategory || job.job_category || "";
          return categoriesMatch(jobCategory, category);
        });
      }

      // Remove duplicates based on job ID
      const uniqueJobs = [];
      const seenIds = new Set();
      filteredJobs.forEach((job) => {
        const jobId = job.id || job._id || job.job_id;
        if (jobId && !seenIds.has(jobId)) {
          seenIds.add(jobId);
          uniqueJobs.push(job);
        } else if (!jobId) {
          // If no ID, add it anyway (might be duplicate but we can't tell)
          uniqueJobs.push(job);
        }
      });

      setJobs(uniqueJobs);
    } catch (error) {
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
  }, [category]);

  // Fetch jobs on component mount and when category changes
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Refetch jobs when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchJobs();
    }, [fetchJobs])
  );

  // Handle back button press
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (deleteAlertVisible) {
        setDeleteAlertVisible(false);
        return true;
      }
      navigation.goBack();
      return true;
    });

    return () => backHandler.remove();
  }, [navigation, deleteAlertVisible]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchJobs();
  }, [fetchJobs]);

  const handleViewJob = (job) => {
    navigation.navigate("JobDetails", { jobData: job });
  };

  const handleEdit = async (job) => {
    // Check if job belongs to current employer (has ID and can be edited)
    const loginResponse = await getObjByKey('loginResponse');
    if (!loginResponse || !loginResponse.token) {
      setToastMessage({
        type: "error",
        msg: "Please login to edit jobs",
        visible: true,
      });
      return;
    }

    // Navigate to AddJob screen with job data for editing
    // Note: AddJobScreen may need to be updated to handle edit mode
    navigation.navigate("AddJob", { jobData: job, editMode: true });
  };

  const handleDelete = (job) => {
    setSelectedJob(job);
    setDeleteAlertVisible(true);
  };

  const confirmDelete = async () => {
    if (!selectedJob) {
      return;
    }

    try {
      const jobId = selectedJob.id || selectedJob.job_id || selectedJob._id;
      if (!jobId) {
        setToastMessage({
          type: "error",
          msg: "Job ID not found",
          visible: true,
        });
        setDeleteAlertVisible(false);
        setSelectedJob(null);
        return;
      }

      const loginResponse = await getObjByKey('loginResponse');
      if (!loginResponse || !loginResponse.token) {
        setToastMessage({
          type: "error",
          msg: "Authentication required",
          visible: true,
        });
        setDeleteAlertVisible(false);
        setSelectedJob(null);
        return;
      }

      const url = `${BASE_URL}employer/jobs/${jobId}`;
      
      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": `Bearer ${loginResponse.token}`,
        },
      });

      const result = await response.json();

      if (response.ok || result.statusCode === 200 || result.statusCode === 201) {
        // Remove job from list
        setJobs(jobs.filter((job) => {
          const currentJobId = job.id || job.job_id || job._id;
          return currentJobId !== jobId;
        }));
        setDeleteAlertVisible(false);
        setSelectedJob(null);
        
        setToastMessage({
          type: "success",
          msg: "Job deleted successfully!",
          visible: true,
        });
      } else {
        setToastMessage({
          type: "error",
          msg: result.message || "Failed to delete job",
          visible: true,
        });
        setDeleteAlertVisible(false);
        setSelectedJob(null);
      }
    } catch (error) {
      setToastMessage({
        type: "error",
        msg: "Failed to delete job. Please try again.",
        visible: true,
      });
      setDeleteAlertVisible(false);
      setSelectedJob(null);
    }
  };

  // Format category name for display
  const formatCategoryName = (cat) => {
    if (!cat) return 'All Categories';
    let formatted = cat.replace(/_/g, ' ');
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
          showBack={true}
          showCenterTitle={true}
          title={formatCategoryName(category)}
          onBackPress={() => navigation.goBack()}
        />

        {/* Jobs List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={BRANDCOLOR} />
            <Text style={styles.loadingText}>Loading jobs...</Text>
          </View>
        ) : jobs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="briefcase-off-outline" size={HEIGHT * 0.1} color="#CCC" />
            <Text style={styles.emptyText}>No jobs found in this category</Text>
          </View>
        ) : (
          <FlatList
            data={jobs}
            keyExtractor={(item, index) => item?.id || item?._id || item?.job_id || `job-${index}`}
            numColumns={2}
            columnWrapperStyle={styles.row}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[BRANDCOLOR]}
                tintColor={BRANDCOLOR}
              />
            }
            renderItem={({ item }) => (
              <CategoryJobCard
                item={item}
                onPress={handleViewJob}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
          />
        )}

        {/* Delete Confirmation Alert */}
        <MyAlert
          visible={deleteAlertVisible}
          title="Delete Job"
          message="Are you sure you want to delete this job posting?"
          textLeft="Cancel"
          textRight="Delete"
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

        {/* Toast Message */}
        <ToastMessage
          message={toastMessage.msg}
          visible={toastMessage.visible}
          setVisible={({ visible }) =>
            setToastMessage((prev) => ({ ...prev, visible }))
          }
          bacgroundColor={toastMessage.type === "success" ? "green" : toastMessage.type === "error" ? "red" : "blue"}
          textColor={WHITE}
          type={toastMessage.type}
          duration={3000}
          image={LOGO}
        />
      </Container>
    </>
  );
};

export default CategoriesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WHITE,
  },
  containerIOS: {
    paddingHorizontal: Platform.OS === "ios" ? WIDTH * 0.042 : 0,
  },
  containerAndroid: {
    paddingHorizontal: Platform.OS === "android" ? WIDTH * 0.038 : 0,
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
  listContent: {
    paddingHorizontal: WIDTH * 0.04,
    paddingBottom: HEIGHT * 0.025,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: HEIGHT * 0.015,
    paddingHorizontal: 0,
    gap: WIDTH * 0.18,
  },
  squareCard: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: WIDTH * 0.03,
    padding: WIDTH * 0.03,
    marginBottom: HEIGHT * 0.015,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: WIDTH * 0.01,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  cardLogoContainer: {
    alignItems: "center",
    marginBottom: HEIGHT * 0.01,
    position: "relative",
  },
  cardLogo: {
    width: WIDTH * 0.15,
    height: WIDTH * 0.15,
    borderRadius: WIDTH * 0.02,
    resizeMode: "contain",
    backgroundColor: WHITE,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: HEIGHT * 0.005,
    gap: WIDTH * 0.008,
  },
  statusDot: {
    width: WIDTH * 0.015,
    height: WIDTH * 0.015,
    borderRadius: WIDTH * 0.0075,
  },
  statusBadgeText: {
    fontSize: HEIGHT * 0.011,
    fontFamily: FIRASANSSEMIBOLD,
    color: "#666",
    textTransform: "capitalize",
  },
  cardContent: {
    marginBottom: HEIGHT * 0.01,
  },
  cardTitle: {
    fontSize: HEIGHT * 0.016,
    fontFamily: UBUNTUBOLD,
    color: BLACK,
    marginBottom: HEIGHT * 0.005,
    textAlign: "center",
    minHeight: HEIGHT * 0.04,
  },
  cardCompany: {
    fontSize: HEIGHT * 0.013,
    color: "#666",
    fontFamily: FIRASANSSEMIBOLD,
    textAlign: "center",
    marginBottom: HEIGHT * 0.008,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: HEIGHT * 0.005,
    gap: WIDTH * 0.008,
    width: "100%",
  },
  cardMetaText: {
    fontSize: HEIGHT * 0.012,
    color: "#666",
    fontFamily: FIRASANSSEMIBOLD,
    textAlign: "center",
    flexShrink: 1,
  },
  cardSalaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: WIDTH * 0.005,
  },
  cardSalary: {
    fontSize: HEIGHT * 0.012,
    color: "#4CAF50",
    fontFamily: FIRASANSSEMIBOLD,
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: HEIGHT * 0.01,
    paddingTop: HEIGHT * 0.01,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  actionButton: {
    padding: WIDTH * 0.02,
    borderRadius: WIDTH * 0.02,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: "#E0E0E0",
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
    marginTop: HEIGHT * 0.01,
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
    marginTop: HEIGHT * 0.02,
  },
});

