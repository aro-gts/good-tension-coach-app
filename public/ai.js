import { supabase } from './client.js';

// DOM Elements
const gemSelection = document.getElementById('gem-selection');
const chatWindow = document.getElementById('chat-window');
const chatForm = document.getElementById('chat-form');
const chatThread = document.getElementById('chat');
const userInput = document.getElementById('user-input');

let selectedCoach = null;

// List of available coaches
const coaches = [
  {
    id: 'muddle',
    name: 'Mind Over Muddle',
    description: 'Uncomplicating Your Leadership Brain'
  },
  {
    id: 'deepdive',
    name: 'Deep Dive Decisions',
    description: 'Get clarity on complex choices'
  }
];

// Smart tag detection (basic keyword match)
function getTagsFromMessage(text) {
  const tags = [];
  const lowered = text.toLowerCase();
  if (lowered.includes('overwhelm')) tags.push('overwhelm');
  if (lowered.includes('conflict')) tags.push('conflict');
  if (lowered.includes('goal') || lowered.includes('objectives')) tags.push('goals');
  if (lowered.includes('stuck') || lowered.includes('unclear')) tags.push('clarity');
  if (tags.length === 0) tags.push('follow-up'); // fallback
  return tags;
}

// Render coach buttons
function renderCoachButtons() {
  gemSelection.innerHTML = '<h3>Select a Coach</h3>';
  coaches.forEach(coach => {
    const button = document.createElement('button');
    button.textContent = `${coach.name} – ${coach.description}`;
    button.classList.add('coach-button');
    button.addEventListener('click', () => selectCoach(coach));
    gemSelection.appendChild(button);
  });
}

// Handle coach selection
function selectCoach(coach) {
  selectedCoach = coach;
  gemSelection.style.display = 'none';
  chatWindow.style.display = 'block';
  addMessage('ai', `This neuro-informed AI Executive Coach, *${coach.name}*, is thinking on where to begin to help…`);
}

// Render chat message
function addMessage(sender, text) {
  const message = document.createElement('div');
  message.className = `message ${sender}`;
  message.textContent = text;
  chatThread.appendChild(message);
  chatThread.scrollTop = chatThread.scrollHeight;
}

// Handle chat submission
chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = userInput.value.trim();
  if (!input) return;

  // Add user message
  addMessage('user', input);
  userInput.value = '';

  // Tag detection
  const tags = getTagsFromMessage(input);
  console.log('🔖 Tags:', tags);

  // Generate simple AI reply
  const aiResponse = `Thanks for sharing. Let's explore how we can address that. (Coach: ${selectedCoach?.name})`;
  addMessage('ai', aiResponse);

  // Log to Supabase
  const { error } = await supabase.from('qa').insert([
    {
      user_message: input,
      ai_response: aiResponse,
      tags: tags.join(', ')
    }
  ]);

  if (error) {
    console.error('❌ Error logging to Supabase:', error.message);
  } else {
    console.log('✅ Logged message to Supabase');
  }
});

// Init
renderCoachButtons();
