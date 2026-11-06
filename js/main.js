(() => {
  const cfg = window.PAGE_CONFIG;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const easterToast = $('#easter-toast');
  let easterToastTimer;
  function showEasterToast(message) {
    easterToast.textContent = message;
    easterToast.classList.add('visible');
    clearTimeout(easterToastTimer);
    easterToastTimer = setTimeout(() => easterToast.classList.remove('visible'), 4200);
  }

  // Apply page configuration.
  $$('[data-bind]').forEach(element => {
    const key = element.dataset.bind;
    if (cfg[key] !== undefined) element.textContent = cfg[key];
  });
  document.title = `Felices 3 Meses ♡ — ${cfg.names.partner}`;

  // Contador desde el inicio y cuenta regresiva al siguiente aniversario anual.
  const startedAt = new Date(cfg.startDateTime);
  const startMonthDay = cfg.startDateTime.slice(5, 10);
  const startClock = cfg.startDateTime.slice(11, 16);
  const startOffset = cfg.startDateTime.slice(19) || '-05:00';
  function nextAnniversaryFrom(now) {
    let year = now.getFullYear();
    let target = new Date(`${year}-${startMonthDay}T${startClock}:00${startOffset}`);
    if (target <= now) target = new Date(`${year + 1}-${startMonthDay}T${startClock}:00${startOffset}`);
    return target;
  }
  function updateRelationshipCounters() {
    const now = new Date();
    const elapsed = Math.max(0, now - startedAt);
    const remaining = Math.max(0, nextAnniversaryFrom(now) - now);
    const parts = milliseconds => ({
      days: Math.floor(milliseconds / 86400000),
      hours: Math.floor(milliseconds / 3600000) % 24,
      minutes: Math.floor(milliseconds / 60000) % 60,
      seconds: Math.floor(milliseconds / 1000) % 60
    });
    const elapsedParts = parts(elapsed);
    const remainingParts = parts(remaining);
    $('#elapsed-days').textContent = elapsedParts.days;
    $('#elapsed-hours').textContent = String(elapsedParts.hours).padStart(2, '0');
    $('#elapsed-minutes').textContent = String(elapsedParts.minutes).padStart(2, '0');
    $('#elapsed-seconds').textContent = String(elapsedParts.seconds).padStart(2, '0');
    $('#anniversary-days').textContent = remainingParts.days;
    $('#anniversary-hours').textContent = String(remainingParts.hours).padStart(2, '0');
    $('#anniversary-minutes').textContent = String(remainingParts.minutes).padStart(2, '0');
    $('#anniversary-seconds').textContent = String(remainingParts.seconds).padStart(2, '0');
  }
  updateRelationshipCounters();
  setInterval(updateRelationshipCounters, 1000);

  // Login and intro screens.
  const loginGate = $('#login-gate');
  const loginForm = $('#login-form');
  const passwordInput = $('#login-password');
  const loginError = $('#login-error');
  const togglePassword = $('#toggle-password');
  const intro = $('#intro-screen');
  document.body.classList.add('login-locked');

  togglePassword.addEventListener('click', () => {
    const show = passwordInput.type === 'password';
    passwordInput.type = show ? 'text' : 'password';
    togglePassword.textContent = show ? 'Ocultar' : 'Mostrar';
    togglePassword.setAttribute('aria-label', `${show ? 'Ocultar' : 'Mostrar'} contraseña`);
    togglePassword.setAttribute('aria-pressed', String(show));
  });

  function closeIntro() {
    if (!intro || intro.classList.contains('leaving')) return;
    intro.classList.add('leaving');
    intro.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('intro-active');
    setTimeout(() => intro.remove(), 850);
  }

  function startIntro() {
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.body.classList.add('intro-active');
      setTimeout(closeIntro, 4200);
      $('#skip-intro').focus();
    } else {
      closeIntro();
    }
  }

  loginForm.addEventListener('submit', event => {
    event.preventDefault();
    if (passwordInput.value === cfg.password) {
      loginGate.classList.add('leaving');
      loginGate.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('login-locked');
      setTimeout(() => loginGate.remove(), 500);
      enableBackgroundMusic();
      startIntro();
    } else {
      loginError.textContent = 'La contraseña no es correcta. Inténtalo de nuevo.';
      passwordInput.value = '';
      passwordInput.focus();
    }
  });
  $('#enter-site').addEventListener('click', closeIntro);
  $('#skip-intro').addEventListener('click', closeIntro);

  // Timeline.
  const timeline = $('#timeline');
  cfg.timeline.forEach(item => {
    const card = document.createElement('article');
    card.className = 'timeline-item reveal';
    card.innerHTML = `<button class="polaroid" type="button"><img src="${item.image}" alt="${item.alt}" loading="lazy"><span>${item.title}</span></button><span class="node" aria-hidden="true">♡</span><p>${item.note}</p></article>`;
    timeline.append(card);
  });

  // Photo gallery and carousel.
  const gallery = $('#gallery');
  const dots = $('#dots');
  cfg.photos.forEach((photo, i) => {
    const card = document.createElement('button');
    card.className = 'polaroid gallery-card';
    card.type = 'button';
    card.style.setProperty('--tilt', `${[-5, 3, -2, 4, -4][i % 5]}deg`);
    if (photo.type === 'video') {
      card.setAttribute('aria-label', `Reproducir video: ${photo.alt}`);
      card.innerHTML = `<span class="video-preview"><img src="${photo.poster || photo.image}" alt="" loading="lazy"><span class="video-play-icon" aria-hidden="true">▶</span></span><span>${photo.caption}</span>`;
    } else {
      card.innerHTML = `<img src="${photo.image}" alt="${photo.alt}" loading="lazy"><span>${photo.caption}</span>`;
    }
    card.addEventListener('click', () => showLightbox(photo));
    gallery.append(card);

    const dot = document.createElement('button');
    dot.className = 'dot';
    dot.setAttribute('aria-label', `Mostrar recuerdo ${i + 1}`);
    dot.addEventListener('click', () => go(i));
    dots.append(dot);
  });

  let index = 0;
  const cards = $$('.gallery-card');

  function go(n) {
    index = (n + cards.length) % cards.length;
    const gap = parseFloat(getComputedStyle(gallery).gap) || 0;
    const step = cards[0] ? cards[0].getBoundingClientRect().width + gap : 0;
    gallery.style.transform = `translateX(${-index * step}px)`;
    $$('.dot').forEach((dot, i) => dot.classList.toggle('active', i === index));
  }

  $('.prev').onclick = () => go(index - 1);
  $('.next').onclick = () => go(index + 1);
  go(0);

  let touchX = 0;
  $('.carousel-window').addEventListener('touchstart', event => {
    touchX = event.touches[0].clientX;
  }, { passive: true });
  $('.carousel-window').addEventListener('touchend', event => {
    const diff = event.changedTouches[0].clientX - touchX;
    if (Math.abs(diff) > 40) go(index + (diff < 0 ? 1 : -1));
  }, { passive: true });

  // Lightbox and letter modal.
  const lightbox = $('#lightbox');
  function showLightbox(photo) {
    const lightboxImage = $('img', lightbox);
    const lightboxVideo = $('#lightbox-video');
    if (photo.type === 'video') {
      lightboxImage.hidden = true;
      lightboxVideo.hidden = false;
      lightboxVideo.muted = true;
      lightboxVideo.volume = 0;
      lightboxVideo.src = photo.video;
      lightboxVideo.poster = photo.poster || photo.image;
      lightboxVideo.load();
      lightboxVideo.play().catch(() => { $('p', lightbox).textContent = `Añade el video ${photo.video} en la carpeta assets/videos/.`; });
    } else {
      lightboxVideo.pause();
      lightboxVideo.removeAttribute('src');
      lightboxVideo.load();
      lightboxVideo.hidden = true;
      lightboxImage.hidden = false;
      lightboxImage.src = photo.image;
      lightboxImage.alt = photo.alt;
    }
    $('p', lightbox).textContent = photo.caption;
    lightbox.classList.add('open');
    $('.modal-close', lightbox).focus();
  }

  $$('.modal-close').forEach(button => {
    button.onclick = () => {
      const dialog = button.closest('[role=dialog]');
      dialog.classList.remove('open');
      if (dialog === lightbox) { const video = $('#lightbox-video'); video.pause(); video.removeAttribute('src'); video.load(); }
    };
  });

  const envelope = $('#open-letter');
  const letterModal = $('#letter-modal');
  const letterText = $('#letter-text');
  envelope.onclick = () => {
    envelope.classList.add('opened');
    setTimeout(() => {
      letterModal.classList.add('open');
      typeText(cfg.letter, letterText);
      $('.modal-close', letterModal).focus();
    }, 500);
  };

  function typeText(text, element) {
    element.textContent = '';
    let i = 0;
    const timer = setInterval(() => {
      element.textContent += text[i++] || '';
      if (i > text.length) clearInterval(timer);
    }, 30);
  }

  // Audio player.
  const audio = $('#audio');
  const progress = $('#progress');
  const play = $('#play');
  const volume = $('#volume');
  const tracks = cfg.tracks?.length ? cfg.tracks : [{ title: cfg.songTitle, artist: 'Playlist: Nosotros', audio: cfg.audio, cover: 'assets/images/foto2.svg' }];
  const trackModules = $('#track-modules');
  let trackIndex = 0;
  let shuffleEnabled = false;
  let userRequestedTrack = false;
  audio.volume = Number(volume.value);

  function selectTrack(nextIndex, startPlayback = false) {
    trackIndex = (nextIndex + tracks.length) % tracks.length;
    userRequestedTrack = startPlayback;
    const track = tracks[trackIndex];
    audio.pause();
    audio.src = track.audio;
    audio.load();
    $('#album-cover').style.backgroundImage = `url("${track.cover}")`;
    $('#album-cover').setAttribute('aria-label', `Portada de ${track.title}`);
    $('.track-info h3').textContent = track.title;
    $('#song-artist').textContent = track.artist;
    $('#elapsed').textContent = '0:00';
    $('#duration').textContent = '0:00';
    progress.value = 0;
    play.textContent = '▶';
    $('#audio-hint').textContent = '';
    $$('.track-module', trackModules).forEach((module, i) => {
      module.classList.toggle('selected', i === trackIndex);
      module.setAttribute('aria-pressed', String(i === trackIndex));
    });
    if (startPlayback) startCurrentTrack();
  }

  async function startCurrentTrack() {
    userRequestedTrack = true;
    try {
      await audio.play();
      play.textContent = 'Ⅱ';
      $('#audio-hint').textContent = '';
    } catch {
      $('#audio-hint').textContent = `Añade el archivo ${tracks[trackIndex].audio} para escuchar esta canción.`;
    }
  }

  tracks.forEach((track, i) => {
    const module = document.createElement('button');
    module.type = 'button';
    module.className = 'track-module';
    module.setAttribute('aria-pressed', 'false');
    module.innerHTML = `<img src="${track.cover}" alt="" loading="lazy"><span class="module-copy"><strong>${track.title}</strong><small>${track.artist}</small></span><span class="module-play" aria-hidden="true">▶</span>`;
    module.addEventListener('click', () => selectTrack(i, true));
    trackModules.append(module);
  });
  selectTrack(0);

  let coverTaps = 0;
  let coverTapTimer;
  $('#album-cover').addEventListener('click', () => {
    coverTaps++;
    clearTimeout(coverTapTimer);
    if (coverTaps >= 5) {
      showEasterToast(cfg.easterEggs.songMessage);
      coverTaps = 0;
    } else coverTapTimer = setTimeout(() => coverTaps = 0, 1600);
  });

  volume.addEventListener('input', () => {
    audio.volume = Number(volume.value);
  });
  audio.addEventListener('loadedmetadata', () => {
    $('#duration').textContent = fmt(audio.duration);
  });
  audio.addEventListener('timeupdate', () => {
    if (audio.duration) {
      progress.value = audio.currentTime / audio.duration * 100;
      $('#elapsed').textContent = fmt(audio.currentTime);
    }
  });

  function fmt(seconds) {
    if (!Number.isFinite(seconds)) return '0:00';
    return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
  }

  play.onclick = () => audio.paused ? startCurrentTrack() : (audio.pause(), play.textContent = '▶');
  audio.addEventListener('ended', () => selectTrack(shuffleEnabled ? randomNext() : trackIndex + 1, true));
  audio.addEventListener('error', () => { if (userRequestedTrack) $('#audio-hint').textContent = `No se encontró ${tracks[trackIndex].audio}. Añade el MP3 a assets/audio/.`; });
  progress.oninput = () => {
    if (audio.duration) audio.currentTime = progress.value / 100 * audio.duration;
  };
  $('#previous').onclick = () => selectTrack(trackIndex - 1, true);
  function randomNext() { return tracks.length > 1 ? (trackIndex + 1 + Math.floor(Math.random() * (tracks.length - 1))) % tracks.length : trackIndex; }
  $('#next').onclick = () => selectTrack(shuffleEnabled ? randomNext() : trackIndex + 1, true);
  $('#shuffle').onclick = event => { shuffleEnabled = !shuffleEnabled; event.currentTarget.classList.toggle('selected', shuffleEnabled); };
  $('#repeat').onclick = event => {
    audio.loop = !audio.loop;
    event.currentTarget.classList.toggle('selected', audio.loop);
  };
  $('.favorite').onclick = event => {
    event.currentTarget.classList.toggle('selected');
    event.currentTarget.textContent = event.currentTarget.classList.contains('selected') ? '♥' : '♡';
  };

  // Música ambiental: el acceso válido es un gesto del usuario que habilita el autoplay.
  const backgroundAudio = $('#background-audio');
  const backgroundButton = $('#background-music-toggle');
  const backgroundLabel = $('#background-music-label');
  backgroundAudio.src = cfg.backgroundMusic;
  backgroundAudio.volume = .1;
  async function enableBackgroundMusic() {
    try {
      await backgroundAudio.play();
      backgroundButton.setAttribute('aria-pressed', 'true');
      backgroundButton.classList.add('playing');
      backgroundLabel.textContent = 'Apagar música de fondo';
      backgroundButton.title = 'Pausar la música ambiental';
    } catch (error) {
      if (error.name === 'NotAllowedError') {
        backgroundLabel.textContent = 'Activar música de fondo';
        backgroundButton.title = 'Pulsa para iniciar la música ambiental';
      } else {
        backgroundLabel.textContent = 'Falta el audio de fondo';
        backgroundButton.title = `Añade el archivo ${cfg.backgroundMusic}`;
      }
    }
  }
  backgroundButton.addEventListener('click', async () => {
    if (backgroundAudio.paused) {
      await enableBackgroundMusic();
    } else {
      backgroundAudio.pause();
      backgroundButton.setAttribute('aria-pressed', 'false');
      backgroundButton.classList.remove('playing');
      backgroundLabel.textContent = 'Música de fondo: apagada';
    }
  });

  // Abrir el regalo, elegir respuesta y mostrar un final distinto.
  const gift = $('#gift');
  const surpriseButton = $('#surprise-button');
  const question = $('#surprise-question');
  const answers = $('#answer-options');
  const surpriseMessage = $('#surprise-message');
  const surpriseSection = $('#sorpresa');
  const noEnding = $('#no-ending');

  function openGift() {
    if (gift.classList.contains('opened')) return;
    gift.classList.add('opened');
    gift.setAttribute('aria-label', 'Regalo abierto');
    surpriseButton.hidden = true;
    question.textContent = cfg.surpriseMessage;
    question.classList.add('visible');
    answers.hidden = false;
    answers.classList.add('choices-arrive');
  }

  function launchConfetti() {
    const colors = ['#ff3b5c', '#e11d48', '#ffd1d8', '#fff0c2'];
    for (let i = 0; i < 64; i++) {
      const particle = document.createElement('i');
      particle.className = 'confetti';
      particle.textContent = Math.random() > .35 ? '♥' : '✦';
      particle.style.left = `${Math.random() * innerWidth}px`;
      particle.style.top = `${-Math.random() * innerHeight * .22}px`;
      particle.style.color = colors[i % colors.length];
      particle.style.setProperty('--fall', `${2 + Math.random() * 2}s`);
      particle.style.setProperty('--drift', `${(Math.random() - .5) * 190}px`);
      particle.style.setProperty('--drop-distance', `${innerHeight + 100}px`);
      particle.style.animationDelay = `${Math.random() * .7}s`;
      document.body.append(particle);
      setTimeout(() => particle.remove(), 5200);
    }
  }

  function answerYes() {
    answers.hidden = true;
    question.textContent = '';
    surpriseMessage.textContent = cfg.surpriseYesMessage;
    surpriseSection.classList.add('celebrating');
    launchConfetti();
  }

  function answerNo() {
    answers.hidden = true;
    surpriseSection.classList.add('crying');
    noEnding.classList.add('open');
    noEnding.setAttribute('aria-hidden', 'false');
    $('#retry-surprise').focus();
  }

  function retrySurprise() {
    noEnding.classList.remove('open');
    noEnding.setAttribute('aria-hidden', 'true');
    surpriseSection.classList.remove('crying', 'celebrating');
    gift.classList.remove('opened');
    gift.setAttribute('aria-label', 'Descubrir la sorpresa');
    surpriseButton.hidden = false;
    answers.hidden = true;
    question.textContent = '';
    surpriseMessage.textContent = '';
  }

  gift.onclick = openGift;
  surpriseButton.onclick = openGift;
  $('#answer-yes').onclick = answerYes;
  $('#answer-no').onclick = answerNo;
  $('#retry-surprise').onclick = retrySurprise;
  addEventListener('resize', () => go(index));

  // Scroll reveals and navigation.
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  }), { threshold: .12 });
  $$('.reveal, .timeline-item').forEach(element => observer.observe(element));

  const sections = $$('main section');
  const navLinks = $$('.nav-links a');
  const navObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => link.classList.toggle('active', link.hash === `#${entry.target.id}`));
    }
  }), { rootMargin: '-40% 0px -50% 0px' });
  sections.forEach(section => navObserver.observe(section));

  let heartTaps = 0;
  let heartTapTimer;
  $('#hidden-heart').addEventListener('click', () => {
    heartTaps++;
    clearTimeout(heartTapTimer);
    if (heartTaps >= 5) {
      showEasterToast(cfg.easterEggs.heartMessage);
      heartTaps = 0;
    } else heartTapTimer = setTimeout(() => heartTaps = 0, 2200);
  });
  $('#easter-moon').addEventListener('click', () => showEasterToast(cfg.easterEggs.moonMessage));
  $('#petal-egg-button').addEventListener('click', () => showEasterToast(cfg.easterEggs.petalMessage));

  // Escribe el código secreto en cualquier parte de la página (excepto en campos de texto).
  let typedSecret = '';
  document.addEventListener('keydown', event => {
    if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey || event.target.matches('input, textarea, [contenteditable="true"]')) return;
    typedSecret = (typedSecret + event.key.toLowerCase()).slice(-cfg.easterEggs.secretCode.length);
    if (typedSecret === cfg.easterEggs.secretCode.toLowerCase()) {
      showEasterToast(cfg.easterEggs.secretCodeMessage);
      typedSecret = '';
    }
  });

  // Si se queda un rato en la sorpresa, aparece un mensaje final y una lluvia extra.
  let finalEggTimer;
  let finalEggShown = false;
  const finalEggObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting && !finalEggShown) {
      clearTimeout(finalEggTimer);
      finalEggTimer = setTimeout(() => {
        if (entry.target.getBoundingClientRect().top < innerHeight && !finalEggShown) {
          finalEggShown = true;
          showEasterToast(cfg.easterEggs.finalMessage);
          launchConfetti();
        }
      }, cfg.easterEggs.finalWaitSeconds * 1000);
    } else clearTimeout(finalEggTimer);
  }), { threshold: .35 });
  finalEggObserver.observe($('#sorpresa'));

  const toggle = $('.menu-toggle');
  const nav = $('.nav-links');
  toggle.onclick = () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  };
  navLinks.forEach(link => {
    link.onclick = () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    };
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') $$('.open').forEach(element => {
      if (element === noEnding) retrySurprise();
      else element.classList.remove('open');
      if (element === lightbox) { const video = $('#lightbox-video'); video.pause(); video.removeAttribute('src'); video.load(); }
    });
  });

  // Animated background petals; disabled when reduced motion is preferred.
  const canvas = $('#petals');
  const ctx = canvas.getContext('2d');
  let petals = [];
  let frame;

  function resize() {
    canvas.width = innerWidth * devicePixelRatio;
    canvas.height = innerHeight * devicePixelRatio;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    petals = Array.from({ length: Math.min(32, Math.round(innerWidth / 35)) }, () => ({
      x: Math.random() * innerWidth,
      y: Math.random() * innerHeight,
      r: 3 + Math.random() * 5,
      v: .4 + Math.random(),
      w: Math.random() * 6
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    petals.forEach(petal => {
      petal.y += petal.v;
      petal.x += Math.sin(petal.y / 45 + petal.w) * .55;
      if (petal.y > innerHeight + 10) {
        petal.y = -10;
        petal.x = Math.random() * innerWidth;
      }
      ctx.save();
      ctx.translate(petal.x, petal.y);
      ctx.rotate(petal.y / 30);
      ctx.fillStyle = 'rgba(225,29,72,.43)';
      ctx.beginPath();
      ctx.ellipse(0, 0, petal.r, petal.r * .58, .4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    frame = requestAnimationFrame(draw);
  }

  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    resize();
    draw();
    addEventListener('resize', resize);
    document.addEventListener('click', event => {
      if (event.target.closest('a, button, input, textarea, select, [role="button"]')) return;
      const petal = petals.find(item => Math.hypot(item.x - event.clientX, item.y - event.clientY) < Math.max(28, item.r * 4));
      if (petal) showEasterToast(cfg.easterEggs.petalMessage);
    });
  }
})();
