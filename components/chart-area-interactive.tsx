"use client"

import * as React from "react"
import { Area, AreaChart, Bar, BarChart, Line, LineChart, Pie, PieChart, Cell, CartesianGrid, XAxis, YAxis, ResponsiveContainer, LabelList, Rectangle, Tooltip } from "recharts"

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

export const description = "An interactive area chart"


const chartConfig = {
  visitors: {
    label: "Sales",
  },
  mercy: {
    label: "Mercy",
    color: "hsl(270, 60%, 50%)", // Purple
  },
  dhea: {
    label: "Dhea",
    color: "hsl(210, 80%, 50%)", // Blue
  },
} satisfies ChartConfig

// Custom Tooltip Content
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg shadow-lg p-2 sm:p-3 max-w-[200px] sm:max-w-none">
        <p className="font-semibold text-xs sm:text-sm mb-1 sm:mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <div
              className="w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="font-medium truncate">{entry.name}:</span>
            <span className="font-bold flex-shrink-0">
              {entry.value > 0 ? formatRupiahShort(entry.value) : '0'}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

function ChartCard({ title, data, statusColor, chartType }: {
  title: string
  data: any[]
  statusColor: string
  chartType?: string
}) {
  // Check if data has any non-zero values
  const hasData = data && data.length > 0 &&
    (data.some(item => item.mercy > 0) || data.some(item => item.dhea > 0));

  // Ensure minimum data for chart rendering
  const chartData = data && data.length > 0 ? data : [{ month: 'No Data', mercy: 0, dhea: 0 }];

  // Determine background gradient based on chart type
  const getBackgroundGradient = () => {
    if (title.includes('LANJUT')) {
      return 'bg-gradient-to-br from-green-500/30 via-green-400/20 to-transparent';
    } else if (title.includes('LOSS')) {
      return 'bg-gradient-to-br from-red-500/30 via-red-400/20 to-transparent';
    } else if (title.includes('SUSPEND')) {
      return 'bg-gradient-to-br from-orange-500/30 via-orange-400/20 to-transparent';
    }
    return '';
  };

  return (
    <Card className="@container/card relative overflow-hidden">
      {/* Futuristic background overlay */}
      <div className={`absolute inset-0 ${getBackgroundGradient()} opacity-80`}></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 via-transparent to-purple-500/10 animate-pulse"></div>
      <CardHeader className="relative z-10 pb-1 px-2">
        <CardTitle className="text-s" style={{ textAlign:'center' }}>{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-1 pt-2 relative z-10">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[180px] sm:h-[200px] md:h-[250px] lg:h-[280px] w-full"
        >
          {(() => {
            switch (chartType) {
              case 'bar':
                return (
                  <BarChart data={chartData} margin={{ top: 30, right: 30, left: 10, bottom: 50 }}>
                    <defs>
                      <linearGradient id="colorMercyBar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(270, 60%, 50%)" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(270, 60%, 50%)" stopOpacity={0.4}/>
                      </linearGradient>
                      <linearGradient id="colorDheaBar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(210, 80%, 50%)" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(210, 80%, 50%)" stopOpacity={0.4}/>
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
                      width={80}
                    />
                    <ChartTooltip
                      cursor={true}
                      content={<CustomTooltip />}
                    />
                    <Bar dataKey="mercy" fill="url(#colorMercyBar)" radius={[4, 4, 0, 0]}>
                      <LabelList
                        dataKey="mercy"
                        position="top"
                        fontSize={9}
                        fontWeight="bold"
                        className="hidden sm:inline"
                        fill="hsl(270, 60%, 50%)"
                        formatter={(value: number, entry: any) => {
                          if (entry && entry.payload && (entry.payload.isPadding || !entry.payload.month)) return '';
                          return value && value > 0 ? formatRupiahShort(value) : '';
                        }}
                      />
                    </Bar>
                    <Bar dataKey="dhea" fill="url(#colorDheaBar)" radius={[4, 4, 0, 0]}>
                      <LabelList
                        dataKey="dhea"
                        position="top"
                        fontSize={9}
                        fontWeight="bold"
                        className="hidden sm:inline"
                        fill="hsl(210, 80%, 50%)"
                        formatter={(value: number, entry: any) => {
                          if (entry && entry.payload && (entry.payload.isPadding || !entry.payload.month)) return '';
                          return value && value > 0 ? formatRupiahShort(value) : '';
                        }}
                      />
                    </Bar>
                  </BarChart>
                );
              case 'line':
                return (
                  <LineChart data={chartData} margin={{ top: 30, right: 30, left: 10, bottom: 50 }}>
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
                      width={80}
                    />
                    <ChartTooltip
                      cursor={true}
                      content={<CustomTooltip />}
                    />
                    <Line
                      type="monotone"
                      dataKey="mercy"
                      stroke="hsl(270, 60%, 50%)"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(270, 60%, 50%)', strokeWidth: 1.5, r: 4, className: 'hidden sm:inline' }}
                      activeDot={{ r: 6 }}
                    >
                      <LabelList
                        dataKey="mercy"
                        position="top"
                        fontSize={9}
                        fontWeight="bold"
                        className="hidden sm:inline"
                        fill="hsl(270, 60%, 50%)"
                        formatter={(value: number, entry: any) => {
                          if (entry && entry.payload && (entry.payload.isPadding || !entry.payload.month)) return '';
                          return value && value > 0 ? formatRupiahShort(value) : '';
                        }}
                      />
                    </Line>
                    <Line
                      type="monotone"
                      dataKey="dhea"
                      stroke="hsl(210, 80%, 50%)"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(210, 80%, 50%)', strokeWidth: 1.5, r: 4, className: 'hidden sm:inline' }}
                      activeDot={{ r: 6 }}
                    >
                      <LabelList
                        dataKey="dhea"
                        position="top"
                        fontSize={9}
                        fontWeight="bold"
                        className="hidden sm:inline"
                        fill="hsl(210, 80%, 50%)"
                        formatter={(value: number, entry: any) => {
                          if (entry && entry.payload && (entry.payload.isPadding || !entry.payload.month)) return '';
                          return value && value > 0 ? formatRupiahShort(value) : '';
                        }}
                      />
                    </Line>
                  </LineChart>
                );
              case 'pie':
                // Prepare data for pie chart (sum all mercy and dhea values)
                const pieData = [
                  {
                    name: 'Mercy',
                    value: chartData.reduce((sum, item) => sum + (item.mercy || 0), 0),
                    color: 'hsl(270, 60%, 50%)'
                  },
                  {
                    name: 'Dhea',
                    value: chartData.reduce((sum, item) => sum + (item.dhea || 0), 0),
                    color: 'hsl(210, 80%, 50%)'
                  }
                ].filter(item => item.value > 0); // Filter out zero values

                const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
                  if (percent < 0.05) return null; // Hide label if less than 5%

                  const RADIAN = Math.PI / 180;
                  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);

                  return (
                    <text
                      x={x}
                      y={y}
                      fill="white"
                      textAnchor={x > cx ? 'start' : 'end'}
                      dominantBaseline="central"
                      className="font-semibold text-xs sm:text-sm"
                    >
                      {`${(percent * 100).toFixed(1)}%`}
                    </text>
                  );
                };

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
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={CustomPieLabel}
                        outerRadius={60}
                        innerRadius={0}
                        fill="#8884d8"
                        dataKey="value"
                        animationBegin={0}
                        animationDuration={800}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [`${formatRupiahShort(value)}`, 'Sales Amount']}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                );
              default: // area chart
                return (
                  <AreaChart data={chartData} margin={{ top: 30, right: 30, left: 10, bottom: 50 }}>
                    <defs>
                      {/* Futuristic gradient for Mercy - Purple */}
                      <linearGradient id="colorMercy" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(270, 60%, 50%)" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="hsl(270, 60%, 50%)" stopOpacity={0.3}/>
                      </linearGradient>
                      {/* Futuristic gradient for Dhea - Blue */}
                      <linearGradient id="colorDhea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(210, 80%, 50%)" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="hsl(210, 80%, 50%)" stopOpacity={0.3}/>
                      </linearGradient>
                      {/* Futuristic background gradient based on chart type */}
                      <linearGradient id="backgroundLanjut" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(34, 197, 94, 0.1)" />
                        <stop offset="100%" stopColor="rgba(34, 197, 94, 0.02)" />
                      </linearGradient>
                      <linearGradient id="backgroundLoss" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(239, 68, 68, 0.1)" />
                        <stop offset="100%" stopColor="rgba(239, 68, 68, 0.02)" />
                      </linearGradient>
                      <linearGradient id="backgroundSuspend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(251, 146, 60, 0.1)" />
                        <stop offset="100%" stopColor="rgba(251, 146, 60, 0.02)" />
                      </linearGradient>
                      {/* Animated gradient overlay for futuristic effect */}
                      <linearGradient id="futuristicOverlay" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="rgba(59, 130, 246, 0.05)" />
                        <stop offset="50%" stopColor="rgba(139, 92, 246, 0.03)" />
                        <stop offset="100%" stopColor="rgba(59, 130, 246, 0.05)" />
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
                      width={80}
                    />
                    <ChartTooltip
                      cursor={true}
                      content={<CustomTooltip />}
                    />
                    <Area
                      type="monotone"
                      dataKey="mercy"
                      stroke="hsl(270, 60%, 50%)"
                      strokeWidth={2}
                      fill="url(#colorMercy)"
                    >
                      <LabelList
                        dataKey="mercy"
                        position="top"
                        fontSize={9}
                        fontWeight="bold"
                        className="hidden sm:inline"
                        fill="hsl(270, 60%, 50%)"
                        formatter={(value: number, entry: any) => {
                          // Don't show label for padding months or empty month labels
                          if (entry && entry.payload && (entry.payload.isPadding || !entry.payload.month)) return '';
                          return value && value > 0 ? formatRupiahShort(value) : '';
                        }}
                      />
                    </Area>
                    <Area
                      type="monotone"
                      dataKey="dhea"
                      stroke="hsl(210, 80%, 50%)"
                      strokeWidth={2}
                      fill="url(#colorDhea)"
                    >
                      <LabelList
                        dataKey="dhea"
                        position="top"
                        fontSize={9}
                        fontWeight="bold"
                        className="hidden sm:inline"
                        fill="hsl(210, 80%, 50%)"
                        formatter={(value: number, entry: any) => {
                          // Don't show label for padding months or empty month labels
                          if (entry && entry.payload && (entry.payload.isPadding || !entry.payload.month)) return '';
                          return value && value > 0 ? formatRupiahShort(value) : '';
                        }}
                      />
                    </Area>
                  </AreaChart>
                );
            }
          })()}
        </ChartContainer>

        {/* Chart Legend */}
        <div className="flex items-center justify-center space-x-2 sm:space-x-4 mt-3 sm:mt-4 p-2 sm:p-3 bg-muted/20 rounded-lg">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 sm:w-3 sm:h-3" style={{ backgroundColor: 'hsl(270, 60%, 50%)' }}></div>
            <span className="text-xs sm:text-xs font-medium hidden sm:inline">Mercy</span>
            <span className="text-xs sm:text-xs font-medium sm:hidden">Mercy</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 sm:w-3 sm:h-3" style={{ backgroundColor: 'hsl(210, 80%, 50%)' }}></div>
            <span className="text-xs sm:text-xs font-medium hidden sm:inline">Dhea</span>
            <span className="text-xs sm:text-xs font-medium sm:hidden">Dhea</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface DateRange {
  startMonth: number;
  startYear: number;
  endMonth: number;
  endYear: number;
}

