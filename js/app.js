(() => {
  const config = window.BABY_QUEST_CONFIG || {};
  const screens = [...document.querySelectorAll('.screen')];
  const betButtons = [...document.querySelectorAll('[data-bet]')];
  const spinButton = document.getElementById('spin-button');
  const feedback = document.getElementById('selection-feedback');
  const previewWheel = document.querySelector('#screen-bet .roulette-wheel');
  const previewBallTrack = document.querySelector('#screen-bet .roulette-ball-track');
  const wheel = document.getElementById('roulette-wheel');
  const ballTrack = document.getElementById('roulette-ball-track');
  const betSound = new Audio('assets/sounds/sound_coins.mp3');
  const backgroundMusic = new Audio('assets/sounds/Pixelated Ragtime.mp3');
  const winSound = new Audio('assets/sounds/audience-clap.mp3');
  const loseSound = new Audio('assets/sounds/undertakers-bell_2UwFCIe.mp3');
  const audioTracks = [backgroundMusic, betSound, winSound, loseSound];
  const audioSourcesReady = Promise.all(audioTracks.map((audio) => {
    const source = audio.src;
    return fetch(source)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.blob();
      })
      .then(blob => {
        audio.src = URL.createObjectURL(blob);
        audio.load();
      });
  })).then(() => true).catch(error => {
    console.error('Impossible de charger les fichiers audio du jeu.', error);
    return false;
  });
  const replayButton = document.getElementById('replay-button');
  const soundToggle = document.getElementById('sound-toggle');
  const startButton = document.getElementById('start-button');
  const shell = document.querySelector('.game-shell');
  const title = document.getElementById('spin-title');
  let selectedBet = null;
  let firstVote = null;
  let spinTimer = null;
  let revealTimer = null;
  let wheelAnimation = null;
  let ballAnimation = null;
  let soundEnabled = true;
  let spinInProgress = false;
  let replayInProgress = false;
  let lastSpinStartedAt = 0;

  const labels = { boy: 'garçon', girl: 'fille' };
  const pct = (n) => `${Number(n).toFixed(0)}%`;
  const casinoConfig = config.casino || {};
  const DEFAULTS = {
    wheelCruiseSeconds: 3,
    wheelSlowdownSeconds: 2.5,
    wheelTurnsPerSecond: 1.15,
    ballCruiseSeconds: 5,
    ballSlowdownSeconds: 3,
    ballTurnsPerSecond: 1.45,
    revealDelaySeconds: 2
  };
  const timing = { ...DEFAULTS, ...casinoConfig };
  const RESULT_ANGLES = {
    girl: [0, 60, 120, 180, 240, 300],
    boy: [30, 90, 150, 210, 270, 330]
  };
  const NORTH_ANGLE = -90;

  betSound.preload = 'auto';
  backgroundMusic.preload = 'auto';
  backgroundMusic.loop = true;
  backgroundMusic.volume = 0.35;
  winSound.preload = 'auto';
  loseSound.preload = 'auto';
  previewWheel.style.setProperty('--wheel-loop-duration', `${1 / timing.wheelTurnsPerSecond}s`);
  previewBallTrack.style.setProperty('--ball-loop-duration', `${1 / timing.ballTurnsPerSecond}s`);

  async function playAudio(audio, restart = true) {
    if (!soundEnabled) return;
    if (!await audioSourcesReady || !soundEnabled) return;
    if (restart) audio.currentTime = 0;
    try {
      await audio.play();
    } catch (error) {
      console.error(`Impossible de jouer le son "${audio.currentSrc}".`, error);
    }
  }

  function startBackgroundMusic() {
    playAudio(backgroundMusic, false);
  }

  function stopAudio() {
    audioTracks.forEach(audio => {
      audio.pause();
      if (audio !== backgroundMusic) audio.currentTime = 0;
    });
  }

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
    playAudio(betSound);
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

  function getWheelTargetAngles(resultAngles) {
    return resultAngles.map(resultAngle => mod360(resultAngle + NORTH_ANGLE));
  }

  function getSmoothStopPlan(startAngle, targetAngles, direction, speed, durationSeconds) {
    const minimumTravel = speed * durationSeconds / 3;
    const maximumTravel = speed * durationSeconds;
    const idealTravel = speed * durationSeconds / 2;
    const plans = [];

    targetAngles.forEach(targetAngle => {
      const baseTravel = mod360(direction * (targetAngle - startAngle));
      const firstTurn = Math.max(0, Math.ceil((minimumTravel - baseTravel) / 360));
      for (let turn = firstTurn; turn <= firstTurn + 2; turn++) {
        const travel = baseTravel + turn * 360;
        if (travel < minimumTravel || travel > maximumTravel) continue;

        const controlX1 = 0.33;
        const controlY1 = controlX1 * speed * durationSeconds / travel;
        plans.push({
          endAngle: startAngle + direction * travel,
          easing: `cubic-bezier(${controlX1}, ${controlY1}, .67, 1)`,
          distanceFromIdeal: Math.abs(travel - idealTravel)
        });
      }
    });

    plans.sort((a, b) => a.distanceFromIdeal - b.distanceFromIdeal);
    return plans[0] || null;
  }

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
    if (!selectedBet || spinInProgress) return;
    if (Date.now() - lastSpinStartedAt < 1000) return;
    const X = Number(timing.wheelCruiseSeconds);
    const Y = Number(timing.wheelSlowdownSeconds);
    const U = Number(timing.ballCruiseSeconds);
    const V = Number(timing.ballSlowdownSeconds);
    const Z = Number(timing.revealDelaySeconds);
    const wheelSpeed = Number(timing.wheelTurnsPerSecond);
    const ballSpeed = Number(timing.ballTurnsPerSecond);
    const valuesAreValid = [X, Y, U, V, wheelSpeed, ballSpeed].every(value => Number.isFinite(value) && value > 0) &&
      Number.isFinite(Z) && Z >= 0;
    const durationsKeepWheelAhead = U > X && U + V > X + Y;
    const slowdownCanReachSectors = 360 * wheelSpeed * Y >= 90 && 360 * ballSpeed * V >= 90;
    if (!valuesAreValid || !durationsKeepWheelAhead || !slowdownCanReachSectors) {
      const message = 'Configuration roulette invalide : vérifiez X, Y, U, V, Z et les vitesses. U > X, U + V > X + Y, et chaque décélération doit parcourir au moins 90°.';
      feedback.textContent = message;
      console.error(message);
      return;
    }

    cancelRouletteAnimations();
    syncBetToSpinScreen();

    const wheelStart = getRotationDegrees(previewWheel);
    const ballStart = getRotationDegrees(previewBallTrack);

    const wheelDuration = (X + Y) * 1000;
    const ballDuration = (U + V) * 1000;
    const wheelCruiseOffset = X / (X + Y);
    const ballCruiseOffset = U / (U + V);
    const wheelCruiseDelta = 360 * wheelSpeed * X;
    const ballCruiseDelta = -360 * ballSpeed * U;

    const actualSex = config.revealSex === 'girl' ? 'girl' : 'boy';
    const resultAngles = RESULT_ANGLES[actualSex];
    const wheelCruise = wheelStart + wheelCruiseDelta;
    const wheelStopPlan = getSmoothStopPlan(
      wheelCruise,
      getWheelTargetAngles(resultAngles),
      1,
      360 * wheelSpeed,
      Y
    );
    if (!wheelStopPlan) {
      feedback.textContent = 'Impossible de calculer un arrêt fluide de la roulette avec ces réglages.';
      console.error(feedback.textContent);
      return;
    }
    const ballCruise = ballStart + ballCruiseDelta;
    const ballStopPlans = resultAngles.map(resultAngle => {
      const targetBallAngle = mod360(wheelStopPlan.endAngle - resultAngle);
      return getSmoothStopPlan(ballCruise, [targetBallAngle], -1, 360 * ballSpeed, V);
    });
    const validBallStopPlans = ballStopPlans.filter(Boolean);
    const ballStopPlan = validBallStopPlans[Math.floor(Math.random() * validBallStopPlans.length)];
    if (!ballStopPlan) {
      feedback.textContent = 'Impossible de calculer un arrêt fluide de la bille avec ces réglages.';
      console.error(feedback.textContent);
      return;
    }

    if (firstVote === null) firstVote = selectedBet;
    spinInProgress = true;
    replayInProgress = false;
    lastSpinStartedAt = Date.now();
    spinButton.disabled = true;
    title.classList.remove('is-visible');
    title.classList.remove('spin-title--outcome', 'spin-title--won');
    title.textContent = 'Rien ne va plus…';
    showScreen('screen-spin');
    wheel.style.animation = 'none';
    ballTrack.style.animation = 'none';
    wheel.style.transform = `rotate(${wheelStart}deg)`;
    ballTrack.style.transform = `rotate(${ballStart}deg)`;

    wheelAnimation = wheel.animate([
      { transform: `rotate(${wheelStart}deg)`, offset: 0, easing: 'linear' },
      { transform: `rotate(${wheelCruise}deg)`, offset: wheelCruiseOffset, easing: wheelStopPlan.easing },
      { transform: `rotate(${wheelStopPlan.endAngle}deg)`, offset: 1 }
    ], { duration: wheelDuration, fill: 'forwards' });
    ballAnimation = ballTrack.animate([
      { transform: `rotate(${ballStart}deg)`, offset: 0, easing: 'linear' },
      { transform: `rotate(${ballCruise}deg)`, offset: ballCruiseOffset, easing: ballStopPlan.easing },
      { transform: `rotate(${ballStopPlan.endAngle}deg)`, offset: 1 }
    ], { duration: ballDuration, fill: 'forwards' });

    spinTimer = window.setTimeout(() => title.classList.add('is-visible'), X * 1000);
    Promise.all([wheelAnimation.finished, ballAnimation.finished]).then(() => {
      const won = selectedBet === actualSex;
      title.textContent = won ? 'Gagné !' : 'Perdu !';
      title.classList.toggle('spin-title--won', won);
      title.classList.add('spin-title--outcome', 'is-visible');
      playAudio(won ? winSound : loseSound);
      revealTimer = window.setTimeout(showReveal, Z * 1000);
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
    const chosenPct = firstVote === 'boy' ? boyPct : girlPct;
    const chosenLabel = labels[firstVote] || 'votre choix';
    document.getElementById('personal-stat').innerHTML = total
      ? `Vous faites partie des <strong>${chosenPct.toFixed(1).replace('.', ',')} %</strong> qui ont voté ${chosenLabel}.`
      : 'Les premiers pronostics n\'ont pas encore été enregistrés.';
    document.getElementById('stats-footnote').textContent =
      'Statistiques de démonstration — aucun vote partagé n’est encore enregistré.';
    spinInProgress = false;
    replayInProgress = false;
    replayButton.disabled = false;
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
    if (replayInProgress || spinInProgress) return;
    replayInProgress = true;
    cancelRouletteAnimations();
    title.textContent = 'Rien ne va plus…';
    title.classList.remove('is-visible', 'spin-title--outcome', 'spin-title--won');
    wheel.style.animation = '';
    ballTrack.style.animation = '';
    wheel.style.transform = '';
    ballTrack.style.transform = '';
    document.getElementById('confetti-layer').replaceChildren();
    betButtons.forEach(button => {
      const selected = button.dataset.bet === selectedBet;
      button.setAttribute('aria-pressed', String(selected));
      button.querySelector('.bet-coins').style.display = selected ? 'block' : '';
    });
    spinButton.disabled = !selectedBet;
    feedback.textContent = selectedBet
      ? `Pari de cette animation : ${labels[selectedBet]}. Vous pouvez le modifier.`
      : 'Sélectionnez une couleur pour continuer.';
    showScreen('screen-bet');
  }

  startButton.addEventListener('click', () => {
    startBackgroundMusic();
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
    if (soundEnabled) startBackgroundMusic();
    else stopAudio();
  });
  soundToggle.textContent = '♪';
  document.getElementById('brand-name').textContent = config.parentNames || 'Max & Nath';
  document.querySelector('.brand-subtitle').textContent = config.subtitle || 'RÉVÉLATION DU SEXE';
})();
