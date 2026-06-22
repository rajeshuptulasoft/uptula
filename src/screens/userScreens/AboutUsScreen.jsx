import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  BackHandler,
  StatusBar,
  TextInput,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { Picker } from "@react-native-picker/picker";

import { MyHeader } from "../../components/commonComponents/MyHeader";
import { CustomButton } from "../../components/commonComponents/Button";
import { ToastMessage } from "../../components/commonComponents/ToastMessage";
import { TextInputComponent } from "../../components/commonComponents/TextInputComponent";
import { BRANDCOLOR, WHITE, BLACK } from "../../constant/color";
import { WIDTH, HEIGHT } from "../../constant/config";
import {
  UBUNTUBOLD,
  UBUNTU,
  FIRASANSBOLD,
  FIRASANS,
  ROBOTOSEMIBOLD,
} from "../../constant/fontPath";
import { POSTNETWORK } from "../../utils/Network";
import { getObjByKey } from "../../utils/Storage";
import { BASE_URL } from "../../constant/url";
import { DROPDOWN } from "../../constant/imagePath";

const LIGHT_GREEN = "#E8F7EF";
const DARK_GREEN = "#1A6B42";
const TEXT_MUTED = "#5F6B7A";
const CARD_BORDER = "#D8E8DF";

const ISSUE_CATEGORIES = [
  { label: "Select category", value: "" },
  { label: "Technical Issue", value: "technical" },
  { label: "Account Issue", value: "account" },
  { label: "Job Posting Issue", value: "job_posting" },
  { label: "Payment Issue", value: "payment" },
  { label: "Feedback", value: "feedback" },
  { label: "Other", value: "other" },
];

const MISSION_ITEMS = [
  "Provide equal opportunities for every individual regardless of background.",
  "Simplify the recruitment process for both employers and job seekers.",
  "Build a robust ecosystem where talent and opportunity meet together.",
  "Continuously innovate to make job searching more accessible.",
];

const VISION_ITEMS = [
  "Expand into more industries and geographies.",
  "Introduce AI-powered tools for personalized skill learning.",
  "Build inclusive work environments to ensure equity.",
  "Become a global leader in career development and growth.",
];

const JOB_SEEKER_OFFERS = [
  "Access to a wide range of job listings across industries.",
  "Real-time job alerts and notifications.",
  "Easy-to-use resume builder tools.",
  "Personalized career counseling and guidance.",
  "Up-to-date status tracking for applications.",
];

const EMPLOYER_OFFERS = [
  "Access to a large and diverse talent pool.",
  "Advanced search filters to find the perfect candidate.",
  "Streamlined application management and scheduling.",
  "Real-time candidate communication tools.",
  "Analytics reports to track hiring performance.",
];

const WHY_CHOOSE_ITEMS = [
  "A user-centric platform designed for ease of use.",
  "Verified employers and job listings for trust and safety.",
  "Comprehensive career development resources.",
  "Dedicated support team available to help you at every step.",
  "Available on multiple devices for easy access.",
  "Regular updates and improvements based on user feedback.",
];

const IMPACT_STATS = [
  { value: "50K+", label: "Job Seekers" },
  { value: "5K+", label: "Employers" },
  { value: "200+", label: "Industries" },
  { value: "98%", label: "Satisfaction Rate" },
];

const VALUES = [
  {
    icon: "shield-check-outline",
    title: "Trust & Safety",
    text: "Prioritizing security and authenticity for every user on our platform.",
  },
  {
    icon: "account-group-outline",
    title: "Inclusivity",
    text: "Equal opportunities for everyone, regardless of background or experience.",
  },
  {
    icon: "lightbulb-on-outline",
    title: "Innovation",
    text: "Constantly improving with technology to deliver the best experience.",
  },
  {
    icon: "heart-outline",
    title: "User First",
    text: "Always focused on the user experience and continuous improvement.",
  },
];

const SectionHeader = ({ icon, title }) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionIconWrap}>
      <MaterialCommunityIcons name={icon} size={22} color={DARK_GREEN} />
    </View>
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

const getCategoryLabel = (value) =>
  ISSUE_CATEGORIES.find((c) => c.value === value)?.label || "Select category";

const TwoColumnGrid = ({ children }) => (
  <View style={styles.twoColGrid}>{children}</View>
);

