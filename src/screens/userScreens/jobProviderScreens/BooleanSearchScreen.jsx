import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ImageBackground,
    Platform,
    StatusBar,
    BackHandler,
    FlatList,
    Pressable,
    ActivityIndicator,
} from 'react-native';
import { Picker } from "@react-native-picker/picker";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { MyHeader } from '../../../components/commonComponents/MyHeader';
import { TextInputComponent } from '../../../components/commonComponents/TextInputComponent';
import { CustomButton } from '../../../components/commonComponents/Button';
import { BRANDCOLOR, WHITE, BLACK } from '../../../constant/color';
import { KEYWORD, DROPDOWN, PREMIUM } from '../../../constant/imagePath';
import { HEIGHT, WIDTH } from '../../../constant/config';
import { 
    COMICSBOLD, 
    UBUNTUBOLD, 
    UBUNTU, 
    FIRASANSSEMIBOLD, 
    ROBOTOSEMIBOLD, 
    CANTARELLBOLD, 
    FIRASANSBOLD,
    CANTARELL,
    FIRASANS,
    OXYGENBOLD,
    OXYGEN,
    ROBOTOBOLD,
    ROBOTO
} from '../../../constant/fontPath';
import { BASE_URL } from '../../../constant/url';
import { POSTNETWORK, GETNETWORK } from '../../../utils/Network';
import { getObjByKey } from '../../../utils/Storage';

