import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
  BackHandler,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Image,
  Modal,
  Pressable,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useFocusEffect } from "@react-navigation/native";
import { BLACK, BRANDCOLOR, WHITE } from "../../../constant/color";
import { HEIGHT, WIDTH } from "../../../constant/config";
import {
  CANTARELLBOLD,
  CANTARELL,
  FIRASANSBOLD,
  FIRASANS,
  FIRASANSSEMIBOLD,
  OXYGENBOLD,
  OXYGEN,
  ROBOTOBOLD,
  ROBOTOSEMIBOLD,
  ROBOTO,
  UBUNTUBOLD,
  UBUNTU,
} from "../../../constant/fontPath";
import { BASE_URL } from "../../../constant/url";
import { GETNETWORK } from "../../../utils/Network";
import { ToastMessage } from "../../../components/commonComponents/ToastMessage";

// Format jobType: full_time -> Full Time
const formatJobType = (jobType) => {
  if (!jobType) return "";
  return jobType
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

// Format location: combine state and city
const formatLocation = (state, city) => {
  const formatState = (state) => {
    if (!state) return "";
    return state
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const formatCity = (city) => {
    if (!city) return "";
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
  return "";
};

// Format salary
const formatSalary = (salaryRange) => {
  if (!salaryRange) return "Salary not specified";
  return salaryRange.trim().replace(/^INR\s*/i, "");
};

// Job Card Component
const JobCard = ({ item, onPress }) => {
  const logoUrl = item.companyLogoUrl || item.logo
    ? ((item.companyLogoUrl || item.logo).startsWith("http://") ||
      (item.companyLogoUrl || item.logo).startsWith("https://")
      ? item.companyLogoUrl || item.logo
      : `${BASE_URL.replace("/api/", "/")}${(item.companyLogoUrl || item.logo).replace(/^\//, "")}`)
    : null;

  return (
    <TouchableOpacity
      style={styles.jobCard}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        {/* Logo */}
        {logoUrl ? (
          <View style={styles.logoContainer}>
            <Image
              source={{ uri: logoUrl }}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        ) : (
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons
              name="briefcase"
              size={32}
              color={BRANDCOLOR}
            />
          </View>
        )}

        {/* Job Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.jobTitle} numberOfLines={2}>
            {item.jobTitle || "Job Title"}
          </Text>
          <Text style={styles.companyName} numberOfLines={1}>
            {item.companyName || "Company"}
          </Text>
          <Text style={styles.location} numberOfLines={1}>
            {formatLocation(item.state, item.city)}
          </Text>
        </View>

        {/* Salary */}
        <View style={styles.salaryContainer}>
          <MaterialCommunityIcons name="currency-inr" size={14} color={BRANDCOLOR} />
          <Text style={styles.salary} numberOfLines={1}>
            {formatSalary(item.salaryRange)}
          </Text>
        </View>

        {/* Job Type Badge */}
        {item.jobType && (
          <View style={styles.jobTypeBadge}>
            <Text style={styles.jobTypeText}>{formatJobType(item.jobType)}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// Filter Chip Component
const FilterChip = ({ label, isActive, onPress }) => (
  <TouchableOpacity
    style={[styles.filterChip, isActive && styles.filterChipActive]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const UserSearchJobScreen = ({ navigation, route }) => {
  const [searchQuery, setSearchQuery] = useState(route?.params?.keyword || "");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState({
    type: "",
    msg: "",
    visible: false,
  });

  // Filter states
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [activeFilterCategory, setActiveFilterCategory] = useState("work_mode");
  const [appliedFilters, setAppliedFilters] = useState({});
  const [pendingFilters, setPendingFilters] = useState({});
  const filterOptions = [
    { id: "work_mode", label: "Work mode" },
    { id: "department", label: "Department" },
    { id: "location", label: "Location" },
    { id: "experience", label: "Experience" },
    { id: "salary", label: "Salary" },
    { id: "companies", label: "Companies" },
    { id: "industries", label: "Industries" },
    { id: "role", label: "Role" },
    { id: "educations", label: "Educations" },
    { id: "posted_by", label: "Posted By" },
    { id: "freshness", label: "Freshness" },
    { id: "sort", label: "Sort" },
  ];
  const filterChoices = {
    work_mode: ["Work from office", "Remote", "Hybrid", "Temp. WFH due to covid"],
    department: ["IT", "Sales", "Marketing", "Operations", "HR", "Finance"],
    location: ["Bengaluru", "Chennai", "Mumbai", "Delhi", "Hyderabad", "Remote"],
    experience: ["0-1 Years", "1-3 Years", "3-5 Years", "5+ Years"],
    salary: ["0-3 LPA", "3-6 LPA", "6-10 LPA", "10+ LPA"],
    companies: ["Trukky", "Amsoft Services", "The Space Element", "UptulaSoft"],
    industries: ["Technology", "Education", "Healthcare", "Finance", "Manufacturing"],
    role: ["Developer", "Designer", "Manager", "Coordinator", "Analyst"],
    educations: ["Any Graduate", "B.Tech", "MBA", "Diploma", "12th Pass"],
    posted_by: ["Direct company", "Consultant", "Staffing agency"],
    freshness: ["Last 24 hours", "Last 3 days", "Last 7 days", "Last 30 days"],
    sort: ["Relevance", "Latest", "Salary: High to Low", "Salary: Low to High"],
  };

  const filterScrollRef = useRef(null);
  const searchDebounceRef = useRef(null);

  // Search jobs
  const searchJobs = useCallback(
    async (query = searchQuery) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      try {
        setLoading(true);
        const keyword = query.trim();
        const normalizeJobs = (payload) => {
          if (!payload) return [];
          if (Array.isArray(payload?.data)) return payload.data;
          if (Array.isArray(payload?.jobs)) return payload.jobs;
          if (Array.isArray(payload)) return payload;
          if (payload?.data) return [payload.data];
          return [];
        };

        const searchUrl = `${BASE_URL}jobs/search?keyword=${encodeURIComponent(keyword)}`;
        const commonSearchUrl = `${BASE_URL}jobs?search=${encodeURIComponent(keyword)}`;

        const [resultA, resultB] = await Promise.all([
          GETNETWORK(searchUrl, false),
          GETNETWORK(commonSearchUrl, true),
        ]);

        const merged = [...normalizeJobs(resultA), ...normalizeJobs(resultB)];
        const uniqueJobs = merged.filter((job, index, arr) => {
          const currentId = (job?.id || job?._id || `${job?.jobTitle}-${job?.companyName}`).toString();
          return (
            index ===
            arr.findIndex((i) => (i?.id || i?._id || `${i?.jobTitle}-${i?.companyName}`).toString() === currentId)
          );
        });

        const keywordLower = keyword.toLowerCase();
        const filteredByKeyword = uniqueJobs.filter((job) => {
          const jobTitle = (job?.jobTitle || job?.title || "").toLowerCase();
          const company = (job?.companyName || job?.company || "").toLowerCase();
          const designation = (job?.designation || "").toLowerCase();
          const skills = Array.isArray(job?.skills)
            ? job.skills.join(" ").toLowerCase()
            : (job?.skills || "").toLowerCase();
          const description = (job?.description || job?.jobDescription || "").toLowerCase();
          return (
            jobTitle.includes(keywordLower) ||
            company.includes(keywordLower) ||
            designation.includes(keywordLower) ||
            skills.includes(keywordLower) ||
            description.includes(keywordLower)
          );
        });

        setSearchResults(filteredByKeyword);
      } catch (error) {
        console.log("❌ Error searching jobs:", error);
        setSearchResults([]);
        setToastMessage({
          type: "error",
          msg: "Error fetching search results",
          visible: true,
        });
      } finally {
        setLoading(false);
      }
    },
    [searchQuery]
  );

  // Handle search button press
  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchJobs(searchQuery);
    } else {
      setSearchResults([]);
      setToastMessage({
        type: "warning",
        msg: "Please enter a job role to search",
        visible: true,
      });
    }
  };

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      searchJobs(searchQuery);
      setRefreshing(false);
    }, 500);
  }, [searchQuery, searchJobs]);

  // Handle back button
  const handleBackPress = () => {
    navigation.goBack();
  };

  // Hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      navigation.goBack();
      return true;
    });

    return () => backHandler.remove();
  }, [navigation]);

  // Clean up when leaving screen
  useFocusEffect(
    useCallback(() => {
      return () => {
        if (searchDebounceRef.current) {
          clearTimeout(searchDebounceRef.current);
        }
      };
    }, [])
  );

  useEffect(() => {
    const trimmedQuery = (searchQuery || "").trim();

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (!trimmedQuery) {
      setSearchResults([]);
      return;
    }

    searchDebounceRef.current = setTimeout(() => {
      searchJobs(trimmedQuery);
    }, 350);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchQuery, searchJobs]);

  // Handle job card press
  const handleJobCardPress = (job) => {
    navigation.navigate("SeekerJobDetails", {
      jobId: job?.id || job?._id,
      jobData: job,
    });
  };

  // Handle filter toggle
  const toggleFilter = (filterId) => {
    setSelectedFilters((prev) =>
      prev.includes(filterId)
        ? prev.filter((id) => id !== filterId)
        : [...prev, filterId]
    );
  };

  const togglePendingFilter = (category, value) => {
    setPendingFilters((prev) => {
      const existing = prev[category] || [];
      const isSort = category === "sort";
      if (isSort) {
        return { ...prev, [category]: existing.includes(value) ? [] : [value] };
      }
      return {
        ...prev,
        [category]: existing.includes(value)
          ? existing.filter((item) => item !== value)
          : [...existing, value],
      };
    });
  };

  const openFilterModal = (category = "work_mode") => {
    setActiveFilterCategory(category);
    setPendingFilters(appliedFilters);
    setIsFilterModalVisible(true);
  };

  const applyFilters = () => {
    setAppliedFilters(pendingFilters);
    setSelectedFilters(
      Object.keys(pendingFilters).filter((key) => Array.isArray(pendingFilters[key]) && pendingFilters[key].length > 0)
    );
    setIsFilterModalVisible(false);
  };

  const filteredResults = useMemo(() => {
    let data = [...searchResults];
    const includesAny = (value, terms) => {
      const input = (value || "").toString().toLowerCase();
      return terms.some((term) => input.includes(term.toLowerCase()));
    };

    if ((appliedFilters.work_mode || []).length > 0) {
      data = data.filter((job) => {
        const modeSource = `${job.jobType || ""} ${job.workMode || ""} ${job.workplaceType || ""}`;
        return includesAny(modeSource, appliedFilters.work_mode);
      });
    }

    if ((appliedFilters.department || []).length > 0) {
      data = data.filter((job) =>
        includesAny(`${job.department || ""} ${job.category || ""}`, appliedFilters.department)
      );
    }

    if ((appliedFilters.location || []).length > 0) {
      data = data.filter((job) =>
        includesAny(`${job.city || ""} ${job.state || ""} ${job.location || ""}`, appliedFilters.location)
      );
    }

    if ((appliedFilters.experience || []).length > 0) {
      data = data.filter((job) =>
        includesAny(`${job.experience || ""} ${job.experienceRequired || ""}`, appliedFilters.experience)
      );
    }

    if ((appliedFilters.salary || []).length > 0) {
      data = data.filter((job) => includesAny(job.salaryRange || "", appliedFilters.salary));
    }

    if ((appliedFilters.companies || []).length > 0) {
      data = data.filter((job) => includesAny(job.companyName || "", appliedFilters.companies));
    }

    if ((appliedFilters.industries || []).length > 0) {
      data = data.filter((job) => includesAny(job.industry || "", appliedFilters.industries));
    }

    if ((appliedFilters.role || []).length > 0) {
      data = data.filter((job) => includesAny(job.jobTitle || job.title || "", appliedFilters.role));
    }

    if ((appliedFilters.educations || []).length > 0) {
      data = data.filter((job) =>
        includesAny(`${job.education || ""} ${job.qualification || ""}`, appliedFilters.educations)
      );
    }

    if ((appliedFilters.posted_by || []).length > 0) {
      data = data.filter((job) => includesAny(`${job.postedBy || ""} ${job.source || ""}`, appliedFilters.posted_by));
    }

    if ((appliedFilters.freshness || []).length > 0) {
      data = data.filter((job) => includesAny(job.createdAt || job.postedAt || "", appliedFilters.freshness));
    }

    const selectedSort = appliedFilters.sort?.[0];
    if (selectedSort === "Latest") {
      data.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (selectedSort === "Salary: High to Low") {
      data.sort((a, b) => parseInt(b.salaryRange || "0", 10) - parseInt(a.salaryRange || "0", 10));
    } else if (selectedSort === "Salary: Low to High") {
      data.sort((a, b) => parseInt(a.salaryRange || "0", 10) - parseInt(b.salaryRange || "0", 10));
    }

    return data;
  }, [searchResults, appliedFilters]);

  // Render job card
  const renderJobCard = ({ item }) => (
    <JobCard item={item} onPress={handleJobCardPress} />
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="briefcase-off-outline" size={64} color="#CCC" />
      <Text style={styles.emptyText}>
        {searchQuery ? "No jobs found" : "Search for a job role"}
      </Text>
      <Text style={styles.emptySubtext}>
        {searchQuery
          ? "Try searching with different keywords"
          : "Enter a job role and press search"}
      </Text>
    </View>
  );

  const Container = Platform.OS === "ios" ? SafeAreaView : View;

  return (
    <>
      <StatusBar
        barStyle={Platform.OS === "ios" ? "dark-content" : "dark-content"}
        backgroundColor={WHITE}
        translucent={false}
      />
      <Container
        style={[
          styles.container,
          Platform.OS === "ios" && styles.containerIOS,
          Platform.OS === "android" && styles.containerAndroid,
        ]}
      >
        {/* Header with Back Icon and Search */}
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={BLACK} />
          </TouchableOpacity>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search job role..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>
        </View>

        {/* Loading Indicator */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={BRANDCOLOR} />
          </View>
        )}

        {/* Jobs List */}
        <FlatList
          data={filteredResults}
          keyExtractor={(item) => item.id || item._id || Math.random().toString()}
          renderItem={renderJobCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          scrollEnabled={!loading}
          nestedScrollEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[BRANDCOLOR]}
              tintColor={BRANDCOLOR}
            />
          }
          ListEmptyComponent={!loading ? renderEmptyState : null}
          ListFooterComponent={
            filteredResults.length > 0 && (
              <Text style={styles.footerText}>
                Showing {filteredResults.length} job{filteredResults.length !== 1 ? "s" : ""}
              </Text>
            )
          }
        />

        {/* Fixed Footer with Filters - Side Scrollable */}
        <View style={styles.filterFooter}>
          <TouchableOpacity
            style={styles.filterIconButton}
            activeOpacity={0.7}
            onPress={() => openFilterModal("work_mode")}
          >
            <MaterialCommunityIcons name="tune-variant" size={20} color={BLACK} />
          </TouchableOpacity>
          <ScrollView
            ref={filterScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContent}
            scrollEventThrottle={16}
          >
            {filterOptions.map((filter) => (
              <FilterChip
                key={filter.id}
                label={filter.label}
                isActive={selectedFilters.includes(filter.id)}
                onPress={() => {
                  toggleFilter(filter.id);
                  openFilterModal(filter.id);
                }}
              />
            ))}
          </ScrollView>
        </View>

        <Modal
          statusBarTranslucent={true}
          visible={isFilterModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setIsFilterModalVisible(false)}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setIsFilterModalVisible(false)} />
          <View style={styles.filterModalContainer}>
            <Text style={styles.filterModalTitle}>Filter results</Text>
            <View style={styles.filterModalContent}>
              <ScrollView style={styles.filterCategoryColumn} showsVerticalScrollIndicator={false}>
                {filterOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.filterCategoryItem,
                      activeFilterCategory === option.id && styles.filterCategoryItemActive,
                    ]}
                    onPress={() => setActiveFilterCategory(option.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.filterCategoryText,
                        activeFilterCategory === option.id && styles.filterCategoryTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <ScrollView style={styles.filterValuesColumn} showsVerticalScrollIndicator={false}>
                {(filterChoices[activeFilterCategory] || []).map((choice) => {
                  const checked = (pendingFilters[activeFilterCategory] || []).includes(choice);
                  return (
                    <TouchableOpacity
                      key={choice}
                      style={styles.filterValueItem}
                      onPress={() => togglePendingFilter(activeFilterCategory, choice)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons
                        name={checked ? "checkbox-marked-outline" : "checkbox-blank-outline"}
                        size={22}
                        color={checked ? BLACK : "#8C97B2"}
                      />
                      <Text style={styles.filterValueText}>{choice}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
            <View style={styles.filterModalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setPendingFilters(appliedFilters);
                  setIsFilterModalVisible(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
                <Text style={styles.applyButtonText}>Apply filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Toast Message */}
        <ToastMessage
          type={toastMessage.type}
          msg={toastMessage.msg}
          visible={toastMessage.visible}
          onHide={() => setToastMessage({ ...toastMessage, visible: false })}
        />
      </Container>
    </>
  );
};

export default UserSearchJobScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  containerIOS: {
    paddingTop: Platform.OS === "ios" ? 0 : 0,
  },
  containerAndroid: {
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: WHITE,
    paddingHorizontal: WIDTH * 0.04,
    paddingVertical: HEIGHT * 0.015,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    gap: WIDTH * 0.02,
  },
  backButton: {
    padding: WIDTH * 0.02,
    marginRight: WIDTH * 0.01,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F8FA",
    borderRadius: HEIGHT * 0.025,
    paddingHorizontal: WIDTH * 0.04,
    height: HEIGHT * 0.05,
    borderWidth: 1,
    borderColor: "#E2E6EE",
  },
  searchInput: {
    flex: 1,
    fontSize: HEIGHT * 0.016,
    fontFamily: FIRASANS,
    color: BLACK,
    padding: 0,
  },
  listContent: {
    padding: WIDTH * 0.04,
    paddingBottom: HEIGHT * 0.08,
  },
  jobCard: {
    backgroundColor: WHITE,
    borderRadius: WIDTH * 0.03,
    marginBottom: HEIGHT * 0.015,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  cardContent: {
    padding: WIDTH * 0.04,
    flexDirection: "row",
    alignItems: "center",
    gap: WIDTH * 0.03,
  },
  logoContainer: {
    width: WIDTH * 0.15,
    height: WIDTH * 0.15,
    borderRadius: WIDTH * 0.025,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  detailsContainer: {
    flex: 1,
  },
  jobTitle: {
    fontSize: HEIGHT * 0.016,
    fontFamily: FIRASANSBOLD,
    color: BLACK,
    marginBottom: HEIGHT * 0.005,
  },
  companyName: {
    fontSize: HEIGHT * 0.014,
    fontFamily: FIRASANS,
    color: "#666",
    marginBottom: HEIGHT * 0.003,
  },
  location: {
    fontSize: HEIGHT * 0.012,
    fontFamily: OXYGEN,
    color: "#999",
  },
  salaryContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: WIDTH * 0.01,
    marginTop: HEIGHT * 0.005,
  },
  salary: {
    fontSize: HEIGHT * 0.014,
    fontFamily: ROBOTOBOLD,
    color: BRANDCOLOR,
  },
  jobTypeBadge: {
    backgroundColor: `${BRANDCOLOR}20`,
    borderRadius: WIDTH * 0.02,
    paddingHorizontal: WIDTH * 0.02,
    paddingVertical: HEIGHT * 0.003,
    marginTop: HEIGHT * 0.005,
  },
  jobTypeText: {
    fontSize: HEIGHT * 0.012,
    fontFamily: FIRASANSBOLD,
    color: BRANDCOLOR,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: HEIGHT * 0.1,
  },
  emptyText: {
    fontSize: HEIGHT * 0.022,
    fontFamily: ROBOTOSEMIBOLD,
    color: "#666",
    marginTop: HEIGHT * 0.02,
    marginBottom: HEIGHT * 0.01,
  },
  emptySubtext: {
    fontSize: HEIGHT * 0.016,
    color: "#999",
    textAlign: "center",
    paddingHorizontal: WIDTH * 0.1,
    fontFamily: FIRASANS,
  },
  filterFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: WHITE,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingVertical: HEIGHT * 0.012,
    flexDirection: "row",
    alignItems: "center",
  },
  filterIconButton: {
    marginLeft: WIDTH * 0.04,
    marginRight: WIDTH * 0.02,
    width: HEIGHT * 0.048,
    height: HEIGHT * 0.048,
    borderRadius: HEIGHT * 0.024,
    borderWidth: 1,
    borderColor: "#D8DCE5",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: WHITE,
  },
  filterContent: {
    paddingRight: WIDTH * 0.04,
    gap: WIDTH * 0.02,
    alignItems: "center",
  },
  filterChip: {
    paddingHorizontal: WIDTH * 0.05,
    paddingVertical: HEIGHT * 0.008,
    borderRadius: WIDTH * 0.05,
    borderWidth: 1,
    borderColor: "#D8DCE5",
    backgroundColor: WHITE,
  },
  filterChipActive: {
    backgroundColor: "#F3F4F6",
    borderColor: BLACK,
  },
  filterChipText: {
    fontSize: HEIGHT * 0.014,
    fontFamily: FIRASANSSEMIBOLD,
    color: BLACK,
  },
  filterChipTextActive: {
    color: BLACK,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    textAlign: "center",
    fontSize: HEIGHT * 0.014,
    color: "#999",
    marginVertical: HEIGHT * 0.02,
    fontFamily: FIRASANS,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: WHITE,
  },
  filterModalContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: WHITE,
    overflow: "hidden",
  },
  filterModalTitle: {
    fontSize: HEIGHT * 0.026,
    fontFamily: ROBOTOBOLD,
    color: BLACK,
    paddingHorizontal: WIDTH * 0.05,
    paddingTop:
      Platform.OS === "android"
        ? (StatusBar.currentHeight || 0) + HEIGHT * 0.02
        : HEIGHT * 0.06,
    paddingBottom: HEIGHT * 0.018,
  },
  filterModalContent: {
    flex: 1,
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  filterCategoryColumn: {
    width: WIDTH * 0.08,
    backgroundColor: "#F8FAFC",
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
  },
  filterCategoryItem: {
    paddingHorizontal: WIDTH * 0.04,
    paddingVertical: HEIGHT * 0.022,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  filterCategoryItemActive: {
    backgroundColor: WHITE,
    borderLeftWidth: 3,
    borderLeftColor: BLACK,
  },
  filterCategoryText: {
    fontSize: HEIGHT * 0.016,
    color: "#667085",
    fontFamily: FIRASANS,
  },
  filterCategoryTextActive: {
    color: BLACK,
    fontFamily: FIRASANSBOLD,
  },
  filterValuesColumn: {
    flex: 1,
    paddingHorizontal: WIDTH * 0.04,
    paddingTop: HEIGHT * 0.016,
  },
  filterValueItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: WIDTH * 0.02,
    paddingVertical: HEIGHT * 0.012,
  },
  filterValueText: {
    color: BLACK,
    fontSize: HEIGHT * 0.0175,
    fontFamily: FIRASANS,
    flex: 1,
  },
  filterModalFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: WIDTH * 0.05,
    paddingVertical: HEIGHT * 0.018,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: WHITE,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: BLACK,
    borderRadius: HEIGHT * 0.03,
    paddingVertical: HEIGHT * 0.014,
    alignItems: "center",
    marginRight: WIDTH * 0.03,
    backgroundColor: WHITE,
  },
  cancelButtonText: {
    color: BLACK,
    fontFamily: FIRASANSSEMIBOLD,
    fontSize: HEIGHT * 0.019,
  },
  applyButton: {
    flex: 1,
    backgroundColor: WHITE,
    borderWidth: 1.5,
    borderColor: BLACK,
    borderRadius: HEIGHT * 0.03,
    paddingVertical: HEIGHT * 0.014,
    alignItems: "center",
  },
  applyButtonText: {
    color: BLACK,
    fontFamily: FIRASANSSEMIBOLD,
    fontSize: HEIGHT * 0.019,
  },
});
