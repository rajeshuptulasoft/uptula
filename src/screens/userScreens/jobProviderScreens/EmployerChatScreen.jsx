import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Pressable,
  Modal,
  RefreshControl,
  FlatList,
  TextInput,
  Platform,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  BackHandler,
  Animated,
  Image,
  ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { BRANDCOLOR, WHITE } from "../../../constant/color";
import { BASE_URL } from "../../../constant/url";
import {
  UBUNTUBOLD,
  UBUNTU,
  FIRASANSSEMIBOLD,
  ROBOTOSEMIBOLD,
  CANTARELLBOLD,
  FIRASANSBOLD,
} from "../../../constant/fontPath";
import { GETNETWORK, POSTNETWORK } from "../../../utils/Network";
import { getObjByKey } from "../../../utils/Storage";
import { WIDTH, HEIGHT } from "../../../constant/config";
import { ToastMessage } from "../../../components/commonComponents/ToastMessage";
import { LOGO } from "../../../constant/imagePath";

// ─── Design tokens ───────────────────────────────────────────────────────────
const COLORS = {
  primary: "#4F6EF7",
  primaryLight: "#EEF1FE",
  primaryDark: "#3A56D4",
  sent: "#4F6EF7",          // Sender bubble (employer)
  sentText: "#FFFFFF",
  received: "#F0F2F5",      // Receiver bubble (job seeker)
  receivedText: "#1A1A2E",
  bg: "#F7F8FC",
  surface: "#FFFFFF",
  border: "#E8EAED",
  textPrimary: "#1A1A2E",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  success: "#10B981",
  danger: "#EF4444",
  warning: "#F59E0B",
  avatarBg: "#EEF1FE",
  pendingDot: "#F59E0B",
  activeDot: "#10B981",
  headerBg: "#FFFFFF",
  inputBg: "#F0F2F5",
  shadow: "rgba(79, 110, 247, 0.12)",
};

const RADII = {
  bubble: 18,
  bubbleTail: 4,
  input: 24,
  avatar: 22,
  badge: 10,
  card: 16,
  button: 22,
};
// ─────────────────────────────────────────────────────────────────────────────

const AVATAR_PALETTE = ["#6366F1", "#EC4899", "#F97316", "#8B5CF6", "#0EA5E9", "#14B8A6", "#E11D48"];

const getAvatarBgColor = (name) => {
  const s = (name || "?").toString();
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = s.charCodeAt(i) + ((h << 5) - h);
  }
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
};

const getThreadStatusCategory = (item) => {
  const status = (item?.status || "").toLowerCase();
  if (status.includes("reject") || status.includes("declin")) return "rejected";
  if (status.includes("approved") || status.includes("active")) return "approved";
  return "pending";
};

const getJobTitleForThread = (item) =>
  item?.jobTitle ||
  item?.job_title ||
  item?.position ||
  item?.jobName ||
  item?.job?.title ||
  item?.job?.job_title ||
  "";

