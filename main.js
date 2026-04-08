const { app, BrowserWindow, ipcMain } = require('electron');
const http = require('http');
const fs = require('fs');
const path = require('path');

const MODEL = 'gemma4:e2b';
const OLLAMA_URL = 'http://localhost:11434';
const PROXY_PORT = 3131;

let mainWindow;

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
          model: MODEL,
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
    title: 'JustAsk',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#7b9669',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile('index.html');
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

// ── App lifecycle ────────────────────────────────────────────────────
app.whenReady().then(() => {
  startProxy();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
