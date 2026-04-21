import React, { useEffect, useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  StatusBar,
  BackHandler,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { BLACK, BRANDCOLOR, WHITE } from "../../../constant/color";
import { UBUNTUBOLD, UBUNTU, FIRASANSSEMIBOLD, ROBOTOSEMIBOLD, CANTARELLBOLD, FIRASANSBOLD } from "../../../constant/fontPath";
import { MyHeader } from "../../../components/commonComponents/MyHeader";
import {
  PROFILE,
  USER,
  MAIL,
  PHONE,
  ADDRESS,
  GENDER,
  CALENDAR,
  LANGUAGE,
  LINKEDIN,
  TWITTER,
  FACEBOOK,
  GOOGLE,
  EDIT,
  JOBDESCRIPTION,
  SKILLS,
  EXPERIENCE,
  EDUCATION,
} from "../../../constant/imagePath";
import { getObjByKey } from "../../../utils/Storage";
import { BASE_URL } from "../../../constant/url";
import { GETNETWORK } from "../../../utils/Network";

// Helper function to capitalize first letter
const capitalizeFirst = (str) => {
  if (!str || typeof str !== 'string') return str || '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Helper function to capitalize each word (title case)
const capitalizeWords = (str) => {
  if (!str || typeof str !== 'string') return str || '';
  return str.split(' ').map(word => capitalizeFirst(word)).join(' ');
};

// Helper function to format skill names with special cases
const formatSkillName = (skill) => {
  if (!skill || typeof skill !== 'string') return skill || '';
  
  const lowerSkill = skill.toLowerCase().trim();
  
  // Special cases
  if (lowerSkill === 'html') return 'HTML';
  if (lowerSkill === 'css') return 'CSS';
  if (lowerSkill === 'mysql') return 'MySQL';
  if (lowerSkill === 'mongodb') return 'MongoDB';
  if (lowerSkill === 'ios development') return 'iOS Development';
  if (lowerSkill === 'android development') return 'Android Development';
  if (lowerSkill === 'tailwind css') return 'Tailwind CSS';
  
  // Default: capitalize each word
  return capitalizeWords(skill);
};

// Helper function to format date to DD/MM/YYYY
const formatDate = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      // If invalid, try to parse as DD-MM-YYYY or other formats
      const parts = dateString.split(/[-/]/);
      if (parts.length === 3) {
        // Assume format might be YYYY-MM-DD or DD-MM-YYYY
        let day, month, year;
        if (parts[0].length === 4) {
          // YYYY-MM-DD format
          year = parts[0];
          month = parts[1];
          day = parts[2];
        } else {
          // DD-MM-YYYY format
          day = parts[0];
          month = parts[1];
          year = parts[2];
        }
        return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
      }
      return dateString; // Return original if can't parse
    }
    
    // Format as DD/MM/YYYY
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    // console.error('Error formatting date:', error);
    return dateString; // Return original if formatting fails
  }
};

const getValue = (value) => {
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : 'N/A';
  }
  if (typeof value === 'string') {
    return value.trim() || 'N/A';
  }
  if (value || value === 0) {
    return String(value);
  }
  return 'N/A';
};

const getResumeName = (resume) => {
  if (!resume) return 'N/A';
  const parts = resume.split('/').filter(Boolean);
  return parts.length ? parts[parts.length - 1] : 'N/A';
};

