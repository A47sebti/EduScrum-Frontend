import React, { useState } from 'react';
import { View } from 'react-native';
import { TextInput, Button, Snackbar, Text, Portal, Dialog, List, Divider } from 'react-native-paper';
import { createCeremony } from '../../services/api/ceremonies';

const CEREMONY_TYPES = [
  { key: 'daily', label: 'Daily Standup' },
  { key: 'planning', label: 'Sprint Planning' },
  { key: 'review', label: 'Sprint Review' },
  { key: 'retro', label: 'Retrospective' },
];

export default function CeremonyCreate({ navigation }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [datetime, setDatetime] = useState('');
  const [sprintId, setSprintId] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [typePickerOpen, setTypePickerOpen] = useState(false);

  const onSubmit = async () => {
    if (!title.trim()) {
      setError('Le titre est requis');
      return;
    }
    if (!type) {
      setError('Le type est requis');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await createCeremony({ title, type, datetime: datetime || undefined, sprintId: sprintId || undefined, notes: notes || undefined });
      navigation.goBack();
    } catch (e) {
      setError(e?.response?.data?.message || 'Impossible de créer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <TextInput label="Titre" value={title} onChangeText={setTitle} style={{ marginBottom: 12 }} />

      <Text style={{ marginBottom: 6 }}>Type</Text>
      <Button mode="outlined" onPress={() => setTypePickerOpen(true)}>
        {type ? CEREMONY_TYPES.find((t) => t.key === type)?.label || type : 'Choisir un type'}
      </Button>

      <TextInput label="Date & heure (libre)" value={datetime} onChangeText={setDatetime} style={{ marginTop: 12 }} />
      <TextInput label="Sprint ID (optionnel)" value={sprintId} onChangeText={setSprintId} style={{ marginTop: 12 }} />
      <TextInput label="Notes" value={notes} onChangeText={setNotes} style={{ marginTop: 12 }} multiline numberOfLines={3} />

      <Button mode="contained" onPress={onSubmit} loading={saving} disabled={saving} style={{ marginTop: 16 }}>
        Créer
      </Button>

      <Portal>
        <Dialog visible={typePickerOpen} onDismiss={() => setTypePickerOpen(false)}>
          <Dialog.Title>Choisir un type</Dialog.Title>
          <Dialog.Content>
            {CEREMONY_TYPES.map((t, idx) => (
              <View key={t.key}>
                <List.Item title={t.label} onPress={() => { setType(t.key); setTypePickerOpen(false); }} left={(props) => <List.Icon {...props} icon="checkbox-blank-circle-outline" />} />
                {idx < CEREMONY_TYPES.length - 1 ? <Divider /> : null}
              </View>
            ))}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setTypePickerOpen(false)}>Fermer</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar visible={!!error} onDismiss={() => setError('')} duration={3000}>
        {error}
      </Snackbar>
    </View>
  );
}