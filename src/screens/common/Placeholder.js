import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';

export default function Placeholder({ title }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <Text variant="titleLarge">{title}</Text>
      <Text style={{ marginTop: 8 }} variant="bodyMedium">
        Écran en cours d'implémentation.
      </Text>
    </View>
  );
}