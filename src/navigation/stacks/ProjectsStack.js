import React from 'react';
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createStackNavigator as createWebStackNavigator } from '@react-navigation/stack';
import ProjectsList from '../../screens/projects/ProjectsList';
import ProjectDetail from '../../screens/projects/ProjectDetail';
import ProjectCreate from '../../screens/projects/ProjectCreate';
import ProjectEdit from '../../screens/projects/ProjectEdit';

const Stack = Platform.OS === 'web' ? createWebStackNavigator() : createNativeStackNavigator();

export default function ProjectsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ProjectsList" component={ProjectsList} options={{ title: 'Projets' }} />
      <Stack.Screen name="ProjectDetail" component={ProjectDetail} options={{ title: 'Détails du projet' }} />
      <Stack.Screen name="ProjectCreate" component={ProjectCreate} options={{ title: 'Créer un projet' }} />
      <Stack.Screen name="ProjectEdit" component={ProjectEdit} options={{ title: 'Modifier le projet' }} />
    </Stack.Navigator>
  );
}