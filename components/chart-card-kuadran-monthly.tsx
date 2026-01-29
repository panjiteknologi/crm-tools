"use client"

import * as React from "react"
import { Area, AreaChart, Bar, BarChart, Line, LineChart, Pie, PieChart, Cell, CartesianGrid, XAxis, YAxis, LabelList, Tooltip, Legend, ResponsiveContainer } from "recharts"

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

export const description = "Kuadran Analytics Monthly Multi-Series Chart"

const chartConfig = {
  K1: { label: "K1" },
  K2: { label: "K2" },
  K3: { label: "K3" },
  K4: { label: "K4" },
} satisfies ChartConfig

// Custom Tooltip Content
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg shadow-lg p-2 sm:p-3">
        <p className="font-semibold text-xs sm:text-sm mb-2">{label}</p>
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

interface ChartCardKuadranMonthlyProps {
  title: string
  data: any[]
  chartType?: string
}

function ChartCardKuadranMonthly({
  title,
  data,
  chartType = 'area'
}: ChartCardKuadranMonthlyProps) {
  // Month names for chart
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Kuadran colors
  const kuadranColors = {
    K1: '#3B82F6', // Blue
    K2: '#10B981', // Green
    K3: '#F59E0B', // Orange
    K4: '#8B5CF6', // Purple
  };

  // Process data for chart - create multi-series data
  const getChartData = () => {
    if (!data || data.length === 0) {
      return monthNames.map(month => ({
        month,
        K1: 0,
        K2: 0,
        K3: 0,
        K4: 0
      }));
    }

    // Initialize data for all months
    const monthlyData: { [key: string]: { K1: number; K2: number; K3: number; K4: number } } = {};
    monthNames.forEach(month => {
      monthlyData[month] = { K1: 0, K2: 0, K3: 0, K4: 0 };
    });

    // Group by month and kuadran
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
      const kuadran = item.picCrm || item.sales || 'K1'; // Use picCrm or sales field for kuadran identification

      // Add hargaKontrak to the corresponding month and kuadran
      if (monthlyData[monthName] && kuadran in monthlyData[monthName]) {
        monthlyData[monthName][kuadran as keyof typeof monthlyData[typeof monthName]] += item.hargaKontrak || 0;
      }
    });

    // Convert to array
    const chartData = monthNames.map(month => ({
      month,
      ...monthlyData[month]
    }));

    return chartData;
  };

  const chartData = getChartData();

  const hasData = chartData.length > 0 && chartData.some(item =>
    item.K1 > 0 || item.K2 > 0 || item.K3 > 0 || item.K4 > 0
  );

  return (
    <Card className="@container/card relative overflow-hidden">
      {/* Futuristic background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-400/10 to-transparent opacity-60"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 via-transparent to-purple-500/5"></div>

      <CardHeader className="relative z-10 pb-2">
        <CardTitle className="text-sm font-semibold text-center">{title}</CardTitle>
        <CardDescription className="text-sm text-center font-semibold text-black/70">
          Total: {data.length} data
        </CardDescription>
      </CardHeader>

      <CardContent className="px-2 pt-2 relative z-10">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] sm:h-[280px] md:h-[320px] w-full"
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
                    <Legend />
                    <Bar dataKey="K1" fill={kuadranColors.K1} radius={[2, 2, 0, 0]}>
                      <LabelList
                        dataKey="K1"
                        position="top"
                        fontSize={11}
                        fontWeight="bold"
                        fill={kuadranColors.K1}
                        formatter={(value: number) => {
                          if (value === 0) return '';
                          if (value >= 1000000000) {
                            return (value / 1000000000).toFixed(1) + 'M';
                          } else if (value >= 1000000) {
                            return (value / 1000000).toFixed(1) + 'Jt';
                          } else {
                            return (value / 1000).toFixed(0) + 'rb';
                          }
                        }}
                      />
                    </Bar>
                    <Bar dataKey="K2" fill={kuadranColors.K2} radius={[2, 2, 0, 0]}>
                      <LabelList
                        dataKey="K2"
                        position="top"
                        fontSize={11}
                        fontWeight="bold"
                        fill={kuadranColors.K2}
                        formatter={(value: number) => {
                          if (value === 0) return '';
                          if (value >= 1000000000) {
                            return (value / 1000000000).toFixed(1) + 'M';
                          } else if (value >= 1000000) {
                            return (value / 1000000).toFixed(1) + 'Jt';
                          } else {
                            return (value / 1000).toFixed(0) + 'rb';
                          }
                        }}
                      />
                    </Bar>
                    <Bar dataKey="K3" fill={kuadranColors.K3} radius={[2, 2, 0, 0]}>
                      <LabelList
                        dataKey="K3"
                        position="top"
                        fontSize={11}
                        fontWeight="bold"
                        fill={kuadranColors.K3}
                        formatter={(value: number) => {
                          if (value === 0) return '';
                          if (value >= 1000000000) {
                            return (value / 1000000000).toFixed(1) + 'M';
                          } else if (value >= 1000000) {
                            return (value / 1000000).toFixed(1) + 'Jt';
                          } else {
                            return (value / 1000).toFixed(0) + 'rb';
                          }
                        }}
                      />
                    </Bar>
                    <Bar dataKey="K4" fill={kuadranColors.K4} radius={[2, 2, 0, 0]}>
                      <LabelList
                        dataKey="K4"
                        position="top"
                        fontSize={11}
                        fontWeight="bold"
                        fill={kuadranColors.K4}
                        formatter={(value: number) => {
                          if (value === 0) return '';
                          if (value >= 1000000000) {
                            return (value / 1000000000).toFixed(1) + 'M';
                          } else if (value >= 1000000) {
                            return (value / 1000000).toFixed(1) + 'Jt';
                          } else {
                            return (value / 1000).toFixed(0) + 'rb';
                          }
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
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="K1"
                      stroke={kuadranColors.K1}
                      strokeWidth={2}
                      dot={{ fill: kuadranColors.K1, strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    >
                      <LabelList
                        dataKey="K1"
                        position="top"
                        fontSize={10}
                        fontWeight="bold"
                        fill={kuadranColors.K1}
                        formatter={(value: number) => {
                          if (value === 0) return '';
                          if (value >= 1000000000) {
                            return (value / 1000000000).toFixed(1) + 'M';
                          } else if (value >= 1000000) {
                            return (value / 1000000).toFixed(1) + 'Jt';
                          } else {
                            return (value / 1000).toFixed(0) + 'rb';
                          }
                        }}
                      />
                    </Line>
                    <Line
                      type="monotone"
                      dataKey="K2"
                      stroke={kuadranColors.K2}
                      strokeWidth={2}
                      dot={{ fill: kuadranColors.K2, strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    >
                      <LabelList
                        dataKey="K2"
                        position="top"
                        fontSize={10}
                        fontWeight="bold"
                        fill={kuadranColors.K2}
                        formatter={(value: number) => {
                          if (value === 0) return '';
                          if (value >= 1000000000) {
                            return (value / 1000000000).toFixed(1) + 'M';
                          } else if (value >= 1000000) {
                            return (value / 1000000).toFixed(1) + 'Jt';
                          } else {
                            return (value / 1000).toFixed(0) + 'rb';
                          }
                        }}
                      />
                    </Line>
                    <Line
                      type="monotone"
                      dataKey="K3"
                      stroke={kuadranColors.K3}
                      strokeWidth={2}
                      dot={{ fill: kuadranColors.K3, strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    >
                      <LabelList
                        dataKey="K3"
                        position="top"
                        fontSize={10}
                        fontWeight="bold"
                        fill={kuadranColors.K3}
                        formatter={(value: number) => {
                          if (value === 0) return '';
                          if (value >= 1000000000) {
                            return (value / 1000000000).toFixed(1) + 'M';
                          } else if (value >= 1000000) {
                            return (value / 1000000).toFixed(1) + 'Jt';
                          } else {
                            return (value / 1000).toFixed(0) + 'rb';
                          }
                        }}
                      />
                    </Line>
                    <Line
                      type="monotone"
                      dataKey="K4"
                      stroke={kuadranColors.K4}
                      strokeWidth={2}
                      dot={{ fill: kuadranColors.K4, strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    >
                      <LabelList
                        dataKey="K4"
                        position="top"
                        fontSize={10}
                        fontWeight="bold"
                        fill={kuadranColors.K4}
                        formatter={(value: number) => {
                          if (value === 0) return '';
                          if (value >= 1000000000) {
                            return (value / 1000000000).toFixed(1) + 'M';
                          } else if (value >= 1000000) {
                            return (value / 1000000).toFixed(1) + 'Jt';
                          } else {
                            return (value / 1000).toFixed(0) + 'rb';
                          }
                        }}
                      />
                    </Line>
                  </LineChart>
                );

              default: // area chart
                return (
                  <AreaChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 40 }}>
                    <defs>
                      <linearGradient id="colorK1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={kuadranColors.K1} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={kuadranColors.K1} stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorK2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={kuadranColors.K2} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={kuadranColors.K2} stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorK3" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={kuadranColors.K3} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={kuadranColors.K3} stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorK4" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={kuadranColors.K4} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={kuadranColors.K4} stopOpacity={0.1}/>
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
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="K1"
                      stroke={kuadranColors.K1}
                      strokeWidth={2}
                      fill="url(#colorK1)"
                    >
                      <LabelList
                        dataKey="K1"
                        position="top"
                        fontSize={10}
                        fontWeight="bold"
                        fill={kuadranColors.K1}
                        formatter={(value: number) => {
                          if (value === 0) return '';
                          if (value >= 1000000000) {
                            return (value / 1000000000).toFixed(1) + 'M';
                          } else if (value >= 1000000) {
                            return (value / 1000000).toFixed(1) + 'Jt';
                          } else {
                            return (value / 1000).toFixed(0) + 'rb';
                          }
                        }}
                      />
                    </Area>
                    <Area
                      type="monotone"
                      dataKey="K2"
                      stroke={kuadranColors.K2}
                      strokeWidth={2}
                      fill="url(#colorK2)"
                    >
                      <LabelList
                        dataKey="K2"
                        position="top"
                        fontSize={10}
                        fontWeight="bold"
                        fill={kuadranColors.K2}
                        formatter={(value: number) => {
                          if (value === 0) return '';
                          if (value >= 1000000000) {
                            return (value / 1000000000).toFixed(1) + 'M';
                          } else if (value >= 1000000) {
                            return (value / 1000000).toFixed(1) + 'Jt';
                          } else {
                            return (value / 1000).toFixed(0) + 'rb';
                          }
                        }}
                      />
                    </Area>
                    <Area
                      type="monotone"
                      dataKey="K3"
                      stroke={kuadranColors.K3}
                      strokeWidth={2}
                      fill="url(#colorK3)"
                    >
                      <LabelList
                        dataKey="K3"
                        position="top"
                        fontSize={10}
                        fontWeight="bold"
                        fill={kuadranColors.K3}
                        formatter={(value: number) => {
                          if (value === 0) return '';
                          if (value >= 1000000000) {
                            return (value / 1000000000).toFixed(1) + 'M';
                          } else if (value >= 1000000) {
                            return (value / 1000000).toFixed(1) + 'Jt';
                          } else {
                            return (value / 1000).toFixed(0) + 'rb';
                          }
                        }}
                      />
                    </Area>
                    <Area
                      type="monotone"
                      dataKey="K4"
                      stroke={kuadranColors.K4}
                      strokeWidth={2}
                      fill="url(#colorK4)"
                    >
                      <LabelList
                        dataKey="K4"
                        position="top"
                        fontSize={10}
                        fontWeight="bold"
                        fill={kuadranColors.K4}
                        formatter={(value: number) => {
                          if (value === 0) return '';
                          if (value >= 1000000000) {
                            return (value / 1000000000).toFixed(1) + 'M';
                          } else if (value >= 1000000) {
                            return (value / 1000000).toFixed(1) + 'Jt';
                          } else {
                            return (value / 1000).toFixed(0) + 'rb';
                          }
                        }}
                      />
                    </Area>
                  </AreaChart>
                );

              case 'pie':
                // Calculate totals per kuadran for pie chart
                const kuadranTotals = chartData.reduce((acc, month) => {
                  return {
                    K1: acc.K1 + month.K1,
                    K2: acc.K2 + month.K2,
                    K3: acc.K3 + month.K3,
                    K4: acc.K4 + month.K4,
                  };
                }, { K1: 0, K2: 0, K3: 0, K4: 0 });

                const pieData = [
                  { name: 'K1', value: kuadranTotals.K1, color: kuadranColors.K1 },
                  { name: 'K2', value: kuadranTotals.K2, color: kuadranColors.K2 },
                  { name: 'K3', value: kuadranTotals.K3, color: kuadranColors.K3 },
                  { name: 'K4', value: kuadranTotals.K4, color: kuadranColors.K4 },
                ].filter(item => item.value > 0);

                return (
                  <div className="flex flex-col items-center justify-center">
                    <PieChart width={300} height={300}>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={(entry) => {
                          const value = entry.value;
                          let label = '';
                          if (value >= 1000000000) {
                            label = (value / 1000000000).toFixed(1) + 'M';
                          } else if (value >= 1000000) {
                            label = (value / 1000000).toFixed(1) + 'Jt';
                          } else {
                            label = (value / 1000).toFixed(0) + 'rb';
                          }
                          return `${entry.name}: ${label}`;
                        }}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-background border rounded-lg shadow-lg p-2">
                                <p className="font-semibold text-sm">{payload[0].name}</p>
                                <p className="text-sm">Rp {payload[0].value.toLocaleString('id-ID')}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </div>
                );
            }
          })()}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export { ChartCardKuadranMonthly };
