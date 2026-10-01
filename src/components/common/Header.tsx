import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { FalconLogo } from "./FalconLogo";
import { Menu, X, LogOut, UserRound } from "lucide-react";

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
  onOpenJoinModal,
  onOpenLoginModal,
  onNavigateSection,
  publicView = true,
  onShowPublic,
  onShowDashboard,
  currentPublicSection,
}) => {
  const { currentUser, activeRole, logoutUser, switchRole } = useApp();
  const [open, setOpen] = useState(false);
  const links = [
    ["hero", "בית"],
    ["about", "המועדון"],
    ["sport", "מה זה IPSC?"],
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
          className="header-menu icon-button"
          aria-label={open ? "סגירת תפריט" : "פתיחת תפריט"}
          aria-expanded={open}
          aria-controls="site-menu"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>

        <button
          className="brand-button"
          aria-label="נץ המדבר — דף הבית"
          onClick={() => navigate("hero")}
        >
          <FalconLogo />
        </button>

        <div className="header-actions">
          {currentUser ? (
            <button
              className="header-account"
              onClick={() => {
                setOpen(false);
                onShowDashboard?.();
              }}
              aria-label="האזור האישי"
            >
              {currentUser.avatarVersion ? (
                <img
                  src={
                    "/api/users/" +
                    encodeURIComponent(currentUser.id) +
                    "/photo?v=" +
                    currentUser.avatarVersion
                  }
                  alt=""
                />
              ) : (
                <UserRound size={20} />
              )}
              <span>האזור האישי</span>
            </button>
          ) : (
            <button className="button-small" onClick={onOpenLoginModal}>
              <UserRound size={19} />
              <span>כניסה</span>
            </button>
          )}
        </div>
      </div>

      {publicView && (
        <nav className="desktop-links" aria-label="ניווט ראשי">
          {links.slice(1).map(([id, label]) => (
            <button
              key={id}
              aria-current={currentPublicSection === id ? "location" : undefined}
              onClick={() => navigate(id)}
            >
              {label}
            </button>
          ))}
        </nav>
      )}

      {open && (
        <nav id="site-menu" className="mobile-links falcon-container" aria-label="תפריט האתר">
          {links.map(([id, label]) => (
            <button key={id} onClick={() => navigate(id)}>
              {label}
            </button>
          ))}
          <div className="menu-actions">
            <button
              className="button-primary"
              onClick={() => {
                setOpen(false);
                onOpenCourseModal();
              }}
            >
              הרשמה לקורס
            </button>
            <button
              className="button-outline"
              onClick={() => {
                setOpen(false);
                onOpenJoinModal();
              }}
            >
              הצטרפות למועדון
            </button>
          </div>
          {currentUser && (
            <>
              <button
                onClick={() => {
                  setOpen(false);
                  onShowDashboard?.();
                }}
              >
                האזור האישי
              </button>
              {currentUser.roles.filter((r) => r !== "guest").length > 1 && (
                <label className="role-menu">
                  בחירת אזור אישי
                  <select
                    className="role-select"
                    value={activeRole}
                    onChange={(e) => {
                      switchRole(e.target.value as typeof activeRole);
                      onShowDashboard?.();
                      setOpen(false);
                    }}
                  >
                    {currentUser.roles
                      .filter((r) => r !== "guest")
                      .map((r) => (
                        <option key={r} value={r}>
                          {r === "admin"
                            ? "ניהול המועדון"
                            : r === "instructor"
                              ? "אזור המדריך"
                              : "אזור היורה"}
                        </option>
                      ))}
                  </select>
                </label>
              )}
              <button
                onClick={async () => {
                  await logoutUser();
                  setOpen(false);
                  onShowPublic?.();
                }}
              >
                <LogOut size={18} />
                התנתקות
              </button>
            </>
          )}
        </nav>
      )}
    </header>
  );
};
