import { supabase } from './supabase.js';

const loginScreen = document.getElementById("login-screen");
const appScreen = document.getElementById("app-screen");
const loginButton = document.getElementById("login-button");
const signupButton = document.getElementById("signup-button");
const logoutButton = document.getElementById("logout-button");
const emailInput = document.getElementById("email-input");
const passwordInput = document.getElementById("password-input");

loginButton.addEventListener("click", async () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return alert(error.message);
  loginScreen.style.display = "none";
  appScreen.style.display = "block";
});

signupButton.addEventListener("click", async () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) return alert(error.message);
  alert("Check your email for a confirmation link.");
});

logoutButton.addEventListener("click", async () => {
  await supabase.auth.signOut();
  appScreen.style.display = "none";
  loginScreen.style.display = "block";
});

const checkLogin = async () => {
  const { data } = await supabase.auth.getSession();
  if (data.session) {
    loginScreen.style.display = "none";
    appScreen.style.display = "block";
  }
};

checkLogin();
