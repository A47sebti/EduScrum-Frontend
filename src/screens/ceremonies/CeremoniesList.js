import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, FlatList, RefreshControl } from 'react-native';
import { Text, List, ActivityIndicator, FAB, Snackbar, Searchbar, IconButton, Portal, Dialog, Button } from 'react-native-paper';
import { getCeremonies, deleteCeremony } from '../../services/api/ceremonies';
import { useAuth } from '../../context/AuthContext';

export default function CeremoniesList({ navigation }) {
  const { role } = useAuth();
  const canManage = role === 'scrum_master' || role === 'admin';
  const [items, setItems] = useState([]);
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
    const items = Array.isArray(data?.ceremonies) ? data.ceremonies : Array.isArray(data) ? data : (data?.items || []);
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
      const data = await getCeremonies({ page: 1, limit, q: query || undefined });
      const { items, next } = normalizeResponse(data);
      setItems(items);
      setPage(1);
      setHasNext(next);
    } catch (e) {
      setError(e?.response?.data?.message || 'Erreur lors du chargement des cérémonies');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getCeremonies({ page: 1, limit, q: query || undefined });
      const { items, next } = normalizeResponse(data);
      setItems(items);
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
      const data = await getCeremonies({ page: nextPage, limit, q: query || undefined });
      const { items: more, next } = normalizeResponse(data);
      setItems((prev) => [...prev, ...more]);
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
      load();
    }, [query])
  );

  const confirmDelete = (item) => setDeleteTarget(item);
  const cancelDelete = () => setDeleteTarget(null);

  const renderItem = ({ item }) => {
    const title = item.title || `Cérémonie #${item.id || item._id}`;
    const descriptionParts = [];
    if (item.type) descriptionParts.push(`Type: ${item.type}`);
    if (item.datetime) descriptionParts.push(`Quand: ${item.datetime}`);
    if (item.sprintId) descriptionParts.push(`Sprint: ${item.sprintId}`);
    const description = descriptionParts.length ? descriptionParts.join(' • ') : undefined;
    return (
      <List.Item
        title={title}
        description={description}
        onPress={() => navigation.navigate('CeremonyDetail', { id: item.id || item._id })}
        left={(props) => <List.Icon {...props} icon="calendar-check-outline" />}
        right={(props) => (
          canManage ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <IconButton {...props} icon="pencil" onPress={() => navigation.navigate('CeremonyEdit', { id: item.id || item._id })} />
              <IconButton {...props} icon="delete" onPress={() => confirmDelete(item)} />
            </View>
          ) : null
        )}
      />
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <Searchbar
        placeholder="Recherche de cérémonies"
        value={query}
        onChangeText={setQuery}
        style={{ margin: 8 }}
      />

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator />
          <Text style={{ marginTop: 8 }}>Chargement des cérémonies…</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id || item._id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingVertical: 8 }}
          onEndReachedThreshold={0.4}
          onEndReached={loadMore}
          ListEmptyComponent={() => (
            <View style={{ padding: 16 }}>
              <Text>Aucune cérémonie pour le moment.</Text>
            </View>
          )}
          renderItem={renderItem}
        />
      )}

      {canManage && (
        <FAB
          style={{ position: 'absolute', right: 16, bottom: 16 }}
          icon="plus"
          label="Créer"
          onPress={() => navigation.navigate('CeremonyCreate')}
        />
      )}

      <Portal>
        <Dialog visible={!!deleteTarget} onDismiss={cancelDelete}>
          <Dialog.Title>Supprimer la cérémonie</Dialog.Title>
          <Dialog.Content>
            <Text>Confirmer la suppression de « {deleteTarget?.title || `#${deleteTarget?.id}`} » ?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={cancelDelete}>Annuler</Button>
            <Button
              onPress={async () => {
                try {
                  await deleteCeremony(deleteTarget.id || deleteTarget._id);
                  setItems((prev) => prev.filter((t) => (t.id || t._id) !== (deleteTarget.id || deleteTarget._id)));
                  setSuccess('Cérémonie supprimée');
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