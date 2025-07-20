import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

// ✅ Load environment variables
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/api/chat1", async (req, res) => {
  const { userMessage, history, isFirstTurn } = req.body;

  try {
    const { data, error } = await supabase
      .from("gems")
      .select("prompt")
      .eq("id", 1)
      .single();

    if (error || !data) {
      console.error("Error loading gem:", error);
      return res.status(500).json({ error: "Failed to load gem" });
    }

    const coachingPrompt = data.prompt;

    const mirrorPrompt = history.length > 0
      ? `Mirror the client's last message before responding.\n\nClient said: "${userMessage}".`
      : "";

    const systemPrompt = `
You are not a consultant or advisor. You do not give tips or suggestions.
You ask open, coaching-style questions—one at a time—to help the client reflect and gain clarity.
Only offer peer-reviewed neuroscience-based frameworks if the client has clearly set a goal and asks for help.

Close the session gently if the client signals they are done, affirming insights or goals if mentioned.

${coachingPrompt}
${mirrorPrompt}
    `.trim();

    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: userMessage },
      ],
      model: "gpt-4o",
    });

    const assistantMessage = completion.choices[0].message.content;

    await supabase.from("qa").insert([
      {
        user_message: userMessage,
        assistant_reply: assistantMessage,
        tag: await getTag(userMessage),
      },
    ]);

    res.json({ assistant: assistantMessage });
  } catch (err) {
    console.error("Error in /api/chat1:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

async function getTag(message) {
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `You are a conversation analyst. Return a single word or short phrase summarizing the user's psychological or behavioral theme. Examples: overwhelm, rumination, clarity, avoidance, decision fatigue, etc.`,
      },
      { role: "user", content: message },
    ],
    model: "gpt-4o",
  });

  return completion.choices[0].message.content.trim();
}

app.listen(10000, () => {
  console.log("✅ Server running on http://localhost:10000");
});
