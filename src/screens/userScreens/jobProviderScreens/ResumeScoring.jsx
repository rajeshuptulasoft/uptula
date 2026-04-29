import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Platform,
  BackHandler,
  Image,
  SafeAreaView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import { BLACK, BRANDCOLOR, WHITE } from "../../../constant/color";
import { HEIGHT, WIDTH } from "../../../constant/config";
import { UBUNTUBOLD, UBUNTU, FIRASANSSEMIBOLD, ROBOTOSEMIBOLD, CANTARELLBOLD, FIRASANSBOLD } from "../../../constant/fontPath";
import { MyHeader } from "../../../components/commonComponents/MyHeader";
import { CustomButton } from "../../../components/commonComponents/Button";
import { DROPDOWN } from "../../../constant/imagePath";

const ResumeScoringScreen = () => {
  const navigation = useNavigation();
  const [selectedJob, setSelectedJob] = useState("");

  // Sample jobs data - replace with actual data
  const jobs = [
    { label: "Select Job", value: "" },
    { label: "www - www", value: "www-www" },
    { label: "Frontend Developer", value: "frontend-dev" },
    { label: "Backend Developer", value: "backend-dev" },
    { label: "UI/UX Designer", value: "ui-ux-designer" },
  ];

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

  const handleScoreResumes = () => {
    if (!selectedJob) {
      // Show alert or toast if no job is selected
      return;
    }
    // Handle score resumes logic here
    // console.log("Scoring resumes for job:", selectedJob);
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
          title="Resume Scoring"
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
          {/* Top Section: Usage Status and How It Works */}
          <View style={styles.topSection}>
            {/* Usage Status Card */}
            <View style={styles.statusCard}>
              <Text style={styles.cardTitle}>Usage Status</Text>
              <Text style={styles.planText}>Enterprise Access</Text>
              <View style={styles.statusRow}>
                <View style={styles.checkmarkContainer}>
                  <Text style={styles.checkmark}>✓</Text>
                </View>
                <Text style={styles.statusText}>
                  Unlimited Resume Scoring (billing paused)
                </Text>
              </View>
              <View style={styles.usageRow}>
                <View style={styles.usageItem}>
                  <Text style={styles.usageLabel}>Used Today</Text>
                  <Text style={styles.usageValue}>0</Text>
                </View>
                <View style={styles.usageItem}>
                  <Text style={styles.usageLabel}>Remaining</Text>
                  <Text style={styles.usageValue}>999</Text>
                </View>
              </View>
            </View>

            {/* How It Works Card */}
            <View style={styles.howItWorksCard}>
              <Text style={styles.cardTitle}>How It Works</Text>
              <Text style={styles.descriptionText}>
                Resume scoring automatically evaluates candidates based on:
              </Text>
              <View style={styles.criteriaList}>
                <View style={styles.criteriaItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.criteriaText}>Skills match (40 points)</Text>
                </View>
                <View style={styles.criteriaItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.criteriaText}>Experience (20 points)</Text>
                </View>
                <View style={styles.criteriaItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.criteriaText}>Education (20 points)</Text>
                </View>
                <View style={styles.criteriaItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.criteriaText}>Profile completeness (20 points)</Text>
                </View>
              </View>
              <Text style={styles.rankingNote}>
                Candidates are ranked by their total score (0-100).
              </Text>
            </View>
          </View>

          {/* Score Resumes Card */}
          <View style={styles.scoreCard}>
            <Text style={styles.cardTitle}>Score Resumes</Text>

            {/* Job Selection */}
            <Text style={styles.label}>Select Job *</Text>
            <View style={styles.pickerWrapper}>
              <View style={styles.pickerContainer}>
                <View style={styles.pickerTextContainer}>
                  <Text style={styles.pickerSelectedText} numberOfLines={1}>
                    {selectedJob === "" ? "Select Job" :
                      jobs.find(job => job.value === selectedJob)?.label || "Select Job"}
                  </Text>
                </View>
                <Picker
                  selectedValue={selectedJob}
                  onValueChange={setSelectedJob}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                >
                  {jobs.map((job, index) => (
                    <Picker.Item
                      key={index}
                      label={job.label}
                      value={job.value}
                    />
                  ))}
                </Picker>
                <Image source={DROPDOWN} style={styles.dropdownIcon} />
              </View>
            </View>

            <Text style={styles.instructionText}>
              Select a job to score all applications for that position.
            </Text>

            {/* Status Message */}
            <View style={styles.statusMessageBox}>
              <Text style={styles.statusMessageText}>
                No applications found for this job.
              </Text>
            </View>

            {/* Score Resumes Button */}
            <View style={styles.buttonWrapper}>
              <CustomButton
                text="Score Resumes"
                backgroundColor={BRANDCOLOR}
                color={WHITE}
                width="100%"
                height={HEIGHT * 0.06}
                fontSize={HEIGHT * 0.018}
                onPress={handleScoreResumes}
              />
            </View>
          </View>
        </ScrollView>
      </Container>
    </>
  );
};

