import type { TopProdutoChart } from '@lojao/types/dashboard';
import { testIds } from '@lojao/test-utils';
import { ChartCard } from '@lojao/ui';
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

import {
  BRL,
  CHART_AXIS,
  CHART_GRID,
  PAYMENT_COLORS,
  tooltipStyle,
  usePrefersReducedMotion,
} from './chart-utils';

interface TopProductsChartProps {
  data: TopProdutoChart[];
}

export function TopProductsChart({ data }: TopProductsChartProps) {
  const animate = !usePrefersReducedMotion();
  const chartData = data.map((d) => ({
    ...d,
    label: d.nome.length > 22 ? `${d.nome.slice(0, 20)}…` : d.nome,
  }));

  return (
    <ChartCard
      title="Top 5 produtos"
      subtitle="Por quantidade vendida"
      data-testid={testIds.admin.dashboardChartTopProducts}
    >
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
        >
          <CartesianGrid {...CHART_GRID} horizontal={false} />
          <XAxis type="number" tick={CHART_AXIS} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="label"
            tick={CHART_AXIS}
            axisLine={false}
            tickLine={false}
            width={100}
          />
          <Tooltip
            {...tooltipStyle}
            formatter={(value, _name, item) => [
              `${Number(value ?? 0)} un. · ${BRL.format(Number(item.payload?.receita ?? 0))}`,
              String(item.payload?.nome ?? ''),
            ]}
          />
          <Bar dataKey="quantidade" radius={[0, 4, 4, 0]} isAnimationActive={animate}>
            {chartData.map((entry, i) => (
              <Cell key={entry.nome} fill={PAYMENT_COLORS[i % PAYMENT_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
