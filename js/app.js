(() => {
  const config = window.BABY_QUEST_CONFIG || {};
  const screens = [...document.querySelectorAll('.screen')];
  const betButtons = [...document.querySelectorAll('[data-bet]')];
  const spinButton = document.getElementById('spin-button');
  const feedback = document.getElementById('selection-feedback');
  const wheel = document.getElementById('roulette-wheel');
  const ballTrack = document.getElementById('roulette-ball-track');
  const replayButton = document.getElementById('replay-button');
  const soundToggle = document.getElementById('sound-toggle');
  const startButton = document.getElementById('start-button');
  const shell = document.querySelector('.game-shell');
  const title = document.getElementById('spin-title');
  let selectedBet = null;
  let spinTimer = null;
  let revealTimer = null;
  let wheelAnimation = null;
  let ballAnimation = null;
  let soundEnabled = true;

  const labels = { boy: 'garçon', girl: 'fille' };
  const pct = (n) => `${Number(n).toFixed(0)}%`;
  const SPIN_DURATION = 5200;
  const CONSTANT_PHASE = 3000;
  const REVEAL_PAUSE = 2000;
  const WHEEL_SPEED = 360 / 1.6;
  const BALL_SPEED = 360 / 1.25;

  function showScreen(id) {
    screens.forEach(screen => {
      const active = screen.id === id;
      screen.hidden = !active;
      screen.classList.toggle('screen--active', active);
    });
    const casino = id === 'screen-bet' || id === 'screen-spin';
    shell.classList.toggle('casino-mode', casino);
    document.body.classList.toggle('casino-mode', casino);
    shell.classList.toggle('reveal-mode', id === 'screen-reveal');
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function setBet(value) {
    selectedBet = value;
    betButtons.forEach(button => {
      const selected = button.dataset.bet === value;
      button.setAttribute('aria-pressed', String(selected));
      button.querySelector('.bet-coins').style.display = selected ? 'block' : '';
    });
    feedback.textContent = `Votre pari : ${labels[value]}.`;
    spinButton.disabled = false;
  }

  function syncBetToSpinScreen() {
    ['boy', 'girl'].forEach(value => {
      const card = document.getElementById(`spin-${value}`);
      card.classList.toggle('is-selected', selectedBet === value);
      card.querySelector('.bet-coins').style.display = selectedBet === value ? 'block' : '';
    });
  }

  function getRotationDegrees(element) {
    const transform = window.getComputedStyle(element).transform;
    if (!transform || transform === 'none') return 0;
    const values = transform.match(/^matrix\(([^)]+)\)$/);
    if (!values) return 0;
    const parts = values[1].split(',').map(Number);
    return Math.atan2(parts[1], parts[0]) * (180 / Math.PI);
  }

  function mod360(angle) { return ((angle % 360) + 360) % 360; }
  function positiveOffset(from, to) { return mod360(to - from); }

  function cancelRouletteAnimations() {
    if (wheelAnimation) wheelAnimation.cancel();
    if (ballAnimation) ballAnimation.cancel();
    wheelAnimation = null;
    ballAnimation = null;
    if (spinTimer) window.clearTimeout(spinTimer);
    if (revealTimer) window.clearTimeout(revealTimer);
    spinTimer = revealTimer = null;
  }

  function startSpin() {
    if (!selectedBet) return;
    cancelRouletteAnimations();
    syncBetToSpinScreen();

    // Capturer les angles courants de la pré-roulette pour que la transition
    // ne fasse pas sauter la roue ni le tapis à l'écran.
    const wheelStart = getRotationDegrees(wheel);
    const ballStart = getRotationDegrees(ballTrack);
    title.classList.remove('is-visible');
    showScreen('screen-spin');

    wheel.style.animation = 'none';
    ballTrack.style.animation = 'none';
    wheel.style.transform = `rotate(${wheelStart}deg)`;
    ballTrack.style.transform = `rotate(${ballStart}deg)`;

    // La couleur sous le pointeur est bleue pour garçon et rose pour fille.
    // Le plateau contient un secteur bleu centré en haut et un rose décalé.
    const targetWheelAngle = selectedBet === 'girl' ? 326.25 : 0;
    const wheelCruiseDelta = WHEEL_SPEED * (CONSTANT_PHASE / 1000);
    const wheelAlignment = positiveOffset(wheelStart + wheelCruiseDelta, targetWheelAngle);
    const wheelEnd = wheelStart + wheelCruiseDelta + 720 + wheelAlignment;

    // La bille tourne en sens inverse et revient sous le pointeur à l'arrêt.
    const ballCruiseDelta = -BALL_SPEED * (CONSTANT_PHASE / 1000);
    const ballAlignment = positiveOffset(0, ballStart + ballCruiseDelta);
    const ballEnd = ballStart + ballCruiseDelta - 720 - ballAlignment;

    const wheelCruise = wheelStart + wheelCruiseDelta;
    const ballCruise = ballStart + ballCruiseDelta;
    wheelAnimation = wheel.animate([
      { transform: `rotate(${wheelStart}deg)`, offset: 0, easing: 'linear' },
      { transform: `rotate(${wheelCruise}deg)`, offset: CONSTANT_PHASE / SPIN_DURATION, easing: 'cubic-bezier(.18,.68,.12,1)' },
      { transform: `rotate(${wheelEnd}deg)`, offset: 1 }
    ], { duration: SPIN_DURATION, fill: 'forwards' });
    ballAnimation = ballTrack.animate([
      { transform: `rotate(${ballStart}deg)`, offset: 0, easing: 'linear' },
      { transform: `rotate(${ballCruise}deg)`, offset: CONSTANT_PHASE / SPIN_DURATION, easing: 'cubic-bezier(.18,.68,.12,1)' },
      { transform: `rotate(${ballEnd}deg)`, offset: 1 }
    ], { duration: SPIN_DURATION, fill: 'forwards' });

    // L'annonce apparaît au début de la décélération, après 3 secondes.
    spinTimer = window.setTimeout(() => title.classList.add('is-visible'), CONSTANT_PHASE);
    Promise.all([wheelAnimation.finished, ballAnimation.finished]).then(() => {
      // Garder la roue arrêtée deux secondes avant la révélation.
      revealTimer = window.setTimeout(showReveal, REVEAL_PAUSE);
    }).catch(() => {});
  }

  function showReveal() {
    cancelRouletteAnimations();
    const sex = config.revealSex === 'girl' ? 'girl' : 'boy';
    document.getElementById('reveal-title').textContent =
      (config.revealMessages && config.revealMessages[sex]) || (sex === 'boy' ? "C'EST UN GARÇON !" : "C'EST UNE FILLE !");
    document.getElementById('reveal-message').textContent =
      config.finalMessage || "Rendez-vous en mars pour la suite de l'histoire !";

    const stats = config.demoStats || { boy: 50, girl: 50 };
    const boy = Math.max(0, Number(stats.boy) || 0);
    const girl = Math.max(0, Number(stats.girl) || 0);
    const total = boy + girl;
    const boyPct = total ? (boy / total) * 100 : 0;
    const girlPct = total ? (girl / total) * 100 : 0;
    document.getElementById('stats-boy').textContent = total ? pct(boyPct) : '—';
    document.getElementById('stats-girl').textContent = total ? pct(girlPct) : '—';
    document.getElementById('stats-boy-bar').style.width = `${boyPct}%`;
    document.getElementById('stats-girl-bar').style.width = `${girlPct}%`;
    const chosenPct = selectedBet === 'boy' ? boyPct : girlPct;
    const chosenLabel = labels[selectedBet] || 'votre choix';
    document.getElementById('personal-stat').innerHTML = total
      ? `Vous faites partie des <strong>${chosenPct.toFixed(1).replace('.', ',')} %</strong> qui ont voté ${chosenLabel}.`
      : 'Les premiers pronostics n\'ont pas encore été enregistrés.';
    document.getElementById('stats-footnote').textContent =
      'Statistiques de démonstration — la base partagée sera connectée au J6.';
    showScreen('screen-reveal');
    launchConfetti();
  }

  function launchConfetti() {
    const layer = document.getElementById('confetti-layer');
    layer.replaceChildren();
    const colors = ['#438fd4', '#dc78b4', '#e5b94f', '#fff8e9', '#7bbf9b'];
    for (let i = 0; i < 48; i++) {
      const piece = document.createElement('span');
      piece.className = 'confetti';
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.background = colors[i % colors.length];
      piece.style.setProperty('--fall-time', `${2.2 + Math.random() * 2.8}s`);
      piece.style.setProperty('--drift', `${Math.round(Math.random() * 140 - 70)}px`);
      piece.style.animationDelay = `${Math.random() * 1.3}s`;
      if (i % 3 === 0) { piece.style.width = '5px'; piece.style.height = '5px'; }
      layer.append(piece);
    }
  }

  function replay() {
    cancelRouletteAnimations();
    selectedBet = null;
    betButtons.forEach(button => {
      button.setAttribute('aria-pressed', 'false');
      button.querySelector('.bet-coins').style.display = '';
    });
    spinButton.disabled = true;
    feedback.textContent = 'Sélectionnez une couleur pour continuer.';
    title.classList.remove('is-visible');
    wheel.style.animation = '';
    ballTrack.style.animation = '';
    wheel.style.transform = '';
    ballTrack.style.transform = '';
    document.getElementById('confetti-layer').replaceChildren();
    showScreen('screen-bet');
  }

  startButton.addEventListener('click', () => {
    shell.classList.add('fade-to-black');
    window.setTimeout(() => {
      shell.classList.remove('fade-to-black');
      showScreen('screen-bet');
    }, 650);
  });
  betButtons.forEach(button => button.addEventListener('click', () => setBet(button.dataset.bet)));
  spinButton.addEventListener('click', startSpin);
  replayButton.addEventListener('click', replay);
  soundToggle.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundToggle.setAttribute('aria-pressed', String(soundEnabled));
    soundToggle.textContent = '♪';
    soundToggle.classList.toggle('is-off', !soundEnabled);
    soundToggle.setAttribute('aria-label', soundEnabled ? 'Désactiver le son' : 'Activer le son');
    soundToggle.title = soundEnabled ? 'Son activé' : 'Son désactivé';
  });
  soundToggle.textContent = '♪';
  document.getElementById('brand-name').textContent = config.parentNames || 'Max & Nath';
  document.querySelector('.brand-subtitle').textContent = config.subtitle || 'RÉVÉLATION DU SEXE';
})();
