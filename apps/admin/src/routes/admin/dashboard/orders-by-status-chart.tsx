import type { PedidosPorStatus } from '@lojao/types/dashboard';
import { testIds } from '@lojao/test-utils';
import { ChartCard, useChartTheme } from '@lojao/ui';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { STATUS_CHART_COLORS, statusLabel, usePrefersReducedMotion } from './chart-utils';

interface OrdersByStatusChartProps {
  data: PedidosPorStatus[];
}

export function OrdersByStatusChart({ data }: OrdersByStatusChartProps) {
  const animate = !usePrefersReducedMotion();
  const { tooltip } = useChartTheme('admin');

  return (
    <ChartCard
      title="Pedidos por status"
      subtitle="Distribuição no período"
      data-testid={testIds.admin.dashboardChartStatus}
    >
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            dataKey="total"
            nameKey="status"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={2}
            isAnimationActive={animate}
          >
            {data.map((entry) => (
              <Cell
                key={entry.status}
                fill={STATUS_CHART_COLORS[entry.status] ?? 'var(--ata-cinza-pedra)'}
              />
            ))}
          </Pie>
          <Tooltip
            {...tooltip}
            formatter={(value, _name, item) => [
              Number(value ?? 0),
              statusLabel(String(item.payload?.status ?? '')),
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
