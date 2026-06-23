import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';

const VButton = ({
  title, onPress, variant = 'primary', size = 'md',
  disabled, loading, icon, style, textStyle,
}) => {
  const s = createStyles(variant, size);

  return (
    <TouchableOpacity
      style={[s.button, disabled && s.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#FFF' : '#6C63FF'} size="small" />
      ) : (
        <View style={s.content}>
          {icon && <Text style={s.icon}>{icon}</Text>}
          <Text style={[s.text, textStyle]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const createStyles = (variant, size) => {
  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';
  const isDanger = variant === 'danger';
  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  return StyleSheet.create({
    button: {
      backgroundColor: isPrimary ? '#6C63FF' : isDanger ? '#EF4444' : 'transparent',
      borderWidth: isOutline ? 1 : 0,
      borderColor: isOutline ? '#6C63FF' : 'transparent',
      borderRadius: isSmall ? 10 : 14,
      height: isSmall ? 40 : isLarge ? 56 : 48,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: isSmall ? 12 : 20,
    },
    disabled: { opacity: 0.5 },
    content: { flexDirection: 'row', alignItems: 'center' },
    icon: { fontSize: 16, marginRight: 6 },
    text: {
      color: isPrimary || isDanger ? '#FFF' : '#6C63FF',
      fontSize: isSmall ? 13 : isLarge ? 17 : 15,
      fontWeight: '700',
    },
  });
};

export default VButton;
