import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { Clock } from 'lucide-react';
import type { TimeInStatusMetrics } from '../hooks/useApplicationAnalytics';

interface TimeInStatusChartProps {
  data: TimeInStatusMetrics[];
}

const STATUS_COLORS: Record<string, string> = {
  Applied: 'hsl(var(--primary))',
  OA: 'hsl(221 83% 53%)',
  Interview: 'hsl(262 83% 58%)',
  Offer: 'hsl(142 76% 36%)',
  Accepted: 'hsl(142 76% 36%)',
  Rejected: 'hsl(var(--destructive))',
};

export function TimeInStatusChart({ data }: TimeInStatusChartProps) {
  if (data.length === 0) return null;

  const chartConfig = data.reduce((acc, item) => {
    acc[item.status] = {
      label: item.status,
      color: STATUS_COLORS[item.status] || 'hsl(var(--muted-foreground))',
    };
    return acc;
  }, {} as Record<string, { label: string; color: string }>);

  const chartData = data.map((item) => ({
    status: item.status,
    avgDays: item.avgDays,
    fill: STATUS_COLORS[item.status] || 'hsl(var(--muted-foreground))',
  }));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <Clock className="h-5 w-5 text-muted-foreground" />
        <CardTitle className="text-base font-semibold">Average Time in Status</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart data={chartData} layout="vertical" margin={{ left: 70, right: 20 }}>
            <XAxis type="number" tickFormatter={(value) => `${value}d`} />
            <YAxis 
              type="category" 
              dataKey="status" 
              tick={{ fontSize: 12 }}
              width={60}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => [`${value} days`, 'Avg. Time']}
                />
              }
            />
            <Bar dataKey="avgDays" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
        <div className="mt-4 space-y-2">
          {data.map((item) => (
            <div key={item.status} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="h-3 w-3 rounded-sm" 
                  style={{ backgroundColor: STATUS_COLORS[item.status] }}
                />
                <span className="text-muted-foreground">{item.status}</span>
              </div>
              <div className="text-right">
                <span className="font-medium">{item.avgDays}d</span>
                <span className="text-muted-foreground ml-2">
                  ({item.minDays}d - {item.maxDays}d)
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
