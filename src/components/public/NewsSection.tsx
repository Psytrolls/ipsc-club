import React, { useRef, useState, useEffect } from "react";
import { ArrowUpLeft, X } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { NewsArticle, NewsCategory } from "../../types";
const labels: Record<NewsCategory, string> = {
  club: "המועדון",
  israel: "בישראל",
  world: "בעולם",
};
export const NewsSection: React.FC = () => {
  const { news } = useApp();
  const [category, setCategory] = useState<NewsCategory | "all">("all");
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
          <h2>תמיד בתנועה.</h2>
          <div className="filter-tabs" aria-label="סינון חדשות">
            {(["all", "club", "israel", "world"] as const).map((c) => (
              <button
                aria-pressed={category === c}
                className={category === c ? "active" : ""}
                key={c}
                onClick={() => setCategory(c)}
              >
                {c === "all" ? "הכול" : labels[c]}
              </button>
            ))}
          </div>
        </div>
        <div className="news-grid">
          {articles.map((n) => (
            <article key={n.id} className="news-card">
              <div
                className={`news-art news-art-${n.category}`}
                aria-hidden="true"
              >
                {n.imageUrl ? <img src={n.imageUrl} alt="" loading="lazy" className="w-full h-full object-cover" /> : <svg viewBox="0 0 260 150">
                  <path d="M0 120 Q100 70 260 105 V150 H0Z" />
                  <polygon points="106,21 154,21 174,41 174,109 154,129 106,129 86,109 86,41" />
                  <rect x="116" y="55" width="28" height="45" />
                </svg>}
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
        <small className="content-demo-label">
          עדכונים מהמועדון, מישראל ומהעולם
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
