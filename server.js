import express from 'express';
import { config } from 'dotenv';
import OpenAI from 'openai';
import bodyParser from 'body-parser';
import cors from 'cors';
import pkg from '@supabase/supabase-js';

config();
const app = express();
const port = process.env.PORT || 10000;
app.use(cors());
app.use(bodyParser.json());

const supabase = pkg.createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function fetchPrompt() {
  const { data, error } = await supabase.from('gems').select('prompt').eq('id', 1).single();
  return data?.prompt || "You are a helpful coach.";
}

async function generateTags(message) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: 'Return 2-4 lowercase comma-separated tags describing the main emotional or cognitive themes in the user message. No explanations.' },
      { role: 'user', content: message }
    ],
    temperature: 0.3
  });
  return response.choices[0].message.content;
}

app.post('/api/chat1', async (req, res) => {
  const { user_message, session_id, isFirstTurn } = req.body;
  const prompt = await fetchPrompt();
  const tags = await generateTags(user_message);

  const systemPrompt = `${prompt}

You are not a consultant. You ask one open-ended coaching question at a time to help the client reflect.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: user_message }
    ],
    temperature: 0.7
  });

  const ai_response = completion.choices[0].message.content;

  await supabase.from('QA').insert([
    { session_id, user_message, ai_response, tags, turn_type: isFirstTurn ? "first" : "followup" }
  ]);

  res.json({ ai_response });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
