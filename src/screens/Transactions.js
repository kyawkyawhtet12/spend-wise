import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Category, CurrencyCodes, CURRENCIES } from '../types';

const Transactions = ({ transactions, baseCurrency, onAddTransaction, onDeleteTransaction }) => {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState(Category.FOOD);
  const [currency, setCurrency] = useState(baseCurrency);
  const [type, setType] = useState('expense');
  const insets = useSafeAreaInsets();

  const handleAdd = () => {
    if (!amount) return;
    onAddTransaction({
      id: Date.now().toString(),
      category,
      amount: parseFloat(amount),
      currency,
      note,
      date: new Date().toISOString().slice(0, 10),
      type,
    });
    setAmount('');
    setNote('');
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#f2f2f7' }}
      contentContainerStyle={{
        padding: 16,
        paddingTop: 12 + insets.top,
        paddingBottom: 40 + insets.bottom,
      }}
    >
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: '#111' }}>Transactions</Text>
        <Text style={{ color: '#6b7280', fontWeight: '600' }}>Add and manage your history</Text>
      </View>

      <View
        style={{
          backgroundColor: 'white',
          padding: 16,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: '#f3f4f6',
          marginBottom: 16,
          gap: 10,
        }}
      >
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity
            onPress={() => setType('expense')}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: type === 'expense' ? '#f87171' : '#e5e7eb',
              backgroundColor: type === 'expense' ? '#fef2f2' : '#f9fafb',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#dc2626', fontWeight: '800' }}>Expense</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setType('income')}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: type === 'income' ? '#34d399' : '#e5e7eb',
              backgroundColor: type === 'income' ? '#ecfdf3' : '#f9fafb',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#16a34a', fontWeight: '800' }}>Income</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="Amount"
          style={{
            backgroundColor: '#f9fafb',
            borderWidth: 1,
            borderColor: '#e5e7eb',
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        />
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Note"
          style={{
            backgroundColor: '#f9fafb',
            borderWidth: 1,
            borderColor: '#e5e7eb',
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        />
        <Picker
          selectedValue={category}
          onValueChange={(val) => setCategory(val)}
          style={{ backgroundColor: '#f9fafb', borderRadius: 12 }}
        >
          {Object.values(Category).map((cat) => (
            <Picker.Item key={cat} label={cat} value={cat} />
          ))}
        </Picker>
        <Picker selectedValue={currency} onValueChange={(val) => setCurrency(val)} style={{ backgroundColor: '#f9fafb' }}>
          {CurrencyCodes.map((c) => (
            <Picker.Item key={c} label={`${c} (${CURRENCIES[c].symbol})`} value={c} />
          ))}
        </Picker>
        <TouchableOpacity
          onPress={handleAdd}
          style={{
            backgroundColor: '#2563eb',
            borderRadius: 12,
            paddingVertical: 12,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: 'white', fontWeight: '800' }}>Add Transaction</Text>
        </TouchableOpacity>
      </View>

      <View style={{ gap: 12 }}>
        {transactions.length === 0 ? (
          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 16,
              padding: 20,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#f3f4f6',
            }}
          >
            <Text style={{ color: '#9ca3af', fontStyle: 'italic' }}>No transactions yet.</Text>
          </View>
        ) : (
          transactions.map((t) => (
            <View
              key={t.id}
              style={{
                backgroundColor: 'white',
                borderRadius: 16,
                padding: 14,
                borderWidth: 1,
                borderColor: '#f3f4f6',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View
                  style={{
                    height: 42,
                    width: 42,
                    borderRadius: 12,
                    backgroundColor: '#f3f4f6',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 18 }}>{t.category.charAt(0)}</Text>
                </View>
                <View>
                  <Text style={{ fontWeight: '800', color: '#111827' }}>{t.note || t.category}</Text>
                  <Text style={{ fontSize: 12, color: '#9ca3af', fontWeight: '700' }}>{t.date}</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontWeight: '800', color: t.type === 'expense' ? '#dc2626' : '#16a34a' }}>
                  {t.type === 'expense' ? '-' : '+'}
                  {CURRENCIES[t.currency].symbol}
                  {t.amount.toLocaleString()}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={{ fontSize: 10, color: '#9ca3af', fontWeight: '700' }}>{t.category}</Text>
                  <TouchableOpacity onPress={() => onDeleteTransaction(t.id)}>
                    <Ionicons name='trash' size={18} color='#9ca3af' />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

export default Transactions;

