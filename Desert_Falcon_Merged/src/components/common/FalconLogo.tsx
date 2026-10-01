import React from "react";
export const FalconLogo: React.FC<{
  className?: string;
  size?: "sm" | "md" | "lg";
}> = ({ className = "", size = "md" }) => (
  <div className={`falcon-brand falcon-brand-${size} ${className}`} dir="ltr">
    <img
      src="/assets/desert-falcon-official.png"
      alt="Desert Falcon IPSC Shooting Club"
      className="official-club-logo"
      width="640"
      height="640"
    />
    <div>
      <strong>DESERT FALCON</strong>
      <span dir="rtl">נץ המדבר · מועדון ירי מעשי</span>
    </div>
  </div>
);
export const PureIpscTarget: React.FC<{
  className?: string;
  size?: number;
  interactive?: boolean;
  onZoneClick?: (zone: string) => void;
}> = ({ className = "", size = 180, interactive = false, onZoneClick }) => (
  <svg
    width={size}
    height={size * 1.3}
    viewBox="0 0 100 130"
    className={className}
    aria-hidden={!interactive}
  >
    <polygon
      points="25,4 75,4 96,25 96,105 75,126 25,126 4,105 4,25"
      fill="#dbc7a7"
      stroke="#9b7c53"
      strokeWidth="1.2"
    />
    <polygon
      points="32,16 68,16 84,32 84,98 68,114 32,114 16,98 16,32"
      fill="none"
      stroke="#9b7c53"
      strokeDasharray="3 3"
    />
    <rect
      x="35"
      y="36"
      width="30"
      height="58"
      fill="#e8d9c1"
      stroke="#9b7c53"
      strokeDasharray="3 3"
    />
    <text x="50" y="71" textAnchor="middle" fill="#806442" fontSize="14">
      A
    </text>
    {interactive && (
      <foreignObject x="18" y="95" width="64" height="26">
        <button
          aria-label="מידע על אזור A"
          onClick={() => onZoneClick?.("A")}
          style={{ width: "100%", fontSize: 11 }}
        >
          אזור A
        </button>
      </foreignObject>
    )}
  </svg>
);
export const DesertDuneBg: React.FC<{ className?: string }> = ({
  className = "",
}) => (
  <svg viewBox="0 0 400 150" aria-hidden="true" className={className}>
    <path d="M0 100 Q100 60 240 110 T400 70 V150 H0Z" fill="#e8dece" />
    <path d="M0 130 Q160 80 400 125 V150 H0Z" fill="#d7c4a5" />
  </svg>
);
