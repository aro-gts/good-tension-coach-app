// Use the modern `import` syntax
import express from 'express';
import path from 'path';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// === Initialize App ===
const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(new URL(import.meta.url).pathname);

// Initialize the OpenAI client with the secret key from Render
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// === Middleware ===
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// === API Route for chat ===
app.post('/api/chat', async (req, res) => {
  try {
    const { prompt, history } = req.body;

    if (!prompt || !history) {
      return res.status(400).json({ error: 'Prompt and history are required.' });
    }

    // Check if this is the first message from the user
    let messages;
    if (history.length === 1 && history[0].role === 'user') {
      const userFirstMessage = history[0].content;
      const initialPrompt = `SocraticGPT\n\nThe user has just started the session. Their opening message is: "${userFirstMessage}". You must now begin the coaching process by asking your scripted first question as instructed in your rules.`;

      messages = [
        { role: 'system', content: initialPrompt },
        ...history,
      ];
    } else {
      messages = [
        { role: 'system', content: prompt },
        ...history,
      ];
    }

    // Send the request to OpenAI's Chat Completions API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
    });

    const reply = completion.choices[0].message.content;

    // === Insert into Supabase ===
    await supabase.from('conversations').insert([
      {
        session_id: req.body.session_id || Date.now().toString(),
        user_message: history[history.length - 1].content,
        ai_response: reply,
      },
    ]);

    res.json({ reply });

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: 'Failed to get response from AI.' });
  }
});

// === Start the Server ===
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
