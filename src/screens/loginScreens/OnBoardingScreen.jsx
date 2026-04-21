import React, { useRef, useState } from "react";
import { Image, StatusBar, StyleSheet, Text, TouchableOpacity, View, SafeAreaView, Platform } from "react-native";
import { BLACK, BRANDCOLOR, WHITE } from "../../constant/color";
import { FlatList } from "react-native-gesture-handler";
import { ONBOARDING } from "../../assets/data/onBoardingData";
import { UBUNTUBOLD, FIRASANSBOLD } from "../../constant/fontPath";
import { LOGO } from "../../constant/imagePath";
import { HEIGHT, WIDTH } from "../../constant/config";
import { storeStringByKey } from "../../utils/Storage";

export default OnBoardingScreen = ({ navigation }) => {
    const [screen, setScreen] = useState(1);

    const onNext = async () => {
        if (screen < ONBOARDING.length) {
            setScreen((prev) => prev + 1);
            flatListRef.current?.scrollToIndex({ index: screen, animated: true });
        } else {
            // Mark onboarding as completed
            await storeStringByKey("hasSeenOnboarding", "true");
            navigation.navigate("MainTabs");
        }
    };

    const onSkip = async () => {
        // Mark onboarding as completed when user skips
        await storeStringByKey("hasSeenOnboarding", "true");
        navigation.navigate("MainTabs");
    };

    const flatListRef = useRef(null);

    // To track the currently visible item on FlatList
    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems.length > 0) {
            setScreen(viewableItems[0].item.id);
        }
    });

    const viewabilityConfig = {
        itemVisiblePercentThreshold: 50, // When 50% of the item is visible, trigger the onViewableItemsChanged
        minimumViewTime: 100 // Minimum time an item is visible (in ms)
    };

    const Container = Platform.OS === "ios" ? SafeAreaView : View;

    return (
        <>
            <Container style={[
                styles.container,
                Platform.OS === "ios" && styles.containerIOS,
                Platform.OS === "android" && styles.containerAndroid
            ]}>
                <StatusBar 
                    backgroundColor={WHITE} 
                    barStyle={Platform.OS === "ios" ? "dark-content" : "dark-content"}
                    translucent={Platform.OS === "android"}
                />

                {/* Top View */}
                <View style={[
                    styles.top,
                    Platform.OS === "ios" && styles.topIOS,
                    Platform.OS === "android" && styles.topAndroid
                ]}>
                    {/* Header with centered logo */}
                    <View style={[
                        styles.headerContainer,
                        Platform.OS === "ios" && styles.headerContainerIOS,
                        Platform.OS === "android" && styles.headerContainerAndroid
                    ]}>
                            <Image
                            source={LOGO}
                            style={[
                                styles.imgLogo,
                                Platform.OS === "ios" && styles.imgLogoIOS,
                                Platform.OS === "android" && styles.imgLogoAndroid
                            ]}
                            />
                    </View>

                    {/* Onboarding FlatList */}
                    <FlatList
                        ref={flatListRef}
                        data={ONBOARDING}
                        horizontal={true}
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={item => item.id.toString()}
                        pagingEnabled={true}
                        onViewableItemsChanged={onViewableItemsChanged.current}
                        viewabilityConfig={viewabilityConfig}
                        scrollEventThrottle={16}
                        renderItem={({ item }) => {
                            return (
                                    <View style={[
                                        styles.item,
                                        Platform.OS === "ios" && styles.itemIOS,
                                        Platform.OS === "android" && styles.itemAndroid
                                    ]}>
                                        <View style={[
                                            styles.itemImgContainer,
                                            Platform.OS === "ios" && styles.itemImgContainerIOS,
                                            Platform.OS === "android" && styles.itemImgContainerAndroid
                                        ]}>
                                            <Image
                                                style={[
                                                    styles.itemImg,
                                                    Platform.OS === "ios" && styles.itemImgIOS,
                                                    Platform.OS === "android" && styles.itemImgAndroid
                                                ]}
                                                source={item.image}
                                            />
                                        </View>
                                    </View>
                            );
                        }}
                    />
                </View>

                {/* Bottom View */}
                <View style={[
                    styles.bottom,
                    Platform.OS === "ios" && styles.bottomIOS,
                    Platform.OS === "android" && styles.bottomAndroid
                ]}>
                    {/* Skip / Next */}
                    <View style={[
                        styles.navButtons,
                        Platform.OS === "ios" && styles.navButtonsIOS,
                        Platform.OS === "android" && styles.navButtonsAndroid
                    ]}>
                        <TouchableOpacity 
                            onPress={onSkip} 
                            style={[
                                styles.navBtn,
                                Platform.OS === "ios" && styles.navBtnIOS,
                                Platform.OS === "android" && styles.navBtnAndroid
                            ]}
                        >
                            <Text 
                                allowFontScaling={false} 
                                style={[
                                    styles.navBtnText,
                                    Platform.OS === "ios" && styles.navBtnTextIOS,
                                    Platform.OS === "android" && styles.navBtnTextAndroid
                                ]}
                            >
                                Skip
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={onNext} 
                            style={[
                                styles.navBtn, 
                                styles.nextBtn,
                                Platform.OS === "ios" && styles.navBtnIOS,
                                Platform.OS === "android" && styles.navBtnAndroid
                            ]}
                        >
                            <Text 
                                allowFontScaling={false} 
                                style={[
                                    styles.navBtnText, 
                                    styles.nextBtnText,
                                    Platform.OS === "ios" && styles.navBtnTextIOS,
                                    Platform.OS === "android" && styles.navBtnTextAndroid
                                ]}
                            >
                                {screen === ONBOARDING.length ? "Get Started" : "Next"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Container>
        </>
    );
};

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
    item: {
        width: WIDTH,
        justifyContent: "center",
        alignItems: "center",
    },
    itemIOS: {
        width: Platform.OS === "ios" ? WIDTH : WIDTH,
    },
    itemAndroid: {
        width: Platform.OS === "android" ? WIDTH : WIDTH,
    },
    itemImg: {
        width: WIDTH,
        height: HEIGHT * 0.7,
        resizeMode: "contain",
    },
    itemImgIOS: {
        height: Platform.OS === "ios" ? HEIGHT * 0.72 : HEIGHT * 0.7,
    },
    itemImgAndroid: {
        height: Platform.OS === "android" ? HEIGHT * 0.68 : HEIGHT * 0.7,
    },
    top: {
        flex: 0.8,
    },
    topIOS: {
        flex: Platform.OS === "ios" ? 0.82 : 0.8,
    },
    topAndroid: {
        flex: Platform.OS === "android" ? 0.78 : 0.8,
    },
    bottom: {
        flex: 0.2,
        justifyContent: 'center',
        alignItems: 'center'
    },
    bottomIOS: {
        flex: Platform.OS === "ios" ? 0.18 : 0.2,
        paddingBottom: Platform.OS === "ios" ? HEIGHT * 0.02 : 0,
    },
    bottomAndroid: {
        flex: Platform.OS === "android" ? 0.22 : 0.2,
        paddingBottom: Platform.OS === "android" ? HEIGHT * 0.01 : 0,
    },
    indicatorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    indicator: {
        width: WIDTH * 0.025,
        height: WIDTH * 0.025,
        borderRadius: WIDTH * 0.0125,
        marginHorizontal: WIDTH * 0.0125
    },
    activeIndicator: {
        backgroundColor: BRANDCOLOR,
        width: WIDTH * 0.075,
        height: WIDTH * 0.025
    },
    inactiveIndicator: {
        backgroundColor: BLACK
    },
    navButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "70%",
    },
    navButtonsIOS: {
        width: Platform.OS === "ios" ? "72%" : "70%",
    },
    navButtonsAndroid: {
        width: Platform.OS === "android" ? "68%" : "70%",
    },
    navBtn: {
        paddingVertical: HEIGHT * 0.015,
        paddingHorizontal: WIDTH * 0.08,
        borderRadius: WIDTH * 0.06,
        borderWidth: 1,
        borderColor: BLACK,
    },
    navBtnIOS: {
        paddingVertical: Platform.OS === "ios" ? HEIGHT * 0.018 : HEIGHT * 0.015,
        paddingHorizontal: Platform.OS === "ios" ? WIDTH * 0.09 : WIDTH * 0.08,
        borderRadius: Platform.OS === "ios" ? WIDTH * 0.08 : WIDTH * 0.06,
        borderWidth: Platform.OS === "ios" ? 1.5 : 1,
    },
    navBtnAndroid: {
        paddingVertical: Platform.OS === "android" ? HEIGHT * 0.013 : HEIGHT * 0.015,
        paddingHorizontal: Platform.OS === "android" ? WIDTH * 0.07 : WIDTH * 0.08,
        borderRadius: Platform.OS === "android" ? WIDTH * 0.05 : WIDTH * 0.06,
    },
    navBtnText: {
        color: BLACK,
        fontFamily: UBUNTUBOLD,
        fontSize: WIDTH * 0.04,
    },
    navBtnTextIOS: {
        fontSize: Platform.OS === "ios" ? WIDTH * 0.042 : WIDTH * 0.04,
    },
    navBtnTextAndroid: {
        fontSize: Platform.OS === "android" ? WIDTH * 0.038 : WIDTH * 0.04,
    },
    nextBtn: {
        backgroundColor: BRANDCOLOR,
        borderColor: BRANDCOLOR,
    },
    nextBtnText: {
        color: WHITE,
    },
    headerContainer: {
        height: HEIGHT * 0.12,
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
    },
    headerContainerIOS: {
        height: Platform.OS === "ios" ? HEIGHT * 0.14 : HEIGHT * 0.12,
        paddingTop: Platform.OS === "ios" ? HEIGHT * 0.02 : 0,
    },
    headerContainerAndroid: {
        height: Platform.OS === "android" ? HEIGHT * 0.10 : HEIGHT * 0.12,
        paddingTop: Platform.OS === "android" ? HEIGHT * 0.01 : 0,
    },
    imgLogo: {
        height: HEIGHT * 0.15,
        width: HEIGHT * 0.15,
        resizeMode: "contain",
        alignSelf: "center",
    },
    imgLogoIOS: {
        height: Platform.OS === "ios" ? HEIGHT * 0.16 : HEIGHT * 0.15,
        width: Platform.OS === "ios" ? HEIGHT * 0.16 : HEIGHT * 0.15,
    },
    imgLogoAndroid: {
        height: Platform.OS === "android" ? HEIGHT * 0.14 : HEIGHT * 0.15,
        width: Platform.OS === "android" ? HEIGHT * 0.14 : HEIGHT * 0.15,
    },
    textContainer: {
        flex: 2 / 3,
        alignItems: "center",
        justifyContent: "center"
    },
    txtHeader: {
        fontSize: WIDTH * 0.05,
        fontFamily: UBUNTUBOLD,
        color: BLACK
    },
    itemImgContainer: {
        justifyContent: "center",  // Center the image vertically
        alignItems: "center",      // Center the image horizontally
        height: HEIGHT,      // You can adjust the height as needed
        width: WIDTH,              // Full width of the screen
    },
    itemImgContainerIOS: {
        height: Platform.OS === "ios" ? HEIGHT * 0.85 : HEIGHT,
    },
    itemImgContainerAndroid: {
        height: Platform.OS === "android" ? HEIGHT * 0.82 : HEIGHT,
    },
    descTextContainer: {
        alignItems: "center",
        height: 700,
        width: WIDTH
    }
});