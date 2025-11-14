import React from 'react';
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createStackNavigator as createWebStackNavigator } from '@react-navigation/stack';
import CeremoniesList from '../../screens/ceremonies/CeremoniesList';
import CeremonyDetail from '../../screens/ceremonies/CeremonyDetail';
import CeremonyCreate from '../../screens/ceremonies/CeremonyCreate';
import CeremonyEdit from '../../screens/ceremonies/CeremonyEdit';

const Stack = Platform.OS === 'web' ? createWebStackNavigator() : createNativeStackNavigator();

export default function CeremoniesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="CeremoniesList" component={CeremoniesList} options={{ title: 'Cérémonies' }} />
      <Stack.Screen name="CeremonyDetail" component={CeremonyDetail} options={{ title: 'Détail cérémonie' }} />
      <Stack.Screen name="CeremonyCreate" component={CeremonyCreate} options={{ title: 'Créer une cérémonie' }} />
      <Stack.Screen name="CeremonyEdit" component={CeremonyEdit} options={{ title: 'Modifier la cérémonie' }} />
    </Stack.Navigator>
  );
}