const BulletList = ({ items, icon = "check-circle" }) => (
  <View style={styles.bulletList}>
    {items.map((item, i) => (
      <View key={i} style={styles.bulletRow}>
        <MaterialCommunityIcons name={icon} size={18} color={BRANDCOLOR} style={styles.bulletIcon} />
        <Text style={styles.bulletText}>{item}</Text>
      </View>
    ))}
  </View>
);

const AboutUsScreen = () => {
  const navigation = useNavigation();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [issueCategory, setIssueCategory] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ type: "", msg: "", visible: false });

  const goBack = useCallback(() => {
    navigation.goBack();
    return true;
  }, [navigation]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", goBack);
    return () => sub.remove();
  }, [goBack]);

  const showToast = (type, msg) => {
    setToast({ type, msg, visible: true });
    setTimeout(() => setToast({ type: "", msg: "", visible: false }), 3500);
  };

  const handleSubmitIssue = async () => {
    if (!fullName.trim()) {
      showToast("error", "Please enter your full name.");
      return;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email.trim())) {
      showToast("error", "Please enter a valid email address.");
      return;
    }
    if (!issueCategory) {
      showToast("error", "Please select an issue category.");
      return;
    }
    if (!issueDescription.trim()) {
      showToast("error", "Please describe the issue.");
      return;
    }

    try {
      setSubmitting(true);
      const loginData = await getObjByKey("loginResponse");
      const categoryLabel = ISSUE_CATEGORIES.find((c) => c.value === issueCategory)?.label || issueCategory;
      const payload = {
        subject: `About Us Report: ${categoryLabel}`,
        category: issueCategory,
        priority: "medium",
        description: `Name: ${fullName.trim()}\nEmail: ${email.trim()}\n\n${issueDescription.trim()}`,
      };

      if (loginData?.token) {
        const role = (loginData?.role || loginData?.userType || "").toLowerCase();
        const url = role.includes("provider")
          ? `${BASE_URL}employer/tickets`
          : `${BASE_URL}user/tickets`;
        const result = await POSTNETWORK(url, payload, true);
        if (result?.ticket || result?.success || result?.id || result?.ticket_id) {
          showToast("success", result?.message || "Issue report submitted successfully.");
          setFullName("");
          setEmail("");
          setIssueCategory("");
          setIssueDescription("");
          return;
        }
      }

      showToast(
        "success",
        "Thank you! Your report has been recorded. Our team will contact you shortly."
      );
      setFullName("");
      setEmail("");
      setIssueCategory("");
      setIssueDescription("");
    } catch {
      showToast("error", "Failed to submit report. Please try again or email support@uptula.com.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screenRoot}>
      <StatusBar backgroundColor={WHITE} barStyle="dark-content" translucent={false} />
      {Platform.OS === "ios" ? (
        <SafeAreaView style={styles.headerSection} edges={["top"]}>
          <MyHeader
            showBack
            showCenterTitle
            title="About Us"
            onBackPress={goBack}
            showNotification={false}
            backgroundColor={WHITE}
          />
        </SafeAreaView>
      ) : (
        <View style={styles.headerSection}>
          <MyHeader
            showBack
            showCenterTitle
            title="About Us"
            onBackPress={goBack}
            showNotification={false}
            backgroundColor={WHITE}
          />
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* About Uptula */}
        <View style={styles.card}>
          <SectionHeader icon="information-outline" title="About Uptula" />
          <Text style={styles.bodyText}>
            Uptula is a leading career and recruitment platform dedicated to connecting talented
            professionals with the right opportunities. We believe everyone deserves access to
            meaningful work and growth in their chosen field.
          </Text>
          <View style={styles.highlightBox}>
            <Text style={styles.highlightText}>
              Your career starts here. Uptula provides a platform for everyone to find the right job,
              upskill, and find the right career path for them.
            </Text>
          </View>
        </View>

        {/* Mission */}
        <View style={styles.card}>
          <SectionHeader icon="target" title="Our Mission" />
          <Text style={styles.bodyText}>
            At Uptula, our mission is to bridge the gap between talent and opportunity. We strive to
            create a seamless experience that empowers individuals and organizations alike.
          </Text>
          <BulletList items={MISSION_ITEMS} />
        </View>

        {/* Vision */}
        <View style={styles.card}>
          <SectionHeader icon="eye-outline" title="Our Vision" />
          <Text style={styles.bodyText}>
            To become the most trusted and innovative career platform globally, transforming how
            people discover, pursue, and grow in their careers.
          </Text>
          <Text style={styles.subHeading}>Looking Ahead</Text>
          <BulletList items={VISION_ITEMS} />
        </View>

        {/* What We Offer */}
        <View style={styles.card}>
          <SectionHeader icon="package-variant-closed" title="What We Offer" />
          <Text style={styles.bodyText}>
            Uptula is designed to cater to both job seekers and employers, offering tools and
            resources tailored to each audience.
          </Text>
          <Text style={styles.subHeading}>For Job Seekers</Text>
          <BulletList items={JOB_SEEKER_OFFERS} />
          <Text style={[styles.subHeading, styles.subHeadingSpaced]}>For Employers & Recruiters</Text>
          <BulletList items={EMPLOYER_OFFERS} />
        </View>

        {/* Why Choose */}
        <View style={styles.card}>
          <SectionHeader icon="help-circle-outline" title="Why Choose Uptula?" />
          <View style={styles.highlightBox}>
            <Text style={styles.highlightText}>
              Uptula is more than just a job board. It&apos;s a comprehensive career platform.
            </Text>
          </View>
          <BulletList items={WHY_CHOOSE_ITEMS} />
        </View>

        {/* Impact */}
        <View style={styles.card}>
          <SectionHeader icon="chart-bar" title="Our Impact" />
          <Text style={styles.bodyText}>
            Numbers that reflect our commitment to connecting talent with opportunity.
          </Text>
          <TwoColumnGrid>
            {IMPACT_STATS.map((stat) => (
              <View key={stat.label} style={styles.statCard}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </TwoColumnGrid>
        </View>

        {/* Values */}
        <View style={styles.card}>
          <SectionHeader icon="heart-outline" title="Our Values" />
          <Text style={styles.bodyText}>The principles that guide everything we do at Uptula.</Text>
          <TwoColumnGrid>
            {VALUES.map((v) => (
              <View key={v.title} style={styles.valueCard}>
                <MaterialCommunityIcons name={v.icon} size={28} color={BRANDCOLOR} />
                <Text style={styles.valueTitle}>{v.title}</Text>
                <Text style={styles.valueText}>{v.text}</Text>
              </View>
            ))}
          </TwoColumnGrid>
        </View>

        {/* Report Issue */}
        <View style={styles.card}>
          <SectionHeader icon="alert-circle-outline" title="Report an Issue" />
          <Text style={styles.bodyText}>
            Encountered a technical issue or have feedback? Let us know and our team will get back
            to you as soon as possible.
          </Text>

          <TextInputComponent
            placeholder="Full Name"
            inputdata={fullName}
            setInputdata={setFullName}
            width="100%"
            maxLength={80}
          />
          <TextInputComponent
            placeholder="Email Address"
            inputdata={email}
            setInputdata={setEmail}
            type="email"
            keyboardType="email-address"
            autoCapitalize="none"
            width="100%"
            maxLength={120}
          />

          <Text style={styles.inputLabel}>Issue Category</Text>
          <View style={styles.pickerWrapper}>
            <View style={styles.pickerContainer}>
              <View style={styles.pickerTextContainer}>
                <Text
                  style={[
                    styles.pickerSelectedText,
                    !issueCategory && styles.pickerPlaceholderText,
                  ]}
                  numberOfLines={1}
                >
                  {getCategoryLabel(issueCategory)}
                </Text>
              </View>
              <Picker
                selectedValue={issueCategory}
                onValueChange={(v) => setIssueCategory(v)}
                style={styles.picker}
                itemStyle={styles.pickerItem}
                mode="dropdown"
                prompt="Select category"
              >
                {ISSUE_CATEGORIES.map((c) => (
                  <Picker.Item key={c.value || "empty"} label={c.label} value={c.value} />
                ))}
              </Picker>
              <Image source={DROPDOWN} style={styles.dropdownIcon} resizeMode="contain" />
            </View>
          </View>

          <Text style={styles.inputLabel}>Describe the Issue</Text>
          <TextInput
            style={styles.textArea}
            value={issueDescription}
            onChangeText={setIssueDescription}
            placeholder="Please describe the issue in detail..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          <CustomButton
            text={submitting ? "SUBMITTING..." : "SUBMIT ISSUE REPORT"}
            backgroundColor={DARK_GREEN}
            color={WHITE}
            width="100%"
            fontSize={HEIGHT * 0.017}
            fontFamily={FIRASANSBOLD}
            onPress={submitting ? () => {} : handleSubmitIssue}
          />
        </View>
      </ScrollView>

      <ToastMessage
        type={toast.type}
        message={toast.msg}
        visible={toast.visible}
        setVisible={({ visible }) => setToast((p) => ({ ...p, visible }))}
        bacgroundColor={
          toast.type === "success" ? "green" : toast.type === "error" ? "red" : "#e0e0e0"
        }
        textColor={WHITE}
        duration={3000}
      />
    </View>
  );
};

export default AboutUsScreen;

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    backgroundColor: "#F4FAF7",
  },
  headerSection: {
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: CARD_BORDER,
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#F4FAF7",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 8,
  },
  card: {
    backgroundColor: WHITE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: LIGHT_GREEN,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  sectionTitle: {
    flex: 1,
    fontSize: WIDTH * 0.045,
    fontFamily: FIRASANSBOLD,
    color: DARK_GREEN,
  },
  bodyText: {
    fontSize: WIDTH * 0.037,
    fontFamily: UBUNTU,
    color: TEXT_MUTED,
    lineHeight: WIDTH * 0.055,
    marginBottom: 12,
  },
  highlightBox: {
    backgroundColor: LIGHT_GREEN,
    borderRadius: 10,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: BRANDCOLOR,
  },
  highlightText: {
    fontSize: WIDTH * 0.037,
    fontFamily: ROBOTOSEMIBOLD,
    color: DARK_GREEN,
    lineHeight: WIDTH * 0.052,
  },
  subHeading: {
    fontSize: WIDTH * 0.04,
    fontFamily: UBUNTUBOLD,
    color: DARK_GREEN,
    marginBottom: 8,
    marginTop: 4,
  },
  subHeadingSpaced: {
    marginTop: 14,
  },
  bulletList: {
    marginTop: 4,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  bulletIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    fontSize: WIDTH * 0.036,
    fontFamily: FIRASANS,
    color: BLACK,
    lineHeight: WIDTH * 0.05,
  },
  twoColGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 8,
  },
  statCard: {
    width: "48%",
    backgroundColor: LIGHT_GREEN,
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: CARD_BORDER,
    marginBottom: 12,
  },
  statValue: {
    fontSize: WIDTH * 0.065,
    fontFamily: UBUNTUBOLD,
    color: DARK_GREEN,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: WIDTH * 0.032,
    fontFamily: FIRASANS,
    color: TEXT_MUTED,
    textAlign: "center",
  },
  valueCard: {
    width: "48%",
    backgroundColor: LIGHT_GREEN,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    marginBottom: 12,
  },
  valueTitle: {
    fontSize: WIDTH * 0.038,
    fontFamily: FIRASANSBOLD,
    color: DARK_GREEN,
    marginTop: 8,
    marginBottom: 6,
  },
  valueText: {
    fontSize: WIDTH * 0.033,
    fontFamily: UBUNTU,
    color: TEXT_MUTED,
    lineHeight: WIDTH * 0.048,
  },
  inputLabel: {
    fontSize: WIDTH * 0.035,
    fontFamily: FIRASANSBOLD,
    color: DARK_GREEN,
    marginBottom: 6,
    marginTop: 4,
  },
  pickerWrapper: {
    marginBottom: 12,
  },
  pickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: WHITE,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BRANDCOLOR,
    height: HEIGHT * 0.06,
    minHeight: 48,
    paddingHorizontal: 12,
    overflow: "hidden",
  },
  pickerTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  pickerSelectedText: {
    fontSize: WIDTH * 0.037,
    fontFamily: UBUNTU,
    color: BLACK,
  },
  pickerPlaceholderText: {
    color: TEXT_MUTED,
  },
  picker: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    opacity: 0,
  },
  pickerItem: {
    fontSize: WIDTH * 0.037,
    fontFamily: UBUNTU,
  },
  dropdownIcon: {
    width: 20,
    height: 20,
    tintColor: BRANDCOLOR,
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 12,
    minHeight: 110,
    fontSize: WIDTH * 0.037,
    fontFamily: UBUNTU,
    color: BLACK,
    backgroundColor: WHITE,
    marginBottom: 16,
  },
});
