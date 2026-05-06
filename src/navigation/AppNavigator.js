import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import TripListScreen from '../screens/trips/TripListScreen';
import CreateTripScreen from '../screens/trips/CreateTripScreen';
import TripDetailScreen from '../screens/trips/TripDetailScreen';
import AddExpenseScreen from '../screens/expenses/AddExpenseScreen';
import BalanceScreen from '../screens/balances/BalanceScreen';
import FriendsScreen from '../screens/friends/FriendsScreen';
import OverallBalancesScreen from '../screens/balances/OverallBalancesScreen';
import { C, F } from '../theme/postage';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const STACK_HEADER = {
  headerStyle: { backgroundColor: C.surfaceAlt, elevation: 0, shadowOpacity: 0, borderBottomWidth: 1, borderBottomColor: C.border },
  headerTitleStyle: { fontFamily: F.serif, fontSize: 20, fontStyle: 'italic', color: C.ink },
  headerTintColor: C.stamp,
  headerBackTitleVisible: false,
};

function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: C.stamp,
        tabBarInactiveTintColor: C.inkLight,
        tabBarStyle: {
          backgroundColor: C.surfaceAlt,
          borderTopWidth: 1,
          borderTopColor: C.border,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: { fontFamily: F.mono, fontSize: 9, letterSpacing: 0.8 },
        headerStyle: { backgroundColor: C.surfaceAlt, elevation: 0, shadowOpacity: 0, borderBottomWidth: 1, borderBottomColor: C.border },
        headerTitleStyle: { fontFamily: F.serif, fontSize: 20, fontStyle: 'italic', color: C.ink },
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{
          headerShown: false,
          tabBarLabel: 'HOME',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="home" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Trips"
        component={TripListScreen}
        options={{
          title: 'My Trips',
          headerShown: false,
          tabBarLabel: 'TRIPS',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="flight" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Friends"
        component={FriendsScreen}
        options={{
          title: 'Travel Mates',
          tabBarLabel: 'MATES',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="group" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Balances"
        component={OverallBalancesScreen}
        options={{
          title: 'Balances',
          tabBarLabel: 'SETTLE',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="account-balance-wallet" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator screenOptions={STACK_HEADER}>
      <Stack.Screen name="Main" component={AppTabs} options={{ headerShown: false }} />
      <Stack.Screen name="CreateTrip" component={CreateTripScreen} options={{ title: 'New Trip' }} />
      <Stack.Screen name="TripDetail" component={TripDetailScreen} options={{ title: '' }} />
      <Stack.Screen name="AddExpense" component={AddExpenseScreen} options={{ title: 'Add Expense' }} />
      <Stack.Screen name="TripBalances" component={BalanceScreen} options={{ title: 'Settle Up' }} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg }}>
        <ActivityIndicator size="large" color={C.stamp} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
