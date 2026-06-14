import type { ReactNode } from 'react';

export interface LayoutAdminProps {
  sidebar: ReactNode;
  children: ReactNode;
}

/** Layout base do admin: sidebar fixa (w-60) + área de conteúdo. */
export function LayoutAdmin({ sidebar, children }: LayoutAdminProps) {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {sidebar}
      <main className="ml-60 p-8">{children}</main>
    </div>
  );
}
