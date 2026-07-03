import { cn } from './cn';

/** Classes base do shadcn Input — https://ui.shadcn.com/docs/components/radix/input */
export function inputControlClass(className?: string) {
  return cn(
    'h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30',
    'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
    'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
    className,
  );
}

/** Classes base do shadcn Textarea. */
export function textareaControlClass(className?: string) {
  return cn(
    'flex field-sizing-content min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:ring-destructive/40',
    className,
  );
}

/** Classes base do shadcn SelectTrigger — https://ui.shadcn.com/docs/components/radix/select */
export function selectTriggerControlClass(className?: string) {
  return cn(
    'flex w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[placeholder]:text-muted-foreground h-9 min-h-9 dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:ring-destructive/40',
    className,
  );
}

/** Select nativo estilizado como SelectTrigger shadcn. */
export function nativeSelectControlClass(className?: string) {
  return cn(
    selectTriggerControlClass(),
    'cursor-pointer appearance-none bg-size-[1rem] bg-position-[right_0.75rem_center] bg-no-repeat pr-9',
    "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%236b7280%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27m6 9 6 6 6-6%27/%3E%3C/svg%3E')]",
    className,
  );
}

/** Mobile-first (~44px) — complemento aos controles shadcn. */
export const mobileControlExtras =
  'min-h-11 touch-manipulation md:min-h-9 md:h-9';

/** Formato pill na vitrine tenant. */
export const storeControlShape = 'rounded-[var(--store-radius-pill)]';

/** Tokens explícitos da vitrine — evita aparência de input/select nativo (bg-transparent). */
export const storeSurfaceControlExtras =
  'bg-[var(--store-input-bg)] text-[var(--store-text)] placeholder:text-[var(--store-text-subtle)]';
