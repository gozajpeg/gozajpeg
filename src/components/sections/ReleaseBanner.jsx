import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getActiveBanners, fallbackBannerQuote } from '../../data/Banner/banner';

const COLS = 28;
const ROWS = 7;

/**
 * High-Performance Single-Canvas Square-Matrix Wave Background.
 * Replaces 392 individual `will-change` DOM nodes + CSS blur filters with 1 lightweight canvas
 * that pauses automatically when off-screen or hidden by breakpoint.
 */
export function SquareMatrixBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = null;
    let isVisible = true;
    let width = 0;
    let height = 0;

    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      if (width === 0 || height === 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    updateSize();

    const getInkRgb = () => {
      const isDark =
        document.documentElement.getAttribute('data-theme') === 'dark';
      return isDark ? '242, 241, 236' : '20, 20, 19';
    };

    const render = (time) => {
      if (!isVisible) return;
      if (width === 0 || height === 0) {
        updateSize();
      }
      if (width > 0 && height > 0) {
        ctx.clearRect(0, 0, width, height);
        const rgb = getInkRgb();
        const cellW = width / COLS;
        const cellH = height / ROWS;
        const baseSize = Math.min(cellW, cellH, 15) * 0.72;
        const t = time * 0.0024;

        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            const cx = (c + 0.5) * cellW;
            const cy = (r + 0.5) * cellH;

            const nx = (cx / width - 0.5) * 2;
            const ny = (cy / height - 0.5) * 2;
            const distEdge = Math.hypot(nx, ny);
            const edgeFade = Math.max(0, 1 - Math.pow(distEdge * 0.78, 2.2));
            const centerDip =
              0.38 + 0.62 * Math.min(1, Math.hypot(nx * 1.35, ny * 2.1));

            const wave = 0.5 + 0.5 * Math.sin(t - (r + c) * 0.28);
            const scale = 0.62 + 0.38 * wave;
            const alpha = (0.06 + 0.32 * wave) * edgeFade * centerDip;

            if (alpha > 0.015) {
              const size = baseSize * scale;
              const x = cx - size / 2;
              const y = cy - size / 2;

              ctx.fillStyle = `rgba(${rgb}, ${alpha * 0.42})`;
              ctx.strokeStyle = `rgba(${rgb}, ${alpha})`;
              ctx.lineWidth = 1;

              ctx.beginPath();
              if (ctx.roundRect) {
                ctx.roundRect(x, y, size, size, 2);
              } else {
                ctx.rect(x, y, size, size);
              }
              ctx.fill();
              ctx.stroke();
            }
          }
        }
      }
      rafId = requestAnimationFrame(render);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible) {
          updateSize();
          if (!rafId) rafId = requestAnimationFrame(render);
        } else if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      },
      { threshold: 0.01 }
    );

    observer.observe(canvas);
    window.addEventListener('resize', updateSize, { passive: true });
    rafId = requestAnimationFrame(render);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 w-full h-full block"
    />
  );
}

/**
 * Dismissible Fluid-Morphing Release Banner + Fallback Square-Matrix Quote Banner.
 * Driven by `src/data/Banner/banner.js`.
 * When multiple banners have `active: true`, it smoothly morphs between them in place every 4 seconds.
 * Clicking the banner advances to the next announcement. Hovering pauses the auto-morph timer.
 * Dismissing (`×`) smoothly reveals the quote banner underneath.
 */
