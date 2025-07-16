import { supabase } from './client.js';

let activeGem = null;

const gemSelectionContainer = document.getElementById('gem-selection');
const chatWindow = document.getElementById('chat-window');
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const micButton = document.getElementById('mic-button');
const appHeader = document.querySelector('.app-header h2');

async function loadGems() {
    const { data, error } = await supabase.from('gems').select('*');
    if (error) {
        console.error('Error fetching gems:', error);
        gemSelectionContainer.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
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
    } else {
        gemSelectionContainer.innerHTML += '<p>No coaches found.</p>';
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

// The rest of the functions (handleSendMessage, addMessageToChat, Speech Recognition) remain the same...
// They will be added back in the final version.

loadGems(); // Run the load function immediately.
