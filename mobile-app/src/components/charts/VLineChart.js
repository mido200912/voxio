import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 80;
const CHART_HEIGHT = 120;

const VLineChart = ({ data }) => {
  const { colors } = useTheme();

  if (!data || data.length === 0) return null;

  const maxVal = Math.max(...data.map(d => d.user || d.value || 0), 1);

  return (
    <View style={[styles.container, { width: CHART_WIDTH, height: CHART_HEIGHT }]}>
      <View style={styles.bars}>
        {data.map((d, i) => {
          const h = ((d.user || d.value || 0) / maxVal) * 100;
          return (
            <View key={i} style={styles.barCol}>
              <View style={[styles.bar, { height: `${Math.max(h, 5)}%`, backgroundColor: colors.textPrimary, opacity: 0.8 }]} />
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingVertical: 8 },
  bars: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  barCol: { flex: 1, alignItems: 'center' },
  bar: { width: '70%', borderRadius: 4 },
});

export default VLineChart;
