import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, FlatList, RefreshControl } from 'react-native';
import { Text, List, ActivityIndicator, FAB, Snackbar, Searchbar, IconButton, Portal, Dialog, Button, Divider, Avatar } from 'react-native-paper';
import { getStories, deleteStory } from '../../services/api/stories';
import { getProjects } from '../../services/api/projects';
import { getSprints } from '../../services/api/sprints';
import { useAuth } from '../../context/AuthContext';
import { connectSocket, joinProject, leaveProject, joinTeam, leaveTeam } from '../../services/socket/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function StoriesList({ route, navigation }) {
  const { role, user } = useAuth();
  const canManage = role === 'product_owner' || role === 'scrum_master' || role === 'admin';
  const initialFilter = route?.params?.filter || undefined; // e.g., 'backlog'
  const [projectIdFilter, setProjectIdFilter] = useState(route?.params?.projectId ? String(route.params.projectId) : '');
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');
  const [projectOptions, setProjectOptions] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [selectedProjectLabel, setSelectedProjectLabel] = useState('');
  const [assigneeMe, setAssigneeMe] = useState(false);
  const [sprintIdFilter, setSprintIdFilter] = useState('');
  const [selectedSprintLabel, setSelectedSprintLabel] = useState('');
  const [sprintPickerOpen, setSprintPickerOpen] = useState(false);
  const [sprintSearch, setSprintSearch] = useState('');
  const [sprintOptions, setSprintOptions] = useState([]);
  const [sprintsLoading, setSprintsLoading] = useState(false);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [hasNext, setHasNext] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const socketRef = useRef(null);
  const joinedProjectRef = useRef('');
  const joinedTeamRef = useRef('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const autoRefreshRef = useRef(true);
  const [liveMsg, setLiveMsg] = useState('');
  const refreshTimerRef = useRef(null);

  const normalizeResponse = (data) => {
    if (Array.isArray(data)) return { items: data, next: false };
    const items = data?.items || data?.results || data?.data || [];
    const next = data?.hasNext || data?.next || false;
    return { items, next };
  };

  const normalizeProjects = (data) => {
    if (Array.isArray(data)) return data;
    return data?.projects || data?.items || data?.results || data?.data || [];
  };

  const getAssigneeId = (it) => it?.assigneeId ?? it?.assignee?.id ?? it?.assignee_id ?? it?.assignedTo?.id ?? it?.ownerId ?? it?.owner_id;
  const getAssigneeName = (it) => it?.assignee?.name ?? it?.assigneeName ?? it?.assignedTo?.name ?? it?.ownerName ?? (typeof it?.assignee === 'string' ? it.assignee : undefined);
  const nameToInitials = (name) => {
    if (!name || typeof name !== 'string') return '?';
    const parts = name.trim().split(/\s+/);
    const initials = parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
    return initials || name[0]?.toUpperCase() || '?';
  };
  const normalizeSprints = (data) => {
    const list = Array.isArray(data) ? data : (data?.sprints || data?.items || data?.results || data?.data || []);
    return list
      .map((s) => ({ id: s?.id ?? s?._id ?? s?.sprintId ?? s?.sid, name: s?.name ?? s?.title ?? `Sprint ${s?.id ?? s?._id}`, description: s?.goal ?? s?.description }))
      .filter((s) => s.id);
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page: 1, limit, q: query || undefined, status: initialFilter || undefined, projectId: projectIdFilter?.trim() || undefined, sprintId: sprintIdFilter?.trim() || undefined, assigneeId: assigneeMe && user?.id ? user.id : undefined };
      const data = await getStories(params);
      const { items, next } = normalizeResponse(data);
      const filtered = assigneeMe && user?.id ? items.filter((it) => String(getAssigneeId(it) || '') === String(user.id)) : items;
      setStories(filtered);
      setPage(1);
      setHasNext(next);
    } catch (e) {
      setError(e?.response?.data?.message || 'Erreur lors du chargement des stories');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasNext) return;
    setLoadingMore(true);
    try {
      const params = { page: page + 1, limit, q: query || undefined, status: initialFilter || undefined, projectId: projectIdFilter?.trim() || undefined, sprintId: sprintIdFilter?.trim() || undefined, assigneeId: assigneeMe && user?.id ? user.id : undefined };
      const data = await getStories(params);
      const { items, next } = normalizeResponse(data);
      const filtered = assigneeMe && user?.id ? items.filter((it) => String(getAssigneeId(it) || '') === String(user.id)) : items;
      setStories((prev) => [...prev, ...filtered]);
      setPage((p) => p + 1);
      setHasNext(next);
    } catch (e) {
      setError(e?.response?.data?.message || 'Erreur lors du chargement des stories');
    } finally {
      setLoadingMore(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFilter, projectIdFilter, sprintIdFilter, assigneeMe, user?.id]);

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

  const scheduleListRefresh = () => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(() => {
      refreshTimerRef.current = null;
      load();
    }, 300);
  };

  // Socket: connect and attach story events
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
        const onEvent = () => {
          setLiveMsg(autoRefreshRef.current ? 'Mis à jour en temps réel' : 'Nouvelles modifications disponibles');
          if (autoRefreshRef.current) {
            scheduleListRefresh();
          }
        };
        socket.on('story:created', onEvent);
        socket.on('story:updated', onEvent);
        socket.on('story:deleted', onEvent);
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
          socketRef.current.off('story:created');
          socketRef.current.off('story:updated');
          socketRef.current.off('story:deleted');
          socketRef.current.disconnect();
        } catch (_) {
          // noop
        }
        socketRef.current = null;
      }
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Socket: join/leave project room when filter changes
  useEffect(() => {
    if (!socketRef.current) return;
    const pid = projectIdFilter || '';
    if (joinedProjectRef.current && joinedProjectRef.current !== pid) {
      try { leaveProject(socketRef.current, joinedProjectRef.current); } catch (_) {}
      joinedProjectRef.current = '';
    }
    if (pid && joinedProjectRef.current !== pid) {
      try { joinProject(socketRef.current, pid); joinedProjectRef.current = pid; } catch (_) {}
    }
  }, [projectIdFilter]);

  // Socket: join/leave team room when user team changes
  useEffect(() => {
    if (!socketRef.current) return;
    const tid = user?.teamId || user?.team?.id || user?.team_id || '';
    if (joinedTeamRef.current && joinedTeamRef.current !== String(tid)) {
      try { leaveTeam(socketRef.current, joinedTeamRef.current); } catch (_) {}
      joinedTeamRef.current = '';
    }
    if (tid && joinedTeamRef.current !== String(tid)) {
      try { joinTeam(socketRef.current, tid); joinedTeamRef.current = String(tid); } catch (_) {}
    }
  }, [user?.teamId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [query, initialFilter, projectIdFilter, sprintIdFilter, assigneeMe, user?.id])
  );

  const openProjectPicker = async () => {
    setProjectPickerOpen(true);
    setProjectsLoading(true);
    try {
      const data = await getProjects({ page: 1, limit: 50, q: projectSearch || undefined });
      setProjectOptions(normalizeProjects(data));
    } catch (e) {
      // silencieux
    } finally {
      setProjectsLoading(false);
    }
  };

  const refreshProjectOptions = async () => {
    setProjectsLoading(true);
    try {
      const data = await getProjects({ page: 1, limit: 50, q: projectSearch || undefined });
      setProjectOptions(normalizeProjects(data));
    } catch (e) {
      // silencieux
    } finally {
      setProjectsLoading(false);
    }
  };

  const chooseProject = (p) => {
    const id = String(p.id || p._id);
    setProjectIdFilter(id);
    setSelectedProjectLabel(p.name || `Projet ${id}`);
    setProjectPickerOpen(false);
  };

  const clearProjectFilter = () => {
    setProjectIdFilter('');
    setSelectedProjectLabel('');
  };

  const openSprintPicker = async () => {
    setSprintPickerOpen(true);
    setSprintsLoading(true);
    try {
      const data = await getSprints({ page: 1, limit: 50, q: sprintSearch || undefined, projectId: projectIdFilter || undefined });
      setSprintOptions(normalizeSprints(data));
    } catch (e) {
      // silencieux
    } finally {
      setSprintsLoading(false);
    }
  };

  const refreshSprintOptions = async () => {
    setSprintsLoading(true);
    try {
      const data = await getSprints({ page: 1, limit: 50, q: sprintSearch || undefined, projectId: projectIdFilter || undefined });
      setSprintOptions(normalizeSprints(data));
    } catch (e) {
      // silencieux
    } finally {
      setSprintsLoading(false);
    }
  };

  const chooseSprint = (s) => {
    const id = String(s.id || s._id);
    setSprintIdFilter(id);
    setSelectedSprintLabel(s.name || `Sprint ${id}`);
    setSprintPickerOpen(false);
  };

  const clearSprint = () => {
    setSprintIdFilter('');
    setSelectedSprintLabel('');
  };

  const confirmDelete = (item) => setDeleteTarget(item);
  const cancelDelete = () => setDeleteTarget(null);

  const doDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteStory(deleteTarget.id);
      setStories((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setSuccess('Story supprimée');
    } catch (e) {
      setError(e?.response?.data?.message || 'Suppression impossible');
    } finally {
      setDeleteTarget(null);
    }
  };

  const renderItem = ({ item }) => {
    const projectId = item.projectId ?? item.project?.id;
    const projectName = item.project?.name || item.projectName;
    const parts = [];
    if (item.status) parts.push(`Statut: ${item.status}`);
    if (projectId) parts.push(`Projet: ${projectId}${projectName ? ` (${projectName})` : ''}`);
    const aname = getAssigneeName(item);
    const aid = getAssigneeId(item);
    if (aname || aid) parts.push(`Assigné: ${aname || aid}`);
    const description = parts.length ? parts.join(' • ') : undefined;
    return (
      <List.Item
        title={item.title || item.name || `Story #${item.id}`}
        description={description}
        onPress={() => navigation.navigate('StoryDetail', { id: item.id })}
        left={(props) => (aname ? <Avatar.Text size={32} label={nameToInitials(aname)} /> : null)}
        right={() =>
          canManage ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <IconButton icon="pencil" onPress={() => navigation.navigate('StoryEdit', { id: item.id })} />
              <IconButton icon="delete" onPress={() => confirmDelete(item)} />
            </View>
          ) : null
        }
      />
    );
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
    <View style={{ flex: 1 }}>
      <View style={{ padding: 8 }}>
        <Searchbar placeholder="Rechercher" value={query} onChangeText={setQuery} />
        <View style={{ flexDirection: 'row', marginTop: 8, alignItems: 'center' }}>
          <Text style={{ flex: 1 }}>Projet: {selectedProjectLabel || (projectIdFilter ? projectIdFilter : 'Tous')}</Text>
          <Button mode="outlined" onPress={openProjectPicker} style={{ marginLeft: 8 }}>Choisir</Button>
          {projectIdFilter ? (
            <Button onPress={clearProjectFilter} style={{ marginLeft: 8 }}>Effacer</Button>
          ) : null}
          {user ? (
            <Button
              mode={assigneeMe ? 'contained' : 'outlined'}
              style={{ marginLeft: 8 }}
              onPress={() => setAssigneeMe((v) => !v)}
            >
              Mes stories
            </Button>
          ) : null}
          <Button
            mode={autoRefresh ? 'contained' : 'outlined'}
            style={{ marginLeft: 8 }}
            onPress={async () => {
              setAutoRefresh((prev) => {
                const next = !prev;
                AsyncStorage.setItem('auto_refresh_enabled', next ? 'true' : 'false').catch(() => {});
                autoRefreshRef.current = next;
                return next;
              });
            }}
          >
            Auto-refresh: {autoRefresh ? 'Activé' : 'Désactivé'}
          </Button>
        </View>
        <View style={{ flexDirection: 'row', marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <Text style={{ flex: 1 }}>Sprint: {selectedSprintLabel || (sprintIdFilter ? sprintIdFilter : 'Tous')}</Text>
          <Button mode="outlined" onPress={openSprintPicker} style={{ marginLeft: 8 }}>Choisir</Button>
          <Button
            mode="outlined"
            onPress={async () => {
              try {
                const data = await getSprints({ page: 1, limit: 5, projectId: projectIdFilter || undefined, current: true });
                const list = Array.isArray(data) ? data : (data?.sprints || data?.items || data?.results || data?.data || []);
                let currentSprint = list && list.length ? list[0] : null;
                if (!currentSprint) {
                  const alt = await getSprints({ page: 1, limit: 20, projectId: projectIdFilter || undefined, status: 'active' });
                  const alist = Array.isArray(alt) ? alt : (alt?.sprints || alt?.items || alt?.results || alt?.data || []);
                  currentSprint = alist && alist.length ? alist[0] : null;
                }
                if (currentSprint) {
                  const id = String(currentSprint.id || currentSprint._id);
                  setSprintIdFilter(id);
                  setSelectedSprintLabel(currentSprint.name || `Sprint ${id}`);
                } else {
                  setSprintIdFilter('');
                  setSelectedSprintLabel('');
                }
              } catch (e) {
                setSprintIdFilter('');
                setSelectedSprintLabel('');
                setError('Impossible de récupérer le sprint courant');
              }
            }}
            style={{ marginLeft: 8 }}
          >
            Sprint courant
          </Button>
          {sprintIdFilter ? (
            <Button onPress={clearSprint} style={{ marginLeft: 8 }}>Effacer</Button>
          ) : null}
        </View>
      </View>

      {stories.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text>Aucune story</Text>
        </View>
      ) : (
        <FlatList
          data={stories}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={{ margin: 12 }} /> : null}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}

      {canManage && (
        <FAB
          style={{ position: 'absolute', right: 16, bottom: 16 }}
          icon="plus"
          onPress={() => navigation.navigate('StoryCreate', {
            projectId: projectIdFilter || undefined,
            projectName: selectedProjectLabel || undefined,
            from: initialFilter || undefined,
          })}
        />
      )}

      <Portal>
        <Dialog visible={projectPickerOpen} onDismiss={() => setProjectPickerOpen(false)}>
          <Dialog.Title>Choisir un projet</Dialog.Title>
          <Dialog.Content>
            <Searchbar
              placeholder="Rechercher un projet"
              value={projectSearch}
              onChangeText={(v) => {
                setProjectSearch(v);
                setTimeout(() => refreshProjectOptions(), 200);
              }}
            />
            {projectsLoading ? (
              <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                <ActivityIndicator />
              </View>
            ) : projectOptions.length === 0 ? (
              <Text style={{ marginTop: 12 }}>Aucun projet</Text>
            ) : (
              projectOptions.map((p, idx) => (
                <View key={String(p.id || p._id)}>
                  <List.Item
                    title={p.name}
                    description={p.description}
                    onPress={() => chooseProject(p)}
                    left={(props) => <List.Icon {...props} icon="folder-outline" />}
                  />
                  {idx < projectOptions.length - 1 ? <Divider /> : null}
                </View>
              ))
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setProjectPickerOpen(false)}>Fermer</Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog visible={sprintPickerOpen} onDismiss={() => setSprintPickerOpen(false)}>
          <Dialog.Title>Choisir un sprint</Dialog.Title>
          <Dialog.Content>
            <Searchbar
              placeholder="Rechercher un sprint"
              value={sprintSearch}
              onChangeText={(v) => {
                setSprintSearch(v);
                setTimeout(() => refreshSprintOptions(), 200);
              }}
            />
            {sprintsLoading ? (
              <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                <ActivityIndicator />
              </View>
            ) : sprintOptions.length === 0 ? (
              <Text style={{ marginTop: 12 }}>Aucun sprint</Text>
            ) : (
              sprintOptions.map((s, idx) => (
                <View key={String(s.id || s._id)}>
                  <List.Item
                    title={s.name || `Sprint ${String(s.id || s._id)}`}
                    description={s.description}
                    onPress={() => chooseSprint(s)}
                    left={(props) => <List.Icon {...props} icon="progress-clock" />}
                  />
                  {idx < sprintOptions.length - 1 ? <Divider /> : null}
                </View>
              ))
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setSprintPickerOpen(false)}>Fermer</Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog visible={!!deleteTarget} onDismiss={cancelDelete}>
          <Dialog.Title>Supprimer la story</Dialog.Title>
          <Dialog.Content>
            <Text>Voulez-vous vraiment supprimer cette story ?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={cancelDelete}>Annuler</Button>
            <Button onPress={doDelete}>Supprimer</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar visible={!!error} onDismiss={() => setError('')} duration={3000}>
        {error}
      </Snackbar>
      <Snackbar visible={!!success} onDismiss={() => setSuccess('')} duration={2000}>
        {success}
      </Snackbar>
      <Snackbar
        visible={!!liveMsg}
        onDismiss={() => setLiveMsg('')}
        duration={1500}
        action={!autoRefresh ? { label: 'Actualiser', onPress: load } : undefined}
      >
        {liveMsg}
      </Snackbar>
    </View>
  );
}