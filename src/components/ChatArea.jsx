import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';

/* ------------------------------------------------------------------ */
/*  ChatArea – main conversation view                                  */
/* ------------------------------------------------------------------ */
export default function ChatArea() {
  const { history, isStreaming, currentModel, sendMessage, pendingNewChat } =
    useApp();

  /* ── refs -------------------------------------------------------- */
  const messagesRef = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  /* ── local input state ------------------------------------------ */
  const [input, setInput] = useState('');

  /* ── auto-scroll ------------------------------------------------ */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history.length, isStreaming]);

  /* ── syntax highlighting ---------------------------------------- */
  useEffect(() => {
    if (isStreaming) return; // wait until stream finishes
    if (!messagesRef.current) return;

    const blocks = messagesRef.current.querySelectorAll('pre code');
    blocks.forEach((block) => {
      // Avoid re-highlighting already processed blocks
      if (block.dataset.highlighted) return;
      try {
        window.hljs.highlightElement(block);
        block.dataset.highlighted = 'true';
      } catch {
        /* hljs not loaded or parse error */
      }
    });
  }, [history, isStreaming]);

  /* ── focus textarea on mount and when streaming ends ------------ */
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isStreaming) {
      textareaRef.current?.focus();
    }
  }, [isStreaming]);

  /* ── send handler ----------------------------------------------- */
  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || isStreaming) return;

    sendMessage(text);
    setInput('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [input, isStreaming, sendMessage]);

  /* ── textarea auto-resize --------------------------------------- */
  const handleInput = useCallback((e) => {
    setInput(e.target.value);

    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, []);

  /* ── keyboard handling ------------------------------------------ */
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  /* ── render helpers --------------------------------------------- */
  const renderMessage = (msg, idx) => {
    const isLastAssistant =
      msg.role === 'assistant' && idx === history.length - 1;
    const bubbleClass = `bubble${isLastAssistant && isStreaming ? ' streaming' : ''}`;

    return (
      <div key={idx} className={`msg-row ${msg.role}`}>
        <div className={bubbleClass}>
          {msg.role === 'user' ? (
            msg.content
          ) : (
            <div
              dangerouslySetInnerHTML={{
                __html: window.marked.parse(msg.content || ''),
              }}
            />
          )}
        </div>
      </div>
    );
  };

  /* ================================================================ */
  /*  JSX                                                              */
  /* ================================================================ */
  return (
    <>
      {/* ── Messages area ----------------------------------------- */}
      <div id="messages" ref={messagesRef}>
        {history.length === 0 ? (
          <div className="empty-state" id="empty-state">
            <img className="icon" src="assets/leaf.svg" alt="leaf" />
            <div>Start a conversation</div>
            <div className="hint">
              Shift+Enter for new line &middot; Enter to send
            </div>
          </div>
        ) : (
          history.map((msg, idx) => renderMessage(msg, idx))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input area -------------------------------------------- */}
      <div id="input-area">
        <div id="input-wrap" className="chat-input-wrap">
          <textarea
            id="prompt"
            ref={textareaRef}
            placeholder={`Message ${currentModel}\u2026`}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button
            id="send-btn"
            className="btn-icon"
            disabled={isStreaming || !input.trim()}
            onClick={handleSend}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
