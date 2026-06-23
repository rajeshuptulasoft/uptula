import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, BackHandler } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "../hooks/useTranslation";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { BRANDCOLOR, BLACK, WHITE } from "../constant/color";
import { getObjByKey } from "../utils/Storage";

import HomeScreen from "../screens/userScreens/HomeScreen";
import SeekerHome from "../screens/userScreens/jobSeekerScreens/HomeScreen";
import ProviderHome from "../screens/userScreens/jobProviderScreens/HomeScreen";
import AddJobScreen from "../screens/userScreens/jobProviderScreens/AddJobScreen";
import ViewCandidate from "../screens/userScreens/jobProviderScreens/ViewCandidateScreen";
import AppliedJobsScreen from "../screens/userScreens/jobSeekerScreens/AppliedJobsScreen";
import WishlistScreen from "../screens/userScreens/jobSeekerScreens/WishlistScreen";
import UserChatScreen from "../screens/userScreens/jobSeekerScreens/UserChatScreen";
import EmployerChatScreen from "../screens/userScreens/jobProviderScreens/EmployerChatScreen";

const Tab = createBottomTabNavigator();

const GuestHomeScreen = HomeScreen;
const SeekerHomeScreen = SeekerHome;
const ProviderHomeScreen = ProviderHome;
const SeekerChatScreen = UserChatScreen;
const ProviderChatScreen = EmployerChatScreen;

const BottomTabNavigation = ({ route }) => {
  const { t, i18n } = useTranslation();
  const [role, setRole] = useState("guest");

  const resolveRoleFromLogin = (storedData) => {
    if (!storedData) {
      setRole("guest");
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
      setRole("guest");
      return;
    }

    if (typeof rawRole === "string") {
      const lower = rawRole.toLowerCase();
      if (lower.includes("provider")) {
        setRole("provider");
        return;
      }
      if (lower.includes("seeker")) {
        setRole("seeker");
        return;
      }
      setRole("seeker");
      return;
    }

    if (rawRole === 2 || rawRole === "2") {
      setRole("provider");
    } else {
      setRole("seeker");
    }
  };

  useEffect(() => {
    const retrieveRole = async () => {
      if (route?.params?.role === "seeker") {
        setRole("seeker");
        return;
      }
      if (route?.params?.role === "provider") {
        setRole("provider");
        return;
      }

      try {
        const storedData = await getObjByKey("loginResponse");
        resolveRoleFromLogin(storedData);
      } catch (error) {
        setRole("guest");
      }
    };

    retrieveRole();
  }, [route?.params?.role]);

  const renderIcon = (name) => ({ focused, size }) => (
    <MaterialCommunityIcons
      name={name}
      size={size ?? 24}
      color={focused ? BRANDCOLOR : "#777"}
    />
  );

  return (
    <Tab.Navigator
      key={i18n.language}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: BRANDCOLOR,
        tabBarInactiveTintColor: "#777",
        tabBarStyle: { backgroundColor: WHITE },
        tabBarBadgeStyle: {
          position: "absolute",
          top: -2,
          right: -2,
          minWidth: 18,
          height: 18,
          borderRadius: 9,
          backgroundColor: "#EF4444",
          justifyContent: "center",
          alignItems: "center",
        },
      }}
    >
      {role === "guest" && (
        <>
          <Tab.Screen
            name="Home"
            component={GuestHomeScreen}
            options={{
              tabBarLabel: t("tabs.home"),
              tabBarIcon: renderIcon("home-variant-outline"),
            }}
          />
          <Tab.Screen
            name="GuestChat"
            component={SeekerChatScreen}
            options={{
              tabBarLabel: t("tabs.chat"),
              tabBarIcon: renderIcon("message-text-outline"),
            }}
          />
        </>
      )}

      {role === "seeker" && (
        <>
          <Tab.Screen
            name="Home"
            component={SeekerHomeScreen}
            options={{
              tabBarLabel: t("tabs.home"),
              tabBarIcon: renderIcon("home-variant-outline"),
            }}
          />
          <Tab.Screen
            name="AppliedJob"
            component={AppliedJobsScreen}
            options={{
              tabBarLabel: t("tabs.appliedJob"),
              tabBarIcon: renderIcon("briefcase-check-outline"),
            }}
          />
          <Tab.Screen
            name="Wishlist"
            component={WishlistScreen}
            options={{
              tabBarLabel: t("tabs.wishlist"),
              tabBarIcon: renderIcon("heart-outline"),
            }}
          />
          <Tab.Screen
            name="SeekerChat"
            component={SeekerChatScreen}
            options={{
              tabBarLabel: t("tabs.chat"),
              tabBarIcon: renderIcon("message-text-outline"),
            }}
          />
        </>
      )}

      {role === "provider" && (
        <>
          <Tab.Screen
            name="ProviderHome"
            component={ProviderHomeScreen}
            options={{
              tabBarLabel: t("tabs.home"),
              tabBarIcon: renderIcon("home-variant-outline"),
            }}
          />
          <Tab.Screen
            name="AddJob"
            component={AddJobScreen}
            options={{
              tabBarLabel: t("tabs.addJob"),
              tabBarIcon: renderIcon("plus-box-outline"),
            }}
          />
          <Tab.Screen
            name="ViewCandidate"
            component={ViewCandidate}
            options={{
              tabBarLabel: t("tabs.viewCandidate"),
              tabBarIcon: renderIcon("account-eye-outline"),
            }}
          />
          <Tab.Screen
            name="ProviderChat"
            component={EmployerChatScreen}
            options={{
              tabBarLabel: t("tabs.chat"),
              tabBarIcon: renderIcon("message-text-outline"),
            }}
          />
        </>
      )}
    </Tab.Navigator>
  );
};

export default BottomTabNavigation;

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: WHITE,
    justifyContent: "center",
    alignItems: "center",
  },
  screenText: {
    fontSize: 20,
    color: BLACK,
  },
});
