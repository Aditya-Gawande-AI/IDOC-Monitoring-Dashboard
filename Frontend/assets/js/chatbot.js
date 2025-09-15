// Chatbot logic (idempotent initializer)
(function () {
  function initChatbot() {
    // Avoid creating multiple instances
    if (document.querySelector('.chatbot-float-btn')) return;

    // Create floating button
    var floatBtn = document.createElement('div');
    floatBtn.className = 'chatbot-float-btn';
    floatBtn.style.zIndex = '2147483647';
    floatBtn.innerHTML = '<i class="fa-solid fa-message"></i>';
    document.body.appendChild(floatBtn);

    // Create chatbot window
    var chatbotWindow = document.createElement('div');
    chatbotWindow.className = 'chatbot-window';
    chatbotWindow.style.zIndex = '2147483647';
    chatbotWindow.style.display = 'none';
    chatbotWindow.innerHTML = '\n    <div class="chatbot-header">\n      Chatbot Assistant\n      <button class="chatbot-close" title="Close">&times;</button>\n    </div>\n    <div class="chatbot-messages" id="chatbotMessages"></div>\n    <form class="chatbot-input-row" autocomplete="off">\n      <input type="text" class="chatbot-input" placeholder="Type your question..." required />\n      <button type="submit" class="chatbot-send-btn"><i class="fa-regular fa-paper-plane"></i></button>\n    </form>\n  ';
    document.body.appendChild(chatbotWindow);

    // Show/hide logic: toggle window on float button click
    var greeted = false; // track whether we already greeted this session
    floatBtn.onclick = function () {
      var isOpen = chatbotWindow.style.display === 'flex' || chatbotWindow.style.display === '' && window.getComputedStyle(chatbotWindow).display === 'flex';
      if (isOpen) {
        chatbotWindow.style.display = 'none';
        // restore float button visibility (let CSS control it if body.show-chatbot exists)
        floatBtn.style.display = '';
      } else {
        chatbotWindow.style.display = 'flex';
        // hide the float button while the window is open
        floatBtn.style.display = 'none';
        // show a one-time greeting message when opened first time
        if (!greeted) {
          greeted = true;
          addMessage('Hello, I am your assistant. How can I help you?', 'bot');
        }
      }
    };
    chatbotWindow.querySelector('.chatbot-close').onclick = function () {
      chatbotWindow.style.display = 'none';
      // delegate display back to CSS (clear inline override) so body.show-chatbot controls visibility
      floatBtn.style.display = '';
    };


    // we should close the window and ensure the float button is hidden.
    var bodyObserver = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          var has = document.body.classList.contains('show-chatbot');
          if (!has) {
            // Hide window and restore float button to be controlled by CSS (clear inline display)
            try {
              chatbotWindow.style.display = 'none';
            } catch (e) {}
            try {
              floatBtn.style.display = 'none';
            } catch (e) {}
          } else {
            // When the class is added back, ensure the window is closed and float button is visible
            try { chatbotWindow.style.display = 'none'; } catch (e) {}
            try { floatBtn.style.display = ''; } catch (e) {}
          }
        }
      });
    });
    bodyObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    // This will disconnect the observer and remove DOM nodes created by the chatbot.
    window.__chatbot_teardown = function () {
      try { bodyObserver.disconnect(); } catch (e) {}
      try {
        var f = document.querySelector('.chatbot-float-btn'); if (f) f.remove();
      } catch (e) {}
      try {
        var w = document.querySelector('.chatbot-window'); if (w) w.remove();
      } catch (e) {}
      try { delete window.__chatbot_teardown; } catch (e) {}
    };

    // Message logic
    var messagesDiv = chatbotWindow.querySelector('#chatbotMessages');
    var inputForm = chatbotWindow.querySelector('form');
    var inputBox = chatbotWindow.querySelector('.chatbot-input');
    var sendBtn = chatbotWindow.querySelector('.chatbot-send-btn');

    function addMessage(text, sender) {
      var msgDiv = document.createElement('div');
      msgDiv.className = 'chatbot-message ' + sender;
      var bubble = document.createElement('div');
      bubble.className = 'chatbot-bubble';
      bubble.textContent = text;
      msgDiv.appendChild(bubble);
      messagesDiv.appendChild(msgDiv);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    function addLoading() {
      var msgDiv = document.createElement('div');
      msgDiv.className = 'chatbot-message bot';
      var bubble = document.createElement('div');
      bubble.className = 'chatbot-bubble';
      bubble.innerHTML = '<span class="chatbot-loading"><span></span><span></span><span></span></span>';
      msgDiv.appendChild(bubble);
      msgDiv.classList.add('chatbot-loading-msg');
      messagesDiv.appendChild(msgDiv);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
      return msgDiv;
    }

    inputForm.onsubmit = function (e) {
      e.preventDefault();
      var userText = inputBox.value.trim();
      if (!userText) return;
      addMessage(userText, 'user');
      inputBox.value = '';
      sendBtn.disabled = true;
      var loadingMsg = addLoading();
      // Send POST request to AI API
      fetch('https://ai-bis.cfapps.eu10.hana.ondemand.com/AIAgent/getAI_response/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          system_prompt: 'you are helpful assistant',
          user_prompt: userText
        })
      })
        .then(function (response) {
          if (!response.ok) throw new Error('Network response was not ok');
          return response.json();
        })
        .then(function (data) {
          loadingMsg.remove();
          // Prefer `ai_response` if present, otherwise fall back to other keys
          var botReply = (data && (data.ai_response || data.response || data.result)) || 'No response';
          addMessage(botReply, 'bot');
          sendBtn.disabled = false;
        })
        .catch(function (error) {
          loadingMsg.remove();
          addMessage('Sorry, there was an error fetching the response.', 'bot');
          sendBtn.disabled = false;
        });
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatbot);
  } else {
    // If DOM already loaded, init immediately
    initChatbot();
  }
})();
