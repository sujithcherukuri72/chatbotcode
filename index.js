const messageInput = document.querySelector(".message-input");
const chatbotBody = document.querySelector(".chatbot-messages");
const sendMessageButton = document.querySelector("#send-message");
const closeButton = document.querySelector("#close-chatbot");
const chatForm = document.querySelector(".chat-form");
const emojiButton = document.querySelector("#emoji-button");
const fileButton = document.querySelector("#file-button");
const fileInput = document.querySelector("#file-input");
const emojiPicker = document.querySelector("#emoji-picker");
const emojiGrid = document.querySelector("#emoji-grid");
const filePreviewArea = document.querySelector("#file-preview-area");
const removeFileButton = document.querySelector("#remove-file");

// API Configuration
const API_KEY = "AIzaSyAbKbDfO3zXS7j7_kyupUmCuVxuQiRzaao";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

const userData = {
    message: null,
    file: null
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

// Create message elements with improved structure
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
        'webp': 'bi-file-earmark-image'
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
        alert('File size must be less than 10MB');
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

// Enhanced bot response generation with file handling
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
        } else {
            throw new Error('No response received');
        }
        
    } catch (error) {
        console.error('Error:', error);
        messageElement.innerHTML = `
            <p style="color: #ef4444;">
                <i class="bi bi-exclamation-triangle"></i> 
                Sorry, I'm having trouble connecting right now. Please try again in a moment.
            </p>
        `;
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

// Handle outgoing messages with file support
const handleOutGoingMsg = async (e) => {
    e.preventDefault();
    
    const message = messageInput.value.trim();
    if (!message && !userData.file) return;
    
    userData.message = message || "📎 File attached";
    const currentFile = userData.file;
    
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

// Close overlays when clicking outside
const closeOverlays = (e) => {
    if (!emojiPicker.contains(e.target) && !emojiButton.contains(e.target)) {
        emojiPicker.classList.remove('show');
        emojiButton.classList.remove('active');
    }
};

// Enhanced event listeners
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

// Emoji picker events
emojiButton.addEventListener("click", (e) => {
    e.stopPropagation();
    showEmojiPicker();
});

// Emoji category selection
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('emoji-category')) {
        // Remove active class from all categories
        document.querySelectorAll('.emoji-category').forEach(cat => cat.classList.remove('active'));
        // Add active class to clicked category
        e.target.classList.add('active');
        // Load emojis for selected category
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
    const popup = document.querySelector(".chatbot-popup");
    popup.style.transform = "scale(0.8) translateY(20px)";
    popup.style.opacity = "0.7";
    
    setTimeout(() => {
        popup.style.transform = "scale(1) translateY(0)";
        popup.style.opacity = "1";
    }, 300);
});

// Initialize
document.addEventListener("DOMContentLoaded", () => {
    messageInput.focus();
    scrollToBottom();
});

// Handle window resize
window.addEventListener("resize", () => {
    scrollToBottom();
});