interface ChartAreaInteractiveProps {
  selectedStaff: string
  selectedYear: number
  selectedStatus: string
  allVisitData: { [key: string]: any[] }
  dateRange?: DateRange
  selectedChartType?: string
}

// Function to format Rupiah
const formatRupiah = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

// Custom label formatter for chart
const formatRupiahShort = (value: number) => {
  if (value === 0) return '0';
  return `${value.toLocaleString('id-ID')}`;
};

// Function to generate chart data based on filters with sales amounts in full Rupiah
function generateChartData(staffId: string, year: number, visitData: { [key: string]: any[] }, statusFilter: string, dateRange?: DateRange) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  // Determine the range of months to include
  let startMonth = 0;
  let endMonth = 11;

  if (dateRange && dateRange.startYear === year && dateRange.endYear === year) {
    startMonth = dateRange.startMonth;
    endMonth = dateRange.endMonth;
  }

  // Create data with mountain shape for single month ranges
  let data = [];

  if (startMonth === endMonth) {
    // Single month selected - create mountain shape with peak in the middle
    data = [
      { month: '', mercy: 0, dhea: 0, isPadding: true },  // Left base
      { month: months[startMonth], mercy: 0, dhea: 0, isPadding: false },  // Peak
      { month: '', mercy: 0, dhea: 0, isPadding: true }   // Right base
    ];
  } else {
    // Multiple months selected
    for (let i = startMonth; i <= endMonth; i++) {
      data.push({
        month: months[i],
        mercy: 0,
        dhea: 0,
        isPadding: false
      });
    }
  }

  // Filter and sum sales amounts by staff, year, status, and date range
  Object.entries(visitData).forEach(([dateStr, visits]) => {
    const visitDate = new Date(dateStr);

    // Check if visit is within the selected year and date range
    if (visitDate.getFullYear() === year) {
      const monthIndex = visitDate.getMonth();

      // Only include visits within the selected date range
      if (monthIndex >= startMonth && monthIndex <= endMonth) {
        // For single month, put data in the middle (index 1)
        const dataIndex = startMonth === endMonth ? 1 : monthIndex - startMonth;

        visits.forEach(visit => {
          if (visit.status === statusFilter && (staffId === 'all' || visit.staffId === staffId)) {
            const salesAmount = visit.salesAmount || 0; // Default to 0 if no sales amount

            if (visit.staffId === '1' || visit.staffName === 'Mercy') {
              data[dataIndex].mercy += salesAmount;
            } else if (visit.staffId === '2' || visit.staffName === 'Dhea') {
              data[dataIndex].dhea += salesAmount;
            }
          }
        });
      }
    }
  });

  return data;
}

