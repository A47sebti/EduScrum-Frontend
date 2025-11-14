import client from './client';
import { setItem, getItem, deleteItem } from '../storage';

export async function login(email, password) {
  const { data } = await client.post('/api/auth/login', { email, password });
  await setItem('accessToken', data.token);
  await setItem('refreshToken', data.refreshToken);
  return data.user;
}

export async function register(payload) {
  const { data } = await client.post('/api/auth/register', payload);
  await setItem('accessToken', data.token);
  await setItem('refreshToken', data.refreshToken);
  return data.user;
}

export async function getProfile() {
  const { data } = await client.get('/api/auth/profile');
  return data;
}

export async function refresh(refreshToken) {
  const { data } = await client.post('/api/auth/refresh', { refreshToken });
  await setItem('accessToken', data.token);
  await setItem('refreshToken', data.refreshToken);
  return data;
}

export async function logout() {
  const refreshToken = await getItem('refreshToken');
  try {
    await client.post('/api/auth/logout', { refreshToken });
  } catch (e) {
    // ignore network errors on logout
  }
  await deleteItem('accessToken');
  await deleteItem('refreshToken');
}