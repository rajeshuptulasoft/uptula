import React, { useState, useRef, useEffect } from "react";
import {
    StyleSheet,
    View,
    Modal,
    ScrollView,
    Text,
    Pressable,
    Image,
    FlatList,
    Alert,
    Dimensions,
    BackHandler,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { check, request, PERMISSIONS, RESULTS } from "react-native-permissions";
import { getDocumentDirectory } from "react-native-audio-record";
import AudioRecord from "react-native-audio-record";
// import Sound from "react-native-sound";
import { MyHeader } from "../../../components/commonComponents/MyHeader";
import { TextInputComponent } from "../../../components/commonComponents/TextInputComponent";
import { CustomButton } from "../../../components/commonComponents/Button";
import { MyAlert } from "../../../components/commonComponents/MyAlert";
import { BRANDCOLOR, WHITE, BLACK } from "../../../constant/color";
import { 
    COMICS, 
    COMICSBOLD, 
    UBUNTUBOLD, 
    UBUNTU,
    FIRASANSBOLD,
    FIRASANS,
    FIRASANSSEMIBOLD,
} from "../../../constant/fontPath";

const { width, height } = Dimensions.get("window");

const MOCK_QUESTIONS = [
    { id: 1, question: "Describe a challenging MERN stack project you've worked on. What was the challenge, and how did you overcome it?" },
    { id: 2, question: "How do you handle state management in React? Compare Redux and Context API." },
    { id: 3, question: "Explain the differences between SQL and NoSQL databases. When would you use MongoDB?" },
    { id: 4, question: "What is middleware in Express.js and how do you use it?" },
    { id: 5, question: "How do you optimize React components for performance?" },
    { id: 6, question: "Explain async/await and how it differs from promises." },
    { id: 7, question: "What are React hooks and why are they important?" },
    { id: 8, question: "How do you handle authentication and authorization in a web application?" },
    { id: 9, question: "Describe RESTful APIs and their best practices." },
    { id: 10, question: "What is the Virtual DOM in React and why is it important?" },
    { id: 11, question: "How would you debug a performance issue in a React application?" },
    { id: 12, question: "Explain the concept of closures in JavaScript." },
    { id: 13, question: "What are microservices and what are their advantages?" },
    { id: 14, question: "How do you implement error handling in Node.js applications?" },
    { id: 15, question: "Explain the event loop in JavaScript." },
    { id: 16, question: "What is GraphQL and how does it differ from REST?" },
    { id: 17, question: "How do you ensure code quality and maintainability in a project?" },
    { id: 18, question: "Describe your experience with version control systems like Git." },
    { id: 19, question: "How do you approach testing in your applications?" },
    { id: 20, question: "What are your strengths and weaknesses as a developer?" },
];

export default MockInterviewScreen = () => {
    // Navigation
    const navigation = useNavigation();
    // const soundRef = useRef(null);
    
    // Load previous interviews from AsyncStorage
    const loadPreviousInterviews = async (setPreviousInterviews) => {
        try {
            const interviews = await AsyncStorage.getItem("previousMockInterviews");
            if (interviews) {
                setPreviousInterviews(JSON.parse(interviews));
            }
        } catch (error) {
            console.error("Error loading previous interviews:", error);
        }
    };

    // Save previous interviews to AsyncStorage
    const savePreviousInterviews = async (interviews) => {
        try {
            await AsyncStorage.setItem("previousMockInterviews", JSON.stringify(interviews));
        } catch (error) {
            console.error("Error saving previous interviews:", error);
        }
    };
    
    // State Management
    const [showModal, setShowModal] = useState(false);
    const [currentScreen, setCurrentScreen] = useState("home"); // home, setup, interview, results
    const [isRecording, setIsRecording] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    // Form inputs
    const [jobRole, setJobRole] = useState("");
    const [jobDescription, setJobDescription] = useState("");
    const [yearsOfExperience, setYearsOfExperience] = useState("");

    // Interview data
    const [interviewData, setInterviewData] = useState(null);
    const [recordedAnswers, setRecordedAnswers] = useState({});
    const [recordingPaths, setRecordingPaths] = useState({}); // Store recording file paths for each question
    const [previousInterviews, setPreviousInterviews] = useState([]);
    const [showCompletionAlert, setShowCompletionAlert] = useState(false);
    const [showUnansweredAlert, setShowUnansweredAlert] = useState(false);
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);
    
    // Permission alerts
    const [showCameraPermissionAlert, setShowCameraPermissionAlert] = useState(false);
    const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);
    const [pendingAction, setPendingAction] = useState(null); // 'startInterview' or 'enableWebcam'

    // Load previous interviews and setup audio on component mount
    useEffect(() => {
        loadPreviousInterviews(setPreviousInterviews);
        
        // Setup audio recording
        const options = {
            sampleRate: 16000,
            channels: 1,
            bitsPerSample: 16,
            audioSource: 6, // VOICE_RECOGNITION
        };
        AudioRecord.init(options);
        
        // Request microphone permission
        if (Platform.OS === 'ios') {
            request(PERMISSIONS.IOS.MICROPHONE).then((result) => {
                // console.log('iOS Microphone Permission:', result);
            });
        } else {
            request(PERMISSIONS.ANDROID.RECORD_AUDIO).then((result) => {
                // console.log('Android Microphone Permission:', result);
            });
        }
        
        return () => {
            // Cleanup on unmount
            // if (soundRef.current) {
            //     soundRef.current.release();
            // }
        };
    }, []);

    // Request camera and microphone permissions
    const requestCameraPermission = async () => {
        try {
            const cameraPermission = await request(
                Platform.OS === "ios" 
                    ? PERMISSIONS.IOS.CAMERA 
                    : PERMISSIONS.ANDROID.CAMERA
            );
            const audioPermission = await request(
                Platform.OS === "ios" 
                    ? PERMISSIONS.IOS.MICROPHONE 
                    : PERMISSIONS.ANDROID.RECORD_AUDIO
            );

            if (
                cameraPermission === RESULTS.GRANTED &&
                audioPermission === RESULTS.GRANTED
            ) {
                setCameraPermissionGranted(true);
                setShowCameraPermissionAlert(true);
                return true;
            } else {
                setCameraPermissionGranted(false);
                setShowCameraPermissionAlert(true);
                return false;
            }
        } catch (error) {
            console.error("Permission error:", error);
            setCameraPermissionGranted(false);
            setShowCameraPermissionAlert(true);
            return false;
        }
    };

    const handleEnableWebcam = async () => {
        setPendingAction("enableWebcam");
        await requestCameraPermission();
    };

    // Handle hardware back button
    useEffect(() => {
        const backAction = () => {
            if (currentScreen === "setup" || currentScreen === "interview") {
                navigation.goBack();
                return true;
            }
            return false;
        };

        const backHandler = BackHandler.addEventListener(
            "hardwareBackPress",
            backAction
        );

        return () => backHandler.remove();
    }, [currentScreen, navigation]);

    const handleOpenModal = () => {
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setJobRole("");
        setJobDescription("");
        setYearsOfExperience("");
    };

    const handleCreateInterview = () => {
        if (!jobRole.trim() || !jobDescription.trim() || !yearsOfExperience.trim()) {
            Alert.alert("Error", "Please fill all fields");
            return;
        }

        if (isNaN(yearsOfExperience) || parseInt(yearsOfExperience) < 0) {
            Alert.alert("Error", "Years of experience must be a valid number");
            return;
        }

        const newInterview = {
            id: Date.now(),
            jobRole,
            jobDescription,
            yearsOfExperience: parseInt(yearsOfExperience),
            createdAt: new Date().toLocaleString(),
        };
        setInterviewData(newInterview);
        setCurrentScreen("setup");
        setShowModal(false);
        setJobRole("");
        setJobDescription("");
        setYearsOfExperience("");
    };

    const handleStartInterview = () => {
        // console.log("🚀 INTERVIEW STARTED");
        // console.log("👔 Job Role:", jobRole);
        // console.log("💻 Tech Stack:", jobDescription);
        // console.log("📅 Years of Experience:", yearsOfExperience);
        // console.log("📊 Total Questions in Interview:", MOCK_QUESTIONS.length);
        setCurrentQuestionIndex(0);
        setRecordedAnswers({});
        setRecordingPaths({});
        setCurrentScreen("interview");
    };

    const handleStartRecording = async () => {
        try {
            // console.log("🎙️ RECORDING STARTED - Question Index:", currentQuestionIndex);
            // console.log("📝 Question:", MOCK_QUESTIONS[currentQuestionIndex].question);
            
            AudioRecord.start();
            setIsRecording(true);
        } catch (error) {
            console.error("Error starting recording:", error);
            Alert.alert("Error", "Failed to start recording. Make sure microphone permission is granted.");
        }
    };

    const handleStopRecording = async () => {
        try {
            const audioFilePath = await AudioRecord.stop();
            // console.log("⏹️ RECORDING STOPPED");
            // console.log("💾 Saved Recording Path:", audioFilePath);
            // console.log("✅ Answer Recorded for Question:", currentQuestionIndex + 1);
            
            setIsRecording(false);
            
            // Store the recording path for this question
            setRecordingPaths({
                ...recordingPaths,
                [currentQuestionIndex]: audioFilePath,
            });
            
            // Mark answer as recorded
            setRecordedAnswers({
                ...recordedAnswers,
                [currentQuestionIndex]: true,
            });
        } catch (error) {
            console.error("Error stopping recording:", error);
            Alert.alert("Error", "Failed to stop recording.");
        }
    };

    const handlePlayRecording = async () => {
        try {
            const audioPath = recordingPaths[currentQuestionIndex];
            
            // console.log("🔍 Checking Recording for Question:", currentQuestionIndex + 1);
            // console.log("🎵 Recording Path:", audioPath);
            
            if (!audioPath) {
                // console.log("❌ No Recording Found!");
                Alert.alert("No Recording", "No recording found for this question.");
                return;
            }

            // Release previous sound if any
            // if (soundRef.current) {
            //     soundRef.current.release();
            //     soundRef.current = null;
            // }

            // Sound playing disabled - react-native-sound removed
            Alert.alert("Feature Disabled", "Audio playback is temporarily disabled.");
            setIsPlayingAudio(false);
        } catch (error) {
            console.error("Error playing recording:", error);
            setIsPlayingAudio(false);
            Alert.alert("Error", "Failed to play recording.");
        }
    };

    const handleNextQuestion = () => {
        // console.log("➡️ Next Question Button Pressed");
        // console.log("Current Question Index:", currentQuestionIndex);
        console.log("Recording Status:", recordedAnswers[currentQuestionIndex] ? "✅ Recorded" : "⭕ Not Recorded");
        
        if (isPlayingAudio) {
            setIsPlayingAudio(false);
        }
        
        if (currentQuestionIndex < MOCK_QUESTIONS.length - 1) {
            console.log("Moving to Question:", currentQuestionIndex + 2);
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setIsRecording(false);
        } else {
            console.log("🏁 No more questions - showing unanswered alert");
            // Show unanswered questions before completing interview
            setShowUnansweredAlert(true);
        }
    };

    const handleFinishInterview = async () => {
        // Save interview to previous interviews - allow finishing even with no answers
        if (interviewData) {
            const answeredCount = Object.keys(recordedAnswers).length;
            console.log("🎉 INTERVIEW COMPLETED!");
            console.log("📊 Total Questions Answered:", answeredCount, "out of", MOCK_QUESTIONS.length);
            console.log("📝 Recorded Answers:", recordedAnswers);
            console.log("🎵 Recording Paths:", recordingPaths);
            
            const completedInterview = {
                ...interviewData,
                completedDate: new Date().toLocaleString(),
                score: Math.round((answeredCount / MOCK_QUESTIONS.length) * 100),
                recordedAnswers: recordedAnswers, // Store which questions were answered
                questionsAnswered: answeredCount,
                totalQuestions: MOCK_QUESTIONS.length,
            };
            const updatedInterviews = [completedInterview, ...previousInterviews];
            setPreviousInterviews(updatedInterviews);
            // Save to AsyncStorage
            await savePreviousInterviews(updatedInterviews);
        }
        setShowUnansweredAlert(false);
        // Show completion alert
        setShowCompletionAlert(true);
    };

    const renderHomeScreen = () => (
        <View style={styles.container}>
            <MyHeader
                // backgroundColor={BRANDCOLOR}
                showCenterTitle
                title="Mock Interview"
                showBack = {true}
                onBackPress={()=>{
                    navigation.goBack();
                }}
            />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.emptyState}>
                    <Text
                        allowFontScaling={false}
                        style={styles.emptyStateText}
                    >
                        No Interviews Yet
                    </Text>
                    <Text
                        allowFontScaling={false}
                        style={styles.emptyStateSubtext}
                    >
                        Create a new mock interview to get started
                    </Text>
                    <Pressable
                        style={styles.floatingButton}
                        onPress={handleOpenModal}
                    >
                        <Text
                            allowFontScaling={false}
                            style={styles.plusIcon}
                        >
                            +
                        </Text>
                    </Pressable>
                </View>

                {/* Previous Mock Interviews Section */}
                {previousInterviews.length > 0 && (
                    <View style={styles.previousInterviewsSection}>
                        <Text allowFontScaling={false} style={styles.previousInterviewsTitle}>
                            Previous Mock Interviews
                        </Text>
                        <FlatList
                            data={previousInterviews}
                            numColumns={2}
                            columnWrapperStyle={styles.cardRowWrapper}
                            scrollEnabled={false}
                            renderItem={({ item }) => {
                                const performanceColor = item.score >= 80 ? '#10B981' : item.score >= 50 ? '#F59E0B' : BRANDCOLOR;
                                const performanceBadge = item.score >= 80 ? '⭐ Excellent' : item.score >= 50 ? '🎯 Good' : '📝 Attempted';
                                
                                 return (
                                    <View style={styles.interviewCardContainer}>
                                        <View style={[styles.interviewCard, { borderLeftColor: performanceColor, borderLeftWidth: 5 }]}>
                                            {/* Card Top - Score Section */}
                                            <View style={styles.cardScoreSection}>
                                                <View style={[styles.scoreCircleSmall, { backgroundColor: performanceColor }]}>
                                                    <Text allowFontScaling={false} style={styles.scoreSmall}>
                                                        {item.score}%
                                                    </Text>
                                                </View>
                                                <View style={styles.performanceBadgeSmall}>
                                                    <Text allowFontScaling={false} style={[styles.performanceBadgeText, { color: performanceColor }]}>
                                                        {performanceBadge}
                                                    </Text>
                                                </View>
                                            </View>

                                            {/* Job Role */}
                                            <View style={styles.cardTitleSection}>
                                                <Text allowFontScaling={false} style={styles.cardIcon}>
                                                    💼
                                                </Text>
                                                <Text allowFontScaling={false} style={styles.cardJobRole}>
                                                    {item.jobRole}
                                                </Text>
                                            </View>

                                            {/* Progress Bar */}
                                            <View style={styles.progressBarContainer}>
                                                <View style={[styles.progressBar, { width: `${item.score}%`, backgroundColor: performanceColor }]} />
                                            </View>

                                            {/* Details */}
                                            <View style={styles.cardDetailsSection}>
                                                <View style={styles.detailItem}>
                                                    <Text allowFontScaling={false} style={styles.detailIcon}>⏰</Text>
                                                    <Text allowFontScaling={false} style={styles.detailText}>
                                                        {item.yearsOfExperience}y exp
                                                    </Text>
                                                </View>
                                                <View style={styles.detailItem}>
                                                    <Text allowFontScaling={false} style={styles.detailIcon}>✓</Text>
                                                    <Text allowFontScaling={false} style={styles.detailText}>
                                                        {item.questionsAnswered}/{item.totalQuestions}
                                                    </Text>
                                                </View>
                                            </View>

                                            {/* Date */}
                                            <Text allowFontScaling={false} style={styles.cardDate}>
                                                📅 {item.createdAt}
                                            </Text>

                                            {/* Action Buttons */}
                                            <View style={styles.cardButtons}>
                                                <CustomButton
                                                    text="Feedback"
                                                    width="48%"
                                                    height={38}
                                                    backgroundColor="#F3F4F6"
                                                    color={BRANDCOLOR}
                                                    fontSize={12}
                                                    onPress={() => Alert.alert("Feedback", "Feedback feature coming soon")}
                                                />
                                                <CustomButton
                                                    text="Retake"
                                                    width="48%"
                                                    height={38}
                                                    backgroundColor={BRANDCOLOR}
                                                    color={WHITE}
                                                    fontSize={12}
                                                    onPress={() => {
                                                        setInterviewData(item);
                                                        setCurrentScreen("setup");
                                                    }}
                                                />
                                            </View>
                                        </View>
                                    </View>
                                );
                            }}
                            keyExtractor={(item) => item.id.toString()}
                        />
                    </View>
                )}
            </ScrollView>

            {/* Create Interview Modal */}
            <Modal
                visible={showModal}
                transparent
                animationType="slide"
                statusBarTranslucent={true}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text
                                allowFontScaling={false}
                                style={styles.modalTitle}
                            >
                                Create New Mock Interview
                            </Text>
                            <Pressable onPress={handleCloseModal}>
                                <Text
                                    allowFontScaling={false}
                                    style={styles.closeButton}
                                >
                                    ✕
                                </Text>
                            </Pressable>
                        </View>

                        <ScrollView
                            contentContainerStyle={styles.modalScrollContent}
                            scrollEnabled={true}
                            keyboardShouldPersistTaps="handled"
                        >
                            <View style={styles.inputGroup}>
                                <Text
                                    allowFontScaling={false}
                                    style={styles.inputLabel}
                                >
                                    Job Role / Position
                                </Text>
                                <TextInputComponent
                                    placeholder="e.g., Full Stack Developer"
                                    inputdata={jobRole}
                                    setInputdata={setJobRole}
                                    borderColor={BRANDCOLOR}
                                    width="100%"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text
                                    allowFontScaling={false}
                                    style={styles.inputLabel}
                                >
                                    Job Description / Tech Stack
                                </Text>
                                <TextInputComponent
                                    placeholder="e.g., React, Node.js, MongoDB, Express"
                                    inputdata={jobDescription}
                                    setInputdata={setJobDescription}
                                    borderColor={BRANDCOLOR}
                                    width="100%"
                                    maxLength={200}
                                />
                                <Text
                                    allowFontScaling={false}
                                    style={styles.helperText}
                                >
                                    Separate technologies with commas
                                </Text>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text
                                    allowFontScaling={false}
                                    style={styles.inputLabel}
                                >
                                    Years of Experience
                                </Text>
                                <TextInputComponent
                                    placeholder="e.g., 2"
                                    inputdata={yearsOfExperience}
                                    setInputdata={setYearsOfExperience}
                                    borderColor={BRANDCOLOR}
                                    keyboardType="numeric"
                                    width="100%"
                                    maxLength={2}
                                />
                            </View>

                            <View style={styles.infoBox}>
                                <Text
                                    allowFontScaling={false}
                                    style={styles.infoTitle}
                                >
                                    ℹ Information
                                </Text>
                                <Text
                                    allowFontScaling={false}
                                    style={styles.infoText}
                                >
                                    Enable your video & microphone, webcam recommended.
                                </Text>
                            </View>
                        </ScrollView>

                        <View style={styles.modalButtons}>
                            <CustomButton
                                text="Cancel"
                                width="45%"
                                backgroundColor="#E8E8E8"
                                color={BLACK}
                                onPress={handleCloseModal}
                            />
                            <CustomButton
                                text="Create"
                                width="45%"
                                backgroundColor={BRANDCOLOR}
                                color={WHITE}
                                onPress={handleCreateInterview}
                            />
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );

    const renderSetupScreen = () => {
        const handleSetupBackPress = () => {
            setCurrentScreen("home");
            setInterviewData(null);
            navigation.goBack();
        };

        return (
        <View style={styles.container}>
            <MyHeader
                // backgroundColor={BRANDCOLOR}
                showBack
                showCenterTitle
                title="Interview Setup"
                onBackPress={handleSetupBackPress}
            />
            <ScrollView contentContainerStyle={styles.setupContent}>
                {/* Interview Details Card */}
                <View style={styles.detailsCard}>
                    <View style={styles.detailRow}>
                        <Text
                            allowFontScaling={false}
                            style={styles.detailLabel}
                        >
                            Job Role/Position:
                        </Text>
                        <Text
                            allowFontScaling={false}
                            style={styles.detailValue}
                        >
                            {interviewData?.jobRole}
                        </Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text
                            allowFontScaling={false}
                            style={styles.detailLabel}
                        >
                            Job Description/Tech Stack:
                        </Text>
                        <Text
                            allowFontScaling={false}
                            style={styles.detailValue}
                        >
                            {interviewData?.jobDescription}
                        </Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text
                            allowFontScaling={false}
                            style={styles.detailLabel}
                        >
                            Years of Experience:
                        </Text>
                        <Text
                            allowFontScaling={false}
                            style={styles.detailValue}
                        >
                            {interviewData?.yearsOfExperience}
                        </Text>
                    </View>
                </View>

                {/* Let's Get Started Section */}
                <View style={styles.getStartedSection}>
                    <Text
                        allowFontScaling={false}
                        style={styles.getStartedTitle}
                    >
                        Let's Get Started
                    </Text>

                    {/* Camera Icon Placeholder */}
                    <View style={styles.cameraPlaceholder}>
                        <View style={styles.cameraBorder}>
                            <Text
                                allowFontScaling={false}
                                style={styles.cameraIcon}
                            >
                                📷
                            </Text>
                        </View>
                    </View>

                    {/* Info Alert */}
                    <View style={styles.alertBox}>
                        <Text
                            allowFontScaling={false}
                            style={styles.alertTitle}
                        >
                            ℹ Information
                        </Text>
                        <Text
                            allowFontScaling={false}
                            style={styles.alertText}
                        >
                            Enable your video & microphone, webcam recommended.
                        </Text>
                    </View>

                    {/* Buttons */}
                    <View style={styles.setupButtons}>
                        <CustomButton
                            text="Enable WebCam"
                            width="100%"
                            height={50}
                            backgroundColor={BRANDCOLOR}
                            color={WHITE}
                            onPress={handleEnableWebcam}
                        />
                        <CustomButton
                            text="Start Interview"
                            width="100%"
                            height={50}
                            backgroundColor="#7C3AED"
                            color={WHITE}
                            onPress={handleStartInterview}
                        />
                    </View>
                </View>
            </ScrollView>
        </View>
    );
    };

    const renderInterviewScreen = () => {
        const handleInterviewBackPress = () => {
            // Stop audio playback if playing
            if (isPlayingAudio) {
                setIsPlayingAudio(false);
            }
            
            Alert.alert(
                "Exit Interview",
                "Are you sure you want to exit?",
                [
                    {
                        text: "Cancel",
                        onPress: () => {},
                        style: "cancel",
                    },
                    {
                        text: "Exit",
                        onPress: () => {
                            setCurrentScreen("home");
                            setInterviewData(null);
                            setCurrentQuestionIndex(0);
                            setRecordedAnswers({});
                            setRecordingPaths({});
                            navigation.goBack();
                        },
                    },
                ]
            );
        };

        const currentQuestion = MOCK_QUESTIONS[currentQuestionIndex];
        const isAnswerRecorded =
            recordedAnswers[currentQuestionIndex] === true;

        return (
            <View style={styles.container}>
                <MyHeader
                    // backgroundColor={BRANDCOLOR}
                    showBack
                    showCenterTitle
                    title={`Question ${currentQuestionIndex + 1} of ${MOCK_QUESTIONS.length}`}
                    onBackPress={handleInterviewBackPress}
                />

                <ScrollView contentContainerStyle={styles.interviewContent}>
                    {/* Question Tabs */}
                    <View style={styles.questionTabs}>
                        <FlatList
                            data={MOCK_QUESTIONS}
                            horizontal
                            scrollEnabled
                            renderItem={({ item, index }) => (
                                <Pressable
                                    style={[
                                        styles.tabButton,
                                        index === currentQuestionIndex &&
                                        styles.tabButtonActive,
                                    ]}
                                    onPress={() => {
                                        console.log("📌 Switched to Question:", index + 1);
                                        console.log("❓ Question:", MOCK_QUESTIONS[index].question);
                                        if (recordedAnswers[index]) {
                                            console.log("✅ This question has a recording!");
                                        } else {
                                            console.log("⭕ This question has NO recording yet");
                                        }
                                        setCurrentQuestionIndex(index);
                                        setIsRecording(false);
                                    }}
                                >
                                    <Text
                                        allowFontScaling={false}
                                        style={[
                                            styles.tabText,
                                            index === currentQuestionIndex &&
                                            styles.tabTextActive,
                                        ]}
                                    >
                                        Q{item.id}
                                    </Text>
                                </Pressable>
                            )}
                            keyExtractor={(item) => item.id.toString()}
                        />
                    </View>

                    {/* Question Display */}
                    <View style={styles.questionCard}>
                        <Text
                            allowFontScaling={false}
                            style={styles.questionText}
                        >
                            {currentQuestion.question}
                        </Text>
                    </View>

                    {/* WebCam Preview Placeholder */}
                    <View style={styles.webcamContainer}>
                        <View style={styles.webcamPlaceholder}>
                            <Text
                                allowFontScaling={false}
                                style={styles.webcamText}
                            >
                                📹
                            </Text>
                            <Text
                                allowFontScaling={false}
                                style={styles.webcamLabel}
                            >
                                WebCam Preview
                            </Text>
                        </View>

                        {isRecording && (
                            <View style={styles.recordingIndicator}>
                                <Text
                                    allowFontScaling={false}
                                    style={styles.recordingText}
                                >
                                    ● Recording...
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Control Buttons */}
                    <View style={styles.controlButtons}>
                        <CustomButton
                            text="Enable WebCam"
                            width="100%"
                            height={45}
                            backgroundColor={BRANDCOLOR}
                            color={WHITE}
                            fontSize={14}
                            onPress={handleEnableWebcam}
                        />

                        <View style={styles.recordingButtons}>
                            <CustomButton
                                text={
                                    isRecording
                                        ? "Stop Recording"
                                        : "Record Answer"
                                }
                                width="48%"
                                height={45}
                                backgroundColor={
                                    isRecording ? "#DC2626" : "#7C3AED"
                                }
                                color={WHITE}
                                fontSize={14}
                                onPress={
                                    isRecording
                                        ? handleStopRecording
                                        : handleStartRecording
                                }
                            />

                            <CustomButton
                                text={
                                    currentQuestionIndex ===
                                    MOCK_QUESTIONS.length - 1
                                        ? "Finish"
                                        : "Next Question"
                                }
                                width="48%"
                                height={45}
                                backgroundColor={
                                    isAnswerRecorded ? "#26AE61" : "#CCCCCC"
                                }
                                color={WHITE}
                                fontSize={14}
                                onPress={handleNextQuestion}
                            />
                        </View>

                        {/* Voice Playback Button - Shows after recording */}
                        {isAnswerRecorded && !isRecording && (
                            <View style={styles.playbackButtonContainer}>
                                <Pressable
                                    style={[styles.voicePlaybackButton, isPlayingAudio && styles.voicePlaybackButtonActive]}
                                    onPress={handlePlayRecording}
                                >
                                    <Text
                                        allowFontScaling={false}
                                        style={styles.voiceIcon}
                                    >
                                        {isPlayingAudio ? "🔊" : "🎵"}
                                    </Text>
                                </Pressable>
                                <Text
                                    allowFontScaling={false}
                                    style={styles.playbackLabel}
                                >
                                    {isPlayingAudio ? "Playing..." : "Listen to your answer"}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Answer Status */}
                    {isAnswerRecorded && (
                        <View style={styles.statusMessage}>
                            <Text
                                allowFontScaling={false}
                                style={styles.statusText}
                            >
                                ✓ Answer Recorded
                            </Text>
                        </View>
                    )}
                </ScrollView>
            </View>
        );
    };

    const renderResultsScreen = () => {
        const recordedCount = Object.keys(recordedAnswers).length;
        const totalQuestions = MOCK_QUESTIONS.length;
        const successPercentage = Math.round((recordedCount / totalQuestions) * 100);
        const isSuccess = successPercentage >= 80;

        return (
            <View style={styles.container}>
                <MyHeader
                    showBack
                    showCenterTitle
                    title="Interview Results"
                    onBackPress={() => {
                        if (isPlayingAudio) {
                            setIsPlayingAudio(false);
                        }
                        setCurrentScreen("home");
                        setInterviewData(null);
                        setCurrentQuestionIndex(0);
                        setRecordedAnswers({});
                        setRecordingPaths({});
                        navigation.goBack();
                    }}
                />
                <ScrollView contentContainerStyle={styles.resultsContent}>
                    {/* Success/Failure Badge */}
                    <View style={styles.badgeContainer}>
                        <View style={[styles.badge, isSuccess ? styles.badgeSuccess : styles.badgeFailure]}>
                            <Text allowFontScaling={false} style={styles.badgeEmoji}>
                                {isSuccess ? "🎉" : "📝"}
                            </Text>
                            <Text allowFontScaling={false} style={styles.badgeTitle}>
                                {isSuccess ? "Excellent!" : "Good Effort!"}
                            </Text>
                            <Text allowFontScaling={false} style={styles.badgeMessage}>
                                {isSuccess
                                    ? "You answered all questions. Keep practicing!"
                                    : "Answer more questions to improve your score."}
                            </Text>
                        </View>
                    </View>

                    {/* Score Section */}
                    <View style={styles.scoreSection}>
                        <Text allowFontScaling={false} style={styles.scoreLabel}>
                            Completion Score
                        </Text>
                        <View style={styles.scoreCircle}>
                            <Text allowFontScaling={false} style={styles.scorePercentage}>
                                {successPercentage}%
                            </Text>
                        </View>
                        <Text allowFontScaling={false} style={styles.scoreDetails}>
                            {recordedCount} of {totalQuestions} questions answered
                        </Text>
                    </View>

                    {/* Statistics */}
                    <View style={styles.statsCard}>
                        <View style={styles.statItem}>
                            <Text allowFontScaling={false} style={styles.statIcon}>
                                ✓
                            </Text>
                            <Text allowFontScaling={false} style={styles.statLabel}>
                                Answered
                            </Text>
                            <Text allowFontScaling={false} style={styles.statValue}>
                                {recordedCount}
                            </Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text allowFontScaling={false} style={styles.statIcon}>
                                ○
                            </Text>
                            <Text allowFontScaling={false} style={styles.statLabel}>
                                Skipped
                            </Text>
                            <Text allowFontScaling={false} style={styles.statValue}>
                                {totalQuestions - recordedCount}
                            </Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text allowFontScaling={false} style={styles.statIcon}>
                                ⏱️
                            </Text>
                            <Text allowFontScaling={false} style={styles.statLabel}>
                                Total
                            </Text>
                            <Text allowFontScaling={false} style={styles.statValue}>
                                {totalQuestions}
                            </Text>
                        </View>
                    </View>

                    {/* Badges Section */}
                    <View style={styles.badgesSection}>
                        <Text allowFontScaling={false} style={styles.badgesSectionTitle}>
                            Achievements
                        </Text>
                        <View style={styles.badgesGrid}>
                            {successPercentage === 100 ? (
                                <View style={[styles.achievementBadge, styles.earnedBadge]}>
                                    <Text allowFontScaling={false} style={styles.achievementEmoji}>
                                        👑
                                    </Text>
                                    <Text allowFontScaling={false} style={styles.achievementName}>
                                        Perfect
                                    </Text>
                                </View>
                            ) : (
                                <View style={[styles.achievementBadge, styles.lockedBadge]}>
                                    <Text allowFontScaling={false} style={styles.achievementEmoji}>
                                        👑
                                    </Text>
                                    <Text allowFontScaling={false} style={styles.achievementName}>
                                        Perfect
                                    </Text>
                                </View>
                            )}

                            {successPercentage >= 80 ? (
                                <View style={[styles.achievementBadge, styles.earnedBadge]}>
                                    <Text allowFontScaling={false} style={styles.achievementEmoji}>
                                        ⭐
                                    </Text>
                                    <Text allowFontScaling={false} style={styles.achievementName}>
                                        Star
                                    </Text>
                                </View>
                            ) : (
                                <View style={[styles.achievementBadge, styles.lockedBadge]}>
                                    <Text allowFontScaling={false} style={styles.achievementEmoji}>
                                        ⭐
                                    </Text>
                                    <Text allowFontScaling={false} style={styles.achievementName}>
                                        Star
                                    </Text>
                                </View>
                            )}

                            {successPercentage >= 50 ? (
                                <View style={[styles.achievementBadge, styles.earnedBadge]}>
                                    <Text allowFontScaling={false} style={styles.achievementEmoji}>
                                        🎯
                                    </Text>
                                    <Text allowFontScaling={false} style={styles.achievementName}>
                                        Starter
                                    </Text>
                                </View>
                            ) : (
                                <View style={[styles.achievementBadge, styles.lockedBadge]}>
                                    <Text allowFontScaling={false} style={styles.achievementEmoji}>
                                        🎯
                                    </Text>
                                    <Text allowFontScaling={false} style={styles.achievementName}>
                                        Starter
                                    </Text>
                                </View>
                            )}

                            {recordedCount > 0 ? (
                                <View style={[styles.achievementBadge, styles.earnedBadge]}>
                                    <Text allowFontScaling={false} style={styles.achievementEmoji}>
                                        🚀
                                    </Text>
                                    <Text allowFontScaling={false} style={styles.achievementName}>
                                        Launched
                                    </Text>
                                </View>
                            ) : (
                                <View style={[styles.achievementBadge, styles.lockedBadge]}>
                                    <Text allowFontScaling={false} style={styles.achievementEmoji}>
                                        🚀
                                    </Text>
                                    <Text allowFontScaling={false} style={styles.achievementName}>
                                        Launched
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.resultsButtonsContainer}>
                        <CustomButton
                            text="Retake Interview"
                            width="100%"
                            height={50}
                            backgroundColor={BRANDCOLOR}
                            color={WHITE}
                            onPress={async () => {
                                if (isPlayingAudio) {
                                    setIsPlayingAudio(false);
                                }
                                setCurrentScreen("setup");
                                setInterviewData(null);
                                setCurrentQuestionIndex(0);
                                setRecordedAnswers({});
                                setRecordingPaths({});
                            }}
                        />
                        <CustomButton
                            text="Back to Home"
                            width="100%"
                            height={50}
                            backgroundColor="#E8E8E8"
                            color={BLACK}
                            onPress={async () => {
                                if (isPlayingAudio) {
                                    setIsPlayingAudio(false);
                                }
                                setCurrentScreen("home");
                                setInterviewData(null);
                                setCurrentQuestionIndex(0);
                                setRecordedAnswers({});
                                setRecordingPaths({});
                                navigation.goBack();
                            }}
                        />
                    </View>
                </ScrollView>
            </View>
        );
    };

    // Handle refresh/reset when coming back from other screens
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            // Reset to home screen when screen regains focus
            if (currentScreen !== 'home') {
                setCurrentScreen('home');
                setInterviewData(null);
                setCurrentQuestionIndex(0);
                setRecordedAnswers({});
            }
        });
        return unsubscribe;
    }, [navigation, currentScreen]);

    // Log whenever recordings change
    useEffect(() => {
        console.log("📊 Current Recordings State:", recordedAnswers);
        console.log("🎵 Recordings Storage:", recordingPaths);
    }, [recordedAnswers, recordingPaths]);

    // Render functions for overlays
    const renderCompletionAlert = () => (
        <MyAlert
            visible={showCompletionAlert}
            title="Interview Complete"
            message="You have completed all questions!"
            textLeft="Back to Home"
            textRight="View Results"
            onPressLeft={async () => {
                if (isPlayingAudio) {
                    setIsPlayingAudio(false);
                }
                setShowCompletionAlert(false);
                setCurrentScreen("home");
                setInterviewData(null);
                setCurrentQuestionIndex(0);
                setRecordedAnswers({});
                setRecordingPaths({});
            }}
            onPressRight={() => {
                setShowCompletionAlert(false);
                setCurrentScreen("results");
            }}
            onRequestClose={() => setShowCompletionAlert(false)}
        />
    );

    const renderCameraPermissionAlert = () => (
        <MyAlert
            visible={showCameraPermissionAlert}
            title="Camera Permission"
            message={
                cameraPermissionGranted
                    ? "Camera access enabled successfully!"
                    : "Camera permission is required to record your answers. Please enable it in settings."
            }
            textLeft="OK"
            textRight=""
            showLeftButton={true}
            showRightButton={false}
            onPressLeft={() => {
                setShowCameraPermissionAlert(false);
                setPendingAction(null);
            }}
            onRequestClose={() => {
                setShowCameraPermissionAlert(false);
                setPendingAction(null);
            }}
        />
    );

    const renderUnansweredAlert = () => (
        showUnansweredAlert && (
            <Modal
                transparent
                visible={showUnansweredAlert}
                animationType="fade"
                statusBarTranslucent={true}
            >
                <View style={styles.modalOverlayUnanswered}>
                    <View style={styles.unansweredAlertContent}>
                        <Text allowFontScaling={false} style={styles.unansweredAlertTitle}>
                            Questions Not Answered
                        </Text>
                        <ScrollView style={styles.unansweredList}>
                            {MOCK_QUESTIONS.map((question, index) => (
                                <View key={question.id} style={styles.unansweredQuestionItem}>
                                    <Text allowFontScaling={false} style={styles.questionNumber}>
                                        Q{question.id}
                                    </Text>
                                    <View style={styles.questionContent}>
                                        {recordedAnswers[index] ? (
                                            <Text allowFontScaling={false} style={[styles.answerStatus, { color: '#10B981' }]}>
                                                ✓ Answer Recorded
                                            </Text>
                                        ) : (
                                            <Text allowFontScaling={false} style={[styles.answerStatus, { color: '#EF4444' }]}>
                                                ✗ No Answer Recorded
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                        <View style={styles.unansweredAlertButtons}>
                            <CustomButton
                                text="Continue Answering"
                                width="48%"
                                height={45}
                                backgroundColor="transparent"
                                color={BRANDCOLOR}
                                fontSize={13}
                                onPress={async () => {
                                    if (isPlayingAudio) {
                                        setIsPlayingAudio(false);
                                    }
                                    setShowUnansweredAlert(false);
                                }}
                            />
                            <CustomButton
                                text="Finish Interview"
                                width="48%"
                                height={45}
                                backgroundColor={BRANDCOLOR}
                                color={WHITE}
                                fontSize={13}
                                onPress={async () => {
                                    if (isPlayingAudio) {
                                        setIsPlayingAudio(false);
                                    }
                                    await handleFinishInterview();
                                }}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        )
    );

    // Main render based on current screen
    if (currentScreen === "setup") {
        return (
            <>
                {renderSetupScreen()}
                {renderCompletionAlert()}
                {renderCameraPermissionAlert()}
                {renderUnansweredAlert()}
            </>
        );
    }

    if (currentScreen === "interview") {
        return (
            <>
                {renderInterviewScreen()}
                {renderCompletionAlert()}
                {renderCameraPermissionAlert()}
                {renderUnansweredAlert()}
            </>
        );
    }

    if (currentScreen === "results") {
        return (
            <>
                {renderResultsScreen()}
                {renderCompletionAlert()}
                {renderCameraPermissionAlert()}
                {renderUnansweredAlert()}
            </>
        );
    }

    return (
        <>
            {renderHomeScreen()}
            {renderCompletionAlert()}
            {renderCameraPermissionAlert()}
            {renderUnansweredAlert()}
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: WHITE,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    emptyState: {
        justifyContent: "center",
        alignItems: "center",
        minHeight: 300,
        paddingVertical: 20,
    },
    emptyStateText: {
        fontSize: 22,
        fontFamily: COMICSBOLD,
        color: BLACK,
        marginBottom: 10,
    },
    emptyStateSubtext: {
        fontSize: 14,
        fontFamily: COMICS,
        color: "#666",
        marginBottom: 30,
    },
    floatingButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: BRANDCOLOR,
        justifyContent: "center",
        alignItems: "center",
        elevation: 8,
        shadowColor: "#000",
        shadowOpacity: 0.3,
        shadowRadius: 8,
        marginBottom: 20,
    },
    plusIcon: {
        fontSize: 50,
        color: WHITE,
        fontFamily: COMICSBOLD,
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: WHITE,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: "85%",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E5E5",
    },
    modalTitle: {
        fontSize: 18,
        fontFamily: COMICSBOLD,
        color: BLACK,
    },
    closeButton: {
        fontSize: 28,
        color: BLACK,
        width: 30,
        textAlign: "center",
    },
    modalScrollContent: {
        paddingHorizontal: 20,
        paddingVertical: 20,
        paddingBottom: 100,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontFamily: COMICSBOLD,
        color: BLACK,
        marginBottom: 8,
    },
    helperText: {
        fontSize: 12,
        fontFamily: COMICS,
        color: "#999",
        marginTop: 5,
    },
    infoBox: {
        backgroundColor: "#FFF9E6",
        borderRadius: 10,
        padding: 15,
        marginVertical: 20,
        borderLeftWidth: 4,
        borderLeftColor: "#FFB800",
    },
    infoTitle: {
        fontSize: 14,
        fontFamily: COMICSBOLD,
        color: "#FF8C00",
        marginBottom: 5,
    },
    infoText: {
        fontSize: 13,
        fontFamily: COMICS,
        color: "#FF8C00",
    },
    modalButtons: {
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderTopWidth: 1,
        borderTopColor: "#E5E5E5",
    },

    // Setup Screen Styles
    setupContent: {
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    detailsCard: {
        backgroundColor: "#F5F5F5",
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
    },
    detailRow: {
        marginBottom: 12,
    },
    detailLabel: {
        fontSize: 12,
        fontFamily: COMICSBOLD,
        color: BLACK,
        marginBottom: 3,
    },
    detailValue: {
        fontSize: 13,
        fontFamily: COMICS,
        color: "#444",
    },
    getStartedSection: {
        marginBottom: 20,
    },
    getStartedTitle: {
        fontSize: 20,
        fontFamily: COMICSBOLD,
        color: BLACK,
        marginBottom: 20,
        textAlign: "center",
    },
    cameraPlaceholder: {
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
        marginTop: 10,
    },
    cameraBorder: {
        width: width - 60,
        height: 200,
        borderColor: BRANDCOLOR,
        borderWidth: 3,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F0F9F7",
    },
    cameraIcon: {
        fontSize: 80,
    },
    alertBox: {
        backgroundColor: "#FFF9E6",
        borderRadius: 10,
        padding: 15,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: "#FFB800",
    },
    alertTitle: {
        fontSize: 13,
        fontFamily: COMICSBOLD,
        color: "#FF8C00",
        marginBottom: 5,
    },
    alertText: {
        fontSize: 12,
        fontFamily: COMICS,
        color: "#FF8C00",
    },
    setupButtons: {
        gap: 12,
    },

    // Interview Screen Styles
    interviewContent: {
        paddingHorizontal: 15,
        paddingVertical: 15,
    },
    questionTabs: {
        marginBottom: 20,
    },
    tabButton: {
        marginRight: 10,
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: "#E5E5E5",
        borderWidth: 2,
        borderColor: "transparent",
    },
    tabButtonActive: {
        backgroundColor: BLACK,
        borderColor: BRANDCOLOR,
    },
    tabText: {
        fontSize: 12,
        fontFamily: COMICSBOLD,
        color: BLACK,
    },
    tabTextActive: {
        color: WHITE,
    },
    questionCard: {
        backgroundColor: BRANDCOLOR,
        borderRadius: 10,
        padding: 20,
        marginBottom: 20,
    },
    questionText: {
        fontSize: 15,
        fontFamily: COMICSBOLD,
        color: WHITE,
        lineHeight: 24,
    },
    webcamContainer: {
        marginBottom: 20,
    },
    webcamPlaceholder: {
        height: 200,
        backgroundColor: BLACK,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
    },
    webcamText: {
        fontSize: 60,
        marginBottom: 10,
    },
    webcamLabel: {
        fontSize: 14,
        fontFamily: COMICS,
        color: WHITE,
    },
    recordingIndicator: {
        marginTop: 10,
        paddingVertical: 8,
        paddingHorizontal: 15,
        backgroundColor: "#DC2626",
        borderRadius: 20,
        alignSelf: "flex-start",
    },
    recordingText: {
        fontSize: 12,
        fontFamily: COMICSBOLD,
        color: WHITE,
    },
    controlButtons: {
        marginBottom: 20,
    },
    recordingButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 12,
        gap: 8,
    },
    playbackButtonContainer: {
        marginTop: 20,
        alignItems: "center",
        paddingVertical: 15,
        backgroundColor: "#F0F9F7",
        borderRadius: 12,
        borderWidth: 2,
        borderColor: BRANDCOLOR,
    },
    voicePlaybackButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: BRANDCOLOR,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 10,
        elevation: 5,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    voicePlaybackButtonActive: {
        backgroundColor: "#7C3AED",
        elevation: 8,
        shadowOpacity: 0.3,
    },
    voiceIcon: {
        fontSize: 40,
    },
    playbackLabel: {
        fontSize: 13,
        fontFamily: FIRASANSSEMIBOLD,
        color: BRANDCOLOR,
    },
    statusMessage: {
        backgroundColor: "#D4EDDA",
        borderRadius: 8,
        padding: 12,
        marginBottom: 20,
    },
    statusText: {
        fontSize: 14,
        fontFamily: COMICSBOLD,
        color: "#26AE61",
        textAlign: "center",
    },

    // Results Screen Styles
    resultsContent: {
        paddingHorizontal: 20,
        paddingVertical: 20,
        flexGrow: 1,
    },
    badgeContainer: {
        marginBottom: 30,
        alignItems: "center",
    },
    badge: {
        width: "100%",
        borderRadius: 15,
        padding: 25,
        alignItems: "center",
    },
    badgeSuccess: {
        backgroundColor: "#D4EDDA",
        borderWidth: 2,
        borderColor: "#26AE61",
    },
    badgeFailure: {
        backgroundColor: "#FFF3CD",
        borderWidth: 2,
        borderColor: "#FFB800",
    },
    badgeEmoji: {
        fontSize: 50,
        marginBottom: 10,
    },
    badgeTitle: {
        fontSize: 24,
        fontFamily: UBUNTUBOLD,
        color: BLACK,
        marginBottom: 8,
    },
    badgeMessage: {
        fontSize: 14,
        fontFamily: FIRASANS,
        color: "#666",
        textAlign: "center",
    },
    scoreSection: {
        marginBottom: 30,
        alignItems: "center",
    },
    scoreLabel: {
        fontSize: 14,
        fontFamily: UBUNTUBOLD,
        color: BLACK,
        marginBottom: 15,
    },
    scoreCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: BRANDCOLOR,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 15,
        elevation: 5,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    scorePercentage: {
        fontSize: 48,
        fontFamily: UBUNTUBOLD,
        color: WHITE,
    },
    scoreDetails: {
        fontSize: 13,
        fontFamily: FIRASANS,
        color: "#666",
        textAlign: "center",
    },
    statsCard: {
        backgroundColor: "#F5F5F5",
        borderRadius: 12,
        padding: 20,
        marginBottom: 30,
        flexDirection: "row",
        justifyContent: "space-around",
    },
    statItem: {
        alignItems: "center",
    },
    statIcon: {
        fontSize: 30,
        marginBottom: 8,
    },
    statLabel: {
        fontSize: 12,
        fontFamily: FIRASANS,
        color: "#666",
        marginBottom: 5,
    },
    statValue: {
        fontSize: 20,
        fontFamily: UBUNTUBOLD,
        color: BLACK,
    },
    badgesSection: {
        marginBottom: 30,
    },
    badgesSectionTitle: {
        fontSize: 16,
        fontFamily: UBUNTUBOLD,
        color: BLACK,
        marginBottom: 15,
    },
    badgesGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    achievementBadge: {
        width: "23%",
        aspectRatio: 1,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 15,
        borderWidth: 2,
    },
    earnedBadge: {
        backgroundColor: "#E6F9F3",
        borderColor: BRANDCOLOR,
    },
    lockedBadge: {
        backgroundColor: "#F0F0F0",
        borderColor: "#CCCCCC",
    },
    achievementEmoji: {
        fontSize: 32,
        marginBottom: 5,
    },
    achievementName: {
        fontSize: 10,
        fontFamily: FIRASANSSEMIBOLD,
        color: BLACK,
        textAlign: "center",
    },
    resultsButtonsContainer: {
        gap: 12,
        marginBottom: 20,
    },
    
    // Unanswered Questions Alert Styles
    modalOverlayUnanswered: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
    },
    unansweredAlertContent: {
        backgroundColor: WHITE,
        borderRadius: 15,
        padding: 20,
        maxHeight: "80%",
        width: "100%",
    },
    unansweredAlertTitle: {
        fontSize: 18,
        fontFamily: UBUNTUBOLD,
        color: BLACK,
        marginBottom: 15,
        textAlign: "center",
    },
    unansweredList: {
        maxHeight: 300,
        marginBottom: 15,
    },
    unansweredQuestionItem: {
        flexDirection: "row",
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 8,
        backgroundColor: "#F9FAFB",
        borderRadius: 8,
        alignItems: "center",
    },
    questionNumber: {
        fontSize: 13,
        fontFamily: UBUNTUBOLD,
        color: BLACK,
        marginRight: 10,
        minWidth: 30,
    },
    questionContent: {
        flex: 1,
    },
    answerStatus: {
        fontSize: 12,
        fontFamily: FIRASANSSEMIBOLD,
    },
    unansweredAlertButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 10,
    },

    // Previous Interviews Section Styles
    previousInterviewsSection: {
        paddingHorizontal: 15,
        paddingVertical: 20,
        marginTop: 20,
        paddingBottom: 20,
    },
    previousInterviewsTitle: {
        fontSize: 16,
        fontFamily: UBUNTUBOLD,
        color: BLACK,
        marginBottom: 15,
        marginLeft: 0,
    },
    cardRowWrapper: {
        justifyContent: "space-between",
        gap: 12,
        marginBottom: 12,
    },
    interviewCardContainer: {
        flex: 1,
    },
    interviewCard: {
        flex: 1,
        backgroundColor: WHITE,
        borderRadius: 15,
        padding: 16,
        elevation: 5,
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
    },
    cardScoreSection: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
        gap: 10,
    },
    scoreCircleSmall: {
        width: 55,
        height: 55,
        borderRadius: 27,
        justifyContent: "center",
        alignItems: "center",
    },
    scoreSmall: {
        fontSize: 18,
        fontFamily: UBUNTUBOLD,
        color: WHITE,
    },
    performanceBadgeSmall: {
        flex: 1,
        justifyContent: "center",
    },
    performanceBadgeText: {
        fontSize: 12,
        fontFamily: FIRASANSSEMIBOLD,
        lineHeight: 16,
    },
    cardTitleSection: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
        gap: 8,
    },
    cardIcon: {
        fontSize: 24,
    },
    cardJobRole: {
        fontSize: 13,
        fontFamily: FIRASANSBOLD,
        color: BLACK,
        flex: 1,
        lineHeight: 18,
    },
    progressBarContainer: {
        height: 5,
        backgroundColor: "#E5E7EB",
        borderRadius: 2.5,
        overflow: "hidden",
        marginBottom: 12,
    },
    progressBar: {
        height: "100%",
        borderRadius: 2.5,
    },
    cardDetailsSection: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 10,
    },
    detailItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
    },
    detailIcon: {
        fontSize: 12,
    },
    detailText: {
        fontSize: 11,
        fontFamily: FIRASANS,
        color: "#6B7280",
    },
    cardDate: {
        fontSize: 10,
        fontFamily: FIRASANS,
        color: "#9CA3AF",
        marginBottom: 12,
    },
    cardButtons: {
        flexDirection: "row",
        gap: 8,
        justifyContent: "space-between",
    },
});