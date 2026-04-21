import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Platform,
  BackHandler,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { BLACK, BRANDCOLOR, WHITE } from "../../../constant/color";
import { HEIGHT, WIDTH } from "../../../constant/config";
import { UBUNTUBOLD, UBUNTU, FIRASANSSEMIBOLD, ROBOTOSEMIBOLD, CANTARELLBOLD, FIRASANSBOLD } from "../../../constant/fontPath";
import { LOGO, BACK } from "../../../constant/imagePath";

const TermsConditionsScreen = () => {
  const navigation = useNavigation();

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
        {/* Custom Header with Close Icon */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleBackPress}
            style={styles.closeButton}
            activeOpacity={0.7}
          >
            <Image source={BACK} style={styles.closeIcon} resizeMode="contain" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Terms & Conditions</Text>
          <View style={styles.closeButton} />
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            Platform.OS === "ios" && styles.scrollContentIOS,
            Platform.OS === "android" && styles.scrollContentAndroid
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* LOGO at Center */}
          <View style={styles.logoContainer}>
            <Image source={LOGO} style={styles.logo} resizeMode="contain" />
          </View>

          {/* Service Agreement | Terms & Conditions */}
          <Text style={styles.serviceAgreementText}>
            Service Agreement | Terms & Conditions
          </Text>

          {/* Last Updated */}
          <Text style={styles.lastUpdatedText}>
            Last Updated: November 20, 2025
          </Text>

          {/* 1. Welcome & Acceptance Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>✨</Text>
              <Text style={styles.sectionTitle}>1. Welcome & Acceptance</Text>
            </View>
            <Text style={styles.sectionText}>
              By accessing or using our job portal service ("Service"), you agree to be bound by these Terms and Conditions. This is a legally binding agreement.
            </Text>
            <View style={styles.keyTakeawayBox}>
              <Text style={styles.keyTakeawayText}>
                <Text style={styles.keyTakeawayLabel}>Key Takeaway:</Text> Using the site means you agree to these rules.
              </Text>
            </View>
          </View>

          {/* 2. User Accounts & Security Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>👤</Text>
              <Text style={styles.sectionTitle}>2. User Accounts & Security</Text>
            </View>
            <Text style={styles.sectionText}>
              Users must be at least 18 years old. You are responsible for maintaining the confidentiality of your password and account.
            </Text>
            <View style={styles.subSection}>
              <Text style={styles.subSectionTitle}>Accuracy:</Text>
              <Text style={styles.subSectionText}>
                All registration information must be truthful and accurate.
              </Text>
            </View>
            <View style={styles.subSection}>
              <Text style={styles.subSectionTitle}>Activity:</Text>
              <Text style={styles.subSectionText}>
                You are fully responsible for all activities that occur under your account.
              </Text>
            </View>
          </View>

          {/* 3. Job Listing Rules Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>💼</Text>
              <Text style={styles.sectionTitle}>3. Job Listing Rules (For Employers)</Text>
            </View>
            <Text style={styles.sectionText}>
              Job postings must comply with all local, state, and federal laws and must be for genuine, current vacancies. Discrimination is strictly prohibited.
            </Text>
            <View style={styles.crucialBox}>
              <Text style={styles.crucialText}>
                <Text style={styles.crucialLabel}>Crucial:</Text> Misleading or fraudulent job postings will result in immediate account termination.
              </Text>
            </View>
          </View>

          {/* 4. Resume & Data Usage Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>🔒</Text>
              <Text style={styles.sectionTitle}>4. Resume & Data Usage</Text>
            </View>
            <Text style={styles.sectionText}>
              Any information you submit (resumes, cover letters) is governed by our Privacy Policy. You grant us a non-exclusive license to use this data to provide the job matching service.
            </Text>
          </View>

          {/* 5. Suspension & Termination Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>🛑</Text>
              <Text style={styles.sectionTitle}>5. Suspension & Termination</Text>
            </View>
            <Text style={styles.sectionText}>
              We reserve the right to suspend or terminate your account at our sole discretion if you breach these Terms, especially for abusive behavior or posting prohibited content.
            </Text>
          </View>

          {/* 6. Governing Law Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>⚖️</Text>
              <Text style={styles.sectionTitle}>6. Governing Law</Text>
            </View>
            <Text style={styles.sectionText}>
              These Terms are governed by the laws of your jurisdiction.
            </Text>
          </View>

          {/* Contact Section */}
          <View style={styles.contactSection}>
            <Text style={styles.contactText}>
              For any questions regarding these Terms, please contact us at{" "}
              <Text style={styles.contactEmail}>support@jobportal.com</Text>.
            </Text>
          </View>
        </ScrollView>
      </Container>
    </>
  );
};

