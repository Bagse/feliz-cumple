(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  const body = document.body;
  const startScreen = $('#start-screen');
  const startBtn = $('#start-btn');
  const audio = $('#bg-music');
  const partyAudio = $('#party-music');
  const title = $('#title');
  const wish = $('#wish');
  const toast = $('#toast');
  const candles = $$('.candle');
  const otter = $('#otter');
  const danceBtn = $('#dance-btn');
  const musicBtn = $('#music-btn');
  const cakeZone = $('.cake-zone');
  const drinksEl = $('.drinks');
  const giftbox = $('#giftbox');

  const COLORS = ['#ff4d6d', '#ff8fab', '#ffd166', '#ffffff', '#c77dff', '#06d6a0'];
  const OPEN_AT = 1950;
  let started = false;
  let softTimer = null;

  /* ---------- Confeti ---------- */

  const fire = (opts = {}) => {
    if (typeof confetti !== 'function') return;
    confetti({
      colors: COLORS,
      disableForReducedMotion: true,
      zIndex: 100,
      ...opts
    });
  };

  const sideCannons = (delay = 250) => {
    setTimeout(() => fire({
      particleCount: 110, angle: 60, spread: 68,
      startVelocity: 55, origin: { x: 0, y: .78 }
    }), delay);
    setTimeout(() => fire({
      particleCount: 110, angle: 120, spread: 68,
      startVelocity: 55, origin: { x: 1, y: .78 }
    }), delay + 180);
  };

  const bigBurst = () => {
    fire({ particleCount: 170, spread: 100, startVelocity: 45, origin: { y: .62 } });
    sideCannons();
    fire({
      particleCount: 70, spread: 130, startVelocity: 26, scalar: .9,
      shapes: ['star'], colors: ['#ffd166', '#ffffff', '#ff8fab'],
      origin: { y: .35 }, ticks: 220
    });
  };

  const wishParty = () => {
    wish.classList.add('show');
    [0, 350, 700, 1050].forEach((t, i) => setTimeout(() => fire({
      particleCount: 120 + i * 20, spread: 120,
      startVelocity: 38 + i * 6, origin: { x: .5, y: .55 }
    }), t));
    setTimeout(() => sideCannons(0), 500);
    fire({
      particleCount: 90, spread: 360, startVelocity: 18, gravity: .5,
      scalar: .8, shapes: ['circle'], colors: ['#ffd166', '#ffffff'],
      origin: { y: .5 }, ticks: 300
    });
  };

  /* ---------- Utilidades ---------- */

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove('show'), 3800);
  }

  function ramp(el, to, done) {
    clearInterval(el._iv);
    let v;
    try { v = el.volume; } catch (_) { v = 1; }
    const steps = 14;
    const step = (to - v) / steps;
    let i = 0;
    el._iv = setInterval(() => {
      i++;
      try {
        el.volume = Math.max(0, Math.min(1, v + step * i));
      } catch (_) { /* iOS ignora volume */ }
      if (i >= steps * 2) {
        clearInterval(el._iv);
        el._iv = null;
        if (done) done();
      }
    }, 50);
  }

  function fadeInAudio() {
    audio.volume = 0;
    const play = audio.play();
    if (!play) return;
    play.then(() => ramp(audio, .85)).catch(() => {
      showToast('Activa el sonido para escuchar la música');
    });
  }

  /* ---------- Crossfade Modo Baile ---------- */

  function crossfade(on) {
    if (on) {
      try { partyAudio.volume = 0; } catch (_) {}
      const play = partyAudio.play();
      if (!play) return;
      play.then(() => {
        ramp(audio, 0);
        ramp(partyAudio, .85);
      }).catch(() => {
        partyAudio.pause();
        showToast('No se pudo iniciar la música de fiesta');
      });
    } else {
      ramp(partyAudio, 0, () => partyAudio.pause());
      ramp(audio, .85);
    }
  }

  /* ---------- Nutria ---------- */

  function otterSplash() {
    if (otter.classList.contains('spin')) return;
    otter.classList.add('spin');
    fire({
      particleCount: 34, spread: 70, startVelocity: 24,
      scalar: .75, shapes: ['circle'],
      colors: ['#7bdff2', '#ffffff', '#4cc9f0'],
      origin: { x: .14, y: .82 }
    });
    setTimeout(() => otter.classList.remove('spin'), 980);
  }

  otter.addEventListener('click', otterSplash);
  otter.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      otterSplash();
    }
  });

  /* ---------- Modo Baile ---------- */

  danceBtn.addEventListener('click', () => {
    const on = body.classList.toggle('party');
    danceBtn.classList.toggle('on', on);
    danceBtn.setAttribute('aria-pressed', String(on));
    danceBtn.querySelector('.db-label').textContent = on ? 'Baile ON' : 'Modo Baile';
    crossfade(on);
    if (on) fire({ particleCount: 60, spread: 90, startVelocity: 30, origin: { x: .5, y: .2 } });
  });

  /* ---------- Pausa / Play Música ---------- */

  musicBtn.addEventListener('click', () => {
    const paused = musicBtn.classList.toggle('paused');
    musicBtn.setAttribute('aria-pressed', String(paused));
    musicBtn.setAttribute('aria-label', paused ? 'Reanudar música' : 'Pausar música');
    const active = body.classList.contains('party') ? partyAudio : audio;
    if (paused) {
      active.pause();
    } else {
      active.play().catch(() => {});
    }
  });

  /* ---------- Inicio de la fiesta ---------- */

  function startExperience() {
    if (started) return;
    started = true;

    startScreen.classList.add('gone');
    body.classList.add('started');
    fadeInAudio();

    // La caja tiembla y se abre a los ~1.95 s
    setTimeout(openGift, OPEN_AT);

    // Confeti suave ocasional
    setTimeout(() => {
      softTimer = setInterval(() => {
        fire({
          particleCount: 36, spread: 64, startVelocity: 22,
          gravity: .6, scalar: .75, origin: { x: Math.random(), y: .45 }
        });
      }, 6500);
    }, 5200);
  }

  function openGift() {
    body.classList.add('opened');
    bigBurst();
    setTimeout(() => giftbox.classList.add('done'), 1100);

    // Fija los estados finales para poder animarlos en Modo Baile
    setTimeout(() => {
      cakeZone.classList.add('settled');
      drinksEl.classList.add('settled');
    }, 1650);

    // Título tras salir el escenario
    setTimeout(() => title.classList.add('show'), 1500);
    setTimeout(() => title.classList.add('settled'), 2700);

    // Carta personalizada después del título
    setTimeout(() => document.querySelector('.letter').classList.add('show'), 3200);
  }

  /* ---------- Velas ---------- */

  candles.forEach((candle) => {
    candle.addEventListener('click', () => {
      if (candle.classList.contains('out')) return;
      candle.classList.add('out');

      fire({
        particleCount: 24, spread: 50, startVelocity: 16,
        scalar: .7, origin: { y: .5 }, colors: ['#ffd166', '#ffffff']
      });

      if ($$('.candle.out').length === candles.length) {
        clearInterval(softTimer);
        setTimeout(wishParty, 420);
      }
    });
  });

  startBtn.addEventListener('click', startExperience);

  /* ---------- Pausar música al salir de la pestaña ---------- */

  let wasPlayingBeforeHidden = false;

  document.addEventListener('visibilitychange', () => {
    if (!started) return;
    if (musicBtn.classList.contains('paused')) return;

    if (document.hidden) {
      wasPlayingBeforeHidden = !audio.paused || !partyAudio.paused;
      audio.pause();
      partyAudio.pause();
    } else if (wasPlayingBeforeHidden) {
      const active = body.classList.contains('party') ? partyAudio : audio;
      active.play().catch(() => {});
      wasPlayingBeforeHidden = false;
    }
  });

  window.addEventListener('pagehide', () => {
    audio.pause();
    partyAudio.pause();
  });
})();
