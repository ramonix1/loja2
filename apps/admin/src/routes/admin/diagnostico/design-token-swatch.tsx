import { Button, Card, Switch, adminMutedClass, cn } from '@lojao/ui';
import { testIds } from '@lojao/test-utils';
import { useState } from 'react';

const ADMIN_TOKENS = [
  { token: '--admin-bg', label: 'Fundo app' },
  { token: '--admin-surface', label: 'Superfície' },
  { token: '--admin-border', label: 'Borda' },
  { token: '--admin-text', label: 'Texto' },
  { token: '--admin-text-muted', label: 'Texto muted' },
  { token: '--admin-accent', label: 'CTA / accent' },
  { token: '--admin-input-bg', label: 'Input fundo' },
  { token: '--admin-sidebar-bg', label: 'Sidebar' },
  { token: '--admin-success', label: 'Sucesso' },
  { token: '--admin-error', label: 'Erro' },
  { token: '--admin-chart-grid', label: 'Grid gráfico' },
] as const;

export function DesignTokenSwatch() {
  const [demoOn, setDemoOn] = useState(true);

  return (
    <Card
      className="mb-8 max-w-3xl"
      data-testid={testIds.adminDiagnostico.tokenSwatch}
    >
      <h2 className="mb-1 text-base font-bold text-[var(--admin-text)]">Design tokens (admin)</h2>
      <p className={cn('mb-4 text-sm', adminMutedClass())}>
        Swatch visual — validação Fase 1. Toggle abaixo usa <code className="text-xs">Switch</code>{' '}
        com tokens semânticos.
      </p>

      <div className="mb-4 flex items-center gap-3">
        <Switch
          checked={demoOn}
          onChange={setDemoOn}
          label="Demo switch"
          surface="admin"
          testId={testIds.adminDiagnostico.tokenSwatchSwitch}
        />
        <span className={adminMutedClass('text-sm')}>{demoOn ? 'Ligado' : 'Desligado'}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {ADMIN_TOKENS.map(({ token, label }) => (
          <div
            key={token}
            className="overflow-hidden rounded-lg border border-[var(--admin-border)]"
          >
            <div className="h-12" style={{ backgroundColor: `var(${token})` }} />
            <div className="px-2 py-1.5">
              <p className="text-xs font-medium text-[var(--admin-text)]">{label}</p>
              <p className={cn('truncate font-mono text-[10px]', adminMutedClass())}>{token}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="primary" surface="admin">
          Primary
        </Button>
        <Button variant="secondary" surface="admin">
          Secondary
        </Button>
        <Button variant="ghost" surface="admin">
          Ghost
        </Button>
      </div>
    </Card>
  );
}
