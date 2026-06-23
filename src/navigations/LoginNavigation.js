import React, { useEffect, useState } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import SplashScreen from "../screens/loginScreens/SplashScreen";
import LoginScreen from "../screens/loginScreens/LoginScreen";
import RegisterScreen from "../screens/loginScreens/RegisterScreen";
import OnBoardingScreen from "../screens/loginScreens/OnBoardingScreen";
import BottomTabNavigation from "./BottomTabNavigation";
import { getStringByKey, storeStringByKey } from "../utils/Storage";

const Stack = createStackNavigator();

const LoginNavigation = () => {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    const resolveInitialRoute = async () => {
      const skipSplash = await getStringByKey("skipSplash");
      if (skipSplash === "true") {
        await storeStringByKey("skipSplash", "");
        const hasSeenOnboarding = await getStringByKey("hasSeenOnboarding");
        setInitialRoute(hasSeenOnboarding === "true" ? "MainTabs" : "OnBoarding");
        return;
      }
      setInitialRoute("Splash");
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
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="OnBoarding" component={OnBoardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="MainTabs" component={BottomTabNavigation} />
    </Stack.Navigator>
  );
};

export default LoginNavigation;
