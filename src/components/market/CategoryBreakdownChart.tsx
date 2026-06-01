"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CategoryBreakdownRow } from "@/lib/marketData";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function CategoryBreakdownChart({ data }: { data: CategoryBreakdownRow[] }) {
  return (
    <div className="h-[360px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 12, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid stroke="#d7d7d1" strokeDasharray="3 3" />
          <XAxis
            dataKey="category"
            tick={{ fill: "#475569", fontSize: 12 }}
            axisLine={{ stroke: "#111111" }}
            tickLine={{ stroke: "#111111" }}
          />
          <YAxis
            yAxisId="count"
            tick={{ fill: "#475569", fontSize: 12 }}
            axisLine={{ stroke: "#111111" }}
            tickLine={{ stroke: "#111111" }}
          />
          <YAxis
            yAxisId="price"
            orientation="right"
            tick={{ fill: "#475569", fontSize: 12 }}
            axisLine={{ stroke: "#111111" }}
            tickLine={{ stroke: "#111111" }}
            tickFormatter={(value) => `$${Math.round(value / 1000)}k`}
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
              if (name === "medianPrice") return [formatCurrency(numericValue), "Median price"];
              return [numericValue.toLocaleString(), "Sales count"];
            }}
          />
          <Bar yAxisId="count" dataKey="salesCount" fill="#7888ee" stroke="#111111" radius={[6, 6, 0, 0]} />
          <Line yAxisId="price" type="monotone" dataKey="medianPrice" stroke="#111111" strokeWidth={2.5} dot={{ r: 3, fill: "#ccff3f" }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
