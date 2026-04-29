import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  StatusBar,
  Platform,
  BackHandler,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { BLACK, BRANDCOLOR, WHITE } from "../../../constant/color";
import { UBUNTUBOLD, UBUNTU, FIRASANSSEMIBOLD, ROBOTOSEMIBOLD, CANTARELLBOLD, FIRASANSBOLD } from "../../../constant/fontPath";
import { MyHeader } from "../../../components/commonComponents/MyHeader";
import {
  PROFILE,
  COMPANYNAME,
  ADDRESS,
  USER,
  MAIL,
  PHONE,
  WEBSITE,
  JOBDESCRIPTION,
  TWITTER,
  FACEBOOK,
  GOOGLE,
  INDUSTRY,
  COMPANYSIZE,
  COMPANYTYPE,
  FOUNDED,
  EDIT,
  VERIFIED,
} from "../../../constant/imagePath";
import { getObjByKey } from "../../../utils/Storage";
import { BASE_URL } from "../../../constant/url";
import { GETNETWORK } from "../../../utils/Network";

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [apiProfileData, setApiProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [logoUrl, setLogoUrl] = useState(null);

  // Fetch employer profile from API
  const fetchEmployerProfile = useCallback(async () => {
    try {
      setLoading(true);
      const url = `${BASE_URL}employer/profile`;
      // console.log('Fetching employer profile:', url);

      // Get token from storage
      const loginResponse = await getObjByKey('loginResponse');
      if (!loginResponse || !loginResponse.token) {
        // console.error('❌ Error: No token found in loginResponse');
        setLoading(false);
        return;
      }

      const result = await GETNETWORK(url, true);
      // console.log('Employer profile response:', JSON.stringify(result, null, 2));

      // API response structure: { profile: { ... } }
      const profileData = result?.profile || result;

      if (profileData && profileData.companyName) {
        // console.log('✅ Success: Employer profile fetched successfully');
        // console.log('Profile data:', {
        //   companyName: profileData.companyName,
        //   contactPerson: profileData.contactPerson,
        //   address: profileData.address,
        //   email: profileData.email,
        //   phone: profileData.phone,
        //   twitter: profileData.twitter,
        //   facebook: profileData.facebook,
        //   google: profileData.google,
        // });
        setApiProfileData(profileData);

        // Handle logo URL - check multiple possible locations (root level and inside profile)
        const fetchedLogoUrl =
          result?.logoUrl ||
          result?.logo ||
          result?.companyLogo ||
          result?.company_logo ||
          profileData?.logoUrl ||
          profileData?.logo ||
          profileData?.companyLogo ||
          profileData?.company_logo ||
          null;
        if (fetchedLogoUrl && fetchedLogoUrl.trim() !== '') {
          let logoUrlToSet = fetchedLogoUrl;
          if (!fetchedLogoUrl.startsWith('http://') && !fetchedLogoUrl.startsWith('https://')) {
            const baseUrl = BASE_URL.replace('/api/', '/');
            logoUrlToSet = baseUrl + fetchedLogoUrl.replace(/^\//, '');
          }
          // console.log('✅ ProfileScreen: Setting logo URL to:', logoUrlToSet);
          setLogoUrl(logoUrlToSet);
        } else {
          // console.log('⚠️ ProfileScreen: No logo URL found in response');
          setLogoUrl(null);
        }
      } else if (result?.errors) {
        // console.error('❌ Error: API returned errors:', result.errors);
      } else {
        // console.error('❌ Error: Invalid response from API - No companyName found');
        // console.error('Response structure:', result);
      }
    } catch (error) {
      // console.error('❌ Error fetching employer profile:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load profile data and check role
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const loginData = await getObjByKey("loginResponse");
        if (loginData) {
          // Determine role
          const role = loginData?.role || loginData?.userType || loginData?.user?.role || '';
          const roleLower = role.toLowerCase();

          if (roleLower.includes('provider')) {
            setUserRole('provider');
            // console.log('✅ User role: Provider - Fetching employer profile');
            await fetchEmployerProfile();
          } else {
            setUserRole('seeker');
            // console.log('ℹ️ User role: Seeker - Employer profile not applicable');
            setLoading(false);
          }
        } else {
          // console.error('❌ Error: No login data found');
          setLoading(false);
        }
      } catch (error) {
        // console.error("❌ Error loading profile data:", error);
        setLoading(false);
      }
    };
    loadProfileData();
  }, [fetchEmployerProfile]);

  // Refetch profile data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (userRole === 'provider') {
        // console.log('Screen focused - Refetching employer profile');
        fetchEmployerProfile();
      }
    }, [userRole, fetchEmployerProfile])
  );

  // Handle back button press - uses navigation.goBack()
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
      return true;
    });

    return () => backHandler.remove();
  }, [navigation]);

  const handleBackPress = () => {
    navigation.goBack();
  };

  // Get profile data from API only (no static fallbacks)
  const companyName = apiProfileData?.companyName || "";
  const companyAddress = apiProfileData?.address || "";
  const contactPersonName = apiProfileData?.contactPerson || "";
  const companyEmail = apiProfileData?.email || "";
  const companyPhone = apiProfileData?.phone || "";
  const companyWebsite = apiProfileData?.website || "";
  const industry = apiProfileData?.industry || "";
  const companySize = apiProfileData?.companySize || "";
  const companyType = apiProfileData?.companyType || "";
  const companyTypeLabel = companyType === "small_business" ? "Small Business" : companyType;
  const founded = apiProfileData?.foundedYear || "";
  const companyDescription = apiProfileData?.description || "";
  const twitter = apiProfileData?.twitter || "";
  const facebook = apiProfileData?.facebook || "";
  const google = apiProfileData?.google || "";
  const linkedin = apiProfileData?.linkedin || apiProfileData?.linkedIn || "";
  const isVerified = apiProfileData?.isVerified === true || apiProfileData?.isVerified === "true";

  // Calculate profile completion percentage
  const calculateCompletion = () => {
    const sections = [
      companyName, // Company Name
      companyEmail, // Email
      companyPhone, // Phone
      contactPersonName, // Contact Person
      companyAddress, // Address
      companyWebsite, // Website
      industry, // Industry
      companySize, // Company Size
      companyType, // Company Type
      founded, // Founded Year
      companyDescription, // Company Description
      (twitter || facebook || google), // Social Media
    ];

    const completedSections = sections.filter(Boolean).length;
    const totalSections = sections.length;
    const percentage = Math.round((completedSections / totalSections) * 100);
    return percentage;
  };

  const completionPercentage = calculateCompletion();

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={WHITE} />
      <View style={styles.container}>
        <MyHeader
          showNotification={false}
          showBack
          showCenterTitle
          title="Profile"
          onBackPress={handleBackPress}
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={BRANDCOLOR} />
              <Text style={styles.loadingText}>Loading profile...</Text>
            </View>
          ) : !apiProfileData ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.errorText}>No profile data available</Text>
            </View>
          ) : (
            <>
              {/* Profile Header Section */}
              <View style={styles.profileHeader}>
                {/* Profile Picture with Circular Progress */}
                <View style={styles.profileImageContainer}>
                  <View style={styles.progressWrapper}>
                    <CircularProgress
                      size={110}
                      strokeWidth={4}
                      progress={completionPercentage}
                      color={completionPercentage === 100 ? '#4CAF50' : BRANDCOLOR}
                    />
                    <View style={styles.profileImageWrapper}>
                      {logoUrl ? (
                        <Image
                          source={{ uri: logoUrl }}
                          style={styles.profileImage}
                          defaultSource={PROFILE}
                          onError={() => setLogoUrl(null)}
                        />
                      ) : (
                        <Image source={PROFILE} style={styles.profileImage} />
                      )}
                    </View>
                  </View>
                  <Text style={[styles.progressText, { color: completionPercentage === 100 ? '#4CAF50' : BRANDCOLOR }]}>
                    {completionPercentage}%
                  </Text>
                </View>

                {/* Name with Edit Icon */}
                <View style={styles.nameContainer}>
                  <Text style={styles.profileName}>{companyName || "Company Name"}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      const profileDataToPass = {
                        companyName: companyName,
                        address: companyAddress,
                        contactPerson: contactPersonName,
                        contactName: contactPersonName,
                        name: contactPersonName,
                        email: companyEmail,
                        phoneNumber: companyPhone,
                        phone: companyPhone,
                        website: companyWebsite,
                        industry: industry,
                        category: industry,
                        companySize: companySize,
                        size: companySize,
                        companyType: companyType,
                        type: companyType,
                        founded: founded,
                        description: companyDescription,
                        companyDescription: companyDescription,
                        twitter: twitter,
                        facebook: facebook,
                        google: google,
                      };
                      navigation.navigate("EditProfile", { profileData: profileDataToPass });
                    }}
                    style={styles.editNameButton}
                  >
                    <MaterialCommunityIcons name="pencil" size={18} color="#2196F3" />
                  </TouchableOpacity>
                </View>

                {/* Verified Badge */}
                {isVerified && (
                  <View style={styles.verifiedBadgeContainer}>
                    <Image source={VERIFIED} style={styles.verifiedBadgeIcon} />
                    <Text style={styles.verifiedBadgeText}>Verified Company</Text>
                  </View>
                )}

                {/* Company Description */}
                {companyDescription && (
                  <Text style={styles.profileSummary} numberOfLines={3}>
                    {companyDescription}
                  </Text>
                )}
              </View>

              {/* Company Information Section */}
              <SectionCard
                title="Company Information"
                icon={COMPANYNAME}
                onEdit={() => {
                  const profileDataToPass = {
                    companyName: companyName,
                    address: companyAddress,
                    contactPerson: contactPersonName,
                    contactName: contactPersonName,
                    name: contactPersonName,
                    email: companyEmail,
                    phoneNumber: companyPhone,
                    phone: companyPhone,
                    website: companyWebsite,
                    industry: industry,
                    category: industry,
                    companySize: companySize,
                    size: companySize,
                    companyType: companyType,
                    type: companyType,
                    founded: founded,
                    description: companyDescription,
                    companyDescription: companyDescription,
                    twitter: twitter,
                    facebook: facebook,
                    google: google,
                  };
                  navigation.navigate("EditProfile", { profileData: profileDataToPass });
                }}
              >
                <View style={styles.detailsList}>
                  {companyName && (
                    <DetailRow label="Company Name" value={companyName} />
                  )}
                  {industry && (
                    <DetailRow label="Industry" value={industry} />
                  )}
                  {companySize && (
                    <DetailRow label="Company Size" value={companySize} />
                  )}
                  {companyType && (
                    <DetailRow label="Company Type" value={companyTypeLabel} />
                  )}
                  {founded && (
                    <DetailRow label="Founded" value={founded} />
                  )}
                </View>
              </SectionCard>

              {/* Contact Details Section */}
              {(contactPersonName || companyEmail || companyPhone || companyWebsite || companyAddress) && (
                <SectionCard
                  title="Contact Details"
                  icon={USER}
                  onEdit={() => {
                    const profileDataToPass = {
                      companyName: companyName,
                      address: companyAddress,
                      contactPerson: contactPersonName,
                      contactName: contactPersonName,
                      name: contactPersonName,
                      email: companyEmail,
                      phoneNumber: companyPhone,
                      phone: companyPhone,
                      website: companyWebsite,
                      industry: industry,
                      category: industry,
                      companySize: companySize,
                      size: companySize,
                      companyType: companyType,
                      type: companyType,
                      founded: founded,
                      description: companyDescription,
                      companyDescription: companyDescription,
                      twitter: twitter,
                      facebook: facebook,
                      google: google,
                    };
                    navigation.navigate("EditProfile", { profileData: profileDataToPass });
                  }}
                >
                  <View style={styles.detailsList}>
                    {contactPersonName && (
                      <DetailItem icon="account" label={contactPersonName} />
                    )}
                    {companyEmail && (
                      <DetailItem icon="email" label={companyEmail} verified />
                    )}
                    {companyPhone && (
                      <DetailItem icon="phone" label={companyPhone} verified />
                    )}
                    {companyWebsite && (
                      <DetailItem icon="web" label={companyWebsite} />
                    )}
                    {companyAddress && (
                      <DetailItem icon="map-marker" label={companyAddress} />
                    )}
                  </View>
                </SectionCard>
              )}

              {/* Company Description Section */}
              {companyDescription && (
                <SectionCard
                  title="Company Description"
                  icon={JOBDESCRIPTION}
                  onEdit={() => {
                    const profileDataToPass = {
                      companyName: companyName,
                      address: companyAddress,
                      contactPerson: contactPersonName,
                      contactName: contactPersonName,
                      name: contactPersonName,
                      email: companyEmail,
                      phoneNumber: companyPhone,
                      phone: companyPhone,
                      website: companyWebsite,
                      industry: industry,
                      category: industry,
                      companySize: companySize,
                      size: companySize,
                      companyType: companyType,
                      type: companyType,
                      founded: founded,
                      description: companyDescription,
                      companyDescription: companyDescription,
                      twitter: twitter,
                      facebook: facebook,
                      google: google,
                    };
                    navigation.navigate("EditProfile", { profileData: profileDataToPass });
                  }}
                >
                  <Text style={styles.summaryText}>{companyDescription}</Text>
                </SectionCard>
              )}

              {/* Additional Company Details Section */}
              <SectionCard
                title="Additional Information"
                icon={INDUSTRY}
                onEdit={() => {
                  const profileDataToPass = {
                    companyName: companyName,
                    address: companyAddress,
                    contactPerson: contactPersonName,
                    contactName: contactPersonName,
                    name: contactPersonName,
                    email: companyEmail,
                    phoneNumber: companyPhone,
                    phone: companyPhone,
                    website: companyWebsite,
                    industry: industry,
                    category: industry,
                    companySize: companySize,
                    size: companySize,
                    companyType: companyType,
                    type: companyType,
                    founded: founded,
                    description: companyDescription,
                    companyDescription: companyDescription,
                    twitter: twitter,
                    facebook: facebook,
                    google: google,
                  };
                  navigation.navigate("EditProfile", { profileData: profileDataToPass });
                }}
              >
                <View style={styles.detailsList}>
                  <DetailRow label="GSTIN" value="Available" />
                </View>
              </SectionCard>

              {/* Social Media Section */}
              {(twitter || facebook || google || linkedin) && (
                <SectionCard
                  title="Social Media"
                  icon={GOOGLE}
                  onEdit={() => {
                    const profileDataToPass = {
                      companyName: companyName,
                      address: companyAddress,
                      contactPerson: contactPersonName,
                      contactName: contactPersonName,
                      name: contactPersonName,
                      email: companyEmail,
                      phoneNumber: companyPhone,
                      phone: companyPhone,
                      website: companyWebsite,
                      industry: industry,
                      category: industry,
                      companySize: companySize,
                      size: companySize,
                      companyType: companyType,
                      type: companyType,
                      founded: founded,
                      description: companyDescription,
                      companyDescription: companyDescription,
                      twitter: twitter,
                      facebook: facebook,
                      google: google,
                      linkedin: linkedin,
                    };
                    navigation.navigate("EditProfile", { profileData: profileDataToPass });
                  }}
                >
                  <View style={styles.detailsList}>
                    {twitter && (
                      <DetailItem icon="twitter" label={twitter} />
                    )}
                    {facebook && (
                      <DetailItem icon="facebook" label={facebook} />
                    )}
                    {google && (
                      <DetailItem icon="google" label={google} />
                    )}
                    {linkedin && (
                      <DetailItem icon="linkedin" label={linkedin} />
                    )}
                  </View>
                </SectionCard>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </>
  );
};

