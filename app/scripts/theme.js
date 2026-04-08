// ── Theme toggle ─────────────────────────────────────────

function applyTheme(theme) {
  const isLight = theme === 'light';
  document.body.classList.toggle('light', isLight);

  // Swap hljs stylesheet
  const hljsLink = document.getElementById('hljs-theme');
  hljsLink.href = isLight
    ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css'
    : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css';

  // Toggle button icons
  document.getElementById('theme-icon-moon').style.display = isLight ? 'none' : 'block';
  document.getElementById('theme-icon-sun').style.display = isLight ? 'block' : 'none';
  document.getElementById('theme-label').textContent = isLight ? 'Dark' : 'Light';

  localStorage.setItem('theme', theme);
}

function toggleTheme() {
  const isCurrentlyLight = document.body.classList.contains('light');
  applyTheme(isCurrentlyLight ? 'dark' : 'light');
}
