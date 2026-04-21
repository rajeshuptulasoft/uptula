import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Dimensions,
  TextInput,
  Animated,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  PermissionsAndroid,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ReactNativeBlobUtil from "react-native-blob-util";
import DateComponent from "../../../components/dateComponents/DateComponent";
import { MyHeader } from "../../../components/commonComponents/MyHeader";
import { MyStatusBar } from "../../../components/commonComponents/MyStatusBar";
import { POSTNETWORK } from "../../../utils/Network";
import { getObjByKey } from "../../../utils/Storage";
import { BRANDCOLOR, WHITE, BLACK } from "../../../constant/color";
import { MAIL, LINKEDIN, GITHUB, PORTFOLIO as PORTFOLIO_ICON } from "../../../constant/imagePath";
import { BASE_URL } from "../../../constant/url";

const { width: WIDTH } = Dimensions.get("screen");

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const ACCENT = BRANDCOLOR || "#2563EB";
const SURFACE = "#F7F8FC";
const BORDER = "#E2E8F0";
const DANGER = "#EF4444";
const SUCCESS = "#10B981";
const WARN = "#F59E0B";
const TEXT_SECONDARY = "#64748B";
const WORLD_LANGUAGES = [
  "English", "Hindi", "Spanish", "French", "German", "Arabic", "Portuguese",
  "Russian", "Japanese", "Korean", "Chinese (Mandarin)", "Italian", "Dutch",
  "Turkish", "Polish", "Swedish", "Danish", "Norwegian", "Finnish", "Greek",
  "Hebrew", "Thai", "Vietnamese", "Indonesian", "Malay", "Urdu", "Bengali",
  "Tamil", "Telugu", "Marathi", "Gujarati", "Punjabi", "Kannada", "Malayalam",
  "Swahili", "Afrikaans", "Romanian", "Czech", "Slovak", "Hungarian",
];

// ─── HELPER COMPONENTS ───────────────────────────────────────────────────────
const SectionCard = ({ children }) => <View style={s.sectionCard}>{children}</View>;
const SectionTitle = ({ icon, title }) => (
  <View style={s.sectionTitleRow}>
    <Text style={s.sectionIcon}>{icon}</Text>
    <Text style={s.sectionTitleText}>{title}</Text>
  </View>
);
const FieldLabel = ({ label, required }) => (
  <Text style={s.fieldLabel}>{label}{required && <Text style={s.required}> *</Text>}</Text>
);

// WhatsApp-style voice TextInput
const VoiceTextInput = ({ label, required, value, onChangeText, placeholder,
  multiline, keyboardType, onMicPress, isRecording, fieldKey, activeRecordingField, inputRef, autoCapitalize, maxLength }) => {
  const active = isRecording && activeRecordingField === fieldKey;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (active) {
      Animated.loop(Animated.sequence([
        Animated.timing(pulse, { toValue: 1.3, duration: 500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])).start();
    } else { pulse.stopAnimation(); pulse.setValue(1); }
  }, [active]);

  return (
    <View style={s.fieldWrapper}>
      <FieldLabel label={label} required={required} />
      <View style={[s.inputRow, active && s.inputRowRec]}>
        <TextInput
          ref={inputRef}
          style={[s.textInput, multiline && s.textInputMulti]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder || `Enter ${label}`}
          placeholderTextColor={TEXT_SECONDARY}
          multiline={multiline}
          keyboardType={keyboardType || "default"}
          autoCapitalize={autoCapitalize || "sentences"}
          maxLength={maxLength}
          returnKeyType={multiline ? "default" : "done"}
        />
        <TouchableOpacity style={s.micBtn} onPress={() => onMicPress(fieldKey)} activeOpacity={0.7}>
          <Animated.View style={{ transform: [{ scale: pulse }] }}>
            <Text style={s.micIcon}>{active ? "⏹" : "🎤"}</Text>
          </Animated.View>
        </TouchableOpacity>
      </View>
      {active && (
        <View style={s.recBadge}>
          <View style={s.recDot} /><Text style={s.recText}>Listening… speak now</Text>
        </View>
      )}
    </View>
  );
};