export default function ReleaseBanner() {
  const activeBanners = useMemo(() => getActiveBanners(), []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const hasMultiple = activeBanners.length > 1;
  const currentBanner = activeBanners[currentIndex % (activeBanners.length || 1)] || null;
  const showAnnouncement = Boolean(currentBanner && !isDismissed);

  // Auto-morph every 4 seconds when multiple banners are active (pauses on hover)
  useEffect(() => {
    if (isHovered || isDismissed || !hasMultiple) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [isHovered, isDismissed, hasMultiple, activeBanners.length]);

  const handleBannerClick = (e) => {
    if (!hasMultiple) return;
    // Don't advance if visitor clicked a link or button
    if (e.target.closest('a, button')) return;
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  };

  return (
    <section
      id="banner"
      aria-label={showAnnouncement ? `${currentBanner.title} Release Banner` : 'Statement Banner'}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleBannerClick}
      className={`relative flex items-center justify-center overflow-hidden bg-transparent h-[136px] sm:h-[168px] px-4 sm:px-6 select-none ${
        hasMultiple && showAnnouncement ? 'cursor-pointer' : ''
      }`}
    >
      {/* Subtle Square-Matrix Wave Background */}
      <SquareMatrixBackground />

      {showAnnouncement ? (
        <>
          {/* Dismiss (×) Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsDismissed(true);
            }}
            aria-label="Dismiss release announcement"
            title="Dismiss announcement"
            className="absolute top-2 right-0 sm:top-3 sm:right-1 z-30 w-6 h-6 rounded-full border border-border hover:border-border-strong bg-surface/80 hover:bg-surface-hover text-ink-muted hover:text-ink flex items-center justify-center transition-colors cursor-pointer"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Morphing Banner Body (In-place vertical blur-crossfade) */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentBanner.id}
              initial={{ opacity: 0, filter: 'blur(4px)', y: 6 }}
              animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
              exit={{ opacity: 0, filter: 'blur(4px)', y: -6 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 w-full h-full flex flex-row items-center justify-center gap-5 sm:gap-8"
            >
              {/* Left: Product Logo + Oversized Bold Version Display Lockup */}
              <div className="flex items-center gap-2.5 sm:gap-3.5 select-none shrink-0">
                {currentBanner.logo && (
                  <img
                    src={currentBanner.logo}
                    alt={currentBanner.title}
                    width="48"
                    height="48"
                    decoding="async"
                    className="w-10 h-10 sm:w-12 sm:h-12 object-contain shrink-0"
                  />
                )}
                <span className="font-sans text-6xl sm:text-8xl xl:text-[96px] font-black tracking-tighter leading-[0.8] text-ink">
                  {currentBanner.version}
                </span>
              </div>

              {/* Right: Title, Subtitle & Action Button */}
              <div className="flex flex-col items-start text-left gap-2 min-w-0">
                <div className="flex flex-col gap-0.5">
                  <h2 className="font-sans text-sm sm:text-base font-bold text-ink tracking-tight leading-tight m-0">
                    {currentBanner.title}
                  </h2>
                  <p className="font-sans text-xs sm:text-sm font-normal text-ink-muted leading-tight m-0">
                    {currentBanner.subtitle}
                  </p>
                </div>

                <a
                  href={currentBanner.ctaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="h-8 px-3.5 rounded-lg bg-ink text-bg font-sans text-[11px] sm:text-xs font-semibold hover:opacity-90 transition-opacity inline-flex items-center justify-center no-underline whitespace-nowrap cursor-pointer"
                >
                  {currentBanner.ctaText}
                </a>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Morphing Indicator Pills (Rendered only when 2+ banners are active) */}
          {hasMultiple && (
            <div
              className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20"
              aria-label="Announcement slides"
            >
              {activeBanners.map((banner, index) => {
                const isActive = index === (currentIndex % activeBanners.length);
                return (
                  <button
                    key={banner.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex(index);
                    }}
                    aria-label={`Jump to ${banner.title}`}
                    className={`h-1 rounded-full transition-all duration-300 border-none cursor-pointer p-0 ${
                      isActive
                        ? 'w-5 bg-ink'
                        : 'w-1.5 bg-border-strong hover:bg-ink-muted'
                    }`}
                  />
                );
              })}
            </div>
          )}
        </>
      ) : (
        <h2 className="relative z-10 font-sans text-xl sm:text-2xl xl:text-4xl font-bold text-ink tracking-tight leading-tight text-center m-0 max-w-2xl">
          {fallbackBannerQuote}
        </h2>
      )}
    </section>
  );
}
