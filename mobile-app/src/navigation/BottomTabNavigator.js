import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import DashboardHomeScreen from '../screens/dashboard/DashboardHomeScreen';
import ConversationsScreen from '../screens/chat/ConversationsScreen';
import OrdersScreen from '../screens/orders/OrdersScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

const Tab = createBottomTabNavigator();

const TabIcon = ({ emoji, focused, color }) => (
  <View style={[tabStyles.iconContainer, focused && tabStyles.iconFocused]}>
    <Text style={tabStyles.icon}>{emoji}</Text>
  </View>
);

const BottomTabNavigator = () => {
  const { colors } = useTheme();
  const { t } = useLanguage();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
        },
        tabBarActiveTintColor: colors.textPrimary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardHomeScreen}
        options={{
          tabBarLabel: t('dashboard'),
          tabBarIcon: ({ focused, color }) => <TabIcon emoji="📊" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="Conversations"
        component={ConversationsScreen}
        options={{
          tabBarLabel: t('conversations'),
          tabBarIcon: ({ focused, color }) => <TabIcon emoji="💬" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{
          tabBarLabel: t('orders'),
          tabBarIcon: ({ focused, color }) => <TabIcon emoji="🛒" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: t('settings'),
          tabBarIcon: ({ focused, color }) => <TabIcon emoji="⚙️" focused={focused} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

const tabStyles = StyleSheet.create({
  iconContainer: {
    width: 36,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  iconFocused: {
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
  },
  icon: {
    fontSize: 20,
  },
});

export default BottomTabNavigator;
