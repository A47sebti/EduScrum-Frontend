import client from './client';

export async function getTeams(params = {}) {
  const { data } = await client.get('/api/teams', { params });
  return data;
}

export async function getTeam(id) {
  const { data } = await client.get(`/api/teams/${id}`);
  return data;
}

export async function createTeam(payload) {
  const { data } = await client.post('/api/teams', payload);
  return data;
}

export async function updateTeam(id, payload) {
  const { data } = await client.put(`/api/teams/${id}`, payload);
  return data;
}

export async function joinTeamByCode(code) {
  const { data } = await client.post(`/api/teams/join/${code}`);
  return data;
}

export async function getTeamMembers(id, params = {}) {
  const { data } = await client.get(`/api/teams/${id}/members`, { params });
  return data;
}

export async function assignRole(teamId, userId, role) {
  const { data } = await client.put(`/api/teams/${teamId}/members/${userId}/role`, { role });
  return data;
}

export async function deleteTeam(id) {
  const { data } = await client.delete(`/api/teams/${id}`);
  return data;
}