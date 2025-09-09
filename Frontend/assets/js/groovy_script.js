// Function to explain a Groovy script using the AI API
function explainGroovyScript(groovyScript, onSuccess, onError) {
  const system_prompt = `You are a Groovy Script Explainer AI.
Your role is to analyze and interpret Groovy scripts provided by the user.
For each script:
- Break down the logic step-by-step in clear, beginner-friendly language.
- Explain the purpose of each function, condition, and operation.
- Highlight how the script fits into a broader business process or solves a specific business need (e.g., data transformation, validation, integration, automation).
- Avoid jargon unless necessary, and define any technical terms used.
- If the script interacts with external systems (e.g., SAP, APIs, databases), describe the business rationale behind those interactions.
Your goal is to help the reader not only understand what the script does, but why it matters in a business context.
`;

  const payload = {
    system_prompt: system_prompt,
    user_prompt: groovyScript,
  };

  $.ajax({
    url: `${fe_url}/AIAgent/getAI_response/`,
    type: "POST",
    data: JSON.stringify(payload),
    contentType: "application/json",
    success: function (response) {
      if (onSuccess) {
        onSuccess(response.ai_response);
      }
    },
    error: function (xhr, status, error) {
      if (onError) {
        onError(error);
      }
    }
  });
}
// --- Payload Modal Editor Logic ---
// --- Groovy Explainer File Upload & Edit Modal Logic ---
// Modal creation for Groovy Explainer edit (if not present)
function ensureGroovyExplainerEditModal() {
    if (!document.getElementById('groovyExplainerEditModal')) {
        var modalHtml = `
        <div class="modal fade" id="groovyExplainerEditModal" tabindex="-1" role="dialog" aria-labelledby="groovyExplainerEditModalLabel" aria-hidden="true">
            <div class="modal-dialog" role="document">
                <div class="modal-content" style="border-radius:12px;">
                    <div class="modal-body" style="padding:25px 10px 5px 10px; position:relative;">
                        <textarea id="groovyExplainerEditModalTextarea" style="width:100%; min-height: 350px; max-height:450px; border-radius:8px; border:1px solid #d1d5db; padding:8px; font-size:13px; resize:vertical; overflow-y:auto; resize:none; margin-top:10px; outline:none;"></textarea>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close" style="background:none; border:none; outline:none; font-size:26px; color:#000000; position:absolute; top:8px; right:12px; z-index:2;">
                            <span class="material-icons" title="Close">close</span>
                        </button>
                    </div>
                    <div class="" style=" display:flex; justify-content:space-around; gap:18px; border-top:none; ">
                        <button type="button" id="groovyExplainerEditModalRevert" style="background:none; border:none; outline:none; font-size:22px; color:#6c757d;">
                            <span class="material-icons" title="Revert">undo</span>
                        </button>
                        <button type="button" id="groovyExplainerEditModalSave" style="background:none; border:none; outline:none; font-size:22px; color:#2149ae;">
                            <span class="material-icons" title="Save">save</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }
}

// File upload handler for Groovy Explainer
function handleGroovyExplainerFileUpload(textareaId, inputElem) {
    const file = inputElem.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        document.getElementById(textareaId).value = e.target.result;
    };
    reader.readAsText(file);
}

// Edit modal logic for Groovy Explainer
let currentGroovyExplainerTextarea = null;
let originalGroovyExplainerValue = '';
function openGroovyExplainerEditModal(textareaId) {
    ensureGroovyExplainerEditModal();
    currentGroovyExplainerTextarea = document.getElementById(textareaId);
    if (!currentGroovyExplainerTextarea) return;
    originalGroovyExplainerValue = currentGroovyExplainerTextarea.value;
    document.getElementById('groovyExplainerEditModalTextarea').value = originalGroovyExplainerValue;
    $('#groovyExplainerEditModal').modal('show');
}

// Attach modal save/revert logic after DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    ensureGroovyExplainerEditModal();
    // Save
    var saveBtn = document.getElementById('groovyExplainerEditModalSave');
    if (saveBtn) {
        saveBtn.onclick = function() {
            if (currentGroovyExplainerTextarea) {
                currentGroovyExplainerTextarea.value = document.getElementById('groovyExplainerEditModalTextarea').value;
            }
            $('#groovyExplainerEditModal').modal('hide');
        };
    }
    // Revert
    var revertBtn = document.getElementById('groovyExplainerEditModalRevert');
    if (revertBtn) {
        revertBtn.onclick = function() {
            document.getElementById('groovyExplainerEditModalTextarea').value = originalGroovyExplainerValue;
        };
    }
    // Clear state on close
    $('#groovyExplainerEditModal').on('hidden.bs.modal', function () {
        currentGroovyExplainerTextarea = null;
        originalGroovyExplainerValue = '';
    });
});
// Track which payload field is being edited
let currentPayloadField = null;
let originalPayloadValue = '';

// Helper: Open modal for a given textarea id
function openPayloadModal(textareaId) {
    currentPayloadField = document.getElementById(textareaId);
    if (!currentPayloadField) return;
    originalPayloadValue = currentPayloadField.value;
    document.getElementById('payloadModalTextarea').value = originalPayloadValue;
    // Show modal (Bootstrap 4/5 compatible)
    $('#payloadModal').modal('show');
}

// Attach click listeners to all edit icons for payloads, property, and header (welcome + chat screens)
function attachPayloadEditListeners() {
    // Payload fields (welcome screen)
    const inboundWelcomeEdit = document.querySelector('#inboundPayload-welcome').parentElement.querySelectorAll('.material-icons');
    inboundWelcomeEdit.forEach(icon => {
        if (icon.textContent.trim() === 'edit') {
            icon.onclick = function(e) {
                e.preventDefault();
                openPayloadModal('inboundPayload-welcome');
            };
        }
    });
    const outboundWelcomeEdit = document.querySelector('#outboundPayload-welcome').parentElement.querySelectorAll('.material-icons');
    outboundWelcomeEdit.forEach(icon => {
        if (icon.textContent.trim() === 'edit') {
            icon.onclick = function(e) {
                e.preventDefault();
                openPayloadModal('outboundPayload-welcome');
            };
        }
    });
    // Payload fields (chat screen)
    const inboundEdit = document.querySelector('#inboundPayload').parentElement.querySelectorAll('.material-icons');
    inboundEdit.forEach(icon => {
        if (icon.textContent.trim() === 'edit') {
            icon.onclick = function(e) {
                e.preventDefault();
                openPayloadModal('inboundPayload');
            };
        }
    });
    const outboundEdit = document.querySelector('#outboundPayload').parentElement.querySelectorAll('.material-icons');
    outboundEdit.forEach(icon => {
        if (icon.textContent.trim() === 'edit') {
            icon.onclick = function(e) {
                e.preventDefault();
                openPayloadModal('outboundPayload');
            };
        }
    });

    // Property fields (welcome + chat, dynamic)
    document.querySelectorAll('[id^="propertyValue-welcome-"] ~ .material-icons, [id^="propertyValue-"] ~ .material-icons').forEach(icon => {
        const textarea = icon.parentElement.querySelector('textarea');
        if (textarea) {
            icon.onclick = function(e) {
                e.preventDefault();
                openPayloadModal(textarea.id);
            };
        }
    });
    // Header fields (welcome + chat, dynamic)
    document.querySelectorAll('[id^="headerValue-welcome-"] ~ .material-icons, [id^="headerValue-"] ~ .material-icons').forEach(icon => {
        const textarea = icon.parentElement.querySelector('textarea');
        if (textarea) {
            icon.onclick = function(e) {
                e.preventDefault();
                openPayloadModal(textarea.id);
            };
        }
    });
}

// Modal: Save and Revert button logic
document.addEventListener('DOMContentLoaded', function() {
    // Attach listeners after DOM is ready
    attachPayloadEditListeners();
    attachChatScreenResetIconListeners();

    // Save Change
    const saveBtn = document.getElementById('payloadModalSave');
    if (saveBtn) {
        saveBtn.onclick = function() {
            if (currentPayloadField) {
                currentPayloadField.value = document.getElementById('payloadModalTextarea').value;
            }
            $('#payloadModal').modal('hide');
        };
    }
    // Revert Change
    const revertBtn = document.getElementById('payloadModalRevert');
    if (revertBtn) {
        revertBtn.onclick = function() {
            document.getElementById('payloadModalTextarea').value = originalPayloadValue;
        };
    }
    // When modal closes, clear state
    $('#payloadModal').on('hidden.bs.modal', function () {
        currentPayloadField = null;
        originalPayloadValue = '';
    });
});
// Handle payload toggle for welcome screen
document.getElementById('payloadToggle-welcome').addEventListener('change', function () {
  const payloadSection = document.getElementById('payloadInputs-welcome');
  payloadSection.style.display = this.checked ? 'block' : 'none';
  if (this.checked) {
    payloadSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

// Reset function for welcome screen payloads
function resetPayloadInputsWelcome() {
  document.getElementById('payloadToggle-welcome').checked = false;
  document.getElementById('payloadInputs-welcome').style.display = 'none';
  document.getElementById('inboundPayload-welcome').value = '';
  document.getElementById('outboundPayload-welcome').value = '';
  document.getElementById('welcome-search-bar').value = '';
}
function addUserInput() {
  const input = document.getElementById('search-bar').value.trim();
  const isChecked = document.getElementById('payloadToggle').checked;

  // Gather property values only if propertyToggle is checked
  let propertyValues = [];
  if (document.getElementById('propertyToggle').checked) {
    const propertySection = document.getElementById('propertyValuesContainer');
    if (propertySection) {
      const propertyTextareas = propertySection.querySelectorAll('textarea');
      propertyTextareas.forEach(t => {
        if (t.value.trim() !== '') propertyValues.push(t.value.trim());
      });
    } else if (document.getElementById('propertyValue')) {
      const val = document.getElementById('propertyValue').value.trim();
      if (val !== '') propertyValues.push(val);
    }
  }

  // Gather header values only if headerToggle is checked
  let headerValues = [];
  if (document.getElementById('headerToggle').checked) {
    const headerSection = document.getElementById('headerValuesContainer');
    if (headerSection) {
      const headerTextareas = headerSection.querySelectorAll('textarea');
      headerTextareas.forEach(t => {
        if (t.value.trim() !== '') headerValues.push(t.value.trim());
      });
    } else if (document.getElementById('headerValue')) {
      const val = document.getElementById('headerValue').value.trim();
      if (val !== '') headerValues.push(val);
    }
  }

  // Check for empty required fields with specific warnings
  if (input === '') {
    Fnon.Hint.Warning('Please enter a prompt.');
    return;
  }
  if (document.getElementById('propertyToggle').checked && propertyValues.length === 0) {
    Fnon.Hint.Warning('Please fill all property fields.');
    return;
  }
  if (document.getElementById('headerToggle').checked && headerValues.length === 0) {
    Fnon.Hint.Warning('Please fill all header fields.');
    return;
  }
  if (isChecked && document.getElementById('inboundPayload').value.trim() === '') {
    Fnon.Hint.Warning('Please fill the inbound payload.');
    return;
  }
  if (isChecked && document.getElementById('outboundPayload').value.trim() === '') {
    Fnon.Hint.Warning('Please fill the outbound payload.');
    return;
  }

  let combinedPrompt = input;
  // Only add property = ... if propertyToggle is checked
  if (propertyValues.length > 0) {
    combinedPrompt += (combinedPrompt ? '\n' : '') + 'property = ' + propertyValues.join(', ');
  }
  // Only add header = ... if headerToggle is checked
  if (headerValues.length > 0) {
    combinedPrompt += (combinedPrompt ? '\n' : '') + 'header = ' + headerValues.join(', ');
  }

  if (isChecked) {
    const inbound = document.getElementById('inboundPayload').value.trim();
    const outbound = document.getElementById('outboundPayload').value.trim();
    combinedPrompt += `\n\nSample Inbound Payload:\n${inbound}\n\nSample Outbound Payload:\n${outbound}`;
  }

  if (combinedPrompt) {
    // Escape HTML special characters
    function escapeHtml(text) {
      return text.replace(/&/g, "&amp;")
                 .replace(/</g, "&lt;")
                 .replace(/>/g, "&gt;");
    }
    const escapedPrompt = escapeHtml(combinedPrompt);
    let userBubble = "";
    // If prompt contains line breaks or looks like code/XML, use <pre><code>
    if (/\n|<|>|\{|\}|\[|\]|\(|\)/.test(combinedPrompt)) {
      userBubble = `<div class=\"chat-bubble user-bubble\" style=\"font-size:10px; white-space:pre-wrap;\"><pre style='margin:0; background:none; border:none; font-size:inherit; font-family:inherit;'><code>${escapedPrompt}</code></pre></div>`;
    } else {
      userBubble = `<div class=\"chat-bubble user-bubble\" style=\"font-size:10px; white-space:pre-wrap;\">${escapedPrompt}</div>`;
    }
    document.getElementById('chat-response').insertAdjacentHTML('beforeend', userBubble);

    const typingBubble = `
      <div class=\"chat-bubble ai-bubble loading\" id=\"typing-bubble\" style=\"font-size:10px\">
        <div class=\"typing-dots\">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    document.getElementById('chat-response').insertAdjacentHTML('beforeend', typingBubble);

    const chatContainer = document.querySelector('.chat-box-wrapper');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    getGenAIRecommendations(combinedPrompt);
    document.getElementById('search-bar').value = '';
    document.getElementById('payloadToggle').checked = false;
    document.getElementById('payloadInputs').style.display = 'none';
  }
}

function resetPayloadInputs() {
  document.getElementById('payloadToggle').checked = false;
  document.getElementById('payloadInputs').style.display = 'none';
  document.getElementById('inboundPayload').value = '';
  document.getElementById('outboundPayload').value = '';
  document.getElementById('search-bar').value = '';
  const chatResponse = document.getElementById('chat-response');
  if (chatResponse) {
    chatResponse.innerHTML = '';
  }
  // Also reset property and header (dynamic fields)
  if (typeof resetPropertyInputsAndFields === 'function') {
    resetPropertyInputsAndFields();
  } else if (typeof resetPropertyInputs === 'function') {
    resetPropertyInputs();
  }
  if (typeof resetHeaderInputsAndFields === 'function') {
    resetHeaderInputsAndFields();
  } else if (typeof resetHeaderInputs === 'function') {
    resetHeaderInputs();
  }
}
function resetPayloadInputsWelcome() {
  document.getElementById('payloadToggle-welcome').checked = false;
  document.getElementById('payloadInputs-welcome').style.display = 'none';
  document.getElementById('inboundPayload-welcome').value = '';
  document.getElementById('outboundPayload-welcome').value = '';
  document.getElementById('welcome-search-bar').value = '';
  if (typeof resetPropertyInputsAndFieldsWelcome === 'function') {
    resetPropertyInputsAndFieldsWelcome();
  }
  if (typeof resetHeaderInputsAndFieldsWelcome === 'function') {
    resetHeaderInputsAndFieldsWelcome();
  }
}

function resetPropertyInputs() {
    document.getElementById('propertyToggle').checked = false;
    document.getElementById('propertyInputs').style.display = 'none';
    document.getElementById('propertyValue').value = '';
}

function resetHeaderInputs() {
    document.getElementById('headerToggle').checked = false;
    document.getElementById('headerInputs').style.display = 'none';
    document.getElementById('headerValue').value = '';
}

document.getElementById('propertyToggle').addEventListener('change', function () {
    const propertySection = document.getElementById('propertyInputs');
    const propertyIcons = document.getElementById('propertyIconsWrapper');
    propertySection.style.display = this.checked ? 'block' : 'none';
    if (propertyIcons) propertyIcons.style.display = this.checked ? 'flex' : 'none';
    if (this.checked) {
        propertySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
});
document.getElementById('headerToggle').addEventListener('change', function () {
    const headerSection = document.getElementById('headerInputs');
    const headerIcons = document.getElementById('headerIconsWrapper');
    headerSection.style.display = this.checked ? 'block' : 'none';
    if (headerIcons) headerIcons.style.display = this.checked ? 'flex' : 'none';
    if (this.checked) {
        headerSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
});
document.getElementById('propertyToggle-welcome').addEventListener('change', function () {
    const propertySection = document.getElementById('propertyInputs-welcome');
    const propertyIcons = document.getElementById('propertyIconsWrapper-welcome');
    propertySection.style.display = this.checked ? 'block' : 'none';
    if (propertyIcons) propertyIcons.style.display = this.checked ? 'flex' : 'none';
    if (this.checked) {
        propertySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
});
document.getElementById('headerToggle-welcome').addEventListener('change', function () {
    const headerSection = document.getElementById('headerInputs-welcome');
    const headerIcons = document.getElementById('headerIconsWrapper-welcome');
    headerSection.style.display = this.checked ? 'block' : 'none';
    if (headerIcons) headerIcons.style.display = this.checked ? 'flex' : 'none';
    if (this.checked) {
        headerSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
});



function getGenAIRecommendations(comparisonResult) {
  const system_prompt = "Consider you are SAP CPI expert and give output with SAP CPI compatible simplified groovy script along with explanation and documentation for the same.";

  const payload = {
    system_prompt: system_prompt,
    user_prompt: comparisonResult,
  };

  $.ajax({
    url: `${fe_url}/AIAgent/getAI_response/`,
    type: "POST",
    data: JSON.stringify(payload),
    contentType: "application/json",
    success: function (response) {
      let scriptText = response.ai_response;
      // Escape HTML special characters
      function escapeHtml(text) {
        return text.replace(/&/g, "&amp;")
                   .replace(/</g, "&lt;")
                   .replace(/>/g, "&gt;");
      }
      let formattedText = escapeHtml(scriptText);
      formattedText = `<pre style='margin:0; background:none; border:none; font-size:inherit; font-family:inherit; white-space:pre-wrap;'><code>${formattedText}</code></pre>`;

      // Add a copy code icon to the top right of the AI response bubble
      const copyIcon = `<span class="material-icons ai-copy-icon" title="Copy AI response" style="position:absolute; top:10px; right:10px; cursor:pointer; color:#7534d1; font-size:20px; z-index:2;">content_copy</span>`;
      const aiBubble = `<div class="chat-bubble ai-bubble" style="position:relative; padding:0; border-radius:8px; overflow:hidden;">
        ${copyIcon}
        <div style='margin:0; padding:10px 10px 10px 10px; background:none; border:none; font-size:inherit; font-family:inherit; white-space:pre-wrap;'>${formattedText}</div>
      </div>`;

      const typingBubble = document.getElementById('typing-bubble');
      if (typingBubble) {
        typingBubble.outerHTML = aiBubble;
      }

      // Attach copy event after DOM update
      setTimeout(function() {
        const bubbles = document.querySelectorAll('.ai-bubble');
        bubbles.forEach(bubble => {
          const icon = bubble.querySelector('.ai-copy-icon');
          if (icon) {
            icon.onclick = function(e) {
              e.preventDefault();
              // Get the text inside the <pre><code>...</code></pre>
              const code = bubble.querySelector('pre code');
              if (code) {
                const text = code.innerText;
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(text);
                  icon.title = 'Copied!';
                  icon.style.color = '#28a745';
                  if (typeof Fnon !== 'undefined' && Fnon.Hint && Fnon.Hint.Success) {
                    Fnon.Hint.Success('Code copied');
                  }
                  setTimeout(() => {
                    icon.title = 'Copy AI response';
                    icon.style.color = '#7534d1';
                  }, 1200);
                }
              }
            };
          }
        });
      }, 100);

      const chatContainer = document.querySelector('.chat-box-wrapper');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    },
    error: function (xhr, status, error) {
      console.error("Error:", error);
      const typingBubble = document.getElementById('typing-bubble');
      if (typingBubble) {
        typingBubble.outerHTML = `<div class="chat-bubble ai-bubble text-danger">Failed to generate Groovy script.</div>`;
      }
    }
  });
}

document.getElementById('payloadToggle').addEventListener('change', function () {
  const payloadSection = document.getElementById('payloadInputs');
  payloadSection.style.display = this.checked ? 'block' : 'none';

  if (this.checked) {
    payloadSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

function useSuggestion(button) {
  // Always switch to chat UI when a suggestion is clicked
  const welcomeScreen = document.getElementById("welcome-screen");
  const chatScreen = document.getElementById("chat-screen");
  if (welcomeScreen && chatScreen) {
    welcomeScreen.style.display = "none";
    chatScreen.style.display = "block";
  }
  const inputBox = document.getElementById('search-bar');
  inputBox.value = button.textContent;
  // Directly show the suggestion as a single-line text bubble
  const chatResponse = document.getElementById('chat-response');
  if (chatResponse) {
    // Escape HTML special characters
    function escapeHtml(text) {
      return text.replace(/&/g, "&amp;")
                 .replace(/</g, "&lt;")
                 .replace(/>/g, "&gt;");
    }
    const escapedPrompt = escapeHtml(button.textContent);
    // Use normal white-space for single-line prompt
    const userBubble = `<div class=\"chat-bubble user-bubble\" style=\"font-size:10px; white-space:normal;\">${escapedPrompt}</div>`;
    chatResponse.insertAdjacentHTML('beforeend', userBubble);
    // Show typing bubble
    const typingBubble = `
      <div class=\"chat-bubble ai-bubble loading\" id=\"typing-bubble\" style=\"font-size:10px\">
        <div class=\"typing-dots\">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    chatResponse.insertAdjacentHTML('beforeend', typingBubble);
    const chatContainer = document.querySelector('.chat-box-wrapper');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
    getGenAIRecommendations(button.textContent);
    inputBox.value = '';
    document.getElementById('payloadToggle').checked = false;
    document.getElementById('payloadInputs').style.display = 'none';
  }
}

function startChat() {
  const input = document.getElementById("welcome-search-bar").value.trim();
  const isChecked = document.getElementById('payloadToggle-welcome').checked;
  let combinedPrompt = input;
  if (isChecked) {
    const inbound = document.getElementById('inboundPayload-welcome').value.trim();
    const outbound = document.getElementById('outboundPayload-welcome').value.trim();
    combinedPrompt += `\n\nSample Inbound Payload:\n${inbound}\n\nSample Outbound Payload:\n${outbound}`;
  }
  if (input !== "") {
    localStorage.setItem("hasVisited", "true");
    document.getElementById("welcome-screen").style.display = "none";
    document.getElementById("chat-screen").style.display = "block";
    document.getElementById("search-bar").value = combinedPrompt;
    addUserInput();
    resetPayloadInputsWelcome();
  }
}

function showInitialScreen() {
  const welcomeScreen = document.getElementById("welcome-screen");
  const chatScreen = document.getElementById("chat-screen");
  const chatInput = document.getElementById("search-bar");
  const chatHistory = document.getElementById("chat-response");
  if (!welcomeScreen || !chatScreen || !chatInput || !chatHistory) {
    setTimeout(showInitialScreen, 100);
    return;
  }
  // If there is any input or chat history, show chat page, else show welcome page
  if (chatInput.value.trim() !== "" || chatHistory.innerHTML.trim() !== "") {
    welcomeScreen.style.display = "none";
    chatScreen.style.display = "block";
  } else {
    welcomeScreen.style.display = "block";
    chatScreen.style.display = "none";
  }
}

showInitialScreen();

function resetPropertyInputsAndFields() {
    var propertyToggle = document.getElementById('propertyToggle');
    var propertyIcons = document.getElementById('propertyIconsWrapper');
    var propertyInputs = document.getElementById('propertyInputs');
    if (propertyToggle) propertyToggle.checked = false;
    if (propertyIcons) propertyIcons.style.display = 'none';
    if (propertyInputs) propertyInputs.style.display = 'none';
    var container = document.getElementById('propertyValuesContainer');
    if (container) {
        while (container.children.length > 1) {
            container.removeChild(container.lastChild);
        }
        var firstTextarea = container.querySelector('textarea');
        if (firstTextarea) firstTextarea.value = '';
    }
}
function resetHeaderInputsAndFields() {
    var headerToggle = document.getElementById('headerToggle');
    var headerIcons = document.getElementById('headerIconsWrapper');
    var headerInputs = document.getElementById('headerInputs');
    if (headerToggle) headerToggle.checked = false;
    if (headerIcons) headerIcons.style.display = 'none';
    if (headerInputs) headerInputs.style.display = 'none';
    var container = document.getElementById('headerValuesContainer');
    if (container) {
        while (container.children.length > 1) {
            container.removeChild(container.lastChild);
        }
        var firstTextarea = container.querySelector('textarea');
        if (firstTextarea) firstTextarea.value = '';
    }
}
// Attach click listeners to reset icons for chat screen
function attachChatScreenResetIconListeners() {
    var resetPropertyIcon = document.getElementById('resetPropertyValueIcon');
    if (resetPropertyIcon) {
        resetPropertyIcon.onclick = function() {
            if (typeof resetPropertyInputsAndFields === 'function') resetPropertyInputsAndFields();
            var icons = document.getElementById('propertyIconsWrapper');
            var inputs = document.getElementById('propertyInputs');
            if (icons) icons.style.display = 'none';
            if (inputs) inputs.style.display = 'none';
        };
    }
    var resetHeaderIcon = document.getElementById('resetHeaderValueIcon');
    if (resetHeaderIcon) {
        resetHeaderIcon.onclick = function() {
            if (typeof resetHeaderInputsAndFields === 'function') resetHeaderInputsAndFields();
            var icons = document.getElementById('headerIconsWrapper');
            var inputs = document.getElementById('headerInputs');
            if (icons) icons.style.display = 'none';
            if (inputs) inputs.style.display = 'none';
        };
    }
}
