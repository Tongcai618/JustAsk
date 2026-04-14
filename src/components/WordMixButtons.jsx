import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { getWord, getWords } from '../lib/wordbank';
import {
  scheduleReview,
  getDueWords,
  createEmptyProgress,
  updateStats,
  getWordWeight,
} from '../lib/srs';

// Weighted random pick from an array
function weightedPick(items, getWeight) {
  const weights = items.map(getWeight);
  const total = weights.reduce((a, b) => a + b, 0);
  if (total === 0) return items.length > 0 ? items[Math.floor(Math.random() * items.length)] : null;
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

// Weighted random pick of N items without replacement
function weightedPickN(items, n, getWeight) {
  const pool = [...items];
  const picked = [];
  while (picked.length < n && pool.length > 0) {
    const weights = pool.map(getWeight);
    const total = weights.reduce((a, b) => a + b, 0);
    if (total === 0) break;
    let r = Math.random() * total;
    let idx = pool.length - 1;
    for (let i = 0; i < pool.length; i++) {
      r -= weights[i];
      if (r <= 0) { idx = i; break; }
    }
    picked.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return picked;
}

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'All'];

export default function WordMixButtons() {
  const { isStreaming, sendMessage, history, clearWordMixHistory, pendingWordSession, clearPendingWordSession } = useApp();

  const [phase, setPhase] = useState('pick-level'); // 'pick-level' | 'waiting' | 'learning'
  const [currentWord, setCurrentWord] = useState(null);
  const [currentLevel, setCurrentLevel] = useState(null);
  const [rated, setRated] = useState(false);
  const [progress, setProgress] = useState(null);
  const [dueCount, setDueCount] = useState(0);
  const progressRef = useRef(null);
  const prevStateRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);

  // Load progress on mount
  useEffect(() => {
    async function load() {
      let data = null;
      if (window.electronAPI?.loadProgress) {
        data = await window.electronAPI.loadProgress();
      }
      const p = data || createEmptyProgress();
      setProgress(p);
      progressRef.current = p;
      setDueCount(getDueWords(p).length);
    }
    load();
  }, []);

  // Save progress helper
  const saveProgress = useCallback((p) => {
    setProgress(p);
    progressRef.current = p;
    setDueCount(getDueWords(p).length);
    if (window.electronAPI?.saveProgress) {
      window.electronAPI.saveProgress(p);
    }
  }, []);

  // Switch to learning phase after AI finishes streaming
  useEffect(() => {
    if (!isStreaming && phase === 'waiting') {
      setPhase('learning');
    }
  }, [isStreaming, phase]);

  const sendWordPrompt = useCallback(
    (word, level, displayTextOverride) => {
      setCurrentWord(word);
      setCurrentLevel(level);
      setRated(false);
      setPhase('waiting');

      const prompt = `你是一个中英混合造句助手。请用中文造一个句子，句子中必须包含英文单词「${word.word}」，不能把它翻译成中文。\n\n要求：\n- 句子中必须出现英文「${word.word}」，不能用中文「${word.translation}」代替\n- 句子要自然、日常，像中国人说话时夹杂英文一样\n- 句子长度 15-30 个字\n- 不要解释这个单词的意思\n- 只输出句子，不要其他内容\n\n单词：${word.word}（${word.translation}）\n词性：${word.pos}`;

      const label = displayTextOverride ?? (level === 'Review' ? `Review: ${word.word}` : level === 'All' ? 'New word' : `New ${level} word`);
      sendMessage(prompt, { displayText: label, wordData: word });
    },
    [sendMessage],
  );

  // Handle word session requested from chat panel (must be after sendWordPrompt)
  useEffect(() => {
    if (!pendingWordSession) return;
    clearPendingWordSession();
    sendWordPrompt(
      pendingWordSession.word,
      pendingWordSession.level,
      `Another example: ${pendingWordSession.word.word}`,
    );
  }, [pendingWordSession, clearPendingWordSession, sendWordPrompt]);

  const handlePickLevel = useCallback(
    (level) => {
      const all = getWords();
      const pool = level === 'All' ? all : all.filter((w) => w.level === level);
      if (pool.length === 0) return;
      const p = progressRef.current;
      const word = weightedPick(pool, (w) => getWordWeight(p?.words?.[w.word]));
      if (!word) return;
      sendWordPrompt(word, level);
    },
    [sendWordPrompt],
  );

  const handleReview = useCallback(() => {
    const p = progressRef.current || createEmptyProgress();
    const dueWordNames = getDueWords(p);
    if (dueWordNames.length === 0) return;

    // Pick a random due word
    const name = dueWordNames[Math.floor(Math.random() * dueWordNames.length)];
    const word = getWord(name);
    if (!word) return;

    sendWordPrompt(word, 'Review');
  }, [sendWordPrompt]);

  const handleNextWord = useCallback(() => {
    handlePickLevel(currentLevel === 'Review' ? 'All' : currentLevel || 'All');
  }, [handlePickLevel, currentLevel]);

  const handleRate = useCallback(
    (rating) => {
      if (!currentWord) return;
      setRated(true);

      const p = { ...(progressRef.current || createEmptyProgress()) };
      p.words = { ...p.words };

      const existing = p.words[currentWord.word] || null;
      p.words[currentWord.word] = scheduleReview(existing, rating);

      // Count total learned (words with at least one review)
      p.stats = updateStats(p, rating);
      p.stats.totalLearned = Object.keys(p.words).length;

      saveProgress(p);
    },
    [currentWord, saveProgress],
  );

  const handleNewSentence = useCallback(() => {
    if (!currentWord) return;
    sendWordPrompt(currentWord, currentLevel, `Another example: ${currentWord.word}`);
  }, [currentWord, currentLevel, sendWordPrompt]);

  const handleExplainMore = useCallback(() => {
    if (!currentWord) return;
    sendMessage(
      `请用中文详细解释英文单词「${currentWord.word}」的意思、用法和常见搭配。`,
      { displayText: `Explain ${currentWord.word}`, useMarkdown: true },
    );
  }, [currentWord, sendMessage]);

  const handleChangeLevel = useCallback(() => {
    prevStateRef.current = { currentWord, currentLevel, rated };
    setCanGoBack(true);
    setPhase('pick-level');
    setCurrentWord(null);
    setRated(false);
  }, [currentWord, currentLevel, rated]);

  const handleGoBack = useCallback(() => {
    const prev = prevStateRef.current;
    if (!prev) return;
    setCurrentWord(prev.currentWord);
    setCurrentLevel(prev.currentLevel);
    setRated(prev.rated);
    setPhase('learning');
    prevStateRef.current = null;
    setCanGoBack(false);
  }, []);

  // --- Mixed paragraph ---
  const studiedWordCount = progress?.words ? Object.keys(progress.words).length : 0;
  const canMixParagraph = studiedWordCount >= 5;

  const handleMixedParagraph = useCallback(() => {
    const p = progressRef.current;
    if (!p?.words) return;

    const studiedNames = Object.keys(p.words);
    if (studiedNames.length < 5) return;

    const count = 5;

    // Weighted pick from studied words — overdue words more likely, dismissed excluded
    const studiedWords = studiedNames.map((name) => getWord(name)).filter(Boolean);
    const picked = weightedPickN(studiedWords, count, (w) => getWordWeight(p.words[w.word]));
    if (picked.length < 3) return; // not enough non-dismissed words

    // Look up translations from word bank
    const wordList = picked
      .map((w) => `${w.word}（${w.translation}）`)
      .join('\n');

    const prompt = `你是一个中英混合写作助手。请用中文写一段话（3-5句话），把下列每个英文单词自然地嵌入句子中，替换掉它对应的中文意思：\n\n${wordList}\n\n要求：\n- 每个单词只出现一次\n- 段落要有一个统一的主题，内容连贯自然\n- 语气像一个中国人日常写作时偶尔夹杂英文\n- 每个英文单词的词性和语境必须正确\n- 不要解释单词的意思\n- 只输出段落，不要其他内容`;

    setPhase('waiting');
    setCurrentWord(null);
    setRated(false);
    sendMessage(prompt, { displayText: 'Story Mode' });
  }, [sendMessage]);

  // --- Stats bar ---
  const stats = progress?.stats;
  const statsBar = stats && stats.totalLearned > 0 && (
    <div className="wmx-stats-bar">
      <span className="wmx-stat">{stats.totalLearned} learned</span>
      <span className="wmx-stat-dot" />
      <span className="wmx-stat">streak {stats.streak || 0}d</span>
      {dueCount > 0 && (
        <>
          <span className="wmx-stat-dot" />
          <span className="wmx-stat wmx-stat-due">{dueCount} due</span>
        </>
      )}
    </div>
  );

  // --- Pick level phase ---
  if (phase === 'pick-level') {
    return (
      <div className="wmx-buttons">
        {statsBar}
        <div className="wmx-label">Pick a level to start</div>
        <div className="wmx-level-row">
          {LEVELS.map((level) => (
            <button
              key={level}
              className={`wmx-level-btn${level === 'All' ? ' wmx-level-all' : ''}`}
              onClick={() => handlePickLevel(level)}
            >
              {level}
            </button>
          ))}
        </div>
        {dueCount > 0 && (
          <div className="wmx-level-row">
            <button className="wmx-level-btn wmx-review-btn" onClick={handleReview}>
              Review ({dueCount} due)
            </button>
          </div>
        )}
        {canGoBack && (
          <div className="wmx-level-row">
            <button className="wmx-action-btn" onClick={handleGoBack}>
              ← Back
            </button>
          </div>
        )}
        {history.length > 0 && (
          <div className="wmx-level-row">
            <button className="wmx-clear-btn" onClick={clearWordMixHistory}>
              Clear History
            </button>
          </div>
        )}
      </div>
    );
  }

  // --- Waiting for AI to finish streaming ---
  if (phase === 'waiting') {
    return (
      <div className="wmx-buttons">
        {statsBar}
      </div>
    );
  }

  // --- Learning phase ---
  return (
    <div className="wmx-buttons">
      {statsBar}

      {/* Rating buttons (only for single-word mode) */}
      {currentWord && !rated && (
        <div className="wmx-rating-row">
          <button className="wmx-rate-btn wmx-again" onClick={() => handleRate('again')}>
            I want to see this word
          </button>
          <button className="wmx-rate-btn wmx-later" onClick={() => handleRate('later')}>
            I may want to see this word in the future
          </button>
          <button className="wmx-rate-btn wmx-dismiss" onClick={() => handleRate('dismiss')}>
            I don't want to see this word in the future
          </button>
        </div>
      )}

      {/* Navigation buttons — locked until rated (for single-word mode) */}
      <div className="wmx-nav-row">
        {currentWord && (
          <button
            className="wmx-action-btn"
            onClick={handleNewSentence}
            disabled={isStreaming}
          >
            Another Example
          </button>
        )}
        <button
          className="wmx-action-btn wmx-action-primary"
          onClick={handleNextWord}
          disabled={isStreaming || (currentWord && !rated)}
        >
          Next Word →
        </button>
        {canMixParagraph && (
          <button
            className="wmx-action-btn wmx-action-mix"
            onClick={handleMixedParagraph}
            disabled={isStreaming || (currentWord && !rated)}
          >
            Story Mode
          </button>
        )}
        <button
          className="wmx-action-btn"
          onClick={handleChangeLevel}
          disabled={!!(currentWord && !rated)}
        >
          Change Level
        </button>
      </div>
    </div>
  );
}
