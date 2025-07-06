// Core DOM Elements
const messageInput = document.querySelector(".message-input");
const chatbotBody = document.querySelector(".chatbot-messages");
const sendMessageButton = document.querySelector("#send-message");
const closeButton = document.querySelector("#close-chatbot");
const backToIntroButton = document.querySelector("#back-to-intro");
const chatForm = document.querySelector(".chat-form");
const emojiButton = document.querySelector("#emoji-button");
const fileButton = document.querySelector("#file-button");
const fileInput = document.querySelector("#file-input");
const emojiPicker = document.querySelector("#emoji-picker");
const emojiGrid = document.querySelector("#emoji-grid");
const filePreviewArea = document.querySelector("#file-preview-area");
const removeFileButton = document.querySelector("#remove-file");
const startChatButton = document.querySelector("#start-chat-btn");
const introPage = document.querySelector("#intro-page");
const chatbotPopup = document.querySelector("#chatbot-popup");
const connectionStatus = document.querySelector("#connection-status");

// API Key & URL
const API_KEY = "AIzaSyAbKbDf03zXS7j7_kyupUmCuVxuQiRzaao";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

// User session and chat data
const currentUser = {
  id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
  sessionId: 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
  startTime: new Date().toISOString(),
  lastActivity: new Date().toISOString()
};

const chatHistory = {
  userId: currentUser.id,
  sessionId: currentUser.sessionId,
  startTime: currentUser.startTime,
  messages: [],
  metadata: {
    userAgent: navigator.userAgent,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  }
};

const userData = {
  message: null,
  file: null
};

// Store message
function storeMessage(type, content, file = null) {
  const message = {
    id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    type,
    content,
    timestamp: new Date().toISOString(),
    file: file ? {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    } : null
  };
  chatHistory.messages.push(message);
  currentUser.lastActivity = message.timestamp;
  saveToLocalStorage();
  return message;
}

function saveToLocalStorage() {
  localStorage.setItem('shiftai_user', JSON.stringify(currentUser));
  localStorage.setItem('shiftai_chat_' + currentUser.id, JSON.stringify(chatHistory));
}

function loadFromLocalStorage() {
  const savedUser = localStorage.getItem('shiftai_user');
  if (savedUser) {
    const userData = JSON.parse(savedUser);
    const savedChat = localStorage.getItem('shiftai_chat_' + userData.id);
    if (savedChat) {
      Object.assign(currentUser, userData);
      Object.assign(chatHistory, JSON.parse(savedChat));
    }
  }
}

function scrollToBottom() {
  chatbotBody.scrollTo({ top: chatbotBody.scrollHeight, behavior: "smooth" });
}

function autoResizeTextarea() {
  messageInput.style.height = 'auto';
  messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
}

function createMessageElement(content, ...classes) {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
}

function showNotification(msg, type = 'info') {
  const n = document.createElement('div');
  n.className = `notification ${type}`;
  n.textContent = msg;
  document.body.appendChild(n);
  setTimeout(() => document.body.removeChild(n), 3000);
}

async function generateBotResponse(incomingMessageDiv) {
  const messageElement = incomingMessageDiv.querySelector(".bot-msgs-text");
  const requestBody = {
    contents: [{ parts: [{ text: userData.message }] }]
  };

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });
    const data = await res.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
    messageElement.textContent = '';
    await typeMessage(messageElement, reply);
    storeMessage('bot', reply);
  } catch {
    messageElement.innerHTML = '<p style="color:red">Bot error occurred.</p>';
    storeMessage('bot', 'Bot error');
  } finally {
    incomingMessageDiv.classList.remove("thinking");
    scrollToBottom();
  }
}

function typeMessage(el, txt, speed = 30) {
  return new Promise((resolve) => {
    let i = 0;
    const t = setInterval(() => {
      if (i < txt.length) {
        el.textContent += txt.charAt(i++);
        scrollToBottom();
      } else {
        clearInterval(t);
        resolve();
      }
    }, speed);
  });
}

async function handleOutGoingMsg(e) {
  e.preventDefault();
  const msg = messageInput.value.trim();
  if (!msg) return;

  userData.message = msg;
  storeMessage('user', msg);

  const userMsg = `<div class="enter-msgs-text">${msg}</div><i id="user-logo" class="bi bi-person-circle"></i>`;
  chatbotBody.appendChild(createMessageElement(userMsg, "enter-msgs"));
  messageInput.value = "";
  autoResizeTextarea();
  scrollToBottom();

  const thinking = `<svg class="chatbot-logo" width="36" height="36"></svg><div class="bot-msgs-text"><div class="thinking-indicator"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div></div>`;
  const incoming = createMessageElement(thinking, "bot-msgs", "thinking");
  chatbotBody.appendChild(incoming);
  scrollToBottom();
  generateBotResponse(incoming);
}

messageInput.addEventListener("input", autoResizeTextarea);
messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) handleOutGoingMsg(e);
});
chatForm.addEventListener("submit", handleOutGoingMsg);

startChatButton.addEventListener("click", () => {
  introPage.style.display = 'none';
  chatbotPopup.style.display = 'block';
  messageInput.focus();
});

backToIntroButton.addEventListener("click", () => {
  chatbotPopup.style.display = 'none';
  introPage.style.display = 'flex';
});

closeButton.addEventListener("click", () => {
  chatbotPopup.style.transform = "scale(0.8) translateY(20px)";
  chatbotPopup.style.opacity = "0.7";
  setTimeout(() => {
    chatbotPopup.style.transform = "scale(1) translateY(0)";
    chatbotPopup.style.opacity = "1";
  }, 300);
});

document.addEventListener("DOMContentLoaded", () => {
  loadFromLocalStorage();
  storeMessage('bot', "👋 Welcome back! How can I help you today?");
  scrollToBottom();
});
