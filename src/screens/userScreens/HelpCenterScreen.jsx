import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  BackHandler,
  StatusBar,
  TouchableOpacity,
  LayoutAnimation,
  UIManager,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import { MyHeader } from "../../components/commonComponents/MyHeader";
import { BRANDCOLOR, WHITE, BLACK } from "../../constant/color";
import { WIDTH } from "../../constant/config";
import { UBUNTUBOLD, UBUNTU, FIRASANSBOLD, FIRASANS } from "../../constant/fontPath";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const DARK_GREEN = "#1A6B42";
const TEXT_MUTED = "#5F6B7A";
const CARD_BORDER = "#D8E8DF";
const PAGE_BG = "#F4FAF7";

const INTRO_CARDS = [
  {
    title: "Job Seekers",
    text: "Free registration, profile creation, resume upload, and direct applications to thousands of listed jobs.",
    icon: "account-outline",
    bg: "#E8F7EF",
  },
  {
    title: "Employers",
    text: "Post jobs, manage listings, contact candidates, and shortlist the best talent for your organization.",
    icon: "briefcase-outline",
    bg: "#E3F2FD",
  },
  {
    title: "Safe & Secure",
    text: "Uptula never charges job seekers. We verify recruiters and protect your data at every step.",
    icon: "shield-check-outline",
    bg: "#FFF8E1",
  },
];

const HELP_TOPICS = [
  {
    title: "Account & Profile",
    icon: "account-circle-outline",
    bg: "#E3F2FD",
    border: "#90CAF9",
    items: [
      "How do I create an Uptula account?",
      "How can I update my profile?",
      "How do I change my password?",
      "How can I upload or update my resume?",
      "How do I deactivate my account?",
    ],
  },
  {
    title: "Job Search & Applications",
    icon: "magnify",
    bg: "#E8F7EF",
    border: "#A5D6A7",
    items: [
      "How do I search for jobs?",
      "How can I apply for a job?",
      "How do I track my job applications?",
      "Why am I not receiving interview calls?",
      "How can I improve my profile visibility?",
    ],
  },
  {
    title: "Notifications & Alerts",
    icon: "bell-outline",
    bg: "#FFF8E1",
    border: "#FFE082",
    items: [
      "How do I receive job alerts?",
      "Why am I not getting email notifications?",
      "How do I manage notification settings?",
      "Can I receive alerts based on skills or location?",
    ],
  },
  {
    title: "Employer & Recruiter Support",
    icon: "briefcase-account-outline",
    bg: "#F3E5F5",
    border: "#CE93D8",
    items: [
      "How do employers post jobs?",
      "How can recruiters contact candidates?",
      "How do I manage job postings?",
      "How can employers shortlist applicants?",
    ],
  },
  {
    title: "Safety & Security",
    icon: "lock-outline",
    bg: "#FFEBEE",
    border: "#EF9A9A",
    items: [
      "How can I identify fake job offers?",
      "Does Uptula charge candidates for jobs?",
      "How do I report suspicious activity?",
      "How do I protect my account?",
    ],
  },
];

const FAQS = [
  {
    q: "Is registration on Uptula free?",
    a: "Yes. Registration is completely free for job seekers. You can create a profile, upload your resume, and apply to jobs without any registration fee.",
  },
  {
    q: "How do I apply for jobs?",
    a: "Search for jobs using keywords or filters, open a job listing, and tap Apply. You can apply using your Uptula profile resume or upload a new resume for each application.",
  },
  {
    q: "Can I upload my existing resume?",
    a: "Yes. Go to your profile or Create Resume section to upload a PDF/DOC resume or build one using our resume builder tool.",
  },
  {
    q: "How can I improve my chances of getting shortlisted?",
    a: "Keep your profile complete, add relevant skills, update your resume regularly, and apply to jobs that match your experience and qualifications.",
  },
  {
    q: "Why am I not getting interview calls?",
    a: "Ensure your profile is 100% complete, your resume is updated, and you are applying to relevant roles. Enable job alerts and check your notification settings.",
  },
  {
    q: "How do I reset my password?",
    a: "Go to Change Password from the menu, or use Forgot Password on the login screen. A reset link or OTP will be sent to your registered email.",
  },
  {
    q: "Can I hide my profile from recruiters?",
    a: "Profile visibility settings may be available in your account settings. Contact support if you need help making your profile private.",
  },
  {
    q: "How do I report fake recruiters or scam jobs?",
    a: "Use the Report option on the job listing or contact our support team with details. Never share OTP, bank details, or pay for job offers.",
  },
];

