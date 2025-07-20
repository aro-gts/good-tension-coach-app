import express from 'express';
import path from 'path';
import { config } from 'dotenv';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

config();
const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(new URL(import.meta.url).pathname);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.post('/api/chat', async (req, res) => {
  try {
    const { prompt, history, user_input } = req.body;

    if (!prompt || !history || !user_input) {
      return res.status(400).json({ error: 'Prompt, history, and user input are required.' });
    }

    let tag = '';
    let userMessage = user_input?.trim() || 'UNKNOWN';
    let messages = [];

    if (history.length === 1 && history[0].role === 'user') {
      tag = 'first-turn';
      messages = [
        {
          role: 'system',
          content: `System: Your new user has just started the session. Their opening message is: "${userMessage}". You must now begin the coaching process by asking your scripted first question as instructed in your rules.`,
        },
        ...history,
      ];
    } else {
      tag = 'follow-up';
      messages = [
        { role: 'system', content: prompt },
        ...history,
      ];
    }

    // 🧠 GPT-powered smart tagging
    const tagResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a tagger for an executive coach. Return 1–3 lowercase tags (comma-separated) that best describe the user's message below. Possible tags: overwhelm, goals, conflict, clarity, resistance, burnout, progress, motivation, alignment, values. Just return tags, nothing else.`,
        },
        { role: 'user', content: userMessage },
      ],
    });

    const smartTags = tagResponse.choices[0].message.content.trim();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages,
    });

    const reply = completion.choices[0].message.content;

    // ✅ Log to Supabase
    await logConversationToSupabase({
      sessionId: 'anonymous',
      userMessage,
      aiResponse: reply,
      tags: `${tag} | ${smartTags}`,
    });

    res.json({ reply });
  } catch (error) {
    console.error('⚠️ Error:', error);
    res.status(500).json({ error: 'Failed to get response from AI.' });
  }
});

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

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
