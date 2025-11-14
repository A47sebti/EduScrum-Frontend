import React from 'react';
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createStackNavigator as createWebStackNavigator } from '@react-navigation/stack';
import Splash from '../screens/auth/Splash';
import Login from '../screens/auth/Login';
import Register from '../screens/auth/Register';

const Stack = Platform.OS === 'web' ? createWebStackNavigator() : createNativeStackNavigator();

export default function AuthStack({ initialRoute = 'Splash' }) {
  return (
    <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={Splash} />
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Register" component={Register} />
    </Stack.Navigator>
  );
}