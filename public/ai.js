// This file will handle all the AI interaction logic.

// --- 1. Define Our Gems ---
// We store the prompts and names in an array of objects.
const gems = [
    {
        id: 'muddle',
        name: 'Mind Over Muddle',
        prompt: `You are a neuroscience-informed executive coach...` // Full prompt text goes here
    },
    {
        id: 'rhythm',
        name: 'Finding an Instructional Rhythm',
        prompt: `You are an executive coach specializing in strategic time management...` // Full prompt text goes here
    },
    {
        id: 'mastery',
        name: 'Whack-A-Mole Mastery',
        prompt: `You are an executive coach specializing in adaptive leadership...` // Full prompt text goes here
    },
    {
        id: 'compass',
        name: 'The Conflict Compass',
        prompt: `You are an expert executive coach specializing in conflict resolution...` // Full prompt text goes here
    },
    {
        id: 'amplifier',
        name: 'Strengths Catalyst',
        prompt: `You are an expert executive coach specializing in strengths-based leadership...` // Full prompt text goes here
    },
    {
        id: 'thrive',
        name: 'Empower & Thrive',
        prompt: `You are an executive coach specializing in supporting leaders of color...` // Full prompt text goes here
    }
];

// --- 2. Get HTML Elements ---
const gemSelectionContainer = document.getElementById('gem-selection');
const chatWindow = document.getElementById('chat-window');

// --- 3. Display the Gems ---
function displayGems() {
    gemSelectionContainer.innerHTML = '<h3>Select a Coach</h3>'; // Reset the container
    gems.forEach(gem => {
        const button = document.createElement('button');
        button.innerText = gem.name;
        button.classList.add('gem-button'); 
        button.addEventListener('click', () => selectGem(gem));
        gemSelectionContainer.appendChild(button);
    });
}

// --- 4. Handle Gem Selection ---
function selectGem(gem) {
    console.log(`Selected Gem: ${gem.name}`);
    // Hide the Gem selection and show the chat window
    gemSelectionContainer.style.display = 'none';
    chatWindow.style.display = 'block';
}

// --- 5. Initialize ---
// Call the function to display the gems when the script loads.
displayGems();
