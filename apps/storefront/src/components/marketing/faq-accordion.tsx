'use client';

import { useState } from 'react';

export interface FaqItem {
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
  className?: string;
  /** Cor do ícone e detalhe (padrão verde-broto). */
  accentColor?: string;
}

export function FaqAccordion({
  items,
  className = '',
  accentColor = '#639922',
}: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function toggle(idx: number) {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  }

  return (
    <div className={`divide-y divide-cinza-areia ${className}`}>
      {items.map((item, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div key={idx}>
            <button
              type="button"
              onClick={() => toggle(idx)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 py-5 text-left"
            >
              <span className="font-semibold text-verde-conde">{item.question}</span>
              <svg
                className="h-5 w-5 shrink-0 transition-transform duration-300"
                style={{
                  color: accentColor,
                  transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                }}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <div
              className="overflow-hidden transition-all duration-300"
              style={{ maxHeight: isOpen ? '500px' : '0px', opacity: isOpen ? 1 : 0 }}
            >
              <p className="pb-5 text-sm leading-relaxed text-cinza-pedra">{item.answer}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
