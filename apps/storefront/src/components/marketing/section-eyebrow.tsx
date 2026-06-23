interface SectionEyebrowProps {
  children: React.ReactNode;
  className?: string;
  light?: boolean;
}

export function SectionEyebrow({ children, className = '', light = false }: SectionEyebrowProps) {
  return (
    <span
      className={`text-[10px] font-semibold tracking-[0.22em] uppercase ${
        light ? 'text-verde-broto' : 'text-verde-broto'
      } ${className}`}
    >
      {children}
    </span>
  );
}
