import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Text, ActivityIndicator, Button, Card, Snackbar } from 'react-native-paper';
import { getProject } from '../../services/api/projects';
import { useAuth } from '../../context/AuthContext';

export default function ProjectDetail({ route, navigation }) {
  const { id } = route.params || {};
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { role } = useAuth();
  const canManage = role === 'scrum_master' || role === 'product_owner' || role === 'admin';

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getProject(id);
        setProject(data);
      } catch (e) {
        setError(e?.response?.data?.message || 'Erreur lors du chargement du projet');
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
      {project ? (
        <Card>
          <Card.Title title={project.name} />
          <Card.Content>
            <Text>{project.description || 'Aucune description.'}</Text>
          </Card.Content>
          <Card.Actions>
            {canManage && (
              <Button onPress={() => navigation.navigate('ProjectEdit', { id })}>Modifier</Button>
            )}
          </Card.Actions>
        </Card>
      ) : (
        <Text>Projet introuvable.</Text>
      )}

      <Snackbar visible={!!error} onDismiss={() => setError('')} duration={3000}>
        {error}
      </Snackbar>
    </View>
  );
}