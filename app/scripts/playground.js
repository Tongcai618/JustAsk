// ── Playground toggle ─────────────────────────────────────
let playgroundActive = false;
const mainEl = document.getElementById('main');
const playgroundEl = document.getElementById('playground');
const pgToggle = document.getElementById('playground-toggle');

function togglePlayground() {
  playgroundActive = !playgroundActive;
  if (playgroundActive) {
    mainEl.style.display = 'none';
    playgroundEl.classList.add('visible');
    pgToggle.classList.add('active');
  } else {
    playgroundEl.classList.remove('visible');
    mainEl.style.display = 'flex';
    pgToggle.classList.remove('active');
    promptEl.focus();
  }
}
