import { supabase } from './client.js';

const chatBox = document.getElementById("chat-box");
const sendButton = document.getElementById("send-button");
const userInput = document.getElementById("user-input");
const intro = document.getElementById("intro-text");

let session_id = crypto.randomUUID();
let isFirstTurn = true;

window.onload = async () => {
  const { data, error } = await supabase
    .from("gems")
    .select("prompt, description")
    .eq("id", 1)
    .single();

  if (error) {
    intro.innerText = "Error loading coaching prompt.";
    return;
  }

  intro.innerText = `${data.description}

${data.prompt}

What's on your mind?`;
};

sendButton.addEventListener("click", async () => {
  const userMessage = userInput.value.trim();
  if (!userMessage) return;

  appendMessage("user", userMessage);
  userInput.value = "";
  intro.style.display = "none";

  const response = await fetch("/api/chat1", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_message: userMessage, session_id, isFirstTurn })
  });

  const data = await response.json();
  appendMessage("ai", data.ai_response);
  isFirstTurn = false;
});

function appendMessage(sender, text) {
  const messageElem = document.createElement("div");
  messageElem.className = sender === "user" ? "user-message" : "ai-message";
  messageElem.innerText = text;
  chatBox.appendChild(messageElem);
}
