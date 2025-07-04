// Use the modern 'import' syntax
import express from 'express';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

// --- Initialize the App & AI ---
const app = express();
const PORT = process.env.PORT || 3000;
// A small fix to get the directory name when using ES modules
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

        // Initialize the model
        const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });

        // Combine the system prompt and the user's message into a single prompt
        const fullPrompt = `${prompt}\n\nUser: ${message}\nAI Coach:`;

        // Generate content using the simpler, direct method
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text();
        
        // Send the AI's reply back to the app
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
