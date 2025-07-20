// Import the Supabase client library from CDN
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// These are your project credentials
const supabaseUrl = 'https://zmehmjwlzahsuvrmtqel.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // ✅ Already obfuscated in your previous code

// Create and export Supabase client for auth.js and ai.js
export const supabase = createClient(supabaseUrl, supabaseKey);

// DOM references
const form = document.querySelector('#chat-form');
const input = document.querySelector('#user-input');
const chatContainer = document.getElementById('chat');
let history = [];

// System message (reminder to AI how to behave)
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
