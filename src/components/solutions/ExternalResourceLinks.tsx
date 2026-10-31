import React from 'react';

export interface ExternalResourceLinksProps {
  githubUrl?: string | null;
  liveUrl?: string | null;
  videoUrl?: string | null;
  demoUrl?: string | null;
  size?: 'sm' | 'md';
  className?: string;
}

export function ExternalResourceLinks({
  githubUrl,
  liveUrl,
  videoUrl,
  demoUrl,
  size = 'sm',
  className = '',
}: ExternalResourceLinksProps) {
  const hasLinks = Boolean(githubUrl || liveUrl || videoUrl || demoUrl);

  if (!hasLinks) {
    return null;
  }

  const isSmall = size === 'sm';
  const buttonClasses = isSmall
    ? 'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors border'
    : 'inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors border';

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {/* GitHub Repository */}
      {githubUrl && (
        <a
          href={githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${buttonClasses} border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-black dark:hover:text-white`}
          title="View GitHub Repository"
        >
          <svg className={isSmall ? 'h-3.5 w-3.5' : 'h-4 w-4'} fill="currentColor" viewBox="0 0 24 24">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            />
          </svg>
          <span>Repository</span>
        </a>
      )}

      {/* Live Application */}
      {liveUrl && (
        <a
          href={liveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${buttonClasses} border-emerald-500/20 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60`}
          title="Visit Live Application"
        >
          <svg className={isSmall ? 'h-3.5 w-3.5' : 'h-4 w-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
          <span>Live Demo</span>
        </a>
      )}

      {/* Demo Video Walkthrough */}
      {videoUrl && (
        <a
          href={videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${buttonClasses} border-purple-500/20 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60`}
          title="Watch Video Walkthrough"
        >
          <svg className={isSmall ? 'h-3.5 w-3.5' : 'h-4 w-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>Video</span>
        </a>
      )}

      {/* Prototype / Figma / Interactive Demo */}
      {demoUrl && (
        <a
          href={demoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${buttonClasses} border-amber-500/20 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60`}
          title="View Interactive Prototype"
        >
          <svg className={isSmall ? 'h-3.5 w-3.5' : 'h-4 w-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
            />
          </svg>
          <span>Prototype</span>
        </a>
      )}
    </div>
  );
}
