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

// API Configuration
const API_KEY = "AIzaSyAbKbDf03zXS7j7_kyupUmCuVxuQiRzaao";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

// Our Firebase Configuration - Pre-configured for all users
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyAXs4Q8o8mAPnr4AtErdzax3LXpJQ5vX3c",
    authDomain: "indrones-auth.firebaseapp.com",
    projectId: "indrones-auth",
    storageBucket: "indrones-auth.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};

// Firebase variables
let db = null;
let isFirebaseConnected = false;

// User session management
let currentUser = {
    id: generateUserId(),
    sessionId: generateSessionId(),
    startTime: new Date().toISOString(),
    lastActivity: new Date().toISOString()
};

// Chat Storage
let chatHistory = {
    userId: currentUser.id,
    sessionId: currentUser.sessionId,
    startTime: currentUser.startTime,
    messages: [],
    metadata: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        projectId: FIREBASE_CONFIG.projectId
    }
};

const userData = {
    message: null,
    file: null
};

// Generate unique user ID
function generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Generate unique session ID
function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Generate unique message ID
function generateMessageId() {
    return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Store message in chat history
const storeMessage = (type, content, file = null, timestamp = new Date().toISOString()) => {
    const message = {
        id: generateMessageId(),
        type: type, // 'user' or 'bot'
        content: content,
        timestamp: timestamp,
        file: file ? {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified
        } : null
    };
    
    chatHistory.messages.push(message);
    currentUser.lastActivity = timestamp;
    
    // Auto-save to Firebase if connected
    if (isFirebaseConnected) {
        saveChatToFirebase();
    }
    
    // Auto-save to localStorage as backup
    saveToLocalStorage();
    
    console.log('Message stored:', message);
    return message;
};

// Initialize Firebase automatically
const initializeFirebase = async () => {
    try {
        // Import Firebase modules dynamically
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
        const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        // Initialize Firebase with our config
        const app = initializeApp(FIREBASE_CONFIG);
        db = getFirestore(app);
        isFirebaseConnected = true;
        
        // Update connection status
        updateConnectionStatus(true);
        
        // Save current chat history to Firebase
        await saveChatToFirebase();
        
        console.log('Firebase connected successfully to project:', FIREBASE_CONFIG.projectId);
        showNotification('✅ Connected to cloud storage!', 'success');
        
        return true;
    } catch (error) {
        console.error('Firebase initialization error:', error);
        updateConnectionStatus(false);
        showNotification('⚠️ Cloud storage unavailable, using local storage', 'warning');
        return false;
    }
};

// Save chat to Firebase
const saveChatToFirebase = async () => {
    if (!isFirebaseConnected || !db) return;
    
    try {
        const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const chatData = {
            ...chatHistory,
            lastUpdated: new Date().toISOString(),
            userInfo: currentUser
        };
        
        await setDoc(doc(db, 'user_chats', currentUser.id), chatData);
        console.log('Chat saved to Firebase for user:', currentUser.id);
    } catch (error) {
        console.error('Error saving to Firebase:', error);
        showNotification('⚠️ Failed to sync with cloud storage', 'warning');
    }
};

// Load chat from Firebase
const loadChatFromFirebase = async (userId) => {
    if (!isFirebaseConnected || !db) return null;
    
    try {
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const docRef = doc(db, 'user_chats', userId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            console.log('No chat found for user:', userId);
            return null;
        }
    } catch (error) {
        console.error('Error loading from Firebase:', error);
        return null;
    }
};

// Save to localStorage as backup
const saveToLocalStorage = () => {
    try {
        localStorage.setItem('shiftai_user', JSON.stringify(currentUser));
        localStorage.setItem('shiftai_chat_' + currentUser.id, JSON.stringify(chatHistory));
    } catch (error) {
        console.warn('Failed to save to localStorage:', error);
    }
};

// Load from localStorage
const loadFromLocalStorage = () => {
    try {
        const savedUser = localStorage.getItem('shiftai_user');
        if (savedUser) {
            const userData = JSON.parse(savedUser);
            const savedChat = localStorage.getItem('shiftai_chat_' + userData.id);
            
            if (savedChat) {
                currentUser = userData;
                chatHistory = JSON.parse(savedChat);
                console.log('Chat history restored from localStorage');
                return true;
            }
        }
    } catch (error) {
        console.warn('Failed to restore from localStorage:', error);
    }
    return false;
};

// Update connection status indicator
const updateConnectionStatus = (connected) => {
    if (connected) {
        connectionStatus.textContent = '🟢 Connected';
        connectionStatus.title = 'Connected to cloud storage';
    } else {
        connectionStatus.textContent = '🟡 Local Only';
        connectionStatus.title = 'Using local storage only';
    }
};

// Show notification
const showNotification = (message, type = 'info') => {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    // Set background color based on type
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    notification.style.backgroundColor = colors[type] || colors.info;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
};

// Emoji data organized by categories
const emojiData = {
    smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏'],
    people: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅'],
    nature: ['🌟', '⭐', '🌙', '☀️', '⛅', '🌤️', '⛈️', '🌧️', '❄️', '☃️', '⛄', '🌈', '🔥', '💧', '🌊', '🎄', '🌲', '🌳', '🌴', '🌱', '🌿', '☘️', '🍀', '🎋', '🍃', '🍂', '🍁', '🌾', '🌺', '🌻', '🌹', '🥀'],
    food: ['🍕', '🍔', '🍟', '🌭', '🥪', '🌮', '🌯', '🥙', '🧆', '🥚', '🍳', '🥘', '🍲', '🥗', '🍿', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🌭', '🥪', '🍞', '🥖', '🥨', '🧀', '🥯', '🍎', '🍊', '🍋'],
    activities: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️', '🥌', '🎿'],
    travel: ['✈️', '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲', '🛴', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝'],
    objects: ['💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷', '🪙', '💰', '💳', '💎', '⚖️', '🪜', '🧰', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🪚', '🔩', '⚙️', '🪤', '🧱', '⛓️', '🧲', '🔫', '💣'],
    symbols: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈']
};

// Auto-resize textarea
const autoResizeTextarea = () => {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
};

// Create message elements
const createMessageElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
};

// Format file size
const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Get file icon based on file type
const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    const iconMap = {
        'pdf': 'bi-file-earmark-pdf',
        'doc': 'bi-file-earmark-word',
        'docx': 'bi-file-earmark-word',
        'txt': 'bi-file-earmark-text',
        'jpg': 'bi-file-earmark-image',
        'jpeg': 'bi-file-earmark-image',
        'png': 'bi-file-earmark-image',
        'gif': 'bi-file-earmark-image',
        'webp': 'bi-file-earmark-image',
        'zip': 'bi-file-earmark-zip',
        'rar': 'bi-file-earmark-zip'
    };
    return iconMap[extension] || 'bi-file-earmark';
};

// Show emoji picker
const showEmojiPicker = () => {
    emojiPicker.classList.toggle('show');
    filePreviewArea.classList.remove('show');
    emojiButton.classList.toggle('active');
    
    if (emojiPicker.classList.contains('show')) {
        loadEmojis('smileys');
    }
};

// Load emojis for selected category
const loadEmojis = (category) => {
    emojiGrid.innerHTML = '';
    const emojis = emojiData[category] || emojiData.smileys;
    
    emojis.forEach(emoji => {
        const button = document.createElement('button');
        button.className = 'emoji-item';
        button.textContent = emoji;
        button.addEventListener('click', () => insertEmoji(emoji));
        emojiGrid.appendChild(button);
    });
};

// Insert emoji into message input
const insertEmoji = (emoji) => {
    const cursorPos = messageInput.selectionStart;
    const textBefore = messageInput.value.substring(0, cursorPos);
    const textAfter = messageInput.value.substring(cursorPos);
    
    messageInput.value = textBefore + emoji + textAfter;
    messageInput.focus();
    messageInput.setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length);
    
    autoResizeTextarea();
    emojiPicker.classList.remove('show');
    emojiButton.classList.remove('active');
};

// Handle file selection
const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
        showNotification('❌ File size must be less than 10MB', 'error');
        return;
    }
    
    userData.file = file;
    showFilePreview(file);
    emojiPicker.classList.remove('show');
    emojiButton.classList.remove('active');
};

