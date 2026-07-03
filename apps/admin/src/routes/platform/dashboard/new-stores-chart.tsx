import type { PlatformLojasPorDia } from '@lojao/types';
import { testIds } from '@lojao/test-utils';
import { ChartCard, useChartTheme } from '@lojao/ui';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { formatChartDate, usePrefersReducedMotion } from './chart-utils';

interface NewStoresChartProps {
  data: PlatformLojasPorDia[];
}

export function NewStoresChart({ data }: NewStoresChartProps) {
  const animate = !usePrefersReducedMotion();
  const { axis, grid, tooltip } = useChartTheme('platform');

  return (
    <ChartCard
      surface="platform"
      title="Novas lojas"
      subtitle="Provisionamentos por dia"
      data-testid={testIds.platform.dashboardChartNewStores}
    >
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="platformNewStoresGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--platform-accent)" stopOpacity={0.35} />
              <stop offset="95%" stopColor="var(--platform-accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...grid} vertical={false} />
          <XAxis
            dataKey="dia"
            tickFormatter={formatChartDate}
            tick={axis}
            axisLine={false}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            allowDecimals={false}
            tick={axis}
            axisLine={false}
            tickLine={false}
            width={32}
          />
          <Tooltip
            {...tooltip}
            formatter={(value) => [Number(value ?? 0), 'Lojas']}
            labelFormatter={(label) => formatChartDate(String(label))}
          />
          <Area
            type="monotone"
            dataKey="lojas"
            stroke="var(--platform-accent)"
            fill="url(#platformNewStoresGradient)"
            strokeWidth={2}
            isAnimationActive={animate}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
