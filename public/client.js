import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.38.3/dist/esm/supabase.js";


export const supabase = createClient(
  "https://zmehmjwlzahsuvrmtqel.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
);

const chatWindow = document.getElementById('chat-window');
const chatForm = document.getElementById('chat-form');
const chatThread = document.getElementById('chat');
const userInput = document.getElementById('user-input');
const micButton = document.getElementById('mic-button');

let selectedGem = null;
let messageHistory = [];

async function loadGemPrompt() {
  const { data, error } = await supabase
    .from('gems')
    .select('*')
    .eq('id', 1)
    .single();

  if (error) {
    console.error('Error loading gem:', error.message);
    return;
  }

  selectedGem = data;

  const intro = document.createElement('div');
  intro.className = 'ai-message';

  // ✅ Only show description to user (not internal AI prompt)
  intro.innerText = `${data.description}\n\nWhat's on your mind?`;

  chatThread.appendChild(intro);
  chatWindow.style.display = 'block';
}

async function sendMessageToAI(userMessage) {
  const prompt = selectedGem?.prompt || '';
  const payload = {
    prompt,
    user_input: userMessage,
    history: messageHistory
  };

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error('AI Error: ' + err);
  }

  const { reply } = await response.json();
  return reply;
}

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const message = userInput.value.trim();
  if (!message) return;

  const userDiv = document.createElement('div');
  userDiv.className = 'user-message';
  userDiv.innerText = message;
  chatThread.appendChild(userDiv);

  userInput.value = '';
  userInput.disabled = true;

  try {
    const aiReply = await sendMessageToAI(message);

    messageHistory.push({ role: 'user', content: message });
    messageHistory.push({ role: 'assistant', content: aiReply });

    const aiDiv = document.createElement('div');
    aiDiv.className = 'ai-message';
    aiDiv.innerText = aiReply;
    chatThread.appendChild(aiDiv);
  } catch (err) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'ai-message';
    errorDiv.innerText = 'Something went wrong. Please try again.';
    chatThread.appendChild(errorDiv);
    console.error(err);
  }

  userInput.disabled = false;
});

loadGemPrompt();
