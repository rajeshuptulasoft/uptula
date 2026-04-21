import React, { useEffect, useState, useCallback } from "react";
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
  Image,
  RefreshControl,
  Modal,
  KeyboardAvoidingView,
  ScrollView,
  Pressable,
} from "react-native";
import { useNavigation, useFocusEffect, useRoute } from "@react-navigation/native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { Picker } from "@react-native-picker/picker";
import { launchImageLibrary } from "react-native-image-picker";
import { BLACK, BRANDCOLOR, WHITE } from "../../../constant/color";
import { HEIGHT, WIDTH } from "../../../constant/config";
import { MyHeader } from "../../../components/commonComponents/MyHeader";
import { MyAlert } from "../../../components/commonComponents/MyAlert";
import { ToastMessage } from "../../../components/commonComponents/ToastMessage";
import { TextInputComponent } from "../../../components/commonComponents/TextInputComponent";
import { CustomButton } from "../../../components/commonComponents/Button";
import {
  DELETE,
  EDIT,
  LOGO,
  COMPANYNAME,
  JOBDESCRIPTION,
  JOBTITLE,
  QUALIFICATION,
  SKILLS,
  VACANCY,
  MAIL,
  PHONE,
  FACEBOOK,
  GOOGLE,
  TWITTER,
  LINKEDIN,
  PRINTREST,
  INSTAGRAM,
  WEBSITE,
  ADDRESS,
  PINCODE,
  STATE,
  COUNTRY,
  DROPDOWN,
  GENERALINFORMATION,
  UPLOADIMAGE,
  SOCIALACCOUNT,
} from "../../../constant/imagePath";
import { BASE_URL } from "../../../constant/url";
import { GETNETWORK, PUTNETWORK } from "../../../utils/Network";
import { getObjByKey } from "../../../utils/Storage";
import { COMICSBOLD, UBUNTUBOLD, UBUNTU, FIRASANSSEMIBOLD, ROBOTOSEMIBOLD, CANTARELLBOLD, FIRASANSBOLD } from "../../../constant/fontPath";

