// Import our shared Supabase client connection
import { supabase } from './client.js';

// --- Global Variables ---
let activeGem = null;
let userProfile = null;

// --- Get HTML Elements ---
const gemSelectionContainer = document.getElementById('gem-selection');
const chatWindow = document.getElementById('chat-window');
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const micButton = document.getElementById('mic-button');
const appHeader = document.querySelector('.app-header h2');

// --- Main Functions ---
async function loadUserProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data, error } = await supabase.from('profiles').select('subscription_status').eq('id', user.id).single();
        if (error && error.code !== 'PGRST116') { // Ignore error when no profile exists yet
            console.error('Error fetching profile:', error);
        } else {
            userProfile = data;
            loadGems();
        }
    } else {
        loadGems(); // Load gems even if user is not fully loaded yet (for free tier)
    }
}

async function loadGems() {
    let query = supabase.from('gems').select('*');

    // Logic for freemium model
    if (!userProfile || userProfile.subscription_status === 'free') {
         query = query.eq('name', 'Mind Over Muddle: Uncomplicating Your Leadership Brain');
    }

    const { data, error } = await query;
    if (error) {
        console.error('Error fetching gems:', error);
        gemSelectionContainer.innerHTML = `<p style="color: red;">Error loading coaches: ${error.message}</p>`;
    } else {
        displayGems(data);
    }
}

function displayGems(gems) {
    gemSelectionContainer.innerHTML = '<h3>Select a Coach</h3>';
    if (gems && gems.length > 0) {
        gems.forEach(gem => {
            const card = document.createElement('div');
            card.classList.add('gem-card');
            card.addEventListener('click', () => selectGem(gem));

            const nameElement = document.createElement('h4');
            nameElement.innerText = gem.name;
            card.appendChild(nameElement);

            const descriptionElement = document.createElement('p');
            descriptionElement.innerText = gem.description;
            card.appendChild(descriptionElement);

            gemSelectionContainer.appendChild(card);
        });
    }
}

function selectGem(gem) {
    activeGem = gem;
    gemSelectionContainer.style.display = 'none';
    chatWindow.style.display = 'block';
    appHeader.innerText = activeGem.name;
    chatMessages.innerHTML = '';
    addMessageToChat('Gemini Gem', `You've selected the "${gem.name}" coach. How can I help you today?`);
}

async function handleSendMessage() {
    const messageText = userInput.value.trim();
    if (messageText === '' || !activeGem) return;
    addMessageToChat('You', messageText);
    userInput.value = '';
    userInput.disabled = true;
    sendButton.disabled = true;
    micButton.disabled = true;
    try {
        const chatHistory = [];
        const messages = chatMessages.querySelectorAll('p');
        for (let i = 1; i < messages.length; i++) {
            const msg = messages[i];
            const fullText = msg.textContent || msg.innerText;
            const senderText = msg.querySelector('strong').textContent;
            const role = (senderText === 'You:') ? 'user' : 'model';
            const content = fullText.substring(senderText.length).trim();
            chatHistory.push({ role: role, content: content });
        }
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: activeGem.prompt, history: chatHistory }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Network response was not ok.');
        }
        const data = await response.json();
        addMessageToChat('Gemini Gem', data.reply);
    } catch (error) {
        console.error('Error sending message:', error);
        addMessageToChat('System', `Sorry, an error occurred: ${error.message}`);
    } finally {
        userInput.disabled = false;
        sendButton.disabled = false;
        micButton.disabled = false;
        userInput.focus();
    }
}

// --- Helper Functions ---
function addMessageToChat(sender, text) {
    const messageElement = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = `${sender}: `;
    messageElement.appendChild(strong);

    let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
    const textSpan = document.createElement('span');
    textSpan.innerHTML = formattedText;
    messageElement.appendChild(textSpan);

    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// --- Speech Recognition Logic ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    micButton.style.display = 'inline-block';
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    micButton.addEventListener('click', () => {
        recognition.start();
        micButton.textContent = '...';
        micButton.disabled = true;
    });
    recognition.onresult = (event) => {
        const speechResult = event.results[0][0].transcript;
        userInput.value = speechResult;
        handleSendMessage();
    };
    recognition.onspeechend = () => {
        recognition.stop();
        micButton.textContent = '🎤';
        micButton.disabled = false;
    };
    recognition.onerror = (event) => {
        alert('Speech recognition error detected: ' + event.error);
        micButton.textContent = '🎤';
        micButton.disabled = false;
    };
} else {
    console.log('Speech Recognition Not Supported');
    micButton.style.display = 'none';
}

// --- Event Listeners ---
sendButton.addEventListener('click', handleSendMessage);
userInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') handleSendMessage();
});

// --- Initial Load ---
loadUserProfile();
