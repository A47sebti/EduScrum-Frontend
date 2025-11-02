import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Text, ActivityIndicator, Button, Card, Snackbar } from 'react-native-paper';
import { getTeam } from '../../services/api/teams';

export default function TeamDetail({ route, navigation }) {
  const { id } = route.params || {};
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getTeam(id);
        setTeam(data);
      } catch (e) {
        setError(e?.response?.data?.message || 'Erreur lors du chargement de l’équipe');
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

  return (
    <View style={{ flex: 1, padding: 16 }}>
      {team ? (
        <Card>
          <Card.Title title={team.name} subtitle={team.code ? `Code: ${team.code}` : undefined} />
          <Card.Content>
            <Text>{team.description || 'Aucune description.'}</Text>
          </Card.Content>
          <Card.Actions>
            <Button onPress={() => navigation.navigate('TeamMembers', { id })}>Voir membres</Button>
            <Button onPress={() => navigation.navigate('TeamEdit', { id })}>Modifier</Button>
          </Card.Actions>
        </Card>
      ) : (
        <Text>Équipe introuvable.</Text>
      )}

      <Snackbar visible={!!error} onDismiss={() => setError('')} duration={3000}>
        {error}
      </Snackbar>
    </View>
  );
}