// Edit Job Modal Component
const EditJobModal = ({ visible, jobData, onClose, onSave }) => {
  // General Information Section
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyLogo, setCompanyLogo] = useState(null);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [salary, setSalary] = useState("");
  const [vacancy, setVacancy] = useState("");
  const [experience, setExperience] = useState("");
  const [jobType, setJobType] = useState("");
  const [qualification, setQualification] = useState("");
  const [skills, setSkills] = useState("");
  const [status, setStatus] = useState("active");

  // Company Address Section
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [pinCode, setPinCode] = useState("");

  // Social Account Section
  const [facebook, setFacebook] = useState("");
  const [google, setGoogle] = useState("");
  const [twitter, setTwitter] = useState("");
  const [linkedIn, setLinkedIn] = useState("");
  const [pinterest, setPinterest] = useState("");
  const [instagram, setInstagram] = useState("");

  // Loading state
  const [isUpdating, setIsUpdating] = useState(false);

  // Helper function to map category from API to picker value
  const mapCategoryToValue = (categoryStr) => {
    if (!categoryStr) return "";
    const categoryMap = {
      "Information Technology": "IT",
      "IT": "IT",
      "Hardware": "Hardware",
      "Mechanical": "Mechanical",
      "Health Care": "HealthCare",
      "HealthCare": "HealthCare",
      "Finance": "Finance",
      "Education": "Education",
      "Marketing": "Marketing",
      "Other": "Other",
    };
    return categoryMap[categoryStr] || categoryStr;
  };

  // Helper function to map job type from API to picker value
  const mapJobTypeToValue = (jobTypeStr) => {
    if (!jobTypeStr) return "";
    const jobTypeMap = {
      "Full Time": "FullTime",
      "FullTime": "FullTime",
      "Part Time": "PartTime",
      "PartTime": "PartTime",
      "Freelancer": "Freelancer",
      "Contract": "Contract",
      "Internship": "Internship",
    };
    return jobTypeMap[jobTypeStr] || jobTypeStr;
  };

  // Helper function to normalize salary range
  const normalizeSalaryRange = (salaryStr) => {
    if (!salaryStr) return "";
    // Handle different formats
    if (salaryStr === "Negotiable" || salaryStr.toLowerCase() === "negotiable") {
      return "Negotiable";
    }
    // Check if it matches our format
    if (salaryStr.includes("-")) {
      const parts = salaryStr.split("-");
      if (parts.length === 2) {
        const min = parts[0].trim().replace(/,/g, "");
        const max = parts[1].trim().replace(/,/g, "");
        return `${min}-${max}`;
      }
    }
    return salaryStr;
  };

  // Load job data when modal opens
  React.useEffect(() => {
    if (visible && jobData) {
      setJobTitle(jobData.job_title || jobData.title || "");
      setCompanyName(jobData.company_name || jobData.companyName || "");
      setCompanyLogo(jobData.company_logo || jobData.companyLogo || null);
      setCategory(mapCategoryToValue(jobData.category || ""));
      setDescription(jobData.description || "");
      setSalary(normalizeSalaryRange(jobData.salary_range || jobData.salaryRange || ""));
      setVacancy(jobData.no_of_vacancy?.toString() || jobData.vacancy || "");
      setExperience(jobData.experience || "");
      setJobType(mapJobTypeToValue(jobData.job_type || jobData.jobType || ""));
      setQualification(jobData.qualification || "");
      setSkills(jobData.skills || "");
      setStatus(jobData.status || "active");
      setEmail(jobData.email || "");
      setPhoneNumber(jobData.phone || jobData.phoneNumber || "");
      setWebsite(jobData.website || "");
      setAddress(jobData.address || "");
      setCity(jobData.city || "");
      setState(jobData.state || "");
      setCountry(jobData.country || "");
      setPinCode(jobData.zip_code || jobData.pinCode || "");
      setFacebook(jobData.facebook || "");
      setGoogle(jobData.google || "");
      setTwitter(jobData.twitter || "");
      setLinkedIn(jobData.linkedin || jobData.linkedIn || "");
      setPinterest(jobData.pinterest || "");
      setInstagram(jobData.instagram || "");
    } else if (!visible) {
      // Reset all fields when modal closes
      setJobTitle("");
      setCompanyName("");
      setCompanyLogo(null);
      setCategory("");
      setDescription("");
      setSalary("");
      setVacancy("");
      setExperience("");
      setJobType("");
      setQualification("");
      setSkills("");
      setStatus("active");
      setEmail("");
      setPhoneNumber("");
      setWebsite("");
      setAddress("");
      setCity("");
      setState("");
      setCountry("");
      setPinCode("");
      setFacebook("");
      setGoogle("");
      setTwitter("");
      setLinkedIn("");
      setPinterest("");
      setInstagram("");
    }
  }, [visible, jobData]);

  const pickCompanyLogo = async () => {
    const res = await launchImageLibrary({ mediaType: "photo" });
    if (!res.didCancel && res.assets?.length) {
      setCompanyLogo(res.assets[0]);
    }
  };

  const handlePinCodeChange = (pin) => {
    setPinCode(pin);
  };

  // Helper functions to get display text for dropdowns
  const getCategoryLabel = () => {
    if (!category) return "Select Company category";
    const categoryMap = {
      "IT": "Information Technology",
      "Hardware": "Hardware",
      "Mechanical": "Mechanical",
      "HealthCare": "Health Care",
      "Finance": "Finance",
      "Education": "Education",
      "Marketing": "Marketing",
      "Other": "Other",
    };
    return categoryMap[category] || category;
  };

  const getSalaryLabel = () => {
    if (!salary) return "Select salary range";
    if (salary === "Negotiable") return "Negotiable";
    const salaryMap = {
      "20000-30000": "20,000 - 30,000",
      "50000-80000": "50,000 - 80,000",
      "80000-120000": "80,000 - 120,000",
      "120000+": "120,000+",
    };
    return salaryMap[salary] || salary;
  };

  const getExperienceLabel = () => {
    if (!experience) return "Select experience";
    return experience;
  };

  const getJobTypeLabel = () => {
    if (!jobType) return "Select job type";
    const jobTypeMap = {
      "FullTime": "Full Time",
      "PartTime": "Part Time",
      "Freelancer": "Freelancer",
      "Contract": "Contract",
      "Internship": "Internship",
    };
    return jobTypeMap[jobType] || jobType;
  };

  const getCityLabel = () => {
    if (!city) return "Select city";
    return city;
  };

  const handleSave = async () => {
    try {
      setIsUpdating(true);
      
      // Get token from storage
      const loginResponse = await getObjByKey('loginResponse');
      if (!loginResponse || !loginResponse.token) {
        onClose();
        return;
      }

      // Get job ID
      const jobId = jobData?.id || jobData?._id || jobData?.job_id;
      if (!jobId) {
        onClose();
        return;
      }

      // Prepare the data for API (only include fields with values)
      const updateData = {
        jobTitle: jobTitle,
        jobType: jobType,
        qualification: qualification,
        skills: skills,
        companyName: companyName,
        category: category,
        salaryRange: salary,
        noOfVacancy: parseInt(vacancy) || 0,
        status: status,
      };

      // Only add optional fields if they have values
      if (companyLogo && companyLogo !== null) {
        updateData.companyLogo = companyLogo;
      }
      if (email && email.trim() !== "") {
        updateData.email = email;
      }
      if (phoneNumber && phoneNumber.trim() !== "") {
        updateData.phone = phoneNumber;
      }
      if (website && website.trim() !== "") {
        updateData.website = website;
      }
      if (address && address.trim() !== "") {
        updateData.address = address;
      }
      if (city && city.trim() !== "") {
        updateData.city = city;
      }
      if (state && state.trim() !== "") {
        updateData.state = state;
      }
      if (country && country.trim() !== "") {
        updateData.country = country;
      }
      if (pinCode && pinCode.trim() !== "") {
        updateData.zipCode = pinCode;
      }
      if (facebook && facebook.trim() !== "") {
        updateData.facebook = facebook;
      }
      if (google && google.trim() !== "") {
        updateData.google = google;
      }
      if (twitter && twitter.trim() !== "") {
        updateData.twitter = twitter;
      }
      if (linkedIn && linkedIn.trim() !== "") {
        updateData.linkedin = linkedIn;
      }
      if (pinterest && pinterest.trim() !== "") {
        updateData.pinterest = pinterest;
      }
      if (instagram && instagram.trim() !== "") {
        updateData.instagram = instagram;
      }

      const url = `${BASE_URL}employer/jobs/${jobId}`;
      const result = await PUTNETWORK(url, updateData, true);

      if (result && !result.error && !result.errors) {
        // Update the job in the local state
        const updatedJob = {
          ...jobData,
          job_title: jobTitle,
          company_name: companyName,
          company_logo: companyLogo,
          category: category,
          description: description,
          salary_range: salary,
          no_of_vacancy: parseInt(vacancy) || 0,
          experience: experience,
          job_type: jobType,
          qualification: qualification,
          skills: skills,
          status: status,
          email: email,
          phone: phoneNumber,
          website: website,
          address: address,
          city: city,
          state: state,
          country: country,
          zip_code: pinCode,
          facebook: facebook,
          google: google,
          twitter: twitter,
          linkedin: linkedIn,
          pinterest: pinterest,
          instagram: instagram,
        };
        onSave(updatedJob);
      } else {
        onClose();
      }
    } catch (error) {
      onClose();
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Modal
      statusBarTranslucent={true}
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Job</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color={BLACK} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
          >
            {/* General Information */}
            <View style={styles.sectionHeadingContainer}>
              <Image source={GENERALINFORMATION} style={styles.sectionIcon} />
              <Text style={styles.sectionHeading}>General Information</Text>
            </View>

            <TextInputComponent
              placeholder="Job Title"
              inputdata={jobTitle}
              setInputdata={setJobTitle}
              borderColor={BRANDCOLOR}
              width="95%"
              image={JOBTITLE}
            />

            <TextInputComponent
              placeholder="Company Name"
              inputdata={companyName}
              setInputdata={setCompanyName}
              borderColor={BRANDCOLOR}
              width="95%"
              image={COMPANYNAME}
            />

            <Pressable style={styles.logoBox} onPress={pickCompanyLogo}>
              {companyLogo ? (
                <Image
                  source={{ uri: companyLogo.uri || companyLogo }}
                  style={styles.logoImage}
                />
              ) : (
                <View style={styles.logoTextContainer}>
                  <Image source={UPLOADIMAGE} style={styles.uploadIcon} />
                  <Text style={styles.logoText}>Choose Company Logo</Text>
                </View>
              )}
            </Pressable>

            <Text style={styles.label}>Company Category</Text>
            <View style={styles.pickerWrapper}>
              <View style={styles.pickerContainer}>
                <View style={styles.pickerTextContainer}>
                  <Text style={styles.pickerSelectedText}>{getCategoryLabel()}</Text>
                </View>
                <Picker
                  selectedValue={category}
                  onValueChange={setCategory}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                >
                  <Picker.Item label="Select Company category" value="" />
                  <Picker.Item label="Information Technology" value="IT" />
                  <Picker.Item label="Hardware" value="Hardware" />
                  <Picker.Item label="Mechanical" value="Mechanical" />
                  <Picker.Item label="Health Care" value="HealthCare" />
                  <Picker.Item label="Finance" value="Finance" />
                  <Picker.Item label="Education" value="Education" />
                  <Picker.Item label="Marketing" value="Marketing" />
                  <Picker.Item label="Other" value="Other" />
                </Picker>
                <Image source={DROPDOWN} style={styles.dropdownIcon} />
              </View>
            </View>

            <TextInputComponent
              placeholder="Job Description"
              inputdata={description}
              setInputdata={setDescription}
              borderColor={BRANDCOLOR}
              width="95%"
              maxLength={500}
              image={JOBDESCRIPTION}
            />

            <Text style={styles.label}>Salary Range</Text>
            <View style={styles.pickerWrapper}>
              <View style={styles.pickerContainer}>
                <View style={styles.pickerTextContainer}>
                  <Text style={styles.pickerSelectedText}>{getSalaryLabel()}</Text>
                </View>
                <Picker
                  selectedValue={salary}
                  onValueChange={setSalary}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                >
                  <Picker.Item label="Select salary range" value="" />
                  <Picker.Item label="20,000 - 30,000" value="20000-30000" />
                  <Picker.Item label="50,000 - 80,000" value="50000-80000" />
                  <Picker.Item label="80,000 - 120,000" value="80000-120000" />
                  <Picker.Item label="120,000+" value="120000+" />
                  <Picker.Item label="Negotiable" value="Negotiable" />
                </Picker>
                <Image source={DROPDOWN} style={styles.dropdownIcon} />
              </View>
            </View>

            <TextInputComponent
              placeholder="Number of Vacancies"
              type="number"
              keyboardType="numeric"
              inputdata={vacancy}
              setInputdata={setVacancy}
              borderColor={BRANDCOLOR}
              width="95%"
              image={VACANCY}
            />

            <Text style={styles.label}>Experience Required</Text>
            <View style={styles.pickerWrapper}>
              <View style={styles.pickerContainer}>
                <View style={styles.pickerTextContainer}>
                  <Text style={styles.pickerSelectedText}>{getExperienceLabel()}</Text>
                </View>
                <Picker
                  selectedValue={experience}
                  onValueChange={setExperience}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                >
                  <Picker.Item label="Select experience" value="" />
                  <Picker.Item label="0–6 Months" value="0-6 months" />
                  <Picker.Item label="1 Year" value="1 year" />
                  <Picker.Item label="2 Years" value="2 years" />
                  <Picker.Item label="3 Years" value="3 years" />
                  <Picker.Item label="4 Years" value="4 years" />
                  <Picker.Item label="5+ Years" value="5+ years" />
                </Picker>
                <Image source={DROPDOWN} style={styles.dropdownIcon} />
              </View>
            </View>

            <Text style={styles.label}>Job Type</Text>
            <View style={styles.pickerWrapper}>
              <View style={styles.pickerContainer}>
                <View style={styles.pickerTextContainer}>
                  <Text style={styles.pickerSelectedText}>{getJobTypeLabel()}</Text>
                </View>
                <Picker
                  selectedValue={jobType}
                  onValueChange={setJobType}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                >
                  <Picker.Item label="Select job type" value="" />
                  <Picker.Item label="Full Time" value="FullTime" />
                  <Picker.Item label="Part Time" value="PartTime" />
                  <Picker.Item label="Freelancer" value="Freelancer" />
                  <Picker.Item label="Contract" value="Contract" />
                  <Picker.Item label="Internship" value="Internship" />
                </Picker>
                <Image source={DROPDOWN} style={styles.dropdownIcon} />
              </View>
            </View>

            <TextInputComponent
              placeholder="Qualification Required"
              inputdata={qualification}
              setInputdata={setQualification}
              borderColor={BRANDCOLOR}
              width="95%"
              image={QUALIFICATION}
            />

            <TextInputComponent
              placeholder="Skills (comma separated)"
              inputdata={skills}
              setInputdata={setSkills}
              borderColor={BRANDCOLOR}
              width="95%"
              image={SKILLS}
            />

            {/* Company Address */}
            <View style={styles.sectionHeadingContainer}>
              <Image source={COMPANYNAME} style={styles.sectionIcon} />
              <Text style={styles.sectionHeading}>Company Address</Text>
            </View>

            <TextInputComponent
              placeholder="Email"
              type="email"
              keyboardType="email-address"
              autoCapitalize="none"
              inputdata={email}
              setInputdata={setEmail}
              borderColor={BRANDCOLOR}
              width="95%"
              image={MAIL}
            />

            <TextInputComponent
              placeholder="Phone Number"
              type="number"
              keyboardType="phone-pad"
              inputdata={phoneNumber}
              setInputdata={setPhoneNumber}
              borderColor={BRANDCOLOR}
              width="95%"
              image={PHONE}
            />

            <TextInputComponent
              placeholder="Website Links"
              type="url"
              keyboardType="url"
              autoCapitalize="none"
              inputdata={website}
              setInputdata={setWebsite}
              borderColor={BRANDCOLOR}
              width="95%"
              image={WEBSITE}
            />

            <TextInputComponent
              placeholder="Address"
              inputdata={address}
              setInputdata={setAddress}
              borderColor={BRANDCOLOR}
              width="95%"
              image={ADDRESS}
            />

            <Text style={styles.label}>City</Text>
            <View style={styles.pickerWrapper}>
              <View style={styles.pickerContainer}>
                <View style={styles.pickerTextContainer}>
                  <Text style={styles.pickerSelectedText}>{getCityLabel()}</Text>
                </View>
                <Picker
                  selectedValue={city}
                  onValueChange={setCity}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                >
                  <Picker.Item label="Select city" value="" />
                  <Picker.Item label="Mumbai" value="Mumbai" />
                  <Picker.Item label="Delhi" value="Delhi" />
                  <Picker.Item label="Bangalore" value="Bangalore" />
                  <Picker.Item label="Hyderabad" value="Hyderabad" />
                  <Picker.Item label="Chennai" value="Chennai" />
                  <Picker.Item label="Kolkata" value="Kolkata" />
                  <Picker.Item label="Pune" value="Pune" />
                  <Picker.Item label="Ahmedabad" value="Ahmedabad" />
                  <Picker.Item label="Jaipur" value="Jaipur" />
                  <Picker.Item label="Surat" value="Surat" />
                </Picker>
                <Image source={DROPDOWN} style={styles.dropdownIcon} />
              </View>
            </View>

            <TextInputComponent
              placeholder="PinCode"
              type="number"
              keyboardType="numeric"
              inputdata={pinCode}
              setInputdata={handlePinCodeChange}
              borderColor={BRANDCOLOR}
              width="95%"
              image={PINCODE}
            />

            <TextInputComponent
              placeholder="State"
              inputdata={state}
              setInputdata={setState}
              borderColor={BRANDCOLOR}
              width="95%"
              image={STATE}
              editable={true}
            />

            <TextInputComponent
              placeholder="Country"
              inputdata={country}
              setInputdata={setCountry}
              borderColor={BRANDCOLOR}
              width="95%"
              image={COUNTRY}
              editable={true}
            />

            {/* Social Account */}
            <View style={styles.sectionHeadingContainer}>
              <Image source={SOCIALACCOUNT} style={styles.sectionIcon} />
              <Text style={styles.sectionHeading}>Social Account</Text>
            </View>

            <TextInputComponent
              placeholder="Facebook Link"
              type="url"
              keyboardType="url"
              autoCapitalize="none"
              inputdata={facebook}
              setInputdata={setFacebook}
              borderColor={BRANDCOLOR}
              width="95%"
              image={FACEBOOK}
            />

            <TextInputComponent
              placeholder="Google Link"
              type="url"
              keyboardType="url"
              autoCapitalize="none"
              inputdata={google}
              setInputdata={setGoogle}
              borderColor={BRANDCOLOR}
              width="95%"
              image={GOOGLE}
            />

            <TextInputComponent
              placeholder="Twitter Link"
              type="url"
              keyboardType="url"
              autoCapitalize="none"
              inputdata={twitter}
              setInputdata={setTwitter}
              borderColor={BRANDCOLOR}
              width="95%"
              image={TWITTER}
            />

            <TextInputComponent
              placeholder="LinkedIn Link"
              type="url"
              keyboardType="url"
              autoCapitalize="none"
              inputdata={linkedIn}
              setInputdata={setLinkedIn}
              borderColor={BRANDCOLOR}
              width="95%"
              image={LINKEDIN}
            />

            <TextInputComponent
              placeholder="Pinterest Link"
              type="url"
              keyboardType="url"
              autoCapitalize="none"
              inputdata={pinterest}
              setInputdata={setPinterest}
              borderColor={BRANDCOLOR}
              width="95%"
              image={PRINTREST}
            />

            <TextInputComponent
              placeholder="Instagram Link"
              type="url"
              keyboardType="url"
              autoCapitalize="none"
              inputdata={instagram}
              setInputdata={setInstagram}
              borderColor={BRANDCOLOR}
              width="95%"
              image={INSTAGRAM}
            />

            {/* Status */}
            <View style={styles.sectionHeadingContainer}>
              <MaterialCommunityIcons name="information" size={24} color={BRANDCOLOR} />
              <Text style={styles.sectionHeading}>Job Status</Text>
            </View>

            <View style={styles.statusContainer}>
              <Text style={styles.statusLabel}>Status:</Text>
              <View style={styles.statusToggleContainer}>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    status === "active" && styles.statusButtonActive,
                  ]}
                  onPress={() => setStatus("active")}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.statusButtonText,
                      status === "active" && styles.statusButtonTextActive,
                    ]}
                  >
                    Active
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    status === "inactive" && styles.statusButtonInactive,
                  ]}
                  onPress={() => setStatus("inactive")}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.statusButtonText,
                      status === "inactive" && styles.statusButtonTextInactive,
                    ]}
                  >
                    Inactive
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalButtons}>
            <CustomButton
              text="Cancel"
              onPress={onClose}
              backgroundColor="#E0E0E0"
              color={BLACK}
              width="45%"
              disabled={isUpdating}
            />
            <CustomButton
              text={isUpdating ? "Updating..." : "Save"}
              onPress={handleSave}
              backgroundColor={BRANDCOLOR}
              color={WHITE}
              width="45%"
              disabled={isUpdating}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const ManageJobScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [jobs, setJobs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteAlertVisible, setDeleteAlertVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [toastMessage, setToastMessage] = useState({
    type: "",
    msg: "",
    visible: false,
  });

  // Fetch jobs from API
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const url = `${BASE_URL}employer/jobs`;
      const result = await GETNETWORK(url, true);

      // Handle different response structures
      let jobsData = [];
      if (Array.isArray(result)) {
        jobsData = result;
      } else if (result?.data && Array.isArray(result.data)) {
        jobsData = result.data;
      } else if (result?.jobs && Array.isArray(result.jobs)) {
        jobsData = result.jobs;
      } else if (result?.data?.jobs && Array.isArray(result.data.jobs)) {
        jobsData = result.data.jobs;
      }

      if (jobsData && jobsData.length > 0) {
        setJobs(jobsData);
      } else {
        setJobs([]);
      }
    } catch (error) {
      setJobs([]);
      setToastMessage({
        type: "error",
        msg: "Failed to load jobs. Please try again.",
        visible: false,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch jobs on component mount
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Check for editJob param on mount
  useEffect(() => {
    if (route.params?.editJob) {
      setSelectedJob(route.params.editJob);
      setEditModalVisible(true);
      // Clear the param
      navigation.setParams({ editJob: undefined });
    }
  }, [route.params?.editJob, navigation]);

  // Refetch jobs when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchJobs();
      // Check if we need to open edit modal
      if (route.params?.editJob) {
        setSelectedJob(route.params.editJob);
        setEditModalVisible(true);
        // Clear the param
        navigation.setParams({ editJob: undefined });
      }
    }, [fetchJobs, navigation, route.params])
  );

  // Handle back button press
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      navigation.goBack();
      return true;
    });

    return () => backHandler.remove();
  }, [navigation]);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchJobs();
  }, [fetchJobs]);

  const handleEdit = (job, event) => {
    // Prevent card press when clicking edit button
    if (event) {
      event.stopPropagation();
    }
    setSelectedJob(job);
    setEditModalVisible(true);
  };

  const handleCardPress = (item) => {
    // Navigate to ManageJobDetailsScreen
    navigation.navigate("ManageJobDetails", { jobData: item });
  };

  const handleEditSave = (updatedJob) => {
    // Update the job in the list
    setJobs(jobs.map((job) => {
      const jobId = job.id || job.job_id || job._id;
      const updatedJobId = updatedJob.id || updatedJob.job_id || updatedJob._id;
      if (jobId === updatedJobId) {
        return updatedJob;
      }
      return job;
    }));
    setEditModalVisible(false);
    setSelectedJob(null);
    setToastMessage({
      type: "success",
      msg: "Job updated successfully",
      visible: true,
    });
  };

  const handleEditClose = () => {
    setEditModalVisible(false);
    setSelectedJob(null);
  };

  const handleDelete = (job) => {
    setSelectedJob(job);
    setDeleteAlertVisible(true);
  };

  const confirmDelete = async () => {
    if (!selectedJob) {
      // console.log('❌ Delete failed: No job selected');
      return;
    }

    try {
      // console.log('🔄 Starting job delete process...');
      
      // Get job ID
      const jobId = selectedJob.id || selectedJob.job_id || selectedJob._id;
      if (!jobId) {
        // console.error('❌ Error: No job ID found in selectedJob');
        // console.error('❌ Delete failed: Job ID is required');
        setToastMessage({
          type: "error",
          msg: "Job ID not found",
          visible: true,
        });
        setDeleteAlertVisible(false);
        setSelectedJob(null);
        return;
      }
      // console.log('✅ Job ID found:', jobId);

      // Get token from storage
      const loginResponse = await getObjByKey('loginResponse');
      if (!loginResponse || !loginResponse.token) {
        // console.error('❌ Error: No token found in loginResponse');
        // console.error('❌ Delete failed: Authentication token is missing');
        setToastMessage({
          type: "error",
          msg: "Authentication required",
          visible: true,
        });
        setDeleteAlertVisible(false);
        setSelectedJob(null);
        return;
      }
      // console.log('✅ Token found:', loginResponse.token.substring(0, 20) + '...');

      const url = `${BASE_URL}employer/jobs/${jobId}`;
      // console.log('📡 Delete URL:', url);

      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": `Bearer ${loginResponse.token}`,
        },
      });

      const result = await response.json();
      // console.log('📥 API Response:', JSON.stringify(result, null, 2));

      if (response.ok || result.statusCode === 200 || result.statusCode === 201) {
        // console.log('✅ SUCCESS: Job deleted successfully!');
        // console.log('✅ Deleted job ID:', jobId);
        
        setToastMessage({
          type: "success",
          msg: "Job deleted successfully",
          visible: true,
        });
        // Remove job from list
        setJobs(jobs.filter((job) => {
          const currentJobId = job.id || job.job_id || job._id;
          return currentJobId !== jobId;
        }));
      } else {
        // console.error('❌ ERROR: Failed to delete job');
        // console.error('❌ Response status:', response.status);
        // console.error('❌ Response message:', result.message);
        // console.error('❌ Full response:', JSON.stringify(result, null, 2));
        
        setToastMessage({
          type: "error",
          msg: result.message || "Failed to delete job",
          visible: true,
        });
      }
    } catch (error) {
      // console.error('❌ ERROR: Exception occurred while deleting job');
      // console.error('❌ Error details:', error);
      // console.error('❌ Error message:', error.message);
      // console.error('❌ Error stack:', error.stack);
      
      setToastMessage({
        type: "error",
        msg: "Failed to delete job. Please try again.",
        visible: true,
      });
    } finally {
      setDeleteAlertVisible(false);
      setSelectedJob(null);
      // console.log('🏁 Job delete process completed');
    }
  };

  const cancelDelete = () => {
    setDeleteAlertVisible(false);
    setSelectedJob(null);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      return "—";
    }
  };

  // Format city: first letter capitalized
  const formatCity = (city) => {
    if (!city) return '';
    return city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
  };

  // Render job item as card
  const renderJobItem = ({ item }) => {
    const jobTitle = item.job_title || item.title || "Untitled";
    const companyName = item.company_name || item.company || "Company";
    const city = item.city || null;
    const formattedCity = city ? formatCity(city) : null;
    const email = item.email || null;
    const postedDate = formatDate(item.created_at || item.posted_date || item.createdAt);

    // Construct logo URL if it's a relative path
    const logoUrl = item.company_logo 
      ? (item.company_logo.startsWith('http://') || item.company_logo.startsWith('https://') 
          ? item.company_logo 
          : `${BASE_URL.replace('/api/', '/')}${item.company_logo.replace(/^\//, '')}`)
      : null;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleCardPress(item)}
        activeOpacity={0.8}
      >
        {/* Card Content - All in one row */}
        <View style={styles.cardContent}>
          {/* Left: Logo */}
          <View style={styles.cardLogoContainer}>
            {logoUrl ? (
              <Image 
                source={{ uri: logoUrl }} 
                style={styles.cardLogo} 
                resizeMode="contain"
                defaultSource={LOGO}
              />
            ) : (
              <Image 
                source={LOGO} 
                style={styles.cardLogo} 
                resizeMode="contain"
              />
            )}
          </View>

          {/* Middle: Job Info */}
          <View style={styles.cardInfoContainer}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {jobTitle}
              </Text>
              <View style={styles.cardActionsRow}>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleEdit(item);
                  }}
                  activeOpacity={0.7}
                >
                  <Image source={EDIT} style={styles.actionIcon} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDelete(item);
                  }}
                  activeOpacity={0.7}
                >
                  <Image source={DELETE} style={styles.actionIcon} />
                </TouchableOpacity>
              </View>
            </View>
            
              <View style={styles.badge}>
                <Text style={styles.badgeText} numberOfLines={1}>
                  {companyName}
                </Text>
        </View>

            {/* Info sections side by side */}
            <View style={styles.cardInfoRow}>
              {formattedCity && (
                <View style={styles.infoItem}>
                  <MaterialCommunityIcons name="map-marker-outline" size={14} color={BRANDCOLOR} />
              <Text style={styles.cardInfoText} numberOfLines={1}>
                    {formattedCity}
              </Text>
            </View>
          )}
          {email && (
                <View style={styles.infoItem}>
                  <MaterialCommunityIcons name="email-outline" size={14} color={BRANDCOLOR} />
              <Text style={styles.cardInfoText} numberOfLines={1}>
                {email}
              </Text>
            </View>
          )}
          {postedDate !== "—" && (
                <View style={styles.infoItem}>
                  <MaterialCommunityIcons name="calendar-outline" size={14} color={BRANDCOLOR} />
              <Text style={styles.cardInfoText}>{postedDate}</Text>
            </View>
          )}
        </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const Container = Platform.OS === "ios" ? SafeAreaView : View;

  return (
    <>
      <StatusBar
        barStyle={Platform.OS === "ios" ? "dark-content" : "dark-content"}
        backgroundColor={WHITE}
        translucent={Platform.OS === "android"}
      />
      <Container
        style={[
          styles.container,
          Platform.OS === "ios" && styles.containerIOS,
          Platform.OS === "android" && styles.containerAndroid,
        ]}
      >
        <MyHeader
          showBack
          showCenterTitle
          title="Manage Jobs"
          onBackPress={handleBackPress}
        />

        {/* Jobs List */}
        {loading && jobs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Loading jobs...</Text>
          </View>
        ) : jobs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No jobs found</Text>
          </View>
        ) : (
          <FlatList
            data={jobs}
            renderItem={renderJobItem}
            keyExtractor={(item, index) =>
              (item.id || item.job_id || index).toString()
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[BRANDCOLOR]}
                tintColor={BRANDCOLOR}
              />
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}

        {/* Edit Job Modal */}
        <EditJobModal
          visible={editModalVisible}
          jobData={selectedJob}
          onClose={handleEditClose}
          onSave={handleEditSave}
        />

        {/* Delete Confirmation Alert */}
        <MyAlert
          visible={deleteAlertVisible}
          title="Delete Job"
          message="Are you sure you want to delete this job? This action cannot be undone."
          textLeft="Cancel"
          textRight="Delete"
          backgroundColor={BRANDCOLOR}
          color={WHITE}
          onPressLeft={cancelDelete}
          onPressRight={confirmDelete}
          onRequestClose={cancelDelete}
        />

        {/* Toast Message */}
        <ToastMessage
          type={toastMessage.type}
          message={toastMessage.msg}
          visible={toastMessage.visible}
          setVisible={({ visible }) =>
            setToastMessage((prev) => ({ ...prev, visible }))
          }
          bacgroundColor={toastMessage.type === "success" ? "green" : toastMessage.type === "error" ? "red" : "#2196F3"}
          textColor={WHITE}
          duration={3000}
        />
      </Container>
    </>
  );
};

