import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// ✅ Serve static files from the "public" folder
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Serve index.html on root GET
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// ✅ Supabase & OpenAI config
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ✅ Coaching endpoint
app.post('/api/chat1', async (req, res) => {
  try {
    const { messages, session_id } = req.body;
    const user_message = messages[messages.length - 1]?.content;
    const isFirstTurn = messages.length <= 2;

    // ✅ Load coaching prompt from Supabase (gem id 1)
    const { data, error } = await supabase.from('gems').select('prompt').eq('id', 1).single();
    if (error || !data) throw new Error('Failed to fetch coaching prompt from Supabase');
    const coachingPrompt = data.prompt;

    // ✅ Full system prompt with coaching guardrails
    const systemPrompt = `
You are not a consultant or advisor. You do not give tips or suggestions.
You are an expert executive coach. You ask open, coaching-style questions—one at a time—to help the client reflect and gain clarity.

Your absolute first response to the user, as a coach, is the following script:

${coachingPrompt}

Only after the first exchange, continue the conversation by asking one powerful coaching question at a time.
Do not give answers or advice. Only reflect and ask.
If the user identifies a clear goal or pattern, ask if they’d like to explore neuroscience-backed frameworks to support their reflection.
Close the session if the user signals they’re wrapping up.

Stay in coaching mode. Never switch to helper or advisor.
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature: 0.7,
    });

    const ai_response = response.choices[0].message.content;

    // ✅ Smart GPT tagging
    const tagResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a helpful tag generator. Return 2-4 comma-separated keywords that describe the user message’s key themes (e.g., burnout, clarity, conflict). Use lowercase single words only. Reply with just the keywords.`,
        },
        { role: 'user', content: user_message },
      ],
      temperature: 0.3,
    });

    const rawTags = tagResponse.choices[0].message.content || '';
    const cleanedTags = rawTags
      .replace(/\n/g, '')
      .replace(/tags:/i, '')
      .split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0)
      .join(', ');

    // ✅ Log to Supabase
    await supabase.from('QA').insert([
      {
        session_id,
        user_message,
        ai_response,
        tags: cleanedTags || 'untagged',
      },
    ]);

    res.json({ response: ai_response, tags: cleanedTags });
  } catch (err) {
    console.error('❌ Server error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});
