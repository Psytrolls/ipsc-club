import React from "react";
import { useApp } from "../../context/AppContext";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div role="status" aria-live="polite" className="falcon-toasts">
      {toasts.map((toast) => {
        const isSuccess = toast.type === "success";
        const isError = toast.type === "error";

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl shadow-lg border text-sm animate-fade-in transition-all ${
              isSuccess
                ? "bg-[#102A1E] text-emerald-100 border-emerald-800"
                : isError
                  ? "bg-[#381313] text-rose-100 border-rose-800"
                  : "bg-graphite-900 text-gray-100 border-graphite-700"
            }`}
          >
            {isSuccess ? (
              <CheckCircle2
                size={18}
                className="text-emerald-400 shrink-0 mt-0.5"
              />
            ) : isError ? (
              <AlertCircle
                size={18}
                className="text-rose-400 shrink-0 mt-0.5"
              />
            ) : (
              <Info size={18} className="text-falcon-400 shrink-0 mt-0.5" />
            )}

            <div className="flex-1 leading-relaxed font-medium">
              {toast.message}
            </div>

            <button
              aria-label="סגירת הודעה"
              onClick={() => dismissToast(toast.id)}
              className="text-gray-400 hover:text-white shrink-0 p-0.5 rounded"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
