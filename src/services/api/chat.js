import client from './client';

// Minimal chat API as fallback when socket send is unavailable
export async function sendMessage({ roomType, roomId, text }) {
  // Expected backend route; adjust if needed
  return client.post('/api/chat/messages', { roomType, roomId, text });
}

export async function listMessages(params = {}) {
  // Optional helper to fetch history
  return client.get('/api/chat/messages', { params });
}