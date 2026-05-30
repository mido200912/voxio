import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Image } from 'react-native';
import ApiService from '../services/ApiService';

export default function ProductsScreen() {
  const [products, setProducts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await ApiService.getProducts();
      setProducts(data);
    } catch (err) {
      console.error('Load products error:', err);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Products</Text>

      <FlatList
        data={products}
        renderItem={({ item }) => (
          <View style={styles.productCard}>
            {item.images?.[0] && (
              <Image source={{ uri: item.images[0] }} style={styles.productImage} />
            )}
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productPrice}>{item.price} {item.currency}</Text>
              {item.description && (
                <Text style={styles.productDesc}>{item.description.substring(0, 100)}</Text>
              )}
              <View style={styles.productMeta}>
                {item.sku && <Text style={styles.sku}>SKU: {item.sku}</Text>}
                {item.inventory > 0 && <Text style={styles.stock}>Stock: {item.inventory}</Text>}
              </View>
              <View style={styles.platforms}>
                {(item.platforms || []).map(p => (
                  <Text key={p} style={styles.platformBadge}>{p}</Text>
                ))}
              </View>
            </View>
          </View>
        )}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>No products yet</Text>}
        contentContainerStyle={products.length === 0 && { flex: 1, justifyContent: 'center' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  header: { fontSize: 24, fontWeight: '800', color: '#f1f5f9', marginBottom: 16, marginTop: 8 },
  productCard: { backgroundColor: '#1e293b', borderRadius: 12, marginBottom: 12, overflow: 'hidden' },
  productImage: { width: '100%', height: 180, resizeMode: 'cover' },
  productInfo: { padding: 14 },
  productName: { fontSize: 18, fontWeight: '700', color: '#f1f5f9', marginBottom: 4 },
  productPrice: { fontSize: 16, fontWeight: '600', color: '#22c55e', marginBottom: 4 },
  productDesc: { fontSize: 13, color: '#94a3b8', marginBottom: 8 },
  productMeta: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  sku: { fontSize: 11, color: '#64748b', backgroundColor: '#334155', paddingHorizontal: 6, borderRadius: 4, overflow: 'hidden' },
  stock: { fontSize: 11, color: '#f59e0b', backgroundColor: '#f59e0b20', paddingHorizontal: 6, borderRadius: 4, overflow: 'hidden' },
  platforms: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  platformBadge: { fontSize: 10, color: '#6C63FF', backgroundColor: '#6C63FF20', paddingHorizontal: 6, borderRadius: 4, overflow: 'hidden' },
  empty: { color: '#64748b', textAlign: 'center', padding: 24 },
});
