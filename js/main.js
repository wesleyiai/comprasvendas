(function () {
  'use strict';

  // ======= CONFIG =======
  const GROUP_INVITE_URL = 'https://chat.whatsapp.com/EpU45VYKpLcEpniby02fS8';
  const SHARE_TEXT = 'Entra no grupo COMPRAS E VENDAS - SERTÃO! Compre, venda e negocie com a comunidade 🛒';
  const PIX_KEY = '1f62c9ab-f8cc-43b1-946a-e619a7f135e0';
  const FREE_WAIT_SECONDS = 10 * 60;
  // =======================

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none)').matches;

  const panel = document.getElementById('panel');
  const steps = {
    intro: panel.querySelector('.step[data-step="intro"]'),
    share: panel.querySelector('.step[data-step="share"]'),
    payment: panel.querySelector('.step[data-step="payment"]'),
    verify: panel.querySelector('.step[data-step="verify"]'),
  };

  const btnStart = document.getElementById('btn-start');
  const taskFriend = document.getElementById('task-friend');
  const shareHint = document.getElementById('share-hint');
  const rulesToggle = document.getElementById('btn-rules-toggle');
  const rulesPanel = document.getElementById('rules-panel');
  const rulesClose = document.getElementById('rules-close');

  const btnCopyPix = document.getElementById('btn-copy-pix');
  const btnPaidNow = document.getElementById('btn-paid-now');
  const freeWaitTimerEl = document.getElementById('free-wait-timer');

  const btnJoin = document.getElementById('btn-join');
  const verifyTitle = document.getElementById('verify-title');
  const verifySub = document.getElementById('verify-sub');

  const progressDots = document.getElementById('progress-dots');
  const progressOrder = ['share', 'payment', 'verify'];

  btnJoin.href = GROUP_INVITE_URL;

  const state = {
    friend: sessionStorage.getItem('cv_task_friend') === '1',
    freeWaitTimer: null,
    freeWaitRemaining: FREE_WAIT_SECONDS,
    entered: false,
  };

  // ---------- Helpers ----------
  function showStep(name) {
    Object.entries(steps).forEach(([key, el]) => {
      el.classList.toggle('hidden', key !== name);
    });

    const idx = progressOrder.indexOf(name);
    progressDots.classList.toggle('hidden', idx === -1);
    if (idx !== -1) {
      progressDots.querySelectorAll('.dot').forEach((dot) => {
        const dotIdx = progressOrder.indexOf(dot.dataset.dot);
        dot.classList.toggle('done', dotIdx < idx);
        dot.classList.toggle('active', dotIdx === idx);
      });
    }
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

  document.querySelectorAll('.btn, .task-item, .btn-3d').forEach((el) => {
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

  // ---------- Step 1: share gate (1 friend) ----------
  function markFriendDone() {
    taskFriend.classList.add('done');
    state.friend = true;
    sessionStorage.setItem('cv_task_friend', '1');
    vibrate(15);
    shareHint.textContent = 'Tudo certo!';
    setTimeout(() => {
      showStep('payment');
      startFreeWaitCountdown();
    }, 600);
  }

  taskFriend.addEventListener('click', () => {
    if (taskFriend.classList.contains('done')) return;
    openWhatsAppShare();
    setTimeout(markFriendDone, 500);
  });

  btnStart.addEventListener('click', () => {
    showStep('share');
    if (state.friend) {
      taskFriend.classList.add('done');
    }
  });

  rulesToggle.addEventListener('click', () => {
    rulesPanel.classList.remove('hidden');
    rulesPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  rulesClose.addEventListener('click', () => {
    rulesPanel.classList.add('hidden');
  });

  // ---------- Step 2: Pix payment (static key, self-declared) ----------
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
      btnCopyPix.querySelector('.btn-3d-face span').textContent = 'Chave copiada!';
      showToast('Chave Pix copiada! Cole no app do seu banco 💚');
      vibrate(15);
      setTimeout(() => {
        btnCopyPix.classList.remove('copied');
        btnCopyPix.querySelector('.btn-3d-face span').textContent = 'Copiar chave Pix';
      }, 2500);
    } catch (e) {
      showToast('Não foi possível copiar automaticamente.');
    }
  });

  // Self-declared: no automated verification is possible against a static
  // Pix key (no transaction id, no webhook), so this doesn't pretend to check
  // anything — it takes the person's word and grants access immediately.
  btnPaidNow.addEventListener('click', () => {
    grantAccess('paid');
  });

  // ---------- Step 2b: free path (wait 10 min, no payment required) ----------
  function formatMMSS(totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function startFreeWaitCountdown() {
    stopFreeWaitCountdown();
    state.freeWaitRemaining = FREE_WAIT_SECONDS;
    if (freeWaitTimerEl) freeWaitTimerEl.textContent = formatMMSS(state.freeWaitRemaining);
    state.freeWaitTimer = setInterval(() => {
      state.freeWaitRemaining--;
      if (freeWaitTimerEl) freeWaitTimerEl.textContent = formatMMSS(Math.max(0, state.freeWaitRemaining));
      if (state.freeWaitRemaining <= 0) {
        stopFreeWaitCountdown();
        grantAccess('free');
      }
    }, 1000);
  }

  function stopFreeWaitCountdown() {
    if (state.freeWaitTimer) {
      clearInterval(state.freeWaitTimer);
      state.freeWaitTimer = null;
    }
  }

  // ---------- Grant access (paid via Pix, or free after the wait) ----------
  function grantAccess(source) {
    if (state.entered) return;
    state.entered = true;
    stopFreeWaitCountdown();

    if (source === 'paid') {
      verifyTitle.textContent = 'Tudo certo!';
      verifySub.textContent = 'Assim que conferirmos seu Pix no extrato, seu acesso fica confirmado. Já pode entrar no grupo! 🎉';
    } else {
      verifyTitle.textContent = 'Tempo de espera concluído!';
      verifySub.textContent = 'Seu acesso gratuito foi liberado. Já pode entrar no grupo! 🎉';
    }

    showStep('verify');
    fireConfetti();
    vibrate([10, 40, 10]);
  }

  window.addEventListener('resize', () => {
    const canvas = document.getElementById('confetti-canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  // ---------- Animated stat counters ----------
  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    const format = el.dataset.format;
    function formatValue(v) {
      if (format === 'k-plus') return v >= 1000 ? `${(v / 1000).toFixed(1)}k+` : `${v}+`;
      if (format === 'plus') return `+${v}`;
      return `${v}`;
    }
    el.textContent = formatValue(target); // safe fallback if the animation below never finishes
    if (reduceMotion) return;
    const duration = 1400;
    const start = performance.now();
    function tick(now) {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = formatValue(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ---------- Testimonial rotation ----------
  const testimonials = [
    { text: 'Vendi minha moto em 2 dias, muita gente séria no grupo!', name: 'Marcos, Palmeira dos Índios', avatar: 'MC' },
    { text: 'Comprei uma cabra leiteira boa e no preço certo, super recomendo.', name: 'Edilene, Arapiraca', avatar: 'ED' },
    { text: 'Grupo bem organizado, sem spam e sempre com preço visível.', name: 'João, Santana do Ipanema', avatar: 'JP' },
  ];
  let testimonialIdx = 0;
  const testimonialEl = document.getElementById('testimonial');
  const testimonialText = document.getElementById('testimonial-text');
  const testimonialName = document.getElementById('testimonial-name');
  const testimonialAvatar = document.getElementById('testimonial-avatar');

  function rotateTestimonial() {
    testimonialEl.classList.add('fade');
    setTimeout(() => {
      testimonialIdx = (testimonialIdx + 1) % testimonials.length;
      const t = testimonials[testimonialIdx];
      testimonialText.textContent = t.text;
      testimonialName.textContent = t.name;
      testimonialAvatar.textContent = t.avatar;
      testimonialEl.classList.remove('fade');
    }, 300);
  }
  if (!reduceMotion) setInterval(rotateTestimonial, 4500);

  // ---------- Splash screen ----------
  const splash = document.getElementById('splash');
  const appEl = document.getElementById('app');
  const splashStart = Date.now();
  const MIN_SPLASH_MS = reduceMotion ? 0 : 900;
  let revealed = false;

  function revealApp() {
    if (revealed) return;
    revealed = true;
    splash.classList.add('hide');
    appEl.classList.add('visible');
    try {
      document.querySelectorAll('[data-target]').forEach(animateCounter);
    } catch (e) {
      // never let a counter glitch block the splash from clearing
    }
    setTimeout(() => splash.remove(), 600);
  }

  function onReady() {
    const wait = Math.max(0, MIN_SPLASH_MS - (Date.now() - splashStart));
    setTimeout(revealApp, wait);
  }

  if (document.readyState === 'complete') {
    onReady();
  } else {
    window.addEventListener('load', onReady);
  }
  setTimeout(revealApp, 3000);

  showStep('intro');
})();
