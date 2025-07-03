// Import the Supabase client library from a CDN
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// --- Initialize Supabase ---
const supabaseUrl = 'https://zmehmjwlzahsuvrmtqel.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptZWhtandsemFoc3V2cm10cWVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MjA0NDUsImV4cCI6MjA2NjM5NjQ0NX0.BDvCG-WLrdJ6ZkTzG2TSrXJwaFz2Kom7jmt3o217ixE';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- Global Variables ---
let activeGem = null; // To store the currently selected gem object

// --- Get HTML Elements ---
const gemSelectionContainer = document.getElementById('gem-selection');
const chatWindow = document.getElementById('chat-window');
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const appHeader = document.querySelector('.app-header h2');


// --- Main Functions ---

// 1. Load Gems from the Database
async function loadGems() {
    // Fetch all columns from the 'gems' table
    const { data, error } = await supabase
        .from('gems')
        .select('*');

    if (error) {
        console.error('Error fetching gems:', error);
        gemSelectionContainer.innerHTML = '<p>Error loading coaches. Please try again later.</p>';
    } else {
        displayGems(data);
    }
}

// 2. Display Gems as Buttons
function displayGems(gems) {
    gemSelectionContainer.innerHTML = '<h3>Select a Coach</h3>'; // Reset the container
    gems.forEach(gem => {
        const button = document.createElement('button');
        button.innerText = gem.name;
        button.classList.add('gem-button');
        button.addEventListener('click', () => selectGem(gem));
        gemSelectionContainer.appendChild(button);
    });
}

// 3. Handle Gem Selection
function selectGem(gem) {
    activeGem = gem; // Store the selected gem object
    
    // Update the UI
    gemSelectionContainer.style.display = 'none';
    chatWindow.style.display = 'block';
    appHeader.innerText = activeGem.name; // Update the header to the selected coach's name

    // Display a welcome message from the selected coach
    addMessageToChat('Gemini Gem', `You've selected the "${activeGem.name}" coach. How can I help you today?`);
}

// 4. Handle Sending a Message
async function handleSendMessage() {
    const messageText = userInput.value.trim();
    if (messageText === '' || !activeGem) {
        return; // Do nothing if input is empty or no gem is selected
    }

    addMessageToChat('You', messageText);
    userInput.value = ''; // Clear the input box

    // --- This is where the real AI call will happen ---
    // For now, we will just echo the message back as a placeholder
    const aiResponse = `(Placeholder) You said: "${messageText}". The full AI connection is our next step.`;
    addMessageToChat('Gemini Gem', aiResponse);
}

// --- Helper Functions ---
function addMessageToChat(sender, text) {
    const messageElement = document.createElement('p');
    messageElement.innerHTML = `<strong>${sender}:</strong> ${text}`;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll to the latest message
}

// --- Event Listeners ---
sendButton.addEventListener('click', handleSendMessage);
userInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        handleSendMessage();
    }
});


// --- Initial Load ---
// Call the function to load the gems from the database when the script starts.
loadGems();
