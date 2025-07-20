import { supabase } from './client.js';

const form = document.querySelector('#chat-form');
const input = document.querySelector('#user-input');
const chatContainer = document.getElementById('chat');
let history = [];

const systemPrompt = `
You are a neuro-informed AI Executive Coach. You help users explore tensions, clarify goals, and reflect — always through a coaching mindset.
Ask one powerful question at a time. Do not give advice. Never list multiple questions.
`;

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
  const user = await supabase.auth.getUser();
  const sessionId = user.data?.user?.id || 'anonymous';

  const payload = {
    prompt: systemPrompt,
    history: [...history, { role: 'user', content: userInput }],
    sessionId,
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
