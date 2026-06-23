import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import BottomTabNavigator from './BottomTabNavigator';
import ChatDetailScreen from '../screens/chat/ChatDetailScreen';
import AnalyticsScreen from '../screens/analytics/AnalyticsScreen';
import NotificationSettingsScreen from '../screens/settings/NotificationSettingsScreen';
import CompanySettingsScreen from '../screens/settings/CompanySettingsScreen';
import AiSettingsScreen from '../screens/settings/AiSettingsScreen';
import AppearanceScreen from '../screens/settings/AppearanceScreen';
import LeadsScreen from '../screens/leads/LeadsScreen';
import ProductsScreen from '../screens/products/ProductsScreen';
import IntegrationsScreen from '../screens/integrations/IntegrationsScreen';

const Stack = createNativeStackNavigator();

const MainNavigator = () => {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Tabs" component={BottomTabNavigator} />
      <Stack.Screen name="ChatDetail" component={ChatDetailScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="Analytics" component={AnalyticsScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="Leads" component={LeadsScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="Products" component={ProductsScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="Integrations" component={IntegrationsScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="CompanySettings" component={CompanySettingsScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="AiSettings" component={AiSettingsScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="Appearance" component={AppearanceScreen} options={{ animation: 'slide_from_right' }} />
    </Stack.Navigator>
  );
};

export default MainNavigator;
