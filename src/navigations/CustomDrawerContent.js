import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useFocusEffect } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { PROFILE, LOGOUT } from '../constant/imagePath';
import { useDispatch } from 'react-redux';
import { checkuserToken } from '../redux/actions/auth';
import { deleteByKeys, getObjByKey } from '../utils/Storage';
import { HEIGHT, WIDTH } from '../constant/config';
import { WHITE } from '../constant/color';
import { BASE_URL } from '../constant/url';
import { GETNETWORK } from '../utils/Network';
import { MyAlert } from '../components/commonComponents/MyAlert';
import { UBUNTU, UBUNTUBOLD, FIRASANSSEMIBOLD } from '../constant/fontPath';
import DeviceInfo from 'react-native-device-info';
// import DeviceInfo from 'react-native-device-info';

// Helper function to capitalize first letter
const capitalizeFirst = (str) => {
  if (!str || typeof str !== 'string') return str || '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Helper to capitalize every word in a full name (handles first + last)
const capitalizeWords = (str = '') => {
  if (!str || typeof str !== 'string') return str || '';
  return str
    .split(/\s+/)
    .filter(Boolean)
    .map(capitalizeFirst)
    .join(' ');
};

// Helper function to handle profile press - checks for token and navigates to LoginScreen if not present
export const handleProfilePress = async (navigation, openDrawerCallback = null) => {
  try {
    const loginResponse = await getObjByKey('loginResponse');

    // If no token exists, navigate to LoginScreen
    if (!loginResponse || !loginResponse.token) {
      navigation.navigate('Login');
      return;
    }

    // If token exists and callback is provided, open drawer
    if (openDrawerCallback && typeof openDrawerCallback === 'function') {
      openDrawerCallback();
    }
  } catch (error) {
    // If error checking token, navigate to LoginScreen
    navigation.navigate('Login');
  }
};

const CustomDrawerContent = (props) => {
  const { navigation, refreshKey, onRefresh } = props;
  const dispatch = useDispatch();
  const [loginData, setLoginData] = useState(null);
  const [role, setRole] = useState('guest'); // 'guest' | 'seeker' | 'provider'
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [contactPersonName, setContactPersonName] = useState('');
  const [providerLogoUrl, setProviderLogoUrl] = useState(null);
  const [providerLogoVersion, setProviderLogoVersion] = useState(0);
  const [seekerName, setSeekerName] = useState('');
  const [seekerDesignation, setSeekerDesignation] = useState('');
  const [seekerProfilePicture, setSeekerProfilePicture] = useState(null);
  const [seekerProfileVersion, setSeekerProfileVersion] = useState(0);
  const [appVersion, setAppVersion] = useState(''); //For showing of App Version

  // Fetch seeker profile to get name and designation
  const fetchSeekerProfile = useCallback(async () => {
    try {
      const url = `${BASE_URL}profile`;
      // console.log('🔄 Drawer: Fetching seeker profile:', url);

      // Get token from storage to verify it exists
      const loginResponse = await getObjByKey('loginResponse');

      if (!loginResponse || !loginResponse.token) {
        // console.error('❌ Drawer: No token found in loginResponse');
        return;
      }

      const result = await GETNETWORK(url, true);
      // console.log('📥 Drawer: Seeker profile response:', JSON.stringify(result, null, 2));

      // Check if result is undefined or null (API error)
      if (!result || result === undefined) {
        // console.error('❌ Drawer: API returned undefined, using stored data');
        const storedData = await getObjByKey('loginResponse');
        const fallbackFirstName = storedData?.data?.firstName ||
          storedData?.user?.firstName ||
          storedData?.firstName || '';
        const fallbackLastName = storedData?.data?.lastName ||
          storedData?.user?.lastName ||
          storedData?.lastName || '';
        const fallbackDisplayName = storedData?.data?.displayName ||
          storedData?.user?.displayName ||
          storedData?.data?.name ||
          storedData?.data?.fullName ||
          storedData?.user?.name ||
          storedData?.user?.fullName ||
          storedData?.name ||
          storedData?.fullName ||
          '';

        let fallbackFullName = '';
        if (fallbackFirstName && fallbackFirstName.trim() !== '') {
          const capitalizedFallbackFirstName = capitalizeFirst(fallbackFirstName.trim());
          if (fallbackLastName && fallbackLastName.trim() !== '') {
            const capitalizedFallbackLastName = capitalizeFirst(fallbackLastName.trim());
            fallbackFullName = `${capitalizedFallbackFirstName} ${capitalizedFallbackLastName}`;
          } else {
            fallbackFullName = capitalizedFallbackFirstName;
          }
        } else if (fallbackLastName && fallbackLastName.trim() !== '') {
          fallbackFullName = capitalizeFirst(fallbackLastName.trim());
        } else if (fallbackDisplayName && fallbackDisplayName.trim() !== '') {
          fallbackFullName = fallbackDisplayName.trim();
        }

        if (fallbackFullName && fallbackFullName.trim() !== '') {
          // console.log('📝 Drawer: Using fallback seeker full name from storage:', fallbackFullName);
          setSeekerName(fallbackFullName.trim());
        }
        return;
      }

      // Check if result has an error message
      if (result?.message && (result.message.toLowerCase().includes('error') || result.message.toLowerCase().includes('not found'))) {
        // console.error('❌ Drawer: API error message:', result.message);
        const storedData = await getObjByKey('loginResponse');
        const fallbackFirstName = storedData?.data?.firstName ||
          storedData?.user?.firstName ||
          storedData?.firstName || '';
        const fallbackLastName = storedData?.data?.lastName ||
          storedData?.user?.lastName ||
          storedData?.lastName || '';
        const fallbackDisplayName = storedData?.data?.displayName ||
          storedData?.user?.displayName ||
          storedData?.data?.name ||
          storedData?.data?.fullName ||
          storedData?.user?.name ||
          storedData?.user?.fullName ||
          storedData?.name ||
          storedData?.fullName ||
          '';

        let fallbackFullName = '';
        if (fallbackFirstName && fallbackFirstName.trim() !== '') {
          const capitalizedFallbackFirstName = capitalizeFirst(fallbackFirstName.trim());
          if (fallbackLastName && fallbackLastName.trim() !== '') {
            const capitalizedFallbackLastName = capitalizeFirst(fallbackLastName.trim());
            fallbackFullName = `${capitalizedFallbackFirstName} ${capitalizedFallbackLastName}`;
          } else {
            fallbackFullName = capitalizedFallbackFirstName;
          }
        } else if (fallbackLastName && fallbackLastName.trim() !== '') {
          fallbackFullName = capitalizeFirst(fallbackLastName.trim());
        } else if (fallbackDisplayName && fallbackDisplayName.trim() !== '') {
          fallbackFullName = fallbackDisplayName.trim();
        }

        if (fallbackFullName && fallbackFullName.trim() !== '') {
          // console.log('📝 Drawer: Using fallback seeker full name from storage:', fallbackFullName);
          setSeekerName(fallbackFullName.trim());
        }
        return;
      }

      // Extract profile data from various possible response structures
      const profileData = result?.profile || result?.data || result || result?.user;
      // console.log('📥 Drawer: Extracted profileData:', JSON.stringify(profileData, null, 2));

      // Extract firstName (priority for Job Seeker) - check all possible locations
      const fetchedFirstName =
        profileData?.firstName ||
        profileData?.data?.firstName ||
        profileData?.user?.firstName ||
        result?.firstName ||
        result?.data?.firstName ||
        result?.user?.firstName ||
        '';

      // Extract lastName - check all possible locations
      const fetchedLastName =
        profileData?.lastName ||
        profileData?.data?.lastName ||
        profileData?.user?.lastName ||
        result?.lastName ||
        result?.data?.lastName ||
        result?.user?.lastName ||
        '';

      const fetchedDisplayName =
        profileData?.displayName ||
        profileData?.data?.displayName ||
        profileData?.user?.displayName ||
        profileData?.name ||
        profileData?.fullName ||
        result?.displayName ||
        result?.data?.displayName ||
        result?.user?.displayName ||
        result?.name ||
        result?.fullName ||
        '';

      // Extract profilePicture - check all possible locations and field names
      const fetchedProfilePicture =
        profileData?.profilePicture ||
        profileData?.profile_picture ||
        profileData?.picture ||
        profileData?.avatar ||
        profileData?.image ||
        profileData?.photo ||
        profileData?.data?.profilePicture ||
        profileData?.data?.profile_picture ||
        profileData?.data?.picture ||
        profileData?.data?.avatar ||
        profileData?.data?.image ||
        profileData?.data?.photo ||
        profileData?.user?.profilePicture ||
        profileData?.user?.profile_picture ||
        profileData?.user?.picture ||
        profileData?.user?.avatar ||
        result?.profilePicture ||
        result?.profile_picture ||
        result?.picture ||
        result?.avatar ||
        result?.data?.profilePicture ||
        result?.data?.profile_picture ||
        '';

      // Extract designation
      const fetchedDesignation =
        profileData?.designation ||
        profileData?.jobTitle ||
        profileData?.position ||
        profileData?.title ||
        profileData?.data?.designation ||
        profileData?.data?.jobTitle ||
        '';

      // console.log('📝 Drawer: Extracted seeker firstName:', fetchedFirstName);
      // console.log('📝 Drawer: Extracted seeker profilePicture:', fetchedProfilePicture);
      // console.log('📝 Drawer: Extracted seeker designation:', fetchedDesignation);

      // Combine firstName and lastName into full name
      let fullName = '';
      if (fetchedFirstName && fetchedFirstName.trim() !== '') {
        const capitalizedFirstName = capitalizeFirst(fetchedFirstName.trim());
        if (fetchedLastName && fetchedLastName.trim() !== '') {
          const capitalizedLastName = capitalizeFirst(fetchedLastName.trim());
          fullName = `${capitalizedFirstName} ${capitalizedLastName}`;
        } else {
          fullName = capitalizedFirstName;
        }
      } else if (fetchedLastName && fetchedLastName.trim() !== '') {
        fullName = capitalizeFirst(fetchedLastName.trim());
      } else if (fetchedDisplayName && fetchedDisplayName.trim() !== '') {
        fullName = fetchedDisplayName.trim();
      }

      if (fullName && fullName.trim() !== '') {
        // console.log('✅ Drawer: Setting seeker full name to:', fullName);
        setSeekerName(capitalizeWords(fullName.trim()));
      } else {
        // console.log('⚠️ Drawer: No name found in API response');
        // Try to set from loginData as fallback
        const storedData = await getObjByKey('loginResponse');
        const fallbackFirstName = storedData?.data?.firstName ||
          storedData?.user?.firstName ||
          storedData?.firstName || '';
        const fallbackLastName = storedData?.data?.lastName ||
          storedData?.user?.lastName ||
          storedData?.lastName || '';
        const fallbackDisplayName = storedData?.data?.displayName ||
          storedData?.user?.displayName ||
          storedData?.data?.name ||
          storedData?.data?.fullName ||
          storedData?.user?.name ||
          storedData?.user?.fullName ||
          storedData?.name ||
          storedData?.fullName ||
          '';

        let fallbackFullName = '';
        if (fallbackFirstName && fallbackFirstName.trim() !== '') {
          const capitalizedFallbackFirstName = capitalizeFirst(fallbackFirstName.trim());
          if (fallbackLastName && fallbackLastName.trim() !== '') {
            const capitalizedFallbackLastName = capitalizeFirst(fallbackLastName.trim());
            fallbackFullName = `${capitalizedFallbackFirstName} ${capitalizedFallbackLastName}`;
          } else {
            fallbackFullName = capitalizedFallbackFirstName;
          }
        } else if (fallbackLastName && fallbackLastName.trim() !== '') {
          fallbackFullName = capitalizeFirst(fallbackLastName.trim());
        } else if (fallbackDisplayName && fallbackDisplayName.trim() !== '') {
          fallbackFullName = fallbackDisplayName.trim();
        }

        if (fallbackFullName && fallbackFullName.trim() !== '') {
          // console.log('📝 Drawer: Using fallback seeker full name:', fallbackFullName);
          setSeekerName(capitalizeWords(fallbackFullName.trim()));
        } else {
          // console.log('❌ Drawer: No name found in fallback either');
        }
      }

      // Set profile picture if available
      if (fetchedProfilePicture && fetchedProfilePicture.trim() !== '') {
        // Construct full URL if it's a relative path
        let profilePictureUrl = fetchedProfilePicture;
        if (!fetchedProfilePicture.startsWith('http://') && !fetchedProfilePicture.startsWith('https://')) {
          // If it's a relative path, prepend BASE_URL (remove /api/ if present)
          const baseUrl = BASE_URL.split('/api')[0];
          profilePictureUrl = `${baseUrl}${fetchedProfilePicture.startsWith('/') ? '' : '/'}${fetchedProfilePicture}`;
        }
        // console.log('✅ Drawer: Setting seeker profile picture to:', profilePictureUrl);
        setSeekerProfilePicture(`${profilePictureUrl}?t=${Date.now()}`);
        // Bump version so Image key changes and forces re-render
        setSeekerProfileVersion((prev) => prev + 1);
      } else {
        // console.log('⚠️ Drawer: No profilePicture found in API response');
        // Try to set from loginData as fallback
        const storedData = await getObjByKey('loginResponse');
        const fallbackProfilePicture = storedData?.data?.profilePicture ||
          storedData?.data?.profile_picture ||
          storedData?.user?.profilePicture ||
          storedData?.user?.profile_picture ||
          storedData?.profilePicture ||
          '';
        if (fallbackProfilePicture && fallbackProfilePicture.trim() !== '') {
          let profilePictureUrl = fallbackProfilePicture;
          if (!fallbackProfilePicture.startsWith('http://') && !fallbackProfilePicture.startsWith('https://')) {
            const baseUrl = BASE_URL.replace('/api/', '/');
            profilePictureUrl = baseUrl + fallbackProfilePicture.replace(/^\//, '');
          }
          // console.log('📝 Drawer: Using fallback seeker profile picture:', profilePictureUrl);
          setSeekerProfilePicture(`${profilePictureUrl}?t=${Date.now()}`);
          setSeekerProfileVersion((prev) => prev + 1);
        } else {
          // console.log('❌ Drawer: No profilePicture found in fallback either');
          setSeekerProfilePicture(null);
        }
      }

      if (fetchedDesignation && fetchedDesignation.trim() !== '') {
        // console.log('✅ Drawer: Setting seeker designation to:', fetchedDesignation);
        setSeekerDesignation(fetchedDesignation.trim());
      } else {
        // Try to set from loginData as fallback
        const storedData = await getObjByKey('loginResponse');
        const fallbackDesignation = storedData?.data?.designation ||
          storedData?.data?.jobTitle ||
          storedData?.user?.designation ||
          storedData?.designation || '';
        if (fallbackDesignation && fallbackDesignation.trim() !== '') {
          // console.log('📝 Drawer: Using fallback seeker designation:', fallbackDesignation);
          setSeekerDesignation(fallbackDesignation.trim());
        }
      }
    } catch (error) {
      // console.error('❌ Drawer: Error fetching seeker profile:', error);
    }
  }, []);

  // Fetch employer profile to get company name, contact person name, and logo
  const fetchEmployerProfile = useCallback(async () => {
    try {
      const url = `${BASE_URL}employer/profile`;
      // console.log('🔄 Drawer: Fetching employer profile:', url);

      // Get token from storage to verify it exists
      const loginResponse = await getObjByKey('loginResponse');

      if (!loginResponse || !loginResponse.token) {
        // console.error('❌ Drawer: No token found in loginResponse');
        return;
      }

      const result = await GETNETWORK(url, true);
      // console.log('📥 Drawer: Employer profile response:', JSON.stringify(result, null, 2));

      // Extract profile data from various possible response structures
      const profileData = result?.profile || result?.data || result;

      // Extract companyName from various possible response structures
      const fetchedCompanyName =
        profileData?.companyName ||
        result?.companyName ||
        result?.data?.companyName ||
        profileData?.company ||
        result?.company ||
        result?.data?.company ||
        '';

      // Extract contactPerson (name) from various possible response structures
      // Check for full name first, then check for firstName/lastName separately
      const fetchedContactPerson =
        profileData?.contactPerson ||
        result?.contactPerson ||
        result?.data?.contactPerson ||
        profileData?.contactPersonName ||
        result?.contactPersonName ||
        profileData?.fullName ||
        result?.fullName ||
        '';

      // If contactPerson is not found, try to construct from firstName and lastName
      let contactPersonFullName = fetchedContactPerson;
      if (!contactPersonFullName || contactPersonFullName.trim() === '') {
        const contactPersonFirstName =
          profileData?.contactPersonFirstName ||
          profileData?.firstName ||
          result?.contactPersonFirstName ||
          result?.firstName ||
          result?.data?.contactPersonFirstName ||
          result?.data?.firstName ||
          '';

        const contactPersonLastName =
          profileData?.contactPersonLastName ||
          profileData?.lastName ||
          result?.contactPersonLastName ||
          result?.lastName ||
          result?.data?.contactPersonLastName ||
          result?.data?.lastName ||
          '';

        // Combine firstName and lastName if both exist
        if (contactPersonFirstName && contactPersonFirstName.trim() !== '') {
          const capitalizedFirstName = capitalizeFirst(contactPersonFirstName.trim());
          if (contactPersonLastName && contactPersonLastName.trim() !== '') {
            const capitalizedLastName = capitalizeFirst(contactPersonLastName.trim());
            contactPersonFullName = `${capitalizedFirstName} ${capitalizedLastName}`;
          } else {
            contactPersonFullName = capitalizedFirstName;
          }
        } else if (contactPersonLastName && contactPersonLastName.trim() !== '') {
          contactPersonFullName = capitalizeFirst(contactPersonLastName.trim());
        }
      }

      // Extract logoUrl from various possible response structures
      const fetchedLogoUrl =
        profileData?.logoUrl ||
        profileData?.logo ||
        profileData?.companyLogo ||
        profileData?.company_logo ||
        result?.logoUrl ||
        result?.logo ||
        result?.companyLogo ||
        result?.company_logo ||
        result?.data?.logoUrl ||
        result?.data?.logo ||
        '';

      // console.log('📝 Drawer: Extracted company name:', fetchedCompanyName);
      // console.log('📝 Drawer: Extracted contact person:', fetchedContactPerson);
      // console.log('📝 Drawer: Extracted logo URL:', fetchedLogoUrl);

      if (fetchedCompanyName) {
        // console.log('✅ Drawer: Setting company name to:', fetchedCompanyName);
        setCompanyName(fetchedCompanyName);
      } else {
        // console.log('⚠️ Drawer: Company name not found in response');
        // Try to set from loginData as fallback
        const storedData = await getObjByKey('loginResponse');
        const fallbackName = storedData?.data?.companyName || storedData?.data?.company || storedData?.user?.companyName || '';
        if (fallbackName) {
          // console.log('📝 Drawer: Using fallback company name:', fallbackName);
          setCompanyName(fallbackName);
        }
      }

      if (contactPersonFullName && contactPersonFullName.trim() !== '') {
        // console.log('✅ Drawer: Setting contact person name to:', contactPersonFullName);
        setContactPersonName(capitalizeWords(contactPersonFullName.trim()));
      } else {
        // Try to set from loginData as fallback
        const storedData = await getObjByKey('loginResponse');
        const fallbackContactPerson = storedData?.data?.contactPerson ||
          storedData?.data?.contactPersonName ||
          storedData?.user?.contactPerson || '';
        if (fallbackContactPerson && fallbackContactPerson.trim() !== '') {
          // console.log('📝 Drawer: Using fallback contact person name:', fallbackContactPerson);
          setContactPersonName(capitalizeWords(fallbackContactPerson.trim()));
        }
      }

      // Set logo URL if available
      if (fetchedLogoUrl && fetchedLogoUrl.trim() !== '') {
        // Construct full URL if it's a relative path
        // let logoUrlToSet = fetchedLogoUrl;
        // if (!fetchedLogoUrl.startsWith('http://') && !fetchedLogoUrl.startsWith('https://')) {
        //   // If it's a relative path, prepend BASE_URL (remove /api/ if present)
        //   const baseUrl = BASE_URL.replace('/api/', '/');
        //   logoUrlToSet = baseUrl + fetchedLogoUrl.replace(/^\//, '');
        // }

        let logoUrlToSet = fetchedLogoUrl;

        if (!fetchedLogoUrl.startsWith('http')) {
          const baseUrl = BASE_URL.split('/api')[0]; // safer
          logoUrlToSet = `${baseUrl}${fetchedLogoUrl.startsWith('/') ? '' : '/'}${fetchedLogoUrl}`;
        }


        // console.log('✅ Drawer: Setting provider logo URL to:', logoUrlToSet);
        setProviderLogoUrl(logoUrlToSet);
        // Bump version so Image key changes and forces re-render
        setProviderLogoVersion((prev) => prev + 1);
      } else {
        // Try to set from loginData as fallback
        const storedData = await getObjByKey('loginResponse');
        const fallbackLogoUrl = storedData?.data?.logoUrl ||
          storedData?.data?.logo ||
          storedData?.data?.companyLogo ||
          storedData?.user?.logoUrl ||
          storedData?.user?.logo || '';
        if (fallbackLogoUrl && fallbackLogoUrl.trim() !== '') {
          let logoUrlToSet = fallbackLogoUrl;

          if (!fallbackLogoUrl.startsWith('http://') && !fallbackLogoUrl.startsWith('https://')) {
            const baseUrl = BASE_URL.split('/api')[0];
            logoUrlToSet = `${baseUrl}${fallbackLogoUrl.startsWith('/') ? '' : '/'}${fallbackLogoUrl}`;
          }

          // console.log('📝 Drawer: Using fallback provider logo URL:', logoUrlToSet);
          setProviderLogoUrl(logoUrlToSet);
          setProviderLogoVersion((prev) => prev + 1);
        } else {
          // console.log('❌ Drawer: No logo URL found in fallback either');
          setProviderLogoUrl(null);
        }
      }
    } catch (error) {
      // console.error('❌ Drawer: Error fetching employer profile:', error);
    }
  }, []);

  // Resolve login data and role from storage
  const retrieveData = useCallback(async () => {
    try {
      const storedData = await getObjByKey('loginResponse');
      setLoginData(storedData);

      // Resolve role from stored data
      if (!storedData) {
        setRole('guest');
        return;
      }

      const rawRole =
        storedData?.role ??
        storedData?.userType ??
        storedData?.user_type ??
        storedData?.type ??
        storedData?.data?.role ??
        null;

      if (rawRole == null) {
        setRole('guest');
        return;
      }

      if (typeof rawRole === 'string') {
        const lower = rawRole.toLowerCase();
        if (lower.includes('provider')) {
          setRole('provider');
          return;
        }
        if (lower.includes('seeker')) {
          setRole('seeker');
          return;
        }
        setRole('seeker');
        return;
      }

      if (rawRole === 2 || rawRole === '2') {
        setRole('provider');
      } else {
        setRole('seeker');
      }
    } catch (error) {
      // console.error('Error retrieving data:', error);
    }
  }, []);

  // Initial data retrieval on mount
  useEffect(() => {
    retrieveData();
  }, [retrieveData]);

  // Fetch employer profile when role is provider and loginData is available
  useEffect(() => {
    if (role === 'provider' && loginData) {
      // console.log('✅ Drawer: Role is provider, fetching employer profile...');
      fetchEmployerProfile();
    } else if (role === 'seeker' && loginData) {
      // console.log('✅ Drawer: Role is seeker, fetching seeker profile...');
      fetchSeekerProfile();
    }
  }, [role, loginData, fetchEmployerProfile, fetchSeekerProfile]);

  // Memoized callback to refetch profile data - used when refreshKey changes
  const refetchProfileData = useCallback(async () => {
    // Refresh login data and role from storage first
    await retrieveData();

    // Get updated login data to determine role
    const storedData = await getObjByKey('loginResponse');

    if (!storedData) {
      return;
    }

    // Determine current role from stored data
    const rawRole =
      storedData?.role ??
      storedData?.userType ??
      storedData?.user_type ??
      storedData?.type ??
      storedData?.data?.role ??
      null;

    let currentRole = 'guest';
    if (rawRole != null) {
      if (typeof rawRole === 'string') {
        const lower = rawRole.toLowerCase();
        if (lower.includes('provider')) {
          currentRole = 'provider';
        } else if (lower.includes('seeker')) {
          currentRole = 'seeker';
        } else {
          currentRole = 'seeker';
        }
      } else if (rawRole === 2 || rawRole === '2') {
        currentRole = 'provider';
      } else {
        currentRole = 'seeker';
      }
    }

    // Fetch profile based on current role
    if (currentRole === 'provider') {
      await fetchEmployerProfile();
    } else if (currentRole === 'seeker') {
      await fetchSeekerProfile();
    }
  }, [retrieveData, fetchEmployerProfile, fetchSeekerProfile]);

  // Also refetch profile data whenever parent navigator bumps refreshKey
  // (DrawerNavigator uses useFocusEffect + useCallback to update this key on focus)
  useEffect(() => {
    if (refreshKey > 0) {
      refetchProfileData();
    }
  }, [refreshKey, refetchProfileData]);

  // App Version showing concept
  useEffect(() => {
    setAppVersion(DeviceInfo.getVersion());
  }, []);

  // Refetch profile data when drawer comes into focus (e.g., after editing profile)
  // Uses the memoized refetchProfileData callback for consistency
  useFocusEffect(
    useCallback(() => {
      refetchProfileData();
    }, [refetchProfileData])
  );

  const confirmLogout = () => {
    // Remove auth-related entries but keep onboarding flag so users are not shown onboarding again
    deleteByKeys(['loginResponse', 'fcmtoken']).then(() => {
      dispatch(checkuserToken());
    });
    setLogoutModalVisible(false);
  };

  const providerItems = [
    { key: 'editProfile', label: 'Edit Company Profile', icon: 'account-edit-outline' },
    { key: 'booleanSearch', label: 'Boolean Search', icon: 'magnify' },
    { key: 'manageJob', label: 'Manage Job', icon: 'briefcase-edit-outline' },
    { key: 'resumeScore', label: 'Resume Scoring', icon: 'file-account-outline' },
    { key: 'analytics', label: 'Analytics Report', icon: 'chart-box-outline' },
    { key: 'referrals', label: 'Referrals', icon: 'account-multiple-plus-outline' },
    { key: 'premium', label: 'Premium Manager', icon: 'star-circle-outline' },
    { key: 'changePassword', label: 'Change Password', icon: 'key-outline' },
    { key: 'privacy', label: 'Privacy & Policies', icon: 'shield-lock-outline' },
    { key: 'terms', label: 'Terms & Conditions', icon: 'file-document-outline' },
    { key: 'aboutUs', label: 'About US', icon: 'information-outline' },
  ];

  const seekerItems = [
    { key: 'editProfile', label: 'Edit Profile', icon: 'account-edit-outline' },
    { key: 'mockInterview', label: 'AI Mock Interview', icon: 'video-outline' },
    { key: 'changePassword', label: 'Change Password', icon: 'key-outline' },
    { key: 'createResume', label: 'Create Resume', icon: 'file-document-edit-outline' },
    { key: 'privacy', label: 'Privacy & Policies', icon: 'shield-lock-outline' },
    { key: 'terms', label: 'Terms & Conditions', icon: 'file-document-outline' },
    { key: 'aboutUs', label: 'About US', icon: 'information-outline' },
  ];

  const renderProviderItem = (item) => {
    const handleNavigation = () => {
      switch (item.key) {
        case 'editProfile':
          navigation.navigate('EditProfile');
          break;
        case 'booleanSearch':
          navigation.navigate('BooleanSearch');
          break;
        case 'manageJob':
          navigation.navigate('ManageJobs');
          break;
        case 'resumeScore':
          navigation.navigate('ResumeScoring');
          break;
        case 'analytics':
          navigation.navigate('AnalyticsReport');
          break;
        case 'referrals':
          navigation.navigate('Referrals');
          break;
        case 'premium':
          navigation.navigate('PremiumMembership');
          break;
        case 'changePassword':
          navigation.navigate('ChangePasswordProvider');
          break;
        case 'support':
          navigation.navigate('Support');
          break;
        case 'terms':
          navigation.navigate('TermsConditions');
          break;
        case 'privacy':
          navigation.navigate('PrivacyPolicies');
          break;
        case 'aboutUs':
          navigation.navigate('AboutUs');
          break;
        default:
          break;
      }
    };

    return (
      <TouchableOpacity
        key={item.key}
        style={styles.menuItem}
        onPress={handleNavigation}
      >
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name={item.icon} size={22} color="#00A073" />
        </View>
        <Text style={styles.menuLabel}>{item.label}</Text>
      </TouchableOpacity>
    );
  };

  const renderSeekerItem = (item) => {
    const handleNavigation = () => {
      switch (item.key) {
        case 'editProfile':
          navigation.navigate('EditUserProfile');
          break;
        case 'mockInterview':
          navigation.navigate('MockInterview');
          break;
        case 'changePassword':
          navigation.navigate('ChangePassword');
          break;
        case 'createResume':
          navigation.navigate('CreateResume');
          break;
        case 'privacy':
          navigation.navigate('PrivacyPolicies');
          break;
        case 'terms':
          navigation.navigate('TermsConditions');
          break;
        case 'aboutUs':
          navigation.navigate('AboutUs');
          break;
        default:
          break;
      }
    };

    return (
      <TouchableOpacity
        key={item.key}
        style={styles.menuItem}
        onPress={handleNavigation}
      >
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name={item.icon} size={22} color="#00A073" />
        </View>
        <Text style={styles.menuLabel}>{item.label}</Text>
      </TouchableOpacity>
    );
  };

  // Company name is now fetched from API and stored in state
  // Fallback to stored data if API hasn't loaded yet
  const displayCompanyName = companyName ||
    loginData?.data?.companyName ||
    loginData?.data?.company ||
    loginData?.user?.companyName ||
    loginData?.user?.company ||
    loginData?.companyName ||
    loginData?.company ||
    '';

  // Use fetched seeker full name (firstName + lastName), with fallback to stored data
  // Priority: seekerName (from API) > loginData firstName + lastName > other name fields
  const rawSeekerName = seekerName || (() => {
    // Try to construct full name from firstName + lastName
    const storedFirstName = loginData?.data?.firstName ||
      loginData?.user?.firstName ||
      loginData?.firstName || '';
    const storedLastName = loginData?.data?.lastName ||
      loginData?.user?.lastName ||
      loginData?.lastName || '';
    const storedDisplayName = loginData?.data?.displayName ||
      loginData?.user?.displayName ||
      loginData?.data?.name ||
      loginData?.data?.fullName ||
      loginData?.user?.name ||
      loginData?.user?.fullName ||
      loginData?.name ||
      loginData?.fullName ||
      '';

    if (storedFirstName && storedFirstName.trim() !== '') {
      const capitalizedFirstName = capitalizeFirst(storedFirstName.trim());
      if (storedLastName && storedLastName.trim() !== '') {
        const capitalizedLastName = capitalizeFirst(storedLastName.trim());
        return `${capitalizedFirstName} ${capitalizedLastName}`;
      }
      return capitalizedFirstName;
    } else if (storedLastName && storedLastName.trim() !== '') {
      return capitalizeFirst(storedLastName.trim());
    }

    // Fallback to other name fields if firstName/lastName not available
    if (storedDisplayName && storedDisplayName.trim() !== '') {
      return storedDisplayName.trim();
    }

    return '';
  })();
  const displaySeekerName = rawSeekerName ? capitalizeWords(rawSeekerName) : '';

  const displaySeekerDesignation = seekerDesignation ||
    loginData?.data?.designation ||
    loginData?.data?.jobTitle ||
    loginData?.data?.position ||
    loginData?.designation ||
    loginData?.user?.designation ||
    'Designation';

  return (
    <SafeAreaView style={styles.safeArea}>
      <DrawerContentScrollView
        contentContainerStyle={styles.drawerContent}
        showsVerticalScrollIndicator={false}
      >
        <MyAlert
          visible={logoutModalVisible}
          title="Logout"
          message="Are you sure you want to logout?"
          textLeft="No"
          textRight="Yes"
          onPressLeft={() => setLogoutModalVisible(false)}
          onPressRight={confirmLogout}
          onRequestClose={() => setLogoutModalVisible(false)}
        />

        {/* PROFILE Image at top - Clickable */}
        <TouchableOpacity
          style={styles.profileContainer}
          onPress={() => {
            if (role === 'provider') {
              navigation.navigate('ProfileScreen');
            } else if (role === 'seeker') {
              navigation.navigate('UserProfile');
            }
          }}
          activeOpacity={0.7}
        >
          {role === 'provider' && providerLogoUrl ? (
            <Image
              key={providerLogoVersion}
              style={styles.profileImage}
              source={{ uri: providerLogoUrl }}
              resizeMode="cover"
              defaultSource={PROFILE}
              onError={(error) => {
                // console.log('❌ Drawer: Error loading provider logo:', error);
                setProviderLogoUrl(null);
              }}
            />
          ) : role === 'seeker' && seekerProfilePicture ? (
            <Image
              key={seekerProfileVersion}
              style={styles.profileImage}
              source={{ uri: seekerProfilePicture }}
              resizeMode="cover"
              defaultSource={PROFILE}
              onError={(error) => {
                // console.log('❌ Drawer: Error loading profile picture:', error);
                setSeekerProfilePicture(null);
              }}
            />
          ) : (
            <Image
              style={styles.profileImage}
              source={PROFILE}
              resizeMode="cover"
            />
          )}
        </TouchableOpacity>

        {/* Company Name and Contact Person Name below PROFILE (only for provider) */}
        {role === 'provider' && (displayCompanyName || contactPersonName) && (
          <View style={styles.providerInfoContainer}>
            {displayCompanyName ? (
              <Text style={styles.companyNameText}>{displayCompanyName}</Text>
            ) : null}
            {contactPersonName ? (
              <Text style={styles.contactPersonText}>{contactPersonName}</Text>
            ) : null}
          </View>
        )}

        {/* Name and Designation below PROFILE (only for seeker) */}
        {role === 'seeker' && (displaySeekerName || displaySeekerDesignation) && (
          <View style={styles.seekerInfoContainer}>
            {displaySeekerName ? (
              <Text style={styles.seekerNameText}>{displaySeekerName}</Text>
            ) : null}
            {displaySeekerDesignation ? (
              <Text style={styles.seekerDesignationText}>{displaySeekerDesignation}</Text>
            ) : null}
          </View>
        )}

        {role === 'provider' && (
          <>
            <View style={styles.divider} />

            {/* Menu Items: Icon on left, Text on right */}
            <View style={styles.menuContainer}>
              {providerItems.map(renderProviderItem)}
            </View>
          </>
        )}

        {role === 'seeker' && (
          <>
            <View style={styles.divider} />

            {/* Menu Items: Icon on left, Text on right */}
            <View style={styles.menuContainer}>
              {seekerItems.map(renderSeekerItem)}
            </View>
          </>
        )}

        {/* LOGOUT: Icon centered at bottom, Text below icon */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => setLogoutModalVisible(true)}
          >
            <Image source={LOGOUT} style={styles.logoutImage} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>

          {/* Version below logout */}
          <Text style={styles.versionText}>
            Version: {appVersion}
          </Text>
        </View>
      </DrawerContentScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: WHITE,
  },
  drawerContent: {
    paddingTop: HEIGHT * 0.04,
    paddingBottom: HEIGHT * 0.03,
    paddingHorizontal: WIDTH * 0.05,
    flexGrow: 1,
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: HEIGHT * 0.015,
  },
  profileImage: {
    width: WIDTH * 0.24,
    height: WIDTH * 0.24,
    borderRadius: (WIDTH * 0.24) / 2,
  },
  providerInfoContainer: {
    alignItems: 'center',
    marginBottom: HEIGHT * 0.02,
  },
  providerNameText: {
    fontSize: HEIGHT * 0.02,
    color: 'black',
    textAlign: 'center',
    fontFamily: UBUNTUBOLD,
    marginBottom: 4,
  },
  companyNameText: {
    fontSize: HEIGHT * 0.02,
    color: 'black',
    textAlign: 'center',
    fontFamily: UBUNTUBOLD,
    marginBottom: 4,
  },
  contactPersonText: {
    fontSize: HEIGHT * 0.016,
    color: '#666',
    textAlign: 'center',
    fontFamily: FIRASANSSEMIBOLD,
  },
  seekerInfoContainer: {
    alignItems: 'center',
    marginBottom: HEIGHT * 0.02,
  },
  seekerNameText: {
    fontSize: HEIGHT * 0.02,
    color: 'black',
    textAlign: 'center',
    fontFamily: UBUNTUBOLD,
    marginBottom: 4,
  },
  seekerDesignationText: {
    fontSize: HEIGHT * 0.016,
    color: '#666',
    textAlign: 'center',
    fontFamily: FIRASANSSEMIBOLD,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: HEIGHT * 0.02,
  },
  menuContainer: {
    flex: 1,
    marginBottom: HEIGHT * 0.025,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: HEIGHT * 0.015,
    paddingHorizontal: WIDTH * 0.02,
  },
  iconCircle: {
    width: WIDTH * 0.11,
    height: WIDTH * 0.11,
    borderRadius: (WIDTH * 0.11) / 2,
    borderWidth: 1,
    borderColor: '#00A07333',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E6F9F3',
    marginRight: WIDTH * 0.03,
  },
  menuLabel: {
    fontSize: HEIGHT * 0.018,
    color: '#00A073',
    fontFamily: UBUNTU,
    flex: 1,
  },
  logoutContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: HEIGHT * 0.025,
  },
  logoutButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutImage: {
    width: WIDTH * 0.08,
    height: WIDTH * 0.08,
    resizeMode: 'contain',
    marginBottom: HEIGHT * 0.01,
  },
  logoutText: {
    fontSize: HEIGHT * 0.018,
    color: 'red',
    fontFamily: UBUNTUBOLD,
  },

  versionText: {
    marginTop: 8,
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    fontFamily: UBUNTU,
  },
});

export default CustomDrawerContent;
