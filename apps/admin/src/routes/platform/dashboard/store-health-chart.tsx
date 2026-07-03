import type { PlatformSaudeLojas } from '@lojao/types';
import { testIds } from '@lojao/test-utils';
import { ChartCard, PLATFORM_HEALTH_CHART_COLORS, useChartTheme } from '@lojao/ui';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { healthLabel, usePrefersReducedMotion } from './chart-utils';

interface StoreHealthChartProps {
  data: PlatformSaudeLojas[];
}

export function StoreHealthChart({ data }: StoreHealthChartProps) {
  const animate = !usePrefersReducedMotion();
  const { tooltip } = useChartTheme('platform');
  const filtered = data.filter((item) => item.total > 0);

  return (
    <ChartCard
      surface="platform"
      title="Saúde das lojas"
      subtitle="Distribuição operacional atual"
      data-testid={testIds.platform.dashboardChartHealth}
    >
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={filtered}
            dataKey="total"
            nameKey="health"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={2}
            isAnimationActive={animate}
          >
            {filtered.map((entry) => (
              <Cell
                key={entry.health}
                fill={PLATFORM_HEALTH_CHART_COLORS[entry.health] ?? 'var(--platform-text-muted)'}
              />
            ))}
          </Pie>
          <Tooltip
            {...tooltip}
            formatter={(value, _name, item) => [
              Number(value ?? 0),
              healthLabel(String(item.payload?.health ?? '')),
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
