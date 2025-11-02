import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { TextInput, Button, Snackbar, ActivityIndicator, Text } from 'react-native-paper';
import { getSprint, updateSprint } from '../../services/api/sprints';

export default function SprintEdit({ route, navigation }) {
  const { id } = route.params || {};
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getSprint(id);
        setName(data?.name || '');
        setGoal(data?.goal || data?.description || '');
        setStartDate(data?.startDate || '');
        setEndDate(data?.endDate || '');
      } catch (e) {
        setError(e?.response?.data?.message || 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const onSubmit = async () => {
    if (!name.trim()) {
      setError('Le nom est requis');
      return;
    }
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setError('La date de début doit précéder la date de fin');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await updateSprint(id, { name, goal, startDate: startDate || undefined, endDate: endDate || undefined });
      navigation.goBack();
    } catch (e) {
      setError(e?.response?.data?.message || 'Impossible de mettre à jour');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Chargement…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <TextInput label="Nom" value={name} onChangeText={setName} style={{ marginBottom: 12 }} />
      <TextInput label="Objectif" value={goal} onChangeText={setGoal} multiline style={{ marginBottom: 12 }} />
      <TextInput label="Date de début (YYYY-MM-DD)" value={startDate} onChangeText={setStartDate} style={{ marginBottom: 12 }} />
      <TextInput label="Date de fin (YYYY-MM-DD)" value={endDate} onChangeText={setEndDate} style={{ marginBottom: 12 }} />
      <Button mode="contained" onPress={onSubmit} loading={saving}>Enregistrer</Button>
      <Snackbar visible={!!error} onDismiss={() => setError('')} duration={3000}>
        {error}
      </Snackbar>
    </View>
  );
}