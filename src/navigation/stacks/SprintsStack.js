import React from 'react';
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createStackNavigator as createWebStackNavigator } from '@react-navigation/stack';
import SprintsList from '../../screens/sprints/SprintsList';
import SprintDetail from '../../screens/sprints/SprintDetail';
import SprintCreate from '../../screens/sprints/SprintCreate';
import SprintEdit from '../../screens/sprints/SprintEdit';

const Stack = Platform.OS === 'web' ? createWebStackNavigator() : createNativeStackNavigator();

export default function SprintsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="SprintsList" component={SprintsList} options={{ title: 'Sprints' }} />
      <Stack.Screen name="SprintDetail" component={SprintDetail} options={{ title: 'Détails du sprint' }} />
      <Stack.Screen name="SprintCreate" component={SprintCreate} options={{ title: 'Créer un sprint' }} />
      <Stack.Screen name="SprintEdit" component={SprintEdit} options={{ title: 'Modifier le sprint' }} />
    </Stack.Navigator>
  );
}