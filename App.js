import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { theme } from './src/theme';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import AuthStack from './src/navigation/AuthStack';
import AppNavigator from './src/navigation/AppNavigator';

function Root() {
  const { user, initializing } = useAuth();
  return (
    <NavigationContainer>
      {initializing ? (
        <AuthStack initialRoute="Splash" />
      ) : user ? (
        <AppNavigator />
      ) : (
        <AuthStack initialRoute="Login" />
      )}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <StatusBar style="auto" />
        <Root />
      </AuthProvider>
    </PaperProvider>
  );
}
