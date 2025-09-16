function initResolutionAssistant() {
  // Updated to use the new local FastAPI endpoint
  const API_URL = "http://127.0.0.1:8000/api/chatbot/chat";

  const chatBox = document.getElementById('chat-box');
  const chatForm = document.getElementById('chat-form');
  const userInput = document.getElementById('user-input');

  // Auto-grow textarea as you type
  userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 100) + 'px';
  });

  function formatTime(date) {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    let minStr = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minStr} ${ampm}`;
  }

  function addMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message`;
    const cardDiv = document.createElement('div');
    cardDiv.className = `card ${sender}`;
    if (sender === 'assistant') {
      cardDiv.innerHTML = text; // Allow HTML for assistant to render <strong>
    } else {
      cardDiv.innerText = text;
    }
    const timestampDiv = document.createElement('div');
    timestampDiv.className = 'timestamp';
    timestampDiv.innerText = formatTime(new Date());

    msgDiv.appendChild(cardDiv);
    msgDiv.appendChild(timestampDiv);
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userText = userInput.value.trim();
    if (!userText) return;

    addMessage(userText, 'user');
    userInput.value = '';
    userInput.style.height = 'auto';

    const payload = {
      "user_query": userText
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('API error');
      const data = await response.json();

      // Get assistant response from the API's "response" field
      let reply = data.response || 'No response received.';
      // Replace **text** with <strong>text</strong>
      reply = reply.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      addMessage(reply, 'assistant');
    } catch (err) {
      addMessage('Sorry, there was an error connecting to the assistant.', 'assistant');
    }
  });

  // Initial greeting
  addMessage('Hello! Ask about an IDoc issue...', 'assistant');
}

// Make it globally available
window.initResolutionAssistant = initResolutionAssistant;
window.addEventListener('DOMContentLoaded', function() {
  initResolutionAssistant();
});