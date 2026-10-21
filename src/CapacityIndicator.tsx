import { localizeText } from "./i18n";
import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "motion/react";
import useAnimationActivity from "./useAnimationActivity";
gsap.registerPlugin(useGSAP);
const clampPercent = gsap.utils.clamp(0, 100);
const toScale = gsap.utils.mapRange(0, 100, 0, 1);
const roundPercent = gsap.utils.snap(1);
export function safeCapacity(value: number) { return clampPercent(Number.isFinite(value) ? value : 0); }
export default function CapacityIndicator({ value, label, stale = false, loading = false, updatedAtMs }: { value?: number; label: string; stale?: boolean; loading?: boolean; updatedAtMs?: number | null }) {
  const root = useRef<HTMLDivElement>(null), bar = useRef<HTMLSpanElement>(null), text = useRef<HTMLSpanElement>(null);
  const available = value !== undefined && !stale;
  const percent = safeCapacity(available ? value : 0);
  const visible = useAnimationActivity(root), reduced = useReducedMotion();
  const displayed = useRef(percent);
  useGSAP(() => {
    const model = { value: displayed.current };
    let last = -1;
    const paint = () => {
      displayed.current = model.value;
      if (bar.current) bar.current.style.transform = `scaleX(${toScale(model.value)})`;
      const rounded = roundPercent(model.value);
      if (text.current && last !== rounded) { text.current.textContent = `${rounded}%`; last = rounded; }
    };
    if (reduced || !visible) { model.value = percent; paint(); return; }
    gsap.to(model, { value: percent, duration: .6, ease: "power2.out", onUpdate: paint, onComplete: paint });
    paint();
  }, { scope: root, dependencies: [percent, visible, reduced], revertOnUpdate: true });
  const color = percent >= 80 ? "#DC4545" : percent >= 50 ? "#F39B16" : "#009B70";
  if (!available) {
    return <div className="capacity-indicator" aria-label={localizeText(`${label} capacity unavailable`)}>
      <span className="text-[10px] text-slate-500">{localizeText(loading ? "Loading capacity…" : stale ? "Capacity reading is outdated" : "Capacity unavailable")}</span>
    </div>;
  }
  return <div ref={root} className="capacity-indicator" role="progressbar" aria-label={localizeText(`${label} capacity`)}
    aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
    <div className="capacity-track" aria-hidden="true"><span ref={bar} style={{ background: color, transform: `scaleX(${toScale(percent)})` }} /></div>
    <span className="flex flex-col items-end">
      <span ref={text} className="capacity-number" aria-hidden="true" style={{ color }}>{localizeText(roundPercent(percent))}%</span>
      {updatedAtMs && <span className="text-[8px] font-normal text-slate-500 whitespace-nowrap">{localizeText("Updated ")}{localizeText(new Date(updatedAtMs).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }))}</span>}
    </span>
  </div>;
}
