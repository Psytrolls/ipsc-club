import React from "react";
import { ArrowUpLeft, Instagram, Facebook, MessageCircle } from "lucide-react";
import { FalconLogo } from "./FalconLogo";
import { useApp } from "../../context/AppContext";
export const Footer: React.FC<{
  onOpenCourseModal: () => void;
  onOpenJoinModal: () => void;
}> = ({ onOpenCourseModal, onOpenJoinModal }) => {
  const {pages}=useApp();
  const socials=[{name:"WhatsApp",url:pages.whatsappUrl,Icon:MessageCircle},{name:"Instagram",url:pages.instagramUrl,Icon:Instagram},{name:"Facebook",url:pages.facebookUrl,Icon:Facebook}].filter(item=>item.url);
  return (
  <footer className="falcon-footer">
    <div className="falcon-container">
      <div className="footer-cta">
        <div className="eyebrow">YOUR NEXT STEP</div>
        <h2>
          האימון הבא שלכם
          <br />
          מתחיל כאן.
        </h2>
        <div className="hero-actions">
          <button className="button-primary" onClick={onOpenCourseModal}>
            הרשמה לקורס <ArrowUpLeft size={19} />
          </button>
          <button className="button-outline" onClick={onOpenJoinModal}>
            הצטרפות למועדון
          </button>
        </div>
      </div>
      {socials.length>0&&<nav className="footer-socials" aria-label="הרשתות החברתיות של המועדון">
        <span>נשארים בקשר</span>
        <div>{socials.map(({name,url,Icon})=><a key={name} href={url} target="_blank" rel="noopener noreferrer" aria-label={`${name} — נץ המדבר (נפתח בחלון חדש)`}><Icon size={20} aria-hidden="true"/><span dir="ltr">{name}</span></a>)}</div>
      </nav>}
      <div className="footer-bottom">
        <FalconLogo />
        <span>© {new Date().getFullYear()} Desert Falcon</span>
        <small>התשלום במקום בלבד · מועדי אימונים לחברים פעילים בלבד</small>
      </div>
    </div>
  </footer>
);
};