export default ManageJobScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  containerIOS: {
    paddingTop: Platform.OS === "ios" ? 0 : 0,
  },
  containerAndroid: {
    paddingTop: Platform.OS === "android" ? 0 : 0,
  },
  listContent: {
    padding: WIDTH * 0.04,
    paddingBottom: HEIGHT * 0.02,
  },
  separator: {
    height: HEIGHT * 0.015,
  },
  card: {
    backgroundColor: WHITE,
    borderRadius: 12,
    padding: WIDTH * 0.03,
    marginBottom: HEIGHT * 0.012,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardLogoContainer: {
    marginRight: WIDTH * 0.025,
  },
  cardLogo: {
    width: WIDTH * 0.12,
    height: WIDTH * 0.12,
    borderRadius: WIDTH * 0.02,
    backgroundColor: "#F8F9FA",
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  cardInfoContainer: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: HEIGHT * 0.005,
  },
  cardTitle: {
    fontSize: HEIGHT * 0.018,
    fontFamily: UBUNTUBOLD,
    color: BLACK,
    flex: 1,
    marginRight: WIDTH * 0.02,
  },
  cardActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: WIDTH * 0.02,
  },
  iconButton: {
    padding: WIDTH * 0.015,
  },
  actionIcon: {
    width: WIDTH * 0.05,
    height: WIDTH * 0.05,
    resizeMode: "contain",
  },
  badge: {
    backgroundColor: "#E8F5E9",
    borderRadius: 6,
    paddingHorizontal: WIDTH * 0.025,
    paddingVertical: HEIGHT * 0.004,
    alignSelf: "flex-start",
    marginBottom: HEIGHT * 0.008,
  },
  badgeText: {
    fontSize: HEIGHT * 0.013,
    color: "#2E7D32",
    fontFamily: FIRASANSSEMIBOLD,
  },
  cardInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: WIDTH * 0.02,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: WIDTH * 0.015,
    marginRight: WIDTH * 0.02,
  },
  cardInfoText: {
    fontSize: HEIGHT * 0.014,
    color: "#666",
    fontFamily: UBUNTU,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: WIDTH * 0.05,
  },
  emptyText: {
    fontSize: HEIGHT * 0.018,
    color: "#666",
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: WHITE,
    borderTopLeftRadius: WIDTH * 0.05,
    borderTopRightRadius: WIDTH * 0.05,
    maxHeight: "90%",
    paddingBottom: Platform.OS === "ios" ? HEIGHT * 0.025 : HEIGHT * 0.012,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: WIDTH * 0.04,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  modalTitle: {
    fontSize: HEIGHT * 0.02,
    fontFamily: UBUNTUBOLD,
    color: BLACK,
  },
  modalScrollContent: {
    padding: WIDTH * 0.025,
    paddingBottom: HEIGHT * 0.025,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: WIDTH * 0.04,
    paddingVertical: HEIGHT * 0.015,
    gap: WIDTH * 0.025,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  sectionHeadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: HEIGHT * 0.025,
    marginBottom: HEIGHT * 0.018,
    marginLeft: WIDTH * 0.03,
    borderBottomWidth: 2,
    borderBottomColor: BRANDCOLOR,
    paddingBottom: HEIGHT * 0.01,
  },
  sectionIcon: {
    width: WIDTH * 0.06,
    height: WIDTH * 0.06,
    marginRight: WIDTH * 0.02,
    resizeMode: "contain",
  },
  sectionHeading: {
    fontSize: HEIGHT * 0.02,
    fontFamily: UBUNTUBOLD,
    color: BLACK,
  },
  pickerWrapper: {
    marginHorizontal: WIDTH * 0.025,
    marginBottom: HEIGHT * 0.012,
    borderWidth: 1,
    borderColor: BRANDCOLOR,
    borderRadius: WIDTH * 0.03,
    backgroundColor: WHITE,
    minHeight: HEIGHT * 0.06,
  },
  pickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: WIDTH * 0.03,
    paddingLeft: WIDTH * 0.01,
    position: "relative",
  },
  pickerTextContainer: {
    position: "absolute",
    left: WIDTH * 0.01,
    right: WIDTH * 0.1,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    zIndex: 1,
    paddingLeft: WIDTH * 0.02,
    pointerEvents: "none",
  },
  pickerSelectedText: {
    fontSize: HEIGHT * 0.018,
    color: BLACK,
    fontFamily: UBUNTU,
  },
  picker: {
    flex: 1,
    color: "transparent",
    fontSize: HEIGHT * 0.018,
    paddingVertical: HEIGHT * 0.012,
    paddingHorizontal: WIDTH * 0.03,
    height: HEIGHT * 0.06,
  },
  pickerItem: {
    color: BLACK,
    fontSize: HEIGHT * 0.018,
  },
  dropdownIcon: {
    width: WIDTH * 0.05,
    height: WIDTH * 0.05,
    resizeMode: "contain",
    marginLeft: WIDTH * 0.02,
  },
  logoBox: {
    width: "95%",
    height: HEIGHT * 0.15,
    borderWidth: 1,
    borderColor: BRANDCOLOR,
    borderRadius: WIDTH * 0.03,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: HEIGHT * 0.012,
    backgroundColor: WHITE,
  },
  logoText: {
    color: BLACK,
    fontSize: HEIGHT * 0.018,
  },
  logoImage: {
    width: WIDTH * 0.25,
    height: WIDTH * 0.25,
    resizeMode: "contain",
  },
  logoTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadIcon: {
    width: WIDTH * 0.06,
    height: WIDTH * 0.06,
    marginRight: WIDTH * 0.02,
    resizeMode: "contain",
  },
  label: {
    marginLeft: WIDTH * 0.03,
    marginTop: HEIGHT * 0.012,
    marginBottom: HEIGHT * 0.005,
    fontSize: HEIGHT * 0.018,
    fontFamily: FIRASANSSEMIBOLD,
    color: BLACK,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: HEIGHT * 0.02,
    marginLeft: WIDTH * 0.03,
    gap: WIDTH * 0.03,
  },
  statusLabel: {
    fontSize: HEIGHT * 0.018,
    fontFamily: FIRASANSSEMIBOLD,
    color: BLACK,
  },
  statusToggleContainer: {
    flexDirection: "row",
    gap: WIDTH * 0.02,
  },
  statusButton: {
    paddingHorizontal: WIDTH * 0.05,
    paddingVertical: HEIGHT * 0.012,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: WHITE,
  },
  statusButtonActive: {
    backgroundColor: BRANDCOLOR,
    borderColor: BRANDCOLOR,
  },
  statusButtonInactive: {
    backgroundColor: "#FF5252",
    borderColor: "#FF5252",
  },
  statusButtonText: {
    fontSize: HEIGHT * 0.016,
    color: "#666",
    fontFamily: FIRASANSSEMIBOLD,
  },
  statusButtonTextActive: {
    color: WHITE,
  },
  statusButtonTextInactive: {
    color: WHITE,
  },
});
