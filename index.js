const messageInput = document.querySelector(".message-input");
const chatbotBody = document.querySelector(".chatbot-messages");
const sendMessageButton = document.querySelector("#send-message");
const closeButton = document.querySelector("#close-chatbot");
const chatForm = document.querySelector(".chat-form");

// API Configuration
const API_KEY = "AIzaSyAbKbDfO3zXS7j7_kyupUmCuVxuQiRzaao";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

const userData = {
    message: null
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

// Enhanced bot response generation with better error handling
const generateBotResponse = async (incomingMessageDiv) => {
    const messageElement = incomingMessageDiv.querySelector(".bot-msgs-text");
    
    const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: userData.message }]
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
            // Simulate typing effect
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

// Handle outgoing messages with improved UX
const handleOutGoingMsg = (e) => {
    e.preventDefault();
    
    const message = messageInput.value.trim();
    if (!message) return;
    
    userData.message = message;
    messageInput.value = "";
    messageInput.style.height = 'auto';
    
    // Create and display user message
    const messageContent = `
        <div class="enter-msgs-text"></div>
        <i id="user-logo" class="bi bi-person-circle"></i>
    `;
    
    const outgoingMessageDiv = createMessageElement(messageContent, "enter-msgs");
    outgoingMessageDiv.querySelector(".enter-msgs-text").textContent = message;
    chatbotBody.appendChild(outgoingMessageDiv);
    scrollToBottom();

    // Show bot thinking indicator after a short delay
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

// Enhanced event listeners
messageInput.addEventListener("input", autoResizeTextarea);

messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const userMessage = e.target.value.trim();
        if (userMessage) {
            handleOutGoingMsg(e);
        }
    }
});

chatForm.addEventListener("submit", handleOutGoingMsg);

// Close button functionality (minimize effect)
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