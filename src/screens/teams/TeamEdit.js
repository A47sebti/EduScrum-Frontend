import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { TextInput, Button, Snackbar, ActivityIndicator, Text } from 'react-native-paper';
import { getTeam, updateTeam } from '../../services/api/teams';

export default function TeamEdit({ route, navigation }) {
  const { id } = route.params || {};
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getTeam(id);
        setName(data?.name || '');
        setDescription(data?.description || '');
      } catch (e) {
        setError(e?.response?.data?.message || 'Erreur lors du chargement de l’équipe');
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
    setSaving(true);
    setError('');
    try {
      await updateTeam(id, { name, description });
      navigation.goBack();
    } catch (e) {
      setError(e?.response?.data?.message || 'Impossible de mettre à jour l’équipe');
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
      <TextInput label="Description" value={description} onChangeText={setDescription} multiline style={{ marginBottom: 12 }} />
      <Button mode="contained" onPress={onSubmit} loading={saving}>Enregistrer</Button>
      <Snackbar visible={!!error} onDismiss={() => setError('')} duration={3000}>
        {error}
      </Snackbar>
    </View>
  );
}