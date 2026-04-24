import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  StatusBar,
  Dimensions,
  SafeAreaView,
  Linking,
  Platform,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { BRANDCOLOR } from '../../../constant/color';
import { FACEBOOK, INSTAGRAM, LINKEDIN, TWITTER, VERIFIEDPROVIDER } from '../../../constant/imagePath';
import { BASE_URL } from '../../../constant/url';
import { GETNETWORK } from '../../../utils/Network';

const { width: SW } = Dimensions.get('window');

const BRAND = {
  primary:      BRANDCOLOR,
  primaryDark:  BRANDCOLOR,
  primaryLight: '#EAF8F1',
  accent:       BRANDCOLOR,
  dark:         '#111827',
  mid:          '#374151',
  muted:        '#6B7280',
  border:       '#E5E7EB',
  bg:           '#F7F8FA',
  card:         '#FFFFFF',
  white:        '#FFFFFF',
};

// ─── Data ─────────────────────────────────────────────────────────────────────
const DEFAULT_COMPANY = {
  name:        'RechargeKit Fintech Private Limited',
  tagline:     '',
  category:    'Financial Services',
  location:    '',
  companySize: 'Not specified',
  website:     'rechargekit.com',
  industry:    'Banking & Payments API',
  departments: [],
  address:     'Not specified',
  followers:   '2K followers',

  description:
    'Company description not available.',
};

const DEFAULT_BANNER_URL = 'https://images.unsplash.com/photo-1579548122080-c35fd6820ecb?w=800';

const toBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.trim().toLowerCase() === 'true';
  if (typeof value === 'number') return value === 1;
  return false;
};

const toArray = (value, fallback = []) => {
  if (!value) return fallback;
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    const parts = value.split(',').map((entry) => entry.trim()).filter(Boolean);
    return parts.length ? parts : fallback;
  }
  return fallback;
};

const formatWebsite = (value) => (value || '').toString().replace(/^https?:\/\//i, '').trim();
const formatDisplayText = (value) => {
  const raw = (value || '').toString().trim();
  if (!raw) return '';
  return raw
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};
const ensureUrl = (value) => {
  const url = (value || '').toString().trim();
  if (!url) return '';
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
};
const formatRoleSalary = (value) => {
  const text = (value || '').toString().trim();
  if (!text) return 'Salary not specified';
  if (text.toLowerCase() === 'negotiable') return 'Negotiable';
  return text;
};
const splitAddressLines = (value) => {
  const text = (value || '').toString().trim();
  if (!text) return { primary: '', secondary: '' };
  const parts = text.split(',').map((part) => part.trim()).filter(Boolean);
  if (parts.length <= 1) {
    return { primary: text, secondary: '' };
  }
  return {
    primary: `${parts[0]},`,
    secondary: parts.slice(1).join(', '),
  };
};
const formatDate = (value) => {
  if (!value) return 'Recently posted';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};
const normalizeCompany = (value) => {
  const key = (value || '').toString().trim().toLowerCase();
  const aliasMap = {
    'yubi spicies': 'yubi foods',
    'yubi spices': 'yubi foods',
    'yubi food': 'yubi foods',
    'yubi foods': 'yubi foods',
  };
  return aliasMap[key] || key;
};

const buildLocation = (data, fallback) => {
  const city = data.city || data.companyCity || '';
  const state = data.state || data.companyState || '';
  const locationText = [city, state].filter(Boolean).join(', ');
  return data.location || locationText || data.address || fallback;
};

const getImageSource = (value) => {
  if (!value) return null;
  if (typeof value === 'string' && value.trim()) {
    return { uri: value };
  }
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'object' && value.uri) {
    return value;
  }
  return null;
};

// ─── Reusable Components ───────────────────────────────────────────────────────
const Divider = () => <View style={S.divider} />;

const SectionTitle = ({ children, style }) => (
  <Text style={[S.sectionTitle, style]}>{children}</Text>
);

const Card = ({ children, style }) => (
  <View style={[S.card, style]}>{children}</View>
);