const NextBtn = ({ onPress, label }) => (
  <TouchableOpacity style={s.nextBtn} onPress={onPress} activeOpacity={0.85}>
    <Text style={s.nextBtnTxt}>{label || "Next Step →"}</Text>
  </TouchableOpacity>
);
const AddMoreBtn = ({ onPress, label }) => (
  <TouchableOpacity style={s.addMoreBtn} onPress={onPress} activeOpacity={0.8}>
    <Text style={s.addMoreBtnTxt}>+ {label}</Text>
  </TouchableOpacity>
);

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
// Resume Category & Experience Level options (match UI from images)
const RESUME_CATEGORIES = [
  { value: "technical", label: "Technical – Software, Engineering, IT" },
  { value: "non-technical", label: "Non-Technical – Management, Sales, HR, Finance" },
  { value: "other", label: "Other – Creative, Arts, General" },
];
const EXPERIENCE_LEVELS = [
  { value: "fresher", label: "Fresher – Student or No Work Experience" },
  { value: "experienced", label: "Experienced – Working Professional" },
];

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
const CreateResumeScreen = ({ navigation }) => {
  const [currentStepKey, setCurrentStepKey] = useState("category");
  const [unlockedSteps, setUnlockedSteps] = useState(new Set(["category"]));
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [resumeCategory, setResumeCategory] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [categoryOpen, setCategoryOpen] = useState(true);
  const [levelOpen, setLevelOpen] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [activeRecField, setActiveRecField] = useState(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [downloadInfo, setDownloadInfo] = useState({ basicDownloads: 0, isPremium: false, canDownload: true, maxBasicDownloads: 5 });
  const [premiumPlans, setPremiumPlans] = useState([]);
  const [msg, setMsg] = useState({ text: "", type: "" });

  // ── Resume State (all useStates before useRefs to keep hook order stable) ──
  const [pi, setPi] = useState({ name: "", email: "", mobile: "", address: "", github: "", linkedin: "", portfolio: "" });
  const [obj, setObj] = useState("");
  const [exps, setExps] = useState([{ designation: "", company: "", startDate: "", endDate: "", description: "", stillWorking: false }]);
  const [projs, setProjs] = useState([{ name: "", company: "", technologies: "", startDate: "", endDate: "", description: "", stillInProgress: false }]);
  const [skills, setSkills] = useState("");
  const [certs, setCerts] = useState([{ name: "", organization: "", date: "" }]);
  const [edus, setEdus] = useState([{ institute: "", degree: "", fieldOfStudy: "", startDate: "", endDate: "" }]);
  const [langs, setLangs] = useState([]);

  // Flow derived from Resume Category + Experience Level (not from GitHub/Portfolio)
  const isTechnical = resumeCategory === "technical";
  const isFresher = experienceLevel === "fresher";
  const startedExperience = exps.some(e =>
    (e.designation || "").trim() || (e.company || "").trim() ||
    (e.startDate || "").trim() || (e.endDate || "").trim() || (e.description || "").trim()
  );
  const hasExperienceProvided = exps.some(e => (e.designation || "").trim() && (e.company || "").trim());
  const showExperience = experienceLevel === "experienced";
  const showProjects = isTechnical;

  const VoiceRef = useRef(null);
  const voiceOK = useRef(false);
  const activeKeyRef = useRef(null);
  const scrollRef = useRef(null);
  const inputRefs = useRef({});

  // ─── Init ────────────────────────────────────────────────────────────────
  useEffect(() => {
    initVoice(); loadUser(); fetchDL(); fetchPlans();
    return () => { if (VoiceRef.current && voiceOK.current) VoiceRef.current.destroy().catch(() => { }); };
  }, []);

  useEffect(() => {
    const u = navigation.addListener("focus", () => { loadUser(); fetchDL(); });
    return u;
  }, [navigation]);

  const initVoice = () => {
    try {
      const mod = require("@react-native-voice/voice");
      const V = mod?.default && typeof mod.default.start === "function" ? mod.default
        : typeof mod?.start === "function" ? mod : null;
      if (!V) { voiceOK.current = false; return; }
      VoiceRef.current = V; voiceOK.current = true;
    } catch { voiceOK.current = false; }
  };

  const applyVoice = (key, text) => {
    if (!key || !text) return;
    if (key === "obj") return setObj(p => p ? p + " " + text : text);
    if (key === "skills") return setSkills(p => p ? p + ", " + text : text);
    if (key.startsWith("pi_")) { const f = key.slice(3); return setPi(p => ({ ...p, [f]: text })); }
    const arrApply = (setter, prefix) => {
      if (!key.startsWith(prefix)) return false;
      const rest = key.slice(prefix.length).split("_");
      const idx = parseInt(rest[0]);
      const f = rest.slice(1).join("_");
      setter(prev => { const a = [...prev]; a[idx] = { ...a[idx], [f]: text }; return a; });
      return true;
    };
    arrApply(setExps, "exp_") || arrApply(setProjs, "proj_") || arrApply(setCerts, "cert_") || arrApply(setEdus, "edu_");
  };

  const updArr = (setter, idx, field, val) =>
    setter(p => { const a = [...p]; a[idx] = { ...a[idx], [field]: val }; return a; });

  const resetAll = () => {
    setCurrentStepKey("category");
    setUnlockedSteps(new Set(["category"]));
    setCompletedSteps(new Set());
    setResumeCategory("");
    setExperienceLevel("");
    setCategoryOpen(true);
    setLevelOpen(true);
    setPi({ name: "", email: "", mobile: "", address: "", github: "", linkedin: "", portfolio: "" });
    setObj("");
    setExps([{ designation: "", company: "", startDate: "", endDate: "", description: "", stillWorking: false }]);
    setProjs([{ name: "", company: "", technologies: "", startDate: "", endDate: "", description: "", stillInProgress: false }]);
    setSkills("");
    setCerts([{ name: "", organization: "", date: "" }]);
    setEdus([{ institute: "", degree: "", fieldOfStudy: "", startDate: "", endDate: "" }]);
    setLangs([]);
    setShowPreview(false);
    setShowPremium(false);
    setMsg({ text: "", type: "" });
    setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 50);
  };

  const onRefresh = () => {
    setRefreshing(true);
    resetAll();
    setTimeout(() => setRefreshing(false), 400);
  };

  const focusInputAndShowKeyboard = (fieldKey) => {
    const inputRef = inputRefs.current[fieldKey];
    if (inputRef && typeof inputRef.focus === "function") inputRef.focus();
  };

  const handleMic = (fieldKey) => {
    focusInputAndShowKeyboard(fieldKey);
    // Toggle a "recording" visual state per field, while using device keyboard mic for actual speech input
    setActiveRecField(prev => {
      if (prev === fieldKey && isRecording) {
        setIsRecording(false);
        return null;
      }
      setIsRecording(true);
      return fieldKey;
    });
  };

  // ─── API ─────────────────────────────────────────────────────────────────
  const loadUser = async () => {
    try { const r = await getObjByKey("loginResponse"); const u = r?.data || r?.user || r; if (u && (u.id || u.email)) setUser(u); } catch { }
  };
  const fetchDL = async () => {
    try { const r = await POSTNETWORK(`${BASE_URL}resume/downloads/count`, {}, true); if (r?.success) setDownloadInfo(r.data || downloadInfo); } catch { }
  };
  const fetchPlans = async () => {
    try { const r = await POSTNETWORK(`${BASE_URL}resume/premium/plans`, {}, false); if (r?.success) setPremiumPlans(r.data?.plans || []); } catch { }
  };
  const subscribePremium = async (planId) => {
    try {
      setLoading(true);
      const r = await POSTNETWORK(`${BASE_URL}resume/premium/subscribe`, { subscriptionType: planId, paymentMethod: "mock" }, true);
      if (r?.success) { toast("Premium activated!", "success"); setShowPremium(false); fetchDL(); }
      else toast("Failed to activate premium", "error");
    } catch { toast("Subscription error", "error"); } finally { setLoading(false); }
  };

  // ─── Progress ─────────────────────────────────────────────────────────────
  const progress = (() => {
    const checks = [];
    checks.push(!!(pi.name || "").trim());
    checks.push(!!(pi.email || "").trim());
    checks.push(!!(pi.mobile || "").trim());
    checks.push(!!(pi.address || "").trim());
    checks.push(!!obj.trim());
    checks.push(!!skills.trim());
    checks.push(edus.some(e => (e.institute || "").trim() && (e.degree || "").trim()));
    checks.push(langs.length > 0);

    if (showExperience && startedExperience) checks.push(hasExperienceProvided);
    if (showProjects) checks.push(projs.some(p => (p.name || "").trim() && (p.technologies || "").trim()));
    const startedCerts = certs.some(c => (c.name || "").trim() || (c.organization || "").trim() || (c.date || "").trim());
    if (startedCerts) checks.push(certs.some(c => (c.name || "").trim() && (c.organization || "").trim()));

    const total = checks.length;
    const done = checks.filter(Boolean).length;
    return total ? Math.round((done / total) * 100) : 0;
  })();

  const toast = (text, type = "info") => { setMsg({ text, type }); setTimeout(() => setMsg({ text: "", type: "" }), 3000); };

  const validate = (stepKey) => {
    if (stepKey === "category") {
      if (!resumeCategory) { toast("Please select a resume category", "error"); return false; }
      return true;
    }
    if (stepKey === "experienceLevel") {
      if (!experienceLevel) { toast("Please select experience level", "error"); return false; }
      return true;
    }
    if (stepKey === "personal") {
      if (!pi.name.trim()) { toast("Name is required", "error"); return false; }
      if (!pi.email.trim()) { toast("Email is required", "error"); return false; }
      if (!pi.mobile.trim()) { toast("Mobile number is required", "error"); return false; }
      if (!pi.address.trim()) { toast("Address is required", "error"); return false; }
    }
    if (stepKey === "education") {
      if (!edus[0].institute.trim()) { toast("Institute name is required", "error"); return false; }
      if (!edus[0].degree.trim()) { toast("Degree is required", "error"); return false; }
    }
    return true;
  };

  // Build step list: category → experienceLevel → personal → objective → then by flow
  const STEP_META = (() => {
    const base = [
      { key: "category", icon: "📋", label: "Category" },
      { key: "experienceLevel", icon: "📊", label: "Level" },
      { key: "personal", icon: "👤", label: "Personal" },
      { key: "objective", icon: "🎯", label: "Summary" },
    ];
    const rest = [];
    if (isTechnical && isFresher) {
      rest.push({ key: "projects", icon: "🚀", label: "Projects" }, { key: "skills", icon: "🛠", label: "Skills" }, { key: "certs", icon: "🏆", label: "Certs" }, { key: "education", icon: "🎓", label: "Education" }, { key: "languages", icon: "🌐", label: "Languages" });
    } else if (isTechnical && !isFresher) {
      rest.push({ key: "experience", icon: "💼", label: "Experience" }, { key: "projects", icon: "🚀", label: "Projects" }, { key: "skills", icon: "🛠", label: "Skills" }, { key: "certs", icon: "🏆", label: "Certs" }, { key: "education", icon: "🎓", label: "Education" }, { key: "languages", icon: "🌐", label: "Languages" });
    } else if ((resumeCategory === "non-technical" || resumeCategory === "other") && isFresher) {
      rest.push({ key: "education", icon: "🎓", label: "Education" }, { key: "skills", icon: "🛠", label: "Skills" }, { key: "languages", icon: "🌐", label: "Languages" });
    } else if ((resumeCategory === "non-technical" || resumeCategory === "other") && !isFresher) {
      rest.push({ key: "experience", icon: "💼", label: "Experience" }, { key: "education", icon: "🎓", label: "Education" }, { key: "skills", icon: "🛠", label: "Skills" }, { key: "languages", icon: "🌐", label: "Languages" });
    } else {
      rest.push({ key: "education", icon: "🎓", label: "Education" }, { key: "skills", icon: "🛠", label: "Skills" }, { key: "languages", icon: "🌐", label: "Languages" });
    }
    return [...base, ...rest];
  })();
  const STEP_KEYS = STEP_META.map(s => s.key);

  useEffect(() => {
    if (!STEP_KEYS.includes(currentStepKey)) setCurrentStepKey(STEP_KEYS[0] || "category");
    setUnlockedSteps(prev => new Set([...prev].filter(k => STEP_KEYS.includes(k))));
    setCompletedSteps(prev => new Set([...prev].filter(k => STEP_KEYS.includes(k))));
  }, [resumeCategory, experienceLevel]);

  const getNextStepKey = (fromKey) => {
    const idx = STEP_KEYS.indexOf(fromKey);
    if (idx >= 0 && idx < STEP_KEYS.length - 1) return STEP_KEYS[idx + 1];
    return null;
  };

  const goNext = () => {
    if (!validate(currentStepKey)) return;
    setCompletedSteps(p => new Set([...p, currentStepKey]));
    const nextKey = getNextStepKey(currentStepKey);
    if (nextKey) {
      setUnlockedSteps(p => new Set([...p, nextKey]));
      setCurrentStepKey(nextKey);
      setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 100);
    }
  };

  const buildHtml = () => {
    const accent = ACCENT || "#2563EB";
    const name = (pi.name || "Your Name").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const email = (pi.email || "").replace(/</g, "&lt;");
    const mobile = (pi.mobile || "").replace(/</g, "&lt;");
    const address = (pi.address || "").replace(/</g, "&lt;").replace(/\n/g, "<br/>");
    const linkedinUrlRaw = (pi.linkedin || "").trim();
    const githubUrlRaw = (pi.github || "").trim();
    const portfolioUrlRaw = (pi.portfolio || "").trim();
    const linkedinHref = linkedinUrlRaw ? (linkedinUrlRaw.startsWith("http") ? linkedinUrlRaw : `https://${linkedinUrlRaw}`) : "";
    const githubHref = githubUrlRaw ? (githubUrlRaw.startsWith("http") ? githubUrlRaw : `https://${githubUrlRaw}`) : "";
    const portfolioHref = portfolioUrlRaw ? (portfolioUrlRaw.startsWith("http") ? portfolioUrlRaw : `https://${portfolioUrlRaw}`) : "";
    const skillsTitle = isTechnical ? "TECHNICAL SKILLS" : "SKILLS";
    const objHtml = obj ? `<div class="sec"><div class="sec-title">CAREER OBJECTIVE</div><div class="hr"></div><p class="body">${(obj || "").replace(/</g, "&lt;").replace(/\n/g, "<br/>")}</p></div>` : "";
    const expsHtml = exps.some(e => e.designation) ? `<div class="sec"><div class="sec-title">WORK EXPERIENCE</div><div class="hr"></div>${exps.filter(e => e.designation).map(e => {
      const desc = (e.description || "").replace(/</g, "&lt;").split("\n").filter(Boolean).map(l => `<div class="bullet">• ${(l || "").replace(/^•\s*/, "").replace(/</g, "&lt;")}</div>`).join("");
      const endLabel = e.stillWorking ? "Present" : (e.endDate || "");
      const hasRange = (e.startDate || "") && endLabel;
      return `<div class="entry"><div class="entry-hdr"><span class="entry-title">${(e.designation || "").replace(/</g, "&lt;")}</span><span class="entry-dur">${(e.startDate || "")}${hasRange ? " – " : ""}${endLabel}</span></div><div class="entry-sub">${(e.company || "").replace(/</g, "&lt;")}</div>${desc}</div>`;
    }).join("")}</div>` : "";
    const projsHtml = showProjects && projs.some(p => p.name)
      ? `<div class="sec"><div class="sec-title">PROJECTS</div><div class="hr"></div>${projs.filter(p => p.name).map(p => {
        const pend = p.stillInProgress ? "Present" : (p.endDate || "");
        const hasRange = (p.startDate || "") && pend;
        return `<div class="entry"><div class="entry-hdr"><span class="entry-title">${(p.name || "").replace(/</g, "&lt;")}</span><span class="entry-dur">${(p.startDate || "")}${hasRange ? " – " : ""}${pend}</span></div>${p.technologies ? `<div class="entry-sub">Tech: ${(p.technologies || "").replace(/</g, "&lt;")}</div>` : ""}${p.description ? `<p class="body">${(p.description || "").replace(/</g, "&lt;").replace(/\n/g, "<br/>")}</p>` : ""}</div>`;
      }).join("")}</div>`
      : "";
    const skillsHtml = skills.trim()
      ? `<div class="sec"><div class="sec-title">${skillsTitle}</div><div class="hr"></div><p class="skills-line">${skills.split(",").filter(sk => sk.trim()).map(sk => (sk.trim() || "").replace(/</g, "&lt;")).join(", ")}</p></div>`
      : "";
    const certsHtml = certs.some(c => c.name) ? `<div class="sec"><div class="sec-title">CERTIFICATIONS</div><div class="hr"></div>${certs.filter(c => c.name).map(c => `<div class="entry"><div class="entry-hdr"><span class="entry-title">${(c.name || "").replace(/</g, "&lt;")}</span><span class="entry-dur">${(c.date || "").replace(/</g, "&lt;")}</span></div><div class="entry-sub">${(c.organization || "").replace(/</g, "&lt;")}</div></div>`).join("")}</div>` : "";
    const edusHtml = edus.some(e => e.institute) ? `<div class="sec"><div class="sec-title">EDUCATION</div><div class="hr"></div>${edus.filter(e => e.institute).map(e => `<div class="entry"><div class="entry-hdr"><span class="entry-title">${((e.degree || "") + (e.fieldOfStudy ? " — " + e.fieldOfStudy : "")).replace(/</g, "&lt;")}</span><span class="entry-dur">${(e.startDate || "")}${e.startDate && e.endDate ? " – " : ""}${e.endDate || ""}</span></div><div class="entry-sub">${(e.institute || "").replace(/</g, "&lt;")}</div></div>`).join("")}</div>` : "";
    const langsHtml = langs.length > 0 ? `<div class="sec"><div class="sec-title">LANGUAGES</div><div class="hr"></div><p class="body">${langs.join("  •  ").replace(/</g, "&lt;")}</p></div>` : "";
    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>
@page{size:A4;margin:0}
body{font-family:system-ui,-apple-system,sans-serif;color:#1e293b;font-size:12px;line-height:1.5;margin:0;padding:24px 32px;max-width:794px;margin:0 auto;box-sizing:border-box}
.paper{background:#fff;padding:24px 32px;box-sizing:border-box}
.hdr{text-align:center;border-bottom:2px solid ${accent};padding-bottom:16px;margin-bottom:20px}
.name{font-size:24px;font-weight:800;letter-spacing:1px;margin-bottom:6px;color:#0f172a}
.contact-row{display:flex;flex-wrap:wrap;gap:16px;justify-content:center;margin-bottom:4px}
.contact{font-size:12px;color:#64748b}
.addr{font-size:12px;color:#64748b;margin-bottom:4px;text-align:center}
.links{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin-top:4px}
.link{font-size:12px;color:${accent};font-weight:600}
.sec{margin-bottom:18px}
.sec-title{font-size:13px;font-weight:800;color:${accent};letter-spacing:1.5px;margin-bottom:4px}
.hr{height:1.5px;background:${accent};margin-bottom:10px;opacity:0.3}
.body{font-size:13px;line-height:20px;margin:0 0 8px}
.entry{margin-bottom:12px}
.entry-hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px}
.entry-title{font-size:14px;font-weight:700;flex:1}
.entry-dur{font-size:12px;color:#64748b;margin-left:8px}
.entry-sub{font-size:13px;color:${accent};font-weight:600;margin-bottom:4px}
.bullet{font-size:13px;line-height:20px;padding-left:4px}
.skills-line{font-size:13px;line-height:20px;margin:0 0 8px}
</style></head><body><div class="paper">
      <div class="hdr"><div class="name">${name}</div><div class="contact-row">${email ? `<span class="contact">✉ ${email}</span>` : ""}${mobile ? `<span class="contact">📞 ${mobile}</span>` : ""}</div>${address ? `<div class="addr">📍 ${address}</div>` : ""}<div class="links">${linkedinHref ? `<a class="link" href="${linkedinHref}">🔗 LinkedIn</a>` : ""}${githubHref ? `<a class="link" href="${githubHref}">💻 GitHub</a>` : ""}${portfolioHref ? `<a class="link" href="${portfolioHref}">🌐 Portfolio</a>` : ""}</div></div>
${objHtml}${expsHtml}${projsHtml}${skillsHtml}${certsHtml}${edusHtml}${langsHtml}
</div></body></html>`;
  };

  const requestStoragePermission = async () => {
    if (Platform.OS !== "android") return true;
    if (Platform.Version >= 33) return true;
    try {
      const perm = PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;
      const granted = await PermissionsAndroid.check(perm);
      if (granted) return true;
      const result = await PermissionsAndroid.request(perm, {
        title: "Storage Permission",
        message: "App needs storage access to save your resume PDF.",
        buttonNeutral: "Ask Later",
        buttonNegative: "Cancel",
        buttonPositive: "OK",
      });
      return result === PermissionsAndroid.RESULTS.GRANTED;
    } catch { return false; }
  };

  const handleDownload = async () => {
    if (!downloadInfo.canDownload && !downloadInfo.isPremium) { setShowPremium(true); return; }
    try {
      setLoading(true);
      const hasPerm = await requestStoragePermission();
      if (!hasPerm) {
        console.log("[Resume download] FAILED: Storage permission denied.");
        toast("Storage permission needed to save", "error");
        return;
      }

      const baseName = `Resume_${(pi.name || "Resume").replace(/\s+/g, "_")}_${Date.now()}`;
      const saveDir = Platform.OS === "ios"
        ? ReactNativeBlobUtil.fs.dirs.DocumentDir
        : (ReactNativeBlobUtil.fs.dirs.DownloadDir || ReactNativeBlobUtil.fs.dirs.CacheDir);
      console.log("[Resume download] saveDir:", saveDir);

      let RNHTMLtoPDF = null;
      try { RNHTMLtoPDF = require("react-native-html-to-pdf").default; } catch (err) {
        console.log("[Resume download] PDF library not available — reason:", err?.message || err);
      }

      if (RNHTMLtoPDF) {
        try {
          console.log("[Resume download] Generating PDF...");
          // Target A4 size (~595x842 points) for exported PDF
          const options = {
            html: buildHtml(),
            base64: true,
            width: 595.28,
            height: 841.89,
          };
          const file = await RNHTMLtoPDF.convert(options);
          const base64Data = file?.base64;
          if (!base64Data) {
            console.log("[Resume download] FAILED: PDF convert returned no base64. file:", JSON.stringify(file));
          } else {
            const filePath = `${saveDir}/${baseName}.pdf`;
            console.log("[Resume download] Writing PDF to:", filePath);
            await ReactNativeBlobUtil.fs.writeFile(filePath, base64Data, "base64");
            if (Platform.OS === "android") {
              // Use two-argument form to avoid Activity context error
              await ReactNativeBlobUtil.android.actionViewIntent(filePath, "application/pdf");
            } else {
              await Linking.openURL(`file://${filePath}`);
            }
            console.log("[Resume download] PDF saved and opened successfully.");
            toast("Resume saved. Open with your preferred app.", "success");
            fetchDL();
            return;
          }
        } catch (pdfErr) {
          console.log("[Resume download] PDF failed — reason:", pdfErr?.message || pdfErr);
          console.log("[Resume download] PDF error stack:", pdfErr?.stack);
        }
      }

      console.log("[Resume download] Falling back to HTML save.");
      const filePath = `${saveDir}/${baseName}.html`;
      await ReactNativeBlobUtil.fs.writeFile(filePath, buildHtml(), "utf8");
      if (Platform.OS === "android") {
        // Use two-argument form here as well
        await ReactNativeBlobUtil.android.actionViewIntent(filePath, "text/html");
      } else {
        await Linking.openURL(`file://${filePath}`);
      }
      toast("Resume saved. Open in browser, then Print → Save as PDF.", "success");
      fetchDL();
    } catch (e) {
      console.log("[Resume download] FAILED — reason:", e?.message || e);
      console.log("[Resume download] Error stack:", e?.stack);
      toast("Failed to save resume.", "error");
    } finally { setLoading(false); }
  };

  const buildText = () => `
${pi.name.toUpperCase()}
${pi.email} | ${pi.mobile}
${pi.address}
${pi.linkedin ? "LinkedIn: " + pi.linkedin : ""}
${pi.github ? "GitHub: " + pi.github : ""}
${pi.portfolio ? "Portfolio: " + pi.portfolio : ""}

CAREER OBJECTIVE
${obj}

EXPERIENCE
${exps.map((e, i) => {
    const endLabel = e.stillWorking ? "Present" : e.endDate;
    const range = e.startDate || endLabel ? `(${e.startDate || ""}${e.startDate && endLabel ? " - " : ""}${endLabel || ""})` : "";
    return `${i + 1}. ${e.designation} at ${e.company} ${range}\n   ${e.description}`;
  }).join("\n\n")}

${showProjects
      ? "PROJECTS\n" + projs.map((p, i) => {
        const pend = p.stillInProgress ? "Present" : p.endDate;
        const range = p.startDate || pend ? `(${p.startDate || ""}${p.startDate && pend ? " - " : ""}${pend || ""})` : "";
        return `${i + 1}. ${p.name} | Tech: ${p.technologies} ${range}\n   ${p.description}`;
      }).join("\n\n")
      : ""}

${isTechnical ? "TECHNICAL SKILLS" : "SKILLS"}
${skills.split(",").map(s => "• " + s.trim()).join("\n")}

CERTIFICATIONS
${certs.map((c, i) => `${i + 1}. ${c.name} — ${c.organization} (${c.date})`).join("\n")}

EDUCATION
${edus.map((e, i) => `${i + 1}. ${e.degree} in ${e.fieldOfStudy}, ${e.institute} (${e.startDate} - ${e.endDate})`).join("\n")}

LANGUAGES
${langs.join(", ")}`.trim();

  const openUrl = (url) => {
    if (!url) return;
    const trimmed = url.trim();
    const finalUrl = trimmed.startsWith("http://") || trimmed.startsWith("https://") ? trimmed : `https://${trimmed}`;
    Linking.openURL(finalUrl).catch(() => { });
  };

  // ─── Step Dots ────────────────────────────────────────────────────────────
  const renderDots = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.dotsScroll}>
      {STEP_META.map((m) => {
        const active = currentStepKey === m.key;
        const done = completedSteps.has(m.key);
        const lockedByRule = m.key === "projects" && !showProjects;
        const unlocked = unlockedSteps.has(m.key);
        const canPress = unlocked && !lockedByRule;
        return (
          <TouchableOpacity
            key={m.key}
            style={[s.dot, active && s.dotActive, done && s.dotDone, !canPress && s.dotLocked]}
            onPress={() => { if (canPress) setCurrentStepKey(m.key); }}
            activeOpacity={canPress ? 0.85 : 1}
            disabled={!canPress}
          >
            <Text style={s.dotIcon}>{done ? "✓" : (!canPress ? "🔒" : m.icon)}</Text>
            <Text style={[s.dotLabel, active && s.dotLabelActive, !canPress && s.dotLabelLocked]}>{m.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const renderProgress = () => (
    <View style={s.progWrap}>
      <View style={s.progRow}>
        <Text style={s.progLabel}>Profile Completion</Text>
        <Text style={s.progPct}>{progress}%</Text>
      </View>
      <View style={s.progTrack}><View style={[s.progFill, { width: `${progress}%` }]} /></View>
    </View>
  );

  // ─── Sections ─────────────────────────────────────────────────────────────
  const vProps = (key) => ({
    onMicPress: handleMic, isRecording, fieldKey: key, activeRecordingField: activeRecField,
    inputRef: (ref) => { if (ref) inputRefs.current[key] = ref; },
  });

  const S_category = () => (
    <SectionCard>
      <SectionTitle icon="📋" title="RESUME CATEGORY" />
      <Text style={s.radioSectionHint}>Select your field...</Text>
      <TouchableOpacity style={s.selectFieldWrap} activeOpacity={0.85} onPress={() => setCategoryOpen(p => !p)}>
        <Text style={resumeCategory ? s.selectFieldValue : s.selectFieldPlaceholder}>
          {resumeCategory ? (RESUME_CATEGORIES.find(o => o.value === resumeCategory)?.label || "Selected") : "Select your field..."}
        </Text>
        <Text style={s.chevron}>{categoryOpen ? "▲" : "▼"}</Text>
      </TouchableOpacity>
      {categoryOpen && (
        <View style={s.radioGroup}>
          {RESUME_CATEGORIES.map((opt) => {
            const selected = resumeCategory === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[s.radioCard, selected && s.radioCardSelected]}
                onPress={() => { setResumeCategory(opt.value); setExperienceLevel(""); setCategoryOpen(false); setLevelOpen(true); }}
                activeOpacity={0.85}
              >
                <View style={[s.radioCircle, selected && s.radioCircleSelected]}>{selected ? <Text style={s.radioTick}>✓</Text> : null}</View>
                <Text style={[s.radioLabel, selected && s.radioLabelSelected]}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
      <NextBtn onPress={goNext} />
    </SectionCard>
  );

  const S_experienceLevel = () => (
    <SectionCard>
      <SectionTitle icon="📊" title="EXPERIENCE LEVEL" />
      <Text style={s.radioSectionHint}>Select experience level...</Text>
      <TouchableOpacity style={s.selectFieldWrap} activeOpacity={0.85} onPress={() => setLevelOpen(p => !p)}>
        <Text style={experienceLevel ? s.selectFieldValue : s.selectFieldPlaceholder}>
          {experienceLevel ? (EXPERIENCE_LEVELS.find(o => o.value === experienceLevel)?.label || "Selected") : "Select experience level..."}
        </Text>
        <Text style={s.chevron}>{levelOpen ? "▲" : "▼"}</Text>
      </TouchableOpacity>
      {levelOpen && (
        <View style={s.radioGroup}>
          {EXPERIENCE_LEVELS.map((opt) => {
            const selected = experienceLevel === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[s.radioCard, selected && s.radioCardSelected]}
                onPress={() => { setExperienceLevel(opt.value); setLevelOpen(false); }}
                activeOpacity={0.85}
              >
                <View style={[s.radioCircle, selected && s.radioCircleSelected]}>{selected ? <Text style={s.radioTick}>✓</Text> : null}</View>
                <Text style={[s.radioLabel, selected && s.radioLabelSelected]}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
      <NextBtn onPress={goNext} />
    </SectionCard>
  );

  const S0 = () => (
    <SectionCard>
      <SectionTitle icon="👤" title="Personal Information" />
      {[
        { key: "name", label: "Full Name", required: true },
        { key: "email", label: "Email Address", required: true, kb: "email-address", autoCap: "none" },
        { key: "mobile", label: "Mobile Number", required: true, kb: "phone-pad", maxLen: 10 },
        { key: "address", label: "Address", required: true, multi: true },
        { key: "github", label: "GitHub Profile URL", required: false, kb: "url" },
        { key: "linkedin", label: "LinkedIn Profile URL", required: false, kb: "url" },
        { key: "portfolio", label: "Portfolio URL", required: false, kb: "url" },
      ].map(({ key, label, required, kb, multi, autoCap, maxLen }) => {
        const handleChange = (v) => {
          let nextVal = v;
          if (key === "email") {
            nextVal = v.toLowerCase();
          } else if (key === "mobile") {
            const digitsOnly = v.replace(/\D/g, "");
            nextVal = digitsOnly.slice(0, 10);
          }
          setPi(p => ({ ...p, [key]: nextVal }));
        };
        return (
          <VoiceTextInput
            key={key}
            label={label}
            required={required}
            value={pi[key]}
            onChangeText={handleChange}
            keyboardType={kb}
            multiline={multi}
            autoCapitalize={autoCap}
            maxLength={maxLen}
            {...vProps(`pi_${key}`)}
          />
        );
      })}
      <NextBtn onPress={goNext} />
    </SectionCard>
  );

  const S1 = () => (
    <SectionCard>
      <SectionTitle icon="🎯" title="Career Objective" />
      <Text style={s.hint}>Write a compelling career objective using the text field or your voice.</Text>
      <VoiceTextInput label="Career Objective" value={obj} onChangeText={setObj} multiline
        placeholder="Describe your professional goals and background..." {...vProps("obj")} />
      <NextBtn onPress={goNext} />
    </SectionCard>
  );

  const S2 = () => (
    <SectionCard>
      <SectionTitle icon="💼" title="Work Experience" />
      {exps.map((exp, idx) => (
        <View key={idx} style={s.subCard}>
          <Text style={s.subTitle}>Experience {idx + 1}</Text>
          <VoiceTextInput label="Designation" value={exp.designation}
            onChangeText={v => updArr(setExps, idx, "designation", v)} {...vProps(`exp_${idx}_designation`)} />
          <VoiceTextInput label="Company Name" value={exp.company}
            onChangeText={v => updArr(setExps, idx, "company", v)} {...vProps(`exp_${idx}_company`)} />
          <View style={s.dateRow}>
            <View style={s.dateCol}><FieldLabel label="Start Date" />
              <DateComponent value={exp.startDate} onChange={d => updArr(setExps, idx, "startDate", d)} format="MMM YYYY" placeholder="Select Month & Year" /></View>
            {!exp.stillWorking && (
              <View style={s.dateCol}>
                <FieldLabel label="End Date" />
                <DateComponent value={exp.endDate} onChange={d => updArr(setExps, idx, "endDate", d)} format="MMM YYYY" placeholder="Select Month & Year" />
              </View>
            )}
          </View>
          <TouchableOpacity
            style={s.checkboxRow}
            activeOpacity={0.8}
            onPress={() => updArr(setExps, idx, "stillWorking", !exp.stillWorking)}
          >
            <View style={[s.checkboxBox, exp.stillWorking && s.checkboxBoxChecked]}>
              {exp.stillWorking && <Text style={s.checkboxTick}>✓</Text>}
            </View>
            <Text style={s.checkboxLabel}>I am currently working here</Text>
          </TouchableOpacity>
          <VoiceTextInput label="Description (Bullet Points)" value={exp.description}
            onChangeText={v => updArr(setExps, idx, "description", v)} multiline
            placeholder={"• Led a team of 5...\n• Increased performance by 30%..."} {...vProps(`exp_${idx}_description`)} />
          {exps.length > 1 && <TouchableOpacity style={s.removeBtn} onPress={() => setExps(p => p.filter((_, i) => i !== idx))}>
            <Text style={s.removeTxt}>✕ Remove</Text></TouchableOpacity>}
        </View>
      ))}
      <AddMoreBtn onPress={() => setExps(p => [...p, { designation: "", company: "", startDate: "", endDate: "", description: "", stillWorking: false }])} label="Add Another Experience" />
      <NextBtn onPress={goNext} />
    </SectionCard>
  );

  const S3 = () => (
      <SectionCard>
        <SectionTitle icon="🚀" title="Projects" />
        {projs.map((proj, idx) => (
          <View key={idx} style={s.subCard}>
            <Text style={s.subTitle}>Project {idx + 1}</Text>
            <VoiceTextInput label="Project Name" value={proj.name}
              onChangeText={v => updArr(setProjs, idx, "name", v)} {...vProps(`proj_${idx}_name`)} />
            <VoiceTextInput label="Company / Client Name" value={proj.company}
              onChangeText={v => updArr(setProjs, idx, "company", v)} {...vProps(`proj_${idx}_company`)} />
            <VoiceTextInput label="Technologies Used" value={proj.technologies}
              onChangeText={v => updArr(setProjs, idx, "technologies", v)} {...vProps(`proj_${idx}_technologies`)} />
            <View style={s.dateRow}>
              <View style={s.dateCol}><FieldLabel label="Start Date" />
                <DateComponent value={proj.startDate} onChange={d => updArr(setProjs, idx, "startDate", d)} format="MMM YYYY" placeholder="Select Month & Year" /></View>
              {!proj.stillInProgress && (
                <View style={s.dateCol}>
                  <FieldLabel label="End Date" />
                  <DateComponent value={proj.endDate} onChange={d => updArr(setProjs, idx, "endDate", d)} format="MMM YYYY" placeholder="Select Month & Year" />
                </View>
              )}
            </View>
            <TouchableOpacity
              style={s.checkboxRow}
              activeOpacity={0.8}
              onPress={() => updArr(setProjs, idx, "stillInProgress", !proj.stillInProgress)}
            >
              <View style={[s.checkboxBox, proj.stillInProgress && s.checkboxBoxChecked]}>
                {proj.stillInProgress && <Text style={s.checkboxTick}>✓</Text>}
              </View>
              <Text style={s.checkboxLabel}>This project is still in progress</Text>
            </TouchableOpacity>
            <VoiceTextInput label="Description" value={proj.description}
              onChangeText={v => updArr(setProjs, idx, "description", v)} multiline
              placeholder="Describe the project..." {...vProps(`proj_${idx}_description`)} />
            {projs.length > 1 && <TouchableOpacity style={s.removeBtn} onPress={() => setProjs(p => p.filter((_, i) => i !== idx))}>
              <Text style={s.removeTxt}>✕ Remove</Text></TouchableOpacity>}
          </View>
        ))}
        <AddMoreBtn onPress={() => setProjs(p => [...p, { name: "", company: "", technologies: "", startDate: "", endDate: "", description: "", stillInProgress: false }])} label="Add Another Project" />
        <NextBtn onPress={goNext} />
      </SectionCard>
  );

  const S4 = () => (
    <SectionCard>
      <SectionTitle icon={isTechnical ? "🛠" : "🎯"} title={isTechnical ? "Technical Skills" : "Skills"} />
      <Text style={s.hint}>Enter skills separated by commas — they'll appear as bullet points in your resume.</Text>
      <VoiceTextInput label="Skills" value={skills} onChangeText={setSkills} multiline
        placeholder="React Native, JavaScript, Node.js, Python, Git..." {...vProps("skills")} />
      {skills.trim() && (
        <View style={s.skillPreview}>
          <Text style={s.skillPreviewLabel}>Preview:</Text>
          {skills.split(",").filter(t => t.trim()).map((sk, i) => (
            <Text key={i} style={s.skillBullet}>• {sk.trim()}</Text>
          ))}
        </View>
      )}
      <NextBtn onPress={goNext} />
    </SectionCard>
  );

  const S5 = () => (
    <SectionCard>
      <SectionTitle icon="🏆" title="Certifications" />
      {certs.map((cert, idx) => (
        <View key={idx} style={s.subCard}>
          <Text style={s.subTitle}>Certification {idx + 1}</Text>
          <VoiceTextInput label="Certification Name" value={cert.name}
            onChangeText={v => updArr(setCerts, idx, "name", v)} {...vProps(`cert_${idx}_name`)} />
          <VoiceTextInput label="Issued Organization" value={cert.organization}
            onChangeText={v => updArr(setCerts, idx, "organization", v)} {...vProps(`cert_${idx}_organization`)} />
          <FieldLabel label="Date Obtained" />
          <DateComponent value={cert.date} onChange={d => updArr(setCerts, idx, "date", d)} format="MMM YYYY" placeholder="Select Date" />
          {certs.length > 1 && <TouchableOpacity style={[s.removeBtn, { marginTop: 10 }]} onPress={() => setCerts(p => p.filter((_, i) => i !== idx))}>
            <Text style={s.removeTxt}>✕ Remove</Text></TouchableOpacity>}
        </View>
      ))}
      <AddMoreBtn onPress={() => setCerts(p => [...p, { name: "", organization: "", date: "" }])} label="Add Another Certification" />
      <NextBtn onPress={goNext} />
    </SectionCard>
  );

  const S6 = () => (
    <SectionCard>
      <SectionTitle icon="🎓" title="Education" />
      {edus.map((edu, idx) => (
        <View key={idx} style={s.subCard}>
          <Text style={s.subTitle}>Education {idx + 1}</Text>
          <VoiceTextInput label="Institute Name" required={idx === 0} value={edu.institute}
            onChangeText={v => updArr(setEdus, idx, "institute", v)} {...vProps(`edu_${idx}_institute`)} />
          <VoiceTextInput label="Degree" required={idx === 0} value={edu.degree}
            onChangeText={v => updArr(setEdus, idx, "degree", v)} {...vProps(`edu_${idx}_degree`)} />
          <VoiceTextInput label="Field of Study" value={edu.fieldOfStudy}
            onChangeText={v => updArr(setEdus, idx, "fieldOfStudy", v)} {...vProps(`edu_${idx}_fieldOfStudy`)} />
          <View style={s.dateRow}>
            <View style={s.dateCol}><FieldLabel label="Start Year" />
              <DateComponent value={edu.startDate} onChange={d => updArr(setEdus, idx, "startDate", d)} format="MMM YYYY" placeholder="Select Start" /></View>
            <View style={s.dateCol}><FieldLabel label="End / Passing Year" />
              <DateComponent value={edu.endDate} onChange={d => updArr(setEdus, idx, "endDate", d)} format="MMM YYYY" placeholder="Select End" /></View>
          </View>
          {edus.length > 1 && <TouchableOpacity style={s.removeBtn} onPress={() => setEdus(p => p.filter((_, i) => i !== idx))}>
            <Text style={s.removeTxt}>✕ Remove</Text></TouchableOpacity>}
        </View>
      ))}
      <AddMoreBtn onPress={() => setEdus(p => [...p, { institute: "", degree: "", fieldOfStudy: "", startDate: "", endDate: "" }])} label="Add Another Education" />
      <NextBtn onPress={goNext} />
    </SectionCard>
  );

  const S7 = () => (
    <SectionCard>
      <SectionTitle icon="🌐" title="Languages" />
      <Text style={s.hint}>Select all languages you know:</Text>
      <View style={s.langGrid}>
        {WORLD_LANGUAGES.map(lang => {
          const sel = langs.includes(lang);
          return (
            <TouchableOpacity key={lang} style={[s.langChip, sel && s.langChipSel]}
              onPress={() => setLangs(p => sel ? p.filter(l => l !== lang) : [...p, lang])}>
              <Text style={[s.langChipTxt, sel && s.langChipTxtSel]}>{sel ? "✓ " : ""}{lang}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {/* Final actions */}
      <View style={s.finalSection}>
        <View style={s.progWrap}>
          <View style={s.progRow}>
            <Text style={s.progLabel}>Resume Completion</Text>
            <Text style={[s.progPct, progress === 100 && { color: SUCCESS }]}>{progress}%</Text>
          </View>
          <View style={s.progTrack}><View style={[s.progFill, { width: `${progress}%` }]} /></View>
        </View>
        <View style={s.statusRow}>
          <View style={[s.statusBadge, downloadInfo.isPremium ? s.badgePremium : s.badgeBasic]}>
            <Text style={s.statusBadgeTxt}>
              {downloadInfo.isPremium ? "⭐ Premium — Unlimited Downloads" : `📥 ${downloadInfo.basicDownloads}/${downloadInfo.maxBasicDownloads} downloads used`}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={[s.createBtn, loading && { opacity: 0.7 }]} onPress={() => setShowPreview(true)} disabled={loading}>
          {loading ? <ActivityIndicator color={WHITE} /> : <Text style={s.createBtnTxt}>✅ Submit & Preview Resume</Text>}
        </TouchableOpacity>
        {!downloadInfo.isPremium && (
          <TouchableOpacity style={s.upgradeBtn} onPress={() => setShowPremium(true)}>
            <Text style={s.upgradeBtnTxt}>⭐ Upgrade to Premium</Text>
          </TouchableOpacity>
        )}
      </View>
    </SectionCard>
  );

  const SECTION_RENDERERS = {
    category: S_category,
    experienceLevel: S_experienceLevel,
    personal: S0,
    objective: S1,
    experience: S2,
    projects: S3,
    skills: S4,
    certs: S5,
    education: S6,
    languages: S7,
  };

  // ─── Preview Modal ────────────────────────────────────────────────────────
  const PreviewModal = () => (
    <Modal visible={showPreview} animationType="slide" onRequestClose={() => setShowPreview(false)}>
      <View style={s.previewModal}>
        <View style={s.previewHdr}>
          <Text style={s.previewHdrTxt}>Resume Preview</Text>
          <TouchableOpacity onPress={() => setShowPreview(false)}><Text style={s.closeBtn}>✕ Close</Text></TouchableOpacity>
        </View>
        <ScrollView style={s.previewScroll} showsVerticalScrollIndicator={false}>
          <View style={s.paper}>
            {/* Name & Contact */}
            <View style={s.paperHdr}>
              <Text style={s.paperName}>{pi.name || "Your Name"}</Text>
              <View style={s.paperContactRow}>
                {pi.email && (
                  <View style={s.contactChip}>
                    <Image source={MAIL} style={s.iconSmall} resizeMode="contain" />
                    <Text style={s.paperContact}>{pi.email}</Text>
                  </View>
                )}
                {pi.mobile && <Text style={s.paperContact}>📞 {pi.mobile}</Text>}
              </View>
              {pi.address && <Text style={s.paperAddr}>📍 {pi.address}</Text>}
              <View style={s.paperLinksRow}>
                {pi.linkedin && (
                  <TouchableOpacity style={s.linkChip} onPress={() => openUrl(pi.linkedin)}>
                    <Image source={LINKEDIN} style={s.iconSmall} resizeMode="contain" />
                    <Text style={s.paperLink}>LinkedIn</Text>
                  </TouchableOpacity>
                )}
                {pi.github && (
                  <TouchableOpacity style={s.linkChip} onPress={() => openUrl(pi.github)}>
                    <Image source={GITHUB} style={s.iconSmall} resizeMode="contain" />
                    <Text style={s.paperLink}>GitHub</Text>
                  </TouchableOpacity>
                )}
                {pi.portfolio && (
                  <TouchableOpacity style={s.linkChip} onPress={() => openUrl(pi.portfolio)}>
                    <Image source={PORTFOLIO_ICON} style={s.iconSmall} resizeMode="contain" />
                    <Text style={s.paperLink}>Portfolio</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            {/* Sections */}
            {obj ? (<View style={s.paperSec}><Text style={s.paperSecTitle}>CAREER OBJECTIVE</Text><View style={s.paperDiv} /><Text style={s.paperBody}>{obj}</Text></View>) : null}
            {exps.some(e => e.designation) && (
              <View style={s.paperSec}><Text style={s.paperSecTitle}>WORK EXPERIENCE</Text><View style={s.paperDiv} />
                {exps.filter(e => e.designation).map((e, i) => {
                  const endLabel = e.stillWorking ? "Present" : e.endDate;
                  return (
                    <View key={i} style={s.entry}>
                      <View style={s.entryHdr}><Text style={s.entryTitle}>{e.designation}</Text><Text style={s.entryDur}>{e.startDate}{e.startDate && endLabel ? " – " : ""}{endLabel}</Text></View>
                      <Text style={s.entrySub}>{e.company}</Text>
                      {e.description ? e.description.split("\n").filter(Boolean).map((l, li) => <Text key={li} style={s.bullet}>• {l.replace(/^•\s*/, "")}</Text>) : null}
                    </View>
                  )
                })}
              </View>
            )}
            {showProjects && projs.some(p => p.name) && (
              <View style={s.paperSec}><Text style={s.paperSecTitle}>PROJECTS</Text><View style={s.paperDiv} />
                {projs.filter(p => p.name).map((p, i) => (
                  <View key={i} style={s.entry}>
                    <View style={s.entryHdr}><Text style={s.entryTitle}>{p.name}</Text><Text style={s.entryDur}>{p.startDate}{p.startDate && p.endDate ? " – " : ""}{p.endDate}</Text></View>
                    {p.technologies && <Text style={s.entrySub}>Tech: {p.technologies}</Text>}
                    {p.description && <Text style={s.paperBody}>{p.description}</Text>}
                  </View>
                ))}
              </View>
            )}
            {skills.trim() && (
              <View style={s.paperSec}><Text style={s.paperSecTitle}>{isTechnical ? "TECHNICAL SKILLS" : "SKILLS"}</Text><View style={s.paperDiv} />
                <View style={s.skillGrid}>
                  {skills.split(",").filter(sk => sk.trim()).map((sk, i) => (
                    <View key={i} style={s.skillChip}><Text style={s.skillChipTxt}>{sk.trim()}</Text></View>
                  ))}
                </View>
              </View>
            )}
            {certs.some(c => c.name) && (
              <View style={s.paperSec}><Text style={s.paperSecTitle}>CERTIFICATIONS</Text><View style={s.paperDiv} />
                {certs.filter(c => c.name).map((c, i) => (
                  <View key={i} style={s.entry}>
                    <View style={s.entryHdr}><Text style={s.entryTitle}>{c.name}</Text><Text style={s.entryDur}>{c.date}</Text></View>
                    <Text style={s.entrySub}>{c.organization}</Text>
                  </View>
                ))}
              </View>
            )}
            {edus.some(e => e.institute) && (
              <View style={s.paperSec}><Text style={s.paperSecTitle}>EDUCATION</Text><View style={s.paperDiv} />
                {edus.filter(e => e.institute).map((e, i) => (
                  <View key={i} style={s.entry}>
                    <View style={s.entryHdr}><Text style={s.entryTitle}>{e.degree}{e.fieldOfStudy ? " — " + e.fieldOfStudy : ""}</Text><Text style={s.entryDur}>{e.startDate}{e.startDate && e.endDate ? " – " : ""}{e.endDate}</Text></View>
                    <Text style={s.entrySub}>{e.institute}</Text>
                  </View>
                ))}
              </View>
            )}
            {langs.length > 0 && (
              <View style={s.paperSec}><Text style={s.paperSecTitle}>LANGUAGES</Text><View style={s.paperDiv} />
                <Text style={s.paperBody}>{langs.join("  •  ")}</Text>
              </View>
            )}
          </View>
        </ScrollView>
        <TouchableOpacity style={s.createBtn} onPress={handleDownload} disabled={loading}>
          {loading ? <ActivityIndicator color={WHITE} /> : <Text style={s.createBtnTxt}>📄 Download as PDF</Text>}
        </TouchableOpacity>
      </View>
    </Modal>
  );

  // ─── Premium Modal ────────────────────────────────────────────────────────
  const PremiumModal = () => (
    <Modal visible={showPremium} transparent animationType="fade" onRequestClose={() => setShowPremium(false)}>
      <View style={s.modalOverlay}>
        <View style={s.modalBox}>
          <Text style={s.modalTitle}>⭐ Upgrade to Premium</Text>
          <View style={s.benefitsList}>
            {["Unlimited resume downloads", "Premium PDF templates", "Priority support", "Advanced formatting"].map((b, i) => (
              <Text key={i} style={s.benefitItem}>✅ {b}</Text>
            ))}
          </View>
          {premiumPlans.length > 0
            ? premiumPlans.map(plan => (
              <View key={plan.id} style={s.planCard}>
                <Text style={s.planName}>{plan.name}</Text>
                <Text style={s.planPrice}>${plan.price} / {plan.duration}</Text>
                <TouchableOpacity style={s.createBtn} onPress={() => subscribePremium(plan.id)} disabled={loading}>
                  {loading ? <ActivityIndicator color={WHITE} /> : <Text style={s.createBtnTxt}>Choose {plan.name}</Text>}
                </TouchableOpacity>
              </View>
            ))
            : <Text style={s.hint}>No plans available at the moment.</Text>}
          <TouchableOpacity style={s.cancelBtn} onPress={() => setShowPremium(false)}>
            <Text style={s.cancelBtnTxt}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // ─── Render (single return to keep hook order stable; no early return) ─────
  if (!user) {
    return (
      <View style={s.container}>
        <MyStatusBar barStyle="dark-content" backgroundColor={WHITE} />
        <MyHeader navigation={navigation} showBack showCenterTitle title="Create Resume" onBackPress={() => navigation.goBack()} showLogo={false} />
        <View style={s.centerView}>
          <Text style={s.errorTxt}>Please login to create your resume</Text>
          <TouchableOpacity style={s.createBtn} onPress={() => navigation.navigate("LoginScreen")}>
            <Text style={s.createBtnTxt}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}>
      <MyStatusBar barStyle="dark-content" backgroundColor={WHITE} />
      <MyHeader navigation={navigation} showBack showCenterTitle title="Create Resume" onBackPress={() => navigation.goBack()} showLogo={false} />
      {msg.text && (
        <View style={[s.toast, msg.type === "error" ? s.toastErr : msg.type === "success" ? s.toastOk : s.toastInfo]}>
          <Text style={s.toastTxt}>{msg.text}</Text>
        </View>
      )}
      {renderDots()}
      <View style={{ paddingHorizontal: 16, marginBottom: 4 }}>{renderProgress()}</View>
      <ScrollView ref={scrollRef} style={s.scroll} contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={true} keyboardShouldPersistTaps="handled" nestedScrollEnabled
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {SECTION_RENDERERS[currentStepKey]?.()}
      </ScrollView>
      <PreviewModal />
      <PremiumModal />
    </KeyboardAvoidingView>
  );
};

// ─── STYLES ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F4FF" },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 320, flexGrow: 1 },
  centerView: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  errorTxt: { fontSize: 16, color: BLACK, marginBottom: 20, textAlign: "center" },

  // Toast
  toast: { marginHorizontal: 16, marginTop: 8, padding: 12, borderRadius: 10 },
  toastErr: { backgroundColor: "#FEE2E2" },
  toastOk: { backgroundColor: "#D1FAE5" },
  toastInfo: { backgroundColor: "#DBEAFE" },
  toastTxt: { fontSize: 14, fontWeight: "600", color: BLACK },

  // Step Dots
  dotsScroll: { paddingHorizontal: 12, paddingVertical: 10, backgroundColor: WHITE, maxHeight: 80 },
  dot: { alignItems: "center", marginHorizontal: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, minWidth: 68 },
  dotActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  dotDone: { backgroundColor: "#D1FAE5", borderColor: SUCCESS },
  dotLocked: { opacity: 0.45 },
  dotIcon: { fontSize: 18 },
  dotLabel: { fontSize: 10, color: TEXT_SECONDARY, marginTop: 2, fontWeight: "600" },
  dotLabelActive: { color: WHITE },
  dotLabelLocked: { color: TEXT_SECONDARY },

  // Progress
  progWrap: { marginVertical: 8 },
  progRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  progLabel: { fontSize: 13, color: TEXT_SECONDARY, fontWeight: "600" },
  progPct: { fontSize: 13, color: ACCENT, fontWeight: "700" },
  progTrack: { height: 6, backgroundColor: BORDER, borderRadius: 3, overflow: "hidden" },
  progFill: { height: 6, backgroundColor: ACCENT, borderRadius: 3 },

  // Section Card
  sectionCard: { backgroundColor: WHITE, borderRadius: 16, padding: 20, marginBottom: 24, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  sectionIcon: { fontSize: 22, marginRight: 10 },
  sectionTitleText: { fontSize: 18, fontWeight: "700", color: BLACK },
  hint: { fontSize: 13, color: TEXT_SECONDARY, marginBottom: 16, lineHeight: 18 },

  // Resume Category / Experience Level (dropdown + radio cards)
  radioSectionHint: { fontSize: 13, color: TEXT_SECONDARY, marginBottom: 10, fontWeight: "600" },
  selectFieldWrap: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1.5, borderColor: SUCCESS, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 16, backgroundColor: WHITE, minHeight: 48 },
  selectFieldPlaceholder: { fontSize: 15, color: TEXT_SECONDARY },
  selectFieldValue: { fontSize: 15, color: BLACK, fontWeight: "600", flex: 1 },
  chevron: { fontSize: 12, color: TEXT_SECONDARY },
  radioGroup: { gap: 12 },
  radioCard: { flexDirection: "row", alignItems: "center", backgroundColor: WHITE, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1.5, borderColor: BORDER },
  radioCardSelected: { borderColor: SUCCESS, backgroundColor: "#F0FDF4" },
  radioCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: BORDER, marginRight: 12, alignItems: "center", justifyContent: "center", backgroundColor: WHITE },
  radioCircleSelected: { borderColor: SUCCESS, backgroundColor: SUCCESS },
  radioTick: { color: WHITE, fontSize: 12, fontWeight: "700" },
  radioLabel: { flex: 1, fontSize: 14, color: BLACK, fontWeight: "500" },
  radioLabelSelected: { color: "#166534", fontWeight: "600" },

  // Sub Card
  subCard: { backgroundColor: SURFACE, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: BORDER },
  subTitle: { fontSize: 14, fontWeight: "700", color: ACCENT, marginBottom: 12 },

  // Field
  fieldWrapper: { marginBottom: 20 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: BLACK, marginBottom: 6 },
  required: { color: DANGER, fontWeight: "700" },

  // Voice Input
  inputRow: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: BORDER, borderRadius: 12, backgroundColor: WHITE, overflow: "hidden" },
  inputRowRec: { borderColor: DANGER, borderWidth: 2 },
  textInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: BLACK, minHeight: 48 },
  textInputMulti: { minHeight: 100, textAlignVertical: "top" },
  micBtn: { width: 46, height: 48, justifyContent: "center", alignItems: "center", borderLeftWidth: 1, borderLeftColor: BORDER, backgroundColor: SURFACE },
  micIcon: { fontSize: 20 },
  recBadge: { flexDirection: "row", alignItems: "center", marginTop: 6, backgroundColor: "#FEE2E2", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: "flex-start" },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: DANGER, marginRight: 6 },
  recText: { fontSize: 12, color: DANGER, fontWeight: "600" },

  // Date Row
  dateRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  dateCol: { flex: 1 },

  // Checkbox (Experience current job)
  checkboxRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  checkboxBox: { width: 20, height: 20, borderRadius: 4, borderWidth: 1.5, borderColor: BORDER, marginRight: 8, alignItems: "center", justifyContent: "center", backgroundColor: WHITE },
  checkboxBoxChecked: { backgroundColor: ACCENT, borderColor: ACCENT },
  checkboxTick: { color: WHITE, fontSize: 14, fontWeight: "700" },
  checkboxLabel: { fontSize: 13, color: TEXT_SECONDARY, fontWeight: "600" },

  // Icons in header
  iconSmall: { width: 16, height: 16, marginRight: 6 },
  contactChip: { flexDirection: "row", alignItems: "center" },
  linkChip: { flexDirection: "row", alignItems: "center" },

  // Skills Preview
  skillPreview: { backgroundColor: SURFACE, borderRadius: 10, padding: 14, marginTop: 8, borderWidth: 1, borderColor: BORDER },
  skillPreviewLabel: { fontSize: 13, fontWeight: "600", color: TEXT_SECONDARY, marginBottom: 8 },
  skillBullet: { fontSize: 14, color: BLACK, lineHeight: 22 },

  // Language Grid
  langGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  langChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: BORDER, backgroundColor: SURFACE },
  langChipSel: { backgroundColor: ACCENT, borderColor: ACCENT },
  langChipTxt: { fontSize: 13, color: TEXT_SECONDARY, fontWeight: "500" },
  langChipTxtSel: { color: WHITE, fontWeight: "700" },

  // Buttons
  nextBtn: { backgroundColor: ACCENT, borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 8, shadowColor: ACCENT, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  nextBtnTxt: { color: WHITE, fontSize: 16, fontWeight: "700" },
  addMoreBtn: { borderWidth: 1.5, borderColor: ACCENT, borderRadius: 12, paddingVertical: 12, alignItems: "center", marginBottom: 12, backgroundColor: "#EFF6FF" },
  addMoreBtnTxt: { color: ACCENT, fontSize: 14, fontWeight: "700" },
  removeBtn: { alignSelf: "flex-end", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: "#FEE2E2" },
  removeTxt: { color: DANGER, fontSize: 13, fontWeight: "600" },
  createBtn: { backgroundColor: ACCENT, borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 12, marginHorizontal: 16, marginBottom: 8, shadowColor: ACCENT, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  createBtnTxt: { color: WHITE, fontSize: 16, fontWeight: "700" },
  previewBtn: { borderWidth: 2, borderColor: ACCENT, borderRadius: 12, paddingVertical: 13, alignItems: "center", marginTop: 12, backgroundColor: "#EFF6FF" },
  previewBtnTxt: { color: ACCENT, fontSize: 15, fontWeight: "700" },
  upgradeBtn: { backgroundColor: WARN, borderRadius: 12, paddingVertical: 13, alignItems: "center", marginTop: 8 },
  upgradeBtnTxt: { color: WHITE, fontSize: 15, fontWeight: "700" },
  cancelBtn: { borderRadius: 12, paddingVertical: 12, alignItems: "center", marginTop: 8, backgroundColor: SURFACE },
  cancelBtnTxt: { color: TEXT_SECONDARY, fontSize: 14, fontWeight: "600" },

  // Final Section
  finalSection: { marginTop: 8 },
  statusRow: { alignItems: "center", marginBottom: 8 },
  statusBadge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  badgePremium: { backgroundColor: "#D1FAE5" },
  badgeBasic: { backgroundColor: "#DBEAFE" },
  statusBadgeTxt: { fontSize: 13, fontWeight: "600", color: BLACK },

  // Preview Modal
  previewModal: { flex: 1, backgroundColor: "#F0F4FF" },
  previewHdr: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, backgroundColor: WHITE, borderBottomWidth: 1, borderBottomColor: BORDER, paddingTop: Platform.OS === "ios" ? 50 : 14 },
  previewHdrTxt: { fontSize: 18, fontWeight: "700", color: BLACK },
  closeBtn: { fontSize: 14, fontWeight: "600", color: DANGER },
  previewScroll: { flex: 1, padding: 16 },

  // Paper (resume layout)
  paper: { backgroundColor: WHITE, borderRadius: 8, padding: 24, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  paperHdr: { alignItems: "center", marginBottom: 20, borderBottomWidth: 2, borderBottomColor: ACCENT, paddingBottom: 16 },
  paperName: { fontSize: 24, fontWeight: "800", color: BLACK, letterSpacing: 1, marginBottom: 6 },
  paperContactRow: { flexDirection: "row", gap: 16, marginBottom: 4, flexWrap: "wrap", justifyContent: "center" },
  paperContact: { fontSize: 12, color: TEXT_SECONDARY },
  paperAddr: { fontSize: 12, color: TEXT_SECONDARY, marginBottom: 4, textAlign: "center" },
  paperLinksRow: { flexDirection: "row", gap: 12, marginTop: 4, flexWrap: "wrap", justifyContent: "center" },
  paperLink: { fontSize: 12, color: ACCENT, fontWeight: "600" },
  paperSec: { marginBottom: 18 },
  paperSecTitle: { fontSize: 13, fontWeight: "800", color: ACCENT, letterSpacing: 1.5, marginBottom: 4 },
  paperDiv: { height: 1.5, backgroundColor: ACCENT, marginBottom: 10, opacity: 0.3 },
  paperBody: { fontSize: 13, color: BLACK, lineHeight: 20 },
  entry: { marginBottom: 12 },
  entryHdr: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  entryTitle: { fontSize: 14, fontWeight: "700", color: BLACK, flex: 1, flexShrink: 1 },
  entryDur: { fontSize: 12, color: TEXT_SECONDARY, marginLeft: 8 },
  entrySub: { fontSize: 13, color: ACCENT, fontWeight: "600", marginBottom: 4 },
  bullet: { fontSize: 13, color: BLACK, lineHeight: 20, paddingLeft: 4 },
  skillGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  skillChip: { backgroundColor: "#EFF6FF", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: "#BFDBFE" },
  skillChipTxt: { fontSize: 12, color: ACCENT, fontWeight: "600" },

  // Premium Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  modalBox: { backgroundColor: WHITE, borderRadius: 20, padding: 24, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
  modalTitle: { fontSize: 20, fontWeight: "800", color: BLACK, textAlign: "center", marginBottom: 20 },
  benefitsList: { marginBottom: 20 },
  benefitItem: { fontSize: 14, color: BLACK, lineHeight: 26 },
  planCard: { borderWidth: 1.5, borderColor: ACCENT, borderRadius: 14, padding: 16, marginBottom: 14 },
  planName: { fontSize: 16, fontWeight: "700", color: BLACK },
  planPrice: { fontSize: 14, color: ACCENT, fontWeight: "600", marginBottom: 12 },
});

export default CreateResumeScreen;