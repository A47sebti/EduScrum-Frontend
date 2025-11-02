import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, RefreshControl, ScrollView } from 'react-native';
import { Text, List, ActivityIndicator, Snackbar, Searchbar, Chip } from 'react-native-paper';
import { getTeamMembers } from '../../services/api/teams';

export default function TeamMembers({ route, navigation }) {
  const { id } = route.params || {};
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [hasNext, setHasNext] = useState(true);

  const normalize = (data) => {
    const items = Array.isArray(data?.members) ? data.members : Array.isArray(data) ? data : (data?.items || []);
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
      const data = await getTeamMembers(id, { page: 1, limit, q: query || undefined, role: roleFilter !== 'all' ? roleFilter : undefined });
      const { items, next } = normalize(data);
      setMembers(items);
      setPage(1);
      setHasNext(next);
    } catch (e) {
      setError(e?.response?.data?.message || 'Erreur lors du chargement des membres');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getTeamMembers(id, { page: 1, limit, q: query || undefined, role: roleFilter !== 'all' ? roleFilter : undefined });
      const { items, next } = normalize(data);
      setMembers(items);
      setPage(1);
      setHasNext(next);
    } catch (e) {
      setError(e?.response?.data?.message || 'Erreur lors du rafraîchissement');
    } finally {
      setRefreshing(false);
    }
  }, [id, query, roleFilter, limit]);

  const loadMore = async () => {
    if (loadingMore || !hasNext) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const data = await getTeamMembers(id, { page: nextPage, limit, q: query || undefined, role: roleFilter !== 'all' ? roleFilter : undefined });
      const { items, next } = normalize(data);
      setMembers((prev) => [...prev, ...items]);
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
  }, [id, query, roleFilter]);

  return (
    <View style={{ flex: 1 }}>
      <Searchbar
        placeholder="Recherche de membres"
        value={query}
        onChangeText={setQuery}
        style={{ margin: 8 }}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 8 }}>
        {['all', 'scrum_master', 'product_owner', 'developer', 'student'].map((r) => (
          <Chip
            key={r}
            selected={roleFilter === r}
            onPress={() => setRoleFilter(r)}
            style={{ marginRight: 8, marginVertical: 4 }}
          >
            {r === 'all' ? 'Tous' : r}
          </Chip>
        ))}
      </ScrollView>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator />
          <Text style={{ marginTop: 8 }}>Chargement des membres…</Text>
        </View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(m) => String(m.id || m._id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingVertical: 8 }}
          onEndReachedThreshold={0.4}
          onEndReached={loadMore}
          ListEmptyComponent={() => (
            <View style={{ padding: 16 }}>
              <Text>Aucun membre.</Text>
            </View>
          )}
          renderItem={({ item: m }) => (
            <List.Item
              title={m.name || m.fullName || m.email}
              description={(m.role || m.userRole || '').toString()}
              onPress={() => navigation.navigate('AssignRole', { teamId: id, userId: m.id || m._id, currentRole: m.role })}
              left={(props) => <List.Icon {...props} icon="account-circle" />}
            />
          )}
        />
      )}

      <Snackbar visible={!!error} onDismiss={() => setError('')} duration={3000}>
        {error}
      </Snackbar>
    </View>
  );
}