const formatListThreadTime = (item) => {
  const raw =
    item?.updatedAt ||
    item?.updated_at ||
    item?.lastMessageAt ||
    item?.last_message_at ||
    item?.lastMessageTime ||
    item?.createdAt ||
    item?.created_at ||
    "";
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  }
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const EmployerChatScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeChats, setActiveChats] = useState([]);
  const [rejectedChats, setRejectedChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const [toastMessage, setToastMessage] = useState({
    type: "",
    msg: "",
    visible: false,
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownAnchor, setDropdownAnchor] = useState(null);
  const moreButtonRef = useRef(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [activeTab, setActiveTab] = useState("All");
  const [searchText, setSearchText] = useState("");

  // Animated send button scale
  const sendScale = useRef(new Animated.Value(1)).current;

  const animateSend = () => {
    Animated.sequence([
      Animated.spring(sendScale, { toValue: 0.88, useNativeDriver: true, speed: 40 }),
      Animated.spring(sendScale, { toValue: 1, useNativeDriver: true, speed: 40 }),
    ]).start();
  };

  // ── All original logic below (UNCHANGED) ────────────────────────────────

  const fetchChatThreads = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getObjByKey("loginResponse");
      if (!token) {
        setLoading(false);
        return;
      }

      const userId =
        token?.user?.id ||
        token?.user?._id ||
        token?.user?.userId ||
        token?.userId ||
        token?.id ||
        token?._id ||
        null;
      if (userId) setCurrentUserId(userId);

      const url = `${BASE_URL}chat/threads`;
      console.log("📡 EmployerChatScreen: Fetching chat threads from:", url);
      const result = await GETNETWORK(url, true);
      console.log("📥 EmployerChatScreen: Chat threads response:", JSON.stringify(result, null, 2));

      if (result && !result.message) {
        const threadsData =
          result?.data ||
          result?.threads ||
          result?.chats ||
          result?.conversations ||
          result ||
          [];
        const threads = Array.isArray(threadsData) ? threadsData : [];

        const pending = threads.filter(
          (thread) =>
            thread.status?.toLowerCase().includes("pending") ||
            thread.status?.toLowerCase().includes("waiting") ||
            !thread.status ||
            thread.status === ""
        );
        const active = threads.filter(
          (thread) =>
            thread.status?.toLowerCase().includes("approved") ||
            thread.status?.toLowerCase().includes("active")
        );
        const rejected = threads.filter(
          (thread) =>
            thread.status?.toLowerCase().includes("declined") ||
            thread.status?.toLowerCase().includes("rejected")
        );

        console.log("✅ EmployerChatScreen: Successfully fetched chat threads");
        console.log("✅ EmployerChatScreen: Pending requests:", pending.length);
        console.log("✅ EmployerChatScreen: Active chats:", active.length);
        console.log("✅ EmployerChatScreen: Rejected chats:", rejected.length);
        console.log("📋 EmployerChatScreen: Sample thread structure:", JSON.stringify(threads[0], null, 2));

        setPendingRequests(pending);
        setActiveChats(active);
        setRejectedChats(rejected);
      } else {
        console.log("⚠️ EmployerChatScreen: No threads data or error in response");
        setPendingRequests([]);
        setActiveChats([]);
        setRejectedChats([]);
      }
    } catch (error) {
      setPendingRequests([]);
      setActiveChats([]);
      setRejectedChats([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchMessages = useCallback(async (threadId) => {
    if (!threadId) {
      console.log("❌ EmployerChatScreen: No thread ID provided for fetching messages");
      setMessages([]);
      return;
    }

    try {
      const token = await getObjByKey("loginResponse");
      if (!token) {
        console.log("❌ EmployerChatScreen: No login token found for fetching messages");
        setMessages([]);
        return;
      }

      const userId =
        token?.user?.id ||
        token?.user?._id ||
        token?.user?.userId ||
        token?.userId ||
        token?.id ||
        token?._id ||
        null;
      if (userId) setCurrentUserId(userId);

      const url = `${BASE_URL}chat/threads/${threadId}/messages`;
      console.log("📡 EmployerChatScreen: Fetching messages from:", url);
      const result = await GETNETWORK(url, true);
      console.log("📥 EmployerChatScreen: Messages response:", JSON.stringify(result, null, 2));

      if (result && !result.message) {
        const messagesData = result?.data || result?.messages || result || [];
        console.log("✅ EmployerChatScreen: Successfully fetched messages");
        setMessages(Array.isArray(messagesData) ? messagesData : []);
      } else {
        console.log("⚠️ EmployerChatScreen: No messages data or error in response");
        setMessages([]);
      }
    } catch (error) {
      console.error("❌ EmployerChatScreen: Error fetching messages:", error);
      setMessages([]);
    }
  }, []);

  const handleApprove = async (thread) => {
    const threadId = thread.id || thread._id || thread.threadId;
    if (!threadId) return;

    try {
      setProcessingAction(true);
      const url = `${BASE_URL}chat/threads/${threadId}/approve`;
      const result = await POSTNETWORK(url, {}, true);

      if (result && !result.message) {
        const successMsg = result?.message || "Chat request approved successfully";
        setToastMessage({ type: "success", msg: successMsg, visible: true });
        await fetchChatThreads();
        if (
          selectedChat &&
          (selectedChat.id || selectedChat._id || selectedChat.threadId) === threadId
        ) {
          setSelectedChat({ ...selectedChat, status: "approved" });
        }
      } else {
        const errorMsg = result?.message || result?.error || "Failed to approve chat request";
        setToastMessage({ type: "error", msg: errorMsg, visible: true });
      }
    } catch (error) {
      setToastMessage({
        type: "error",
        msg: "An error occurred while approving the chat request",
        visible: true,
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const handleDecline = async (thread) => {
    const threadId = thread.id || thread._id || thread.threadId;
    if (!threadId) return;

    try {
      setProcessingAction(true);
      const url = `${BASE_URL}chat/threads/${threadId}/decline`;
      const result = await POSTNETWORK(url, {}, true);

      if (result && !result.message) {
        const successMsg = result?.message || "Chat request declined";
        setToastMessage({ type: "success", msg: successMsg, visible: true });
        await fetchChatThreads();
        if (
          selectedChat &&
          (selectedChat.id || selectedChat._id || selectedChat.threadId) === threadId
        ) {
          setSelectedChat(null);
          setMessages([]);
        }
      } else {
        const errorMsg = result?.message || result?.error || "Failed to decline chat request";
        setToastMessage({ type: "error", msg: errorMsg, visible: true });
      }
    } catch (error) {
      setToastMessage({
        type: "error",
        msg: "An error occurred while declining the chat request",
        visible: true,
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const handleCloseChat = async (thread) => {
    const threadId = thread.id || thread._id || thread.threadId;
    if (!threadId) return;

    try {
      setProcessingAction(true);
      const url = `${BASE_URL}chat/threads/${threadId}/close`;
      const result = await POSTNETWORK(url, {}, true);

      if (result && !result.message) {
        const successMsg = result?.message || "Chat closed successfully";
        setToastMessage({ type: "success", msg: successMsg, visible: true });
        await fetchChatThreads();
        setSelectedChat(null);
        setMessages([]);
      } else {
        const errorMsg = result?.message || result?.error || "Failed to close chat";
        setToastMessage({ type: "error", msg: errorMsg, visible: true });
      }
    } catch (error) {
      setToastMessage({
        type: "error",
        msg: "An error occurred while closing the chat",
        visible: true,
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const handleReport = async (thread) => {
    const threadId = thread.id || thread._id || thread.threadId;
    if (!threadId) return;

    try {
      setProcessingAction(true);
      const url = `${BASE_URL}chat/threads/${threadId}/report`;
      const result = await POSTNETWORK(url, {}, true);

      if (result && !result.message) {
        const successMsg = result?.message || "Chat reported successfully";
        setToastMessage({ type: "success", msg: successMsg, visible: true });
      } else {
        const errorMsg = result?.message || result?.error || "Failed to report chat";
        setToastMessage({ type: "error", msg: errorMsg, visible: true });
      }
    } catch (error) {
      setToastMessage({
        type: "error",
        msg: "An error occurred while reporting the chat",
        visible: true,
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const containsPhoneNumber = (text) => {
    const phonePatterns = [
      /\d{10,}/g,
      /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g,
      /\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
      /\(\d{3}\)\s?\d{3}[-.\s]?\d{4}/g,
    ];
    const phoneWords = [
      /\b(zero|one|two|three|four|five|six|seven|eight|nine|ten)\b/gi,
      /\b(call|phone|mobile|number|contact|reach|dial)\s+me\b/gi,
      /\bmy\s+(number|phone|mobile|contact)\b/gi,
      /\b\d+\s*(zero|one|two|three|four|five|six|seven|eight|nine)\b/gi,
    ];
    const phonePhrases = [
      /call\s+me\s+at/gi,
      /my\s+number\s+is/gi,
      /contact\s+me\s+at/gi,
      /reach\s+me\s+at/gi,
      /dial\s+me\s+at/gi,
    ];
    for (const pattern of phonePatterns) if (pattern.test(text)) return true;
    for (const pattern of phoneWords) if (pattern.test(text)) return true;
    for (const phrase of phonePhrases) if (phrase.test(text)) return true;
    return false;
  };

  const containsFileReference = (text) => {
    const fileExtensions = [/\.pdf\b/gi, /\.doc\b/gi, /\.docx\b/gi, /\.jpg\b/gi, /\.jpeg\b/gi, /\.png\b/gi, /\.gif\b/gi, /\.bmp\b/gi, /\.webp\b/gi, /\.zip\b/gi, /\.rar\b/gi];
    const fileKeywords = [
      /\b(pdf|document|file|image|picture|photo|attachment|upload|download)\b/gi,
      /\b(send|share|attach)\s+(file|document|image|picture|photo|pdf)\b/gi,
      /\b(here|this)\s+(is|are)\s+(my|the)\s+(file|document|image|picture|photo|pdf)\b/gi,
    ];
    for (const pattern of fileExtensions) if (pattern.test(text)) return true;
    for (const pattern of fileKeywords) if (pattern.test(text)) return true;
    return false;
  };

  const containsLocation = (text) => {
    const locationKeywords = [
      /\b(location|address|where|here|there|place|coordinates|gps|map|google\s+map|maps)\b/gi,
      /\b(lat|long|latitude|longitude)\b/gi,
      /\b(send|share|my)\s+(location|address|whereabouts)\b/gi,
      /\b(meet|meeting)\s+(at|in|near)\b/gi,
      /\b\d+\.\d+,\s*\d+\.\d+\b/g,
    ];
    for (const pattern of locationKeywords) if (pattern.test(text)) return true;
    return false;
  };

  const containsLink = (text) => {
    const urlPatterns = [
      /https?:\/\/[^\s]+/gi,
      /www\.[^\s]+/gi,
      /[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/[^\s]*)?/gi,
      /bit\.ly\/[^\s]+/gi,
      /t\.co\/[^\s]+/gi,
      /tinyurl\.com\/[^\s]+/gi,
      /goo\.gl\/[^\s]+/gi,
    ];
    const linkPhrases = [
      /\b(click here|visit|check out|see more|read more|link|url|website|web site)\b/gi,
      /\b(here|this|that)\s+(link|url|website|site)\b/gi,
    ];
    for (const pattern of urlPatterns) if (pattern.test(text)) return true;
    for (const phrase of linkPhrases) if (phrase.test(text)) return true;
    return false;
  };

  const validateMessage = (text) => {
    if (!text || !text.trim()) return { valid: false, error: "Message cannot be empty" };
    if (containsPhoneNumber(text)) return { valid: false, error: "Sharing phone numbers is not allowed. Please remove any phone numbers or contact information." };
    if (containsFileReference(text)) return { valid: false, error: "Sharing files, images, or documents is not allowed. Please remove any file references." };
    if (containsLocation(text)) return { valid: false, error: "Sharing locations or addresses is not allowed. Please remove any location information." };
    if (containsLink(text)) return { valid: false, error: "Sharing links or URLs is not allowed. Please remove any links from your message." };
    return { valid: true };
  };

  const handleChatSelect = (chat) => {
    console.log("📋 EmployerChatScreen: Chat selected:", JSON.stringify(chat, null, 2));
    const threadId = chat.id || chat._id || chat.threadId || chat.thread_id || chat.chatId || chat.chat_id;
    console.log("📋 EmployerChatScreen: Extracted thread ID:", threadId);
    setSelectedChat(chat);
    if (threadId) {
      fetchMessages(threadId);
    } else {
      console.log("❌ EmployerChatScreen: No valid thread ID found in chat object");
    }
  };

  const handleSendMessage = async () => {
    if (!selectedChat || !messageText.trim()) return;

    const validation = validateMessage(messageText);
    if (!validation.valid) {
      setToastMessage({ type: "error", msg: validation.error, visible: true });
      return;
    }

    const threadId =
      selectedChat.id ||
      selectedChat._id ||
      selectedChat.threadId ||
      selectedChat.thread_id ||
      selectedChat.chatId ||
      selectedChat.chat_id;
    if (!threadId) {
      console.log("❌ EmployerChatScreen: No thread ID found for sending message");
      return;
    }

    try {
      setSendingMessage(true);
      animateSend();
      const url = `${BASE_URL}chat/threads/${threadId}/messages`;
      const payload = { message: messageText.trim() };

      console.log("📡 EmployerChatScreen: Sending message to:", url);
      const result = await POSTNETWORK(url, payload, true);
      console.log("📥 EmployerChatScreen: Send message response:", JSON.stringify(result, null, 2));

      if (result && !result.message) {
        setMessageText("");
        fetchMessages(threadId);
      } else {
        const errorMsg = result?.message || result?.error || "Failed to send message";
        setToastMessage({ type: "error", msg: errorMsg, visible: true });
      }
    } catch (error) {
      console.error("❌ EmployerChatScreen: Exception during send message:", error);
      setToastMessage({ type: "error", msg: "An error occurred while sending message", visible: true });
    } finally {
      setSendingMessage(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchChatThreads();
    if (selectedChat) {
      const threadId =
        selectedChat.id ||
        selectedChat._id ||
        selectedChat.threadId ||
        selectedChat.thread_id ||
        selectedChat.chatId ||
        selectedChat.chat_id;
      if (threadId) fetchMessages(threadId);
    }
  }, [fetchChatThreads, fetchMessages, selectedChat]);

  useFocusEffect(
    useCallback(() => {
      fetchChatThreads();
    }, [fetchChatThreads])
  );

  useEffect(() => {
    if (selectedChat) {
      const threadId =
        selectedChat.id ||
        selectedChat._id ||
        selectedChat.threadId ||
        selectedChat.thread_id ||
        selectedChat.chatId ||
        selectedChat.chat_id;
      if (threadId) fetchMessages(threadId);
    }
  }, [selectedChat, fetchMessages]);

  const closeDropdownMenu = () => {
    setShowDropdown(false);
    setDropdownAnchor(null);
  };

  const toggleDropdownMenu = () => {
    if (showDropdown) {
      closeDropdownMenu();
      return;
    }
    requestAnimationFrame(() => {
      moreButtonRef.current?.measureInWindow?.((x, y, width, height) => {
        setDropdownAnchor({ x, y, width, height });
        setShowDropdown(true);
      });
    });
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (selectedChat) {
        setSelectedChat(null);
        setShowDropdown(false);
        setDropdownAnchor(null);
        return true;
      }
      if (navigation && navigation.canGoBack()) {
        navigation.goBack();
        return true;
      }
      return false;
    });
    return () => backHandler.remove();
  }, [selectedChat, navigation]);

  // ── Helper functions (UNCHANGED logic) ──────────────────────────────────

  const getStatusColor = (status) => {
    if (!status) return COLORS.primary;
    const s = status.toLowerCase();
    if (s.includes("pending") || s.includes("waiting")) return COLORS.warning;
    if (s.includes("approved") || s.includes("active")) return COLORS.success;
    if (s.includes("closed") || s.includes("declined")) return COLORS.textMuted;
    return COLORS.primary;
  };

  const getStatusBadgeColor = (status) => {
    const s = status?.toLowerCase() || "";
    if (s.includes("approved") || s.includes("active")) return COLORS.success;
    if (s.includes("closed") || s.includes("decline") || s.includes("declined")) return COLORS.danger;
    return COLORS.warning;
  };

  const getStatusText = (status) => {
    if (!status) return "Pending";
    const s = status.toLowerCase();
    if (s.includes("approved") || s.includes("active")) return "Active";
    if (s.includes("closed")) return "Closed";
    if (s.includes("declined") || s.includes("decline")) return "Declined";
    return "Pending";
  };

  const getLastMessage = (chat) => chat?.lastMessage || chat?.last_message || "";

  const isChatApproved = (chat) => {
    const status = chat?.status || "";
    return status.toLowerCase().includes("approved") || status.toLowerCase().includes("active");
  };

  const allChats = [...pendingRequests, ...activeChats];

  const isMessageFromCurrentUser = useCallback(
    (item) => {
      const senderType =
        item.senderType || item.sender_type || item.senderRole || item.sender_role || "";
      const senderTypeLower = senderType.toString().toLowerCase();
      const senderId =
        item.senderId ||
        item.sender_id ||
        item.sender?.id ||
        item.sender?._id ||
        item.userId ||
        item.user_id ||
        item.fromUserId ||
        item.from_user_id ||
        null;

      const isSentByProviderType =
        senderTypeLower === "provider" ||
        senderTypeLower === "employer" ||
        senderTypeLower === "jobprovider" ||
        senderTypeLower === "job_provider" ||
        senderTypeLower === "job-provider";

      const isFromSeekerType =
        senderTypeLower === "seeker" ||
        senderTypeLower === "user" ||
        senderTypeLower === "jobseeker" ||
        senderTypeLower === "job_seeker" ||
        senderTypeLower === "job-seeker";

      const hasOutgoingFlags =
        item.isOutgoing === true ||
        item.isSent === true ||
        item.fromMe === true ||
        item.isFromMe === true;

      const senderIdMatches =
        currentUserId &&
        senderId &&
        (senderId.toString() === currentUserId.toString() || senderId === currentUserId);

      if (isFromSeekerType) return false;
      if (isSentByProviderType || senderIdMatches || hasOutgoingFlags) return true;
      return false;
    },
    [currentUserId]
  );

  const formatMessageTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // ── Avatar initials helper ───────────────────────────────────────────────
  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name[0].toUpperCase();
  };

  // ── Date separator for messages ──────────────────────────────────────────
  const formatDateSeparator = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  // ── Get chats for current tab ────────────────────────────────────────────
  const getTabChats = () => {
    switch (activeTab) {
      case "Pending":
        return pendingRequests;
      case "Approved":
        return activeChats;
      case "Rejected":
        return rejectedChats;
      case "All":
      default:
        return [...pendingRequests, ...activeChats, ...rejectedChats];
    }
  };

  // ── Filter chats by search text ──────────────────────────────────────────
  const filterChatsBySearch = (chats) => {
    if (!searchText.trim()) return chats;
    const lowerSearch = searchText.toLowerCase();
    return chats.filter((chat) => {
      const name = (chat.candidateName || chat.candidate_name || chat.seekerName || "").toLowerCase();
      const jobTitle = getJobTitleForThread(chat).toLowerCase();
      return name.includes(lowerSearch) || jobTitle.includes(lowerSearch);
    });
  };

  // ── Group chats by date (Today, Yesterday, Older) ─────────────────────────
  // Bucket by when the thread/request was created (not last activity), so older
  // threads are not pulled into Today just because of a new message.
  const startOfLocalDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const groupChatsByDate = (chats) => {
    const grouped = {};
    const now = new Date();
    const todayStart = startOfLocalDay(now);
    const yesterdayStart = startOfLocalDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));

    chats.forEach((chat) => {
      const lastMsg = chat.lastMessage || chat.last_message;
      const lastMsgCreated =
        lastMsg && typeof lastMsg === "object"
          ? lastMsg.createdAt || lastMsg.created_at
          : null;
      const dateString =
        chat.createdAt ||
        chat.created_at ||
        chat.requestedAt ||
        chat.requested_at ||
        chat.threadCreatedAt ||
        chat.thread_created_at ||
        chat.insertedAt ||
        chat.inserted_at ||
        chat.updatedAt ||
        chat.updated_at ||
        chat.lastMessageAt ||
        chat.last_message_at ||
        chat.timestamp ||
        lastMsgCreated;

      let groupKey = "OLDER_CHATS";

      if (!dateString) {
        if (!grouped[groupKey]) grouped[groupKey] = [];
        grouped[groupKey].push(chat);
        return;
      }

      const chatDate = new Date(dateString);
      if (Number.isNaN(chatDate.getTime())) {
        if (!grouped[groupKey]) grouped[groupKey] = [];
        grouped[groupKey].push(chat);
        return;
      }

      const chatDayStart = startOfLocalDay(chatDate);
      if (chatDayStart.getTime() === todayStart.getTime()) {
        groupKey = "TODAY";
      } else if (chatDayStart.getTime() === yesterdayStart.getTime()) {
        groupKey = "YESTERDAY";
      }

      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      grouped[groupKey].push(chat);
    });

    return grouped;
  };

  // ── Build data for FlatList with date separators ──────────────────────────
  const buildGroupedChatList = () => {
    const tabChats = getTabChats();
    const filteredChats = filterChatsBySearch(tabChats);
    const groupedChats = groupChatsByDate(filteredChats);
    const result = [];

    const dateOrder = ["TODAY", "YESTERDAY", "OLDER_CHATS"];
    dateOrder.forEach((dateKey) => {
      const bucket = groupedChats[dateKey];
      if (bucket && bucket.length > 0) {
        result.push({ type: "dateHeader", label: dateKey });
        result.push(...bucket.map((chat) => ({ ...chat, type: "chat" })));
      }
    });

    return result;
  };

  // ════════════════════════════════════════════════════════════════════════════
  //  RENDER CHAT LIST ITEM  — Modern card style
  // ════════════════════════════════════════════════════════════════════════════
  const renderChatItem = ({ item }) => {
    if (item.type === "dateHeader") {
      const sectionTitle =
        item.label === "TODAY"
          ? "TODAY"
          : item.label === "YESTERDAY"
            ? "YESTERDAY"
            : item.label === "OLDER_CHATS"
              ? "OLDER CHATS"
              : item.label;
      return (
        <View style={styles.dateHeaderContainer}>
          <Text style={styles.dateHeaderText}>{sectionTitle}</Text>
        </View>
      );
    }

    const lastMessage = getLastMessage(item);
    const candidateName =
      item.candidateName || item.candidate_name || item.seekerName || "Candidate";
    const initials = getInitials(candidateName);
    const jobTitle = getJobTitleForThread(item) || "Applicant";
    const listTime = formatListThreadTime(item);
    const unread = Number(item.unreadCount ?? item.unread_count ?? item.unread ?? 0) || 0;
    const category = getThreadStatusCategory(item);
    const online =
      item?.isOnline === true ||
      item?.online === true ||
      item?.seekerOnline === true ||
      String(item?.presence || "").toLowerCase() === "online";
    const presenceColor = online ? COLORS.activeDot : "#9CA3AF";

    let pillColor = COLORS.warning;
    let pillLabel = "Pending";
    if (category === "approved") {
      pillColor = COLORS.success;
      pillLabel = "Approved";
    } else if (category === "rejected") {
      pillColor = COLORS.danger;
      pillLabel = "Rejected";
    }

    const avatarBg = getAvatarBgColor(candidateName);

    return (
      <View style={styles.chatCard}>
        <TouchableOpacity
          style={styles.chatCardMain}
          onPress={() => handleChatSelect(item)}
          activeOpacity={0.75}
        >
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
              <Text style={styles.avatarTextOnColor}>{initials}</Text>
            </View>
            <View style={[styles.onlinePresenceDot, { backgroundColor: presenceColor }]} />
          </View>

          <View style={styles.chatCardCenter}>
            <View style={styles.chatCardTopRow}>
              <Text style={styles.chatName} numberOfLines={1}>
                {candidateName}
              </Text>
              <View style={styles.chatCardMetaRight}>
                {listTime ? <Text style={styles.chatListTime}>{listTime}</Text> : null}
                {unread > 0 ? (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>{unread > 9 ? "9+" : unread}</Text>
                  </View>
                ) : null}
              </View>
            </View>
            <Text style={styles.chatJobTitle} numberOfLines={1}>
              {jobTitle}
            </Text>
            {lastMessage ? (
              <Text style={styles.chatPreview} numberOfLines={1}>
                {lastMessage}
              </Text>
            ) : (
              <Text style={[styles.chatPreview, styles.chatPreviewMuted]} numberOfLines={1}>
                No messages yet
              </Text>
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.chatCardFooter}>
          {category === "pending" ? (
            <View style={styles.pendingStatusLabel}>
              <MaterialCommunityIcons name="clock-alert-outline" size={15} color="#C2410C" />
              <Text style={styles.pendingStatusLabelText}>Awaiting your review</Text>
            </View>
          ) : (
            <View style={[styles.statusPillOutline, { borderColor: pillColor + "AA" }]}>
              <View style={[styles.statusPillDot, { backgroundColor: pillColor }]} />
              <Text style={[styles.statusPillOutlineText, { color: pillColor }]}>{pillLabel}</Text>
            </View>
          )}
          <View style={styles.chatCardActions}>
            {category === "pending" ? (
              <>
                <TouchableOpacity
                  style={[styles.iconActionBtn, styles.iconActionAccept]}
                  onPress={() => handleApprove(item)}
                  disabled={processingAction}
                  activeOpacity={0.7}
                >
                  {processingAction ? (
                    <ActivityIndicator size="small" color={BRANDCOLOR} />
                  ) : (
                    <MaterialCommunityIcons name="check" size={22} color={BRANDCOLOR} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.iconActionBtn, styles.iconActionReject, { marginLeft: 10 }]}
                  onPress={() => handleDecline(item)}
                  disabled={processingAction}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="close" size={22} color={COLORS.danger} />
                </TouchableOpacity>
              </>
            ) : null}
            {category === "approved" ? (
              <TouchableOpacity
                style={[styles.outlineActionBtn, styles.outlineActionMessage]}
                onPress={() => handleChatSelect(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.outlineActionMessageText}>Message</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  // ════════════════════════════════════════════════════════════════════════════
  //  RENDER MESSAGE BUBBLE
  // ════════════════════════════════════════════════════════════════════════════
  const renderMessage = ({ item, index }) => {
    const isSentByEmployer = isMessageFromCurrentUser(item);
    const messageDate =
      item.createdAt ||
      item.created_at ||
      item.timestamp ||
      item.time ||
      item.date ||
      item.sentAt ||
      item.sent_at ||
      item.updatedAt ||
      item.updated_at;
    const formattedTime = formatMessageTime(messageDate);
    const msgText = item.message || item.text || item.content || "";

    return (
      <View
        style={[
          styles.messageBubbleRow,
          isSentByEmployer ? styles.messageBubbleRowSent : styles.messageBubbleRowReceived,
        ]}
      >
        {/* Receiver avatar mini */}
        {!isSentByEmployer && (
          <View style={styles.receiverAvatarMini}>
            <Text style={styles.receiverAvatarMiniText}>
              {getInitials(
                selectedChat?.candidateName ||
                  selectedChat?.candidate_name ||
                  selectedChat?.seekerName ||
                  "C"
              )}
            </Text>
          </View>
        )}

        <View style={isSentByEmployer ? styles.sentWrapper : styles.receivedWrapper}>
          {/* Bubble */}
          <View
            style={[
              styles.bubble,
              isSentByEmployer ? styles.bubbleSent : styles.bubbleReceived,
            ]}
          >
            <Text
              style={[
                styles.bubbleText,
                isSentByEmployer ? styles.bubbleTextSent : styles.bubbleTextReceived,
              ]}
            >
              {msgText}
            </Text>
          </View>

          {/* Time + ticks */}
          {formattedTime ? (
            <View
              style={[
                styles.timeRow,
                isSentByEmployer ? styles.timeRowSent : styles.timeRowReceived,
              ]}
            >
              <Text style={styles.timeText}>{formattedTime}</Text>
              {isSentByEmployer && (
                <MaterialCommunityIcons
                  name="check-all"
                  size={14}
                  color={COLORS.primary}
                  style={{ marginLeft: 3 }}
                />
              )}
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  const selectedChatStatus = selectedChat?.status || "Pending approval";
  const selectedChatApproved = isChatApproved(selectedChat);
  const candidateName =
    selectedChat?.candidateName ||
    selectedChat?.candidate_name ||
    selectedChat?.seekerName ||
    "Candidate";

  // ════════════════════════════════════════════════════════════════════════════
  //  CHAT DETAIL VIEW
  // ════════════════════════════════════════════════════════════════════════════
  if (selectedChat) {
    const DROP_MENU_W = 176;
    const menuLeft =
      dropdownAnchor != null
        ? Math.min(
            WIDTH - DROP_MENU_W - 16,
            Math.max(12, dropdownAnchor.x + dropdownAnchor.width - DROP_MENU_W)
          )
        : 0;
    const menuTop =
      dropdownAnchor != null ? dropdownAnchor.y + dropdownAnchor.height + 6 : 0;

    return (
      <>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.headerBg} translucent={false} />
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          {/* ── Chat Header (outside tap-dismiss so menu opens reliably) ─ */}
          <View style={styles.chatHeader}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => {
                setSelectedChat(null);
                closeDropdownMenu();
              }}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>

            <View style={styles.chatHeaderAvatar}>
              <Text style={styles.chatHeaderAvatarText}>{getInitials(candidateName)}</Text>
            </View>

            <View style={styles.chatHeaderInfo}>
              <Text style={styles.chatHeaderName} numberOfLines={1}>
                {candidateName}
              </Text>
              <View style={styles.chatHeaderStatusRow}>
                <View
                  style={[
                    styles.chatHeaderDot,
                    { backgroundColor: getStatusColor(selectedChatStatus) },
                  ]}
                />
                <Text style={styles.chatHeaderStatus}>
                  {getStatusText(selectedChatStatus)}
                </Text>
              </View>
            </View>

            <View style={styles.chatHeaderActions}>
              <TouchableOpacity
                ref={moreButtonRef}
                collapsable={false}
                style={styles.moreBtn}
                onPress={toggleDropdownMenu}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons name="dots-vertical" size={22} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.chatDetailBody}>
            <TouchableWithoutFeedback onPress={closeDropdownMenu}>
              <View style={styles.chatDetailTapDismiss}>
                <View style={styles.messagesArea}>
              <FlatList
                data={messages}
                keyExtractor={(item, index) =>
                  item.id?.toString() || item._id?.toString() || index.toString()
                }
                renderItem={renderMessage}
                contentContainerStyle={[
                  styles.messagesContainer,
                  messages.length === 0 && { flexGrow: 1, justifyContent: "center" },
                ]}
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                scrollEnabled
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
                removeClippedSubviews={false}
                bounces
                overScrollMode="auto"
                ListEmptyComponent={
                  <View style={styles.emptyMessages}>
                    <MaterialCommunityIcons name="chat-outline" size={52} color={COLORS.border} />
                    <Text style={styles.emptyMessagesTitle}>No messages yet</Text>
                    <Text style={styles.emptyMessagesSubtitle}>
                      {selectedChatApproved
                        ? "Say hello! Start the conversation."
                        : "Approve this request to start chatting."}
                    </Text>
                  </View>
                }
              />
                </View>

                {!selectedChatApproved && (
                  <View style={styles.pendingBanner}>
                    <MaterialCommunityIcons
                      name="information-outline"
                      size={18}
                      color={COLORS.warning}
                    />
                    <Text style={styles.pendingBannerText}>
                      Approve this chat request to start messaging.
                    </Text>
                  </View>
                )}
              </View>
            </TouchableWithoutFeedback>

            {selectedChatApproved && (
              <View style={styles.inputBar}>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Type a message…"
                    placeholderTextColor={COLORS.textMuted}
                    value={messageText}
                    onChangeText={setMessageText}
                    multiline
                    maxLength={1000}
                  />
                </View>
                <Animated.View style={{ transform: [{ scale: sendScale }] }}>
                  <TouchableOpacity
                    style={[
                      styles.sendBtn,
                      (!messageText.trim() || sendingMessage) && styles.sendBtnDisabled,
                    ]}
                    onPress={handleSendMessage}
                    disabled={sendingMessage || !messageText.trim()}
                    activeOpacity={0.85}
                  >
                    {sendingMessage ? (
                      <ActivityIndicator size="small" color={WHITE} />
                    ) : (
                      <MaterialCommunityIcons name="send" size={20} color={WHITE} />
                    )}
                  </TouchableOpacity>
                </Animated.View>
              </View>
            )}

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
        </KeyboardAvoidingView>

        <Modal
          visible={showDropdown}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={closeDropdownMenu}
        >
          <View style={styles.dropdownModalRoot}>
            <Pressable style={styles.dropdownModalBackdrop} onPress={closeDropdownMenu} />
            {dropdownAnchor ? (
            <View
              style={[
                styles.dropdownMenuModal,
                {
                  top: menuTop,
                  left: menuLeft,
                  width: DROP_MENU_W,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  closeDropdownMenu();
                  handleReport(selectedChat);
                }}
                disabled={processingAction}
              >
                <MaterialCommunityIcons
                  name="flag-outline"
                  size={18}
                  color={COLORS.danger}
                  style={{ marginRight: 10 }}
                />
                <Text style={[styles.dropdownText, { color: COLORS.danger }]}>Report</Text>
              </TouchableOpacity>

              {selectedChatApproved ? (
                <TouchableOpacity
                  style={[styles.dropdownItem, { borderBottomWidth: 0 }]}
                  onPress={() => {
                    closeDropdownMenu();
                    handleCloseChat(selectedChat);
                  }}
                  disabled={processingAction}
                >
                  <MaterialCommunityIcons
                    name="close-circle-outline"
                    size={18}
                    color={COLORS.textSecondary}
                    style={{ marginRight: 10 }}
                  />
                  <Text style={styles.dropdownText}>Close Chat</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}
          </View>
        </Modal>
      </>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  CHAT LIST VIEW
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={BRANDCOLOR} translucent={false} />
      <View style={styles.container}>
        <View style={[styles.messagesScreenHeader, { paddingTop: insets.top + 10 }]}>
          <View style={styles.messagesHeaderRow}>
            <View style={styles.messagesHeaderTitleBlock}>
              <Text style={styles.messagesHeaderTitle}>Messages</Text>
              <Text style={styles.messagesHeaderSubtitle}>Employer Dashboard</Text>
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChipsRow}
            keyboardShouldPersistTaps="handled"
          >
            {["All", "Pending", "Approved", "Rejected"].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.filterChip, activeTab === tab && styles.filterChipActive]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterChipText, activeTab === tab && styles.filterChipTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <MaterialCommunityIcons name="magnify" size={20} color={COLORS.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search applicants…"
              placeholderTextColor={COLORS.textMuted}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={BRANDCOLOR} />
            <Text style={styles.loadingText}>Loading chats…</Text>
          </View>
        ) : (
          <FlatList
            data={buildGroupedChatList()}
            keyExtractor={(item, index) => {
              if (item.type === "dateHeader") return `date-${item.label}`;
              return item.id?.toString() || item._id?.toString() || index.toString();
            }}
            renderItem={renderChatItem}
            contentContainerStyle={styles.chatList}
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
                <View style={styles.emptyIconCircle}>
                  <MaterialCommunityIcons name="chat-outline" size={40} color={COLORS.primary} />
                </View>
                <Text style={styles.emptyTitle}>No chats yet</Text>
                <Text style={styles.emptySubtitle}>
                  Chat requests from candidates will appear here.
                </Text>
              </View>
            }
          />
        )}

        {/* Toast */}
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

export default EmployerChatScreen;

// ══════════════════════════════════════════════════════════════════════════════
//  STYLES — Modern 2025 Chat UI
// ══════════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  // ── Base ────────────────────────────────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  messagesScreenHeader: {
    backgroundColor: BRANDCOLOR,
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  messagesHeaderRow: {
    marginBottom: 14,
  },
  messagesHeaderTitleBlock: {
    justifyContent: "center",
  },
  messagesHeaderTitle: {
    fontSize: 22,
    fontFamily: FIRASANSBOLD,
    color: WHITE,
    letterSpacing: 0.2,
  },
  messagesHeaderSubtitle: {
    fontSize: 13,
    fontFamily: UBUNTU,
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
  },
  filterChipsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 4,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  filterChipActive: {
    backgroundColor: WHITE,
    borderColor: WHITE,
  },
  filterChipText: {
    fontSize: 13,
    fontFamily: FIRASANSSEMIBOLD,
    color: "rgba(255,255,255,0.95)",
  },
  filterChipTextActive: {
    color: BRANDCOLOR,
  },

  // ── Loading ─────────────────────────────────────────────────────────────
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: FIRASANSSEMIBOLD,
  },

  // ── Search Bar ───────────────────────────────────────────────────────────
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.bg,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
    fontFamily: UBUNTU,
    paddingVertical: 0,
  },

  // ── Date Headers ─────────────────────────────────────────────────────────
  dateHeaderContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.bg,
  },
  dateHeaderText: {
    fontSize: 12,
    fontFamily: FIRASANSSEMIBOLD,
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  chatList: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "ios" ? HEIGHT * 0.1 : HEIGHT * 0.12,
    paddingTop: 8,
  },
  listHeader: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  listHeaderText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: FIRASANSSEMIBOLD,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  // ── Chat Card ───────────────────────────────────────────────────────────
  chatCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.card,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  chatCardMain: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  chatCardCenter: {
    flex: 1,
    minWidth: 0,
  },
  chatCardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  chatCardMetaRight: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  chatListTime: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: UBUNTU,
    marginRight: 6,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    backgroundColor: BRANDCOLOR,
    justifyContent: "center",
    alignItems: "center",
  },
  unreadBadgeText: {
    fontSize: 11,
    fontFamily: FIRASANSBOLD,
    color: WHITE,
  },
  chatJobTitle: {
    fontSize: 13,
    fontFamily: FIRASANSSEMIBOLD,
    color: BRANDCOLOR,
    marginBottom: 3,
  },
  chatCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  chatCardActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  outlineActionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    minWidth: 76,
    alignItems: "center",
    justifyContent: "center",
  },
  pendingStatusLabel: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FDBA74",
    maxWidth: "72%",
  },
  pendingStatusLabelText: {
    marginLeft: 6,
    fontSize: 12,
    fontFamily: FIRASANSSEMIBOLD,
    color: "#9A3412",
    letterSpacing: 0.25,
  },
  iconActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    backgroundColor: COLORS.surface,
  },
  iconActionAccept: {
    borderColor: BRANDCOLOR,
  },
  iconActionReject: {
    borderColor: COLORS.danger,
  },
  outlineActionMessage: {
    borderColor: BRANDCOLOR,
    backgroundColor: COLORS.surface,
  },
  outlineActionMessageText: {
    fontSize: 13,
    fontFamily: FIRASANSSEMIBOLD,
    color: BRANDCOLOR,
  },
  statusPillOutline: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: COLORS.surface,
  },
  statusPillOutlineText: {
    fontSize: 11,
    fontFamily: FIRASANSSEMIBOLD,
    letterSpacing: 0.3,
  },

  // Avatar
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: WIDTH * 0.12,
    height: WIDTH * 0.12,
    borderRadius: WIDTH * 0.06,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: WIDTH * 0.045,
    fontFamily: FIRASANSBOLD,
    color: COLORS.primary,
  },
  avatarTextOnColor: {
    fontSize: WIDTH * 0.042,
    fontFamily: FIRASANSBOLD,
    color: WHITE,
  },
  onlinePresenceDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },

  chatName: {
    flex: 1,
    fontSize: 16,
    fontFamily: FIRASANSBOLD,
    color: "#1e3a5f",
    marginRight: 8,
  },
  chatPreview: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: UBUNTU,
  },
  chatPreviewMuted: {
    fontStyle: "italic",
    color: COLORS.textMuted,
  },

  statusPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },

  // ── Empty state ─────────────────────────────────────────────────────────
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: HEIGHT * 0.18,
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: FIRASANSBOLD,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    fontFamily: UBUNTU,
  },

  chatDetailBody: {
    flex: 1,
  },
  chatDetailTapDismiss: {
    flex: 1,
  },

  // ── Chat Header (detail view) ────────────────────────────────────────────
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.headerBg,
    paddingHorizontal: 12,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 8 : 52,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 4,
  },
  chatHeaderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  chatHeaderAvatarText: {
    fontSize: 15,
    fontFamily: FIRASANSBOLD,
    color: COLORS.primary,
  },
  chatHeaderInfo: {
    flex: 1,
  },
  chatHeaderName: {
    fontSize: 16,
    fontFamily: FIRASANSBOLD,
    color: COLORS.textPrimary,
  },
  chatHeaderStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  chatHeaderDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 5,
  },
  chatHeaderStatus: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: UBUNTU,
  },
  chatHeaderActions: {
    position: "relative",
  },
  moreBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  dropdownModalRoot: {
    flex: 1,
  },
  dropdownModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  dropdownMenuModal: {
    position: "absolute",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    zIndex: 20,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  dropdownText: {
    fontSize: 14,
    fontFamily: FIRASANSSEMIBOLD,
    color: COLORS.textPrimary,
  },

  // ── Messages area ────────────────────────────────────────────────────────
  messagesArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  messagesContainer: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    paddingBottom: 24,
  },

  // Message bubble row
  messageBubbleRow: {
    flexDirection: "row",
    marginBottom: 10,
    alignItems: "flex-end",
  },
  messageBubbleRowSent: {
    justifyContent: "flex-end",
  },
  messageBubbleRowReceived: {
    justifyContent: "flex-start",
  },

  // Mini receiver avatar
  receiverAvatarMini: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
    marginBottom: 16,
  },
  receiverAvatarMiniText: {
    fontSize: 11,
    fontFamily: FIRASANSBOLD,
    color: COLORS.primary,
  },

  // Wrappers
  sentWrapper: {
    maxWidth: "72%",
    alignItems: "flex-end",
  },
  receivedWrapper: {
    maxWidth: "72%",
    alignItems: "flex-start",
  },

  // Bubbles
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADII.bubble,
  },
  bubbleSent: {
    backgroundColor: COLORS.sent,
    borderBottomRightRadius: RADII.bubbleTail,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  bubbleReceived: {
    backgroundColor: COLORS.received,
    borderBottomLeftRadius: RADII.bubbleTail,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
  },
  bubbleTextSent: {
    color: COLORS.sentText,
    fontFamily: UBUNTU,
  },
  bubbleTextReceived: {
    color: COLORS.receivedText,
    fontFamily: UBUNTU,
  },

  // Time row
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
    paddingHorizontal: 2,
  },
  timeRowSent: {
    justifyContent: "flex-end",
  },
  timeRowReceived: {
    justifyContent: "flex-start",
  },
  timeText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: UBUNTU,
  },

  // Empty messages
  emptyMessages: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: HEIGHT * 0.12,
    paddingHorizontal: 32,
  },
  emptyMessagesTitle: {
    fontSize: 17,
    fontFamily: FIRASANSBOLD,
    color: COLORS.textPrimary,
    marginTop: 14,
    marginBottom: 6,
  },
  emptyMessagesSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 19,
    fontFamily: UBUNTU,
  },

  // ── Pending banner ───────────────────────────────────────────────────────
  pendingBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8E7",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0E0B0",
    gap: 8,
  },
  pendingBannerText: {
    flex: 1,
    fontSize: 13,
    color: "#92650A",
    fontFamily: FIRASANSSEMIBOLD,
    lineHeight: 18,
  },

  // ── Input bar ────────────────────────────────────────────────────────────
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: Platform.OS === "ios" ? 24 : 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: COLORS.inputBg,
    borderRadius: RADII.input,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 10 : 6,
    marginRight: 10,
    minHeight: 46,
    maxHeight: 120,
    justifyContent: "center",
  },
  input: {
    fontSize: 15,
    color: COLORS.textPrimary,
    fontFamily: UBUNTU,
    maxHeight: 96,
    padding: 0,
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  sendBtnDisabled: {
    opacity: 0.45,
    shadowOpacity: 0,
    elevation: 0,
  },
});
