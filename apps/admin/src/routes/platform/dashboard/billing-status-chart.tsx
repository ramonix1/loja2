import type { PlatformBillingStatus } from '@lojao/types';
import { testIds } from '@lojao/test-utils';
import { ChartCard, PLATFORM_BILLING_CHART_COLORS, useChartTheme } from '@lojao/ui';
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

import { billingStatusLabel, usePrefersReducedMotion } from './chart-utils';

interface BillingStatusChartProps {
  data: PlatformBillingStatus[];
}

export function BillingStatusChart({ data }: BillingStatusChartProps) {
  const animate = !usePrefersReducedMotion();
  const { axis, grid, tooltip } = useChartTheme('platform');

  return (
    <ChartCard
      surface="platform"
      title="Merchants por billing"
      subtitle="Status de assinatura SaaS"
      data-testid={testIds.platform.dashboardChartBilling}
    >
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid {...grid} horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={axis} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="status"
            tickFormatter={billingStatusLabel}
            tick={axis}
            axisLine={false}
            tickLine={false}
            width={96}
          />
          <Tooltip
            {...tooltip}
            formatter={(value) => [Number(value ?? 0), 'Merchants']}
            labelFormatter={(label) => billingStatusLabel(String(label))}
          />
          <Bar dataKey="total" radius={[0, 4, 4, 0]} isAnimationActive={animate}>
            {data.map((entry) => (
              <Cell
                key={entry.status}
                fill={
                  PLATFORM_BILLING_CHART_COLORS[entry.status] ??
                  'var(--platform-accent)'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
