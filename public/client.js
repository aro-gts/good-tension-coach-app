const form = document.querySelector('form');
const input = document.querySelector('input');
const chatContainer = document.getElementById('chat');
let history = [];

// SYSTEM DESCRIPTION SENT ON EVERY MESSAGE
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
    body: JSON.stringify({ ...payload, user_message: userInput }), // ✅ Pass real input
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
