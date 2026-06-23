import type { ReactNode } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from './button';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  surface?: 'admin' | 'platform';
}

/** Diálogo de confirmação (Radix Dialog — foco preso, ESC fecha). */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = false,
  loading = false,
  onConfirm,
  surface = 'admin',
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={!loading}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="secondary"
            surface={surface}
            disabled={loading}
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={destructive ? 'ghost' : 'primary'}
            surface={surface}
            disabled={loading}
            className={
              destructive
                ? surface === 'platform'
                  ? 'text-[var(--platform-error)] hover:bg-[var(--platform-error-bg)]'
                  : 'text-[var(--admin-error-text)] hover:bg-[var(--admin-error-bg)]'
                : undefined
            }
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {loading ? 'Aguarde…' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
