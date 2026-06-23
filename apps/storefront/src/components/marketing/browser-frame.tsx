import type { ReactNode } from 'react';

export type BrowserFrameVariant = 'green' | 'blue';

interface BrowserFrameProps {
  url: string;
  title: string;
  subtitle: string;
  placeholder?: string;
  children?: ReactNode;
  className?: string;
  variant?: BrowserFrameVariant;
}

export function BrowserFrame({
  url,
  title,
  subtitle,
  placeholder = 'Em breve',
  children,
  className = '',
  variant = 'green',
}: BrowserFrameProps) {
  const isBlue = variant === 'blue';

  const frameClass = isBlue ? 'browser-frame-blue' : 'browser-frame';
  const barClass = isBlue ? 'browser-bar-blue' : 'browser-bar';
  const accentColor = isBlue ? '#2e8ffb' : '#639922';
  const innerBg = isBlue ? 'rgba(46,143,251,.06)' : 'rgba(99,153,34,.06)';

  return (
    <div className={`${frameClass} ${className}`}>
      <div className={barClass}>
        <span className="browser-dot bg-red-500" />
        <span className="browser-dot bg-yellow-400" />
        <span className="browser-dot" style={{ background: accentColor }} />
        <span className="ml-3 flex-1 truncate text-xs text-white/25">{url}</span>
      </div>
      {children ?? (
        <div
          className="flex h-48 items-center justify-center"
          style={{ background: innerBg }}
        >
          <p className="text-xs uppercase tracking-[0.18em] text-white/15">{placeholder}</p>
        </div>
      )}
      <div className="border-t border-white/5 p-5">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-1 text-xs text-white/35">{subtitle}</p>
      </div>
    </div>
  );
}
