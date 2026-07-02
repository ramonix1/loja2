import { IconButton, type IconButtonSize, cn } from '@lojao/ui';
import type { UiSurface } from '@lojao/ui';
import { ActionIcons } from '@lojao/ui/icons';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

type CrudSurface = Extract<UiSurface, 'admin' | 'platform'>;

interface BaseCrudProps {
  testId?: string;
  surface?: CrudSurface;
  disabled?: boolean;
  size?: IconButtonSize;
  className?: string;
}

export function ViewIconButton({
  href,
  to,
  external,
  onClick,
  label = 'Ver',
  ...rest
}: BaseCrudProps & {
  href?: string;
  to?: string;
  external?: boolean;
  onClick?: () => void;
  label?: string;
}) {
  const navigate = useNavigate();
  const Icon = ActionIcons.view;
  if (href) {
    return (
      <IconButton
        icon={<Icon />}
        label={label}
        href={href}
        external={external}
        variant="ghost"
        size="md"
        {...rest}
      />
    );
  }
  return (
    <IconButton
      icon={<Icon />}
      label={label}
      onClick={to ? () => navigate(to) : onClick}
      variant="ghost"
      size="md"
      {...rest}
    />
  );
}

export function EditIconButton({
  to,
  onClick,
  label = 'Editar',
  ...rest
}: BaseCrudProps & { to?: string; onClick?: () => void; label?: string }) {
  const navigate = useNavigate();
  const Icon = ActionIcons.edit;
  return (
    <IconButton
      icon={<Icon />}
      label={label}
      onClick={to ? () => navigate(to) : onClick}
      variant="ghost"
      size="md"
      {...rest}
    />
  );
}

export function DeleteIconButton({
  onClick,
  label = 'Excluir',
  ...rest
}: BaseCrudProps & { onClick?: () => void; label?: string }) {
  const Icon = ActionIcons.delete;
  return (
    <IconButton
      icon={<Icon />}
      label={label}
      onClick={onClick}
      variant="destructive"
      size="md"
      {...rest}
    />
  );
}

export function SaveIconButton({
  onClick,
  type = 'button',
  label = 'Salvar',
  ...rest
}: BaseCrudProps & { onClick?: () => void; type?: 'button' | 'submit'; label?: string }) {
  const Icon = ActionIcons.save;
  return (
    <IconButton
      icon={<Icon />}
      label={label}
      onClick={onClick}
      type={type}
      variant="ghost"
      size="md"
      {...rest}
    />
  );
}

/** Ativar / desativar / suspender — ícone alterna conforme estado. */
export function ToggleActiveIconButton({
  active,
  onClick,
  activeLabel = 'Desativar',
  inactiveLabel = 'Ativar',
  ...rest
}: BaseCrudProps & {
  active: boolean;
  onClick?: () => void;
  activeLabel?: string;
  inactiveLabel?: string;
}) {
  const label = active ? activeLabel : inactiveLabel;
  const Icon = active ? ActionIcons.close : ActionIcons.save;
  return (
    <IconButton
      icon={<Icon />}
      label={label}
      onClick={onClick}
      variant="ghost"
      size="md"
      {...rest}
    />
  );
}

export function PrevIconButton({
  onClick,
  label = 'Anterior',
  ...rest
}: BaseCrudProps & { onClick?: () => void; label?: string }) {
  const Icon = ActionIcons.prev;
  return (
    <IconButton
      icon={<Icon />}
      label={label}
      onClick={onClick}
      variant="ghost"
      size="md"
      {...rest}
    />
  );
}

export function NextIconButton({
  onClick,
  label = 'Próxima',
  ...rest
}: BaseCrudProps & { onClick?: () => void; label?: string }) {
  const Icon = ActionIcons.next;
  return (
    <IconButton
      icon={<Icon />}
      label={label}
      onClick={onClick}
      variant="ghost"
      size="md"
      {...rest}
    />
  );
}

/** Trash compacto sobre preview de imagem (produtos create/edit). */
export function ImageRemoveIconButton({
  onClick,
  label = 'Remover imagem',
  className,
  ...rest
}: BaseCrudProps & { onClick?: () => void; label?: string }) {
  const Icon = ActionIcons.delete;
  return (
    <IconButton
      icon={<Icon />}
      label={label}
      onClick={onClick}
      variant="destructive"
      size="md"
      className={cn(
        'absolute -right-1 -top-1 min-h-8 min-w-8 text-base opacity-100 sm:opacity-0 sm:group-hover:opacity-100',
        className,
      )}
      {...rest}
    />
  );
}

/** Link de voltar com ícone + texto (D8: texto reduz ambiguidade). */
export function BackLink({
  to,
  children,
  testId,
  className,
}: {
  to: string;
  children: ReactNode;
  testId?: string;
  className?: string;
}) {
  const Icon = ActionIcons.back;
  const navigate = useNavigate();
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={() => navigate(to)}
      className={cn(
        'inline-flex min-h-11 touch-manipulation items-center gap-2 text-sm text-[var(--admin-link)] hover:underline',
        className,
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      {children}
    </button>
  );
}

export function PlatformBackLink({
  to,
  children,
  testId,
  className,
}: {
  to: string;
  children: ReactNode;
  testId?: string;
  className?: string;
}) {
  const Icon = ActionIcons.back;
  const navigate = useNavigate();
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={() => navigate(to)}
      className={cn(
        'inline-flex min-h-11 touch-manipulation items-center gap-2 text-sm text-[var(--platform-link)] hover:underline',
        className,
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      {children}
    </button>
  );
}
