import express from 'express';
import path from 'path';
import { config } from 'dotenv';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// ==== Initialize API Keys ====
config();
const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(new URL(import.meta.url).pathname);

// ==== Initialize OpenAI ====
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ==== Initialize Supabase ====
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ==== Middleware ====
const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// ==== API Route ====
app.post('/api/chat', async (req, res) => {
  try {
    const { prompt, history, user_message } = req.body;

    if (!prompt || !history) {
      return res.status(400).json({ error: 'Prompt and history are required.' });
    }

    let userMessage = user_message || 'UNKNOWN';
    let messages = [];
    let tag = '';

    if (history.length === 1 && history[0].role === 'user') {
      // First user message
      tag = 'first-turn';
      const initialPrompt = `System: Your new user has just started the session. Their opening message is: "${userMessage}". You must now begin the coaching process by asking your scripted first question as instructed in your rules.`;

      messages = [
        { role: 'system', content: initialPrompt },
        ...history,
      ];
    } else {
      // Follow-up messages
      tag = 'follow-up';
      messages = [
        { role: 'system', content: prompt },
        ...history,
      ];
    }

    console.log('🟢 USER MESSAGE FOR TAGGING:', userMessage);
    console.log('🏷️ TAG SELECTED:', tag);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages,
    });

    const reply = completion.choices[0].message.content;

    await logConversationToSupabase({
      sessionId: 'anonymous',
      userMessage,
      aiResponse: reply,
      tags: tag,
    });

    res.json({ reply });
  } catch (error) {
    console.error('⚠️ Error:', error);
    res.status(500).json({ error: 'Failed to get response from AI.' });
  }
});

// ==== Supabase Logging Function ====
async function logConversationToSupabase({ sessionId, userMessage, aiResponse, tags = '' }) {
  try {
    const { error } = await supabase.from('QA').insert([
      {
        session_id: sessionId,
        user_message: userMessage,
        ai_response: aiResponse,
        tags: tags,
      },
    ]);
    if (error) throw error;
    console.log('✅ Logged to Supabase');
  } catch (err) {
    console.error('❌ Supabase log error:', err.message);
  }
}

// ==== Start the server ====
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
