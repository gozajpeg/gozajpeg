import { useState } from 'react';

const ALL_SKILLS = [
  // Frontend & UI
  { name: 'Next.js', category: 'Frontend', icon: '/icons/skills/nextdotjs.svg' },
  { name: 'React', category: 'Frontend', icon: '/icons/skills/react.svg' },
  { name: 'React Native', category: 'Frontend', icon: '/icons/skills/react.svg' },
  { name: 'Tailwind', category: 'Frontend', icon: '/icons/skills/tailwindcss.svg' },
  { name: 'JavaScript', category: 'Languages', icon: '/icons/skills/javascript.svg' },

  // Backend & Languages
  { name: 'Fastify', category: 'Backend', icon: '/icons/skills/fastify.svg' },
  { name: 'Express', category: 'Backend', icon: '/icons/skills/express.svg' },
  { name: 'Python', category: 'Languages', icon: '/icons/skills/python.svg' },
  { name: 'Java', category: 'Languages', icon: '/icons/skills/java.svg' },
  { name: 'C#', category: 'Languages', icon: '/icons/skills/csharp.svg' },

  // Databases
  { name: 'PostgreSQL', category: 'Database', icon: '/icons/skills/postgresql.svg' },
  { name: 'Supabase', category: 'Database', icon: '/icons/skills/supabase.svg' },
  { name: 'Firebase', category: 'Database', icon: '/icons/skills/firebase.svg' },
  { name: 'MySQL', category: 'Database', icon: '/icons/skills/mysql.svg' },
  { name: 'Redis', category: 'Database', icon: '/icons/skills/redis.svg' },

  // Security, QA & Cloud
  { name: 'Playwright', category: 'Security & QA', icon: '/icons/skills/playwright.svg' },
  { name: 'OAuth 2.0', category: 'Security & QA', icon: '/icons/skills/oauth2.svg' },
  { name: 'JWT Auth', category: 'Security & QA', icon: '/icons/skills/jwt.svg' },
  { name: 'Argon2', category: 'Security & QA', icon: '/icons/skills/argon2.svg' },

  // Workflow & Deployment Tools
  { name: 'Cloudflare', category: 'Tools', icon: '/icons/skills/cloudflare.svg' },
  { name: 'Vercel', category: 'Tools', icon: '/icons/skills/vercel.svg' },
  { name: 'Render', category: 'Tools', icon: '/icons/skills/render.svg' },
  { name: 'GitHub', category: 'Tools', icon: '/icons/skills/github.svg' },
  { name: 'Bash', category: 'Tools', icon: '/icons/skills/bash.svg' },
  { name: 'Figma', category: 'Tools', icon: '/icons/skills/figma.svg' },
  { name: 'VS Code', category: 'Tools', icon: '/icons/skills/vscode.svg' },
];

const CATEGORIES = ['All', 'Frontend', 'Backend', 'Languages', 'Database', 'Security & QA', 'Tools'];

export default function SkillsSection() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeSkill, setActiveSkill] = useState(null);

  return (
    <section id="skills" aria-label="Technical Stack" className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-3">
          <h2 className="font-sans text-base sm:text-lg font-semibold text-ink tracking-tight m-0">
            Stack
          </h2>
          {activeSkill && (
            <span className="font-sans text-xs font-medium text-ink-soft transition-opacity duration-200">
              {activeSkill.name} · {activeSkill.category}
            </span>
          )}
        </div>

        {/* Minimalist Category Filter */}
        <div className="flex items-center gap-1 flex-wrap">
          {CATEGORIES.map((cat) => {
            const isSelected = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`h-7 px-2.5 rounded-lg font-sans text-[11px] font-medium transition-colors cursor-pointer border-none ${
                  isSelected
                    ? 'bg-ink text-bg font-semibold'
                    : 'bg-transparent text-ink-muted hover:text-ink hover:bg-surface-hover/60'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Zero-Reflow Fixed-Cell Icon Grid: Icons lift in-place on hover/tap to reveal their label */}
      <div className="theme-surface rounded-2xl border p-4 sm:p-5">
        <ul className="m-0 p-0 list-none grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-2">
          {ALL_SKILLS.map((skill) => {
            const isSelected = activeSkill?.name === skill.name;
            const isDimmed =
              activeCategory !== 'All' && skill.category !== activeCategory;

            return (
              <li key={skill.name}>
                <button
                  type="button"
                  onMouseEnter={() => setActiveSkill(skill)}
                  onMouseLeave={() =>
                    setActiveSkill((prev) => (prev?.name === skill.name ? null : prev))
                  }
                  onClick={() =>
                    setActiveSkill((prev) => (prev?.name === skill.name ? null : skill))
                  }
                  aria-label={`${skill.name} (${skill.category})`}
                  className={`relative w-full h-16 rounded-xl border transition-all duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] flex flex-col items-center justify-center overflow-hidden cursor-pointer select-none px-1 ${
                    isSelected
                      ? 'stack-item-active border-border-strong bg-surface-hover/80'
                      : 'border-transparent hover:border-border bg-surface-hover/25 hover:bg-surface-hover/60'
                  } ${isDimmed ? 'opacity-25 scale-95' : 'opacity-100 scale-100'}`}
                >
                  <img
                    src={skill.icon}
                    alt={skill.name}
                    width="24"
                    height="24"
                    loading="lazy"
                    decoding="async"
                    className={`w-6 h-6 object-contain stack-icon shrink-0 transition-transform duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      isSelected ? '-translate-y-2 scale-95' : 'translate-y-0 scale-100'
                    }`}
                  />

                  <span
                    className={`absolute bottom-1.5 inset-x-1 font-sans text-[10px] font-medium text-ink text-center truncate transition-all duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      isSelected
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 translate-y-2 pointer-events-none'
                    }`}
                  >
                    {skill.name}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
