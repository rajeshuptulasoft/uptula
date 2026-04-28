import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  TextInput,
  Image,
  StatusBar,
  Platform,
  PermissionsAndroid,
  Alert,
  ActivityIndicator,
  RefreshControl,
  BackHandler,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Animated,
  Easing,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { DrawerActions } from "@react-navigation/native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { pick, isCancel } from '@react-native-documents/picker';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { BLACK, BRANDCOLOR, WHITE } from "../../../constant/color";
import { UBUNTUBOLD, UBUNTU, FIRASANSSEMIBOLD, ROBOTOSEMIBOLD, CANTARELLBOLD, FIRASANSBOLD, FIRASANS } from "../../../constant/fontPath";
import { 
  LOGO, 
  USER, 
  MAIL, 
  PHONE, 
  COVERLETTER, 
  UPLOAD,
  MECHANICAL,
  HEALTHCARE,
  INFORMATIONTECHNOLOGY,
  EDUCATION,
  FINANCE,
  HARDWARE,
  IT,
  CATAGORY,
  MARKETING,
  OTHERS,
  DREAMJOBS,
  RESUME,
  MUMBAI,
  HYDREBAD,
  AHAMEDABAD,
  BHUBANESWAR,
  KOLKATA,
  BANGALORE,
  MUKIT,
  VIKASH,
  VDEAL,
  YUBI,
  GC,
  UPTULASOFT,
  VIKASHFOUNDATION,
  VERIFIEDPROVIDER,
} from "../../../constant/imagePath";
import { HEIGHT, WIDTH } from "../../../constant/config";
import { getObjByKey } from "../../../utils/Storage";
import { MyAlert } from "../../../components/commonComponents/MyAlert";
import { MyHeader } from "../../../components/commonComponents/MyHeader";
import { TextInputComponent } from "../../../components/commonComponents/TextInputComponent";
import { CustomButton } from "../../../components/commonComponents/Button";
import { ToastMessage } from "../../../components/commonComponents/ToastMessage";
import { handleProfilePress } from "../../../navigations/CustomDrawerContent";
import { BASE_URL } from "../../../constant/url";
import { GETNETWORK, POSTNETWORK, DELETENETWORK } from "../../../utils/Network";

const companies = [
  { id: "c-1", name: "Mukti", logo: require("../../../assets/images/mukti.png"), tag: "Top" },
  { id: "c-2", name: "Vikash", logo: require("../../../assets/images/vikash.png"), tag: "Featured" },
  { id: "c-3", name: "VDeal", logo: require("../../../assets/images/vdeal.png"), tag: "Sponsored" },
  { id: "c-4", name: "Yubi", logo: require("../../../assets/images/yubi.png"), tag: "Top" },
  { id: "c-5", name: "GC", logo: require("../../../assets/images/gc2.png"), tag: "Featured" },
  { id: "c-6", name: "UptulaSoft", logo: require("../../../assets/images/uptulasoft1.png"), tag: "Sponsored" },
  { id: "c-7", name: "Vikash Foundation", logo: require("../../../assets/images/vf.png"), tag: "Top" },
];

// Format jobType: full_time -> Full Time
const formatJobType = (jobType) => {
  if (!jobType) return '';
  return jobType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Format state: west_bengal -> West Bengal
const formatState = (state) => {
  if (!state) return '';
  return state
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Format city: first letter capitalized
const formatCity = (city) => {
  if (!city) return '';
  return city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
};

// Format location: combine state and city
const formatLocation = (state, city) => {
  const formattedState = formatState(state);
  const formattedCity = formatCity(city);
  
  if (formattedState && formattedCity) {
    return `${formattedCity}, ${formattedState}`;
  } else if (formattedState) {
    return formattedState;
  } else if (formattedCity) {
    return formattedCity;
  }
  return '';
};

const getCompactAddress = (address) => {
  if (!address) return '';
  const parts = address
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length <= 3) return parts.join(', ');
  return parts.slice(-3).join(', ');
};

const getCompanyLocationText = (item) => {
  const rawAddress = item.address || item.location || '';
  const compactAddress = getCompactAddress(rawAddress);
  if (compactAddress) return compactAddress;
  return formatLocation(item.state, item.city);
};

const toBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.trim().toLowerCase() === 'true';
  if (typeof value === 'number') return value === 1;
  return false;
};

const getVerifiedStatus = (item) => {
  if (!item) return false;
  const directValues = [
    item.isVerified,
    item.is_verified,
    item.verified,
    item.rawCompany?.isVerified,
    item.rawCompany?.is_verified,
    item.company?.isVerified,
    item.company?.is_verified,
    item.companyDetails?.isVerified,
    item.companyDetails?.is_verified,
    item.companyData?.isVerified,
    item.companyData?.is_verified,
  ];
  return directValues.some((value) => toBoolean(value));
};

const normalizeDecision = (value) => {
  const decision = (value || '').toString().trim().toLowerCase();
  if (!decision) return '';
  if (decision === 'accept') return 'accepted';
  if (decision === 'accpeted') return 'accepted';
  if (decision === 'rejectd') return 'rejected';
  return decision;
};

// Format salary (no INR prefix, icon shows currency)
const formatSalary = (salaryRange) => {
  if (!salaryRange) return 'Salary not specified';
  // Remove INR prefix if present
  return salaryRange.trim().replace(/^INR\s*/i, '');
};

