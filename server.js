// --- Import Required Libraries ---
const express = require('express');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- Initialize the App & AI ---
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize the AI with the secret key from Render's environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- Middleware ---
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); // This allows our server to read JSON from requests

// --- API Route for Chat ---
// This is the new endpoint our app will send messages to
app.post('/api/chat', async (req, res) => {
    try {
        // Get the full prompt and the user's message from the request
        const { prompt, message } = req.body;

        if (!prompt || !message) {
            return res.status(400).json({ error: 'Prompt and message are required.' });
        }

        // Start the AI model
        const model = genAI.getGenerativeModel({ model: "gemini-pro"});

        // Create a chat session with the Gem's prompt as the history
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: prompt }],
                },
                {
                    role: "model",
                    parts: [{ text: "Understood. I am ready to begin our coaching session." }],
                }
            ],
        });

        const result = await chat.sendMessage(message);
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