const calculateCompletionPercentage = ({
  name, email, phone, address, gender, dob, profilePicture,
  preferredLocation, currentSalary, expectedSalary, noticePeriod, bio,
  slogan, resume,
  experienceItems, educationItems, certificationItems, keySkills, languages
}) => {
  let percentage = 0;

  // Helper function to check if field is truly filled
  const isFieldFilled = (field) => {
    if (!field) return false;
    const strValue = String(field).trim();
    return strValue !== '' && strValue !== 'N/A';
  };

  // Personal Details Section: 20% (if name, email, phone, address, gender, dob are filled)
  const personalDetailsFields = [name, email, phone, address, gender, dob];
  const personalDetailsFilled = personalDetailsFields.filter(isFieldFilled).length;
  if (personalDetailsFilled === personalDetailsFields.length) {
    percentage += 20;
  }

  // Profile Picture: 10% (if profilePicture is set)
  if (profilePicture) {
    // Handle both object with uri and string URL
    const hasPicture = profilePicture.uri ? true : (typeof profilePicture === 'string' && profilePicture.trim() !== '');
    if (hasPicture) {
      percentage += 10;
    }
  }

  // Career Preference Section: 10% (if preferredLocation, currentSalary, expectedSalary, noticePeriod, bio are filled)
  const careerFields = [preferredLocation, currentSalary, expectedSalary, noticePeriod, bio];
  const careerFieldsFilled = careerFields.filter(isFieldFilled).length;
  if (careerFieldsFilled === careerFields.length) {
    percentage += 10;
  }

  // Profile Summary Section: 5% (if slogan is filled)
  if (isFieldFilled(slogan)) {
    percentage += 5;
  }

  // Resume Added: 10% (if resume is added and not empty)
  if (resume && String(resume).trim() !== '') {
    percentage += 10;
  }

  // Employment History: 10% (if experienceItems has at least one filled entry)
  const filledExperience = experienceItems && Array.isArray(experienceItems)
    ? experienceItems.filter((exp) => exp.companyName && String(exp.companyName).trim() !== '').length
    : 0;
  if (filledExperience > 0) {
    percentage += 10;
  }

  // Certification: 2% (if certificationItems has at least one filled entry)
  const filledCertifications = certificationItems && Array.isArray(certificationItems)
    ? certificationItems.filter((cert) => cert.name && String(cert.name).trim() !== '').length
    : 0;
  if (filledCertifications > 0) {
    percentage += 2;
  }

  // Education: 20% (if educationItems has at least one filled entry)
  const filledEducation = educationItems && Array.isArray(educationItems)
    ? educationItems.filter((edu) => edu.degree && String(edu.degree).trim() !== '').length
    : 0;
  if (filledEducation > 0) {
    percentage += 20;
  }

  // Skills: 20% (if keySkills array has at least one skill)
  if (keySkills && Array.isArray(keySkills) && keySkills.length > 0) {
    percentage += 20;
  }

  // Language: 13% (if languages array has at least one language)
  if (languages && Array.isArray(languages) && languages.length > 0) {
    percentage += 13;
  }

  return Math.min(Math.round(percentage), 100);
};
 
