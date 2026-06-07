"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

type Props = {
  domain: string;
  score: number;
  investmentScore: number;
  brandPrestigeScore: number;
  marketScore: number;
  liquidityScore: number;
  riskLevel: "Low" | "Medium" | "High";
};

function riskResistance(riskLevel: Props["riskLevel"]) {
  if (riskLevel === "Low") return 88;
  if (riskLevel === "Medium") return 58;
  return 28;
}

export default function DomainSignalRadarChart({
  domain,
  score,
  investmentScore,
  brandPrestigeScore,
  marketScore,
  liquidityScore,
  riskLevel,
}: Props) {
  const data = [
    { metric: "Score", value: score },
    { metric: "Invest", value: investmentScore },
    { metric: "Brand", value: brandPrestigeScore },
    { metric: "Market", value: marketScore },
    { metric: "Liquidity", value: liquidityScore },
    { metric: "Risk Res.", value: riskResistance(riskLevel) },
  ];

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="72%" data={data}>
          <PolarGrid stroke="#d7d7d1" />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fill: "#475569", fontSize: 12, fontWeight: 600 }}
          />
          <Radar
            name={domain}
            dataKey="value"
            stroke="#111111"
            fill="#f48120"
            fillOpacity={0.4}
            strokeWidth={2.2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
