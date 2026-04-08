// ── Sidebar rendering ────────────────────────────────────

function renderSidebar() {
  convListEl.innerHTML = '';

  // Show pending "New conversation" item at the top
  if (pendingNewChat) {
    const pending = document.createElement('div');
    pending.className = 'conv-item active';
    const t = document.createElement('span');
    t.className = 'conv-title';
    t.textContent = 'New conversation';
    const d = document.createElement('span');
    d.className = 'conv-date';
    d.textContent = 'Now';
    pending.appendChild(t);
    pending.appendChild(d);
    convListEl.appendChild(pending);
  }

  if (conversations.length === 0 && !pendingNewChat) {
    convListEl.innerHTML = '<div class="no-history">No conversations yet</div>';
    return;
  }

  for (const conv of conversations) {
    const item = document.createElement('div');
    item.className = 'conv-item' + (conv.id === currentConvId ? ' active' : '');
    item.onclick = () => loadConversation(conv.id);

    const title = document.createElement('span');
    title.className = 'conv-title';
    title.textContent = conv.title || 'Untitled';

    const date = document.createElement('span');
    date.className = 'conv-date';
    date.textContent = formatDate(conv.updatedAt);

    const del = document.createElement('button');
    del.className = 'conv-delete';
    del.textContent = '\u00d7';
    del.title = 'Delete';
    del.onclick = (e) => { e.stopPropagation(); deleteConversation(conv.id); };

    item.appendChild(title);
    item.appendChild(date);
    item.appendChild(del);
    convListEl.appendChild(item);
  }
}

// ── Conversation management ──────────────────────────────

async function saveCurrentConversation() {
  if (!window.electronAPI || history.length === 0) return;

  if (!currentConvId) {
    currentConvId = generateId();
  }
  pendingNewChat = false;

  const conv = {
    id: currentConvId,
    title: titleFromMessages(history),
    messages: history,
    updatedAt: new Date().toISOString(),
  };

  conversations = await window.electronAPI.saveConversation(conv);
  renderSidebar();
}

async function loadConversation(id) {
  if (isStreaming) return;

  const conv = conversations.find(c => c.id === id);
  if (!conv) return;
  pendingNewChat = false;

  currentConvId = conv.id;
  history = [...conv.messages];

  messagesEl.innerHTML = '';
  for (const msg of history) {
    const bubble = addRow(msg.role);
    if (msg.role === 'user') {
      bubble.textContent = msg.content;
    } else {
      bubble.innerHTML = marked.parse(msg.content);
      bubble.querySelectorAll('pre code').forEach(el => hljs.highlightElement(el));
    }
  }
  scrollBottom();
  renderSidebar();
  promptEl.focus();
}

async function deleteConversation(id) {
  if (!window.electronAPI) return;
  conversations = await window.electronAPI.deleteConversation(id);

  if (currentConvId === id) {
    newChat();
  }
  renderSidebar();
}

function newChat() {
  if (isStreaming) return;
  currentConvId = null;
  history = [];
  pendingNewChat = true;
  messagesEl.innerHTML = '';

  const es = document.createElement('div');
  es.className = 'empty-state';
  es.id = 'empty-state';
  es.innerHTML = '<img class="icon" src="assets/leaf.svg" alt="leaf" /><div>Start a conversation</div><div class="hint">Shift+Enter for new line &middot; Enter to send</div>';
  messagesEl.appendChild(es);

  renderSidebar();
  promptEl.focus();
}