const UserProfileScreen = ({ navigation }) => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profilePicture, setProfilePicture] = useState(null);

  const navigateToEdit = useCallback(
    (user) => {
      navigation.navigate("EditUserProfile", {
        profileData: user,
        profilePicture: profilePicture,
        onProfileUpdate: () => fetchProfile(),
      });
    },
    [navigation, profilePicture]
  );
 
  // Fetch profile data from API using useCallback
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const url = `${BASE_URL}profile`;
      const result = await GETNETWORK(url, true);
      
      // console.log('📥 UserProfile: API Response:', JSON.stringify(result, null, 2));
      
      // Check if result is undefined or null (API error)
      if (!result || result === undefined) {
        // console.error('❌ UserProfile: API returned undefined, using stored data');
        const storedData = await getObjByKey("loginResponse");
        setProfileData(storedData?.data || storedData || {});
        setLoading(false);
        return;
      }
      
      // Check if result has an error message
      if (result?.message && (result.message.toLowerCase().includes('error') || result.message.toLowerCase().includes('not found'))) {
        // console.error('❌ UserProfile: API error message:', result.message);
        const storedData = await getObjByKey("loginResponse");
        setProfileData(storedData?.data || storedData || {});
        setLoading(false);
        return;
      }
      
      // Extract profile data from various possible response structures
      const fetchedData = result?.profile || result?.data || result || result?.user || {};
      // console.log('📝 UserProfile: Extracted profile data:', JSON.stringify(fetchedData, null, 2));
      
      // Extract social media data from various possible field names
      const socialMedia = {
        linkedIn: fetchedData?.linkedIn || fetchedData?.linkedin || fetchedData?.linked_in || 
                  result?.linkedIn || result?.linkedin || '',
        twitter: fetchedData?.twitter || result?.twitter || '',
        facebook: fetchedData?.facebook || result?.facebook || '',
        google: fetchedData?.google || result?.google || '',
      };
      // console.log('📱 UserProfile: Extracted social media:', JSON.stringify(socialMedia, null, 2));
      
      // Merge social media data into fetchedData
      const profileWithSocial = {
        ...fetchedData,
        ...socialMedia,
      };
      
      // Extract profile picture
      const fetchedProfilePicture = 
        fetchedData?.profilePicture || 
        fetchedData?.profile_picture ||
        fetchedData?.picture ||
        fetchedData?.avatar ||
        result?.profilePicture ||
        result?.profile_picture ||
        '';
      
      // Construct full URL if it's a relative path
      if (fetchedProfilePicture && fetchedProfilePicture.trim() !== '') {
        let profilePictureUrl = fetchedProfilePicture;
        if (!fetchedProfilePicture.startsWith('http://') && !fetchedProfilePicture.startsWith('https://')) {
          const baseUrl = BASE_URL.replace('/api/', '/');
          profilePictureUrl = baseUrl + fetchedProfilePicture.replace(/^\//, '');
        }
        // console.log('✅ UserProfile: Setting profile picture to:', profilePictureUrl);
        setProfilePicture(profilePictureUrl);
      } else {
        setProfilePicture(null);
      }
      
      setProfileData(profileWithSocial);
    } catch (error) {
      // console.error('❌ UserProfile: Error fetching profile:', error);
      // Fallback to stored data if API fails
      const storedData = await getObjByKey("loginResponse");
      setProfileData(storedData?.data || storedData || {});
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Use useFocusEffect to fetch data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );
 
  // Handle back press
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        navigation.goBack();
        return true;
      }
    );
    return () => backHandler.remove();
  }, []);
 
  // Merge API data only
  const user = profileData || {};

  const fullName = capitalizeWords(user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User Name');
  const jobTitle = user.currentJobRole || user.designation || user.role || user.jobTitle || '';
  const company = user.company || user.currentCompany || '';
  const jobInfo = jobTitle || company ? [jobTitle, company].filter(Boolean).join(', ') : 'N/A';
  
  // Calculate profile completion percentage
  const parseArrayField = (value) => {
    if (Array.isArray(value)) return value;
    if (!value) return [];
    return [value];
  };

  const completionPercentage = calculateCompletionPercentage({
    name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
    email: user.email,
    phone: user.phone || user.mobile || user.mobileNumber,
    address: user.address || user.location,
    gender: user.gender,
    dob: user.dob || user.dateOfBirth || user.date_of_birth || user.birthDate,
    profilePicture: profilePicture,
    preferredLocation: user.preferredLocation || user.preferred_location,
    currentSalary: user.currentSalary || user.current_salary,
    expectedSalary: user.expectedSalary || user.expected_salary,
    noticePeriod: user.noticePeriod || user.notice_period,
    bio: user.bio || user.biography || user.about,
    slogan: user.slogan || user.slogans || user.summary,
    resume: user.resume || user.resumeUrl || user.resume_url,
    experienceItems: parseArrayField(user.experiences || user.experience || user.workExperience || []),
    educationItems: parseArrayField(user.education || user.educations || []),
    certificationItems: parseArrayField(user.certifications || user.certification || []),
    keySkills: parseArrayField(user.skills || user.keySkills || []),
    languages: parseArrayField(user.languages || user.language || [])
  });

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={WHITE} />
      <View style={styles.container}>
        <MyHeader
          showBack
          showCenterTitle
          title="My Profile"
          onBackPress={() => navigation.goBack()}
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
                  {profilePicture ? (
                    <Image 
                      source={{ uri: profilePicture }} 
                      style={styles.profileImage}
                      defaultSource={PROFILE}
                      onError={() => setProfilePicture(null)}
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
                  <Text style={styles.profileName}>{fullName}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      navigateToEdit(user);
                    }}
                    style={styles.editNameButton}
                  >
                    <MaterialCommunityIcons name="pencil" size={18} color="#2196F3" />
                  </TouchableOpacity>
                </View>

                {/* Job Title/Company */}
                {jobInfo && (
                  <Text style={styles.jobInfo}>{jobInfo}</Text>
                )}

                {/* Profile Summary/Bio */}
                {user.bio && (
                  <Text style={styles.profileSummary} numberOfLines={3}>
                    {user.bio}
                  </Text>
                )}
              </View>

              {/* Your Career Preferences Section */}
              <SectionCard
                title="Your career preferences"
                onEdit={() => navigateToEdit(user)}
              >
                <View style={styles.preferencesGrid}>
                  <PreferenceItem label="Preferred location" value={getValue(user.preferredLocation)} />
                  {/* <PreferenceItem label="Employment type" value={getValue(user.employmentType)} /> */}
                  <PreferenceItem label="Expected salary" value={getValue(user.expectedSalary)} />
                  <PreferenceItem label="Notice period" value={getValue(user.noticePeriod)} />
                </View>
              </SectionCard>

              {/* Basic Details Section */}
              <SectionCard
                title="Basic details"
                icon={USER}
                onEdit={() => navigateToEdit(user)}
              >
                <View style={styles.detailsList}>
                  <DetailRow label="Name" value={capitalizeWords(getValue(user.name))} />
                  <DetailRow label="Email" value={getValue(user.email)} />
                  <DetailRow label="Phone" value={getValue(user.phone)} />
                  <DetailRow label="Address" value={getValue(user.address)} />
                  <DetailRow label="Gender" value={capitalizeFirst(getValue(user.gender))} />
                  <DetailRow label="Date of Birth" value={getValue(user.dateOfBirth)} />
                  <DetailRow label="LinkedIn" value={getValue(user.linkedin)} />
                </View>
              </SectionCard>

              {/* Profile Summary Section */}
              <SectionCard
                title="Profile summary"
                icon={JOBDESCRIPTION}
                onEdit={() => navigateToEdit(user)}
              >
                <Text style={styles.summaryText}>{getValue(user.slogan || user.slogans)}</Text>
              </SectionCard>

              {/* Bio Section */}
              <SectionCard
                title="Bio"
                icon={JOBDESCRIPTION}
                onEdit={() => navigateToEdit(user)}
              >
                <Text style={styles.summaryText}>{getValue(user.bio)}</Text>
              </SectionCard>

              {/* Resume Section */}
              <SectionCard
                title="Resume"
                icon={JOBDESCRIPTION}
                onEdit={() => navigateToEdit(user)}
              >
                <Text style={styles.summaryText}>{getResumeName(user.resume)}</Text>
              </SectionCard>

              {/* Professional Details Section */}
              <SectionCard
                title="Professional details"
                icon={EXPERIENCE}
                onEdit={() => navigateToEdit(user)}
              >
                <View style={styles.detailsList}>
                  <DetailRow label="Current salary" value={getValue(user.currentSalary)} />
                  {/* {Array.isArray(user.experience) && user.experience.length > 0 && (
                    user.experience.map((exp, idx) => (
                      <View key={idx}>
                        <DetailRow label={`Company ${idx + 1}`} value={getValue(exp.company || exp.designation)} />
                        <DetailRow label={`Designation ${idx + 1}`} value={getValue(exp.designation)} />
                        <DetailRow label={`Duration ${idx + 1}`} value={getValue(exp.duration)} />
                      </View>
                    ))
                  )}
                  {(!Array.isArray(user.experience) || user.experience.length === 0) && (
                    <DetailRow label="Experience" value="N/A" />
                  )} */}
                </View>
              </SectionCard>

              {/* Technical Skills Section */}
              <SectionCard
                title="Skills"
                icon={SKILLS}
                onEdit={() => navigateToEdit(user)}
              >
                <View style={styles.skillsContainer}>
                  {(() => {
                    const skills = typeof user.skills === 'string'
                      ? user.skills.split(',').map((skill) => skill.trim()).filter(Boolean)
                      : Array.isArray(user.skills)
                      ? user.skills
                      : [];
                    return skills.length > 0 ? (
                      skills.map((skill, index) => (
                        <View key={index} style={styles.skillTag}>
                          <Text style={styles.skillText} numberOfLines={1}>{formatSkillName(skill)}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.detailRowValue}>N/A</Text>
                    );
                  })()}
                </View>
              </SectionCard>
              

              {/* Employment History Section */}
              <SectionCard
                title="Employment History"
                icon={EXPERIENCE}
                showAdd
                onEdit={() => navigateToEdit(user)}
              >
                {Array.isArray(user.experience) && user.experience.length > 0 ? (
                  user.experience.map((exp, index) => (
                    <EmploymentItem key={index} employment={exp} />
                  ))
                ) : (
                  <Text style={styles.detailRowValue}>N/A</Text>
                )}
              </SectionCard>

              {/* Projects Section */}
              {/* <SectionCard
                title="Projects"
                icon={SKILLS}
                showAdd
                onEdit={() => navigateToEdit(user)}
              >
                <Text style={styles.detailRowValue}>N/A</Text>
              </SectionCard> */}

              {/* Certifications Section */}
              <SectionCard
                title="Certifications"
                icon={SKILLS}
                showAdd
                onEdit={() => navigateToEdit(user)}
              >
                {Array.isArray(user.certifications) && user.certifications.length > 0 ? (
                  user.certifications.map((cert, index) => (
                    <View key={index} style={styles.certificationItem}>
                      <Text style={styles.certificationTitle}>{cert.name || 'N/A'}</Text>
                      {cert.year && <Text style={styles.certificationMeta}>Year: {cert.year}</Text>}
                    </View>
                  ))
                ) : (
                  <Text style={styles.detailRowValue}>N/A</Text>
                )}
              </SectionCard>

              {/* Education Section */}
              <SectionCard
                title="Education"
                icon={EDUCATION}
                showAdd
                onEdit={() => navigateToEdit(user)}
              >
                {Array.isArray(user.education) && user.education.length > 0 ? (
                  user.education.map((edu, index) => (
                    <View key={index} style={styles.educationItem}>
                      <Text style={styles.educationDegree}>{edu.course || 'N/A'}</Text>
                      <Text style={styles.educationInstitution}>{edu.institute || 'N/A'}</Text>
                      {edu.cgpa && <Text style={styles.educationDuration}>CGPA: {edu.cgpa}</Text>}
                    </View>
                  ))
                ) : (
                  <Text style={styles.detailRowValue}>N/A</Text>
                )}
              </SectionCard>

              {/* Languages Known Section */}
              <SectionCard
                title="Languages Known"
                icon={LANGUAGE}
                showAdd
                onEdit={() => navigateToEdit(user)}
              >
                {(() => {
                  const languagesValue = user.languages || user.language;
                  const languages = typeof languagesValue === 'string'
                    ? [languagesValue]
                    : Array.isArray(languagesValue)
                    ? languagesValue
                    : [];
                  return languages.length > 0 ? (
                    languages.map((lang, index) => (
                      <LanguageItem key={index} language={lang} />
                    ))
                  ) : (
                    <Text style={styles.detailRowValue}>N/A</Text>
                  );
                })()}
              </SectionCard>
            </>
          )}
        </ScrollView>
      </View>
    </>
  );
};
 
