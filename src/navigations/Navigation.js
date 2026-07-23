import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { Provider, useDispatch, useSelector } from "react-redux";
import { checkuserToken } from "../redux/actions/auth";
import { store } from "../redux/store";
import LoginNavigation from "./LoginNavigation";
import AuthNavigation from "./AuthNavigation";
import { navigationRef } from "./NavigationService";
import { LanguageProvider } from "../i18n/LanguageProvider";
import SplashScreen from "../screens/loginScreens/SplashScreen";

const Stack = createStackNavigator();

const AppNavigator = () => {
  const dispatch = useDispatch();
  const authStatus = useSelector((state) => state.authStatus);
  const [splashDone, setSplashDone] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let active = true;

    const initAuth = async () => {
      try {
        await dispatch(checkuserToken());
      } finally {
        if (active) setAuthReady(true);
      }
    };

    initAuth();
    return () => {
      active = false;
    };
  }, [dispatch]);

  // Always show Splash on cold start / app reopen (logged in or not)
  if (!splashDone || !authReady) {
    return (
      <SplashScreen
        onFinish={() => setSplashDone(true)}
      />
    );
  }

  return authStatus ? <AuthNavigation /> : <LoginNavigation />;
};

const Navigation = () => {
  return (
    <Provider store={store}>
      <LanguageProvider>
        <NavigationContainer ref={navigationRef}>
          <AppNavigator />
        </NavigationContainer>
      </LanguageProvider>
    </Provider>
  );
};

export default Navigation;
