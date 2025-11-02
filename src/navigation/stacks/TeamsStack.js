import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TeamsList from '../../screens/teams/TeamsList';
import TeamDetail from '../../screens/teams/TeamDetail';
import TeamCreate from '../../screens/teams/TeamCreate';
import TeamJoin from '../../screens/teams/TeamJoin';
import TeamMembers from '../../screens/teams/TeamMembers';
import AssignRole from '../../screens/teams/AssignRole';
import TeamEdit from '../../screens/teams/TeamEdit';

const Stack = createNativeStackNavigator();

export default function TeamsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="TeamsList" component={TeamsList} options={{ title: 'Équipes' }} />
      <Stack.Screen name="TeamDetail" component={TeamDetail} options={{ title: 'Détails équipe' }} />
      <Stack.Screen name="TeamMembers" component={TeamMembers} options={{ title: 'Membres' }} />
      <Stack.Screen name="AssignRole" component={AssignRole} options={{ title: 'Assigner rôle' }} />
      <Stack.Screen name="TeamCreate" component={TeamCreate} options={{ title: 'Créer une équipe' }} />
      <Stack.Screen name="TeamJoin" component={TeamJoin} options={{ title: 'Rejoindre une équipe' }} />
      <Stack.Screen name="TeamEdit" component={TeamEdit} options={{ title: 'Modifier l’équipe' }} />
    </Stack.Navigator>
  );
}