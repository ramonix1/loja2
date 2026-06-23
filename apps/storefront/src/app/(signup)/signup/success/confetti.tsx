'use client';

import { useEffect, useState } from 'react';

interface Piece {
  left: number;
  size: number;
  rect: boolean;
  duration: number;
  delay: number;
  drift: number;
  spin: number;
  color: string;
}

const COLORS = ['#0D5FE0', '#2E8FFB', '#5CB1FE', '#A3D7FE', '#639922', '#ffffff', '#012A7E'];

export function Confetti() {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    const next: Piece[] = Array.from({ length: 90 }, () => {
      const size = Math.random() * 9 + 4;
      return {
        left: Math.random() * 98 + 1,
        size,
        rect: Math.random() > 0.45,
        duration: Math.random() * 3.5 + 2.5,
        delay: Math.random() * 3.5,
        drift: (Math.random() - 0.5) * 260,
        spin: Math.round(Math.random() * 600 + 360),
        color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
      };
    });
    setPieces(next);
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="signup-confetti"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.rect ? p.size * 1.2 : p.size}px`,
            background: p.color,
            borderRadius: p.rect ? '3px' : '50%',
            ['--duration' as string]: `${p.duration}s`,
            ['--delay' as string]: `${p.delay}s`,
            ['--drift' as string]: `${p.drift}px`,
            ['--spin' as string]: `${p.spin}deg`,
          }}
        />
      ))}
      <style>{`
        .signup-confetti {
          position: fixed;
          top: -10px;
          opacity: 0;
          animation: signup-confetti-fall var(--duration, 4s) var(--delay, 0s) ease-in forwards;
        }
        @keyframes signup-confetti-fall {
          0% { transform: translateY(-10px) translateX(0) rotate(0deg); opacity: 1; }
          30% { opacity: 1; }
          100% { transform: translateY(110vh) translateX(var(--drift, 0px)) rotate(var(--spin, 540deg)); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .signup-confetti { display: none; }
        }
      `}</style>
    </div>
  );
}
