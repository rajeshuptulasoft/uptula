import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
  BackHandler,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Animated,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { BLACK, BRANDCOLOR, WHITE } from "../../../constant/color";
import { HEIGHT, WIDTH } from "../../../constant/config";
import { MyHeader } from "../../../components/commonComponents/MyHeader";
import { BASE_URL } from "../../../constant/url";
import { GETNETWORK } from "../../../utils/Network";
import { COMICSBOLD, UBUNTUBOLD, UBUNTU, FIRASANSSEMIBOLD, ROBOTOSEMIBOLD, CANTARELLBOLD, FIRASANSBOLD } from "../../../constant/fontPath";

// Animated Bar Component for Applicants per Job Chart
const AnimatedBar = ({ value, maxValue, label, experiencedCount, fresherCount, experienced, fresher, experiencedPercentage, fresherPercentage, chanceScore, delay = 0 }) => {
  const animatedHeight = useRef(new Animated.Value(0)).current;
  const [tooltipVisible, setTooltipVisible] = useState(false);

  useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: value,
      duration: 1000,
      delay: delay,
      useNativeDriver: false,
    }).start();
  }, [value, delay]);

  const totalCount = (experiencedCount || experienced || 0) + (fresherCount || fresher || 0);
  const expCount = experiencedCount || experienced || 0;
  const freshCount = fresherCount || fresher || 0;

  const maxBarHeight = WIDTH * 0.3;

  const barHeight = animatedHeight.interpolate({
    inputRange: [0, maxValue || 1],
    outputRange: [0, maxBarHeight],
  });

  return (
    <View style={styles.barContainer}>
      <TouchableOpacity
        style={styles.barWrapper}
        onPressIn={() => setTooltipVisible(true)}
        onPressOut={() => setTooltipVisible(false)}
        activeOpacity={0.8}
      >
        <View style={styles.barChartContainer}>
          {value > 0 ? (
            <Animated.View
              style={[
                styles.stackedBarContainer,
                {
                  height: barHeight,
                  flexDirection: "column",
                  justifyContent: "flex-end",
                },
              ]}
            >
              {/* Calculate proportions based on actual counts */}
              {(() => {
                const total = expCount + freshCount;
                
                // If we have breakdown data, show stacked bars
                if (total > 0) {
                  return (
                    <>
                      {/* Green section for Experienced at bottom */}
                      {expCount > 0 && (
                        <View
                          style={[
                            styles.stackedBar,
                            {
                              flex: expCount,
                              backgroundColor: "#4CAF50",
                            },
                          ]}
                        />
                      )}
                      {/* Purple section for Fresher at top */}
                      {freshCount > 0 && (
                        <View
                          style={[
                            styles.stackedBar,
                            {
                              flex: freshCount,
                              backgroundColor: "#9C27B0",
                            },
                          ]}
                        />
                      )}
                    </>
                  );
                } else {
                  // If no breakdown data but we have total value, show gray bar
                  return (
                    <View
                      style={[
                        styles.stackedBar,
                        {
                          flex: 1,
                          backgroundColor: "#E5E7EB",
                        },
                      ]}
                    />
                  );
                }
              })()}
            </Animated.View>
          ) : (
            <View
              style={[
                styles.stackedBarContainer,
                {
                  height: 2,
                  backgroundColor: "#E5E7EB",
                },
              ]}
            />
          )}
        </View>
        {tooltipVisible && value > 0 && (
          <View style={styles.tooltip}>
            <Text style={styles.tooltipTitle}>{label}</Text>
            <Text style={[styles.tooltipText, { color: "#4CAF50" }]}>
              Experienced: {expCount} ({experiencedPercentage ? Math.round(experiencedPercentage) : 0}%)
            </Text>
            <Text style={[styles.tooltipText, { color: "#9C27B0" }]}>
              Fresher: {freshCount} ({fresherPercentage ? Math.round(fresherPercentage) : 0}%)
            </Text>
            <Text style={[styles.tooltipText, { color: "#FF9800", fontFamily: FIRASANSSEMIBOLD }]}>
              Chance Score: {chanceScore ? Math.round(chanceScore) : 0}%
            </Text>
          </View>
        )}
      </TouchableOpacity>
      <Text style={styles.barLabel} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
};

