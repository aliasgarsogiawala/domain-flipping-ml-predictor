"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";

type BackgroundComponentProps = {
  className?: string;
  children?: React.ReactNode;
};

export const Component = ({ className, children }: BackgroundComponentProps) => {
  const [count, setCount] = useState(0);
  void count;
  void setCount;

  return (
    <div className={cn("relative min-h-screen w-full overflow-hidden bg-white", className)}>
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
            radial-gradient(circle at center, #FFF991 0%, transparent 70%)
          `,
          opacity: 0.6,
          mixBlendMode: "multiply",
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default Component;
