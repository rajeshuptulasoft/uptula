import React, { useState, useEffect, useCallback } from "react";
import {
    Image,
    Pressable,
    StyleSheet,
    View,
    Text,
    StatusBar,
    Platform,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { BLACK, WHITE } from "../../constant/color";
import { PROFILE, SEARCH, NOTIFICATION, BACK, LOGO } from "../../constant/imagePath";
import { CANTARELLBOLD, CANTARELL, FIRASANSBOLD, FIRASANS, FIRASANSSEMIBOLD, OXYGENBOLD, OXYGEN, ROBOTOBOLD, ROBOTOSEMIBOLD, ROBOTO, UBUNTUBOLD, UBUNTU, COMICSBOLD } from "../../constant/fontPath";
import { getObjByKey } from "../../utils/Storage";
import { BASE_URL } from "../../constant/url";
import { GETNETWORK } from "../../utils/Network";

export const MyHeader = ({
    backgroundColor = "transparent",
    height = 70,
    onProfilePress = () => { },
    onNotificationPress = () => { },
    onSearchPress = () => { },
    profileImgSource = PROFILE,
    searchPlaceholder = "Search",
    // New props for back button layout
    showBack = false,
    showCenterTitle = false,
    title = "",
    onBackPress = () => { },
    showLogo = false,
    showNotification = true,
}) => {
    const [dynamicProfileImage, setDynamicProfileImage] = useState(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const safeUnreadCount = Number(unreadCount) > 0 ? Number(unreadCount) : 0;

    const extractUserId = (loginData) => {
        return loginData?.user?.id
            || loginData?.user?._id
            || loginData?.user?.userId
            || loginData?.userId
            || loginData?.id
            || loginData?._id
            || loginData?.data?.user?.id
            || loginData?.data?.user?._id
            || loginData?.data?.user?.userId
            || loginData?.data?.userId
            || loginData?.data?.id
            || loginData?.data?._id
            || null;
    };

    const fetchUnreadCount = useCallback(async (loginData) => {
        try {
            if (!loginData || !loginData.token) {
                setUnreadCount(0);
                return;
            }

            const userId = extractUserId(loginData);
            if (!userId) {
                setUnreadCount(0);
                return;
            }

            const url = `${BASE_URL}profile/notifications/unread/count/${userId}`;
            const result = await GETNETWORK(url, true);
            const count = result?.data?.count
                ?? result?.count
                ?? result?.unreadCount
                ?? result?.unread_count
                ?? result?.data?.unreadCount
                ?? result?.data?.unread_count
                ?? 0;

            const parsedCount = Number(count) || 0;
            setUnreadCount(parsedCount > 0 ? parsedCount : 0);
        } catch (error) {
            setUnreadCount(0);
        }
    }, []);

    // Fetch user profile image based on role
    const fetchProfileImage = useCallback(async () => {
        try {
            setIsLoadingProfile(true);

            // Get user data from storage
            const loginData = await getObjByKey("loginResponse");

            if (!loginData || !loginData.token) {
                setIsLoadingProfile(false);
                setUnreadCount(0);
                return;
            }

            await fetchUnreadCount(loginData);

            // Determine user role
            const role = loginData?.role || loginData?.userType || loginData?.user?.role || '';
            const roleLower = role.toLowerCase();

            let profileImageUrl = null;

            if (roleLower.includes('provider')) {
                // Fetch Job Provider profile (logoUrl)
                const url = `${BASE_URL}employer/profile`;
                const result = await GETNETWORK(url, true);
                const profileData = result?.profile || result;

                // Check multiple possible field names for logoUrl
                profileImageUrl =
                    profileData?.logoUrl ||
                    profileData?.logo ||
                    profileData?.companyLogo ||
                    profileData?.company_logo ||
                    result?.logoUrl ||
                    result?.logo ||
                    result?.companyLogo ||
                    null;
            } else if (roleLower.includes('seeker') || roleLower.includes('user')) {
                // Fetch Job Seeker profile (profilePicture)
                const url = `${BASE_URL}profile`;
                const result = await GETNETWORK(url, true);
                const profileData = result?.profile || result?.data || result;

                profileImageUrl =
                    profileData?.profilePicture ||
                    profileData?.profile_picture ||
                    profileData?.picture ||
                    profileData?.avatar ||
                    profileData?.image ||
                    profileData?.photo ||
                    result?.profilePicture ||
                    result?.profile_picture ||
                    null;
            }

            // Construct full URL if it's a relative path
            if (profileImageUrl && profileImageUrl.trim() !== '') {
                if (!profileImageUrl.startsWith('http://') && !profileImageUrl.startsWith('https://')) {
                    const baseUrl = BASE_URL.replace('/api/', '/');
                    profileImageUrl = baseUrl + profileImageUrl.replace(/^\//, '');
                }
                setDynamicProfileImage(profileImageUrl);
            } else {
                setDynamicProfileImage(null);
            }
        } catch (error) {
            console.error('Error fetching profile image:', error);
            setDynamicProfileImage(null);
        } finally {
            setIsLoadingProfile(false);
        }
    }, []);

    // Fetch profile image on mount
    useEffect(() => {
        fetchProfileImage();
    }, [fetchProfileImage]);

    // Refresh profile image when screen comes into focus (e.g., after editing profile)
    useFocusEffect(
        useCallback(() => {
            fetchProfileImage();
        }, [fetchProfileImage])
    );
    // If showBack is true, render back button + center title layout
    if (showBack) {
        return (
            <View
                style={[
                    styles.container,
                    {
                        backgroundColor: backgroundColor,
                        height: height,
                        marginTop:
                            Platform.OS === "android"
                                ? Math.max((StatusBar.currentHeight || 0) - 6, 0)
                                : 4,
                    },
                ]}
            >
                {/* Left: Back Button */}
                <Pressable onPress={onBackPress} style={styles.backContainer}>
                    <Image style={styles.backIcon} source={BACK} />
                </Pressable>

                {/* Middle: Title */}
                {showCenterTitle && (
                    <View style={styles.centerTitleContainer}>
                        <Text allowFontScaling={false} style={styles.centerTitle}>
                            {title}
                        </Text>
                    </View>
                )}

                {/* Right: Empty space for alignment */}
                <View style={styles.backContainer} />
            </View>
        );
    }

    // If showCenterTitle is true and showBack is false, show only center title
    if (showCenterTitle && !showBack) {
        return (
            <View
                style={[
                    styles.container,
                    {
                        backgroundColor: backgroundColor,
                        height: height,
                        marginTop:
                            Platform.OS === "android"
                                ? Math.max((StatusBar.currentHeight || 0) - 6, 0)
                                : 4,
                    },
                ]}
            >
                {/* Only Center Title */}
                <View style={styles.centerTitleContainer}>
                    <Text allowFontScaling={false} style={styles.centerTitle}>
                        {title}
                    </Text>
                </View>
            </View>
        );
    }

    // Default layout: Profile, Search, Notification
    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: backgroundColor,
                    height: height,
                    // smaller gap so header sits closer to the status bar
                    marginTop:
                        Platform.OS === "android"
                            ? Math.max((StatusBar.currentHeight || 0) - 6, 0)
                            : 4,
                },
            ]}
        >
            {/* Left: Profile */}
            <Pressable onPress={onProfilePress} style={styles.childContainer}>
                {dynamicProfileImage ? (
                    <Image
                        style={styles.profileImg}
                        source={{ uri: dynamicProfileImage }}
                        defaultSource={profileImgSource || PROFILE}
                        onError={() => {
                            setDynamicProfileImage(null);
                        }}
                    />
                ) : (
                    <Image style={styles.profileImg} source={profileImgSource || PROFILE} />
                )}
            </Pressable>

            {/* Middle: LOGO or Search pill */}
            {showLogo ? (
                <View style={styles.logoContainer}>
                    <Image style={styles.logo} source={LOGO} />
                </View>
            ) : (
                <Pressable style={styles.searchPill} onPress={onSearchPress}>
                    <Image style={styles.searchIcon} source={SEARCH} />
                    <Text allowFontScaling={false} style={styles.searchText}>
                        {searchPlaceholder}
                    </Text>
                </Pressable>
            )}

            {/* Right: Notification
                <Pressable onPress={onNotificationPress} style={styles.notificationContainer}>
                    <Image style={styles.notificationIcon} source={NOTIFICATION} />
                    {safeUnreadCount > 0 && (
                        <View style={styles.notificationBadge}>
                            <Text style={styles.notificationBadgeText}>{safeUnreadCount}</Text>
                        </View>
                    )}
                </Pressable> */}

            {/* Right: Notification */}
            {showNotification && (
                <Pressable onPress={onNotificationPress} style={styles.notificationContainer}>
                    <Image style={styles.notificationIcon} source={NOTIFICATION} />
                    {safeUnreadCount > 0 && (
                        <View style={styles.notificationBadge}>
                            <Text style={styles.notificationBadgeText}>{safeUnreadCount}</Text>
                        </View>
                    )}
                </Pressable>
            )}

            <View style={styles.hiddenFontsContainer} pointerEvents="none" accessibilityElementsHidden={true} importantForAccessibility="no-hide-descendants">
                <Text style={[styles.hiddenFontText, styles.cantarellBold]}>.</Text>
                <Text style={[styles.hiddenFontText, styles.cantarell]}>.</Text>
                <Text style={[styles.hiddenFontText, styles.firaSansBold]}>.</Text>
                <Text style={[styles.hiddenFontText, styles.firaSans]}>.</Text>
                <Text style={[styles.hiddenFontText, styles.firaSansSemiBold]}>.</Text>
                <Text style={[styles.hiddenFontText, styles.oxygenBold]}>.</Text>
                <Text style={[styles.hiddenFontText, styles.oxygen]}>.</Text>
                <Text style={[styles.hiddenFontText, styles.robotoBold]}>.</Text>
                <Text style={[styles.hiddenFontText, styles.robotoSemiBold]}>.</Text>
                <Text style={[styles.hiddenFontText, styles.roboto]}>.</Text>
                <Text style={[styles.hiddenFontText, styles.ubuntuBold]}>.</Text>
                <Text style={[styles.hiddenFontText, styles.ubuntu]}>.</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
    },
    childContainer: {
        justifyContent: "center",
        alignItems: "center",
        marginRight: 8,
    },
    profileImg: {
        height: 40,
        width: 40,
        borderRadius: 20,
        resizeMode: "cover",
    },
    notificationContainer: {
        justifyContent: "center",
        alignItems: "center",
        marginLeft: 8,
        position: "relative",
    },
    notificationIcon: {
        height: 26,
        width: 26,
        resizeMode: "contain",
    },
    notificationBadge: {
        position: "absolute",
        top: -4,
        right: -4,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: "#FF3B30",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 4,
    },
    notificationBadgeText: {
        color: WHITE,
        fontSize: 10,
        fontFamily: COMICSBOLD,
    },
    hiddenFontsContainer: {
        position: "absolute",
        width: 0,
        height: 0,
        opacity: 0,
        overflow: "hidden",
    },
    hiddenFontText: {
        fontSize: 1,
        color: "transparent",
        height: 0,
        width: 0,
    },
    cantarellBold: {
        fontFamily: CANTARELLBOLD,
    },
    cantarell: {
        fontFamily: CANTARELL,
    },
    firaSansBold: {
        fontFamily: FIRASANSBOLD,
    },
    firaSans: {
        fontFamily: FIRASANS,
    },
    firaSansSemiBold: {
        fontFamily: FIRASANSSEMIBOLD,
    },
    oxygenBold: {
        fontFamily: OXYGENBOLD,
    },
    oxygen: {
        fontFamily: OXYGEN,
    },
    robotoBold: {
        fontFamily: ROBOTOBOLD,
    },
    robotoSemiBold: {
        fontFamily: ROBOTOSEMIBOLD,
    },
    roboto: {
        fontFamily: ROBOTO,
    },
    ubuntuBold: {
        fontFamily: UBUNTUBOLD,
    },
    ubuntu: {
        fontFamily: UBUNTU,
    },
    searchIcon: {
        height: 20,
        width: 20,
    },
    searchPill: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start",
        backgroundColor: "#F2F4F5",
        borderRadius: 24,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginHorizontal: 8,
    },
    searchText: {
        marginLeft: 8,
        color: "#555",
        fontSize: 14,
        fontFamily: COMICSBOLD,
    },
    // Back button layout styles
    backContainer: {
        justifyContent: "center",
        alignItems: "center",
        width: 40,
        height: 40,
    },
    backIcon: {
        height: 24,
        width: 24,
        resizeMode: "contain",
    },
    centerTitleContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    centerTitle: {
        fontSize: 18,
        fontFamily: UBUNTUBOLD,
        color: BLACK,
    },
    logoContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        marginHorizontal: 8,
    },
    logo: {
        height: 40,
        width: 120,
        resizeMode: "contain",
    },
});