// Experience Distribution Chart Component
const ExperienceChart = ({ experienced, fresher, totalApplications }) => {
  const total = totalApplications || (experienced + fresher);

  return (
    <View style={styles.chartContainer}>
      <View style={styles.chartPlaceholder}>
        {total > 0 ? (
          <View style={styles.experienceDistributionContainer}>
            {/* Total Applications at Center */}
            <Text style={styles.totalApplicationsText}>{total}</Text>
            
            {/* Dots with Counts Below */}
            <View style={styles.dotsContainer}>
              {/* Green Dot with Experienced Count */}
              <View style={styles.dotItem}>
                <View style={[styles.experienceDot, { backgroundColor: "#4CAF50" }]} />
                <Text style={styles.dotCountText}>{experienced || 0}</Text>
              </View>
              
              {/* Purple Dot with Fresher Count */}
              <View style={styles.dotItem}>
                <View style={[styles.experienceDot, { backgroundColor: "#9C27B0" }]} />
                <Text style={styles.dotCountText}>{fresher || 0}</Text>
              </View>
            </View>
          </View>
        ) : (
          <Text style={styles.emptyChartText}>No data available</Text>
        )}
      </View>
      <View style={styles.chartLegendVertical}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: "#4CAF50" }]} />
          <Text style={styles.legendText}>Experienced</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: "#9C27B0" }]} />
          <Text style={styles.legendText}>Fresher</Text>
        </View>
      </View>
    </View>
  );
};

const AnalyticsReportScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobs, setJobs] = useState([]);

  // Fetch analytics data
  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      const url = `${BASE_URL}employer/analytics/summary`;
      const result = await GETNETWORK(url, true);

      if (result && !result.error) {
        const data = result.data || result;
        setAnalyticsData(data);
        
        // Set jobs list from 'jobs' array in API response
        const jobsArray = data.jobs || [];
        if (jobsArray.length > 0) {
          setJobs(jobsArray);
          // Always select first job by default
          if (!selectedJob) {
            const firstJob = jobsArray[0];
            setSelectedJob(firstJob);
            
            // Fetch analytics for the first job automatically
            const jobId = firstJob.jobId || firstJob.id || firstJob.job_id || firstJob._id;
            const jobSpecificUrl = `${BASE_URL}employer/analytics/summary?jobId=${jobId}`;
            const jobResult = await GETNETWORK(jobSpecificUrl, true);
            
            if (jobResult && !jobResult.error) {
              const jobData = jobResult.data || jobResult;
              setAnalyticsData(jobData);
            }
          }
        }
      }
    } catch (error) {
      // Handle error silently
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedJob]);

  // Fetch jobs list
  const fetchJobs = useCallback(async () => {
    try {
      const url = `${BASE_URL}employer/jobs`;
      const result = await GETNETWORK(url, true);

      let jobsData = [];
      if (Array.isArray(result)) {
        jobsData = result;
      } else if (result?.data && Array.isArray(result.data)) {
        jobsData = result.data;
      } else if (result?.jobs && Array.isArray(result.jobs)) {
        jobsData = result.jobs;
      }

      if (jobsData.length > 0) {
        setJobs(jobsData);
        // Always select first job by default
        if (!selectedJob) {
          setSelectedJob(jobsData[0]);
        }
      }
    } catch (error) {
      // Handle error silently
    }
  }, [selectedJob]);

  useFocusEffect(
    useCallback(() => {
      fetchAnalyticsData();
      fetchJobs();
    }, [fetchAnalyticsData, fetchJobs])
  );

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

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAnalyticsData();
    fetchJobs();
  }, [fetchAnalyticsData, fetchJobs]);

  // Handle job selection and refresh data
  const handleJobSelect = useCallback(async (job) => {
    setSelectedJob(job);
    setRefreshing(true);
    try {
      const jobId = job.jobId || job.id || job.job_id || job._id;
      const url = `${BASE_URL}employer/analytics/summary?jobId=${jobId}`;
      const result = await GETNETWORK(url, true);

      if (result && !result.error) {
        const data = result.data || result;
        setAnalyticsData(data);
      }
    } catch (error) {
      // Handle error silently
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Calculate metrics - Use summary data from API response
  const summaryData = analyticsData?.summary || {};
  const totalApplicants = summaryData.totalApplications || 0;
  const totalJobs = summaryData.totalJobs || jobs.length || 0;
  
  const experiencedCount = summaryData.experiencedCount || 0;
  const fresherCount = summaryData.fresherCount || 0;
  const experiencedPercent = summaryData.experiencedPercentage || 0;
  const fresherPercent = summaryData.fresherPercentage || 0;
  const averageFillChance = summaryData.averageChance || 0;

  // Get selected job analytics - Use highlight data for selected job
  const selectedJobData = selectedJob
    ? (analyticsData?.highlight && analyticsData.highlight.jobId === (selectedJob.jobId || selectedJob.id) 
        ? analyticsData.highlight 
        : jobs.find(job => (job.jobId || job.id) === (selectedJob.jobId || selectedJob.id)) 
        || selectedJob)
    : null;

  const selectedJobFillChance = selectedJobData?.chanceScore || 0;
  const selectedJobApplicants = selectedJobData?.totalApplications || 0;
  const selectedJobVacancy = selectedJobData?.noOfVacancy || 1;
  const selectedJobExperiencedCount = selectedJobData?.experiencedCount || 0;
  const selectedJobFresherCount = selectedJobData?.fresherCount || 0;
  const selectedJobExperiencedPercent = selectedJobData?.experiencedPercentage || 0;
  const selectedJobFresherPercent = selectedJobData?.fresherPercentage || 0;

  // Prepare data for Applicants per Job chart
  const chartData = jobs.slice(0, 6).map((job) => {
    return {
      label: job.jobTitle || job.job_title || job.title || "Untitled",
      value: job.totalApplications || job.applicants || 0,
      experiencedCount: job.experiencedCount || job.experienced || 0,
      experienced: job.experiencedCount || job.experienced || 0,
      fresherCount: job.fresherCount || job.fresher || 0,
      fresher: job.fresherCount || job.fresher || 0,
      experiencedPercentage: job.experiencedPercentage || 0,
      fresherPercentage: job.fresherPercentage || 0,
      chanceScore: job.chanceScore || job.fillChance || 0,
    };
  });

  const maxChartValue = Math.max(...chartData.map((d) => d.value), 1);

  const Container = Platform.OS === "ios" ? SafeAreaView : View;

  return (
    <>
      <StatusBar
        barStyle={Platform.OS === "ios" ? "dark-content" : "dark-content"}
        backgroundColor={WHITE}
        translucent={Platform.OS === "android"}
      />
      <Container
        style={[
          styles.container,
          Platform.OS === "ios" && styles.containerIOS,
          Platform.OS === "android" && styles.containerAndroid,
        ]}
      >
        <MyHeader
          showBack
          showCenterTitle
          title="Job Analytics & Candidate Pulse"
          onBackPress={handleBackPress}
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
          {/* Premium Feature Badge with Analytics Label */}
          <View style={styles.premiumBadgeContainer}>
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumBadgeText}>PREMIUM FEATURE</Text>
            </View>
            <Text style={styles.analyticsLabel}>Analytics</Text>
          </View>

          {/* Title and Subtitle */}
          <Text style={styles.mainTitle}>Job Analytics & Candidate Pulse</Text>
          <Text style={styles.subtitle}>
            Track total applicants, fresher vs experienced distribution, and the percentage chance
            of fills for each job.
          </Text>

          {/* Premium Analytics Status */}
          <View style={styles.premiumStatusBox}>
            <Text style={styles.premiumStatusTitle}>
              Premium analytics unlocked for all employers
            </Text>
            <Text style={styles.premiumStatusText}>
              Billing is paused, so your account enjoys unlimited analytics access by default.
            </Text>
          </View>

          {/* Key Metrics Cards */}
          <View style={styles.metricsContainer}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>TOTAL APPLICANTS</Text>
              <Text style={styles.metricValue}>{totalApplicants}</Text>
              <Text style={styles.metricSubtext}>
                Across {totalJobs} active jobs
              </Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>FRESHER VS EXPERIENCED</Text>
              <Text style={styles.metricValue}>
                {fresherPercent}% / {experiencedPercent}%
              </Text>
              <Text style={styles.metricSubtext}>Fresher / Experienced mix</Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>AVERAGE FILL CHANCE</Text>
              <Text style={styles.metricValue}>{averageFillChance}%</Text>
              <Text style={styles.metricSubtext}>Applications per vacancy</Text>
            </View>
          </View>

          {/* Job Selection Section */}
          <View style={styles.jobSelectionSection}>
            <Text style={styles.sectionTitle}>
              Select a job to deep dive
              {selectedJob && (
                <Text style={styles.selectedJobIndicator}>
                  {' '}• {selectedJob.jobTitle || selectedJob.job_title || selectedJob.title || 'Job'}
                </Text>
              )}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.jobScrollContent}
            >
              {jobs.map((job, index) => {
                const jobId = job.jobId || job.id || job.job_id || job._id;
                const selectedJobId = selectedJob?.jobId || selectedJob?.id || selectedJob?.job_id || selectedJob?._id;
                const isSelected = jobId === selectedJobId;
                const applicants = job.totalApplications || job.applicants || 0;

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.jobChip,
                      isSelected && styles.jobChipSelected,
                    ]}
                    onPress={() => handleJobSelect(job)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.jobChipText,
                        isSelected && styles.jobChipTextSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {job.jobTitle || job.job_title || job.title || "Untitled"}
                    </Text>
                    <Text style={styles.jobChipApplicants}>{applicants} applicants</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Charts Row */}
          <View style={styles.chartsRow}>
            {/* Experience Distribution */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>
                Experience distribution
                {selectedJob && (
                  <Text style={styles.chartSubtitle}>
                    {'\n'}for {selectedJob.jobTitle || selectedJob.job_title || selectedJob.title}
                  </Text>
                )}
              </Text>
              <ExperienceChart
                experienced={selectedJobExperiencedCount}
                fresher={selectedJobFresherCount}
                totalApplications={selectedJobApplicants}
              />
            </View>

            {/* Fill Chance */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>
                Fill chance
                {selectedJob && (
                  <Text style={styles.chartSubtitle}>
                    {'\n'}for {selectedJob.jobTitle || selectedJob.job_title || selectedJob.title}
                  </Text>
                )}
              </Text>
              <View style={styles.fillChanceContainer}>
                <Text style={styles.fillChanceValue}>{selectedJobFillChance}%</Text>
                <Text style={styles.fillChanceSubtext}>
                  {selectedJobApplicants} applicants vs {selectedJobVacancy} vacancy slots
                </Text>
                <Text style={styles.fillChanceDescription}>
                  Higher chance means more applicants per opening (capped at 100%).
                </Text>
              </View>
            </View>
          </View>

          {/* Applicants per Job Chart */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Applicants per job</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.barChartScrollContent}
            >
              {chartData.map((data, index) => (
                <AnimatedBar
                  key={index}
                  value={data.value}
                  maxValue={maxChartValue}
                  label={data.label}
                  experiencedCount={data.experiencedCount}
                  fresherCount={data.fresherCount}
                  experienced={data.experienced}
                  fresher={data.fresher}
                  experiencedPercentage={data.experiencedPercentage}
                  fresherPercentage={data.fresherPercentage}
                  chanceScore={data.chanceScore}
                  delay={index * 100}
                />
              ))}
            </ScrollView>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: "#4CAF50" }]} />
                <Text style={styles.legendText}>Experienced</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: "#9C27B0" }]} />
                <Text style={styles.legendText}>Fresher</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </Container>
    </>
  );
};

