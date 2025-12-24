import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { loadApiKey } from '../storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { sendPrompt, sendContextualPrompt } from '../services/gemini';

const AiChat = ({ data }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [includeContext, setIncludeContext] = useState(true);
  const [typing, setTyping] = useState(false);
  const insets = useSafeAreaInsets();
  const scrollRef = useRef();
  const isFocused = useIsFocused();
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [contentHeight, setContentHeight] = useState(0);
  const [layoutHeight, setLayoutHeight] = useState(0);

  const handleSend = async () => {
    if (!input) return;

    // Verify API key exists before sending to avoid silent errors
    try {
      const key = await loadApiKey();
      if (!key) {
        Alert.alert('AI key missing', 'Add your AI API key in Settings to use the assistant.');
        return;
      }
    } catch (e) {
      // proceed; loadApiKey may fail only in rare cases
    }

    const userMsg = { id: Date.now().toString(), role: 'user', text: input };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    try {
      setTyping(true);
      const resp = includeContext && data ? await sendContextualPrompt(data, input) : await sendPrompt(input);

      if (typeof resp === 'string' && resp.startsWith('AI Error:')) {
        // Show clearer alert and also display assistant message
        const errText = resp.replace(/^AI Error:\s*/i, '');
        Alert.alert('AI Error', errText);
      }

      const assistantMsg = { id: (Date.now() + 1).toString(), role: 'assistant', text: resp || 'No response' };
      setMessages((m) => [...m, assistantMsg]);
      // Only scroll if the user was at the bottom already
      if (isAtBottom) setTimeout(() => scrollToBottom(true), 120);
    } catch (err) {
      const errText = err?.message || 'Error contacting AI.';
      Alert.alert('AI Error', errText);
      const errorMsg = { id: (Date.now() + 2).toString(), role: 'assistant', text: 'Error contacting AI.' };
      setMessages((m) => [...m, errorMsg]);
    } finally {
      setTyping(false);
    }
  };

  const scrollToBottom = useCallback((animated = true) => {
    if (!scrollRef.current) return;
    try {
      // Compute a precise y so the last message sits above keyboard (if any)
      const visibleHeight = Math.max(0, layoutHeight - keyboardHeight);
      const y = Math.max(0, contentHeight - visibleHeight);
      scrollRef.current.scrollTo({ y, animated });
      // Retry after layout settles
      setTimeout(() => scrollRef.current?.scrollTo({ y, animated }), 120);
      setTimeout(() => scrollRef.current?.scrollTo({ y, animated }), 300);
    } catch (e) {
      // no-op
    }
  }, [contentHeight, layoutHeight, keyboardHeight]);

  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      const height = e?.endCoordinates?.height || 0;
      setKeyboardHeight(height);
      // Do NOT auto-scroll here to avoid layout jumps; padding accounts for keyboard space
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
      // Do not auto-scroll on hide
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [scrollToBottom]);

  // Auto-scroll when messages change
  useEffect(() => {
    // Auto-scroll new messages only when user is at (or near) the bottom
    if (messages.length && isAtBottom) scrollToBottom(true);
  }, [messages.length, scrollToBottom, isAtBottom]);

  // When screen focused, ensure we show the latest messages
  useEffect(() => {
    // When screen focused, ensure we show the latest messages only if user is at bottom
    if (isFocused && isAtBottom) setTimeout(() => scrollToBottom(true), 120);
  }, [isFocused, scrollToBottom, isAtBottom]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={insets.bottom + 6}>
      <View style={{ flex: 1, backgroundColor: '#f2f2f7', paddingTop: insets.top }}>
        <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: '#111' }}>Assistant</Text>
        <Text style={{ color: '#6b7280', fontWeight: '600' }}>Chat with the AI assistant</Text>
        <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            onPress={() => setIncludeContext((v) => !v)}
            style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: includeContext ? '#bbf7d0' : '#e5e7eb', backgroundColor: includeContext ? '#ecfdf3' : 'transparent' }}
          >
            <Text style={{ color: includeContext ? '#16a34a' : '#111827', fontWeight: '700' }}>{includeContext ? 'Context: ON' : 'Context: OFF'}</Text>
          </TouchableOpacity>
          <Text style={{ color: '#9ca3af', fontSize: 12 }}>Include account data in messages</Text>
        </View>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 16 }}>
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          keyboardShouldPersistTaps={'handled'}
          onScroll={(e) => {
            const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
            const distanceFromBottom = contentSize.height - (layoutMeasurement.height + contentOffset.y);
            setIsAtBottom(distanceFromBottom < 40);
          }}
          onContentSizeChange={(_, h) => {
            setContentHeight(h);
            // if user is at bottom, keep them at bottom after content changes
            if (isAtBottom) setTimeout(() => scrollToBottom(true), 80);
          }}
          onLayout={(e) => setLayoutHeight(e.nativeEvent.layout.height)}
          scrollEventThrottle={100}
          contentContainerStyle={{ paddingBottom: keyboardHeight ? keyboardHeight + 20 : 24 }}
        >
          {messages.length === 0 ? (
            <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#f3f4f6' }}>
              <Text style={{ color: '#9ca3af' }}>Start a conversation — ask about budgets, income, or your transactions.</Text>
            </View>
          ) : (
            messages.map((m) => (
              <View key={m.id} style={{ marginBottom: 12, alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                <View style={{ backgroundColor: m.role === 'user' ? '#2563eb' : 'white', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' }}>
                  <Text style={{ color: m.role === 'user' ? 'white' : '#111827' }}>{m.text}</Text>
                </View>
                <Text style={{ fontSize: 10, color: '#9ca3af', marginTop: 6 }}>{m.role}</Text>
              </View>
            ))
          )}

          {typing && (
            <View style={{ alignItems: 'flex-start', marginTop: 6 }}>
              <View style={{ backgroundColor: 'white', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator size='small' color='#111827' />
                  <Text style={{ color: '#111827' }}>Assistant is typing...</Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 12 }}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask something..."
            // avoid immediate scroll on focus to prevent double layout jumps
            blurOnSubmit={false}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            style={{ flex: 1, backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#e5e7eb' }}
          />
          <TouchableOpacity onPress={handleSend} style={{ backgroundColor: '#2563eb', paddingHorizontal: 12, paddingVertical: 12, borderRadius: 12 }}>
            <Ionicons name="send" size={18} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </KeyboardAvoidingView>
  );
};

export default AiChat;
