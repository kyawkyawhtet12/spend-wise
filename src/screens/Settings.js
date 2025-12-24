import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { CURRENCIES, CurrencyCodes } from '../types';
import { fetchExchangeRates } from '../services/exchange';
import { saveAiModel, loadAiModel, loadApiKey, removeApiKey } from '../storage';
import { persistApiKey } from '../services/gemini';

const Settings = ({ data, onUpdateBaseCurrency, onUpdateExchangeRates, onFetchRates }) => {
  const insets = useSafeAreaInsets();
  const [baseCurrency, setBaseCurrency] = useState(data.baseCurrency);
  const [rates, setRates] = useState(() => data.exchangeRates || {});
  const [aiModel, setAiModel] = useState('gemini-1.5-flash');
  const [apiKey, setApiKey] = useState('');
  const [apiSaved, setApiSaved] = useState(false);

  useEffect(() => {
    setBaseCurrency(data.baseCurrency);
    setRates(data.exchangeRates || {});
  }, [data.baseCurrency, data.exchangeRates]);

  useEffect(() => {
    const loadModel = async () => {
      const saved = await loadAiModel();
      if (saved) setAiModel(saved);
    };
    loadModel();
  }, []);

  useEffect(() => {
    const loadKey = async () => {
      const saved = await loadApiKey();
      if (saved) {
        setApiKey(saved);
        setApiSaved(true);
      } else {
        setApiSaved(false);
      }
    };
    loadKey();
  }, []);

  const currencyList = useMemo(
    () => CurrencyCodes.filter((c) => c !== baseCurrency),
    [baseCurrency],
  );

  const handleSave = async () => {
    onUpdateBaseCurrency(baseCurrency);
    onUpdateExchangeRates(rates);
    await saveAiModel(aiModel);
    Alert.alert('Saved', 'Currency, rates, and AI model saved.');
  };

  const handleFetch = async () => {
    const latest = await fetchExchangeRates(baseCurrency);
    setRates(latest);
    onUpdateExchangeRates(latest);
    onUpdateBaseCurrency(baseCurrency);
    if (onFetchRates) {
      onFetchRates();
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) return;
    await persistApiKey(apiKey.trim());
    setApiSaved(true);
  };

  const handleRemoveApiKey = async () => {
    try {
      await removeApiKey();
      setApiKey('');
      setApiSaved(false);
      Alert.alert('API key removed', 'Removed from local storage.');
    } catch (e) {
      console.warn('Failed to remove API key', e);
      Alert.alert('Error', 'Failed to remove API key.');
    }
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
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: '#111' }}>Settings</Text>
        <Text style={{ color: '#6b7280', fontWeight: '600' }}>Currency & exchange rates</Text>
      </View>

      <View
        style={{
          backgroundColor: 'white',
          borderRadius: 18,
          padding: 16,
          borderWidth: 1,
          borderColor: '#f3f4f6',
          marginBottom: 16,
          gap: 10,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="globe" size={18} color="#4f46e5" />
          <Text style={{ fontWeight: '800', color: '#111827' }}>Base Currency</Text>
        </View>
        <Picker
          selectedValue={baseCurrency}
          onValueChange={(val) => setBaseCurrency(val)}
          style={{ backgroundColor: '#f9fafb', borderRadius: 12 }}
        >
          {CurrencyCodes.map((code) => {
            const curr = CURRENCIES[code];
            return <Picker.Item key={code} label={`${curr.code} - ${curr.name}`} value={code} />;
          })}
        </Picker>
      </View>

      <View
        style={{
          backgroundColor: 'white',
          borderRadius: 18,
          padding: 16,
          borderWidth: 1,
          borderColor: '#f3f4f6',
          marginBottom: 16,
          gap: 10,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="sparkles" size={18} color="#a855f7" />
          <Text style={{ fontWeight: '800', color: '#111827' }}>AI Model</Text>
        </View>
        <Picker
          selectedValue={aiModel}
          onValueChange={(val) => setAiModel(val)}
          style={{ backgroundColor: '#f9fafb', borderRadius: 12 }}
        >
          <Picker.Item label="Gemini 1.5 Flash" value="gemini-1.5-flash" />
          <Picker.Item label="Gemini 1.5 Flash 001 (compat)" value="gemini-1.5-flash-001" />
          <Picker.Item label="Gemini 2.0 Flash" value="gemini-2.0-flash" />
          <Picker.Item label="Gemini 2.5 Flash Lite" value="gemini-2.5-flash-lite" />
          <Picker.Item label="Gemini 1.5 Flash 8B (lite)" value="gemini-1.5-flash-8b" />
        </Picker>
        <Text style={{ fontSize: 12, color: '#6b7280' }}>
          Choose which Gemini model to call. OpenAI keys are auto-detected.
        </Text>
      </View>

      <View
        style={{
          backgroundColor: 'white',
          borderRadius: 18,
          padding: 16,
          borderWidth: 1,
          borderColor: '#f3f4f6',
          marginBottom: 16,
          gap: 10,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="key" size={18} color="#2563eb" />
            <Text style={{ fontWeight: '800', color: '#111827' }}>AI API Key</Text>
          </View>
          <Text style={{ fontSize: 12, fontWeight: '700', color: apiSaved ? '#16a34a' : '#dc2626' }}>
            {apiSaved ? 'Saved locally' : 'Missing'}
          </Text>
        </View>
        <TextInput
          value={apiKey}
          onChangeText={setApiKey}
          placeholder="Paste your AI API key"
          secureTextEntry
          autoCapitalize="none"
          style={{
            backgroundColor: '#f9fafb',
            borderWidth: 1,
            borderColor: '#e5e7eb',
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        />
        <TouchableOpacity
          onPress={handleSaveApiKey}
          style={{
            backgroundColor: '#2563eb',
            borderRadius: 12,
            paddingVertical: 12,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: 'white', fontWeight: '800' }}>Save API Key</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleRemoveApiKey}
          disabled={!apiSaved}
          style={{
            backgroundColor: apiSaved ? '#ef4444' : '#f3f4f6',
            borderRadius: 12,
            paddingVertical: 12,
            alignItems: 'center',
            marginTop: 8,
          }}
        >
          <Text style={{ color: apiSaved ? 'white' : '#9ca3af', fontWeight: '800' }}>Remove API Key</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 12, color: '#6b7280' }}>Stored securely on device using AsyncStorage.</Text>
      </View>

      <View
        style={{
          backgroundColor: 'white',
          borderRadius: 18,
          padding: 16,
          borderWidth: 1,
          borderColor: '#f3f4f6',
          marginBottom: 16,
          gap: 12,
        }}
      >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="swap-horizontal" size={18} color="#2563eb" />
            <Text style={{ fontWeight: '800', color: '#111827' }}>Exchange Rates</Text>
          </View>
          <TouchableOpacity
            onPress={handleFetch}
            style={{
              backgroundColor: '#2563eb',
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: 'white', fontWeight: '800', fontSize: 12 }}>Fetch latest</Text>
          </TouchableOpacity>
        <Text style={{ fontSize: 12, color: '#6b7280' }}>
          Set manual rates relative to the base currency. Leave blank to keep API values.
        </Text>
        <View style={{ gap: 10 }}>
          {currencyList.map((code) => {
            const curr = CURRENCIES[code];
            return (
              <View
                key={code}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  backgroundColor: '#f9fafb',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#e5e7eb',
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                }}
              >
                <View style={{ width: 80 }}>
                  <Text style={{ fontWeight: '800', color: '#111827' }}>{code}</Text>
                  <Text style={{ fontSize: 11, color: '#9ca3af' }}>{curr.name}</Text>
                </View>
                <TextInput
                  value={rates?.[code]?.toString() || ''}
                  onChangeText={(val) => {
                    const numeric = parseFloat(val);
                    setRates((prev) => ({
                      ...prev,
                      [code]: isNaN(numeric) ? undefined : numeric,
                    }));
                  }}
                  placeholder="rate"
                  keyboardType="numeric"
                  style={{
                    flex: 1,
                    backgroundColor: 'white',
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: '#e5e7eb',
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                  }}
                />
              </View>
            );
          })}
        </View>
      </View>

      <TouchableOpacity
        onPress={handleSave}
        style={{
          backgroundColor: '#16a34a',
          borderRadius: 14,
          paddingVertical: 14,
          alignItems: 'center',
          shadowColor: '#16a34a',
          shadowOpacity: 0.2,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 3 },
        }}
      >
        <Text style={{ color: 'white', fontWeight: '800' }}>Save Currency & Rates & AI Model</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default Settings;

