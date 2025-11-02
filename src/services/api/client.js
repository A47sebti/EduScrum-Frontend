import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const API_BASE_URL = (Constants?.expoConfig?.extra?.apiUrl) || process.env.API_BASE_URL || 'http://localhost:5000';

let isRefreshing = false;
let pending = [];

const client = axios.create({ baseURL: API_BASE_URL });

client.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config || {};
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      if (isRefreshing) {
        await new Promise((resolve) => pending.push(resolve));
      }
      try {
        isRefreshing = true;
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');
        const { data } = await axios.post(`${API_BASE_URL}/api/auth/refresh`, { refreshToken });
        await SecureStore.setItemAsync('accessToken', data.token);
        await SecureStore.setItemAsync('refreshToken', data.refreshToken);
        pending.forEach((r) => r());
        pending = [];
        isRefreshing = false;
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${data.token}`;
        return client(original);
      } catch (e) {
        isRefreshing = false;
        pending.forEach((r) => r());
        pending = [];
        throw e;
      }
    }
    throw error;
  }
);

export default client;