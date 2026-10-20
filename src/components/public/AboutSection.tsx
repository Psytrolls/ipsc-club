import React from "react";
import {useApp} from "../../context/AppContext";
import { PureIpscTarget } from "../common/FalconLogo";
import { Users, Target, MessageSquare } from "lucide-react";
export const AboutSection: React.FC = () => {const {pages}=useApp(); return (
  <section id="about" className="section-space">
    <div className="falcon-container about-layout">
      <div>
        <div className="eyebrow">01 / המועדון</div>
        <h2>{pages.aboutTitle}</h2>
        <p className="section-copy">{pages.aboutBody}</p>
        <details className="about-details" open><summary className="button-outline" style={{display:'none'}}>קראו עוד</summary><div className="value-list">
          {[
            {
              icon: Users,
              title: "קהילה שמתקדמת יחד",
              text: "סביבה מקצועית ותומכת ליורים מתחילים ומנוסים כאחד.",
            },
            {
              icon: Target,
              title: "דיוק ומעקב תוצאות",
              text: "ניתוח Hit Factor אישי, סטטיסטיקות ומעקב דינמי לאורך זמן.",
            },
            {
              icon: MessageSquare,
              title: "הדרכה אישית ממוקדת",
              text: "משוב מדריכים מוסמכים ודגשים ברורים ומעשיים לכל אימון.",
            },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title}>
              <span className="value-icon">
                <Icon size={21} />
              </span>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </div>
          ))}
        </div></details>
      </div>
      <div className="target-art">
        <span className="eyebrow" dir="ltr">
          FOCUS ON YOUR PROGRESS
        </span>
        <PureIpscTarget size={210} />
        <div className="target-art-caption">
          <span>דיוק מתחיל בתשומת לב.</span>
          <small>איור גרפי בהשראת מטרות הספורט</small>
        </div>
      </div>
    </div>
  </section>
); };
