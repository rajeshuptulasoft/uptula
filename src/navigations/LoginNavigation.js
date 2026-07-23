import React, { useEffect, useState } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import LoginScreen from "../screens/loginScreens/LoginScreen";
import RegisterScreen from "../screens/loginScreens/RegisterScreen";
import OnBoardingScreen from "../screens/loginScreens/OnBoardingScreen";
import BottomTabNavigation from "./BottomTabNavigation";
import { getStringByKey } from "../utils/Storage";

const Stack = createStackNavigator();

const LoginNavigation = () => {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    const resolveInitialRoute = async () => {
      // Splash is shown at app root on every launch.
      // After splash, guest users land on MainTabs or OnBoarding.
      const hasSeenOnboarding = await getStringByKey("hasSeenOnboarding");
      setInitialRoute(hasSeenOnboarding === "true" ? "MainTabs" : "OnBoarding");
    };

    resolveInitialRoute();
  }, []);

  if (!initialRoute) {
    return null;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName={initialRoute}
      key={initialRoute}
    >
      <Stack.Screen name="OnBoarding" component={OnBoardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="MainTabs" component={BottomTabNavigation} />
    </Stack.Navigator>
  );
};

export default LoginNavigation;
