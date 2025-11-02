import React, { useState } from 'react';
import { View } from 'react-native';
import { TextInput, Button, Snackbar } from 'react-native-paper';
import { createTeam } from '../../services/api/teams';

export default function TeamCreate({ navigation }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async () => {
    if (!name.trim()) {
      setError('Le nom est requis');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await createTeam({ name, description });
      navigation.goBack();
    } catch (e) {
      setError(e?.response?.data?.message || 'Impossible de créer l’équipe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <TextInput label="Nom" value={name} onChangeText={setName} style={{ marginBottom: 12 }} />
      <TextInput label="Description" value={description} onChangeText={setDescription} multiline style={{ marginBottom: 12 }} />
      <Button mode="contained" onPress={onSubmit} loading={loading}>Créer</Button>
      <Snackbar visible={!!error} onDismiss={() => setError('')} duration={3000}>
        {error}
      </Snackbar>
    </View>
  );
}