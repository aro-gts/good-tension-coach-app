// Use the modern 'import' syntax
import express from 'express';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

// --- Initialize the App & AI ---
const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(new URL(import.meta.url).pathname);

// Initialize the AI with the secret key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

        const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
        const chat = model.startChat({
            history: [
                { role: "user", parts: [{ text: prompt }] },
                { role: "model", parts: [{ text: "Understood. I am ready to begin our coaching session." }] }
            ]
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();

        res.json({ reply: text });

    } catch (error) {
        console.error('AI Error:', error);
        res.status(500).json({ error: 'Failed to get response from AI.' });
    }
});

// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
