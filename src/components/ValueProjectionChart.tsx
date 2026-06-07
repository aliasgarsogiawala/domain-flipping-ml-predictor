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
import { formatInrAxisFromUsd, formatInrFromUsd } from "@/lib/currency";
import type { ValueProjectionResult } from "@/lib/valueProjection";

type Props = {
  projection: ValueProjectionResult;
};

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
            tickFormatter={(value) => formatInrAxisFromUsd(Number(value))}
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
                formatInrFromUsd(numericValue),
                name === "expected"
                  ? "Expected"
                  : name === "low"
                    ? "Low scenario"
                    : "High scenario",
              ];
            }}
          />
          <Area type="monotone" dataKey="high" stroke="#8a8a82" fill="#f4ede5" strokeWidth={1.5} />
          <Area type="monotone" dataKey="low" stroke="#b3b3ab" fill="#efe2d3" strokeWidth={1.5} />
          <Area type="monotone" dataKey="expected" stroke="#111111" fill="#f48120" strokeWidth={2.5} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
