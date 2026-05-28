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
          <CartesianGrid stroke="#eceef2" strokeDasharray="3 3" />
          <XAxis
            dataKey="period"
            tick={{ fill: "#667085", fontSize: 12 }}
            axisLine={{ stroke: "#dfe2e7" }}
            tickLine={{ stroke: "#dfe2e7" }}
          />
          <YAxis
            tickFormatter={(value) => `$${Math.round(value / 1000)}k`}
            tick={{ fill: "#667085", fontSize: 12 }}
            axisLine={{ stroke: "#dfe2e7" }}
            tickLine={{ stroke: "#dfe2e7" }}
            width={60}
          />
          <Tooltip
            contentStyle={{
              border: "1px solid #dfe2e7",
              borderRadius: "12px",
              backgroundColor: "#ffffff",
              color: "#0f172a",
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
          <Area type="monotone" dataKey="high" stroke="#cbd5e1" fill="#f8fafc" strokeWidth={1.5} />
          <Area type="monotone" dataKey="low" stroke="#d0d5dd" fill="#eef2f6" strokeWidth={1.5} />
          <Area type="monotone" dataKey="expected" stroke="#F48120" fill="#fff2e8" strokeWidth={2.5} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
