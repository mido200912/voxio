import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LogBox, StatusBar } from 'react-native';

import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ConversationsScreen from './src/screens/ConversationsScreen';
import ChatScreen from './src/screens/ChatScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import ProductsScreen from './src/screens/ProductsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import NotificationService from './src/services/NotificationService';

LogBox.ignoreLogs(['Warning: ...']);

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#0f172a', borderTopColor: '#1e293b', paddingBottom: 8, height: 60 },
        tabBarActiveTintColor: '#6C63FF',
        tabBarInactiveTintColor: '#64748b',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarIcon: ({ color }) => <Icon name="home" size={24} color={color} />, tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen
        name="Conversations"
        component={ConversationsScreen}
        options={{ tabBarIcon: ({ color }) => <Icon name="comments" size={24} color={color} />, tabBarLabel: 'Chats' }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{ tabBarIcon: ({ color }) => <Icon name="shopping-cart" size={24} color={color} />, tabBarLabel: 'Orders' }}
      />
      <Tab.Screen
        name="Products"
        component={ProductsScreen}
        options={{ tabBarIcon: ({ color }) => <Icon name="box" size={24} color={color} />, tabBarLabel: 'Products' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarIcon: ({ color }) => <Icon name="cog" size={24} color={color} />, tabBarLabel: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

const Icon = ({ name, size, color }) => {
  const icons = {
    home: '🏠', comments: '💬', 'shopping-cart': '🛒', box: '📦', cog: '⚙️',
    'arrow-left': '←', send: '➤', 'refresh': '🔄',
  };
  return <React.Fragment>{icons[name] || '•'}</React.Fragment>;
};

export default function App() {
  useEffect(() => {
    NotificationService.initialize();
  }, []);

  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="Chat" component={ChatScreen} options={{ animation: 'slide_from_right' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
