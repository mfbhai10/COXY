/**
 * COXY — Kolatoli Beach Dedicated Walk Experience
 * GPU-Accelerated Scrubbing through 240 Full-HD Sunset Stroll Frames
 * Features LERP Physics, Glassmorphic Story Milestones & Live Progress
 */

(() => {
  'use strict';

  // --- Configuration ---
  const TOTAL_FRAMES = 480;
  const BEACH_PREFIX = 'frames/beach/frame_';
  const FRAME_EXT = '.jpg';

  // --- DOM Elements ---
  const preloader = document.getElementById('beach-preloader');
  const progressBar = document.getElementById('beach-progress-bar');
  const loaderPercent = document.getElementById('beach-loader-percent');

  const heroTrack = document.getElementById('beach-hero');
  const canvas = document.getElementById('beach-canvas');
  const ctx = canvas ? canvas.getContext('2d', { alpha: false }) : null;

  const strollProgressIndicator = document.getElementById('stroll-progress-indicator');
  const scrollCue = document.getElementById('beach-scroll-cue');
  const cinematicCaptionText = document.getElementById('beach-caption-text');

  // Story Cards
  const cardLoungers = document.getElementById('card-kolatoli-loungers');
  const cardAtmosphere = document.getElementById('card-kolatoli-atmosphere');
  const cardSampan = document.getElementById('card-kolatoli-sampan');

  // --- State Variables ---
  const frames = [];
  let loadedCount = 0;
  let currentFrameIndex = 0;
  let targetFrameIndex = 0;
  let lastDrawnFrame = -1;

  // Format frame number to zero-padded string (frame_0001.jpg through frame_0480.jpg)
  function getFrameUrl(index) {
    const frameNum = (index + 1).toString().padStart(4, '0');
    return `${BEACH_PREFIX}${frameNum}${FRAME_EXT}`;
  }

  // --- Canvas Sizing & Fit Cover ---
  function resizeCanvas() {
    if (!canvas || !ctx) return;
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

    drawFrame(currentFrameIndex);
  }

  function drawImageFitCover(img) {
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;

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
  }

  function drawFrame(frameVal) {
    const primaryIndex = Math.min(Math.max(Math.round(frameVal), 0), TOTAL_FRAMES - 1);
    let img = frames[primaryIndex];

    if (!img || !img.complete) {
      for (let offset = 1; offset < 60; offset++) {
        if (primaryIndex - offset >= 0 && frames[primaryIndex - offset] && frames[primaryIndex - offset].complete) {
          img = frames[primaryIndex - offset];
          break;
        }
        if (primaryIndex + offset < TOTAL_FRAMES && frames[primaryIndex + offset] && frames[primaryIndex + offset].complete) {
          img = frames[primaryIndex + offset];
          break;
        }
      }
    }

    if (img && img.complete) {
      drawImageFitCover(img);
    }
    lastDrawnFrame = primaryIndex;
  }

  // --- Progressive Fast Buffer Preloader ---
  const INITIAL_BUFFER_FRAMES = 24; // Dismisses loading screen as soon as 24 frames are ready (<1s)
  let preloaderDismissed = false;

  function dismissPreloader() {
    if (preloaderDismissed) return;
    preloaderDismissed = true;

    if (preloader) {
      preloader.style.opacity = '0';
      preloader.style.pointerEvents = 'none';
      setTimeout(() => {
        if (preloader.parentNode) preloader.parentNode.removeChild(preloader);
      }, 700);
    }

    resizeCanvas();
    updateScrollProgress();
    drawFrame(targetFrameIndex || 0);
  }

  function preloadImages() {
    // Safety fallback: Reveal within 1.8s if at least 6 frames are loaded
    setTimeout(() => {
      if (loadedCount >= 6 && !preloaderDismissed) {
        dismissPreloader();
      }
    }, 1800);

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();

      // High priority for initial buffer
      if (i < INITIAL_BUFFER_FRAMES && 'fetchPriority' in img) {
        img.fetchPriority = 'high';
      }

      img.onload = () => {
        loadedCount++;
        const percent = Math.floor((loadedCount / TOTAL_FRAMES) * 100);
        if (progressBar) progressBar.style.width = `${percent}%`;
        if (loaderPercent) loaderPercent.textContent = `${percent}%`;

        // Render initial beach frame immediately once frame 0 is ready
        if (i === 0 || loadedCount === 1) {
          drawFrame(0);
        }

        // Fast reveal once the initial buffer (24 frames) is ready
        if (loadedCount >= INITIAL_BUFFER_FRAMES && !preloaderDismissed) {
          dismissPreloader();
        }

        if (loadedCount === TOTAL_FRAMES && !preloaderDismissed) {
          dismissPreloader();
        }
      };

      img.onerror = () => {
        loadedCount++;
        if (loadedCount >= INITIAL_BUFFER_FRAMES && !preloaderDismissed) {
          dismissPreloader();
        }
      };

      // Set src after setting handlers
      img.src = getFrameUrl(i);
      frames.push(img);
    }
  }

  // --- Scroll Tracking & Story Milestones ---
  function updateScrollProgress() {
    if (!heroTrack) return;

    const maxScroll = heroTrack.offsetHeight - window.innerHeight;
    if (maxScroll <= 0) return;

    const scrollY = window.scrollY;
    const fraction = Math.min(Math.max(scrollY / maxScroll, 0), 1);

    targetFrameIndex = fraction * (TOTAL_FRAMES - 1);

    // Update top live progress bar
    if (strollProgressIndicator) {
      strollProgressIndicator.style.width = `${(fraction * 100).toFixed(1)}%`;
    }

    // Scroll cue
    if (scrollCue) {
      scrollCue.style.opacity = fraction > 0.05 ? '0' : '1';
    }

    // Story Cards & Milestones
    // Card 1: Kitkot Loungers
    if (cardLoungers) {
      if (fraction >= 0.12 && fraction < 0.48) {
        cardLoungers.classList.add('is-active');
      } else {
        cardLoungers.classList.remove('is-active');
      }
    }

    // Card 2: Atmosphere & Weather
    if (cardAtmosphere) {
      if (fraction >= 0.38 && fraction < 0.76) {
        cardAtmosphere.classList.add('is-active');
      } else {
        cardAtmosphere.classList.remove('is-active');
      }
    }

    // Card 3: Sampan Moon-Boat
    if (cardSampan) {
      if (fraction >= 0.65 && fraction <= 0.98) {
        cardSampan.classList.add('is-active');
      } else {
        cardSampan.classList.remove('is-active');
      }
    }

    // Dynamic Caption Text
    if (cinematicCaptionText) {
      if (fraction < 0.30) {
        cinematicCaptionText.textContent = "Kolatoli Shoreline • Cane Loungers & Pacific Breakers";
      } else if (fraction < 0.65) {
        cinematicCaptionText.textContent = "Low-Tide Horizon • 28°C Sunset Breeze";
      } else {
        cinematicCaptionText.textContent = "Artisanal Sampan Boats • Golden Twilight Tide";
      }
    }
  }

  // --- Smooth LERP Loop ---
  function animationLoop() {
    const diff = targetFrameIndex - currentFrameIndex;
    if (Math.abs(diff) > 0.001) {
      currentFrameIndex += diff * 0.16;
    } else {
      currentFrameIndex = targetFrameIndex;
    }

    const clampedFrame = Math.min(Math.max(currentFrameIndex, 0), TOTAL_FRAMES - 1);
    if (Math.round(clampedFrame) !== lastDrawnFrame) {
      drawFrame(clampedFrame);
    }

    requestAnimationFrame(animationLoop);
  }

  // --- Event Listeners ---
  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  window.addEventListener('resize', resizeCanvas);

  // Initialize
  resizeCanvas();
  updateScrollProgress();
  preloadImages();
  requestAnimationFrame(animationLoop);
})();
