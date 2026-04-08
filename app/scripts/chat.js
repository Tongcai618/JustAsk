// ── Chat logic ───────────────────────────────────────────

function addRow(role) {
  const es = document.getElementById('empty-state');
  if (es) es.style.display = 'none';

  const row = document.createElement('div');
  row.className = `msg-row ${role}`;
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  row.appendChild(bubble);
  messagesEl.appendChild(row);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return bubble;
}

function scrollBottom() {
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

async function sendMessage() {
  const text = promptEl.value.trim();
  if (!text || isStreaming) return;

  isStreaming = true;
  sendBtn.disabled = true;
  promptEl.value = '';
  promptEl.style.height = 'auto';

  const userBubble = addRow('user');
  userBubble.textContent = text;
  history.push({ role: 'user', content: text });

  const asstBubble = addRow('assistant');
  asstBubble.classList.add('streaming');
  let fullText = '';

  try {
    const resp = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history, model: currentModel })
    });

    if (!resp.ok) throw new Error(`Server error: ${resp.status}`);

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6);
        if (payload === '[DONE]') {
          asstBubble.classList.remove('streaming');
          asstBubble.innerHTML = marked.parse(fullText);
          asstBubble.querySelectorAll('pre code').forEach(el => hljs.highlightElement(el));
          scrollBottom();
          history.push({ role: 'assistant', content: fullText });
          await saveCurrentConversation();
          return;
        }
        try {
          const chunk = JSON.parse(payload);
          if (chunk.error) throw new Error(chunk.error);
          if (chunk.content) {
            fullText += chunk.content;
            asstBubble.textContent = fullText;
            scrollBottom();
          }
        } catch (e) {
          if (e.message !== 'Unexpected end of JSON input') throw e;
        }
      }
    }

    asstBubble.classList.remove('streaming');
    if (fullText) {
      asstBubble.innerHTML = marked.parse(fullText);
      asstBubble.querySelectorAll('pre code').forEach(el => hljs.highlightElement(el));
      history.push({ role: 'assistant', content: fullText });
      await saveCurrentConversation();
    }

  } catch (err) {
    asstBubble.classList.remove('streaming');
    asstBubble.classList.add('error-bubble');
    asstBubble.textContent = `Error: ${err.message}`;
    history.pop();
  } finally {
    isStreaming = false;
    sendBtn.disabled = false;
    promptEl.focus();
    scrollBottom();
  }
}
