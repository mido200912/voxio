import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import productService from '../../services/productService';

const ProductsScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { t, language: lang } = useLanguage();
  const isRTL = lang === 'ar';
  const [products, setProducts] = useState([]);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try { const res = await productService.getProducts(); setProducts(Array.isArray(res.data) ? res.data : []); }
    catch (err) { console.warn(err); }
  };

  const s = createStyles(colors, isRTL);
  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.backText}>{isRTL ? '→' : '←'}</Text></TouchableOpacity>
        <Text style={s.title}>{t('products')}</Text>
        <TouchableOpacity><Text style={{ fontSize: 20 }}>+</Text></TouchableOpacity>
      </View>
      <ScrollView style={s.list} showsVerticalScrollIndicator={false}>
        {products.length === 0 ? (
          <View style={s.empty}><Text style={s.emptyEmoji}>📦</Text><Text style={s.emptyText}>{t('noProducts')}</Text></View>
        ) : products.map((p, i) => (
          <View key={i} style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.name, { color: colors.textPrimary }]}>{p.name}</Text>
            <Text style={[s.desc, { color: colors.textSecondary }]} numberOfLines={2}>{p.description}</Text>
            <View style={s.row}>
              <Text style={[s.price, { color: colors.textPrimary }]}>{p.price} SAR</Text>
              <Text style={[s.stock, { color: colors.textMuted }]}>Stock: {p.stock || 0}</Text>
            </View>
          </View>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const createStyles = (colors, isRTL) => ({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  backText: { fontSize: 22, color: colors.textPrimary },
  title: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  list: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: colors.textMuted },
  card: { borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1 },
  name: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  desc: { fontSize: 13, marginBottom: 8 },
  row: { flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between' },
  price: { fontSize: 18, fontWeight: '800' },
  stock: { fontSize: 13 },
});

export default ProductsScreen;
