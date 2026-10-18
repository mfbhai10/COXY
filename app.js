/**
 * COXY — Coastal Experience & Cinematic Scroll Animation Engine
 * Preloads 240 Full HD Frames and scrubs via GPU-accelerated HTML5 Canvas & LERP physics
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

  const heroSection = document.getElementById('home');
  const canvas = document.getElementById('sequence-canvas');
  const ctx = canvas.getContext('2d', { alpha: false });

  const heroContent = document.getElementById('hero-content');
  const heroBottomBar = document.getElementById('hero-bottom-bar');
  const heroCinematicCaption = document.getElementById('hero-cinematic-caption');
  const cinematicCaptionText = document.getElementById('cinematic-caption-text');
  const mainHeader = document.getElementById('main-header');

  const mobileNavToggle = document.getElementById('mobile-nav-toggle');
  const mobileDrawer = document.getElementById('mobile-drawer');

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
    if (!canvas) return;
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
    const activeFrame = Math.round(currentFrameIndex);
    if (frames[activeFrame] && frames[activeFrame].complete) {
      drawFrame(activeFrame);
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

        // Render initial frame immediately once frame 0 is ready
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

  // --- Scroll & Hero View Interaction ---
  function updateScrollProgress() {
    if (!heroSection) return;

    const heroMaxScroll = heroSection.offsetHeight - window.innerHeight;
    if (heroMaxScroll <= 0) return;

    const scrollY = window.scrollY;
    const fraction = Math.min(Math.max(scrollY / heroMaxScroll, 0), 1);

    targetFrameIndex = fraction * (TOTAL_FRAMES - 1);

    // Hero Text & Caption Transitions based on scroll fraction
    if (fraction < 0.12) {
      if (heroContent) {
        heroContent.style.opacity = '1';
        heroContent.style.pointerEvents = 'auto';
        heroContent.style.transform = 'translateY(0)';
      }
      if (heroBottomBar) {
        heroBottomBar.style.opacity = '1';
        heroBottomBar.style.pointerEvents = 'auto';
      }
      if (heroCinematicCaption) {
        heroCinematicCaption.style.opacity = '0';
      }
    } else if (fraction >= 0.12 && fraction < 0.32) {
      const fadeProgress = (fraction - 0.12) / 0.2;
      const opacity = Math.max(0, 1 - fadeProgress);
      if (heroContent) {
        heroContent.style.opacity = opacity.toFixed(2);
        heroContent.style.pointerEvents = opacity > 0.4 ? 'auto' : 'none';
        heroContent.style.transform = `translateY(-${(fadeProgress * 24).toFixed(1)}px)`;
      }
      if (heroBottomBar) {
        heroBottomBar.style.opacity = opacity.toFixed(2);
        heroBottomBar.style.pointerEvents = opacity > 0.4 ? 'auto' : 'none';
      }
      if (heroCinematicCaption) {
        heroCinematicCaption.style.opacity = '0';
      }
    } else if (fraction >= 0.32 && fraction < 0.94) {
      if (heroContent) {
        heroContent.style.opacity = '0';
        heroContent.style.pointerEvents = 'none';
      }
      if (heroBottomBar) {
        heroBottomBar.style.opacity = '0';
        heroBottomBar.style.pointerEvents = 'none';
      }
      if (heroCinematicCaption) {
        heroCinematicCaption.style.opacity = '1';
        if (cinematicCaptionText) {
          if (fraction < 0.52) {
            cinematicCaptionText.textContent = "Bay of Bengal • Echoes of the Sampan";
          } else if (fraction < 0.76) {
            cinematicCaptionText.textContent = "Inani Coastline • Solitude by the Shore";
          } else {
            cinematicCaptionText.textContent = "Golden Sunset • Towards the Open Sea";
          }
        }
      }
    } else {
      // Near end of hero scroll track - transition cleanly into next section
      if (heroCinematicCaption) {
        heroCinematicCaption.style.opacity = '0';
      }
    }

    // Adaptive header background
    if (mainHeader) {
      if (scrollY > heroMaxScroll - 60) {
        mainHeader.classList.add('header-scrolled-past-hero');
      } else {
        mainHeader.classList.remove('header-scrolled-past-hero');
      }
    }
  }

  // --- Smooth LERP Animation Loop ---
  function animationLoop() {
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

  // --- Mobile Navigation Drawer ---
  if (mobileNavToggle && mobileDrawer) {
    mobileNavToggle.addEventListener('click', () => {
      mobileDrawer.classList.toggle('hidden');
    });

    mobileDrawer.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileDrawer.classList.add('hidden');
      });
    });
  }

  // --- Contact Form Submission Handler ---
  window.handleFormSubmit = function() {
    const feedback = document.getElementById('form-feedback');
    const btn = document.getElementById('submit-btn');
    const form = document.getElementById('contact-form');
    if (feedback && btn && form) {
      btn.disabled = true;
      btn.classList.add('opacity-75');
      feedback.classList.remove('hidden');
      feedback.textContent = "Thank you! Your message has been received by our editorial team.";
      setTimeout(() => {
        form.reset();
        btn.disabled = false;
        btn.classList.remove('opacity-75');
        feedback.classList.add('hidden');
      }, 3500);
    }
  };

  // --- Scroll Reveal Transitions ---
  document.addEventListener('DOMContentLoaded', () => {
    const observerOptions = { threshold: 0.1 };
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100', 'translate-y-0');
          entry.target.classList.remove('opacity-0', 'translate-y-4');
        }
      });
    }, observerOptions);

    document.querySelectorAll('section:not(#home)').forEach(sec => {
      sec.classList.add('transition-all', 'duration-700');
      revealObserver.observe(sec);
    });
  });

  // --- Event Listeners ---
  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  window.addEventListener('resize', resizeCanvas);

  // Initialize
  preloadImages();
})();
