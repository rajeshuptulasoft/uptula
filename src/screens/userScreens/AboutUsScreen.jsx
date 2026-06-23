import React, { useEffect, useState, useCallback, useMemo } from "react";
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
import { useTranslation } from "../../hooks/useTranslation";

const LIGHT_GREEN = "#E8F7EF";
const DARK_GREEN = "#1A6B42";
const TEXT_MUTED = "#5F6B7A";
const CARD_BORDER = "#D8E8DF";

const SectionHeader = ({ icon, title }) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionIconWrap}>
      <MaterialCommunityIcons name={icon} size={22} color={DARK_GREEN} />
    </View>
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

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
  const { t, i18n } = useTranslation();

  const ISSUE_CATEGORIES = useMemo(
    () => [
      { label: t("aboutUs.selectCategory"), value: "" },
      { label: t("aboutUs.catTechnical"), value: "technical" },
      { label: t("aboutUs.catAccount"), value: "account" },
      { label: t("aboutUs.catJobPosting"), value: "job_posting" },
      { label: t("aboutUs.catPayment"), value: "payment" },
      { label: t("aboutUs.catFeedback"), value: "feedback" },
      { label: t("aboutUs.catOther"), value: "other" },
    ],
    [t]
  );

  const MISSION_ITEMS = useMemo(
    () => [
      t("aboutUs.mission1"),
      t("aboutUs.mission2"),
      t("aboutUs.mission3"),
      t("aboutUs.mission4"),
    ],
    [t]
  );

  const VISION_ITEMS = useMemo(
    () => [
      t("aboutUs.vision1"),
      t("aboutUs.vision2"),
      t("aboutUs.vision3"),
      t("aboutUs.vision4"),
    ],
    [t]
  );

  const JOB_SEEKER_OFFERS = useMemo(
    () => [
      t("aboutUs.seekerOffer1"),
      t("aboutUs.seekerOffer2"),
      t("aboutUs.seekerOffer3"),
      t("aboutUs.seekerOffer4"),
      t("aboutUs.seekerOffer5"),
    ],
    [t]
  );

  const EMPLOYER_OFFERS = useMemo(
    () => [
      t("aboutUs.employerOffer1"),
      t("aboutUs.employerOffer2"),
      t("aboutUs.employerOffer3"),
      t("aboutUs.employerOffer4"),
      t("aboutUs.employerOffer5"),
    ],
    [t]
  );

  const WHY_CHOOSE_ITEMS = useMemo(
    () => [
      t("aboutUs.why1"),
      t("aboutUs.why2"),
      t("aboutUs.why3"),
      t("aboutUs.why4"),
      t("aboutUs.why5"),
      t("aboutUs.why6"),
    ],
    [t]
  );

  const IMPACT_STATS = useMemo(
    () => [
      { value: "50K+", label: t("aboutUs.jobSeekers") },
      { value: "5K+", label: t("aboutUs.employers") },
      { value: "200+", label: t("aboutUs.industries") },
      { value: "98%", label: t("aboutUs.satisfactionRate") },
    ],
    [t]
  );

  const VALUES = useMemo(
    () => [
      {
        icon: "shield-check-outline",
        title: t("aboutUs.trustSafety"),
        text: t("aboutUs.trustSafetyDesc"),
      },
      {
        icon: "account-group-outline",
        title: t("aboutUs.inclusivity"),
        text: t("aboutUs.inclusivityDesc"),
      },
      {
        icon: "lightbulb-on-outline",
        title: t("aboutUs.innovation"),
        text: t("aboutUs.innovationDesc"),
      },
      {
        icon: "heart-outline",
        title: t("aboutUs.userFirst"),
        text: t("aboutUs.userFirstDesc"),
      },
    ],
    [t]
  );

  const getCategoryLabel = useCallback(
    (value) =>
      ISSUE_CATEGORIES.find((c) => c.value === value)?.label || t("aboutUs.selectCategory"),
    [ISSUE_CATEGORIES, t]
  );

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
      showToast("error", t("aboutUs.enterFullName"));
      return;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email.trim())) {
      showToast("error", t("aboutUs.enterValidEmail"));
      return;
    }
    if (!issueCategory) {
      showToast("error", t("aboutUs.selectIssueCategory"));
      return;
    }
    if (!issueDescription.trim()) {
      showToast("error", t("aboutUs.describeIssueRequired"));
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
          showToast("success", result?.message || t("aboutUs.reportSuccess"));
          setFullName("");
          setEmail("");
          setIssueCategory("");
          setIssueDescription("");
          return;
        }
      }

      showToast(
        "success",
        t("aboutUs.reportThankYou")
      );
      setFullName("");
      setEmail("");
      setIssueCategory("");
      setIssueDescription("");
    } catch {
      showToast("error", t("aboutUs.reportFailed"));
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
            title={t("aboutUs.title")}
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
            title={t("aboutUs.title")}
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
          <SectionHeader icon="information-outline" title={t("aboutUs.aboutUptula")} />
          <Text style={styles.bodyText}>
            {t("aboutUs.aboutIntro")}
          </Text>
          <View style={styles.highlightBox}>
            <Text style={styles.highlightText}>
              {t("aboutUs.highlight")}
            </Text>
          </View>
        </View>

        {/* Mission */}
        <View style={styles.card}>
          <SectionHeader icon="target" title={t("aboutUs.ourMission")} />
          <Text style={styles.bodyText}>
            {t("aboutUs.missionIntro")}
          </Text>
          <BulletList items={MISSION_ITEMS} />
        </View>

        {/* Vision */}
        <View style={styles.card}>
          <SectionHeader icon="eye-outline" title={t("aboutUs.ourVision")} />
          <Text style={styles.bodyText}>
            {t("aboutUs.visionIntro")}
          </Text>
          <Text style={styles.subHeading}>{t("aboutUs.lookingAhead")}</Text>
          <BulletList items={VISION_ITEMS} />
        </View>

        {/* What We Offer */}
        <View style={styles.card}>
          <SectionHeader icon="package-variant-closed" title={t("aboutUs.whatWeOffer")} />
          <Text style={styles.bodyText}>
            {t("aboutUs.offerIntro")}
          </Text>
          <Text style={styles.subHeading}>{t("aboutUs.forJobSeekers")}</Text>
          <BulletList items={JOB_SEEKER_OFFERS} />
          <Text style={[styles.subHeading, styles.subHeadingSpaced]}>{t("aboutUs.forEmployers")}</Text>
          <BulletList items={EMPLOYER_OFFERS} />
        </View>

        {/* Why Choose */}
        <View style={styles.card}>
          <SectionHeader icon="help-circle-outline" title={t("aboutUs.whyChoose")} />
          <View style={styles.highlightBox}>
            <Text style={styles.highlightText}>
              {t("aboutUs.whyHighlight")}
            </Text>
          </View>
          <BulletList items={WHY_CHOOSE_ITEMS} />
        </View>

        {/* Impact */}
        <View style={styles.card}>
          <SectionHeader icon="chart-bar" title={t("aboutUs.ourImpact")} />
          <Text style={styles.bodyText}>
            {t("aboutUs.impactIntro")}
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
          <SectionHeader icon="heart-outline" title={t("aboutUs.ourValues")} />
          <Text style={styles.bodyText}>{t("aboutUs.valuesIntro")}</Text>
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
          <SectionHeader icon="alert-circle-outline" title={t("aboutUs.reportIssue")} />
          <Text style={styles.bodyText}>
            {t("aboutUs.reportIntro")}
          </Text>

          <TextInputComponent
            placeholder={t("aboutUs.fullName")}
            inputdata={fullName}
            setInputdata={setFullName}
            width="100%"
            maxLength={80}
          />
          <TextInputComponent
            placeholder={t("aboutUs.emailAddress")}
            inputdata={email}
            setInputdata={setEmail}
            type="email"
            keyboardType="email-address"
            autoCapitalize="none"
            width="100%"
            maxLength={120}
          />

          <Text style={styles.inputLabel}>{t("aboutUs.issueCategory")}</Text>
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
                prompt={t("aboutUs.selectCategory")}
              >
                {ISSUE_CATEGORIES.map((c) => (
                  <Picker.Item key={c.value || "empty"} label={c.label} value={c.value} />
                ))}
              </Picker>
              <Image source={DROPDOWN} style={styles.dropdownIcon} resizeMode="contain" />
            </View>
          </View>

          <Text style={styles.inputLabel}>{t("aboutUs.describeIssue")}</Text>
          <TextInput
            style={styles.textArea}
            value={issueDescription}
            onChangeText={setIssueDescription}
            placeholder={t("aboutUs.describePlaceholder")}
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          <CustomButton
            text={submitting ? t("aboutUs.submitting") : t("aboutUs.submitReport")}
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
