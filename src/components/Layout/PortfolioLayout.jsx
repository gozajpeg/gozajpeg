import { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderGit2 as ProjectIcon, Sun as SunIcon, Moon as MoonIcon } from 'lucide-react';

function RagozaLogo({ className = 'w-4 h-4' }) {
  return (
    <svg
      viewBox="0 0 416 402"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M58 0H366L416 49V100L366 148L264 201L366 260L416 340V402H238V300L104 203V402H0V49ZM104 75H314L104 203Z"
      />
    </svg>
  );
}
import ProfileSidebar from '../sections/ProfileSidebar';
import ReleaseBanner from '../sections/ReleaseBanner';
import AboutSection from '../sections/AboutSection';
import ProjectsSection, { AllProjectsScreen } from '../sections/ProjectsSection';
import SkillsSection from '../sections/SkillsSection';
import GitHubSection from '../sections/GitHubSection';
import ContactSection from '../sections/ContactSection';

export default function PortfolioLayout() {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('goza-theme');
      if (saved === 'dark' || saved === 'light') return saved;
    }
    return 'dark';
  });

  const location = useLocation();
  const navigate = useNavigate();

  const isProjects = location.pathname.startsWith('/projects');
  const view = isProjects ? 'projects' : 'home';
  const [isNavExpanded, setIsNavExpanded] = useState(false);
  const isThemeAnimatingRef = useRef(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname === '/') {
      document.title = 'Rommel Angelo Goza';
    } else if (location.pathname === '/projects') {
      document.title = 'Projects · Rommel Angelo Goza';
    }
  }, [location.pathname]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
    try {
      window.localStorage.setItem('goza-theme', theme);
    } catch {
      /* ignore storage errors */
    }
  }, [theme]);

  // Custom Origin-Aware Circular Iris Reveal Theme Transition
  const handleToggleTheme = (e) => {
    e.stopPropagation();
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    const root = document.documentElement;

    const applyTheme = (targetTheme) => {
      if (targetTheme === 'dark') {
        root.setAttribute('data-theme', 'dark');
      } else {
        root.removeAttribute('data-theme');
      }
      setTheme(targetTheme);
    };

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (
      typeof document === 'undefined' ||
      !document.startViewTransition ||
      prefersReducedMotion
    ) {
      applyTheme(nextTheme);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX || rect.left + rect.width / 2;
    const y = e.clientY || rect.top + rect.height / 2;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    isThemeAnimatingRef.current = true;
    root.classList.add('theme-transitioning');

    const transition = document.startViewTransition(() => {
      flushSync(() => {
        applyTheme(nextTheme);
      });
    });

    transition.ready
      .then(() => {
        root.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 600,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            pseudoElement: '::view-transition-new(root)',
          }
        );
      })
      .catch(() => {
        /* ignore view transition cancellation */
      });

    transition.finished.finally(() => {
      root.classList.remove('theme-transitioning');
      isThemeAnimatingRef.current = false;
    });
  };

  const handleSwitchView = (nextView) => {
    if (nextView === 'projects') {
      navigate('/projects');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen w-full bg-bg text-ink">
      {/* ── MINIMALIST FLOATING PILL (Vertical on Desktop, Centered Horizontal on Mobile) ── */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 lg:top-8 lg:left-8 lg:translate-x-0 z-50">
        <nav
          aria-label="Primary navigation"
          onMouseEnter={() => setIsNavExpanded(true)}
          onMouseLeave={() => {
            if (!isThemeAnimatingRef.current) {
              setIsNavExpanded(false);
            }
          }}
          className="theme-surface flex items-center lg:items-stretch lg:flex-col gap-1.5 rounded-full lg:rounded-[22px] border border-border-strong p-1.5 shadow-md"
        >
          {/* 1. Home / Ragoza Brand: Left on mobile, Top on desktop */}
          <button
            type="button"
            onClick={() => handleSwitchView('home')}
            aria-label="Go to Home"
            title="Rommel Angelo Goza"
            className={`flex items-center justify-start h-9 px-2.5 rounded-full font-sans text-xs transition-colors duration-200 cursor-pointer border-none shrink-0 ${
              view === 'home'
                ? 'bg-ink text-bg font-semibold'
                : 'bg-transparent text-ink-soft hover:text-ink hover:bg-surface-hover/60 font-medium'
            }`}
          >
            <RagozaLogo className="w-4 h-4 shrink-0" />
            <span
              className={`grid transition-[grid-template-columns,opacity,margin] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                view === 'home'
                  ? 'grid-cols-[1fr] opacity-100 ml-2'
                  : 'grid-cols-[0fr] opacity-0 ml-0'
              } ${
                isNavExpanded
                  ? 'lg:grid-cols-[1fr] lg:opacity-100 lg:ml-2'
                  : 'lg:grid-cols-[0fr] lg:opacity-0 lg:ml-0'
              }`}
            >
              <span className="overflow-hidden whitespace-nowrap text-left">
                Home
              </span>
            </span>
          </button>

          {/* 2. Project / Menu: Center on mobile, Middle on desktop */}
          <button
            type="button"
            onClick={() => handleSwitchView('projects')}
            aria-label="View Projects"
            className={`flex items-center justify-start h-9 px-2.5 rounded-full font-sans text-xs transition-colors duration-200 cursor-pointer border-none shrink-0 ${
              view === 'projects'
                ? 'bg-ink text-bg font-semibold'
                : 'bg-transparent text-ink-soft hover:text-ink hover:bg-surface-hover/60 font-medium'
            }`}
          >
            <ProjectIcon className="w-4 h-4 shrink-0" />
            <span
              className={`grid transition-[grid-template-columns,opacity,margin] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                view === 'projects'
                  ? 'grid-cols-[1fr] opacity-100 ml-2'
                  : 'grid-cols-[0fr] opacity-0 ml-0'
              } ${
                isNavExpanded
                  ? 'lg:grid-cols-[1fr] lg:opacity-100 lg:ml-2'
                  : 'lg:grid-cols-[0fr] lg:opacity-0 lg:ml-0'
              }`}
            >
              <span className="overflow-hidden whitespace-nowrap text-left">
                Projects
              </span>
            </span>
          </button>

          {/* 3. Theme Toggle: Right on mobile, Bottom on desktop */}
          <button
            type="button"
            onClick={handleToggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="flex items-center justify-start h-9 px-2.5 rounded-full bg-surface-hover/70 hover:bg-surface-hover text-ink transition-colors duration-200 cursor-pointer border-none shrink-0"
          >
            {theme === 'dark' ? (
              <SunIcon className="w-4 h-4 shrink-0" />
            ) : (
              <MoonIcon className="w-4 h-4 shrink-0" />
            )}
            <span
              className={`grid transition-[grid-template-columns,opacity,margin] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] grid-cols-[0fr] opacity-0 ml-0 ${
                isNavExpanded
                  ? 'lg:grid-cols-[1fr] lg:opacity-100 lg:ml-2'
                  : 'lg:grid-cols-[0fr] lg:opacity-0 lg:ml-0'
              }`}
            >
              <span className="overflow-hidden whitespace-nowrap font-sans text-xs font-medium text-left">
                {theme === 'dark' ? 'Light' : 'Dark'}
              </span>
            </span>
          </button>
        </nav>
      </div>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 pt-20 pb-16 lg:py-12">
        <AnimatePresence mode="wait">
          {view === 'home' ? (
            <motion.div
              key="home-view"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="grid grid-cols-1 lg:grid-cols-[330px_minmax(0,1fr)] xl:grid-cols-[350px_minmax(0,1fr)] gap-5 lg:gap-6 items-start"
            >
              {/* Left 30% Column: Resume Sidebar + Desktop GitHub Activity Stats */}
              <div className="lg:sticky lg:top-auto lg:bottom-6 w-full flex flex-col gap-7">
                <ProfileSidebar />
                <div className="hidden lg:block">
                  <GitHubSection />
                </div>
              </div>

              {/* Right 70% Column: Release/Quote Banner + Short About + Top 3 Recent Projects + Stack + Mobile GitHub Activity + CTA/Contact */}
              <div className="w-full min-w-0 flex flex-col gap-7">
                <ReleaseBanner />
                <AboutSection />
                <ProjectsSection onOpenAllProjects={() => handleSwitchView('projects')} />
                <SkillsSection />
                <div className="lg:hidden">
                  <GitHubSection />
                </div>
                <ContactSection />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="projects-view"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <AllProjectsScreen onBackHome={() => handleSwitchView('home')} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
