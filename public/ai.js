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

// 1. Get the current user's profile and subscription status
async function loadUserProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data, error } = await supabase
            .from('profiles')
            .select('subscription_status')
            .eq('id', user.id)
            .single();

        if (error) {
            console.error('Error fetching profile:', error);
        } else {
            userProfile = data;
            loadGems(); // Once we have the profile, load the appropriate gems
        }
    }
}

// 2. Load Gems from the Database based on subscription status
async function loadGems() {
    let query = supabase.from('gems').select('*');

    // If the user is on the free plan, only show the "Mind Over Muddle" Gem
    if (userProfile && userProfile.subscription_status === 'free') {
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

// 3. Display Gems as Buttons
function displayGems(gems) {
    gemSelectionContainer.innerHTML = '<h3>Select a Coach</h3>';
    if (gems && gems.length > 0) {
        gems.forEach(gem => {
            const button = document.createElement('button');
            button.innerText = gem.name;
            button.classList.add('gem-button');
            button.addEventListener('click', () => selectGem(gem));
            gemSelectionContainer.appendChild(button);
        });
    }
    // We will add an "Upgrade" button here later for free users
}

// 4. Handle Gem Selection
function selectGem(gem) {
    activeGem = gem;
    gemSelectionContainer.style.display = 'none';
    chatWindow.style.display = 'block';
    appHeader.innerText = activeGem.name;
    addMessageToChat('Gemini Gem', `You've selected the "${activeGem.name}" coach. How can I help you today?`);
}

// 5. Handle Sending a Message
async function handleSendMessage() {
    const messageText = userInput.value.trim();
    if (messageText === '' || !activeGem) return;

    addMessageToChat('You', messageText);
    userInput.value = '';
    userInput.disabled = true;
    sendButton.disabled = true;
    micButton.disabled = true;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: activeGem.prompt, message: messageText }),
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
// This now starts the chain: check the user's auth state, then load their profile, then load their gems.
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
        loadUserProfile();
    }
});

// Also check on initial page load in case the user is already signed in
loadUserProfile();
