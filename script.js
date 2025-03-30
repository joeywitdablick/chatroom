// DOM Elements
const usernameInput = document.getElementById('username-input');
const setUsernameBtn = document.getElementById('set-username-btn');
const codeDisplay = document.getElementById('code-display');
const codeEditor = document.getElementById('code-editor');
const languageSelect = document.getElementById('language-select');
const runCodeBtn = document.getElementById('run-code-btn');
const codeOutput = document.getElementById('code-output');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const userCount = document.getElementById('user-count');
const userList = document.getElementById('user-list');

// App State
let currentUser = {
    id: generateUserId(),
    name: 'Anonymous' + Math.floor(Math.random() * 1000)
};
let users = [];
let messages = [];
let currentCode = '';
let currentLanguage = 'javascript';

// Initialize the app
function init() {
    usernameInput.value = currentUser.name;
    
    // Set up event listeners
    setUsernameBtn.addEventListener('click', setUsername);
    languageSelect.addEventListener('change', changeLanguage);
    runCodeBtn.addEventListener('click', runCode);
    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', handleChatKeydown);
    codeEditor.addEventListener('input', updateCode);
    
    // Initialize code editor
    codeEditor.value = '// Start typing your code here\nconsole.log("Hello, world!");';
    updateCode();
    
    // Simulate WebSocket connection
    simulateConnection();
}

// Generate a random user ID
function generateUserId() {
    return Math.random().toString(36).substring(2, 15);
}

// Set username
function setUsername() {
    const newUsername = usernameInput.value.trim();
    if (newUsername) {
        const oldUsername = currentUser.name;
        currentUser.name = newUsername;
        
        // Add system message about username change
        addSystemMessage(`${oldUsername} changed their name to ${newUsername}`);
        
        // Update user in the users list
        const userIndex = users.findIndex(user => user.id === currentUser.id);
        if (userIndex !== -1) {
            users[userIndex].name = newUsername;
        }
        
        updateUsersList();
    }
}

// Change the programming language
function changeLanguage() {
    currentLanguage = languageSelect.value;
    codeDisplay.className = `language-${currentLanguage}`;
    highlightCode();
}

// Update code in the editor
function updateCode() {
    currentCode = codeEditor.value;
    codeDisplay.textContent = currentCode;
    highlightCode();
}

// Highlight code using highlight.js
function highlightCode() {
    hljs.highlightElement(codeDisplay);
}

// Run the code
function runCode() {
    codeOutput.innerHTML = '';
    
    try {
        if (currentLanguage === 'javascript') {
            // Capture console.log output
            const originalLog = console.log;
            const logs = [];
            
            console.log = function(...args) {
                logs.push(args.map(arg => 
                    typeof arg === 'object' ? JSON.stringify(arg) : arg
                ).join(' '));
                originalLog.apply(console, args);
            };
            
            // Execute the code
            eval(currentCode);
            
            // Restore console.log
            console.log = originalLog;
            
            // Display output
            logs.forEach(log => {
                const logElement = document.createElement('div');
                logElement.textContent = log;
                codeOutput.appendChild(logElement);
            });
        } else {
            codeOutput.textContent = `Running ${currentLanguage} code is not supported in this demo. In a real application, this would be sent to a server for execution.`;
        }
    } catch (error) {
        const errorElement = document.createElement('div');
        errorElement.textContent = `Error: ${error.message}`;
        errorElement.style.color = 'red';
        codeOutput.appendChild(errorElement);
    }
}

// Send a chat message
function sendMessage() {
    const messageText = chatInput.value.trim();
    if (messageText) {
        // Check if it's a code update command
        if (messageText.startsWith('/code ')) {
            const newCode = messageText.substring(6);
            codeEditor.value = newCode;
            updateCode();
            
            // Add message with code snippet
            addMessage({
                userId: currentUser.id,
                username: currentUser.name,
                text: 'Updated the code:',
                code: newCode,
                timestamp: new Date().toISOString()
            });
        } else {
            // Regular message
            addMessage({
                userId: currentUser.id,
                username: currentUser.name,
                text: messageText,
                timestamp: new Date().toISOString()
            });
        }
        
        chatInput.value = '';
    }
}

// Handle keydown in chat input
function handleChatKeydown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// Add a message to the chat
function addMessage(message) {
    messages.push(message);
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${message.userId === currentUser.id ? 'own' : 'other'}`;
    
    const headerElement = document.createElement('div');
    headerElement.className = 'message-header';
    
    const usernameElement = document.createElement('span');
    usernameElement.textContent = message.username;
    
    const timeElement = document.createElement('span');
    timeElement.textContent = new Date(message.timestamp).toLocaleTimeString();
    
    headerElement.appendChild(usernameElement);
    headerElement.appendChild(timeElement);
    
    const contentElement = document.createElement('div');
    contentElement.className = 'message-content';
    contentElement.textContent = message.text;
    
    messageElement.appendChild(headerElement);
    messageElement.appendChild(contentElement);
    
    // Add code snippet if present
    if (message.code) {
        const codeElement = document.createElement('pre');
        codeElement.className = 'code-snippet';
        codeElement.textContent = message.code;
        messageElement.appendChild(codeElement);
    }
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Simulate sending to other users
    if (message.userId === currentUser.id) {
        setTimeout(() => {
            simulateReceiveMessage(message);
