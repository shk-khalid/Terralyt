import hotToast, { Toaster as HotToaster } from "react-hot-toast";
import { CheckCircle, AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import * as React from "react";

type ToastType = "success" | "warning" | "error" | "info";

const iconMap: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="h-5 w-5 text-esg-sage shrink-0" />,
  warning: <AlertTriangle className="h-5 w-5 text-esg-sand shrink-0" />,
  error: <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />,
  info: <Info className="h-5 w-5 text-esg-muted shrink-0" />,
};

/**
 * Drop‑in replacement for the old custom toast.
 * Signature is identical: toast(title, description?, type?)
 */
export const toast = (
  title: string,
  description?: string,
  type: ToastType = "info"
) => {
  hotToast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? "animate-enter" : "animate-leave"
        } pointer-events-auto bg-esg-clay border border-esg-moss shadow-lg rounded-xl p-4 flex items-start space-x-3 w-full max-w-sm`}
      >
        {/* Icon */}
        <div className="mt-0.5">{iconMap[type]}</div>

        {/* Content */}
        <div className="flex-1 space-y-1">
          <h4 className="text-sm font-semibold text-esg-dark">{title}</h4>
          {description && (
            <p className="text-xs text-esg-muted leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Close */}
        <button
          onClick={() => hotToast.dismiss(t.id)}
          className="text-esg-muted hover:text-esg-dark p-0.5 rounded transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    ),
    { duration: 4000 }
  );
};

/**
 * Global Toaster component — render once at the app root.
 * Replaces the old <ToastProvider>.
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <>
    {children}
    <HotToaster
      position="bottom-right"
      toastOptions={{ duration: 4000 }}
      containerStyle={{ zIndex: 9999 }}
    />
  </>
);
