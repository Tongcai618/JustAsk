import React from 'react';
import { useApp } from '../context/AppContext';
import ModelDropdown from './ModelDropdown';

export default function Header({ playgroundActive, onTogglePlayground, onOpenManage }) {
  const { theme, setTheme, mode, setMode } = useApp();

  const isWordMix = mode === 'wordmix';
  const toggleWordMix = () => setMode(isWordMix ? 'chat' : 'wordmix');

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header>
      <h1>JustAsk</h1>

      <ModelDropdown onOpenManage={onOpenManage} />

      <div className="header-spacer" />

      <button
        className={`header-btn${isWordMix ? ' active' : ''}`}
        onClick={toggleWordMix}
        title="WordMix"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
        </svg>
        <span>WordMix</span>
      </button>

      <button
        className={`header-btn${playgroundActive ? ' active' : ''}`}
        onClick={onTogglePlayground}
        title="Playground"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
        </svg>
        <span>Playground</span>
      </button>

      <button className="header-btn" onClick={toggleTheme} title="Toggle theme">
        {theme === 'dark' ? (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        ) : (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
        )}
        <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
      </button>
    </header>
  );
}
