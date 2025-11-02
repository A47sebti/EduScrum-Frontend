import client from './client';

export async function getCeremonies(params = {}) {
  const { data } = await client.get('/api/ceremonies', { params });
  return data;
}

export async function getCeremony(id) {
  const { data } = await client.get(`/api/ceremonies/${id}`);
  return data;
}

export async function createCeremony(payload) {
  const { data } = await client.post('/api/ceremonies', payload);
  return data;
}

export async function updateCeremony(id, payload) {
  const { data } = await client.put(`/api/ceremonies/${id}`, payload);
  return data;
}

export async function deleteCeremony(id) {
  const { data } = await client.delete(`/api/ceremonies/${id}`);
  return data;
}