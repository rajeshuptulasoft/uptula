import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import SplashScreen from "../screens/loginScreens/SplashScreen";
import LoginScreen from "../screens/loginScreens/LoginScreen";
import RegisterScreen from "../screens/loginScreens/RegisterScreen";
import OnBoardingScreen from "../screens/loginScreens/OnBoardingScreen";
import BottomTabNavigation from "./BottomTabNavigation";

const Stack = createStackNavigator();

const LoginNavigation = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="Splash"
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

