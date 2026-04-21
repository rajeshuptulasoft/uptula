import React, { useState, useEffect } from "react";
import {
    StatusBar,
    StyleSheet,
    View,
    Text,
    TextInput,
    ScrollView,
    Image,
    Pressable,
    KeyboardAvoidingView,
    Platform,
    RefreshControl,
    BackHandler,
    PermissionsAndroid,
    Alert,
    SafeAreaView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { launchImageLibrary } from "react-native-image-picker";
import { useNavigation } from "@react-navigation/native";

import { WHITE, BLACK, BRANDCOLOR } from "../../../constant/color";
import { HEIGHT, WIDTH } from "../../../constant/config";
import { UBUNTUBOLD, UBUNTU, FIRASANSSEMIBOLD, ROBOTOSEMIBOLD, CANTARELLBOLD, FIRASANSBOLD } from "../../../constant/fontPath";
import { MyHeader } from "../../../components/commonComponents/MyHeader";
import { TextInputComponent } from "../../../components/commonComponents/TextInputComponent";
import { CustomButton } from "../../../components/commonComponents/Button";
import { ToastMessage } from "../../../components/commonComponents/ToastMessage";
import { BASE_URL } from "../../../constant/url";
import { POSTNETWORK, POSTNETWORKFORM, GETNETWORK } from "../../../utils/Network";
import { getObjByKey } from "../../../utils/Storage";
import { CITY, LOGO } from "../../../constant/imagePath";
import ReactNativeBlobUtil from 'react-native-blob-util';

import {
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

const AddJobScreen = () => {
    const navigation = useNavigation();
    // General Information Section
    const [jobTitle, setJobTitle] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [companyLogo, setCompanyLogo] = useState(null);
    const [category, setCategory] = useState("");
    const [customCategory, setCustomCategory] = useState(""); // For "Other" category option
    const [description, setDescription] = useState("");
    const [salary, setSalary] = useState("");
    const [vacancy, setVacancy] = useState("");
    const [experience, setExperience] = useState("");
    const [jobType, setJobType] = useState("");
    const [qualification, setQualification] = useState("");
    const [skills, setSkills] = useState("");

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
    const [linkedin, setLinkedin] = useState("");
    const [twitter, setTwitter] = useState("");
    const [pinterest, setPinterest] = useState("");
    const [instagram, setInstagram] = useState("");

    // Refresh Control
    const [refreshing, setRefreshing] = useState(false);

    // Toast Message
    const [toastMessage, setToastMessage] = useState({
        type: "",
        msg: "",
        visible: false,
    });


    // Handle back button press - navigate to ProviderHome
    useEffect(() => {
        const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
            // Navigate to ProviderHome tab
            navigation.navigate("ProviderHome");
            return true;
        });

        return () => backHandler.remove();
    }, [navigation]);

    // Function to fetch employer profile data
    const fetchEmployerProfile = async () => {
        try {
            const storedData = await getObjByKey("loginResponse");
            const loginData = typeof storedData === "string" ? JSON.parse(storedData) : storedData;
            const token = loginData?.token;

            if (!token) {
                return;
            }

            const url = `${BASE_URL}employer/profile`;
            // console.log("📡 Fetching employer profile from:", url);

            const result = await GETNETWORK(url, true);
            // console.log("📥 Employer profile response:", JSON.stringify(result, null, 2));

            if (result && result.profile) {
                const profile = result.profile;

                // Auto-fill fields from profile
                if (profile.companyName) setCompanyName(profile.companyName);
                if (profile.logoUrl) {
                    // Store the original logoUrl path from profile for posting
                    // If it's already a full URL, use it; otherwise construct the full URL for display
                    const logoUrlPath = profile.logoUrl.startsWith('http')
                        ? profile.logoUrl
                        : `https://uptula.com${profile.logoUrl}`;

                    // Store both the display URL and the original path
                    const originalPath = profile.logoUrl.startsWith('http')
                        ? profile.logoUrl.replace(/https?:\/\/[^\/]+/, '')
                        : profile.logoUrl;

                    setCompanyLogo({
                        uri: logoUrlPath,
                        originalPath: originalPath
                    });

                    // console.log("📎 Profile Logo URL stored:", {
                    //     displayUri: logoUrlPath,
                    //     originalPath: originalPath
                    // });
                }
                // IMPORTANT: Company Category (category) is NOT auto-fetched from profile.industry
                // The user MUST manually select the category from the dropdown
                // profile.industry is NOT used for Company Category - it remains empty until user selects
                if (profile.email) setEmail(profile.email);
                if (profile.phone) setPhoneNumber(profile.phone);
                if (profile.website) setWebsite(profile.website);
                if (profile.address) setAddress(profile.address);
                if (profile.facebook) setFacebook(profile.facebook);
                if (profile.google) setGoogle(profile.google);
                if (profile.twitter) setTwitter(profile.twitter);
                if (profile.instagram) setInstagram(profile.instagram);
                if (profile.linkedin) setLinkedin(profile.linkedin);

                // console.log("✅ Profile data loaded and fields auto-filled");
            }
        } catch (error) {
            // console.log("❌ Error fetching employer profile:", error);
        }
    };

    // Fetch employer profile data on component mount
    useEffect(() => {
        fetchEmployerProfile();
    }, []);

    // Reset only editable job-specific fields (not profile fields)
    const resetJobFields = () => {
        setJobTitle("");
        setCategory(""); // Reset category - must be selected manually (NOT from profile.industry)
        setCustomCategory(""); // Reset custom category
        setDescription("");
        setSalary("");
        setVacancy("");
        setExperience("");
        setJobType("");
        setQualification("");
        setSkills("");
        setCity("");
        setState("");
        setCountry("");
        setPinCode("");
        setPinterest("");
        setInstagram("");
    };

    // Reset all form fields (used after successful job post)
    const resetAllFields = () => {
        setJobTitle("");
        setCompanyName("");
        setCompanyLogo(null);
        setCategory("");
        setCustomCategory("");
        setDescription("");
        setSalary("");
        setVacancy("");
        setExperience("");
        setJobType("");
        setQualification("");
        setSkills("");
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
        setLinkedin("");
        setTwitter("");
        setPinterest("");
        setInstagram("");
    };

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        // Re-fetch profile data instead of clearing fields
        await fetchEmployerProfile();
        // Reset only job-specific editable fields
        resetJobFields();
        // Simulate refresh delay
        setTimeout(() => {
            setRefreshing(false);
        }, 1000);
    }, []);

    // Handle Post Job
    const handlePostJob = async () => {
        // Email validation helper
        const isValidEmail = (email) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        };

        // Validation - Mandatory Fields: Job Title, Job Description, Salary Range, Experience Required, Qualification Required, Skills, Pin Code
        if (!jobTitle || jobTitle.trim() === "") {
            setToastMessage({
                type: "error",
                msg: "Job Title is empty. Please fill up that field.",
                visible: true,
            });
            return;
        }

        if (!description || description.trim() === "") {
            setToastMessage({
                type: "error",
                msg: "Job Description is empty. Please fill up that field.",
                visible: true,
            });
            return;
        }

        if (!salary || salary.trim() === "") {
            setToastMessage({
                type: "error",
                msg: "Salary Range is empty. Please fill up that field.",
                visible: true,
            });
            return;
        }

        if (!experience || experience.trim() === "") {
            setToastMessage({
                type: "error",
                msg: "Experience Required is empty. Please fill up that field.",
                visible: true,
            });
            return;
        }

        if (!qualification || qualification.trim() === "") {
            setToastMessage({
                type: "error",
                msg: "Qualification Required is empty. Please fill up that field.",
                visible: true,
            });
            return;
        }

        if (!skills || skills.trim() === "") {
            setToastMessage({
                type: "error",
                msg: "Skills is empty. Please fill up that field.",
                visible: true,
            });
            return;
        }

        if (!pinCode || pinCode.trim() === "") {
            setToastMessage({
                type: "error",
                msg: "Pin Code is empty. Please fill up that field.",
                visible: true,
            });
            return;
        }

        // Validate Company Category - must be selected (NOT from profile.industry)
        if (!category || category.trim() === "") {
            setToastMessage({
                type: "error",
                msg: "Company Category is empty. Please select a category.",
                visible: true,
            });
            return;
        }

        // If "other" is selected, custom category must be provided
        if (category === "other" && (!customCategory || customCategory.trim() === "")) {
            setToastMessage({
                type: "error",
                msg: "Please enter the custom category name (e.g., Cook, Plumber, etc.).",
                visible: true,
            });
            return;
        }

        // Helper function to clean and validate website URL
        const cleanWebsiteUrl = (url) => {
            if (!url || url.trim() === "") return "";
            let cleaned = url.trim();
            // Remove spaces
            cleaned = cleaned.replace(/\s+/g, "");
            // Add https:// if no protocol
            if (cleaned && !cleaned.startsWith("http://") && !cleaned.startsWith("https://")) {
                cleaned = "https://" + cleaned;
            }
            return cleaned;
        };

        // Clean website URL if provided
        const cleanedWebsite = website ? cleanWebsiteUrl(website) : "";

        try {
            const storedData = await getObjByKey("loginResponse");
            const loginData =
                typeof storedData === "string"
                    ? JSON.parse(storedData)
                    : storedData;

            const token = loginData?.token;
            if (!token) {
                setToastMessage({
                    type: "error",
                    msg: "Session expired. Please login again.",
                    visible: true,
                });
                return;
            }

            const url = `${BASE_URL}employer/jobs`;

            // Helper function to validate URLs
            const isValidUrl = (url) => {
                if (!url || url.trim() === "") return false;
                try {
                    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
                    return urlPattern.test(url) && (url.startsWith('http://') || url.startsWith('https://'));
                } catch (e) {
                    return false;
                }
            };

            // Map experience: "Fresher" → "fresher" (already lowercase from dropdown, but ensure it's correct)
            const mappedExperience = experience === "Fresher" ? "fresher" : experience;

            // Map jobType: "FullTime" → "full_time", "PartTime" → "part_time"
            let mappedJobType = jobType;
            if (jobType === "FullTime") {
                mappedJobType = "full_time";
            } else if (jobType === "PartTime") {
                mappedJobType = "part_time";
            }

            // Helper function to create form data array for react-native-blob-util
            const createFormDataArray = async () => {
                const formDataArray = [];

                // Add all text fields to form data array
                formDataArray.push({ name: 'jobTitle', data: jobTitle || '' });
                formDataArray.push({ name: 'companyName', data: companyName || '' });
                formDataArray.push({ name: 'description', data: description || '' });
                // Company Category: Posted as 'category' (NOT 'industry')
                // If "other" is selected, use customCategory value; otherwise use selected category
                // IMPORTANT: 'industry' from profile is NEVER used for Company Category
                const categoryToPost = category === "other" && customCategory.trim()
                    ? customCategory.trim()
                    : category || '';
                formDataArray.push({ name: 'category', data: categoryToPost });
                // console.log("📎 Company Category being posted as 'category' (NOT 'industry'):", categoryToPost);
                formDataArray.push({ name: 'salaryRange', data: salary || '' });
                formDataArray.push({ name: 'noOfVacancy', data: vacancy ? String(parseInt(vacancy)) : '1' });
                formDataArray.push({ name: 'experience', data: mappedExperience || '' });
                formDataArray.push({ name: 'jobType', data: mappedJobType || '' });
                formDataArray.push({ name: 'qualification', data: qualification || '' });
                formDataArray.push({ name: 'skills', data: skills || '' });
                formDataArray.push({ name: 'email', data: email || '' });
                formDataArray.push({ name: 'phone', data: phoneNumber || '' });
                formDataArray.push({ name: 'website', data: cleanedWebsite || '' });
                formDataArray.push({ name: 'address', data: address || '' });
                formDataArray.push({ name: 'city', data: city || '' });
                formDataArray.push({ name: 'state', data: state || '' });
                formDataArray.push({ name: 'country', data: country || '' });
                formDataArray.push({ name: 'zipCode', data: pinCode || '' });
                formDataArray.push({ name: 'facebook', data: facebook || '' });
                formDataArray.push({ name: 'linkedin', data: linkedin || '' });
                formDataArray.push({ name: 'google', data: google || '' });
                formDataArray.push({ name: 'twitter', data: twitter || '' });
                formDataArray.push({ name: 'pinterest', data: pinterest || '' });
                formDataArray.push({ name: 'instagram', data: instagram || '' });

                // Add company logo if selected
                if (companyLogo && companyLogo.uri) {
                    let imageUri = companyLogo.uri;

                    // Check if it's a remote URL (already uploaded) or a local file (needs upload)
                    const isRemoteUrl = imageUri.startsWith('http://') || imageUri.startsWith('https://');

                    if (isRemoteUrl) {
                        // If it's a remote URL from profile, download it first and then upload as file
                        try {
                            // console.log("📥 Downloading company logo from profile URL:", imageUri);

                            // Download the image to cache directory
                            const cacheDir = ReactNativeBlobUtil.fs.dirs.CacheDir;
                            const fileName = `company_logo_${Date.now()}.${imageUri.includes('.png') ? 'png' : imageUri.includes('.webp') ? 'webp' : 'jpg'}`;
                            const filePath = `${cacheDir}/${fileName}`;

                            // Download the image
                            const downloadResponse = await ReactNativeBlobUtil.config({
                                fileCache: true,
                                path: filePath,
                            }).fetch('GET', imageUri);

                            const downloadedPath = downloadResponse.path();
                            // console.log("✅ Company logo downloaded to:", downloadedPath);

                            // Prepare file data for upload
                            let fileUri = downloadedPath;

                            // Remove file:// prefix if present
                            if (fileUri.startsWith('file://')) {
                                fileUri = fileUri.replace('file://', '');
                            }

                            // Create file data object for react-native-blob-util
                            const fileData = {
                                name: 'companyLogo',
                                filename: fileName,
                                type: companyLogo.type || companyLogo.mimeType || 'image/jpeg',
                                data: ReactNativeBlobUtil.wrap(fileUri),
                            };

                            formDataArray.push(fileData);

                            // console.log("📎 Company Logo Data (downloaded from profile - react-native-blob-util):", {
                            //     name: fileData.name,
                            //     filename: fileData.filename,
                            //     type: fileData.type,
                            //     originalUrl: imageUri,
                            //     downloadedPath: downloadedPath,
                            //     fileUri: fileUri
                            // });
                            // console.log("✅ Company Logo file added to form data array");
                        } catch (downloadError) {
                            // console.log("❌ Error downloading company logo:", downloadError);
                            // Fallback: send as logoUrl path string
                            let logoUrlPath = companyLogo.originalPath || imageUri.replace(/https?:\/\/[^\/]+/, '');
                            if (logoUrlPath && !logoUrlPath.startsWith('/')) {
                                logoUrlPath = '/' + logoUrlPath;
                            }
                            formDataArray.push({ name: 'companyLogo', data: logoUrlPath });
                            // console.log("⚠️ Using fallback: sending logoUrl as string:", logoUrlPath);
                        }
                    } else {
                        // It's a local file, upload it
                        let fileUri = imageUri;

                        // Remove file:// prefix for file:// URIs
                        if (fileUri.startsWith('file://')) {
                            fileUri = fileUri.replace('file://', '');
                        }

                        // For content:// URIs, use as-is
                        // For file paths, wrap with ReactNativeBlobUtil.wrap()
                        const fileData = {
                            name: 'companyLogo',
                            filename: companyLogo.fileName || companyLogo.name || `logo_${Date.now()}.${imageUri.includes('.png') ? 'png' : imageUri.includes('.webp') ? 'webp' : 'jpg'}`,
                            type: companyLogo.type || companyLogo.mimeType || 'image/jpeg',
                            data: fileUri.startsWith('content://')
                                ? fileUri
                                : ReactNativeBlobUtil.wrap(fileUri),
                        };

                        formDataArray.push(fileData);

                        // console.log("📎 Company Logo Data (local file - react-native-blob-util):", {
                        //     name: fileData.name,
                        //     filename: fileData.filename,
                        //     type: fileData.type,
                        //     uri: imageUri,
                        //     fileUri: fileUri,
                        //     originalCompanyLogo: companyLogo
                        // });
                        // console.log("✅ Company Logo file added to form data array");
                    }
                } else {
                    // console.log("⚠️ Company Logo not added - companyLogo exists:", !!companyLogo, "has URI:", !!(companyLogo && companyLogo.uri));
                }

                return formDataArray;
            };

            // Create form data array
            // console.log("📤 Preparing to create form data array - Company Logo state:", {
            //     hasCompanyLogo: !!companyLogo,
            //     hasUri: !!(companyLogo && companyLogo.uri),
            //     companyLogoData: companyLogo
            // });
            const formDataArray = await createFormDataArray();

            // Use react-native-blob-util for reliable file uploads
            // console.log("📤 Posting job using react-native-blob-util");
            // console.log("📡 URL:", url);
            // console.log("📦 Form data array prepared with", formDataArray.length, "fields");

            let result;
            try {
                // Use react-native-blob-util for file uploads
                const uploadResult = await ReactNativeBlobUtil.fetch(
                    'POST',
                    url,
                    {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    formDataArray
                );

                // console.log("📥 Upload response status:", uploadResult.info().status);

                // Parse response
                try {
                    const responseText = uploadResult.text();
                    if (responseText && responseText.trim() !== '') {
                        if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
                            result = {
                                status: uploadResult.info().status,
                                ok: uploadResult.info().status >= 200 && uploadResult.info().status < 300,
                                data: JSON.parse(responseText)
                            };
                        } else {
                            result = {
                                status: uploadResult.info().status,
                                ok: uploadResult.info().status >= 200 && uploadResult.info().status < 300,
                                data: { message: responseText.trim() }
                            };
                        }
                    } else {
                        result = {
                            status: uploadResult.info().status,
                            ok: uploadResult.info().status >= 200 && uploadResult.info().status < 300,
                            data: { message: 'Job posted successfully' }
                        };
                    }
                } catch (parseError) {
                    // console.log("⚠️ Error parsing response:", parseError);
                    result = {
                        status: uploadResult.info().status,
                        ok: uploadResult.info().status >= 200 && uploadResult.info().status < 300,
                        data: { message: 'Job posted successfully' }
                    };
                }
            } catch (error) {
                // console.log("❌ Error uploading job:", error);
                throw error;
            }

            // console.log("📥 Response Status:", result.status);
            // console.log("📥 Response OK:", result.ok);
            // console.log("📥 Response Data:", JSON.stringify(result.data, null, 2));

            const responseData = result.data || {};

            // Map values for logging
            const mappedExperienceForLog = experience === "Fresher" ? "fresher" : experience;
            let mappedJobTypeForLog = jobType;
            if (jobType === "FullTime") {
                mappedJobTypeForLog = "full_time";
            } else if (jobType === "PartTime") {
                mappedJobTypeForLog = "part_time";
            }

            // Log what data was posted
            const categoryToPostForLog = category === "other" && customCategory.trim()
                ? customCategory.trim()
                : category || '';
            // console.log("📤 Posted Data Summary:", {
            //     jobTitle: jobTitle || '(empty)',
            //     companyName: companyName || '(empty)',
            //     category: categoryToPostForLog || '(empty)',
            //     note: "Category is posted as 'category' (NOT 'industry')",
            //     description: description ? `${description.substring(0, 50)}...` : '(empty)',
            //     salaryRange: salary || '(empty)',
            //     noOfVacancy: vacancy || '(empty)',
            //     experience: mappedExperienceForLog || '(empty)',
            //     jobType: mappedJobTypeForLog || '(empty)',
            //     qualification: qualification || '(empty)',
            //     skills: skills || '(empty)',
            //     email: email || '(empty)',
            //     phone: phoneNumber || '(empty)',
            //     website: cleanedWebsite || website || '(empty)',
            //     address: address || '(empty)',
            //     city: city || '(empty)',
            //     state: state || '(empty)',
            //     country: country || '(empty)',
            //     zipCode: pinCode || '(empty)',
            //     hasCompanyLogo: !!(companyLogo && companyLogo.uri),
            //     companyLogoUri: companyLogo?.uri || '(no logo)',
            // });

            const isSuccess =
                result.ok ||
                result.status === 200 ||
                result.status === 201 ||
                responseData?.success === true ||
                responseData?.statusCode === 200 ||
                responseData?.statusCode === 201 ||
                responseData?.status === "success" ||
                responseData?.status === "Success" ||
                responseData?.id ||
                responseData?.job_id;

            if (isSuccess) {
                // console.log("✅ Job posted successfully!");
                // Handle logoUrl from response if present
                const logoUrl = responseData?.logoUrl || responseData?.data?.logoUrl;
                if (logoUrl) {
                    // console.log("✅ Logo URL from response:", logoUrl);
                }

                // Reset only job-specific fields, keep profile data
                resetJobFields();

                setToastMessage({
                    type: "success",
                    msg: responseData?.message || "Job posted successfully!",
                    visible: true,
                });
            } else {
                const errorMsg = responseData?.errors?.[0]?.msg || responseData?.message || responseData?.error || "Failed to post job";
                // console.log("❌ Job posting failed:", errorMsg);
                // console.log("Full error response:", responseData);
                setToastMessage({
                    type: "error",
                    msg: errorMsg,
                    visible: true,
                });
            }
        } catch (error) {
            // console.log("❌ EXCEPTION while posting job:");
            // console.log("Error message:", error?.message);
            // console.log("Error stack:", error?.stack);
            // console.log("Full error:", error);
            setToastMessage({
                type: "error",
                msg: error?.message || "Unable to process request",
                visible: true,
            });
        }
    };

    // Check and request permissions for accessing image library
    const requestImagePermission = async () => {
        // Use image picker directly instead of requesting READ_MEDIA_IMAGES.
        return true;
    };

    const pickCompanyLogo = async () => {
        if (Platform.OS === "android") {
            const hasPermission = await requestImagePermission();

            if (!hasPermission) {
                Alert.alert(
                    "Permission Denied",
                    "Please grant photo library permission to select company logo. You can enable it in app settings.",
                    [{ text: "OK" }]
                );
                return;
            }
        }

        try {
            const res = await launchImageLibrary({
                mediaType: "photo",
                quality: 0.8,
                maxWidth: 1024,
                maxHeight: 1024,
            });

            if (res.didCancel) {
                return;
            }

            if (res.errorCode) {
                return;
            }

            if (res.assets && res.assets.length > 0) {
                const selectedImage = res.assets[0];
                // console.log("📷 Selected Company Logo:", {
                //     uri: selectedImage.uri,
                //     type: selectedImage.type || selectedImage.mimeType,
                //     fileName: selectedImage.fileName || selectedImage.name,
                //     fileSize: selectedImage.fileSize,
                //     width: selectedImage.width,
                //     height: selectedImage.height,
                //     fullAsset: selectedImage
                // });
                setCompanyLogo(selectedImage);
                // console.log("✅ Company Logo state updated");
            }
        } catch (error) {
            Alert.alert("Error", "Failed to select image. Please try again.");
        }
    };

    // Fetch location from PinCode using Postal API
    const getLocationFromPinCode = async (pin) => {
        try {
            // console.log("🌐 Fetching location from API for pincode:", pin);

            // Using Indian Postal API - free and reliable
            const apiUrl = `https://api.postalpincode.in/pincode/${pin}`;

            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const data = await response.json();
            // console.log("📦 API Response:", JSON.stringify(data, null, 2));

            // Check if API returned valid data
            if (data && Array.isArray(data) && data.length > 0) {
                const postOffice = data[0];

                if (postOffice.Status === "Success" && postOffice.PostOffice && postOffice.PostOffice.length > 0) {
                    // const firstPostOffice = postOffice.PostOffice[0];
                    const postOffices = postOffice.PostOffice;

                    const selectedPostOffice =
                        postOffices.find(po => po.DeliveryStatus === "Delivery") ||
                        postOffices[0];

                    // const locationData = {
                    //     city: firstPostOffice.District || firstPostOffice.Name || "",
                    //     state: firstPostOffice.State || "",
                    //     country: "India",
                    // };

                    // const locationData = {
                    //     city: selectedPostOffice.Name || selectedPostOffice.District || "",
                    //     state: selectedPostOffice.State || "",
                    //     country: "India",
                    // };

                    const locationData = {
                        city:
                            selectedPostOffice.Division ||
                            selectedPostOffice.Region ||
                            selectedPostOffice.District ||
                            "",
                        state: selectedPostOffice.State || "",
                        country: "India",
                    };

                    // console.log("✅ Location data extracted:", locationData);
                    return locationData;
                } else {
                    // console.log("⚠️ API returned no post office data");
                    return { city: "", state: "", country: "India" };
                }
            } else {
                // console.log("⚠️ Invalid API response format");
                return { city: "", state: "", country: "India" };
            }
        } catch (error) {
            // console.log("❌ Error fetching location from API:", error.message);
            // Fallback to approximate mapping based on first digits
            return getLocationFromPinCodeFallback(pin);
        }
    };

    // Fallback function for approximate location based on pincode ranges
    const getLocationFromPinCodeFallback = (pin) => {
        const firstTwo = pin.substring(0, 2);
        const firstThree = pin.substring(0, 3);

        // Approximate mapping based on pincode ranges (Indian postal system)
        if (firstTwo === "40" || firstTwo === "41") {
            return { city: "Mumbai", state: "Maharashtra", country: "India" };
        } else if (firstTwo === "11") {
            return { city: "Delhi", state: "Delhi", country: "India" };
        } else if (firstTwo === "56") {
            return { city: "Bangalore", state: "Karnataka", country: "India" };
        } else if (firstTwo === "50") {
            return { city: "Hyderabad", state: "Telangana", country: "India" };
        } else if (firstTwo === "60") {
            return { city: "Chennai", state: "Tamil Nadu", country: "India" };
        } else if (firstTwo === "70") {
            return { city: "Kolkata", state: "West Bengal", country: "India" };
        } else if (firstThree === "411") {
            return { city: "Pune", state: "Maharashtra", country: "India" };
        } else if (firstThree === "380") {
            return { city: "Ahmedabad", state: "Gujarat", country: "India" };
        } else if (firstThree === "302") {
            return { city: "Jaipur", state: "Rajasthan", country: "India" };
        } else if (firstThree === "395") {
            return { city: "Surat", state: "Gujarat", country: "India" };
        } else if (firstTwo === "75") {
            return { city: "Bhubaneswar", state: "Odisha", country: "India" };
        }

        // Default fallback
        return { city: "", state: "", country: "India" };
    };

    // Auto-fetch City, State, Country from PinCode
    const handlePinCodeChange = (pin) => {
        // Only allow numeric input and limit to 6 digits
        const numericPin = pin.replace(/[^0-9]/g, '').slice(0, 6);
        setPinCode(numericPin);
    };

    // useEffect to auto-fill City, State, Country when pinCode changes
    useEffect(() => {
        // console.log("📍 PinCode changed:", pinCode);

        if (pinCode && pinCode.length === 6) {
            // Fetch location data from API
            const fetchLocation = async () => {
                try {
                    // console.log("🔍 Fetching location for pincode:", pinCode);
                    const locationData = await getLocationFromPinCode(pinCode);
                    // console.log("📍 Location data received:", locationData);

                    // Set city, state, and country - ensure they are strings
                    if (locationData && locationData.city) {
                        // console.log("✅ Setting City:", locationData.city);
                        setCity(String(locationData.city));
                    } else {
                        // console.log("⚠️ No city found for pincode");
                        setCity("");
                    }

                    if (locationData && locationData.state) {
                        // console.log("✅ Setting State:", locationData.state);
                        setState(String(locationData.state));
                    } else {
                        // console.log("⚠️ No state found for pincode");
                        setState("");
                    }

                    if (locationData && locationData.country) {
                        // console.log("✅ Setting Country:", locationData.country);
                        setCountry(String(locationData.country));
                    } else {
                        // console.log("⚠️ No country found for pincode, defaulting to India");
                        setCountry("India"); // Default to India
                    }
                } catch (error) {
                    // console.log("❌ Error fetching location from pincode:", error);
                    // On error, clear the fields
                    setCity("");
                    setState("");
                    setCountry("India");
                }
            };

            fetchLocation();
        } else if (pinCode && pinCode.length < 6) {
            // Clear fields if pincode is incomplete
            // console.log("⚠️ Pincode incomplete, clearing location fields");
            setCity("");
            setState("");
            setCountry("");
        } else if (!pinCode || pinCode.length === 0) {
            // Clear fields if pincode is empty
            // console.log("⚠️ Pincode empty, clearing location fields");
            setCity("");
            setState("");
            setCountry("");
        }
    }, [pinCode]);

    const Container = Platform.OS === "ios" ? SafeAreaView : View;

    return (
        <>
            <StatusBar
                backgroundColor={WHITE}
                barStyle={Platform.OS === "ios" ? "dark-content" : "dark-content"}
                translucent={Platform.OS === "android"}
            />

            <Container style={[
                styles.container,
                Platform.OS === "ios" && styles.containerIOS,
                Platform.OS === "android" && styles.containerAndroid
            ]}>
                <View style={[
                    styles.headerWrapper,
                    Platform.OS === "ios" && styles.headerWrapperIOS,
                    Platform.OS === "android" && styles.headerWrapperAndroid
                ]}>
                    <MyHeader showCenterTitle title="Add Job" />
                </View>

                <KeyboardAvoidingView
                    style={{ flex: 1, backgroundColor: WHITE }}
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
                >
                    <ScrollView
                        contentContainerStyle={[
                            styles.scrollContent,
                            Platform.OS === "ios" && styles.scrollContentIOS,
                            Platform.OS === "android" && styles.scrollContentAndroid
                        ]}
                        style={styles.scrollView}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={true}
                        nestedScrollEnabled={true}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={[BRANDCOLOR]}
                                tintColor={BRANDCOLOR}
                            />
                        }
                    >
                        {/* ========== GENERAL INFORMATION SECTION ========== */}
                        <View style={styles.sectionHeadingContainer}>
                            <Image source={GENERALINFORMATION} style={styles.sectionIcon} />
                            <Text style={styles.sectionHeading}>General Information</Text>
                        </View>

                        {/* Job Title */}
                        <TextInputComponent
                            placeholder="Job Title"
                            inputdata={jobTitle}
                            setInputdata={setJobTitle}
                            borderColor={BRANDCOLOR}
                            width="95%"
                            image={JOBTITLE}
                            iconTintColor={null}
                        />

                        {/* Company Name - Read Only */}
                        <TextInputComponent
                            placeholder="Company Name"
                            inputdata={companyName}
                            setInputdata={setCompanyName}
                            borderColor={BRANDCOLOR}
                            width="95%"
                            image={COMPANYNAME}
                            editable={false}
                            iconTintColor={null}
                        />

                        {/* Company Logo - Read Only (Display Only) */}
                        <View style={[styles.logoBox, { opacity: 0.6 }]}>
                            {companyLogo && companyLogo.uri ? (
                                <Image
                                    source={{ uri: companyLogo.uri }}
                                    style={styles.logoImage}
                                    resizeMode="contain"
                                />
                            ) : (
                                <View style={styles.logoTextContainer}>
                                    <Image source={UPLOADIMAGE} style={styles.uploadIcon} />
                                    <Text style={styles.logoText}>Company Logo</Text>
                                </View>
                            )}
                        </View>

                        {/* Company Category */}
                        <Text style={styles.label}>Company Category</Text>
                        <View style={styles.pickerWrapper}>
                            <View style={styles.pickerContainer}>
                                <View style={styles.pickerTextContainer}>
                                    <Text style={styles.pickerSelectedText} numberOfLines={1}>
                                        {category === "" ? "Select Company category" :
                                            category === "information_technology" ? "Information Technology" :
                                                category === "health_care" ? "Health Care" :
                                                    category === "other" ? (customCategory || "Other") :
                                                        category === "marketing" ? "Marketing" :
                                                            category === "finance" ? "Finance" :
                                                                category === "education" ? "Education" : category}
                                    </Text>
                                </View>
                                <Picker
                                    selectedValue={category}
                                    onValueChange={(value) => {
                                        setCategory(value);
                                        if (value !== "other") {
                                            setCustomCategory(""); // Clear custom category if not "other"
                                        }
                                    }}
                                    style={styles.picker}
                                    itemStyle={styles.pickerItem}
                                >
                                    <Picker.Item label="Select Company category" value="" />
                                    <Picker.Item label="Information Technology" value="information_technology" />
                                    <Picker.Item label="Marketing" value="marketing" />
                                    <Picker.Item label="Health Care" value="health_care" />
                                    <Picker.Item label="Finance" value="finance" />
                                    <Picker.Item label="Education" value="education" />
                                    <Picker.Item label="Other" value="other" />
                                </Picker>
                                <Image source={DROPDOWN} style={styles.dropdownIcon} />
                            </View>
                        </View>

                        {/* Custom Category Input (shown when "other" is selected) */}
                        {category === "other" && (
                            <TextInputComponent
                                placeholder="Enter Category (e.g., Cook, Plumber, etc.)"
                                inputdata={customCategory}
                                setInputdata={setCustomCategory}
                                borderColor={BRANDCOLOR}
                                width="95%"
                                image={COMPANYNAME}
                                iconTintColor={null}
                            />
                        )}

                        {/* Job Description - Multiline */}
                        <View style={styles.descriptionContainer}>
                            <View style={styles.descriptionLabelContainer}>
                                <Image source={JOBDESCRIPTION} style={styles.descriptionIcon} />
                                <Text style={styles.descriptionLabel}>Job Description</Text>
                            </View>
                            <View style={[styles.descriptionInputWrapper, { borderColor: BRANDCOLOR }]}>
                                <TextInput
                                    style={styles.descriptionInput}
                                    placeholder="Enter job description..."
                                    placeholderTextColor="#999"
                                    value={description}
                                    onChangeText={setDescription}
                                    multiline={true}
                                    numberOfLines={6}
                                    textAlignVertical="top"
                                    maxLength={500}
                                />
                                <Text style={styles.characterCount}>
                                    {description.length}/500
                                </Text>
                            </View>
                        </View>

                        {/* Salary Range */}
                        <Text style={styles.label}>Salary Range</Text>
                        <View style={styles.pickerWrapper}>
                            <View style={styles.pickerContainer}>
                                <View style={styles.pickerTextContainer}>
                                    <Text style={styles.pickerSelectedText} numberOfLines={1}>
                                        {salary === "" ? "Select salary range" :
                                            salary === "20000-30000" ? "20,000 - 30,000" :
                                                salary === "50000-80000" ? "50,000 - 80,000" :
                                                    salary === "80000-120000" ? "80,000 - 120,000" :
                                                        salary === "120000+" ? "120,000+" : salary}
                                    </Text>
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

                        {/* Vacancies */}
                        <TextInputComponent
                            placeholder="Number of Vacancies"
                            type="number"
                            keyboardType="numeric"
                            inputdata={vacancy}
                            setInputdata={setVacancy}
                            borderColor={BRANDCOLOR}
                            width="95%"
                            image={VACANCY}
                            iconTintColor={null}
                        />

                        {/* Experience */}
                        <Text style={styles.label}>Experience Required</Text>
                        <View style={styles.pickerWrapper}>
                            <View style={styles.pickerContainer}>
                                <View style={styles.pickerTextContainer}>
                                    <Text style={styles.pickerSelectedText} numberOfLines={1}>
                                        {experience === "" ? "Select experience" : experience}
                                    </Text>
                                </View>
                                <Picker
                                    selectedValue={experience}
                                    onValueChange={setExperience}
                                    style={styles.picker}
                                    itemStyle={styles.pickerItem}
                                >
                                    <Picker.Item label="Select experience" value="" />
                                    <Picker.Item label="Fresher" value="fresher" />
                                    <Picker.Item label="1-2 Years" value="1-2 years" />
                                    <Picker.Item label="2-5 Years" value="2-5 years" />
                                    <Picker.Item label="5-10 Years" value="5-10 years" />
                                    <Picker.Item label="10+ Years" value="10+ years" />
                                </Picker>
                                <Image source={DROPDOWN} style={styles.dropdownIcon} />
                            </View>
                        </View>

                        {/* Job Type */}
                        <Text style={styles.label}>Job Type</Text>
                        <View style={styles.pickerWrapper}>
                            <View style={styles.pickerContainer}>
                                <View style={styles.pickerTextContainer}>
                                    <Text style={styles.pickerSelectedText} numberOfLines={1}>
                                        {jobType === "" ? "Select job type" :
                                            jobType === "FullTime" ? "Full Time" :
                                                jobType === "PartTime" ? "Part Time" : jobType}
                                    </Text>
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

                        {/* Qualification */}
                        <TextInputComponent
                            placeholder="Qualification Required"
                            inputdata={qualification}
                            setInputdata={setQualification}
                            borderColor={BRANDCOLOR}
                            width="95%"
                            image={QUALIFICATION}
                            iconTintColor={null}
                        />

                        {/* Skills */}
                        <TextInputComponent
                            placeholder="Skills (comma separated)"
                            inputdata={skills}
                            setInputdata={setSkills}
                            borderColor={BRANDCOLOR}
                            width="95%"
                            image={SKILLS}
                            iconTintColor={null}
                        />

                        {/* ========== COMPANY ADDRESS SECTION ========== */}
                        <View style={styles.sectionHeadingContainer}>
                            <Image source={COMPANYNAME} style={styles.sectionIcon} />
                            <Text style={styles.sectionHeading}>Company Address</Text>
                        </View>

                        {/* Email - Read Only */}
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
                            editable={false}
                            iconTintColor={null}
                        />

                        {/* Phone Number - Read Only */}
                        <TextInputComponent
                            placeholder="Phone Number"
                            type="number"
                            keyboardType="phone-pad"
                            inputdata={phoneNumber}
                            setInputdata={setPhoneNumber}
                            borderColor={BRANDCOLOR}
                            width="95%"
                            image={PHONE}
                            editable={false}
                            iconTintColor={null}
                        />

                        {/* Website Links - Read Only */}
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
                            editable={false}
                            iconTintColor={null}
                        />

                         {/* PinCode */}
                        <TextInputComponent
                            placeholder="PinCode"
                            type="number"
                            keyboardType="numeric"
                            inputdata={pinCode}
                            setInputdata={handlePinCodeChange}
                            borderColor={BRANDCOLOR}
                            width="95%"
                            image={PINCODE}
                            iconTintColor={null}
                        />

                        {/* Address - Read Only */}
                        <TextInputComponent
                            placeholder="Address"
                            inputdata={address}
                            setInputdata={setAddress}
                            borderColor={BRANDCOLOR}
                            width="95%"
                            image={ADDRESS}
                            editable={false}
                            iconTintColor={null}
                        />

                        {/* City - Auto-filled from PinCode */}
                        <TextInputComponent
                            placeholder="City"
                            inputdata={city}
                            setInputdata={setCity}
                            borderColor={BRANDCOLOR}
                            width="95%"
                            image={CITY}
                            editable={true}
                            iconTintColor={null}
                        />

                       

                        {/* State - Auto-filled from PinCode */}
                        <TextInputComponent
                            placeholder="State"
                            inputdata={state}
                            setInputdata={setState}
                            borderColor={BRANDCOLOR}
                            width="95%"
                            image={STATE}
                            editable={true}
                            iconTintColor={null}
                        />

                        {/* Country - Auto-filled from PinCode */}
                        <TextInputComponent
                            placeholder="Country"
                            inputdata={country}
                            setInputdata={setCountry}
                            borderColor={BRANDCOLOR}
                            width="95%"
                            image={COUNTRY}
                            editable={true}
                            iconTintColor={null}
                        />

                        {/* ========== SOCIAL ACCOUNT SECTION ========== */}
                        <View style={styles.sectionHeadingContainer}>
                            <Image source={SOCIALACCOUNT} style={styles.sectionIcon} />
                            <Text style={styles.sectionHeading}>Social Account</Text>
                        </View>

                        {/* LinkedIn */}
                        <TextInputComponent
                            placeholder="LinkedIn Link"
                            type="url"
                            keyboardType="url"
                            autoCapitalize="none"
                            inputdata={linkedin}
                            setInputdata={setLinkedin}
                            borderColor={BRANDCOLOR}
                            width="95%"
                            image={LINKEDIN}
                            editable={false}
                            iconTintColor={null}
                        />

                        {/* Facebook */}
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
                            editable={false}
                            iconTintColor={null}
                        />

                        {/* Google */}
                        {/*
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
                        */}

                        {/* Twitter */}
                        <TextInputComponent
                            placeholder="X Link"
                            type="url"
                            keyboardType="url"
                            autoCapitalize="none"
                            inputdata={twitter}
                            setInputdata={setTwitter}
                            borderColor={BRANDCOLOR}
                            width="95%"
                            image={TWITTER}
                            editable={false}
                            iconTintColor={null}
                        />

                        {/* Pinterest */}
                        {/*
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
                        */}

                        {/* Instagram */}
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
                            editable={false}
                            iconTintColor={null}
                        />

                        {/* Post Job Button */}
                        <View style={styles.buttonWrapper}>
                            <CustomButton text="Post Job" color={WHITE} onPress={handlePostJob} />
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>

                {/* Toast Message */}
                <ToastMessage
                    message={toastMessage.msg}
                    visible={toastMessage.visible}
                    setVisible={({ visible }) =>
                        setToastMessage((prev) => ({ ...prev, visible }))
                    }
                    bacgroundColor={
                        toastMessage.type === "success"
                            ? "green"
                            : toastMessage.type === "error"
                                ? "red"
                                : "blue"
                    }
                    textColor={WHITE}
                    type={toastMessage.type}
                    duration={3000}
                    image={LOGO}
                />
            </Container>
        </>
    );
};

