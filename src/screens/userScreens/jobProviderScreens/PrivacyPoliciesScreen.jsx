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
import { CustomButton } from "../../../components/commonComponents/Button";
import { LOGO, BACK } from "../../../constant/imagePath";

const PrivacyPoliciesScreen = () => {
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

  const handleContactSupport = () => {
    // Handle contact support logic here
    // console.log("Contact Support pressed");
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
          <Text style={styles.headerTitle}>Privacy & Policies</Text>
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

          {/* Privacy and Policies Heading */}
          <Text style={styles.mainHeading}>Privacy and Policies</Text>

          {/* Introduction Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Introduction</Text>
            <Text style={styles.sectionText}>
              We value your privacy and are committed to safeguarding your personal information. This policy outlines how we collect, use, and protect your data.
            </Text>
          </View>

          {/* Information We Collect Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Information We Collect</Text>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <Text style={styles.bullet}>◆</Text>
                <Text style={styles.bulletText}>
                  Personal details such as name, email, phone number, and resume.
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <Text style={styles.bullet}>◆</Text>
                <Text style={styles.bulletText}>
                  Employment preferences and job applications.
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <Text style={styles.bullet}>◆</Text>
                <Text style={styles.bulletText}>
                  Usage data such as login history and browsing activity.
                </Text>
              </View>
            </View>
          </View>

          {/* How We Use Your Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How We Use Your Information</Text>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <Text style={styles.bullet}>◆</Text>
                <Text style={styles.bulletText}>
                  Match you with relevant job opportunities.
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <Text style={styles.bullet}>◆</Text>
                <Text style={styles.bulletText}>
                  Send updates, notifications, and career-related offers.
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <Text style={styles.bullet}>◆</Text>
                <Text style={styles.bulletText}>
                  Improve our services and user experience.
                </Text>
              </View>
            </View>
          </View>

          {/* Data Protection Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Protection</Text>
            <Text style={styles.sectionText}>
              We implement strict security measures, including encryption and secure servers, to protect your data from unauthorized access.
            </Text>
          </View>

          {/* Sharing of Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sharing of Information</Text>
            <Text style={styles.sectionText}>
              Your information is shared only with employers and recruiters for job-related purposes. We never sell your personal data to third parties.
            </Text>
          </View>

          {/* Changes to This Policy Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Changes to This Policy</Text>
            <Text style={styles.sectionText}>
              We may update this Privacy Policy periodically. Any changes will be posted here with the updated date.
            </Text>
          </View>

          {/* Contact Support Section */}
          <View style={styles.contactSection}>
            <Text style={styles.contactQuestion}>
              Questions about your privacy?
            </Text>
            <Text style={styles.contactText}>
              Contact our support team and we'll help you with any request.
            </Text>
          </View>

          {/* Contact Support Button */}
          <View style={styles.buttonWrapper}>
            <CustomButton
              text="Contact Support"
              backgroundColor={BRANDCOLOR}
              color={WHITE}
              width="100%"
              height={HEIGHT * 0.06}
              fontSize={HEIGHT * 0.018}
              onPress={handleContactSupport}
            />
          </View>
        </ScrollView>
      </Container>
    </>
  );
};

export default PrivacyPoliciesScreen;

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
  mainHeading: {
    fontSize: HEIGHT * 0.028,
    fontFamily: UBUNTUBOLD,
    color: "#2C3E50",
    textAlign: "center",
    marginBottom: HEIGHT * 0.03,
  },
  section: {
    marginBottom: HEIGHT * 0.03,
  },
  sectionTitle: {
    fontSize: HEIGHT * 0.02,
    fontFamily: UBUNTUBOLD,
    color: "#2C3E50",
    marginBottom: HEIGHT * 0.015,
  },
  sectionText: {
    fontSize: HEIGHT * 0.018,
    color: "#666",
    lineHeight: HEIGHT * 0.027,
  },
  bulletList: {
    gap: HEIGHT * 0.015,
  },
  bulletItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  bullet: {
    fontSize: HEIGHT * 0.02,
    color: BRANDCOLOR,
    marginRight: WIDTH * 0.03,
    marginTop: HEIGHT * 0.002,
  },
  bulletText: {
    fontSize: HEIGHT * 0.018,
    color: "#666",
    lineHeight: HEIGHT * 0.027,
    flex: 1,
  },
  contactSection: {
    backgroundColor: "#F8F9FA",
    borderRadius: WIDTH * 0.03,
    padding: WIDTH * 0.05,
    marginTop: HEIGHT * 0.025,
    marginBottom: HEIGHT * 0.025,
    alignItems: "center",
  },
  contactQuestion: {
    fontSize: HEIGHT * 0.02,
    fontFamily: FIRASANSSEMIBOLD,
    color: "#2C3E50",
    marginBottom: HEIGHT * 0.01,
    textAlign: "center",
  },
  contactText: {
    fontSize: HEIGHT * 0.018,
    color: "#666",
    lineHeight: HEIGHT * 0.024,
    textAlign: "center",
  },
  buttonWrapper: {
    alignItems: "center",
    marginTop: HEIGHT * 0.012,
    marginBottom: HEIGHT * 0.025,
  },
});