const SectionGrid = ({ title, filterTag, expanded, onToggle }) => {
  const data = useMemo(
    () =>
      expanded
        ? companies.filter((c) => c.tag === filterTag)
        : companies.filter((c) => c.tag === filterTag).slice(0, 3),
    [expanded, filterTag]
  );

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <TouchableOpacity onPress={onToggle}>
          <Text style={styles.viewAll}>{expanded ? "View less" : "View all"}</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.squareCard} activeOpacity={0.7}>
            <Image source={item.logo} style={styles.squareCardLogo} defaultSource={LOGO} />
            <Text style={styles.squareCardText}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const JobCard = ({ item, onApply, onSave, onPress, isWishlisted, isApplied, applicationStatus, onToggleStatus, isExpanded }) => {
  // Construct logo URL if it's a relative path - use companyLogoUrl for recommended jobs
  const logoUrl = item.companyLogoUrl 
    ? (item.companyLogoUrl.startsWith('http://') || item.companyLogoUrl.startsWith('https://') 
        ? item.companyLogoUrl 
        : `${BASE_URL.replace('/api/', '/')}${item.companyLogoUrl.replace(/^\//, '')}`)
    : null;
  const isVerified = getVerifiedStatus(item);

  // Get status stages
  const getStatusStages = () => {
    const status = applicationStatus || {};
    const decision = normalizeDecision(status.decision || status.statusDecision || status.finalDecision);
    const stages = [
      { 
        label: 'Applied', 
        completed: true,
        date: status.appliedAt || status.appliedDate || status.createdAt 
      },
    ];

    if (decision === 'viewed' || decision === 'accepted' || decision === 'rejected') {
      stages.push({
        label: 'Resume Viewed By Recruiter',
        completed: true,
        date: status.resumeViewedAt || status.statusUpdatedAt || status.updatedAt,
      });
    }

    if (decision === 'accepted') {
      stages.push({
        label: 'Approved',
        completed: true,
        date: status.statusUpdatedAt || status.updatedAt,
        isFinal: true,
      });
    } else if (decision === 'rejected') {
      stages.push({
        label: 'Rejected',
        completed: true,
        date: status.statusUpdatedAt || status.updatedAt,
        isFinal: true,
      });
    }

    return stages;
  };

  const statusStages = getStatusStages();

  const handleToggleStatus = (e) => {
    e.stopPropagation();
    if (onToggleStatus) {
      onToggleStatus(item.id || item._id);
    }
  };

  return (
  <View style={styles.card}>
      <View style={styles.cardContent}>
        {/* Left Side - Logo */}
        <TouchableOpacity onPress={() => onPress(item)} activeOpacity={0.7} style={styles.cardLogoContainer}>
          {logoUrl ? (
            <Image source={{ uri: logoUrl }} style={styles.cardLogo} defaultSource={LOGO} />
          ) : (
    <Image source={LOGO} style={styles.cardLogo} />
          )}
        </TouchableOpacity>
        
        {/* Middle Section - Job Title, Company, Salary */}
        <TouchableOpacity 
          style={styles.cardBody} 
          onPress={() => onPress(item)} 
          activeOpacity={0.7}
        >
          <Text style={styles.cardTitle}>{item.jobTitle || 'N/A'}</Text>
          <View style={styles.cardSubtitleRow}>
            <Text style={styles.cardSubtitle}>{item.companyName || 'N/A'}</Text>
            {isVerified ? (
              <Image source={VERIFIEDPROVIDER} style={styles.cardVerifiedIcon} />
            ) : null}
          </View>
          {item.jobType && (
            <View style={styles.cardInfoRow}>
              <MaterialCommunityIcons name="briefcase-outline" size={WIDTH * 0.035} color={BRANDCOLOR} />
              <Text style={styles.cardJobType}>{formatJobType(item.jobType)}</Text>
            </View>
          )}
          {(item.state || item.city) && (
            <View style={styles.cardInfoRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={WIDTH * 0.035} color={BRANDCOLOR} />
              <Text style={styles.cardLocation}>{formatLocation(item.state, item.city)}</Text>
            </View>
          )}
          <View style={styles.cardInfoRow}>
            <MaterialCommunityIcons name="currency-inr" size={WIDTH * 0.035} color={BRANDCOLOR} />
            <Text style={styles.cardMeta}>{formatSalary(item.salaryRange)}</Text>
          </View>
        </TouchableOpacity>
        
        {/* Right Side - Apply/Applied and Wishlist */}
    <View style={styles.cardActions}>
          {isApplied ? (
            <View style={styles.appliedContainer}>
              <MaterialCommunityIcons name="check-circle" size={WIDTH * 0.05} color="#26AE61" />
              <Text style={styles.appliedText}>Applied</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.applyButton} onPress={(e) => { e.stopPropagation(); onApply(item); }}>
        <Text style={styles.applyText}>Apply</Text>
      </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.heartButton} onPress={(e) => { e.stopPropagation(); onSave(item); }}>
            <MaterialCommunityIcons 
              name={isWishlisted ? "heart" : "heart-outline"} 
              size={WIDTH * 0.055} 
              color={isWishlisted ? "#FF6B6B" : BRANDCOLOR} 
            />
      </TouchableOpacity>
    </View>
      </View>
      
      {/* Status Tracking Section - Card Footer (Only when Applied) */}
      {isApplied && (
        <View style={styles.cardStatusContainer}>
          <TouchableOpacity 
            style={styles.cardStatusHeader} 
            onPress={handleToggleStatus}
            activeOpacity={0.7}
          >
            <Text style={styles.cardStatusLabel}>Status</Text>
            <MaterialCommunityIcons 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={WIDTH * 0.04} 
              color={BRANDCOLOR} 
            />
          </TouchableOpacity>
          
          {isExpanded && (
            <View style={styles.cardStatusTracking}>
              {statusStages.map((stage, index) => (
                <View key={index} style={styles.cardStatusStage}>
                  <View style={styles.cardStatusIndicator}>
                    {stage.completed ? (
                      <MaterialCommunityIcons name="check-circle" size={WIDTH * 0.04} color="#26AE61" />
                    ) : (
                      <View style={styles.cardStatusPendingCircle} />
                    )}
                    {index < statusStages.length - 1 && (
                      <View style={[styles.cardStatusLine, stage.completed && styles.cardStatusLineCompleted]} />
                    )}
                  </View>
                  <View style={styles.cardStatusStageContent}>
                    <Text style={[styles.cardStatusStageLabel, stage.completed && styles.cardStatusStageCompleted]}>
                      {stage.label}
                    </Text>
                    {stage.date && (
                      <Text style={styles.cardStatusStageDate}>
                        {new Date(stage.date).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
  </View>
);
};

const LatestJobCard = ({ item, onApply, onSave, onPress, isWishlisted, isApplied, applicationStatus, onToggleStatus, isExpanded }) => {
  // Construct logo URL if it's a relative path - check both logo and companyLogoUrl
  const logoSource = item.logo || item.companyLogoUrl || null;
  const logoUrl = logoSource 
    ? (logoSource.startsWith('http://') || logoSource.startsWith('https://') 
        ? logoSource 
        : `${BASE_URL.replace('/api/', '/')}${logoSource.replace(/^\//, '')}`)
    : null;
  const isVerified = getVerifiedStatus(item);

  // Get status stages
  const getStatusStages = () => {
    const status = applicationStatus || {};
    const decision = normalizeDecision(status.decision || status.statusDecision || status.finalDecision);
    const stages = [
      { 
        label: 'Applied', 
        completed: true,
        date: status.appliedAt || status.appliedDate || status.createdAt 
      },
    ];

    if (decision === 'viewed' || decision === 'accepted' || decision === 'rejected') {
      stages.push({
        label: 'Resume Viewed By Recruiter',
        completed: true,
        date: status.resumeViewedAt || status.statusUpdatedAt || status.updatedAt,
      });
    }

    if (decision === 'accepted') {
      stages.push({
        label: 'Approved',
        completed: true,
        date: status.statusUpdatedAt || status.updatedAt,
        isFinal: true,
      });
    } else if (decision === 'rejected') {
      stages.push({
        label: 'Rejected',
        completed: true,
        date: status.statusUpdatedAt || status.updatedAt,
        isFinal: true,
      });
    }

    return stages;
  };

  const statusStages = getStatusStages();

  const handleToggleStatus = (e) => {
    e.stopPropagation();
    if (onToggleStatus) {
      onToggleStatus(item.id || item._id);
    }
  };

  return (
    <View style={styles.latestCardWrapper}>
      <TouchableOpacity style={styles.latestCard} onPress={() => onPress(item)} activeOpacity={0.7}>
        <TouchableOpacity 
          style={styles.wishlistButton} 
          onPress={(e) => { e.stopPropagation(); onSave(item); }}
        >
          <MaterialCommunityIcons 
            name={isWishlisted ? "heart" : "heart-outline"} 
            size={WIDTH * 0.05} 
            color={isWishlisted ? "#FF6B6B" : BRANDCOLOR} 
          />
        </TouchableOpacity>
        {logoUrl ? (
          <Image source={{ uri: logoUrl }} style={styles.latestCardLogo} defaultSource={LOGO} />
        ) : (
          <Image source={LOGO} style={styles.latestCardLogo} />
        )}
        <View style={styles.latestCardCompanyRow}>
          <Text style={styles.latestCardCompany} numberOfLines={1}>
            {item.company || item.companyName || 'N/A'}
          </Text>
          {isVerified ? (
            <Image source={VERIFIEDPROVIDER} style={styles.latestCardVerifiedIcon} />
          ) : null}
        </View>
        <Text style={styles.latestCardTitle} numberOfLines={2}>
          {item.title || item.jobTitle || 'N/A'}
        </Text>
        {item.jobType && (
          <View style={styles.latestCardInfoRow}>
            <MaterialCommunityIcons name="briefcase-outline" size={WIDTH * 0.03} color={BRANDCOLOR} />
            <Text style={styles.latestCardJobType} numberOfLines={1}>
              {formatJobType(item.jobType)}
            </Text>
          </View>
        )}
        {(item.state || item.city) && (
          <View style={styles.latestCardInfoRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={WIDTH * 0.03} color={BRANDCOLOR} />
            <Text style={styles.latestCardLocation} numberOfLines={1}>
              {formatLocation(item.state, item.city)}
            </Text>
          </View>
        )}
        <View style={styles.latestCardInfoRow}>
          <MaterialCommunityIcons name="currency-inr" size={WIDTH * 0.03} color={BRANDCOLOR} />
        <Text style={styles.latestCardSalary} numberOfLines={1}>
            {formatSalary(item.salary || item.salaryRange || '')}
        </Text>
        </View>
        {isApplied ? (
          <View style={styles.latestAppliedContainer}>
            <MaterialCommunityIcons name="check-circle" size={WIDTH * 0.04} color="#26AE61" />
            <Text style={styles.latestAppliedText}>Applied</Text>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.latestApplyButton} 
            onPress={(e) => { e.stopPropagation(); onApply(item); }}
          >
            <Text style={styles.latestApplyText}>Apply</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
      
      {/* Status Tracking Section - Card Footer (Only when Applied, not when Apply button is shown) */}
      {isApplied && (
        <View style={styles.latestCardStatusContainer}>
          <TouchableOpacity 
            style={styles.latestCardStatusHeader} 
            onPress={handleToggleStatus}
            activeOpacity={0.7}
          >
            <Text style={styles.latestCardStatusLabel}>Status</Text>
            <MaterialCommunityIcons 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={WIDTH * 0.035} 
              color={BRANDCOLOR} 
            />
          </TouchableOpacity>
          
          {isExpanded && (
            <View style={styles.latestCardStatusTracking}>
              {statusStages.map((stage, index) => (
                <View key={index} style={styles.latestCardStatusStage}>
                  <View style={styles.latestCardStatusIndicator}>
                    {stage.completed ? (
                      <MaterialCommunityIcons name="check-circle" size={WIDTH * 0.035} color="#26AE61" />
                    ) : (
                      <View style={styles.latestCardStatusPendingCircle} />
                    )}
                    {index < statusStages.length - 1 && (
                      <View style={[styles.latestCardStatusLine, stage.completed && styles.latestCardStatusLineCompleted]} />
                    )}
                  </View>
                  <View style={styles.latestCardStatusStageContent}>
                    <Text style={[styles.latestCardStatusStageLabel, stage.completed && styles.latestCardStatusStageCompleted]}>
                      {stage.label}
                    </Text>
                    {stage.date && (
                      <Text style={styles.latestCardStatusStageDate}>
                        {new Date(stage.date).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const SponsorshipCard = ({ item }) => {
  // Construct logo URL if it's a relative path
  const logoUrl = item.logo 
    ? (item.logo.startsWith('http://') || item.logo.startsWith('https://') 
        ? item.logo 
        : `${BASE_URL.replace('/api/', '/')}${item.logo.replace(/^\//, '')}`)
    : null;

  return (
    <View style={styles.sponsorshipCard}>
      {logoUrl ? (
        <Image source={{ uri: logoUrl }} style={styles.sponsorshipCardLogo} defaultSource={LOGO} />
      ) : (
        <Image source={LOGO} style={styles.sponsorshipCardLogo} />
      )}
      <Text style={styles.sponsorshipCardCompany} numberOfLines={1}>
        {item.company || item.companyName || 'N/A'}
      </Text>
      <Text style={styles.sponsorshipCardTitle} numberOfLines={2}>
        {item.title || item.jobTitle || 'N/A'}
      </Text>
      {item.jobType && (
        <View style={styles.sponsorshipCardInfoRow}>
          <MaterialCommunityIcons name="briefcase-outline" size={WIDTH * 0.03} color={BRANDCOLOR} />
          <Text style={styles.sponsorshipCardJobType} numberOfLines={1}>
            {formatJobType(item.jobType)}
          </Text>
        </View>
      )}
      {(item.state || item.city) && (
        <View style={styles.sponsorshipCardInfoRow}>
          <MaterialCommunityIcons name="map-marker-outline" size={WIDTH * 0.03} color={BRANDCOLOR} />
          <Text style={styles.sponsorshipCardLocation} numberOfLines={1}>
            {formatLocation(item.state, item.city)}
          </Text>
        </View>
      )}
      <View style={styles.sponsorshipCardInfoRow}>
        <MaterialCommunityIcons name="currency-inr" size={WIDTH * 0.03} color={BRANDCOLOR} />
      <Text style={styles.sponsorshipCardSalary} numberOfLines={1}>
          {formatSalary(item.salary || item.salaryRange)}
      </Text>
      </View>
  </View>
);
};

const CategoryCard = ({ item, onPress }) => {
  // Format category name: replace underscores, capitalize each word, keep acronyms uppercase
  const formatCategoryName = (category) => {
    if (!category) return 'N/A';
    
    // Check if category is one of the "Other" sub-categories
    const categoryLower = category.toLowerCase().replace(/_/g, ' ');
    if (categoryLower.includes('cook') || categoryLower.includes('security guard') || categoryLower.includes('security_guard') || categoryLower.includes('supervisor') || categoryLower.includes('plumber')) {
      return 'Other';
    }
    
    // If it's already "other", return "Other"
    if (categoryLower === 'other' || categoryLower.trim() === 'other') {
      return 'Other';
    }
    
    // Replace underscores with spaces
    let formatted = category.replace(/_/g, ' ');
    
    // Split into words
    const words = formatted.split(' ');
    
    // Capitalize each word, but keep acronyms (2-3 letter words) in uppercase
    const capitalizedWords = words.map(word => {
      const trimmedWord = word.trim();
      if (trimmedWord.length <= 3 && trimmedWord.toUpperCase() === trimmedWord) {
        // Keep acronyms as uppercase (like IT, HR)
        return trimmedWord.toUpperCase();
      } else if (trimmedWord.length <= 3) {
        // Convert short words to uppercase (like it -> IT)
        return trimmedWord.toUpperCase();
      } else {
        // Capitalize first letter of longer words
        return trimmedWord.charAt(0).toUpperCase() + trimmedWord.slice(1).toLowerCase();
      }
    });
    
    return capitalizedWords.join(' ');
  };

  // Get icon image based on category name
  const getCategoryIcon = (category) => {
    const categoryLower = (category || '').toLowerCase().replace(/_/g, ' ');
    
    if (categoryLower.includes('mechanical') || categoryLower.includes('mechanic')) {
      return MECHANICAL;
    } else if (categoryLower.includes('health') || categoryLower.includes('medical') || categoryLower.includes('healthcare')) {
      return HEALTHCARE;
    } else if (categoryLower.includes('information technology') || categoryLower.includes('information_technology')) {
      return INFORMATIONTECHNOLOGY;
    } else if (categoryLower.includes('education') || categoryLower.includes('teach')) {
      return EDUCATION;
    } else if (categoryLower.includes('finance') || categoryLower.includes('account')) {
      return FINANCE;
    } else if (categoryLower.includes('hardware')) {
      return HARDWARE;
    } else if (categoryLower === 'it' || categoryLower.trim() === 'it' || categoryLower.includes('software') || categoryLower.includes('tech')) {
      return IT;
    } else if (categoryLower.includes('marketing')) {
      return MARKETING;
    } else if (categoryLower === 'other' || categoryLower.includes('cook') || categoryLower.includes('security guard') || categoryLower.includes('security_guard') || categoryLower.includes('supervisor') || categoryLower.includes('plumber')) {
      return OTHERS;
    } else {
      return CATAGORY; // Default category icon
    }
  };

  return (
    <TouchableOpacity style={styles.categoryCard} onPress={() => onPress(item)} activeOpacity={0.7}>
      <View style={styles.categoryIconContainer}>
        <Image 
          source={getCategoryIcon(item.category)} 
          style={styles.categoryIcon}
        />
      </View>
      <Text style={styles.categoryName} numberOfLines={2}>
        {formatCategoryName(item.category)}
      </Text>
      <Text style={styles.categoryJobCount}>
        {item.job_count || 0} Jobs
      </Text>
    </TouchableOpacity>
  );
};

const AllCategoriesSlider = ({ categories, onCategoryPress }) => {
  const scrollViewRef = React.useRef(null);
  const scrollPositionRef = React.useRef(0);
  const animationRef = React.useRef(null);

  // Format category name: replace underscores, capitalize each word, keep acronyms uppercase
  const formatCategoryName = (category) => {
    if (!category) return 'N/A';
    
    // Check if category is one of the "Other" sub-categories
    const categoryLower = category.toLowerCase().replace(/_/g, ' ');
    if (categoryLower.includes('cook') || categoryLower.includes('security guard') || categoryLower.includes('security_guard') || categoryLower.includes('supervisor') || categoryLower.includes('plumber')) {
      return 'Other';
    }
    
    // If it's already "other", return "Other"
    if (categoryLower === 'other' || categoryLower.trim() === 'other') {
      return 'Other';
    }
    
    // Replace underscores with spaces
    let formatted = category.replace(/_/g, ' ');
    
    // Split into words
    const words = formatted.split(' ');
    
    // Capitalize each word, but keep acronyms (2-3 letter words) in uppercase
    const capitalizedWords = words.map(word => {
      const trimmedWord = word.trim();
      if (trimmedWord.length <= 3 && trimmedWord.toUpperCase() === trimmedWord) {
        // Keep acronyms as uppercase (like IT, HR)
        return trimmedWord.toUpperCase();
      } else if (trimmedWord.length <= 3) {
        // Convert short words to uppercase (like it -> IT)
        return trimmedWord.toUpperCase();
      } else {
        // Capitalize first letter of longer words
        return trimmedWord.charAt(0).toUpperCase() + trimmedWord.slice(1).toLowerCase();
      }
    });
    
    return capitalizedWords.join(' ');
  };

  // Get icon image based on category name (same as CategoryCard)
  const getCategoryIcon = (category) => {
    const categoryLower = (category || '').toLowerCase().replace(/_/g, ' ');
    
    if (categoryLower.includes('mechanical') || categoryLower.includes('mechanic')) {
      return MECHANICAL;
    } else if (categoryLower.includes('health') || categoryLower.includes('medical') || categoryLower.includes('healthcare')) {
      return HEALTHCARE;
    } else if (categoryLower.includes('information technology') || categoryLower.includes('information_technology')) {
      return INFORMATIONTECHNOLOGY;
    } else if (categoryLower.includes('education') || categoryLower.includes('teach')) {
      return EDUCATION;
    } else if (categoryLower.includes('finance') || categoryLower.includes('account')) {
      return FINANCE;
    } else if (categoryLower.includes('hardware')) {
      return HARDWARE;
    } else if (categoryLower === 'it' || categoryLower.trim() === 'it' || categoryLower.includes('software') || categoryLower.includes('tech')) {
      return IT;
    } else if (categoryLower.includes('marketing')) {
      return MARKETING;
    } else if (categoryLower === 'other' || categoryLower.includes('cook') || categoryLower.includes('security guard') || categoryLower.includes('security_guard') || categoryLower.includes('supervisor') || categoryLower.includes('plumber')) {
      return OTHERS;
    } else {
      return CATAGORY; // Default category icon
    }
  };

  // Duplicate categories for seamless loop
  const duplicatedCategories = [...categories, ...categories, ...categories];

  // Auto-scroll animation using setInterval
  React.useEffect(() => {
    if (categories.length === 0) return;

    const cardWidth = (WIDTH * 0.92 - WIDTH * 0.02) / 2 + WIDTH * 0.02;
    const singleSetWidth = cardWidth * categories.length;
    
    // Start continuous scrolling
    animationRef.current = setInterval(() => {
      if (scrollViewRef.current) {
        scrollPositionRef.current += 1; // Scroll 1 pixel per interval
        
        // Reset position when reaching the end of first set for seamless loop
        if (scrollPositionRef.current >= singleSetWidth) {
          scrollPositionRef.current = 0;
        }
        
        scrollViewRef.current.scrollTo({ 
          x: scrollPositionRef.current, 
          animated: false 
        });
      }
    }, 20); // Update every 20ms for smooth animation

    // Cleanup
    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [categories.length]);

  if (categories.length === 0) {
    return null;
  }

  return (
    <View style={styles.allCategoriesSliderContainer}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
      >
        <View style={styles.allCategoriesSliderContent}>
          {duplicatedCategories.map((item, index) => (
            <TouchableOpacity 
              key={`${item.category}-${index}`} 
              style={styles.allCategoryCard} 
              onPress={() => onCategoryPress(item)}
              activeOpacity={0.7}
            >
              <View style={styles.allCategoryIconContainer}>
                <Image 
                  source={getCategoryIcon(item.category)} 
                  style={styles.allCategoryIcon}
                />
              </View>
              <Text style={styles.allCategoryName} numberOfLines={2}>
                {formatCategoryName(item.category)}
              </Text>
              <Text style={styles.allCategoryJobCount}>
                {item.job_count || 0} Jobs
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
  </View>
);
};

const SearchOverlay = ({ onClose, navigation }) => {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [wishlistedJobs, setWishlistedJobs] = useState(new Set());
  const [expandedTop, setExpandedTop] = useState(false);
  const [expandedFeatured, setExpandedFeatured] = useState(false);
  const [expandedSponsored, setExpandedSponsored] = useState(false);

  // Fetch wishlist status
  const fetchWishlistStatus = useCallback(async () => {
    try {
      const token = await getObjByKey("loginResponse");
      if (!token) {
        return;
      }
      
      const url = `${BASE_URL}wishlist`;
      const result = await GETNETWORK(url, true);
      
      if (result && !result.message) {
        const wishlistData = result?.wishlist || result?.data || result || [];
        const wishlistedIds = new Set();
        
        if (Array.isArray(wishlistData)) {
          wishlistData.forEach((item) => {
            const id = (item.id || item.job_id || item.jobId)?.toString();
            if (id) {
              wishlistedIds.add(id);
            }
          });
        }
        
        setWishlistedJobs(wishlistedIds);
      }
    } catch (error) {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    fetchWishlistStatus();
  }, [fetchWishlistStatus]);

  // BackHandler: close search overlay
  const handleBackPress = () => {
    onClose();
    return true;
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", handleBackPress);

    return () => backHandler.remove();
  }, [navigation]);

  const handleSearch = useCallback(async (searchQuery, searchLocation) => {
    // If both are empty, clear results
    if (!searchQuery.trim() && !searchLocation.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      
      // Build search URL with query parameters
      let searchUrl = `${BASE_URL}jobs`;
      const params = [];
      
      if (searchQuery.trim()) {
        // Search in jobTitle, companyName, skills, designation
        params.push(`search=${encodeURIComponent(searchQuery.trim())}`);
      }
      
      if (searchLocation.trim()) {
        params.push(`location=${encodeURIComponent(searchLocation.trim())}`);
      }
      
      if (params.length > 0) {
        searchUrl += `?${params.join('&')}`;
      }

      const result = await GETNETWORK(searchUrl, true);
      
      if (result && !result.message) {
        const jobs = result?.data || result?.jobs || result?.list || result || [];
        
        // Filter jobs by jobTitle if searchQuery is provided
        // This ensures only jobs with jobTitle matching the search are shown
        let filteredJobs = Array.isArray(jobs) ? jobs : [];
        
        if (searchQuery.trim()) {
          const searchLower = searchQuery.trim().toLowerCase();
          filteredJobs = filteredJobs.filter((job) => {
            const jobTitle = (job.jobTitle || job.title || '').toLowerCase();
            const companyName = (job.companyName || job.company || '').toLowerCase();
            // Match if jobTitle or companyName starts with the search query
            return jobTitle.startsWith(searchLower) || companyName.startsWith(searchLower);
          });
        }
        
        setSearchResults(filteredJobs);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Real-time search with debouncing - triggers as user types
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      handleSearch(query, location);
    }, 500); // 500ms debounce delay

    return () => clearTimeout(debounceTimer);
  }, [query, location, handleSearch]);

  const handleJobPress = (item) => {
    const jobId = item.id || item._id;
    const jobData = item;
    navigation.navigate('SeekerJobDetails', {
      jobId: jobId,
      jobData: jobData,
    });
  };

  const handleApply = async (item) => {
    const token = await getObjByKey("loginResponse");
    if (!token) {
      return;
    }
    // Navigate to apply form or show apply modal
    navigation.navigate('SeekerJobDetails', {
      jobId: item.id || item._id,
      jobData: item,
    });
  };

  const handleSave = async (item) => {
    const token = await getObjByKey("loginResponse");
    if (!token) {
      return;
    }

    const jobId = item.id || item._id;
    if (!jobId) {
      return;
    }

    const isWishlisted = wishlistedJobs.has(jobId.toString());
    
    try {
      if (isWishlisted) {
        const url = `${BASE_URL}wishlist/${jobId}`;
        const result = await DELETENETWORK(url, true);
        
        const isSuccess = result && (
          !result.message || 
          (result.message && (result.message.toLowerCase().includes('success') || result.message.toLowerCase().includes('deleted'))) ||
          result.success === true ||
          result.statusCode === 200 ||
          result.statusCode === 201
        );
        
        if (isSuccess) {
          setWishlistedJobs(prev => {
            const newSet = new Set(prev);
            newSet.delete(jobId.toString());
            return newSet;
          });
        }
      } else {
        const url = `${BASE_URL}wishlist/${jobId}`;
        const result = await POSTNETWORK(url, {}, true);
        
        const isSuccess = result && (
          !result.message || 
          (result.message && result.message.toLowerCase().includes('success')) ||
          result.success === true ||
          result.statusCode === 200 ||
          result.statusCode === 201
        );
        
        if (isSuccess) {
          setWishlistedJobs(prev => new Set(prev).add(jobId.toString()));
        }
      }
    } catch (error) {
      // Silently fail
    }
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={WHITE} translucent={false} />
    <View style={styles.overlay}>
      <View style={styles.overlayHeader}>
          <TouchableOpacity onPress={onClose}>
            <MaterialCommunityIcons name="arrow-left" size={WIDTH * 0.065} color={BLACK} />
        </TouchableOpacity>
        <Text style={styles.overlayTitle}>Search</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Skills, Designation, Companies</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="e.g. React, Designer, Uptula"
          placeholderTextColor="#7A7A7A"
          style={styles.input}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Location</Text>
        <TextInput
          value={location}
          onChangeText={setLocation}
          placeholder="City, state, or remote"
          placeholderTextColor="#7A7A7A"
          style={styles.input}
        />
      </View>

        {loading && (
          <View style={styles.loadingIndicatorContainer}>
            <ActivityIndicator size="small" color={BRANDCOLOR} />
            <Text style={styles.loadingIndicatorText}>Searching...</Text>
          </View>
        )}

        {searchResults.length > 0 && (
          <View style={styles.searchResultsContainer}>
            <Text style={styles.searchResultsTitle}>Search Results</Text>
            <FlatList
              data={searchResults}
              keyExtractor={(item, index) => item.id?.toString() || item._id?.toString() || index.toString()}
              numColumns={2}
              columnWrapperStyle={styles.row}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const jobId = (item.id || item._id)?.toString();
                const isWishlisted = wishlistedJobs.has(jobId);
                const logoUrl = item.logo || item.companyLogoUrl
                  ? ((item.logo || item.companyLogoUrl).startsWith('http://') || (item.logo || item.companyLogoUrl).startsWith('https://') 
                      ? (item.logo || item.companyLogoUrl) 
                      : `${BASE_URL.replace('/api/', '/')}${(item.logo || item.companyLogoUrl).replace(/^\//, '')}`)
                  : null;
                
                return (
                  <TouchableOpacity 
                    style={styles.searchResultCard} 
                    onPress={() => handleJobPress(item)}
                    activeOpacity={0.7}
                  >
                    <TouchableOpacity 
                      style={styles.searchWishlistButton} 
                      onPress={(e) => { e.stopPropagation(); handleSave(item); }}
                    >
                      <MaterialCommunityIcons 
                        name={isWishlisted ? "heart" : "heart-outline"} 
                        size={WIDTH * 0.05} 
                        color={isWishlisted ? "#FF6B6B" : BRANDCOLOR} 
                      />
      </TouchableOpacity>
                    {logoUrl ? (
                      <Image source={{ uri: logoUrl }} style={styles.searchResultLogo} defaultSource={LOGO} />
                    ) : (
                      <Image source={LOGO} style={styles.searchResultLogo} />
                    )}
                    <Text style={styles.searchResultCompany} numberOfLines={1}>
                      {item.company || item.companyName || 'N/A'}
                    </Text>
                    <Text style={styles.searchResultTitle} numberOfLines={2}>
                      {item.title || item.jobTitle || 'N/A'}
                    </Text>
                    {item.jobType && (
                      <View style={styles.searchResultInfoRow}>
                        <MaterialCommunityIcons name="briefcase-outline" size={WIDTH * 0.03} color={BRANDCOLOR} />
                        <Text style={styles.searchResultJobType} numberOfLines={1}>
                          {formatJobType(item.jobType)}
                        </Text>
                      </View>
                    )}
                    {(item.state || item.city) && (
                      <View style={styles.searchResultInfoRow}>
                        <MaterialCommunityIcons name="map-marker-outline" size={WIDTH * 0.03} color={BRANDCOLOR} />
                        <Text style={styles.searchResultLocation} numberOfLines={1}>
                          {formatLocation(item.state, item.city)}
                        </Text>
                      </View>
                    )}
                    <View style={styles.searchResultInfoRow}>
                      <MaterialCommunityIcons name="currency-inr" size={WIDTH * 0.03} color={BRANDCOLOR} />
                    <Text style={styles.searchResultSalary} numberOfLines={1}>
                        {formatSalary(item.salary || item.salaryRange)}
                    </Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.searchApplyButton} 
                      onPress={(e) => { e.stopPropagation(); handleApply(item); }}
                    >
                      <Text style={styles.searchApplyText}>Apply</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        )}

        {!loading && searchResults.length === 0 && query.trim() === '' && location.trim() === '' && (
      <ScrollView showsVerticalScrollIndicator={false}>
        <SectionGrid
          title="Top Companies"
          filterTag="Top"
          expanded={expandedTop}
          onToggle={() => setExpandedTop(!expandedTop)}
        />
        <SectionGrid
          title="Featured Companies"
          filterTag="Featured"
          expanded={expandedFeatured}
          onToggle={() => setExpandedFeatured(!expandedFeatured)}
        />
        <SectionGrid
          title="Sponsored Companies"
          filterTag="Sponsored"
          expanded={expandedSponsored}
          onToggle={() => setExpandedSponsored(!expandedSponsored)}
        />
      </ScrollView>
        )}

        {!loading && searchResults.length === 0 && (query.trim() !== '' || location.trim() !== '') && (
          <View style={styles.emptySearchContainer}>
            <Text style={styles.emptySearchText}>No jobs found matching your search</Text>
    </View>
        )}
      </View>
    </>
  );
};

// Dream Job Section Component
const DreamJobSection = ({ jobs, latestJobs }) => {
  const scrollViewRef = React.useRef(null);
  const scrollPositionRef = React.useRef(0);
  const animationRef = React.useRef(null);
  const [currentPage, setCurrentPage] = React.useState(0);

  // Combine jobs from both endpoints
  const allJobs = React.useMemo(() => {
    const combined = [...(jobs || []), ...(latestJobs || [])];
    return combined;
  }, [jobs, latestJobs]);

  // Format location text - capitalize first letter of each word, handle underscores
  const formatLocationText = (text) => {
    if (!text) return '';
    // Replace underscores with spaces, then capitalize each word
    return text
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Group jobs by location (address, city, state)
  const locationGroups = React.useMemo(() => {
    const groups = {};
    
    allJobs.forEach((job) => {
      const address = formatLocationText(job.address || '');
      const city = formatLocationText(job.city || '');
      const state = formatLocationText(job.state || '');
      
      // Create location string
      const locationParts = [address, city, state].filter(part => part && part.trim());
      const locationKey = locationParts.join(', ') || 'Location not specified';
      
      if (!groups[locationKey]) {
        groups[locationKey] = {
          location: locationKey,
          count: 0,
          jobs: []
        };
      }
      
      groups[locationKey].count += 1;
      groups[locationKey].jobs.push(job);
    });
    
    // Convert to array and sort by count (descending)
    return Object.values(groups).sort((a, b) => b.count - a.count);
  }, [allJobs]);

  // Format job count
  const formatJobCount = (count) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K+`;
    }
    return `${count}+`;
  };

  // Duplicate locations for seamless loop
  const duplicatedLocations = React.useMemo(() => {
    return [...locationGroups, ...locationGroups, ...locationGroups];
  }, [locationGroups]);

  // Auto-scroll animation
  React.useEffect(() => {
    if (locationGroups.length === 0) return;

    const cardWidth = WIDTH * 0.65 + WIDTH * 0.02; // Card width + margin
    const singleSetWidth = cardWidth * locationGroups.length;
    const totalPages = Math.ceil(locationGroups.length / 3); // 3 cards per page
    
    // Start continuous scrolling
    animationRef.current = setInterval(() => {
      if (scrollViewRef.current) {
        scrollPositionRef.current += 1; // Scroll 1 pixel per interval
        
        // Update current page based on scroll position
        const currentPageIndex = Math.floor((scrollPositionRef.current / singleSetWidth) * locationGroups.length / cardWidth) % totalPages;
        setCurrentPage(currentPageIndex);
        
        // Reset position when reaching the end of first set for seamless loop
        if (scrollPositionRef.current >= singleSetWidth) {
          scrollPositionRef.current = 0;
          setCurrentPage(0);
        }
        
        scrollViewRef.current.scrollTo({ 
          x: scrollPositionRef.current, 
          animated: false 
        });
      }
    }, 20); // Update every 20ms for smooth animation

    // Cleanup
    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [locationGroups.length]);

  if (locationGroups.length === 0) {
    return null;
  }

  const totalPages = Math.ceil(locationGroups.length / 3);

  return (
    <View style={styles.dreamJobContainer}>
      <View style={styles.dreamJobLeftSection}>
        <Image source={DREAMJOBS} style={styles.dreamJobImage} resizeMode="cover" />
      </View>
      <View style={styles.dreamJobRightSection}>
        <ScrollView 
          ref={scrollViewRef}
          horizontal 
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
          contentContainerStyle={styles.dreamJobScrollContent}
        >
          {duplicatedLocations.map((locationGroup, index) => (
            <TouchableOpacity 
              key={`${locationGroup.location}-${index}`} 
              style={styles.dreamJobRoleCard}
              activeOpacity={0.7}
            >
              <View style={styles.dreamJobRoleContent}>
                <Text style={styles.dreamJobRoleTitle} numberOfLines={2}>
                  {locationGroup.location}
                </Text>
                <Text style={styles.dreamJobRoleJobs}>
                  {formatJobCount(locationGroup.count)} Jobs
                </Text>
              </View>
              <MaterialCommunityIcons 
                name="chevron-right" 
                size={WIDTH * 0.05} 
                color={BRANDCOLOR} 
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
        {/* Pagination dots */}
        <View style={styles.dreamJobPagination}>
          {Array.from({ length: totalPages }).map((_, index) => (
            <View 
              key={index}
              style={[
                styles.dreamJobDot, 
                index === currentPage % totalPages && styles.dreamJobDotActive
              ]} 
            />
          ))}
        </View>
      </View>
    </View>
  );
};

// Resume Premium Section Component
const ResumePremiumSection = ({ onLearnMore }) => {
  return (
    <View style={styles.resumePremiumContainer}>
      <View style={styles.resumePremiumLeftSection}>
        <Text style={styles.resumePremiumTitle}>Accelerate your job search with premium services</Text>
        <Text style={styles.resumePremiumDescription}>
          If scored 70% then you can use the premium version
        </Text>
        <View style={styles.resumePremiumTag}>
          <Text style={styles.resumePremiumTagText}>by Uptula</Text>
        </View>
      </View>
      <View style={styles.resumePremiumRightSection}>
        <Image source={RESUME} style={styles.resumePremiumImage} resizeMode="contain" />
        <TouchableOpacity 
          style={styles.resumePremiumButton}
          onPress={onLearnMore}
          activeOpacity={0.7}
        >
          <Text style={styles.resumePremiumButtonText}>Learn More</Text>
        </TouchableOpacity>
        <Text style={styles.resumePremiumNote}>Includes paid services</Text>
      </View>
    </View>
  );
};

// Quick Filter Section Component (Keywords from jobTitle)
const QuickFilterSection = ({ keywords, onFilterPress }) => {
  // If no keywords provided, return null
  if (!keywords || keywords.length === 0) {
    return null;
  }

  return (
    <View style={styles.quickFilterContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={true}
      >
        <View style={styles.quickFilterContent}>
          {keywords.map((keyword, index) => (
            <TouchableOpacity
              key={`${keyword}-${index}`}
              style={styles.quickFilterButton}
              onPress={() => onFilterPress && onFilterPress({ id: keyword, label: keyword })}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="tag-outline"
                size={WIDTH * 0.06}
                color={BLACK}
              />
              <Text style={styles.quickFilterLabel} numberOfLines={1}>
                {keyword}
              </Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={WIDTH * 0.04}
                color={BLACK}
                style={styles.quickFilterArrow}
              />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

// Jobs Based on Applied Section Component
const JobsBasedOnAppliedSection = ({ jobs, loading, onJobPress, onApply, onSave, wishlistedJobs, appliedJobs, applicationStatuses, onToggleStatus, expandedStatusCards }) => {
  if (!jobs || jobs.length === 0) {
    return null;
  }

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Jobs Based on Your Applied ({jobs.length})</Text>
      </View>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={BRANDCOLOR} />
          <Text style={styles.loadingText}>Loading jobs...</Text>
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item, index) => item.id?.toString() || item._id?.toString() || index.toString()}
          numColumns={2}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
          renderItem={({ item }) => {
            const jobId = (item.id || item._id)?.toString();
            const isWishlisted = wishlistedJobs.has(jobId);
            const isApplied = appliedJobs.has(jobId);
            const applicationStatus = applicationStatuses.get(jobId);
            const isExpanded = expandedStatusCards.has(jobId);
            return (
              <LatestJobCard 
                item={item} 
                onApply={onApply} 
                onSave={onSave} 
                onPress={onJobPress}
                isWishlisted={isWishlisted}
                isApplied={isApplied}
                applicationStatus={applicationStatus}
                onToggleStatus={onToggleStatus}
                isExpanded={isExpanded}
              />
            );
          }}
        />
      )}
    </View>
  );
};

// Jobs Based on Profile Section Component
const JobsBasedOnProfileSection = ({ jobs, loading, onJobPress, onApply, onSave, wishlistedJobs, appliedJobs, applicationStatuses, onToggleStatus, expandedStatusCards }) => {
  if (!jobs || jobs.length === 0) {
    return null;
  }

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Jobs Based on Your Profile ({jobs.length})</Text>
      </View>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={BRANDCOLOR} />
          <Text style={styles.loadingText}>Loading jobs...</Text>
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item, index) => item.id?.toString() || item._id?.toString() || index.toString()}
          numColumns={2}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
          renderItem={({ item }) => {
            const jobId = (item.id || item._id)?.toString();
            const isWishlisted = wishlistedJobs.has(jobId);
            const isApplied = appliedJobs.has(jobId);
            const applicationStatus = applicationStatuses.get(jobId);
            const isExpanded = expandedStatusCards.has(jobId);
            return (
              <LatestJobCard 
                item={item} 
                onApply={onApply} 
                onSave={onSave} 
                onPress={onJobPress}
                isWishlisted={isWishlisted}
                isApplied={isApplied}
                applicationStatus={applicationStatus}
                onToggleStatus={onToggleStatus}
                isExpanded={isExpanded}
              />
            );
          }}
        />
      )}
    </View>
  );
};

const CompanyCard = ({ item }) => {
  const navigation = useNavigation();
  const logoUrl = item.logo
    ? (item.logo.startsWith('http://') || item.logo.startsWith('https://')
        ? item.logo
        : `${BASE_URL.replace('/api/', '/')}${item.logo.replace(/^\//, '')}`)
    : null;
  const locationText = getCompanyLocationText(item);
  const isVerified = getVerifiedStatus(item);
  const handleCompanyPress = () => {
    navigation.navigate("DisplayCompanyProfile", {
      companyData: item,
      company: item.rawCompany || item,
    });
  };

  return (
    <TouchableOpacity style={styles.companyCard} activeOpacity={0.85} onPress={handleCompanyPress}>
      {logoUrl ? (
        <Image source={{ uri: logoUrl }} style={styles.companyCardLogo} defaultSource={LOGO} />
      ) : (
        <Image source={LOGO} style={styles.companyCardLogo} />
      )}
      <View style={styles.companyNameRow}>
        <Text style={styles.companyCardName} numberOfLines={1}>
          {item.companyName || 'N/A'}
        </Text>
        {isVerified ? (
          <Image source={VERIFIEDPROVIDER} style={styles.companyVerifiedIcon} />
        ) : null}
      </View>
      {locationText ? (
        <View style={styles.companyLocationRow}>
          <MaterialCommunityIcons name="map-marker-outline" size={WIDTH * 0.032} color={BRANDCOLOR} />
          <Text style={styles.companyCardMeta} numberOfLines={2}>
            {locationText}
          </Text>
        </View>
      ) : null}
      <Text style={styles.companyCardOpenings} numberOfLines={2}>
        {item.jobCount ? `${item.jobCount} openings` : 'No openings'}
      </Text>
    </TouchableOpacity>
  );
};

// Top Companies Section Component
// Cities Section Component
const CitiesSection = ({ navigation }) => {
  const [cityJobCounts, setCityJobCounts] = useState({});
  const [loading, setLoading] = useState(true);

  const cities = [
    { name: 'Bhubaneswar', displayName: 'Bhubaneswar (includes Khordha)', image: BHUBANESWAR },
    { name: 'Mumbai', image: MUMBAI },
    { name: 'Ahmedabad', image: AHAMEDABAD },
    { name: 'Bangalore', image: BANGALORE },
    { name: 'Hyderabad', image: HYDREBAD },
    { name: 'Kolkata', image: KOLKATA },
  ];

  // Fetch job counts by city
  useEffect(() => {
    const fetchCityJobCounts = async () => {
      try {
        setLoading(true);
        const url = `${BASE_URL}jobs`;
        const result = await GETNETWORK(url, false);
        
        if (result && !result.message) {
          const allJobs = result?.data || result?.jobs || result?.list || result || [];
          const jobsArray = Array.isArray(allJobs) ? allJobs : [];
          
          // Count jobs by city
          const counts = {};
          cities.forEach(city => {
            const cityNameLower = city.name.toLowerCase();
            const count = jobsArray.filter((job) => {
              const jobSearchText = [
                job.city,
                job.location,
                job.address,
                job.state,
                job.area,
                job.town,
              ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

              if (!jobSearchText) return false;
              if (cityNameLower === 'bhubaneswar') {
                return (
                  jobSearchText.includes('bhubaneswar') ||
                  jobSearchText.includes('bhubaneswara') ||
                  jobSearchText.includes('bhubaneshwar') ||
                  jobSearchText.includes('khordha') ||
                  jobSearchText.includes('khurda') ||
                  jobSearchText.includes('khorda') ||
                  jobSearchText.includes('khurdha')
                );
              }
              return jobSearchText.includes(cityNameLower);
            }).length;
            counts[city.name] = count;
          });
          
          setCityJobCounts(counts);
        } else {
          // Set default counts if API fails
          const defaultCounts = {};
          cities.forEach(city => {
            defaultCounts[city.name] = 0;
          });
          setCityJobCounts(defaultCounts);
        }
      } catch (error) {
        // Set default counts on error
        const defaultCounts = {};
        cities.forEach(city => {
          defaultCounts[city.name] = 0;
        });
        setCityJobCounts(defaultCounts);
      } finally {
        setLoading(false);
      }
    };

    fetchCityJobCounts();
  }, []);

  const handleCityPress = (cityName) => {
    // Navigate to CompanyDetailsJobScreen with city name as filter
    navigation.navigate('CompanyDetailsJob', { cityName: cityName });
  };

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Get your jobs through the City</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.citiesScrollContent}
      >
        {cities.map((city, index) => {
          const jobCount = cityJobCounts[city.name] || 0;
          return (
            <TouchableOpacity 
              key={city.name}
              style={styles.cityCard}
              activeOpacity={0.7}
              onPress={() => handleCityPress(city.name)}
            >
              <View style={styles.cityImageContainer}>
                <Image source={city.image} style={styles.cityImage} resizeMode="contain" />
                {/* Job count at top left */}
                <View style={styles.cityJobCountTopLeft}>
                  <MaterialCommunityIcons name="briefcase" size={WIDTH * 0.035} color={BRANDCOLOR} />
                  <Text style={styles.cityJobCountText}>{jobCount} JOBS</Text>
                </View>
                {/* Right arrow icon on top right */}
                <TouchableOpacity 
                  style={styles.cityArrowButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleCityPress(city.name);
                  }}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="arrow-right" size={WIDTH * 0.05} color={BRANDCOLOR} />
                </TouchableOpacity>
              </View>
              {/* Footer text commented out as requested */}
              {/* <View style={styles.cityLabelContainer}>
                <Text style={styles.cityLabel}>{city.displayName || city.name}</Text>
              </View> */}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

// Poster Section Component
const PosterSection = () => {
  return (
    <View style={styles.posterContainer}>
      <View style={styles.posterGradient}>
        <View style={styles.posterContent}>
          <View style={styles.posterIconContainer}>
            <MaterialCommunityIcons name="chart-line" size={WIDTH * 0.12} color={WHITE} />
          </View>
          <Text style={styles.posterTitle}>70% hiring happen any Job post</Text>
          <Text style={styles.posterSlogan}>Find your dream job today!</Text>
          <Text style={styles.posterSlogan}>Join thousands of successful candidates</Text>
          <View style={styles.posterBadge}>
            <MaterialCommunityIcons name="star" size={WIDTH * 0.04} color={WHITE} />
            <Text style={styles.posterBadgeText}>Trusted by 10,000+ Job Seekers</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const HomeScreen = ({ navigation }) => {
  const nav = useNavigation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [loginPromptVisible, setLoginPromptVisible] = useState(false);
  const [exitAlertVisible, setExitAlertVisible] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [latestJobs, setLatestJobs] = useState([]);
  const [sponsorships, setSponsorships] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [loadingRecommended, setLoadingRecommended] = useState(false);
  const [loadingLatest, setLoadingLatest] = useState(false);
  const [loadingSponsorships, setLoadingSponsorships] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [applyFormVisible, setApplyFormVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [wishlistedJobs, setWishlistedJobs] = useState(new Set()); // Track wishlisted job IDs
  const [appliedJobs, setAppliedJobs] = useState(new Map()); // Track applied jobs with their status: Map<jobId, applicationData>
  const [expandedStatusCards, setExpandedStatusCards] = useState(new Set()); // Track which status cards are expanded
  
  // New state variables for redesigned sections
  const [jobsBasedOnApplied, setJobsBasedOnApplied] = useState([]);
  const [jobsBasedOnProfile, setJobsBasedOnProfile] = useState([]);
  const [topCompanies, setTopCompanies] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loadingJobsBasedOnApplied, setLoadingJobsBasedOnApplied] = useState(false);
  const [loadingJobsBasedOnProfile, setLoadingJobsBasedOnProfile] = useState(false);
  const [loadingTopCompanies, setLoadingTopCompanies] = useState(false);
  const companyScrollRef = React.useRef(null);
  const companyScrollIndexRef = React.useRef(0);
  
  // Apply form states
  const [applyName, setApplyName] = useState("");
  const [applyEmail, setApplyEmail] = useState("");
  const [applyPhone, setApplyPhone] = useState("");
  const [applyFile, setApplyFile] = useState(null);
  const [applyCoverLetter, setApplyCoverLetter] = useState("");
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyToastMessage, setApplyToastMessage] = useState({
    type: "",
    msg: "",
    visible: false,
  });

  // Profile completion alert state
  const [profileCompletionAlertVisible, setProfileCompletionAlertVisible] = useState(false);
  const [profileCompletionPercentage, setProfileCompletionPercentage] = useState(100);
  const [profileCompletionCheckDone, setProfileCompletionCheckDone] = useState(false);
 
  // Request location permission
  const requestLocationPermission = async () => {
    if (Platform.OS === "android") {
      try {
        // Check if permission is already granted
        const fineLocationGranted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        const coarseLocationGranted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
        );
 
        if (fineLocationGranted && coarseLocationGranted) {
          return true;
        }
 
        // Request permissions
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ]);
 
        if (
          granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] ===
            PermissionsAndroid.RESULTS.GRANTED
        ) {
          return true;
        } else {
          Alert.alert(
            "Location Permission Denied",
            "Please grant location permission to use location-based features. You can enable it in app settings.",
            [{ text: "OK" }]
          );
          return false;
        }
      } catch (err) {
        console.warn("Location permission error:", err);
        return false;
      }
    } else {
      // iOS - permissions are handled through Info.plist
      // You can use react-native-geolocation-service or similar library for iOS
      return true;
    }
  };
 
  // Request location permission on component mount
  useEffect(() => {
    requestLocationPermission();
  }, []);

  // BackHandler for apply form modal
  useEffect(() => {
    if (Platform.OS === "android" && applyFormVisible) {
      const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
        console.log("🔙 ApplyForm: Back button pressed, closing form");
        handleCloseApplyForm();
        return true;
      });
      return () => backHandler.remove();
    }
  }, [applyFormVisible]);

  // BackHandler for main screen - use navigation.goBack() when no modals are open
  useEffect(() => {
    if (Platform.OS === "android" && !applyFormVisible && !searchOpen) {
      const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
        if (navigation.canGoBack()) {
          navigation.goBack();
          return true;
        } else {
          return false; // Do nothing if can't go back
        }
      });
      return () => backHandler.remove();
    }
  }, [applyFormVisible, searchOpen, navigation]);

  // Fetch recommended jobs
  const fetchRecommendedJobs = useCallback(async () => {
    try {
      setLoadingRecommended(true);
      const url = `${BASE_URL}jobs`;
      // console.log('📡 HomeScreen: Fetching recommended jobs from:', url);
      const result = await GETNETWORK(url, false);
      // console.log('📥 HomeScreen: Recommended jobs API response:', JSON.stringify(result, null, 2));
      
      if (result && !result.message) {
        // Handle various response structures
        const jobs = result?.data || result?.jobs || result?.list || result || [];
        // console.log('📝 HomeScreen: Processed recommended jobs:', JSON.stringify(jobs, null, 2));
        // console.log('📊 HomeScreen: Number of recommended jobs:', Array.isArray(jobs) ? jobs.length : 0);
        setRecommendedJobs(Array.isArray(jobs) ? jobs : []);
      } else {
        // console.log('⚠️ HomeScreen: No recommended jobs data or error message:', result?.message);
        setRecommendedJobs([]);
      }
    } catch (error) {
      // console.error('❌ HomeScreen: Error fetching recommended jobs:', error);
      setRecommendedJobs([]);
    } finally {
      setLoadingRecommended(false);
    }
  }, []);

  // Fetch latest jobs
  const fetchLatestJobs = useCallback(async () => {
    try {
      setLoadingLatest(true);
      const url = `${BASE_URL}jobs/latest`;
      // console.log('📡 HomeScreen: Fetching latest jobs from:', url);
      const result = await GETNETWORK(url, false);
      // console.log('📥 HomeScreen: Latest jobs API response:', JSON.stringify(result, null, 2));
      
      if (result && !result.message) {
        // Handle various response structures
        const jobs = result?.data || result?.jobs || result?.list || result || [];
        // console.log('📝 HomeScreen: Processed latest jobs:', JSON.stringify(jobs, null, 2));
        // console.log('📊 HomeScreen: Number of latest jobs:', Array.isArray(jobs) ? jobs.length : 0);
        setLatestJobs(Array.isArray(jobs) ? jobs : []);
      } else {
        // console.log('⚠️ HomeScreen: No latest jobs data or error message:', result?.message);
        setLatestJobs([]);
      }
    } catch (error) {
      // console.error('❌ HomeScreen: Error fetching latest jobs:', error);
      setLatestJobs([]);
    } finally {
      setLoadingLatest(false);
    }
  }, []);

  // Fetch sponsorships
  const fetchSponsorships = useCallback(async () => {
    try {
      setLoadingSponsorships(true);
      const url = `${BASE_URL}sponsorships`;
      // console.log('📡 HomeScreen: Fetching sponsorships from:', url);
      const result = await GETNETWORK(url, true);
      // console.log('📥 HomeScreen: Sponsorships API response:', JSON.stringify(result, null, 2));
      
      if (result && !result.message) {
        // Handle various response structures
        const sponsorshipsData = result?.data || result?.sponsorships || result?.list || result || [];
        // console.log('📝 HomeScreen: Processed sponsorships:', JSON.stringify(sponsorshipsData, null, 2));
        // console.log('📊 HomeScreen: Number of sponsorships:', Array.isArray(sponsorshipsData) ? sponsorshipsData.length : 0);
        setSponsorships(Array.isArray(sponsorshipsData) ? sponsorshipsData : []);
      } else {
        // console.log('⚠️ HomeScreen: No sponsorships data or error message:', result?.message);
        setSponsorships([]);
      }
    } catch (error) {
      // console.error('❌ HomeScreen: Error fetching sponsorships:', error);
      setSponsorships([]);
    } finally {
      setLoadingSponsorships(false);
    }
  }, []);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      const url = `${BASE_URL}jobs/categories`;
      // console.log('📡 HomeScreen: Fetching categories from:', url);
      const result = await GETNETWORK(url, false); // No token required
      // console.log('📥 HomeScreen: Categories API response:', JSON.stringify(result, null, 2));
      
      if (result && !result.message) {
        // Handle various response structures
        const categoriesData = result?.data || result?.categories || result?.list || result || [];
        // console.log('📝 HomeScreen: Processed categories:', JSON.stringify(categoriesData, null, 2));
        // console.log('📊 HomeScreen: Number of categories:', Array.isArray(categoriesData) ? categoriesData.length : 0);
        
        const categoriesArray = Array.isArray(categoriesData) ? categoriesData : [];
        setCategories(categoriesArray);
        setAllCategories(categoriesArray); // Use same data for sliding banner
      } else {
        // console.log('⚠️ HomeScreen: No categories data or error message:', result?.message);
        setCategories([]);
        setAllCategories([]);
      }
    } catch (error) {
      // console.error('❌ HomeScreen: Error fetching categories:', error);
      setCategories([]);
      setAllCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  // Fetch wishlist status
  const fetchWishlistStatus = useCallback(async () => {
    try {
      const token = await getObjByKey("loginResponse");
      if (!token) {
        return;
      }
      
      const url = `${BASE_URL}wishlist`;
      const result = await GETNETWORK(url, true);
      
      if (result && !result.message) {
        const wishlistData = result?.wishlist || result?.data || result || [];
        const wishlistedIds = new Set();
        
        if (Array.isArray(wishlistData)) {
          wishlistData.forEach((item) => {
            const id = (item.id || item.job_id || item.jobId)?.toString();
            if (id) {
              wishlistedIds.add(id);
            }
          });
        }
        
        setWishlistedJobs(wishlistedIds);
      }
    } catch (error) {
      // Silently fail - wishlist check is optional
    }
  }, []);

  // Toggle status card expansion
  const handleToggleStatus = useCallback((jobId) => {
    setExpandedStatusCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId.toString())) {
        newSet.delete(jobId.toString());
      } else {
        newSet.add(jobId.toString());
      }
      return newSet;
    });
  }, []);

  // Fetch applied jobs status
  const fetchAppliedJobs = useCallback(async () => {
    try {
      const token = await getObjByKey("loginResponse");
      if (!token) {
        return;
      }
      
      const url = `${BASE_URL}applications/mine`;
      const result = await GETNETWORK(url, true);
      
      if (result && !result.message) {
        const applications = result?.data || result?.applications || result?.list || result || [];
        const appliedJobsMap = new Map();
        
        if (Array.isArray(applications)) {
          const detailedApplications = await Promise.all(
            applications.map(async (application) => {
              const applicationId = application.id || application._id || application.applicationId;
              if (!applicationId) return application;
              try {
                const detailUrl = `${BASE_URL}applications/${applicationId}`;
                const detailResult = await GETNETWORK(detailUrl, true);
                const decision =
                  detailResult?.decision ||
                  detailResult?.data?.decision ||
                  detailResult?.application?.decision ||
                  detailResult?.data?.application?.decision ||
                  application?.decision;
                return { ...application, decision };
              } catch (_) {
                return application;
              }
            })
          );

          detailedApplications.forEach((application) => {
            const jobId = (application.jobId || application.job_id || application.job?.id || application.job?._id)?.toString();
            if (jobId) {
              appliedJobsMap.set(jobId, {
                status: application.status || 'pending',
                appliedAt: application.appliedAt || application.appliedDate || application.createdAt,
                resumeViewed: application.resumeViewed || false,
                resumeViewedAt: application.resumeViewedAt,
                recruiterContacted: application.recruiterContacted || false,
                recruiterContactedAt: application.recruiterContactedAt,
                statusUpdatedAt: application.statusUpdatedAt || application.updatedAt,
                decision: normalizeDecision(application.decision),
                ...application
              });
            }
          });
        }
        
        setAppliedJobs(appliedJobsMap);
      }
    } catch (error) {
      // Silently fail - applied jobs check is optional
    }
  }, []);

  // Fetch user profile to get technologies
  const fetchUserProfile = useCallback(async () => {
    try {
      const token = await getObjByKey("loginResponse");
      if (!token) {
        return;
      }
      
      const url = `${BASE_URL}profile`;
      const result = await GETNETWORK(url, true);
      
      if (result && !result.message) {
        const profileData = result?.profile || result?.data || result?.user || result || {};
        setUserProfile(profileData);
      }
    } catch (error) {
      // Silently fail
    }
  }, []);

  // Calculate profile completion percentage
  const calculateCompletionPercentage = useCallback((profileData) => {
    if (!profileData) return 0;

    let percentage = 0;

    // Helper function to check if field is truly filled
    const isFieldFilled = (field) => {
      if (!field) return false;
      const strValue = String(field).trim();
      return strValue !== '' && strValue !== 'N/A';
    };

    // Personal Details Section: 20% (if name, email, phone, address, gender, dob are filled)
    const personalDetailsFields = [
      profileData.name || profileData.firstName || profileData.first_name,
      profileData.email,
      profileData.phone || profileData.phoneNumber || profileData.phone_number,
      profileData.address,
      profileData.gender,
      profileData.dob || profileData.dateOfBirth || profileData.date_of_birth
    ];
    const personalDetailsFilled = personalDetailsFields.filter(isFieldFilled).length;
    if (personalDetailsFilled === personalDetailsFields.length) {
      percentage += 20;
    }

    // Profile Picture: 10% (if profilePicture is set)
    const profilePicture = profileData.profilePicture || profileData.profile_picture || profileData.avatar;
    if (profilePicture) {
      const hasPicture = profilePicture.uri ? true : (typeof profilePicture === 'string' && profilePicture.trim() !== '');
      if (hasPicture) {
        percentage += 10;
      }
    }

    // Career Preference Section: 10% (if preferredLocation, currentSalary, expectedSalary, noticePeriod, bio are filled)
    const careerFields = [
      profileData.preferredLocation || profileData.preferred_location,
      profileData.currentSalary || profileData.current_salary,
      profileData.expectedSalary || profileData.expected_salary,
      profileData.noticePeriod || profileData.notice_period,
      profileData.bio
    ];
    const careerFieldsFilled = careerFields.filter(isFieldFilled).length;
    if (careerFieldsFilled === careerFields.length) {
      percentage += 10;
    }

    // Profile Summary Section: 5% (if slogan is filled)
    if (isFieldFilled(profileData.slogan)) {
      percentage += 5;
    }

    // Resume Added: 10% (if resume is added and not empty)
    const resume = profileData.resume || profileData.resumeUrl || profileData.resume_url;
    if (resume && String(resume).trim() !== '') {
      percentage += 10;
    }

    // Employment History: 10% (if experienceItems has at least one filled entry)
    const experienceItems = profileData.experienceItems || profileData.experience || profileData.experiences || [];
    const filledExperience = Array.isArray(experienceItems)
      ? experienceItems.filter((exp) => exp && (exp.companyName || exp.company_name) && String(exp.companyName || exp.company_name).trim() !== '').length
      : 0;
    if (filledExperience > 0) {
      percentage += 10;
    }

    // Certification: 2% (if certificationItems has at least one filled entry)
    const certificationItems = profileData.certificationItems || profileData.certifications || profileData.certification || [];
    const filledCertifications = Array.isArray(certificationItems)
      ? certificationItems.filter((cert) => cert && (cert.name) && String(cert.name).trim() !== '').length
      : 0;
    if (filledCertifications > 0) {
      percentage += 2;
    }

    // Education: 20% (if educationItems has at least one filled entry)
    const educationItems = profileData.educationItems || profileData.education || profileData.educations || [];
    const filledEducation = Array.isArray(educationItems)
      ? educationItems.filter((edu) => edu && (edu.degree) && String(edu.degree).trim() !== '').length
      : 0;
    if (filledEducation > 0) {
      percentage += 20;
    }

    // Skills: 20% (if keySkills array has at least one skill)
    const keySkills = profileData.keySkills || profileData.key_skills || profileData.skills || profileData.skill || [];
    if (Array.isArray(keySkills) && keySkills.length > 0) {
      percentage += 20;
    }

    // Language: 13% (if languages array has at least one language)
    const languages = profileData.languages || profileData.language || [];
    if (Array.isArray(languages) && languages.length > 0) {
      percentage += 13;
    }

    return Math.min(Math.round(percentage), 100);
  }, []);

  // Check profile completion and show alert if not complete
  const checkProfileCompletion = useCallback(async () => {
    try {
      const token = await getObjByKey("loginResponse");
      if (!token) {
        return;
      }

      const url = `${BASE_URL}profile`;
      const result = await GETNETWORK(url, true);

      if (result && !result.message) {
        const profileData = result?.profile || result?.data || result?.user || result || {};
        const completionPercentage = calculateCompletionPercentage(profileData);
        setProfileCompletionPercentage(completionPercentage);

        // Show alert only if profile is not 100% complete and not already checked
        if (completionPercentage < 100 && !profileCompletionCheckDone) {
          setProfileCompletionAlertVisible(true);
          setProfileCompletionCheckDone(true);
        }
      }
    } catch (error) {
      // Silently fail
    }
  }, [calculateCompletionPercentage, profileCompletionCheckDone]);

  // Fetch jobs based on applied jobs (same jobTitle from other companies)
  const fetchJobsBasedOnApplied = useCallback(async () => {
    try {
      setLoadingJobsBasedOnApplied(true);
      const token = await getObjByKey("loginResponse");
      if (!token) {
        setJobsBasedOnApplied([]);
        return;
      }

      // First get applied jobs
      const url = `${BASE_URL}applications/mine`;
      const result = await GETNETWORK(url, true);
      
      if (result && !result.message) {
        const applications = result?.data || result?.applications || result?.list || result || [];
        const appliedJobTitles = new Set();
        
        if (Array.isArray(applications)) {
          applications.forEach((application) => {
            const job = application.job || application;
            const jobTitle = job.jobTitle || job.title;
            if (jobTitle) {
              appliedJobTitles.add(jobTitle.toLowerCase().trim());
            }
          });
        }

        // If no applied jobs, return empty
        if (appliedJobTitles.size === 0) {
          setJobsBasedOnApplied([]);
          return;
        }

        // Fetch all jobs and filter by jobTitle
        const jobsUrl = `${BASE_URL}jobs`;
        const jobsResult = await GETNETWORK(jobsUrl, false);
        
        if (jobsResult && !jobsResult.message) {
          const allJobs = jobsResult?.data || jobsResult?.jobs || jobsResult?.list || jobsResult || [];
          const jobsArray = Array.isArray(allJobs) ? allJobs : [];
          
          // Filter jobs with same jobTitle but exclude already applied jobs
          const appliedJobIds = new Set();
          applications.forEach((application) => {
            const jobId = (application.jobId || application.job_id || application.job?.id || application.job?._id)?.toString();
            if (jobId) appliedJobIds.add(jobId);
          });

          const filteredJobs = jobsArray.filter((job) => {
            const jobId = (job.id || job._id)?.toString();
            const jobTitle = (job.jobTitle || job.title || '').toLowerCase().trim();
            
            // Exclude already applied jobs
            if (appliedJobIds.has(jobId)) return false;
            
            // Check if jobTitle matches any applied job title
            return Array.from(appliedJobTitles).some(appliedTitle => jobTitle.includes(appliedTitle) || appliedTitle.includes(jobTitle));
          });

          setJobsBasedOnApplied(filteredJobs);
        } else {
          setJobsBasedOnApplied([]);
        }
      } else {
        setJobsBasedOnApplied([]);
      }
    } catch (error) {
      setJobsBasedOnApplied([]);
    } finally {
      setLoadingJobsBasedOnApplied(false);
    }
  }, []);

  // Fetch jobs based on user profile technologies
  const fetchJobsBasedOnProfile = useCallback(async () => {
    try {
      setLoadingJobsBasedOnProfile(true);
      const token = await getObjByKey("loginResponse");
      if (!token) {
        setJobsBasedOnProfile([]);
        return;
      }

      // Get user profile first
      const profileUrl = `${BASE_URL}profile`;
      const profileResult = await GETNETWORK(profileUrl, true);
      
      if (profileResult && !profileResult.message) {
        const profileData = profileResult?.profile || profileResult?.data || profileResult?.user || profileResult || {};
        const technologies = profileData.technologies || profileData.technology || profileData.skills || profileData.skill || [];
        
        // If no technologies, return empty
        if (!technologies || (Array.isArray(technologies) && technologies.length === 0)) {
          setJobsBasedOnProfile([]);
          return;
        }

        // Convert technologies to array and lowercase for matching
        const techArray = Array.isArray(technologies) ? technologies : [technologies];
        const techKeywords = techArray.map(tech => (tech || '').toLowerCase().trim()).filter(tech => tech);

        if (techKeywords.length === 0) {
          setJobsBasedOnProfile([]);
          return;
        }

        // Fetch all jobs and filter by technologies
        const jobsUrl = `${BASE_URL}jobs`;
        const jobsResult = await GETNETWORK(jobsUrl, false);
        
        if (jobsResult && !jobsResult.message) {
          const allJobs = jobsResult?.data || jobsResult?.jobs || jobsResult?.list || jobsResult || [];
          const jobsArray = Array.isArray(allJobs) ? allJobs : [];
          
          // Get applied job IDs to exclude them
          const appliedJobIds = new Set();
          try {
            const applicationsUrl = `${BASE_URL}applications/mine`;
            const applicationsResult = await GETNETWORK(applicationsUrl, true);
            if (applicationsResult && !applicationsResult.message) {
              const applications = applicationsResult?.data || applicationsResult?.applications || applicationsResult?.list || applicationsResult || [];
              if (Array.isArray(applications)) {
                applications.forEach((application) => {
                  const jobId = (application.jobId || application.job_id || application.job?.id || application.job?._id)?.toString();
                  if (jobId) appliedJobIds.add(jobId);
                });
              }
            }
          } catch (error) {
            // Silently fail
          }

          // Filter jobs that match technologies
          const filteredJobs = jobsArray.filter((job) => {
            const jobId = (job.id || job._id)?.toString();
            
            // Exclude already applied jobs
            if (appliedJobIds.has(jobId)) return false;
            
            // Check if job skills/technologies match user technologies
            const jobSkills = job.skills || job.technology || job.technologies || job.requiredSkills || [];
            const jobSkillsArray = Array.isArray(jobSkills) ? jobSkills : [jobSkills];
            const jobSkillsLower = jobSkillsArray.map(skill => (skill || '').toLowerCase().trim()).filter(skill => skill);
            
            // Also check jobTitle and description for technology keywords
            const jobTitle = (job.jobTitle || job.title || '').toLowerCase();
            const jobDescription = (job.description || job.jobDescription || '').toLowerCase();
            
            // Match if any technology keyword appears in job skills, title, or description
            return techKeywords.some(tech => 
              jobSkillsLower.some(skill => skill.includes(tech) || tech.includes(skill)) ||
              jobTitle.includes(tech) ||
              jobDescription.includes(tech)
            );
          });

          setJobsBasedOnProfile(filteredJobs);
        } else {
          setJobsBasedOnProfile([]);
        }
      } else {
        setJobsBasedOnProfile([]);
      }
    } catch (error) {
      setJobsBasedOnProfile([]);
    } finally {
      setLoadingJobsBasedOnProfile(false);
    }
  }, []);

  // Fetch top companies from companies API and count jobs per company
  const fetchTopCompanies = useCallback(async () => {
    try {
      setLoadingTopCompanies(true);
      const companiesUrl = `${BASE_URL}companies`;
      const companiesResult = await GETNETWORK(companiesUrl, false);

      const companyItems = Array.isArray(companiesResult)
        ? companiesResult
        : companiesResult?.data || companiesResult?.companies || companiesResult?.list || [];

      const jobsUrl = `${BASE_URL}jobs`;
      const jobsResult = await GETNETWORK(jobsUrl, false);
      const allJobs = Array.isArray(jobsResult)
        ? jobsResult
        : jobsResult?.data || jobsResult?.jobs || jobsResult?.list || [];

      const jobsArray = Array.isArray(allJobs) ? allJobs : [];
      const jobCountMap = new Map();
      const aliasMap = {
        'yubi spicies': 'yubi foods',
        'yubi spices': 'yubi foods',
        'yubi food': 'yubi foods',
        'yubi foods': 'yubi foods',
      };
      const normalizeCompanyKey = (name) => {
        const key = name.toString().trim().toLowerCase();
        return aliasMap[key] || key;
      };
      const canonicalDisplayName = (name) => {
        const key = normalizeCompanyKey(name);
        if (key === 'yubi foods') return 'Yubi Foods';
        return name;
      };

      jobsArray.forEach((job) => {
        const companyName = (job.companyName || job.company || '').toString().trim();
        if (!companyName) return;
        const key = normalizeCompanyKey(companyName);
        jobCountMap.set(key, (jobCountMap.get(key) || 0) + 1);
      });

      if (companyItems && Array.isArray(companyItems) && companyItems.length > 0) {
        const companiesArray = companyItems.map((company) => {
          const rawCompanyName =
            company.companyName || company.name || company.company_name || company.company || 'Unknown';
          const companyName = canonicalDisplayName(rawCompanyName);
          const logoSource = company.logo || company.companyLogoUrl || company.company_logo || company.logoUrl || null;
          const logoUrl = logoSource
            ? (logoSource.startsWith('http://') || logoSource.startsWith('https://')
                ? logoSource
                : `${BASE_URL.replace('/api/', '/')}${logoSource.replace(/^\//, '')}`)
            : null;
          const location = formatLocation(company.state, company.city) || company.location || company.address || '';
          const companyKey = normalizeCompanyKey(rawCompanyName);
          const jobCount = jobCountMap.get(companyKey) || 0;
          return {
            id: company.id || company._id || companyName,
            companyName,
            logo: logoUrl,
            location,
            jobCount,
            isVerified: toBoolean(company.isVerified),
            rawCompany: company,
          };
        });

        const sortedCompanies = companiesArray.sort((a, b) => b.jobCount - a.jobCount);
        setTopCompanies(sortedCompanies);
      } else {
        setTopCompanies([]);
      }
    } catch (error) {
      setTopCompanies([]);
    } finally {
      setLoadingTopCompanies(false);
    }
  }, []);

  // Check login status
  const checkLoginStatus = useCallback(async () => {
    try {
      const token = await getObjByKey("loginResponse");
      setIsLoggedIn(!!token);
    } catch (error) {
      setIsLoggedIn(false);
    }
  }, []);

  // Fetch jobs when screen is focused
  useFocusEffect(
    useCallback(() => {
      checkLoginStatus();
      fetchRecommendedJobs();
      fetchLatestJobs();
      fetchSponsorships();
      fetchCategories();
      fetchWishlistStatus();
      fetchAppliedJobs();
      fetchUserProfile();
      fetchJobsBasedOnApplied();
      fetchJobsBasedOnProfile();
      fetchTopCompanies();
      checkProfileCompletion();
    }, [checkLoginStatus, fetchRecommendedJobs, fetchLatestJobs, fetchSponsorships, fetchCategories, fetchWishlistStatus, fetchAppliedJobs, fetchUserProfile, fetchJobsBasedOnApplied, fetchJobsBasedOnProfile, fetchTopCompanies, checkProfileCompletion])
  );

  // Check login status on mount
  useEffect(() => {
    checkLoginStatus();
  }, [checkLoginStatus]);

  useEffect(() => {
    if (!topCompanies.length || !companyScrollRef.current) return;

    const interval = setInterval(() => {
      if (!topCompanies.length || !companyScrollRef.current) return;
      const nextIndex = (companyScrollIndexRef.current + 1) % topCompanies.length;
      companyScrollIndexRef.current = nextIndex;
      companyScrollRef.current.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [topCompanies]);

  // Extract full job titles from jobTitle
  const extractKeywords = useMemo(() => {
    const allJobTitles = [
      ...(recommendedJobs || []).map(job => job.jobTitle || job.title || ''),
      ...(latestJobs || []).map(job => job.jobTitle || job.title || '')
    ].filter(title => title && title.trim());
    
    // Get unique full job titles
    const uniqueTitles = Array.from(new Set(allJobTitles));
    
    return uniqueTitles.slice(0, 15); // Limit to 15 job titles
  }, [recommendedJobs, latestJobs]);

  // Handle quick filter press
  const handleQuickFilterPress = (filter) => {
    // Navigate to CompanyDetailsJobScreen with the keyword (jobTitle)
    navigation.navigate('CompanyDetailsJob', { keyword: filter.label || filter.id });
  };

  // Handle Resume Premium Learn More
  const handleResumePremiumLearnMore = async () => {
    const token = await getObjByKey("loginResponse");
    if (!token) {
      setLoginPromptVisible(true);
    } else {
      // Navigate to premium services or show premium features
      // navigation.navigate('PremiumServices');
    }
  };

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchRecommendedJobs(),
      fetchLatestJobs(),
      fetchSponsorships(),
      fetchCategories(),
      fetchUserProfile(),
      fetchJobsBasedOnApplied(),
      fetchJobsBasedOnProfile(),
      fetchTopCompanies(),
      fetchAppliedJobs(),
      fetchWishlistStatus(),
    ]);
    setRefreshing(false);
  }, [fetchRecommendedJobs, fetchLatestJobs, fetchSponsorships, fetchCategories, fetchUserProfile, fetchJobsBasedOnApplied, fetchJobsBasedOnProfile, fetchTopCompanies, fetchAppliedJobs, fetchWishlistStatus]);

  // Navigate to job details
  const handleJobPress = (item) => {
    const jobId = item.id || item._id;
    const jobData = item;
    // console.log('🔵 HomeScreen: Navigating to JobDetails with:');
    // console.log('📋 HomeScreen: Job ID:', jobId);
    // console.log('📋 HomeScreen: Full Job Data:', JSON.stringify(jobData, null, 2));
    // console.log('📋 HomeScreen: Job Title:', jobData?.jobTitle || jobData?.title);
    // console.log('📋 HomeScreen: Company:', jobData?.companyName || jobData?.company);
    // console.log('📋 HomeScreen: Salary:', jobData?.salaryRange || jobData?.salary);
    // console.log('📋 HomeScreen: Logo:', jobData?.companyLogoUrl || jobData?.logo);
    
    navigation.navigate('SeekerJobDetails', {
      jobId: jobId,
      jobData: jobData,
    });
  };

  const requireAuth = async (action) => {
    const token = await getObjByKey("loginResponse");
    if (!token) {
      setLoginPromptVisible(true);
      return false;
    }
    // Token exists; plug real apply/save logic here
    return true;
  };

  const handleApply = async (item) => {
    const token = await getObjByKey("loginResponse");
    if (!token) {
      setLoginPromptVisible(true);
      return;
    }
    
    // Set selected job and show apply form
    setSelectedJob(item);
    
    // Fetch user data and pre-fill form from profile API (always fetch fresh data)
    try {
      const loginResponse = await getObjByKey("loginResponse");
      
      // console.log("🔍 ApplyForm: Full loginResponse:", JSON.stringify(loginResponse, null, 2));
      
      if (!loginResponse) {
        // console.log("❌ ApplyForm: No loginResponse found");
        setApplyName("");
        setApplyEmail("");
        setApplyPhone("");
        setApplyFile(null);
        setApplyCoverLetter("");
        setApplyFormVisible(true);
        return;
      }
      
      // Initialize variables
      let firstName = "";
      let lastName = "";
      let phone = "";
      let email = "";
      
      // Always fetch fresh profile data from API
      try {
        const profileUrl = `${BASE_URL}profile`;
        // console.log("📡 ApplyForm: Fetching profile from:", profileUrl);
        const profileResult = await GETNETWORK(profileUrl, true);
        // console.log("📥 ApplyForm: Profile response:", JSON.stringify(profileResult, null, 2));
        
        // Extract profile data from various possible response structures
        const profileData = profileResult?.profile || profileResult?.data || profileResult?.user || profileResult || {};
        // console.log("📋 ApplyForm: Extracted profile data:", JSON.stringify(profileData, null, 2));
          
        // Get firstName and lastName from profile (check all possible field names)
        firstName = profileData.firstName || profileData.first_name || profileData.firstName || "";
        lastName = profileData.lastName || profileData.last_name || profileData.lastName || "";
        
        // Get phone from profile (check all possible field names)
        phone = profileData.phone || profileData.phoneNumber || profileData.phone_number || profileData.mobile || profileData.mobileNumber || "";
        
        // Get email from profile (check all possible field names)
        email = profileData.email || profileData.emailAddress || "";
          
        // console.log("✅ ApplyForm: From profile API - firstName:", firstName, "lastName:", lastName, "phone:", phone, "email:", email);
        
        // If still no firstName/lastName, try to get from fullName in profile
        if (!firstName && !lastName) {
          const fullName = profileData.fullName || profileData.full_name || profileData.name || "";
          if (fullName) {
            const nameParts = fullName.trim().split(" ");
            if (nameParts.length >= 2) {
              firstName = nameParts[0];
              lastName = nameParts.slice(1).join(" ");
            } else if (nameParts.length === 1) {
              firstName = nameParts[0];
              lastName = "";
            }
            // console.log("✅ ApplyForm: Split fullName - firstName:", firstName, "lastName:", lastName);
          }
        }
        
        // Fallback to loginResponse if profile API didn't return data
        if (!firstName && !lastName && !phone && !email) {
          // console.log("⚠️ ApplyForm: Profile API returned empty, trying loginResponse");
          const userData = loginResponse?.user || loginResponse?.data || loginResponse || {};
          firstName = firstName || userData.firstName || userData.first_name || "";
          lastName = lastName || userData.lastName || userData.last_name || "";
          phone = phone || userData.phone || userData.phoneNumber || userData.phone_number || "";
          email = email || userData.email || "";
          
          // Try to split fullName from loginResponse
          if (!firstName && !lastName) {
            const fullName = userData.fullName || userData.full_name || userData.name || "";
            if (fullName) {
              const nameParts = fullName.trim().split(" ");
              if (nameParts.length >= 2) {
                firstName = nameParts[0];
                lastName = nameParts.slice(1).join(" ");
              } else if (nameParts.length === 1) {
                firstName = nameParts[0];
                lastName = "";
              }
            }
          }
        }
      } catch (profileError) {
        // console.error("❌ ApplyForm: Error fetching profile:", profileError);
        // If profile fetch fails, try to get from loginResponse
        const userData = loginResponse?.user || loginResponse?.data || loginResponse || {};
        firstName = userData.firstName || userData.first_name || "";
        lastName = userData.lastName || userData.last_name || "";
        phone = userData.phone || userData.phoneNumber || userData.phone_number || "";
        email = userData.email || "";
      
        // Try to split fullName
      if (!firstName && !lastName) {
          const fullName = userData.fullName || userData.full_name || userData.name || "";
        if (fullName) {
          const nameParts = fullName.trim().split(" ");
          if (nameParts.length >= 2) {
            firstName = nameParts[0];
            lastName = nameParts.slice(1).join(" ");
          } else if (nameParts.length === 1) {
            firstName = nameParts[0];
            lastName = "";
            }
          }
        }
      }
      
      // console.log("✅ ApplyForm: Final extracted - firstName:", firstName, "lastName:", lastName, "email:", email, "phone:", phone);
      
      // Capitalize first letter of each word
      const capitalizeWords = (str) => {
        if (!str) return "";
        return str
          .split(" ")
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(" ");
      };
      
      const firstNameCapitalized = capitalizeWords(firstName);
      const lastNameCapitalized = capitalizeWords(lastName);
      
      // Combine firstName + lastName for Full Name
      const fullName = `${firstNameCapitalized} ${lastNameCapitalized}`.trim();
      
      // console.log("✅ ApplyForm: Setting form - Full Name:", fullName, "Email:", email, "Phone:", phone);
      
      // Pre-fill form fields
      setApplyName(fullName);
      setApplyEmail(email);
      setApplyPhone(phone);
      setApplyFile(null);
      setApplyCoverLetter("");
    } catch (error) {
      console.error("❌ ApplyForm: Error fetching user data:", error);
      // If error, just show empty form
      setApplyName("");
      setApplyEmail("");
      setApplyPhone("");
      setApplyFile(null);
      setApplyCoverLetter("");
    }
    
    setApplyFormVisible(true);
  };

  const handleSave = async (item) => {
    const token = await getObjByKey("loginResponse");
    if (!token) {
      setLoginPromptVisible(true);
      return;
    }

    const jobId = item.id || item._id;
    if (!jobId) {
      // console.log('❌ HomeScreen: No job ID found for wishlist operation');
      return;
    }

    const isWishlisted = wishlistedJobs.has(jobId.toString());
    
    try {
      if (isWishlisted) {
        // Remove from wishlist - DELETE
        const url = `${BASE_URL}wishlist/${jobId}`;
        // console.log('🗑️ HomeScreen: Deleting from wishlist:', url);
        // console.log('🗑️ HomeScreen: Job ID:', jobId);
        
        const result = await DELETENETWORK(url, true);
        // console.log('🗑️ HomeScreen: DELETE wishlist response:', JSON.stringify(result, null, 2));
        
        // Check for success - either no message, or message contains "success" or "deleted"
        const isSuccess = result && (
          !result.message || 
          (result.message && (result.message.toLowerCase().includes('success') || result.message.toLowerCase().includes('deleted'))) ||
          result.success === true ||
          result.statusCode === 200 ||
          result.statusCode === 201
        );
        
        if (isSuccess) {
          setWishlistedJobs(prev => {
            const newSet = new Set(prev);
            newSet.delete(jobId.toString());
            return newSet;
          });
          // console.log('✅ HomeScreen: Successfully removed from wishlist');
        } else {
          // console.log('⚠️ HomeScreen: Failed to remove from wishlist:', result?.message);
        }
      } else {
        // Add to wishlist - POST
        const url = `${BASE_URL}wishlist/${jobId}`;
        // console.log('❤️ HomeScreen: Adding to wishlist:', url);
        // console.log('❤️ HomeScreen: Job ID:', jobId);
        
        const result = await POSTNETWORK(url, {}, true);
        // console.log('❤️ HomeScreen: POST wishlist response:', JSON.stringify(result, null, 2));
        
        // Check for success - either no message, or message contains "success"
        const isSuccess = result && (
          !result.message || 
          (result.message && result.message.toLowerCase().includes('success')) ||
          result.success === true ||
          result.statusCode === 200 ||
          result.statusCode === 201
        );
        
        if (isSuccess) {
          setWishlistedJobs(prev => new Set(prev).add(jobId.toString()));
          // console.log('✅ HomeScreen: Successfully added to wishlist');
        } else {
          // console.log('⚠️ HomeScreen: Failed to add to wishlist:', result?.message);
        }
      }
    } catch (error) {
      // console.error('❌ HomeScreen: Error in wishlist operation:', error);
    }
  };

  const handleCloseApplyForm = () => {
    // console.log("🔒 ApplyForm: Closing form and resetting all fields");
    setApplyFormVisible(false);
    setSelectedJob(null);
    setApplyName("");
    setApplyEmail("");
    setApplyPhone("");
    setApplyFile(null);
    setApplyCoverLetter("");
    setApplyLoading(false);
  };

  // Request storage permission for Android
  const requestStoragePermission = async () => {
    if (Platform.OS === "android") {
      // Use document picker directly instead of requesting READ_MEDIA_IMAGES.
      return true;
    }
    return true;
  };

  // Handle file picker
  const handlePickFile = async () => {
    try {
      if (Platform.OS === "android") {
        const hasPermission = await requestStoragePermission();
        if (!hasPermission) {
          Alert.alert(
            "Permission Denied",
            "Please grant storage permission to select documents.",
            [{ text: "OK" }]
          );
          return;
        }
      }

      try {
        const [result] = await pick({
          type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        });

        if (result) {
          setApplyFile({
            name: result.name || result.uri.split('/').pop() || 'document.pdf',
            uri: result.uri,
            type: result.type || 'application/pdf',
            size: result.size || 0,
          });
        }
      } catch (pickerErr) {
        if (isCancel(pickerErr)) {
          // User cancelled
        } else {
          Alert.alert(
            "Select Document",
            "Please navigate to your device's file manager and select a PDF, DOC, or DOCX file.",
            [{ text: "OK" }]
          );
        }
      }
    } catch (err) {
      Alert.alert(
        "File Selection",
        "Unable to open file picker. Please ensure you have granted storage permissions.",
        [{ text: "OK" }]
      );
    }
  };

  // Validate form
  const validateApplyForm = () => {
    if (!applyName.trim()) {
      Alert.alert("Validation Error", "Please enter your full name");
      return false;
    }
    if (!applyEmail.trim()) {
      Alert.alert("Validation Error", "Please enter your email address");
      return false;
    }
    if (!applyPhone.trim()) {
      Alert.alert("Validation Error", "Please enter your phone number");
      return false;
    }
    if (!applyFile) {
      Alert.alert("Validation Error", "Please upload your resume");
      return false;
    }
    return true;
  };

  // Submit application
  const handleSubmitApplication = async () => {
    // console.log("🚀 ApplyForm: Starting application submission...");
    
    if (!validateApplyForm()) {
      // console.log("❌ ApplyForm: Form validation failed");
      return;
    }

    if (!selectedJob) {
      // console.log("❌ ApplyForm: No selected job");
      Alert.alert("Error", "Job information is missing");
      return;
    }

    const jobId = selectedJob.id || selectedJob._id;
    if (!jobId) {
      // console.log("❌ ApplyForm: No job ID found");
      Alert.alert("Error", "Job ID is missing");
      return;
    }

    // console.log("📋 ApplyForm: Job ID:", jobId);
    // console.log("📋 ApplyForm: Form data - Name:", applyName, "Email:", applyEmail, "Phone:", applyPhone);
    // console.log("📋 ApplyForm: Has file:", !!applyFile, "File name:", applyFile?.name);
    // console.log("📋 ApplyForm: Cover letter length:", applyCoverLetter.length);

    try {
      setApplyLoading(true);
      // console.log("⏳ ApplyForm: Loading state set to true");

      // Get token from storage
      const loginResponse = await getObjByKey('loginResponse');
      // console.log("🔑 ApplyForm: LoginResponse retrieved:", !!loginResponse);
      
      if (!loginResponse) {
        // console.log("❌ ApplyForm: No loginResponse found");
        setApplyToastMessage({
          type: "error",
          msg: "Please login to apply for jobs",
          visible: true,
        });
        setApplyLoading(false);
        return;
      }

      // Extract token
      let token = null;
      if (loginResponse.data) {
        if (typeof loginResponse.data === 'string') {
          token = loginResponse.data;
          // console.log("🔑 ApplyForm: Token from loginResponse.data (string)");
        } else if (typeof loginResponse.data === 'object' && loginResponse.data !== null) {
          token = loginResponse.data.token || loginResponse.data.data;
          // console.log("🔑 ApplyForm: Token from loginResponse.data (object)");
        }
      }
      if (!token || (typeof token === 'string' && token.trim() === '')) {
        if (loginResponse.token && typeof loginResponse.token === 'string') {
          token = loginResponse.token;
          // console.log("🔑 ApplyForm: Token from loginResponse.token");
        }
      }

      if (!token || typeof token !== 'string' || token.trim() === '') {
        // console.log("❌ ApplyForm: No valid token found");
        setApplyToastMessage({
          type: "error",
          msg: "Authentication token not found. Please login again.",
          visible: true,
        });
        setApplyLoading(false);
        return;
      }

      // console.log("✅ ApplyForm: Token extracted, length:", token.length);
      // console.log("✅ ApplyForm: Token preview:", token.substring(0, 20) + "...");

      // Create FormData
      const formData = new FormData();
      formData.append('name', applyName.trim());
      formData.append('email', applyEmail.trim());
      formData.append('phone', applyPhone.trim());
      formData.append('pastedCv', applyCoverLetter.trim() || '');

      if (applyFile && applyFile.uri) {
        // Ensure URI is in correct format for Android
        let fileUri = applyFile.uri;
        
        // On Android, if it's a content:// URI, we might need to handle it differently
        // But DocumentPicker with copyTo: 'cachesDirectory' should give us file:// URI
        if (Platform.OS === 'android' && fileUri.startsWith('content://')) {
          // console.log("⚠️ ApplyForm: Content URI detected, this might cause issues");
        }
        
        // Prepare file object for FormData
        const fileObject = {
          uri: fileUri,
          type: applyFile.type || 'application/pdf',
          name: applyFile.name || `resume_${Date.now()}.pdf`,
        };
        
        // For Android, ensure the URI is properly formatted
        if (Platform.OS === 'android') {
          // Remove file:// prefix if present (XMLHttpRequest handles it)
          if (fileUri.startsWith('file://')) {
            fileObject.uri = fileUri;
          }
        }
        
        formData.append('resume', fileObject);
        // console.log("📎 ApplyForm: Resume file added to FormData");
        // console.log("📎 ApplyForm: File name:", fileObject.name);
        // console.log("📎 ApplyForm: File type:", fileObject.type);
        // console.log("📎 ApplyForm: File URI:", fileObject.uri);
      }

      // console.log("📦 ApplyForm: FormData created with fields:");
      // console.log("   - name:", applyName.trim());
      // console.log("   - email:", applyEmail.trim());
      // console.log("   - phone:", applyPhone.trim());
      // console.log("   - pastedCv length:", applyCoverLetter.trim().length);
      // console.log("   - resume:", applyFile ? applyFile.name : "No file");

      // Submit using react-native-blob-util (most reliable for file uploads on Android)
      const url = `${BASE_URL}jobs/${jobId}/apply`;
      // console.log("📡 ApplyForm: Submitting to URL:", url);
      // console.log("📡 ApplyForm: Request method: POST");
      // console.log("📡 ApplyForm: Headers - Authorization: Bearer", token.substring(0, 20) + "...");
      
      // Log file URI for debugging
      if (applyFile && applyFile.uri) {
        // console.log("📎 ApplyForm: File URI:", applyFile.uri);
        // console.log("📎 ApplyForm: File name:", applyFile.name);
        // console.log("📎 ApplyForm: File type:", applyFile.type);
      }
      
      // Prepare form data for react-native-blob-util
      const formDataArray = [];
      
      // Add text fields
      formDataArray.push({ name: 'name', data: applyName.trim() });
      formDataArray.push({ name: 'email', data: applyEmail.trim() });
      formDataArray.push({ name: 'phone', data: applyPhone.trim() });
      formDataArray.push({ name: 'pastedCv', data: applyCoverLetter.trim() || '' });
      
      // Add file if exists
      if (applyFile && applyFile.uri) {
        // Handle different URI formats
        let fileUri = applyFile.uri;
        
        // For react-native-blob-util, we can use the URI directly
        // Remove file:// prefix for file:// URIs
        if (fileUri.startsWith('file://')) {
          fileUri = fileUri.replace('file://', '');
        }
        
        // For content:// URIs, use as-is
        // For file paths, wrap with ReactNativeBlobUtil.wrap()
        const fileData = {
          name: 'resume',
          filename: applyFile.name || `resume_${Date.now()}.pdf`,
          type: applyFile.type || 'application/pdf',
          data: fileUri.startsWith('content://') 
            ? fileUri 
            : ReactNativeBlobUtil.wrap(fileUri),
        };
        
        formDataArray.push(fileData);
        console.log("📎 ApplyForm: File added to form data array");
        console.log("📎 ApplyForm: File data object:", JSON.stringify({
          name: fileData.name,
          filename: fileData.filename,
          type: fileData.type,
          dataType: typeof fileData.data,
        }, null, 2));
      }
      
      // console.log("📦 ApplyForm: Form data array prepared with", formDataArray.length, "fields");
      
      // Use react-native-blob-util for upload
      const result = await ReactNativeBlobUtil.fetch(
        'POST',
        url,
        {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        formDataArray
      );
      
      // console.log("📥 ApplyForm: Response status:", result.info().status);
      // console.log("📥 ApplyForm: Response headers:", JSON.stringify(result.info().headers, null, 2));
      
      let parsedResult;
      try {
        const responseText = result.text();
        // console.log("📥 ApplyForm: Response text length:", responseText?.length || 0);
        // console.log("📥 ApplyForm: Response text preview:", responseText?.substring(0, 200) || '');
        
        parsedResult = JSON.parse(responseText);
        // console.log("📥 ApplyForm: Parsed response:", JSON.stringify(parsedResult, null, 2));
      } catch (parseError) {
        console.error("❌ ApplyForm: Error parsing response:", parseError);
        parsedResult = {
          message: result.text() || 'Unknown error',
          statusCode: result.info().status,
        };
      }

      // Check success
      const responseStatus = result.info().status;
      const isSuccess = 
        responseStatus === 200 || 
        responseStatus === 201 ||
        parsedResult?.success === true || 
        parsedResult?.statusCode === 200 || 
        parsedResult?.statusCode === 201 ||
        parsedResult?.status === "success" ||
        parsedResult?.status === "Success" ||
        parsedResult?.id ||
        parsedResult?.application_id ||
        parsedResult?.message?.toLowerCase().includes('success') ||
        (!parsedResult?.error && !parsedResult?.errors);

      // console.log("✅ ApplyForm: Response status:", responseStatus);
      // console.log("✅ ApplyForm: Success check result:", isSuccess);

      if (isSuccess) {
        const successMessage = parsedResult?.message || "Your application has been submitted successfully!";
        // console.log("✅ ApplyForm: Application submitted successfully!");
        // console.log("✅ ApplyForm: Success message:", successMessage);

        setApplyToastMessage({
          type: "success",
          msg: successMessage,
          visible: true,
        });
        
        // Reset form
        setApplyName("");
        setApplyEmail("");
        setApplyPhone("");
        setApplyFile(null);
        setApplyCoverLetter("");
        setApplyLoading(false);
        
        // console.log("🔄 ApplyForm: Form reset, closing in 2 seconds...");
        
        // Refresh applied jobs list
        fetchAppliedJobs();
        
        // Close form after delay
        setTimeout(() => {
          // console.log("🔒 ApplyForm: Closing form modal");
          handleCloseApplyForm();
        }, 2000);
      } else {
        const errorMessage = parsedResult?.errors?.[0]?.msg || parsedResult?.message || parsedResult?.error || "Failed to submit application. Please try again.";
        // console.log("❌ ApplyForm: Application submission failed");
        // console.log("❌ ApplyForm: Response status:", responseStatus);
        // console.log("❌ ApplyForm: Error message:", errorMessage);
        // console.log("❌ ApplyForm: Full error response:", JSON.stringify(parsedResult, null, 2));
        
        setApplyToastMessage({
          type: "error",
          msg: errorMessage,
          visible: true,
        });
        setApplyLoading(false);
      }
    } catch (error) {
      // console.error("❌ ApplyForm: Exception during application submission");
      // console.error("❌ ApplyForm: Error:", error);
      // console.error("❌ ApplyForm: Error message:", error?.message);
      // console.error("❌ ApplyForm: Error stack:", error?.stack);
      
      const errorMessage = error?.message || "An error occurred while submitting your application. Please try again.";
      setApplyToastMessage({
        type: "error",
        msg: errorMessage,
        visible: true,
      });
      setApplyLoading(false);
    }
  };
 
  const openDrawer = () => {
    // Try to open drawer - if user is authenticated, they're in DrawerNavigator
    // Method 1: Try to get drawer parent directly
    try {
      const drawerParent = nav.getParent('Drawer');
      if (drawerParent && typeof drawerParent.openDrawer === 'function') {
        drawerParent.openDrawer();
        return;
      }
    } catch (e) {
      // Continue to next method
    }
   
    // Method 2: Traverse up the parent chain to find drawer
    try {
      let parent = nav.getParent();
      let depth = 0;
      while (parent && depth < 5) {
        if (typeof parent.openDrawer === 'function') {
          parent.openDrawer();
          return;
        }
        parent = parent.getParent();
        depth++;
      }
    } catch (e) {
      // Continue to next method
    }
   
    // Method 3: Try to dispatch the action directly
    try {
      nav.dispatch(DrawerActions.openDrawer());
      return;
    } catch (error) {
      // Drawer not available - check if user is authenticated
      // If not authenticated, show login prompt
      getObjByKey("loginResponse").then((token) => {
        if (!token) {
          setLoginPromptVisible(true);
        } else {
          // User is authenticated but drawer didn't open - log for debugging
          // console.log('User authenticated but drawer not accessible');
        }
      });
    }
  };
 
  const handleProfileIconPress = () => {
    handleProfilePress(navigation, openDrawer);
  };

  const handleCategoryPress = (category) => {
    // Navigate to jobs filtered by category
    // You can implement category-specific job listing screen
    // console.log('Category pressed:', category);
    // navigation.navigate('CategoryJobs', { category: category.category });
  };

  if (searchOpen) {
    return <SearchOverlay onClose={() => setSearchOpen(false)} navigation={navigation} />;
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={WHITE} translucent={false} />
    <View style={styles.container}>
        <View style={styles.headerContainer}>
          <MyHeader
            searchPlaceholder="Search jobs"
            showLogo={false}
            onSearchPress={() => setSearchOpen(true)}
            onProfilePress={handleProfileIconPress}
            onNotificationPress={() => navigation.navigate('SeekerNotifications')}
          />
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[BRANDCOLOR]}
            tintColor={BRANDCOLOR}
          />
        }
      >
        {/* Quick Filter Section - Show always (both logged in and not logged in) */}
        <View style={styles.quickFilterSectionContainer}>
          <QuickFilterSection keywords={extractKeywords} onFilterPress={handleQuickFilterPress} />
        </View>

        {/* Jobs Based on Your Applied Section - Only show if logged in */}
        {isLoggedIn && (
          <JobsBasedOnAppliedSection
            jobs={jobsBasedOnApplied}
            loading={loadingJobsBasedOnApplied}
            onJobPress={handleJobPress}
            onApply={handleApply}
            onSave={handleSave}
            wishlistedJobs={wishlistedJobs}
            appliedJobs={appliedJobs}
            applicationStatuses={appliedJobs}
            onToggleStatus={handleToggleStatus}
            expandedStatusCards={expandedStatusCards}
          />
        )}

        {/* Jobs Based on Your Profile Section - Only show if logged in */}
        {isLoggedIn && (
          <JobsBasedOnProfileSection
            jobs={jobsBasedOnProfile}
            loading={loadingJobsBasedOnProfile}
            onJobPress={handleJobPress}
            onApply={handleApply}
            onSave={handleSave}
            wishlistedJobs={wishlistedJobs}
            appliedJobs={appliedJobs}
            applicationStatuses={appliedJobs}
            onToggleStatus={handleToggleStatus}
            expandedStatusCards={expandedStatusCards}
          />
        )}

        {/* Recommended Jobs Section - Only show jobs not applied */}
        {(() => {
          const appliedJobIds = new Set(Array.from(appliedJobs.keys()));
          const filteredRecommendedJobs = recommendedJobs.filter((job) => {
            const jobId = (job.id || job._id)?.toString();
            return !appliedJobIds.has(jobId);
          });
          
          return (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Recommended Job for you</Text>
          {loadingRecommended ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={BRANDCOLOR} />
              <Text style={styles.loadingText}>Loading jobs...</Text>
            </View>
              ) : filteredRecommendedJobs.length > 0 ? (
            <FlatList
                  data={filteredRecommendedJobs}
              keyExtractor={(item, index) => item.id?.toString() || item._id?.toString() || index.toString()}
                  numColumns={2}
                  columnWrapperStyle={styles.row}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
              renderItem={({ item }) => {
                const jobId = (item.id || item._id)?.toString();
                const isWishlisted = wishlistedJobs.has(jobId);
                const isApplied = appliedJobs.has(jobId);
                const applicationStatus = appliedJobs.get(jobId);
                const isExpanded = expandedStatusCards.has(jobId);
                return (
                      <LatestJobCard 
                    item={item} 
                    onApply={handleApply} 
                    onSave={handleSave} 
                    onPress={handleJobPress}
                    isWishlisted={isWishlisted}
                    isApplied={isApplied}
                    applicationStatus={applicationStatus}
                    onToggleStatus={handleToggleStatus}
                    isExpanded={isExpanded}
                  />
                );
              }}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No recommended jobs available</Text>
            </View>
          )}
        </View>
          );
        })()}

        {/* Latest Jobs Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Latest Job</Text>
          {loadingLatest ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={BRANDCOLOR} />
              <Text style={styles.loadingText}>Loading latest jobs...</Text>
            </View>
          ) : latestJobs.length > 0 ? (
            <FlatList
              data={latestJobs}
              keyExtractor={(item, index) => item.id?.toString() || item._id?.toString() || index.toString()}
              numColumns={2}
              columnWrapperStyle={styles.row}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
              renderItem={({ item }) => {
                const jobId = (item.id || item._id)?.toString();
                const isWishlisted = wishlistedJobs.has(jobId);
                const isApplied = appliedJobs.has(jobId);
                const applicationStatus = appliedJobs.get(jobId);
                const isExpanded = expandedStatusCards.has(jobId);
                return (
                  <LatestJobCard 
                    item={item} 
                    onApply={handleApply} 
                    onSave={handleSave} 
                    onPress={handleJobPress}
                    isWishlisted={isWishlisted}
                    isApplied={isApplied}
                    applicationStatus={applicationStatus}
                    onToggleStatus={handleToggleStatus}
                    isExpanded={isExpanded}
                  />
                );
              }}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No latest jobs available</Text>
            </View>
          )}
      </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.companySectionTitle}>Your Dream Company Is Hiring</Text>
          {loadingTopCompanies ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={BRANDCOLOR} />
              <Text style={styles.loadingText}>Loading companies...</Text>
            </View>
          ) : topCompanies.length > 0 ? (
            <FlatList
              ref={companyScrollRef}
              data={topCompanies}
              keyExtractor={(item, index) => item.id?.toString() || item.companyName || `company-${index}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToAlignment="start"
              decelerationRate="fast"
              snapToInterval={WIDTH * 0.45}
              contentContainerStyle={styles.companyCarouselContent}
              renderItem={({ item }) => <CompanyCard item={item} />}
              getItemLayout={(data, index) => ({
                length: WIDTH * 0.45,
                offset: WIDTH * 0.45 * index,
                index,
              })}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No companies available</Text>
            </View>
          )}
        </View>

        {/* Dream Job Section - Only show when not logged in */}
        {!isLoggedIn && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Find Your Dream Jobs</Text>
            <DreamJobSection jobs={recommendedJobs} latestJobs={latestJobs} />
          </View>
        )}

        {/* Resume Premium Section - Only show when not logged in */}
        {!isLoggedIn && (
          <View style={styles.sectionContainer}>
            <ResumePremiumSection onLearnMore={handleResumePremiumLearnMore} />
          </View>
        )}

        {/* Sponsorships Section - Only show if there's data */}
        {sponsorships.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Sponsorships</Text>
            {loadingSponsorships ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={BRANDCOLOR} />
                <Text style={styles.loadingText}>Loading sponsorships...</Text>
              </View>
            ) : (
              <FlatList
                data={sponsorships}
                keyExtractor={(item, index) => item.id?.toString() || item._id?.toString() || index.toString()}
                numColumns={2}
                columnWrapperStyle={styles.row}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <SponsorshipCard item={item} />
                )}
              />
            )}
          </View>
        )}

        {/* Cities Section - Above All Categories */}
        <CitiesSection navigation={navigation} />

        {/* All Categories Sliding Banner */}
        {allCategories.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>All Categories</Text>
            <AllCategoriesSlider 
              categories={allCategories} 
              onCategoryPress={handleCategoryPress}
            />
          </View>
        )}

        {/* Poster Section - Below All Categories */}
        <PosterSection />
      </ScrollView>

      <MyAlert
        visible={loginPromptVisible}
        title="Login required"
        message="Please login or register to continue."
        textLeft="Login"
        textRight="Register"
        image={LOGO}
        onPressLeft={() => {
          setLoginPromptVisible(false);
          navigation.navigate("Login");
        }}
        onPressRight={() => {
          setLoginPromptVisible(false);
          navigation.navigate("Register");
        }}
        onRequestClose={() => setLoginPromptVisible(false)}
      />

      <MyAlert
        visible={exitAlertVisible}
        title="Exit App"
        message="Are you sure you want to exit the app?"
        textLeft="No"
        textRight="Yes"
        showLeftButton
        showRightButton
        image={LOGO}
        onPressLeft={() => setExitAlertVisible(false)}
        onPressRight={() => BackHandler.exitApp()}
        onRequestClose={() => setExitAlertVisible(false)}
      />

      {/* Profile Completion Alert */}
      <MyAlert
        visible={profileCompletionAlertVisible}
        title="Complete Your Profile"
        message={`Your profile is ${profileCompletionPercentage}% complete. Please update your profile to get better job recommendations.`}
        textLeft="Cancel"
        textRight="Update"
        showLeftButton
        showRightButton
        image={LOGO}
        onPressLeft={() => setProfileCompletionAlertVisible(false)}
        onPressRight={() => {
          setProfileCompletionAlertVisible(false);
          navigation.navigate("EditUserProfile", {
            onProfileUpdate: () => {
              setProfileCompletionCheckDone(false);
              checkProfileCompletion();
            },
          });
        }}
        onRequestClose={() => setProfileCompletionAlertVisible(false)}
      />

      {/* Apply Job Form Modal */}
      <Modal statusBarTranslucent={true} visible={applyFormVisible} animationType="slide" transparent>
        <View style={styles.applyModalOverlay}>
          <View style={styles.applyModalContainer}>
            <MyHeader
              showBack
              title="Apply Job"
              onBackPress={handleCloseApplyForm}
            />

            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
              <ScrollView
                contentContainerStyle={styles.applyFormContainer}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {/* Job Title Heading */}
                {selectedJob && (
                  <View style={styles.applyJobTitleContainer}>
                    <Text style={styles.applyJobTitle}>
                      {selectedJob.jobTitle || selectedJob.title || 'Job Application'}
                    </Text>
    </View>
                )}

                {/* Full Name */}
                <TextInputComponent
                  placeholder="Full Name"
                  inputdata={applyName}
                  setInputdata={setApplyName}
                  borderColor={BRANDCOLOR}
                  width="95%"
                  image={USER}
                />

                {/* Email */}
                <TextInputComponent
                  placeholder="Email Address"
                  inputdata={applyEmail}
                  setInputdata={setApplyEmail}
                  keyboardType="email-address"
                  borderColor={BRANDCOLOR}
                  width="95%"
                  image={MAIL}
                />

                {/* Phone */}
                <TextInputComponent
                  placeholder="Phone Number"
                  inputdata={applyPhone}
                  setInputdata={setApplyPhone}
                  keyboardType="numeric"
                  borderColor={BRANDCOLOR}
                  width="95%"
                  image={PHONE}
                />

                {/* File Upload */}
                <View style={styles.applyFileBox}>
                  {!applyFile ? (
                    <Pressable style={styles.applyUploadArea} onPress={handlePickFile}>
                      <Image source={UPLOAD} style={styles.applyUploadIcon} />
                      <Text style={styles.applyFileText}>Upload Resume</Text>
                    </Pressable>
                  ) : (
                    <View style={styles.applySelectedFile}>
                      <Text style={styles.applyFileName}>{applyFile.name}</Text>
                      <Pressable onPress={() => setApplyFile(null)} style={styles.applyRemoveBtn}>
                        <Text style={styles.applyRemoveText}>Remove</Text>
                      </Pressable>
                    </View>
                  )}
                </View>

                {/* Cover Letter - Description Style */}
                <View style={styles.applyCoverLetterContainer}>
                  <View style={styles.applyCoverLetterHeader}>
                    <Image source={COVERLETTER} style={styles.applyCoverLetterIcon} />
                    <Text style={styles.applyCoverLetterLabel}>Cover Letter (Description)</Text>
                  </View>
                  <TextInput
                    placeholder="Enter your cover letter or description here..."
                    placeholderTextColor="#7A7A7A"
                    value={applyCoverLetter}
                    onChangeText={setApplyCoverLetter}
                    style={styles.applyCoverLetterInput}
                    multiline
                    numberOfLines={10}
                    maxLength={1000}
                    textAlignVertical="top"
                  />
                  <Text style={styles.applyCoverLetterCharCount}>
                    {applyCoverLetter.length}/1000
                  </Text>
                </View>

                {/* Submit Button */}
                <View style={styles.applyButtonWrapper}>
                  <CustomButton
                    text={applyLoading ? "Submitting..." : "Submit Application"}
                    color={WHITE}
                    onPress={handleSubmitApplication}
                    disabled={applyLoading}
                  />
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </View>

        {/* Toast Message */}
        <ToastMessage
          message={applyToastMessage.msg}
          visible={applyToastMessage.visible}
          setVisible={({ visible }) =>
            setApplyToastMessage((prev) => ({ ...prev, visible }))
          }
          bacgroundColor={applyToastMessage.type === "success" ? "green" : "red"}
          textColor={WHITE}
          type={applyToastMessage.type}
          duration={3000}
          image={LOGO}
        />
      </Modal>
    </View>
    </>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WHITE,
    paddingHorizontal: WIDTH * 0.04,
  },
  headerContainer: {
    marginTop: HEIGHT * 0.01,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: HEIGHT * 0.02,
  },
  quickFilterSectionContainer: {
    marginBottom: HEIGHT * 0.02,
    paddingHorizontal: WIDTH * 0.01,
  },
  quickFilterContainer: {
    height: HEIGHT * 0.08,
    overflow: 'visible',
    paddingBottom: HEIGHT * 0.01,
  },
  quickFilterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: HEIGHT * 0.005,
  },
  quickFilterButton: {
    width: WIDTH * 0.28,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: WIDTH * 0.025,
    paddingVertical: HEIGHT * 0.012,
    paddingHorizontal: WIDTH * 0.025,
    marginRight: WIDTH * 0.02,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quickFilterLabel: {
    flex: 1,
    fontSize: WIDTH * 0.035,
    fontFamily: FIRASANSSEMIBOLD,
    color: BLACK,
    marginLeft: WIDTH * 0.015,
    marginRight: WIDTH * 0.01,
  },
  quickFilterArrow: {
    opacity: 0.5,
  },
  // Dream Job Section Styles
  dreamJobContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF5E6',
    borderRadius: WIDTH * 0.04,
    overflow: 'hidden',
    marginBottom: HEIGHT * 0.02,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: HEIGHT * 0.25,
  },
  dreamJobLeftSection: {
    flex: 1,
    backgroundColor: '#FFE5B4',
    position: 'relative',
    overflow: 'hidden',
    borderTopLeftRadius: WIDTH * 0.04,
    borderBottomLeftRadius: WIDTH * 0.04,
  },
  dreamJobImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dreamJobRightSection: {
    flex: 1.2,
    backgroundColor: WHITE,
    paddingVertical: HEIGHT * 0.02,
    paddingHorizontal: WIDTH * 0.02,
    borderTopRightRadius: WIDTH * 0.04,
    borderBottomRightRadius: WIDTH * 0.04,
    overflow: 'hidden',
  },
  dreamJobScrollContent: {
    paddingRight: WIDTH * 0.02,
  },
  dreamJobRoleCard: {
    width: WIDTH * 0.65,
    backgroundColor: '#F9FAFB',
    borderRadius: WIDTH * 0.025,
    padding: WIDTH * 0.035,
    marginRight: WIDTH * 0.02,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dreamJobRoleContent: {
    flex: 1,
    marginRight: WIDTH * 0.02,
  },
  dreamJobRoleTitle: {
    fontSize: WIDTH * 0.038,
    fontFamily: UBUNTUBOLD,
    color: BLACK,
    marginBottom: HEIGHT * 0.005,
  },
  dreamJobRoleJobs: {
    fontSize: WIDTH * 0.032,
    fontFamily: FIRASANSSEMIBOLD,
    color: BRANDCOLOR,
  },
  dreamJobPagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: HEIGHT * 0.015,
    gap: WIDTH * 0.015,
  },
  dreamJobDot: {
    width: WIDTH * 0.02,
    height: WIDTH * 0.02,
    borderRadius: WIDTH * 0.01,
    backgroundColor: '#D0D0D0',
  },
  dreamJobDotActive: {
    backgroundColor: BRANDCOLOR,
    width: WIDTH * 0.025,
  },
  sectionTitle: {
    fontSize: WIDTH * 0.045,
    fontFamily: FIRASANSSEMIBOLD,
    color: BLACK,
    marginBottom: HEIGHT * 0.01,
    paddingHorizontal: WIDTH * 0.01,
  },
  companySectionTitle: {
    fontSize: WIDTH * 0.045,
    fontFamily: UBUNTUBOLD,
    color: BLACK,
    marginBottom: HEIGHT * 0.015,
    paddingHorizontal: WIDTH * 0.01,
    textAlign: "center",
  },
  companySectionSubtitle: {
    fontSize: WIDTH * 0.033,
    fontFamily: FIRASANSSEMIBOLD,
    color: "#555",
    marginBottom: HEIGHT * 0.015,
    paddingHorizontal: WIDTH * 0.01,
    textAlign: "center",
  },
  companyCarouselContent: {
    paddingLeft: WIDTH * 0.04,
    paddingRight: WIDTH * 0.04,
  },
  loadingContainer: {
    paddingVertical: HEIGHT * 0.02,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: HEIGHT * 0.01,
    fontSize: WIDTH * 0.035,
    color: "#666",
  },
  emptyContainer: {
    paddingVertical: HEIGHT * 0.03,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: WIDTH * 0.035,
    color: "#999",
  },
  card: {
    backgroundColor: "#F9FAFB",
    borderRadius: WIDTH * 0.03,
    padding: WIDTH * 0.03,
    marginBottom: HEIGHT * 0.015,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: WIDTH * 0.01,
    elevation: 2,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  cardLogoContainer: {
    marginRight: WIDTH * 0.03,
  },
  cardLogo: {
    width: WIDTH * 0.14,
    height: WIDTH * 0.14,
    borderRadius: WIDTH * 0.03,
    resizeMode: "contain",
  },
  cardBody: {
    flex: 1,
    justifyContent: "flex-start",
    paddingRight: WIDTH * 0.02,
  },
  cardTitle: {
    fontSize: WIDTH * 0.04,
    fontFamily: UBUNTUBOLD,
    color: BLACK,
  },
  cardSubtitle: {
    fontSize: WIDTH * 0.035,
    color: "#444",
    marginTop: HEIGHT * 0.005,
  },
  cardSubtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: HEIGHT * 0.005,
  },
  cardVerifiedIcon: {
    width: WIDTH * 0.035,
    height: WIDTH * 0.035,
    marginLeft: WIDTH * 0.01,
    resizeMode: "contain",
  },
  cardInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: HEIGHT * 0.005,
  },
  cardJobType: {
    fontSize: WIDTH * 0.032,
    color: BRANDCOLOR,
    fontFamily: FIRASANSSEMIBOLD,
    marginLeft: WIDTH * 0.015,
  },
  cardLocation: {
    fontSize: WIDTH * 0.032,
    color: "#666",
    marginLeft: WIDTH * 0.015,
  },
  cardMeta: {
    fontSize: WIDTH * 0.032,
    color: "#666",
    marginLeft: WIDTH * 0.015,
  },
  cardActions: {
    alignItems: "center",
    justifyContent: "flex-start",
    minWidth: WIDTH * 0.2,
  },
  applyButton: {
    backgroundColor: BRANDCOLOR,
    borderRadius: WIDTH * 0.02,
    paddingVertical: HEIGHT * 0.01,
    paddingHorizontal: WIDTH * 0.035,
    marginBottom: HEIGHT * 0.01,
    alignItems: "center",
    justifyContent: "center",
  },
  applyText: {
    color: WHITE,
    fontFamily: UBUNTUBOLD,
    fontSize: WIDTH * 0.032,
  },
  heartButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: {
    flex: 1,
    backgroundColor: WHITE,
    padding: WIDTH * 0.04,
  },
  overlayHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: HEIGHT * 0.02,
    marginLeft: WIDTH * 0.03,
    marginTop: Platform.OS === "android" 
      ? (StatusBar.currentHeight || 0) + HEIGHT * 0.005 
      : HEIGHT * 0.01,
  },
  overlayTitle: {
    fontSize: WIDTH * 0.045,
    fontFamily: UBUNTUBOLD,
    color: BLACK,
    marginLeft: WIDTH * 0.03,
  },
  inputGroup: {
    marginBottom: HEIGHT * 0.015,
  },
  inputLabel: {
    color: "#444",
    marginBottom: HEIGHT * 0.007,
    fontFamily: FIRASANSSEMIBOLD,
    fontSize: WIDTH * 0.035,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E2E4E8",
    borderRadius: WIDTH * 0.025,
    paddingHorizontal: WIDTH * 0.03,
    paddingVertical: HEIGHT * 0.012,
    color: BLACK,
    fontSize: WIDTH * 0.035,
  },
  searchButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BRANDCOLOR,
    borderRadius: WIDTH * 0.025,
    paddingVertical: HEIGHT * 0.015,
    marginBottom: HEIGHT * 0.015,
    paddingHorizontal: WIDTH * 0.02,
  },
  searchButtonText: {
    color: WHITE,
    fontFamily: UBUNTUBOLD,
    fontSize: WIDTH * 0.037,
    marginLeft: WIDTH * 0.02,
  },
  sectionContainer: {
    marginBottom: HEIGHT * 0.03,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: HEIGHT * 0.01,
  },
  viewAll: {
    color: BRANDCOLOR,
    fontFamily: FIRASANSSEMIBOLD,
    fontSize: WIDTH * 0.032,
  },
  squareCard: {
    width: WIDTH * 0.3,
    height: WIDTH * 0.3,
    backgroundColor: "#F2F4F5",
    borderRadius: WIDTH * 0.03,
    marginRight: WIDTH * 0.025,
    justifyContent: "center",
    alignItems: "center",
    padding: WIDTH * 0.025,
  },
  squareCardLogo: {
    width: WIDTH * 0.15,
    height: WIDTH * 0.15,
    borderRadius: WIDTH * 0.02,
    resizeMode: "contain",
  },
  squareCardText: {
    marginTop: HEIGHT * 0.01,
    fontFamily: FIRASANSSEMIBOLD,
    color: BLACK,
    textAlign: "center",
    fontSize: WIDTH * 0.032,
  },
  squareCardTag: {
    marginTop: HEIGHT * 0.005,
    color: "#666",
    fontSize: WIDTH * 0.03,
  },
  // Latest Job Card Styles
  row: {
    justifyContent: "space-between",
    marginBottom: HEIGHT * 0.015,
  },
  latestCardWrapper: {
    width: (WIDTH * 0.92 - WIDTH * 0.02) / 2,
    marginBottom: HEIGHT * 0.015,
  },
  latestCard: {
    width: "100%",
    backgroundColor: "#F9FAFB",
    borderRadius: WIDTH * 0.03,
    padding: WIDTH * 0.03,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: WIDTH * 0.01,
    elevation: 2,
    position: "relative",
  },
  wishlistButton: {
    position: "absolute",
    top: WIDTH * 0.02,
    right: WIDTH * 0.02,
    zIndex: 1,
    padding: WIDTH * 0.01,
  },
  latestCardLogo: {
    width: WIDTH * 0.12,
    height: WIDTH * 0.12,
    borderRadius: WIDTH * 0.02,
    alignSelf: "center",
    marginBottom: HEIGHT * 0.01,
    resizeMode: "contain",
  },
  latestCardCompany: {
    fontSize: WIDTH * 0.032,
    color: "#444",
    fontFamily: FIRASANSSEMIBOLD,
    textAlign: "center",
    maxWidth: "90%",
  },
  latestCardCompanyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: HEIGHT * 0.005,
  },
  latestCardVerifiedIcon: {
    width: WIDTH * 0.032,
    height: WIDTH * 0.032,
    marginLeft: WIDTH * 0.01,
    resizeMode: "contain",
  },
  latestCardTitle: {
    fontSize: WIDTH * 0.035,
    fontFamily: UBUNTUBOLD,
    color: BLACK,
    textAlign: "center",
    marginBottom: HEIGHT * 0.005,
    minHeight: HEIGHT * 0.04,
  },
  latestCardInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: HEIGHT * 0.003,
  },
  latestCardJobType: {
    fontSize: WIDTH * 0.03,
    color: BRANDCOLOR,
    fontFamily: FIRASANSSEMIBOLD,
    marginLeft: WIDTH * 0.01,
  },
  latestCardLocation: {
    fontSize: WIDTH * 0.03,
    color: "#666",
    marginLeft: WIDTH * 0.01,
  },
  latestCardSalary: {
    fontSize: WIDTH * 0.03,
    color: "#666",
    marginLeft: WIDTH * 0.01,
  },
  latestApplyButton: {
    backgroundColor: BRANDCOLOR,
    borderRadius: WIDTH * 0.02,
    paddingVertical: HEIGHT * 0.008,
    paddingHorizontal: WIDTH * 0.02,
    alignSelf: "center",
    width: "100%",
    alignItems: "center",
  },
  latestApplyText: {
    color: WHITE,
    fontFamily: UBUNTUBOLD,
    fontSize: WIDTH * 0.03,
  },
  // Sponsorship Card Styles
  sponsorshipCard: {
    width: (WIDTH * 0.92 - WIDTH * 0.02) / 2,
    backgroundColor: "#F9FAFB",
    borderRadius: WIDTH * 0.03,
    padding: WIDTH * 0.03,
    marginBottom: HEIGHT * 0.015,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: WIDTH * 0.01,
    elevation: 2,
  },
  sponsorshipCardLogo: {
    width: WIDTH * 0.12,
    height: WIDTH * 0.12,
    borderRadius: WIDTH * 0.02,
    alignSelf: "center",
    marginBottom: HEIGHT * 0.01,
    resizeMode: "contain",
  },
  sponsorshipCardCompany: {
    fontSize: WIDTH * 0.032,
    color: "#444",
    fontFamily: FIRASANSSEMIBOLD,
    textAlign: "center",
    marginBottom: HEIGHT * 0.005,
  },
  sponsorshipCardTitle: {
    fontSize: WIDTH * 0.035,
    fontFamily: UBUNTUBOLD,
    color: BLACK,
    textAlign: "center",
    marginBottom: HEIGHT * 0.005,
    minHeight: HEIGHT * 0.04,
  },
  sponsorshipCardInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: HEIGHT * 0.003,
  },
  sponsorshipCardJobType: {
    fontSize: WIDTH * 0.03,
    color: BRANDCOLOR,
    fontFamily: FIRASANSSEMIBOLD,
    marginLeft: WIDTH * 0.01,
  },
  sponsorshipCardLocation: {
    fontSize: WIDTH * 0.03,
    color: "#666",
    marginLeft: WIDTH * 0.01,
  },
  sponsorshipCardSalary: {
    fontSize: WIDTH * 0.03,
    color: "#666",
    marginLeft: WIDTH * 0.01,
  },
  searchResultsContainer: {
    marginTop: HEIGHT * 0.02,
    flex: 1,
  },
  searchResultsTitle: {
    fontSize: WIDTH * 0.045,
    fontFamily: FIRASANSSEMIBOLD,
    color: BLACK,
    marginBottom: HEIGHT * 0.01,
    paddingHorizontal: WIDTH * 0.01,
  },
  searchResultCard: {
    width: (WIDTH * 0.92 - WIDTH * 0.02) / 2,
    backgroundColor: "#F9FAFB",
    borderRadius: WIDTH * 0.03,
    padding: WIDTH * 0.03,
    marginBottom: HEIGHT * 0.015,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: WIDTH * 0.01,
    elevation: 2,
    position: "relative",
  },
  searchWishlistButton: {
    position: "absolute",
    top: WIDTH * 0.02,
    right: WIDTH * 0.02,
    zIndex: 1,
    padding: WIDTH * 0.01,
  },
  searchResultLogo: {
    width: WIDTH * 0.12,
    height: WIDTH * 0.12,
    borderRadius: WIDTH * 0.02,
    alignSelf: "center",
    marginBottom: HEIGHT * 0.01,
    resizeMode: "contain",
  },
  searchResultCompany: {
    fontSize: WIDTH * 0.032,
    color: "#444",
    fontFamily: FIRASANSSEMIBOLD,
    textAlign: "center",
    marginBottom: HEIGHT * 0.005,
  },
  searchResultTitle: {
    fontSize: WIDTH * 0.035,
    fontFamily: UBUNTUBOLD,
    color: BLACK,
    textAlign: "center",
    marginBottom: HEIGHT * 0.005,
    minHeight: HEIGHT * 0.04,
  },
  searchResultInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: HEIGHT * 0.003,
  },
  searchResultJobType: {
    fontSize: WIDTH * 0.03,
    color: BRANDCOLOR,
    fontFamily: FIRASANSSEMIBOLD,
    marginLeft: WIDTH * 0.01,
  },
  searchResultLocation: {
    fontSize: WIDTH * 0.03,
    color: "#666",
    marginLeft: WIDTH * 0.01,
  },
  searchResultSalary: {
    fontSize: WIDTH * 0.03,
    color: "#666",
    marginLeft: WIDTH * 0.01,
  },
  searchApplyButton: {
    backgroundColor: BRANDCOLOR,
    borderRadius: WIDTH * 0.02,
    paddingVertical: HEIGHT * 0.008,
    paddingHorizontal: WIDTH * 0.02,
    alignSelf: "center",
    width: "100%",
    alignItems: "center",
  },
  searchApplyText: {
    color: WHITE,
    fontFamily: UBUNTUBOLD,
    fontSize: WIDTH * 0.03,
  },
  emptySearchContainer: {
    paddingVertical: HEIGHT * 0.1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptySearchText: {
    fontSize: WIDTH * 0.035,
    color: "#999",
    textAlign: "center",
  },
  loadingIndicatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: HEIGHT * 0.015,
    gap: WIDTH * 0.02,
  },
  loadingIndicatorText: {
    fontSize: WIDTH * 0.035,
    color: BRANDCOLOR,
  },
  // Apply Form Modal Styles
  applyModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  applyModalContainer: {
    height: "90%",
    backgroundColor: WHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  applyFormContainer: {
    padding: 10,
    paddingBottom: 30,
    backgroundColor: WHITE,
  },
  applyFileBox: {
    width: "95%",
    height: 120,
    borderWidth: 1,
    borderColor: BRANDCOLOR,
    borderRadius: 12,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
    backgroundColor: WHITE,
  },
  applyUploadArea: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  applyUploadIcon: {
    width: 30,
    height: 30,
    marginBottom: 6,
    resizeMode: "contain",
  },
  applyFileText: {
    color: BLACK,
    fontSize: 14,
  },
  applySelectedFile: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  applyFileName: {
    color: BLACK,
    fontSize: 14,
    paddingHorizontal: 10,
    textAlign: "center",
    flex: 1,
  },
  applyRemoveBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  applyRemoveText: {
    color: "red",
    fontSize: 13,
    fontFamily: FIRASANSSEMIBOLD,
  },
  applyButtonWrapper: {
    alignItems: "center",
    marginTop: 20,
  },
  applyJobTitleContainer: {
    width: "95%",
    alignSelf: "center",
    marginBottom: HEIGHT * 0.02,
    paddingBottom: HEIGHT * 0.015,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  applyJobTitle: {
    fontSize: WIDTH * 0.045,
    fontFamily: UBUNTUBOLD,
    color: BRANDCOLOR,
    textAlign: "center",
  },
  applyCoverLetterContainer: {
    width: "95%",
    alignSelf: "center",
    marginVertical: 10,
    borderWidth: 1,
    borderColor: BRANDCOLOR,
    borderRadius: 12,
    padding: 12,
    backgroundColor: WHITE,
  },
  applyCoverLetterHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  applyCoverLetterIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
    resizeMode: "contain",
  },
  applyCoverLetterLabel: {
    fontSize: 14,
    fontFamily: FIRASANSSEMIBOLD,
    color: BLACK,
  },
  applyCoverLetterInput: {
    minHeight: 150,
    fontSize: 14,
    color: BLACK,
    textAlignVertical: "top",
    padding: 10,
  },
  applyCoverLetterCharCount: {
    fontSize: 12,
    color: "#666",
    textAlign: "right",
    marginTop: 5,
  },
  appliedContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  appliedText: {
    marginLeft: 6,
    fontSize: 12,
    color: "#26AE61",
    fontWeight: "600",
  },
  latestAppliedContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  latestAppliedText: {
    marginLeft: 6,
    fontSize: 12,
    color: "#26AE61",
    fontWeight: "600",
  },
  latestStatusContainer: {
    marginTop: 8,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 10,
  },
  latestStatusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  latestStatusLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: BLACK,
  },
  latestStatusTracking: {
    marginTop: 10,
    paddingLeft: 8,
  },
  latestStatusStage: {
    flexDirection: "row",
    marginBottom: 10,
  },
  latestStatusIndicator: {
    alignItems: "center",
    marginRight: 10,
  },
  latestStatusPendingCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#CCC",
    backgroundColor: WHITE,
  },
  latestStatusLine: {
    width: 2,
    height: 18,
    backgroundColor: "#E0E0E0",
    marginTop: 2,
  },
  latestStatusLineCompleted: {
    backgroundColor: "#26AE61",
  },
  latestStatusStageContent: {
    flex: 1,
  },
  latestStatusStageLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  latestStatusStageCompleted: {
    color: BLACK,
    fontWeight: "600",
  },
  latestStatusStageDate: {
    fontSize: 10,
    color: "#999",
  },
  // Card Status Styles (Inside Card Footer)
  cardStatusContainer: {
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    paddingTop: 8,
    marginTop: 8,
  },
  cardStatusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  cardStatusLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: BLACK,
  },
  cardStatusTracking: {
    marginTop: 8,
    paddingLeft: 8,
  },
  cardStatusStage: {
    flexDirection: "row",
    marginBottom: 10,
  },
  cardStatusIndicator: {
    alignItems: "center",
    marginRight: 10,
  },
  cardStatusPendingCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#CCC",
    backgroundColor: WHITE,
  },
  cardStatusLine: {
    width: 2,
    height: 18,
    backgroundColor: "#E0E0E0",
    marginTop: 2,
  },
  cardStatusLineCompleted: {
    backgroundColor: "#26AE61",
  },
  cardStatusStageContent: {
    flex: 1,
  },
  cardStatusStageLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  cardStatusStageCompleted: {
    color: BLACK,
    fontWeight: "600",
  },
  cardStatusStageDate: {
    fontSize: 10,
    color: "#999",
  },
  // Latest Card Status Styles (Inside Card Footer)
  latestCardStatusContainer: {
    width: "100%",
    backgroundColor: "#F9FAFB",
    borderBottomLeftRadius: WIDTH * 0.03,
    borderBottomRightRadius: WIDTH * 0.03,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    paddingTop: 6,
    paddingHorizontal: WIDTH * 0.03,
    paddingBottom: 6,
    marginTop: 0,
  },
  latestCardStatusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  latestCardStatusLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: BLACK,
  },
  latestCardStatusTracking: {
    marginTop: 6,
    paddingLeft: 6,
  },
  latestCardStatusStage: {
    flexDirection: "row",
    marginBottom: 8,
  },
  latestCardStatusIndicator: {
    alignItems: "center",
    marginRight: 8,
  },
  latestCardStatusPendingCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#CCC",
    backgroundColor: WHITE,
  },
  latestCardStatusLine: {
    width: 2,
    height: 16,
    backgroundColor: "#E0E0E0",
    marginTop: 2,
  },
  latestCardStatusLineCompleted: {
    backgroundColor: "#26AE61",
  },
  latestCardStatusStageContent: {
    flex: 1,
  },
  latestCardStatusStageLabel: {
    fontSize: 11,
    color: "#666",
    marginBottom: 2,
  },
  latestCardStatusStageCompleted: {
    color: BLACK,
    fontWeight: "600",
  },
  latestCardStatusStageDate: {
    fontSize: 9,
    color: "#999",
  },
  // Category Card Styles
  categoryCard: {
    width: (WIDTH * 0.92 - WIDTH * 0.02) / 2,
    backgroundColor: "#F9FAFB",
    borderRadius: WIDTH * 0.03,
    padding: WIDTH * 0.04,
    marginBottom: HEIGHT * 0.015,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: WIDTH * 0.01,
    elevation: 2,
    alignItems: "center",
    justifyContent: "center",
    minHeight: HEIGHT * 0.15,
  },
  categoryIconContainer: {
    width: WIDTH * 0.16,
    height: WIDTH * 0.16,
    borderRadius: WIDTH * 0.08,
    backgroundColor: WHITE,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: HEIGHT * 0.01,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: WIDTH * 0.01,
    elevation: 1,
  },
  categoryIcon: {
    width: WIDTH * 0.12,
    height: WIDTH * 0.12,
    resizeMode: "contain",
  },
  categoryName: {
    fontSize: WIDTH * 0.036,
    fontWeight: "700",
    color: BLACK,
    textAlign: "center",
    marginBottom: HEIGHT * 0.005,
    minHeight: HEIGHT * 0.04,
  },
  categoryJobCount: {
    fontSize: WIDTH * 0.032,
    color: BRANDCOLOR,
    fontWeight: "600",
    textAlign: "center",
  },
  // All Categories Slider Styles
  allCategoriesSliderContainer: {
    height: HEIGHT * 0.22,
    overflow: "visible",
    paddingBottom: HEIGHT * 0.02,
  },
  allCategoriesSliderContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: HEIGHT * 0.005,
  },
  allCategoryCard: {
    width: (WIDTH * 0.92 - WIDTH * 0.02) / 2,
    backgroundColor: "#F9FAFB",
    borderRadius: WIDTH * 0.03,
    padding: WIDTH * 0.04,
    marginRight: WIDTH * 0.02,
    marginBottom: HEIGHT * 0.005,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: WIDTH * 0.01,
    elevation: 2,
    alignItems: "center",
    justifyContent: "center",
    minHeight: HEIGHT * 0.16,
  },
  allCategoryIconContainer: {
    width: WIDTH * 0.16,
    height: WIDTH * 0.16,
    borderRadius: WIDTH * 0.08,
    backgroundColor: WHITE,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: HEIGHT * 0.01,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: WIDTH * 0.01,
    elevation: 1,
  },
  allCategoryIcon: {
    width: WIDTH * 0.12,
    height: WIDTH * 0.12,
    resizeMode: "contain",
  },
  allCategoryName: {
    fontSize: WIDTH * 0.036,
    fontWeight: "700",
    color: BLACK,
    textAlign: "center",
    marginBottom: HEIGHT * 0.005,
    minHeight: HEIGHT * 0.04,
  },
  allCategoryJobCount: {
    fontSize: WIDTH * 0.032,
    color: BRANDCOLOR,
    fontWeight: "600",
    textAlign: "center",
  },
  // Resume Premium Section Styles
  resumePremiumContainer: {
    flexDirection: 'row',
    backgroundColor: WHITE,
    borderRadius: WIDTH * 0.04,
    overflow: 'hidden',
    marginBottom: HEIGHT * 0.02,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: HEIGHT * 0.18,
  },
  resumePremiumLeftSection: {
    flex: 1.5,
    padding: WIDTH * 0.04,
    justifyContent: 'center',
  },
  resumePremiumTitle: {
    fontSize: WIDTH * 0.04,
    fontFamily: UBUNTUBOLD,
    color: BLACK,
    marginBottom: HEIGHT * 0.01,
    lineHeight: WIDTH * 0.05,
  },
  resumePremiumDescription: {
    fontSize: WIDTH * 0.032,
    fontFamily: FIRASANS,
    color: '#666',
    marginBottom: HEIGHT * 0.015,
    lineHeight: WIDTH * 0.042,
  },
  resumePremiumTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8D5FF',
    paddingHorizontal: WIDTH * 0.03,
    paddingVertical: HEIGHT * 0.005,
    borderRadius: WIDTH * 0.02,
  },
  resumePremiumTagText: {
    fontSize: WIDTH * 0.028,
    fontFamily: FIRASANSSEMIBOLD,
    color: '#6B46C1',
  },
  resumePremiumRightSection: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: WIDTH * 0.03,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: WIDTH * 0.04,
    borderBottomRightRadius: WIDTH * 0.04,
  },
  resumePremiumImage: {
    width: WIDTH * 0.25,
    height: WIDTH * 0.25,
    marginBottom: HEIGHT * 0.015,
  },
  resumePremiumButton: {
    backgroundColor: BRANDCOLOR,
    paddingVertical: HEIGHT * 0.012,
    paddingHorizontal: WIDTH * 0.05,
    borderRadius: WIDTH * 0.025,
    marginBottom: HEIGHT * 0.008,
  },
  resumePremiumButtonText: {
    color: WHITE,
    fontSize: WIDTH * 0.035,
    fontFamily: UBUNTUBOLD,
  },
  resumePremiumNote: {
    fontSize: WIDTH * 0.025,
    fontFamily: FIRASANS,
    color: '#999',
    textAlign: 'center',
  },
  // Company Card Styles
  companyCard: {
    width: (WIDTH * 0.92 - WIDTH * 0.02) / 2,
    minHeight: WIDTH * 0.42,
    backgroundColor: "#F9FAFB",
    borderRadius: WIDTH * 0.03,
    padding: WIDTH * 0.03,
    marginRight: WIDTH * 0.02,
    alignItems: "center",
    justifyContent: "flex-start",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: WIDTH * 0.01,
    elevation: 2,
  },
  companyCardLogo: {
    width: WIDTH * 0.14,
    height: WIDTH * 0.14,
    borderRadius: WIDTH * 0.03,
    marginBottom: HEIGHT * 0.008,
    resizeMode: "contain",
  },
  companyCardName: {
    fontSize: WIDTH * 0.035,
    fontFamily: UBUNTUBOLD,
    color: BLACK,
    textAlign: "center",
    flexShrink: 1,
    lineHeight: WIDTH * 0.042,
  },
  companyNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginBottom: HEIGHT * 0.008,
  },
  companyVerifiedIcon: {
    width: WIDTH * 0.04,
    height: WIDTH * 0.04,
    marginLeft: WIDTH * 0.01,
    alignSelf: "center",
    resizeMode: "contain",
  },
  companyLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    width: "90%",
    marginBottom: HEIGHT * 0.008,
  },
  companyCardMeta: {
    fontSize: WIDTH * 0.03,
    color: "#666",
    textAlign: "center",
    flex: 1,
    flexWrap: "wrap",
    marginLeft: WIDTH * 0.02,
  },
  companyCardOpenings: {
    fontSize: WIDTH * 0.032,
    color: BRANDCOLOR,
    textAlign: "center",
    fontFamily: FIRASANSSEMIBOLD,
    width: "100%",
    flexWrap: "wrap",
    marginTop: HEIGHT * 0.005,
  },
  companyCardRating: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: HEIGHT * 0.01,
  },
  companyCardRatingText: {
    fontSize: WIDTH * 0.032,
    fontFamily: FIRASANSSEMIBOLD,
    color: BLACK,
    marginLeft: WIDTH * 0.01,
    marginRight: WIDTH * 0.01,
  },
  companyCardReviewCount: {
    fontSize: WIDTH * 0.028,
    color: "#666",
  },
  companyCardButton: {
    backgroundColor: BRANDCOLOR,
    borderRadius: WIDTH * 0.02,
    paddingVertical: HEIGHT * 0.008,
    paddingHorizontal: WIDTH * 0.03,
    width: "100%",
    alignItems: "center",
    marginTop: HEIGHT * 0.005,
  },
  companyCardButtonText: {
    color: WHITE,
    fontFamily: UBUNTUBOLD,
    fontSize: WIDTH * 0.032,
  },
  // Company Section Styles
  companiesRow: {
    justifyContent: "space-around",
    marginBottom: HEIGHT * 0.01,
  },
  viewMoreButton: {
    alignSelf: "center",
    marginTop: HEIGHT * 0.01,
    paddingVertical: HEIGHT * 0.008,
    paddingHorizontal: WIDTH * 0.04,
  },
  viewMoreText: {
    fontSize: HEIGHT * 0.016,
    fontFamily: FIRASANSSEMIBOLD,
    color: BRANDCOLOR,
  },
  // Cities Section Styles
  citiesSectionWrapper: {
    marginTop: HEIGHT * 0.03, // Gap between All Categories and Cities
  },
  citiesSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: HEIGHT * 0.01,
    paddingHorizontal: WIDTH * 0.01,
  },
  citiesViewAllButton: {
    padding: WIDTH * 0.015,
  },
  citiesScrollContent: {
    paddingRight: WIDTH * 0.04,
  },
  cityCard: {
    width: WIDTH * 0.65,
    backgroundColor: "#F9FAFB",
    borderRadius: WIDTH * 0.03,
    marginRight: WIDTH * 0.02,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: WIDTH * 0.01,
    elevation: 2,
  },
  cityImageContainer: {
    width: "100%",
    height: HEIGHT * 0.18,
    backgroundColor: "#E8F4F8",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
  },
  cityImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  cityLabelContainer: {
    paddingVertical: HEIGHT * 0.01,
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  cityLabel: {
    fontSize: WIDTH * 0.04,
    fontFamily: FIRASANSBOLD,
    color: BLACK,
  },
  cityJobCountTopLeft: {
    position: "absolute",
    top: WIDTH * 0.02,
    left: WIDTH * 0.02,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: WIDTH * 0.025,
    paddingVertical: HEIGHT * 0.006,
    borderRadius: WIDTH * 0.02,
    borderWidth: 1,
    borderColor: "rgba(38, 174, 97, 0.3)",
    zIndex: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cityJobCountText: {
    fontSize: WIDTH * 0.032,
    fontFamily: FIRASANSSEMIBOLD,
    color: "#26AE61",
    marginLeft: WIDTH * 0.01,
  },
  cityArrowButton: {
    position: "absolute",
    top: WIDTH * 0.02,
    right: WIDTH * 0.02,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: WIDTH * 0.04,
    width: WIDTH * 0.08,
    height: WIDTH * 0.08,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cityInfoContainer: {
    padding: WIDTH * 0.03,
    backgroundColor: WHITE,
  },
  cityName: {
    fontSize: WIDTH * 0.04,
    fontFamily: UBUNTUBOLD,
    color: BLACK,
    marginBottom: HEIGHT * 0.01,
  },
  cityJobCountContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
    paddingHorizontal: WIDTH * 0.02,
    paddingVertical: HEIGHT * 0.005,
    borderRadius: WIDTH * 0.015,
    alignSelf: "flex-start",
  },
  cityJobCount: {
    fontSize: WIDTH * 0.03,
    fontFamily: FIRASANSSEMIBOLD,
    color: "#26AE61",
    marginLeft: WIDTH * 0.01,
  },
  // Poster Section Styles
  posterContainer: {
    borderRadius: WIDTH * 0.04,
    marginBottom: HEIGHT * 0.02,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: WIDTH * 0.02,
    elevation: 5,
  },
  posterGradient: {
    backgroundColor: BRANDCOLOR,
    padding: WIDTH * 0.05,
    position: "relative",
  },
  posterContent: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  posterIconContainer: {
    width: WIDTH * 0.2,
    height: WIDTH * 0.2,
    borderRadius: WIDTH * 0.1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: HEIGHT * 0.015,
  },
  posterTitle: {
    fontSize: WIDTH * 0.055,
    fontFamily: UBUNTUBOLD,
    color: WHITE,
    textAlign: "center",
    marginBottom: HEIGHT * 0.015,
    lineHeight: WIDTH * 0.07,
  },
  posterSlogan: {
    fontSize: WIDTH * 0.038,
    fontFamily: FIRASANSSEMIBOLD,
    color: WHITE,
    textAlign: "center",
    marginTop: HEIGHT * 0.008,
    opacity: 0.95,
  },
  posterBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: WIDTH * 0.04,
    paddingVertical: HEIGHT * 0.008,
    borderRadius: WIDTH * 0.05,
    marginTop: HEIGHT * 0.015,
  },
  posterBadgeText: {
    fontSize: WIDTH * 0.032,
    fontFamily: FIRASANSSEMIBOLD,
    color: WHITE,
    marginLeft: WIDTH * 0.015,
  },
});