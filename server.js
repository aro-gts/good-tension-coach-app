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
        let messages;

        if (!prompt || !history) {
            return res.status(400).json({ error: 'Prompt and history are required.' });
        }

        // Check if this is the first message from the user
        if (history.length === 1 && history[0].role === 'user') {
            const userFirstMessage = history[0].content;
            // Create a special prompt for the first turn
            const initialPrompt = `${prompt}\n\nThe user has just started the session. Their opening message is: "${userFirstMessage}". You must now begin the coaching process by asking your scripted first question as instructed in your rules.`;
            messages = [
                { role: "system", content: initialPrompt }
            ];
        } else {
            // For all subsequent turns, use the normal structure
            messages = [
                { role: "system", content: prompt },
                ...history
            ];
        }

        // Send the request to OpenAI's Chat Completions API
        const completion = await openai.chat.completions.create({
            model: "gpt-4o", // Using OpenAI's most capable model for best instruction following
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
