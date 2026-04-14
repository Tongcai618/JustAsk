import React from 'react';
import { useApp } from '../context/AppContext';
import { formatDate } from '../lib/helpers';

export default function Sidebar() {
  const {
    conversations,
    currentConvId,
    pendingNewChat,
    isStreaming,
    newChat,
    loadConversation,
    deleteConversation,
  } = useApp();

  return (
    <div id="sidebar">
      <div id="sidebar-header">
        <button
          className="btn-full"
          id="new-chat-btn"
          onClick={newChat}
          disabled={isStreaming}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Chat
        </button>
      </div>

      <div id="conversation-list">
        {pendingNewChat && (
          <div className="conv-item active">
            <span className="conv-title">New conversation</span>
            <span className="conv-date">Now</span>
          </div>
        )}

        {conversations.length === 0 && !pendingNewChat && (
          <div className="no-history">No conversations yet</div>
        )}

        {conversations.map((conv) => (
          <div
            key={conv.id}
            className={`conv-item${conv.id === currentConvId ? ' active' : ''}`}
            onClick={() => loadConversation(conv.id)}
          >
            <span className="conv-title">{conv.title || 'Untitled'}</span>
            <span className="conv-date">{formatDate(conv.updatedAt)}</span>
            <button
              className="conv-delete"
              onClick={(e) => {
                e.stopPropagation();
                deleteConversation(conv.id);
              }}
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
