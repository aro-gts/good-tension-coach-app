import express from 'express';
import path from 'path';
import { config } from 'dotenv';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';

config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Coaching logic route
app.post('/api/chat1', async (req, res) => {
  try {
    const { user_input, history } = req.body;

    if (!user_input || !history) {
      return res.status(400).json({ error: 'Missing user input or history.' });
    }

    const userMessage = user_input.trim() || 'UNKNOWN';

    // ⛏️ Get the coaching use_case prompt from Supabase (gem ID 1)
    const { data: gem, error: gemError } = await supabase
      .from('gems')
      .select('use_case')
      .eq('id', 1)
      .single();

    if (gemError) {
      console.error('Supabase error:', gemError.message);
      return res.status(500).json({ error: 'Failed to load coaching prompt.' });
    }

    const systemPrompt = gem.use_case;
    const isFirstTurn = history.length === 1 && history[0].role === 'user';

    const messages = isFirstTurn
      ? [
          {
            role: 'system',
            content: `You are a professional AI executive coach. Begin the coaching dialogue using this structured script:\n\n${systemPrompt}\n\nOnly ask one open-ended coaching question to begin.`,
          },
          ...history,
        ]
      : [
          { role: 'system', content: systemPrompt },
          ...history,
        ];

    // 🧠 GPT smart tagging
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
    const tag = isFirstTurn ? 'first-turn' : 'follow-up';

    // 🧠 GPT generates coaching-style reply
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
    });

    const reply = completion.choices[0].message.content;

    // ✅ Log to Supabase QA table
    await supabase.from('QA').insert([
      {
        session_id: 'anonymous',
        user_message: userMessage,
        ai_response: reply,
        tags: `${tag} | ${smartTags}`,
      },
    ]);

    res.json({ assistant: reply });
  } catch (err) {
    console.error('❌ Server error:', err.message);
    res.status(500).json({ error: 'Failed to get AI response.' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
