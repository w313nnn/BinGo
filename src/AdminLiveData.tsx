import useAnimationActivity from "./useAnimationActivity";
import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "motion/react";

gsap.registerPlugin(useGSAP);

/** Keeps the accessible value exact while the decorative number catches up. */
export function AdminLiveValue({ value, suffix = "" }: { value: number; suffix?: string }) {
  const root = useRef<HTMLSpanElement>(null);
  const text = useRef<HTMLSpanElement>(null);
  const displayed = useRef({ value });
  const reduced = useReducedMotion();
  const active = useAnimationActivity(root);
  useGSAP(() => {
    const model = { value: displayed.current.value };
    const paint = () => { displayed.current.value = model.value; if (text.current) text.current.textContent = `${Math.round(model.value).toLocaleString()}${suffix}`; };
    if (reduced || !active) { model.value = value; paint(); return; }
    gsap.to(model, { value, duration: .55, ease: "power2.out", onUpdate: paint, onComplete: paint });
    gsap.fromTo(text.current, { opacity: .6, y: 3 }, { opacity: 1, y: 0, duration: .3, clearProps: "transform,opacity" });
  }, { scope: root, dependencies: [value, suffix, reduced, active], revertOnUpdate: true });
  return <span ref={root} className="admin-live-value" aria-label={`${value.toLocaleString()}${suffix}`}>
    <span ref={text} aria-hidden="true">{value.toLocaleString()}{suffix}</span>
  </span>;
}

export function AdminLiveMeter({ value, label, color }: { value: number; label: string; color: string }) {
  const root = useRef<HTMLDivElement>(null), fill = useRef<HTMLDivElement>(null);
  const displayed = useRef({ value: Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0)) });
  const reduced = useReducedMotion();
  const active = useAnimationActivity(root);
  const safeValue = Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
  useGSAP(() => {
    const model = { value: displayed.current.value };
    const paint = () => { displayed.current.value = model.value; if (fill.current) fill.current.style.transform = `scaleX(${model.value / 100})`; };
    if (reduced || !active) { model.value = safeValue; paint(); return; }
    gsap.to(model, { value: safeValue, duration: .65, ease: "power2.out", onUpdate: paint, onComplete: paint });
    paint();
  }, { scope: root, dependencies: [safeValue, reduced, active], revertOnUpdate: true });
  return <div ref={root} className="admin-live-meter" role="progressbar" aria-label={label}
    aria-valuemin={0} aria-valuemax={100} aria-valuenow={safeValue}>
    <div ref={fill} className={`admin-live-meter-fill ${color}`} style={{ transform: `scaleX(${safeValue / 100})` }} />
  </div>;
}
