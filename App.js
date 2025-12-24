import React, { useEffect, useState, useMemo } from 'react';
import { ActivityIndicator, View, AppState } from 'react-native'; // Added AppState
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
import AiChat from './src/screens/AiChat';
import { Category } from './src/types';
import * as Localization from 'expo-localization'; // Used this instead of RNLocalize
import { fetchExchangeRates } from './src/services/exchange';

const Tab = createBottomTabNavigator();
const STORAGE_KEY = 'spendwise_data';

const getDefaultBaseCurrency = () => {
  try {
    // Expo-friendly way to get region/country
    const locales = Localization.getLocales();
    const region = locales[0]?.regionCode?.toUpperCase();

    const euroCountries = new Set(['FR','DE','ES','IT','NL','BE','LU','IE','PT','AT','GR','SI','SK','LV','LT','EE','CY','MT']);

    const map = {
      US: 'USD', GB: 'GBP', CA: 'CAD', AU: 'AUD', NZ: 'NZD', JP: 'JPY', CN: 'CNY',
      IN: 'INR', BR: 'BRL', RU: 'RUB', KR: 'KRW', SG: 'SGD', MX: 'MXN', CH: 'CHF',
      SE: 'SEK', NO: 'NOK', DK: 'DKK', ZA: 'ZAR', TH: 'THB', ID: 'IDR', PH: 'PHP',
      VN: 'VND', PK: 'PKR', EG: 'EGP', NG: 'NGN', AR: 'ARS', CL: 'CLP', CO: 'COP',
      PE: 'PEN', TR: 'TRY', IL: 'ILS', SA: 'SAR', AE: 'AED', QA: 'QAR', KZ: 'KZT',
      MY: 'MYR', HU: 'HUF', CZ: 'CZK', PL: 'PLN', UA: 'UAH', BG: 'BGN', RO: 'RON'
    };

    if (region) {
      if (map[region]) return map[region];
      if (euroCountries.has(region)) return 'EUR';
    }
  } catch (e) {
    console.warn('Currency detection failed', e);
  }
  return 'USD';
};

const initialData = {
  salary: 0,
  baseCurrency: getDefaultBaseCurrency(),
  autoDetectCurrency: true,
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
          const parsed = JSON.parse(saved);
          setData({
            ...initialData,
            ...parsed,
            baseCurrency: parsed.baseCurrency || initialData.baseCurrency,
            salary: typeof parsed.salary === 'number' ? parsed.salary : initialData.salary,
          });
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
        if (!loading) {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
      } catch (e) {
        console.warn('Could not persist data', e);
      }
    };
    save();
  }, [data, loading]);

  useEffect(() => {
    const pullRates = async () => {
      const rates = await fetchExchangeRates(data.baseCurrency);
      setData((prev) => ({ ...prev, exchangeRates: rates }));
    };
    pullRates();
  }, [data.baseCurrency]);

  // Handle auto-detection when app returns from background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active' && data.autoDetectCurrency) {
        const newBase = getDefaultBaseCurrency();
        if (newBase !== data.baseCurrency) {
          setData(prev => ({ ...prev, baseCurrency: newBase }));
        }
      }
    });

    return () => subscription.remove();
  }, [data.autoDetectCurrency, data.baseCurrency]);

  const updateSalary = (salary) => setData((prev) => ({ ...prev, salary }));
  const updateBaseCurrency = (baseCurrency) => setData((prev) => ({ ...prev, baseCurrency }));
  const updateExchangeRates = (rates) => setData((prev) => ({ ...prev, exchangeRates: rates }));
  
  const updateAutoDetectCurrency = (autoDetect) => {
    if (autoDetect) {
      const newBase = getDefaultBaseCurrency();
      setData((prev) => ({ 
        ...prev, 
        autoDetectCurrency: true, 
        baseCurrency: newBase 
      }));
    } else {
      setData((prev) => ({ ...prev, autoDetectCurrency: false }));
    }
  };

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
      onUpdateAutoDetectCurrency: updateAutoDetectCurrency,
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
                Assistant: 'chatbubbles',
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
          <Tab.Screen name="Assistant">
            {() => <AiChat data={data} />}
          </Tab.Screen>
          <Tab.Screen name="Settings">
            {() => (
              <Settings
                data={data}
                onUpdateBaseCurrency={updateBaseCurrency}
                onUpdateExchangeRates={updateExchangeRates}
                onUpdateAutoDetectCurrency={updateAutoDetectCurrency}
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