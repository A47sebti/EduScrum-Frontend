import React, { useState } from 'react';
import { View } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';

export default function Register({ navigation }) {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      await register({ email: email.trim(), password, name });
    } catch (e) {
      setError('Erreur lors de la création du compte.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
      <Text variant="titleLarge" style={{ marginBottom: 16 }}>Créer un compte</Text>
      <TextInput label="Nom" value={name} onChangeText={setName} style={{ marginBottom: 12 }} />
      <TextInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={{ marginBottom: 12 }} />
      <TextInput label="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry style={{ marginBottom: 12 }} />
      {!!error && <HelperText type="error">{error}</HelperText>}
      <Button mode="contained" onPress={onSubmit} loading={loading} disabled={loading}>
        S'inscrire
      </Button>
      <Button mode="text" onPress={() => navigation.navigate('Login')} style={{ marginTop: 12 }}>
        J'ai déjà un compte
      </Button>
    </View>
  );
}