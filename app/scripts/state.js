// ── Config ───────────────────────────────────────────────
let API_BASE = 'http://127.0.0.1:3131';

// ── State ────────────────────────────────────────────────
let history = [];
let isStreaming = false;
let currentConvId = null;
let conversations = [];
let pendingNewChat = false;

const MODELS = ['gemma4:e2b', 'gemma4:e4b'];
let currentModel = localStorage.getItem('model') || MODELS[0];
let localModels = new Set();
let pullingModels = new Set();
let pullProgress  = {}; // model -> { pct, label, total, rawCompleted, rawTotal, speed, eta }
let pausedModels  = {}; // model -> snapshot at time of pause
const speedIntervals = {}; // model -> intervalId
let localModelInfo = {}; // model name -> { name, size, ... }

// ── Model catalog (curated popular models) ─────────────
const MODEL_CATALOG = [
  { name: 'llama3.2',     desc: 'Meta Llama 3.2',                   sizes: '1B, 3B' },
  { name: 'llama3.1',     desc: 'Meta Llama 3.1',                   sizes: '8B, 70B, 405B' },
  { name: 'llama3.3',     desc: 'Meta Llama 3.3',                   sizes: '70B' },
  { name: 'gemma4',       desc: 'Google Gemma 4',                    sizes: '12B, 27B' },
  { name: 'gemma3',       desc: 'Google Gemma 3',                    sizes: '1B, 4B, 12B, 27B' },
  { name: 'qwen3',        desc: 'Alibaba Qwen 3',                   sizes: '0.6B–235B' },
  { name: 'qwen2.5',      desc: 'Alibaba Qwen 2.5',                 sizes: '0.5B–72B' },
  { name: 'phi4',         desc: 'Microsoft Phi 4',                   sizes: '14B' },
  { name: 'phi3',         desc: 'Microsoft Phi 3',                   sizes: '3.8B, 14B' },
  { name: 'mistral',      desc: 'Mistral 7B',                        sizes: '7B' },
  { name: 'mixtral',      desc: 'Mistral Mixtral MoE',              sizes: '8x7B, 8x22B' },
  { name: 'deepseek-r1',  desc: 'DeepSeek R1 reasoning',            sizes: '1.5B–671B' },
  { name: 'deepseek-v2',  desc: 'DeepSeek V2 chat',                 sizes: '16B, 236B' },
  { name: 'codellama',    desc: 'Meta Code Llama',                   sizes: '7B, 13B, 34B, 70B' },
  { name: 'codegemma',    desc: 'Google CodeGemma',                  sizes: '2B, 7B' },
  { name: 'starcoder2',   desc: 'BigCode StarCoder 2',              sizes: '3B, 7B, 15B' },
  { name: 'nomic-embed-text', desc: 'Nomic text embeddings',        sizes: '137M' },
  { name: 'mxbai-embed-large', desc: 'Mixedbread embed large',     sizes: '335M' },
  { name: 'llava',        desc: 'LLaVA multimodal vision',           sizes: '7B, 13B, 34B' },
  { name: 'command-r',    desc: 'Cohere Command R',                  sizes: '35B, 104B' },
  { name: 'vicuna',       desc: 'LMSYS Vicuna',                      sizes: '7B, 13B, 33B' },
  { name: 'orca-mini',    desc: 'Orca Mini',                         sizes: '3B, 7B, 13B, 70B' },
  { name: 'tinyllama',    desc: 'TinyLlama compact',                 sizes: '1.1B' },
  { name: 'dolphin-phi',  desc: 'Dolphin Phi fine-tune',            sizes: '2.7B' },
  { name: 'stable-code',  desc: 'Stability AI code',                sizes: '3B' },
];
