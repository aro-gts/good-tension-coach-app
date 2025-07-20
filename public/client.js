// ✅ Supabase Client Setup (ESM-compatible)
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Replace with your actual Supabase project URL and anon key
const supabaseUrl = 'https://zmehmjwlzahsuvrmtqel.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptZWhtandsemFoc3V2cm10cWVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MjA0NDUsImV4cCI6MjA2NjM5NjQ0NX0.BDvCG-WLrdJ6ZkTzG2TSrXJwaFz2Kom7jmt3o217ixE';
export const supabase = createClient(supabaseUrl, supabaseKey);

// ✅ Chat Logic
const form = document.querySelector('#chat-form');
const input = document.querySelector('#user-input');
const chatContainer = document.getElementById('chat');
let history = [];

// System prompt that defines the AI's behavior
const systemPrompt = "This neuro-informed AI Executive Coach helps users explore tensions, clarify goals, and engage in thoughtful reflection through one question at a time. Always respond as a coach, not a consultant.";

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const userMessage = input.value.trim();
  if (!userMessage) return;

  addMessageToChat('user', userMessage);
  input.value = '';

  try {
    const { aiReply, newHistory } = await sendMessageToAI(userMessage, history);
    history = newHistory;
    addMessageToChat('assistant', aiReply);
  } catch (err) {
    console.error('❌ Error from AI:', err);
    addMessageToChat('error', 'Sorry, something went wrong.');
  }
});

async function sendMessageToAI(userInput, history) {
  const payload = {
    prompt: systemPrompt,
    history: [...history, { role: 'user', content: userInput }],
  };

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'AI call failed');

  return {
    aiReply: data.reply,
    newHistory: [...payload.history, { role: 'assistant', content: data.reply }],
  };
}

function addMessageToChat(role, content) {
  const bubble = document.createElement('div');
  bubble.className = `bubble ${role}`;
  bubble.textContent = content;
  chatContainer.appendChild(bubble);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}
