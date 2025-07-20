import { supabase } from './client.js';

// DOM elements
const gemSelection = document.getElementById('gem-selection');
const chatWindow = document.getElementById('chat-window');
const chatForm = document.getElementById('chat-form');
const chatThread = document.getElementById('chat');
const userInput = document.getElementById('user-input');

let selectedCoach = null;

// Coach setup — only free one shown
const coaches = [
  {
    id: 'muddle',
    name: 'Mind Over Muddle',
    description: 'Uncomplicating Your Leadership Brain',
    greeting: `This neuro-informed AI Executive Coach helps you gain clarity and traction by untangling overwhelm, surfacing goals, and reconnecting to purpose. What's on your mind?`
  }
];

// Render coach buttons (only freemium coach)
coaches.forEach(coach => {
  const button = document.createElement('button');
  button.textContent = `${coach.name} – ${coach.description}`;
  button.classList.add('coach-button');
  button.addEventListener('click', () => {
    selectedCoach = coach;
    gemSelection.style.display = 'none';
    chatWindow.style.display = 'block';
    addMessage('assistant', coach.greeting);
  });
  gemSelection.appendChild(button);
});

// Send chat message
chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = userInput.value.trim();
  if (!text) return;

  addMessage('user', text);
  userInput.value = '';

  const tags = getTagsFromMessage(text);

  const response = await fetch('/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: text,
      coach: selectedCoach?.id || 'unknown'
    })
  });

  const data = await response.json();
  const aiText = data.message || "Hmm, I'm still thinking...";
  addMessage('assistant', aiText);

  await supabase.from('QA').insert([
    {
      user_message: text,
      ai_response: aiText,
      tags: tags.join(', '),
    }
  ]);
});

// Add message to thread
function addMessage(sender, text) {
  const messageEl = document.createElement('div');
  messageEl.classList.add('message', sender);
  messageEl.textContent = text;
  chatThread.appendChild(messageEl);
  chatThread.scrollTop = chatThread.scrollHeight;
}

// Smart tag detection (basic keyword match)
function getTagsFromMessage(text) {
  const lowered = text.toLowerCase();
  const tags = [];

  if (lowered.includes('overwhelm')) tags.push('overwhelm');
  if (lowered.includes('conflict')) tags.push('conflict');
  if (lowered.includes('goal') || lowered.includes('objectives')) tags.push('goals');
  if (lowered.includes('stuck')) tags.push('stuck');
  if (lowered.includes('reset')) tags.push('reset');
  if (lowered.includes('decision')) tags.push('decisions');
  if (lowered.includes('team')) tags.push('team');

  return tags;
}
