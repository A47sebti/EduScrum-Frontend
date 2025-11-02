import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { TextInput, Button, Snackbar, Text, Portal, Dialog, Searchbar, List, ActivityIndicator, Divider } from 'react-native-paper';
import { createStory } from '../../services/api/stories';
import { getProjects, getProject } from '../../services/api/projects';
import { getSprints } from '../../services/api/sprints';

export default function StoryCreate({ navigation, route }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('backlog');
  const [sprintId, setSprintId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');
  const [projectOptions, setProjectOptions] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [selectedProjectLabel, setSelectedProjectLabel] = useState('');
  const [selectedSprintLabel, setSelectedSprintLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const pid = route?.params?.projectId;
    const pname = route?.params?.projectName;
    if (pid) {
      setProjectId(String(pid));
      if (pname) {
        setSelectedProjectLabel(pname);
      } else {
        // essayer de récupérer le nom du projet pour l’affichage
        getProject(pid)
          .then((p) => setSelectedProjectLabel(p?.name || `Projet ${pid}`))
          .catch(() => setSelectedProjectLabel(`Projet ${pid}`));
      }
    }
  }, [route?.params?.projectId, route?.params?.projectName]);

  const onSubmit = async () => {
    if (!title.trim()) {
      setError('Le titre est requis');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await createStory({ title, description, status, sprintId: sprintId || undefined, projectId: projectId || undefined });
      navigation.goBack();
    } catch (e) {
      setError(e?.response?.data?.message || 'Impossible de créer la story');
    } finally {
      setLoading(false);
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
    const id = String(p.id || p._id);
    setProjectId(id);
    setSelectedProjectLabel(p.name || `Projet ${id}`);
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

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <TextInput label="Titre" value={title} onChangeText={setTitle} style={{ marginBottom: 12 }} />
      <TextInput label="Description" value={description} onChangeText={setDescription} multiline style={{ marginBottom: 12 }} />
      <TextInput label="Statut (ex: backlog, ready, in_progress)" value={status} onChangeText={setStatus} style={{ marginBottom: 12 }} />
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
      <Button mode="contained" onPress={onSubmit} loading={loading}>Créer</Button>
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