const BooleanSearchScreen = ({ navigation }) => {
    const [searchKeywords, setSearchKeywords] = useState('');
    const [useProFeatures, setUseProFeatures] = useState(false);
    const [experience, setExperience] = useState('');
    const [gender, setGender] = useState('');
    const [location, setLocation] = useState('');
    
    // Pro Features - AND and NOT items
    const [mustHaveItems, setMustHaveItems] = useState([]);
    const [mustNotHaveItems, setMustNotHaveItems] = useState([]);
    const [mustHaveInput, setMustHaveInput] = useState('');
    const [mustNotHaveInput, setMustNotHaveInput] = useState('');
    
    // Search results
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchPerformed, setSearchPerformed] = useState(false);
    
    // Saved searches
    const [savedSearches, setSavedSearches] = useState([]);
    const [loadingSavedSearches, setLoadingSavedSearches] = useState(false);
    
    // Search status
    const [searchStatus, setSearchStatus] = useState(null);
    const [loadingSearchStatus, setLoadingSearchStatus] = useState(false);

    const handleAddMustHave = () => {
        if (mustHaveInput.trim() !== '') {
            setMustHaveItems([...mustHaveItems, mustHaveInput.trim()]);
            setMustHaveInput('');
        }
    };

    const handleAddMustNotHave = () => {
        if (mustNotHaveInput.trim() !== '') {
            setMustNotHaveItems([...mustNotHaveItems, mustNotHaveInput.trim()]);
            setMustNotHaveInput('');
        }
    };

    const handleRemoveMustHave = (index) => {
        const newItems = mustHaveItems.filter((_, i) => i !== index);
        setMustHaveItems(newItems);
    };

    const handleRemoveMustNotHave = (index) => {
        const newItems = mustNotHaveItems.filter((_, i) => i !== index);
        setMustNotHaveItems(newItems);
    };

    const handleSearchCandidates = async () => {
        // Validate search keywords
        if (!searchKeywords.trim()) {
            return;
        }

        try {
            setLoading(true);
            setSearchPerformed(true);

            // Get token from storage
            const loginResponse = await getObjByKey('loginResponse');
            if (!loginResponse || !loginResponse.token) {
                setLoading(false);
                return;
            }

            const url = `${BASE_URL}search/boolean-search`;
            
            let payload;
            
            if (useProFeatures) {
                // Pro Boolean Search (AND / NOT)
                payload = {
                    searchQuery: searchKeywords.trim(),
                    useProFeatures: true,
                    filters: {
                        mustHave: mustHaveItems,
                        mustNotHave: mustNotHaveItems,
                        ...(experience && { experience: experience }),
                        ...(gender && { gender: gender }),
                        ...(location && { location: location.trim() }),
                    }
                };
            } else {
                // Basic Search (Free)
                payload = {
                    searchQuery: searchKeywords.trim(),
                    filters: {
                        ...(experience && { experience: experience }),
                        ...(gender && { gender: gender }),
                        ...(location && { location: location.trim() }),
                    },
                    useProFeatures: false
                };
            }

            const result = await POSTNETWORK(url, payload, true);

            if (result && !result.error && !result.errors) {
                const candidatesData = result?.candidates || result?.data?.candidates || [];
                
                if (Array.isArray(candidatesData) && candidatesData.length > 0) {
                    setCandidates(candidatesData);
                    console.log('✅ Success: Found', candidatesData.length, 'candidates');
                } else {
                    setCandidates([]);
                }
            } else {
                setCandidates([]);
                console.log('❌ Error: Search failed -', result?.message || result?.error || 'Unknown error');
            }
        } catch (error) {
            console.log('❌ Error: Exception occurred during search -', error.message);
            setCandidates([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSearch = async () => {
        // Validate search keywords
        if (!searchKeywords.trim()) {
            // console.log('❌ Error: Search keywords are required to save search');
            return;
        }

        try {
            // Get token from storage
            const loginResponse = await getObjByKey('loginResponse');
            if (!loginResponse || !loginResponse.token) {
                // console.log('❌ Error: Authentication required. Please login again.');
                return;
            }

            const url = `${BASE_URL}search/boolean-search/save`;
            
            // Generate search name from keywords (first 30 characters)
            const searchName = searchKeywords.trim().substring(0, 30) || 'My Search';
            
            // Build searchFilters object
            const searchFilters = {};
            
            if (useProFeatures) {
                if (mustHaveItems.length > 0) {
                    searchFilters.mustHave = mustHaveItems;
                }
                if (mustNotHaveItems.length > 0) {
                    searchFilters.mustNotHave = mustNotHaveItems;
                }
            }
            
            if (experience) {
                searchFilters.experience = experience;
            }
            if (gender) {
                searchFilters.gender = gender;
            }
            if (location && location.trim()) {
                searchFilters.location = location.trim();
            }
            
            const payload = {
                searchName: searchName,
                searchQuery: searchKeywords.trim(),
                searchFilters: searchFilters
            };

            const result = await POSTNETWORK(url, payload, true);

            if (result && !result.error && !result.errors) {
                // console.log('✅ Success:', result?.message || 'Search saved successfully');
                // if (result?.savedSearchId) {
                //     console.log('✅ Saved Search ID:', result.savedSearchId);
                // }
                // Refresh saved searches after saving
                fetchSavedSearches();
            } else {
                // console.log('❌ Error: Failed to save search -', result?.message || result?.error || 'Unknown error');
            }
        } catch (error) {
            // console.log('❌ Error: Exception occurred while saving search -', error.message);
        }
    };

    // Fetch saved searches
    const fetchSavedSearches = async () => {
        try {
            setLoadingSavedSearches(true);
            
            // Get token from storage
            const loginResponse = await getObjByKey('loginResponse');
            if (!loginResponse || !loginResponse.token) {
                setLoadingSavedSearches(false);
                return;
            }

            const url = `${BASE_URL}search/boolean-search/saved`;
            const result = await GETNETWORK(url, true);

            if (result && !result.error && !result.errors) {
                const savedSearchesData = result?.savedSearches || result?.data?.savedSearches || result?.data || [];
                setSavedSearches(Array.isArray(savedSearchesData) ? savedSearchesData : []);
            } else {
                setSavedSearches([]);
            }
        } catch (error) {
            setSavedSearches([]);
        } finally {
            setLoadingSavedSearches(false);
        }
    };

    // Fetch search status
    const fetchSearchStatus = async () => {
        try {
            setLoadingSearchStatus(true);
            
            // Get token from storage
            const loginResponse = await getObjByKey('loginResponse');
            if (!loginResponse || !loginResponse.token) {
                setLoadingSearchStatus(false);
                return;
            }

            const url = `${BASE_URL}search/boolean-search/status`;
            const result = await GETNETWORK(url, true);

            if (result && !result.error && !result.errors) {
                setSearchStatus(result);
            } else {
                setSearchStatus(null);
            }
        } catch (error) {
            setSearchStatus(null);
        } finally {
            setLoadingSearchStatus(false);
        }
    };

    // Handle Use button - perform search with saved search data
    const handleUseSavedSearch = async (savedSearch) => {
        // Handle both snake_case and camelCase field names
        const searchQuery = savedSearch?.search_query || savedSearch?.searchQuery || '';
        const searchFilters = savedSearch?.search_filters || savedSearch?.searchFilters || {};
        
        if (!searchQuery.trim()) {
            return;
        }

        try {
            setLoading(true);
            setSearchPerformed(true);

            // Get token from storage
            const loginResponse = await getObjByKey('loginResponse');
            if (!loginResponse || !loginResponse.token) {
                setLoading(false);
                return;
            }

            const url = `${BASE_URL}search/boolean-search`;
            
            // Determine if pro features are used
            const hasProFeatures = (searchFilters.mustHave && Array.isArray(searchFilters.mustHave) && searchFilters.mustHave.length > 0) ||
                                   (searchFilters.mustNotHave && Array.isArray(searchFilters.mustNotHave) && searchFilters.mustNotHave.length > 0);
            
            let payload;
            
            if (hasProFeatures) {
                // Pro Boolean Search (AND / NOT)
                payload = {
                    searchQuery: searchQuery.trim(),
                    useProFeatures: true,
                    filters: {
                        mustHave: searchFilters.mustHave || [],
                        mustNotHave: searchFilters.mustNotHave || [],
                        ...(searchFilters.experience && { experience: searchFilters.experience }),
                        ...(searchFilters.gender && { gender: searchFilters.gender }),
                        ...(searchFilters.location && { location: searchFilters.location.trim() }),
                    }
                };
            } else {
                // Basic Search (Free)
                payload = {
                    searchQuery: searchQuery.trim(),
                    filters: {
                        ...(searchFilters.experience && { experience: searchFilters.experience }),
                        ...(searchFilters.gender && { gender: searchFilters.gender }),
                        ...(searchFilters.location && { location: searchFilters.location.trim() }),
                    },
                    useProFeatures: false
                };
            }

            const result = await POSTNETWORK(url, payload, true);

            if (result && !result.error && !result.errors) {
                const candidatesData = result?.candidates || result?.data?.candidates || [];
                
                if (Array.isArray(candidatesData) && candidatesData.length > 0) {
                    setCandidates(candidatesData);
                    console.log('✅ Success: Found', candidatesData.length, 'candidates');
                } else {
                    setCandidates([]);
                }
            } else {
                setCandidates([]);
                console.log('❌ Error: Search failed -', result?.message || result?.error || 'Unknown error');
            }
        } catch (error) {
            console.log('❌ Error: Exception occurred during search -', error.message);
            setCandidates([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch saved searches and search status on component mount
    useEffect(() => {
        fetchSavedSearches();
        fetchSearchStatus();
    }, []);

    // Handle Android back button
    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            navigation.goBack();
            return true; // Prevent default behavior
        });

        return () => backHandler.remove();
    }, [navigation]);

    const renderCandidate = ({ item, index }) => {
        // Extract data from API response
        const candidateName = item?.full_name || `${item?.first_name || ''} ${item?.last_name || ''}`.trim() || "Candidate";
        const jobTitle = item?.job_title || "Job Title";

        return (
            <Pressable 
                style={[
                    styles.card,
                    index % 2 === 0 ? styles.cardLeft : styles.cardRight
                ]} 
                onPress={() => {
                    // Navigate to candidate details or show modal
                }}
            >
                <View style={styles.cardContent}>
                    {/* Card Info - Vertical Layout */}
                    <View style={styles.cardInfo}>
                        <Text style={styles.candidateName} numberOfLines={2}>{candidateName}</Text>
                        <Text style={styles.jobTitle} numberOfLines={1}>{jobTitle}</Text>
                        {item?.email && (
                            <Text style={styles.companyName} numberOfLines={1}>{item.email}</Text>
                        )}
                    </View>

                    {/* View Resume Button */}
                    <Pressable
                        style={styles.viewBtn}
                        onPress={(e) => {
                            e.stopPropagation();
                            // Handle view resume
                        }}
                    >
                        <MaterialCommunityIcons name="eye" size={HEIGHT * 0.018} color={WHITE} />
                        <Text style={styles.viewText}>View</Text>
                    </Pressable>
                </View>
            </Pressable>
        );
    };

    return (
        <>
            <StatusBar barStyle="dark-content" backgroundColor={WHITE} />
            <View style={styles.container}>
                <MyHeader
                    showBack
                    showCenterTitle
                    title="Boolean Search"
                    onBackPress={() => navigation.goBack()}
                />

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Premium Card Section */}
                    <View style={styles.premiumCardContainer}>
                        <ImageBackground 
                            source={PREMIUM}
                            style={styles.premiumCardBackground}
                            resizeMode="cover"
                        >
                            <View style={styles.premiumCardContent}>
                                <Text style={styles.premiumCardText}>
                                    Unlimited{'\n'}Boolean Search
                                </Text>
                            </View>
                        </ImageBackground>
                    </View>

                    {/* Search Candidates Section */}
                    <View style={styles.searchSection}>
                        <Text style={styles.sectionTitle}>Search Candidates</Text>

                        {/* Search Keywords */}
                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>
                                Search Keywords <Text style={styles.required}>*</Text>
                            </Text>
                            <TextInputComponent
                                placeholder="Enter keywords"
                                inputdata={searchKeywords}
                                setInputdata={setSearchKeywords}
                                image={KEYWORD}
                                borderColor={BRANDCOLOR}
                                width="100%"
                            />
                            <Text style={styles.hintText}>
                                Basic: Simple keyword search (unlimited)
                            </Text>
                        </View>

                        {/* Pro Features Checkbox */}
                        <TouchableOpacity
                            style={styles.checkboxContainer}
                            onPress={() => setUseProFeatures(!useProFeatures)}
                            activeOpacity={0.7}
                        >
                            <View style={[
                                styles.checkbox,
                                useProFeatures && styles.checkboxChecked
                            ]}>
                                {useProFeatures && (
                                    <Text style={styles.checkboxCheckmark}>✓</Text>
                                )}
                            </View>
                            <Text style={styles.checkboxLabel}>
                                Use Pro Features (Boolean Operators, Advanced Filters)
                            </Text>
                        </TouchableOpacity>

                        {/* Pro Features - Must Have (AND) */}
                        {useProFeatures && (
                            <View style={styles.proFeatureSection}>
                                <Text style={styles.proFeatureTitle}>Must have (AND)</Text>
                                <View style={styles.proFeatureInputRow}>
                                    <TextInputComponent
                                        placeholder="Enter Item"
                                        inputdata={mustHaveInput}
                                        setInputdata={setMustHaveInput}
                                        borderColor={BRANDCOLOR}
                                        width="75%"
                                    />
                                    <CustomButton
                                        text="Add"
                                        width="20%"
                                        height={50}
                                        backgroundColor={BRANDCOLOR}
                                        color={WHITE}
                                        fontSize={14}
                                        onPress={handleAddMustHave}
                                    />
                                </View>
                                {/* Display added items */}
                                {mustHaveItems.map((item, index) => (
                                    <View key={index} style={styles.tagContainer}>
                                        <Text style={styles.tagText}>{item}</Text>
                                        <TouchableOpacity
                                            onPress={() => handleRemoveMustHave(index)}
                                            style={styles.tagRemove}
                                        >
                                            <Text style={styles.tagRemoveText}>×</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Pro Features - Must Not Have (NOT) */}
                        {useProFeatures && (
                            <View style={styles.proFeatureSection}>
                                <Text style={styles.proFeatureTitle}>Must not have (NOT)</Text>
                                <View style={styles.proFeatureInputRow}>
                                    <TextInputComponent
                                        placeholder="Enter Item"
                                        inputdata={mustNotHaveInput}
                                        setInputdata={setMustNotHaveInput}
                                        borderColor={BRANDCOLOR}
                                        width="75%"
                                    />
                                    <CustomButton
                                        text="Add"
                                        width="20%"
                                        height={50}
                                        backgroundColor={BRANDCOLOR}
                                        color={WHITE}
                                        fontSize={14}
                                        onPress={handleAddMustNotHave}
                                    />
                                </View>
                                {/* Display added items */}
                                {mustNotHaveItems.map((item, index) => (
                                    <View key={index} style={styles.tagContainer}>
                                        <Text style={styles.tagText}>{item}</Text>
                                        <TouchableOpacity
                                            onPress={() => handleRemoveMustNotHave(index)}
                                            style={styles.tagRemove}
                                        >
                                            <Text style={styles.tagRemoveText}>×</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Experience Dropdown */}
                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>Experience</Text>
                            <View style={styles.pickerWrapper}>
                                <View style={styles.pickerContainer}>
                                    <View style={styles.pickerTextContainer}>
                                        <Text style={styles.pickerSelectedText} numberOfLines={1}>
                                            {experience === "" ? "All" : experience}
                                        </Text>
                                    </View>
                                    <Picker
                                        selectedValue={experience}
                                        onValueChange={setExperience}
                                        style={styles.picker}
                                        itemStyle={styles.pickerItem}
                                    >
                                        <Picker.Item label="All" value="" />
                                        <Picker.Item label="0-1 Years" value="0-1 Years" />
                                        <Picker.Item label="1-3 Years" value="1-3 Years" />
                                        <Picker.Item label="3-5 Years" value="3-5 Years" />
                                        <Picker.Item label="5-10 Years" value="5-10 Years" />
                                        <Picker.Item label="10+ Years" value="10+ Years" />
                                    </Picker>
                                    <Image source={DROPDOWN} style={styles.dropdownIcon} />
                                </View>
                            </View>
                        </View>

                        {/* Gender Dropdown */}
                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>Gender</Text>
                            <View style={styles.pickerWrapper}>
                                <View style={styles.pickerContainer}>
                                    <View style={styles.pickerTextContainer}>
                                        <Text style={styles.pickerSelectedText} numberOfLines={1}>
                                            {gender === "" ? "All" : gender}
                                        </Text>
                                    </View>
                                    <Picker
                                        selectedValue={gender}
                                        onValueChange={setGender}
                                        style={styles.picker}
                                        itemStyle={styles.pickerItem}
                                    >
                                        <Picker.Item label="All" value="" />
                                        <Picker.Item label="Male" value="Male" />
                                        <Picker.Item label="Female" value="Female" />
                                        <Picker.Item label="Other" value="Other" />
                                    </Picker>
                                    <Image source={DROPDOWN} style={styles.dropdownIcon} />
                                </View>
                            </View>
                        </View>

                        {/* Location */}
                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>Location</Text>
                            <TextInputComponent
                                placeholder="Enter location"
                                inputdata={location}
                                setInputdata={setLocation}
                                borderColor={BRANDCOLOR}
                                width="100%"
                            />
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.buttonContainer}>
                            <CustomButton
                                text="Search Candidates"
                                width="100%"
                                height={55}
                                backgroundColor={BRANDCOLOR}
                                color={WHITE}
                                fontSize={16}
                                fontFamily={COMICSBOLD}
                                onPress={handleSearchCandidates}
                                disabled={loading}
                            />
                            <CustomButton
                                text="Save Search"
                                width="100%"
                                height={55}
                                backgroundColor="#E5E5E5"
                                color={BLACK}
                                fontSize={16}
                                fontFamily={COMICSBOLD}
                                onPress={handleSaveSearch}
                            />
                        </View>
                    </View>

                    {/* Search Results Section */}
                    {searchPerformed && (
                        <View style={styles.resultsSection}>
                            <Text style={styles.sectionTitle}>
                                Search Results {candidates.length > 0 && `(${candidates.length})`}
                            </Text>
                            
                            {loading ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color={BRANDCOLOR} />
                                    <Text style={styles.loadingText}>Searching candidates...</Text>
                                </View>
                            ) : candidates.length > 0 ? (
                                <View style={styles.candidatesGrid}>
                                    {candidates.map((item, index) => (
                                        <View key={item?.candidate_id?.toString() || item?.application_id?.toString() || `candidate-${index}`}>
                                            {renderCandidate({ item, index })}
                                        </View>
                                    ))}
                                </View>
                            ) : (
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>No candidates found</Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Saved Searches Section */}
                    <View style={styles.savedSearchesSection}>
                        <Text style={styles.sectionTitle}>Saved Searches</Text>
                        
                        {loadingSavedSearches ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="small" color={BRANDCOLOR} />
                                <Text style={styles.loadingText}>Loading saved searches...</Text>
                            </View>
                        ) : savedSearches.length > 0 ? (
                            <View style={styles.savedSearchesGrid}>
                                {savedSearches.map((savedSearch, index) => {
                                    // Handle both snake_case and camelCase field names
                                    const searchName = savedSearch?.search_name || savedSearch?.searchName || 'Untitled Search';
                                    const searchQuery = savedSearch?.search_query || savedSearch?.searchQuery || '';
                                    const searchFilters = savedSearch?.search_filters || savedSearch?.searchFilters || {};
                                    
                                    // Count filters for display
                                    const filterCount = Object.keys(searchFilters).length;
                                    const hasMustHave = searchFilters.mustHave && Array.isArray(searchFilters.mustHave) && searchFilters.mustHave.length > 0;
                                    const hasMustNotHave = searchFilters.mustNotHave && Array.isArray(searchFilters.mustNotHave) && searchFilters.mustNotHave.length > 0;
                                    
                                    return (
                                        <Pressable
                                            key={savedSearch?.id || savedSearch?.savedSearchId || index}
                                            style={[
                                                styles.savedSearchCard,
                                                index % 2 === 0 ? styles.savedSearchCardLeft : styles.savedSearchCardRight
                                            ]}
                                            onPress={() => {
                                                // Apply saved search filters to form
                                                if (searchQuery) {
                                                    setSearchKeywords(searchQuery);
                                                }
                                                if (searchFilters && Object.keys(searchFilters).length > 0) {
                                                    if (searchFilters.experience) setExperience(searchFilters.experience);
                                                    if (searchFilters.gender) setGender(searchFilters.gender);
                                                    if (searchFilters.location) setLocation(searchFilters.location);
                                                    if (searchFilters.mustHave && Array.isArray(searchFilters.mustHave)) {
                                                        setMustHaveItems(searchFilters.mustHave);
                                                        setUseProFeatures(true);
                                                    }
                                                    if (searchFilters.mustNotHave && Array.isArray(searchFilters.mustNotHave)) {
                                                        setMustNotHaveItems(searchFilters.mustNotHave);
                                                        setUseProFeatures(true);
                                                    }
                                                }
                                            }}
                                        >
                                            <View style={styles.savedSearchCardContent}>
                                                {/* Icon and Name */}
                                                <View style={styles.savedSearchCardHeader}>
                                                    <View style={styles.savedSearchIconContainer}>
                                                        <MaterialCommunityIcons name="bookmark" size={HEIGHT * 0.03} color={BRANDCOLOR} />
                                                    </View>
                                                    <Text style={styles.savedSearchCardName} numberOfLines={2}>{searchName}</Text>
                                                </View>
                                                
                                                {/* Search Query */}
                                                <Text style={styles.savedSearchCardQuery} numberOfLines={1}>{searchQuery || 'No query'}</Text>
                                                
                                                {/* Filter Info */}
                                                {filterCount > 0 && (
                                                    <View style={styles.savedSearchCardFilters}>
                                                        {hasMustHave && (
                                                            <View style={styles.savedSearchFilterBadge}>
                                                                <MaterialCommunityIcons name="check-circle" size={HEIGHT * 0.014} color="#4CAF50" />
                                                                <Text style={styles.savedSearchFilterBadgeText}>{searchFilters.mustHave.length}</Text>
                                                            </View>
                                                        )}
                                                        {hasMustNotHave && (
                                                            <View style={[styles.savedSearchFilterBadge, styles.savedSearchFilterBadgeNegative]}>
                                                                <MaterialCommunityIcons name="close-circle" size={HEIGHT * 0.014} color="#FF5252" />
                                                                <Text style={styles.savedSearchFilterBadgeText}>{searchFilters.mustNotHave.length}</Text>
                                                            </View>
                                                        )}
                                                        {searchFilters.location && (
                                                            <View style={styles.savedSearchFilterBadge}>
                                                                <MaterialCommunityIcons name="map-marker" size={HEIGHT * 0.014} color="#2196F3" />
                                                                <Text style={styles.savedSearchFilterBadgeText} numberOfLines={1}>{searchFilters.location}</Text>
                                                            </View>
                                                        )}
                                                        {searchFilters.experience && (
                                                            <View style={styles.savedSearchFilterBadge}>
                                                                <MaterialCommunityIcons name="briefcase" size={HEIGHT * 0.014} color="#FF9800" />
                                                                <Text style={styles.savedSearchFilterBadgeText} numberOfLines={1}>{searchFilters.experience}</Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                )}
                                                
                                                {/* Play Button */}
                                                <Pressable
                                                    style={styles.savedSearchCardAction}
                                                    onPress={(e) => {
                                                        e.stopPropagation();
                                                        handleUseSavedSearch(savedSearch);
                                                    }}
                                                >
                                                    <MaterialCommunityIcons name="play-circle" size={HEIGHT * 0.02} color={WHITE} />
                                                    <Text style={styles.savedSearchCardActionText}>Use</Text>
                                                </Pressable>
                                            </View>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No saved searches</Text>
                            </View>
                        )}
                    </View>
                </ScrollView>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: WHITE,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: WIDTH * 0.04,
        paddingBottom: HEIGHT * 0.05,
    },
    statusContainer: {
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        padding: WIDTH * 0.04,
        marginBottom: HEIGHT * 0.025,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    statusTitle: {
        fontSize: HEIGHT * 0.022,
        fontFamily: ROBOTOBOLD,
        color: BLACK,
        marginBottom: HEIGHT * 0.01,
    },
    statusPlan: {
        fontSize: HEIGHT * 0.018,
        fontFamily: OXYGEN,
        color: BLACK,
        marginBottom: HEIGHT * 0.008,
    },
    statusFeature: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: HEIGHT * 0.005,
    },
    checkmark: {
        fontSize: HEIGHT * 0.02,
        color: BRANDCOLOR,
        marginRight: WIDTH * 0.02,
        fontFamily: CANTARELLBOLD,
    },
    statusFeatureText: {
        fontSize: HEIGHT * 0.016,
        fontFamily: CANTARELL,
        color: BLACK,
    },
    searchSection: {
        marginTop: HEIGHT * 0.01,
    },
    sectionTitle: {
        fontSize: HEIGHT * 0.024,
        fontFamily: OXYGENBOLD,
        color: BLACK,
        marginBottom: HEIGHT * 0.02,
    },
    inputWrapper: {
        marginBottom: HEIGHT * 0.018,
    },
    label: {
        fontSize: HEIGHT * 0.018,
        fontFamily: ROBOTOSEMIBOLD,
        color: BLACK,
        marginBottom: HEIGHT * 0.008,
        marginLeft: WIDTH * 0.02,
    },
    required: {
        color: 'red',
    },
    hintText: {
        fontSize: HEIGHT * 0.014,
        fontFamily: FIRASANS,
        color: '#666',
        marginLeft: WIDTH * 0.02,
        marginTop: HEIGHT * 0.005,
        fontStyle: 'italic',
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: HEIGHT * 0.02,
        marginLeft: WIDTH * 0.01,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderWidth: 2,
        borderColor: BRANDCOLOR,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: WHITE,
    },
    checkboxChecked: {
        backgroundColor: BRANDCOLOR,
    },
    checkboxCheckmark: {
        color: WHITE,
        fontSize: HEIGHT * 0.016,
        fontFamily: ROBOTOBOLD,
    },
    checkboxLabel: {
        fontSize: HEIGHT * 0.016,
        fontFamily: ROBOTO,
        color: BLACK,
        marginLeft: WIDTH * 0.02,
        flex: 1,
    },
    proFeatureSection: {
        backgroundColor: '#F9F9F9',
        borderRadius: 12,
        padding: WIDTH * 0.04,
        marginBottom: HEIGHT * 0.02,
        borderWidth: 1,
        borderColor: BRANDCOLOR,
    },
    proFeatureTitle: {
        fontSize: HEIGHT * 0.018,
        fontFamily: FIRASANSBOLD,
        color: BLACK,
        marginBottom: HEIGHT * 0.015,
    },
    proFeatureInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: HEIGHT * 0.015,
    },
    tagContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: BRANDCOLOR,
        borderRadius: 20,
        paddingHorizontal: WIDTH * 0.03,
        paddingVertical: HEIGHT * 0.008,
        marginRight: WIDTH * 0.02,
        marginBottom: HEIGHT * 0.01,
        alignSelf: 'flex-start',
    },
    tagText: {
        color: WHITE,
        fontSize: HEIGHT * 0.014,
        marginRight: WIDTH * 0.02,
    },
    tagRemove: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: WHITE,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tagRemoveText: {
        color: BRANDCOLOR,
        fontSize: HEIGHT * 0.018,
        fontFamily: CANTARELLBOLD,
    },
    pickerWrapper: {
        marginHorizontal: WIDTH * 0.02,
        marginTop: HEIGHT * 0.005,
        borderWidth: 1,
        borderColor: BRANDCOLOR,
        borderRadius: 15,
        backgroundColor: WHITE,
        minHeight: HEIGHT * 0.06,
    },
    pickerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingRight: WIDTH * 0.03,
        paddingLeft: WIDTH * 0.01,
        position: 'relative',
    },
    pickerTextContainer: {
        position: 'absolute',
        left: WIDTH * 0.01,
        right: WIDTH * 0.1,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
        zIndex: 1,
        paddingLeft: WIDTH * 0.02,
        pointerEvents: 'none',
    },
    pickerSelectedText: {
        fontSize: HEIGHT * 0.018,
        color: BLACK,
        fontFamily: OXYGEN,
    },
    picker: {
        flex: 1,
        color: 'transparent',
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
        resizeMode: 'contain',
        marginLeft: WIDTH * 0.02,
    },
    buttonContainer: {
        marginTop: HEIGHT * 0.025,
        gap: HEIGHT * 0.015,
    },
    resultsSection: {
        marginTop: HEIGHT * 0.03,
        marginBottom: HEIGHT * 0.03,
        paddingTop: HEIGHT * 0.02,
        paddingBottom: HEIGHT * 0.02,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    loadingContainer: {
        paddingVertical: HEIGHT * 0.05,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: HEIGHT * 0.01,
        fontSize: HEIGHT * 0.016,
        color: BRANDCOLOR,
        fontFamily: ROBOTOSEMIBOLD,
    },
    emptyContainer: {
        paddingVertical: HEIGHT * 0.05,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: HEIGHT * 0.018,
        color: '#666',
        fontFamily: FIRASANS,
    },
    candidatesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    row: {
        justifyContent: "space-between",
        marginBottom: HEIGHT * 0.015,
    },
    listContent: {
        paddingBottom: HEIGHT * 0.025,
    },
    card: {
        backgroundColor: WHITE,
        borderRadius: WIDTH * 0.03,
        padding: WIDTH * 0.035,
        borderWidth: 1,
        borderColor: "#E6E6E6",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        width: (WIDTH - WIDTH * 0.08 - WIDTH * 0.015) / 2, // Account for scrollContent padding (0.04 * 2 = 0.08) and gap
        aspectRatio: 1,
        justifyContent: "space-between",
        marginBottom: HEIGHT * 0.015,
    },
    cardLeft: {
        // No additional styling needed
    },
    cardRight: {
        // No additional styling needed
    },
    cardContent: {
        flex: 1,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
    },
    cardInfo: {
        flex: 1,
        width: "100%",
        alignItems: "center",
        justifyContent: "flex-start",
        paddingTop: HEIGHT * 0.01,
        marginBottom: HEIGHT * 0.015,
    },
    candidateName: {
        color: BLACK,
        fontSize: HEIGHT * 0.018,
        fontFamily: OXYGENBOLD,
        marginBottom: HEIGHT * 0.008,
        textAlign: "center",
        lineHeight: HEIGHT * 0.024,
    },
    jobTitle: {
        color: "#666",
        fontSize: HEIGHT * 0.014,
        fontFamily: ROBOTO,
        marginBottom: HEIGHT * 0.006,
        textAlign: "center",
    },
    companyName: {
        color: "#999",
        fontSize: HEIGHT * 0.012,
        fontFamily: CANTARELL,
        textAlign: "center",
        marginBottom: HEIGHT * 0.01,
    },
    viewBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: BRANDCOLOR,
        paddingVertical: HEIGHT * 0.01,
        paddingHorizontal: WIDTH * 0.04,
        borderRadius: WIDTH * 0.02,
        backgroundColor: BRANDCOLOR,
        width: "100%",
        gap: WIDTH * 0.015,
    },
    viewText: {
        color: WHITE,
        fontSize: HEIGHT * 0.014,
        fontFamily: FIRASANSBOLD,
    },
    savedSearchesSection: {
        marginTop: HEIGHT * 0.03,
        paddingTop: HEIGHT * 0.02,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    savedSearchesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    savedSearchCard: {
        backgroundColor: WHITE,
        borderRadius: WIDTH * 0.03,
        padding: WIDTH * 0.03,
        borderWidth: 1,
        borderColor: "#E6E6E6",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        width: (WIDTH - WIDTH * 0.08 - WIDTH * 0.015) / 2,
        minHeight: HEIGHT * 0.25,
        justifyContent: "space-between",
        marginBottom: HEIGHT * 0.015,
    },
    savedSearchCardLeft: {
        // No additional styling needed
    },
    savedSearchCardRight: {
        // No additional styling needed
    },
    savedSearchCardContent: {
        flex: 1,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
    },
    savedSearchCardHeader: {
        width: "100%",
        alignItems: "center",
        marginBottom: HEIGHT * 0.01,
    },
    savedSearchIconContainer: {
        width: WIDTH * 0.1,
        height: WIDTH * 0.1,
        borderRadius: WIDTH * 0.05,
        backgroundColor: '#F0F8FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: HEIGHT * 0.006,
    },
    savedSearchCardName: {
        color: BLACK,
        fontSize: HEIGHT * 0.017,
        fontFamily: OXYGENBOLD,
        textAlign: "center",
        lineHeight: HEIGHT * 0.022,
        marginBottom: HEIGHT * 0.006,
    },
    savedSearchCardQuery: {
        color: "#666",
        fontSize: HEIGHT * 0.013,
        fontFamily: ROBOTO,
        textAlign: "center",
        marginBottom: HEIGHT * 0.008,
        width: "100%",
    },
    savedSearchCardFilters: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'flex-start',
        width: "100%",
        marginBottom: HEIGHT * 0.008,
        gap: WIDTH * 0.008,
        minHeight: HEIGHT * 0.04,
    },
    savedSearchFilterBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F8FF',
        borderRadius: WIDTH * 0.012,
        paddingHorizontal: WIDTH * 0.015,
        paddingVertical: HEIGHT * 0.004,
        gap: WIDTH * 0.008,
        marginBottom: HEIGHT * 0.003,
    },
    savedSearchFilterBadgeNegative: {
        backgroundColor: '#FFEBEE',
    },
    savedSearchFilterBadgeText: {
        fontSize: HEIGHT * 0.011,
        fontFamily: CANTARELL,
        color: '#666',
        maxWidth: WIDTH * 0.18,
    },
    savedSearchCardAction: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: BRANDCOLOR,
        paddingVertical: HEIGHT * 0.008,
        paddingHorizontal: WIDTH * 0.025,
        borderRadius: WIDTH * 0.018,
        backgroundColor: BRANDCOLOR,
        width: "100%",
        gap: WIDTH * 0.008,
        marginTop: 'auto',
    },
    savedSearchCardActionText: {
        color: WHITE,
        fontSize: HEIGHT * 0.014,
        fontFamily: FIRASANSBOLD,
    },
    premiumCardContainer: {
        marginVertical: HEIGHT * 0.01,
        borderRadius: 12,
        overflow: 'hidden',
    },
    premiumCardBackground: {
        height: HEIGHT * 0.35,
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingRight: WIDTH * 0.08,
        paddingBottom: HEIGHT * 0.02,
    },
    premiumCardContent: {
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingRight: WIDTH * 0.03,
    },
    premiumCardText: {
        fontSize: HEIGHT * 0.024,
        fontFamily: ROBOTOBOLD,
        color: WHITE,
        textAlign: 'right',
        lineHeight: HEIGHT * 0.035,
    },
});

export default BooleanSearchScreen;
