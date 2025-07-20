import { supabase } from './client.js';

const loginButton = document.getElementById('login-button');
const signupButton = document.getElementById('signup-button');
const logoutButton = document.getElementById('logout-button');

const loginScreen = document.getElementById('login-screen');
const appScreen = document.getElementById('app-screen');
const chatWindow = document.getElementById('chat-window');

loginButton.addEventListener('click', async () => {
  const email = document.getElementById('email-input').value;
  const password = document.getElementById('password-input').value;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    alert('Login failed: ' + error.message);
  } else {
    loginScreen.style.display = 'none';
    appScreen.style.display = 'block';
    chatWindow.style.display = 'block';
  }
});

signupButton.addEventListener('click', async () => {
  const email = document.getElementById('email-input').value;
  const password = document.getElementById('password-input').value;

  const { error } = await supabase.auth.signUp({ email, password });
  if (error) {
    alert('Signup failed: ' + error.message);
  } else {
    alert('Signup successful! You can now log in.');
  }
});

logoutButton.addEventListener('click', async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    alert('Logout failed: ' + error.message);
  } else {
    loginScreen.style.display = 'block';
    appScreen.style.display = 'none';
    chatWindow.style.display = 'none';
  }
});
