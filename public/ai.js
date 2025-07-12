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
const micButton = document.getElementById('mic-button');
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
    if (gems && gems.length > 0) {
        gems.forEach(gem => {
            // Create a container 'card' for each gem
            const card = document.createElement('div');
            card.classList.add('gem-card');
            card.addEventListener('click', () => selectGem(gem));

            // Create and add the Gem name as a heading
            const nameElement = document.createElement('h4');
            nameElement.innerText = gem.name;
            card.appendChild(nameElement);

            // Create and add the Gem description as a paragraph
            const descriptionElement = document.createElement('p');
            descriptionElement.innerText = gem.description; // Using the description from the database
            card.appendChild(descriptionElement);

            // Add the whole card to the container
            gemSelectionContainer.appendChild(card);
        });
    }
    
    // We will add an "Upgrade" button here later for free users
}
function selectGem(gem) {
    activeGem = gem;
    gemSelectionContainer.style.display = 'none';
    chatWindow.style.display = 'block';
    appHeader.innerText = activeGem.name;
    // Clear any previous messages and add the initial prompt
    chatMessages.innerHTML = ''; 
    addMessageToChat('Gemini Gem', `You've selected the "${activeGem.name}" coach. How can I help you today?`);
}

async function handleSendMessage() {
    const messageText = userInput.value.trim();
    if (messageText === '' || !activeGem) return;

    addMessageToChat('You', messageText);
    userInput.value = '';
    userInput.disabled = true;
    sendButton.disabled = true;
    micButton.disabled = true;

    // Create a history of the chat to send to the backend
    const chatHistory = [];
    const messages = chatMessages.querySelectorAll('p');
    // We skip the first message, which is the initial welcome.
    for (let i = 1; i < messages.length; i++) {
        const msg = messages[i];
        const fullText = msg.textContent || msg.innerText;
        const senderText = msg.querySelector('strong').textContent;
        const role = (senderText === 'You:') ? 'user' : 'model';
        const content = fullText.substring(senderText.length).trim();
        chatHistory.push({ role: role, content: content });
    }

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: activeGem.prompt,
                history: chatHistory
            }),
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
    messageElement.append(text);
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
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
        loadUserProfile();
    }
});
loadUserProfile(); // Also check on initial page load

async function loadUserProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data, error } = await supabase.from('profiles').select('subscription_status').eq('id', user.id).single();
        if (error) {
            console.error('Error fetching profile:', error);
        } else {
            userProfile = data;
            loadGems();
        }
    }
}
