import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { Provider, useDispatch, useSelector } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "../redux/reducers";
import { checkuserToken } from "../redux/actions/auth";
import LoginNavigation from "./LoginNavigation";
import AuthNavigation from "./AuthNavigation";
import { navigationRef } from "./NavigationService";

const Stack = createStackNavigator();

const AppNavigator = () => {
  const dispatch = useDispatch();
  const authStatus = useSelector((state) => state.authStatus);

  useEffect(() => {
    dispatch(checkuserToken());
  }, [dispatch]);

  return authStatus ? <AuthNavigation /> : <LoginNavigation />;
};

const store = configureStore({ reducer: rootReducer });

const Navigation = () => {
  return (
    <Provider store={store}>
      <NavigationContainer ref={navigationRef}>
        <AppNavigator />
      </NavigationContainer>
    </Provider>
  );
};

export default Navigation;
