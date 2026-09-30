const api = window.captureOverlay;
const screenImage = document.getElementById('screenImage');
const selection = document.getElementById('selection');
const selectionSize = document.getElementById('selectionSize');
const crosshairX = document.getElementById('crosshairX');
const crosshairY = document.getElementById('crosshairY');
const captureActions = document.getElementById('captureActions');
const confirmButton = document.getElementById('confirmButton');
const retryButton = document.getElementById('retryButton');

let session = null;
let dragging = false;
let startX = 0;
let startY = 0;
let currentRect = null;

function clamp(value, minimum, maximum) { return Math.min(maximum, Math.max(minimum, value)); }

function resetSelection() {
  currentRect = null;
  document.body.classList.remove('has-selection');
  selection.classList.remove('active');
  captureActions.classList.remove('visible');
  captureActions.setAttribute('aria-hidden', 'true');
}

function updateSelection(x, y) {
  const left = clamp(Math.min(startX, x), 0, window.innerWidth);
  const top = clamp(Math.min(startY, y), 0, window.innerHeight);
  const right = clamp(Math.max(startX, x), 0, window.innerWidth);
  const bottom = clamp(Math.max(startY, y), 0, window.innerHeight);
  currentRect = { x: left, y: top, width: right - left, height: bottom - top };
  selection.style.left = `${left}px`;
  selection.style.top = `${top}px`;
  selection.style.width = `${currentRect.width}px`;
  selection.style.height = `${currentRect.height}px`;
  selectionSize.textContent = `${Math.round(currentRect.width)} × ${Math.round(currentRect.height)}`;
  document.body.classList.add('has-selection');
  selection.classList.add('active');
}

function positionActions() {
  if (!currentRect) return;
  const width = 252;
  const left = clamp(currentRect.x + currentRect.width - width, 12, window.innerWidth - width - 12);
  let top = currentRect.y + currentRect.height + 12;
  if (top > window.innerHeight - 64) top = Math.max(12, currentRect.y - 58);
  captureActions.style.left = `${left}px`;
  captureActions.style.top = `${top}px`;
  captureActions.classList.add('visible');
  captureActions.setAttribute('aria-hidden', 'false');
}

async function confirmSelection() {
  if (!session || !currentRect || currentRect.width < 8 || currentRect.height < 8) return;
  confirmButton.disabled = true;
  confirmButton.querySelector('span').textContent = '正在处理';
  await api.complete({
    sessionId: session.sessionId,
    displayId: session.displayId,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    rect: currentRect
  });
}

api.onInit((payload) => {
  session = payload;
  dragging = false;
  resetSelection();
  confirmButton.disabled = false;
  confirmButton.querySelector('span').textContent = '识别并翻译';
  document.documentElement.style.setProperty('--accent-a', payload.accentA);
  document.documentElement.style.setProperty('--accent-b', payload.accentB);
  screenImage.src = payload.imageDataUrl;
});

document.addEventListener('pointerdown', (event) => {
  if (event.button !== 0 || event.target.closest('.capture-actions')) return;
  dragging = true;
  startX = event.clientX;
  startY = event.clientY;
  captureActions.classList.remove('visible');
  updateSelection(startX, startY);
});

document.addEventListener('pointermove', (event) => {
  crosshairX.style.top = `${event.clientY}px`;
  crosshairY.style.left = `${event.clientX}px`;
  if (dragging) updateSelection(event.clientX, event.clientY);
});

document.addEventListener('pointerup', (event) => {
  if (!dragging) return;
  dragging = false;
  updateSelection(event.clientX, event.clientY);
  if (currentRect.width < 8 || currentRect.height < 8) resetSelection();
  else positionActions();
});

document.addEventListener('contextmenu', (event) => {
  event.preventDefault();
  if (currentRect) resetSelection();
  else api.cancel({ sessionId: session?.sessionId });
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') api.cancel({ sessionId: session?.sessionId });
  if (event.key === 'Enter') void confirmSelection();
});

confirmButton.addEventListener('click', () => void confirmSelection());
retryButton.addEventListener('click', resetSelection);
