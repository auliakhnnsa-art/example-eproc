import React from "react";

interface SASLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const SASLogo: React.FC<SASLogoProps> = ({
  className = "",
  size = 56,
  showText = true,
}) => {
  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      {/* SAS Geometric Pinwheel Emblem */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Top-Left Wing */}
        <polygon
          points="8,10 46,10 48,46 16,36"
          fill="#0D2E68"
        />
        {/* Top-Right Wing */}
        <polygon
          points="54,10 92,10 84,36 52,46"
          fill="#17448E"
        />
        {/* Bottom-Left Wing */}
        <polygon
          points="16,64 48,54 46,90 8,90"
          fill="#1E52A8"
        />
        {/* Bottom-Right Wing */}
        <polygon
          points="52,54 84,64 92,90 54,90"
          fill="#0F387D"
        />
        {/* Subtle center negative cross/diamond */}
        <polygon
          points="50,44 56,50 50,56 44,50"
          fill="#FFFFFF"
        />
      </svg>

      {/* SAS Typography */}
      {showText && (
        <span
          className="text-slate-900 font-extrabold tracking-widest uppercase mt-0.5 leading-none"
          style={{
            fontSize: `${Math.round(size * 0.32)}px`,
            fontFamily: "Arial, Helvetica, sans-serif",
            letterSpacing: "0.18em",
          }}
        >
          SAS
        </span>
      )}
    </div>
  );
};
