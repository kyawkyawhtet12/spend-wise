import React, { useEffect, useState, useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Dashboard from './src/screens/Dashboard';
import Planner from './src/screens/Planner';
import Transactions from './src/screens/Transactions';
import Analytics from './src/screens/Analytics';
import Settings from './src/screens/Settings';
import { Category, CURRENCIES } from './src/types';
import { fetchExchangeRates } from './src/services/exchange';

const Tab = createBottomTabNavigator();
const STORAGE_KEY = 'spendwise_data';

const initialData = {
  salary: 5000,
  baseCurrency: 'USD',
  budgets: [
    { id: '1', category: Category.HOUSING, plannedAmount: 1500 },
    { id: '2', category: Category.FOOD, plannedAmount: 600 },
    { id: '3', category: Category.TRANSPORT, plannedAmount: 300 },
  ],
  transactions: [],
  exchangeRates: undefined,
};

export default function App() {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          setData(JSON.parse(saved));
        }
      } catch (e) {
        console.warn('Could not load saved data', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const save = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        console.warn('Could not persist data', e);
      }
    };
    if (!loading) save();
  }, [data, loading]);

  useEffect(() => {
    const pullRates = async () => {
      const rates = await fetchExchangeRates(data.baseCurrency);
      setData((prev) => ({ ...prev, exchangeRates: rates }));
    };
    pullRates();
  }, [data.baseCurrency]);

  const updateSalary = (salary) => setData((prev) => ({ ...prev, salary }));
  const updateBaseCurrency = (baseCurrency) => setData((prev) => ({ ...prev, baseCurrency }));
  const updateExchangeRates = (rates) => setData((prev) => ({ ...prev, exchangeRates: rates }));
  const addBudget = (budget) => setData((prev) => ({ ...prev, budgets: [...prev.budgets, budget] }));
  const deleteBudget = (id) =>
    setData((prev) => ({ ...prev, budgets: prev.budgets.filter((b) => b.id !== id) }));
  const addTransaction = (transaction) =>
    setData((prev) => ({ ...prev, transactions: [transaction, ...prev.transactions] }));
  const deleteTransaction = (id) =>
    setData((prev) => ({ ...prev, transactions: prev.transactions.filter((t) => t.id !== id) }));
  const resetData = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setData(initialData);
  };

  const screenProps = useMemo(
    () => ({
      data,
      onUpdateSalary: updateSalary,
      onUpdateBaseCurrency: updateBaseCurrency,
      onUpdateExchangeRates: updateExchangeRates,
      onAddTransaction: addTransaction,
      onResetData: resetData,
      onAddBudget: addBudget,
      onDeleteBudget: deleteBudget,
      onDeleteTransaction: deleteTransaction,
    }),
    [data],
  );

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f2f2f7' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={DefaultTheme}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: '#2563eb',
            tabBarInactiveTintColor: '#9ca3af',
            tabBarStyle: { backgroundColor: 'white' },
            tabBarIcon: ({ color, size }) => {
              const icons = {
                Dashboard: 'home',
                Planner: 'calendar',
                Transactions: 'swap-horizontal',
                Analytics: 'bar-chart',
              Settings: 'settings',
              };
              return <Ionicons name={icons[route.name]} size={size} color={color} />;
            },
          })}
        >
          <Tab.Screen name="Dashboard">
            {() => <Dashboard {...screenProps} />}
          </Tab.Screen>
          <Tab.Screen name="Planner">
            {() => <Planner data={data} onAddBudget={addBudget} onDeleteBudget={deleteBudget} />}
          </Tab.Screen>
          <Tab.Screen name="Transactions">
            {() => (
              <Transactions
                transactions={data.transactions}
                baseCurrency={data.baseCurrency}
                onAddTransaction={addTransaction}
                onDeleteTransaction={deleteTransaction}
              />
            )}
          </Tab.Screen>
          <Tab.Screen name="Analytics">
            {() => <Analytics data={data} />}
          </Tab.Screen>
        <Tab.Screen name="Settings">
          {() => (
            <Settings
              data={data}
              onUpdateBaseCurrency={updateBaseCurrency}
              onUpdateExchangeRates={updateExchangeRates}
              onFetchRates={async () => {
                const rates = await fetchExchangeRates(data.baseCurrency);
                updateExchangeRates(rates);
              }}
            />
          )}
        </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
