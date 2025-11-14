import axios from 'axios';
import { getItem, setItem } from '../storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

function inferLocalUrlFromExpo(port = 5000) {
  try {
    const hostUri = Constants?.expoConfig?.hostUri;
    if (!hostUri) return null;
    const host = String(hostUri).split(':')[0];
    if (!host || host.includes('localhost')) return null;
    return `http://${host}:${port}`;
  } catch (_) {
    return null;
  }
}

// Default local URL per platform (emulator needs 10.0.2.2)
const DEFAULT_LOCAL_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';

const API_BASE_URL = (Constants?.expoConfig?.extra?.apiUrl) || process.env.API_BASE_URL || inferLocalUrlFromExpo(5000) || DEFAULT_LOCAL_URL;

let isRefreshing = false;
let pending = [];

// Add a sane timeout to avoid indefinite loading when backend is unreachable
const client = axios.create({ baseURL: API_BASE_URL, timeout: 10000 });

client.interceptors.request.use(async (config) => {
  const token = await getItem('accessToken');
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
        const refreshToken = await getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');
        const { data } = await axios.post(`${API_BASE_URL}/api/auth/refresh`, { refreshToken }, { timeout: 10000 });
        await setItem('accessToken', data.token);
        await setItem('refreshToken', data.refreshToken);
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