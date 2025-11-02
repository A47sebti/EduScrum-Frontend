import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Text, ActivityIndicator, Button, Snackbar } from 'react-native-paper';
import { getCeremony } from '../../services/api/ceremonies';
import { useAuth } from '../../context/AuthContext';

export default function CeremonyDetail({ route, navigation }) {
  const { role } = useAuth();
  const canManage = role === 'scrum_master' || role === 'admin';
  const id = route?.params?.id;
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getCeremony(id);
      setItem(data?.ceremony || data);
    } catch (e) {
      setError(e?.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Chargement de la cérémonie…</Text>
      </View>
    );
  }

  if (!item) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Aucune donnée à afficher.</Text>
        <Snackbar visible={!!error} onDismiss={() => setError('')} duration={3000}>
          {error}
        </Snackbar>
      </View>
    );
  }

  const title = item.title || `Cérémonie #${item.id || item._id}`;
  const rows = [
    { label: 'Type', value: item.type },
    { label: 'Date/heure', value: item.datetime },
    { label: 'Sprint', value: item.sprintId },
    { label: 'Notes', value: item.notes },
  ];

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text variant="titleLarge">{title}</Text>
      <View style={{ height: 12 }} />
      {rows.map((r) => (
        r.value ? (
          <View key={r.label} style={{ marginBottom: 8 }}>
            <Text variant="bodyMedium" style={{ color: '#666' }}>{r.label}</Text>
            <Text variant="bodyLarge">{String(r.value)}</Text>
          </View>
        ) : null
      ))}

      {canManage && (
        <Button mode="contained" style={{ marginTop: 12 }} onPress={() => navigation.navigate('CeremonyEdit', { id })}>
          Modifier
        </Button>
      )}

      <Snackbar visible={!!error} onDismiss={() => setError('')} duration={3000}>
        {error}
      </Snackbar>
    </View>
  );
}