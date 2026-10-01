import React from "react";
import { useApp } from "../../context/AppContext";
import { ArrowDownLeft, ArrowUpLeft, ShieldCheck } from "lucide-react";
export const Hero: React.FC<{
  onOpenCourseModal: () => void;
  onOpenJoinModal: () => void;
}> = ({ onOpenCourseModal, onOpenJoinModal }) => { const {pages}=useApp(); return (
  <section id="hero" className="falcon-hero">
    <div className="falcon-container hero-layout">
      <div className="hero-copy">
        <div className="eyebrow">
          <span className="small-line" />
          DESERT FALCON · IPSC
        </div>
        <h1>
          {pages.heroTitle}
          <br />
          <span>{pages.heroAccent}</span>
        </h1>
        <p>{pages.heroBody}</p>
        <div className="hero-actions">
          <button className="button-primary" onClick={onOpenCourseModal}>
            הרשמה לקורס <ArrowUpLeft size={19} />
          </button>
          <button className="button-outline" onClick={onOpenJoinModal}>
            הצטרפות למועדון
          </button>
        </div>
        <div className="hero-note">
          <ShieldCheck size={17} /> ספורט, אחריות והדרכה אישית
        </div>
      </div>
      <div className="hero-photo rounded-3xl overflow-hidden shadow-2xl border border-[#DFCEB0]/60">
        <img
          src="/assets/range-hero-v3.jpg"
          alt="ירי מעשי במדבר - מועדון דזרט פלקון"
          fetchPriority="high"
          width="1200"
          height="1200"
          className="w-full h-full object-cover rounded-3xl"
        />
      </div>
    </div>
    <div className="falcon-container hero-bottom">
      <span>ספורט • קהילה • התקדמות</span>
      <a href="#about">
        להכיר את המועדון <ArrowDownLeft size={17} />
      </a>
    </div>
  </section>
); };
