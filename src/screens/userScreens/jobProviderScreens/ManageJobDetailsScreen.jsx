import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  StatusBar,
  Platform,
  SafeAreaView,
  BackHandler,
  TouchableOpacity,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { BLACK, BRANDCOLOR, WHITE } from "../../../constant/color";
import { HEIGHT, WIDTH } from "../../../constant/config";
import { UBUNTUBOLD, UBUNTU, FIRASANSSEMIBOLD, ROBOTOSEMIBOLD, CANTARELLBOLD, FIRASANSBOLD } from "../../../constant/fontPath";
import { BASE_URL } from "../../../constant/url";
import { MyHeader } from "../../../components/commonComponents/MyHeader";
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
import { ToastMessage } from "../../../components/commonComponents/ToastMessage";
import { GETNETWORK } from "../../../utils/Network";

const ManageJobDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { jobData: initialJobData } = route.params || {};

  const [jobData, setJobData] = useState(initialJobData || null);
  const [loading, setLoading] = useState(!initialJobData);
  const [activeTab, setActiveTab] = useState("Job Details");
  const [toastMessage, setToastMessage] = useState({
    type: "",
    msg: "",
    visible: false,
  });

  // Fetch job details from API if jobId is provided
  useEffect(() => {
    const fetchJobDetails = async () => {
      if (initialJobData) {
        const jobId = initialJobData.id || initialJobData.job_id || initialJobData._id;
        if (jobId) {
          try {
            setLoading(true);
            const url = `${BASE_URL}employer/jobs/${jobId}`;
            const result = await GETNETWORK(url, true);

            if (result && !result.error) {
              const fetchedJob = result.data || result.job || result;
              setJobData(fetchedJob);
            }
          } catch (error) {
            setToastMessage({
              type: "error",
              msg: "Failed to load job details",
              visible: true,
            });
          } finally {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [initialJobData]);

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

  if (!jobData) {
    return (
      <View style={styles.container}>
        <MyHeader
          showNotification={false}
          showBack
          showCenterTitle
          title="Job Details"
          onBackPress={handleBackPress}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No job data available</Text>
        </View>
      </View>
    );
  }

  // Construct logo URL if it's a relative path
  const logoUrl = jobData.company_logo
    ? (jobData.company_logo.startsWith('http://') || jobData.company_logo.startsWith('https://')
      ? jobData.company_logo
      : `${BASE_URL.replace('/api/', '/')}${jobData.company_logo.replace(/^\//, '')}`)
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

  // Format location
  const formatLocation = (city, state) => {
    const cityFormatted = city ? city.charAt(0).toUpperCase() + city.slice(1).toLowerCase() : "";
    const stateFormatted = state ? state.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()) : "";
    if (stateFormatted && cityFormatted) return `${cityFormatted}, ${stateFormatted}`;
    if (stateFormatted) return stateFormatted;
    if (cityFormatted) return cityFormatted;
    return "NA";
  };

  // Format city: first letter capitalized
  const formatCity = (city) => {
    if (!city || city.trim() === "") return "NA";
    return city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
  };

  // Format state: west_bengal -> West Bengal
  const formatState = (state) => {
    if (!state || state.trim() === "") return "NA";
    return state
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Format country: first letter capitalized
  const formatCountry = (country) => {
    if (!country || country.trim() === "") return "NA";
    return country.charAt(0).toUpperCase() + country.slice(1).toLowerCase();
  };

  const Container = Platform.OS === "ios" ? SafeAreaView : View;

  if (loading) {
    return (
      <Container style={styles.container}>
        <MyHeader
          showBack
          showCenterTitle
          title="Job Details"
          onBackPress={handleBackPress}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading job details...</Text>
        </View>
      </Container>
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
        onBackPress={handleBackPress}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
                {jobData.job_title || "NA"}
              </Text>
              <Text style={styles.companyNameHeader}>
                {(jobData.company_name && jobData.company_name.trim() !== "")
                  ? jobData.company_name
                  : "NA"}
              </Text>
              <View style={styles.ratingContainer}>
                <MaterialCommunityIcons name="star" size={16} color="#FFB800" />
                <Text style={styles.ratingText}>3.8</Text>
                <Text style={styles.reviewsText}>({jobData.applications_count || 423} reviews)</Text>
              </View>
            </View>
          </View>

          <View style={styles.headerStatsRow}>
            <View style={styles.countContainer}>
              <View style={styles.countItem}>
                <Image source={VIEW} style={styles.countIcon} />
                <Text style={styles.countText}>{jobData.views_count || 0} Views</Text>
              </View>
              <View style={styles.countItem}>
                <Image source={APPLICATION} style={styles.countIcon} />
                <Text style={styles.countText}>{jobData.applications_count || 0} Applications</Text>
              </View>
            </View>
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
                  • {jobData.experience || "1-3 years"} of experience required
                </Text>
                <Text style={styles.highlightItem}>
                  • {jobData.no_of_vacancy || 1} vacancy available
                </Text>
                <Text style={styles.highlightItem}>
                  • Location: {formatLocation(jobData.city, jobData.state)}
                </Text>
                {jobData.skills && (
                  <Text style={styles.highlightItem}>
                    • Skills: {jobData.skills.split(",").slice(0, 3).join(", ")}
                  </Text>
                )}
              </View>
            </View>

            {/* Job Information Section */}
            <View style={styles.jobInfoSection}>
              <View style={styles.infoItem}>
                <MaterialCommunityIcons name="briefcase-outline" size={20} color={BRANDCOLOR} />
                <Text style={styles.infoItemText}>{jobData.experience || "1-3 Yrs"}</Text>
              </View>
              <View style={styles.infoItem}>
                <MaterialCommunityIcons name="account-outline" size={20} color={BRANDCOLOR} />
                <Text style={styles.infoItemText}>{jobData.no_of_vacancy || 1} vacancy</Text>
              </View>
              <View style={styles.infoItem}>
                <MaterialCommunityIcons name="map-marker-outline" size={20} color={BRANDCOLOR} />
                <Text style={styles.infoItemText}>
                  {formatLocation(jobData.city, jobData.state)}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <MaterialCommunityIcons name="currency-inr" size={20} color={BRANDCOLOR} />
                <Text style={styles.infoItemText}>
                  {formatSalary(jobData.salary_range) !== "NA"
                    ? formatSalary(jobData.salary_range)
                    : "Not disclosed"}
                </Text>
              </View>
            </View>

            {/* Skills Section */}
            {jobData.skills && (
              <View style={styles.skillsSection}>
                <Text style={styles.skillsLabel}>Must have skills:</Text>
                <View style={styles.skillsContainer}>
                  {jobData.skills.split(",").slice(0, 5).map((skill, index) => (
                    <View key={index} style={styles.skillTag}>
                      <Text style={styles.skillText}>{skill.trim()}</Text>
                    </View>
                  ))}
                </View>
                {jobData.skills.split(",").length > 5 && (
                  <>
                    <Text style={styles.skillsLabel}>Good to have skills:</Text>
                    <View style={styles.skillsContainer}>
                      {jobData.skills.split(",").slice(5).map((skill, index) => (
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

              {jobData.description && (
                <Text style={styles.descriptionText}>{jobData.description}</Text>
              )}

              {/* What you'll do */}
              <Text style={styles.subsectionTitle}>What you'll do:</Text>
              <Text style={styles.descriptionText}>
                {jobData.description || "Join our team and contribute to exciting projects."}
              </Text>

              {/* Requirements */}
              <Text style={styles.subsectionTitle}>Requirements:</Text>
              <View style={styles.responsibilitiesList}>
                {jobData.qualification && (
                  <Text style={styles.responsibilityItem}>
                    • Qualification: {jobData.qualification}
                  </Text>
                )}
                {jobData.experience && (
                  <Text style={styles.responsibilityItem}>
                    • Experience: {jobData.experience}
                  </Text>
                )}
                {jobData.job_type && (
                  <Text style={styles.responsibilityItem}>
                    • Job Type: {formatJobType(jobData.job_type)}
                  </Text>
                )}
                {jobData.skills && (
                  <Text style={styles.responsibilityItem}>
                    • Skills Required: {jobData.skills}
                  </Text>
                )}
              </View>
            </View>
          </>
        )}

        {activeTab === "About Company" && (
          <>
            <View style={styles.aboutCompanySection}>
              <Text style={styles.sectionTitle}>About Company</Text>
              <Text style={styles.descriptionText}>
                {jobData.company_name || "Company information will be displayed here."}
              </Text>
              {jobData.description && (
                <Text style={styles.descriptionText}>{jobData.description}</Text>
              )}
            </View>

            {/* Company Address Section */}
            <View style={styles.section}>
              <View style={styles.sectionTitleContainer}>
                <Image source={COMPANYNAME} style={styles.sectionIcon} />
                <Text style={styles.sectionTitle}>Company Address</Text>
              </View>

              <View style={styles.infoRow}>
                <Image source={MAIL} style={styles.infoIcon} />
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>{(jobData.email && jobData.email.trim() !== "") ? jobData.email : "NA"}</Text>
              </View>

              <View style={styles.infoRow}>
                <Image source={PHONE} style={styles.infoIcon} />
                <Text style={styles.infoLabel}>Phone Number:</Text>
                <Text style={styles.infoValue}>{(jobData.phone && jobData.phone.trim() !== "") ? jobData.phone : "NA"}</Text>
              </View>

              <View style={styles.infoRow}>
                <Image source={WEBSITE} style={styles.infoIcon} />
                <Text style={styles.infoLabel}>Website:</Text>
                <Text style={styles.infoValue}>{(jobData.website && jobData.website.trim() !== "") ? jobData.website : "NA"}</Text>
              </View>

              <View style={styles.infoRow}>
                <Image source={ADDRESS} style={styles.infoIcon} />
                <Text style={styles.infoLabel}>Address:</Text>
                <Text style={styles.infoValue}>{(jobData.address && jobData.address.trim() !== "") ? jobData.address : "NA"}</Text>
              </View>

              <View style={styles.infoRow}>
                <Image source={CITY} style={styles.infoIcon} />
                <Text style={styles.infoLabel}>City:</Text>
                <Text style={styles.infoValue}>{formatCity(jobData.city)}</Text>
              </View>

              <View style={styles.infoRow}>
                <Image source={STATE} style={styles.infoIcon} />
                <Text style={styles.infoLabel}>State:</Text>
                <Text style={styles.infoValue}>{formatState(jobData.state)}</Text>
              </View>

              <View style={styles.infoRow}>
                <Image source={COUNTRY} style={styles.infoIcon} />
                <Text style={styles.infoLabel}>Country:</Text>
                <Text style={styles.infoValue}>{formatCountry(jobData.country)}</Text>
              </View>

              <View style={styles.infoRow}>
                <Image source={PINCODE} style={styles.infoIcon} />
                <Text style={styles.infoLabel}>Zip Code:</Text>
                <Text style={styles.infoValue}>{(jobData.zip_code && jobData.zip_code.trim() !== "") ? jobData.zip_code : "NA"}</Text>
              </View>
            </View>

            {/* Social Accounts - LinkedIn removed */}
            <View style={styles.section}>
              <View style={styles.sectionTitleContainer}>
                <Image source={SOCIALACCOUNT} style={styles.sectionIcon} />
                <Text style={styles.sectionTitle}>Social Accounts</Text>
              </View>

              <View style={styles.infoRow}>
                <Image source={FACEBOOK} style={styles.infoIcon} />
                <Text style={styles.infoLabel}>Facebook:</Text>
                <Text style={styles.infoValue}>{(jobData.facebook && jobData.facebook.trim() !== "") ? jobData.facebook : "NA"}</Text>
              </View>

              <View style={styles.infoRow}>
                <Image source={GOOGLE} style={styles.infoIcon} />
                <Text style={styles.infoLabel}>Google:</Text>
                <Text style={styles.infoValue}>{(jobData.google && jobData.google.trim() !== "") ? jobData.google : "NA"}</Text>
              </View>

              <View style={styles.infoRow}>
                <Image source={TWITTER} style={styles.infoIcon} />
                <Text style={styles.infoLabel}>Twitter:</Text>
                <Text style={styles.infoValue}>{(jobData.twitter && jobData.twitter.trim() !== "") ? jobData.twitter : "NA"}</Text>
              </View>

              <View style={styles.infoRow}>
                <Image source={PRINTREST} style={styles.infoIcon} />
                <Text style={styles.infoLabel}>Pinterest:</Text>
                <Text style={styles.infoValue}>{(jobData.pinterest && jobData.pinterest.trim() !== "") ? jobData.pinterest : "NA"}</Text>
              </View>

              <View style={styles.infoRow}>
                <Image source={INSTAGRAM} style={styles.infoIcon} />
                <Text style={styles.infoLabel}>Instagram:</Text>
                <Text style={styles.infoValue}>{(jobData.instagram && jobData.instagram.trim() !== "") ? jobData.instagram : "NA"}</Text>
              </View>
            </View>
          </>
        )}

        {activeTab === "Reviews" && (
          <View style={styles.reviewsSection}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.sectionTitle}>Reviews</Text>
            </View>
            <Text style={styles.descriptionText}>
              Reviews will be displayed here.
            </Text>
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

        {activeTab === "Salaries" && (
          <View style={styles.salariesSection}>
            <Text style={styles.sectionTitle}>Salary insights</Text>
            <Text style={styles.salaryDescription}>
              Compare salaries of {jobData.job_title || "this position"} with similar companies.
            </Text>

            <View style={styles.salaryCard}>
              <Text style={styles.avgSalaryText}>
                Avg. Salary - {formatSalary(jobData.salary_range) !== "NA"
                  ? formatSalary(jobData.salary_range)
                  : "Not disclosed"}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Toast Message */}
      <ToastMessage
        type={toastMessage.type}
        message={toastMessage.msg}
        visible={toastMessage.visible}
        setVisible={({ visible }) =>
          setToastMessage((prev) => ({ ...prev, visible }))
        }
        bacgroundColor={toastMessage.type === "success" ? "green" : "red"}
        textColor={WHITE}
        duration={3000}
      />
    </Container>
  );
};

export default ManageJobDetailsScreen;

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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: HEIGHT * 0.018,
    color: "#FF0000",
    textAlign: "center",
    marginTop: HEIGHT * 0.2,
  },
  scrollContent: {
    paddingBottom: HEIGHT * 0.05,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: HEIGHT * 0.018,
    color: "#666",
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
  headerStatsRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginTop: HEIGHT * 0.01,
  },
  countContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: WIDTH * 0.04,
  },
  countItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: WIDTH * 0.015,
  },
  countIcon: {
    width: WIDTH * 0.05,
    height: WIDTH * 0.05,
    resizeMode: "contain",
  },
  countText: {
    fontSize: WIDTH * 0.032,
    color: "#666",
    fontFamily: FIRASANSSEMIBOLD,
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
  aboutCompanySection: {
    padding: WIDTH * 0.04,
  },
  reviewsSection: {
    padding: WIDTH * 0.04,
  },
  reviewsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: HEIGHT * 0.015,
  },
  benefitsSection: {
    padding: WIDTH * 0.04,
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
  section: {
    marginBottom: HEIGHT * 0.03,
    padding: WIDTH * 0.04,
    paddingBottom: HEIGHT * 0.02,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: HEIGHT * 0.02,
  },
  sectionIcon: {
    width: WIDTH * 0.06,
    height: WIDTH * 0.06,
    marginRight: WIDTH * 0.02,
    resizeMode: "contain",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: HEIGHT * 0.015,
    flexWrap: "wrap",
  },
  infoIcon: {
    width: WIDTH * 0.05,
    height: WIDTH * 0.05,
    marginRight: WIDTH * 0.02,
    resizeMode: "contain",
  },
  infoLabel: {
    fontSize: HEIGHT * 0.018,
    fontFamily: FIRASANSSEMIBOLD,
    color: "#666",
    minWidth: WIDTH * 0.3,
    marginRight: WIDTH * 0.02,
  },
  infoValue: {
    fontSize: HEIGHT * 0.018,
    color: BLACK,
    flex: 1,
    flexWrap: "wrap",
  },
});