export default UserProfileScreen;
 
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

const SectionCard = ({ title, icon, children, onEdit, showAdd = false }) => (
  <View style={styles.sectionCard}>
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleContainer}>
        {icon && <Image source={icon} style={styles.sectionIcon} />}
      <Text style={styles.sectionTitle}>{title}</Text>
      </View>
        <TouchableOpacity onPress={onEdit} style={styles.editButton}>
        {showAdd ? (
          <Text style={styles.addButtonText}>Add</Text>
        ) : (
          <MaterialCommunityIcons name="pencil" size={18} color="#2196F3" />
      )}
      </TouchableOpacity>
    </View>
    <View style={styles.sectionContent}>
    {children}
    </View>
  </View>
);

const PreferenceItem = ({ label, value }) => (
  <View style={styles.preferenceItem}>
    <Text style={styles.preferenceLabel}>{label}:</Text>
    <Text style={styles.preferenceValue}>{value}</Text>
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

const EmploymentItem = ({ employment }) => {
  const emp = typeof employment === 'string' ? { title: employment } : employment;
  return (
    <View style={styles.employmentItem}>
      <MaterialCommunityIcons name="office-building" size={24} color="#999" />
      <View style={styles.employmentContent}>
        <Text style={styles.employmentTitle}>{emp.companyName || emp.company || 'Company'}</Text>
        <Text style={styles.employmentCompany}>{emp.industryType || emp.type || 'Industry'}</Text>
        <Text style={styles.employmentDuration}>
          {emp.startDate || ''} - {emp.stillWorking ? 'Present' : (emp.endDate || '')}
        </Text>
      </View>
    </View>
  );
};

const ProjectItem = ({ project }) => {
  const proj = typeof project === 'string' ? { name: project } : project;
  return (
    <View style={styles.projectItem}>
      <Text style={styles.projectTitle}>{proj.name || proj.title || 'Project'}</Text>
      <Text style={styles.projectSubtitle}>{proj.company || proj.organization || proj.name || ''}</Text>
      <Text style={styles.projectDuration}>
        {proj.startDate || ''} - {proj.endDate || 'Present'} • {proj.type || 'Full Time'}
      </Text>
    </View>
  );
};

const EducationItem = ({ education }) => {
  const edu = typeof education === 'string' ? { degree: education } : education;
  return (
    <View style={styles.educationItem}>
      <Text style={styles.educationDegree}>{edu.degree || edu.course || 'Degree'}</Text>
      <Text style={styles.educationInstitution}>{edu.institution || edu.school || edu.college || ''}</Text>
      <Text style={styles.educationDuration}>
        {edu.startYear || ''} - {edu.endYear || ''} • {edu.type || 'Full Time'}
      </Text>
    </View>
  );
};

const LanguageItem = ({ language }) => {
  const lang = typeof language === 'string' ? { name: language } : language;
  const languageName = lang.name || language;
  return (
    <View style={styles.languageItem}>
      <Text style={styles.languageName}>{capitalizeFirst(languageName)}</Text>
      <Text style={styles.languageProficiency}>
        {lang.proficiency || 'Read, Write, Speak'}
      </Text>
    </View>
  );
};
 
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
  jobInfo: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
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
  addButtonText: {
    fontSize: 14,
    color: '#2196F3',
    fontFamily: FIRASANSSEMIBOLD,
  },
  sectionContent: {
    marginTop: 4,
  },

  /* Career Preferences */
  preferencesGrid: {
    gap: 12,
  },
  preferenceItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  preferenceLabel: {
    fontSize: 14,
    color: '#666',
    width: 140,
  },
  preferenceValue: {
    fontSize: 14,
    color: BLACK,
    flex: 1,
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

  /* Skills */
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillTag: {
    backgroundColor: '#E8E8E8',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
    flexShrink: 0,
  },
  skillText: {
    fontSize: 13,
    color: BLACK,
  },

  /* Employment */
  employmentItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  employmentContent: {
    flex: 1,
    marginLeft: 12,
  },
  employmentTitle: {
    fontSize: 15,
    fontFamily: FIRASANSSEMIBOLD,
    color: BLACK,
    marginBottom: 4,
  },
  employmentCompany: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  employmentDuration: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  employmentDescription: {
    fontSize: 13,
    color: BLACK,
    lineHeight: 18,
  },

  /* Projects */
  projectItem: {
    marginBottom: 16,
  },
  projectTitle: {
    fontSize: 15,
    fontFamily: FIRASANSSEMIBOLD,
    color: BLACK,
    marginBottom: 4,
  },
  projectSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  projectDuration: {
    fontSize: 13,
    color: '#666',
  },

  /* Education */
  educationItem: {
    marginBottom: 16,
  },
  educationDegree: {
    fontSize: 15,
    fontFamily: FIRASANSSEMIBOLD,
    color: BLACK,
    marginBottom: 4,
  },
  educationInstitution: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  educationDuration: {
    fontSize: 13,
    color: '#666',
  },

  /* Accomplishments */
  accomplishmentsScroll: {
    marginVertical: 8,
  },
  accomplishmentButton: {
    backgroundColor: '#E8E8E8',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
  },
  accomplishmentText: {
    fontSize: 14,
    color: BLACK,
  },

  /* Certifications */
  certificationItem: {
    marginBottom: 12,
  },
  certificationTitle: {
    fontSize: 14,
    fontFamily: FIRASANSSEMIBOLD,
    color: BLACK,
  },
  certificationMeta: {
    fontSize: 13,
    color: '#666',
  },

  /* Languages */
  languageItem: {
    marginBottom: 12,
  },
  languageName: {
    fontSize: 14,
    color: BLACK,
    marginBottom: 4,
  },
  languageProficiency: {
    fontSize: 13,
    color: '#666',
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
});