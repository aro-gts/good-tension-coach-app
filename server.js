import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const app = express();
const port = process.env.PORT || 3000;

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());
app.use(express.json());

app.post('/api/chat1', async (req, res) => {
  try {
    const { message, history, isFirstTurn } = req.body;

    const { data, error } = await supabase
      .from('gems')
      .select('prompt')
      .eq('id', 1)
      .single();

    if (error) throw error;

    const coachingPrompt = data.prompt;
    const systemPrompt = `${coachingPrompt}\n\nYour core rules:\n- You are not a consultant or advisor.\n- You do not give tips or suggestions.\n- You ask open, coaching-style questions—one at a time—to help the client reflect and gain clarity.\n- You do not lead the client.\n- You mirror the client’s language to guide deeper reflection.\n- You offer peer-reviewed resources **only after the client identifies a goal or pattern**, and asks for help.\n- You initiate closure if the user indicates wrap-up.`;

    const chatHistory = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: message }
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: chatHistory,
    });

    const aiReply = completion.choices[0].message.content;

    const tagCompletion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an AI trained to generate a short, lowercase tag (1-4 words max) that categorizes the user message for logging purposes. Do not reply with anything else.' },
        { role: 'user', content: message }
      ]
    });

    const tag = tagCompletion.choices[0].message.content;

    await supabase.from('qa').insert({
      user_message: message,
      ai_reply: aiReply,
      tag: tag,
    });

    res.json({ reply: aiReply, tag });
  } catch (err) {
    console.error('Server error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});
