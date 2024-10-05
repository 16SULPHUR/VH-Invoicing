import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
  } from "recharts";

const supabase = createClient(
    "https://basihmnebvsflzkaivds.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhc2lobW5lYnZzZmx6a2FpdmRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY2NDg4NDUsImV4cCI6MjA0MjIyNDg0NX0.9qX5k7Jin6T-TfZJt6YWSp0nWDypi4NkAwyhzerAC7U"
  );

const LeftSideBar = () => {
    const [dailySales, setDailySales] = useState([]);

    useEffect(() => {
        fetchDailySales();
      }, []);

    const fetchDailySales = async () => {
        const today = new Date();
        const last7Days = new Date(today);
        last7Days.setDate(today.getDate() - 7); // Calculate the date 7 days ago
    
        const { data, error } = await supabase
          .from("invoices")
          .select("date, total")
          .gte("date", last7Days.toISOString().split("T")[0]) // Filter by date greater than or equal to 7 days ago
          .order("date", { ascending: false }); // Fetch the last 7 days of sales, ordered by date
    
        if (error) {
          console.error("Error fetching daily sales:", error);
        } else {
          const salesByDate = data.reduce((acc, invoice) => {
            const date = new Date(invoice.date).toISOString().split("T")[0];
            acc[date] = (acc[date] || 0) + parseFloat(invoice.total);
            return acc;
          }, {});
    
          const salesArray = Object.entries(salesByDate)
            .map(([date, total]) => {
              const d = new Date(date);
    
              return {
                date,
                total,  // Format total
                formattedDate: String(d.getDate()).padStart(2, "0"),
              };
            })
            .reverse(); // Reverse to show oldest date first in the graph
    
          setDailySales(salesArray);
        }
      };

    return (
        <div>
            <div className="w-[450px] h-[90vh] overflow-y-scroll rounded-md p-5 border-r-4 border-indigo-500">
                <h3 className="text-lg font-bold text-sky-500 mb-2.5">Daily Sales</h3>
                <div className="mb-5 bg-white rounded-md shadow-md">
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={dailySales}>
                            <XAxis
                                dataKey="formattedDate"
                                angle={0}
                                textAnchor="end"
                                height={30}
                            />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="total" stroke="#38b6ff" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}

export default LeftSideBar