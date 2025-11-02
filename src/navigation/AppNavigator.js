import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import Placeholder from '../screens/common/Placeholder';
import TeamsStack from './stacks/TeamsStack';
import ProjectsStack from './stacks/ProjectsStack';
import SprintsStack from './stacks/SprintsStack';
import CeremoniesStack from './stacks/CeremoniesStack';
import StoriesStack from './stacks/StoriesStack';
import BacklogStack from './stacks/BacklogStack';
import BoardStack from './stacks/BoardStack';
import MyTasksStack from './stacks/MyTasksStack';
import { theme } from '../theme';

const Tab = createBottomTabNavigator();

function SMTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Teams: 'account-group-outline',
            Projects: 'folder-outline',
            Sprints: 'progress-clock',
            Ceremonies: 'calendar-check-outline',
            Chat: 'chat-outline',
            Profile: 'account-circle-outline',
          };
          return <MaterialCommunityIcons name={icons[route.name]} color={color} size={size} />;
        },
      })}
    >
      <Tab.Screen name="Teams" component={TeamsStack} />
      <Tab.Screen name="Projects" component={ProjectsStack} />
      <Tab.Screen name="Sprints" component={SprintsStack} />
      <Tab.Screen name="Ceremonies" component={CeremoniesStack} />
      <Tab.Screen name="Chat" component={() => <Placeholder title="Chat" />} />
      <Tab.Screen name="Profile" component={() => <Placeholder title="Profile" />} />
    </Tab.Navigator>
  );
}

function POTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Projects: 'folder-outline',
            Backlog: 'clipboard-list-outline',
            Stories: 'book-outline',
            Sprints: 'progress-clock',
            Chat: 'chat-outline',
            Profile: 'account-circle-outline',
          };
          return <MaterialCommunityIcons name={icons[route.name]} color={color} size={size} />;
        },
      })}
    >
      <Tab.Screen name="Projects" component={ProjectsStack} />
      <Tab.Screen name="Backlog" component={BacklogStack} />
      <Tab.Screen name="Stories" component={StoriesStack} />
      <Tab.Screen name="Sprints" component={SprintsStack} />
      <Tab.Screen name="Chat" component={() => <Placeholder title="Chat" />} />
      <Tab.Screen name="Profile" component={() => <Placeholder title="Profile" />} />
    </Tab.Navigator>
  );
}

function DevTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Board: 'view-kanban',
            MyTasks: 'format-list-bulleted',
            Chat: 'chat-outline',
            Notifications: 'bell-outline',
            Profile: 'account-circle-outline',
          };
          return <MaterialCommunityIcons name={icons[route.name]} color={color} size={size} />;
        },
      })}
    >
      <Tab.Screen name="Board" component={BoardStack} />
      <Tab.Screen name="MyTasks" component={MyTasksStack} />
      <Tab.Screen name="Chat" component={() => <Placeholder title="Chat" />} />
      <Tab.Screen name="Notifications" component={() => <Placeholder title="Notifications" />} />
      <Tab.Screen name="Profile" component={() => <Placeholder title="Profile" />} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { role } = useAuth();
  if (role === 'scrum_master') return <SMTabs />;
  if (role === 'product_owner') return <POTabs />;
  return <DevTabs />; // developer | student par défaut
}