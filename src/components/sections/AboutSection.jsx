export default function AboutSection() {
  return (
    <section id="about" aria-label="About" className="flex flex-col gap-3.5">
      <div className="flex items-baseline justify-between px-1">
        <h2 className="font-sans text-base sm:text-lg font-semibold text-ink tracking-tight m-0">
          About
        </h2>
      </div>
      <div className="theme-surface rounded-2xl border p-5 sm:p-6">
        <p className="font-sans text-sm text-ink-soft leading-relaxed m-0">
          I am a software developer with two years of experience building developer tools and web applications. Most of what I build is in JavaScript and React, backed by Supabase or Firebase and deployed to Cloudflare, Vercel, and Render. I use AI assistance to accelerate development, ship clean code, and adapt quickly to new technologies.
        </p>
      </div>
    </section>
  );
}
