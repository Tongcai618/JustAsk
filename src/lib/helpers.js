export function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  if (diff < 86400000 && d.getDate() === now.getDate()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diff < 604800000) {
    return d.toLocaleDateString([], { weekday: 'short' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function formatSpeed(bps) {
  if (bps >= 1024 * 1024) return `${(bps / (1024 * 1024)).toFixed(1)} MB/s`;
  if (bps >= 1024) return `${Math.round(bps / 1024)} KB/s`;
  return `${Math.round(bps)} B/s`;
}

export function formatBytes(b) {
  if (b >= 1024 * 1024 * 1024) return `${(b / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  if (b >= 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  if (b >= 1024) return `${Math.round(b / 1024)} KB`;
  return `${b} B`;
}

export function formatETA(secs) {
  if (!isFinite(secs) || secs <= 0) return '';
  if (secs < 60) return `~${Math.round(secs)}s`;
  if (secs < 3600) return `~${Math.round(secs / 60)}m`;
  return `~${(secs / 3600).toFixed(1)}h`;
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function titleFromMessages(msgs) {
  const first = msgs.find((m) => m.role === 'user');
  if (!first) return 'Untitled';
  const text = first.content.trim();
  return text.length > 50 ? text.slice(0, 50) + '...' : text;
}
