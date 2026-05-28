"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ValueProjectionResult } from "@/lib/valueProjection";

type Props = {
  projection: ValueProjectionResult;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function ValueProjectionChart({ projection }: Props) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={projection.points}
          margin={{ top: 12, right: 12, left: 8, bottom: 8 }}
        >
          <CartesianGrid stroke="#d7d7d1" strokeDasharray="3 3" />
          <XAxis
            dataKey="period"
            tick={{ fill: "#475569", fontSize: 12 }}
            axisLine={{ stroke: "#111111" }}
            tickLine={{ stroke: "#111111" }}
          />
          <YAxis
            tickFormatter={(value) => `$${Math.round(value / 1000)}k`}
            tick={{ fill: "#475569", fontSize: 12 }}
            axisLine={{ stroke: "#111111" }}
            tickLine={{ stroke: "#111111" }}
            width={60}
          />
          <Tooltip
            contentStyle={{
              border: "1.5px solid #111111",
              borderRadius: "12px",
              backgroundColor: "#f7f7f5",
              color: "#111111",
            }}
            formatter={(value, name) => {
              const numericValue =
                typeof value === "number"
                  ? value
                  : typeof value === "string"
                    ? Number(value)
                    : 0;

              return [
                formatCurrency(numericValue),
                name === "expected"
                  ? "Expected"
                  : name === "low"
                    ? "Low scenario"
                    : "High scenario",
              ];
            }}
          />
          <Area type="monotone" dataKey="high" stroke="#8a8a82" fill="#f2f2f0" strokeWidth={1.5} />
          <Area type="monotone" dataKey="low" stroke="#b3b3ab" fill="#e7e7e2" strokeWidth={1.5} />
          <Area type="monotone" dataKey="expected" stroke="#111111" fill="#ccff3f" strokeWidth={2.5} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
