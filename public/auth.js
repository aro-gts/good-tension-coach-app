// Import the Supabase client library from a CDN
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// --- Initialize Supabase ---
// These are the credentials you provided earlier.
const supabaseUrl = 'https://zmehmjwlzahsuvrmtqel.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptZWhtandsemFoc3V2cm10cWVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MjA0NDUsImV4cCI6MjA2NjM5NjQ0NX0.BDvCG-WLrdJ6ZkTzG2TSrXJwaFz2Kom7jmt3o217ixE';
const supabase = createClient(supabaseUrl, supabaseKey);


// --- Get HTML Elements ---
const loginScreen = document.getElementById('login-screen');
const appScreen = document.getElementById('app-screen');

const emailInput = document.getElementById('email-input');
const passwordInput = document.getElementById('password-input');

const loginButton = document.getElementById('login-button');
const signupButton = document.getElementById('signup-button');
const logoutButton = document.getElementById('logout-button');


// --- Event Listeners ---

// Handle Sign Up button click
signupButton.addEventListener('click', async () => {
    const { user, error } = await supabase.auth.signUp({
        email: emailInput.value,
        password: passwordInput.value,
    });

    if (error) {
        alert('Error signing up: ' + error.message);
    } else {
        alert('Signup successful! Please check your email for a confirmation link.');
    }
});

// Handle Login button click
loginButton.addEventListener('click', async () => {
    const { user, error } = await supabase.auth.signInWithPassword({
        email: emailInput.value,
        password: passwordInput.value,
    });

    if (error) {
        alert('Error logging in: ' + error.message);
    }
    // The onAuthStateChange listener below will handle showing the app screen
});

// Handle Logout button click
logoutButton.addEventListener('click', async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        alert('Error logging out: ' + error.message);
    }
    // The onAuthStateChange listener below will handle showing the login screen
});


// --- Auth State Management ---

// Listen for changes in authentication state (login, logout)
supabase.auth.onAuthStateChange((event, session) => {
    if (session && session.user) {
        // User is logged in
        loginScreen.style.display = 'none';
        appScreen.style.display = 'block';
    } else {
        // User is logged out
        loginScreen.style.display = 'block';
        appScreen.style.display = 'none';
    }
});
