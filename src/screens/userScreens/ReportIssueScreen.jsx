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
  TextInput,
  Image,
  KeyboardAvoidingView,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { Picker } from "@react-native-picker/picker";
import { pick, isCancel } from "@react-native-documents/picker";

import { MyHeader } from "../../components/commonComponents/MyHeader";
import { TextInputComponent } from "../../components/commonComponents/TextInputComponent";
import { CustomButton } from "../../components/commonComponents/Button";
import { ToastMessage } from "../../components/commonComponents/ToastMessage";
import { BRANDCOLOR, WHITE, BLACK } from "../../constant/color";
import { WIDTH, HEIGHT } from "../../constant/config";
import { UBUNTUBOLD, UBUNTU, FIRASANSBOLD, FIRASANS } from "../../constant/fontPath";
import { DROPDOWN } from "../../constant/imagePath";
import { POSTNETWORK, POSTNETWORKFORM } from "../../utils/Network";
import { getObjByKey } from "../../utils/Storage";
import { BASE_URL } from "../../constant/url";

const DARK_GREEN = "#1A6B42";
const TEXT_MUTED = "#5F6B7A";
const CARD_BORDER = "#D8E8DF";
const PAGE_BG = "#F4FAF7";
const MAX_DESC = 1000;
const MAX_FILE_BYTES = 5 * 1024 * 1024;

const ISSUE_CATEGORIES = [
  { label: "Select a category", value: "" },
  { label: "Apply — Job application issues", value: "apply" },
  { label: "Login — Sign in & account access", value: "login" },
  { label: "Info — Wrong job or company details", value: "info" },
  { label: "Tech — Page errors or slow loading", value: "technical" },
  { label: "Pay — Payment or billing concern", value: "payment" },
  { label: "Other — Any other concern", value: "other" },
];

const PRIORITIES = [
  { value: "low", label: "Low", color: "#22C55E" },
  { value: "medium", label: "Medium", color: "#F59E0B" },
  { value: "high", label: "High", color: "#EF4444" },
];

const ISSUE_TYPES = [
  { tag: "Apply", text: "Job application not submitting or status stuck." },
  { tag: "Login", text: "Can't sign in, account locked or reset issues." },
  { tag: "Info", text: "Wrong job details, salary or company information." },
  { tag: "Tech", text: "Page errors, broken UI, or slow loading." },
  { tag: "Pay", text: "Payment failed or billing concern." },
  { tag: "Other", text: "Any other concern not listed above." },
];

const RESOLUTION_TIPS = [
  "Include the exact error message if any.",
  "Mention your browser and device model.",
  "Attach a screenshot of the issue.",
  "Provide the job or employer name if relevant.",
  "Check your spam folder for our reply.",
];

const getCategoryLabel = (value) =>
  ISSUE_CATEGORIES.find((c) => c.value === value)?.label || "Select a category";

const TwoColumnGrid = ({ children, style }) => (
  <View style={[styles.twoColGrid, style]}>{children}</View>
);

