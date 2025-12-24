import { CurrencyCodes } from '../types';

const FALLBACK_RATES = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 151.0,
  AUD: 1.52,
  CAD: 1.35,
  INR: 83.0,
  MMK: 2100,
};

export const fetchExchangeRates = async (base) => {
  try {
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${base}`);
    const data = await response.json();
    return data.rates;
  } catch (error) {
    console.warn('Failed to fetch rates, using fallback:', error);
    return FALLBACK_RATES;
  }
};

export const convertAmount = (amount, from, to, rates) => {
  if (from === to) return amount;
  if (!rates) return amount;
  const fromRate = rates[from] || 1;
  const toRate = rates[to] || 1;
  return (amount / fromRate) * toRate;
};

