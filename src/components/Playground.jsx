import React from 'react';

/* ------------------------------------------------------------------ */
/*  Playground – component showcase / design playground                 */
/* ------------------------------------------------------------------ */
export default function Playground({ visible }) {
  return (
    <div id="playground" className={visible ? 'visible' : ''}>

      {/* ── Header -------------------------------------------------- */}
      <div id="pg-header">
        <h1>Playground</h1>
        <span className="pg-badge">Dev Mode</span>
      </div>

      {/* ── Content ------------------------------------------------- */}
      <div id="pg-content">

        {/* ── Buttons ─────────────────────────────────────────────── */}
        <div className="pg-section">
          <div className="pg-section-title">Buttons</div>
          <div className="pg-row">
            <div className="pg-atom">
              <div className="pg-atom-label">Primary</div>
              <div className="pg-atom-render">
                <button className="btn-primary">Send Message</button>
              </div>
            </div>
            <div className="pg-atom">
              <div className="pg-atom-label">Primary Disabled</div>
              <div className="pg-atom-render">
                <button className="btn-primary" disabled>Send Message</button>
              </div>
            </div>
            <div className="pg-atom">
              <div className="pg-atom-label">Icon Button</div>
              <div className="pg-atom-render">
                <button className="btn-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ width: '16px', height: '16px' }}
                  >
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="pg-atom">
              <div className="pg-atom-label">Ghost / Outline</div>
              <div className="pg-atom-render">
                <button className="btn-ghost">Clear</button>
                <button className="btn-ghost-sm">&times;</button>
              </div>
            </div>
            <div className="pg-atom">
              <div className="pg-atom-label">Full-width Action</div>
              <div className="pg-atom-render" style={{ width: '220px' }}>
                <button className="btn-full">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ width: '14px', height: '14px' }}
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  New Chat
                </button>
              </div>
            </div>
          </div>
          <div className="pg-row">
            <div className="pg-atom">
              <div className="pg-atom-label">Modal Close</div>
              <div className="pg-atom-render">
                <button className="modal-close">&times;</button>
              </div>
            </div>
            <div className="pg-atom">
              <div className="pg-atom-label">Install (Primary)</div>
              <div className="pg-atom-render">
                <button className="mm-btn primary">Install</button>
              </div>
            </div>
            <div className="pg-atom">
              <div className="pg-atom-label">Select / Pause / Resume</div>
              <div className="pg-atom-render">
                <button className="mm-btn">Select</button>
                <button className="mm-btn">Pause</button>
                <button className="mm-btn">Resume</button>
              </div>
            </div>
            <div className="pg-atom">
              <div className="pg-atom-label">Delete (hover reveal)</div>
              <div className="pg-atom-render">
                <button className="mm-trash" style={{ opacity: 1 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="pg-atom">
              <div className="pg-atom-label">Status Chips</div>
              <div className="pg-atom-render">
                <span className="mm-status active">Active</span>
                <span className="mm-status installed">Installed</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Badges & Chips ──────────────────────────────────────── */}
        <div className="pg-section">
          <div className="pg-section-title">Badges &amp; Chips</div>
          <div className="pg-row">
            <div className="pg-atom">
              <div className="pg-atom-label">Model Button</div>
              <div className="pg-atom-render">
                <button id="pg-model-btn" className="header-btn">gemma4:e2b</button>
              </div>
            </div>
            <div className="pg-atom">
              <div className="pg-atom-label">Dev Badge</div>
              <div className="pg-atom-render">
                <span className="pg-badge">Dev Mode</span>
              </div>
            </div>
            <div className="pg-atom">
              <div className="pg-atom-label">Chips</div>
              <div className="pg-atom-render">
                <span className="pg-chip blue">Active</span>
                <span className="pg-chip green">Online</span>
                <span className="pg-chip red">Error</span>
                <span className="pg-chip gray">
                  Draft <span className="chip-x">&times;</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Text Fields ─────────────────────────────────────────── */}
        <div className="pg-section">
          <div className="pg-section-title">Text Fields</div>
          <div className="pg-row">
            <div className="pg-atom">
              <div className="pg-atom-label">Input Field</div>
              <div className="pg-atom-render">
                <div style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 500 }}>Model name</span>
                  <input
                    className="field-input"
                    placeholder="e.g. gemma4:e2b"
                    readOnly
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-6)' }}>
                    The Ollama model identifier
                  </span>
                </div>
              </div>
            </div>
            <div className="pg-atom">
              <div className="pg-atom-label">Textarea / Chat Input</div>
              <div className="pg-atom-render" style={{ width: '300px' }}>
                <div className="chat-input-wrap" style={{ flex: 1 }}>
                  <textarea
                    placeholder="Message gemma4:e2b..."
                    rows={1}
                    readOnly
                  />
                  <button
                    className="btn-icon"
                    style={{ flexShrink: 0 }}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ width: '16px', height: '16px' }}
                    >
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Search Bar ──────────────────────────────────────────── */}
        <div className="pg-section">
          <div className="pg-section-title">Search Bar</div>
          <div className="pg-row">
            <div className="pg-atom">
              <div className="pg-atom-label">Search Input</div>
              <div className="pg-atom-render">
                <div className="search-wrap">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input placeholder="Search conversations..." readOnly />
                </div>
              </div>
            </div>
            <div className="pg-atom">
              <div className="pg-atom-label">Search (Focused)</div>
              <div className="pg-atom-render">
                <div
                  className="search-wrap"
                  style={{ borderColor: 'var(--primary)' }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--link)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    placeholder="Search conversations..."
                    defaultValue="gemma"
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Dividers ────────────────────────────────────────────── */}
        <div className="pg-section">
          <div className="pg-section-title">Dividers</div>
          <div className="pg-row">
            <div className="pg-atom">
              <div className="pg-atom-label">Horizontal Rule</div>
              <div
                className="pg-atom-render"
                style={{ flexDirection: 'column', gap: '10px' }}
              >
                <hr className="pg-divider-h" />
              </div>
            </div>
            <div className="pg-atom">
              <div className="pg-atom-label">Labeled Divider</div>
              <div className="pg-atom-render">
                <div className="pg-divider-label">or</div>
              </div>
            </div>
            <div className="pg-atom">
              <div className="pg-atom-label">Section Border</div>
              <div className="pg-atom-render">
                <div className="pg-section-border-demo">Section header</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Chat Bubbles ────────────────────────────────────────── */}
        <div className="pg-section">
          <div className="pg-section-title">Chat Bubbles</div>
          <div className="pg-row">
            <div className="pg-atom" style={{ minWidth: '320px' }}>
              <div className="pg-atom-label">User Bubble</div>
              <div className="pg-atom-render">
                <div className="msg-row user" style={{ padding: 0 }}>
                  <div className="bubble" style={{ maxWidth: '100%' }}>
                    Hello, how does this work?
                  </div>
                </div>
              </div>
            </div>
            <div className="pg-atom" style={{ minWidth: '320px' }}>
              <div className="pg-atom-label">Assistant Bubble</div>
              <div className="pg-atom-render">
                <div className="msg-row assistant" style={{ padding: 0 }}>
                  <div className="bubble" style={{ maxWidth: '100%' }}>
                    I can help you with that! Here&apos;s a quick overview.
                  </div>
                </div>
              </div>
            </div>
            <div className="pg-atom" style={{ minWidth: '320px' }}>
              <div className="pg-atom-label">Streaming Bubble</div>
              <div className="pg-atom-render">
                <div className="msg-row assistant" style={{ padding: 0 }}>
                  <div
                    className="bubble streaming"
                    style={{ maxWidth: '100%' }}
                  >
                    Generating response
                  </div>
                </div>
              </div>
            </div>
            <div className="pg-atom" style={{ minWidth: '320px' }}>
              <div className="pg-atom-label">Error Bubble</div>
              <div className="pg-atom-render">
                <div className="msg-row assistant" style={{ padding: 0 }}>
                  <div
                    className="bubble error-bubble"
                    style={{ maxWidth: '100%' }}
                  >
                    Error: Cannot reach Ollama
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Conversation List Items ─────────────────────────────── */}
        <div className="pg-section">
          <div className="pg-section-title">Conversation List Items</div>
          <div className="pg-row">
            <div
              className="pg-atom"
              style={{ minWidth: '260px', padding: 0, overflow: 'hidden' }}
            >
              <div style={{ padding: '12px 16px 4px' }}>
                <span className="pg-atom-label">Default</span>
              </div>
              <div className="conv-item" style={{ cursor: 'default' }}>
                <span className="conv-title">
                  What is quantum computing?
                </span>
                <span className="conv-date">2:30 PM</span>
                <button
                  className="conv-delete"
                  style={{ display: 'block' }}
                >
                  &times;
                </button>
              </div>
            </div>
            <div
              className="pg-atom"
              style={{ minWidth: '260px', padding: 0, overflow: 'hidden' }}
            >
              <div style={{ padding: '12px 16px 4px' }}>
                <span className="pg-atom-label">Active</span>
              </div>
              <div
                className="conv-item active"
                style={{ cursor: 'default' }}
              >
                <span className="conv-title">
                  Explain neural networks
                </span>
                <span className="conv-date">Mon</span>
                <button
                  className="conv-delete"
                  style={{ display: 'block' }}
                >
                  &times;
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Toggles & Controls ──────────────────────────────────── */}
        <div className="pg-section">
          <div className="pg-section-title">Toggles &amp; Controls</div>
          <div className="pg-row">
            <div className="pg-atom">
              <div className="pg-atom-label">Toggle Off</div>
              <div className="pg-atom-render">
                <div
                  className="pg-toggle-track"
                  onClick={(e) => e.currentTarget.classList.toggle('on')}
                />
              </div>
            </div>
            <div className="pg-atom">
              <div className="pg-atom-label">Toggle On</div>
              <div className="pg-atom-render">
                <div
                  className="pg-toggle-track on"
                  onClick={(e) => e.currentTarget.classList.toggle('on')}
                />
              </div>
            </div>
            <div className="pg-atom">
              <div className="pg-atom-label">Keyboard Shortcuts</div>
              <div className="pg-atom-render">
                <span className="pg-kbd">Enter</span>
                <span style={{ color: 'var(--text-5)', fontSize: '12px' }}>
                  send
                </span>
                <span className="pg-kbd">Shift</span>
                <span style={{ color: 'var(--text-6)' }}>+</span>
                <span className="pg-kbd">Enter</span>
                <span style={{ color: 'var(--text-5)', fontSize: '12px' }}>
                  new line
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Avatars ─────────────────────────────────────────────── */}
        <div className="pg-section">
          <div className="pg-section-title">Avatars</div>
          <div className="pg-row">
            <div className="pg-atom">
              <div className="pg-atom-label">User Avatars</div>
              <div className="pg-atom-render">
                <div className="pg-avatar blue">U</div>
                <div className="pg-avatar green">A</div>
                <div
                  className="pg-avatar"
                  style={{
                    background: 'var(--dev-badge-bg)',
                    color: 'var(--dev-badge-text)',
                  }}
                >
                  G
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tooltip ─────────────────────────────────────────────── */}
        <div className="pg-section">
          <div className="pg-section-title">Tooltip</div>
          <div className="pg-row">
            <div className="pg-atom">
              <div className="pg-atom-label">Tooltip (static demo)</div>
              <div className="pg-atom-render">
                <div
                  className="pg-tooltip-demo"
                  style={{ marginTop: '28px' }}
                >
                  <div className="pg-tip">Send (Enter)</div>
                  <button className="btn-icon">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ width: '16px', height: '16px' }}
                    >
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Loading States ──────────────────────────────────────── */}
        <div className="pg-section">
          <div className="pg-section-title">Loading States</div>
          <div className="pg-row">
            <div className="pg-atom" style={{ minWidth: '260px' }}>
              <div className="pg-atom-label">Skeleton Lines</div>
              <div
                className="pg-atom-render"
                style={{
                  flexDirection: 'column',
                  gap: '8px',
                  width: '100%',
                }}
              >
                <div
                  className="pg-skeleton"
                  style={{ width: '80%', height: '12px' }}
                />
                <div
                  className="pg-skeleton"
                  style={{ width: '100%', height: '12px' }}
                />
                <div
                  className="pg-skeleton"
                  style={{ width: '60%', height: '12px' }}
                />
              </div>
            </div>
            <div className="pg-atom">
              <div className="pg-atom-label">Progress Bar</div>
              <div
                className="pg-atom-render"
                style={{ flexDirection: 'column', gap: '8px' }}
              >
                <div className="pg-progress-bar">
                  <div
                    className="pg-progress-fill"
                    style={{
                      width: '65%',
                      background: 'var(--progress-blue)',
                    }}
                  />
                </div>
                <div className="pg-progress-bar">
                  <div
                    className="pg-progress-fill"
                    style={{
                      width: '30%',
                      background: 'var(--progress-green)',
                    }}
                  />
                </div>
                <div className="pg-progress-bar">
                  <div
                    className="pg-progress-fill"
                    style={{
                      width: '90%',
                      background: 'var(--progress-red)',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Typography ──────────────────────────────────────────── */}
        <div className="pg-section">
          <div className="pg-section-title">Typography</div>
          <div className="pg-row">
            <div className="pg-atom" style={{ minWidth: '400px' }}>
              <div className="pg-atom-label">Headings</div>
              <div
                className="pg-atom-render"
                style={{ flexDirection: 'column', gap: '4px' }}
              >
                <h1 style={{ fontSize: '1.3em', fontWeight: 600 }}>
                  Heading 1
                </h1>
                <h2 style={{ fontSize: '1.15em', fontWeight: 600 }}>
                  Heading 2
                </h2>
                <h3 style={{ fontSize: '1.05em', fontWeight: 600 }}>
                  Heading 3
                </h3>
              </div>
            </div>
            <div className="pg-atom" style={{ minWidth: '300px' }}>
              <div className="pg-atom-label">Inline Styles</div>
              <div
                className="pg-atom-render"
                style={{
                  flexDirection: 'column',
                  gap: '6px',
                  fontSize: '14px',
                }}
              >
                <span>
                  Regular text{' '}
                  <strong style={{ color: 'var(--strong)' }}>
                    Bold text
                  </strong>{' '}
                  <em style={{ color: 'var(--em)' }}>Italic text</em>
                </span>
                <span>
                  Inline{' '}
                  <code
                    style={{
                      background: 'var(--code-bg)',
                      border: '1px solid var(--code-border)',
                      borderRadius: '4px',
                      padding: '1px 5px',
                      fontFamily: "'SF Mono',Consolas,monospace",
                      fontSize: '13px',
                      color: 'var(--code-text)',
                    }}
                  >
                    code
                  </code>{' '}
                  element
                </span>
                <a
                  href="#"
                  style={{ color: 'var(--link)', textDecoration: 'none' }}
                  onClick={(e) => e.preventDefault()}
                >
                  Link text
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ── Code Block ──────────────────────────────────────────── */}
        <div className="pg-section">
          <div className="pg-section-title">Code Block</div>
          <div className="pg-row">
            <div className="pg-atom" style={{ minWidth: '400px' }}>
              <div className="pg-atom-label">Syntax Highlighted</div>
              <div className="pg-atom-render" style={{ width: '100%' }}>
                <pre className="code-block">
                  <code>{`const model = "gemma4:e2b";
const response = await fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({ messages })
});`}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* ── Empty State ─────────────────────────────────────────── */}
        <div className="pg-section">
          <div className="pg-section-title">Empty State</div>
          <div className="pg-row">
            <div className="pg-atom" style={{ minWidth: '300px' }}>
              <div className="pg-atom-label">Welcome / Empty</div>
              <div
                className="pg-atom-render"
                style={{ justifyContent: 'center' }}
              >
                <div className="empty-state" style={{ pointerEvents: 'auto', flex: 'none', padding: '20px 0' }}>
                  <img className="icon" src="assets/leaf.svg" alt="leaf" />
                  <div>Start a conversation</div>
                  <div className="hint">
                    Shift+Enter for new line &middot; Enter to send
                  </div>
                </div>
              </div>
            </div>
            <div className="pg-atom">
              <div className="pg-atom-label">No History</div>
              <div
                className="pg-atom-render"
                style={{ justifyContent: 'center' }}
              >
                <div className="no-history">No conversations yet</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Color Palette ───────────────────────────────────────── */}
        <div className="pg-section">
          <div className="pg-section-title">Color Palette</div>
          <div className="pg-row" style={{ gap: '8px' }}>
            <div className="pg-swatch">
              <div
                className="pg-swatch-box"
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--border-strong)',
                }}
              />
              <span className="pg-swatch-label">bg</span>
            </div>
            <div className="pg-swatch">
              <div
                className="pg-swatch-box"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                }}
              />
              <span className="pg-swatch-label">surface</span>
            </div>
            <div className="pg-swatch">
              <div
                className="pg-swatch-box"
                style={{ background: 'var(--card)' }}
              />
              <span className="pg-swatch-label">card</span>
            </div>
            <div className="pg-swatch">
              <div
                className="pg-swatch-box"
                style={{ background: 'var(--primary)' }}
              />
              <span className="pg-swatch-label">primary</span>
            </div>
            <div className="pg-swatch">
              <div
                className="pg-swatch-box"
                style={{ background: 'var(--link)' }}
              />
              <span className="pg-swatch-label">accent</span>
            </div>
            <div className="pg-swatch">
              <div
                className="pg-swatch-box"
                style={{ background: 'var(--text)' }}
              />
              <span className="pg-swatch-label">text</span>
            </div>
            <div className="pg-swatch">
              <div
                className="pg-swatch-box"
                style={{ background: 'var(--text-5)' }}
              />
              <span className="pg-swatch-label">muted</span>
            </div>
            <div className="pg-swatch">
              <div
                className="pg-swatch-box"
                style={{ background: 'var(--border-strong)' }}
              />
              <span className="pg-swatch-label">border</span>
            </div>
            <div className="pg-swatch">
              <div
                className="pg-swatch-box"
                style={{
                  background: 'var(--error-bg)',
                  border: '1px solid var(--error-border)',
                }}
              />
              <span className="pg-swatch-label">error-bg</span>
            </div>
            <div className="pg-swatch">
              <div
                className="pg-swatch-box"
                style={{ background: 'var(--error-text)' }}
              />
              <span className="pg-swatch-label">error</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
