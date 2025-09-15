function initResolutionAssistant() {
  // Replace these with your actual credentials
  const API_URL = "https://ai-bis.cfapps.eu10.hana.ondemand.com/AIAgent/getAI_response/";
  const USERNAME = "10837890";
  const PASSWORD = "Sunday@2025";

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
    cardDiv.innerText = text;

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
      "system_prompt": "you are helpful assistant",
      "user_prompt": userText
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${USERNAME}:${PASSWORD}`),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('API error');
      const data = await response.json();

      // Format assistant response for readability
      let reply = data.ai_response || 'No response received.';
      // You can add formatting logic here if needed

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