export default ResumeScoringScreen;

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
  topSection: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: HEIGHT * 0.02,
    gap: WIDTH * 0.04,
  },
  statusCard: {
    flex: 1,
    minWidth: "48%",
    backgroundColor: WHITE,
    borderRadius: WIDTH * 0.03,
    padding: WIDTH * 0.04,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: HEIGHT * 0.002,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  howItWorksCard: {
    flex: 1,
    minWidth: "48%",
    backgroundColor: WHITE,
    borderRadius: WIDTH * 0.03,
    padding: WIDTH * 0.04,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: HEIGHT * 0.002,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  scoreCard: {
    backgroundColor: WHITE,
    borderRadius: WIDTH * 0.03,
    padding: WIDTH * 0.05,
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
  planText: {
    fontSize: HEIGHT * 0.018,
    fontFamily: FIRASANSSEMIBOLD,
    color: BLACK,
    marginBottom: HEIGHT * 0.015,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: HEIGHT * 0.02,
  },
  checkmarkContainer: {
    width: WIDTH * 0.05,
    height: WIDTH * 0.05,
    borderRadius: (WIDTH * 0.05) / 2,
    backgroundColor: BRANDCOLOR,
    justifyContent: "center",
    alignItems: "center",
    marginRight: WIDTH * 0.02,
  },
  checkmark: {
    color: WHITE,
    fontSize: HEIGHT * 0.018,
    fontFamily: UBUNTUBOLD,
  },
  statusText: {
    fontSize: HEIGHT * 0.016,
    color: "#7A7A7A",
    flex: 1,
  },
  usageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  usageItem: {
    flex: 1,
  },
  usageLabel: {
    fontSize: HEIGHT * 0.016,
    color: "#7A7A7A",
    marginBottom: HEIGHT * 0.005,
  },
  usageValue: {
    fontSize: HEIGHT * 0.024,
    fontFamily: UBUNTUBOLD,
    color: BRANDCOLOR,
  },
  descriptionText: {
    fontSize: HEIGHT * 0.016,
    color: "#7A7A7A",
    marginBottom: HEIGHT * 0.015,
    lineHeight: HEIGHT * 0.022,
  },
  criteriaList: {
    marginBottom: HEIGHT * 0.015,
  },
  criteriaItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: HEIGHT * 0.01,
  },
  bullet: {
    fontSize: HEIGHT * 0.02,
    color: BRANDCOLOR,
    marginRight: WIDTH * 0.02,
    marginTop: HEIGHT * 0.002,
  },
  criteriaText: {
    fontSize: HEIGHT * 0.016,
    color: BLACK,
    flex: 1,
    lineHeight: HEIGHT * 0.022,
  },
  rankingNote: {
    fontSize: HEIGHT * 0.016,
    color: "#7A7A7A",
    fontStyle: "italic",
    marginTop: HEIGHT * 0.01,
  },
  label: {
    fontSize: HEIGHT * 0.018,
    fontFamily: FIRASANSSEMIBOLD,
    color: BLACK,
    marginBottom: HEIGHT * 0.01,
    marginTop: HEIGHT * 0.005,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: BRANDCOLOR,
    borderRadius: WIDTH * 0.03,
    backgroundColor: WHITE,
    minHeight: HEIGHT * 0.06,
    marginBottom: HEIGHT * 0.015,
  },
  pickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: WIDTH * 0.03,
    paddingLeft: WIDTH * 0.01,
    position: "relative",
  },
  pickerTextContainer: {
    position: "absolute",
    left: WIDTH * 0.01,
    right: WIDTH * 0.1,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    zIndex: 1,
    paddingLeft: WIDTH * 0.02,
    pointerEvents: "none",
  },
  pickerSelectedText: {
    fontSize: HEIGHT * 0.018,
    color: BLACK,
    fontFamily: UBUNTU,
  },
  picker: {
    flex: 1,
    color: "transparent",
    fontSize: HEIGHT * 0.018,
    paddingVertical: HEIGHT * 0.012,
    paddingHorizontal: WIDTH * 0.03,
    height: HEIGHT * 0.06,
  },
  pickerItem: {
    color: BLACK,
    fontSize: HEIGHT * 0.018,
  },
  dropdownIcon: {
    width: WIDTH * 0.05,
    height: WIDTH * 0.05,
    resizeMode: "contain",
    marginLeft: WIDTH * 0.02,
  },
  instructionText: {
    fontSize: HEIGHT * 0.016,
    color: "#7A7A7A",
    marginBottom: HEIGHT * 0.02,
    lineHeight: HEIGHT * 0.022,
  },
  statusMessageBox: {
    backgroundColor: "#E3F2FD",
    borderRadius: WIDTH * 0.02,
    padding: WIDTH * 0.03,
    marginBottom: HEIGHT * 0.025,
  },
  statusMessageText: {
    fontSize: HEIGHT * 0.018,
    color: "#1976D2",
    textAlign: "center",
  },
  buttonWrapper: {
    alignItems: "center",
    marginTop: HEIGHT * 0.012,
  },
});

