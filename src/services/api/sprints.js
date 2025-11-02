import client from './client';

export async function getSprints(params = {}) {
  const { data } = await client.get('/api/sprints', { params });
  return data;
}

export async function getSprint(id) {
  const { data } = await client.get(`/api/sprints/${id}`);
  return data;
}

export async function createSprint(payload) {
  const { data } = await client.post('/api/sprints', payload);
  return data;
}

export async function updateSprint(id, payload) {
  const { data } = await client.put(`/api/sprints/${id}`, payload);
  return data;
}

export async function deleteSprint(id) {
  const { data } = await client.delete(`/api/sprints/${id}`);
  return data;
}