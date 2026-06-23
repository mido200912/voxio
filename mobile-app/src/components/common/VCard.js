import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const VCard = ({ children, style, elevation = 'md', onPress }) => {
  const { colors } = useTheme();

  const s = StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: elevation === 'sm' ? 12 : elevation === 'lg' ? 20 : 16,
      padding: elevation === 'sm' ? 12 : 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: elevation === 'sm' ? 2 : elevation === 'lg' ? 8 : 4,
    },
  });

  if (onPress) {
    return (
      <View style={[s.card, style]} onTouchEnd={onPress}>
        {children}
      </View>
    );
  }

  return <View style={[s.card, style]}>{children}</View>;
};

export default VCard;
