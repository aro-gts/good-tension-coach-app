import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://zmehmjwIzahsvvrmtqel.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptZWhtandsemFoc3V2cm10cWVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MjA0NDUsImV4cCI6MjA2NjM5NjQ0NX0.BDvCG-WLrdJ6ZkTzG2TSrXJwaFz2Kom7jmt3o217ixE';
const supabase = createClient(supabaseUrl, supabaseKey);

let session_id = crypto.randomUUID();
let messages = [];

const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

// ✅ Fetch and display only the DESCRIPTION (not prompt)
async function showIntro() {
  const { data, error } = await supabase.from('gems').select('description').eq('id', 1).single();
  if (error || !data) {
    appendMessage('AI', 'Error loading coach description.');
    return;
  }
  appendMessage('AI', data.description);
}

function appendMessage(sender, text, tags = '') {
  const msg = document.createElement('div');
  msg.className = 'message';
  msg.innerHTML = `<strong>${sender}:</strong> ${text}`;
  if (tags) {
    const tagSpan = document.createElement('div');
    tagSpan.className = 'tags';
    tagSpan.textContent = `Tags: ${tags}`;
    msg.appendChild(tagSpan);
  }
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage() {
  const userText = userInput.value.trim();
  if (!userText) return;

  appendMessage('You', userText);
  messages.push({ role: 'user', content: userText });
  userInput.value = '';
  sendBtn.disabled = true;

  try {
    const res = await fetch('/api/chat1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, session_id }),
    });
    const data = await res.json();
    const aiText = data.response;
    const tags = data.tags || '';

    messages.push({ role: 'assistant', content: aiText });
    appendMessage('Coach', aiText, tags);
  } catch (err) {
    appendMessage('AI', 'Error communicating with server.');
  } finally {
    sendBtn.disabled = false;
  }
}

sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') sendMessage();
});

// ✅ Run intro on page load
showIntro();
