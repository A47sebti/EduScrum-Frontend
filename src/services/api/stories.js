import client from './client';

export async function getStories(params = {}) {
  const { data } = await client.get('/api/stories', { params });
  return data;
}

export async function getStory(id) {
  const { data } = await client.get(`/api/stories/${id}`);
  return data;
}

export async function createStory(payload) {
  const { data } = await client.post('/api/stories', payload);
  return data;
}

export async function updateStory(id, payload) {
  const { data } = await client.put(`/api/stories/${id}`, payload);
  return data;
}

export async function deleteStory(id) {
  const { data } = await client.delete(`/api/stories/${id}`);
  return data;
}