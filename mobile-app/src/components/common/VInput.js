import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

const VInput = ({
  label, value, onChangeText, placeholder, secureTextEntry,
  keyboardType, multiline, error, icon, style, maxLength,
}) => {
  const { colors } = useTheme();
  const { isRTL } = useLanguage();
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const s = StyleSheet.create({
    container: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
    inputContainer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: multiline ? 'flex-start' : 'center',
      backgroundColor: colors.inputBg,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: error ? '#EF4444' : focused ? '#6C63FF' : colors.inputBorder,
      paddingHorizontal: 16,
      minHeight: multiline ? 80 : 54,
    },
    icon: { fontSize: 18, marginHorizontal: 8 },
    input: {
      flex: 1,
      fontSize: 16,
      color: colors.textPrimary,
      textAlign: isRTL ? 'right' : 'left',
      paddingVertical: multiline ? 12 : 0,
    },
    toggle: { padding: 4 },
    toggleText: { fontSize: 18 },
    errorText: { fontSize: 12, color: '#EF4444', marginTop: 4, fontWeight: '600' },
  });

  return (
    <View style={[s.container, style]}>
      {label && <Text style={s.label}>{label}</Text>}
      <View style={s.inputContainer}>
        {icon && <Text style={s.icon}>{icon}</Text>}
        <TextInput
          style={s.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          multiline={multiline}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={s.toggle}>
            <Text style={s.toggleText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={s.errorText}>{error}</Text>}
    </View>
  );
};

export default VInput;