export default ProfileScreen;

/* -------------------------------------------------------------------------- */
/*                              REUSABLE COMPONENTS                            */
/* -------------------------------------------------------------------------- */

// Circular Progress Component
const CircularProgress = ({ size, strokeWidth, progress, color }) => {
  const radius = size / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate which borders to show based on progress
  const progressPercent = progress / 100;
  const quarter1 = progressPercent >= 0.25;
  const quarter2 = progressPercent >= 0.5;
  const quarter3 = progressPercent >= 0.75;
  const quarter4 = progressPercent >= 1.0;

  // Calculate partial progress for the current quarter
  let currentQuarterProgress = 0;
  if (progressPercent < 0.25) {
    currentQuarterProgress = progressPercent / 0.25;
  } else if (progressPercent < 0.5) {
    currentQuarterProgress = (progressPercent - 0.25) / 0.25;
  } else if (progressPercent < 0.75) {
    currentQuarterProgress = (progressPercent - 0.5) / 0.25;
  } else {
    currentQuarterProgress = (progressPercent - 0.75) / 0.25;
  }

  return (
    <View style={[styles.circularProgressContainer, { width: size, height: size }]}>
      {/* Background circle */}
      <View
        style={[
          styles.circularProgressRing,
          {
            width: size,
            height: size,
            borderRadius: radius,
            borderWidth: strokeWidth,
            borderColor: '#E0E0E0',
          },
        ]}
      />
      {/* Progress circle - using border colors to show progress */}
      <View
        style={[
          styles.circularProgressRing,
          {
            width: size,
            height: size,
            borderRadius: radius,
            borderWidth: strokeWidth,
            borderColor: 'transparent',
            borderTopColor: quarter1 ? color : 'transparent',
            borderRightColor: quarter2 ? color : 'transparent',
            borderBottomColor: quarter3 ? color : 'transparent',
            borderLeftColor: quarter4 ? color : 'transparent',
            position: 'absolute',
            transform: [{ rotate: '-90deg' }],
          },
        ]}
      />
    </View>
  );
};

