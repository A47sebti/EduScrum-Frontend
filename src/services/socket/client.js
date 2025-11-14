import io from 'socket.io-client';
import { getItem } from '../storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Web-only mode: disable sockets to avoid complex networking and native modules on web
const DISABLE_SOCKET = Platform.OS === 'web' || String(process.env.DISABLE_SOCKET).toLowerCase() === 'true';

function createSocketStub() {
  const handlers = {};
  return {
    emit() {},
    on(evt, cb) { handlers[evt] = cb; },
    off(evt) { delete handlers[evt]; },
    disconnect() {},
  };
}

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

const DEFAULT_SOCKET_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5001' : 'http://localhost:5001';
const SOCKET_URL = (Constants?.expoConfig?.extra?.socketUrl) || process.env.SOCKET_URL || inferLocalUrlFromExpo(5001) || DEFAULT_SOCKET_URL;

export async function connectSocket() {
  if (DISABLE_SOCKET) {
    return createSocketStub();
  }
  const token = await getItem('accessToken');
  const socket = io(SOCKET_URL, {
    transports: ['websocket'],
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 5,
    timeout: 10000,
  });
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

// Chat: send message with optional ack
export function sendChatMessage(socket, payload, cb) {
  try {
    socket.emit('chat:send', payload, (ack) => {
      if (typeof cb === 'function') cb(ack);
    });
  } catch (_) {
    if (typeof cb === 'function') cb({ ok: false });
  }
}

// Chat: project room
export function joinProjectChat(socket, projectId) {
  try {
    socket.emit('chat:join_project', projectId, (ack) => {
      // ack: { ok: true|false }
    });
  } catch (_) {}
}

export function leaveProjectChat(socket, projectId) {
  try {
    socket.emit('chat:leave_project', projectId, (ack) => {
      // ack: { ok: true|false }
    });
  } catch (_) {}
}

// Chat: direct messages
export function joinDM(socket, peerUserId) {
  try {
    socket.emit('chat:join_dm', peerUserId, (ack) => {
      // ack: { ok: true|false }
    });
  } catch (_) {}
}

export function leaveDM(socket, peerUserId) {
  try {
    socket.emit('chat:leave_dm', peerUserId, (ack) => {
      // ack: { ok: true|false }
    });
  } catch (_) {}
}