export default AnalyticsReportScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  containerIOS: {
    paddingTop: Platform.OS === "ios" ? 0 : 0,
  },
  containerAndroid: {
    paddingTop: Platform.OS === "android" ? 0 : 0,
  },
  scrollContent: {
    padding: WIDTH * 0.04,
    paddingBottom: HEIGHT * 0.05,
  },
  premiumBadgeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: HEIGHT * 0.01,
  },
  premiumBadge: {
    backgroundColor: "#E8EAF6",
    paddingHorizontal: WIDTH * 0.03,
    paddingVertical: HEIGHT * 0.005,
    borderRadius: 4,
  },
  premiumBadgeText: {
    fontSize: HEIGHT * 0.012,
    fontFamily: UBUNTUBOLD,
    color: "#5C6BC0",
    letterSpacing: 0.5,
  },
  analyticsLabel: {
    fontSize: HEIGHT * 0.016,
    fontFamily: FIRASANSSEMIBOLD,
    color: "#9C27B0",
  },
  mainTitle: {
    fontSize: HEIGHT * 0.028,
    fontFamily: UBUNTUBOLD,
    color: BLACK,
    marginBottom: HEIGHT * 0.01,
  },
  subtitle: {
    fontSize: HEIGHT * 0.016,
    color: "#666",
    marginBottom: HEIGHT * 0.02,
    lineHeight: HEIGHT * 0.024,
  },
  premiumStatusBox: {
    backgroundColor: "#F3E5F5",
    padding: WIDTH * 0.04,
    borderRadius: 12,
    marginBottom: HEIGHT * 0.025,
    borderWidth: 1,
    borderColor: "#E1BEE7",
  },
  premiumStatusTitle: {
    fontSize: HEIGHT * 0.018,
    fontFamily: FIRASANSSEMIBOLD,
    color: "#7B1FA2",
    marginBottom: HEIGHT * 0.005,
  },
  premiumStatusText: {
    fontSize: HEIGHT * 0.014,
    color: "#9C27B0",
    lineHeight: HEIGHT * 0.02,
  },
  metricsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: HEIGHT * 0.025,
    gap: WIDTH * 0.02,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#1E3A5F",
    padding: WIDTH * 0.03,
    borderRadius: 12,
    minHeight: HEIGHT * 0.12,
  },
  metricLabel: {
    fontSize: HEIGHT * 0.012,
    color: "#B0BEC5",
    marginBottom: HEIGHT * 0.008,
    fontFamily: FIRASANSSEMIBOLD,
  },
  metricValue: {
    fontSize: HEIGHT * 0.024,
    fontFamily: UBUNTUBOLD,
    color: WHITE,
    marginBottom: HEIGHT * 0.005,
  },
  metricSubtext: {
    fontSize: HEIGHT * 0.011,
    color: "#90A4AE",
  },
  jobSelectionSection: {
    marginBottom: HEIGHT * 0.025,
  },
  sectionTitle: {
    fontSize: HEIGHT * 0.018,
    fontFamily: FIRASANSSEMIBOLD,
    color: BLACK,
    marginBottom: HEIGHT * 0.015,
  },
  jobScrollContent: {
    paddingRight: WIDTH * 0.04,
  },
  jobChip: {
    backgroundColor: "#E5E7EB",
    paddingHorizontal: WIDTH * 0.04,
    paddingVertical: HEIGHT * 0.01,
    borderRadius: 20,
    marginRight: WIDTH * 0.02,
    minWidth: WIDTH * 0.25,
    alignItems: "center",
  },
  jobChipSelected: {
    backgroundColor: WHITE,
    borderWidth: 2,
    borderColor: "#9C27B0",
  },
  jobChipText: {
    fontSize: HEIGHT * 0.014,
    color: "#666",
    fontFamily: FIRASANSSEMIBOLD,
    marginBottom: HEIGHT * 0.003,
  },
  jobChipTextSelected: {
    color: "#9C27B0",
    fontFamily: FIRASANSSEMIBOLD,
  },
  jobChipApplicants: {
    fontSize: HEIGHT * 0.011,
    color: "#999",
  },
  chartsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: HEIGHT * 0.025,
    gap: WIDTH * 0.02,
  },
  chartCard: {
    flex: 1,
    backgroundColor: WHITE,
    borderRadius: 12,
    padding: WIDTH * 0.04,
    marginBottom: HEIGHT * 0.02,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartTitle: {
    fontSize: HEIGHT * 0.018,
    fontFamily: UBUNTUBOLD,
    color: BLACK,
    marginBottom: HEIGHT * 0.015,
  },
  chartSubtitle: {
    fontSize: HEIGHT * 0.012,
    fontFamily: FIRASANSSEMIBOLD,
    color: "#9C27B0",
  },
  selectedJobIndicator: {
    fontSize: HEIGHT * 0.014,
    fontFamily: FIRASANSSEMIBOLD,
    color: "#9C27B0",
  },
  chartContainer: {
    marginBottom: HEIGHT * 0.01,
  },
  chartPlaceholder: {
    minHeight: WIDTH * 0.25,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    marginBottom: HEIGHT * 0.01,
    padding: WIDTH * 0.03,
  },
  experienceDistributionContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: HEIGHT * 0.02,
  },
  totalApplicationsText: {
    fontSize: HEIGHT * 0.05,
    fontFamily: UBUNTUBOLD,
    color: BLACK,
    marginBottom: HEIGHT * 0.02,
  },
  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: WIDTH * 0.06,
  },
  dotItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: WIDTH * 0.02,
  },
  experienceDot: {
    width: WIDTH * 0.04,
    height: WIDTH * 0.04,
    borderRadius: WIDTH * 0.02,
  },
  dotCountText: {
    fontSize: HEIGHT * 0.018,
    fontFamily: FIRASANSSEMIBOLD,
    color: BLACK,
  },
  emptyChartText: {
    fontSize: HEIGHT * 0.014,
    color: "#999",
  },
  chartLegend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: WIDTH * 0.04,
    marginTop: HEIGHT * 0.01,
  },
  chartLegendVertical: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: HEIGHT * 0.01,
    marginTop: HEIGHT * 0.015,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: WIDTH * 0.015,
  },
  legendColor: {
    width: WIDTH * 0.03,
    height: WIDTH * 0.03,
    borderRadius: 2,
  },
  legendText: {
    fontSize: HEIGHT * 0.013,
    color: "#666",
  },
  fillChanceContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: HEIGHT * 0.02,
  },
  fillChanceValue: {
    fontSize: HEIGHT * 0.04,
    fontFamily: UBUNTUBOLD,
    color: BRANDCOLOR,
    marginBottom: HEIGHT * 0.01,
  },
  fillChanceSubtext: {
    fontSize: HEIGHT * 0.014,
    color: "#666",
    marginBottom: HEIGHT * 0.01,
    textAlign: "center",
  },
  fillChanceDescription: {
    fontSize: HEIGHT * 0.012,
    color: "#999",
    textAlign: "center",
    lineHeight: HEIGHT * 0.018,
  },
  barChartScrollContent: {
    paddingRight: WIDTH * 0.04,
    paddingBottom: HEIGHT * 0.01,
  },
  barContainer: {
    alignItems: "center",
    marginRight: WIDTH * 0.03,
    width: WIDTH * 0.15,
  },
  barWrapper: {
    width: "100%",
    alignItems: "center",
    marginBottom: HEIGHT * 0.01,
  },
  barChartContainer: {
    width: WIDTH * 0.12,
    height: WIDTH * 0.3,
    justifyContent: "flex-end",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  bar: {
    width: "80%",
    backgroundColor: "#6B7280",
    borderRadius: 4,
    minHeight: 2,
  },
  stackedBarContainer: {
    width: "80%",
    borderRadius: 4,
    overflow: "hidden",
    minHeight: 2,
  },
  stackedBar: {
    width: "100%",
    minHeight: 2,
  },
  barLabel: {
    fontSize: HEIGHT * 0.011,
    color: "#666",
    textAlign: "center",
    width: "100%",
  },
  tooltip: {
    position: "absolute",
    bottom: WIDTH * 0.35,
    backgroundColor: WHITE,
    padding: WIDTH * 0.02,
    borderRadius: 8,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    minWidth: WIDTH * 0.2,
    zIndex: 10,
  },
  tooltipTitle: {
    fontSize: HEIGHT * 0.014,
    fontFamily: FIRASANSSEMIBOLD,
    color: BLACK,
    marginBottom: HEIGHT * 0.005,
  },
  tooltipText: {
    fontSize: HEIGHT * 0.012,
    marginTop: HEIGHT * 0.003,
  },
});
