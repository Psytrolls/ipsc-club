import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { FalconLogo } from "./FalconLogo";
import { Menu, X, LogOut, ArrowUpLeft } from "lucide-react";
interface HeaderProps {
  onOpenCourseModal: () => void;
  onOpenJoinModal: () => void;
  onOpenLoginModal: () => void;
  currentPublicSection?: string;
  onNavigateSection?: (id: string) => void;
  publicView?: boolean;
  onShowPublic?: () => void;
  onShowDashboard?: () => void;
}
export const Header: React.FC<HeaderProps> = ({
  onOpenCourseModal,
  onOpenLoginModal,
  onNavigateSection,
  publicView = true,
  onShowPublic,
  onShowDashboard,
}) => {
  const { currentUser, activeRole, logoutUser, switchRole } = useApp();
  const [open, setOpen] = useState(false);
  const links = [
    ["about", "המועדון"],
    ["sport", "הספורט"],
    ["news", "חדשות"],
    ["faq", "שאלות נפוצות"],
  ];
  function navigate(id: string) {
    setOpen(false);
    onShowPublic?.();
    onNavigateSection?.(id);
  }
  return (
    <header className="falcon-header">
      <div className="falcon-container header-inner">
        <button
          className="brand-button"
          aria-label="דף הבית"
          onClick={() => navigate("hero")}
        >
          <FalconLogo />
        </button>
        {publicView && (
          <nav className="desktop-links" aria-label="ניווט ראשי">
            {links.map(([id, label]) => (
              <button key={id} onClick={() => navigate(id)}>
                {label}
              </button>
            ))}
          </nav>
        )}
        <div className="header-actions">
          {currentUser ? (
            <>
              {currentUser.roles.length > 1 && !publicView ? (
                <select
                  className="role-select"
                  aria-label="בחירת אזור אישי"
                  value={activeRole}
                  onChange={(e) =>
                    switchRole(e.target.value as typeof activeRole)
                  }
                >
                  {currentUser.roles
                    .filter((r) => r !== "guest")
                    .map((r) => (
                      <option key={r} value={r}>
                        {r === "admin"
                          ? "אזור מנהל"
                          : r === "instructor"
                            ? "אזור מדריך"
                            : "אזור יורה"}
                      </option>
                    ))}
                </select>
              ) : (
                <button
                  className="button-small"
                  onClick={() => {
                    setOpen(false);
                    onShowDashboard?.();
                  }}
                >
                  האזור האישי
                </button>
              )}
              <button
                className="icon-button"
                aria-label="התנתקות"
                onClick={() => {
                  logoutUser();
                  onShowPublic?.();
                }}
              >
                <LogOut size={19} />
              </button>
            </>
          ) : (
            <>
              <button className="button-small" onClick={onOpenLoginModal}>
                כניסה לחברים <ArrowUpLeft size={16} />
              </button>
              <button className="header-course" onClick={onOpenCourseModal}>
                הרשמה לקורס
              </button>
            </>
          )}
          <button
            className="icon-button mobile-menu-button"
            aria-label={open ? "סגירת תפריט" : "פתיחת תפריט"}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="mobile-links falcon-container" aria-label="ניווט בנייד">
          {links.map(([id, label]) => (
            <button key={id} onClick={() => navigate(id)}>
              {label}
            </button>
          ))}
          {currentUser && (
            <button
              onClick={() => {
                setOpen(false);
                logoutUser();
                onShowPublic?.();
              }}
            >
              התנתקות
            </button>
          )}
        </nav>
      )}
    </header>
  );
};
