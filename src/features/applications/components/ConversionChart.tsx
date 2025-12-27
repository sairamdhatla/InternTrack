import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, Cell } from 'recharts';
import { TrendingDown } from 'lucide-react';
import type { FunnelMetrics } from '../hooks/useApplicationAnalytics';

interface ConversionChartProps {
  data: FunnelMetrics[];
}

const FUNNEL_COLORS = [
  'hsl(var(--primary))',
  'hsl(221 83% 53%)',
  'hsl(262 83% 58%)',
  'hsl(142 76% 36%)',
  'hsl(142 76% 36%)',
];

export function ConversionChart({ data }: ConversionChartProps) {
  if (data.length === 0 || data[0].count === 0) return null;

  const chartConfig = data.reduce((acc, item, index) => {
    acc[item.stage] = {
      label: item.stage,
      color: FUNNEL_COLORS[index] || 'hsl(var(--muted-foreground))',
    };
    return acc;
  }, {} as Record<string, { label: string; color: string }>);

  const chartData = data.map((item, index) => ({
    stage: item.stage,
    count: item.count,
    percentage: item.percentage,
    fill: FUNNEL_COLORS[index] || 'hsl(var(--muted-foreground))',
  }));

  // Calculate drop-off rates
  const dropOffRates = data.slice(1).map((item, index) => {
    const prev = data[index];
    const dropOff = prev.count > 0 ? Math.round(((prev.count - item.count) / prev.count) * 100) : 0;
    return {
      from: prev.stage,
      to: item.stage,
      dropOff,
    };
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <TrendingDown className="h-5 w-5 text-muted-foreground" />
        <CardTitle className="text-base font-semibold">Conversion Funnel</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart data={chartData} margin={{ left: 0, right: 20 }}>
            <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name, props) => [
                    `${value} (${props.payload.percentage}%)`,
                    'Applications',
                  ]}
                />
              }
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
        
        {/* Drop-off indicators */}
        <div className="mt-4 flex flex-wrap gap-2">
          {dropOffRates.map((rate) => (
            <div 
              key={`${rate.from}-${rate.to}`}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-xs"
            >
              <span className="text-muted-foreground">{rate.from} → {rate.to}:</span>
              <span className={rate.dropOff > 50 ? 'text-destructive font-medium' : 'font-medium'}>
                -{rate.dropOff}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
