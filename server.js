// Use the modern `import` syntax
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

// ==== Tagging Logic ====
function getTagFromMessage(message = '') {
  const msg = message.toLowerCase();
  if (msg.includes('overwhelm') || msg.includes('burnout') || msg.includes('too much')) return 'overwhelm';
  if (msg.includes('conflict') || msg.includes('pushback') || msg.includes('resistance')) return 'conflict';
  if (msg.includes('goal') || msg.includes('vision') || msg.includes('outcome')) return 'goal-setting';
  if (msg.includes('reset') || msg.includes('start over')) return 'reset-requested';
  return 'follow-up';
}

// ==== API Route ====
app.post('/api/chat', async (req, res) => {
  try {
    const { prompt, history } = req.body;

    if (!prompt || !history) {
      return res.status(400).json({ error: 'Prompt and history are required.' });
    }

    let messages = [];
    let tag = 'follow-up';
    let userMessage = '';

    if (history.length === 1 && history[0].role === 'user') {
      userMessage = history[0].content || 'EMPTY_FIRST';
      tag = 'first-turn';
      const initialPrompt = `System: Your new user has just started the session. Their opening message is: "${userMessage}". You must now begin the coaching process by asking your scripted first question as instructed in your rules.`;
      messages = [
        { role: 'system', content: initialPrompt },
        ...history,
      ];
    } else {
      const userMessages = history.filter(msg => msg.role === 'user' && msg.content?.trim());
      userMessage = userMessages.length > 0 ? userMessages[userMessages.length - 1].content : 'EMPTY_FOLLOWUP';
      tag = getTagFromMessage(userMessage);

      messages = [
        { role: 'system', content: prompt },
        ...history,
      ];
    }

    console.log('🟡 USER MESSAGE FOR TAGGI
