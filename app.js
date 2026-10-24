/**
 * COXY — Coastal Experience & Cinematic Scroll Animation Engine
 * Preloads 840 Full HD Frames (600 Aerial 3D Map + 480 Beach Sunset Walk)
 * Scrubs via GPU-accelerated HTML5 Canvas with smooth transition blending & LERP physics
 */

(() => {
  'use strict';

  // --- Configuration ---
  const AERIAL_START_FRAME = 1; // Frames start at 0001
  const TOTAL_FRAMES = 600; // 600 Aerial 3D Map frames (0001 through 0600)
  const AERIAL_PREFIX = 'frames/aerial/frame_';
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


  // Interactive 3D Aerial Map Elements
  const aerialInteractiveOverlay = document.getElementById('aerial-interactive-overlay');
  const cinematicDiveFlash = document.getElementById('cinematic-dive-flash');

  const mobileNavToggle = document.getElementById('mobile-nav-toggle');
  const mobileDrawer = document.getElementById('mobile-drawer');

  // --- State Variables ---
  const frames = [];
  let loadedCount = 0;
  let currentFrameIndex = 0;
  let targetFrameIndex = 0;
  let lastDrawnFrame = -1;

  // Format frame number to zero-padded string (frame_0001.jpg through frame_0600.jpg)
  function getFrameUrl(index) {
    const frameNum = (index + AERIAL_START_FRAME).toString().padStart(4, '0');
    return `${AERIAL_PREFIX}${frameNum}${FRAME_EXT}`;
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
    let img = frames[primaryIndex];

    // If current target frame is still loading, seamlessly fallback to nearest loaded frame
    if (!img || !img.complete) {
      for (let offset = 1; offset < 40; offset++) {
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
      drawImageFitCover(img, 1.0);
    }
    lastDrawnFrame = primaryIndex;
  }

  // --- Preloader System ---
  let preloaderDismissed = false;

  function dismissPreloader() {
    if (preloaderDismissed) return;
    preloaderDismissed = true;
    if (preloader) preloader.classList.add('fade-out');
    resizeCanvas();
    updateScrollProgress();
    drawFrame(targetFrameIndex || 0);
  }

  function preloadImages() {
    // Safety fallback: if some frame takes too long, dismiss preloader after 2.5s
    setTimeout(() => {
      if (loadedCount >= 10 && !preloaderDismissed) {
        dismissPreloader();
      }
    }, 2500);

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();

      img.onload = () => {
        loadedCount++;
        const percent = Math.floor((loadedCount / TOTAL_FRAMES) * 100);
        if (progressBar) progressBar.style.width = `${percent}%`;
        if (loaderPercent) loaderPercent.textContent = `${percent}%`;

        // Render initial aerial frame immediately
        if (i === 0 || loadedCount === 1) {
          drawFrame(0);
        }

        // Dismiss preloader once a solid initial buffer (60 frames) or all are ready
        if (loadedCount >= Math.min(60, TOTAL_FRAMES) && !preloaderDismissed) {
          dismissPreloader();
        }

        if (loadedCount === TOTAL_FRAMES) {
          dismissPreloader();
        }
      };

      img.onerror = () => {
        loadedCount++;
        if (loadedCount >= Math.min(60, TOTAL_FRAMES) && !preloaderDismissed) {
          dismissPreloader();
        }
      };

      // Set src AFTER event handlers are attached
      img.src = getFrameUrl(i);
      frames.push(img);
    }
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
    // Aerial Phase: fraction 0.00 to ~0.71 (600 frames)
    // Beach Phase:  fraction ~0.71 to 1.00 (240 frames)
    if (fraction < 0.06) {
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
    } else if (fraction >= 0.06 && fraction < 0.16) {
      const fadeProgress = (fraction - 0.06) / 0.10;
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
    } else if (fraction >= 0.16) {
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
          if (fraction < 0.45) {
            cinematicCaptionText.textContent = "Bay of Bengal Coastline • Aerial 3D Panorama";
          } else if (fraction < 0.80) {
            cinematicCaptionText.textContent = "Marine Drive & Hills • Descending to the Shore";
          } else {
            cinematicCaptionText.textContent = "Interactive 3D Map • Click Kolatoli Beach to Walk Shore";
          }
        }
      }
    }

    // Interactive 3D Aerial Map Hotspots:
    // Appear strictly when the frames are scrolled to about 80% of total
    if (aerialInteractiveOverlay) {
      if (fraction >= 0.80) {
        aerialInteractiveOverlay.classList.add('is-active');
      } else {
        aerialInteractiveOverlay.classList.remove('is-active');
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

    if (Math.round(clampedFrame) !== lastDrawnFrame) {
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

  // --- Smooth Cinematic Transition to Separate Kolatoli Beach Page ---
  function enterBeachSequence() {
    // Trigger visual dive flash
    if (cinematicDiveFlash) {
      cinematicDiveFlash.classList.add('is-flashing');
    }

    // Smoothly navigate to the dedicated Kolatoli Beach page
    setTimeout(() => {
      window.location.href = 'kolatoli.html';
    }, 380);
  }

  // --- Aerial Hotspots Interaction Setup ---
  function setupAerialHotspots() {
    const hotspots = document.querySelectorAll('.map-hotspot');
    hotspots.forEach(spot => {
      const pointId = spot.getAttribute('data-point-id');
      const target = spot.getAttribute('data-target');

      spot.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (pointId === 'kolatoli' || target === 'beach-sequence') {
          enterBeachSequence();
        } else if (target === 'destinations') {
          const destSection = document.getElementById('destinations');
          if (destSection) {
            destSection.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });

      // Keyboard accessibility (Enter or Space)
      spot.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          spot.click();
        }
      });
    });

    // Quick Jump button from hero
    const btnHeroExploreMap = document.getElementById('btn-hero-explore-map');
    if (btnHeroExploreMap && heroSection) {
      btnHeroExploreMap.addEventListener('click', () => {
        const heroMaxScroll = heroSection.offsetHeight - window.innerHeight;
        window.scrollTo({
          top: heroMaxScroll * 0.85,
          behavior: 'smooth'
        });
      });
    }

    // Direct hash landing (e.g. returning from separate Kolatoli page)
    if (window.location.hash === '#map' && heroSection) {
      setTimeout(() => {
        const heroMaxScroll = heroSection.offsetHeight - window.innerHeight;
        window.scrollTo({
          top: heroMaxScroll * 0.85,
          behavior: 'smooth'
        });
      }, 500);
    }
  }

  // --- Event Listeners ---
  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  window.addEventListener('resize', resizeCanvas);

  // Initialize
  setupAerialHotspots();
  resizeCanvas();
  updateScrollProgress();
  preloadImages();
  requestAnimationFrame(animationLoop);
})();

