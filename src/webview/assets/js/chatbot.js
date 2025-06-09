// VSCode API
const vscode = acquireVsCodeApi();

// DOM Elements
const messagesContainer = document.getElementById("messagesContainer");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const welcomeMessage = document.getElementById("welcomeMessage");
const messageTemplate = document.getElementById("messageTemplate");

// State
let isProcessing = false;

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  messageInput.focus();
  setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
  // Form submission
  messageForm.addEventListener("submit", handleSubmit);

  // Input validation
  messageInput.addEventListener("input", handleInputChange);

  // Enter key handling
  messageInput.addEventListener("keydown", handleKeyDown);
}

// Handle form submission
function handleSubmit(e) {
  e.preventDefault();

  if (isProcessing) {
    return;
  }

  const message = messageInput.value.trim();
  if (!message || message.length > 1000) {
    return;
  }

  sendMessage(message);
}

// Handle input changes
function handleInputChange() {
  const message = messageInput.value.trim();
  const isValid = message.length > 0 && message.length <= 1000;

  sendButton.disabled = !isValid || isProcessing;

  // Update character count (if needed)
  // Could add character counter here
}

// Handle key down events
function handleKeyDown(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSubmit(e);
  }
}

// Send message to extension
function sendMessage(text) {
  if (isProcessing) {
    return;
  }

  setProcessingState(true);

  vscode.postMessage({
    command: "sendMessage",
    data: { text },
  });

  messageInput.value = "";
}

// Set processing state
function setProcessingState(processing) {
  isProcessing = processing;
  sendButton.disabled = processing;
  sendButton.textContent = processing ? "Đang gửi..." : "Gửi";
  messageInput.disabled = processing;

  if (processing) {
    sendButton.classList.add("opacity-50", "cursor-not-allowed");
  } else {
    sendButton.classList.remove("opacity-50", "cursor-not-allowed");
    messageInput.focus();
  }
}

// Add message to chat
function addMessage(message) {
  try {
    console.log("Adding message:", message);

    // Remove welcome message if it exists
    if (welcomeMessage && welcomeMessage.parentNode) {
      welcomeMessage.remove();
    }

    // Clone template
    const messageElement = messageTemplate.content.cloneNode(true);
    const messageDiv = messageElement.querySelector(".message");
    const avatarDiv = messageDiv.querySelector(".message-avatar");
    const textDiv = messageDiv.querySelector(".message-text");
    const timeDiv = messageDiv.querySelector(".message-time");

    if (!messageDiv || !avatarDiv || !textDiv || !timeDiv) {
      console.error("Template elements not found");
      return;
    }

    // Set message type classes for sidebar
    if (message.isUser) {
      messageDiv.classList.add("flex-row-reverse");
      avatarDiv.classList.remove("bg-blue-500");
      avatarDiv.classList.add("bg-green-500");
      textDiv.classList.remove("bg-gray-100", "dark:bg-gray-700");
      textDiv.classList.add("bg-green-500", "text-white");
    } else {
      avatarDiv.classList.add("bg-blue-500");
      // Keep default gray background for bot messages
    }

    // Fill in content
    avatarDiv.textContent = message.isUser ? "👤" : "🤖";
    textDiv.textContent = message.text || "No message text";
    timeDiv.textContent = message.timestamp || new Date().toLocaleTimeString();

    // Add to container
    messagesContainer.appendChild(messageElement);

    // Scroll to bottom
    scrollToBottom();

    console.log("Message added successfully");
  } catch (error) {
    console.error("Error adding message:", error);
  }

  // Re-enable form after processing
  setProcessingState(false);
}

// Scroll to bottom of messages
function scrollToBottom() {
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Handle messages from extension
window.addEventListener("message", (event) => {
  console.log("Received message from extension:", event.data);
  const message = event.data;

  switch (message.command) {
    case "addMessage":
      console.log("Processing addMessage:", message.data);
      addMessage(message.data.message);
      break;

    case "clearChat":
      console.log("Processing clearChat");
      clearChat();
      break;

    default:
      console.warn("Unknown command:", message.command);
  }
});

// Clear chat
function clearChat() {
  messagesContainer.innerHTML = `
        <div id="welcomeMessage" class="text-center text-gray-600 dark:text-gray-400 py-4 px-2 text-sm italic">
            👋 Xin chào! Tôi là TomiChat, trợ lý AI giúp bạn tạo ra những câu chuyện thú vị.<br>
            Hãy chia sẻ ý tưởng của bạn và tôi sẽ giúp phát triển thành một câu chuyện tuyệt vời!
        </div>
    `;
  setProcessingState(false);
}

// Utility functions
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
