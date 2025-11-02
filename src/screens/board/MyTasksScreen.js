import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, ScrollView, Platform } from 'react-native';
import { Text, Card, ActivityIndicator, Snackbar, IconButton, Button, Portal, Dialog, Searchbar, List, Divider, FAB, Avatar } from 'react-native-paper';
import { getStories, updateStory } from '../../services/api/stories';
import { getProjects } from '../../services/api/projects';
import { getSprints } from '../../services/api/sprints';
import { useAuth } from '../../context/AuthContext';
// DnD (web only)
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { connectSocket, joinProject, leaveProject, joinTeam, leaveTeam } from '../../services/socket/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STATUS_ORDER = ['todo', 'in_progress', 'review', 'done'];
const COLUMNS = [
  { key: 'todo', title: 'To Do', icon: 'clipboard-text-outline' },
  { key: 'in_progress', title: 'In Progress', icon: 'progress-wrench' },
  { key: 'review', title: 'Review', icon: 'clipboard-check-outline' },
  { key: 'done', title: 'Done', icon: 'check-circle-outline' },
];

export default function MyTasksScreen({ navigation }) {
  const { role, user } = useAuth();
  const canManage = role === 'product_owner' || role === 'scrum_master' || role === 'admin';
  const canChangeStatus = role === 'developer' || role === 'student' || role === 'scrum_master' || role === 'admin' || role === 'product_owner';

  const [projectId, setProjectId] = useState('');
  const [sprintId, setSprintId] = useState('');
  const [selectedProjectLabel, setSelectedProjectLabel] = useState('');
  const [selectedSprintLabel, setSelectedSprintLabel] = useState('');
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');
  const [projectOptions, setProjectOptions] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [sprintPickerOpen, setSprintPickerOpen] = useState(false);
  const [sprintSearch, setSprintSearch] = useState('');
  const [sprintOptions, setSprintOptions] = useState([]);
  const [sprintsLoading, setSprintsLoading] = useState(false);

  const [columns, setColumns] = useState({ todo: [], in_progress: [], review: [], done: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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

  const normalizeSprints = (data) => {
    if (Array.isArray(data)) return data;
    return data?.sprints || data?.items || data?.results || data?.data || [];
  };

  const filterByAssignee = (items) => {
    if (!user?.id) return items;
    return items.filter((it) => {
      const aid = it.assigneeId ?? it.assignee?.id ?? it.assignee;
      return String(aid || '') === String(user.id);
    });
  };

  const loadColumns = async () => {
    setLoading(true);
    setError('');
    try {
      const base = { page: 1, limit: 100, projectId: projectId || undefined, sprintId: sprintId || undefined, assigneeId: user?.id || undefined };
      const [t, p, r, d] = await Promise.all([
        getStories({ ...base, status: 'todo' }),
        getStories({ ...base, status: 'in_progress' }),
        getStories({ ...base, status: 'review' }),
        getStories({ ...base, status: 'done' }),
      ]);
      const T = filterByAssignee(normalizeResponse(t).items);
      const P = filterByAssignee(normalizeResponse(p).items);
      const R = filterByAssignee(normalizeResponse(r).items);
      const D = filterByAssignee(normalizeResponse(d).items);
      setColumns({ todo: T, in_progress: P, review: R, done: D });
    } catch (e) {
      setError(e?.response?.data?.message || 'Erreur lors du chargement de Mes tâches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadColumns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, sprintId, user?.id]);

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

  const scheduleBoardRefresh = () => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(() => {
      refreshTimerRef.current = null;
      loadColumns();
    }, 300);
  };

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
            scheduleBoardRefresh();
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

  useEffect(() => {
    if (!socketRef.current) return;
    const pid = projectId || '';
    if (joinedProjectRef.current && joinedProjectRef.current !== pid) {
      try { leaveProject(socketRef.current, joinedProjectRef.current); } catch (_) {}
      joinedProjectRef.current = '';
    }
    if (pid && joinedProjectRef.current !== pid) {
      try { joinProject(socketRef.current, pid); joinedProjectRef.current = pid; } catch (_) {}
    }
  }, [projectId]);

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
      loadColumns();
    }, [projectId, sprintId, user?.id])
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
    setProjectId(id);
    setSelectedProjectLabel(p.name || `Projet ${id}`);
    // reset sprint when changing project
    setSprintId('');
    setSelectedSprintLabel('');
    setProjectPickerOpen(false);
  };

  const clearProjectFilter = () => {
    setProjectId('');
    setSelectedProjectLabel('');
  };

  const openSprintPicker = async () => {
    setSprintPickerOpen(true);
    setSprintsLoading(true);
    try {
      const data = await getSprints({ page: 1, limit: 50, q: sprintSearch || undefined, projectId: projectId || undefined });
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
      const data = await getSprints({ page: 1, limit: 50, q: sprintSearch || undefined, projectId: projectId || undefined });
      setSprintOptions(normalizeSprints(data));
    } catch (e) {
      // silencieux
    } finally {
      setSprintsLoading(false);
    }
  };

  const chooseSprint = (s) => {
    const id = String(s.id || s._id);
    setSprintId(id);
    setSelectedSprintLabel(s.name || `Sprint ${id}`);
    setSprintPickerOpen(false);
  };

  const clearSprintFilter = () => {
    setSprintId('');
    setSelectedSprintLabel('');
  };

  const moveStory = async (item, fromKey, toKey) => {
    if (!canChangeStatus) return;
    if (fromKey === toKey) return;
    try {
      // optimistic update
      setColumns((prev) => {
        const fromList = prev[fromKey].filter((s) => s.id !== item.id);
        const updatedItem = { ...item, status: toKey };
        const toList = [updatedItem, ...prev[toKey]];
        return { ...prev, [fromKey]: fromList, [toKey]: toList };
      });
      await updateStory(item.id, { status: toKey });
      setSuccess('Statut mis à jour');
    } catch (e) {
      setError(e?.response?.data?.message || 'Impossible de changer le statut');
      // revert on error
      setColumns((prev) => {
        const toList = prev[toKey].filter((s) => s.id !== item.id);
        const restored = { ...item, status: fromKey };
        const fromList = [restored, ...prev[fromKey]];
        return { ...prev, [fromKey]: fromList, [toKey]: toList };
      });
    }
  };

  const getAssigneeId = (it) => it?.assigneeId ?? it?.assignee?.id ?? it?.assignee_id ?? it?.assignedTo?.id ?? it?.ownerId ?? it?.owner_id;
  const getAssigneeName = (it) => it?.assignee?.name ?? it?.assigneeName ?? it?.assignedTo?.name ?? it?.ownerName ?? (typeof it?.assignee === 'string' ? it.assignee : undefined);
  const nameToInitials = (name) => {
    if (!name || typeof name !== 'string') return '?';
    const parts = name.trim().split(/\s+/);
    const initials = parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
    return initials || name[0]?.toUpperCase() || '?';
  };

  const updateLocalItem = (id, patch) => {
    setColumns((prev) => {
      const next = {};
      for (const k of Object.keys(prev)) {
        next[k] = prev[k].map((s) => (s.id === id ? { ...s, ...patch } : s));
      }
      return next;
    });
  };

  const assignToMe = async (item) => {
    if (!user?.id) return;
    try {
      updateLocalItem(item.id, { assigneeId: user.id, assignee: { ...(item.assignee || {}), id: user.id, name: user.name || user.username || 'Moi' } });
      await updateStory(item.id, { assigneeId: user.id });
      setSuccess('Assignation mise à jour');
    } catch (e) {
      setError(e?.response?.data?.message || 'Impossible d’assigner la story');
      loadColumns();
    }
  };

  const unassign = async (item) => {
    try {
      updateLocalItem(item.id, { assigneeId: null, assignee: null });
      await updateStory(item.id, { assigneeId: null });
      setSuccess('Assignation supprimée');
    } catch (e) {
      setError(e?.response?.data?.message || 'Impossible de désassigner la story');
      loadColumns();
    }
  };

  const renderCard = (item, colKey) => {
    const idx = STATUS_ORDER.indexOf(colKey);
    const canLeft = canChangeStatus && idx > 0;
    const canRight = canChangeStatus && idx < STATUS_ORDER.length - 1;
    const leftKey = STATUS_ORDER[idx - 1];
    const rightKey = STATUS_ORDER[idx + 1];
    const projectIdText = item.projectId ?? item.project?.id;
    const sprintIdText = item.sprintId ?? item.sprint?.id;
    const assigneeId = getAssigneeId(item);
    const assigneeName = getAssigneeName(item);
    const isAssignedToMe = user?.id && assigneeId && String(assigneeId) === String(user.id);
    const lines = [];
    if (projectIdText) lines.push(`Projet: ${projectIdText}`);
    if (sprintIdText) lines.push(`Sprint: ${sprintIdText}`);
    if (assigneeId || assigneeName) lines.push(`Assigné: ${assigneeName || assigneeId}`);
    return (
      <Card style={{ marginVertical: 8 }}>
        <Card.Title
          title={item.title || item.name || `Story #${item.id}`}
          subtitle={lines.length ? lines.join(' • ') : undefined}
          left={(props) => (assigneeName ? <Avatar.Text size={32} label={nameToInitials(assigneeName)} /> : null)}
          right={(props) => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {canLeft ? <IconButton icon="chevron-left" onPress={() => moveStory(item, colKey, leftKey)} /> : null}
              {canRight ? <IconButton icon="chevron-right" onPress={() => moveStory(item, colKey, rightKey)} /> : null}
              <IconButton icon="eye" onPress={() => navigation.navigate('StoryDetail', { id: item.id })} />
              {canManage ? <IconButton icon="pencil" onPress={() => navigation.navigate('StoryEdit', { id: item.id })} /> : null}
              {user ? (
                isAssignedToMe ? (
                  <IconButton icon="account-remove" onPress={() => unassign(item)} />
                ) : (
                  <IconButton icon="account-plus" onPress={() => assignToMe(item)} />
                )
              ) : null}
            </View>
          )}
        />
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Chargement de mes tâches…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
          <Text style={{ flex: 1 }}>Projet: {selectedProjectLabel || (projectId ? projectId : 'Tous')}</Text>
          <Button mode="outlined" onPress={openProjectPicker} style={{ marginLeft: 8 }}>Choisir</Button>
          {projectId ? (
            <Button onPress={clearProjectFilter} style={{ marginLeft: 8 }}>Effacer</Button>
          ) : null}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
          <Text style={{ flex: 1 }}>Sprint: {selectedSprintLabel || (sprintId ? sprintId : 'Tous')}</Text>
          <Button mode="outlined" onPress={openSprintPicker} style={{ marginLeft: 8 }}>Choisir</Button>
          <Button mode="outlined" onPress={async () => {
            try {
              const data = await getSprints({ page: 1, limit: 5, projectId: projectId || undefined, current: true });
              const list = normalizeSprints(data);
              let currentSprint = list && list.length ? list[0] : null;
              if (!currentSprint) {
                const alt = await getSprints({ page: 1, limit: 20, projectId: projectId || undefined, status: 'active' });
                const alist = normalizeSprints(alt);
                currentSprint = alist && alist.length ? alist[0] : null;
              }
              if (currentSprint) {
                chooseSprint(currentSprint);
              } else {
                setError('Aucun sprint courant détecté');
              }
            } catch (e) {
              setError('Impossible de récupérer le sprint courant');
            }
          }} style={{ marginLeft: 8 }}>Sprint courant</Button>
          {sprintId ? (
            <Button onPress={clearSprintFilter} style={{ marginLeft: 8 }}>Effacer</Button>
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
      </View>

      {Platform.OS === 'web' ? (
        <DragDropContext
          onDragEnd={({ source, destination }) => {
            if (!destination) return;
            const fromKey = source.droppableId;
            const toKey = destination.droppableId;
            const fromList = columns[fromKey] || [];
            const dragged = fromList[source.index];
            if (!dragged) return;
            moveStory(dragged, fromKey, toKey);
          }}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 8 }}>
            {COLUMNS.map((col) => (
              <View key={col.key} style={{ width: 320, paddingHorizontal: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <IconButton icon={col.icon} />
                  <Text variant="titleMedium">{col.title}</Text>
                </View>
                <Droppable droppableId={col.key}>
                  {(provided) => (
                    <View ref={provided.innerRef} {...provided.droppableProps}>
                      {columns[col.key].length === 0 ? (
                        <Text style={{ opacity: 0.6 }}>Aucune story</Text>
                      ) : (
                        columns[col.key].map((item, index) => (
                          <Draggable key={String(item.id)} draggableId={String(item.id)} index={index}>
                            {(dragProvided) => (
                              <View
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                                style={{ ...(dragProvided.draggableProps.style || {}), marginBottom: 8 }}
                              >
                                {renderCard(item, col.key)}
                              </View>
                            )}
                          </Draggable>
                        ))
                      )}
                      {provided.placeholder}
                    </View>
                  )}
                </Droppable>
              </View>
            ))}
          </ScrollView>
        </DragDropContext>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 8 }}>
          {COLUMNS.map((col) => (
            <View key={col.key} style={{ width: 320, paddingHorizontal: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <IconButton icon={col.icon} />
                <Text variant="titleMedium">{col.title}</Text>
              </View>
              {columns[col.key].length === 0 ? (
                <Text style={{ opacity: 0.6 }}>Aucune story</Text>
              ) : (
                columns[col.key].map((item) => (
                  <View key={String(item.id)}>{renderCard(item, col.key)}</View>
                ))
              )}
            </View>
          ))}
        </ScrollView>
      )}

      {canManage && (
        <FAB
          style={{ position: 'absolute', right: 16, bottom: 16 }}
          icon="plus"
          onPress={() => navigation.navigate('StoryCreate', {
            projectId: projectId || undefined,
            projectName: selectedProjectLabel || undefined,
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
                    description={s.goal || s.description}
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
        action={!autoRefresh ? { label: 'Actualiser', onPress: loadColumns } : undefined}
      >
        {liveMsg}
      </Snackbar>
    </View>
  );
}