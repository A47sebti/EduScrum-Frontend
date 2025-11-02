import React, { useState } from 'react';
import { View } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';

export default function Login({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (e) {
      setError('Identifiants invalides ou erreur réseau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
      <Text variant="titleLarge" style={{ marginBottom: 16 }}>Connexion</Text>
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{ marginBottom: 12 }}
      />
      <TextInput
        label="Mot de passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ marginBottom: 12 }}
      />
      {!!error && <HelperText type="error">{error}</HelperText>}
      <Button mode="contained" onPress={onSubmit} loading={loading} disabled={loading}>
        Se connecter
      </Button>
      <Button mode="text" onPress={() => navigation.navigate('Register')} style={{ marginTop: 12 }}>
        Créer un compte
      </Button>
    </View>
  );
}