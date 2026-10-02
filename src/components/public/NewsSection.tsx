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
  const articles = [...news]
    .filter(
      (n) =>
        n.status === "published" &&
        (category === "all" || n.category === category),
    )
    .sort((a, b) => b.publishDate.localeCompare(a.publishDate));
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
                <article key={n.id} className="news-card group">
                  <div
                    className={`news-art news-art-${n.category} cursor-pointer relative overflow-hidden`}
                    aria-hidden="true"
                    onClick={() => setArticle(n)}
                  >
                    {n.imageUrl ? (
                      <img
                        src={n.imageUrl}
                        alt={n.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <img
                        src={n.category === 'club' ? '/assets/news-club.png' : '/assets/range-hero-v2.webp'}
                        alt=""
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <span className="text-white text-xs font-bold bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-lg">
                        לחץ לצפייה בכתבה ובפוסטר המלא
                      </span>
                    </div>
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
                      לכתבה ולפוסטר המלא <ArrowUpLeft size={17} />
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
        className="article-dialog max-w-2xl"
        onCancel={() => setArticle(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setArticle(null);
        }}
      >
        <div className="dialog-heading flex items-center justify-between pb-3 border-b border-[#DFCEB0]/50 mb-4">
          <span className="eyebrow">{article && labels[article.category]}</span>
          <button
            className="icon-button p-1.5 rounded-full hover:bg-gray-100 transition"
            aria-label="סגירה"
            onClick={() => setArticle(null)}
          >
            <X size={20} />
          </button>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-graphite-900 mb-3">{article?.title}</h2>

        {article?.imageUrl && (
          <div className="my-4 rounded-2xl overflow-hidden border border-[#DFCEB0] bg-[#1a1f1e] shadow-md flex justify-center p-1 sm:p-2">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="max-h-[70vh] w-auto max-w-full object-contain rounded-xl shadow-lg"
            />
          </div>
        )}

        <p className="font-bold text-base text-graphite-800 leading-relaxed mb-3">{article?.excerpt}</p>
        <p className="whitespace-pre-line text-sm text-graphite-700 leading-relaxed">{article?.content}</p>

        {article?.sourceUrl && (
          <div className="mt-4 pt-3 border-t border-[#DFCEB0]/40">
            <a
              className="text-link inline-flex items-center gap-1 font-bold text-falcon-700 hover:text-falcon-900"
              href={article.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              למקור הכתבה <ArrowUpLeft size={17} />
            </a>
          </div>
        )}
      </dialog>
    </section>
  );
};
