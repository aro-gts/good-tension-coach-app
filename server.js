import express from 'express';
import path from 'path';
import { config } from 'dotenv';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// ==== Load .env variables ====
config();
const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(new URL(import.meta.url).pathname);

// ==== OpenAI ====
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ==== Supabase ====
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ==== Express App ====
const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// ==== Main Chat Endpoint ====
app.post('/api/chat', async (req, res) => {
  try {
    const { prompt, history } = req.body;

    if (!prompt || !history) {
      return res.status(400).json({ error: 'Prompt and history are required.' });
    }

    const historyCopy = [...history];
    const latestUserMessage = [...historyCopy].reverse().find(m => m.role === 'user');
    const userMessage = latestUserMessage?.content || 'UNKNOWN';

    const messages = [
      { role: 'system', content: prompt },
      ...historyCopy,
    ];

    // 🧠 Ask GPT to classify user message into a smart tag
    const tagClassifier = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: "You are a classification assistant. Return one lowercase tag that best fits the user's message. Choose from: overwhelm, conflict, goals, clarity, feedback, motivation, reflection, unknown.",
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      max_tokens: 10,
    });

    const tag = tagClassifier.choices[0].message.content.trim().toLowerCase();

    // 🤖 Get assistant response
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
    });

    const reply = completion.choices[0].message.content;

    // ✅ Log to Supabase
    await logConversationToSupabase({
      sessionId: 'anonymous',
      userMessage,
      aiResponse: reply,
      tags: tag,
    });

    res.json({ reply });
  } catch (error) {
    console.error('⚠️ Chat error:', error);
    res.status(500).json({ error: 'Failed to get response from AI.' });
  }
});

// ==== Supabase Logger ====
async function logConversationToSupabase({ sessionId, userMessage, aiResponse, tags }) {
  try {
    const { error } = await supabase.from('QA').insert([
      {
        session_id: sessionId,
        user_message: userMessage,
        ai_response: aiResponse,
        tags,
      },
    ]);
    if (error) throw error;
    console.log('✅ Logged to Supabase');
  } catch (err) {
    console.error('❌ Supabase log error:', err.message);
  }
}

// ==== Start Server ====
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
