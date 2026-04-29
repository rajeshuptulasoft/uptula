import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
  BackHandler,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  Modal,
  ScrollView,
  Animated,
  PanResponder,
  Dimensions,
  InteractionManager,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useFocusEffect } from "@react-navigation/native";
import { BLACK, BRANDCOLOR, WHITE } from "../../../constant/color";
import { HEIGHT, WIDTH } from "../../../constant/config";
import { CANTARELLBOLD, CANTARELL, FIRASANSBOLD, FIRASANS, FIRASANSSEMIBOLD, OXYGENBOLD, OXYGEN, ROBOTOBOLD, ROBOTOSEMIBOLD, ROBOTO, UBUNTUBOLD, UBUNTU, COMICSBOLD } from "../../../constant/fontPath";
import { MyHeader } from "../../../components/commonComponents/MyHeader";
import { MyAlert } from "../../../components/commonComponents/MyAlert";
import { BASE_URL } from "../../../constant/url";
import { GETNETWORK, PUTNETWORK } from "../../../utils/Network";
import { getObjByKey } from "../../../utils/Storage";
import { LOGO } from "../../../constant/imagePath";

const NotificationScreen = ({ navigation }) => {
  const [selectedTab, setSelectedTab] = useState("All");
  const [refreshing, setRefreshing] = useState(false);
  const [deleteAlertVisible, setDeleteAlertVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [allNotifications, setAllNotifications] = useState([]);
  const [hasToken, setHasToken] = useState(true);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const ITEMS_PER_PAGE = 10;

  const getCreatedAtLabel = (createdAt) => {
    if (!createdAt) return "Older";

    const createdDate = new Date(createdAt);
    if (Number.isNaN(createdDate.getTime())) return "Older";

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfCreated = new Date(
      createdDate.getFullYear(),
      createdDate.getMonth(),
      createdDate.getDate()
    );
    const dayDiff = Math.floor((startOfToday - startOfCreated) / (1000 * 60 * 60 * 24));

    if (dayDiff === 0) return "Today";
    if (dayDiff === 1) return "Yesterday";
    return "Older";
  };

  // Helper function to categorize notification type
  const categorizeNotificationType = (item) => {
    const itemType = item?.type?.toLowerCase?.() || "";
    const title = item?.title?.toLowerCase?.() || "";
    const message = item?.message?.toLowerCase?.() || "";

    // Job Available Notifications
    if (
      itemType === "job_available" ||
      itemType === "new_job_posted" ||
      itemType === "job_posted" ||
      title.includes("job posted") ||
      title.includes("new job") ||
      message.includes("job posted") ||
      message.includes("new job")
    ) {
      return "job_available";
    }

    // Applied Job Status Notifications
    if (
      itemType === "applied_job_status" ||
      itemType === "application_status" ||
      itemType === "job_application" ||
      itemType === "application_update" ||
      title.includes("applied") ||
      title.includes("application") ||
      title.includes("job status") ||
      message.includes("applied") ||
      message.includes("application")
    ) {
      return "applied_job_status";
    }

    // Chat Notifications
    if (
      itemType === "chat" ||
      itemType === "message" ||
      itemType === "chat_message" ||
      title.includes("chat") ||
      title.includes("message") ||
      message.includes("chat") ||
      message.includes("message")
    ) {
      return "chat";
    }

    // Others/Default
    return "others";
  };

  const normalizeNotificationItem = (item) => {
    const categorizedType = categorizeNotificationType(item);
    return {
      ...item,
      id: item?.id ?? item?.notification_id ?? item?._id,
      title: item?.title || "Notification",
      message: item?.message || item?.body || "",
      created_at: item?.created_at || item?.createdAt || item?.date || null,
      time: getCreatedAtLabel(item?.created_at || item?.createdAt || item?.date),
      read: Number(item?.is_read) === 1 || item?.read === true,
      type: categorizedType, // Override type with categorized value
    };
  };

  const tabs = [
    { key: "All", label: "All", icon: "bell" },
    { key: "applied_job_status", label: "Applied Job Status", icon: "briefcase-check-outline" },
    { key: "job_available", label: "Job Available", icon: "briefcase-plus-outline" },
    { key: "chat", label: "Chats", icon: "message-outline" },
    { key: "others", label: "Others", icon: "dots-horizontal" },
  ];

  useEffect(() => {
    checkLoginAndLoad();
  }, []);

  const fetchNotifications = async (id) => {
    if (!id) return;
    try {
      setRefreshing(true);
      const url = `${BASE_URL}profile/notifications/${id}`;
      const result = await GETNETWORK(url, true);
      const notificationsData = result?.data || result?.notifications || result || [];
      const notificationsArray = Array.isArray(notificationsData) ? notificationsData : [];
      const normalizedNotifications = notificationsArray.map(normalizeNotificationItem);

      setAllNotifications(normalizedNotifications);
      setNotifications(normalizedNotifications.slice(0, ITEMS_PER_PAGE));
      setPage(1);
      setHasMore(normalizedNotifications.length > ITEMS_PER_PAGE);
    } catch (error) {
      setAllNotifications([]);
      setNotifications([]);
      setHasMore(false);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const checkLoginAndLoad = async () => {
    setLoading(true);
    const loginResponse = await getObjByKey("loginResponse");
    if (!loginResponse) {
      setHasToken(false);
      setLoading(false);
      return;
    }

    setHasToken(true);
    const storedUserId = loginResponse?.user?.id
      || loginResponse?.user?._id
      || loginResponse?.user?.userId
      || loginResponse?.userId
      || loginResponse?.id
      || loginResponse?._id
      || loginResponse?.data?.user?.id
      || loginResponse?.data?.user?._id
      || loginResponse?.data?.user?.userId
      || loginResponse?.data?.userId
      || loginResponse?.data?.id
      || loginResponse?.data?._id
      || null;
    setUserId(storedUserId);

    if (!storedUserId) {
      setHasToken(false);
      setLoading(false);
      return;
    }

    await fetchNotifications(storedUserId);
  };

  const loadInitialData = async () => {
    if (!hasToken || !userId) {
      setRefreshing(false);
      return;
    }
    await fetchNotifications(userId);
  };

  const loadMore = () => {
    if (!hasMore) return;

    const nextPage = page + 1;
    const startIndex = (nextPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    const newData = allNotifications.slice(startIndex, endIndex);

    if (newData.length > 0) {
      setNotifications(prev => [...prev, ...newData]);
      setPage(nextPage);
    }

    if (endIndex >= allNotifications.length) {
      setHasMore(false);
    }
  };

  // Handle back button press
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      navigation.goBack();
      return true;
    });

    return () => backHandler.remove();
  }, [navigation]);

  // Clean up all modal and alert states when leaving the screen
  useFocusEffect(
    useCallback(() => {
      // Cleanup function when leaving the screen
      return () => {
        console.log("🧹 Cleaning up NotificationScreen states");
        setDetailsModalVisible(false);
        setDeleteAlertVisible(false);
        setSelectedNotification(null);
      };
    }, [])
  );

  const handleBackPress = () => {
    navigation.goBack();
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const filteredNotifications = selectedTab === "All"
    ? notifications
    : notifications.filter(n => n.type === selectedTab);

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setAllNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true, is_read: 1 } : n)
    );
  };

  const markNotificationAsReadOnServer = async (notificationId) => {
    if (!notificationId || !userId) return;

    try {
      const readUrl = `${BASE_URL}profile/notifications/${notificationId}/read`;
      const readResult = await PUTNETWORK(readUrl, {}, true);
      const readSuccess =
        readResult?.success === true ||
        readResult?.status === true ||
        Number(readResult?.data?.is_read) === 1 ||
        Number(readResult?.is_read) === 1;

      if (readSuccess) {
        console.log(`✅ Notification ${notificationId} marked as read successfully`);
      } else {
        console.log(`❌ Failed to mark notification ${notificationId} as read`, readResult);
      }

      const notificationsUrl = `${BASE_URL}profile/notifications/${userId}`;
      const refreshedNotifications = await GETNETWORK(notificationsUrl, true);
      const refreshedData = refreshedNotifications?.data || refreshedNotifications?.notifications || refreshedNotifications || [];
      const refreshedArray = Array.isArray(refreshedData) ? refreshedData : [];
      const normalizedRefreshed = refreshedArray.map(normalizeNotificationItem);

      setAllNotifications(normalizedRefreshed);
      setNotifications(normalizedRefreshed.slice(0, ITEMS_PER_PAGE));
      setPage(1);
      setHasMore(normalizedRefreshed.length > ITEMS_PER_PAGE);

      const unreadCountUrl = `${BASE_URL}profile/notifications/unread/count/${userId}`;
      const unreadCountResult = await GETNETWORK(unreadCountUrl, true);
      const unreadCount = unreadCountResult?.data?.count
        ?? unreadCountResult?.count
        ?? unreadCountResult?.unreadCount
        ?? unreadCountResult?.unread_count
        ?? 0;
      console.log(`🔔 Updated unread notification count: ${Number(unreadCount) || 0}`);
    } catch (error) {
      console.log(`❌ Error while marking notification ${notificationId} as read:`, error);
    }
  };

  const handleNotificationPress = (item) => {
    console.log("📌 Notification pressed - Item data:", {
      id: item.id,
      type: item.type,
      title: item.title,
      message: item.message,
    });

    // If notification is from "New Job Posted" (job_available), navigate to SeekerHome
    if (item.type === "job_available") {
      console.log("🔔 Job Available notification - Navigating to SeekerHome");
      markAsRead(item.id);
      markNotificationAsReadOnServer(item.id);
      
      // Properly clean up all states before navigation
      setDetailsModalVisible(false);
      setSelectedNotification(null);
      setDeleteAlertVisible(false);
      
      // Use InteractionManager to ensure all animations complete before navigation
      InteractionManager.runAfterInteractions(() => {
        navigation.navigate("SeekerHome", { skipProfileCheckAlert: true });
      });
      return;
    }

    // For other notifications, show the details modal
    console.log("📢 Other notification - Showing modal. Type:", item.type);
    setSelectedNotification(item);
    setDetailsModalVisible(true);
    // Mark as read when viewed
    markAsRead(item.id);
    markNotificationAsReadOnServer(item.id);
  };

  const handleDeletePress = (item) => {
    setSelectedNotification(item);
    setDeleteAlertVisible(true);
  };

  const confirmDelete = () => {
    if (selectedNotification) {
      setNotifications(prev =>
        prev.filter(n => n.id !== selectedNotification.id)
      );
      setDeleteAlertVisible(false);
      setSelectedNotification(null);
    }
  };

  if (!hasToken && !loading) {
    return (
      <>
        <StatusBar barStyle="dark-content" backgroundColor={WHITE} translucent={false} />
        <View style={styles.container}>
          <MyHeader showCenterTitle title="Notifications" />
          <View style={styles.guestContainer}>
            <MaterialCommunityIcons name="bell-off-outline" size={80} color="#4D72DC" />
            <Text style={styles.guestTitle}>Login Required</Text>
            <Text style={styles.guestDescription}>
              Please login or register to access your notifications.
            </Text>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.7}
            >
              <Text style={styles.loginButtonText}>Login / Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  }

  // Swipeable Notification Card Component
  const SwipeableNotificationCard = ({ item }) => {
    const translateX = useRef(new Animated.Value(0)).current;
    const isSwipeActive = useRef(false);

    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (evt, gestureState) => {
          // Only capture if horizontal movement is significant and rightward
          const isHorizontalSwipe = Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
          const isRightSwipe = gestureState.dx > 0;
          const isSignificantMovement = Math.abs(gestureState.dx) > 15;
          return isHorizontalSwipe && isRightSwipe && isSignificantMovement;
        },
        onPanResponderGrant: (evt, gestureState) => {
          translateX.setOffset(translateX._value);
          isSwipeActive.current = false;
        },
        onPanResponderMove: (evt, gestureState) => {
          if (gestureState.dx > 0) {
            // Only allow swiping right
            isSwipeActive.current = true;
            const swipeDistance = Math.min(gestureState.dx, 150); // Limit max swipe
            translateX.setValue(swipeDistance);
          }
        },
        onPanResponderRelease: (evt, gestureState) => {
          translateX.flattenOffset();

          if (gestureState.dx > 80 && isSwipeActive.current) {
            // Swipe right enough to trigger delete alert
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
              tension: 50,
              friction: 7,
            }).start(() => {
              // Show delete alert after animation
              handleDeletePress(item);
            });
          } else {
            // Spring back
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
              tension: 50,
              friction: 7,
            }).start();
          }
          isSwipeActive.current = false;
        },
        onPanResponderTerminate: () => {
          translateX.flattenOffset();
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
          }).start();
          isSwipeActive.current = false;
        },
      })
    ).current;

    const handleCardPress = () => {
      // Only handle press if no swipe was active
      if (!isSwipeActive.current) {
        // Reset swipe position if swiped
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }).start();
        handleNotificationPress(item);
      }
    };

    return (
      <View style={styles.swipeableContainer}>
        {/* Notification Card */}
        <Animated.View
          style={[
            styles.notificationCardAnimated,
            {
              transform: [{ translateX }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <TouchableOpacity
            style={[
              styles.notificationCard,
              item.read ? styles.readCard : styles.unreadCard,
            ]}
            onPress={handleCardPress}
            activeOpacity={0.7}
            delayPressIn={100}
          >
            <View style={styles.notificationContent}>
              <View style={[styles.iconContainer, { backgroundColor: item.color + "20" }]}>
                <MaterialCommunityIcons name={item.icon} size={24} color={item.color} />
              </View>

              <View style={styles.textContainer}>
                <Text style={[
                  styles.notificationTitle,
                  item.read ? styles.readTitle : styles.unreadTitle,
                ]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={[
                  styles.notificationMessage,
                  item.read ? styles.readMessage : styles.unreadMessage,
                ]} numberOfLines={2}>
                  {item.message}
                </Text>
                <Text style={styles.notificationTime}>{item.time}</Text>
              </View>

              {!item.read && <View style={styles.unreadDot} />}
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  const renderNotificationCard = ({ item }) => (
    <SwipeableNotificationCard item={item} />
  );

  const renderTabButton = (tab) => (
    <TouchableOpacity
      key={tab.key}
      style={[
        styles.tabButton,
        selectedTab === tab.key && styles.activeTabButton,
      ]}
      onPress={() => setSelectedTab(tab.key)}
      activeOpacity={0.7}
    >
      <MaterialCommunityIcons
        name={tab.icon}
        size={18}
        color={selectedTab === tab.key ? WHITE : BRANDCOLOR}
      />
      <Text
        style={[
          styles.tabText,
          selectedTab === tab.key && styles.activeTabText,
        ]}
      >
        {tab.label}
      </Text>
    </TouchableOpacity>
  );

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
          title="Notifications"
          onBackPress={handleBackPress}
        />

        {/* Filter Tabs */}
        <View style={styles.tabsContainer}>
          <FlatList
            horizontal
            data={tabs}
            keyExtractor={(item) => item.key}
            renderItem={({ item }) => renderTabButton(item)}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContent}
          />
        </View>

        {/* Notifications List */}
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotificationCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          scrollEnabled={true}
          nestedScrollEnabled={false}

          // ✅ ADD THESE 2 LINES
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}

          // ✅ UPDATE refresh function
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={loadInitialData} // 🔁 changed from onRefresh
              colors={[BRANDCOLOR]}
              tintColor={BRANDCOLOR}
            />
          }

          // ✅ ADD FOOTER (optional but recommended)
          ListFooterComponent={
            hasMore ? (
              <Text style={{ textAlign: "center", padding: 10 }}>
                Loading more...
              </Text>
            ) : (
              <Text style={{ textAlign: "center", padding: 10 }}>
                No more notifications
              </Text>
            )
          }

          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="bell-off-outline" size={64} color="#CCC" />
              <Text style={styles.emptyText}>No notifications yet</Text>
              <Text style={styles.emptySubtext}>
                You'll see notifications here when you get them
              </Text>
            </View>
          }
        />

        {/* Delete Alert */}
        <MyAlert
          visible={deleteAlertVisible}
          title="Delete Notification"
          message="Are you sure you want to delete this notification?"
          textLeft="Cancel"
          textRight="Delete"
          showLeftButton
          showRightButton
          onPressLeft={() => {
            setDeleteAlertVisible(false);
            setSelectedNotification(null);
          }}
          onPressRight={confirmDelete}
          onRequestClose={() => {
            setDeleteAlertVisible(false);
            setSelectedNotification(null);
          }}
        />

        {/* Notification Details Modal */}
        <Modal
          visible={detailsModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setDetailsModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalHeaderTitle}>Notification Details</Text>
                <TouchableOpacity
                  onPress={() => setDetailsModalVisible(false)}
                  style={styles.modalCloseButton}
                >
                  <MaterialCommunityIcons name="close" size={24} color={BLACK} />
                </TouchableOpacity>
              </View>

              {/* Modal Content */}
              <ScrollView
                style={styles.modalContent}
                showsVerticalScrollIndicator={false}
              >
                {selectedNotification && (
                  <>
                    {/* Icon Section */}
                    <View style={styles.modalIconSection}>
                      <View
                        style={[
                          styles.modalIconContainer,
                          { backgroundColor: selectedNotification.color + "20" },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={selectedNotification.icon}
                          size={48}
                          color={selectedNotification.color}
                        />
                      </View>
                    </View>

                    {/* Title */}
                    <Text style={styles.modalTitle}>
                      {selectedNotification.title}
                    </Text>

                    {/* Time */}
                    <View style={styles.modalTimeContainer}>
                      <MaterialCommunityIcons
                        name="clock-outline"
                        size={16}
                        color="#999"
                      />
                      <Text style={styles.modalTime}>
                        {selectedNotification.time}
                      </Text>
                    </View>

                    {/* Divider */}
                    <View style={styles.modalDivider} />

                    {/* Message */}
                    <Text style={styles.modalMessageLabel}>Message:</Text>
                    <Text style={styles.modalMessage}>
                      {selectedNotification.message}
                    </Text>

                    {/* Additional Details */}
                    <View style={styles.modalDetailsSection}>
                      <Text style={styles.modalDetailsLabel}>Type:</Text>
                      <Text style={styles.modalDetailsValue}>
                        {selectedNotification.type.replace(/_/g, " ").toUpperCase()}
                      </Text>
                    </View>

                    <View style={styles.modalDetailsSection}>
                      <Text style={styles.modalDetailsLabel}>Status:</Text>
                      <View style={styles.modalStatusContainer}>
                        <View
                          style={[
                            styles.modalStatusDot,
                            {
                              backgroundColor: selectedNotification.read
                                ? "#4CAF50"
                                : BRANDCOLOR,
                            },
                          ]}
                        />
                        <Text style={styles.modalDetailsValue}>
                          {selectedNotification.read ? "Read" : "Unread"}
                        </Text>
                      </View>
                    </View>
                  </>
                )}
              </ScrollView>

              {/* Modal Footer */}
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setDetailsModalVisible(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </Container>
    </>
  );
};

export default NotificationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  containerIOS: {
    paddingTop: Platform.OS === "ios" ? 0 : 0,
  },
  containerAndroid: {
    paddingTop: Platform.OS === "android" ? 0 : 0,
  },
  tabsContainer: {
    backgroundColor: WHITE,
    paddingVertical: HEIGHT * 0.015,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  tabsContent: {
    paddingHorizontal: WIDTH * 0.04,
    gap: WIDTH * 0.02,
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: WIDTH * 0.04,
    paddingVertical: HEIGHT * 0.01,
    borderRadius: 20,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BRANDCOLOR,
    marginRight: WIDTH * 0.02,
    gap: WIDTH * 0.015,
  },
  activeTabButton: {
    backgroundColor: BRANDCOLOR,
    borderColor: BRANDCOLOR,
  },
  tabText: {
    fontSize: HEIGHT * 0.016,
    fontFamily: FIRASANSSEMIBOLD,
    color: BRANDCOLOR,
  },
  activeTabText: {
    color: WHITE,
  },
  listContent: {
    padding: WIDTH * 0.04,
    paddingBottom: HEIGHT * 0.02,
  },
  swipeableContainer: {
    marginBottom: HEIGHT * 0.015,
    position: "relative",
    overflow: "visible",
  },
  notificationCardAnimated: {
    width: "100%",
  },
  notificationCard: {
    borderRadius: WIDTH * 0.04,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  unreadCard: {
    backgroundColor: "#E3F2FD",
    borderLeftWidth: 4,
    borderLeftColor: BRANDCOLOR,
  },
  readCard: {
    backgroundColor: "#FAFAFA",
  },
  notificationContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: WIDTH * 0.04,
  },
  iconContainer: {
    width: WIDTH * 0.12,
    height: WIDTH * 0.12,
    borderRadius: WIDTH * 0.06,
    justifyContent: "center",
    alignItems: "center",
    marginRight: WIDTH * 0.03,
  },
  textContainer: {
    flex: 1,
    marginRight: WIDTH * 0.02,
  },
  notificationTitle: {
    fontSize: HEIGHT * 0.018,
    fontFamily: CANTARELLBOLD,
    marginBottom: HEIGHT * 0.005,
  },
  unreadTitle: {
    color: BLACK,
    fontFamily: CANTARELL,
  },
  readTitle: {
    color: "#666",
    fontFamily: FIRASANS,
  },
  notificationMessage: {
    fontSize: HEIGHT * 0.016,
    marginBottom: HEIGHT * 0.005,
    lineHeight: HEIGHT * 0.022,
    fontFamily: OXYGEN,
  },
  unreadMessage: {
    color: "#444",
    fontFamily: ROBOTO,
  },
  readMessage: {
    color: "#666",
    fontFamily: ROBOTOBOLD,
  },
  notificationTime: {
    fontSize: HEIGHT * 0.014,
    color: "#999",
    fontFamily: OXYGENBOLD,
  },
  unreadDot: {
    width: WIDTH * 0.025,
    height: WIDTH * 0.025,
    borderRadius: WIDTH * 0.0125,
    backgroundColor: "#4CAF50",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: HEIGHT * 0.1,
  },
  emptyText: {
    fontSize: HEIGHT * 0.022,
    fontFamily: ROBOTOSEMIBOLD,
    color: "#666",
    marginTop: HEIGHT * 0.02,
    marginBottom: HEIGHT * 0.01,
  },
  emptySubtext: {
    fontSize: HEIGHT * 0.016,
    color: "#999",
    textAlign: "center",
    paddingHorizontal: WIDTH * 0.1,
    fontFamily: FIRASANS,
  },
  guestContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: WIDTH * 0.08,
  },
  guestTitle: {
    fontSize: HEIGHT * 0.026,
    fontFamily: UBUNTUBOLD,
    color: BLACK,
    marginTop: HEIGHT * 0.03,
    marginBottom: HEIGHT * 0.015,
  },
  guestDescription: {
    fontSize: HEIGHT * 0.017,
    color: "#666",
    textAlign: "center",
    marginBottom: HEIGHT * 0.03,
    lineHeight: HEIGHT * 0.026,
    fontFamily: UBUNTU,
  },
  loginButton: {
    backgroundColor: BRANDCOLOR,
    paddingHorizontal: WIDTH * 0.08,
    paddingVertical: HEIGHT * 0.014,
    borderRadius: WIDTH * 0.04,
  },
  loginButtonText: {
    color: WHITE,
    fontFamily: UBUNTUBOLD,
    fontSize: HEIGHT * 0.018,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: WIDTH * 0.05,
  },
  modalContainer: {
    backgroundColor: WHITE,
    borderRadius: WIDTH * 0.05,
    width: "100%",
    maxHeight: "80%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: WIDTH * 0.04,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  modalHeaderTitle: {
    fontSize: HEIGHT * 0.022,
    fontFamily: ROBOTOSEMIBOLD,
    color: BLACK,
  },
  modalCloseButton: {
    padding: WIDTH * 0.01,
  },
  modalContent: {
    padding: WIDTH * 0.05,
  },
  modalIconSection: {
    alignItems: "center",
    marginBottom: HEIGHT * 0.02,
  },
  modalIconContainer: {
    width: WIDTH * 0.2,
    height: WIDTH * 0.2,
    borderRadius: WIDTH * 0.1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: HEIGHT * 0.024,
    fontFamily: CANTARELL,
    color: BLACK,
    textAlign: "center",
    marginBottom: HEIGHT * 0.01,
  },
  modalTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: HEIGHT * 0.02,
    gap: WIDTH * 0.015,
  },
  modalTime: {
    fontSize: HEIGHT * 0.016,
    color: "#999",
    fontFamily: OXYGEN,
  },
  modalDivider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: HEIGHT * 0.02,
  },
  modalMessageLabel: {
    fontSize: HEIGHT * 0.018,
    fontFamily: FIRASANSSEMIBOLD,
    color: BLACK,
    marginBottom: HEIGHT * 0.01,
  },
  modalMessage: {
    fontSize: HEIGHT * 0.018,
    color: "#666",
    lineHeight: HEIGHT * 0.026,
    marginBottom: HEIGHT * 0.02,
  },
  modalDetailsSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: HEIGHT * 0.012,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalDetailsLabel: {
    fontSize: HEIGHT * 0.016,
    fontFamily: OXYGENBOLD,
    color: "#666",
  },
  modalDetailsValue: {
    fontSize: HEIGHT * 0.016,
    color: BLACK,
    fontFamily: ROBOTOBOLD,
  },
  modalStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: WIDTH * 0.02,
  },
  modalStatusDot: {
    width: WIDTH * 0.025,
    height: WIDTH * 0.025,
    borderRadius: WIDTH * 0.0125,
  },
  modalFooter: {
    padding: WIDTH * 0.04,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  modalButton: {
    backgroundColor: BRANDCOLOR,
    borderRadius: WIDTH * 0.03,
    paddingVertical: HEIGHT * 0.015,
    alignItems: "center",
  },
  modalButtonText: {
    fontSize: HEIGHT * 0.018,
    fontFamily: FIRASANSBOLD,
    color: WHITE,
  },
});

