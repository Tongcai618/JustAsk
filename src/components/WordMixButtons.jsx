import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { pickRandom, getWord, getWords } from '../lib/wordbank';
import {
  scheduleReview,
  getDueWords,
  createEmptyProgress,
  updateStats,
} from '../lib/srs';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'All'];

export default function WordMixButtons() {
  const { isStreaming, sendMessage, history, clearWordMixHistory } = useApp();

  const [phase, setPhase] = useState('pick-level'); // 'pick-level' | 'waiting' | 'learning'
  const [currentWord, setCurrentWord] = useState(null);
  const [currentLevel, setCurrentLevel] = useState(null);
  const [rated, setRated] = useState(false);
  const [meaningShown, setMeaningShown] = useState(false);
  const [progress, setProgress] = useState(null);
  const [dueCount, setDueCount] = useState(0);
  const progressRef = useRef(null);

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
      setMeaningShown(false);
      setPhase('waiting');

      const prompt = `你是一个中英混合造句助手。请用中文造一个自然的句子，但是把「${word.translation}」替换成英文单词「${word.word}」。\n\n要求：\n- 句子要自然、日常，像中国人说话时夹杂英文一样\n- 句子长度 15-30 个字\n- 不要解释这个单词的意思\n- 只输出句子，不要其他内容\n\n单词：${word.word}（${word.translation}）\n词性：${word.pos}`;

      const label = displayTextOverride ?? (level === 'Review' ? `Review: ${word.word}` : level === 'All' ? 'New word' : `New ${level} word`);
      sendMessage(prompt, { displayText: label, wordData: word });
    },
    [sendMessage],
  );

  const handlePickLevel = useCallback(
    (level) => {
      const word = pickRandom(level === 'All' ? null : level);
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

  const handleToggleMeaning = useCallback(() => {
    setMeaningShown((prev) => !prev);
  }, []);

  const handleNewSentence = useCallback(() => {
    if (!currentWord) return;
    sendWordPrompt(currentWord, currentLevel, `New sentence: ${currentWord.word}`);
  }, [currentWord, currentLevel, sendWordPrompt]);

  const handleExplainMore = useCallback(() => {
    if (!currentWord) return;
    sendMessage(
      `请用中文详细解释英文单词「${currentWord.word}」的意思、用法和常见搭配。`,
      { displayText: `Explain ${currentWord.word}` },
    );
  }, [currentWord, sendMessage]);

  const handleChangeLevel = useCallback(() => {
    setPhase('pick-level');
    setCurrentWord(null);
    setRated(false);
    setMeaningShown(false);
  }, []);

  // --- Mixed paragraph ---
  const studiedWordCount = progress?.words ? Object.keys(progress.words).length : 0;
  const canMixParagraph = studiedWordCount >= 3;

  const handleMixedParagraph = useCallback(() => {
    const p = progressRef.current;
    if (!p?.words) return;

    const studiedNames = Object.keys(p.words);
    if (studiedNames.length < 3) return;

    // Auto-scale word count
    let count;
    if (studiedNames.length <= 5) count = 3;
    else if (studiedNames.length <= 15) count = 5;
    else count = Math.min(10, studiedNames.length);

    // Pick random studied words
    const shuffled = [...studiedNames].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, count);

    // Look up translations from word bank
    const wordList = picked
      .map((name) => {
        const w = getWord(name);
        return w ? `${w.word}（${w.translation}）` : name;
      })
      .join('\n');

    const prompt = `你是一个中英混合写作助手。请用中文写一段话（3-5句话），但是把以下单词用英文替换对应的中文：\n\n${wordList}\n\n要求：\n- 段落要自然流畅，像一个中国人日常写作时夹杂英文一样\n- 所有英文单词都要用对，词性和语境正确\n- 不要解释单词的意思\n- 只输出段落，不要其他内容`;

    setPhase('waiting');
    setCurrentWord(null);
    setRated(false);
    setMeaningShown(false);
    sendMessage(prompt, { displayText: `Mix ${count} words into a paragraph` });
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

      {/* Meaning reveal */}
      {meaningShown && currentWord && (
        <div className="wmx-meaning">
          <span className="wmx-meaning-label">💡</span>
          <span className="wmx-meaning-text">{currentWord.translation}</span>
          <button
            className="wmx-action-btn"
            onClick={handleExplainMore}
            disabled={isStreaming}
          >
            Explain More
          </button>
        </div>
      )}

      {/* Rating buttons (only for single-word mode) */}
      {currentWord && !rated && (
        <div className="wmx-rating-row">
          <button className="wmx-rate-btn wmx-hard" onClick={() => handleRate('hard')}>
            Hard
          </button>
          <button className="wmx-rate-btn wmx-okay" onClick={() => handleRate('okay')}>
            Okay
          </button>
          <button className="wmx-rate-btn wmx-easy" onClick={() => handleRate('easy')}>
            Easy
          </button>
        </div>
      )}

      {/* Navigation buttons — locked until rated (for single-word mode) */}
      <div className="wmx-nav-row">
        {currentWord && (
          <button
            className="wmx-action-btn"
            onClick={handleToggleMeaning}
            disabled={!rated}
          >
            {meaningShown ? 'Hide Meaning' : 'Show Meaning'}
          </button>
        )}
        {currentWord && (
          <button
            className="wmx-action-btn"
            onClick={handleNewSentence}
            disabled={isStreaming}
          >
            New Sentence
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
            Mix My Words
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
