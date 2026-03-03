/* ============================================================
   PROJECT BLACK VAULT — Main JavaScript
   ============================================================ */

// UTC clock
function updateClock() {
  const el = document.getElementById('sys-clock');
  if (!el) return;
  const now = new Date();
  const h = String(now.getUTCHours()).padStart(2, '0');
  const m = String(now.getUTCMinutes()).padStart(2, '0');
  const s = String(now.getUTCSeconds()).padStart(2, '0');
  el.textContent = `${h}:${m}:${s} UTC`;
}
updateClock();
setInterval(updateClock, 1000);

document.addEventListener('DOMContentLoaded', () => {

  // Auto-set today's date on date fields that are empty
  document.querySelectorAll('input[type="date"]').forEach(input => {
    if (!input.value) {
      const today = new Date().toISOString().split('T')[0];
      input.value = today;
    }
  });

  // Flash message auto-dismiss after 5 seconds
  document.querySelectorAll('.flash-message').forEach(el => {
    setTimeout(() => {
      el.style.transition = 'opacity 0.5s ease';
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 500);
    }, 5000);
  });

  // Keyboard: Escape closes any open modal
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(m => {
        m.classList.add('hidden');
      });
    }
  });

});
