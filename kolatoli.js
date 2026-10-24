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
  const frames = new Array(TOTAL_FRAMES).fill(null);
  let loadedCount = 0;
  let currentFrameIndex = 0;
  let targetFrameIndex = 0;
  let lastDrawnFrame = -1;

  // Format frame number to zero-padded string (frame_0001.jpg through frame_0480.jpg)
  function getFrameUrl(index) {
    const frameNum = (index + 1).toString().padStart(4, '0');
    return `${BEACH_PREFIX}${frameNum}${FRAME_EXT}`;
  }

  // --- Dynamic Multi-Tier Frame Loader ---
  function loadFrame(index, priority = 'auto') {
    if (index < 0 || index >= TOTAL_FRAMES) return null;
    if (frames[index]) {
      if (priority === 'high' && 'fetchPriority' in frames[index] && frames[index].fetchPriority !== 'high') {
        frames[index].fetchPriority = 'high';
      }
      return frames[index];
    }

    const img = new Image();
    img.decoding = 'async'; // Offload image decoding from main UI thread to prevent scroll hitching
    if (priority === 'high' && 'fetchPriority' in img) {
      img.fetchPriority = 'high';
    }

    img.onload = () => {
      loadedCount++;
      const percent = Math.floor((loadedCount / TOTAL_FRAMES) * 100);
      if (progressBar) progressBar.style.width = `${percent}%`;
      if (loaderPercent) loaderPercent.textContent = `${percent}%`;

      // Render initial beach frame immediately once frame 0 is ready
      if (index === 0 || loadedCount === 1) {
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

    img.src = getFrameUrl(index);
    frames[index] = img;
    return img;
  }

  // Active Direction-Aware Predictive Window: pre-fetches heavily in scroll direction
  let lastScrollTarget = 0;
  function loadSurroundingFrames(centerIndex) {
    const isScrollingForward = centerIndex >= lastScrollTarget;
    lastScrollTarget = centerIndex;

    const lookAhead = isScrollingForward ? 35 : 15;
    const lookBehind = isScrollingForward ? 10 : 25;

    const start = Math.max(0, centerIndex - lookBehind);
    const end = Math.min(TOTAL_FRAMES - 1, centerIndex + lookAhead);
    for (let i = start; i <= end; i++) {
      if (!frames[i]) {
        loadFrame(i, 'high');
      }
    }
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

  // Resilient Canvas Drawing with Outward Symmetrical Fallback Search
  function drawFrame(frameVal) {
    const primaryIndex = Math.min(Math.max(Math.round(frameVal), 0), TOTAL_FRAMES - 1);
    let img = frames[primaryIndex];

    if (!img || !img.complete || img.naturalWidth === 0) {
      for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
        const prevIdx = primaryIndex - offset;
        if (prevIdx >= 0 && frames[prevIdx] && frames[prevIdx].complete && frames[prevIdx].naturalWidth > 0) {
          img = frames[prevIdx];
          break;
        }
        const nextIdx = primaryIndex + offset;
        if (nextIdx < TOTAL_FRAMES && frames[nextIdx] && frames[nextIdx].complete && frames[nextIdx].naturalWidth > 0) {
          img = frames[nextIdx];
          break;
        }
      }
    }

    if (img && img.complete && img.naturalWidth > 0) {
      drawImageFitCover(img);
      lastDrawnFrame = primaryIndex;
    }
  }

  // --- Progressive Fast Buffer Preloader (Apple-Style Keyframe Streaming) ---
  const INITIAL_BUFFER_FRAMES = 24; // Dismisses loading screen as soon as 24 frames are ready (<1s)
  const KEYFRAME_INTERVAL = 10;
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

    // Tier 1: Initial Buffer (frames 0 to 24) with high priority
    for (let i = 0; i < INITIAL_BUFFER_FRAMES; i++) {
      loadFrame(i, 'high');
    }

    // Tier 2: Uniform Keyframes across entire sequence (every 10th frame)
    setTimeout(() => {
      for (let i = INITIAL_BUFFER_FRAMES; i < TOTAL_FRAMES; i += KEYFRAME_INTERVAL) {
        loadFrame(i, 'high');
      }
      loadFrame(TOTAL_FRAMES - 1, 'high'); // Ensure final frame is ready

      // Tier 3 & 4: Progressive background fill of remaining frames in small batches
      startBackgroundPacedLoading();
    }, 100);
  }

  // Paced background loader: loads remaining unallocated frames without saturating connection
  function startBackgroundPacedLoading() {
    let nextIndex = 0;
    const BATCH_SIZE = 4;
    const INTERVAL_MS = 60;

    function queueBatch() {
      let dispatched = 0;
      while (nextIndex < TOTAL_FRAMES && dispatched < BATCH_SIZE) {
        if (!frames[nextIndex]) {
          loadFrame(nextIndex, 'low');
          dispatched++;
        }
        nextIndex++;
      }

      if (nextIndex < TOTAL_FRAMES) {
        setTimeout(queueBatch, INTERVAL_MS);
      }
    }

    setTimeout(queueBatch, 300);
  }

  // --- Scroll Tracking & Story Milestones ---
  function updateScrollProgress() {
    if (!heroTrack) return;

    const maxScroll = heroTrack.offsetHeight - window.innerHeight;
    if (maxScroll <= 0) return;

    const scrollY = window.scrollY;
    const fraction = Math.min(Math.max(scrollY / maxScroll, 0), 1);

    targetFrameIndex = fraction * (TOTAL_FRAMES - 1);
    loadSurroundingFrames(Math.round(targetFrameIndex));

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

  // --- Smooth Refresh-Rate Independent Damping Animation Loop ---
  let lastTimestamp = performance.now();

  function animationLoop(timestamp) {
    const now = timestamp || performance.now();
    const dt = Math.min((now - lastTimestamp) / 1000, 0.1) || 0.016;
    lastTimestamp = now;

    const diff = targetFrameIndex - currentFrameIndex;
    if (Math.abs(diff) > 0.001) {
      // Exponential decay: smooth on both 60Hz and 120Hz ProMotion displays
      const decay = 1 - Math.exp(-14 * dt);
      currentFrameIndex += diff * decay;
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
