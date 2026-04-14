import React from 'react';
import { getWord } from '../lib/wordbank';

// Strip markdown bold/italic so **word** → word
function stripMarkdown(text) {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1');
}

// Split text into alternating [non-English, English-word, non-English, ...] tokens
function tokenize(text) {
  return text.split(/(\b[a-zA-Z]+(?:['-][a-zA-Z]+)*\b)/g);
}

export default function HighlightedMessage({ content, msgIdx, selectedWordInfo, onWordClick }) {
  const tokens = tokenize(stripMarkdown(content || ''));

  return (
    <span style={{ whiteSpace: 'pre-wrap' }}>
      {tokens.map((token, i) => {
        // Even indices: non-English text (Chinese, punctuation, spaces)
        if (i % 2 === 0) return token ? <span key={i}>{token}</span> : null;

        // Odd indices: English word — check if it's in the word bank
        const wordEntry = getWord(token);
        if (!wordEntry) return <span key={i}>{token}</span>;

        const isSelected =
          selectedWordInfo?.msgIdx === msgIdx &&
          selectedWordInfo?.wordEntry?.word?.toLowerCase() === token.toLowerCase();

        return (
          <span
            key={i}
            className={`wmx-hl-word${isSelected ? ' wmx-hl-active' : ''}`}
            onClick={() => onWordClick(msgIdx, wordEntry, isSelected)}
          >
            {token}
          </span>
        );
      })}
    </span>
  );
}
