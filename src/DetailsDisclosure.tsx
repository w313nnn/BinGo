import { localizeText } from "./i18n";
import { useState, type ReactNode } from "react";
import AnimatedIcon from "./AnimatedIcon";

export default function DetailsDisclosure({ label = "Details", children }: { label?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <details className="details-disclosure" onToggle={event => setOpen(event.currentTarget.open)}>
    <summary><span>{localizeText(label)}</span><AnimatedIcon name={open ? "up" : "down"} className="w-4 h-4" /></summary>
    <div className="details-content">{localizeText(children)}</div>
  </details>;
}
