'use client';

import { Fragment, type ReactNode } from 'react';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import type { PanelSurface } from '../surface';

export interface CommandPaletteItem {
  id: string;
  label: string;
  icon?: ReactNode;
  /** Termos extras para casar na busca (ex.: sinônimos, slug da rota). */
  keywords?: ReadonlyArray<string>;
  onSelect: () => void;
}

export interface CommandPaletteGroup {
  id: string;
  heading: string;
  items: ReadonlyArray<CommandPaletteItem>;
}

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: ReadonlyArray<CommandPaletteGroup>;
  /** Painel ativo — portais Radix recebem data-ui-surface para tokens shadcn corretos. */
  surface?: PanelSurface;
  placeholder?: string;
  emptyMessage?: string;
}

/** Busca rápida global (⌘K / Ctrl+K) — composição igual ao exemplo scrollable do shadcn/ui. */
export function CommandPalette({
  open,
  onOpenChange,
  groups,
  surface = 'admin',
  placeholder = 'Buscar página ou ação…',
  emptyMessage = 'Nenhum resultado encontrado.',
}: CommandPaletteProps) {
  function handleSelect(action: () => void) {
    onOpenChange(false);
    action();
  }

  const visibleGroups = groups.filter((group) => group.items.length > 0);

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      surface={surface}
      title="Busca rápida"
      description={placeholder}
      showCloseButton={false}
      data-testid="command-palette"
    >
      <CommandInput
        placeholder={placeholder}
        autoFocus
        data-testid="command-palette-input"
      />
      <CommandList>
        <CommandEmpty data-testid="command-palette-empty">{emptyMessage}</CommandEmpty>
        {visibleGroups.map((group, index) => (
          <Fragment key={group.id}>
            {index > 0 ? <CommandSeparator /> : null}
            <CommandGroup heading={group.heading}>
              {group.items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={[item.label, ...(item.keywords ?? [])].join(' ')}
                  onSelect={() => handleSelect(item.onSelect)}
                  data-testid={`command-palette-item-${item.id}`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </Fragment>
        ))}
      </CommandList>
    </CommandDialog>
  );
}

/**
 * Hook do atalho global ⌘K / Ctrl+K. Ignora quando o foco está em campos de
 * texto (exceto o próprio input da paleta, que já está fechado nesse ponto).
 */
export function isCommandPaletteShortcut(event: KeyboardEvent): boolean {
  return (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
}
