import { supabase } from './client.js';

const gemSelection = document.getElementById('gem-selection');
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
    .eq('id', 1) // Only load "Mind Over Muddle"
    .single();

  if (error) {
    console.error('Error loading gem:', error.message);
    return;
  }

  selectedGem = data;

  const intro = document.createElement('div');
  intro.className = 'ai-message';
  intro.innerText = `${data.description}\n\n${data.prompt}\n\nWhat's on your mind?`;

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

  const response = await fetch('/api/chat1', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error('AI Error: ' + err);
  }

  const { assistant } = await response.json();
  return assistant;
}

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const message = userInput.value.trim();
  if (!message) return;

  // Display user message
  const userDiv = document.createElement('div');
  userDiv.className = 'user-message';
  userDiv.innerText = message;
  chatThread.appendChild(userDiv);

  userInput.value = '';
  userInput.disabled = true;

  try {
    const aiReply = await sendMessageToAI(message);

    // Track message history
    messageHistory.push({ role: 'user', content: message });
    messageHistory.push({ role: 'assistant', content: aiReply });

    // Display AI reply
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

// Initialize chat
loadGemPrompt();
