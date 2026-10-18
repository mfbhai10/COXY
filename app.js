/**
 * Coxy — Cinematic Scroll Animation Engine
 * 240 Full HD Frames smoothly scrubbed via HTML5 Canvas & LERP physics
 */

(() => {
  'use strict';

  // --- Configuration ---
  const TOTAL_FRAMES = 240;
  const FPS = 24; // Visual frame rate reference
  const FRAME_PREFIX = 'frames/ezgif-frame-';
  const FRAME_EXT = '.jpg';

  // --- DOM Elements ---
  const preloader = document.getElementById('preloader');
  const progressBar = document.getElementById('progress-bar');
  const loaderPercent = document.getElementById('loader-percent');
  const loaderFrames = document.getElementById('loader-frames');

  const scrollWrapper = document.getElementById('scroll-wrapper');
  const canvas = document.getElementById('sequence-canvas');
  const ctx = canvas.getContext('2d', { alpha: false });

  const hudFrameCounter = document.getElementById('hud-frame-counter');
  const hudTimeLeft = document.getElementById('hud-time-left');
  const hudProgressPct = document.getElementById('hud-progress-pct');
  const scrubberTrack = document.getElementById('scrubber-track');
  const scrubberFill = document.getElementById('scrubber-fill');
  const scrubberHandle = document.getElementById('scrubber-handle');
  const scrollPrompt = document.getElementById('scroll-prompt');

  const story1 = document.getElementById('story-1');
  const story2 = document.getElementById('story-2');
  const story3 = document.getElementById('story-3');
  const story4 = document.getElementById('story-4');

  const autoplayBtn = document.getElementById('autoplay-btn');
  const autoplayText = document.getElementById('autoplay-text');
  const playIcon = document.getElementById('play-icon');
  const soundBtn = document.getElementById('sound-btn');
  const replayBtn = document.getElementById('replay-btn');

  // --- State Variables ---
  const frames = [];
  let loadedCount = 0;
  let currentFrameIndex = 0;
  let targetFrameIndex = 0;
  let lastDrawnFrame = -1;
  let isAutoplaying = false;
  let autoplayAnimationId = null;
  let isDraggingScrubber = false;
  let audioContext = null;
  let oceanNode = null;
  let isAudioPlaying = false;

  // Format frame number to 3-digit zero-padded string (001, 002, ...)
  function getFrameUrl(index) {
    const frameNum = (index + 1).toString().padStart(3, '0');
    return `${FRAME_PREFIX}${frameNum}${FRAME_EXT}`;
  }

  // Format seconds to mm:ss
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // --- Canvas Sizing & Drawing ---
  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Force redraw current frame
    if (frames[Math.round(currentFrameIndex)] && frames[Math.round(currentFrameIndex)].complete) {
      drawFrame(Math.round(currentFrameIndex));
    }
  }

  function drawFrame(index) {
    const img = frames[index];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;

    // Cover math: preserve aspect ratio and center
    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;
    const imgRatio = imgWidth / imgHeight;
    const screenRatio = canvasWidth / canvasHeight;

    let drawWidth, drawHeight, offsetX, offsetY;

    if (screenRatio > imgRatio) {
      drawWidth = canvasWidth;
      drawHeight = canvasWidth / imgRatio;
      offsetX = 0;
      offsetY = (canvasHeight - drawHeight) / 2;
    } else {
      drawHeight = canvasHeight;
      drawWidth = canvasHeight * imgRatio;
      offsetX = (canvasWidth - drawWidth) / 2;
      offsetY = 0;
    }

    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    lastDrawnFrame = index;
  }

  // --- Preloader System ---
  function preloadImages() {
    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = getFrameUrl(i);

      img.onload = () => {
        loadedCount++;
        const percent = Math.floor((loadedCount / TOTAL_FRAMES) * 100);
        progressBar.style.width = `${percent}%`;
        loaderPercent.textContent = `${percent}%`;
        loaderFrames.textContent = `Loaded ${loadedCount} of ${TOTAL_FRAMES} frames`;

        // Draw initial frame as soon as frame 0 is ready
        if (i === 0) {
          drawFrame(0);
        }

        if (loadedCount === TOTAL_FRAMES) {
          onAllFramesLoaded();
        }
      };

      img.onerror = () => {
        // Increment count even on minor error to not block preloader
        loadedCount++;
        if (loadedCount === TOTAL_FRAMES) {
          onAllFramesLoaded();
        }
      };

      frames.push(img);
    }
  }

  function onAllFramesLoaded() {
    setTimeout(() => {
      preloader.classList.add('fade-out');
      resizeCanvas();
      drawFrame(0);
      requestAnimationFrame(animationLoop);
    }, 400);
  }

  // --- Scroll & Storytelling Progress ---
  function updateScrollProgress() {
    const scrollMax = scrollWrapper.offsetHeight - window.innerHeight;
    if (scrollMax <= 0) return;

    const scrollY = window.scrollY;
    const fraction = Math.min(Math.max(scrollY / scrollMax, 0), 1);

    targetFrameIndex = fraction * (TOTAL_FRAMES - 1);

    // Update Scrubber UI
    const pctString = `${Math.round(fraction * 100)}%`;
    scrubberFill.style.width = pctString;
    scrubberHandle.style.left = pctString;
    hudProgressPct.textContent = pctString;

    const elapsedSeconds = (fraction * (TOTAL_FRAMES / FPS));
    hudTimeLeft.textContent = formatTime(elapsedSeconds);

    // Prompt visibility
    if (fraction > 0.03) {
      scrollPrompt.classList.add('hidden');
    } else {
      scrollPrompt.classList.remove('hidden');
    }

    // Storytelling narrative milestones
    updateNarrativeLayers(fraction);
  }

  function updateNarrativeLayers(fraction) {
    // Story 1: 0.03 to 0.22
    story1.classList.toggle('active', fraction >= 0.02 && fraction <= 0.22);

    // Story 2: 0.26 to 0.48
    story2.classList.toggle('active', fraction >= 0.26 && fraction <= 0.48);

    // Story 3: 0.52 to 0.74
    story3.classList.toggle('active', fraction >= 0.52 && fraction <= 0.74);

    // Story 4: 0.78 to 0.98
    story4.classList.toggle('active', fraction >= 0.78 && fraction <= 0.98);
  }

  // --- Smooth LERP Animation Loop ---
  function animationLoop() {
    // Linear interpolation towards target frame
    const diff = targetFrameIndex - currentFrameIndex;
    if (Math.abs(diff) > 0.001) {
      currentFrameIndex += diff * 0.16;
    } else {
      currentFrameIndex = targetFrameIndex;
    }

    const roundedFrame = Math.round(currentFrameIndex);
    const clampedFrame = Math.min(Math.max(roundedFrame, 0), TOTAL_FRAMES - 1);

    if (clampedFrame !== lastDrawnFrame) {
      drawFrame(clampedFrame);
      const frameFormatted = (clampedFrame + 1).toString().padStart(3, '0');
      hudFrameCounter.textContent = `FRAME ${frameFormatted} / ${TOTAL_FRAMES}`;
    }

    requestAnimationFrame(animationLoop);
  }

  // --- Interactive Scrubber Dragging ---
  function setScrollByScrubber(e) {
    const rect = scrubberTrack.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const fraction = Math.min(Math.max(clickX / rect.width, 0), 1);

    const scrollMax = scrollWrapper.offsetHeight - window.innerHeight;
    window.scrollTo({
      top: fraction * scrollMax,
      behavior: 'auto'
    });
  }

  scrubberTrack.addEventListener('mousedown', (e) => {
    isDraggingScrubber = true;
    if (isAutoplaying) stopAutoplay();
    setScrollByScrubber(e);
  });

  window.addEventListener('mousemove', (e) => {
    if (isDraggingScrubber) {
      setScrollByScrubber(e);
    }
  });

  window.addEventListener('mouseup', () => {
    isDraggingScrubber = false;
  });

  // Touch support for scrubber
  scrubberTrack.addEventListener('touchstart', (e) => {
    isDraggingScrubber = true;
    if (isAutoplaying) stopAutoplay();
    if (e.touches.length > 0) {
      setScrollByScrubber(e.touches[0]);
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (isDraggingScrubber && e.touches.length > 0) {
      setScrollByScrubber(e.touches[0]);
    }
  }, { passive: true });

  window.addEventListener('touchend', () => {
    isDraggingScrubber = false;
  });

  // --- Autoplay Mode ---
  function startAutoplay() {
    isAutoplaying = true;
    autoplayBtn.classList.add('active');
    autoplayText.textContent = 'Pause';
    playIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';

    const scrollMax = scrollWrapper.offsetHeight - window.innerHeight;
    const totalDurationMs = (TOTAL_FRAMES / FPS) * 1000 * 1.5; // ~15 seconds total smooth cinematic glide
    let lastTime = performance.now();

    function autoplayStep(now) {
      if (!isAutoplaying) return;
      const delta = now - lastTime;
      lastTime = now;

      const pixelsPerMs = scrollMax / totalDurationMs;
      const nextScroll = window.scrollY + pixelsPerMs * delta;

      if (nextScroll >= scrollMax) {
        window.scrollTo(0, scrollMax);
        stopAutoplay();
      } else {
        window.scrollTo(0, nextScroll);
        autoplayAnimationId = requestAnimationFrame(autoplayStep);
      }
    }

    autoplayAnimationId = requestAnimationFrame(autoplayStep);
  }

  function stopAutoplay() {
    isAutoplaying = false;
    autoplayBtn.classList.remove('active');
    autoplayText.textContent = 'Auto Play';
    playIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
    if (autoplayAnimationId) {
      cancelAnimationFrame(autoplayAnimationId);
      autoplayAnimationId = null;
    }
  }

  autoplayBtn.addEventListener('click', () => {
    if (isAutoplaying) {
      stopAutoplay();
    } else {
      const scrollMax = scrollWrapper.offsetHeight - window.innerHeight;
      if (window.scrollY >= scrollMax - 10) {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
      startAutoplay();
    }
  });

  // Stop autoplay on manual scroll interaction
  window.addEventListener('wheel', () => {
    if (isAutoplaying) stopAutoplay();
  }, { passive: true });

  window.addEventListener('keydown', (e) => {
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Space'].includes(e.code)) {
      if (isAutoplaying) stopAutoplay();
    }
  });

  // --- Coastal Ambient Sound Generator (Web Audio API) ---
  function initAmbientAudio() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    audioContext = new AudioCtx();

    // Create pink noise buffer
    const bufferSize = audioContext.sampleRate * 4;
    const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }

    const whiteNoise = audioContext.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filter simulating ocean swell
    const filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, audioContext.currentTime);

    // LFO to modulate filter cutoff like incoming waves
    const lfo = audioContext.createOscillator();
    lfo.frequency.setValueAtTime(0.12, audioContext.currentTime); // Wave every ~8 seconds
    const lfoGain = audioContext.createGain();
    lfoGain.gain.setValueAtTime(260, audioContext.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const masterGain = audioContext.createGain();
    masterGain.gain.setValueAtTime(0.3, audioContext.currentTime);

    whiteNoise.connect(filter);
    filter.connect(masterGain);
    masterGain.connect(audioContext.destination);

    whiteNoise.start();
    lfo.start();

    oceanNode = masterGain;
  }

  soundBtn.addEventListener('click', () => {
    if (!audioContext) {
      initAmbientAudio();
      isAudioPlaying = true;
      soundBtn.classList.add('active');
    } else if (audioContext.state === 'suspended') {
      audioContext.resume();
      isAudioPlaying = true;
      soundBtn.classList.add('active');
    } else if (isAudioPlaying) {
      audioContext.suspend();
      isAudioPlaying = false;
      soundBtn.classList.remove('active');
    } else {
      audioContext.resume();
      isAudioPlaying = true;
      soundBtn.classList.add('active');
    }
  });

  // --- Replay Button ---
  replayBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  // --- Event Listeners ---
  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  window.addEventListener('resize', resizeCanvas);

  // Initialize
  preloadImages();
})();
