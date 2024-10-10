import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  CartesianGrid,
  Area,
} from "recharts";

const DailySalesChart = ({ dailySales }) => (
  <div className="mb-5 bg-blue-950/80 py-2 rounded-md shadow-md">
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={dailySales}>
        <XAxis dataKey="formattedDate" angle={0} textAnchor="end" height={30} />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="total" stroke="#38b6ff" />
      </LineChart>
    </ResponsiveContainer>
    
  </div>
);

export default DailySalesChart;
