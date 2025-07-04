// Use the modern 'import' syntax
import express from 'express';
import path from 'path';
import OpenAI from 'openai';

// --- Initialize the App & AI ---
const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(new URL(import.meta.url).pathname);

// Initialize the OpenAI client with the secret key
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// --- Middleware ---
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// --- API Route for Chat ---
app.post('/api/chat', async (req, res) => {
    try {
        const { prompt, message } = req.body;

        if (!prompt || !message) {
            return res.status(400).json({ error: 'Prompt and message are required.' });
        }

        // Send the request to OpenAI's Chat Completions API
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo", // A powerful and cost-effective model
            messages: [
                { role: "system", content: prompt }, // The Gem's instructions
                { role: "user", content: message }   // The user's message
            ],
        });

        const reply = completion.choices[0].message.content;
        
        // Send the AI's reply back to the app
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
