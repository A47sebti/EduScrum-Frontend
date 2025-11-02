import client from './client';
import * as SecureStore from 'expo-secure-store';

export async function login(email, password) {
  const { data } = await client.post('/api/auth/login', { email, password });
  await SecureStore.setItemAsync('accessToken', data.token);
  await SecureStore.setItemAsync('refreshToken', data.refreshToken);
  return data.user;
}

export async function register(payload) {
  const { data } = await client.post('/api/auth/register', payload);
  await SecureStore.setItemAsync('accessToken', data.token);
  await SecureStore.setItemAsync('refreshToken', data.refreshToken);
  return data.user;
}

export async function getProfile() {
  const { data } = await client.get('/api/auth/profile');
  return data;
}

export async function refresh(refreshToken) {
  const { data } = await client.post('/api/auth/refresh', { refreshToken });
  await SecureStore.setItemAsync('accessToken', data.token);
  await SecureStore.setItemAsync('refreshToken', data.refreshToken);
  return data;
}

export async function logout() {
  const refreshToken = await SecureStore.getItemAsync('refreshToken');
  try {
    await client.post('/api/auth/logout', { refreshToken });
  } catch (e) {
    // ignore network errors on logout
  }
  await SecureStore.deleteItemAsync('accessToken');
  await SecureStore.deleteItemAsync('refreshToken');
}