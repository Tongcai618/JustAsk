const { app, BrowserWindow, ipcMain } = require('electron');
const http = require('http');
const fs = require('fs');
const path = require('path');

app.setName('Linbble');

const MODEL = 'gemma4:e2b';
const OLLAMA_URL = 'http://localhost:11434';
const PROXY_PORT = 3131;

let mainWindow;
const activeProcs = {}; // model -> spawned process (for pause support)

// ── History storage ─────────────────────────────────────────────────
function getHistoryPath() {
  return path.join(app.getPath('userData'), 'conversations.json');
}

function readConversations() {
  try {
    const raw = fs.readFileSync(getHistoryPath(), 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeConversations(conversations) {
  fs.writeFileSync(getHistoryPath(), JSON.stringify(conversations, null, 2), 'utf-8');
}

// ── WordMix progress storage ────────────────────────────────────────
function getProgressPath() {
  return path.join(app.getPath('userData'), 'wordmix-progress.json');
}

function readProgress() {
  try {
    const raw = fs.readFileSync(getProgressPath(), 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeProgress(data) {
  fs.writeFileSync(getProgressPath(), JSON.stringify(data, null, 2), 'utf-8');
}

// ── Ollama proxy server ──────────────────────────────────────────────
function startProxy() {
  const server = http.createServer((req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    if (req.method === 'GET' && req.url === '/api/tags') {
      const tagsReq = http.request(
        `${OLLAMA_URL}/api/tags`,
        { method: 'GET' },
        (tagsRes) => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          tagsRes.pipe(res);
        }
      );
      tagsReq.on('error', (err) => {
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message }));
      });
      tagsReq.end();
      return;
    }

    if (req.method === 'POST' && req.url === '/api/chat') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        let data;
        try {
          data = JSON.parse(body);
        } catch {
          res.writeHead(400);
          res.end('Bad JSON');
          return;
        }

        const payload = JSON.stringify({
          model: data.model || MODEL,
          messages: data.messages || [],
          stream: true,
        });

        const ollamaReq = http.request(
          `${OLLAMA_URL}/api/chat`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(payload),
            },
            timeout: 120000,
          },
          (ollamaRes) => {
            res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' });

            let buf = '';
            ollamaRes.on('data', (chunk) => {
              buf += chunk.toString();
              const lines = buf.split('\n');
              buf = lines.pop();

              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;
                try {
                  const parsed = JSON.parse(trimmed);
                  const content = parsed.message?.content || '';
                  if (content) {
                    res.write(`data: ${JSON.stringify({ content })}\n\n`);
                  }
                  if (parsed.done) {
                    res.write('data: [DONE]\n\n');
                  }
                } catch {
                  // skip malformed lines
                }
              }
            });

            ollamaRes.on('end', () => {
              if (buf.trim()) {
                try {
                  const parsed = JSON.parse(buf.trim());
                  const content = parsed.message?.content || '';
                  if (content) {
                    res.write(`data: ${JSON.stringify({ content })}\n\n`);
                  }
                  if (parsed.done) {
                    res.write('data: [DONE]\n\n');
                  }
                } catch { /* ignore */ }
              }
              res.end();
            });
          }
        );

        ollamaReq.on('error', (err) => {
          res.writeHead(200, { 'Content-Type': 'text/event-stream' });
          res.write(`data: ${JSON.stringify({ error: `Cannot reach Ollama: ${err.message}` })}\n\n`);
          res.end();
        });

        ollamaReq.write(payload);
        ollamaReq.end();
      });
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  server.listen(PROXY_PORT, '127.0.0.1', () => {
    console.log(`Proxy listening on http://127.0.0.1:${PROXY_PORT}`);
  });

  return server;
}

// ── Electron window ──────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 700,
    title: 'Linbble',
    icon: path.join(__dirname, 'assets', 'icon.icns'),
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#f0f3ed',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
}

// ── IPC ──────────────────────────────────────────────────────────────
ipcMain.handle('get-proxy-port', () => PROXY_PORT);

ipcMain.handle('load-conversations', () => {
  return readConversations();
});

ipcMain.handle('save-conversation', (_event, conversation) => {
  const conversations = readConversations();
  const idx = conversations.findIndex(c => c.id === conversation.id);
  if (idx >= 0) {
    conversations[idx] = conversation;
  } else {
    conversations.unshift(conversation);
  }
  writeConversations(conversations);
  return conversations;
});

ipcMain.handle('delete-conversation', (_event, id) => {
  let conversations = readConversations();
  conversations = conversations.filter(c => c.id !== id);
  writeConversations(conversations);
  return conversations;
});

ipcMain.handle('pull-model', (_event, model) => {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ name: model, stream: true });
    let paused = false;
    let settled = false;

    const settle = (fn) => {
      if (!settled) { settled = true; delete activeProcs[model]; fn(); }
    };

    const req = http.request(
      `${OLLAMA_URL}/api/pull`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let buf = '';

        res.on('data', (chunk) => {
          buf += chunk.toString();
          const lines = buf.split('\n');
          buf = lines.pop();
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              const parsed = JSON.parse(trimmed);
              if (mainWindow) mainWindow.webContents.send('pull-progress', { model, ...parsed });
            } catch { /* skip */ }
          }
        });

        res.on('end', () => {
          settle(() => {
            if (mainWindow) mainWindow.webContents.send('pull-progress', { model, done: true });
            resolve(true);
          });
        });

        // Fires when req.destroy() is called mid-response
        res.on('close', () => {
          settle(() => {
            if (paused) {
              if (mainWindow) mainWindow.webContents.send('pull-progress', { model, paused: true });
              resolve(false);
            }
          });
        });

        res.on('error', () => {
          settle(() => {
            if (paused) {
              if (mainWindow) mainWindow.webContents.send('pull-progress', { model, paused: true });
              resolve(false);
            } else {
              if (mainWindow) mainWindow.webContents.send('pull-progress', { model, done: true, error: true });
              reject(new Error('Response error'));
            }
          });
        });
      }
    );

    activeProcs[model] = {
      pause: () => { paused = true; req.destroy(); },
    };

    // Fires when req.destroy() is called before response arrives
    req.on('error', (err) => {
      settle(() => {
        if (paused) {
          if (mainWindow) mainWindow.webContents.send('pull-progress', { model, paused: true });
          resolve(false);
        } else {
          if (mainWindow) mainWindow.webContents.send('pull-progress', { model, done: true, error: true });
          reject(err);
        }
      });
    });

    req.write(payload);
    req.end();
  });
});

ipcMain.handle('delete-model', (_event, model) => {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ name: model });
    const req = http.request(
      `${OLLAMA_URL}/api/delete`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        res.resume();
        res.on('end', () => resolve(res.statusCode === 200));
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
});

ipcMain.handle('load-progress', () => {
  return readProgress();
});

ipcMain.handle('save-progress', (_event, data) => {
  writeProgress(data);
  return true;
});

ipcMain.handle('pause-pull', (_event, model) => {
  const proc = activeProcs[model];
  if (proc) proc.pause();
  return true;
});

// ── App lifecycle ────────────────────────────────────────────────────
app.whenReady().then(() => {
  if (process.platform === 'darwin') {
    app.dock.setIcon(path.join(__dirname, 'assets', 'icon-1024.png'));
  }
  startProxy();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