// Show file preview
const showFilePreview = (file) => {
    const fileName = filePreviewArea.querySelector('.file-name');
    const fileSize = filePreviewArea.querySelector('.file-size');
    const fileIcon = filePreviewArea.querySelector('.file-info i');
    
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    fileIcon.className = `bi ${getFileIcon(file.name)}`;
    
    filePreviewArea.classList.add('show');
};

// Remove file
const removeFile = () => {
    userData.file = null;
    fileInput.value = '';
    filePreviewArea.classList.remove('show');
};

// Create file attachment element for message
const createFileAttachment = (file) => {
    if (file.type.startsWith('image/')) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                resolve(`
                    <div class="image-attachment">
                        <img src="${e.target.result}" alt="${file.name}" />
                    </div>
                `);
            };
            reader.readAsDataURL(file);
        });
    } else {
        return Promise.resolve(`
            <div class="file-attachment">
                <i class="bi ${getFileIcon(file.name)}"></i>
                <div class="file-info">
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">${formatFileSize(file.size)}</span>
                </div>
            </div>
        `);
    }
};

// Enhanced bot response generation
const generateBotResponse = async (incomingMessageDiv) => {
    const messageElement = incomingMessageDiv.querySelector(".bot-msgs-text");
    
    let messageContent = userData.message;
    if (userData.file) {
        messageContent += `\n\n[User attached a file: ${userData.file.name}]`;
    }
    
    const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: messageContent }]
            }]
        })
    };

    try {
        const response = await fetch(API_URL, requestOptions);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error?.message || 'Failed to get response');
        }

        const apiResponseText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        
        if (apiResponseText) {
            messageElement.innerHTML = '';
            await typeMessage(messageElement, apiResponseText);
            
            // Store bot response in chat history
            storeMessage('bot', apiResponseText);
        } else {
            throw new Error('No response received');
        }
        
    } catch (error) {
        console.error('Error:', error);
        const errorMessage = `Sorry, I'm having trouble connecting right now. Please try again in a moment.`;
        messageElement.innerHTML = `
            <p style="color: #ef4444;">
                <i class="bi bi-exclamation-triangle"></i> 
                ${errorMessage}
            </p>
        `;
        
        // Store error message in chat history
        storeMessage('bot', errorMessage);
    } finally {
        incomingMessageDiv.classList.remove("thinking");
        scrollToBottom();
    }
};

