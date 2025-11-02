import client from './client';

export async function getProjects(params = {}) {
  const { data } = await client.get('/api/projects', { params });
  return data;
}

export async function getProject(id) {
  const { data } = await client.get(`/api/projects/${id}`);
  return data;
}

export async function createProject(payload) {
  const { data } = await client.post('/api/projects', payload);
  return data;
}

export async function updateProject(id, payload) {
  const { data } = await client.put(`/api/projects/${id}`, payload);
  return data;
}

export async function deleteProject(id) {
  const { data } = await client.delete(`/api/projects/${id}`);
  return data;
}