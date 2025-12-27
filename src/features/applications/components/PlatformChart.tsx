import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, Cell } from 'recharts';
import { Globe } from 'lucide-react';
import type { PlatformMetrics } from '../hooks/useApplicationAnalytics';

interface PlatformChartProps {
  data: PlatformMetrics[];
}

const PLATFORM_COLORS = [
  'hsl(var(--primary))',
  'hsl(221 83% 53%)',
  'hsl(262 83% 58%)',
  'hsl(25 95% 53%)',
  'hsl(173 58% 39%)',
];

export function PlatformChart({ data }: PlatformChartProps) {
  if (data.length === 0) return null;

  const chartConfig = {
    interviewRate: {
      label: 'Interview Rate',
      color: 'hsl(221 83% 53%)',
    },
    offerRate: {
      label: 'Offer Rate',
      color: 'hsl(142 76% 36%)',
    },
  };

  const chartData = data.map((item, index) => ({
    platform: item.platform,
    interviewRate: item.interviewRate,
    offerRate: item.offerRate,
    total: item.total,
  }));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <Globe className="h-5 w-5 text-muted-foreground" />
        <CardTitle className="text-base font-semibold">Platform Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart data={chartData} margin={{ left: 0, right: 20 }}>
            <XAxis dataKey="platform" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(value) => `${value}%`} tick={{ fontSize: 11 }} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => [`${value}%`, name === 'interviewRate' ? 'Interview Rate' : 'Offer Rate']}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="interviewRate" fill="hsl(221 83% 53%)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="offerRate" fill="hsl(142 76% 36%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
        
        {/* Platform summary */}
        <div className="mt-4 grid gap-2">
          {data.map((item) => (
            <div 
              key={item.platform}
              className="flex items-center justify-between p-2 rounded-md bg-muted/50"
            >
              <span className="font-medium text-sm">{item.platform}</span>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-muted-foreground">{item.total} apps</span>
                <span className="text-blue-500">{item.reachedInterview} interviews</span>
                <span className="text-green-500">{item.reachedOffer} offers</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
