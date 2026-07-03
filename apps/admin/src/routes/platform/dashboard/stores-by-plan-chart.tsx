import type { PlatformLojasPorPlano } from '@lojao/types';
import { testIds } from '@lojao/test-utils';
import { ChartCard, PLATFORM_PLAN_CHART_COLORS, useChartTheme } from '@lojao/ui';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { planLabel, usePrefersReducedMotion } from './chart-utils';

interface StoresByPlanChartProps {
  data: PlatformLojasPorPlano[];
}

export function StoresByPlanChart({ data }: StoresByPlanChartProps) {
  const animate = !usePrefersReducedMotion();
  const { axis, grid, tooltip } = useChartTheme('platform');

  return (
    <ChartCard
      surface="platform"
      title="Lojas por plano"
      subtitle="Mix de planos na plataforma"
      data-testid={testIds.platform.dashboardChartPlans}
    >
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid {...grid} vertical={false} />
          <XAxis
            dataKey="plano"
            tickFormatter={planLabel}
            tick={axis}
            axisLine={false}
            tickLine={false}
          />
          <YAxis allowDecimals={false} tick={axis} axisLine={false} tickLine={false} width={32} />
          <Tooltip
            {...tooltip}
            formatter={(value) => [Number(value ?? 0), 'Lojas']}
            labelFormatter={(label) => planLabel(String(label))}
          />
          <Bar dataKey="total" radius={[4, 4, 0, 0]} isAnimationActive={animate}>
            {data.map((entry) => (
              <Cell
                key={entry.plano}
                fill={PLATFORM_PLAN_CHART_COLORS[entry.plano] ?? 'var(--platform-accent)'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
