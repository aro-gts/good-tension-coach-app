import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

dotenv.config();
const app = express();
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const COACH_ID = 1;
const GUARDRAIL = `You are not a consultant or advisor. You do not give tips or suggestions.
You ask open, coaching-style questions—one at a time—to help the client reflect and gain clarity.
Only offer peer-reviewed neuroscience-based resources *if the client has identified a goal and requests it.*`;

app.post("/api/chat1", async (req, res) => {
  const { messages } = req.body;
  try {
    const { data: coach } = await supabase.from("gems").select("prompt").eq("id", COACH_ID).single();
    const systemPrompt = `${coach.prompt}

${GUARDRAIL}`;

    const chat = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
    });

    const reply = chat.choices[0].message.content;
    await supabase.from("qa").insert({ messages, reply });
    res.json({ reply });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Chat failed." });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