const SEEKER_TIPS = [
  { icon: "file-document-outline", title: "Keep Your Resume Updated", text: "Recruiters prefer recently updated profiles." },
  { icon: "star-four-points-outline", title: "Add Relevant Skills", text: "Use keywords related to your industry and job role." },
  { icon: "refresh", title: "Apply Regularly", text: "Applying consistently increases visibility." },
  { icon: "bell-ring-outline", title: "Enable Job Alerts", text: "Get notified instantly about new opportunities." },
];

const PROVIDER_TIPS = [
  { icon: "file-document-edit-outline", title: "Write Clear Job Posts", text: "Detailed job descriptions attract better candidates." },
  { icon: "filter-variant", title: "Use Advanced Filters", text: "Boolean search helps find the right talent faster." },
  { icon: "message-text-outline", title: "Respond Promptly", text: "Quick replies improve candidate engagement." },
  { icon: "chart-line", title: "Track Analytics", text: "Review hiring reports to optimize your recruitment." },
];

const SectionTitle = ({ title, icon }) => (
  <View style={styles.sectionTitleRow}>
    <MaterialCommunityIcons name={icon} size={22} color={DARK_GREEN} />
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

const TwoColumnGrid = ({ children, style }) => (
  <View style={[styles.twoColGrid, style]}>{children}</View>
);

const HelpCenterScreen = ({ userType = "seeker" }) => {
  const navigation = useNavigation();
  const isProvider = userType === "provider";
  const tips = isProvider ? PROVIDER_TIPS : SEEKER_TIPS;
  const tipsTitle = isProvider ? "Tips for Employers" : "Tips for Job Seekers";

  const [expandedFaq, setExpandedFaq] = useState(null);

  const goBack = useCallback(() => {
    navigation.goBack();
    return true;
  }, [navigation]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", goBack);
    return () => sub.remove();
  }, [goBack]);

  const toggleFaq = (index) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedFaq((prev) => (prev === index ? null : index));
  };

  const renderHeader = () => (
    <MyHeader
      showBack
      showCenterTitle
      title="Help Center"
      onBackPress={goBack}
      showNotification={false}
      backgroundColor={WHITE}
    />
  );

  return (
    <View style={styles.screenRoot}>
      <StatusBar backgroundColor={WHITE} barStyle="dark-content" translucent={false} />
      {Platform.OS === "ios" ? (
        <SafeAreaView style={styles.headerSection} edges={["top"]}>
          {renderHeader()}
        </SafeAreaView>
      ) : (
        <View style={styles.headerSection}>{renderHeader()}</View>
      )}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Intro cards — Job Seekers & Employers side by side */}
        <TwoColumnGrid style={styles.introGrid}>
          {INTRO_CARDS.slice(0, 2).map((card) => (
            <View key={card.title} style={[styles.introCard, { backgroundColor: card.bg }]}>
              <MaterialCommunityIcons name={card.icon} size={24} color={DARK_GREEN} />
              <Text style={styles.introCardTitle}>{card.title}</Text>
              <Text style={styles.introCardText}>{card.text}</Text>
            </View>
          ))}
        </TwoColumnGrid>
        <View style={[styles.introCard, styles.introCardFull, { backgroundColor: INTRO_CARDS[2].bg }]}>
          <MaterialCommunityIcons name={INTRO_CARDS[2].icon} size={24} color={DARK_GREEN} />
          <Text style={styles.introCardTitle}>{INTRO_CARDS[2].title}</Text>
          <Text style={styles.introCardText}>{INTRO_CARDS[2].text}</Text>
        </View>

        {/* Popular Help Topics — side by side */}
        <View style={styles.card}>
          <SectionTitle title="Popular Help Topics" icon="help-circle-outline" />
          <TwoColumnGrid>
            {HELP_TOPICS.map((topic) => (
              <View
                key={topic.title}
                style={[styles.topicCard, { backgroundColor: topic.bg, borderColor: topic.border }]}
              >
                <View style={styles.topicHeader}>
                  <MaterialCommunityIcons name={topic.icon} size={22} color={DARK_GREEN} />
                  <Text style={styles.topicTitle}>{topic.title}</Text>
                </View>
                {topic.items.map((item, i) => (
                  <View key={i} style={styles.topicBulletRow}>
                    <Text style={styles.topicBullet}>•</Text>
                    <Text style={styles.topicBulletText}>{item}</Text>
                  </View>
                ))}
              </View>
            ))}
          </TwoColumnGrid>
        </View>

        {/* Important notice */}
        <View style={styles.noticeBanner}>
          <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#F57F17" />
          <Text style={styles.noticeText}>
            <Text style={styles.noticeBold}>Important: </Text>
            Uptula never asks job seekers for payment in exchange for interviews or job offers.
            Please avoid sharing bank details, OTPs, or personal financial information with unknown
            recruiters.
          </Text>
        </View>

        {/* FAQs */}
        <View style={styles.card}>
          <SectionTitle title="Frequently Asked Questions" icon="frequently-asked-questions" />
          {FAQS.map((faq, index) => {
            const open = expandedFaq === index;
            return (
              <TouchableOpacity
                key={faq.q}
                style={[styles.faqItem, open && styles.faqItemOpen]}
                onPress={() => toggleFaq(index)}
                activeOpacity={0.85}
              >
                <View style={styles.faqHeader}>
                  <View style={styles.faqNumber}>
                    <Text style={styles.faqNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.faqQuestion}>{faq.q}</Text>
                  <MaterialCommunityIcons
                    name={open ? "chevron-up" : "chevron-down"}
                    size={22}
                    color={DARK_GREEN}
                  />
                </View>
                {open && <Text style={styles.faqAnswer}>{faq.a}</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tips */}
        <View style={styles.card}>
          <SectionTitle title={tipsTitle} icon="lightbulb-on-outline" />
          <View style={styles.twoColGrid}>
            {tips.map((tip) => (
              <View key={tip.title} style={styles.tipCard}>
                <MaterialCommunityIcons name={tip.icon} size={28} color={BRANDCOLOR} />
                <Text style={styles.tipTitle}>{tip.title}</Text>
                <Text style={styles.tipText}>{tip.text}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default HelpCenterScreen;

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    backgroundColor: PAGE_BG,
  },
  headerSection: {
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: CARD_BORDER,
  },
  scrollView: {
    flex: 1,
    backgroundColor: PAGE_BG,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    paddingTop: 12,
  },
  twoColGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  introGrid: {
    marginBottom: 10,
  },
  introCard: {
    width: "48%",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    minHeight: 130,
  },
  introCardFull: {
    width: "100%",
    minHeight: 0,
    marginBottom: 14,
  },
  introCardTitle: {
    fontSize: WIDTH * 0.036,
    fontFamily: FIRASANSBOLD,
    color: DARK_GREEN,
    marginTop: 8,
    marginBottom: 6,
  },
  introCardText: {
    fontSize: WIDTH * 0.03,
    fontFamily: UBUNTU,
    color: TEXT_MUTED,
    lineHeight: WIDTH * 0.044,
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
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 8,
  },
  sectionTitle: {
    flex: 1,
    fontSize: WIDTH * 0.042,
    fontFamily: FIRASANSBOLD,
    color: DARK_GREEN,
  },
  topicCard: {
    width: "48%",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  topicHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    gap: 6,
  },
  topicTitle: {
    flex: 1,
    fontSize: WIDTH * 0.032,
    fontFamily: FIRASANSBOLD,
    color: DARK_GREEN,
  },
  topicBulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
    paddingLeft: 4,
  },
  topicBullet: {
    fontSize: WIDTH * 0.038,
    color: BRANDCOLOR,
    marginRight: 8,
    fontFamily: FIRASANSBOLD,
  },
  topicBulletText: {
    flex: 1,
    fontSize: WIDTH * 0.028,
    fontFamily: UBUNTU,
    color: BLACK,
    lineHeight: WIDTH * 0.04,
  },
  noticeBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFF9C4",
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#FFE082",
    gap: 10,
  },
  noticeText: {
    flex: 1,
    fontSize: WIDTH * 0.034,
    fontFamily: UBUNTU,
    color: "#5D4037",
    lineHeight: WIDTH * 0.05,
  },
  noticeBold: {
    fontFamily: UBUNTUBOLD,
  },
  faqItem: {
    borderWidth: 1,
    borderColor: CARD_BORDER,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    backgroundColor: PAGE_BG,
  },
  faqItemOpen: {
    backgroundColor: WHITE,
    borderColor: BRANDCOLOR,
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  faqNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: BRANDCOLOR,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  faqNumberText: {
    color: WHITE,
    fontFamily: FIRASANSBOLD,
    fontSize: 13,
  },
  faqQuestion: {
    flex: 1,
    fontSize: WIDTH * 0.036,
    fontFamily: FIRASANSBOLD,
    color: BLACK,
    paddingRight: 8,
  },
  faqAnswer: {
    marginTop: 12,
    marginLeft: 38,
    fontSize: WIDTH * 0.034,
    fontFamily: UBUNTU,
    color: TEXT_MUTED,
    lineHeight: WIDTH * 0.05,
  },
  tipCard: {
    width: "48%",
    backgroundColor: "#E8F7EF",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  tipTitle: {
    fontSize: WIDTH * 0.035,
    fontFamily: FIRASANSBOLD,
    color: DARK_GREEN,
    marginTop: 8,
    marginBottom: 6,
  },
  tipText: {
    fontSize: WIDTH * 0.032,
    fontFamily: UBUNTU,
    color: TEXT_MUTED,
    lineHeight: WIDTH * 0.046,
  },
});
