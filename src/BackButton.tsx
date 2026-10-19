import { localizeText } from "./i18n";
import { ChevronLeft } from "lucide-react";

export default function BackButton({ onClick, label = "Back" }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={localizeText(label)} title={localizeText(label)}
      className="icon-button inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-emerald-800 transition-colors hover:bg-emerald-50 focus-visible:bg-emerald-50">
      <ChevronLeft aria-hidden="true" className="h-5 w-5" strokeWidth={2.2} />
    </button>
  );
}