export default AddJobScreen;

/* ---------- STYLES ---------- */
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: WHITE,
    },
    containerIOS: {
        paddingTop: Platform.OS === "ios" ? 0 : 0,
    },
    containerAndroid: {
        paddingTop: Platform.OS === "android" ? 0 : 0,
    },
    scrollView: {
        flex: 1,
        backgroundColor: WHITE,
    },
    scrollContent: {
        padding: WIDTH * 0.025,
        paddingBottom: HEIGHT * 0.04,
        backgroundColor: WHITE,
    },
    scrollContentIOS: {
        padding: Platform.OS === "ios" ? WIDTH * 0.03 : WIDTH * 0.025,
        paddingBottom: Platform.OS === "ios" ? HEIGHT * 0.045 : HEIGHT * 0.04,
    },
    scrollContentAndroid: {
        padding: Platform.OS === "android" ? WIDTH * 0.025 : WIDTH * 0.025,
        paddingBottom: Platform.OS === "android" ? HEIGHT * 0.038 : HEIGHT * 0.04,
    },
    label: {
        marginLeft: WIDTH * 0.03,
        marginTop: HEIGHT * 0.012,
        marginBottom: HEIGHT * 0.005,
        fontSize: HEIGHT * 0.018,
        fontFamily: FIRASANSSEMIBOLD,
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
    buttonWrapper: {
        alignItems: "center",
        marginTop: HEIGHT * 0.025,
        marginBottom: HEIGHT * 0.037,
    },
    headerWrapper: {
        backgroundColor: WHITE,
        paddingTop: HEIGHT * 0.012,
    },
    headerWrapperIOS: {
        paddingTop: Platform.OS === "ios" ? HEIGHT * 0.015 : HEIGHT * 0.012,
    },
    headerWrapperAndroid: {
        paddingTop: Platform.OS === "android" ? HEIGHT * 0.01 : HEIGHT * 0.012,
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
    descriptionContainer: {
        width: "95%",
        alignSelf: "center",
        marginVertical: HEIGHT * 0.012,
    },
    descriptionLabelContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: HEIGHT * 0.01,
        marginLeft: WIDTH * 0.01,
    },
    descriptionIcon: {
        width: WIDTH * 0.06,
        height: WIDTH * 0.06,
        marginRight: WIDTH * 0.02,
        resizeMode: "contain",
    },
    descriptionLabel: {
        fontSize: HEIGHT * 0.018,
        fontFamily: FIRASANSSEMIBOLD,
        color: BLACK,
    },
    descriptionInputWrapper: {
        borderWidth: 1,
        borderRadius: WIDTH * 0.03,
        backgroundColor: WHITE,
        minHeight: HEIGHT * 0.18,
        padding: WIDTH * 0.03,
        paddingTop: WIDTH * 0.03,
    },
    descriptionInput: {
        flex: 1,
        fontSize: HEIGHT * 0.018,
        color: BLACK,
        minHeight: HEIGHT * 0.16,
        textAlignVertical: "top",
    },
    characterCount: {
        fontSize: HEIGHT * 0.016,
        color: "#999",
        textAlign: "right",
        marginTop: HEIGHT * 0.01,
    },
});