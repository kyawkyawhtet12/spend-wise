import React from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarChart } from 'react-native-chart-kit';
import { CURRENCIES } from '../types';

const screenWidth = Dimensions.get('window').width - 32;

const Analytics = ({ data }) => {
  const insets = useSafeAreaInsets();
  const categoryTotals = data.transactions.reduce((acc, t) => {
    if (t.type === 'income') return acc;
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});

  const labels = Object.keys(categoryTotals);
  const values = labels.map((l) => categoryTotals[l]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#f2f2f7' }}
      contentContainerStyle={{
        padding: 16,
        paddingTop: 12 + insets.top,
        paddingBottom: 32 + insets.bottom,
      }}
    >
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: '#111' }}>Analytics</Text>
        <Text style={{ color: '#6b7280', fontWeight: '600' }}>Spending by category</Text>
      </View>

      {labels.length === 0 ? (
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
          <Text style={{ color: '#9ca3af', fontStyle: 'italic' }}>Add transactions to see charts.</Text>
        </View>
      ) : (
        <View
          style={{
            backgroundColor: 'white',
            borderRadius: 18,
            padding: 12,
            borderWidth: 1,
            borderColor: '#f3f4f6',
          }}
        >
          <BarChart
            data={{
              labels,
              datasets: [{ data: values }],
            }}
            width={screenWidth}
            height={260}
            fromZero
            chartConfig={{
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`,
              barPercentage: 0.6,
            }}
            style={{ borderRadius: 16 }}
          />
          <Text style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>
            Base currency: {data.baseCurrency} ({CURRENCIES[data.baseCurrency].symbol})
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

export default Analytics;

