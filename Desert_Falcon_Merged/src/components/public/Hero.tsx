import React from "react";
import {useApp} from "../../context/AppContext";
import {UserPlus, Crosshair} from "lucide-react";
export const Hero: React.FC<{onOpenCourseModal:()=>void;onOpenJoinModal:()=>void}>=({onOpenCourseModal,onOpenJoinModal})=>{
 const {pages}=useApp();
 return <section id="hero" className="falcon-hero">
  <img className="hero-backdrop" src="/assets/range-approved.webp" alt="מטווח ספורטיבי במדבר עם מטרות IPSC" fetchPriority="high" width="1200" height="800"/>
  <div className="hero-wash" aria-hidden="true"/>
  <div className="falcon-container hero-layout"><div className="hero-copy">
   <span className="eyebrow">נץ המדבר · DESERT FALCON</span>
   <h1>{pages.heroTitle}</h1>
   <p className="hero-motto">ספורט <span>•</span> קהילה <span>•</span> התקדמות</p>
   <div className="hero-actions">
    <button className="button-primary" onClick={onOpenCourseModal}><Crosshair size={20}/>הרשמה לקורס</button>
    <button className="button-outline" onClick={onOpenJoinModal}><UserPlus size={20}/>הצטרפות למועדון</button>
   </div>
  </div></div>
  <div className="hero-intro falcon-container">{pages.heroAccent&&<strong>{pages.heroAccent}</strong>}<p>{pages.heroBody}</p></div>
 </section>;
};
