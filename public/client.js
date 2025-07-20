const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatContainer = document.getElementById('chat');
let history = [];

// SYSTEM DESCRIPTION SENT ON EVERY MESSAGE
const systemPrompt = "This neuro-informed AI Executive Coach helps users explore tensions, clarify goals, and engage in thoughtful reflection through one question at a time. Always respond as a coach, not a consultant.";

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const userInput = input.value.trim();
  if (!userInput) return;

  addMessageToChat('user', userInput);
  input.value = '';

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: systemPrompt,
        history: [...history, { role: 'user', content: userInput }],
        user_input: userInput
      }),
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error || 'AI call failed');

    const aiReply = data.reply;
    history.push({ role: 'user', content: userInput });
    history.push({ role: 'assistant', content: aiReply });

    addMessageToChat('assistant', aiReply);
  } catch (err) {
    console.error('❌ Error from AI:', err);
    addMessageToChat('error', 'Sorry, something went wrong.');
  }
});

function addMessageToChat(role, content) {
  const bubble = document.createElement('div');
  bubble.className = `bubble ${role}`;
  bubble.textContent = content;
  chatContainer.appendChild(bubble);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}
