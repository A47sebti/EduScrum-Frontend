import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { TextInput, Button, Snackbar, ActivityIndicator, Text, Portal, Dialog, Searchbar, List, Divider } from 'react-native-paper';
import { getStory, updateStory } from '../../services/api/stories';
import { getProjects } from '../../services/api/projects';
import { getSprints } from '../../services/api/sprints';

export default function StoryEdit({ route, navigation }) {
  const { id } = route.params || {};
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');
  const [sprintId, setSprintId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [selectedProjectLabel, setSelectedProjectLabel] = useState('');
  const [selectedSprintLabel, setSelectedSprintLabel] = useState('');
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');
  const [projectOptions, setProjectOptions] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getStory(id);
        setTitle(data?.title || data?.name || '');
        setDescription(data?.description || '');
        setStatus(data?.status || '');
        setSprintId(data?.sprintId ? String(data.sprintId) : '');
        setSelectedSprintLabel(data?.sprint?.name || (data?.sprintId ? `Sprint ${data.sprintId}` : ''));
        const pid = data?.project?.id || data?.projectId;
        setProjectId(pid ? String(pid) : '');
        setSelectedProjectLabel(data?.project?.name || data?.projectName || (pid ? `Projet ${pid}` : ''));
      } catch (e) {
        setError(e?.response?.data?.message || 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const onSubmit = async () => {
    if (!title.trim()) {
      setError('Le titre est requis');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await updateStory(id, { title, description, status, sprintId: sprintId || undefined, projectId: projectId || undefined });
      navigation.goBack();
    } catch (e) {
      setError(e?.response?.data?.message || 'Impossible de mettre à jour');
    } finally {
      setSaving(false);
    }
  };

  const normalizeProjects = (data) => {
    if (Array.isArray(data)) return data;
    return data?.projects || data?.items || data?.results || data?.data || [];
  };

  const normalizeSprints = (data) => {
    if (Array.isArray(data)) return data;
    return data?.sprints || data?.items || data?.results || data?.data || [];
  };

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
    const idp = String(p.id || p._id);
    setProjectId(idp);
    setSelectedProjectLabel(p.name || `Projet ${idp}`);
    setProjectPickerOpen(false);
  };

  const clearProject = () => {
    setProjectId('');
    setSelectedProjectLabel('');
  };

  // Sprint picker
  const [sprintPickerOpen, setSprintPickerOpen] = useState(false);
  const [sprintSearch, setSprintSearch] = useState('');
  const [sprintOptions, setSprintOptions] = useState([]);
  const [sprintsLoading, setSprintsLoading] = useState(false);

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

  const clearSprint = () => {
    setSprintId('');
    setSelectedSprintLabel('');
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
      <TextInput label="Titre" value={title} onChangeText={setTitle} style={{ marginBottom: 12 }} />
      <TextInput label="Description" value={description} onChangeText={setDescription} multiline style={{ marginBottom: 12 }} />
      <TextInput label="Statut" value={status} onChangeText={setStatus} style={{ marginBottom: 12 }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ flex: 1 }}>Sprint: {selectedSprintLabel || (sprintId ? sprintId : 'Aucun')}</Text>
        <Button mode="outlined" onPress={openSprintPicker} style={{ marginLeft: 8 }}>Choisir</Button>
        {sprintId ? (
          <Button onPress={clearSprint} style={{ marginLeft: 8 }}>Effacer</Button>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ flex: 1 }}>Projet: {selectedProjectLabel || (projectId ? projectId : 'Aucun')}</Text>
        <Button mode="outlined" onPress={openProjectPicker} style={{ marginLeft: 8 }}>Choisir</Button>
        {projectId ? (
          <Button onPress={clearProject} style={{ marginLeft: 8 }}>Effacer</Button>
        ) : null}
      </View>
      <Button mode="contained" onPress={onSubmit} loading={saving}>Enregistrer</Button>
      <Snackbar visible={!!error} onDismiss={() => setError('')} duration={3000}>
        {error}
      </Snackbar>

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
    </View>
  );
}