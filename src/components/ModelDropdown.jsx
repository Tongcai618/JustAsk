import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';

export default function ModelDropdown({ onOpenManage }) {
  const {
    currentModel,
    selectModel,
    models,
    localModels,
    pullingModels,
    pullProgress,
    pausedModels,
    pullModel,
    pausePull,
    resumePull,
    fetchLocalModels,
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const wrapRef = useRef(null);

  /* ── Toggle dropdown ─────────────────────────────────────────── */
  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) fetchLocalModels();
      return next;
    });
  }, [fetchLocalModels]);

  /* ── Close on outside click ──────────────────────────────────── */
  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [isOpen]);

  /* ── Select a model ──────────────────────────────────────────── */
  const handleSelect = (model) => {
    selectModel(model);
    setIsOpen(false);
  };

  /* ── Render a single model option ────────────────────────────── */
  const renderOption = (model) => {
    const isPulling = pullingModels.has(model);
    const isPaused = !!pausedModels[model];
    const isInstalled = localModels.has(model);
    const isSelected = model === currentModel;
    const prog = pullProgress[model] || pausedModels[model] || {};

    /* ─ Pulling state ─ */
    if (isPulling) {
      const speed = prog.speed || '';
      const stats = [speed, prog.total, prog.eta].filter(Boolean).join(' \u00b7 ');
      const pct = prog.pct || 0;
      const isIndeterminate = pct === 0;

      return (
        <div key={model} className="model-option pulling">
          <div className="model-pull-progress">
            <div className="model-pull-top">
              <span className="model-pull-name">{model}</span>
              <span className="model-pull-pct">{pct}%</span>
            </div>
            <div className="model-pull-bar-track">
              <div
                className={`model-pull-bar-fill${isIndeterminate ? ' indeterminate' : ''}`}
                style={isIndeterminate ? {} : { width: `${pct}%` }}
              />
            </div>
            <div className="model-pull-stats">{stats}</div>
          </div>
          <button
            className="model-pull-action"
            onClick={(e) => {
              e.stopPropagation();
              pausePull(model);
            }}
            title="Pause"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          </button>
        </div>
      );
    }

    /* ─ Paused state ─ */
    if (isPaused) {
      const pausedProg = pausedModels[model] || {};
      const stats = pausedProg.total || '';

      return (
        <div key={model} className="model-option paused">
          <div className="model-pull-progress">
            <div className="model-pull-top">
              <span className="model-pull-name">{model}</span>
              <span className="model-pull-pct">Paused</span>
            </div>
            <div className="model-pull-bar-track">
              <div
                className="model-pull-bar-fill"
                style={{ width: `${pausedProg.pct || 0}%` }}
              />
            </div>
            {stats && <div className="model-pull-stats">{stats}</div>}
          </div>
          <button
            className="model-pull-action"
            onClick={(e) => {
              e.stopPropagation();
              resumePull(model);
            }}
            title="Resume"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        </div>
      );
    }

    /* ─ Not installed ─ */
    if (!isInstalled) {
      return (
        <div
          key={model}
          className="model-option not-installed"
          onClick={() => pullModel(model)}
        >
          <span>{model}</span>
          <span className="model-plus">+</span>
        </div>
      );
    }

    /* ─ Installed (selectable) ─ */
    return (
      <div
        key={model}
        className={`model-option${isSelected ? ' selected' : ''}`}
        onClick={() => handleSelect(model)}
      >
        <span>{model}</span>
        <svg
          className="check"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ visibility: isSelected ? 'visible' : 'hidden' }}
        >
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
    );
  };

  return (
    <div id="model-dropdown-wrap" ref={wrapRef}>
      <button id="model-btn" onClick={toggle}>
        <span id="model-btn-label">{currentModel}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      <div id="model-menu" className={isOpen ? 'open' : ''}>
        {models.map((model) => renderOption(model))}

        <hr className="model-menu-divider" />

        <div
          className="model-option"
          onClick={() => {
            setIsOpen(false);
            if (onOpenManage) onOpenManage();
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span>Manage models...</span>
        </div>
      </div>
    </div>
  );
}
