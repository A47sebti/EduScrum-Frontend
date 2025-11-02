import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import StoriesList from '../../screens/stories/StoriesList';
import StoryDetail from '../../screens/stories/StoryDetail';
import StoryCreate from '../../screens/stories/StoryCreate';
import StoryEdit from '../../screens/stories/StoryEdit';

const Stack = createNativeStackNavigator();

export default function StoriesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="StoriesList" component={StoriesList} options={{ title: 'Stories' }} />
      <Stack.Screen name="StoryDetail" component={StoryDetail} options={{ title: 'Détails de la story' }} />
      <Stack.Screen name="StoryCreate" component={StoryCreate} options={{ title: 'Créer une story' }} />
      <Stack.Screen name="StoryEdit" component={StoryEdit} options={{ title: 'Modifier la story' }} />
    </Stack.Navigator>
  );
}