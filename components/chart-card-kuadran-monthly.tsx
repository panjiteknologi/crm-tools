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
    // Check if this is for line/area chart (dataKey="value") or bar chart (dataKey=K1, K2, etc.)
    const isLineAreaChart = payload[0].dataKey === 'value';

    return (
      <div className="bg-background border rounded-lg shadow-lg p-2 sm:p-3">
        {!isLineAreaChart && <p className="font-semibold text-xs sm:text-sm mb-2">{label}</p>}
        {payload.map((entry: any, index: number) => {
          const percentage = payload.length > 0 && payload[0].payload ?
            Math.round((entry.value / (payload[0].payload.K1 + payload[0].payload.K2 + payload[0].payload.K3 + payload[0].payload.K4)) * 100) : 0;

          return (
            <div key={index} className="flex items-center gap-2 text-xs sm:text-sm">
              <div
                className="w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="font-medium">{isLineAreaChart ? label : entry.name}:</span>
              <span className="font-bold">{entry.value} Data</span>
              {percentage > 0 && <span className="font-bold text-muted-foreground">({percentage}%)</span>}
            </div>
          );
        })}
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

  // Process data for chart - create aggregated data by kuadran
  const getChartData = () => {
    if (!data || data.length === 0) {
      return [
        { name: 'Kuadran', K1: 0, K2: 0, K3: 0, K4: 0 },
      ];
    }

    // Initialize counts for each kuadran
    const kuadranCounts: { [key: string]: number } = {
      K1: 0,
      K2: 0,
      K3: 0,
      K4: 0,
    };

    // Count data per kuadran
    data.forEach(item => {
      const kuadran = item.kuadran || item.picCrm || item.sales || 'K1'; // Use kuadran field first, then fallback to picCrm or sales
      if (kuadran in kuadranCounts) {
        kuadranCounts[kuadran]++;
      }
    });

    // Convert to single object for multiple series chart
    const chartData = [
      {
        name: 'Kuadran',
        K1: kuadranCounts.K1,
        K2: kuadranCounts.K2,
        K3: kuadranCounts.K3,
        K4: kuadranCounts.K4,
      },
    ];

    return chartData;
  };

  const chartData = getChartData();

  // Calculate total count for percentage calculation
  const totalCount = chartData.length > 0 ? (chartData[0].K1 + chartData[0].K2 + chartData[0].K3 + chartData[0].K4) : 0;

  const hasData = totalCount > 0;

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
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={6}
                      tick={{ fontSize: 15 }}
                      className="fill-muted-foreground"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 10 }}
                      className="fill-muted-foreground"
                      domain={[0, 'dataMax']}
                      width={60}
                      label={{ value: 'Jumlah Data', angle: -90, position: 'insideLeft', fontSize: 10 }}
                    />
                    <ChartTooltip
                      cursor={true}
                      content={<CustomTooltip />}
                    />
                    <Legend />
                    <Bar dataKey="K1" fill={kuadranColors.K1} radius={[8, 8, 0, 0]}>
                      <LabelList
                        dataKey="K1"
                        position="top"
                        fontSize={15}
                        fontWeight="bold"
                        fill={kuadranColors.K1}
                        formatter={(value: number) => {
                          const percentage = totalCount > 0 ? Math.round((value / totalCount) * 100) : 0;
                          return `${value} (${percentage}%)`;
                        }}
                      />
                    </Bar>
                    <Bar dataKey="K2" fill={kuadranColors.K2} radius={[8, 8, 0, 0]}>
                      <LabelList
                        dataKey="K2"
                        position="top"
                        fontSize={15}
                        fontWeight="bold"
                        fill={kuadranColors.K2}
                        formatter={(value: number) => {
                          const percentage = totalCount > 0 ? Math.round((value / totalCount) * 100) : 0;
                          return `${value} (${percentage}%)`;
                        }}
                      />
                    </Bar>
                    <Bar dataKey="K3" fill={kuadranColors.K3} radius={[8, 8, 0, 0]}>
                      <LabelList
                        dataKey="K3"
                        position="top"
                        fontSize={15}
                        fontWeight="bold"
                        fill={kuadranColors.K3}
                        formatter={(value: number) => {
                          const percentage = totalCount > 0 ? Math.round((value / totalCount) * 100) : 0;
                          return `${value} (${percentage}%)`;
                        }}
                      />
                    </Bar>
                    <Bar dataKey="K4" fill={kuadranColors.K4} radius={[8, 8, 0, 0]}>
                      <LabelList
                        dataKey="K4"
                        position="top"
                        fontSize={15}
                        fontWeight="bold"
                        fill={kuadranColors.K4}
                        formatter={(value: number) => {
                          const percentage = totalCount > 0 ? Math.round((value / totalCount) * 100) : 0;
                          return `${value} (${percentage}%)`;
                        }}
                      />
                    </Bar>
                  </BarChart>
                );

              case 'line':
                // Transform data for line chart - convert to single series with kuadran names as labels
                const lineChartData = chartData.length > 0 ? [
                  { name: 'K1', K1: chartData[0].K1, K2: 0, K3: 0, K4: 0 },
                  { name: 'K2', K1: 0, K2: chartData[0].K2, K3: 0, K4: 0 },
                  { name: 'K3', K1: 0, K2: 0, K3: chartData[0].K3, K4: 0 },
                  { name: 'K4', K1: 0, K2: 0, K3: 0, K4: chartData[0].K4 },
                ] : [];

                return (
                  <LineChart data={lineChartData} margin={{ top: 20, right: 20, left: 10, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={6}
                      tick={{ fontSize: 15 }}
                      className="fill-muted-foreground"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 10 }}
                      className="fill-muted-foreground"
                      domain={[0, 'dataMax']}
                      width={60}
                      label={{ value: 'Jumlah Data', angle: -90, position: 'insideLeft', fontSize: 10 }}
                    />
                    <Tooltip
                      content={({ active, payload, label }: any) => {
                        if (active && payload && payload.length) {
                          const entry = payload.find((p: any) => p.value > 0);
                          if (entry) {
                            const percentage = totalCount > 0 ? Math.round((entry.value / totalCount) * 100) : 0;
                            return (
                              <div className="bg-background border rounded-lg shadow-lg p-3">
                                <p className="font-semibold text-sm">{label}</p>
                                <p className="text-base font-bold">{entry.value} Data ({percentage}%)</p>
                              </div>
                            );
                          }
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="K1" stroke={kuadranColors.K1} strokeWidth={3} dot={{ fill: kuadranColors.K1, strokeWidth: 2, r: 6 }} activeDot={{ r: 8 }}>
                      <LabelList dataKey="K1" position="top" fontSize={12} fontWeight="bold" fill={kuadranColors.K1}
                        formatter={(value: number) => {
                          if (value === 0) return '';
                          const percentage = totalCount > 0 ? Math.round((value / totalCount) * 100) : 0;
                          return `${value} (${percentage}%)`;
                        }}
                      />
                    </Line>
                    <Line type="monotone" dataKey="K2" stroke={kuadranColors.K2} strokeWidth={3} dot={{ fill: kuadranColors.K2, strokeWidth: 2, r: 6 }} activeDot={{ r: 8 }}>
                      <LabelList dataKey="K2" position="top" fontSize={12} fontWeight="bold" fill={kuadranColors.K2}
                        formatter={(value: number) => {
                          if (value === 0) return '';
                          const percentage = totalCount > 0 ? Math.round((value / totalCount) * 100) : 0;
                          return `${value} (${percentage}%)`;
                        }}
                      />
                    </Line>
                    <Line type="monotone" dataKey="K3" stroke={kuadranColors.K3} strokeWidth={3} dot={{ fill: kuadranColors.K3, strokeWidth: 2, r: 6 }} activeDot={{ r: 8 }}>
                      <LabelList dataKey="K3" position="top" fontSize={12} fontWeight="bold" fill={kuadranColors.K3}
                        formatter={(value: number) => {
                          if (value === 0) return '';
                          const percentage = totalCount > 0 ? Math.round((value / totalCount) * 100) : 0;
                          return `${value} (${percentage}%)`;
                        }}
                      />
                    </Line>
                    <Line type="monotone" dataKey="K4" stroke={kuadranColors.K4} strokeWidth={3} dot={{ fill: kuadranColors.K4, strokeWidth: 2, r: 6 }} activeDot={{ r: 8 }}>
                      <LabelList dataKey="K4" position="top" fontSize={12} fontWeight="bold" fill={kuadranColors.K4}
                        formatter={(value: number) => {
                          if (value === 0) return '';
                          const percentage = totalCount > 0 ? Math.round((value / totalCount) * 100) : 0;
                          return `${value} (${percentage}%)`;
                        }}
                      />
                    </Line>
                  </LineChart>
                );

              default: // area chart
                // Transform data for area chart - convert to single series
                const areaChartData = chartData.length > 0 ? [
                  { name: 'K1', K1: chartData[0].K1, K2: 0, K3: 0, K4: 0 },
                  { name: 'K2', K1: 0, K2: chartData[0].K2, K3: 0, K4: 0 },
                  { name: 'K3', K1: 0, K2: 0, K3: chartData[0].K3, K4: 0 },
                  { name: 'K4', K1: 0, K2: 0, K3: 0, K4: chartData[0].K4 },
                ] : [];

                return (
                  <AreaChart data={areaChartData} margin={{ top: 20, right: 20, left: 10, bottom: 40 }}>
                    <defs>
                      <linearGradient id="colorK1Area" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={kuadranColors.K1} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={kuadranColors.K1} stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorK2Area" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={kuadranColors.K2} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={kuadranColors.K2} stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorK3Area" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={kuadranColors.K3} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={kuadranColors.K3} stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorK4Area" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={kuadranColors.K4} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={kuadranColors.K4} stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={6}
                      tick={{ fontSize: 15 }}
                      className="fill-muted-foreground"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 10 }}
                      className="fill-muted-foreground"
                      domain={[0, 'dataMax']}
                      width={60}
                      label={{ value: 'Jumlah Data', angle: -90, position: 'insideLeft', fontSize: 10 }}
                    />
                    <Tooltip
                      content={({ active, payload, label }: any) => {
                        if (active && payload && payload.length) {
                          const entry = payload.find((p: any) => p.value > 0);
                          if (entry) {
                            const percentage = totalCount > 0 ? Math.round((entry.value / totalCount) * 100) : 0;
                            return (
                              <div className="bg-background border rounded-lg shadow-lg p-3">
                                <p className="font-semibold text-sm">{label}</p>
                                <p className="text-base font-bold">{entry.value} Data ({percentage}%)</p>
                              </div>
                            );
                          }
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="K1" stroke={kuadranColors.K1} strokeWidth={3} fill="url(#colorK1Area)">
                      <LabelList dataKey="K1" position="top" fontSize={12} fontWeight="bold" fill={kuadranColors.K1}
                        formatter={(value: number) => {
                          if (value === 0) return '';
                          const percentage = totalCount > 0 ? Math.round((value / totalCount) * 100) : 0;
                          return `${value} (${percentage}%)`;
                        }}
                      />
                    </Area>
                    <Area type="monotone" dataKey="K2" stroke={kuadranColors.K2} strokeWidth={3} fill="url(#colorK2Area)">
                      <LabelList dataKey="K2" position="top" fontSize={12} fontWeight="bold" fill={kuadranColors.K2}
                        formatter={(value: number) => {
                          if (value === 0) return '';
                          const percentage = totalCount > 0 ? Math.round((value / totalCount) * 100) : 0;
                          return `${value} (${percentage}%)`;
                        }}
                      />
                    </Area>
                    <Area type="monotone" dataKey="K3" stroke={kuadranColors.K3} strokeWidth={3} fill="url(#colorK3Area)">
                      <LabelList dataKey="K3" position="top" fontSize={12} fontWeight="bold" fill={kuadranColors.K3}
                        formatter={(value: number) => {
                          if (value === 0) return '';
                          const percentage = totalCount > 0 ? Math.round((value / totalCount) * 100) : 0;
                          return `${value} (${percentage}%)`;
                        }}
                      />
                    </Area>
                    <Area type="monotone" dataKey="K4" stroke={kuadranColors.K4} strokeWidth={3} fill="url(#colorK4Area)">
                      <LabelList dataKey="K4" position="top" fontSize={12} fontWeight="bold" fill={kuadranColors.K4}
                        formatter={(value: number) => {
                          if (value === 0) return '';
                          const percentage = totalCount > 0 ? Math.round((value / totalCount) * 100) : 0;
                          return `${value} (${percentage}%)`;
                        }}
                      />
                    </Area>
                  </AreaChart>
                );

              case 'pie':
                // Prepare pie data from chartData
                const pieData = chartData.length > 0 ? [
                  { name: 'K1', value: chartData[0].K1, color: kuadranColors.K1 },
                  { name: 'K2', value: chartData[0].K2, color: kuadranColors.K2 },
                  { name: 'K3', value: chartData[0].K3, color: kuadranColors.K3 },
                  { name: 'K4', value: chartData[0].K4, color: kuadranColors.K4 },
                ].filter(item => item.value > 0) : [];

                if (pieData.length === 0) {
                  return (
                    <div className="h-full w-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-muted-foreground text-sm">No data available</div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="flex flex-col items-center justify-center">
                    <ResponsiveContainer width="100%" height={350}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="45%"
                          labelLine={true}
                          label={(entry) => {
                            const percentage = totalCount > 0 ? Math.round((entry.value / totalCount) * 100) : 0;
                            return `${entry.name}: ${entry.value} (${percentage}%)`;
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
                              const value = payload[0].value as number;
                              const name = payload[0].name as string;
                              const percentage = totalCount > 0 ? Math.round((value / totalCount) * 100) : 0;
                              return (
                                <div className="bg-background border rounded-lg shadow-lg p-3">
                                  <p className="font-semibold text-sm">{name}</p>
                                  <p className="text-base font-bold">{value} Data ({percentage}%)</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          height={80}
                          content={() => (
                            <div className="flex flex-wrap justify-center gap-4 mt-4">
                              {pieData.map((entry, index) => {
                                const percentage = totalCount > 0 ? Math.round((entry.value / totalCount) * 100) : 0;
                                return (
                                  <div key={index} className="flex items-center gap-2">
                                    <div
                                      className="w-3 h-3 rounded-sm"
                                      style={{ backgroundColor: entry.color }}
                                    />
                                    <span className="text-xs font-semibold">
                                      {entry.name}: {entry.value} ({percentage}%)
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
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
