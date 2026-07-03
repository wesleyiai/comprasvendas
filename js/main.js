(function () {
  'use strict';

  // ======= CONFIG =======
  const GROUP_INVITE_URL = 'https://chat.whatsapp.com/EpU45VYKpLcEpniby02fS8';
  const SHARE_TEXT = 'Entra no grupo COMPRAS E VENDAS - SERTÃO! Compre, venda e negocie com a comunidade 🛒';
  const PIX_KEY = '30a9a8ac-383b-4dc0-b395-82168a2b5e78';
  const PAYMENT_WINDOW_SECONDS = 5 * 60; // cosmetic urgency timer on the PIX card
  const UNLOCK_DELAY_SECONDS = 10;       // group-join button always appears after this, regardless of payment
  // =======================

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none)').matches;

  const panel = document.getElementById('panel');
  const steps = {
    intro: panel.querySelector('[data-step="intro"]'),
    share: panel.querySelector('[data-step="share"]'),
    support: panel.querySelector('[data-step="support"]'),
  };

  const btnStart = document.getElementById('btn-start');
  const taskStatus = document.getElementById('task-status');
  const taskFriend = document.getElementById('task-friend');
  const shareHint = document.getElementById('share-hint');
  const btnJoin = document.getElementById('btn-join');
  const rulesToggle = document.getElementById('btn-rules-toggle');
  const rulesPanel = document.getElementById('rules-panel');
  const rulesClose = document.getElementById('rules-close');

  const pixTimerEl = document.getElementById('pix-timer');
  const pixKeyEl = document.getElementById('pix-key');
  const btnCopyPix = document.getElementById('btn-copy-pix');
  const unlockWait = document.getElementById('unlock-wait');
  const unlockNum = document.getElementById('unlock-num');
  const miniRingFg = document.getElementById('mini-ring-fg');

  btnJoin.href = GROUP_INVITE_URL;
  pixKeyEl.textContent = PIX_KEY;

  const state = {
    status: sessionStorage.getItem('cv_task_status') === '1',
    friend: sessionStorage.getItem('cv_task_friend') === '1',
  };

  // ---------- Helpers ----------
  function showStep(name) {
    Object.entries(steps).forEach(([key, el]) => {
      el.classList.toggle('hidden', key !== name);
    });
  }

  function vibrate(ms) {
    if (navigator.vibrate) navigator.vibrate(ms);
  }

  function getShareUrl() {
    return window.location.href.split('#')[0];
  }

  function openWhatsAppShare() {
    const text = `${SHARE_TEXT} ${getShareUrl()}`;
    if (navigator.share) {
      navigator.share({ title: 'Compras e Vendas - Sertão', text: SHARE_TEXT, url: getShareUrl() }).catch(() => {
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
      });
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    }
  }

  function showToast(message) {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  function spawnRipple(el, evt) {
    const rect = el.getBoundingClientRect();
    const clientX = (evt.touches && evt.touches[0] ? evt.touches[0].clientX : evt.clientX) ?? rect.left + rect.width / 2;
    const clientY = (evt.touches && evt.touches[0] ? evt.touches[0].clientY : evt.clientY) ?? rect.top + rect.height / 2;
    const size = Math.max(rect.width, rect.height) * 1.6;
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${clientX - rect.left - size / 2}px`;
    ripple.style.top = `${clientY - rect.top - size / 2}px`;
    el.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  }

  document.querySelectorAll('.btn, .task-item, .copy-btn').forEach((el) => {
    el.addEventListener('click', (e) => spawnRipple(el, e));
  });

  // ---------- Card tilt (desktop only) ----------
  if (!isTouch && !reduceMotion) {
    const hero = document.querySelector('.hero');
    hero.addEventListener('pointermove', (e) => {
      const rect = panel.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      const card = panel.querySelector('.card:not(.hidden)') || panel.querySelector('.card');
      if (!card) return;
      card.style.transform = `rotateY(${px * 6}deg) rotateX(${-py * 6}deg)`;
    });
    hero.addEventListener('pointerleave', () => {
      panel.querySelectorAll('.card').forEach((c) => { c.style.transform = 'rotateY(0) rotateX(0)'; });
    });
  }

  // ---------- Confetti ----------
  function fireConfetti() {
    if (reduceMotion) return;
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);

    const colors = ['#14e07f', '#f5b942', '#ffffff', '#0a8f52'];
    const count = 90;
    const pieces = Array.from({ length: count }, () => ({
      x: window.innerWidth / 2 + (Math.random() - 0.5) * 60,
      y: window.innerHeight * 0.4,
      vx: (Math.random() - 0.5) * 9,
      vy: -Math.random() * 9 - 4,
      size: 4 + Math.random() * 5,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 0,
    }));

    let frame = 0;
    function tick() {
      frame++;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      let alive = false;
      pieces.forEach((p) => {
        p.vy += 0.22;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.life++;
        if (p.y < window.innerHeight + 20) alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, 1 - p.life / 140);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });
      if (alive && frame < 160) {
        requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      }
    }
    requestAnimationFrame(tick);
  }

  // ---------- Flow ----------
  function markDone(el, key) {
    el.classList.add('done');
    state[key] = true;
    sessionStorage.setItem(`cv_task_${key}`, '1');
    vibrate(15);
    checkAllDone();
  }

  function checkAllDone() {
    if (state.status && state.friend) {
      shareHint.textContent = 'Tudo certo! Preparando seu acesso...';
      setTimeout(() => {
        showStep('support');
        startPixTimer();
        startUnlockCountdown();
      }, 600);
    }
  }

  taskStatus.addEventListener('click', () => {
    if (taskStatus.classList.contains('done')) return;
    openWhatsAppShare();
    setTimeout(() => markDone(taskStatus, 'status'), 500);
  });

  taskFriend.addEventListener('click', () => {
    if (taskFriend.classList.contains('done')) return;
    openWhatsAppShare();
    setTimeout(() => markDone(taskFriend, 'friend'), 500);
  });

  btnStart.addEventListener('click', () => {
    showStep('share');
    if (state.status) taskStatus.classList.add('done');
    if (state.friend) taskFriend.classList.add('done');
    checkAllDone();
  });

  rulesToggle.addEventListener('click', () => {
    rulesPanel.classList.remove('hidden');
    rulesPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  rulesClose.addEventListener('click', () => {
    rulesPanel.classList.add('hidden');
  });

  // ---------- Copy PIX key ----------
  btnCopyPix.addEventListener('click', async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(PIX_KEY);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = PIX_KEY;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      btnCopyPix.classList.add('copied');
      btnCopyPix.querySelector('span').textContent = 'Copiado!';
      showToast('Chave PIX copiada!');
      vibrate(15);
      setTimeout(() => {
        btnCopyPix.classList.remove('copied');
        btnCopyPix.querySelector('span').textContent = 'Copiar';
      }, 2000);
    } catch (e) {
      showToast('Não foi possível copiar automaticamente.');
    }
  });

  // ---------- PIX cosmetic countdown (5 min) ----------
  function startPixTimer() {
    let remaining = PAYMENT_WINDOW_SECONDS;
    function render() {
      const m = Math.floor(remaining / 60).toString().padStart(2, '0');
      const s = Math.floor(remaining % 60).toString().padStart(2, '0');
      pixTimerEl.textContent = `${m}:${s}`;
    }
    render();
    const timer = setInterval(() => {
      remaining -= 1;
      if (remaining < 0) { clearInterval(timer); return; }
      render();
    }, 1000);
  }

  // ---------- Unlock join button after UNLOCK_DELAY_SECONDS ----------
  const MINI_CIRCUMFERENCE = 2 * Math.PI * 10;
  function startUnlockCountdown() {
    let remaining = UNLOCK_DELAY_SECONDS;
    unlockNum.textContent = remaining;
    miniRingFg.style.strokeDashoffset = '0';

    function tick() {
      const elapsed = UNLOCK_DELAY_SECONDS - remaining;
      const progress = elapsed / UNLOCK_DELAY_SECONDS;
      miniRingFg.style.strokeDashoffset = `${MINI_CIRCUMFERENCE * progress}`;
      unlockNum.textContent = remaining;

      if (remaining <= 0) {
        clearInterval(timer);
        unlockWait.classList.add('hidden');
        btnJoin.classList.remove('hidden');
        fireConfetti();
        vibrate([10, 40, 10]);
        return;
      }
      remaining -= 1;
    }

    tick();
    const timer = setInterval(tick, 1000);
  }

  window.addEventListener('resize', () => {
    const canvas = document.getElementById('confetti-canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  showStep('intro');
})();
