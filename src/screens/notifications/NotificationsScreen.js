import React, { useEffect, useRef, useState } from 'react';
import { View, FlatList } from 'react-native';
import { Text, List, Snackbar, ActivityIndicator, Button } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { connectSocket, joinTeam, leaveTeam, attachDefaultListeners, detachDefaultListeners } from '../../services/socket/client';

export default function NotificationsScreen() {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const joinedTeamRef = useRef('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liveMsg, setLiveMsg] = useState('');
  const [items, setItems] = useState([]);

  const pushNotif = (title, payload) => {
    const ts = Date.now();
    const description = typeof payload === 'string' ? payload : JSON.stringify(payload);
    setItems((prev) => [{ id: `${ts}-${Math.random()}`, title, description, ts }, ...prev].slice(0, 200));
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const socket = await connectSocket();
        if (!active) return;
        socketRef.current = socket;
        const tid = user?.teamId || user?.team?.id || user?.team_id;
        if (tid) {
          try { joinTeam(socket, String(tid)); joinedTeamRef.current = String(tid); } catch (_) {}
        }
        attachDefaultListeners(socket, {
          onNewMessage: (msg) => {
            setLiveMsg('Message reçu (chat)');
            pushNotif('Message (Chat)', msg);
          },
          onMention: (msg) => {
            setLiveMsg('Mention reçue');
            pushNotif('Mention (Chat)', msg);
          },
          onRoleUpdated: (evt) => {
            setLiveMsg('Rôle mis à jour');
            pushNotif('Rôle mis à jour', evt);
          },
        });
      } catch (e) {
        setError('Connexion aux notifications indisponible');
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
            detachDefaultListeners(socketRef.current);
            socketRef.current.disconnect();
          } catch (_) {}
          socketRef.current = null;
        }
      } catch (_) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Chargement des notifications…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
        <Button mode="outlined" onPress={() => setItems([])}>Effacer</Button>
      </View>
      {items.length === 0 ? (
        <View style={{ padding: 16 }}>
          <Text>Aucune notification pour l’instant.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <List.Item
              title={item.title}
              description={item.description}
              left={(props) => <List.Icon {...props} icon="bell-outline" />}
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

      <Snackbar visible={!!error} onDismiss={() => setError('')} duration={3000}>
        {error}
      </Snackbar>
      <Snackbar visible={!!liveMsg} onDismiss={() => setLiveMsg('')} duration={1500}>
        {liveMsg}
      </Snackbar>
    </View>
  );
}