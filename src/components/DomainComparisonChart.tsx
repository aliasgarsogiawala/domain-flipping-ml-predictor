"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ComparisonResult = {
  domain: string;
  score: number;
  investmentScore: number;
  brandPrestigeScore: number;
  adjustedEstimatedValueUsd: number;
  marketScore: number;
};

type Props = {
  primary: ComparisonResult;
  secondary: ComparisonResult;
};

function formatMetric(metric: string, value: number) {
  if (metric === "Estimated Value") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  }

  return value;
}

export default function DomainComparisonChart({ primary, secondary }: Props) {
  const data = [
    {
      metric: "Final Score",
      [primary.domain]: primary.score,
      [secondary.domain]: secondary.score,
    },
    {
      metric: "Investment Score",
      [primary.domain]: primary.investmentScore,
      [secondary.domain]: secondary.investmentScore,
    },
    {
      metric: "Brand Prestige",
      [primary.domain]: primary.brandPrestigeScore,
      [secondary.domain]: secondary.brandPrestigeScore,
    },
    {
      metric: "Estimated Value",
      [primary.domain]: primary.adjustedEstimatedValueUsd,
      [secondary.domain]: secondary.adjustedEstimatedValueUsd,
    },
    {
      metric: "Market Score",
      [primary.domain]: primary.marketScore,
      [secondary.domain]: secondary.marketScore,
    },
  ];

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 12, left: 8, bottom: 8 }}>
          <CartesianGrid stroke="#d7d7d1" strokeDasharray="3 3" />
          <XAxis
            dataKey="metric"
            tick={{ fill: "#475569", fontSize: 12 }}
            axisLine={{ stroke: "#111111" }}
            tickLine={{ stroke: "#111111" }}
          />
          <YAxis
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
            formatter={(value, _name, item) => {
              const numericValue =
                typeof value === "number"
                  ? value
                  : typeof value === "string"
                    ? Number(value)
                    : 0;

              return [
                formatMetric(item.payload.metric, numericValue),
                item.dataKey as string,
              ];
            }}
          />
          <Legend wrapperStyle={{ color: "#111111" }} />
          <Bar dataKey={primary.domain} fill="#ccff3f" stroke="#111111" radius={[6, 6, 0, 0]} />
          <Bar dataKey={secondary.domain} fill="#7c86e8" stroke="#111111" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