// Typing animation effect
const typeMessage = (element, text, speed = 30) => {
    return new Promise((resolve) => {
        let index = 0;
        const timer = setInterval(() => {
            if (index < text.length) {
                element.textContent += text.charAt(index);
                index++;
                scrollToBottom();
            } else {
                clearInterval(timer);
                resolve();
            }
        }, speed);
    });
};

// Smooth scroll to bottom
const scrollToBottom = () => {
    chatbotBody.scrollTo({
        top: chatbotBody.scrollHeight,
        behavior: "smooth"
    });
};

// Handle outgoing messages
const handleOutGoingMsg = async (e) => {
    e.preventDefault();
    
    const message = messageInput.value.trim();
    if (!message && !userData.file) return;
    
    userData.message = message || "📎 File attached";
    const currentFile = userData.file;
    
    // Store user message in chat history
    storeMessage('user', userData.message, currentFile);
    
    // Clear inputs
    messageInput.value = "";
    messageInput.style.height = 'auto';
    removeFile();
    
    // Create user message content
    let messageContent = `<div class="enter-msgs-text">${userData.message}</div>`;
    
    // Add file attachment if present
    if (currentFile) {
        const fileAttachment = await createFileAttachment(currentFile);
        messageContent = `<div class="enter-msgs-text">${userData.message}${fileAttachment}</div>`;
    }
    
    messageContent += `<i id="user-logo" class="bi bi-person-circle"></i>`;
    
    const outgoingMessageDiv = createMessageElement(messageContent, "enter-msgs");
    chatbotBody.appendChild(outgoingMessageDiv);
    scrollToBottom();

    // Show bot thinking indicator
    setTimeout(() => {
        const botMessageContent = `
            <svg class="chatbot-logo" xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 1024 1024">
                <path d="M738.3 287.6H285.7c-59 0-106.8 47.8-106.8 106.8v303.1c0 59 47.8 106.8 106.8 106.8h81.5v111.1c0 .7.8 1.1 1.4.7l166.9-110.6 41.8-.8h117.4l43.6-.4c59 0 106.8-47.8 106.8-106.8V394.5c0-59-47.8-106.9-106.8-106.9zM351.7 448.2c0-29.5 23.9-53.5 53.5-53.5s53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5-53.5-23.9-53.5-53.5zm157.9 267.1c-67.8 0-123.8-47.5-132.3-109h264.6c-8.6 61.5-64.5 109-132.3 109zm110-213.7c-29.5 0-53.5-23.9-53.5-53.5s23.9-53.5 53.5-53.5 53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5zM867.2 644.5V453.1h26.5c19.4 0 35.1 15.7 35.1 35.1v121.1c0 19.4-15.7 35.1-35.1 35.1h-26.5zM95.2 609.4V488.2c0-19.4 15.7-35.1 35.1-35.1h26.5v191.3h-26.5c-19.4 0-35.1-15.7-35.1-35.1zM561.5 149.6c0 23.4-15.6 43.3-36.9 49.7v44.9h-30v-44.9c-21.4-6.5-36.9-26.3-36.9-49.7 0-28.6 23.3-51.9 51.9-51.9s51.9 23.3 51.9 51.9z"></path>
            </svg>
            <div class="bot-msgs-text">
                <div class="thinking-indicator">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                </div>
            </div>
        `;
        
        const incomingMessageDiv = createMessageElement(botMessageContent, "bot-msgs", "thinking");
        chatbotBody.appendChild(incomingMessageDiv);
        scrollToBottom();
        
        // Generate bot response
        generateBotResponse(incomingMessageDiv);
    }, 500);
};

