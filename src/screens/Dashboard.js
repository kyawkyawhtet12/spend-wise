import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Dimensions, Alert } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { Picker } from '@react-native-picker/picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import SummaryCard from '../components/SummaryCard';
import { CURRENCIES } from '../types';
import { convertAmount } from '../services/exchange';
import { getFinancialInsights } from '../services/gemini';

const Dashboard = ({ data, onUpdateSalary, onUpdateBaseCurrency, onAddTransaction, onResetData }) => {
  const [isEditingSalary, setIsEditingSalary] = useState(false);
  const [tempSalary, setTempSalary] = useState(String(data.salary));
  const [aiInsight, setAiInsight] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [toast, setToast] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get('window').width - 48;

  const showToast = (msg, duration = 3000) => {
    setToast(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), duration);
  };

  const baseSymbol = CURRENCIES[data.baseCurrency].symbol;
  const totalSpentConverted = data.transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + convertAmount(t.amount, t.currency, data.baseCurrency, data.exchangeRates), 0);
  const balance = data.salary - totalSpentConverted;
  const totalPlanned = data.budgets.reduce((s, b) => s + b.plannedAmount, 0);
  const budgetUsage = (totalSpentConverted / (totalPlanned || 1)) * 100;

const handleGetInsight = async () => {
  setLoadingAi(true);
  
  // Create a timeout promise
  const timeout = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Request timed out')), 10000)
  );

  try {
    // Race the API call against the timeout
    const insight = await Promise.race([getFinancialInsights(data), timeout]);
    setAiInsight(insight);
  } catch (error) {
    console.error(error);
    const msg = (error && error.message) ? error.message.toLowerCase() : '';
    if (msg.includes('timed out') || msg.includes('timeout')) {
      // Show a transient toast for timeout errors only
      showToast('Request timed out. Please check your connection and try again.', 4000);
    } else {
      // For other errors, show a toast and set a friendly message
      showToast('Failed to get insight. Please try again.', 4000);
      setAiInsight('Request took too long or failed.');
    }
  } finally {
    setLoadingAi(false);
  }
};

  const handleSalarySave = () => {
    onUpdateSalary(parseFloat(tempSalary) || 0);
    setIsEditingSalary(false);
  };

  const handleResetConfirmation = () => {
    Alert.alert(
      'Reset local data',
      'This will remove ALL local data stored on this device and cannot be undone. Are you sure you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            // perform reset
            onResetData();
            // clear any transient UI state
            setAiInsight('');
            showToast('Local data reset', 3000);
          },
        },
      ],
    );
  };



  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#f2f2f7' }}
      contentContainerStyle={{
        padding: 16,
        paddingTop: 12 + insets.top,
        paddingBottom: 24 + insets.bottom,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <View>
          <Text style={{ fontSize: 28, fontWeight: '800', color: '#111' }}>Overview</Text>
          <Text style={{ color: '#6b7280', fontWeight: '600' }}>Welcome back!</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#9ca3af' }}>
            Monthly Salary ({data.baseCurrency})
          </Text>
          {isEditingSalary ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TextInput
                value={tempSalary}
                onChangeText={setTempSalary}
                keyboardType="numeric"
                style={{
                  width: 120,
                  backgroundColor: 'white',
                  borderWidth: 1,
                  borderColor: '#bfdbfe',
                  borderRadius: 10,
                  paddingHorizontal: 8,
                  paddingVertical: 6,
                  fontWeight: '800',
                  color: '#2563eb',
                  textAlign: 'right',
                }}
              />
              <TouchableOpacity onPress={handleSalarySave}>
                <Text style={{ color: '#2563eb', fontWeight: '800' }}>Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setIsEditingSalary(true)}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#2563eb' }}>
                {baseSymbol}
                {data.salary.toLocaleString()}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
        <View style={{ flex: 1 }}>
          <SummaryCard
            label="Remaining"
            amount={balance}
            color="#16a34a"
            icon={<Ionicons name="wallet" size={20} color="#16a34a" />}
          />
        </View>
        <View style={{ flex: 1 }}>
          <SummaryCard
            label="Total Spent"
            amount={totalSpentConverted}
            color="#dc2626"
            icon={<Ionicons name="cart" size={20} color="#dc2626" />}
          />
        </View>
      </View>

      <View
        style={{
          backgroundColor: 'white',
          padding: 16,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: '#f3f4f6',
          marginBottom: 16,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ fontWeight: '700', color: '#374151' }}>Budget Usage</Text>
          <Text style={{ fontWeight: '800', color: '#111827' }}>{Math.round(budgetUsage)}%</Text>
        </View>
        <View style={{ height: 10, backgroundColor: '#f3f4f6', borderRadius: 10 }}>
          <View
            style={{
              height: 10,
              width: `${Math.min(budgetUsage, 100)}%`,
              backgroundColor: budgetUsage > 90 ? '#ef4444' : '#2563eb',
              borderRadius: 10,
            }}
          />
        </View>
      </View>

      <View
        style={{
          backgroundColor: '#4f46e5',
          padding: 18,
          borderRadius: 20,
          marginBottom: 16,
          overflow: 'hidden',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Ionicons name="sparkles" size={18} color="#fde68a" />
          <Text style={{ color: 'white', fontWeight: '800', fontSize: 16 }}>AI Smart Insights</Text>
        </View>

        <Text style={{ color: 'white', marginBottom: 10, fontWeight: '600' }}>
          {aiInsight || 'Press "Get Insight" to generate a tip.'}
        </Text>

        <TouchableOpacity
          onPress={handleGetInsight}
          disabled={loadingAi || data.transactions.length === 0}
          style={{
            backgroundColor: 'white',
            borderRadius: 12,
            paddingVertical: 12,
            alignItems: 'center',
          }}
        >
          {loadingAi ? (
            <ActivityIndicator size="small" color="#4f46e5" />
          ) : (
            <Text style={{ color: '#4f46e5', fontWeight: '800' }}>Get Insight</Text>
          )}
        </TouchableOpacity>

        {/* Loading overlay */}
        {loadingAi && (
          <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.25)', alignItems: 'center', justifyContent: 'center', borderRadius: 20 }}>
            <ActivityIndicator size="large" color="white" />
            <Text style={{ color: 'white', marginTop: 8 }}>Generating insight...</Text>
          </View>
        )}

      </View>

      <View
        style={{
          backgroundColor: 'white',
          borderRadius: 18,
          padding: 12,
          borderWidth: 1,
          borderColor: '#f3f4f6',
          marginBottom: 16,
        }}
      >
        <Text style={{ fontWeight: '800', color: '#111827', marginBottom: 8 }}>Spending Overview</Text>
        {Object.keys(data.transactions || {}).length === 0 ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: '#9ca3af', fontStyle: 'italic' }}>Add transactions to see charts.</Text>
          </View>
        ) : (
          (() => {
            const categoryTotals = data.transactions.reduce((acc, t) => {
              if (t.type === 'income') return acc;
              const amt = convertAmount(t.amount, t.currency, data.baseCurrency, data.exchangeRates);
              acc[t.category] = (acc[t.category] || 0) + amt;
              return acc;
            }, {});
            const labels = Object.keys(categoryTotals);
            const values = labels.map((l) => Math.round(categoryTotals[l]));
            return (
              <BarChart
                data={{ labels, datasets: [{ data: values }] }}
                width={screenWidth}
                height={200}
                fromZero
                chartConfig={{
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`,
                  barPercentage: 0.6,
                }}
                style={{ borderRadius: 12 }}
              />
            );
          })()
        )}
        <Text style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>
          Base currency: {data.baseCurrency} ({CURRENCIES[data.baseCurrency].symbol})
        </Text>
      </View>

      <TouchableOpacity
        onPress={handleResetConfirmation}
        style={{
          marginTop: 12,
          paddingVertical: 12,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#f87171',
          alignItems: 'center',
          backgroundColor: 'white',
        }}
      >
        <Text style={{ color: '#b91c1c', fontWeight: '800' }}>Reset local data</Text>
      </TouchableOpacity>

      {/* Toast */}
      {toastVisible && (
        <View style={{ position: 'absolute', left: 16, right: 16, bottom: 24 + insets.bottom, alignItems: 'center' }}>
          <View style={{ backgroundColor: 'rgba(0,0,0,0.85)', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 }}>
            <Text style={{ color: 'white', fontWeight: '600' }}>{toast}</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default Dashboard;

