import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Platform,
  BackHandler,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Share,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { BLACK, BRANDCOLOR, WHITE } from "../../../constant/color";
import { HEIGHT, WIDTH } from "../../../constant/config";
import { UBUNTUBOLD, UBUNTU, FIRASANSSEMIBOLD, ROBOTOSEMIBOLD, CANTARELLBOLD, FIRASANSBOLD } from "../../../constant/fontPath";
import { MyHeader } from "../../../components/commonComponents/MyHeader";
import { ToastMessage } from "../../../components/commonComponents/ToastMessage";
import { BASE_URL } from "../../../constant/url";
import { GETNETWORK, POSTNETWORK } from "../../../utils/Network";
import { LOGO } from "../../../constant/imagePath";

const ReferralsScreen = () => {
  const navigation = useNavigation();
  const [referralLink, setReferralLink] = useState("");
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState({
    type: "",
    msg: "",
    visible: false,
  });

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

  // Fetch referral code from API
  const fetchReferralCode = useCallback(async () => {
    try {
      // console.log("🔄 ========== FETCHING REFERRAL CODE ==========");
      setLoading(true);
      const url = `${BASE_URL}employer/referral/code`;
      // console.log("📡 API URL:", url);
      
      const result = await GETNETWORK(url, true);
      // console.log("📥 API Response (raw):", result);
      // console.log("📥 API Response (stringified):", JSON.stringify(result, null, 2));

      if (result?.code || result?.referralCode || result?.referral_code) {
        const code = result.code || result.referralCode || result.referral_code;
        // console.log("✅ Referral code found:", code);
        const referralUrl = `https://uptula.com/register?ref=${code}`;
        // console.log("🔗 Full referral URL:", referralUrl);
        setReferralLink(referralUrl);
        // console.log("✅ Referral link set successfully!");
      } else if (result?.message) {
        // console.log("❌ API Error Message:", result.message);
        setToastMessage({
          type: "error",
          msg: result.message,
          visible: true,
        });
      } else {
        // console.log("❌ No code found in response. Response keys:", Object.keys(result || {}));
        setToastMessage({
          type: "error",
          msg: "Failed to fetch referral code",
          visible: true,
        });
      }
    } catch (error) {
      // console.log("❌ ========== ERROR FETCHING REFERRAL CODE ==========");
      // console.log("❌ Error Type:", error?.constructor?.name);
      // console.log("❌ Error Message:", error?.message);
      // console.log("❌ Error Stack:", error?.stack);
      // console.log("❌ Full Error Object:", JSON.stringify(error, null, 2));
      setToastMessage({
        type: "error",
        msg: "Failed to fetch referral code. Please try again.",
        visible: true,
      });
    } finally {
      setLoading(false);
      // console.log("🏁 Fetch referral code process completed");
    }
  }, []);

  // Fetch referral list from API
  const fetchReferralList = useCallback(async () => {
    try {
      // console.log("🔄 ========== FETCHING REFERRAL LIST ==========");
      const url = `${BASE_URL}employer/referral/list`;
      // console.log("📡 API URL:", url);
      
      const result = await GETNETWORK(url, true);
      // console.log("📥 Referral List Response (raw):", result);
      // console.log("📥 Referral List Response (stringified):", JSON.stringify(result, null, 2));

      if (result) {
        // Handle different response structures
        let referralData = [];
        if (Array.isArray(result)) {
          referralData = result;
        } else if (result.referrals && Array.isArray(result.referrals)) {
          referralData = result.referrals;
        } else if (result.data && Array.isArray(result.data)) {
          referralData = result.data;
        } else if (result.list && Array.isArray(result.list)) {
          referralData = result.list;
        }

        // console.log("✅ Referral list found:", referralData.length, "items");
        setReferrals(referralData);
        
        if (referralData.length === 0) {
          // console.log("ℹ️ No referrals found in response");
        }
      } else {
        // console.log("❌ No data in response");
        setReferrals([]);
      }
    } catch (error) {
      // console.log("❌ ========== ERROR FETCHING REFERRAL LIST ==========");
      // console.log("❌ Error Type:", error?.constructor?.name);
      // console.log("❌ Error Message:", error?.message);
      // console.log("❌ Error Stack:", error?.stack);
      // console.log("❌ Full Error Object:", JSON.stringify(error, null, 2));
      setReferrals([]);
    }
  }, []);

  // Fetch referral code and list when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchReferralCode();
      fetchReferralList();
    }, [fetchReferralCode, fetchReferralList])
  );

  // Share referral link
  const shareReferralLink = async () => {
    // console.log("📤 ========== SHARE REFERRAL LINK STARTED ==========");
    // console.log("📤 Current referralLink state:", referralLink);
    // console.log("📤 referralLink type:", typeof referralLink);
    // console.log("📤 referralLink length:", referralLink?.length);
    // console.log("📤 referralLink is empty?", !referralLink);

    if (!referralLink) {
      // console.log("❌ Referral link is empty or not available");
      // console.log("❌ Cannot proceed with share operation");
      setToastMessage({
        type: "error",
        msg: "Referral link not available",
        visible: true,
      });
      return;
    }

    try {
      // console.log("📤 Attempting to share referral link...");
      // console.log("📤 Share content:", referralLink);
      
      const result = await Share.share({
        message: referralLink,
        title: "Referral Link",
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // console.log("✅ Shared with activity type:", result.activityType);
        } else {
          // console.log("✅ Shared successfully");
        }
        // console.log("✅ ========== SHARE SUCCESS ==========");
        // console.log("✅ Referral link shared:", referralLink);

        // Track the share event via API
        try {
          // console.log("📊 ========== TRACKING SHARE EVENT ==========");
          const trackUrl = `${BASE_URL}employer/referral/track`;
          // console.log("📡 Tracking API URL:", trackUrl);
          
          const trackPayload = {
            referralLink: referralLink,
            action: "share",
            timestamp: new Date().toISOString(),
          };
          // console.log("📦 Tracking payload:", JSON.stringify(trackPayload, null, 2));
          // console.log("📦 Using POSTNETWORK with token = false");

          const trackResult = await POSTNETWORK(trackUrl, trackPayload, false);
          // console.log("📥 ========== TRACKING API RESPONSE ==========");
          // console.log("📥 Tracking API Response (raw):", trackResult);
          // console.log("📥 Tracking API Response (stringified):", JSON.stringify(trackResult, null, 2));
          // console.log("📥 Response type:", typeof trackResult);
          // console.log("📥 Is Array:", Array.isArray(trackResult));
          // console.log("📥 Is Undefined:", trackResult === undefined);
          // console.log("📥 Is Null:", trackResult === null);

          // Check if POSTNETWORK returned undefined (which indicates an error was caught)
          if (trackResult === undefined) {
            // console.log("❌ ========== TRACKING ERROR ==========");
            // console.log("❌ POSTNETWORK returned undefined - this usually means an error occurred");
            // console.log("❌ Check Network.js catch block - error may have been swallowed");
            // console.log("❌ The API call likely failed silently");
            throw new Error("POSTNETWORK returned undefined - API call failed");
          }

          if (trackResult) {
            // Check for success indicators - including recorded: true, message with "validated", etc.
            const isSuccess = 
              trackResult.recorded === true ||
              trackResult.status === "success" || 
              trackResult.statusCode === 200 || 
              trackResult.message?.toLowerCase().includes("success") ||
              trackResult.message?.toLowerCase().includes("validated") ||
              trackResult.success === true;

            if (isSuccess) {
              // console.log("✅ ========== TRACKING SUCCESS ==========");
              // console.log("✅ Share event tracked successfully!");
              // console.log("✅ Response message:", trackResult.message || "No message");
              // console.log("✅ Referral code:", trackResult.referralCode || "N/A");
              // console.log("✅ Recorded:", trackResult.recorded ? "Yes" : "No");
              // if (trackResult.employer) {
              //   console.log("✅ Employer ID:", trackResult.employer.id || "N/A");
              //   console.log("✅ Employer Name:", trackResult.employer.name || "N/A");
              // }
              // console.log("✅ Response status:", trackResult.status || trackResult.statusCode || "N/A");
              // console.log("✅ Full success response:", JSON.stringify(trackResult, null, 2));
            } else if (trackResult.message || trackResult.error) {
              // console.log("⚠️ ========== TRACKING WARNING ==========");
              // console.log("⚠️ Tracking response received but may indicate an issue");
              // console.log("⚠️ Response message:", trackResult.message || trackResult.error);
              // console.log("⚠️ Full response:", JSON.stringify(trackResult, null, 2));
            } else {
              // console.log("✅ ========== TRACKING SUCCESS ==========");
              // console.log("✅ Share event tracked successfully (response received)");
              // console.log("✅ Response data:", JSON.stringify(trackResult, null, 2));
            }
          } else {
            // console.log("⚠️ ========== TRACKING WARNING ==========");
            // console.log("⚠️ Tracking response was empty or null");
            // console.log("⚠️ POSTNETWORK returned:", trackResult);
          }
        } catch (trackError) {
          // console.log("❌ ========== TRACKING ERROR ==========");
          // console.log("❌ POSTNETWORK failed to track share event");
          // console.log("❌ Error Type:", trackError?.constructor?.name);
          // console.log("❌ Error Message:", trackError?.message);
          // console.log("❌ Error Stack:", trackError?.stack);
          // console.log("❌ Full Error Object:", JSON.stringify(trackError, null, 2));
          // console.log("❌ Error occurred while tracking share event");
          // console.log("❌ URL that failed:", `${BASE_URL}employer/referral/track`);
          // console.log("❌ Payload that failed:", JSON.stringify({
          //   referralLink: referralLink,
          //   action: "share",
          //   timestamp: new Date().toISOString(),
          // }, null, 2));
          // Don't show error to user for tracking failure, just log it
        }

        setToastMessage({
          type: "success",
          msg: "Referral link shared successfully",
          visible: true,
        });
      } else if (result.action === Share.dismissedAction) {
        // console.log("⚠️ Share dismissed by user");
      }
    } catch (error) {
      // console.log("❌ ========== SHARE ERROR ==========");
      // console.log("❌ Error Type:", error?.constructor?.name);
      // console.log("❌ Error Message:", error?.message);
      // console.log("❌ Error Stack:", error?.stack);
      // console.log("❌ Full Error Object:", JSON.stringify(error, null, 2));
      
      setToastMessage({
        type: "error",
        msg: `Failed to share referral link: ${error?.message || "Unknown error"}`,
        visible: true,
      });
    }
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
          showBack
          showCenterTitle
          title="Referrals"
          onBackPress={handleBackPress}
        />

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            Platform.OS === "ios" && styles.scrollContentIOS,
            Platform.OS === "android" && styles.scrollContentAndroid
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Your Referral Link Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Your Referral Link</Text>
            
            <View style={styles.linkContainer}>
              <TextInput
                style={styles.linkInput}
                value={loading ? "Loading..." : referralLink}
                editable={false}
                selectTextOnFocus={true}
                placeholder="Loading referral link..."
                placeholderTextColor="#999"
              />
              <TouchableOpacity
                style={[styles.shareButton, loading && styles.shareButtonDisabled]}
                onPress={shareReferralLink}
                activeOpacity={0.7}
                disabled={loading || !referralLink}
              >
                <Text style={styles.shareButtonText}>Share</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.instructionText}>
              Share this link. When someone registers using it, you'll see them below.
            </Text>
          </View>

          {/* Your Referrals Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Your Referrals</Text>
            
            {referrals.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateText}>No referrals yet.</Text>
              </View>
            ) : (
              <FlatList
                data={referrals}
                keyExtractor={(item, index) => {
                  // Use unique ID if available, otherwise use index
                  return item?.id?.toString() || item?.referralId?.toString() || item?._id?.toString() || index.toString();
                }}
                renderItem={({ item }) => {
                  // Helper function to capitalize first letter
                  const capitalizeFirst = (str) => {
                    if (!str || typeof str !== "string") return str || "";
                    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
                  };

                  // Format date if available
                  const formatDate = (dateString) => {
                    if (!dateString) return "N/A";
                    try {
                      const date = new Date(dateString);
                      return date.toLocaleDateString();
                    } catch (e) {
                      return dateString;
                    }
                  };

                  // Get data with fallbacks for different API response formats
                  const status = item.status || item.referralStatus || item.referral_status || "active";
                  const name = item.name || item.fullName || item.full_name || item.userName || item.username || item.user?.name || "N/A";
                  const email = item.email || item.userEmail || item.user_email || item.emailAddress || item.email_address || item.user?.email || "N/A";
                  const date = formatDate(item.date || item.createdAt || item.created_at || item.joinedAt || item.joined_at || item.registeredAt || item.registered_at);
                  const code = item.code || item.referralCode || item.referral_code || item.referralCode || "N/A";

                  return (
                    <View style={styles.referralItem}>
                      <View style={styles.referralHeader}>
                        <Text style={styles.referralName}>{name}</Text>
                        <View style={[
                          styles.statusBadge,
                          status.toLowerCase() === "active" ? styles.statusActive : styles.statusInactive
                        ]}>
                          <Text style={styles.statusText}>{capitalizeFirst(status)}</Text>
                        </View>
                      </View>
                      <Text style={styles.referralEmail}>{email}</Text>
                      <View style={styles.referralFooter}>
                        <Text style={styles.referralDate}>{date}</Text>
                        <Text style={styles.referralCode}>Code: {code}</Text>
                      </View>
                    </View>
                  );
                }}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </ScrollView>

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
    </>
  );
};

export default ReferralsScreen;

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
  card: {
    backgroundColor: WHITE,
    borderRadius: WIDTH * 0.03,
    padding: WIDTH * 0.05,
    marginBottom: HEIGHT * 0.02,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: HEIGHT * 0.002,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: HEIGHT * 0.02,
    fontFamily: UBUNTUBOLD,
    color: "#2C3E50",
    marginBottom: HEIGHT * 0.02,
  },
  linkContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: HEIGHT * 0.015,
  },
  linkInput: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: WIDTH * 0.02,
    paddingHorizontal: WIDTH * 0.03,
    paddingVertical: HEIGHT * 0.015,
    fontSize: HEIGHT * 0.018,
    color: BLACK,
    marginRight: WIDTH * 0.02,
  },
  shareButton: {
    backgroundColor: BRANDCOLOR,
    paddingHorizontal: WIDTH * 0.05,
    paddingVertical: HEIGHT * 0.015,
    borderRadius: WIDTH * 0.02,
    justifyContent: "center",
    alignItems: "center",
  },
  shareButtonText: {
    color: WHITE,
    fontSize: HEIGHT * 0.018,
    fontFamily: FIRASANSSEMIBOLD,
  },
  shareButtonDisabled: {
    backgroundColor: "#CCCCCC",
    opacity: 0.6,
  },
  instructionText: {
    fontSize: HEIGHT * 0.016,
    color: "#7A7A7A",
    lineHeight: HEIGHT * 0.022,
  },
  emptyStateContainer: {
    paddingVertical: HEIGHT * 0.05,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: HEIGHT * 0.018,
    color: "#7A7A7A",
  },
  referralItem: {
    backgroundColor: "#F8F9FA",
    borderRadius: WIDTH * 0.02,
    padding: WIDTH * 0.04,
    marginBottom: HEIGHT * 0.015,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  referralHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: HEIGHT * 0.01,
  },
  referralName: {
    fontSize: HEIGHT * 0.018,
    fontFamily: FIRASANSSEMIBOLD,
    color: BLACK,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: WIDTH * 0.03,
    paddingVertical: HEIGHT * 0.005,
    borderRadius: WIDTH * 0.03,
  },
  statusActive: {
    backgroundColor: "#D4EDDA",
  },
  statusInactive: {
    backgroundColor: "#F8D7DA",
  },
  statusText: {
    fontSize: HEIGHT * 0.016,
    fontFamily: FIRASANSSEMIBOLD,
    color: BLACK,
  },
  referralEmail: {
    fontSize: HEIGHT * 0.018,
    color: "#7A7A7A",
    marginBottom: HEIGHT * 0.01,
  },
  referralFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  referralDate: {
    fontSize: HEIGHT * 0.016,
    color: "#7A7A7A",
  },
  referralCode: {
    fontSize: HEIGHT * 0.016,
    color: BRANDCOLOR,
    fontFamily: FIRASANSSEMIBOLD,
  },
});

