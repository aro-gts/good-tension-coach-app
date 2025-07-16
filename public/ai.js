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
        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching profile:', error);
        } else {
            userProfile = data;
        }
    }
    loadGems();
}

async function loadGems() {
    let query = supabase.from('gems').select('*');
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
    addMessageToChat('Your AI Executive Coach', `You've selected the "${gem.name}" coach. How can I help you today?`);
}

async function handleSendMessage() {
    const messageText = userInput.value.trim();
    if (messageText === '' || !activeGem) return;
    addMessageToChat('You', messageText);
    userInput.value = '';
    userInput.disabled = true;
    sendButton.disabled = true;
    micButton.disabled = true;
    const chatHistory = [];
    const messages = chatMessages.querySelectorAll('p');
    for (let i = 1; i < messages.length; i++) {
        const msg = messages[i];
        const fullText = msg.textContent || msg.innerText;
        const senderText = msg.querySelector('strong').textContent;
        const role = (senderText === 'You:') ? 'user' : 'assistant';
        const content = fullText.substring(senderText.length).trim();
        chatHistory.push({ role: role, content: content });
    }
    try {
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
        addMessageToChat('Your AI Executive Coach', data.reply);
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

function addMessageToChat(
