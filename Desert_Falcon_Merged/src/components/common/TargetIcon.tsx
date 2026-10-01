import React from "react";
export { FalconLogo } from "./FalconLogo";
export const TargetIcon: React.FC<{
  className?: string;
  size?: number;
  showZones?: boolean;
}> = ({ className = "", size = 48, showZones = true }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 130"
    fill="none"
    className={className}
    aria-hidden="true"
  >
    <polygon
      points="25,4 75,4 96,25 96,105 75,126 25,126 4,105 4,25"
      stroke="currentColor"
      strokeWidth="2"
    />
    {showZones && (
      <>
        <polygon
          points="32,16 68,16 84,32 84,98 68,114 32,114 16,98 16,32"
          stroke="currentColor"
          opacity=".6"
          strokeDasharray="3 3"
        />
        <rect
          x="35"
          y="36"
          width="30"
          height="58"
          stroke="currentColor"
          opacity=".6"
          strokeDasharray="3 3"
        />
      </>
    )}
  </svg>
);
