(function () {
  'use strict';

  // ======= CONFIG =======
  const GROUP_INVITE_URL = 'https://chat.whatsapp.com/EpU45VYKpLcEpniby02fS8';
  const COUNTDOWN_SECONDS = 20;
  const SHARE_TEXT = 'Entra no grupo COMPRAS E VENDAS - SERTÃO! Compre, venda e negocie com a comunidade 🛒';
  // =======================

  const panel = document.getElementById('panel');
  const steps = {
    intro: panel.querySelector('[data-step="intro"]'),
    share: panel.querySelector('[data-step="share"]'),
    verify: panel.querySelector('[data-step="verify"]'),
    success: panel.querySelector('[data-step="success"]'),
  };

  const btnStart = document.getElementById('btn-start');
  const taskStatus = document.getElementById('task-status');
  const taskFriend = document.getElementById('task-friend');
  const shareHint = document.getElementById('share-hint');
  const ringFg = document.getElementById('ring-fg');
  const countdownNum = document.getElementById('countdown-num');
  const verifyLog = document.getElementById('verify-log');
  const btnJoin = document.getElementById('btn-join');
  const rulesToggle = document.getElementById('btn-rules-toggle');
  const rulesPanel = document.getElementById('rules-panel');
  const rulesClose = document.getElementById('rules-close');

  btnJoin.href = GROUP_INVITE_URL;

  const RING_CIRCUMFERENCE = 2 * Math.PI * 62;
  ringFg.style.strokeDasharray = `${RING_CIRCUMFERENCE}`;
  ringFg.style.strokeDashoffset = '0';

  const state = {
    status: sessionStorage.getItem('cv_task_status') === '1',
    friend: sessionStorage.getItem('cv_task_friend') === '1',
  };

  function showStep(name) {
    Object.entries(steps).forEach(([key, el]) => {
      el.classList.toggle('hidden', key !== name);
    });
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

  function markDone(el, key) {
    el.classList.add('done');
    state[key] = true;
    sessionStorage.setItem(`cv_task_${key}`, '1');
    checkAllDone();
  }

  function checkAllDone() {
    if (state.status && state.friend) {
      shareHint.textContent = 'Tudo certo! Iniciando verificação...';
      setTimeout(() => {
        showStep('verify');
        startCountdown();
      }, 700);
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
    // restore any progress from this session
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

  const LOG_MESSAGES = [
    { at: 0, text: 'Conectando ao WhatsApp...' },
    { at: 5, text: 'Validando compartilhamento no status...' },
    { at: 11, text: 'Validando envio para contato...' },
    { at: 17, text: 'Finalizando verificação...' },
  ];

  function startCountdown() {
    let remaining = COUNTDOWN_SECONDS;
    countdownNum.textContent = remaining;
    ringFg.style.strokeDashoffset = '0';
    verifyLog.innerHTML = '';

    const shownLogs = new Set();

    function tick() {
      const elapsed = COUNTDOWN_SECONDS - remaining;
      LOG_MESSAGES.forEach((msg) => {
        if (elapsed >= msg.at && !shownLogs.has(msg.text)) {
          shownLogs.add(msg.text);
          const line = document.createElement('div');
          line.className = 'log-line';
          line.innerHTML = `<span class="ok">✓</span><span>${msg.text}</span>`;
          verifyLog.appendChild(line);
        }
      });

      const progress = elapsed / COUNTDOWN_SECONDS;
      ringFg.style.strokeDashoffset = `${RING_CIRCUMFERENCE * progress}`;
      countdownNum.textContent = remaining;

      if (remaining <= 0) {
        clearInterval(timer);
        setTimeout(() => showStep('success'), 400);
        return;
      }
      remaining -= 1;
    }

    tick();
    const timer = setInterval(tick, 1000);
  }

  showStep('intro');
})();
