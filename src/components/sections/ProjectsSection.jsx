import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { projectsData } from '../../data/Projects/projectsData';
import ReadmeFrameModal from '../UI/ReadmeFrameModal';

const CopyIcon = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V6a2 2 0 0 1 2-2h9" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

/**
 * Parses `released` field ("MM-DD-YYYY" or "N/A").
 * "N/A" (or missing) defaults to today's timestamp so active/today projects rank as most recent.
 */
function getReleaseTimestamp(released) {
  if (!released || String(released).trim().toUpperCase() === 'N/A') {
    return Date.now();
  }
  const clean = String(released).trim();
  const parts = clean.split('-');
  if (parts.length === 3) {
    const [month, day, year] = parts.map(Number);
    if (!Number.isNaN(month) && !Number.isNaN(day) && !Number.isNaN(year)) {
      return new Date(year, month - 1, day).getTime();
    }
  }
  const parsed = Date.parse(clean);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getSortedProjects(list) {
  return [...(list || [])].sort(
    (a, b) => getReleaseTimestamp(b.released) - getReleaseTimestamp(a.released)
  );
}

function formatReleaseLabel(released) {
  if (!released || String(released).trim().toUpperCase() === 'N/A') {
    return 'Active · Today';
  }
  return String(released).trim();
}

function CopyCommandButton({ command }) {
  const [copied, setCopied] = useState(false);

  if (!command) return null;

  const isPlaceholder = String(command).toUpperCase().includes('SOON');

  const handleCopy = async (e) => {
    e.stopPropagation();
    if (isPlaceholder) return;
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore clipboard error */
    }
  };

  if (isPlaceholder) {
    return (
      <div className="flex h-9 w-full items-center justify-between gap-3 rounded-xl border border-border bg-surface-hover/25 px-3.5 text-left">
        <span className="font-mono text-xs text-ink-muted truncate">
          {command}
        </span>
        <span className="font-sans text-[11px] font-medium text-ink-muted shrink-0">
          Upcoming
        </span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copy install command: ${command}`}
      className="flex h-9 w-full items-center justify-between gap-3 rounded-xl border border-border bg-surface-hover/40 hover:bg-surface-hover px-3.5 text-left transition-colors cursor-pointer"
    >
      <span className="font-mono text-xs text-ink truncate">
        {command}
      </span>
      <span
        aria-live="polite"
        className="flex items-center gap-1 font-sans text-[11px] font-medium text-ink-soft shrink-0"
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
        <span>{copied ? 'Copied' : 'Copy'}</span>
      </span>
    </button>
  );
}

const SearchIcon = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

function ProjectActionButtons({ project, onOpenReadme, size = 'default' }) {
  const isLarge = size === 'large';
  const btnHeight = isLarge ? 'h-10 px-4' : 'h-9 px-3';
  const hasWebsite = Boolean(project.website);
  const hasNpm = Boolean(project.npm);

  return (
    <div
      className={`grid gap-2 w-full ${
        hasWebsite || hasNpm ? 'grid-cols-3' : 'grid-cols-2'
      }`}
    >
      {hasWebsite ? (
        <a
          href={project.website}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={`${btnHeight} rounded-xl bg-ink text-bg font-sans text-xs font-semibold hover:opacity-90 inline-flex items-center justify-center no-underline transition-opacity whitespace-nowrap`}
        >
          Live Site
        </a>
      ) : null}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenReadme(project);
        }}
        className={`${btnHeight} rounded-xl font-sans text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap ${
          hasWebsite
            ? 'border border-border hover:border-border-strong bg-transparent hover:bg-surface-hover/60 text-ink'
            : 'bg-ink text-bg border-none'
        }`}
      >
        README
      </button>

      <a
        href={project.github}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className={`${btnHeight} rounded-xl border border-border hover:border-border-strong bg-transparent hover:bg-surface-hover/60 text-ink font-sans text-xs font-medium inline-flex items-center justify-center no-underline transition-colors whitespace-nowrap`}
      >
        GitHub
      </a>

      {!hasWebsite && hasNpm && (
        <a
          href={project.npm}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={`${btnHeight} rounded-xl border border-border hover:border-border-strong bg-transparent hover:bg-surface-hover/60 text-ink font-sans text-xs font-medium inline-flex items-center justify-center no-underline transition-colors whitespace-nowrap`}
        >
          npm
        </a>
      )}
    </div>
  );
}

/* ── RECENT PROJECT BENTO ITEM (Single Persistent Logo = Zero Blink, Fixed Layout = Zero Reflow) ── */
function RecentProjectBox({ project, isExpanded, onActivate, onOpenReadme }) {
  const command = project.command || project.installCmd;

  return (
    <li
      onMouseEnter={onActivate}
      onFocus={onActivate}
      onClick={onActivate}
      style={{
        flex: isExpanded ? '2.4 1 0%' : '1 1 0%',
      }}
      className={`theme-surface relative h-[225px] rounded-2xl border overflow-hidden cursor-pointer select-none transition-[flex-grow,border-color,background-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        isExpanded
          ? 'border-border-strong'
          : 'border-border hover:border-border-strong'
      }`}
    >
      {/* Single Persistent Logo (Never unmounts or fades out -> Zero Blink, GPU-scaled) */}
      <div
        className={`absolute z-10 flex flex-col items-center transition-[top,left,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isExpanded
            ? 'top-5 left-5 translate-x-0 translate-y-0'
            : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
        }`}
      >
        {project.logo ? (
          <img
            src={project.logo}
            alt={project.name}
            width="80"
            height="80"
            decoding="async"
            className={`w-20 h-20 sm:w-[84px] sm:h-[84px] object-contain shrink-0 origin-top-left transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isExpanded
                ? 'scale-85'
                : 'scale-100'
            }`}
          />
        ) : (
          <span className="font-sans text-2xl font-bold text-ink">
            {project.name?.charAt(0)}
          </span>
        )}

        <span
          className={`font-sans text-xs font-semibold text-ink text-center whitespace-nowrap transition-opacity duration-200 ${
            isExpanded
              ? 'opacity-0 max-h-0 mt-0 overflow-hidden pointer-events-none'
              : 'opacity-100 max-h-6 mt-2.5'
          }`}
        >
          {project.name}
        </span>
      </div>

      {/* Stationary Expanded Content (Locked min-width prevents text/button squishing while card widens) */}
      <div
        aria-hidden={!isExpanded}
        className={`absolute inset-0 p-5 flex flex-col justify-between min-w-[295px] sm:min-w-[335px] transition-opacity duration-300 ease-out ${
          isExpanded
            ? 'opacity-100'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Top-Right Title & Tagline (Aligned beside the Top-Left Persistent Logo) */}
        <div className="pl-20 sm:pl-[88px] h-[72px] flex flex-col justify-center min-w-0 overflow-hidden shrink-0">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-sans text-base sm:text-lg font-bold text-ink tracking-tight m-0 truncate">
              {project.name}
            </h3>
            <span className="font-sans text-[10px] font-medium text-ink-muted shrink-0">
              {formatReleaseLabel(project.released)}
            </span>
          </div>
          <p className="font-sans text-xs text-ink-soft leading-relaxed mt-1 m-0 line-clamp-2">
            {project.tagline}
          </p>
        </div>

        {/* Bottom Full-Width Command Bar + Action Buttons */}
        <div className="flex flex-col justify-end gap-2.5 w-full h-[84px] shrink-0">
          <CopyCommandButton command={command} />
          <ProjectActionButtons
            project={project}
            onOpenReadme={onOpenReadme}
            size="default"
          />
        </div>
      </div>
    </li>
  );
}

