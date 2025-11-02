import io from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const SOCKET_URL = (Constants?.expoConfig?.extra?.socketUrl) || process.env.SOCKET_URL || 'http://localhost:5000';

export async function connectSocket() {
  const token = await SecureStore.getItemAsync('accessToken');
  const socket = io(SOCKET_URL, { auth: { token } });
  return socket;
}

export function joinTeam(socket, teamId) {
  socket.emit('chat:join_team', teamId, (ack) => {
    // ack: { ok: true|false }
  });
}

export function leaveTeam(socket, teamId) {
  socket.emit('chat:leave_team', teamId, (ack) => {
    // ack: { ok: true|false }
  });
}

export function joinProject(socket, projectId) {
  socket.emit('board:join_project', projectId, (ack) => {
    // ack: { ok: true|false }
  });
}

export function leaveProject(socket, projectId) {
  socket.emit('board:leave_project', projectId, (ack) => {
    // ack: { ok: true|false }
  });
}

export function attachDefaultListeners(socket, { onNewMessage, onMention, onRoleUpdated }) {
  if (onNewMessage) socket.on('chat:new', onNewMessage);
  if (onMention) socket.on('chat:mention', onMention);
  if (onRoleUpdated) socket.on('notif:role_updated', onRoleUpdated);
}

export function detachDefaultListeners(socket) {
  socket.off('chat:new');
  socket.off('chat:mention');
  socket.off('notif:role_updated');
}