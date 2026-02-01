"use client"

import * as React from "react"
import { Area, AreaChart, Bar, BarChart, Line, LineChart, CartesianGrid, XAxis, YAxis, LabelList, Tooltip, Legend } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export const description = "Pencapaian Analytics Monthly Chart"

const chartConfig = {
  Target: {
    label: "Target",
    color: "hsl(210, 80%, 50%)",  // Blue
  },
  Pencapaian: {
    label: "Pencapaian",
    color: "hsl(142, 76%, 36%)",  // Green
  },
} satisfies ChartConfig

// Custom Tooltip Content
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    // Calculate percentage if both target and pencapaian are present
    const targetEntry = payload.find((p: any) => p.name === 'Target');
    const pencapaianEntry = payload.find((p: any) => p.name === 'Pencapaian');

    let percentage = null;
    if (targetEntry && pencapaianEntry && targetEntry.value > 0) {
      percentage = ((pencapaianEntry.value / targetEntry.value) * 100).toFixed(1);
    }

    return (
      <div className="bg-background border rounded-lg shadow-lg p-2 sm:p-3">
        <p className="font-semibold text-xs sm:text-sm mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-xs sm:text-sm">
            <div
              className="w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="font-medium">{entry.name}:</span>
            <span className="font-bold">Rp {entry.value.toLocaleString('id-ID')}</span>
          </div>
        ))}
        {percentage && (
          <div className="mt-2 pt-2 border-t text-xs sm:text-sm">
            <span className="font-bold text-green-600 dark:text-green-400">
              Pencapaian: {percentage}%
            </span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

interface ChartCardPencapaianMonthlyProps {
  title: string
  data: any[]
  statusColor: string
  chartType?: string
  isFullWidth?: boolean
}

function ChartCardPencapaianMonthly({
  title,
  data,
  statusColor,
  chartType = 'area',
  isFullWidth = false
}: ChartCardPencapaianMonthlyProps) {
  // Month names for chart
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Get color based on statusColor prop
  const getStatusColorValue = () => {
    switch (statusColor) {
      case 'green': return 'hsl(142, 76%, 36%)';  // Green
      case 'red': return 'hsl(0, 84%, 60%)';      // Red
      case 'orange': return 'hsl(25, 95%, 53%)';   // Orange
      case 'blue': return 'hsl(210, 80%, 50%)';    // Blue
      case 'gray': return 'hsl(220, 10%, 40%)';    // Gray
      default: return 'hsl(142, 76%, 36%)';        // Default Green
    }
  };

  const chartColor = getStatusColorValue();

  // Process data for chart - group by month and separate Target vs Pencapaian
  const getChartData = () => {
    if (!data || data.length === 0) {
      return monthNames.map(month => ({ month, target: 0, pencapaian: 0 }));
    }

    // Initialize data for all months
    const monthlyData: { [key: string]: { target: number; pencapaian: number } } = {};
    monthNames.forEach(month => {
      monthlyData[month] = { target: 0, pencapaian: 0 };
    });

    // Group by month and separate Target vs Pencapaian
    data.forEach(item => {
      // Extract month from bulanExpDate
      let monthIndex = 0;
      const bulanExp = item.bulanExpDate || '';

      // Try to parse as number first (1-12)
      const bulanNum = parseInt(bulanExp);
      if (!isNaN(bulanNum) && bulanNum >= 1 && bulanNum <= 12) {
        monthIndex = bulanNum - 1;
      } else {
        // Try to parse as month name
        const monthMap: { [key: string]: number } = {
          'januari': 0, 'jan': 0, 'februari': 1, 'feb': 1, 'maret': 2, 'mar': 2,
          'april': 3, 'apr': 3, 'mei': 4, 'may': 4, 'juni': 5, 'jun': 5,
          'juli': 6, 'jul': 6, 'agustus': 7, 'aug': 7, 'september': 8, 'sep': 8,
          'oktober': 9, 'oct': 9, 'november': 10, 'nov': 10, 'desember': 11, 'dec': 11
        };
        monthIndex = monthMap[bulanExp.toLowerCase()] || 0;
      }

      const monthName = monthNames[monthIndex];

      // Check if this is Target or Pencapaian based on picCrm or sales field
      const isTarget = item.picCrm === 'Target' || item.sales === 'Target' || item.status === 'TARGET';
      const isPencapaian = item.picCrm === 'Pencapaian' || item.sales === 'Pencapaian' || item.status === 'PENCAPAIAN';

      // Add to corresponding series
      if (isTarget) {
        monthlyData[monthName].target += item.hargaKontrak || 0;
      } else if (isPencapaian) {
        monthlyData[monthName].pencapaian += item.hargaKontrak || 0;
      }
    });

    // Convert to array with percentage
    const chartData = monthNames.map(month => {
      const target = monthlyData[month].target;
      const pencapaian = monthlyData[month].pencapaian;
      const percentage = target > 0 ? ((pencapaian / target) * 100).toFixed(1) : '0.0';

      return {
        month,
        target,
        pencapaian,
        percentage
      };
    });

    return chartData;
  };

  const chartData = getChartData();

  // Determine background gradient based on status color
  const getBackgroundGradient = () => {
    if (statusColor === 'green') {
      return 'bg-gradient-to-br from-green-500/20 via-green-400/10 to-transparent';
    } else if (statusColor === 'red') {
      return 'bg-gradient-to-br from-red-500/20 via-red-400/10 to-transparent';
    } else if (statusColor === 'orange') {
      return 'bg-gradient-to-br from-orange-500/20 via-orange-400/10 to-transparent';
    } else if (statusColor === 'blue') {
      return 'bg-gradient-to-br from-blue-500/20 via-blue-400/10 to-transparent';
    } else if (statusColor === 'gray') {
      return 'bg-gradient-to-br from-gray-500/20 via-gray-400/10 to-transparent';
    }
    return 'bg-gradient-to-br from-green-500/20 via-green-400/10 to-transparent';
  };

  const hasData = chartData.length > 0 && chartData.some(item => item.target > 0 || item.pencapaian > 0);

  // Calculate totals and percentage
  const totalTarget = chartData.reduce((sum, item) => sum + item.target, 0);
  const totalPencapaian = chartData.reduce((sum, item) => sum + item.pencapaian, 0);
  const achievementPercentage = totalTarget > 0 ? Math.round((totalPencapaian / totalTarget) * 100) : 0;

  return (
    <Card className="@container/card relative overflow-hidden">
      {/* Futuristic background overlay */}
      <div className={`absolute inset-0 ${getBackgroundGradient()} opacity-60`}></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 via-transparent to-purple-500/5"></div>

      <CardHeader className="relative z-10 pb-1 sm:pb-2">
        <CardTitle className="text-[10px] sm:text-xs font-semibold text-center">{title}</CardTitle>
        <CardDescription className="text-[9px] sm:text-[10px] text-center space-y-0.5 sm:space-y-1">
          <div className="font-medium text-black/70 text-[8px] sm:text-[9px]">
            Target: Rp {totalTarget.toLocaleString('id-ID')} | Pencapaian: Rp {totalPencapaian.toLocaleString('id-ID')}
          </div>
          <div className={`text-sm sm:text-xl font-extrabold ${achievementPercentage >= 90 ? 'text-green-600' : achievementPercentage >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
            {achievementPercentage}%
          </div>
        </CardDescription>
      </CardHeader>

      <CardContent className="px-0.5 sm:px-2 pt-0.5 sm:pt-2 relative z-10">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[160px] sm:h-[220px] md:h-[250px] w-full"
        >
          {(() => {
            if (!hasData) {
              return (
                <div className="h-full w-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-muted-foreground text-sm">No data available</div>
                  </div>
                </div>
              );
            }

            switch (chartType) {
              case 'bar':
                return (
                  <BarChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={4}
                      minTickGap={15}
                      tick={{ fontSize: 9 }}
                      className="fill-muted-foreground"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={6}
                      tick={{ fontSize: 8 }}
                      className="fill-muted-foreground"
                      domain={[0, 'dataMax']}
                      width={45}
                    />
                    <ChartTooltip
                      cursor={true}
                      content={<CustomTooltip />}
                    />
                    <Legend />
                    <Bar dataKey="target" fill="hsl(210, 80%, 50%)" radius={[4, 4, 0, 0]} name="Target">
                      <LabelList
                        dataKey="target"
                        position="top"
                        fontSize={isFullWidth ? 13 : 8}
                        fontWeight="bold"
                        className="hidden sm:inline"
                        fill="hsl(210, 80%, 50%)"
                        formatter={(value: number) => {
                          if (value === 0) return '';
                          // Format in millions
                          if (value >= 1000000000) {
                            return `${(value / 1000000000).toFixed(1)}M`;
                          } else if (value >= 1000000) {
                            return `${(value / 1000000).toFixed(0)}Jt`;
                          }
                          return value.toLocaleString('id-ID');
                        }}
                      />
                    </Bar>
                    <Bar dataKey="pencapaian" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} name="Pencapaian">
                      <LabelList
                        dataKey="pencapaian"
                        position="top"
                        fontSize={isFullWidth ? 13 : 8}
                        fontWeight="bold"
                        className="hidden sm:inline"
                        fill="hsl(142, 76%, 36%)"
                        formatter={(value: number) => {
                          if (value === 0) return '';
                          // Format in millions
                          if (value >= 1000000000) {
                            return `${(value / 1000000000).toFixed(1)}M`;
                          } else if (value >= 1000000) {
                            return `${(value / 1000000).toFixed(0)}Jt`;
                          }
                          return value.toLocaleString('id-ID');
                        }}
                      />
                    </Bar>
                  </BarChart>
                );

              case 'line':
                return (
                  <LineChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={4}
                      minTickGap={15}
                      tick={{ fontSize: 9 }}
                      className="fill-muted-foreground"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={6}
                      tick={{ fontSize: 8 }}
                      className="fill-muted-foreground"
                      domain={[0, 'dataMax']}
                      width={45}
                    />
                    <ChartTooltip
                      cursor={true}
                      content={<CustomTooltip />}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="target"
                      stroke="hsl(210, 80%, 50%)"
                      strokeWidth={2}
                      dot={{ fill: "hsl(210, 80%, 50%)", strokeWidth: 1.5, r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Target"
                    >
                      <LabelList
                        dataKey="target"
                        position="top"
                        fontSize={isFullWidth ? 13 : 8}
                        fontWeight="bold"
                        className="hidden sm:inline"
                        fill="hsl(210, 80%, 50%)"
                        formatter={(value: number) => {
                          if (value === 0) return '';
                          if (value >= 1000000000) {
                            return `${(value / 1000000000).toFixed(1)}M`;
                          } else if (value >= 1000000) {
                            return `${(value / 1000000).toFixed(0)}Jt`;
                          }
                          return value.toLocaleString('id-ID');
                        }}
                      />
                    </Line>
                    <Line
                      type="monotone"
                      dataKey="pencapaian"
                      stroke="hsl(142, 76%, 36%)"
                      strokeWidth={2}
                      dot={{ fill: "hsl(142, 76%, 36%)", strokeWidth: 1.5, r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Pencapaian"
                    >
                      <LabelList
                        dataKey="pencapaian"
                        position="top"
                        fontSize={isFullWidth ? 13 : 8}
                        fontWeight="bold"
                        className="hidden sm:inline"
                        fill="hsl(142, 76%, 36%)"
                        formatter={(value: number) => {
                          if (value === 0) return '';
                          if (value >= 1000000000) {
                            return `${(value / 1000000000).toFixed(1)}M`;
                          } else if (value >= 1000000) {
                            return `${(value / 1000000).toFixed(0)}Jt`;
                          }
                          return value.toLocaleString('id-ID');
                        }}
                      />
                    </Line>
                  </LineChart>
                );

              default: // area chart
                return (
                  <AreaChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 30 }}>
                    <defs>
                      <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(210, 80%, 50%)" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(210, 80%, 50%)" stopOpacity={0.2}/>
                      </linearGradient>
                      <linearGradient id="colorPencapaian" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={4}
                      minTickGap={15}
                      tick={{ fontSize: 9 }}
                      className="fill-muted-foreground"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={6}
                      tick={{ fontSize: 8 }}
                      className="fill-muted-foreground"
                      domain={[0, 'dataMax']}
                      width={45}
                    />
                    <ChartTooltip
                      cursor={true}
                      content={<CustomTooltip />}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="target"
                      stroke="hsl(210, 80%, 50%)"
                      strokeWidth={2}
                      fill="url(#colorTarget)"
                      name="Target"
                    >
                      <LabelList
                        dataKey="target"
                        position="top"
                        fontSize={isFullWidth ? 13 : 8}
                        fontWeight="bold"
                        className="hidden sm:inline"
                        fill="hsl(210, 80%, 50%)"
                        formatter={(value: number) => {
                          if (value === 0) return '';
                          if (value >= 1000000000) {
                            return `${(value / 1000000000).toFixed(1)}M`;
                          } else if (value >= 1000000) {
                            return `${(value / 1000000).toFixed(0)}Jt`;
                          }
                          return value.toLocaleString('id-ID');
                        }}
                      />
                    </Area>
                    <Area
                      type="monotone"
                      dataKey="pencapaian"
                      stroke="hsl(142, 76%, 36%)"
                      strokeWidth={2}
                      fill="url(#colorPencapaian)"
                      name="Pencapaian"
                    >
                      <LabelList
                        dataKey="pencapaian"
                        position="top"
                        fontSize={isFullWidth ? 13 : 8}
                        fontWeight="bold"
                        className="hidden sm:inline"
                        fill="hsl(142, 76%, 36%)"
                        formatter={(value: number) => {
                          if (value === 0) return '';
                          if (value >= 1000000000) {
                            return `${(value / 1000000000).toFixed(1)}M`;
                          } else if (value >= 1000000) {
                            return `${(value / 1000000).toFixed(0)}Jt`;
                          }
                          return value.toLocaleString('id-ID');
                        }}
                      />
                    </Area>
                  </AreaChart>
                );
            }
          })()}
        </ChartContainer>

        
      </CardContent>
    </Card>
  );
}

export { ChartCardPencapaianMonthly };
