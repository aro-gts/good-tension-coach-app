
import './auth.js';
import { logMessage } from './ai.js';

window.addEventListener('DOMContentLoaded', async () => {
  const chatContainer = document.getElementById('chat-container');
  const sendBtn = document.getElementById('send-button');
  const userInput = document.getElementById('user-input');

  if (sendBtn && userInput && chatContainer) {
    sendBtn.addEventListener('click', async () => {
      const message = userInput.value.trim();
      if (!message) return;
      userInput.value = '';
      const userDiv = document.createElement('div');
      userDiv.className = 'user-message';
      userDiv.textContent = message;
      chatContainer.appendChild(userDiv);

      const response = await fetch('/api/chat1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      const data = await response.json();
      const aiDiv = document.createElement('div');
      aiDiv.className = 'ai-message';
      aiDiv.textContent = data.reply;
      chatContainer.appendChild(aiDiv);
    });
  }
});