const InfoRow = ({ icon, label, value, link }) => (
  <View style={S.infoRow}>
    <Text style={S.infoIcon}>{icon}</Text>
    <View style={S.infoContent}>
      <Text style={S.infoLabel}>{label}</Text>
      {link
        ? <Text style={S.infoLink} onPress={() => value && Linking.openURL(ensureUrl(value))}>{value}</Text>
        : <Text style={S.infoValue}>{value}</Text>}
    </View>
  </View>
);

const JobCard = ({ role, companyName, companyLogoSource }) => (
  <View style={S.jobCard}>
    <View style={S.jobHeaderRow}>
      {companyLogoSource ? (
        <Image source={companyLogoSource} style={S.jobCompanyLogo} resizeMode="contain" />
      ) : null}
      <View style={S.jobTopRow}>
        <View style={[S.jobBadge, { backgroundColor: role.typeBg }]}>
          <Text style={[S.jobBadgeText, { color: role.typeColor }]}>{role.type}</Text>
        </View>
        {role.urgent && (
          <View style={S.urgentBadge}>
            <Text style={S.urgentBadgeText}>🔥 Urgent</Text>
          </View>
        )}
      </View>
    </View>
    <Text style={S.jobTitle}>{role.title}</Text>
    <Text style={S.jobCompany}>{companyName}</Text>
    <Text style={S.jobSalary}>{role.salary}</Text>
    <View style={S.jobMeta}>
      <Text style={S.jobMetaText}>📍 {role.location}</Text>
      <Text style={S.jobMetaText}>🕐 {role.posted}</Text>
    </View>
    <TouchableOpacity style={S.applyBtn} activeOpacity={0.85}>
      <Text style={S.applyBtnText}>Apply Now</Text>
    </TouchableOpacity>
  </View>
);

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function DisplayCompanyProfileScreen({ navigation, route }) {
  const BANNER_H  = Math.round(SW * 0.33);
  const LOGO_SIZE = 80;
  const LOGO_HALF = LOGO_SIZE / 2;
  const rawCompanyData = route?.params?.companyData || {};
  const rawCompany = route?.params?.company || rawCompanyData.rawCompany || {};
  const mergedCompany = useMemo(
    () => ({ ...rawCompanyData, ...rawCompany }),
    [rawCompanyData, rawCompany]
  );
  const COMPANY = useMemo(() => {
    const name =
      mergedCompany.companyName ||
      mergedCompany.name ||
      mergedCompany.company_name ||
      mergedCompany.company ||
      DEFAULT_COMPANY.name;

    const website = formatWebsite(
      mergedCompany.website || mergedCompany.websiteUrl || mergedCompany.siteUrl || DEFAULT_COMPANY.website
    );

    return {
      ...DEFAULT_COMPANY,
      name,
      tagline:
        mergedCompany.tagline ||
        mergedCompany.shortDescription ||
        mergedCompany.subtitle ||
        DEFAULT_COMPANY.tagline,
      category: formatDisplayText(mergedCompany.category || mergedCompany.industry || DEFAULT_COMPANY.category),
      location: buildLocation(mergedCompany, DEFAULT_COMPANY.location),
      companySize:
        mergedCompany.companySize ||
        mergedCompany.teamSize ||
        mergedCompany.employeeCount ||
        DEFAULT_COMPANY.companySize,
      website: website || DEFAULT_COMPANY.website,
      industry: formatDisplayText(mergedCompany.industry || mergedCompany.category || DEFAULT_COMPANY.industry),
      departments: toArray(mergedCompany.departments || mergedCompany.department, DEFAULT_COMPANY.departments)
        .map((item) => formatDisplayText(item)),
      address: mergedCompany.address || mergedCompany.officeAddress || mergedCompany.location || DEFAULT_COMPANY.address,
      followers: mergedCompany.followers || mergedCompany.followersCount || DEFAULT_COMPANY.followers,
      description:
        mergedCompany.description ||
        mergedCompany.about ||
        mergedCompany.aboutCompany ||
        DEFAULT_COMPANY.description,
      social: {
        linkedin: mergedCompany.linkedin || mergedCompany.linkedinUrl || '',
        x: mergedCompany.twitter || mergedCompany.twitterUrl || mergedCompany.xUrl || '',
        facebook: mergedCompany.facebook || mergedCompany.facebookUrl || '',
        instagram: mergedCompany.instagram || mergedCompany.instagramUrl || '',
      },
    };
  }, [mergedCompany, rawCompanyData]);
  const [companyJobs, setCompanyJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  useEffect(() => {
    const onHardwareBack = () => {
      navigation.goBack();
      return true;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => subscription.remove();
  }, [navigation]);

  useEffect(() => {
    const fetchCompanyJobs = async () => {
      try {
        setLoadingJobs(true);
        const jobsResult = await GETNETWORK(`${BASE_URL}jobs`, false);
        const allJobs = Array.isArray(jobsResult)
          ? jobsResult
          : jobsResult?.data || jobsResult?.jobs || jobsResult?.list || [];
        const jobsArray = Array.isArray(allJobs) ? allJobs : [];
        const companyKey = normalizeCompany(COMPANY.name);

        const matchedJobs = jobsArray
          .filter((job) => {
            const jobCompany = normalizeCompany(job.companyName || job.company || job.company_name);
            return (
              companyKey &&
              jobCompany &&
              (jobCompany === companyKey || jobCompany.includes(companyKey) || companyKey.includes(jobCompany))
            );
          })
          .map((job, index) => ({
            id: job.id || job._id || `job-${index}`,
            type: job.jobType || job.type || 'Full Time',
            typeColor: BRAND.primary,
            typeBg: BRAND.primaryLight,
            title: job.jobTitle || job.title || job.designation || 'Open Role',
            salary: formatRoleSalary(job.salaryRange || job.salary || 'Salary not specified'),
            location: buildLocation(job, COMPANY.location),
            posted: formatDate(job.createdAt || job.postedAt || job.updatedAt),
            urgent: toBoolean(job.urgent),
          }));

        setCompanyJobs(matchedJobs);
      } catch (error) {
        setCompanyJobs([]);
      } finally {
        setLoadingJobs(false);
      }
    };

    fetchCompanyJobs();
  }, [COMPANY.name, COMPANY.location]);

  const companyLogoSource = getImageSource(
    rawCompanyData.logo ||
    rawCompanyData.companyLogoUrl ||
    mergedCompany.logo ||
    mergedCompany.companyLogoUrl ||
    mergedCompany.company_logo ||
    mergedCompany.logoUrl
  );
  const bannerSource =
    getImageSource(
      mergedCompany.bannerImage ||
      mergedCompany.banner ||
      mergedCompany.coverImage ||
      mergedCompany.coverPhoto
    ) || { uri: DEFAULT_BANNER_URL };
  const isVerified = toBoolean(rawCompanyData.isVerified ?? mergedCompany.isVerified);
  const companyInitials = (COMPANY.name || 'N/A')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
  const companyAddressLines = splitAddressLines(COMPANY.address || COMPANY.location);

  return (
    <SafeAreaView style={S.safe}>
      <StatusBar barStyle="light-content" backgroundColor={BRAND.primaryDark} translucent={false} />

      <ScrollView style={S.scroll} showsVerticalScrollIndicator={false}>

        {/* ════ BANNER + PROFILE LOGO ════ */}
        <View style={{ position: 'relative', marginBottom: LOGO_HALF + 8 }}>
          {/* Banner Image */}
          <Image
            source={bannerSource}
            style={[S.banner, { height: BANNER_H }]}
            resizeMode="cover"
          />

          {/* Back Button */}
          <TouchableOpacity
            style={S.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={S.backBtnIcon}>‹</Text>
          </TouchableOpacity>

          {/* Profile Logo overlapping banner bottom */}
          <View style={[S.logoContainer, { bottom: -LOGO_HALF, left: 16 }]}>
            <View style={S.logoBox}>
              {companyLogoSource ? (
                <Image source={companyLogoSource} style={S.logoImage} resizeMode="contain" />
              ) : (
                <Text style={S.logoInitials}>{companyInitials || 'NA'}</Text>
              )}
            </View>
          </View>
        </View>

        {/* ════ COMPANY IDENTITY ════ */}
        <View style={S.identityBlock}>
          <View style={S.companyNameRow}>
            <Text style={S.companyName}>{COMPANY.name}</Text>
            {isVerified ? (
              <Image source={VERIFIEDPROVIDER} style={S.companyVerifiedIcon} />
            ) : null}
          </View>
          {companyAddressLines.primary ? (
            <Text style={S.companyAddressPrimary}>{companyAddressLines.primary}</Text>
          ) : null}
          {companyAddressLines.secondary ? (
            <Text style={S.companyAddressSecondary}>{companyAddressLines.secondary}</Text>
          ) : null}
          {COMPANY.tagline ? (
            <Text style={S.companyTagline}>{COMPANY.tagline}</Text>
          ) : null}
          <View style={S.metaLine}>
            <Text style={S.metaText}>{COMPANY.category}</Text>
          </View>
          <View style={S.metaLine}>
            <Text style={S.metaText}>{COMPANY.companySize}</Text>
          </View>
        </View>

        <Divider />

        {/* ════ COMPANY SNAPSHOT ════ */}
        <Card>
          <SectionTitle>Company Snapshot</SectionTitle>
          <InfoRow icon="🌐" label="Website" value={COMPANY.website} link />
          <InfoRow
            icon="🏭"
            label="Industry"
            value={COMPANY.address ? `${COMPANY.industry} · ${COMPANY.address}` : COMPANY.industry}
          />
          {COMPANY.departments.length > 0 ? (
            <InfoRow icon="🏢" label="Department" value={COMPANY.departments.join(', ')} />
          ) : null}
          <InfoRow icon="👥" label="Company Size" value={COMPANY.companySize} />
          <View style={S.socialRow}>
            {[
              { key: 'linkedin', icon: LINKEDIN, url: COMPANY.social.linkedin || 'https://linkedin.com' },
              { key: 'x', icon: TWITTER, url: COMPANY.social.x || 'https://x.com' },
              { key: 'facebook', icon: FACEBOOK, url: COMPANY.social.facebook || 'https://facebook.com' },
              { key: 'instagram', icon: INSTAGRAM, url: COMPANY.social.instagram || 'https://instagram.com' },
            ].map((s) => (
              <TouchableOpacity
                key={s.key}
                style={S.socialBtn}
                onPress={() => Linking.openURL(s.url)}
                activeOpacity={0.75}
              >
                <Image source={s.icon} style={S.socialIcon} resizeMode="contain" />
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* ════ WHO WE ARE ════ */}
        <Card>
          <SectionTitle>Who We Are</SectionTitle>
          <Text style={S.bodyText}>{COMPANY.description}</Text>
        </Card>

        {/* ════ OPEN ROLES ════ */}
        <View style={S.rolesSection}>
          <View style={S.rolesHeader}>
            <View style={{ flex: 1 }}>
              <SectionTitle style={{ marginBottom: 2 }}>Open Roles</SectionTitle>
              <Text style={S.rolesSubtitle}>Jobs opened by this company.</Text>
            </View>
          </View>
          {loadingJobs ? (
            <View style={S.loadingBox}>
              <ActivityIndicator size="small" color={BRAND.primary} />
              <Text style={S.loadingText}>Loading open roles...</Text>
            </View>
          ) : companyJobs.length > 0 ? (
            companyJobs.map((r) => (
              <JobCard
                key={r.id}
                role={r}
                companyName={COMPANY.name}
                companyLogoSource={companyLogoSource}
              />
            ))
          ) : (
            <Text style={S.emptyText}>No open roles for this company.</Text>
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const CARD_PAD = 18;

const S = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: BRAND.bg },
  scroll: { flex: 1 },

  // ── Banner ──
  banner: { width: '100%' },
  backBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 12 : 10,
    left: 12,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.38)',
    alignItems: 'center', justifyContent: 'center',
  },
  backBtnIcon: { color: '#fff', fontSize: 22, fontWeight: '700', lineHeight: 24 },

  // ── Logo ──
  logoContainer: { position: 'absolute' },
  logoBox: {
    width: 80, height: 80, borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: BRAND.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  logoInitials: { color: BRAND.primary, fontSize: 26, fontWeight: '900', letterSpacing: 1 },
  logoImage: { width: 72, height: 72, borderRadius: 12 },

  // ── Identity ──
  identityBlock: {
    paddingHorizontal: 16, paddingBottom: 16,
    backgroundColor: BRAND.card,
  },
  companyNameRow: { flexDirection: 'row', alignItems: 'center' },
  companyName: {
    fontSize: 20, fontWeight: '800', color: BRAND.dark,
    letterSpacing: -0.3, lineHeight: 28, marginBottom: 6,
  },
  companyVerifiedIcon: { width: 18, height: 18, marginLeft: 6, marginBottom: 4, resizeMode: 'contain' },
  companyAddressPrimary: { fontSize: 13, color: BRAND.dark, fontWeight: '600', marginBottom: 2 },
  companyAddressSecondary: { fontSize: 12, color: BRAND.muted, marginBottom: 6 },
  companyTagline: { fontSize: 14, color: BRAND.mid, lineHeight: 20, marginBottom: 8 },
  metaLine: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  metaText: { fontSize: 13, color: BRAND.muted, fontWeight: '500' },
  metaDot:  { marginHorizontal: 6, color: BRAND.muted, fontSize: 13 },

  // ── Divider ──
  divider: { height: 8, backgroundColor: BRAND.bg },

  // ── Card ──
  card: {
    backgroundColor: BRAND.card,
    paddingHorizontal: CARD_PAD, paddingVertical: CARD_PAD,
    marginBottom: 8,
    borderBottomWidth: 1, borderBottomColor: BRAND.border,
  },
  sectionTitle: {
    fontSize: 16, fontWeight: '800', color: BRAND.dark,
    marginBottom: 14, letterSpacing: -0.2,
  },
  bodyText: { fontSize: 14, color: BRAND.mid, lineHeight: 22 },

  // ── Info Rows ──
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  infoIcon:  { fontSize: 17, marginTop: 1 },
  infoContent: { flex: 1, minWidth: 0 },
  infoLabel: {
    fontSize: 11, color: BRAND.muted, fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  infoValue: { fontSize: 13, color: BRAND.dark, fontWeight: '500', marginTop: 1, flexShrink: 1, lineHeight: 19 },
  infoLink:  { fontSize: 13, color: BRAND.primary, fontWeight: '600', marginTop: 1, textDecorationLine: 'underline', flexShrink: 1, lineHeight: 19 },

  // ── Social ──
  socialRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  socialBtn: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: BRAND.primaryLight,
    borderWidth: 1, borderColor: BRAND.primary + '33',
    alignItems: 'center', justifyContent: 'center',
  },
  socialIcon: { width: 18, height: 18 },

  // ── Roles ──
  rolesSection: {
    backgroundColor: BRAND.card,
    paddingHorizontal: 16,
    paddingTop: 20, paddingBottom: 4,
    borderBottomWidth: 1, borderBottomColor: BRAND.border,
    marginBottom: 8,
  },
  rolesHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 14,
  },
  rolesSubtitle: { fontSize: 12, color: BRAND.muted, marginTop: 2 },
  loadingBox: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  loadingText: { color: BRAND.muted, fontSize: 13 },
  emptyText: { color: BRAND.muted, fontSize: 13, paddingBottom: 10 },

  // ── Job Card ──
  jobCard: {
    borderWidth: 1.5, borderColor: BRAND.border,
    borderRadius: 14, padding: 14, marginBottom: 12,
    backgroundColor: BRAND.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  jobHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  jobCompanyLogo: { width: 30, height: 30, borderRadius: 8, marginRight: 8 },
  jobTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  jobBadge:  { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  jobBadgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  urgentBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
    backgroundColor: BRAND.primaryLight,
    borderWidth: 1, borderColor: BRAND.primary + '55',
  },
  urgentBadgeText: { fontSize: 10, fontWeight: '700', color: BRAND.primary },
  jobTitle:    { fontSize: 15, fontWeight: '800', color: BRAND.dark, marginBottom: 3 },
  jobCompany:  { fontSize: 12, color: BRAND.muted, marginBottom: 4 },
  jobSalary:   { fontSize: 13, fontWeight: '700', color: BRAND.primary, marginBottom: 6 },
  jobMeta:     { flexDirection: 'row', gap: 14, marginBottom: 12 },
  jobMetaText: { fontSize: 12, color: BRAND.muted },
  applyBtn: {
    backgroundColor: BRAND.primary,
    borderRadius: 10, paddingVertical: 10,
    alignItems: 'center',
    shadowColor: BRAND.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 4, elevation: 3,
  },
  applyBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
});
