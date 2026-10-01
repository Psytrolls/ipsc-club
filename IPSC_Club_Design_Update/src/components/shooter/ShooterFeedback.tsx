import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { TargetIcon } from "../common/TargetIcon";
import {
  MessageSquare,
  Award,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Clock,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";

export const ShooterFeedback: React.FC<{
  selectedFeedbackId?: string | null;
}> = ({ selectedFeedbackId }) => {
  const { getMyFeedbacks, getMyFocusItems, updateFocusItemStatus } = useApp();
  const [activeTab, setActiveTab] = useState<"focus" | "feedbacks">(
    selectedFeedbackId ? "feedbacks" : "focus",
  );
  useEffect(() => {
    if (selectedFeedbackId) setActiveTab("feedbacks");
  }, [selectedFeedbackId]);
  useEffect(() => {
    if (selectedFeedbackId && activeTab === "feedbacks")
      document
        .getElementById(`feedback-${selectedFeedbackId}`)
        ?.scrollIntoView({ behavior: "auto", block: "start" });
  }, [selectedFeedbackId, activeTab]);

  const feedbacks = getMyFeedbacks();
  const focusItems = getMyFocusItems();

  return (
    <div className="space-y-4 max-w-lg mx-auto pb-12 text-right">
      <div className="pt-2">
        <h2 className="text-2xl font-black text-graphite-900">
          משוב ודגשים אישיים
        </h2>
        <p className="text-sm text-graphite-500">
          סיכום מקצועי מצוות המדריכים ומעקב לאימון הבא
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-[#EFE6D5]/60 rounded-2xl border border-[#DFCEB0] text-sm font-bold">
        <button
          onClick={() => setActiveTab("focus")}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "focus"
              ? "bg-[#8C6228] text-white shadow-sm"
              : "text-graphite-700 hover:text-graphite-900"
          }`}
        >
          <TrendingUp size={14} />
          <span>
            דגשים לאימון הבא (
            {focusItems.filter((i) => i.status !== "completed").length})
          </span>
        </button>

        <button
          onClick={() => setActiveTab("feedbacks")}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "feedbacks"
              ? "bg-[#8C6228] text-white shadow-sm"
              : "text-graphite-700 hover:text-graphite-900"
          }`}
        >
          <MessageSquare size={14} />
          <span>משובי אימונים ({feedbacks.length})</span>
        </button>
      </div>

      {/* Focus Items Tab */}
      {activeTab === "focus" && (
        <div className="space-y-3">
          <div className="bg-falcon-50 border border-falcon-200 p-3.5 rounded-2xl text-sm text-falcon-900 leading-relaxed flex items-start gap-2">
            <Award size={16} className="text-falcon-600 shrink-0 mt-0.5" />
            <span>
              דגשים מוגדרים ע״י המדריך בסיום האימון. דגש שטרם הושלם יועבר
              אוטומטית למדריך באימון הבא שלך לשמירה על רצף מקצועי.
            </span>
          </div>

          {focusItems.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-[#EFE6D5]">
              <p className="text-sm text-graphite-500">
                אין עדיין דגשים פעילים
              </p>
            </div>
          ) : (
            focusItems.map((item) => {
              const isOpen = item.status === "open";
              const isInProgress = item.status === "in_progress";
              const isCompleted = item.status === "completed";

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-3xl border transition-all ${
                    isCompleted
                      ? "bg-gray-50/70 border-gray-200 opacity-80"
                      : "bg-white border-[#EFE6D5] shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span
                        className={`text-sm font-bold px-2 py-0.5 rounded-full inline-block mb-1 ${
                          item.priority === "high"
                            ? "bg-rose-100 text-rose-800"
                            : item.priority === "medium"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        עדיפות{" "}
                        {item.priority === "high"
                          ? "גבוהה"
                          : item.priority === "medium"
                            ? "בינונית"
                            : "רגילה"}
                      </span>
                      <h3
                        className={`font-bold text-sm ${isCompleted ? "text-graphite-500 line-through" : "text-graphite-900"}`}
                      >
                        {item.title}
                      </h3>
                    </div>

                    <span
                      className={`text-sm font-bold px-2.5 py-1 rounded-full shrink-0 ${
                        isInProgress
                          ? "bg-[#E8DCB8] text-falcon-900"
                          : isCompleted
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-blue-50 text-blue-800"
                      }`}
                    >
                      {isInProgress ? "במעקב" : isCompleted ? "הושלם" : "פתוח"}
                    </span>
                  </div>

                  <p className="text-sm text-graphite-600 leading-relaxed mb-3">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between text-sm text-graphite-500 pt-2 border-t border-gray-100">
                    <span>
                      מדריך יוצר: {item.instructorName} ({item.createdDate})
                    </span>
                    {isCompleted && <span>הושלם ב: {item.completedDate}</span>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Feedbacks Timeline Tab */}
      {activeTab === "feedbacks" && (
        <div className="space-y-4">
          {feedbacks.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-[#EFE6D5]">
              <p className="text-sm text-graphite-500">טרם פורסם משוב עבורך</p>
            </div>
          ) : (
            feedbacks.map((fb) => (
              <div
                id={`feedback-${fb.id}`}
                key={fb.id}
                className="bg-white rounded-3xl border border-[#EFE6D5] p-5 shadow-sm space-y-4"
              >
                <div className="flex items-start justify-between border-b border-[#F4EFE6] pb-3">
                  <div>
                    <div className="text-sm font-bold text-falcon-700">
                      {fb.trainingTitle}
                    </div>
                    <div className="text-sm text-graphite-500 font-mono">
                      תאריך: {fb.trainingDate}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-graphite-800">
                      מדריך: {fb.instructorName}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-graphite-800 mb-1">
                    סיכום כללי:
                  </h4>
                  <p className="text-sm text-graphite-600 bg-[#FAF8F5] p-3 rounded-2xl border border-[#EFE6D5] leading-relaxed">
                    {fb.summary}
                  </p>
                </div>

                {fb.strengths && fb.strengths.length > 0 && (
                  <div>
                    <h4 className="font-bold text-sm text-emerald-800 mb-1.5 flex items-center gap-1">
                      <CheckCircle2 size={13} className="text-emerald-600" />
                      <span>נקודות חוזק ושימור:</span>
                    </h4>
                    <ul className="space-y-1 text-sm text-graphite-700 pr-2">
                      {fb.strengths.map((str, i) => (
                        <li
                          key={i}
                          className="list-disc list-inside text-graphite-600"
                        >
                          {str}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {fb.improvements && fb.improvements.length > 0 && (
                  <div>
                    <h4 className="font-bold text-sm text-amber-800 mb-1.5 flex items-center gap-1">
                      <AlertCircle size={13} className="text-amber-600" />
                      <span>נושאים לשיפור ותרגול:</span>
                    </h4>
                    <ul className="space-y-1 text-sm text-graphite-700 pr-2">
                      {fb.improvements.map((imp, i) => (
                        <li
                          key={i}
                          className="list-disc list-inside text-graphite-600"
                        >
                          {imp}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
