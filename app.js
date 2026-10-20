/**
 * COXY — Coastal Experience & Cinematic Scroll Animation Engine
 * Preloads 413 Full HD Frames (173 Aerial 3D Map + 240 Beach Sunset Walk)
 * Scrubs via GPU-accelerated HTML5 Canvas with smooth transition blending & LERP physics
 */

(() => {
  'use strict';

  // --- Configuration ---
  const AERIAL_START_FRAME = 7; // Frames 001-006 were removed, starts at 007
  const AERIAL_FRAMES_COUNT = 173; // Frames 007 through 179
  const BEACH_FRAMES_COUNT = 240;
  const TOTAL_FRAMES = AERIAL_FRAMES_COUNT + BEACH_FRAMES_COUNT; // 413
  const AERIAL_PREFIX = 'frames/aerial/ezgif-frame-';
  const BEACH_PREFIX = 'frames/beach/ezgif-frame-';
  const FRAME_EXT = '.jpg';

  // --- DOM Elements ---
  const preloader = document.getElementById('preloader');
  const progressBar = document.getElementById('progress-bar');
  const loaderPercent = document.getElementById('loader-percent');

  const heroSection = document.getElementById('home');
  const canvas = document.getElementById('sequence-canvas');
  const ctx = canvas.getContext('2d', { alpha: false });

  const heroContent = document.getElementById('hero-content');
  const heroBottomBar = document.getElementById('hero-bottom-bar');
  const heroCinematicCaption = document.getElementById('hero-cinematic-caption');
  const cinematicCaptionText = document.getElementById('cinematic-caption-text');
  const mainHeader = document.getElementById('main-header');

  // Kolatoli Beach Scenario Glassmorphism Mini Cards
  const kolatoliCardsContainer = document.getElementById('kolatoli-mini-cards');
  const cardLoungers = document.getElementById('card-kolatoli-loungers');
  const cardAtmosphere = document.getElementById('card-kolatoli-atmosphere');
  const cardSampan = document.getElementById('card-kolatoli-sampan');

  const mobileNavToggle = document.getElementById('mobile-nav-toggle');
  const mobileDrawer = document.getElementById('mobile-drawer');

  // --- State Variables ---
  const frames = [];
  let loadedCount = 0;
  let currentFrameIndex = 0;
  let targetFrameIndex = 0;
  let lastDrawnFrame = -1;

  // Format frame number to 3-digit zero-padded string (007, 008, ...)
  function getFrameUrl(index) {
    if (index < AERIAL_FRAMES_COUNT) {
      const frameNum = (index + AERIAL_START_FRAME).toString().padStart(3, '0');
      return `${AERIAL_PREFIX}${frameNum}${FRAME_EXT}`;
    } else {
      const beachIndex = index - AERIAL_FRAMES_COUNT;
      const frameNum = (beachIndex + 1).toString().padStart(3, '0');
      return `${BEACH_PREFIX}${frameNum}${FRAME_EXT}`;
    }
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
    drawFrame(currentFrameIndex);
  }

  function drawImageFitCover(img, alpha = 1.0) {
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

    if (alpha < 1) {
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    }
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    if (alpha < 1) {
      ctx.globalAlpha = 1.0;
    }
  }

  function drawFrame(frameVal) {
    const primaryIndex = Math.min(Math.max(Math.round(frameVal), 0), TOTAL_FRAMES - 1);

    // Smooth cinematic dissolve transition when crossing from aerial to beach sequence
    const TRANSITION_START = AERIAL_FRAMES_COUNT - 3; // Frame 176
    const TRANSITION_END = AERIAL_FRAMES_COUNT + 2;   // Frame 181

    if (frameVal >= TRANSITION_START && frameVal <= TRANSITION_END) {
      const lastAerialImg = frames[AERIAL_FRAMES_COUNT - 1];
      const firstBeachImg = frames[AERIAL_FRAMES_COUNT];
      const blend = (frameVal - TRANSITION_START) / (TRANSITION_END - TRANSITION_START);

      if (lastAerialImg && lastAerialImg.complete) {
        drawImageFitCover(lastAerialImg, 1.0);
      }
      if (firstBeachImg && firstBeachImg.complete) {
        drawImageFitCover(firstBeachImg, blend);
      }
    } else {
      const img = frames[primaryIndex];
      if (img && img.complete) {
        drawImageFitCover(img, 1.0);
      }
    }

    lastDrawnFrame = primaryIndex;
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

        // Render initial aerial frame immediately once frame 0 is ready
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
    // Aerial Phase: fraction 0.00 to ~0.43 (179 frames)
    // Beach Phase:  fraction ~0.43 to 1.00 (240 frames)
    if (fraction < 0.08) {
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
    } else if (fraction >= 0.08 && fraction < 0.20) {
      const fadeProgress = (fraction - 0.08) / 0.12;
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
    } else if (fraction >= 0.20 && fraction < 0.94) {
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
          if (fraction < 0.32) {
            cinematicCaptionText.textContent = "Bay of Bengal Coastline • Aerial 3D Panorama";
          } else if (fraction < 0.43) {
            cinematicCaptionText.textContent = "Marine Drive & Hills • Descending to the Shore";
          } else if (fraction < 0.60) {
            cinematicCaptionText.textContent = "Bay of Bengal • Echoes of the Sampan";
          } else if (fraction < 0.78) {
            cinematicCaptionText.textContent = "Kolatoli Coastline • Solitude by the Shore";
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

    // Kolatoli Beach Scenario Glassmorphism Mini Cards
    if (kolatoliCardsContainer) {
      if (fraction >= 0.44 && fraction <= 0.88) {
        kolatoliCardsContainer.style.opacity = '1';
        kolatoliCardsContainer.style.pointerEvents = 'auto';

        if (cardLoungers) {
          if (fraction >= 0.46) {
            cardLoungers.classList.add('is-active');
          } else {
            cardLoungers.classList.remove('is-active');
          }
        }
        if (cardAtmosphere) {
          if (fraction >= 0.50) {
            cardAtmosphere.classList.add('is-active');
          } else {
            cardAtmosphere.classList.remove('is-active');
          }
        }
        if (cardSampan) {
          if (fraction >= 0.54) {
            cardSampan.classList.add('is-active');
          } else {
            cardSampan.classList.remove('is-active');
          }
        }
      } else {
        kolatoliCardsContainer.style.opacity = '0';
        kolatoliCardsContainer.style.pointerEvents = 'none';
        if (cardLoungers) cardLoungers.classList.remove('is-active');
        if (cardAtmosphere) cardAtmosphere.classList.remove('is-active');
        if (cardSampan) cardSampan.classList.remove('is-active');
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

    const clampedFrame = Math.min(Math.max(currentFrameIndex, 0), TOTAL_FRAMES - 1);
    const TRANSITION_START = AERIAL_FRAMES_COUNT - 3;
    const TRANSITION_END = AERIAL_FRAMES_COUNT + 2;

    if (
      (clampedFrame >= TRANSITION_START && clampedFrame <= TRANSITION_END) ||
      Math.round(clampedFrame) !== lastDrawnFrame
    ) {
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
