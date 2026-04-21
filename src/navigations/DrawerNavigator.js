import React, { useState, useCallback } from 'react';
import { View, Text } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useFocusEffect } from '@react-navigation/native';
import CustomDrawerContent from './CustomDrawerContent';

// Use the main role-based bottom tab navigation inside the drawer
import BottomTabNavigation from './BottomTabNavigation';
import ProfileScreen from '../screens/userScreens/jobProviderScreens/ProfileScreen';
import EditProfileScreen from '../screens/userScreens/jobProviderScreens/EditProfileScreen';
import ReferralsScreen from '../screens/userScreens/jobProviderScreens/ReferralsScreen';
import ResumeScoringScreen from '../screens/userScreens/jobProviderScreens/ResumeScoring';
import PremiumMembershipScreen from '../screens/userScreens/jobProviderScreens/PremiumMembershipScreen';
import PrivacyPoliciesScreen from '../screens/userScreens/jobProviderScreens/PrivacyPoliciesScreen';
import TermsConditionsScreen from '../screens/userScreens/jobProviderScreens/TermsConditionsScreen';
import UserProfileScreen from '../screens/userScreens/jobSeekerScreens/UserProfileScreen';
import EditUserProfileScreen from '../screens/userScreens/jobSeekerScreens/EditUserProfileScreen';
import BooleanSearchScreen from '../screens/userScreens/jobProviderScreens/BooleanSearchScreen';
import ManageJobScreen from '../screens/userScreens/jobProviderScreens/ManageJobScreen';
import AnalyticsReportScreen from '../screens/userScreens/jobProviderScreens/AnalyticsRepost';
import ChangePasswordScreen from '../screens/userScreens/jobSeekerScreens/ChangePasswordScreen';
import ProviderChangePasswordScreen from '../screens/userScreens/jobProviderScreens/ChangePasswordScreen';
import CreateResumeScreen from '../screens/userScreens/jobSeekerScreens/CreateResumeScreen';
import MockInterviewScreen from '../screens/userScreens/jobSeekerScreens/MockInterviewScreen';

// Placeholder screens for new drawer routes used in CustomDrawerContent.
// Replace these with your real screen components when you create them.
const PlaceholderScreen = ({ title }) => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
    <Text>{title} Screen</Text>
  </View>
);
// const ChangePasswordScreen = () => <PlaceholderScreen title="Change Password" />;
const AboutUsScreen = () => <PlaceholderScreen title="About Us" />;
const AuthScreen = () => <PlaceholderScreen title="Login / Register" />;

const Drawer = createDrawerNavigator();

function DrawerNavigator() {
  const [drawerRefreshKey, setDrawerRefreshKey] = useState(0);

  // Callback function to refresh drawer content - memoized with useCallback
  const refreshDrawerContent = useCallback(() => {
    setDrawerRefreshKey((prev) => prev + 1);
  }, []);

  // Bump refresh key whenever this navigator screen gains focus
  // This ensures drawer content refetches latest profile data (companyName, logoUrl for provider, 
  // firstName+lastName, profilePicture for seeker)
  // useFocusEffect(
  //   useCallback(() => {
  //     refreshDrawerContent();
  //   }, [refreshDrawerContent])
  // );

  // Memoize the drawer content render function to prevent unnecessary re-renders
  const renderDrawerContent = useCallback((props) => {
    return (
      <CustomDrawerContent
        {...props}
        refreshKey={drawerRefreshKey}
        onRefresh={refreshDrawerContent}
      />
    );
  }, [drawerRefreshKey, refreshDrawerContent]);

  return (
    <Drawer.Navigator
      drawerContent={renderDrawerContent}
      screenOptions={{ headerShown: false }}
    >
      {/* Main role-based bottom tabs */}
      <Drawer.Screen name="MainApp" component={BottomTabNavigation} />

      {/* Profile Screen - Provider */}
      <Drawer.Screen name="ProfileScreen" component={ProfileScreen} />

      {/* New routes for provider drawer */}
      <Drawer.Screen name="EditProfile" component={EditProfileScreen} />
      <Drawer.Screen name="BooleanSearch" component={BooleanSearchScreen} />
      <Drawer.Screen name="ManageJobs" component={ManageJobScreen} />
      <Drawer.Screen name="ResumeScoring" component={ResumeScoringScreen} />
      <Drawer.Screen name="AnalyticsReport" component={AnalyticsReportScreen} />
      <Drawer.Screen name="Referrals" component={ReferralsScreen} />
      <Drawer.Screen name="PremiumMembership" component={PremiumMembershipScreen} />
      <Drawer.Screen name="TermsConditions" component={TermsConditionsScreen} />
      <Drawer.Screen name="PrivacyPolicies" component={PrivacyPoliciesScreen} />

      {/* New routes for seeker drawer */}
      <Drawer.Screen name="UserProfile" component={UserProfileScreen} />
      <Drawer.Screen name="EditUserProfile" component={EditUserProfileScreen} />
      <Drawer.Screen name="MockInterview" component={MockInterviewScreen} />
      <Drawer.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Drawer.Screen name="ChangePasswordProvider" component={ProviderChangePasswordScreen} />
      <Drawer.Screen name="CreateResume" component={CreateResumeScreen} />
      <Drawer.Screen name="AboutUs" component={AboutUsScreen} />

      {/* Guest login / register */}
      <Drawer.Screen name="Auth" component={AuthScreen} />
    </Drawer.Navigator>
  );
}

export default DrawerNavigator;