const SectionCard = ({ title, icon, children, onEdit }) => (
  <View style={styles.sectionCard}>
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleContainer}>
        {icon && <Image source={icon} style={styles.sectionIcon} />}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <TouchableOpacity onPress={onEdit} style={styles.editButton}>
        <MaterialCommunityIcons name="pencil" size={18} color="#2196F3" />
      </TouchableOpacity>
    </View>
    <View style={styles.sectionContent}>
      {children}
    </View>
  </View>
);

const DetailItem = ({ icon, label, verified = false }) => (
  <View style={styles.detailItem}>
    <MaterialCommunityIcons name={icon} size={20} color="#999" />
    <Text style={styles.detailText}>{label}</Text>
    {verified && (
      <MaterialCommunityIcons name="check-circle" size={16} color="#4CAF50" style={styles.verifiedIcon} />
    )}
  </View>
);

const DetailRow = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailRowLabel}>{label}:</Text>
    <Text style={styles.detailRowValue}>{value}</Text>
  </View>
);

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WHITE,
  },
  scrollContent: {
    paddingBottom: 30,
  },

  /* Profile Header */
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: WHITE,
  },
  profileImageContainer: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  profileImageWrapper: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: WHITE,
    zIndex: 1,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    resizeMode: 'cover',
  },
  circularProgressContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularProgressRing: {
    position: 'absolute',
  },
  progressText: {
    fontSize: 14,
    fontFamily: UBUNTUBOLD,
    textAlign: 'center',
    marginTop: 4,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    marginLeft: 20,
  },
  profileName: {
    fontSize: 22,
    fontFamily: UBUNTUBOLD,
    color: BLACK,
    textAlign: 'center',
  },
  editNameButton: {
    marginLeft: 8,
    padding: 4,
  },
  verifiedBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  verifiedBadgeIcon: {
    width: 20,
    height: 20,
    marginRight: 6,
    resizeMode: 'contain',
  },
  verifiedBadgeText: {
    fontSize: 14,
    fontFamily: FIRASANSSEMIBOLD,
    color: '#4CAF50',
  },
  profileSummary: {
    fontSize: 14,
    color: BLACK,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },

  /* Section Card */
  sectionCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
    tintColor: BRANDCOLOR,
    resizeMode: 'contain',
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: FIRASANSSEMIBOLD,
    color: BLACK,
  },
  editButton: {
    padding: 4,
  },
  sectionContent: {
    marginTop: 4,
  },

  /* Details List */
  detailsList: {
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: BLACK,
    marginLeft: 12,
    flex: 1,
  },
  verifiedIcon: {
    marginLeft: 8,
  },
  detailRow: {
    marginBottom: 12,
  },
  detailRowLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  detailRowValue: {
    fontSize: 14,
    color: BLACK,
  },

  /* Summary Text */
  summaryText: {
    fontSize: 14,
    color: BLACK,
    lineHeight: 20,
  },

  /* Loading */
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: "#FF0000",
    fontFamily: FIRASANSSEMIBOLD,
  },
});
