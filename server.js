import express from 'express';
import path from 'path';
import { config } from 'dotenv';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

config();
const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(new URL(import.meta.url).pathname);

// === Initialize OpenAI ===
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// === Initialize Supabase ===
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// === Express Setup ===
const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// === Coaching Prompt Enforcement ===
const coachingInstructions = `
You are not a consultant or advisor. You do not give tips or suggestions.
You ask open, coaching-style questions—one at a time—to help the client reflect and gain clarity.
`;

app.post('/api/chat1', async (req, res) => {
  try {
    const { prompt, history, user_input } = req.body;

    if (!prompt || !history || !user_input) {
      return res.status(400).json({ error: 'Prompt, history, and user input are required.' });
    }

    let userMessage = user_input.trim() || 'UNKNOWN';
    let tag = '';
    let messages = [];

    if (history.length === 0) {
      // First-turn
      tag = 'first-turn';
      messages = [
        {
          role: 'system',
          content: `${coachingInstructions}\n\nCoaching Script:\n${prompt}`,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ];
    } else {
      // Follow-up
      tag = 'follow-up';
      messages = [
        {
          role: 'system',
          content: `${coachingInstructions}\n\nCoaching Script:\n${prompt}`,
        },
        ...history,
        {
          role: 'user',
          content: userMessage,
        },
      ];
    }

    // === Smart Tagging via OpenAI ===
    const tagResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a tagger for an executive coach. Return 1–3 lowercase tags (comma-separated) that best describe the user's message below. Possible tags: overwhelm, goals, conflict, clarity, resistance, burnout, progress, motivation, alignment, values. Just return tags, nothing else.`,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    const smartTags = tagResponse.choices[0].message.content.trim();

    // === AI Coaching Reply ===
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
    });

    const assistantReply = completion.choices[0].message.content;

    // === Supabase Logging ===
    await logConversationToSupabase({
      sessionId: 'anonymous',
      userMessage,
      aiResponse: assistantReply,
      tags: `${tag} | ${smartTags}`,
    });

    res.json({ assistant: assistantReply });
  } catch (error) {
    console.error('⚠️ Server error:', error);
    res.status(500).json({ error: 'Failed to process coaching response.' });
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
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
