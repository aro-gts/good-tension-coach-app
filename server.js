// === Imports ===
import express from 'express';
import path from 'path';
import { config } from 'dotenv';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// === Setup ===
config();
const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(new URL(import.meta.url).pathname);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// === Middleware ===
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// === Helper: Tagging Logic ===
function getTagForMessage(message) {
  const text = message.toLowerCase();

  if (text.includes('overwhelm') || text.includes('too much')) return 'overwhelm';
  if (text.includes('conflict') || text.includes('pushback') || text.includes('tension')) return 'conflict';
  if (text.includes('goal') || text.includes('priority') || text.includes('focus')) return 'goal-setting';
  if (text.includes('reset') || text.includes('start over')) return 'reset';
  if (!text || text === 'empty_followup') return 'follow-up';

  return 'follow-up';
}

// === Helper: Supabase Logging ===
async function logConversation({ sessionId, userMessage, aiResponse, tag }) {
  try {
    const { error } = await supabase.from('QA').insert([
      {
        session_id: sessionId,
        user_message: userMessage,
        ai_response: aiResponse,
        tags: tag,
      },
    ]);
    if (error) throw error;
    console.log('✅ Logged to Supabase');
  } catch (err) {
    console.error('❌ Supabase log error:', err.message);
  }
}

// === API Route ===
app.post('/api/chat', async (req, res) => {
  try {
    const { prompt, history } = req.body;
    if (!prompt || !history) {
      return res.status(400).json({ error: 'Prompt and history are required.' });
    }

    // Determine message context
    const isFirstTurn = history.length === 1 && history[0].role === 'user';
    const userMessage = isFirstTurn
      ? history[0].content
      : (history.slice().reverse().find(m => m.role === 'user')?.content || 'EMPTY_FOLLOWUP');

    const messages = isFirstTurn
      ? [{ role: 'system', content: `System: User just started a session. Opening message: "${userMessage}". Begin coaching.` }, ...history]
      : [{ role: 'system', content: prompt }, ...history];

    // Generate AI response
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
    });
    const reply = completion.choices[0].message.content;

    // Tag logic
    const tag = isFirstTurn ? 'first-turn' : getTagForMessage(userMessage);
    console.log('🟡 USER MESSAGE FOR TAGGING:', userMessage);
    console.log('🟢 TAG SELECTED:', tag);

    // Log to Supabase
    await logConversation({
      sessionId: 'anonymous',
      userMessage,
      aiResponse: reply,
      tag,
    });

    res.json({ reply });
  } catch (error) {
    console.error('⚠️ AI Error:', error);
    res.status(500).json({ error: 'Failed to get response from AI.' });
  }
});

// === Start Server ===
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
