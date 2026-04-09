// ============================================================
//  Eraya AI Chatbot — Powered by Gemini
//  Drop this file into your project root.
//  Then add to every HTML page (just before </body>):
//    <link rel="stylesheet" href="chatbot.css">
//    <script src="chatbot.js"></script>
// ============================================================

(function () {
  // ── CONFIG ────────────────────────────────────────────────
  const GEMINI_API_KEY = 'GEMINI_API_KEY'; // Replace this!
  const GEMINI_URL =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' +
    GEMINI_API_KEY;

  const SYSTEM_PROMPT = `You are Eraya, a warm and knowledgeable women's health assistant built into the Eraya period wellness app.
You help users with questions about:
- Menstrual health, cycle tracking, period pain
- PCOS, endometriosis, hormonal conditions
- Nutrition, exercise, and wellness during the cycle
- Mental health and emotional wellbeing
- How to use the Eraya app (finding doctors, logging symptoms, tracking cycles)

Guidelines:
- Keep answers concise, friendly, and easy to understand.
- Never diagnose. For serious or urgent symptoms, always advise consulting a doctor.
- Be empathetic — many users may feel anxious or embarrassed about their symptoms.
- If a question is completely unrelated to women's health or the app, politely say you're specialized for health topics.`;

  // ── STATE ─────────────────────────────────────────────────
  let conversationHistory = []; // Gemini multi-turn format
  let isOpen = false;
  let isTyping = false;

  // ── BUILD UI ──────────────────────────────────────────────
  function buildUI() {
    // Inject CSS link if not already present
    if (!document.querySelector('link[href="chatbot.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'chatbot.css';
      document.head.appendChild(link);
    }

    // Floating bubble button
    const bubble = document.createElement('button');
    bubble.id = 'eraya-chat-bubble';
    bubble.setAttribute('aria-label', 'Open Eraya Health Assistant');
    bubble.innerHTML = `
      <svg id="eraya-bubble-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <svg id="eraya-close-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:none">
        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
      <span class="eraya-notif-dot" id="eraya-notif"></span>`;

    // Chat window
    const chatWindow = document.createElement('div');
    chatWindow.id = 'eraya-chat-window';
    chatWindow.setAttribute('aria-live', 'polite');
    chatWindow.innerHTML = `
      <div id="eraya-chat-header">
        <div class="eraya-header-info">
          <div class="eraya-avatar">✿</div>
          <div>
            <div class="eraya-header-name">Eraya Assistant</div>
            <div class="eraya-header-sub">Women's Health AI</div>
          </div>
        </div>
        <button id="eraya-clear-btn" title="Clear chat">↺</button>
      </div>
      <div id="eraya-messages"></div>
      <div id="eraya-typing-indicator" style="display:none">
        <span></span><span></span><span></span>
      </div>
      <div id="eraya-chat-input-area">
        <input
          type="text"
          id="eraya-chat-input"
          placeholder="Ask about your health…"
          maxlength="500"
          autocomplete="off"
        />
        <button id="eraya-send-btn" aria-label="Send">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>`;

    document.body.appendChild(bubble);
    document.body.appendChild(chatWindow);

    // Add greeting message
    addMessage(
      'bot',
      "Hi! I'm Eraya 🌸 Your women's health assistant. Ask me anything about your cycle, symptoms, nutrition, or how to use the app!"
    );

    // ── EVENT LISTENERS ────────────────────────────────────
    bubble.addEventListener('click', toggleChat);

    document.getElementById('eraya-send-btn').addEventListener('click', handleSend);

    document.getElementById('eraya-chat-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });

    document.getElementById('eraya-clear-btn').addEventListener('click', function () {
      conversationHistory = [];
      const messagesEl = document.getElementById('eraya-messages');
      messagesEl.innerHTML = '';
      addMessage(
        'bot',
        "Chat cleared! I'm here whenever you need me 🌸"
      );
    });

    // Show notif dot after 3s if chat hasn't been opened yet
    setTimeout(function () {
      if (!isOpen) {
        const dot = document.getElementById('eraya-notif');
        if (dot) dot.style.display = 'block';
      }
    }, 3000);
  }

  // ── TOGGLE OPEN/CLOSE ─────────────────────────────────────
  function toggleChat() {
    isOpen = !isOpen;
    const chatWindow = document.getElementById('eraya-chat-window');
    const bubbleIcon = document.getElementById('eraya-bubble-icon');
    const closeIcon = document.getElementById('eraya-close-icon');
    const dot = document.getElementById('eraya-notif');

    if (isOpen) {
      chatWindow.classList.add('eraya-open');
      bubbleIcon.style.display = 'none';
      closeIcon.style.display = 'block';
      if (dot) dot.style.display = 'none';
      setTimeout(function () {
        document.getElementById('eraya-chat-input').focus();
      }, 300);
    } else {
      chatWindow.classList.remove('eraya-open');
      bubbleIcon.style.display = 'block';
      closeIcon.style.display = 'none';
    }
  }

  // ── SEND MESSAGE ──────────────────────────────────────────
  function handleSend() {
    if (isTyping) return;
    const input = document.getElementById('eraya-chat-input');
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    addMessage('user', text);

    // Add to conversation history (Gemini format)
    conversationHistory.push({
      role: 'user',
      parts: [{ text: text }],
    });

    sendToGemini();
  }

  // ── CALL GEMINI API ───────────────────────────────────────
  async function sendToGemini() {
    isTyping = true;
    showTypingIndicator(true);

    try {
      const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: SYSTEM_PROMPT }],
          },
          contents: conversationHistory,
          generationConfig: {
            maxOutputTokens: 400,
            temperature: 0.7,
          },
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.error?.message || 'API error ' + response.status);
      }

      const data = await response.json();
      const replyText =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "I'm sorry, I couldn't generate a response. Please try again.";

      // Add assistant reply to history
      conversationHistory.push({
        role: 'model',
        parts: [{ text: replyText }],
      });

      showTypingIndicator(false);
      addMessage('bot', replyText);
    } catch (err) {
      showTypingIndicator(false);
      console.error('[Eraya Chatbot]', err);

      let errorMsg = "Sorry, I'm having trouble connecting right now. Please try again in a moment. 🌸";
      if (err.message && err.message.includes('API_KEY')) {
        errorMsg = 'Chatbot API key not configured. Please add your Gemini API key to chatbot.js.';
      }
      addMessage('bot', errorMsg);

      // Remove the last user message from history so they can retry
      conversationHistory.pop();
    }

    isTyping = false;
  }

  // ── ADD MESSAGE TO UI ─────────────────────────────────────
  function addMessage(role, text) {
    const messagesEl = document.getElementById('eraya-messages');
    const wrapper = document.createElement('div');
    wrapper.className = 'eraya-msg-wrapper eraya-msg-' + role;

    const bubble = document.createElement('div');
    bubble.className = 'eraya-msg-bubble';
    bubble.textContent = text;

    wrapper.appendChild(bubble);
    messagesEl.appendChild(wrapper);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  // ── TYPING INDICATOR ──────────────────────────────────────
  function showTypingIndicator(show) {
    const indicator = document.getElementById('eraya-typing-indicator');
    const messagesEl = document.getElementById('eraya-messages');
    if (indicator) {
      indicator.style.display = show ? 'flex' : 'none';
      if (show) messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  }

  // ── INIT ──────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildUI);
  } else {
    buildUI();
  }
})();
