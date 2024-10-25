"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Button } from "@/components/ui/button"

const DailySalesChart = ({ dailySales }) => {
  const [chartType, setChartType] = useState("area")

  return (
    <Card className="w-full bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="text-sky-500 flex justify-between">
          
          <span>Daily Sales</span>

          <div className="flex space-x-2">
          <Button
            size={"sm"}
            variant={chartType === "area" ? "default" : "outline"}
            onClick={() => setChartType("area")}
          >
            Area
          </Button>
          <Button
          size={"sm"}
            variant={chartType === "bar" ? "default" : "outline"}
            onClick={() => setChartType("bar")}
          >
            Bar
          </Button>
        </div>
          </CardTitle>
        <CardDescription>View sales trends over time</CardDescription>
      </CardHeader>
      <CardContent className="px-1">
        <ChartContainer
          config={{
            total: {
              label: "Total Sales",
              color: chartType === "area" ? "hsl(var(--chart-2))" : "hsl(var(--chart-3))",
            },
          }}
          className="h-[200px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "area" ? (
              <AreaChart data={dailySales}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="formattedDate"
                  stroke="#0ea5e9"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#0ea5e9"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `₹${value}`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#0ea5e9"
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                />
              </AreaChart>
            ) : (
              <BarChart data={dailySales}>
                <XAxis
                  dataKey="formattedDate"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  fontSize={12}
                  tickLine={true}
                  axisLine={false}
                  tickFormatter={(value) => `₹${value}`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="total"
                  fill="#0ea5e9"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export default DailySalesChart