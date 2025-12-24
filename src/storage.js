import AsyncStorage from '@react-native-async-storage/async-storage';

export const DATA_KEY = 'spendwise_data';
export const API_KEY = 'spendwise_api_key';
export const AI_MODEL_KEY = 'spendwise_ai_model';

export const loadData = async (fallback) => {
  try {
    const saved = await AsyncStorage.getItem(DATA_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn('Failed to load saved data', e);
  }
  return fallback;
};

export const saveData = async (data) => {
  try {
    await AsyncStorage.setItem(DATA_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to store data', e);
  }
};

export const saveApiKey = async (key) => {
  try {
    await AsyncStorage.setItem(API_KEY, key);
  } catch (e) {
    console.warn('Failed to store API key', e);
  }
};

export const loadApiKey = async () => {
  try {
    return (await AsyncStorage.getItem(API_KEY)) || '';
  } catch (e) {
    console.warn('Failed to load API key', e);
    return '';
  }
};

export const removeApiKey = async () => {
  try {
    await AsyncStorage.removeItem(API_KEY);
  } catch (e) {
    console.warn('Failed to remove API key', e);
  }
};

export const saveAiModel = async (model) => {
  try {
    await AsyncStorage.setItem(AI_MODEL_KEY, model);
  } catch (e) {
    console.warn('Failed to store AI model', e);
  }
};

export const loadAiModel = async () => {
  try {
    return (await AsyncStorage.getItem(AI_MODEL_KEY)) || '';
  } catch (e) {
    console.warn('Failed to load AI model', e);
    return '';
  }
};

