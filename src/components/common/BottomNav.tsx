import React from "react";
import { Home, Calendar, ChartNoAxesCombined, User } from "lucide-react";
export type ShooterTab = "overview" | "trainings" | "results" | "profile";
export const BottomNav: React.FC<{
  activeTab: ShooterTab;
  onSelectTab: (tab: ShooterTab) => void;
}> = ({ activeTab, onSelectTab }) => (
  <nav className="member-nav" aria-label="ניווט באזור האישי">
    <div>
      {(
        [
          { id: "overview", label: "בית", icon: Home },
          { id: "trainings", label: "אימונים", icon: Calendar },
          { id: "results", label: "תוצאות", icon: ChartNoAxesCombined },
          { id: "profile", label: "פרופיל", icon: User },
        ] as const
      ).map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          className={activeTab === id ? "active" : ""}
          aria-current={activeTab === id ? "page" : undefined}
          onClick={() => onSelectTab(id)}
        >
          <Icon size={21} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  </nav>
);
