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
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { BLACK, BRANDCOLOR, WHITE } from "../../../constant/color";
import { UBUNTUBOLD, UBUNTU, FIRASANSSEMIBOLD, ROBOTOSEMIBOLD, CANTARELLBOLD, FIRASANSBOLD } from "../../../constant/fontPath";
import { LOGO } from "../../../constant/imagePath";
import { HEIGHT, WIDTH } from "../../../constant/config";
import { MyHeader } from "../../../components/commonComponents/MyHeader";
import { BASE_URL } from "../../../constant/url";
import { GETNETWORK } from "../../../utils/Network";
import { getObjByKey } from "../../../utils/Storage";

const RecommendedJobScreen = ({ navigation, route }) => {
  const { jobId, jobData } = route?.params || {};
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("Recent activity");
  const [appliedJobs, setAppliedJobs] = useState(new Map());
  const [userProfile, setUserProfile] = useState(null);
  const [wishlistJobs, setWishlistJobs] = useState(new Map());

  const Container = Platform.OS === "ios" ? SafeAreaView : View;

  // Fetch user profile
  const fetchUserProfile = useCallback(async () => {
    try {
      const token = await getObjByKey("loginResponse");
      if (!token) {
        return;
      }
      
      const url = `${BASE_URL}profile`;
      const result = await GETNETWORK(url, true);
      
      if (result && !result.message) {
        const profileData = result?.profile || result?.data || result?.user || result || {};
        setUserProfile(profileData);
      }
    } catch (error) {
      // Silently fail
    }
  }, []);

  // Fetch wishlist jobs
  const fetchWishlistJobs = useCallback(async () => {
    try {
      const token = await getObjByKey("loginResponse");
      if (!token) {
        return;
      }
      
      const url = `${BASE_URL}wishlist`;
      const result = await GETNETWORK(url, true);
      
      const wishlistMap = new Map();
      if (result && Array.isArray(result.wishlist)) {
        result.wishlist.forEach((item) => {
          const itemJobId = (item.id || item.job_id || item.jobId)?.toString();
          if (itemJobId) {
            wishlistMap.set(itemJobId, true);
          }
        });
      } else if (result?.data && Array.isArray(result.data)) {
        result.data.forEach((item) => {
          const itemJobId = (item.id || item.job_id || item.jobId)?.toString();
          if (itemJobId) {
            wishlistMap.set(itemJobId, true);
          }
        });
      }
      
      setWishlistJobs(wishlistMap);
    } catch (error) {
      // Silently fail
    }
  }, []);

  // Fetch recommended jobs
  const fetchRecommendedJobs = useCallback(async () => {
    try {
      setLoading(true);
      const url = `${BASE_URL}jobs/latest`;
      const result = await GETNETWORK(url, false);
      
      if (result && !result.message) {
        const jobs = result?.data || result?.jobs || result?.list || result || [];
        const allJobs = Array.isArray(jobs) ? jobs : [];
        
        // Filter out the current job if jobId is provided
        const filteredJobs = allJobs.filter(job => {
          const jobIdStr = (job.id || job._id)?.toString();
          return jobIdStr !== (jobId?.toString() || '');
        });
        
        setRecommendedJobs(filteredJobs);
      }
    } catch (error) {
      console.error('Error fetching recommended jobs:', error);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRecommendedJobs();
    await fetchAppliedJobs();
    await fetchUserProfile();
    await fetchWishlistJobs();
    setRefreshing(false);
  }, [fetchRecommendedJobs, fetchAppliedJobs, fetchUserProfile, fetchWishlistJobs]);

  useFocusEffect(
    useCallback(() => {
      fetchRecommendedJobs();
      fetchAppliedJobs();
      fetchUserProfile();
      fetchWishlistJobs();
    }, [fetchRecommendedJobs, fetchAppliedJobs, fetchUserProfile, fetchWishlistJobs])
  );

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

  // Get applied status for a job
  const isJobApplied = (jobId) => {
    const jobIdStr = (jobId || '')?.toString();
    return appliedJobs.has(jobIdStr);
  };

  // Construct logo URL
  const getLogoUrl = (job) => {
    const logo = job.logo || job.companyLogoUrl || job.companyLogo;
    if (!logo) return null;
    return logo.startsWith('http://') || logo.startsWith('https://') 
      ? logo 
      : `${BASE_URL.replace('/api/', '/')}${logo.replace(/^\//, '')}`;
  };

  // Filter jobs based on active tab
  const getFilteredJobs = () => {
    if (activeTab === "Profile") {
      // Filter by matching user profile/skills with job requirements
      if (!userProfile) return [];
      
      const userSkills = (userProfile.skills || '').toLowerCase();
      const userCategory = (userProfile.category || userProfile.preferredCategory || '').toLowerCase();
      
      return recommendedJobs.filter(job => {
        const jobSkills = (job.skills || '').toLowerCase();
        const jobCategory = (job.category || '').toLowerCase();
        const jobTitle = (job.title || job.jobTitle || '').toLowerCase();
        
        // Match by skills
        if (userSkills && jobSkills) {
          const userSkillsArray = userSkills.split(',').map(s => s.trim());
          const jobSkillsArray = jobSkills.split(',').map(s => s.trim());
          const hasMatchingSkill = userSkillsArray.some(skill => 
            jobSkillsArray.some(js => js.includes(skill) || skill.includes(js))
          );
          if (hasMatchingSkill) return true;
        }
        
        // Match by category
        if (userCategory && jobCategory && userCategory === jobCategory) {
          return true;
        }
        
        // Match by job title keywords
        if (userSkills) {
          const userSkillsArray = userSkills.split(',').map(s => s.trim());
          const hasMatchingKeyword = userSkillsArray.some(skill => 
            jobTitle.includes(skill) || jobSkills.includes(skill)
          );
          if (hasMatchingKeyword) return true;
        }
        
        return false;
      });
    } else if (activeTab === "Recent activity") {
      // Show recently posted jobs (sorted by createdAt)
      return [...recommendedJobs].sort((a, b) => {
        const dateA = new Date(a.createdAt || a.created_at || a.postedAt || 0);
        const dateB = new Date(b.createdAt || b.created_at || b.postedAt || 0);
        return dateB - dateA; // Most recent first
      });
    } else if (activeTab === "Top Candidate") {
      // Show jobs where user is a top candidate (based on skills match and experience)
      if (!userProfile) return [];
      
      const userSkills = (userProfile.skills || '').toLowerCase();
      const userExperience = userProfile.experience || userProfile.yearsOfExperience || '';
      
      return recommendedJobs.filter(job => {
        const jobSkills = (job.skills || '').toLowerCase();
        const jobExperience = job.experience || '';
        
        // High match score based on skills
        let matchScore = 0;
        
        if (userSkills && jobSkills) {
          const userSkillsArray = userSkills.split(',').map(s => s.trim());
          const jobSkillsArray = jobSkills.split(',').map(s => s.trim());
          const matchingSkills = userSkillsArray.filter(skill => 
            jobSkillsArray.some(js => js.includes(skill) || skill.includes(js))
          );
          matchScore += matchingSkills.length;
        }
        
        // Experience match bonus
        if (userExperience && jobExperience) {
          if (userExperience.includes('-') && jobExperience.includes('-')) {
            const [userMin, userMax] = userExperience.split('-').map(e => parseInt(e) || 0);
            const [jobMin, jobMax] = jobExperience.split('-').map(e => parseInt(e) || 0);
            if (userMin >= jobMin && userMin <= jobMax) {
              matchScore += 2;
            }
          }
        }
        
        // Top candidate if match score is high (3+ matching skills or strong experience match)
        return matchScore >= 3;
      }).sort((a, b) => {
        // Sort by match quality (could be enhanced with more sophisticated scoring)
        return 0;
      });
    }
    return recommendedJobs;
  };

  const filteredJobs = getFilteredJobs();
  
  // Get counts for each tab
  const getProfileJobsCount = () => {
    if (!userProfile) return 0;
    const userSkills = (userProfile.skills || '').toLowerCase();
    const userCategory = (userProfile.category || userProfile.preferredCategory || '').toLowerCase();
    
    return recommendedJobs.filter(job => {
      const jobSkills = (job.skills || '').toLowerCase();
      const jobCategory = (job.category || '').toLowerCase();
      const jobTitle = (job.title || job.jobTitle || '').toLowerCase();
      
      if (userSkills && jobSkills) {
        const userSkillsArray = userSkills.split(',').map(s => s.trim());
        const jobSkillsArray = jobSkills.split(',').map(s => s.trim());
        if (userSkillsArray.some(skill => jobSkillsArray.some(js => js.includes(skill) || skill.includes(js)))) {
          return true;
        }
      }
      if (userCategory && jobCategory && userCategory === jobCategory) return true;
      if (userSkills) {
        const userSkillsArray = userSkills.split(',').map(s => s.trim());
        if (userSkillsArray.some(skill => jobTitle.includes(skill) || jobSkills.includes(skill))) {
          return true;
        }
      }
      return false;
    }).length;
  };
  
  const getRecentActivityCount = () => {
    return recommendedJobs.length;
  };
  
  const getTopCandidateCount = () => {
    if (!userProfile) return 0;
    const userSkills = (userProfile.skills || '').toLowerCase();
    const userExperience = userProfile.experience || userProfile.yearsOfExperience || '';
    
    return recommendedJobs.filter(job => {
      const jobSkills = (job.skills || '').toLowerCase();
      let matchScore = 0;
      
      if (userSkills && jobSkills) {
        const userSkillsArray = userSkills.split(',').map(s => s.trim());
        const jobSkillsArray = jobSkills.split(',').map(s => s.trim());
        const matchingSkills = userSkillsArray.filter(skill => 
          jobSkillsArray.some(js => js.includes(skill) || skill.includes(js))
        );
        matchScore += matchingSkills.length;
      }
      
      if (userExperience && job.experience) {
        if (userExperience.includes('-') && job.experience.includes('-')) {
          const [userMin] = userExperience.split('-').map(e => parseInt(e) || 0);
          const [jobMin, jobMax] = job.experience.split('-').map(e => parseInt(e) || 0);
          if (userMin >= jobMin && userMin <= jobMax) {
            matchScore += 2;
          }
        }
      }
      
      return matchScore >= 3;
    }).length;
  };
  const companyName = jobData?.companyName || jobData?.company || "Company";

  if (loading && recommendedJobs.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={BRANDCOLOR} />
        <Text style={styles.loadingText}>Loading recommended jobs...</Text>
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
        title="Recommended Jobs"
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
        {/* Applied Successfully Section */}
        <View style={styles.successSection}>
          <View style={styles.successHeader}>
            <MaterialCommunityIcons name="check-circle" size={WIDTH * 0.08} color="#28a745" />
            <Text style={styles.successText}>Applied successfully</Text>
          </View>
        </View>

        {/* Next Step Card */}
        <View style={styles.nextStepCard}>
          <View style={styles.nextStepHeader}>
            <View style={styles.nextStepTag}>
              <Text style={styles.nextStepTagText}>Next step</Text>
            </View>
            <View style={styles.nextStepLogo}>
              <Text style={styles.nextStepLogoText}>
                {(companyName || "C")[0].toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={styles.nextStepTitle}>
            Start your interview preparation for {companyName}
          </Text>
          <TouchableOpacity style={styles.startPreparingButton} activeOpacity={0.8}>
            <Text style={styles.startPreparingText}>Start preparing</Text>
          </TouchableOpacity>
          <View style={styles.attemptedBy}>
            <MaterialCommunityIcons name="account-group" size={WIDTH * 0.04} color="#666" />
            <Text style={styles.attemptedByText}>Attempted by 21K+</Text>
          </View>
          <TouchableOpacity style={styles.viewQuestionsLink} activeOpacity={0.7}>
            <Text style={styles.viewQuestionsText}>All interview questions for this job</Text>
            <MaterialCommunityIcons name="chevron-right" size={WIDTH * 0.05} color={BRANDCOLOR} />
          </TouchableOpacity>
        </View>

        {/* Recommended Jobs Section */}
        <View style={styles.recommendedSection}>
          <Text style={styles.recommendedTitle}>Recommended Jobs</Text>
          
          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScrollContent}>
              {[
                `Profile (${getProfileJobsCount()})`,
                `Recent activity (${getRecentActivityCount()})`,
                `Top Candidate (${getTopCandidateCount()})`
              ].map((tab) => {
                let tabKey = "";
                if (tab.includes("Profile")) {
                  tabKey = "Profile";
                } else if (tab.includes("Recent activity")) {
                  tabKey = "Recent activity";
                } else if (tab.includes("Top Candidate")) {
                  tabKey = "Top Candidate";
                }
                const isActive = activeTab === tabKey;
                return (
                  <TouchableOpacity
                    key={tab}
                    style={[styles.tab, isActive && styles.activeTab]}
                    onPress={() => {
                      setActiveTab(tabKey);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                      {tab}
                    </Text>
                    {isActive && <View style={styles.tabIndicator} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Job Listings */}
          {filteredJobs.length > 0 ? (
            filteredJobs.map((job, index) => {
              const jobIdStr = (job.id || job._id)?.toString();
              const logoUrl = getLogoUrl(job);
              const isApplied = isJobApplied(jobIdStr);

              return (
                <TouchableOpacity
                  key={jobIdStr || index}
                  style={styles.jobCard}
                  onPress={() => {
                    navigation.navigate('SeekerJobDetails', {
                      jobId: jobIdStr,
                      jobData: job,
                    });
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.jobCardLeft}>
                    <Text style={styles.jobTitle}>
                      {job.title || job.jobTitle || "NA"}
                    </Text>
                    <Text style={styles.jobCompany}>
                      {job.companyName || job.company || "NA"}
                    </Text>
                    {job.rating && (
                      <View style={styles.jobRating}>
                        <MaterialCommunityIcons name="star" size={14} color="#FFB800" />
                        <Text style={styles.jobRatingText}>
                          {job.rating} ({job.reviewsCount || 0} Reviews)
                        </Text>
                      </View>
                    )}
                    <View style={styles.jobInfo}>
                      {job.city && (
                        <View style={styles.jobInfoItem}>
                          <MaterialCommunityIcons name="map-marker-outline" size={14} color={BRANDCOLOR} />
                          <Text style={styles.jobInfoText}>{job.city}</Text>
                        </View>
                      )}
                      {job.experience && (
                        <View style={styles.jobInfoItem}>
                          <MaterialCommunityIcons name="briefcase-outline" size={14} color={BRANDCOLOR} />
                          <Text style={styles.jobInfoText}>{job.experience}</Text>
                        </View>
                      )}
                      {(job.salaryRange || job.salary) && (
                        <View style={styles.jobInfoItem}>
                          <MaterialCommunityIcons name="currency-inr" size={14} color={BRANDCOLOR} />
                          <Text style={styles.jobInfoText}>
                            {formatSalary(job.salaryRange || job.salary)}
                          </Text>
                        </View>
                      )}
                    </View>
                    {job.skills && (
                      <Text style={styles.jobSkills} numberOfLines={1}>
                        {job.skills}
                      </Text>
                    )}
                    {(job.createdAt || job.postedAt || job.created_at || job.posted_at) && (
                      <Text style={styles.jobPosted}>
                        {(() => {
                          try {
                            const date = new Date(job.createdAt || job.postedAt || job.created_at || job.posted_at);
                            if (isNaN(date.getTime())) return "";
                            const day = String(date.getDate()).padStart(2, '0');
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const year = date.getFullYear();
                            return `${day}/${month}/${year}`;
                          } catch (error) {
                            return "";
                          }
                        })()}
                      </Text>
                    )}
                  </View>
                  <View style={styles.jobCardRight}>
                    {logoUrl ? (
                      <Image source={{ uri: logoUrl }} style={styles.jobLogo} defaultSource={LOGO} />
                    ) : (
                      <View style={styles.jobLogo}>
                        <Text style={styles.jobLogoText}>
                          {(job.companyName || job.company || "N")[0].toUpperCase()}
                        </Text>
                      </View>
                    )}
                    {isApplied ? (
                      <View style={styles.hideButton}>
                        <MaterialCommunityIcons name="check-circle" size={16} color="#28a745" />
                        <Text style={styles.hideButtonText}>Applied</Text>
                      </View>
                    ) : (
                      <TouchableOpacity 
                        style={styles.hideButton} 
                        activeOpacity={0.7}
                        onPress={(e) => {
                          e.stopPropagation();
                          // Handle hide job - could implement API call to hide job
                        }}
                      >
                        <MaterialCommunityIcons name="eye-off-outline" size={16} color={BRANDCOLOR} />
                        <Text style={styles.hideButtonText}>Hide</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.noJobs}>
              <Text style={styles.noJobsText}>No recommended jobs found</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </Container>
  );
};

export default RecommendedJobScreen;

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
  scrollContent: {
    paddingBottom: HEIGHT * 0.02,
  },
  successSection: {
    padding: WIDTH * 0.04,
    paddingTop: HEIGHT * 0.02,
  },
  successHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: WIDTH * 0.02,
  },
  successText: {
    fontSize: WIDTH * 0.045,
    fontFamily: UBUNTUBOLD,
    color: "#28a745",
  },
  nextStepCard: {
    backgroundColor: "#E8F5E9",
    marginHorizontal: WIDTH * 0.04,
    marginBottom: HEIGHT * 0.02,
    padding: WIDTH * 0.04,
    borderRadius: WIDTH * 0.025,
    borderWidth: 2,
    borderColor: "#28a745",
  },
  nextStepHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: HEIGHT * 0.015,
  },
  nextStepTag: {
    backgroundColor: "#28a745",
    paddingHorizontal: WIDTH * 0.03,
    paddingVertical: HEIGHT * 0.008,
    borderRadius: WIDTH * 0.02,
  },
  nextStepTagText: {
    color: WHITE,
    fontSize: WIDTH * 0.032,
    fontFamily: FIRASANSSEMIBOLD,
  },
  nextStepLogo: {
    width: WIDTH * 0.1,
    height: WIDTH * 0.1,
    borderRadius: WIDTH * 0.02,
    backgroundColor: BRANDCOLOR,
    alignItems: "center",
    justifyContent: "center",
  },
  nextStepLogoText: {
    fontSize: WIDTH * 0.05,
    fontFamily: UBUNTUBOLD,
    color: WHITE,
  },
  nextStepTitle: {
    fontSize: WIDTH * 0.04,
    fontFamily: UBUNTUBOLD,
    color: BLACK,
    marginBottom: HEIGHT * 0.015,
  },
  startPreparingButton: {
    backgroundColor: BRANDCOLOR,
    borderRadius: WIDTH * 0.02,
    paddingVertical: HEIGHT * 0.015,
    alignItems: "center",
    marginBottom: HEIGHT * 0.015,
  },
  startPreparingText: {
    color: WHITE,
    fontSize: WIDTH * 0.037,
    fontFamily: UBUNTUBOLD,
  },
  attemptedBy: {
    flexDirection: "row",
    alignItems: "center",
    gap: WIDTH * 0.015,
    marginBottom: HEIGHT * 0.01,
  },
  attemptedByText: {
    fontSize: WIDTH * 0.032,
    color: "#666",
  },
  viewQuestionsLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: HEIGHT * 0.01,
  },
  viewQuestionsText: {
    fontSize: WIDTH * 0.035,
    color: BRANDCOLOR,
    fontFamily: FIRASANSSEMIBOLD,
  },
  recommendedSection: {
    padding: WIDTH * 0.04,
  },
  recommendedTitle: {
    fontSize: WIDTH * 0.05,
    fontFamily: UBUNTUBOLD,
    color: BLACK,
    marginBottom: HEIGHT * 0.02,
  },
  tabContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    marginBottom: HEIGHT * 0.02,
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
  jobCard: {
    flexDirection: "row",
    backgroundColor: "#F8F9FA",
    borderRadius: WIDTH * 0.025,
    padding: WIDTH * 0.04,
    marginBottom: HEIGHT * 0.015,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  jobCardLeft: {
    flex: 1,
    marginRight: WIDTH * 0.03,
  },
  jobTitle: {
    fontSize: WIDTH * 0.04,
    fontFamily: UBUNTUBOLD,
    color: BLACK,
    marginBottom: HEIGHT * 0.005,
  },
  jobCompany: {
    fontSize: WIDTH * 0.035,
    fontFamily: FIRASANSSEMIBOLD,
    color: "#666",
    marginBottom: HEIGHT * 0.01,
  },
  jobRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: WIDTH * 0.01,
    marginBottom: HEIGHT * 0.01,
  },
  jobRatingText: {
    fontSize: WIDTH * 0.032,
    color: "#666",
  },
  jobInfo: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: WIDTH * 0.03,
    marginBottom: HEIGHT * 0.01,
  },
  jobInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: WIDTH * 0.01,
  },
  jobInfoText: {
    fontSize: WIDTH * 0.032,
    color: "#666",
  },
  jobSkills: {
    fontSize: WIDTH * 0.032,
    color: "#666",
    marginBottom: HEIGHT * 0.005,
  },
  jobPosted: {
    fontSize: WIDTH * 0.03,
    color: "#999",
  },
  jobCardRight: {
    alignItems: "center",
    justifyContent: "flex-start",
    gap: HEIGHT * 0.01,
  },
  jobLogo: {
    width: WIDTH * 0.12,
    height: WIDTH * 0.12,
    borderRadius: WIDTH * 0.02,
    backgroundColor: "#9C27B0",
    alignItems: "center",
    justifyContent: "center",
  },
  jobLogoText: {
    fontSize: WIDTH * 0.05,
    fontFamily: UBUNTUBOLD,
    color: WHITE,
  },
  hideButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: WIDTH * 0.01,
    padding: WIDTH * 0.02,
  },
  hideButtonText: {
    fontSize: WIDTH * 0.03,
    color: BRANDCOLOR,
    fontFamily: FIRASANSSEMIBOLD,
  },
  noJobs: {
    padding: WIDTH * 0.04,
    alignItems: "center",
  },
  noJobsText: {
    fontSize: WIDTH * 0.035,
    color: "#666",
  },
});