// Show chat interface
const showChatInterface = () => {
    introPage.style.display = 'none';
    chatbotPopup.style.display = 'block';
    messageInput.focus();
    scrollToBottom();
};

// Show intro page
const showIntroPage = () => {
    chatbotPopup.style.display = 'none';
    introPage.style.display = 'flex';
};

// Close overlays when clicking outside
const closeOverlays = (e) => {
    if (!emojiPicker.contains(e.target) && !emojiButton.contains(e.target)) {
        emojiPicker.classList.remove('show');
        emojiButton.classList.remove('active');
    }
};

// Event listeners
messageInput.addEventListener("input", autoResizeTextarea);

messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const userMessage = e.target.value.trim();
        if (userMessage || userData.file) {
            handleOutGoingMsg(e);
        }
    }
});

chatForm.addEventListener("submit", handleOutGoingMsg);

// Start chat button
startChatButton.addEventListener("click", showChatInterface);

// Back to intro button
backToIntroButton.addEventListener("click", showIntroPage);

// Emoji picker events
emojiButton.addEventListener("click", (e) => {
    e.stopPropagation();
    showEmojiPicker();
});

// Emoji category selection
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('emoji-category')) {
        document.querySelectorAll('.emoji-category').forEach(cat => cat.classList.remove('active'));
        e.target.classList.add('active');
        loadEmojis(e.target.dataset.category);
    }
});

// File upload events
fileButton.addEventListener("click", () => {
    fileInput.click();
    emojiPicker.classList.remove('show');
    emojiButton.classList.remove('active');
});

fileInput.addEventListener("change", handleFileSelect);
removeFileButton.addEventListener("click", removeFile);

// Close overlays when clicking outside
document.addEventListener("click", closeOverlays);

// Close button functionality
closeButton.addEventListener("click", () => {
    const popup = chatbotPopup;
    popup.style.transform = "scale(0.8) translateY(20px)";
    popup.style.opacity = "0.7";
    
    setTimeout(() => {
        popup.style.transform = "scale(1) translateY(0)";
        popup.style.opacity = "1";
    }, 300);
});

// Global API for external access
window.shiftAI = {
    getChatHistory: () => ({ ...chatHistory }),
    getCurrentUser: () => ({ ...currentUser }),
    exportChatHistory: () => {
        const dataStr = JSON.stringify(chatHistory, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `shiftai_chat_${currentUser.id}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },
    clearChatHistory: () => {
        chatHistory.messages = [];
        saveToLocalStorage();
        if (isFirebaseConnected) {
            saveChatToFirebase();
        }
        showNotification('🗑️ Chat history cleared!', 'info');
    },
    isConnected: () => isFirebaseConnected
};

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + E to export chat history
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        window.shiftAI.exportChatHistory();
        showNotification('📥 Chat history exported!', 'success');
    }
    
    // Ctrl/Cmd + Shift + C to clear chat history
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        if (confirm('Are you sure you want to clear the chat history? This action cannot be undone.')) {
            window.shiftAI.clearChatHistory();
        }
    }
    
    // Escape to go back to intro
    if (e.key === 'Escape' && chatbotPopup.style.display !== 'none') {
        showIntroPage();
    }
});

// Initialize application
document.addEventListener("DOMContentLoaded", async () => {
    // Try to load existing user data
    const hasExistingData = loadFromLocalStorage();
    
    // Initialize Firebase connection
    await initializeFirebase();
    
    // Store initial bot message if no existing data
    if (!hasExistingData) {
        storeMessage('bot', "👋 Welcome back!\nI'm ShiftAI, your intelligent assistant. How can I help you today?");
    }
    
    console.log('ShiftAI initialized successfully');
    console.log('User ID:', currentUser.id);
    console.log('Session ID:', currentUser.sessionId);
    console.log('Firebase connected:', isFirebaseConnected);
    console.log('Available commands:');
    console.log('- Ctrl/Cmd + E: Export chat history');
    console.log('- Ctrl/Cmd + Shift + C: Clear chat history');
    console.log('- Escape: Back to intro page');
    console.log('- Access window.shiftAI for programmatic control');
});

// Handle window resize
window.addEventListener("resize", () => {
    scrollToBottom();
});

// Auto-save periodically
setInterval(() => {
    if (chatHistory.messages.length > 0) {
        saveToLocalStorage();
        if (isFirebaseConnected) {
            saveChatToFirebase();
        }
    }
}, 30000); // Save every 30 seconds

// Handle page visibility change
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        // Save when user leaves the page
        saveToLocalStorage();
        if (isFirebaseConnected) {
            saveChatToFirebase();
        }
    }
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    saveToLocalStorage();
    if (isFirebaseConnected) {
        saveChatToFirebase();
    }
});