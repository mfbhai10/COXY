/**
 * Coxy — Cinematic Scroll Animation Engine
 * 240 Full HD Frames smoothly scrubbed via HTML5 Canvas & LERP physics
 */

(() => {
  'use strict';

  // --- Configuration ---
  const TOTAL_FRAMES = 240;
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
  const scrollPrompt = document.getElementById('scroll-prompt');

  const story1 = document.getElementById('story-1');
  const story2 = document.getElementById('story-2');
  const story3 = document.getElementById('story-3');
  const story4 = document.getElementById('story-4');

  // --- State Variables ---
  const frames = [];
  let loadedCount = 0;
  let currentFrameIndex = 0;
  let targetFrameIndex = 0;
  let lastDrawnFrame = -1;

  // Format frame number to 3-digit zero-padded string (001, 002, ...)
  function getFrameUrl(index) {
    const frameNum = (index + 1).toString().padStart(3, '0');
    return `${FRAME_PREFIX}${frameNum}${FRAME_EXT}`;
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
        if (progressBar) progressBar.style.width = `${percent}%`;
        if (loaderPercent) loaderPercent.textContent = `${percent}%`;
        if (loaderFrames) loaderFrames.textContent = `Loaded ${loadedCount} of ${TOTAL_FRAMES} frames`;

        // Draw initial frame as soon as frame 0 is ready
        if (i === 0) {
          drawFrame(0);
        }

        if (loadedCount === TOTAL_FRAMES) {
          onAllFramesLoaded();
        }
      };

      img.onerror = () => {
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
      if (preloader) preloader.classList.add('fade-out');
      resizeCanvas();
      drawFrame(0);
      requestAnimationFrame(animationLoop);
    }, 300);
  }

  // --- Scroll & Storytelling Progress ---
  function updateScrollProgress() {
    const scrollMax = scrollWrapper.offsetHeight - window.innerHeight;
    if (scrollMax <= 0) return;

    const scrollY = window.scrollY;
    const fraction = Math.min(Math.max(scrollY / scrollMax, 0), 1);

    targetFrameIndex = fraction * (TOTAL_FRAMES - 1);

    // Prompt visibility
    if (scrollPrompt) {
      if (fraction > 0.03) {
        scrollPrompt.classList.add('hidden');
      } else {
        scrollPrompt.classList.remove('hidden');
      }
    }

    // Storytelling narrative milestones
    updateNarrativeLayers(fraction);
  }

  function updateNarrativeLayers(fraction) {
    if (story1) story1.classList.toggle('active', fraction >= 0.02 && fraction <= 0.22);
    if (story2) story2.classList.toggle('active', fraction >= 0.26 && fraction <= 0.48);
    if (story3) story3.classList.toggle('active', fraction >= 0.52 && fraction <= 0.74);
    if (story4) story4.classList.toggle('active', fraction >= 0.78 && fraction <= 0.98);
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
    }

    requestAnimationFrame(animationLoop);
  }

  // --- Event Listeners ---
  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  window.addEventListener('resize', resizeCanvas);

  // Initialize
  preloadImages();
})();
