// Import our shared Supabase client connection
import { supabase } from './client.js';

// --- Global Variables ---
let activeGem = null;

// --- Get HTML Elements ---
const gemSelectionContainer = document.getElementById('gem-selection');
const chatWindow = document.getElementById('chat-window');
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const appHeader = document.querySelector('.app-header h2');

// --- Main Functions ---
async function loadGems() {
    const { data, error } = await supabase.from('gems').select('*');
    if (error) {
        console.error('Error fetching gems:', error);
        gemSelectionContainer.innerHTML = `<p style="color: red;">Error loading coaches: ${error.message}</p>`;
    } else {
        displayGems(data);
    }
}

function displayGems(gems) {
    gemSelectionContainer.innerHTML = '<h3>Select a Coach</h3>';
    gems.forEach(gem => {
        const button = document.createElement('button');
        button.innerText = gem.name;
        button.classList.add('gem-button');
        button.addEventListener('click', () => selectGem(gem));
        gemSelectionContainer.appendChild(button);
    });
}

function selectGem(gem) {
    activeGem = gem;
    gemSelectionContainer.style.display = 'none';
    chatWindow.style.display = 'block';
    appHeader.innerText = activeGem.name;
    addMessageToChat('Gemini Gem', `You've selected the "${activeGem.name}" coach. How can I help you today?`);
}

async function handleSendMessage() {
    const messageText = userInput.value.trim();
    if (messageText === '' || !activeGem) {
        return;
    }

    addMessageToChat('You', messageText);
    userInput.value = '';
    userInput.disabled = true;
    sendButton.disabled = true;

    try {
        // Send the user's message and the Gem's prompt to our own backend
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: activeGem.prompt,
                message: messageText
            }),
        });

        if (!response.ok) {
            // If the server responds with an error, show it
            const errorData = await response.json();
            throw new Error(errorData.error || 'Network response was not ok.');
        }

        const data = await response.json();
        addMessageToChat('Gemini Gem', data.reply);

    } catch (error) {
        console.error('Error sending message:', error);
        addMessageToChat('System', `Sorry, an error occurred: ${error.message}`);
    } finally {
        // Re-enable the input field and button
        userInput.disabled = false;
        sendButton.disabled = false;
        userInput.focus();
    }
}

// --- Helper Functions ---
function addMessageToChat(sender, text) {
    const messageElement = document.createElement('p');
    // Sanitize text to prevent HTML injection
    const strong = document.createElement('strong');
    strong.textContent = `${sender}: `;
    messageElement.appendChild(strong);
    messageElement.append(text);
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// --- Event Listeners ---
sendButton.addEventListener('click', handleSendMessage);
userInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        handleSendMessage();
    }
});

// --- Initial Load ---
loadGems();
