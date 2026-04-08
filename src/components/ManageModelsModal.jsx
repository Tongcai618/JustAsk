import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatBytes } from '../lib/helpers';
import { MODEL_CATALOG } from '../lib/constants';

const TrashIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

export default function ManageModelsModal({ isOpen, onClose }) {
  const {
    models,
    localModels,
    localModelInfo,
    pullingModels,
    pullProgress,
    pausedModels,
    currentModel,
    selectModel,
    pullModel,
    pausePull,
    resumePull,
    cancelPull,
    deleteModel,
    removeModel,
    installModel,
    fetchLocalModels,
  } = useApp();

  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const footerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) fetchLocalModels();
  }, [isOpen, fetchLocalModels]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (footerRef.current && !footerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const allModels = useMemo(() => {
    const set = new Set(models);
    for (const m of localModels) set.add(m);
    for (const m of pullingModels) set.add(m);
    for (const m of Object.keys(pausedModels)) set.add(m);
    return [...set];
  }, [models, localModels, pullingModels, pausedModels]);

  const handleOverlayClick = (e) => {
    if (e.target.id === 'manage-overlay') onClose();
  };

  /* ── Search ──────────────────────────────────────────── */
  const trimmedQuery = query.trim().toLowerCase();
  const suggestions = trimmedQuery
    ? MODEL_CATALOG.filter(
        (item) =>
          item.name.toLowerCase().includes(trimmedQuery) ||
          item.desc.toLowerCase().includes(trimmedQuery),
      ).slice(0, 8)
    : [];
  const hasExactMatch = suggestions.some(
    (s) => s.name.toLowerCase() === trimmedQuery,
  );

  const handleInstallFromSearch = (name) => {
    installModel(name);
    setQuery('');
    setShowSuggestions(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && trimmedQuery) {
      handleInstallFromSearch(query.trim());
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  /* ── Render a single model row ───────────────────────── */
  const renderRow = (model) => {
    const isPulling = pullingModels.has(model);
    const isPaused = model in pausedModels;
    const isInstalled = localModels.has(model);
    const isActive = model === currentModel;
    const progress = pullProgress[model] || pausedModels[model] || {};

    /* ── Pulling / Paused row ── */
    if (isPulling || isPaused) {
      const pct = progress.pct || 0;
      const stats = [progress.speed, progress.total, progress.eta]
        .filter(Boolean)
        .join(' · ');
      const pctLabel = isPaused
        ? `Paused${pct > 0 ? ` · ${pct}%` : ''}`
        : `${pct}%`;

      return (
        <div className="mm-row" key={model}>
          <div className="mm-icon pulling">{isPaused ? '⏸' : '↓'}</div>
          <div className="mm-progress">
            <div className="mm-progress-top">
              <span className="mm-progress-name">{model}</span>
              <span className="mm-progress-pct">{pctLabel}</span>
            </div>
            <div className="mm-progress-bar">
              <div
                className={`mm-progress-fill${isPaused ? ' paused' : ''}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            {stats && <div className="mm-progress-stats">{stats}</div>}
          </div>
          <div className="mm-actions mm-actions-pull">
            {isPaused ? (
              <button className="mm-btn" onClick={() => resumePull(model)}>
                Resume
              </button>
            ) : (
              <button className="mm-btn" onClick={() => pausePull(model)}>
                Pause
              </button>
            )}
            <button className="mm-trash" onClick={() => cancelPull(model)}>
              <TrashIcon />
            </button>
          </div>
        </div>
      );
    }

    /* ── Normal row (installed / available) ── */
    const info = localModelInfo[model];
    const sizeStr = isInstalled && info ? formatBytes(info.size || 0) : '';

    return (
      <div className="mm-row" key={model}>
        {isInstalled ? (
          <div className="mm-icon installed">✓</div>
        ) : (
          <div className="mm-icon available">+</div>
        )}

        <div className="mm-body">
          <div className="mm-details">
            <div className="mm-name">{model}</div>
            <div className="mm-meta-row">
              {sizeStr && <span className="mm-size">{sizeStr}</span>}
              {isActive && <span className="mm-status active">Active</span>}
              {isInstalled && !isActive && (
                <span className="mm-status installed">Installed</span>
              )}
            </div>
          </div>

          <div className="mm-actions">
            {!isInstalled ? (
              <>
                <button
                  className="mm-btn primary"
                  onClick={() => pullModel(model)}
                >
                  Install
                </button>
                <button
                  className="mm-trash"
                  onClick={() => removeModel(model)}
                >
                  <TrashIcon />
                </button>
              </>
            ) : isActive ? (
              <button
                className="mm-trash"
                onClick={() => deleteModel(model)}
              >
                <TrashIcon />
              </button>
            ) : (
              <>
                <button
                  className="mm-btn"
                  onClick={() => {
                    selectModel(model);
                  }}
                >
                  Select
                </button>
                <button
                  className="mm-trash"
                  onClick={() => deleteModel(model)}
                >
                  <TrashIcon />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  /* ── Render ──────────────────────────────────────────── */
  return (
    <div
      id="manage-overlay"
      className={isOpen ? 'open' : ''}
      onClick={handleOverlayClick}
    >
      <div id="manage-modal">
        <div id="manage-header">
          <h2>Manage Models</h2>
          <button id="manage-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div id="manage-body">{allModels.map(renderRow)}</div>

        <div id="manage-footer" ref={footerRef}>
          {showSuggestions && trimmedQuery && (
            <div id="manage-suggestions" className="open">
              {suggestions.map((item) => {
                const installed = localModels.has(item.name);
                return (
                  <div
                    className="ms-item"
                    key={item.name}
                    onClick={() => {
                      if (!installed) handleInstallFromSearch(item.name);
                    }}
                  >
                    <div className="ms-info">
                      <span className="ms-name">{item.name}</span>
                      <span className="ms-desc">{item.desc}</span>
                    </div>
                    <span className="ms-sizes">{item.sizes}</span>
                    {installed && (
                      <span className="ms-installed">Installed</span>
                    )}
                  </div>
                );
              })}
              {!hasExactMatch && (
                <div
                  className="ms-custom"
                  onClick={() => handleInstallFromSearch(query.trim())}
                >
                  Install <strong>{query.trim()}</strong> from Ollama registry
                </div>
              )}
            </div>
          )}

          <div id="manage-search-wrap">
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
            <input
              id="manage-add-input"
              ref={inputRef}
              type="text"
              placeholder="Search or add a model..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => {
                if (trimmedQuery) setShowSuggestions(true);
              }}
              onKeyDown={handleKeyDown}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
