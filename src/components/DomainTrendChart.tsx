"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ValueProjectionResult } from "@/lib/valueProjection";

type Props = {
  projection: ValueProjectionResult;
};

export default function DomainTrendChart({ projection }: Props) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={projection.points} margin={{ top: 12, right: 12, left: 8, bottom: 8 }}>
          <CartesianGrid stroke="#d7d7d1" strokeDasharray="3 3" />
          <XAxis
            dataKey="period"
            tick={{ fill: "#475569", fontSize: 12 }}
            axisLine={{ stroke: "#111111" }}
            tickLine={{ stroke: "#111111" }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: "#475569", fontSize: 12 }}
            axisLine={{ stroke: "#111111" }}
            tickLine={{ stroke: "#111111" }}
            width={40}
          />
          <Tooltip
            contentStyle={{
              border: "1.5px solid #111111",
              borderRadius: "12px",
              backgroundColor: "#f7f7f5",
              color: "#111111",
            }}
            formatter={(value, name) => {
              const label =
                name === "demandIndex"
                  ? "Buyer demand"
                  : name === "convictionIndex"
                    ? "Projection conviction"
                    : name;

              return [value, label];
            }}
          />
          <Line
            type="monotone"
            dataKey="demandIndex"
            stroke="#f48120"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#f48120", stroke: "#111111" }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="convictionIndex"
            stroke="#111111"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#111111" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
