import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  RefreshControl,
  FlatList,
  TextInput,
  Platform,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  BackHandler,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { MyHeader } from "../../../components/commonComponents/MyHeader";
import { BRANDCOLOR, WHITE, BLACK } from "../../../constant/color";
import { UBUNTUBOLD, UBUNTU, FIRASANSSEMIBOLD, ROBOTOSEMIBOLD, CANTARELLBOLD, FIRASANSBOLD } from "../../../constant/fontPath";
import { BASE_URL } from "../../../constant/url";
import { GETNETWORK, POSTNETWORK } from "../../../utils/Network";
import { getObjByKey } from "../../../utils/Storage";
import { ToastMessage } from "../../../components/commonComponents/ToastMessage";
import { LOGO } from "../../../constant/imagePath";
import { WIDTH, HEIGHT } from "../../../constant/config";
import { handleProfilePress } from "../../../navigations/CustomDrawerContent";

const UserChatScreen = ({ navigation, route }) => {
  const { chatId } = route?.params || {};
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const [hasToken, setHasToken] = useState(true); // Track if user has token
  const [toastMessage, setToastMessage] = useState({
    type: "",
    msg: "",
    visible: false,
  });
  const [showDropdown, setShowDropdown] = useState(false); // Dropdown menu state
  const [totalUnreadCount, setTotalUnreadCount] = useState(0); // Total unread messages count
  const [currentUserId, setCurrentUserId] = useState(null); // Current user ID for message comparison

  // Check if user has token and extract user ID
  const checkToken = useCallback(async () => {
    try {
      const token = await getObjByKey("loginResponse");
      setHasToken(!!token);
      // Extract user ID from login response
      if (token) {
        const userId = token?.user?.id || token?.user?._id || token?.user?.userId || token?.userId || token?.id || token?._id || null;
        setCurrentUserId(userId);
      }
      return !!token;
    } catch (error) {
      setHasToken(false);
      return false;
    }
  }, []);

  // Fetch chats list
  const fetchChats = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getObjByKey("loginResponse");
      if (!token) {
        setHasToken(false);
        setLoading(false);
        return;
      }
      setHasToken(true);
      
      // Extract user ID from login response
      const userId = token?.user?.id || token?.user?._id || token?.user?.userId || token?.userId || token?.id || token?._id || null;
      if (userId) {
        setCurrentUserId(userId);
      }

      // Fetch chats from chat/threads endpoint
      const url = `${BASE_URL}chat/threads`;
      const result = await GETNETWORK(url, true);

      if (result && !result.message) {
        // Handle various response structures
        const chatsData = result?.data || result?.threads || result?.chats || result?.conversations || result || [];
        const chatsArray = Array.isArray(chatsData) ? chatsData : [];
        setChats(chatsArray);
        
        // Calculate total unread count
        const totalUnread = chatsArray.reduce((sum, chat) => {
          const unread = chat.unreadCount || chat.unread_count || chat.unreadMessages || chat.unread_messages || 0;
          return sum + (typeof unread === 'number' ? unread : 0);
        }, 0);
        setTotalUnreadCount(totalUnread);
        
        // Update navigation params for tab badge
        if (navigation) {
          navigation.setParams({ unreadCount: totalUnread });
        }
      } else {
        setChats([]);
        setTotalUnreadCount(0);
        if (navigation) {
          navigation.setParams({ unreadCount: 0 });
        }
      }
    } catch (error) {
      // console.error('Error fetching chats:', error);
      setChats([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch messages for selected chat
  const fetchMessages = useCallback(async (chatId) => {
    if (!chatId) {
      setMessages([]);
      return;
    }

    try {
      // Verify token exists
      const token = await getObjByKey("loginResponse");
      if (!token) {
        // console.log('❌ UserChatScreen: No login token found for fetching messages');
        setMessages([]);
        return;
      }
      
      // Extract user ID from login response
      const userId = token?.user?.id || token?.user?._id || token?.user?.userId || token?.userId || token?.id || token?._id || null;
      if (userId) {
        setCurrentUserId(userId);
      }

      // Use chat/threads/{id}/messages endpoint with GETNETWORK, BASE_URL, and login token
      const url = `${BASE_URL}chat/threads/${chatId}/messages`;
      // console.log('📡 UserChatScreen: Fetching messages from:', url);
      // console.log('📋 UserChatScreen: Chat ID:', chatId);

      const result = await GETNETWORK(url, true);
      // console.log('📥 UserChatScreen: Messages response:', JSON.stringify(result, null, 2));

      if (result && !result.message) {
        const messagesData = result?.data || result?.messages || result || [];
        // console.log('✅ UserChatScreen: Successfully fetched messages');
        // console.log('✅ UserChatScreen: Number of messages:', messagesData.length);
        setMessages(Array.isArray(messagesData) ? messagesData : []);
      } else {
        // console.log('⚠️ UserChatScreen: No messages data or error in response');
        setMessages([]);
      }
    } catch (error) {
      // console.error('❌ UserChatScreen: Error fetching messages:', error);
      // console.error('❌ UserChatScreen: Error message:', error?.message);
      // console.error('❌ UserChatScreen: Error stack:', error?.stack);
      setMessages([]);
    }
  }, []);

  // Handle chat selection
  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
    const chatIdToFetch = chat.id || chat._id || chat.threadId;
    if (chatIdToFetch) {
      fetchMessages(chatIdToFetch);
    }
  };

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchChats();
    if (selectedChat) {
      const chatIdToFetch = selectedChat.id || selectedChat._id || selectedChat.threadId;
      if (chatIdToFetch) {
        fetchMessages(chatIdToFetch);
      }
    }
  }, [fetchChats, fetchMessages, selectedChat]);

  // Validation functions
  const containsPhoneNumber = (text) => {
    // Check for numeric phone patterns (with various formats)
    const phonePatterns = [
      /\d{10,}/g, // 10 or more consecutive digits
      /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g, // XXX-XXX-XXXX format
      /\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, // International format
      /\(\d{3}\)\s?\d{3}[-.\s]?\d{4}/g, // (XXX) XXX-XXXX
    ];

    // Check for word-based phone numbers (zero, one, two, etc.)
    const phoneWords = [
      /\b(zero|one|two|three|four|five|six|seven|eight|nine|ten)\b/gi,
      /\b(call|phone|mobile|number|contact|reach|dial)\s+me\b/gi,
      /\bmy\s+(number|phone|mobile|contact)\b/gi,
      /\b\d+\s*(zero|one|two|three|four|five|six|seven|eight|nine)\b/gi,
    ];

    // Check numeric patterns
    for (const pattern of phonePatterns) {
      if (pattern.test(text)) {
        return true;
      }
    }

    // Check word-based patterns
    for (const pattern of phoneWords) {
      if (pattern.test(text)) {
        return true;
      }
    }

    // Check for common phone number phrases
    const phonePhrases = [
      /call\s+me\s+at/gi,
      /my\s+number\s+is/gi,
      /contact\s+me\s+at/gi,
      /reach\s+me\s+at/gi,
      /dial\s+me\s+at/gi,
    ];

    for (const phrase of phonePhrases) {
      if (phrase.test(text)) {
        return true;
      }
    }

    return false;
  };

  const containsFileReference = (text) => {
    // Check for file extensions
    const fileExtensions = [
      /\.pdf\b/gi,
      /\.doc\b/gi,
      /\.docx\b/gi,
      /\.jpg\b/gi,
      /\.jpeg\b/gi,
      /\.png\b/gi,
      /\.gif\b/gi,
      /\.bmp\b/gi,
      /\.webp\b/gi,
      /\.zip\b/gi,
      /\.rar\b/gi,
    ];

    // Check for file-related keywords
    const fileKeywords = [
      /\b(pdf|document|file|image|picture|photo|attachment|upload|download)\b/gi,
      /\b(send|share|attach)\s+(file|document|image|picture|photo|pdf)\b/gi,
      /\b(here|this)\s+(is|are)\s+(my|the)\s+(file|document|image|picture|photo|pdf)\b/gi,
    ];

    for (const pattern of fileExtensions) {
      if (pattern.test(text)) {
        return true;
      }
    }

    for (const pattern of fileKeywords) {
      if (pattern.test(text)) {
        return true;
      }
    }

    return false;
  };

  const containsLocation = (text) => {
    // Check for location-related keywords
    const locationKeywords = [
      /\b(location|address|where|here|there|place|coordinates|gps|map|google\s+map|maps)\b/gi,
      /\b(lat|long|latitude|longitude)\b/gi,
      /\b(send|share|my)\s+(location|address|whereabouts)\b/gi,
      /\b(meet|meeting)\s+(at|in|near)\b/gi,
      /\b\d+\.\d+,\s*\d+\.\d+\b/g, // Coordinates like 40.7128, -74.0060
    ];

    for (const pattern of locationKeywords) {
      if (pattern.test(text)) {
        return true;
      }
    }

    return false;
  };

  const containsLink = (text) => {
    // Check for URL patterns
    const urlPatterns = [
      /https?:\/\/[^\s]+/gi, // http:// or https:// URLs
      /www\.[^\s]+/gi, // www. URLs
      /[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/[^\s]*)?/gi, // Domain patterns like example.com or example.com/path
      /bit\.ly\/[^\s]+/gi, // Bit.ly links
      /t\.co\/[^\s]+/gi, // Twitter short links
      /tinyurl\.com\/[^\s]+/gi, // TinyURL links
      /goo\.gl\/[^\s]+/gi, // Google short links
    ];

    for (const pattern of urlPatterns) {
      if (pattern.test(text)) {
        return true;
      }
    }

    // Check for common link phrases
    const linkPhrases = [
      /\b(click here|visit|check out|see more|read more|link|url|website|web site)\b/gi,
      /\b(here|this|that)\s+(link|url|website|site)\b/gi,
    ];

    for (const phrase of linkPhrases) {
      if (phrase.test(text)) {
        return true;
      }
    }

    return false;
  };

  const validateMessage = (text) => {
    if (!text || !text.trim()) {
      return { valid: false, error: "Message cannot be empty" };
    }

    if (containsPhoneNumber(text)) {
      return { valid: false, error: "Sharing phone numbers is not allowed. Please remove any phone numbers or contact information." };
    }

    if (containsFileReference(text)) {
      return { valid: false, error: "Sharing files, images, or documents is not allowed. Please remove any file references." };
    }

    if (containsLocation(text)) {
      return { valid: false, error: "Sharing locations or addresses is not allowed. Please remove any location information." };
    }

    if (containsLink(text)) {
      return { valid: false, error: "Sharing links or URLs is not allowed. Please remove any links from your message." };
    }

    return { valid: true };
  };

  // Handle report chat
  const handleReport = async (chat) => {
    const chatId = chat.id || chat._id || chat.threadId;
    if (!chatId) {
      // console.log('❌ UserChatScreen: No chat ID found for report');
      return;
    }

    try {
      setProcessingAction(true);
      const url = `${BASE_URL}chat/threads/${chatId}/report`;
      // console.log('📡 UserChatScreen: Reporting chat:', url);
      // console.log('📋 UserChatScreen: Chat ID:', chatId);

      const result = await POSTNETWORK(url, {}, true);
      // console.log('📥 UserChatScreen: Report response:', JSON.stringify(result, null, 2));

      if (result && !result.message) {
        const successMsg = result?.message || "Chat reported successfully";
        // console.log('✅ UserChatScreen: Chat reported successfully!');
        // console.log('✅ UserChatScreen: Success message:', successMsg);
        
        setToastMessage({
          type: "success",
          msg: successMsg,
          visible: true,
        });
      } else {
        const errorMsg = result?.message || result?.error || "Failed to report chat";
        // console.log('❌ UserChatScreen: Failed to report chat');
        // console.log('❌ UserChatScreen: Error message:', errorMsg);
        // console.log('❌ UserChatScreen: Full error response:', JSON.stringify(result, null, 2));
        
        setToastMessage({
          type: "error",
          msg: errorMsg,
          visible: true,
        });
      }
    } catch (error) {
      // console.error('❌ UserChatScreen: Exception during report:', error);
      // console.error('❌ UserChatScreen: Error message:', error?.message);
      // console.error('❌ UserChatScreen: Error stack:', error?.stack);
      
      setToastMessage({
        type: "error",
        msg: "An error occurred while reporting the chat",
        visible: true,
      });
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle send message
  const handleSendMessage = async () => {
    if (!selectedChat) {
      // console.log('❌ UserChatScreen: No selected chat');
      return;
    }

    // Validate message
    const validation = validateMessage(messageText);
    if (!validation.valid) {
      setToastMessage({
        type: "error",
        msg: validation.error,
        visible: true,
      });
      return;
    }

    const chatIdToSend = selectedChat.id || selectedChat._id || selectedChat.threadId;
    if (!chatIdToSend) {
      // console.log('❌ UserChatScreen: No chat ID found for sending message');
      setToastMessage({
        type: "error",
        msg: "Chat ID not found",
        visible: true,
      });
      return;
    }

    try {
      // Verify token exists
      const token = await getObjByKey("loginResponse");
      if (!token) {
        // console.log('❌ UserChatScreen: No login token found for sending message');
        setToastMessage({
          type: "error",
          msg: "Authentication required. Please login again.",
          visible: true,
        });
        return;
      }

      setSendingMessage(true);
      // Use chat/threads/{id}/messages endpoint with POSTNETWORK, BASE_URL, and login token
      const url = `${BASE_URL}chat/threads/${chatIdToSend}/messages`;
      const payload = {
        message: messageText.trim(),
      };

      // console.log('📡 UserChatScreen: Sending message to:', url);
      // console.log('📋 UserChatScreen: Chat ID:', chatIdToSend);
      // console.log('📋 UserChatScreen: Payload:', JSON.stringify(payload, null, 2));

      const result = await POSTNETWORK(url, payload, true);
      // console.log('📥 UserChatScreen: Send message response:', JSON.stringify(result, null, 2));

      if (result && !result.message) {
        const successMsg = result?.message || "Message sent successfully";
        // console.log('✅ UserChatScreen: Message sent successfully!');
        // console.log('✅ UserChatScreen: Success message:', successMsg);
        
        // Message sent successfully
        setMessageText("");
        // Refresh messages
        fetchMessages(chatIdToSend);
        // Toast message removed as per user request
      } else {
        const errorMsg = result?.message || result?.error || "Failed to send message";
        // console.log('❌ UserChatScreen: Failed to send message');
        // console.log('❌ UserChatScreen: Error message:', errorMsg);
        // console.log('❌ UserChatScreen: Full error response:', JSON.stringify(result, null, 2));
        
        setToastMessage({
          type: "error",
          msg: errorMsg,
          visible: true,
        });
      }
    } catch (error) {
      // console.error('❌ UserChatScreen: Exception during send message:', error);
      // console.error('❌ UserChatScreen: Error message:', error?.message);
      // console.error('❌ UserChatScreen: Error stack:', error?.stack);
      
      setToastMessage({
        type: "error",
        msg: "An error occurred while sending message. Please try again.",
        visible: true,
      });
    } finally {
      setSendingMessage(false);
    }
  };

  // Check token and fetch chats on mount and focus
  useFocusEffect(
    useCallback(() => {
      checkToken().then((hasTokenValue) => {
        if (hasTokenValue) {
          fetchChats();
        } else {
          setLoading(false);
        }
      });
    }, [checkToken, fetchChats])
  );

  // Auto-select chat when navigated with chatId
  useEffect(() => {
    if (chatId && chats.length > 0) {
      const chatToSelect = chats.find(
        (chat) => {
          const chatIdValue = (chat.id || chat._id || chat.threadId)?.toString();
          return chatIdValue === chatId.toString();
        }
      );
      if (chatToSelect && (!selectedChat || (selectedChat.id || selectedChat._id || selectedChat.threadId)?.toString() !== chatId.toString())) {
        // console.log('✅ UserChatScreen: Auto-selecting chat with ID:', chatId);
        handleChatSelect(chatToSelect);
      }
    }
  }, [chatId, chats]);

  // Fetch messages when chat is selected
  useEffect(() => {
    if (selectedChat) {
      const chatIdToFetch = selectedChat.id || selectedChat._id || selectedChat.threadId;
      if (chatIdToFetch) {
        fetchMessages(chatIdToFetch);
      }
    }
  }, [selectedChat, fetchMessages]);

  // Handle hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (selectedChat) {
        // If a chat is selected, go back to chat list
        setSelectedChat(null);
        setShowDropdown(false);
        return true; // Prevent default behavior
      }
      // Otherwise, allow default back navigation
      return false;
    });

    return () => backHandler.remove();
  }, [selectedChat]);

  // Update tab badge with unread count
  useEffect(() => {
    navigation.setOptions({
      tabBarBadge: totalUnreadCount > 0 ? totalUnreadCount : undefined,
    });
  }, [totalUnreadCount, navigation]);

  // Get chat status badge color for avatar icon
  const getStatusColor = (status) => {
    if (status?.toLowerCase().includes("waiting") || status?.toLowerCase().includes("pending")) {
      return "#3498DB"; // Blue
    } else if (status?.toLowerCase().includes("closed")) {
      return "#95A5A6"; // Gray
    } else if (status?.toLowerCase().includes("approved") || status?.toLowerCase().includes("active")) {
      return "#27AE60"; // Green
    }
    return "#3498DB";
  };

  // Get status badge color (green for approved, red for closed/decline)
  const getStatusBadgeColor = (status) => {
    const statusLower = status?.toLowerCase() || "";
    if (statusLower.includes("approved") || statusLower.includes("active")) {
      return "#27AE60"; // Green
    } else if (statusLower.includes("closed") || statusLower.includes("decline") || statusLower.includes("declined")) {
      return "#EF4444"; // Red
    }
    return "#3498DB"; // Blue for waiting/pending
  };

  // Check if chat is approved/active
  const isChatApproved = (chat) => {
    const status = chat?.status || "";
    return status.toLowerCase().includes("approved") || status.toLowerCase().includes("active");
  };

  const openDrawer = () => {
    // Try to open drawer
    try {
      const drawerParent = navigation.getParent("Drawer");
      if (drawerParent && typeof drawerParent.openDrawer === "function") {
        drawerParent.openDrawer();
        return;
      }
    } catch (e) {
      // Continue to next method
    }
  };

  const handleProfileIconPress = () => {
    handleProfilePress(navigation, openDrawer);
  };

  // Get last message preview for chat
  const getLastMessage = (chat) => {
    // This would ideally come from the chat object, but for now return empty
    return chat?.lastMessage || chat?.last_message || "";
  };

  // Format time for chat list
  const formatChatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return date.toLocaleDateString("en-US", { weekday: "short" });
    } else {
      return date.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit" });
    }
  };

  // Render chat list item as WhatsApp-style horizontal item
  const renderChatItem = ({ item, index }) => {
    const isSelected = selectedChat?.id === item.id || selectedChat?._id === item._id;
    const status = item.status || "Waiting for employer approval";
    const statusColor = getStatusColor(status);
    const statusBadgeColor = getStatusBadgeColor(status);
    const lastMessage = getLastMessage(item);
    const lastMessageTime = item.updatedAt || item.updated_at || item.lastMessageTime || item.last_message_time;

    // Format status text
    const formatStatusText = (status) => {
      const statusLower = status?.toLowerCase() || "";
      if (statusLower.includes("approved") || statusLower.includes("active")) {
        return "Approved";
      } else if (statusLower.includes("closed")) {
        return "Closed";
      } else if (statusLower.includes("decline") || statusLower.includes("declined")) {
        return "Declined";
      }
      return status;
    };

    // Get unread count for this chat
    const unreadCount = item.unreadCount || item.unread_count || item.unreadMessages || item.unread_messages || 0;

    return (
      <TouchableOpacity
        style={[styles.whatsappChatItem, isSelected && styles.whatsappChatItemSelected]}
        onPress={() => handleChatSelect(item)}
        activeOpacity={0.7}
      >
        <View style={styles.whatsappChatAvatar}>
          <MaterialCommunityIcons 
            name="briefcase-outline" 
            size={WIDTH * 0.06} 
            color={statusColor}
          />
        </View>
        <View style={styles.whatsappChatContent}>
          <View style={styles.whatsappChatHeaderRow}>
            <Text style={styles.whatsappChatName} numberOfLines={1}>
              {item.jobTitle || item.title || item.job_title || "Job Title"}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusBadgeColor }]}>
              <Text style={styles.statusBadgeText}>
                {formatStatusText(status)}
              </Text>
            </View>
          </View>
          {lastMessage && (
            <View style={styles.whatsappChatFooter}>
              <Text style={styles.whatsappChatPreview} numberOfLines={1}>
                {lastMessage}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Format message time for WhatsApp style
  const formatMessageTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  // Helper function to check if message is sent by current user (job seeker)
  const isMessageFromCurrentUser = useCallback((item) => {
    // Get sender type from various possible fields
    const senderType = item.senderType || item.sender_type || item.senderRole || item.sender_role || "";
    const senderTypeLower = senderType.toString().toLowerCase();
    
    // Get sender ID from various possible fields
    const senderId = item.senderId || item.sender_id || item.sender?.id || item.sender?._id || item.userId || item.user_id || item.fromUserId || item.from_user_id || null;
    
    // Check if message is sent by job seeker based on sender type
    const isSentBySeekerType = 
      senderTypeLower === "seeker" || 
      senderTypeLower === "user" ||
      senderTypeLower === "jobseeker" ||
      senderTypeLower === "job_seeker" ||
      senderTypeLower === "job-seeker";
    
    // Check if message is sent by job provider based on sender type
    const isFromProviderType = 
      senderTypeLower === "provider" || 
      senderTypeLower === "employer" ||
      senderTypeLower === "jobprovider" ||
      senderTypeLower === "job_provider" ||
      senderTypeLower === "job-provider";
    
    // Check boolean flags
    const hasOutgoingFlags = 
      item.isOutgoing === true ||
      item.isSent === true ||
      item.fromMe === true ||
      item.isFromMe === true;
    
    // Check if sender ID matches current user ID
    const senderIdMatches = currentUserId && senderId && (
      senderId.toString() === currentUserId.toString() ||
      senderId === currentUserId
    );
    
    // Final determination:
    // 1. If explicitly from provider type -> it's receiver (job provider)
    // 2. If explicitly from seeker type OR sender ID matches OR has outgoing flags -> it's sender (job seeker)
    // 3. Default to receiver (job provider) if unclear
    if (isFromProviderType) {
      return false; // From job provider (receiver)
    }
    if (isSentBySeekerType || senderIdMatches || hasOutgoingFlags) {
      return true; // From job seeker (sender)
    }
    
    // Default to receiver if we can't determine
    return false;
  }, [currentUserId]);

  // Render message item in WhatsApp style
  const renderMessage = ({ item }) => {
    // Messages sent by job seeker appear on RIGHT side with WHITE background and BLACK text
    // Messages from job provider (receiver) appear on LEFT side with GREEN background and WHITE text
    
    const isSentByUser = isMessageFromCurrentUser(item);
    
    // Extract message date from various possible fields for both sender and receiver
    const messageDate = item.createdAt || item.created_at || item.timestamp || item.time || item.date || item.sentAt || item.sent_at || item.updatedAt || item.updated_at;
    const formattedTime = formatMessageTime(messageDate);

    return (
      <View style={[styles.whatsappMessageContainer, isSentByUser ? styles.whatsappMessageContainerSent : styles.whatsappMessageContainerReceiver]}>
        {isSentByUser ? (
          <View style={styles.whatsappMessageWrapperSent}>
            <View style={styles.whatsappMessageBubbleSent}>
              <Text style={styles.whatsappMessageTextSent}>
                {item.message || item.text || item.content || ""}
              </Text>
            </View>
            {formattedTime && (
              <View style={styles.whatsappMessageTimeContainerSent}>
                <Text style={styles.whatsappMessageTimeSent}>
                  {formattedTime}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.whatsappMessageWrapperReceiver}>
            <View style={styles.whatsappMessageBubbleReceiver}>
              <Text style={styles.whatsappMessageTextReceiver}>
                {item.message || item.text || item.content || ""}
              </Text>
            </View>
            {formattedTime && (
              <View style={styles.whatsappMessageTimeContainerReceiver}>
                <Text style={styles.whatsappMessageTimeReceiver}>
                  {formattedTime}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const selectedChatStatus = selectedChat?.status || "Waiting for employer approval";
  const selectedChatApproved = isChatApproved(selectedChat);
  const statusColor = getStatusColor(selectedChatStatus);

  // Guest View - Show Login/Register button when no token
  if (!hasToken && !loading) {
    return (
      <>
        <StatusBar barStyle="dark-content" backgroundColor={WHITE} translucent={false} />
        <View style={styles.container}>
          <MyHeader
            showCenterTitle={true}
            title="Chats"
          />
          <View style={styles.guestContainer}>
            <MaterialCommunityIcons name="chat-outline" size={80} color="#4D72DC" />
            <Text style={styles.guestTitle}>Login Required</Text>
            <Text style={styles.guestDescription}>
              Please login or register to access your chats with employers.
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

  // Show chat list or full-screen chat view
  if (selectedChat) {
    // Full-screen chat view (WhatsApp style)
    return (
      <>
        <StatusBar barStyle="dark-content" backgroundColor={WHITE} translucent={false} />
        <TouchableWithoutFeedback onPress={() => setShowDropdown(false)}>
          <KeyboardAvoidingView 
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
          >
            {/* Chat Header */}
            <View style={styles.headerWrapper}>
              <MyHeader
                showBack={true}
                showCenterTitle={true}
                title={selectedChat.jobTitle || selectedChat.title || selectedChat.job_title || "Job Title"}
                onBackPress={() => {
                  setSelectedChat(null);
                  setShowDropdown(false);
                }}
                backgroundColor={WHITE}
              />
              <View style={styles.headerActions}>
                <TouchableOpacity 
                  style={styles.whatsappHeaderActionButton}
                  onPress={() => setShowDropdown(!showDropdown)}
                >
                  <MaterialCommunityIcons name="dots-vertical" size={24} color={BLACK} />
                </TouchableOpacity>
                {/* Dropdown Menu */}
                {showDropdown && (
                  <View style={styles.dropdownMenu}>
                    <TouchableOpacity 
                      style={styles.dropdownItem}
                      onPress={() => {
                        setShowDropdown(false);
                        handleReport(selectedChat);
                      }}
                      disabled={processingAction}
                    >
                      <MaterialCommunityIcons name="flag-outline" size={20} color={BLACK} style={styles.dropdownIcon} />
                      <Text style={styles.dropdownText}>Report</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

          {/* Messages Area */}
          <View style={styles.whatsappMessagesArea}>
            <FlatList
              data={messages}
              keyExtractor={(item, index) => item.id?.toString() || item._id?.toString() || index.toString()}
              renderItem={renderMessage}
              contentContainerStyle={[
                styles.whatsappMessagesContainer,
                messages.length === 0 && { flexGrow: 1, justifyContent: 'center' }
              ]}
              style={styles.flatListStyle}
              showsVerticalScrollIndicator={true}
              scrollEnabled={true}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              removeClippedSubviews={false}
              bounces={true}
              overScrollMode="auto"
              ListEmptyComponent={
                <View style={styles.emptyMessagesContainer}>
                  <Text style={styles.emptyMessagesText}>No messages yet</Text>
                </View>
              }
              inverted={false}
            />
          </View>

          {/* Message Input Area */}
          {selectedChatApproved ? (
            <View style={styles.whatsappInputContainer}>
              <View style={styles.whatsappInputWrapper}>
                <TextInput
                  style={styles.whatsappInput}
                  placeholder="Enter Your Message"
                  placeholderTextColor="#999"
                  value={messageText}
                  onChangeText={setMessageText}
                  multiline
                  maxLength={1000}
                />
              </View>
              <TouchableOpacity 
                style={[styles.whatsappSendButton, (!messageText.trim() || sendingMessage) && styles.whatsappSendButtonDisabled]}
                onPress={handleSendMessage}
                disabled={sendingMessage || !messageText.trim()}
              >
                {sendingMessage ? (
                  <ActivityIndicator size="small" color={WHITE} />
                ) : (
                  <MaterialCommunityIcons name="send" size={20} color={WHITE} />
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.disabledInputContainer}>
              <Text style={styles.disabledInputText}>
                Once the employer approves your request, you can exchange messages here.
              </Text>
            </View>
          )}

          {/* Toast Message */}
          <ToastMessage
            message={toastMessage.msg}
            visible={toastMessage.visible}
            setVisible={({ visible }) =>
              setToastMessage((prev) => ({ ...prev, visible }))
            }
            bacgroundColor={toastMessage.type === "success" ? "green" : "red"}
            textColor={WHITE}
            type={toastMessage.type}
            duration={3000}
            image={LOGO}
          />
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </>
    );
  }

  // Chat list view (WhatsApp style)
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={WHITE} translucent={false} />
      <View style={styles.container}>
        {/* Header */}
        <MyHeader
          showCenterTitle={true}
          title="Chats"
          backgroundColor={WHITE}
        />

        {/* Chat List */}
        <FlatList
          data={chats}
          keyExtractor={(item, index) => item.id?.toString() || item._id?.toString() || index.toString()}
          renderItem={renderChatItem}
          contentContainerStyle={styles.whatsappChatList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[BRANDCOLOR]}
              tintColor={BRANDCOLOR}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="chat-outline" size={64} color="#999" />
              <Text style={styles.emptyText}>No chats available</Text>
            </View>
          }
        />

        {/* Toast Message */}
        <ToastMessage
          message={toastMessage.msg}
          visible={toastMessage.visible}
          setVisible={({ visible }) =>
            setToastMessage((prev) => ({ ...prev, visible }))
          }
          bacgroundColor={toastMessage.type === "success" ? "green" : "red"}
          textColor={WHITE}
          type={toastMessage.type}
          duration={3000}
          image={LOGO}
        />
      </View>
    </>
  );
};

export default UserChatScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WHITE,
  },
  // Header Wrapper Styles
  headerWrapper: {
    backgroundColor: WHITE,
    position: "relative",
  },
  headerActions: {
    position: "absolute",
    right: 10,
    top: Platform.OS === "android" ? Math.max((StatusBar.currentHeight || 0) + 4, 10) : 10,
    zIndex: 1,
  },
  whatsappListHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  whatsappHeaderIconButton: {
    marginLeft: WIDTH * 0.05,
    padding: 4,
  },
  whatsappSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: WHITE,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
  },
  whatsappSearchIcon: {
    marginRight: 8,
  },
  whatsappSearchInput: {
    flex: 1,
    fontSize: 14,
    color: BLACK,
    padding: 0,
  },
  // Simple Chat List Item Styles
  whatsappChatList: {
    paddingBottom: Platform.OS === "ios" ? HEIGHT * 0.1 : HEIGHT * 0.15,
  },
  whatsappChatItem: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: WHITE,
  },
  whatsappChatItemSelected: {
    backgroundColor: WHITE,
  },
  whatsappChatAvatar: {
    width: WIDTH * 0.13,
    height: WIDTH * 0.13,
    borderRadius: WIDTH * 0.065,
    backgroundColor: "#F8F8F8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  whatsappChatContent: {
    flex: 1,
    justifyContent: "center",
  },
  whatsappChatHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  whatsappChatName: {
    fontSize: 16,
    fontWeight: "500",
    color: BLACK,
    flex: 1,
  },
  whatsappChatFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  whatsappChatPreview: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontFamily: FIRASANSSEMIBOLD,
    color: WHITE,
    textTransform: "uppercase",
  },
  whatsappHeaderActionButton: {
    padding: 8,
    marginLeft: 8,
  },
  // Dropdown Menu Styles
  dropdownMenu: {
    position: "absolute",
    top: 45,
    right: 0,
    backgroundColor: WHITE,
    borderRadius: 8,
    minWidth: 120,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    zIndex: 1000,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E0E0E0",
  },
  dropdownIcon: {
    marginRight: 12,
  },
  dropdownText: {
    fontSize: 14,
    color: BLACK,
    fontFamily: FIRASANSSEMIBOLD,
  },
  // Simple Messages Area Styles
  whatsappMessagesArea: {
    flex: 1,
    backgroundColor: WHITE,
    minHeight: 0,
  },
  flatListStyle: {
    flex: 1,
    minHeight: 0,
  },
  whatsappMessagesContainer: {
    padding: 10,
    paddingBottom: 20,
  },
  whatsappMessageContainer: {
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  whatsappMessageContainerSent: {
    justifyContent: "flex-end",
  },
  whatsappMessageContainerReceiver: {
    justifyContent: "flex-start",
  },
  whatsappMessageWrapperSent: {
    maxWidth: "75%",
    alignItems: "flex-end",
  },
  whatsappMessageWrapperReceiver: {
    maxWidth: "75%",
    alignItems: "flex-start",
  },
  whatsappMessageBubbleSent: {
    backgroundColor: WHITE, // White background for sender (job seeker)
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  whatsappMessageBubbleReceiver: {
    backgroundColor: "#25D366", // Green background for receiver (job provider)
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 8,
  },
  whatsappMessageTextSent: {
    fontSize: 15,
    color: BLACK, // Black text for sender (white background)
    lineHeight: 20,
  },
  whatsappMessageTextReceiver: {
    fontSize: 15,
    color: WHITE, // White text for receiver (green background)
    lineHeight: 20,
  },
  whatsappMessageTimeContainerSent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 4,
    paddingRight: 4,
  },
  whatsappMessageTimeContainerReceiver: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: 4,
    paddingLeft: 4,
  },
  whatsappMessageTimeSent: {
    fontSize: 11,
    color: "#999", // Gray text for sender (white background)
  },
  whatsappMessageTimeReceiver: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.8)", // White text for receiver (green background)
  },
  whatsappMessageCheck: {
    marginLeft: 4,
  },
  // Simple Input Area Styles
  whatsappInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: WHITE,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  whatsappInputWrapper: {
    flex: 1,
    backgroundColor: WHITE,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 12,
    minHeight: 50,
    maxHeight: 120,
  },
  whatsappInput: {
    fontSize: 15,
    color: BLACK,
    padding: 0,
    maxHeight: 84,
  },
  whatsappInputIconButton: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  whatsappSendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4D72DC",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 4,
  },
  whatsappSendButtonDisabled: {
    opacity: 0.5,
  },
  // Common Styles
  disabledInputContainer: {
    padding: 16,
    backgroundColor: "#FFF3E0",
    borderTopWidth: 0.5,
    borderTopColor: "#E0E0E0",
  },
  disabledInputText: {
    fontSize: 14,
    color: "#E65100",
    textAlign: "center",
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: HEIGHT * 0.2,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    marginTop: 16,
  },
  emptyMessagesContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: HEIGHT * 0.2,
  },
  emptyMessagesText: {
    fontSize: 16,
    color: "#999",
  },
  guestContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: WIDTH * 0.08,
    backgroundColor: WHITE,
  },
  guestTitle: {
    fontSize: WIDTH * 0.06,
    fontFamily: UBUNTUBOLD,
    color: BLACK,
    marginTop: WIDTH * 0.05,
    marginBottom: WIDTH * 0.02,
  },
  guestDescription: {
    fontSize: WIDTH * 0.038,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: WIDTH * 0.08,
    paddingHorizontal: WIDTH * 0.05,
  },
  loginButton: {
    backgroundColor: "#4D72DC",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
    minWidth: 200,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  loginButtonText: {
    color: WHITE,
    fontSize: WIDTH * 0.04,
    fontFamily: FIRASANSSEMIBOLD,
  },
});