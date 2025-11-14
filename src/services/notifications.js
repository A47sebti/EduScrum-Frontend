import { Platform } from 'react-native';
import Constants from 'expo-constants';
import client from './api/client';

export async function initNotifications(user) {
  try {
    // Web et Expo Go: ne pas initialiser les notifications
    if (Platform.OS === 'web' || Constants?.appOwnership === 'expo') {
      return; // Expo Go: on évite toute complexité push pour les tests rapides
    }
    // Importer expo-notifications uniquement sur plateformes natives
    const Notifications = await import('expo-notifications');
    // Foreground display behavior
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });

    // Permissions & token (mobile only; Expo Go skipped above)
    let expoPushToken = null;
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus === 'granted') {
      const projectId = Constants?.expoConfig?.extra?.easProjectId || undefined;
      const token = await Notifications.getExpoPushTokenAsync({ projectId });
      expoPushToken = token?.data || null;
    }

    if (expoPushToken) {
      try {
        await client.post('/api/notifications/register', {
          token: expoPushToken,
          platform: Platform.OS,
          userId: user?.id,
        });
      } catch (_) {
        // silent
      }
    }

    // Handlers: foreground and response
    Notifications.addNotificationReceivedListener((notif) => {
      // Optionally wire into app state or screens
      // console.log('Foreground notification', notif);
    });
    Notifications.addNotificationResponseReceivedListener((response) => {
      // Handle taps on notifications
      // console.log('Notification response', response);
    });
  } catch (_) {
    // no-op
  }
}