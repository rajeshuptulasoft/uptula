import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
  SafeAreaView,
  ScrollView,
  FlatList,
  TextInput,
  Image,
  RefreshControl,
  BackHandler,
  TouchableOpacity,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import { WHITE, BLACK, BRANDCOLOR } from "../../../constant/color";
import { HEIGHT, WIDTH } from "../../../constant/config";
import { MyHeader } from "../../../components/commonComponents/MyHeader";
import { TextInputComponent } from "../../../components/commonComponents/TextInputComponent";
import { CustomButton } from "../../../components/commonComponents/Button";
import { ToastMessage } from "../../../components/commonComponents/ToastMessage";
import { BASE_URL } from "../../../constant/url";
import { GETNETWORK, POSTNETWORK } from "../../../utils/Network";
import { getObjByKey } from "../../../utils/Storage";
import {
  DROPDOWN,
  JOBTITLE,
} from "../../../constant/imagePath";
import { COMICS, COMICSBOLD } from "../../../constant/fontPath";

const SupportScreen = () => {
  const navigation = useNavigation();

  // Form states
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState("medium");
  const [description, setDescription] = useState("");

  // Tickets list
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showTickets, setShowTickets] = useState(false);


  // Toast message
  const [toastMessage, setToastMessage] = useState({
    type: "",
    msg: "",
    visible: false,
  });

  // Handle back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (showTickets) {
        setShowTickets(false);
        return true;
      }
      navigation.goBack();
      return true;
    });

    return () => backHandler.remove();
  }, [navigation, showTickets]);

  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const url = `${BASE_URL}employer/tickets`;
      const result = await GETNETWORK(url, true);

      // console.log("📥 Fetched tickets response:", JSON.stringify(result, null, 2));

      let ticketsData = [];
      if (Array.isArray(result)) {
        ticketsData = result;
      } else if (result?.data && Array.isArray(result.data)) {
        ticketsData = result.data;
      } else if (result?.tickets && Array.isArray(result.tickets)) {
        ticketsData = result.tickets;
      }

      // console.log("🎫 Processed tickets data:", JSON.stringify(ticketsData, null, 2));
      setTickets(ticketsData || []);
    } catch (error) {
      // console.log("❌ Error fetching tickets:", error);
      setTickets([]);
      setToastMessage({
        type: "error",
        msg: "Failed to load tickets. Please try again.",
        visible: true,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch tickets when screen is focused and tickets are visible
  useFocusEffect(
    useCallback(() => {
      if (showTickets) {
        fetchTickets();
      }
    }, [showTickets, fetchTickets])
  );

  // Reset form fields when screen is focused
  useFocusEffect(
    useCallback(() => {
      // Reset form to default values when screen comes into focus
      setSubject("");
      setCategory("general");
      setPriority("medium");
      setDescription("");
    }, [])
  );


  // Handle submit ticket
  const handleSubmitTicket = async () => {
    if (!subject.trim()) {
      setToastMessage({
        type: "error",
        msg: "Please enter a subject",
        visible: true,
      });
      return;
    }

    if (!description.trim()) {
      setToastMessage({
        type: "error",
        msg: "Please enter a description",
        visible: true,
      });
      return;
    }

    try {
      const storedData = await getObjByKey("loginResponse");
      const loginData =
        typeof storedData === "string"
          ? JSON.parse(storedData)
          : storedData;

      const token = loginData?.token;
      if (!token) {
        setToastMessage({
          type: "error",
          msg: "Authentication failed. Please login again.",
          visible: true,
        });
        return;
      }

      const url = `${BASE_URL}employer/tickets`;
      const payload = {
        subject: subject.trim(),
        category: category,
        priority: priority,
        description: description.trim(),
      };

      // console.log("📤 Submitting ticket...");
      // console.log("📡 URL:", url);
      // console.log("📦 Payload:", JSON.stringify(payload, null, 2));
      // console.log("📝 Subject:", payload.subject);
      // console.log("🏷️ Category:", payload.category);
      // console.log("⚡ Priority:", payload.priority);
      // console.log("📄 Description:", payload.description);
      // console.log("🔐 Token (first 30 chars):", token.substring(0, 30) + "...");

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      // console.log("📥 API Response:", JSON.stringify(result, null, 2));

      if (
        result?.ticket ||
        result?.message?.toLowerCase().includes("success") ||
        result?.statusCode === 200 ||
        result?.status === "success" ||
        result?.id ||
        result?.ticket_id
      ) {
        // console.log("✅ Ticket submitted successfully!");
        setToastMessage({
          type: "success",
          msg: result?.message || "Ticket submitted successfully!",
          visible: true,
        });

        // Reset form
        setSubject("");
        setCategory("general");
        setPriority("medium");
        setDescription("");

        // Refresh tickets if viewing
        if (showTickets) {
          fetchTickets();
        }
      } else {
        // console.log("❌ Failed to submit ticket:", result?.message || "Unknown error");
        setToastMessage({
          type: "error",
          msg: result?.message || "Failed to submit ticket. Please try again.",
          visible: true,
        });
      }
    } catch (error) {
      // console.log("❌ Error submitting ticket:", error);
      setToastMessage({
        type: "error",
        msg: "An error occurred. Please try again.",
        visible: true,
      });
    }
  };

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    
    // Reset all form fields
    setSubject("");
    setCategory("general");
    setPriority("medium");
    setDescription("");
    
    // Fetch tickets
    fetchTickets();
  }, [fetchTickets]);


  // Render ticket card
  const renderTicketCard = ({ item }) => {
    const getStatusColor = (status) => {
      if (status?.toLowerCase() === "open") return "#4CAF50";
      if (status?.toLowerCase() === "closed") return "#9E9E9E";
      if (status?.toLowerCase() === "in_progress") return "#FF9800";
      return "#2196F3";
    };

    const getPriorityColor = (priority) => {
      if (priority?.toLowerCase() === "urgent") return "#F44336";
      if (priority?.toLowerCase() === "high") return "#FF9800";
      if (priority?.toLowerCase() === "medium") return "#FFC107";
      return "#4CAF50";
    };

    const getCategoryIcon = (category) => {
      if (category?.toLowerCase() === "billing") return "credit-card-outline";
      if (category?.toLowerCase() === "login") return "login";
      if (category?.toLowerCase() === "job_posting") return "briefcase-outline";
      return "help-circle-outline";
    };

    return (
      <View style={styles.ticketCard}>
        {/* Card Header with Gradient-like Background */}
        <View style={[styles.ticketCardHeader, { backgroundColor: getStatusColor(item.status) + "15" }]}>
          <View style={styles.ticketCardLeft}>
            <Text style={styles.ticketSubject} numberOfLines={2}>
              {item.subject || "No Subject"}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>
              {item.status ? item.status.toUpperCase() : "OPEN"}
            </Text>
          </View>
        </View>

        {/* Card Body with Better Layout */}
        <View style={styles.ticketCardBody}>
          <View style={styles.ticketInfoContainer}>
            <View style={styles.ticketInfoRow}>
              <View style={[styles.iconContainer, { backgroundColor: BRANDCOLOR + "20" }]}>
                <MaterialCommunityIcons
                  name={getCategoryIcon(item.category)}
                  size={18}
                  color={BRANDCOLOR}
                />
              </View>
              <View style={styles.ticketInfoContent}>
                <Text style={styles.ticketInfoLabel}>Category</Text>
                <Text style={styles.ticketInfoText}>
                  {item.category ? item.category.replace("_", " ").toUpperCase() : "GENERAL"}
                </Text>
              </View>
            </View>

            <View style={styles.ticketInfoRow}>
              <View style={[styles.iconContainer, { backgroundColor: getPriorityColor(item.priority) + "20" }]}>
                <MaterialCommunityIcons
                  name="flag"
                  size={18}
                  color={getPriorityColor(item.priority)}
                />
              </View>
              <View style={styles.ticketInfoContent}>
                <Text style={styles.ticketInfoLabel}>Priority</Text>
                <Text
                  style={[
                    styles.ticketInfoText,
                    { color: getPriorityColor(item.priority), fontFamily: COMICSBOLD },
                  ]}
                >
                  {item.priority ? item.priority.toUpperCase() : "MEDIUM"}
                </Text>
              </View>
            </View>

            {item.created_at && (
              <View style={styles.ticketInfoRow}>
                <View style={[styles.iconContainer, { backgroundColor: "#2196F320" }]}>
                  <MaterialCommunityIcons
                    name="calendar-clock"
                    size={18}
                    color="#2196F3"
                  />
                </View>
                <View style={styles.ticketInfoContent}>
                  <Text style={styles.ticketInfoLabel}>Created</Text>
                  <Text style={styles.ticketInfoText}>
                    {new Date(item.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                </View>
              </View>
            )}
          </View>

        </View>
      </View>
    );
  };

  return (
    <>
      <StatusBar
        backgroundColor={WHITE}
        barStyle={Platform.OS === "ios" ? "dark-content" : "dark-content"}
        translucent={Platform.OS === "android"}
      />

      <SafeAreaView style={styles.container}>
        <MyHeader
          showBack={true}
          showCenterTitle={true}
          title="Support & Tickets"
          onBackPress={() => navigation.goBack()}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
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
          {/* Header Section */}
          <View style={styles.headerSection}>
            <Text style={styles.title}>Support & Tickets</Text>
            <Text style={styles.subtitle}>
              Raise an issue ticket for billing, login, job posting or general queries.
            </Text>
          </View>

          {/* Create Ticket Form */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Create Ticket</Text>

            {/* Subject */}
            <TextInputComponent
              placeholder="Subject"
              inputdata={subject}
              setInputdata={setSubject}
              image={JOBTITLE}
              borderColor={BRANDCOLOR}
              width="100%"
            />

            {/* Category Dropdown */}
            <Text style={styles.label}>Category</Text>
            <View style={styles.pickerWrapper}>
              <View style={styles.pickerContainer}>
                <View style={styles.pickerTextContainer}>
                  <Text style={styles.pickerSelectedText} numberOfLines={1}>
                    {category === "general" ? "General" :
                     category === "billing" ? "Billing" :
                     category === "login" ? "Login" :
                     category === "job_posting" ? "Job Posting" : category}
                  </Text>
                </View>
                <Picker
                  selectedValue={category}
                  onValueChange={setCategory}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                >
                  <Picker.Item label="General" value="general" />
                  <Picker.Item label="Billing" value="billing" />
                  <Picker.Item label="Login" value="login" />
                  <Picker.Item label="Job Posting" value="job_posting" />
                </Picker>
                <Image source={DROPDOWN} style={styles.dropdownIcon} />
              </View>
            </View>

            {/* Priority Dropdown */}
            <Text style={styles.label}>Priority</Text>
            <View style={styles.pickerWrapper}>
              <View style={styles.pickerContainer}>
                <View style={styles.pickerTextContainer}>
                  <Text style={styles.pickerSelectedText} numberOfLines={1}>
                    {priority === "low" ? "Low" :
                     priority === "medium" ? "Medium" :
                     priority === "high" ? "High" :
                     priority === "urgent" ? "Urgent" : priority}
                  </Text>
                </View>
                <Picker
                  selectedValue={priority}
                  onValueChange={setPriority}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                >
                  <Picker.Item label="Low" value="low" />
                  <Picker.Item label="Medium" value="medium" />
                  <Picker.Item label="High" value="high" />
                  <Picker.Item label="Urgent" value="urgent" />
                </Picker>
                <Image source={DROPDOWN} style={styles.dropdownIcon} />
              </View>
            </View>

            {/* Description */}
            <Text style={styles.label}>Description</Text>
            <View style={styles.descriptionContainer}>
              <View style={[styles.descriptionInputWrapper, { borderColor: BRANDCOLOR }]}>
                <TextInput
                  style={styles.descriptionInput}
                  placeholder="Enter description..."
                  placeholderTextColor="#999"
                  value={description}
                  onChangeText={setDescription}
                  multiline={true}
                  numberOfLines={6}
                  textAlignVertical="top"
                  maxLength={1000}
                />
                <Text style={styles.characterCount}>
                  {description.length}/1000
                </Text>
              </View>
            </View>

            {/* Submit Button */}
            <View style={styles.buttonContainer}>
              <CustomButton
                text="Submit Ticket"
                width="100%"
                height={HEIGHT * 0.06}
                backgroundColor={BRANDCOLOR}
                fontSize={HEIGHT * 0.018}
                color={WHITE}
                onPress={handleSubmitTicket}
              />
            </View>
          </View>

          {/* View My Tickets Section */}
          <View style={styles.ticketsSection}>
            <TouchableOpacity
              style={styles.viewTicketsButton}
              onPress={() => {
                setShowTickets(!showTickets);
                if (!showTickets) {
                  fetchTickets();
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.viewTicketsText}>
                {showTickets ? "Hide My Tickets" : "View My Tickets"}
              </Text>
              <MaterialCommunityIcons
                name={showTickets ? "chevron-up" : "chevron-down"}
                size={24}
                color={BRANDCOLOR}
              />
            </TouchableOpacity>

            {showTickets && (
              <View style={styles.ticketsListContainer}>
                {loading && !refreshing ? (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading tickets...</Text>
                  </View>
                ) : tickets.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <MaterialCommunityIcons
                      name="ticket-outline"
                      size={48}
                      color="#999"
                    />
                    <Text style={styles.emptyText}>No tickets found</Text>
                  </View>
                ) : (
                  <FlatList
                    data={tickets}
                    renderItem={renderTicketCard}
                    keyExtractor={(item, index) =>
                      `${item.id || item.ticket_id || index}`
                    }
                    scrollEnabled={false}
                  />
                )}
              </View>
            )}
          </View>
        </ScrollView>


        {/* Toast Message */}
        <ToastMessage
          message={toastMessage.msg}
          visible={toastMessage.visible}
          setVisible={({ visible }) =>
            setToastMessage((prev) => ({ ...prev, visible }))
          }
          bacgroundColor={
            toastMessage.type === "success"
              ? "green"
              : toastMessage.type === "error"
              ? "red"
              : "#e0e0e0"
          }
          textColor={WHITE}
          type={toastMessage.type}
          duration={3000}
        />
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WHITE,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: HEIGHT * 0.02,
  },
  headerSection: {
    paddingHorizontal: WIDTH * 0.05,
    paddingTop: HEIGHT * 0.02,
    paddingBottom: HEIGHT * 0.01,
  },
  title: {
    fontSize: HEIGHT * 0.028,
    fontFamily: COMICSBOLD,
    color: BLACK,
    marginBottom: HEIGHT * 0.01,
  },
  subtitle: {
    fontSize: HEIGHT * 0.015,
    fontFamily: COMICS,
    color: "#666",
    lineHeight: HEIGHT * 0.022,
  },
  formSection: {
    paddingHorizontal: WIDTH * 0.05,
    paddingTop: HEIGHT * 0.02,
  },
  sectionTitle: {
    fontSize: HEIGHT * 0.02,
    fontFamily: COMICSBOLD,
    color: BLACK,
    marginBottom: HEIGHT * 0.015,
  },
  label: {
    fontSize: HEIGHT * 0.016,
    fontFamily: COMICSBOLD,
    color: BLACK,
    marginLeft: WIDTH * 0.02,
    marginTop: HEIGHT * 0.01,
    marginBottom: HEIGHT * 0.005,
  },
  pickerWrapper: {
    marginVertical: HEIGHT * 0.01,
  },
  pickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: WHITE,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: BRANDCOLOR,
    height: HEIGHT * 0.06,
    marginHorizontal: WIDTH * 0.02,
    paddingHorizontal: WIDTH * 0.03,
    elevation: 5,
  },
  pickerTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  pickerSelectedText: {
    fontSize: HEIGHT * 0.016,
    fontFamily: COMICS,
    color: BLACK,
  },
  picker: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0,
  },
  pickerItem: {
    fontSize: HEIGHT * 0.016,
    fontFamily: COMICS,
  },
  dropdownIcon: {
    width: 20,
    height: 20,
    tintColor: BRANDCOLOR,
  },
  descriptionContainer: {
    marginVertical: HEIGHT * 0.01,
    marginHorizontal: WIDTH * 0.02,
  },
  descriptionInputWrapper: {
    borderWidth: 1,
    borderRadius: 15,
    padding: WIDTH * 0.03,
    minHeight: HEIGHT * 0.15,
    backgroundColor: WHITE,
    elevation: 5,
  },
  descriptionInput: {
    fontSize: HEIGHT * 0.016,
    fontFamily: COMICS,
    color: BLACK,
    minHeight: HEIGHT * 0.12,
    textAlignVertical: "top",
  },
  characterCount: {
    fontSize: HEIGHT * 0.012,
    fontFamily: COMICS,
    color: "#999",
    textAlign: "right",
    marginTop: HEIGHT * 0.01,
  },
  buttonContainer: {
    marginTop: HEIGHT * 0.02,
    marginBottom: HEIGHT * 0.01,
    paddingHorizontal: WIDTH * 0.02,
  },
  ticketsSection: {
    paddingHorizontal: WIDTH * 0.05,
    paddingTop: HEIGHT * 0.02,
  },
  viewTicketsButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: WHITE,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: BRANDCOLOR,
    padding: HEIGHT * 0.015,
    elevation: 5,
  },
  viewTicketsText: {
    fontSize: HEIGHT * 0.018,
    fontFamily: COMICSBOLD,
    color: BRANDCOLOR,
  },
  ticketsListContainer: {
    marginTop: HEIGHT * 0.02,
  },
  ticketCard: {
    backgroundColor: WHITE,
    borderRadius: 20,
    marginBottom: HEIGHT * 0.02,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    overflow: "hidden",
  },
  ticketCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: WIDTH * 0.04,
    paddingBottom: HEIGHT * 0.015,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  ticketCardLeft: {
    flex: 1,
    marginRight: WIDTH * 0.02,
  },
  ticketIdContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: HEIGHT * 0.008,
  },
  ticketId: {
    fontSize: HEIGHT * 0.012,
    fontFamily: COMICSBOLD,
    marginLeft: WIDTH * 0.015,
  },
  ticketSubject: {
    fontSize: HEIGHT * 0.019,
    fontFamily: COMICSBOLD,
    color: BLACK,
    lineHeight: HEIGHT * 0.024,
  },
  statusBadge: {
    paddingHorizontal: WIDTH * 0.025,
    paddingVertical: HEIGHT * 0.008,
    borderRadius: 15,
    elevation: 2,
  },
  statusText: {
    fontSize: HEIGHT * 0.011,
    fontFamily: COMICSBOLD,
    color: WHITE,
    letterSpacing: 0.5,
  },
  ticketCardBody: {
    padding: WIDTH * 0.04,
  },
  ticketInfoContainer: {
    marginBottom: HEIGHT * 0.015,
  },
  ticketInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: HEIGHT * 0.015,
  },
  iconContainer: {
    width: WIDTH * 0.1,
    height: WIDTH * 0.1,
    borderRadius: WIDTH * 0.05,
    justifyContent: "center",
    alignItems: "center",
    marginRight: WIDTH * 0.03,
  },
  ticketInfoContent: {
    flex: 1,
  },
  ticketInfoLabel: {
    fontSize: HEIGHT * 0.011,
    fontFamily: COMICS,
    color: "#999",
    marginBottom: HEIGHT * 0.003,
  },
  ticketInfoText: {
    fontSize: HEIGHT * 0.015,
    fontFamily: COMICS,
    color: "#333",
  },
  viewDetailsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: HEIGHT * 0.015,
    borderTopWidth: 1,
    borderTopColor: "#F5F5F5",
  },
  viewDetailsText: {
    fontSize: HEIGHT * 0.014,
    fontFamily: COMICSBOLD,
    color: BRANDCOLOR,
  },
  loadingContainer: {
    padding: HEIGHT * 0.03,
    alignItems: "center",
  },
  loadingText: {
    fontSize: HEIGHT * 0.016,
    fontFamily: COMICS,
    color: "#666",
  },
  emptyContainer: {
    padding: HEIGHT * 0.05,
    alignItems: "center",
  },
  emptyText: {
    fontSize: HEIGHT * 0.016,
    fontFamily: COMICS,
    color: "#999",
    marginTop: HEIGHT * 0.01,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: HEIGHT * 0.9,
    paddingTop: HEIGHT * 0.02,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: WIDTH * 0.05,
    paddingBottom: HEIGHT * 0.02,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: HEIGHT * 0.024,
    fontFamily: COMICSBOLD,
    color: BLACK,
  },
  closeButton: {
    padding: WIDTH * 0.02,
  },
  modalScrollView: {
    flex: 1,
  },
  modalContent: {
    padding: WIDTH * 0.05,
  },
  modalDetailRow: {
    flexDirection: "row",
    marginBottom: HEIGHT * 0.02,
    alignItems: "flex-start",
  },
  modalDetailContent: {
    flex: 1,
    marginLeft: WIDTH * 0.03,
  },
  modalDetailLabel: {
    fontSize: HEIGHT * 0.014,
    fontFamily: COMICSBOLD,
    color: "#666",
    marginBottom: HEIGHT * 0.005,
  },
  modalDetailValue: {
    fontSize: HEIGHT * 0.016,
    fontFamily: COMICS,
    color: BLACK,
    lineHeight: HEIGHT * 0.024,
  },
});

export default SupportScreen;

