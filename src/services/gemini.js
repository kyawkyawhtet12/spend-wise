import { saveApiKey, loadApiKey, loadAiModel } from '../storage';

// Default Gemini model (updated to 2.5 Flash Lite)
const GEMINI_DEFAULT = 'gemini-2.5-flash-lite';
const OPENAI_MODEL = 'gpt-4o-mini';

// Throttling: Prevents calling the API more than once every 2 seconds
let isRequesting = false;
const MIN_GAP_MS = 2000;
let lastCallTime = 0;

/**
 * Builds the text prompt for the financial coach
 */
const buildPrompt = (data) => {
  const totalPlanned = data.budgets.reduce((sum, b) => sum + b.plannedAmount, 0);
  const totalSpent = data.transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return `
You are a concise, friendly financial coach.
Salary: $${data.salary}
Total Planned Budget: $${totalPlanned}
Total Actually Spent: $${totalSpent}

Budget Categories:
${data.budgets.map((b) => `- ${b.category}: $${b.plannedAmount}`).join('\n')}

Recent Transactions:
${data.transactions.slice(0, 5).map((t) => `- ${t.date}: $${t.amount} for ${t.note || t.category}`).join('\n')}

Provide 3 short bullet tips (max 2 sentences each) with actionable advice.
`.trim();
};

/**
 * Utility: Wait for X milliseconds (for backoff)
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Helper to extract text from Gemini response JSON
 */
const extractText = (json) =>
  json?.candidates?.[0]?.content?.parts?.[0]?.text ||
  json?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('\n');

/**
 * Fetch with timeout wrapper
 */
const fetchWithTimeout = (url, options, timeoutMs = 15000) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout after 15 seconds')), timeoutMs)
    ),
  ]);
};

/**
 * Robust Gemini API call with 429 handling and backoff
 */
const callGeminiWithRetry = async (prompt, apiKey, model, maxRetries = 3, systemMessage = null) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const contents = [];
      if (systemMessage) {
        // Gemini accepts role 'model' for system-style instructions
        contents.push({ role: 'model', parts: [{ text: systemMessage }] });
      }
      contents.push({ role: 'user', parts: [{ text: prompt }] });

      const response = await fetchWithTimeout(
        url,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents }),
        },
        15000 // 15 second timeout
      );

      const json = await response.json();

      // Handle Rate Limits (429) specifically
      if (response.status === 429) {
        console.warn(`Rate limit hit. Attempt ${attempt + 1} of ${maxRetries}. Retrying...`);
        // Exponential backoff: Wait 2s, then 4s, then 8s
        await sleep(Math.pow(2, attempt + 1) * 1000);
        continue; 
      }

      if (json.error) throw new Error(json.error.message);
      
      const text = extractText(json);
      if (text) return text;
      
    } catch (err) {
      if (attempt === maxRetries - 1) throw err;
      await sleep(1000); // Small wait before retry on network error
    }
  }
  return null;
};

/**
 * OpenAI call (for users with sk- keys)
 */
const callOpenAI = async (prompt, apiKey, systemMessage = null) => {
  const messages = systemMessage ? [{ role: 'system', content: systemMessage }, { role: 'user', content: prompt }] : [{ role: 'user', content: prompt }];

  const response = await fetchWithTimeout(
    'https://api.openai.com/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages,
        temperature: 0.4,
      }),
    },
    15000 // 15 second timeout
  );
  const json = await response.json();
  if (json.error) throw new Error(json.error.message);
  return json?.choices?.[0]?.message?.content;
};

/**
 * Save API key to storage
 */
export const persistApiKey = async (key) => {
  await saveApiKey(key);
};

/**
 * Main function to get financial insights
 */
export const getFinancialInsights = async (data, overrideKey, modelOverride) => {
  const apiKey = overrideKey || (await loadApiKey());
  if (!apiKey) return 'Add an AI API key to get insights.';

  // Prevent double-firing or "spamming" the API
  const now = Date.now();
  if (isRequesting || (now - lastCallTime < MIN_GAP_MS)) {
    return 'Processing... Please wait a second.';
  }

  isRequesting = true;
  lastCallTime = now;

  const prompt = buildPrompt(data);
  const isOpenAI = apiKey.toLowerCase().startsWith('sk-');

  try {
    let result;
    if (isOpenAI) {
      result = await callOpenAI(prompt, apiKey);
    } else {
      const model = modelOverride || (await loadAiModel()) || GEMINI_DEFAULT;
      result = await callGeminiWithRetry(prompt, apiKey, model);
    }

    return result || 'Keep tracking your expenses to see insights!';
  } catch (error) {
    console.error('AI request failed:', error.message);
    // Reset the flag on error to prevent getting stuck
    isRequesting = false;
    
    if (error.message.includes('timeout')) {
      return 'Request timed out. Please check your connection and try again.';
    }
    if (error.message.includes('quota') || error.message.includes('429')) {
      return 'Quota exceeded. Check your Google AI Studio plan or wait 60 seconds.';
    }
    if (error.message.includes('NOT_FOUND') || error.message.includes('404')) {
      return 'Model not found. Try changing the AI model in Settings.';
    }
    return `AI Error: ${error.message}`;
  } finally {
    isRequesting = false;
  }
};

// Short system instruction for chat usage
const SYSTEM_MESSAGE = `You are a concise, helpful personal finance assistant. Be mindful of the user's base currency and formatting. Provide short, actionable answers and ask clarifying questions if necessary.`;

/**
 * Build a contextual system prompt for chat using user data
 */
export const buildContextualPrompt = (data, userMessage) => {
  const context = buildPrompt(data);
  return {
    systemMessage: `Context:\n${context}`,
    userMessage,
  };
};

/**
 * Send a plain chat prompt (no contextual data)
 */
export const sendPrompt = async (text, overrideKey) => {
  const apiKey = overrideKey || (await loadApiKey());
  if (!apiKey) return 'Add an AI API key to use the assistant.';
  try {
    if (apiKey.toLowerCase().startsWith('sk-')) {
      return await callOpenAI(text, apiKey, SYSTEM_MESSAGE);
    } else {
      const model = (await loadAiModel()) || GEMINI_DEFAULT;
      return await callGeminiWithRetry(text, apiKey, model, 3, SYSTEM_MESSAGE);
    }
  } catch (err) {
    console.error('sendPrompt failed:', err);
    return `AI Error: ${err.message}`;
  }
};

/**
 * Send a chat prompt with contextual user data included as a system message
 */
export const sendContextualPrompt = async (data, userText, overrideKey) => {
  const apiKey = overrideKey || (await loadApiKey());
  if (!apiKey) return 'Add an AI API key to use the assistant.';

  const { systemMessage, userMessage } = buildContextualPrompt(data, userText);

  try {
    if (apiKey.toLowerCase().startsWith('sk-')) {
      return await callOpenAI(userMessage, apiKey, `${SYSTEM_MESSAGE}\n\n${systemMessage}`);
    } else {
      const model = (await loadAiModel()) || GEMINI_DEFAULT;
      return await callGeminiWithRetry(userMessage, apiKey, model, 3, `${SYSTEM_MESSAGE}\n\n${systemMessage}`);
    }
  } catch (err) {
    console.error('sendContextualPrompt failed:', err);
    return `AI Error: ${err.message}`;
  }
};
