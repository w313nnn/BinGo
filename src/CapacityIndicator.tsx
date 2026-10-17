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
export default function CapacityIndicator({ value, label }: { value: number; label: string }) {
  const root = useRef<HTMLDivElement>(null), bar = useRef<HTMLSpanElement>(null), text = useRef<HTMLSpanElement>(null);
  const visible = useAnimationActivity(root), reduced = useReducedMotion();
  const percent = safeCapacity(value), displayed = useRef(percent);
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
  return <div ref={root} className="capacity-indicator" role="progressbar" aria-label={`${label} capacity`}
    aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
    <div className="capacity-track" aria-hidden="true"><span ref={bar} style={{ background: color, transform: `scaleX(${toScale(percent)})` }} /></div>
    <span ref={text} className="capacity-number" aria-hidden="true" style={{ color }}>{roundPercent(percent)}%</span>
  </div>;
}
