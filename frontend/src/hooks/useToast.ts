import { useContext } from "react";
import { ToastContext, type ToastContextValue } from "@/components/ui/ToastProvider";

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}