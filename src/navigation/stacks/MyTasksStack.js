import React from 'react';
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createStackNavigator as createWebStackNavigator } from '@react-navigation/stack';
import MyTasksScreen from '../../screens/board/MyTasksScreen';
import StoryDetail from '../../screens/stories/StoryDetail';
import StoryCreate from '../../screens/stories/StoryCreate';
import StoryEdit from '../../screens/stories/StoryEdit';

const Stack = Platform.OS === 'web' ? createWebStackNavigator() : createNativeStackNavigator();

export default function MyTasksStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MyTasksHome" component={MyTasksScreen} options={{ title: 'Mes tâches' }} />
      <Stack.Screen name="StoryDetail" component={StoryDetail} options={{ title: 'Détail de la story' }} />
      <Stack.Screen name="StoryCreate" component={StoryCreate} options={{ title: 'Créer une story' }} />
      <Stack.Screen name="StoryEdit" component={StoryEdit} options={{ title: 'Modifier la story' }} />
    </Stack.Navigator>
  );
}