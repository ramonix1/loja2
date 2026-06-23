import type { ReceitaPorMetodo } from '@lojao/types/dashboard';
import { testIds } from '@lojao/test-utils';
import { ChartCard, useChartTheme } from '@lojao/ui';
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
  BRL_COMPACT,
  PAYMENT_COLORS,
  metodoLabel,
  usePrefersReducedMotion,
} from './chart-utils';

interface PaymentMethodsChartProps {
  data: ReceitaPorMetodo[];
}

export function PaymentMethodsChart({ data }: PaymentMethodsChartProps) {
  const animate = !usePrefersReducedMotion();
  const { axis, grid, tooltip } = useChartTheme('admin');
  const chartData = data.map((d) => ({ ...d, label: metodoLabel(d.metodo) }));

  return (
    <ChartCard
      title="Formas de pagamento"
      subtitle="Receita confirmada por método"
      data-testid={testIds.admin.dashboardChartPayment}
    >
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid {...grid} vertical={false} />
          <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} />
          <YAxis
            tickFormatter={(v: number) => BRL_COMPACT.format(v)}
            tick={axis}
            axisLine={false}
            tickLine={false}
            width={72}
          />
          <Tooltip
            {...tooltip}
            formatter={(value, _name, item) => [
              BRL.format(Number(value ?? 0)),
              `${item.payload?.label ?? ''} (${item.payload?.pedidos ?? 0} pedidos)`,
            ]}
          />
          <Bar dataKey="receita" radius={[4, 4, 0, 0]} isAnimationActive={animate}>
            {chartData.map((entry, i) => (
              <Cell key={entry.metodo} fill={PAYMENT_COLORS[i % PAYMENT_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
