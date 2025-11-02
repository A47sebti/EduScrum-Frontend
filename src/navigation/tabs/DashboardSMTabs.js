import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Placeholder from '../../screens/common/Placeholder';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

export default function DashboardSMTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Teams: 'account-group',
            Projects: 'briefcase-outline',
            Sprints: 'timeline-outline',
            Ceremonies: 'calendar-check-outline',
            Chat: 'chat-outline',
            Profile: 'account-circle-outline',
          };
          const name = icons[route.name] || 'circle-outline';
          return <MaterialCommunityIcons name={name} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Teams" children={() => <Placeholder title="Teams" />} />
      <Tab.Screen name="Projects" children={() => <Placeholder title="Projects" />} />
      <Tab.Screen name="Sprints" children={() => <Placeholder title="Sprints" />} />
      <Tab.Screen name="Ceremonies" children={() => <Placeholder title="Ceremonies" />} />
      <Tab.Screen name="Chat" children={() => <Placeholder title="Chat" />} />
      <Tab.Screen name="Profile" children={() => <Placeholder title="Profile" />} />
    </Tab.Navigator>
  );
}