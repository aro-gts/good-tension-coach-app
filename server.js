// Use the modern 'import' syntax
import express from 'express';
import path from 'path';
import OpenAI from 'openai';

// --- Initialize the App & AI ---
const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(new URL(import.meta.url).pathname);

// Initialize the OpenAI client with the secret key from Render
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// --- Middleware ---
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// --- API Route for Chat ---
app.post('/api/chat', async (req, res) => {
    try {
        const { prompt, history } = req.body;

        if (!prompt || !history) {
            return res.status(400).json({ error: 'Prompt and history are required.' });
        }

        // Construct the messages array with priming messages
        const messages = [
            { role: "system", content: prompt },
            { role: "user", content: "Let's begin." },
            { role: "assistant", content: "Understood. I am ready to begin the coaching session. I will now ask my first question." },
            ...history
        ];

        // Send the request to OpenAI's Chat Completions API
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: messages,
        });

        const reply = completion.choices[0].message.content;
        
        res.json({ reply: reply });

    } catch (error) {
        console.error('AI Error:', error);
        res.status(500).json({ error: 'Failed to get response from AI.' });
    }
});

// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
