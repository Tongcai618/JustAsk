import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';

import { DEFAULT_MODELS } from '../lib/constants';
import {
  formatSpeed,
  formatBytes,
  formatETA,
  generateId,
  titleFromMessages,
} from '../lib/helpers';

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */
const AppContext = createContext(null);

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */
export function AppProvider({ children }) {
  /* ── core state -------------------------------------------------- */
  const [apiBase, setApiBase] = useState('http://127.0.0.1:3131');
  const [theme, setThemeState] = useState(
    () => localStorage.getItem('theme') || 'dark',
  );
  const [currentModel, setCurrentModel] = useState(
    () => localStorage.getItem('model') || 'gemma4:e2b',
  );
  const [models, setModels] = useState(() => [...DEFAULT_MODELS]);

  /* ── local Ollama state ------------------------------------------ */
  const [localModels, setLocalModels] = useState(new Set());
  const [localModelInfo, setLocalModelInfo] = useState({});
  const [pullingModels, setPullingModels] = useState(new Set());
  const [pullProgress, setPullProgress] = useState({});
  const [pausedModels, setPausedModels] = useState({});

  /* ── conversation state ------------------------------------------ */
  const [conversations, setConversations] = useState([]);
  const [currentConvId, setCurrentConvId] = useState(null);
  const [history, setHistory] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [pendingNewChat, setPendingNewChat] = useState(false);

  /* ── refs -------------------------------------------------------- */
  const speedIntervalsRef = useRef({});     // model -> intervalId
  const prevCompletedRef = useRef({});      // model -> last rawCompleted
  const streamTextRef = useRef('');         // mutable fullText during streaming
  const abortRef = useRef(null);           // AbortController for streaming

  /* ================================================================ */
  /*  Theme                                                           */
  /* ================================================================ */
  const setTheme = useCallback((next) => {
    setThemeState(next);
    localStorage.setItem('theme', next);

    // Swap highlight.js stylesheet if present
    const hljsLink = document.querySelector('link[data-hljs]');
    if (hljsLink) {
      hljsLink.href =
        next === 'light'
          ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css'
          : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css';
    }

    document.documentElement.setAttribute('data-theme', next);
  }, []);

  /* ================================================================ */
  /*  Model selection                                                 */
  /* ================================================================ */
  const selectModel = useCallback((model) => {
    setCurrentModel(model);
    localStorage.setItem('model', model);
  }, []);

  /* ================================================================ */
  /*  Fetch local models from Ollama                                  */
  /* ================================================================ */
  const fetchLocalModels = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/api/tags`);
      if (!res.ok) return;
      const data = await res.json();
      const installed = new Set();
      const info = {};
      for (const m of data.models || []) {
        installed.add(m.name);
        info[m.name] = m;
      }
      setLocalModels(installed);
      setLocalModelInfo(info);
    } catch {
      /* Ollama not running or proxy unavailable */
    }
  }, [apiBase]);

  /* ================================================================ */
  /*  Speed tracking helpers                                          */
  /* ================================================================ */
  const startSpeedInterval = useCallback((model) => {
    // Clear any existing interval first
    if (speedIntervalsRef.current[model]) {
      clearInterval(speedIntervalsRef.current[model]);
    }
    prevCompletedRef.current[model] = 0;

    speedIntervalsRef.current[model] = setInterval(() => {
      setPullProgress((prev) => {
        const entry = prev[model];
        if (!entry) return prev;

        const prevCompleted = prevCompletedRef.current[model] || 0;
        const delta = (entry.rawCompleted || 0) - prevCompleted;
        prevCompletedRef.current[model] = entry.rawCompleted || 0;

        const speed = Math.max(0, delta); // bytes per second
        const remaining = (entry.rawTotal || 0) - (entry.rawCompleted || 0);
        const eta = speed > 0 ? remaining / speed : 0;

        return {
          ...prev,
          [model]: {
            ...entry,
            speed: formatSpeed(speed),
            eta: formatETA(eta),
          },
        };
      });
    }, 1000);
  }, []);

  const stopSpeedInterval = useCallback((model) => {
    if (speedIntervalsRef.current[model]) {
      clearInterval(speedIntervalsRef.current[model]);
      delete speedIntervalsRef.current[model];
    }
    delete prevCompletedRef.current[model];
  }, []);

  /* ================================================================ */
  /*  Pull model                                                      */
  /* ================================================================ */
  const pullModel = useCallback(
    async (model) => {
      setPullingModels((prev) => new Set(prev).add(model));
      setPausedModels((prev) => {
        const next = { ...prev };
        delete next[model];
        return next;
      });
      setPullProgress((prev) => ({
        ...prev,
        [model]: { pct: 0, label: 'Starting...', total: '', rawCompleted: 0, rawTotal: 0, speed: '', eta: '' },
      }));

      startSpeedInterval(model);

      try {
        await window.electronAPI.pullModel(model);
      } catch {
        /* handled via IPC progress events */
      }
    },
    [startSpeedInterval],
  );

  /* ================================================================ */
  /*  Pause / Resume / Cancel pull                                    */
  /* ================================================================ */
  const pausePull = useCallback(
    async (model) => {
      await window.electronAPI.pausePull(model);
      // The actual state transition happens in the onPullProgress handler
    },
    [],
  );

  const resumePull = useCallback(
    (model) => {
      pullModel(model);
    },
    [pullModel],
  );

  const cancelPull = useCallback(
    async (model) => {
      // If it is currently pulling, pause it first to stop the download
      if (pullingModels.has?.(model)) {
        try {
          await window.electronAPI.pausePull(model);
        } catch {
          /* ignore */
        }
      }

      stopSpeedInterval(model);

      setPullingModels((prev) => {
        const next = new Set(prev);
        next.delete(model);
        return next;
      });
      setPullProgress((prev) => {
        const next = { ...prev };
        delete next[model];
        return next;
      });
      setPausedModels((prev) => {
        const next = { ...prev };
        delete next[model];
        return next;
      });
    },
    [stopSpeedInterval, pullingModels],
  );

  /* ================================================================ */
  /*  Delete model from Ollama                                        */
  /* ================================================================ */
  const deleteModel = useCallback(
    async (model) => {
      try {
        await window.electronAPI.deleteModel(model);
        setLocalModels((prev) => {
          const next = new Set(prev);
          next.delete(model);
          return next;
        });
        setLocalModelInfo((prev) => {
          const next = { ...prev };
          delete next[model];
          return next;
        });
      } catch {
        /* ignore */
      }
    },
    [],
  );

  /* ================================================================ */
  /*  Remove model from UI list (not Ollama)                          */
  /* ================================================================ */
  const removeModel = useCallback((model) => {
    setModels((prev) => prev.filter((m) => m !== model));
  }, []);

  /* ================================================================ */
  /*  Install model (add to list + pull)                              */
  /* ================================================================ */
  const installModel = useCallback(
    (name) => {
      setModels((prev) => (prev.includes(name) ? prev : [...prev, name]));
      pullModel(name);
    },
    [pullModel],
  );

  /* ================================================================ */
  /*  Conversation management                                         */
  /* ================================================================ */
  const newChat = useCallback(() => {
    setHistory([]);
    setCurrentConvId(null);
    setPendingNewChat(true);
  }, []);

  const loadConversation = useCallback(
    (id) => {
      const conv = conversations.find((c) => c.id === id);
      if (conv) {
        setHistory(conv.messages || []);
        setCurrentConvId(id);
        setPendingNewChat(false);
      }
    },
    [conversations],
  );

  const deleteConversation = useCallback(
    async (id) => {
      try {
        const updated = await window.electronAPI.deleteConversation(id);
        setConversations(updated);
        if (currentConvId === id) {
          setHistory([]);
          setCurrentConvId(null);
        }
      } catch {
        /* ignore */
      }
    },
    [currentConvId],
  );

  const saveCurrentConversation = useCallback(async () => {
    if (history.length === 0) return;

    const id = currentConvId || generateId();
    const conv = {
      id,
      title: titleFromMessages(history),
      messages: history,
      updatedAt: new Date().toISOString(),
    };

    try {
      const updated = await window.electronAPI.saveConversation(conv);
      setConversations(updated);
      setCurrentConvId(id);
    } catch {
      /* ignore */
    }
  }, [history, currentConvId]);

  /* ================================================================ */
  /*  Send message (SSE streaming chat)                               */
  /* ================================================================ */
  const sendMessage = useCallback(
    async (text) => {
      if (!text.trim() || isStreaming) return;

      const userMsg = { role: 'user', content: text.trim() };
      const nextHistory = [...history, userMsg];
      setHistory(nextHistory);
      setPendingNewChat(false);
      setIsStreaming(true);
      streamTextRef.current = '';

      // Add a placeholder assistant message
      setHistory((prev) => [...prev, { role: 'assistant', content: '' }]);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(`${apiBase}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: currentModel,
            messages: nextHistory,
            stream: true,
          }),
          signal: controller.signal,
        });

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop(); // keep incomplete line

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            if (trimmed === 'data: [DONE]') {
              // Stream finished
              continue;
            }

            if (trimmed.startsWith('data: ')) {
              try {
                const payload = JSON.parse(trimmed.slice(6));
                if (payload.error) {
                  streamTextRef.current += `\n\n**Error:** ${payload.error}`;
                } else if (payload.content) {
                  streamTextRef.current += payload.content;
                }

                const fullText = streamTextRef.current;
                setHistory((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: 'assistant',
                    content: fullText,
                  };
                  return updated;
                });
              } catch {
                /* skip malformed JSON */
              }
            }
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          const errorText =
            streamTextRef.current +
            `\n\n**Error:** Could not reach the model. Is Ollama running?`;
          setHistory((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: 'assistant',
              content: errorText,
            };
            return updated;
          });
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;

        // Save after streaming completes
        // We need the latest history, so we use a micro-task
        // to let the final setHistory flush, then save.
        setTimeout(() => {
          // saveCurrentConversation will read the latest state via its own closure;
          // however because we need the *updated* history we trigger save from
          // an effect instead. We set a flag here.
        }, 0);
      }
    },
    [apiBase, currentModel, history, isStreaming],
  );

  /* ── auto-save after streaming completes ─────────────────────── */
  const prevStreamingRef = useRef(false);
  useEffect(() => {
    if (prevStreamingRef.current && !isStreaming && history.length > 0) {
      saveCurrentConversation();
    }
    prevStreamingRef.current = isStreaming;
  }, [isStreaming, history, saveCurrentConversation]);

  /* ================================================================ */
  /*  IPC: pull-progress listener                                     */
  /* ================================================================ */
  useEffect(() => {
    if (!window.electronAPI?.onPullProgress) return;

    const handler = (data) => {
      const { model } = data;

      if (data.paused) {
        // Snapshot current progress into pausedModels
        setPullProgress((prev) => {
          const snapshot = prev[model] || {};
          setPausedModels((pm) => ({ ...pm, [model]: { ...snapshot } }));
          return prev;
        });
        setPullingModels((prev) => {
          const next = new Set(prev);
          next.delete(model);
          return next;
        });
        stopSpeedInterval(model);
        return;
      }

      if (data.done) {
        setPullingModels((prev) => {
          const next = new Set(prev);
          next.delete(model);
          return next;
        });
        setPullProgress((prev) => {
          const next = { ...prev };
          delete next[model];
          return next;
        });
        setPausedModels((prev) => {
          const next = { ...prev };
          delete next[model];
          return next;
        });
        stopSpeedInterval(model);
        fetchLocalModels();
        return;
      }

      // Normal progress update
      const total = data.total || 0;
      const completed = data.completed || 0;
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
      const label = data.status || 'Downloading...';
      const totalStr = total > 0 ? formatBytes(total) : '';

      setPullProgress((prev) => ({
        ...prev,
        [model]: {
          ...(prev[model] || {}),
          pct,
          label,
          total: totalStr,
          rawCompleted: completed,
          rawTotal: total,
        },
      }));
    };

    window.electronAPI.onPullProgress(handler);

    // Electron's ipcRenderer.on doesn't return an unsubscribe function from preload,
    // so we don't clean up here (the handler persists for the app lifetime).
  }, [fetchLocalModels, stopSpeedInterval]);

  /* ================================================================ */
  /*  Initialization                                                   */
  /* ================================================================ */
  useEffect(() => {
    async function init() {
      // Get proxy port
      if (window.electronAPI?.getProxyPort) {
        try {
          const port = await window.electronAPI.getProxyPort();
          if (port) setApiBase(`http://127.0.0.1:${port}`);
        } catch {
          /* use default */
        }
      }

      // Load conversations
      if (window.electronAPI?.loadConversations) {
        try {
          const convos = await window.electronAPI.loadConversations();
          setConversations(convos || []);
        } catch {
          /* ignore */
        }
      }

      // Restore theme
      const saved = localStorage.getItem('theme') || 'dark';
      setTheme(saved);
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Fetch local models once apiBase is set ─────────────────── */
  useEffect(() => {
    fetchLocalModels();
  }, [fetchLocalModels]);

  /* ── Cleanup speed intervals on unmount ─────────────────────── */
  useEffect(() => {
    return () => {
      Object.values(speedIntervalsRef.current).forEach(clearInterval);
    };
  }, []);

  /* ================================================================ */
  /*  Context value                                                    */
  /* ================================================================ */
  const value = {
    // state
    apiBase,
    theme,
    currentModel,
    models,
    localModels,
    localModelInfo,
    pullingModels,
    pullProgress,
    pausedModels,
    conversations,
    currentConvId,
    history,
    isStreaming,
    pendingNewChat,

    // actions
    setTheme,
    selectModel,
    fetchLocalModels,
    pullModel,
    pausePull,
    resumePull,
    cancelPull,
    deleteModel,
    removeModel,
    installModel,
    newChat,
    loadConversation,
    deleteConversation,
    saveCurrentConversation,
    sendMessage,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return ctx;
}
