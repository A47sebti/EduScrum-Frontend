import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, FlatList, RefreshControl } from 'react-native';
import { Text, List, ActivityIndicator, FAB, Snackbar, Searchbar, IconButton, Portal, Dialog, Button } from 'react-native-paper';
import { getProjects, deleteProject } from '../../services/api/projects';
import { useAuth } from '../../context/AuthContext';

export default function ProjectsList({ navigation }) {
  const { role } = useAuth();
  const canManage = role === 'scrum_master' || role === 'product_owner' || role === 'admin';
  const [projects, setProjects] = useState([]);
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

  const normalizeResponse = (data) => {
    const items = Array.isArray(data?.projects) ? data.projects : Array.isArray(data) ? data : (data?.items || []);
    let next = true;
    if (data?.pagination) {
      const { page: p, totalPages } = data.pagination;
      next = p < totalPages;
    } else {
      next = items.length >= limit;
    }
    return { items, next };
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getProjects({ page: 1, limit, q: query || undefined });
      const { items, next } = normalizeResponse(data);
      setProjects(items);
      setPage(1);
      setHasNext(next);
    } catch (e) {
      setError(e?.response?.data?.message || 'Erreur lors du chargement des projets');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getProjects({ page: 1, limit, q: query || undefined });
      const { items, next } = normalizeResponse(data);
      setProjects(items);
      setPage(1);
      setHasNext(next);
    } catch (e) {
      setError(e?.response?.data?.message || 'Erreur lors du rafraîchissement');
    } finally {
      setRefreshing(false);
    }
  }, [query, limit]);

  const loadMore = async () => {
    if (loadingMore || !hasNext) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const data = await getProjects({ page: nextPage, limit, q: query || undefined });
      const { items, next } = normalizeResponse(data);
      setProjects((prev) => [...prev, ...items]);
      setPage(nextPage);
      setHasNext(next);
    } catch (e) {
      setError(e?.response?.data?.message || 'Erreur lors du chargement supplémentaire');
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      load();
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  useFocusEffect(
    useCallback(() => {
      // Rafraîchir quand l’écran reprend le focus (ex: retour après créer/éditer)
      load();
    }, [query])
  );

  return (
    <View style={{ flex: 1 }}>
      <Searchbar
        placeholder="Recherche de projets"
        value={query}
        onChangeText={setQuery}
        style={{ margin: 8 }}
      />

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator />
          <Text style={{ marginTop: 8 }}>Chargement des projets…</Text>
        </View>
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(item) => String(item.id || item._id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingVertical: 8 }}
          onEndReachedThreshold={0.4}
          onEndReached={loadMore}
          ListEmptyComponent={() => (
            <View style={{ padding: 16 }}>
              <Text>Aucun projet pour le moment.</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <List.Item
              title={item.name}
              description={item.description}
              onPress={() => navigation.navigate('ProjectDetail', { id: item.id || item._id })}
              left={(props) => <List.Icon {...props} icon="folder-outline" />}
              right={(props) => (
                canManage ? (
                  <IconButton
                    {...props}
                    icon="delete-outline"
                    onPress={() => setDeleteTarget({ id: item.id || item._id, name: item.name })}
                  />
                ) : null
              )}
            />
          )}
        />
      )}

      {canManage && (
        <FAB
          style={{ position: 'absolute', right: 16, bottom: 16 }}
          icon="plus"
          label="Créer"
          onPress={() => navigation.navigate('ProjectCreate')}
        />
      )}

      <Portal>
        <Dialog visible={!!deleteTarget} onDismiss={() => setDeleteTarget(null)}>
          <Dialog.Title>Supprimer le projet</Dialog.Title>
          <Dialog.Content>
            <Text>Confirmer la suppression de « {deleteTarget?.name} » ?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteTarget(null)}>Annuler</Button>
            <Button
              onPress={async () => {
                try {
                  await deleteProject(deleteTarget.id);
                  setProjects((prev) => prev.filter((t) => (t.id || t._id) !== deleteTarget.id));
                  setSuccess('Projet supprimé');
                  setDeleteTarget(null);
                } catch (e) {
                  setError(e?.response?.data?.message || 'Échec de suppression');
                }
              }}
            >
              Supprimer
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar visible={!!error} onDismiss={() => setError('')} duration={3000}>
        {error}
      </Snackbar>
      <Snackbar visible={!!success} onDismiss={() => setSuccess('')} duration={2000}>
        {success}
      </Snackbar>
    </View>
  );
}