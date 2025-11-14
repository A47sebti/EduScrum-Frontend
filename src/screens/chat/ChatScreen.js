import React, { useEffect, useRef, useState } from 'react';
import { View, FlatList } from 'react-native';
import { Text, List, Snackbar, ActivityIndicator, Button, TextInput, Divider, Portal, Dialog, Searchbar } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { connectSocket, joinTeam, leaveTeam, attachDefaultListeners, detachDefaultListeners, sendChatMessage, joinProjectChat, leaveProjectChat, joinDM, leaveDM } from '../../services/socket/client';
import Constants from 'expo-constants';
import { getProjects } from '../../services/api/projects';
import { getTeamMembers } from '../../services/api/teams';
import { sendMessage as sendMessageApi } from '../../services/api/chat';

export default function ChatScreen() {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const joinedTeamRef = useRef('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liveMsg, setLiveMsg] = useState('');
  const [messages, setMessages] = useState([]);
  const isExpoGo = Constants?.appOwnership === 'expo';
  const [channel, setChannel] = useState('team'); // 'team' | 'project' | 'dm'
  const [projectId, setProjectId] = useState('');
  const [dmUserId, setDmUserId] = useState('');
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [projDialogOpen, setProjDialogOpen] = useState(false);
  const [dmDialogOpen, setDmDialogOpen] = useState(false);
  const [projSearch, setProjSearch] = useState('');
  const [dmSearch, setDmSearch] = useState('');
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const joinedProjectRef = useRef('');
  const joinedDMRef = useRef('');

  const pushMessage = (payload, type = 'message') => {
    const ts = payload?.createdAt || payload?.time || Date.now();
    const author = payload?.author?.name || payload?.authorName || payload?.from?.name || payload?.from || 'Inconnu';
    const text = payload?.text || payload?.message || (typeof payload === 'string' ? payload : JSON.stringify(payload));
    setMessages((prev) => [{ id: `${ts}-${Math.random()}`, type, author, text, ts }, ...prev].slice(0, 200));
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const socket = await connectSocket();
        if (!active) return;
        socketRef.current = socket;
        // Join team chat room if available
        const tid = user?.teamId || user?.team?.id || user?.team_id;
        if (tid) {
          try { joinTeam(socket, String(tid)); joinedTeamRef.current = String(tid); } catch (_) {}
        }

        // Attach chat listeners
        attachDefaultListeners(socket, {
          onNewMessage: (msg) => {
            setLiveMsg('Nouveau message');
            pushMessage(msg, 'message');
          },
          onMention: (msg) => {
            setLiveMsg('Vous avez été mentionné');
            pushMessage(msg, 'mention');
          },
          onRoleUpdated: (evt) => {
            // Surface role updates as a system notification inside chat as well
            setLiveMsg('Notification de rôle reçue');
            pushMessage({ text: `Rôle mis à jour: ${JSON.stringify(evt)}` }, 'system');
          },
        });
      } catch (e) {
        setError('Connexion au chat indisponible');
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      active = false;
      try {
        if (socketRef.current) {
          try {
            if (joinedTeamRef.current) {
              try { leaveTeam(socketRef.current, joinedTeamRef.current); } catch (_) {}
              joinedTeamRef.current = '';
            }
            if (joinedProjectRef.current) {
              try { leaveProjectChat(socketRef.current, joinedProjectRef.current); } catch (_) {}
              joinedProjectRef.current = '';
            }
            if (joinedDMRef.current) {
              try { leaveDM(socketRef.current, joinedDMRef.current); } catch (_) {}
              joinedDMRef.current = '';
            }
            detachDefaultListeners(socketRef.current);
            socketRef.current.disconnect();
          } catch (_) {}
          socketRef.current = null;
        }
      } catch (_) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Channel switching: join appropriate rooms
  useEffect(() => {
    if (!socketRef.current) return;
    try {
      if (channel === 'team') {
        // Already joined in initial effect
      } else if (channel === 'project') {
        if (projectId) {
          if (joinedProjectRef.current && joinedProjectRef.current !== projectId) {
            try { leaveProjectChat(socketRef.current, joinedProjectRef.current); } catch (_) {}
          }
          try { joinProjectChat(socketRef.current, projectId); joinedProjectRef.current = projectId; } catch (_) {}
        }
      } else if (channel === 'dm') {
        if (dmUserId) {
          if (joinedDMRef.current && joinedDMRef.current !== dmUserId) {
            try { leaveDM(socketRef.current, joinedDMRef.current); } catch (_) {}
          }
          try { joinDM(socketRef.current, dmUserId); joinedDMRef.current = dmUserId; } catch (_) {}
        }
      }
    } catch (_) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, projectId, dmUserId]);

  const canSend = () => {
    if (!messageText.trim()) return false;
    if (channel === 'team') return !!joinedTeamRef.current;
    if (channel === 'project') return !!projectId;
    if (channel === 'dm') return !!dmUserId;
    return false;
  };

  const currentRoom = () => {
    if (channel === 'team') {
      const tid = joinedTeamRef.current || user?.teamId || user?.team?.id || user?.team_id || '';
      return { roomType: 'team', roomId: String(tid) };
    }
    if (channel === 'project') return { roomType: 'project', roomId: String(projectId) };
    if (channel === 'dm') return { roomType: 'dm', roomId: String(dmUserId) };
    return { roomType: 'unknown', roomId: '' };
  };

  const onSend = async () => {
    if (!canSend()) return;
    const { roomType, roomId } = currentRoom();
    setSending(true);
    const payload = { roomType, roomId, text: messageText.trim() };
    try {
      let sentViaSocket = false;
      if (socketRef.current?.emit) {
        await new Promise((resolve) => {
          try {
            sendChatMessage(socketRef.current, payload, (ack) => {
              sentViaSocket = !!ack?.ok;
              resolve();
            });
          } catch (_) {
            resolve();
          }
        });
      }
      if (!sentViaSocket) {
        try { await sendMessageApi(payload); } catch (e) {}
      }
      setLiveMsg('Message envoyé');
      // Optimistic append
      pushMessage({ author: user?.name || user?.email || 'Moi', text: payload.text, createdAt: Date.now() }, 'message');
      setMessageText('');
    } catch (e) {
      setError('Échec d’envoi du message');
    } finally {
      setSending(false);
    }
  };

  const openProjectPicker = async () => {
    setProjDialogOpen(true);
    try {
      const data = await getProjects({ limit: 50 });
      setProjects(Array.isArray(data) ? data : (data?.items || []));
    } catch (e) {
      // silent
    }
  };

  const openDmPicker = async () => {
    setDmDialogOpen(true);
    try {
      const tid = user?.teamId || user?.team?.id || user?.team_id;
      if (tid) {
        const data = await getTeamMembers(String(tid), { limit: 100 });
        setMembers(Array.isArray(data) ? data : (data?.items || []));
      }
    } catch (e) {
      // silent
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Chargement du chat…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {!isExpoGo ? (
        <View style={{ flexDirection: 'row', padding: 8, gap: 8, justifyContent: 'space-between' }}>
          <Button mode={channel === 'team' ? 'contained' : 'outlined'} onPress={() => setChannel('team')}>Équipe</Button>
          <Button mode={channel === 'project' ? 'contained' : 'outlined'} onPress={() => setChannel('project')}>Projet</Button>
          <Button mode={channel === 'dm' ? 'contained' : 'outlined'} onPress={() => setChannel('dm')}>DM</Button>
        </View>
      ) : (
        <View style={{ padding: 8 }}>
          <Text>Mode simple (Expo Go): Chat Équipe uniquement</Text>
        </View>
      )}
      {!isExpoGo && channel === 'project' && (
        <View style={{ paddingHorizontal: 8, paddingBottom: 8 }}>
          <Button mode="outlined" onPress={openProjectPicker} icon="folder">Choisir un projet</Button>
          {projectId ? <Text style={{ marginTop: 6 }}>Projet courant: {projectId}</Text> : null}
        </View>
      )}
      {!isExpoGo && channel === 'dm' && (
        <View style={{ paddingHorizontal: 8, paddingBottom: 8 }}>
          <Button mode="outlined" onPress={openDmPicker} icon="account">Choisir un membre</Button>
          {dmUserId ? <Text style={{ marginTop: 6 }}>DM avec: {dmUserId}</Text> : null}
        </View>
      )}
      {messages.length === 0 ? (
        <View style={{ padding: 16 }}>
          <Text>Aucun message pour l’instant.</Text>
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <List.Item
              title={item.author}
              description={item.text}
              left={(props) => <List.Icon {...props} icon={item.type === 'mention' ? 'at' : item.type === 'system' ? 'information-outline' : 'message'} />}
              right={(props) => (
                <Text style={{ color: '#888', alignSelf: 'center', marginRight: 8 }}>
                  {new Date(item.ts).toLocaleTimeString()}
                </Text>
              )}
            />
          )}
          contentContainerStyle={{ paddingVertical: 8 }}
        />
      )}

      <Divider />
      <View style={{ flexDirection: 'row', padding: 8, alignItems: 'center' }}>
        <TextInput
          style={{ flex: 1, marginRight: 8 }}
          mode="outlined"
          placeholder="Écrire un message…"
          value={messageText}
          onChangeText={setMessageText}
          disabled={sending}
        />
        <Button mode="contained" onPress={onSend} disabled={!canSend() || sending} icon="send">Envoyer</Button>
      </View>

      <Portal>
        <Dialog visible={projDialogOpen} onDismiss={() => setProjDialogOpen(false)}>
          <Dialog.Title>Choisir un projet</Dialog.Title>
          <Dialog.Content>
            <Searchbar placeholder="Rechercher…" value={projSearch} onChangeText={setProjSearch} />
            <FlatList
              data={(projects || []).filter((p) => !projSearch || String(p.name || p.title || p.id).toLowerCase().includes(projSearch.toLowerCase()))}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <List.Item
                  title={item.name || item.title || `Projet ${item.id}`}
                  description={`ID: ${item.id}`}
                  onPress={() => { setProjectId(String(item.id)); setProjDialogOpen(false); }}
                />
              )}
              style={{ maxHeight: 280 }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setProjDialogOpen(false)}>Fermer</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={dmDialogOpen} onDismiss={() => setDmDialogOpen(false)}>
          <Dialog.Title>Choisir un membre</Dialog.Title>
          <Dialog.Content>
            <Searchbar placeholder="Rechercher…" value={dmSearch} onChangeText={setDmSearch} />
            <FlatList
              data={(members || []).filter((m) => !dmSearch || String(m.name || m.email || m.id).toLowerCase().includes(dmSearch.toLowerCase()))}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <List.Item
                  title={item.name || item.email || `Utilisateur ${item.id}`}
                  description={`ID: ${item.id}`}
                  onPress={() => { setDmUserId(String(item.id)); setDmDialogOpen(false); }}
                />
              )}
              style={{ maxHeight: 280 }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDmDialogOpen(false)}>Fermer</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar visible={!!error} onDismiss={() => setError('')} duration={3000}>
        {error}
      </Snackbar>
      <Snackbar visible={!!liveMsg} onDismiss={() => setLiveMsg('')} duration={1500}>
        {liveMsg}
      </Snackbar>
    </View>
  );
}