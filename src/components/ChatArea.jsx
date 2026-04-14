import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import WordMixButtons from './WordMixButtons';
import HighlightedMessage from './HighlightedMessage';

/* ------------------------------------------------------------------ */
/*  ChatArea – main conversation view                                  */
/* ------------------------------------------------------------------ */
export default function ChatArea() {
  const { history, isStreaming, currentModel, sendMessage, pendingNewChat, mode, requestWordSession } =
    useApp();

  const isWordMix = mode === 'wordmix';

  /* ── refs -------------------------------------------------------- */
  const messagesRef = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  /* ── local input state ------------------------------------------ */
  const [input, setInput] = useState('');

  /* ── highlighted word panel state ------------------------------ */
  const [selectedWordInfo, setSelectedWordInfo] = useState(null);

  const handleWordClick = useCallback((msgIdx, wordEntry, isSelected) => {
    setSelectedWordInfo(isSelected ? null : { msgIdx, wordEntry });
  }, []);

  const handlePanelExplainMore = useCallback(() => {
    if (!selectedWordInfo) return;
    sendMessage(
      `请用中文详细解释英文单词「${selectedWordInfo.wordEntry.word}」的意思、用法和常见搭配。`,
      { displayText: `Explain ${selectedWordInfo.wordEntry.word}`, useMarkdown: true },
    );
    setSelectedWordInfo(null);
  }, [selectedWordInfo, sendMessage]);

  const handlePanelAnotherExample = useCallback(() => {
    if (!selectedWordInfo) return;
    requestWordSession(selectedWordInfo.wordEntry, 'All');
    setSelectedWordInfo(null);
  }, [selectedWordInfo, requestWordSession]);

  /* ── auto-scroll ------------------------------------------------ */
  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
    return () => clearTimeout(timer);
  }, [history.length, isStreaming]);

  /* ── syntax highlighting ---------------------------------------- */
  useEffect(() => {
    if (isStreaming) return;
    if (!messagesRef.current) return;

    const blocks = messagesRef.current.querySelectorAll('pre code');
    blocks.forEach((block) => {
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
    if (!isWordMix) textareaRef.current?.focus();
  }, [isWordMix]);

  useEffect(() => {
    if (!isStreaming && !isWordMix) {
      textareaRef.current?.focus();
    }
  }, [isStreaming, isWordMix]);

  /* ── send handler ----------------------------------------------- */
  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || isStreaming) return;

    sendMessage(text);
    setInput('');

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
    const showWordCard =
      msg.role === 'assistant' && msg.wordData && !(isLastAssistant && isStreaming);

    // WordMix assistant messages use HighlightedMessage (after streaming finishes)
    // unless the message is flagged useMarkdown (e.g. Explain More responses)
    const useHighlight =
      isWordMix && msg.role === 'assistant' && !msg.useMarkdown && !(isLastAssistant && isStreaming);

    // Use displayText for user bubbles if available (WordMix mode)
    const userContent = msg.displayText || msg.content;

    const isPanelOpen = selectedWordInfo?.msgIdx === idx;

    return (
      <div key={idx}>
        <div className={`msg-row ${msg.role}`}>
          <div className={bubbleClass}>
            {msg.role === 'user' ? (
              userContent
            ) : useHighlight ? (
              <HighlightedMessage
                content={msg.content || ''}
                msgIdx={idx}
                selectedWordInfo={selectedWordInfo}
                onWordClick={handleWordClick}
              />
            ) : (
              <div
                dangerouslySetInnerHTML={{
                  __html: window.marked.parse(msg.content || ''),
                }}
              />
            )}
          </div>
        </div>
        {showWordCard && (
          <div className="msg-row assistant">
            <div className="wmx-word-card">
              <span className="wmx-word">{msg.wordData.word}</span>
              <span className="wmx-pronunciation">{msg.wordData.pronunciation}</span>
              <span className="wmx-level-badge">{msg.wordData.level}</span>
              <span className="wmx-pos">{msg.wordData.pos}</span>
            </div>
          </div>
        )}
        {useHighlight && isPanelOpen && (
          <div className="msg-row assistant">
            <div className="wmx-inline-panel">
              <span className="wmx-panel-word">{selectedWordInfo.wordEntry.word}</span>
              <span className="wmx-panel-translation">{selectedWordInfo.wordEntry.translation}</span>
              <button
                className="wmx-action-btn"
                onClick={handlePanelExplainMore}
                disabled={isStreaming}
              >
                Explain More
              </button>
              <button
                className="wmx-action-btn wmx-action-primary"
                onClick={handlePanelAnotherExample}
                disabled={isStreaming}
              >
                Another Example
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ── empty state ------------------------------------------------ */
  const emptyMessage = isWordMix
    ? 'Pick a level to start learning'
    : 'Start a conversation';
  const emptyHint = isWordMix
    ? 'Select a CEFR level below'
    : 'Shift+Enter for new line \u00b7 Enter to send';

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
            <div>{emptyMessage}</div>
            <div className="hint">{emptyHint}</div>
          </div>
        ) : (
          history.map((msg, idx) => renderMessage(msg, idx))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── WordMix buttons (above input when in wordmix mode) ---- */}
      {isWordMix && <WordMixButtons />}

      {/* ── Input area -------------------------------------------- */}
      <div id="input-area">
        <div id="input-wrap" className="chat-input-wrap">
          <textarea
            id="prompt"
            ref={textareaRef}
            placeholder={
              isWordMix
                ? 'Tap a level to start\u2026'
                : `Message ${currentModel}\u2026`
            }
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isWordMix}
          />
          {!isWordMix && (
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
          )}
        </div>
      </div>
    </>
  );
}