export function ChartAreaInteractive({ selectedStaff, selectedYear, selectedStatus, allVisitData, dateRange, selectedChartType = 'area' }: ChartAreaInteractiveProps) {
  // Generate dynamic chart data based on filters
  const chartDataLanjut = (selectedStatus === 'all' || selectedStatus === 'visited' || selectedStatus === 'lanjut') ? generateChartData(selectedStaff, selectedYear, allVisitData, 'lanjut', dateRange) : [];
  const chartDataLoss = (selectedStatus === 'all' || selectedStatus === 'visited' || selectedStatus === 'loss') ? generateChartData(selectedStaff, selectedYear, allVisitData, 'loss', dateRange) : [];
  const chartDataSuspend = (selectedStatus === 'all' || selectedStatus === 'visited' || selectedStatus === 'suspend') ? generateChartData(selectedStaff, selectedYear, allVisitData, 'suspend', dateRange) : [];


  const staffLabel = selectedStaff === 'all' ? 'All Team' : selectedStaff === '1' ? 'Mercy' : 'Dhea';

  // Format the date range for title
  const getMonthNames = () => {
    return [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
  };

  const dateRangeText = dateRange
    ? `${getMonthNames()[dateRange.startMonth].slice(0, 3)}-${getMonthNames()[dateRange.endMonth].slice(0, 3)} ${dateRange.startYear}`
    : `${selectedYear}`;

  // Determine grid layout based on selected status
  const getGridLayoutClass = () => {
    if (selectedStatus === 'lanjut') {
      return 'grid gap-3 sm:gap-4 md:grid-cols-1 lg:grid-cols-1';
    } else if (selectedStatus === 'loss') {
      return 'grid gap-3 sm:gap-4 md:grid-cols-1 lg:grid-cols-1';
    } else if (selectedStatus === 'suspend') {
      return 'grid gap-3 sm:gap-4 md:grid-cols-1 lg:grid-cols-1';
    } else {
      return 'grid gap-3 sm:gap-4 md:grid-cols-1 lg:grid-cols-3';
    }
  };

  return (
    <div className={getGridLayoutClass()}>
      {(selectedStatus === 'all' || selectedStatus === 'visited' || selectedStatus === 'lanjut') && (
        <ChartCard
          title={`Sales Performance - LANJUT (${dateRangeText})`}
          data={chartDataLanjut}
          statusColor="green"
          chartType={selectedChartType}
        />
      )}
      {(selectedStatus === 'all' || selectedStatus === 'visited' || selectedStatus === 'loss') && (
        <ChartCard
          title={`Sales Performance - LOSS (${dateRangeText})`}
          data={chartDataLoss}
          statusColor="red"
          chartType={selectedChartType}
        />
      )}
      {(selectedStatus === 'all' || selectedStatus === 'visited' || selectedStatus === 'suspend') && (
        <ChartCard
          title={`Sales Performance - SUSPEND (${dateRangeText})`}
          data={chartDataSuspend}
          statusColor="yellow"
          chartType={selectedChartType}
        />
      )}
    </div>
  )
}