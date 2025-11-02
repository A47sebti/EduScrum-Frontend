import React, { useEffect, useState, useRef } from 'react';
import { View } from 'react-native';
import { Text, ActivityIndicator, Button, Card, Snackbar } from 'react-native-paper';
import { getStory, updateStory } from '../../services/api/stories';
import { useAuth } from '../../context/AuthContext';
import { connectSocket, joinProject, leaveProject, joinTeam, leaveTeam } from '../../services/socket/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function StoryDetail({ route, navigation }) {
  const { id } = route.params || {};
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const autoRefreshRef = useRef(true);
  const [liveMsg, setLiveMsg] = useState('');
  const { role, user } = useAuth();
  const canManage = role === 'product_owner' || role === 'scrum_master' || role === 'admin';
  const socketRef = useRef(null);
  const joinedProjectRef = useRef('');
  const joinedTeamRef = useRef('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getStory(id);
      setStory(data);
    } catch (e) {
      setError(e?.response?.data?.message || 'Erreur lors du chargement de la story');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [id]);

  useEffect(() => { autoRefreshRef.current = autoRefresh; }, [autoRefresh]);

  // Load persisted auto-refresh preference
  useEffect(() => {
    (async () => {
      try {
        const v = await AsyncStorage.getItem('auto_refresh_enabled');
        if (v === 'true' || v === 'false') {
          setAutoRefresh(v === 'true');
          autoRefreshRef.current = v === 'true';
        }
      } catch (_) {}
    })();
  }, []);

  const toggleAutoRefresh = async () => {
    setAutoRefresh((prev) => {
      const next = !prev;
      AsyncStorage.setItem('auto_refresh_enabled', next ? 'true' : 'false').catch(() => {});
      autoRefreshRef.current = next;
      return next;
    });
  };

  // Socket: connect and listen
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const socket = await connectSocket();
        if (!active) return;
        socketRef.current = socket;
        const teamId = user?.teamId || user?.team?.id || user?.team_id;
        if (teamId) {
          try { joinTeam(socket, teamId); joinedTeamRef.current = String(teamId); } catch (_) {}
        }
        const onStoryUpdated = (payload) => {
          const eid = payload?.id || payload?._id || payload?.storyId;
          if (eid && String(eid) !== String(id)) return;
          setLiveMsg(autoRefreshRef.current ? 'Mis à jour en temps réel' : 'Nouvelles modifications disponibles');
          if (autoRefreshRef.current) {
            load();
          }
        };
        const onStoryDeleted = async (payload) => {
          const eid = payload?.id || payload?._id || payload?.storyId;
          // If payload specifies another story, ignore
          if (eid && String(eid) !== String(id)) return;
          setLiveMsg(autoRefreshRef.current ? 'Story supprimée' : 'Story supprimée');
          if (autoRefreshRef.current) {
            try {
              // Verify if current story still exists
              await getStory(id);
              // If exists, just reload to reflect changes
              await load();
            } catch (_) {
              // Not found -> go back
              setSuccess('Story supprimée');
              try { navigation.goBack(); } catch (_) {}
            }
          }
        };
        socket.on('story:updated', onStoryUpdated);
        socket.on('story:deleted', onStoryDeleted);
      } catch (e) {
        // silencieux si socket indisponible
      }
    })();
    return () => {
      active = false;
      if (socketRef.current) {
        try {
          if (joinedProjectRef.current) {
            try { leaveProject(socketRef.current, joinedProjectRef.current); } catch (_) {}
            joinedProjectRef.current = '';
          }
          if (joinedTeamRef.current) {
            try { leaveTeam(socketRef.current, joinedTeamRef.current); } catch (_) {}
            joinedTeamRef.current = '';
          }
          socketRef.current.off('story:updated');
          socketRef.current.off('story:deleted');
          socketRef.current.disconnect();
        } catch (_) {
          // noop
        }
        socketRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Socket: join/leave project room when story project changes
  useEffect(() => {
    if (!socketRef.current) return;
    const pid = story?.project?.id || story?.projectId || '';
    if (joinedProjectRef.current && joinedProjectRef.current !== String(pid)) {
      try { leaveProject(socketRef.current, joinedProjectRef.current); } catch (_) {}
      joinedProjectRef.current = '';
    }
    if (pid && joinedProjectRef.current !== String(pid)) {
      try { joinProject(socketRef.current, String(pid)); joinedProjectRef.current = String(pid); } catch (_) {}
    }
  }, [story?.project?.id, story?.projectId]);

  // Socket: join/leave team room when user team changes
  useEffect(() => {
    if (!socketRef.current) return;
    const tid = user?.teamId || user?.team?.id || user?.team_id || '';
    if (joinedTeamRef.current && joinedTeamRef.current !== String(tid)) {
      try { leaveTeam(socketRef.current, joinedTeamRef.current); } catch (_) {}
      joinedTeamRef.current = '';
    }
    if (tid && joinedTeamRef.current !== String(tid)) {
      try { joinTeam(socketRef.current, String(tid)); joinedTeamRef.current = String(tid); } catch (_) {}
    }
  }, [user?.teamId]);

  const getAssigneeId = (it) => it?.assigneeId ?? it?.assignee?.id ?? it?.assignee_id ?? it?.assignedTo?.id ?? it?.ownerId ?? it?.owner_id;
  const getAssigneeName = (it) => it?.assignee?.name ?? it?.assigneeName ?? it?.assignedTo?.name ?? it?.ownerName ?? (typeof it?.assignee === 'string' ? it.assignee : undefined);

  const assignToMe = async () => {
    if (!story || !user?.id) return;
    try {
      setStory((prev) => prev ? { ...prev, assigneeId: user.id, assignee: { ...(prev.assignee || {}), id: user.id, name: user.name || user.username || 'Moi' } } : prev);
      await updateStory(story.id, { assigneeId: user.id });
      setSuccess('Assignation mise à jour');
    } catch (e) {
      setError(e?.response?.data?.message || 'Impossible d’assigner la story');
    }
  };

  const unassign = async () => {
    if (!story) return;
    try {
      setStory((prev) => prev ? { ...prev, assigneeId: null, assignee: null } : prev);
      await updateStory(story.id, { assigneeId: null });
      setSuccess('Assignation supprimée');
    } catch (e) {
      setError(e?.response?.data?.message || 'Impossible de désassigner la story');
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Chargement…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      {story ? (
        <Card>
          <Card.Title title={story.title || `Story #${story.id}`} subtitle={story.status ? `Statut: ${story.status}` : undefined} />
          <Card.Content>
            <Text>{story.description || 'Aucune description.'}</Text>
            {(() => {
              const pid = story?.project?.id || story?.projectId;
              const pname = story?.project?.name || story?.projectName;
              return pid ? (
                <Text style={{ marginTop: 8 }}>Projet: {pid}{pname ? ` (${pname})` : ''}</Text>
              ) : null;
            })()}
            {(() => {
              const aid = getAssigneeId(story);
              const aname = getAssigneeName(story);
              return (aid || aname) ? (
                <Text style={{ marginTop: 8 }}>Assigné: {aname || aid}</Text>
              ) : null;
            })()}
          </Card.Content>
          <Card.Actions>
            {canManage && (
              <Button onPress={() => navigation.navigate('StoryEdit', { id })}>Modifier</Button>
            )}
            <Button
              mode={autoRefresh ? 'contained' : 'outlined'}
              onPress={toggleAutoRefresh}
            >
              Auto-refresh: {autoRefresh ? 'Activé' : 'Désactivé'}
            </Button>
            {(() => {
              const pid = story?.project?.id || story?.projectId;
              return pid ? (
                <Button onPress={() => navigation.navigate('Projects', { screen: 'ProjectDetail', params: { id: pid } })}>Voir projet</Button>
              ) : null;
            })()}
            {(() => {
              const aid = getAssigneeId(story);
              const isMe = user?.id && aid && String(aid) === String(user.id);
              return user ? (
                isMe ? (
                  <Button onPress={unassign}>Désassigner</Button>
                ) : (
                  <Button onPress={assignToMe}>M’assigner</Button>
                )
              ) : null;
            })()}
          </Card.Actions>
        </Card>
      ) : (
        <Text>Story introuvable.</Text>
      )}

      <Snackbar visible={!!error} onDismiss={() => setError('')} duration={3000}>
        {error}
      </Snackbar>
      <Snackbar visible={!!success} onDismiss={() => setSuccess('')} duration={2000}>
        {success}
      </Snackbar>
      <Snackbar
        visible={!!liveMsg}
        onDismiss={() => setLiveMsg('')}
        duration={2000}
        action={!autoRefresh ? { label: 'Actualiser', onPress: load } : undefined}
      >
        {liveMsg}
      </Snackbar>
    </View>
  );
}