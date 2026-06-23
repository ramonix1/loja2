'use client';

import { useEffect, useRef } from 'react';

interface FadeUpProps {
  children: React.ReactNode;
  className?: string;
}

export function FadeUp({ children, className = '' }: FadeUpProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    if (rect.top <= window.innerHeight * 0.9) return;

    el.classList.add('will-animate');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.08 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`fade-up ${className}`}>
      {children}
    </div>
  );
}
