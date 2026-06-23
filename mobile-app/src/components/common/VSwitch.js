import React from 'react';
import { Switch, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const VSwitch = ({ value, onValueChange }) => {
  const { colors } = useTheme();

  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: colors.border, true: '#6C63FF' }}
      thumbColor="#FFF"
      ios_backgroundColor={colors.border}
    />
  );
};

export default VSwitch;
