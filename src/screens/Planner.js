import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Category, CURRENCIES } from '../types';

const Planner = ({ data, onAddBudget, onDeleteBudget }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [selectedCat, setSelectedCat] = useState(Category.FOOD);
  const [amount, setAmount] = useState('');
  const insets = useSafeAreaInsets();

  const totalPlanned = data.budgets.reduce((sum, b) => sum + b.plannedAmount, 0);
  const remainingSalary = data.salary - totalPlanned;
  const baseSymbol = CURRENCIES[data.baseCurrency].symbol;

  const handleAdd = () => {
    if (!amount) return;
    onAddBudget({
      id: Date.now().toString(),
      category: selectedCat,
      plannedAmount: parseFloat(amount),
    });
    setAmount('');
    setShowAdd(false);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#f2f2f7' }}
      contentContainerStyle={{
        padding: 16,
        paddingTop: 12 + insets.top,
        paddingBottom: 20 + insets.bottom,
      }}
    >
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: '#111' }}>Budget Planner</Text>
        <Text style={{ color: '#6b7280', fontWeight: '600' }}>Allocate your monthly salary</Text>
      </View>

      <View
        style={{
          backgroundColor: 'white',
          padding: 16,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: '#f3f4f6',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          marginBottom: 16,
        }}
      >
        <View
          style={{
            height: 80,
            width: 80,
            borderRadius: 40,
            backgroundColor: '#eef2ff',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontWeight: '800', color: '#4f46e5', fontSize: 18 }}>
            {Math.round((totalPlanned / (data.salary || 1)) * 100)}%
          </Text>
        </View>
        <View>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase' }}>
            Unallocated
          </Text>
          <Text
            style={{
              fontSize: 22,
              fontWeight: '800',
              color: remainingSalary < 0 ? '#ef4444' : '#111827',
            }}
          >
            {baseSymbol}
            {remainingSalary.toLocaleString()}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827' }}>Planned Envelopes</Text>
        <TouchableOpacity
          onPress={() => setShowAdd(!showAdd)}
          style={{
            backgroundColor: '#2563eb',
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 20,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Ionicons name="add-circle" size={16} color="white" />
          <Text style={{ color: 'white', fontWeight: '800', fontSize: 12 }}>{showAdd ? 'Cancel' : 'Add Category'}</Text>
        </TouchableOpacity>
      </View>

      {showAdd && (
        <View
          style={{
            backgroundColor: 'white',
            padding: 16,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: '#e0f2fe',
            marginBottom: 16,
            gap: 12,
          }}
        >
          <View>
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#9ca3af', marginBottom: 6 }}>Category</Text>
            <Picker
              selectedValue={selectedCat}
              onValueChange={(val) => setSelectedCat(val)}
              style={{ backgroundColor: '#f9fafb', borderRadius: 12 }}
            >
              {Object.values(Category).map((cat) => (
                <Picker.Item key={cat} label={cat} value={cat} />
              ))}
            </Picker>
          </View>
          <View>
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#9ca3af', marginBottom: 6 }}>Monthly Goal</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0.00"
              style={{
                backgroundColor: '#f9fafb',
                borderWidth: 1,
                borderColor: '#e5e7eb',
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
              }}
            />
          </View>
          <TouchableOpacity
            onPress={handleAdd}
            style={{
              backgroundColor: '#2563eb',
              borderRadius: 12,
              paddingVertical: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: 'white', fontWeight: '800' }}>Set Budget</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ gap: 12 }}>
        {data.budgets.length === 0 ? (
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
            <Text style={{ color: '#9ca3af', fontStyle: 'italic' }}>No budgets planned yet.</Text>
          </View>
        ) : (
          data.budgets.map((b) => (
            <View
              key={b.id}
              style={{
                backgroundColor: 'white',
                borderRadius: 16,
                padding: 16,
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
                    backgroundColor: '#eef2ff',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontWeight: '800', color: '#4f46e5' }}>{b.category.charAt(0)}</Text>
                </View>
                <View>
                  <Text style={{ fontWeight: '800', color: '#111827' }}>{b.category}</Text>
                  <Text style={{ fontSize: 11, color: '#9ca3af', fontWeight: '700' }}>Monthly Allocation</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontWeight: '800', color: '#111827' }}>
                    {baseSymbol}
                    {b.plannedAmount.toLocaleString()}
                  </Text>
                  <Text style={{ fontSize: 10, color: '#9ca3af', fontWeight: '700' }}>Budget</Text>
                </View>
                <TouchableOpacity onPress={() => onDeleteBudget(b.id)}>
                  <Ionicons name="trash" size={18} color="#9ca3af" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

export default Planner;

