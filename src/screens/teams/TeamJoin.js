import React, { useState } from 'react';
import { View } from 'react-native';
import { TextInput, Button, Snackbar } from 'react-native-paper';
import { joinTeamByCode } from '../../services/api/teams';

export default function TeamJoin({ navigation }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async () => {
    if (!code.trim()) {
      setError('Le code est requis');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await joinTeamByCode(code.trim());
      navigation.goBack();
    } catch (e) {
      setError(e?.response?.data?.message || 'Impossible de rejoindre l’équipe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <TextInput label="Code" value={code} onChangeText={setCode} style={{ marginBottom: 12 }} />
      <Button mode="contained" onPress={onSubmit} loading={loading}>Rejoindre</Button>
      <Snackbar visible={!!error} onDismiss={() => setError('')} duration={3000}>
        {error}
      </Snackbar>
    </View>
  );
}