function ToolProjectCard({ project, onOpenReadme }) {
  const command = project.command || project.installCmd;

  return (
    <li className="theme-surface rounded-2xl border p-6 flex flex-col justify-between gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          {project.logo && (
            <img
              src={project.logo}
              alt={project.name}
              width="72"
              height="72"
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain shrink-0"
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-sans text-lg font-bold text-ink tracking-tight m-0 truncate">
                {project.name}
              </h3>
              <span className="font-sans text-[11px] font-medium text-ink-muted shrink-0">
                {formatReleaseLabel(project.released)}
              </span>
            </div>
            <span className="font-sans text-xs text-ink-muted block mt-0.5">
              {project.categories?.join(' · ') || 'Project'}
            </span>
          </div>
        </div>

        <p className="font-sans text-xs sm:text-sm text-ink-soft leading-relaxed m-0">
          {project.tagline}
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        <CopyCommandButton command={command} />
        <div className={`grid gap-2 ${project.npm ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <button
            type="button"
            onClick={() => onOpenReadme(project)}
            className="h-10 px-4 rounded-xl bg-ink text-bg font-sans text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer border-none"
          >
            README
          </button>

          <a
            href={project.github}
            target="_blank"
            rel="noopener noreferrer"
            className="h-10 px-4 rounded-xl border border-border hover:border-border-strong bg-transparent hover:bg-surface-hover/60 text-ink font-sans text-xs font-medium inline-flex items-center justify-center no-underline transition-colors"
          >
            GitHub
          </a>

          {project.npm && (
            <a
              href={project.npm}
              target="_blank"
              rel="noopener noreferrer"
              className="h-10 px-4 rounded-xl border border-border hover:border-border-strong bg-transparent hover:bg-surface-hover/60 text-ink font-sans text-xs font-medium inline-flex items-center justify-center no-underline transition-colors"
            >
              npm
            </a>
          )}
        </div>
      </div>
    </li>
  );
}

function WebsiteProjectCard({ project }) {
  return (
    <li className="theme-surface relative rounded-2xl border border-border hover:border-border-strong overflow-hidden flex flex-col justify-between min-h-[310px] sm:min-h-[320px] transition-colors duration-200 group">
      {/* Background preview image (Website layout, top-contained) */}
      <div className="absolute inset-x-0 top-0 h-56 overflow-hidden pointer-events-none select-none bg-surface rounded-t-2xl">
        {project.preview ? (
          <img
            src={project.preview}
            alt={`${project.name} live preview`}
            loading="lazy"
            className="w-full h-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.02]"
          />
        ) : null}

        {/* Fluid Frosted Blur Layer (Smooth dissolve into card surface) */}
        <div
          className="absolute inset-x-0 bottom-0 h-32 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, var(--color-surface) 0%, var(--color-surface) 30%, transparent 100%)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 50%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 50%)',
          }}
        />
      </div>

      {/* Top Bar: Floating Small Logo at Top Left */}
      <div className="relative z-10 w-full flex justify-start p-5 pointer-events-none">
        {project.logo && (
          <img
            src={project.logo}
            alt={project.name}
            width="36"
            height="36"
            className="w-9 h-9 object-contain drop-shadow-sm pointer-events-auto"
          />
        )}
      </div>

      {/* Bottom Content: Title, Tagline, and Action Buttons */}
      <div className="relative z-10 p-6 flex flex-col gap-3.5">
        <div className="flex flex-col gap-1 min-w-0">
          <h3 className="font-sans text-base sm:text-lg font-bold text-ink tracking-tight m-0 truncate">
            {project.name}
          </h3>
          <p className="font-sans text-xs text-ink-soft leading-relaxed m-0 line-clamp-2">
            {project.tagline}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 w-full">
          <a
            href={project.website}
            target="_blank"
            rel="noopener noreferrer"
            className="h-10 px-4 rounded-xl bg-ink text-bg font-sans text-xs font-semibold hover:opacity-90 inline-flex items-center justify-center no-underline transition-opacity"
          >
            Live Site
          </a>

          <a
            href={project.github}
            target="_blank"
            rel="noopener noreferrer"
            className="h-10 px-4 rounded-xl border border-border hover:border-border-strong bg-surface/75 hover:bg-surface text-ink font-sans text-xs font-medium inline-flex items-center justify-center no-underline transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </li>
  );
}

/* ── DEDICATED ALL PROJECTS SCREEN ── */
export function AllProjectsScreen({ onBackHome }) {
  const sortedProjects = useMemo(() => getSortedProjects(projectsData), []);
  const [searchQuery, setSearchQuery] = useState('');
  const { projectId } = useParams();
  const navigate = useNavigate();

  // Dynamically extract all unique categories in order of appearance
  const categoriesList = useMemo(() => {
    const set = new Set();
    sortedProjects.forEach((p) => {
      if (Array.isArray(p.categories)) {
        p.categories.forEach((c) => {
          if (c && typeof c === 'string') set.add(c.trim());
        });
      }
    });
    if (set.size === 0) set.add('Projects');
    return Array.from(set);
  }, [sortedProjects]);

  const matchesFilter = (project, query) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      project.name?.toLowerCase().includes(q) ||
      project.title?.toLowerCase().includes(q) ||
      project.tagline?.toLowerCase().includes(q) ||
      project.categories?.some((c) => c.toLowerCase().includes(q)) ||
      project.tech?.some((t) => t.toLowerCase().includes(q))
    );
  };

  const projectsByCategory = useMemo(() => {
    const q = searchQuery.trim();
    const map = {};

    categoriesList.forEach((category) => {
      map[category] = sortedProjects.filter((project) => {
        const belongs = Array.isArray(project.categories)
          ? project.categories.includes(category)
          : category === 'Projects';
        if (!belongs) return false;
        return matchesFilter(project, q);
      });
    });

    return map;
  }, [categoriesList, sortedProjects, searchQuery]);

  const activeCategories = useMemo(() => {
    return categoriesList.filter(
      (cat) => projectsByCategory[cat] && projectsByCategory[cat].length > 0
    );
  }, [categoriesList, projectsByCategory]);

  const hasAnyMatches = activeCategories.length > 0;

  const selectedReadmeProject = useMemo(() => {
    if (!projectId) return null;
    return projectsData.find((p) => p.id === projectId) || null;
  }, [projectId]);

  useEffect(() => {
    if (projectId && !projectsData.some((p) => p.id === projectId)) {
      navigate('/projects', { replace: true });
    }
  }, [projectId, navigate]);

  useEffect(() => {
    if (selectedReadmeProject) {
      document.title = `${selectedReadmeProject.name} · Rommel Angelo Goza`;
    } else {
      document.title = 'Projects · Rommel Angelo Goza';
    }
  }, [selectedReadmeProject]);

  const handleOpenReadme = (project) => {
    navigate(`/projects/${project.id}`);
  };

  const handleCloseReadme = () => {
    navigate('/projects');
  };

  return (
    <section aria-label="All Projects" className="w-full flex flex-col gap-8">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="font-sans text-xl sm:text-2xl font-bold text-ink tracking-tight m-0">
            All Projects
          </h1>
          <p className="font-sans text-xs sm:text-sm text-ink-soft mt-1 m-0">
            Developer tools and web software.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-60">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="h-10 w-full rounded-xl border border-border bg-surface px-3 pl-8 font-sans text-xs text-ink placeholder:text-ink-muted focus:border-border-strong transition-colors"
            />
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-muted pointer-events-none" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink text-xs bg-transparent border-none cursor-pointer"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onBackHome}
            className="h-10 px-4 rounded-xl border border-border hover:border-border-strong bg-surface hover:bg-surface-hover text-ink font-sans text-xs font-medium transition-colors cursor-pointer shrink-0"
          >
            Back to Home
          </button>
        </div>
      </div>

      {!hasAnyMatches ? (
        <div className="theme-surface rounded-2xl border p-12 text-center flex flex-col items-center justify-center gap-2">
          <p className="font-sans text-sm text-ink-soft m-0">
            No projects found matching &ldquo;{searchQuery}&rdquo;.
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="font-sans text-xs text-ink hover:underline bg-transparent border-none cursor-pointer mt-1"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {activeCategories.map((category, idx) => {
            const list = projectsByCategory[category] || [];
            return (
              <div
                key={category}
                className={`flex flex-col gap-3.5 ${
                  idx > 0 ? 'pt-6 border-t border-border' : ''
                }`}
              >
                <div className="flex items-center gap-2 px-1">
                  <h2 className="font-sans text-base sm:text-lg font-semibold text-ink tracking-tight m-0">
                    {category}
                  </h2>
                  <span className="flex items-center justify-center font-sans text-xs font-medium text-ink-muted leading-none">
                    {list.length}
                  </span>
                </div>

                <ul className="m-0 p-0 list-none grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {list.map((project) => {
                    const isWebsiteCategory = category.toLowerCase().includes('website');
                    if (isWebsiteCategory && project.preview) {
                      return (
                        <WebsiteProjectCard
                          key={`${category}-${project.id}`}
                          project={project}
                        />
                      );
                    }
                    return (
                      <ToolProjectCard
                        key={`${category}-${project.id}`}
                        project={project}
                        onOpenReadme={handleOpenReadme}
                      />
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      <ReadmeFrameModal
        project={selectedReadmeProject}
        isOpen={Boolean(selectedReadmeProject)}
        onClose={handleCloseReadme}
      />
    </section>
  );
}

/* ── MY RECENT PROJECTS SECTION (Home View - Top 3 Most Recent Only) ── */
export default function ProjectsSection({ onOpenAllProjects }) {
  const [selectedReadmeProject, setSelectedReadmeProject] = useState(null);
  const recentProjects = useMemo(
    () => getSortedProjects(projectsData).slice(0, 3),
    []
  );

  const [activeId, setActiveId] = useState(
    () => recentProjects[0]?.id || 'barstile'
  );
  const [isHovered, setIsHovered] = useState(false);

  // Synchronize document title while in-place modal is open on Home view
  useEffect(() => {
    if (selectedReadmeProject) {
      const prevTitle = document.title;
      document.title = `${selectedReadmeProject.name} · Rommel Angelo Goza`;
      return () => {
        document.title = prevTitle;
      };
    }
  }, [selectedReadmeProject]);

  // Every 5 seconds, if not hovering, randomly expand a different project from the 3 recent ones
  useEffect(() => {
    if (isHovered || recentProjects.length <= 1) return;

    const timer = setInterval(() => {
      setActiveId((prevId) => {
        const candidates = recentProjects.filter((p) => p.id !== prevId);
        if (candidates.length === 0) return prevId;
        const randomNext =
          candidates[Math.floor(Math.random() * candidates.length)];
        return randomNext.id;
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [isHovered, recentProjects]);

  const latestProject = recentProjects[0];

  return (
    <section id="projects" aria-label="My Recent Projects" className="flex flex-col gap-3.5">
      <div className="flex items-baseline justify-between px-1">
        <h2 className="font-sans text-base sm:text-lg font-semibold text-ink tracking-tight m-0">
          My Recent Projects
        </h2>
        <button
          type="button"
          onClick={onOpenAllProjects}
          className="font-sans text-xs font-medium text-ink-soft hover:text-ink bg-transparent border-none p-0 cursor-pointer transition-colors"
        >
          See all projects
        </button>
      </div>

      {/* Mobile View (< md): Shows ONLY the Single Latest Project */}
      {latestProject && (
        <div className="md:hidden theme-surface rounded-2xl border border-border-strong p-5 flex flex-col justify-between gap-4">
          <div className="flex items-center gap-4">
            {latestProject.logo && (
              <img
                src={latestProject.logo}
                alt={latestProject.name}
                width="72"
                height="72"
                className="w-16 h-16 object-contain shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-sans text-base font-bold text-ink tracking-tight m-0 truncate">
                  {latestProject.name}
                </h3>
                <span className="font-sans text-[10px] font-medium text-ink-muted shrink-0">
                  {formatReleaseLabel(latestProject.released)}
                </span>
              </div>
              <p className="font-sans text-xs text-ink-soft leading-relaxed mt-1 m-0 line-clamp-2">
                {latestProject.tagline}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 w-full">
            <CopyCommandButton command={latestProject.command || latestProject.installCmd} />
            <ProjectActionButtons
              project={latestProject}
              onOpenReadme={() => setSelectedReadmeProject(latestProject)}
              size="default"
            />
          </div>
        </div>
      )}

      {/* Desktop View (>= md): Uneven Flex Bento Row of Top 3 Most Recent Projects */}
      <ul
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="m-0 p-0 list-none hidden md:flex flex-row gap-3.5"
      >
        {recentProjects.map((project) => (
          <RecentProjectBox
            key={project.id}
            project={project}
            isExpanded={activeId === project.id}
            onActivate={() => setActiveId(project.id)}
            onOpenReadme={(p) => setSelectedReadmeProject(p)}
          />
        ))}
      </ul>

      {/* In-Place README Modal Overlay for Home View */}
      <ReadmeFrameModal
        project={selectedReadmeProject}
        isOpen={Boolean(selectedReadmeProject)}
        onClose={() => setSelectedReadmeProject(null)}
      />
    </section>
  );
}
