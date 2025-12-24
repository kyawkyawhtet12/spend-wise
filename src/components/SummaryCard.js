import React from 'react';
import { View, Text } from 'react-native';

const SummaryCard = ({ label, amount, color = '#111', icon }) => (
  <View
    style={{
      backgroundColor: 'white',
      borderRadius: 16,
      padding: 12,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      borderWidth: 1,
      borderColor: '#f3f4f6',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    }}
  >
    {icon}
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: '700' }}>{label}</Text>
      <Text style={{ fontSize: 20, fontWeight: '800', color }}>{amount.toLocaleString()}</Text>
    </View>
  </View>
);

export default SummaryCard;

