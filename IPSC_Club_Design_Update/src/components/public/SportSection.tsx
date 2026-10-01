import React from "react";
import {useApp} from "../../context/AppContext";
import { Target, Zap, ShieldCheck } from "lucide-react";
export const SportSection: React.FC = () => {const {pages}=useApp(); return (
  <section id="sport" className="section-space sport-section">
    <div className="falcon-container">
      <div className="eyebrow">02 — הספורט</div>
      <div className="section-heading">
        <h2>{pages.sportTitle}</h2>
        <p>{pages.sportBody}</p>
      </div>
      <div className="ipsc-history" aria-labelledby="ipsc-history-title">
        <div className="ipsc-history-intro">
          <span className="eyebrow">מאז 1976</span>
          <h3 id="ipsc-history-title">מה זה IPSC — ואיך הכול התחיל?</h3>
          <p>IPSC הוא ארגון הירי המעשי הבינלאומי — International Practical Shooting Confederation. זהו ספורט תחרותי ודינמי המשלב פגיעות מדויקות, זמן ביצוע ותכנון מסלול, במסגרת כללים ברורים ופיקוח שופטים.</p>
        </div>
        <div className="ipsc-history-story">
          <p>במאי 1976 נפגשו בקולומביה שבמיזורי, ארצות הברית, נציגים ממדינות שונות כדי להקים מסגרת בינלאומית משותפת לירי מעשי. בכנס נוסד IPSC וג׳ף קופר נבחר לנשיא הראשון. המפגש הניח את הבסיס לארגון, לחוקה ולכללי הספורט.</p>
          <p>מאז התפתח הירי המעשי לענף בינלאומי עם מועדונים, תחרויות ואליפויות עולם. התרגילים משתנים מתחרות לתחרות ומציבים אתגר חדש של ריכוז, תנועה וקבלת החלטות. הקפדה על בטיחות ועל כללי הספורט מלווה כל השתתפות.</p>
          <div className="ipsc-history-motto"><strong dir="ltr">DVC</strong><div><span>דיוק · עוצמה · מהירות</span><small dir="ltr">Diligentia · Vis · Celeritas</small></div></div>
          <small>שלושת העקרונות משלימים זה את זה — התוצאה נבנית מהאיזון ביניהם.</small>
          <a className="text-link mt-3" href="https://www.ipsc.org/1976-columbia-conference/" target="_blank" rel="noopener noreferrer">ההיסטוריה באתר IPSC הרשמי</a>
        </div>
      </div>
      <div className="sport-grid">
        {[
          {
            icon: Target,
            n: "01",
            title: "דיוק",
            text: "תוצאות מדידות ומעקב אישי אחר הביצועים.",
          },
          {
            icon: Zap,
            n: "02",
            title: "קצב והתקדמות",
            text: "ספורט דינמי, עם מטרות אישיות מאימון לאימון.",
          },
          {
            icon: ShieldCheck,
            n: "03",
            title: "בטיחות ואחריות",
            text: "הדרכה מקצועית ותרבות ספורט אחראית לאורך הדרך.",
          },
        ].map(({ icon: Icon, n, title, text }) => (
          <article key={n}>
            <div>
              <Icon size={25} />
              <span>{n}</span>
            </div>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
      <div className="mt-8 space-y-3"><h3>מקורות מידע על הספורט וההרשמה</h3><p>כללי ספורט והסמכה — המועדון יאשר את דרישות הקבלה והמסמכים הרלוונטיים למסלול שלכם.</p><div className="flex flex-wrap gap-4"><a className="text-link" target="_blank" rel="noopener noreferrer" href="https://www.ipsc.org/">הארגון הבינלאומי — IPSC</a><a className="text-link" target="_blank" rel="noopener noreferrer" href="https://ipsa.org.il/">איגוד הירי המעשי בישראל</a></div><small>מידע נוסף על הספורט, כללים ותחרויות באתרי הארגונים בישראל ובעולם.</small></div>
    </div>
  </section>
); };
