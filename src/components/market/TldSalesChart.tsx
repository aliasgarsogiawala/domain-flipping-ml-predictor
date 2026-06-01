"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TldPerformanceRow } from "@/lib/marketData";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function TldSalesChart({ data }: { data: TldPerformanceRow[] }) {
  return (
    <div className="h-[380px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 12, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid stroke="#d7d7d1" strokeDasharray="3 3" />
          <XAxis
            dataKey="tld"
            tick={{ fill: "#475569", fontSize: 12 }}
            axisLine={{ stroke: "#111111" }}
            tickLine={{ stroke: "#111111" }}
          />
          <YAxis
            yAxisId="value"
            tick={{ fill: "#475569", fontSize: 12 }}
            axisLine={{ stroke: "#111111" }}
            tickLine={{ stroke: "#111111" }}
            tickFormatter={(value) => `$${Math.round(value / 1000)}k`}
          />
          <YAxis
            yAxisId="count"
            orientation="right"
            tick={{ fill: "#475569", fontSize: 12 }}
            axisLine={{ stroke: "#111111" }}
            tickLine={{ stroke: "#111111" }}
          />
          <Tooltip
            contentStyle={{
              border: "1.5px solid #111111",
              borderRadius: "12px",
              backgroundColor: "#f7f7f5",
              color: "#111111",
            }}
            formatter={(value, name) => {
              const numericValue = typeof value === "number" ? value : Number(value);
              if (name === "saleCount") return [numericValue.toLocaleString(), "Sale count"];
              if (name === "averageSalePrice") return [formatCurrency(numericValue), "Average sale price"];
              return [formatCurrency(numericValue), "Median sale price"];
            }}
          />
          <Legend wrapperStyle={{ color: "#111111" }} />
          <Bar yAxisId="value" dataKey="medianSalePrice" fill="#ccff3f" stroke="#111111" radius={[6, 6, 0, 0]} />
          <Bar yAxisId="value" dataKey="averageSalePrice" fill="#7888ee" stroke="#111111" radius={[6, 6, 0, 0]} />
          <Line yAxisId="count" type="monotone" dataKey="saleCount" stroke="#111111" strokeWidth={2.5} dot={{ r: 3 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
