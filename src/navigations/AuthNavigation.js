import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import DrawerNavigator from "./DrawerNavigator";

// Job Provider Screens
import ProviderHomeScreen from "../screens/userScreens/jobProviderScreens/HomeScreen";
import AddJobScreen from "../screens/userScreens/jobProviderScreens/AddJobScreen";
import ViewCandidateScreen from "../screens/userScreens/jobProviderScreens/ViewCandidateScreen";
import ProfileScreen from "../screens/userScreens/jobProviderScreens/ProfileScreen";
import EditProfileScreen from "../screens/userScreens/jobProviderScreens/EditProfileScreen";
import ReferralsScreen from "../screens/userScreens/jobProviderScreens/ReferralsScreen";
import ResumeScoringScreen from "../screens/userScreens/jobProviderScreens/ResumeScoring";
import PremiumMembershipScreen from "../screens/userScreens/jobProviderScreens/PremiumMembershipScreen";
import PrivacyPoliciesScreen from "../screens/userScreens/jobProviderScreens/PrivacyPoliciesScreen";
import TermsConditionsScreen from "../screens/userScreens/jobProviderScreens/TermsConditionsScreen";
import ManageJobScreen from "../screens/userScreens/jobProviderScreens/ManageJobScreen";
import ManageJobDetailsScreen from "../screens/userScreens/jobProviderScreens/ManageJobDetailsScreen";
import AnalyticsReportScreen from "../screens/userScreens/jobProviderScreens/AnalyticsRepost";
import NotificationScreen from "../screens/userScreens/jobProviderScreens/NotificationScreen";
import JobDetailsScreen from "../screens/userScreens/jobProviderScreens/JobDetailsScreen";
import EmployerChatScreen from "../screens/userScreens/jobProviderScreens/EmployerChatScreen";
import CategoriesScreen from "../screens/userScreens/jobProviderScreens/CategoriesScreen";

// Job Seeker Screens
import SeekerHomeScreen from "../screens/userScreens/jobSeekerScreens/HomeScreen";
import UserProfileScreen from "../screens/userScreens/jobSeekerScreens/UserProfileScreen";
import EditUserProfileScreen from "../screens/userScreens/jobSeekerScreens/EditUserProfileScreen";
import SeekerJobDetailsScreen from "../screens/userScreens/jobSeekerScreens/JobDetailsScreen";
import SeekerNotificationScreen from "../screens/userScreens/jobSeekerScreens/NotificationScreen";
import UserChatScreen from "../screens/userScreens/jobSeekerScreens/UserChatScreen";
import RecommendedJobScreen from "../screens/userScreens/jobSeekerScreens/RecommendedJobScreen";
import CompanyDetailsJobScreen from "../screens/userScreens/jobSeekerScreens/CompanyDetailsJobScreen";

const Stack = createStackNavigator();

const AuthNavigation = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="Main"
    >
      {/* Main app now wrapped by DrawerNavigator so Profile → openDrawer works */}
      <Stack.Screen name="Main" component={DrawerNavigator} />

      {/* Job Provider Screens */}
      <Stack.Screen name="ProviderHome" component={ProviderHomeScreen} />
      <Stack.Screen name="AddJob" component={AddJobScreen} />
      <Stack.Screen name="ViewCandidate" component={ViewCandidateScreen} />
      <Stack.Screen name="ProviderProfile" component={ProfileScreen} />
      <Stack.Screen name="EditProviderProfile" component={EditProfileScreen} />
      <Stack.Screen name="ProviderReferrals" component={ReferralsScreen} />
      <Stack.Screen name="ProviderResumeScoring" component={ResumeScoringScreen} />
      <Stack.Screen name="ProviderPremiumMembership" component={PremiumMembershipScreen} />
      <Stack.Screen name="ProviderPrivacyPolicies" component={PrivacyPoliciesScreen} />
      <Stack.Screen name="ProviderTermsConditions" component={TermsConditionsScreen} />
      <Stack.Screen name="ManageJobs" component={ManageJobScreen} />
      <Stack.Screen name="ManageJobDetails" component={ManageJobDetailsScreen} />
      <Stack.Screen name="AnalyticsReport" component={AnalyticsReportScreen} />
      <Stack.Screen name="ProviderNotifications" component={NotificationScreen} />
      <Stack.Screen name="JobDetails" component={JobDetailsScreen} />
      <Stack.Screen name="ProviderChat" component={EmployerChatScreen} />
      <Stack.Screen name="CategoriesScreen" component={CategoriesScreen} />

      {/* Job Seeker Screens */}
      <Stack.Screen name="SeekerHome" component={SeekerHomeScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      <Stack.Screen name="EditUserProfile" component={EditUserProfileScreen} />
      <Stack.Screen name="SeekerJobDetails" component={SeekerJobDetailsScreen} />
      <Stack.Screen name="SeekerNotifications" component={SeekerNotificationScreen} />
      <Stack.Screen name="SeekerChat" component={UserChatScreen} />
      <Stack.Screen name="RecommendedJob" component={RecommendedJobScreen} />
      <Stack.Screen name="CompanyDetailsJob" component={CompanyDetailsJobScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigation;

