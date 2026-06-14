import type { ReceitaPorDia } from '@lojao/types/dashboard';
import { testIds } from '@lojao/test-utils';
import { ChartCard } from '@lojao/ui';
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
  CHART_AXIS,
  CHART_GRID,
  formatChartDate,
  tooltipStyle,
  usePrefersReducedMotion,
} from './chart-utils';

interface RevenueChartProps {
  data: ReceitaPorDia[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  const animate = !usePrefersReducedMotion();

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
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...CHART_GRID} vertical={false} />
          <XAxis
            dataKey="dia"
            tickFormatter={formatChartDate}
            tick={CHART_AXIS}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v: number) => BRL_COMPACT.format(v)}
            tick={CHART_AXIS}
            axisLine={false}
            tickLine={false}
            width={72}
          />
          <Tooltip
            {...tooltipStyle}
            formatter={(value) => [BRL.format(Number(value ?? 0)), 'Receita']}
            labelFormatter={(label) => formatChartDate(String(label))}
          />
          <Area
            type="monotone"
            dataKey="receita"
            stroke="#22c55e"
            fill="url(#revenueGradient)"
            strokeWidth={2}
            isAnimationActive={animate}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
