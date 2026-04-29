import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Platform,
  BackHandler,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { BLACK, BRANDCOLOR, WHITE } from "../../../constant/color";
import { HEIGHT, WIDTH } from "../../../constant/config";
import { UBUNTUBOLD, UBUNTU, FIRASANSSEMIBOLD, ROBOTOSEMIBOLD, CANTARELLBOLD, FIRASANSBOLD } from "../../../constant/fontPath";
import { MyHeader } from "../../../components/commonComponents/MyHeader";
import { BASE_URL } from "../../../constant/url";
import { GETNETWORK } from "../../../utils/Network";

const PremiumMembershipScreen = () => {
  const navigation = useNavigation();

  // Helper function to capitalize first letter
  const capitalizeFirst = (str) => {
    if (!str || typeof str !== "string") return str || "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  // State for Download Status
  const [downloadStatus, setDownloadStatus] = useState({
    remainingDownloads: 0,
    todayDownloads: 0,
    dailyLimit: 0,
    status: "",
  });
  const [loadingDownloadStatus, setLoadingDownloadStatus] = useState(false);

  // State for Current Membership
  const [currentMembership, setCurrentMembership] = useState({
    type: "",
    status: "",
    expires: "",
    price: "",
  });
  const [loadingMembership, setLoadingMembership] = useState(false);

  // State for Membership Plans
  const [membershipPlans, setMembershipPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);

  // State for Download History
  const [downloadHistory, setDownloadHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // State for Refresh Control
  const [refreshing, setRefreshing] = useState(false);

  // Fetch Download Status
  const fetchDownloadStatus = useCallback(async () => {
    try {
      setLoadingDownloadStatus(true);
      const url = `${BASE_URL}premium/download-status`;
      const result = await GETNETWORK(url, true);

      // // console.log("📥 Download Status Response:", JSON.stringify(result, null, 2));

      if (result) {
        setDownloadStatus({
          remainingDownloads: result.remainingDownloads || result.remaining_downloads || 0,
          todayDownloads: result.todayDownloads || result.today_downloads || 0,
          dailyLimit: result.dailyLimit || result.daily_limit || 0,
          status: capitalizeFirst(result.status || "active"),
        });
        // console.log("✅ Download Status fetched successfully!");
      } else {
        // console.log("❌ Failed to fetch download status: No data received");
      }
    } catch (error) {
      // console.log("❌ Error fetching download status:", error);
    } finally {
      setLoadingDownloadStatus(false);
    }
  }, []);

  // Fetch Current Membership
  const fetchCurrentMembership = useCallback(async () => {
    try {
      setLoadingMembership(true);
      const url = `${BASE_URL}premium/membership-plans`;
      const result = await GETNETWORK(url, true);

      // console.log("📥 Current Membership Response:", JSON.stringify(result, null, 2));

      if (result) {
        // If result is an array, get the first active one or first one
        let membershipData = null;
        if (Array.isArray(result)) {
          membershipData = result.find((plan) => plan.status === "active") || result[0] || {};
        } else if (result.currentMembership || result.current_membership) {
          membershipData = result.currentMembership || result.current_membership;
        } else {
          membershipData = result;
        }

        setCurrentMembership({
          type: capitalizeFirst(membershipData.type || membershipData.name || "Full Access"),
          status: capitalizeFirst(membershipData.status || "active"),
          expires: membershipData.expires || membershipData.expires_at || "Never",
          price: membershipData.price || membershipData.amount || "₹0",
        });
        // console.log("✅ Current Membership fetched successfully!");
      } else {
        // console.log("❌ Failed to fetch current membership: No data received");
      }
    } catch (error) {
      // console.log("❌ Error fetching current membership:", error);
    } finally {
      setLoadingMembership(false);
    }
  }, []);

  // Fetch Membership Plans
  const fetchMembershipPlans = useCallback(async () => {
    try {
      setLoadingPlans(true);
      const url = `${BASE_URL}premium/membership-plans`;
      const result = await GETNETWORK(url, true);

      // console.log("📥 Membership Plans Response:", JSON.stringify(result, null, 2));

      if (result) {
        if (Array.isArray(result)) {
          setMembershipPlans(result);
        } else if (result.plans && Array.isArray(result.plans)) {
          setMembershipPlans(result.plans);
        } else if (result.data && Array.isArray(result.data)) {
          setMembershipPlans(result.data);
        }
        // console.log("✅ Membership Plans fetched successfully!");
      } else {
        // console.log("❌ Failed to fetch membership plans: No data received");
      }
    } catch (error) {
      // console.log("❌ Error fetching membership plans:", error);
    } finally {
      setLoadingPlans(false);
    }
  }, []);

  // Fetch Download History
  const fetchDownloadHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const url = `${BASE_URL}premium/download-history`;
      const result = await GETNETWORK(url, true);

      // console.log("📥 Download History Response:", JSON.stringify(result, null, 2));

      if (result) {
        let historyData = [];
        if (Array.isArray(result)) {
          historyData = result;
        } else if (result.history && Array.isArray(result.history)) {
          historyData = result.history;
        } else if (result.data && Array.isArray(result.data)) {
          historyData = result.data;
        } else if (result.downloads && Array.isArray(result.downloads)) {
          historyData = result.downloads;
        }
        setDownloadHistory(historyData);
        // console.log("✅ Download History fetched successfully!");
      } else {
        // console.log("❌ Failed to fetch download history: No data received");
      }
    } catch (error) {
      // console.log("❌ Error fetching download history:", error);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    await Promise.all([
      fetchDownloadStatus(),
      fetchCurrentMembership(),
      fetchMembershipPlans(),
      fetchDownloadHistory(),
    ]);
  }, [fetchDownloadStatus, fetchCurrentMembership, fetchMembershipPlans, fetchDownloadHistory]);

  // Fetch all data when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchAllData();
    }, [fetchAllData])
  );

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  }, [fetchAllData]);

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
        <MyHeader
          showNotification={false}
          showBack
          showCenterTitle
          title="Premium Membership"
          onBackPress={handleBackPress}
        />

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            Platform.OS === "ios" && styles.scrollContentIOS,
            Platform.OS === "android" && styles.scrollContentAndroid
          ]}
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
          {/* Banner */}
          <View style={styles.banner}>
            <Text style={styles.bannerText}>
              All employer accounts currently have full premium access while we finish integrating the new billing experience.
            </Text>
          </View>

          {/* Download Status Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <Text style={styles.iconText}>📄</Text>
              </View>
              <Text style={styles.cardTitle}>Download Status</Text>
            </View>

            {loadingDownloadStatus ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={BRANDCOLOR} />
              </View>
            ) : (
              <>
                <View style={styles.metricRow}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricValueGreen}>
                      {downloadStatus.remainingDownloads}
                    </Text>
                    <Text style={styles.metricLabel}>Remaining Downloads</Text>
                  </View>
                  <View style={styles.statusBadgeContainer}>
                    <Text style={styles.starIcon}>⭐</Text>
                    <Text style={styles.statusBadgeText}>
                      {capitalizeFirst(downloadStatus.status || "Status")}
                    </Text>
                  </View>
                </View>

                <View style={styles.metricRow}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricValueBlue}>
                      {downloadStatus.todayDownloads}
                    </Text>
                    <Text style={styles.metricLabel}>Today's Downloads</Text>
                  </View>
                </View>

                <View style={styles.metricRow}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricValueGrey}>
                      {downloadStatus.dailyLimit}
                    </Text>
                    <Text style={styles.metricLabel}>Daily Limit</Text>
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Current Membership Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.starIconLarge}>⭐</Text>
              <Text style={styles.cardTitle}>Current Membership</Text>
            </View>

            {loadingMembership ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={BRANDCOLOR} />
              </View>
            ) : (
              <View style={styles.membershipInfo}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Type:</Text>
                  <Text style={styles.infoValue}>
                    {capitalizeFirst(currentMembership.type || "N/A")}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Status:</Text>
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>
                      {capitalizeFirst(currentMembership.status || "active")}
                    </Text>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Expires:</Text>
                  <Text style={styles.infoValue}>
                    {currentMembership.expires || "Never"}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Price:</Text>
                  <Text style={styles.infoValue}>
                    {currentMembership.price || "₹0"}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Billing temporarily disabled Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Billing temporarily disabled</Text>
            <Text style={styles.billingText}>
              Payment and plan selection are currently paused. Every employer receives enterprise-level access by default until the new payment flow is launched.
            </Text>
          </View>

          {/* Download History Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <Text style={styles.iconText}>📥</Text>
              </View>
              <Text style={styles.cardTitle}>Download History</Text>
            </View>

            {loadingHistory ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={BRANDCOLOR} />
              </View>
            ) : downloadHistory.length > 0 ? (
              <View style={styles.historyList}>
                {downloadHistory.map((item, index) => (
                  <View key={index} style={styles.historyItem}>
                    <Text style={styles.historyText}>
                      {capitalizeFirst(item.filename || item.file_name || item.name || `Download ${index + 1}`)}
                    </Text>
                    {item.downloaded_at && (
                      <Text style={styles.historyDate}>
                        {new Date(item.downloaded_at).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyHistoryContainer}>
                <Text style={styles.emptyHistoryText}>No downloads yet</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </Container>
    </>
  );
};

export default PremiumMembershipScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  containerIOS: {
    paddingTop: Platform.OS === "ios" ? 0 : 0,
  },
  containerAndroid: {
    paddingTop: Platform.OS === "android" ? 0 : 0,
  },
  scrollContent: {
    padding: WIDTH * 0.04,
    paddingBottom: HEIGHT * 0.037,
  },
  scrollContentIOS: {
    padding: Platform.OS === "ios" ? WIDTH * 0.042 : WIDTH * 0.04,
    paddingBottom: Platform.OS === "ios" ? HEIGHT * 0.04 : HEIGHT * 0.037,
  },
  scrollContentAndroid: {
    padding: Platform.OS === "android" ? WIDTH * 0.038 : WIDTH * 0.04,
    paddingBottom: Platform.OS === "android" ? HEIGHT * 0.035 : HEIGHT * 0.037,
  },
  banner: {
    backgroundColor: "#E3F2FD",
    borderRadius: WIDTH * 0.03,
    padding: WIDTH * 0.04,
    marginBottom: HEIGHT * 0.02,
  },
  bannerText: {
    fontSize: HEIGHT * 0.018,
    color: "#1976D2",
    lineHeight: HEIGHT * 0.025,
    textAlign: "center",
  },
  card: {
    backgroundColor: WHITE,
    borderRadius: WIDTH * 0.03,
    padding: WIDTH * 0.05,
    marginBottom: HEIGHT * 0.02,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: HEIGHT * 0.02,
  },
  iconContainer: {
    marginRight: WIDTH * 0.03,
  },
  iconText: {
    fontSize: WIDTH * 0.06,
  },
  starIcon: {
    fontSize: WIDTH * 0.05,
    marginRight: WIDTH * 0.02,
  },
  starIconLarge: {
    fontSize: WIDTH * 0.08,
    marginRight: WIDTH * 0.03,
  },
  cardTitle: {
    fontSize: HEIGHT * 0.02,
    fontFamily: UBUNTUBOLD,
    color: "#2C3E50",
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: HEIGHT * 0.02,
  },
  metricItem: {
    flex: 1,
  },
  metricValueGreen: {
    fontSize: HEIGHT * 0.024,
    fontFamily: UBUNTUBOLD,
    color: BRANDCOLOR,
    marginBottom: HEIGHT * 0.005,
  },
  metricValueBlue: {
    fontSize: HEIGHT * 0.024,
    fontFamily: UBUNTUBOLD,
    color: "#1976D2",
    marginBottom: HEIGHT * 0.005,
  },
  metricValueGrey: {
    fontSize: HEIGHT * 0.024,
    fontFamily: UBUNTUBOLD,
    color: "#666",
    marginBottom: HEIGHT * 0.005,
  },
  metricLabel: {
    fontSize: HEIGHT * 0.016,
    color: "#7A7A7A",
  },
  statusBadgeContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadgeText: {
    fontSize: HEIGHT * 0.016,
    color: "#7A7A7A",
    marginTop: HEIGHT * 0.005,
  },
  membershipInfo: {
    gap: HEIGHT * 0.015,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: HEIGHT * 0.01,
  },
  infoLabel: {
    fontSize: HEIGHT * 0.018,
    color: "#7A7A7A",
    marginRight: WIDTH * 0.02,
    minWidth: WIDTH * 0.2,
  },
  infoValue: {
    fontSize: HEIGHT * 0.018,
    fontFamily: FIRASANSSEMIBOLD,
    color: BLACK,
  },
  activeBadge: {
    backgroundColor: "#D4EDDA",
    paddingHorizontal: WIDTH * 0.03,
    paddingVertical: HEIGHT * 0.005,
    borderRadius: WIDTH * 0.03,
  },
  activeBadgeText: {
    fontSize: HEIGHT * 0.016,
    fontFamily: FIRASANSSEMIBOLD,
    color: "#155724",
    textTransform: "lowercase",
  },
  billingText: {
    fontSize: HEIGHT * 0.018,
    color: "#7A7A7A",
    lineHeight: HEIGHT * 0.025,
    marginTop: HEIGHT * 0.01,
  },
  emptyHistoryContainer: {
    paddingVertical: HEIGHT * 0.05,
    alignItems: "center",
  },
  emptyHistoryText: {
    fontSize: HEIGHT * 0.018,
    color: "#7A7A7A",
  },
  loadingContainer: {
    paddingVertical: HEIGHT * 0.03,
    alignItems: "center",
    justifyContent: "center",
  },
  historyList: {
    gap: HEIGHT * 0.01,
  },
  historyItem: {
    paddingVertical: HEIGHT * 0.01,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  historyText: {
    fontSize: HEIGHT * 0.016,
    color: BLACK,
    marginBottom: HEIGHT * 0.005,
  },
  historyDate: {
    fontSize: HEIGHT * 0.014,
    color: "#7A7A7A",
  },
});

