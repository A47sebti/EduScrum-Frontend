import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Text, ActivityIndicator, Button, Card, Snackbar } from 'react-native-paper';
import { getSprint } from '../../services/api/sprints';
import { useAuth } from '../../context/AuthContext';

export default function SprintDetail({ route, navigation }) {
  const { id } = route.params || {};
  const [sprint, setSprint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { role } = useAuth();
  const canManage = role === 'scrum_master' || role === 'product_owner' || role === 'admin';

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getSprint(id);
        setSprint(data);
      } catch (e) {
        setError(e?.response?.data?.message || 'Erreur lors du chargement du sprint');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Chargement…</Text>
      </View>
    );
  }

  const range = sprint?.startDate && sprint?.endDate
    ? `${new Date(sprint.startDate).toLocaleDateString()} → ${new Date(sprint.endDate).toLocaleDateString()}`
    : undefined;

  return (
    <View style={{ flex: 1, padding: 16 }}>
      {sprint ? (
        <Card>
          <Card.Title title={sprint.name} subtitle={range} />
          <Card.Content>
            <Text>{sprint.goal || sprint.description || 'Aucun objectif.'}</Text>
          </Card.Content>
          <Card.Actions>
            {canManage && (
              <Button onPress={() => navigation.navigate('SprintEdit', { id })}>Modifier</Button>
            )}
          </Card.Actions>
        </Card>
      ) : (
        <Text>Sprint introuvable.</Text>
      )}

      <Snackbar visible={!!error} onDismiss={() => setError('')} duration={3000}>
        {error}
      </Snackbar>
    </View>
  );
}