export default TermsConditionsScreen;

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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: WIDTH * 0.04,
    paddingVertical: HEIGHT * 0.015,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + HEIGHT * 0.015 : HEIGHT * 0.015,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  closeButton: {
    width: WIDTH * 0.1,
    height: WIDTH * 0.1,
    justifyContent: "center",
    alignItems: "center",
  },
  closeIcon: {
    width: WIDTH * 0.06,
    height: WIDTH * 0.06,
    tintColor: BLACK,
  },
  headerTitle: {
    fontSize: HEIGHT * 0.02,
    fontFamily: UBUNTUBOLD,
    color: BLACK,
    flex: 1,
    textAlign: "center",
  },
  scrollContent: {
    padding: WIDTH * 0.05,
    paddingBottom: HEIGHT * 0.037,
  },
  scrollContentIOS: {
    padding: Platform.OS === "ios" ? WIDTH * 0.052 : WIDTH * 0.05,
    paddingBottom: Platform.OS === "ios" ? HEIGHT * 0.04 : HEIGHT * 0.037,
  },
  scrollContentAndroid: {
    padding: Platform.OS === "android" ? WIDTH * 0.048 : WIDTH * 0.05,
    paddingBottom: Platform.OS === "android" ? HEIGHT * 0.035 : HEIGHT * 0.037,
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: HEIGHT * 0.025,
  },
  logo: {
    width: WIDTH * 0.375,
    height: HEIGHT * 0.12,
  },
  serviceAgreementText: {
    fontSize: HEIGHT * 0.024,
    fontFamily: UBUNTUBOLD,
    color: "#2C3E50",
    textAlign: "center",
    marginBottom: HEIGHT * 0.01,
  },
  lastUpdatedText: {
    fontSize: HEIGHT * 0.018,
    color: "#666",
    textAlign: "center",
    marginBottom: HEIGHT * 0.03,
  },
  section: {
    marginBottom: HEIGHT * 0.03,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: HEIGHT * 0.015,
  },
  sectionIcon: {
    fontSize: HEIGHT * 0.03,
    marginRight: WIDTH * 0.03,
  },
  sectionTitle: {
    fontSize: HEIGHT * 0.02,
    fontFamily: UBUNTUBOLD,
    color: "#2C3E50",
    flex: 1,
  },
  sectionText: {
    fontSize: HEIGHT * 0.018,
    color: "#666",
    lineHeight: HEIGHT * 0.027,
    marginBottom: HEIGHT * 0.015,
  },
  keyTakeawayBox: {
    backgroundColor: "#FFF9E6",
    borderRadius: WIDTH * 0.02,
    padding: WIDTH * 0.03,
    borderLeftWidth: 4,
    borderLeftColor: "#FFC107",
    marginTop: HEIGHT * 0.01,
  },
  keyTakeawayText: {
    fontSize: HEIGHT * 0.016,
    color: "#666",
    lineHeight: HEIGHT * 0.024,
  },
  keyTakeawayLabel: {
    fontFamily: UBUNTUBOLD,
    color: "#2C3E50",
  },
  subSection: {
    marginTop: HEIGHT * 0.01,
    marginLeft: WIDTH * 0.02,
  },
  subSectionTitle: {
    fontSize: HEIGHT * 0.018,
    fontFamily: FIRASANSSEMIBOLD,
    color: "#2C3E50",
    marginBottom: HEIGHT * 0.005,
  },
  subSectionText: {
    fontSize: HEIGHT * 0.018,
    color: "#666",
    lineHeight: HEIGHT * 0.024,
  },
  crucialBox: {
    backgroundColor: "#FFEBEE",
    borderRadius: WIDTH * 0.02,
    padding: WIDTH * 0.03,
    borderLeftWidth: 4,
    borderLeftColor: "#F44336",
    marginTop: HEIGHT * 0.01,
  },
  crucialText: {
    fontSize: HEIGHT * 0.016,
    color: "#666",
    lineHeight: HEIGHT * 0.024,
  },
  crucialLabel: {
    fontFamily: UBUNTUBOLD,
    color: "#2C3E50",
  },
  contactSection: {
    backgroundColor: "#F8F9FA",
    borderRadius: WIDTH * 0.03,
    padding: WIDTH * 0.05,
    marginTop: HEIGHT * 0.025,
    marginBottom: HEIGHT * 0.025,
  },
  contactText: {
    fontSize: HEIGHT * 0.018,
    color: "#666",
    lineHeight: HEIGHT * 0.024,
    textAlign: "center",
  },
  contactEmail: {
    color: BRANDCOLOR,
    fontFamily: FIRASANSSEMIBOLD,
  },
});