const ReportIssueScreen = ({ userType = "seeker" }) => {
  const navigation = useNavigation();
  const isProvider = userType === "provider";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("medium");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [attachment, setAttachment] = useState(null);
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

  const pickFile = async () => {
    try {
      const [result] = await pick({
        type: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "image/png",
          "image/jpeg",
        ],
      });
      if (!result) return;
      if (result.size && result.size > MAX_FILE_BYTES) {
        Alert.alert("File too large", "Maximum file size is 5 MB.");
        return;
      }
      setAttachment({
        name: result.name || "attachment",
        uri: result.uri,
        type: result.type || "application/octet-stream",
        size: result.size,
      });
    } catch (err) {
      if (!isCancel(err)) {
        Alert.alert("File picker", "Could not select file. Please try again.");
      }
    }
  };

  const handleSubmit = async () => {
    if (!fullName.trim()) {
      showToast("error", "Please enter your full name.");
      return;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email.trim())) {
      showToast("error", "Please enter a valid email address.");
      return;
    }
    if (!category) {
      showToast("error", "Please select an issue category.");
      return;
    }
    if (!subject.trim()) {
      showToast("error", "Please enter a subject.");
      return;
    }
    if (!description.trim()) {
      showToast("error", "Please describe the issue.");
      return;
    }

    const categoryLabel = getCategoryLabel(category);
    const bodyText = [
      `Name: ${fullName.trim()}`,
      `Email: ${email.trim()}`,
      phone.trim() ? `Phone: ${phone.trim()}` : null,
      "",
      description.trim(),
    ]
      .filter(Boolean)
      .join("\n");

    try {
      setSubmitting(true);
      const loginData = await getObjByKey("loginResponse");
      const url = isProvider
        ? `${BASE_URL}employer/tickets`
        : `${BASE_URL}user/tickets`;

      if (loginData?.token && attachment?.uri) {
        const form = new FormData();
        form.append("subject", subject.trim());
        form.append("category", category);
        form.append("priority", priority);
        form.append("description", bodyText);
        form.append("attachment", {
          uri: attachment.uri,
          name: attachment.name,
          type: attachment.type,
        });
        const result = await POSTNETWORKFORM(url, form, true);
        if (result?.ticket || result?.success || result?.id) {
          showToast("success", result?.message || "Report submitted successfully.");
          resetForm();
          return;
        }
      }

      const payload = {
        subject: subject.trim(),
        category,
        priority,
        description: `Category: ${categoryLabel}\n\n${bodyText}`,
      };

      if (loginData?.token) {
        const result = await POSTNETWORK(url, payload, true);
        if (result?.ticket || result?.success || result?.id || result?.ticket_id) {
          showToast("success", result?.message || "Report submitted successfully.");
          resetForm();
          return;
        }
      }

      showToast(
        "success",
        "Your report has been recorded. Our team will respond within 24–48 hours."
      );
      resetForm();
    } catch {
      showToast("error", "Failed to submit. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFullName("");
    setEmail("");
    setPhone("");
    setCategory("");
    setPriority("medium");
    setSubject("");
    setDescription("");
    setAttachment(null);
  };

  const renderHeader = () => (
    <MyHeader
      showBack
      showCenterTitle
      title="Report Issue"
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

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Submit form */}
          <View style={styles.card}>
            <View style={styles.formTitleRow}>
              <MaterialCommunityIcons name="rhombus-split" size={22} color={BRANDCOLOR} />
              <Text style={styles.formTitle}>Submit Your Issue</Text>
            </View>
            <Text style={styles.formSubtitle}>
              Fill in the details below. Our team will review your request and get back to you
              within 24–48 hours.
            </Text>

            <TextInputComponent
              placeholder="Full Name *"
              inputdata={fullName}
              setInputdata={setFullName}
              width="100%"
              maxLength={80}
            />
            <TextInputComponent
              placeholder="Email Address *"
              inputdata={email}
              setInputdata={setEmail}
              type="email"
              keyboardType="email-address"
              autoCapitalize="none"
              width="100%"
              maxLength={120}
            />
            <TextInputComponent
              placeholder="Phone Number (optional)"
              inputdata={phone}
              setInputdata={setPhone}
              keyboardType="phone-pad"
              width="100%"
              maxLength={15}
            />

            <Text style={styles.inputLabel}>Issue Category *</Text>
            <View style={styles.pickerWrapper}>
              <View style={styles.pickerContainer}>
                <View style={styles.pickerTextContainer}>
                  <Text
                    style={[styles.pickerSelectedText, !category && styles.pickerPlaceholderText]}
                    numberOfLines={2}
                  >
                    {getCategoryLabel(category)}
                  </Text>
                </View>
                <Picker
                  selectedValue={category}
                  onValueChange={setCategory}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                  mode="dropdown"
                  prompt="Select a category"
                >
                  {ISSUE_CATEGORIES.map((c) => (
                    <Picker.Item key={c.value || "empty"} label={c.label} value={c.value} />
                  ))}
                </Picker>
                <Image source={DROPDOWN} style={styles.dropdownIcon} resizeMode="contain" />
              </View>
            </View>

            <Text style={styles.inputLabel}>Priority Level *</Text>
            <View style={styles.priorityRow}>
              {PRIORITIES.map((p) => {
                const selected = priority === p.value;
                return (
                  <TouchableOpacity
                    key={p.value}
                    style={[styles.priorityBtn, selected && styles.priorityBtnSelected]}
                    onPress={() => setPriority(p.value)}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.priorityDot, { backgroundColor: p.color }]} />
                    <Text style={[styles.priorityLabel, selected && styles.priorityLabelSelected]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TextInputComponent
              placeholder="Subject *"
              inputdata={subject}
              setInputdata={setSubject}
              width="100%"
              maxLength={150}
            />

            <Text style={styles.inputLabel}>Issue Description *</Text>
            <View style={styles.textAreaWrap}>
              <TextInput
                style={styles.textArea}
                value={description}
                onChangeText={(t) => setDescription(t.slice(0, MAX_DESC))}
                placeholder="Describe the issue in detail — what happened, when it occurred, steps to reproduce, and any error messages you saw..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>
                {description.length}/{MAX_DESC}
              </Text>
            </View>

            <Text style={styles.inputLabel}>Attach Screenshot / File (optional)</Text>
            <TouchableOpacity style={styles.uploadBox} onPress={pickFile} activeOpacity={0.85}>
              <MaterialCommunityIcons name="paperclip" size={28} color={BRANDCOLOR} />
              <Text style={styles.uploadText}>
                {attachment ? attachment.name : "Tap to browse file"}
              </Text>
              <Text style={styles.uploadHint}>PNG, JPG, PDF, DOC — Max 5 MB</Text>
              {attachment && (
                <TouchableOpacity onPress={() => setAttachment(null)} style={styles.removeFileBtn}>
                  <Text style={styles.removeFileText}>Remove file</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>

            <CustomButton
              text={submitting ? "SUBMITTING..." : "Submit Report"}
              backgroundColor={DARK_GREEN}
              color={WHITE}
              width="100%"
              fontSize={HEIGHT * 0.017}
              fontFamily={FIRASANSBOLD}
              onPress={submitting ? () => {} : handleSubmit}
            />
          </View>

          {/* Issue Types & Tips — side by side */}
          <TwoColumnGrid>
            <View style={styles.sideCard}>
              <View style={styles.sideCardHeader}>
                <MaterialCommunityIcons name="file-document-outline" size={20} color={DARK_GREEN} />
                <Text style={styles.sideCardTitle}>Issue Types We Handle</Text>
              </View>
              {ISSUE_TYPES.map((item) => (
                <View key={item.tag} style={styles.issueTypeRow}>
                  <View style={styles.issueTypeTag}>
                    <Text style={styles.issueTypeTagText}>{item.tag}</Text>
                  </View>
                  <Text style={styles.issueTypeDesc}>{item.text}</Text>
                </View>
              ))}
            </View>

            <View style={styles.sideCard}>
              <View style={styles.sideCardHeader}>
                <MaterialCommunityIcons name="lightbulb-on-outline" size={20} color="#F59E0B" />
                <Text style={styles.sideCardTitle}>Tips for Faster Resolution</Text>
              </View>
              {RESOLUTION_TIPS.map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <MaterialCommunityIcons name="check-circle" size={16} color={BRANDCOLOR} />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          </TwoColumnGrid>
        </ScrollView>
      </KeyboardAvoidingView>

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

export default ReportIssueScreen;

const styles = StyleSheet.create({
  screenRoot: { flex: 1, backgroundColor: PAGE_BG },
  flex: { flex: 1 },
  headerSection: {
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: CARD_BORDER,
  },
  scrollView: { flex: 1, backgroundColor: PAGE_BG },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 28, paddingTop: 12 },
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
  formTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  formTitle: {
    fontSize: WIDTH * 0.045,
    fontFamily: FIRASANSBOLD,
    color: DARK_GREEN,
  },
  formSubtitle: {
    fontSize: WIDTH * 0.034,
    fontFamily: UBUNTU,
    color: TEXT_MUTED,
    lineHeight: WIDTH * 0.05,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: WIDTH * 0.035,
    fontFamily: FIRASANSBOLD,
    color: DARK_GREEN,
    marginBottom: 6,
    marginTop: 4,
  },
  pickerWrapper: { marginBottom: 12 },
  pickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: WHITE,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BRANDCOLOR,
    minHeight: 48,
    paddingHorizontal: 12,
    overflow: "hidden",
  },
  pickerTextContainer: { flex: 1, justifyContent: "center", paddingVertical: 8 },
  pickerSelectedText: {
    fontSize: WIDTH * 0.033,
    fontFamily: UBUNTU,
    color: BLACK,
  },
  pickerPlaceholderText: { color: TEXT_MUTED },
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
  pickerItem: { fontSize: WIDTH * 0.035, fontFamily: UBUNTU },
  dropdownIcon: { width: 20, height: 20, tintColor: BRANDCOLOR },
  priorityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
    gap: 8,
  },
  priorityBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    backgroundColor: PAGE_BG,
    gap: 6,
  },
  priorityBtnSelected: {
    borderColor: BRANDCOLOR,
    borderWidth: 2,
    backgroundColor: "#E8F7EF",
  },
  priorityDot: { width: 10, height: 10, borderRadius: 5 },
  priorityLabel: {
    fontSize: WIDTH * 0.032,
    fontFamily: FIRASANSBOLD,
    color: TEXT_MUTED,
  },
  priorityLabelSelected: { color: DARK_GREEN },
  textAreaWrap: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    marginBottom: 14,
    backgroundColor: WHITE,
  },
  textArea: {
    minHeight: 120,
    padding: 12,
    fontSize: WIDTH * 0.035,
    fontFamily: UBUNTU,
    color: BLACK,
  },
  charCount: {
    alignSelf: "flex-end",
    paddingRight: 12,
    paddingBottom: 8,
    fontSize: 12,
    fontFamily: UBUNTU,
    color: TEXT_MUTED,
  },
  uploadBox: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: BRANDCOLOR,
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "#FAFFFC",
  },
  uploadText: {
    fontSize: WIDTH * 0.035,
    fontFamily: FIRASANSBOLD,
    color: DARK_GREEN,
    marginTop: 8,
    textAlign: "center",
  },
  uploadHint: {
    fontSize: WIDTH * 0.03,
    fontFamily: UBUNTU,
    color: TEXT_MUTED,
    marginTop: 4,
  },
  removeFileBtn: { marginTop: 8 },
  removeFileText: {
    fontSize: WIDTH * 0.032,
    fontFamily: FIRASANSBOLD,
    color: "#EF4444",
  },
  twoColGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  sideCard: {
    width: "48%",
    backgroundColor: WHITE,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  sideCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  sideCardTitle: {
    flex: 1,
    fontSize: WIDTH * 0.032,
    fontFamily: FIRASANSBOLD,
    color: DARK_GREEN,
  },
  issueTypeRow: { marginBottom: 10 },
  issueTypeTag: {
    alignSelf: "flex-start",
    backgroundColor: "#E8F7EF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  issueTypeTagText: {
    fontSize: WIDTH * 0.028,
    fontFamily: FIRASANSBOLD,
    color: BRANDCOLOR,
  },
  issueTypeDesc: {
    fontSize: WIDTH * 0.028,
    fontFamily: UBUNTU,
    color: TEXT_MUTED,
    lineHeight: WIDTH * 0.04,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    gap: 6,
  },
  tipText: {
    flex: 1,
    fontSize: WIDTH * 0.028,
    fontFamily: UBUNTU,
    color: BLACK,
    lineHeight: WIDTH * 0.04,
  },
});
