import React, { useState } from 'react';
import { View } from 'react-native';
import { Text, RadioButton, Button, Snackbar } from 'react-native-paper';
import { assignRole } from '../../services/api/teams';

const ROLES = ['scrum_master', 'product_owner', 'developer', 'student'];

export default function AssignRole({ route, navigation }) {
  const { teamId, userId, currentRole } = route.params || {};
  const [role, setRole] = useState(currentRole || 'developer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const onSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await assignRole(teamId, userId, role);
      setSuccess('Rôle mis à jour');
      navigation.goBack();
    } catch (e) {
      setError(e?.response?.data?.message || 'Impossible de mettre à jour le rôle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ marginBottom: 8 }}>Sélectionner un rôle</Text>
      <RadioButton.Group onValueChange={setRole} value={role}>
        {ROLES.map((r) => (
          <RadioButton.Item key={r} label={r} value={r} />
        ))}
      </RadioButton.Group>

      <Button mode="contained" onPress={onSubmit} loading={loading} style={{ marginTop: 16 }}>
        Enregistrer
      </Button>

      <Snackbar visible={!!error} onDismiss={() => setError('')} duration={3000}>
        {error}
      </Snackbar>
      <Snackbar visible={!!success} onDismiss={() => setSuccess('')} duration={2000}>
        {success}
      </Snackbar>
    </View>
  );
}