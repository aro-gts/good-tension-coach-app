// Import our shared Supabase client connection
import { supabase } from './client.js';

// --- Get HTML Elements ---
const loginScreen = document.getElementById('login-screen');
const appScreen = document.getElementById('app-screen');
const emailInput = document.getElementById('email-input');
const passwordInput = document.getElementById('password-input');
const loginButton = document.getElementById('login-button');
const signupButton = document.getElementById('signup-button');
const logoutButton = document.getElementById('logout-button');

// --- Event Listeners ---
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

loginButton.addEventListener('click', async () => {
    const { user, error } = await supabase.auth.signInWithPassword({
        email: emailInput.value,
        password: passwordInput.value,
    });
    if (error) {
        alert('Error logging in: ' + error.message);
    }
});

logoutButton.addEventListener('click', async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        alert('Error logging out: ' + error.message);
    }
});

// --- Auth State Management ---
supabase.auth.onAuthStateChange((event, session) => {
    if (session && session.user) {
        loginScreen.style.display = 'none';
        appScreen.style.display = 'block';
    } else {
        loginScreen.style.display = 'block';
        appScreen.style.display = 'none';
    }
});
