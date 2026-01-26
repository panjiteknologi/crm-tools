"use client"

import * as React from "react"
import { Area, AreaChart, Bar, BarChart, Line, LineChart, CartesianGrid, XAxis, YAxis, LabelList, Tooltip } from "recharts"

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
  Pencapaian: {
    label: "Pencapaian",
  },
} satisfies ChartConfig

// Custom Tooltip Content
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
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

  // Process data for chart - group by month and COMBINE MRC + DHA
  const getChartData = () => {
    if (!data || data.length === 0) {
      return monthNames.map(month => ({ month, value: 0 }));
    }

    // Initialize data for all months
    const monthlyData: { [key: string]: number } = {};
    monthNames.forEach(month => {
      monthlyData[month] = 0;
    });

    // Group by month and COMBINE all MRC and DHA values
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

      // Add hargaKontrak to the corresponding month (COMBINED MRC + DHA)
      if (!monthlyData[monthName]) {
        monthlyData[monthName] = 0;
      }
      monthlyData[monthName] += item.hargaKontrak || 0;
    });

    // Convert to array
    const chartData = monthNames.map(month => ({
      month,
      value: monthlyData[month]
    }));

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

  const hasData = chartData.length > 0 && chartData.some(item => item.value > 0);

  return (
    <Card className="@container/card relative overflow-hidden">
      {/* Futuristic background overlay */}
      <div className={`absolute inset-0 ${getBackgroundGradient()} opacity-60`}></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 via-transparent to-purple-500/5"></div>

      <CardHeader className="relative z-10 pb-2">
        <CardTitle className="text-sm font-semibold text-center">{title}</CardTitle>
        <CardDescription className="text-sm text-center font-semibold text-black/70">
          Total: {data.length} data | Rp {chartData.reduce((sum, item) => sum + item.value, 0).toLocaleString('id-ID')}
        </CardDescription>
      </CardHeader>

      <CardContent className="px-2 pt-2 relative z-10">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[200px] sm:h-[220px] md:h-[250px] w-full"
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
                  <BarChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={6}
                      minTickGap={20}
                      tick={{ fontSize: 10 }}
                      className="fill-muted-foreground"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 9 }}
                      className="fill-muted-foreground"
                      domain={[0, 'dataMax']}
                      width={60}
                    />
                    <ChartTooltip
                      cursor={true}
                      content={<CustomTooltip />}
                    />
                    <Bar dataKey="value" fill={chartColor} radius={[4, 4, 0, 0]}>
                      <LabelList
                        dataKey="value"
                        position="top"
                        fontSize={isFullWidth ? 12 : 9}
                        fontWeight="bold"
                        className="hidden sm:inline"
                        fill={chartColor}
                        formatter={(value: number) => {
                          if (value === 0) return '';
                          return value.toLocaleString('id-ID');
                        }}
                      />
                    </Bar>
                  </BarChart>
                );

              case 'line':
                return (
                  <LineChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={6}
                      minTickGap={20}
                      tick={{ fontSize: 10 }}
                      className="fill-muted-foreground"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 9 }}
                      className="fill-muted-foreground"
                      domain={[0, 'dataMax']}
                      width={60}
                    />
                    <ChartTooltip
                      cursor={true}
                      content={<CustomTooltip />}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={chartColor}
                      strokeWidth={2}
                      dot={{ fill: chartColor, strokeWidth: 1.5, r: 4 }}
                      activeDot={{ r: 6 }}
                    >
                      <LabelList
                        dataKey="value"
                        position="top"
                        fontSize={isFullWidth ? 12 : 9}
                        fontWeight="bold"
                        className="hidden sm:inline"
                        fill={chartColor}
                        formatter={(value: number) => {
                          if (value === 0) return '';
                          return value.toLocaleString('id-ID');
                        }}
                      />
                    </Line>
                  </LineChart>
                );

              default: // area chart
                return (
                  <AreaChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 40 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartColor} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={chartColor} stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={6}
                      minTickGap={20}
                      tick={{ fontSize: 10 }}
                      className="fill-muted-foreground"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 9 }}
                      className="fill-muted-foreground"
                      domain={[0, 'dataMax']}
                      width={60}
                    />
                    <ChartTooltip
                      cursor={true}
                      content={<CustomTooltip />}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={chartColor}
                      strokeWidth={2}
                      fill="url(#colorValue)"
                    >
                      <LabelList
                        dataKey="value"
                        position="top"
                        fontSize={isFullWidth ? 12 : 9}
                        fontWeight="bold"
                        className="hidden sm:inline"
                        fill={chartColor}
                        formatter={(value: number) => {
                          if (value === 0) return '';
                          return value.toLocaleString('id-ID');
                        }}
                      />
                    </Area>
                  </AreaChart>
                );
            }
          })()}
        </ChartContainer>

        {/* Chart Legend */}
        <div className="flex items-center justify-center space-x-4 mt-3 p-2 bg-muted/20 rounded-lg">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3" style={{ backgroundColor: chartColor }}></div>
            <span className="text-xs font-medium">Pencapaian</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export { ChartCardPencapaianMonthly };
