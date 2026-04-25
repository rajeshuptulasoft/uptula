import React, { useState, useCallback, useEffect, useMemo } from "react";
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
  Image,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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

const buildLogoUri = (raw) => {
  if (!raw || typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s) return null;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  return `${BASE_URL.replace("/api/", "/")}${s.replace(/^\//, "")}`;
};

const UserChatScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { chatId } = route?.params || {};
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const [hasToken, setHasToken] = useState(true);
  const [toastMessage, setToastMessage] = useState({
    type: "",
    msg: "",
    visible: false,
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [activeTab, setActiveTab] = useState("All");
  const [searchText, setSearchText] = useState("");
  const [selectedCompanyKey, setSelectedCompanyKey] = useState(null);

  const uniqueCompanies = useMemo(() => {
    const map = new Map();
    chats.forEach((chat) => {
      const name = (
        chat.companyName ||
        chat.company_name ||
        chat.employerName ||
        chat.employer_name ||
        ""
      ).trim();
      if (!name) return;
      const key = name.toLowerCase();
      const rawLogo =
        chat.companyLogo ||
        chat.company_logo ||
        chat.logoUrl ||
        chat.logo ||
        chat.employerLogo ||
        chat.employer_logo ||
        (chat.company && (chat.company.logo || chat.company.logoUrl)) ||
        "";
      const logoUri = buildLogoUri(typeof rawLogo === "string" ? rawLogo : "");
      const prev = map.get(key);
      if (!prev) {
        map.set(key, { key, name, logoUri });
      } else if (!prev.logoUri && logoUri) {
        prev.logoUri = logoUri;
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [chats]);

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

  // ── Get initials from name ───────────────────────────────────────────────
  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name[0].toUpperCase();
  };

  // ── Get avatar color based on name ────────────────────────────────────────
  const getAvatarColor = (name) => {
    const colors = [
      "#4F6EF7", // Blue
      "#00D4FF", // Cyan
      "#FF6B35", // Orange
      "#9D4EDD", // Purple
      "#3A86FF", // Bright Blue
      "#06D6A0", // Teal
      "#EF476F", // Pink
    ];
    let hash = 0;
    if (name) {
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // ── Filter and search chats ──────────────────────────────────────────────
  const getFilteredChats = () => {
    let filtered = chats;

    if (activeTab !== "All") {
      if (activeTab === "Applied") {
        filtered = filtered.filter((chat) => {
          const status = (chat.status || "").toLowerCase();
          return status.includes("approved") || status.includes("active");
        });
      } else if (activeTab === "Rejected") {
        filtered = filtered.filter((chat) => {
          const s = (
            chat.status ||
            chat.applicationStatus ||
            chat.application_status ||
            ""
          ).toLowerCase();
          return s.includes("reject") || s.includes("declin") || s.includes("closed");
        });
      }
    }

    if (selectedCompanyKey) {
      filtered = filtered.filter((chat) => {
        const name = (
          chat.companyName ||
          chat.company_name ||
          chat.employerName ||
          chat.employer_name ||
          ""
        )
          .trim()
          .toLowerCase();
        return name === selectedCompanyKey;
      });
    }

    if (searchText.trim()) {
      const lowerSearch = searchText.toLowerCase();
      filtered = filtered.filter((chat) => {
        const title = (chat.jobTitle || chat.title || chat.job_title || "").toLowerCase();
        const company = (
          chat.companyName ||
          chat.company_name ||
          chat.employerName ||
          ""
        ).toLowerCase();
        return title.includes(lowerSearch) || company.includes(lowerSearch);
      });
    }

    return filtered;
  };

  // ── Separate pinned and recent chats ──────────────────────────────────────
  const getPinnedAndRecentChats = () => {
    const filtered = getFilteredChats();
    const pinned = filtered.filter((chat) => chat.isPinned || chat.is_pinned);
    const recent = filtered.filter((chat) => !chat.isPinned && !chat.is_pinned);
    return { pinned, recent };
  };

  // ── Get category counts ──────────────────────────────────────────────────
  const getCategoryCounts = () => {
    const all = chats.length;
    const applied = chats.filter((c) => {
      const status = (c.status || "").toLowerCase();
      return status.includes("approved") || status.includes("active");
    }).length;
    const rejected = chats.filter((c) => {
      const s = (c.status || c.applicationStatus || c.application_status || "").toLowerCase();
      return s.includes("reject") || s.includes("declin") || s.includes("closed");
    }).length;
    return { all, applied, rejected };
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

  const getLastMessage = (chat) => {
    const lm = chat?.lastMessage || chat?.last_message;
    if (typeof lm === "string") return lm;
    if (lm && typeof lm === "object") {
      return lm.text || lm.message || lm.content || lm.body || "";
    }
    return chat?.lastMessageText || chat?.last_message_text || chat?.preview || "";
  };

  const formatChatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";
    const now = new Date();
    const diffMs = now - date;
    if (diffMs < 0) return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    const diffM = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMs / 3600000);
    const sameDay = date.toDateString() === now.toDateString();
    if (diffM < 1) return "Now";
    if (diffM < 60 && sameDay) return `${diffM}m`;
    if (diffH < 24 && sameDay) return `${diffH}h`;
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (days < 7) return date.toLocaleDateString("en-US", { weekday: "short" });
    return date.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit" });
  };

  const renderChatItem = ({ item }) => {
    const isSelected = selectedChat?.id === item.id || selectedChat?._id === item._id;
    const status = item.status || "Waiting for employer approval";
    const statusBadgeColor = getStatusBadgeColor(status);
    const lastMessage = getLastMessage(item);
    const lastMessageTime =
      item.updatedAt ||
      item.updated_at ||
      item.lastMessageTime ||
      item.last_message_time ||
      item.createdAt ||
      item.created_at;
    const jobTitle = item.jobTitle || item.title || item.job_title || "Role";
    const companyName =
      item.companyName ||
      item.company_name ||
      item.employerName ||
      item.employer_name ||
      "Employer";
    const rawLogo =
      item.companyLogo ||
      item.company_logo ||
      item.logoUrl ||
      item.logo ||
      item.employerLogo ||
      item.employer_logo ||
      "";
    const logoUri = buildLogoUri(typeof rawLogo === "string" ? rawLogo : "");
    const initials = getInitials(companyName);
    const avatarColor = getAvatarColor(companyName);
    const unreadCount =
      item.unreadCount || item.unread_count || item.unreadMessages || item.unread_messages || 0;
    const isCard = item.listSection === "recent";
    const online =
      item.isOnline === true ||
      item.online === true ||
      String(item.presence || "").toLowerCase() === "online";

    const formatStatusText = (st) => {
      const statusLower = st?.toLowerCase() || "";
      if (statusLower.includes("approved") || statusLower.includes("active")) {
        return "Approved";
      }
      if (statusLower.includes("closed")) return "Closed";
      if (statusLower.includes("decline") || statusLower.includes("declined")) return "Declined";
      return "Pending";
    };

    return (
      <TouchableOpacity
        style={[
          styles.chatItem,
          isCard && styles.chatItemCard,
          isSelected && styles.chatItemSelected,
        ]}
        onPress={() => handleChatSelect(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarWrap}>
          {logoUri ? (
            <Image
              source={{ uri: logoUri }}
              style={styles.companyAvatarImg}
              defaultSource={LOGO}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
          <View
            style={[
              styles.presenceDot,
              { backgroundColor: online ? "#22C55E" : "#9CA3AF" },
            ]}
          />
        </View>

        <View style={styles.chatContent}>
          <View style={styles.chatItemTopRow}>
            <Text style={styles.chatTitle} numberOfLines={1}>
              {companyName}
            </Text>
            <Text style={styles.chatTime}>{formatChatTime(lastMessageTime)}</Text>
          </View>
          <View style={styles.chatSubtitle}>
            <Text style={styles.jobTitleAccent} numberOfLines={1}>
              {jobTitle}
            </Text>
          </View>
          {lastMessage ? (
            <Text style={styles.lastMessagePreview} numberOfLines={1}>
              {lastMessage}
            </Text>
          ) : null}
          {statusBadgeColor ? (
            <View style={styles.statusBadgeRow}>
              <View style={[styles.statusDot, { backgroundColor: statusBadgeColor }]} />
              <Text style={[styles.statusBadgeText, { color: statusBadgeColor }]}>
                {formatStatusText(status)}
              </Text>
            </View>
          ) : null}
        </View>

        {unreadCount > 0 ? (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
          </View>
        ) : null}
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

  const activeConversationCount = chats.filter((c) => {
    const s = (c.status || "").toLowerCase();
    return s.includes("approved") || s.includes("active");
  }).length;

  // Chat list view
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={BRANDCOLOR} translucent={false} />
      <View style={styles.container}>
        <View style={[styles.messagesBrandHeader, { paddingTop: insets.top + 12 }]}>
          <Text style={styles.messagesBrandTitle}>Messages</Text>
          <Text style={styles.messagesBrandSubtitle}>
            {activeConversationCount} active conversation{activeConversationCount === 1 ? "" : "s"}
          </Text>
        </View>

        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations…"
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
          />
          <TouchableOpacity
            style={styles.searchFilterBtn}
            onPress={() => setSelectedCompanyKey(null)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons name="tune-variant" size={22} color={BRANDCOLOR} />
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsContainer}
          contentContainerStyle={styles.tabsContent}
        >
          {(() => {
            const counts = getCategoryCounts();
            return (
              <>
                <TouchableOpacity
                  style={[
                    styles.tab,
                    activeTab === "All" && styles.tabActive,
                  ]}
                  onPress={() => setActiveTab("All")}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === "All" && styles.tabTextActive,
                    ]}
                  >
                    All
                  </Text>
                  <View
                    style={[
                      styles.tabBadge,
                      activeTab === "All" && styles.tabBadgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabBadgeText,
                        activeTab === "All" && styles.tabBadgeTextActive,
                      ]}
                    >
                      {counts.all}
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.tab,
                    activeTab === "Applied" && styles.tabActive,
                  ]}
                  onPress={() => setActiveTab("Applied")}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === "Applied" && styles.tabTextActive,
                    ]}
                  >
                    Applied
                  </Text>
                  <View
                    style={[
                      styles.tabBadge,
                      activeTab === "Applied" && styles.tabBadgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabBadgeText,
                        activeTab === "Applied" && styles.tabBadgeTextActive,
                      ]}
                    >
                      {counts.applied}
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.tab,
                    activeTab === "Rejected" && styles.tabActive,
                  ]}
                  onPress={() => setActiveTab("Rejected")}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === "Rejected" && styles.tabTextActive,
                    ]}
                  >
                    Rejected
                  </Text>
                  <View
                    style={[
                      styles.tabBadge,
                      activeTab === "Rejected" && styles.tabBadgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabBadgeText,
                        activeTab === "Rejected" && styles.tabBadgeTextActive,
                      ]}
                    >
                      {counts.rejected}
                    </Text>
                  </View>
                </TouchableOpacity>
              </>
            );
          })()}
        </ScrollView>

        {uniqueCompanies.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesContainer}
            contentContainerStyle={styles.categoriesContent}
          >
            {uniqueCompanies.map((co) => {
              const selected = selectedCompanyKey === co.key;
              const initials = getInitials(co.name);
              const fallbackColor = getAvatarColor(co.name);
              return (
                <TouchableOpacity
                  key={co.key}
                  style={[styles.categoryAvatar, selected && styles.categoryAvatarSelected]}
                  onPress={() =>
                    setSelectedCompanyKey((prev) => (prev === co.key ? null : co.key))
                  }
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.categoryCircle,
                      selected && styles.categoryCircleSelected,
                    ]}
                  >
                    {co.logoUri ? (
                      <Image
                        source={{ uri: co.logoUri }}
                        style={styles.categoryLogoImage}
                        defaultSource={LOGO}
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        style={[
                          styles.categoryInitialsFill,
                          { backgroundColor: fallbackColor },
                        ]}
                      >
                        <Text style={styles.categoryInitial}>{initials.slice(0, 2)}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.categoryLabel} numberOfLines={1}>
                    {co.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : null}

        {/* Chat List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={BRANDCOLOR} />
          </View>
        ) : (
          (() => {
            const { pinned, recent } = getPinnedAndRecentChats();
            const flatListData = [];

            if (pinned.length > 0) {
              flatListData.push({ type: "header", label: "PINNED" });
              flatListData.push(
                ...pinned.map((chat) => ({ ...chat, type: "chat", listSection: "pinned" }))
              );
            }

            if (recent.length > 0) {
              flatListData.push({ type: "header", label: "RECENT" });
              flatListData.push(
                ...recent.map((chat) => ({ ...chat, type: "chat", listSection: "recent" }))
              );
            }

            return (
              <FlatList
                data={flatListData.length > 0 ? flatListData : []}
                keyExtractor={(item, index) => {
                  if (item.type === "header") return `header-${item.label}`;
                  return item.id?.toString() || item._id?.toString() || index.toString();
                }}
                renderItem={({ item }) => {
                  if (item.type === "header") {
                    return (
                      <View style={styles.sectionHeader}>
                        <Text style={styles.sectionHeaderText}>{item.label}</Text>
                      </View>
                    );
                  }
                  return renderChatItem({ item });
                }}
                contentContainerStyle={styles.chatListContent}
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
            );
          })()
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
      </View>
    </>
  );
};

export default UserChatScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },

  messagesBrandHeader: {
    backgroundColor: BRANDCOLOR,
    paddingHorizontal: 20,
    paddingBottom: 18,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  messagesBrandTitle: {
    fontSize: 26,
    fontFamily: FIRASANSBOLD,
    color: WHITE,
  },
  messagesBrandSubtitle: {
    marginTop: 4,
    fontSize: 14,
    fontFamily: UBUNTU,
    color: "rgba(255,255,255,0.9)",
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: WHITE,
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 0,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    fontFamily: UBUNTU,
    color: BLACK,
    paddingVertical: 0,
  },
  searchFilterBtn: {
    paddingLeft: 8,
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Tabs ────────────────────────────────────────────────────────────────
  tabsContainer: {
    backgroundColor: "#F7F8FA",
    paddingHorizontal: 8,
    paddingBottom: 0,
    marginTop: 0,
  },
  tabsContent: {
    paddingHorizontal: 8,
    alignItems: "center",
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginRight: 4,
    backgroundColor: WHITE,
  },
  tabActive: {
    backgroundColor: WHITE,
    borderColor: BRANDCOLOR,
    borderWidth: 1,
  },
  tabText: {
    fontSize: 13,
    fontFamily: FIRASANSSEMIBOLD,
    color: "#666",
    marginRight: 6,
  },
  tabTextActive: {
    color: BRANDCOLOR,
  },
  tabBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 2,
  },
  tabBadgeActive: {
    backgroundColor: BRANDCOLOR,
  },
  tabBadgeText: {
    fontSize: 11,
    fontFamily: FIRASANSSEMIBOLD,
    color: "#666",
  },
  tabBadgeTextActive: {
    color: WHITE,
  },

  // ── Categories ──────────────────────────────────────────────────────────
  categoriesContainer: {
    backgroundColor: "#F7F8FA",
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxHeight: 100,
  },
  categoriesContent: {
    paddingHorizontal: 8,
    alignItems: "flex-start",
  },
  categoryAvatar: {
    alignItems: "center",
    marginRight: 16,
    maxWidth: 76,
  },
  categoryAvatarSelected: {
    opacity: 1,
  },
  categoryCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: "#E8E8E8",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  categoryCircleSelected: {
    borderWidth: 3,
    borderColor: BRANDCOLOR,
  },
  categoryLogoImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  categoryInitialsFill: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryInitial: {
    fontSize: 18,
    fontFamily: FIRASANSBOLD,
    color: WHITE,
  },
  categoryLabel: {
    fontSize: 11,
    fontFamily: UBUNTU,
    color: "#444",
    textAlign: "center",
    marginTop: 6,
    maxWidth: 72,
  },

  // ── Chat List ───────────────────────────────────────────────────────────
  chatListContent: {
    paddingBottom: 24,
    paddingTop: 4,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "transparent",
  },
  sectionHeaderText: {
    fontSize: 12,
    fontFamily: FIRASANSSEMIBOLD,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: "#ECECEC",
  },
  chatItemCard: {
    marginHorizontal: 12,
    marginVertical: 6,
    paddingVertical: 14,
    borderRadius: 16,
    borderBottomWidth: 0,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  chatItemSelected: {
    borderColor: BRANDCOLOR,
    backgroundColor: "#FAFFFC",
  },
  avatarWrap: {
    position: "relative",
    marginRight: 12,
  },
  companyAvatarImg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F0F0F0",
  },
  presenceDot: {
    position: "absolute",
    right: 2,
    bottom: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: WHITE,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  avatarText: {
    fontSize: 20,
    fontFamily: FIRASANSBOLD,
    color: WHITE,
  },
  chatContent: {
    flex: 1,
    minWidth: 0,
  },
  chatItemTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  chatTitle: {
    fontSize: 16,
    fontFamily: FIRASANSBOLD,
    color: "#1a2744",
    flex: 1,
    marginRight: 8,
  },
  chatTime: {
    fontSize: 13,
    fontFamily: UBUNTU,
    color: "#999",
  },
  chatSubtitle: {
    marginBottom: 2,
  },
  jobTitleAccent: {
    fontSize: 13,
    fontFamily: FIRASANSSEMIBOLD,
    color: BRANDCOLOR,
  },
  lastMessagePreview: {
    fontSize: 13,
    fontFamily: UBUNTU,
    color: "#64748B",
    marginTop: 4,
    marginBottom: 2,
  },
  statusBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontFamily: FIRASANSSEMIBOLD,
    textTransform: "capitalize",
  },
  unreadBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: BRANDCOLOR,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  unreadBadgeText: {
    fontSize: 12,
    fontFamily: FIRASANSBOLD,
    color: WHITE,
  },

  // ── Loading ─────────────────────────────────────────────────────────────
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Empty State ─────────────────────────────────────────────────────────
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
    fontFamily: UBUNTU,
  },

  // ── Chat Detail View ────────────────────────────────────────────────────
  headerWrapper: {
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  headerActions: {
    position: "absolute",
    right: 16,
    top: Platform.OS === "android" ? Math.max((StatusBar.currentHeight || 0) + 8, 8) : 16,
    flexDirection: "row",
    alignItems: "center",
  },
  whatsappHeaderActionButton: {
    padding: 8,
    marginLeft: 8,
  },
  dropdownMenu: {
    position: "absolute",
    top: 50,
    right: 0,
    backgroundColor: WHITE,
    borderRadius: 8,
    minWidth: 140,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    zIndex: 1000,
    overflow: "hidden",
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

  // ── Messages Area ───────────────────────────────────────────────────────
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
    padding: 12,
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
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderBottomRightRadius: 4,
  },
  whatsappMessageBubbleReceiver: {
    backgroundColor: BRANDCOLOR,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
  },
  whatsappMessageTextSent: {
    fontSize: 15,
    color: BLACK,
    lineHeight: 20,
    fontFamily: UBUNTU,
  },
  whatsappMessageTextReceiver: {
    fontSize: 15,
    color: WHITE,
    lineHeight: 20,
    fontFamily: UBUNTU,
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
    color: "#999",
    fontFamily: UBUNTU,
  },
  whatsappMessageTimeReceiver: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    fontFamily: UBUNTU,
  },
  whatsappMessageCheck: {
    marginLeft: 4,
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
    fontFamily: UBUNTU,
  },

  // ── Input Area ──────────────────────────────────────────────────────────
  whatsappInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: WHITE,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  whatsappInputWrapper: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    minHeight: 44,
    maxHeight: 100,
    justifyContent: "center",
  },
  whatsappInput: {
    fontSize: 15,
    color: BLACK,
    padding: 0,
    fontFamily: UBUNTU,
    maxHeight: 80,
  },
  whatsappSendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BRANDCOLOR,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  whatsappSendButtonDisabled: {
    opacity: 0.5,
  },
  whatsappInputIconButton: {
    padding: 8,
  },
  disabledInputContainer: {
    padding: 16,
    backgroundColor: "#FFF3E0",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  disabledInputText: {
    fontSize: 14,
    color: "#E65100",
    textAlign: "center",
    lineHeight: 20,
    fontFamily: UBUNTU,
  },

  // ── Guest/Login ────────────────────────────────────────────────────────
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
    fontFamily: UBUNTU,
  },
  loginButton: {
    backgroundColor: BRANDCOLOR,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 24,
    minWidth: 200,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: BRANDCOLOR,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  loginButtonText: {
    color: WHITE,
    fontSize: WIDTH * 0.04,
    fontFamily: FIRASANSSEMIBOLD,
  },
});