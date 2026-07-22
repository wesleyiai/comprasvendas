(function () {
  'use strict';

  // ======= CONFIG =======
  const GROUP_INVITE_URL = 'https://chat.whatsapp.com/Be3VDMtBX8iLErBTQQEtT2';
  const SHARE_TEXT = 'Entra no grupo COMPRAS E VENDAS - SERTÃO! Compre, venda e negocie com a comunidade 🛒';
  const FREE_WAIT_SECONDS = 60 * 60;
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

  const btnPayNow = document.getElementById('btn-pay-now');
  const checkoutStatus = document.getElementById('checkout-status');
  const freeWaitTimerEl = document.getElementById('free-wait-timer');
  const inputTelefone = document.getElementById('input-telefone');
  const telefoneError = document.getElementById('telefone-error');

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
    payChecking: false,
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
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
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

  // ---------- Step 2: WhatsApp contact (needed to deliver the invite after payment) ----------
  function formatTelefone(digits) {
    const d = digits.slice(0, 11);
    if (d.length <= 2) return d.length ? `(${d}` : '';
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }

  function telefoneDigits() {
    return inputTelefone.value.replace(/\D/g, '');
  }

  function isTelefoneValido() {
    return /^\d{11}$/.test(telefoneDigits());
  }

  function setTelefoneError(show) {
    inputTelefone.classList.toggle('field-invalid', show);
    telefoneError.classList.toggle('hidden', !show);
  }

  if (inputTelefone) {
    inputTelefone.addEventListener('input', () => {
      const caretWasAtEnd = inputTelefone.selectionEnd === inputTelefone.value.length;
      inputTelefone.value = formatTelefone(telefoneDigits());
      if (caretWasAtEnd) {
        inputTelefone.setSelectionRange(inputTelefone.value.length, inputTelefone.value.length);
      }
      if (telefoneError && !telefoneError.classList.contains('hidden')) {
        setTelefoneError(!isTelefoneValido());
      }
    });
  }

  // ---------- Step 2: Pix/card payment via InfinitePay checkout ----------
  const CHECKOUT_STATUS_DEFAULT = 'Você será levado para um checkout seguro. O acesso é liberado automaticamente assim que o pagamento for confirmado.';

  function setCheckoutStatus(message, isError) {
    checkoutStatus.textContent = message;
    checkoutStatus.classList.toggle('checkout-status-error', Boolean(isError));
  }

  btnPayNow.addEventListener('click', async () => {
    if (btnPayNow.disabled) return;

    if (!isTelefoneValido()) {
      setTelefoneError(true);
      inputTelefone.focus();
      inputTelefone.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setTelefoneError(false);

    btnPayNow.disabled = true;
    setCheckoutStatus('Gerando pagamento seguro...', false);
    try {
      const resp = await fetch('/api/create-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone: telefoneDigits() }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.url) {
        throw new Error(data.error || 'Erro ao gerar o link de pagamento');
      }
      window.location.href = data.url;
    } catch (e) {
      setCheckoutStatus('Não foi possível abrir o pagamento agora. Tente novamente em instantes.', true);
      btnPayNow.disabled = false;
    }
  });

  // When InfinitePay redirects the customer back here after checkout, the URL
  // carries order_nsu/transaction_nsu/slug. Access is only granted after the
  // server confirms payment against InfinitePay's own records via
  // /api/check-payment — the query string itself is never trusted directly,
  // since anyone could type those params into the address bar by hand.
  function checkPaymentParams(params) {
    state.payChecking = true;
    showStep('payment');
    setCheckoutStatus('Confirmando seu pagamento...', false);
    btnPayNow.disabled = true;

    const qs = new URLSearchParams(params).toString();
    fetch(`/api/check-payment?${qs}`)
      .then((resp) => resp.json().then((data) => ({ ok: resp.ok, data })))
      .then(({ ok, data }) => {
        state.payChecking = false;
        if (ok && data.paid) {
          grantAccess('paid');
          return;
        }
        btnPayNow.disabled = false;
        setCheckoutStatus('Ainda não conseguimos confirmar seu pagamento.', true);
        showRetryCheck(params);
      })
      .catch(() => {
        state.payChecking = false;
        btnPayNow.disabled = false;
        setCheckoutStatus('Falha ao confirmar o pagamento.', true);
        showRetryCheck(params);
      });
  }

  function showRetryCheck(params) {
    let retry = document.getElementById('btn-retry-check');
    if (!retry) {
      retry = document.createElement('button');
      retry.id = 'btn-retry-check';
      retry.className = 'link-btn';
      retry.type = 'button';
      retry.textContent = 'Verificar novamente';
      checkoutStatus.insertAdjacentElement('afterend', retry);
    }
    retry.onclick = () => checkPaymentParams(params);
  }

  function handlePaymentReturn() {
    const url = new URL(window.location.href);
    const orderNsu = url.searchParams.get('order_nsu');
    const transactionNsu = url.searchParams.get('transaction_nsu');
    const slug = url.searchParams.get('slug');
    if (!orderNsu || !transactionNsu || !slug) return false;

    const params = { order_nsu: orderNsu, transaction_nsu: transactionNsu, slug };
    window.history.replaceState(null, '', window.location.pathname);
    checkPaymentParams(params);
    return true;
  }

  // ---------- Step 2b: free path (wait 1h, no payment required) ----------
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
  const ACCESS_KEY = 'cv_access';

  function setVerifyText(source) {
    if (source === 'paid') {
      verifyTitle.textContent = 'Pagamento confirmado!';
      verifySub.textContent = 'Seu pagamento foi confirmado automaticamente. Já pode entrar no grupo! 🎉';
    } else {
      verifyTitle.textContent = 'Tempo de espera concluído!';
      verifySub.textContent = 'Seu acesso gratuito foi liberado. Já pode entrar no grupo! 🎉';
    }
  }

  function grantAccess(source) {
    if (state.entered) return;
    state.entered = true;
    stopFreeWaitCountdown();
    setVerifyText(source);

    // Persisted in localStorage (survives closing the browser/tab) so that if
    // the customer leaves after paying and comes back later, the join button
    // is still there instead of restarting the whole flow from scratch.
    try {
      localStorage.setItem(ACCESS_KEY, source);
    } catch (e) {
      // localStorage unavailable (private mode, etc.) — access still works this session
    }

    showStep('verify');
    fireConfetti();
    vibrate([10, 40, 10]);
  }

  function restoreAccessIfGranted() {
    let savedAccess = null;
    try {
      savedAccess = localStorage.getItem(ACCESS_KEY);
    } catch (e) {
      savedAccess = null;
    }
    if (savedAccess !== 'paid' && savedAccess !== 'free') return false;

    state.entered = true;
    setVerifyText(savedAccess);
    showStep('verify');
    return true;
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

  // ---------- Online counter (illustrative, not a real headcount) ----------
  // Wanders up and down around the initial value instead of only ever climbing.
  const onlineCountEl = document.getElementById('online-count');
  if (onlineCountEl) {
    const onlineBaseline = parseInt(onlineCountEl.dataset.target, 10) || 0;
    if (!reduceMotion) {
      setInterval(() => {
        const wander = Math.floor(Math.random() * 60) - 24; // roughly -24..+35
        onlineCountEl.textContent = Math.max(1, onlineBaseline + wander);
      }, 900 + Math.random() * 900);
    }
  }

  // ---------- "Vagas" loading -> countdown ----------
  // Illustrative scarcity indicator: mostly counts down, occasionally ticks
  // back up a little (spots "freeing up"), but never reaches zero.
  const vagasBox = document.getElementById('vagas-box');
  const vagasSpinner = document.getElementById('vagas-spinner');
  const vagasDot = document.getElementById('vagas-dot');
  const vagasText = document.getElementById('vagas-text');
  if (vagasBox) {
    let vagasCount = 12;

    function formatVagas(n) {
      const num = n < 10 ? '0' + n : String(n);
      return num + (n === 1 ? ' vaga disponível no grupo' : ' vagas disponíveis no grupo');
    }

    function nextVagas(n) {
      const bumpChance = n <= 2 ? 0.4 : n <= 5 ? 0.18 : 0.08;
      if (Math.random() < bumpChance) {
        return Math.min(14, n + Math.floor(Math.random() * 4) + 2); // small refill: +2..+5
      }
      const step = Math.random() < 0.25 ? 2 : 1;
      return Math.max(1, n - step);
    }

    setTimeout(() => {
      vagasBox.classList.add('ready');
      vagasSpinner.classList.add('hidden');
      vagasDot.classList.remove('hidden');
      vagasText.textContent = formatVagas(vagasCount);
      vagasBox.classList.toggle('urgent', vagasCount <= 3);

      if (!reduceMotion) {
        setInterval(() => {
          vagasCount = nextVagas(vagasCount);
          vagasText.textContent = formatVagas(vagasCount);
          vagasBox.classList.toggle('urgent', vagasCount <= 3);
        }, 900 + Math.random() * 900);
      }
    }, 3000);
  }

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

  if (!restoreAccessIfGranted() && !handlePaymentReturn()) {
    showStep('intro');
  }
})();
