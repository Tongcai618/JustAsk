# JustAsk

Desktop chat UI powered by Ollama, built with Electron.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Ollama](https://ollama.ai/) running locally on port 11434
- A model pulled, e.g.: `ollama pull gemma4:e2b`

## Setup

```bash
npm install
```

## Run

```bash
npm start
```

This opens a native desktop window connected to your local Ollama instance.

## Architecture

- **main.js** — Electron main process. Creates the app window and runs an HTTP server that proxies chat requests to Ollama with streaming support.
- **index.html** — Renderer process. Chat UI with markdown rendering (marked.js) and syntax highlighting (highlight.js).
- **preload.js** — Secure bridge between renderer and main process.
## Configuration

Edit `main.js` to change:
- `MODEL` — the Ollama model name (default: `gemma4:e2b`)
- `OLLAMA_URL` — Ollama server address (default: `http://localhost:11434`)
- `PROXY_PORT` — local proxy port (default: `3131`)
