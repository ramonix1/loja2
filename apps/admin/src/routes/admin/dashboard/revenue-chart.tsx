import type { ReceitaPorDia } from '@lojao/types/dashboard';
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

import {
  BRL,
  BRL_COMPACT,
  formatChartDate,
  usePrefersReducedMotion,
} from './chart-utils';

interface RevenueChartProps {
  data: ReceitaPorDia[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  const animate = !usePrefersReducedMotion();
  const { axis, grid, tooltip } = useChartTheme('admin');

  return (
    <ChartCard
      title="Receita confirmada"
      subtitle="Pedidos pagos por dia"
      data-testid={testIds.admin.dashboardChartRevenue}
    >
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--admin-success)" stopOpacity={0.35} />
              <stop offset="95%" stopColor="var(--admin-success)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...grid} vertical={false} />
          <XAxis
            dataKey="dia"
            tickFormatter={formatChartDate}
            tick={axis}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v: number) => BRL_COMPACT.format(v)}
            tick={axis}
            axisLine={false}
            tickLine={false}
            width={72}
          />
          <Tooltip
            {...tooltip}
            formatter={(value) => [BRL.format(Number(value ?? 0)), 'Receita']}
            labelFormatter={(label) => formatChartDate(String(label))}
          />
          <Area
            type="monotone"
            dataKey="receita"
            stroke="var(--admin-success)"
            fill="url(#revenueGradient)"
            strokeWidth={2}
            isAnimationActive={animate}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
