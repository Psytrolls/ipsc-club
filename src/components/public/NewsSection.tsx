import React, { useRef, useState, useEffect } from "react";
import { ArrowUpLeft, X, Trophy } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { NewsArticle, NewsCategory } from "../../types";
import { IpscMatchesHub } from "../common/IpscMatchesHub";

const labels: Record<NewsCategory, string> = {
  club: "המועדון",
  israel: "בישראל",
  world: "בעולם",
};

export const NewsSection: React.FC<{initialCategory?:NewsCategory|"all"|"matches"}> = ({initialCategory="all"}) => {
  const { news } = useApp();
  const [category, setCategory] = useState<NewsCategory | "all" | "matches">(initialCategory);
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (article) dialog.current?.showModal();
    else dialog.current?.close();
  }, [article]);
  const articles = news
    .filter(
      (n) =>
        n.status === "published" &&
        (category === "all" || n.category === category),
    )
    .slice(0, 3);
  return (
    <section id="news" className="section-space news-section">
      <div className="falcon-container">
        <div className="eyebrow">03 — מהשטח ומהעולם</div>
        <div className="section-heading">
          <h2>חדשות ותחרויות ירי מעשי</h2>
          <div className="filter-tabs" aria-label="סינון חדשות ותחרויות">
            <button
              aria-pressed={category === "all"}
              className={category === "all" ? "active" : ""}
              onClick={() => setCategory("all")}
            >
              הכול
            </button>
            <button
              aria-pressed={category === "matches"}
              className={category === "matches" ? "active text-amber-500 font-bold" : ""}
              onClick={() => setCategory("matches")}
            >
              🏆 תחרויות ופודיום (EOS)
            </button>
            {(["club", "israel", "world"] as const).map((c) => (
              <button
                aria-pressed={category === c}
                className={category === c ? "active" : ""}
                key={c}
                onClick={() => setCategory(c)}
              >
                {labels[c]}
              </button>
            ))}
          </div>
        </div>

        {category === "matches" ? (
          <div className="pt-4">
            <IpscMatchesHub />
          </div>
        ) : (
          <>
            <div className="news-grid">
              {articles.map((n) => (
                <article key={n.id} className="news-card">
                  <div
                    className={`news-art news-art-${n.category}`}
                    aria-hidden="true"
                  >
                    {n.imageUrl ? <img src={n.imageUrl} alt="" loading="lazy" className="w-full h-full object-cover" /> : <img src={n.category==='club'?'/assets/news-club.png':'/assets/range-hero-v2.webp'} alt="" loading="lazy" className="w-full h-full object-cover"/>}
                    <span>{labels[n.category]}</span>
                  </div>
                  <div className="news-card-body">
                    <div className="news-meta">
                      <span>{labels[n.category]}</span>
                      <time>{n.publishDate}</time>
                    </div>
                    <h3>{n.title}</h3>
                    <p>{n.excerpt}</p>
                    <button className="text-link" onClick={() => setArticle(n)}>
                      לכתבה המלאה <ArrowUpLeft size={17} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
            {articles.length === 0 && (
              <p className="empty-state">אין כתבות שפורסמו בקטגוריה זו.</p>
            )}
          </>
        )}
        <small className="content-demo-label">
          עדכונים מהמועדון, תחרויות ארציות בישראל ומבזקי עולם
        </small>
      </div>
      <dialog
        ref={dialog}
        className="article-dialog"
        onCancel={() => setArticle(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setArticle(null);
        }}
      >
        <div className="dialog-heading">
          <span className="eyebrow">{article && labels[article.category]}</span>
          <button
            className="icon-button"
            aria-label="סגירה"
            onClick={() => setArticle(null)}
          >
            <X size={20} />
          </button>
        </div>
        <h2>{article?.title}</h2>
        <p>{article?.excerpt}</p>
        <p>{article?.content}</p>
        {article?.sourceUrl && (
          <a
            className="text-link"
            href={article.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            למקור הכתבה <ArrowUpLeft size={17} />
          </a>
        )}
      </dialog>
    </section>
  );
};
