import React, { useState } from 'react';
import { View } from 'react-native';
import { TextInput, Button, Snackbar } from 'react-native-paper';
import { createSprint } from '../../services/api/sprints';

export default function SprintCreate({ navigation }) {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async () => {
    if (!name.trim()) {
      setError('Le nom est requis');
      return;
    }
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setError('La date de début doit précéder la date de fin');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await createSprint({ name, goal, startDate: startDate || undefined, endDate: endDate || undefined });
      navigation.goBack();
    } catch (e) {
      setError(e?.response?.data?.message || 'Impossible de créer le sprint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <TextInput label="Nom" value={name} onChangeText={setName} style={{ marginBottom: 12 }} />
      <TextInput label="Objectif" value={goal} onChangeText={setGoal} multiline style={{ marginBottom: 12 }} />
      <TextInput label="Date de début (YYYY-MM-DD)" value={startDate} onChangeText={setStartDate} style={{ marginBottom: 12 }} />
      <TextInput label="Date de fin (YYYY-MM-DD)" value={endDate} onChangeText={setEndDate} style={{ marginBottom: 12 }} />
      <Button mode="contained" onPress={onSubmit} loading={loading}>Créer</Button>
      <Snackbar visible={!!error} onDismiss={() => setError('')} duration={3000}>
        {error}
      </Snackbar>
    </View>
  );
}