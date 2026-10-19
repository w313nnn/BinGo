import { localizeText } from "./i18n";
import { useEffect, useRef, type CSSProperties, type ReactNode, type MouseEventHandler } from "react";
import { useReducedMotion } from "motion/react";
import useAnimationActivity from "./useAnimationActivity";

type Props = { children: ReactNode; as?: "button" | "span"; size?: "sm" | "md" | "lg"; radius?: number;
  tint?: string; tintOpacity?: number; textColor?: string; lineColor?: string; baseColor?: string;
  intensity?: number; idleIntensity?: number; shineSize?: number; shineFade?: number; thickness?: number;
  glow?: number; followMouse?: boolean; proximity?: number; sparkle?: boolean; className?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>; disabled?: boolean; };
/** Specular surface for actions or informational badges with the supplied component API. */
export default function SpecularButton({ children, as = "button", size = "md", radius = 18,
  tint = "#ffffff", tintOpacity = .04, textColor = "#f5f5f5", lineColor = "#ffffff", baseColor = "#525252",
  intensity = 1, idleIntensity = .35, shineSize = 10, shineFade = 34, thickness = 1.2, glow = 1,
  followMouse = true, proximity = 250, sparkle = false, className = "", onClick, disabled }: Props) {
  const root = useRef<HTMLSpanElement>(null);
  const active = useAnimationActivity(root), reduced = useReducedMotion();
  useEffect(() => {
    const el = root.current;
    const parent = el?.closest<HTMLElement>(".app-shell") || el?.parentElement;
    if (!el || !parent || !active || reduced || !followMouse) return;
    let bounds: DOMRect | undefined;
    const enter = () => { bounds = el.getBoundingClientRect(); };
    enter();
    const move = (event: PointerEvent) => {
      if (!bounds || event.pointerType === "touch") return;
      const x = event.clientX - bounds.left, y = event.clientY - bounds.top;
      const nearby = x >= -proximity && x <= bounds.width + proximity && y >= -proximity && y <= bounds.height + proximity;
      el.style.setProperty("--specular-hover", nearby ? "1" : "0");
      el.style.setProperty("--specular-x", `${x}px`); el.style.setProperty("--specular-y", `${y}px`);
    };
    const leave = () => el.style.setProperty("--specular-hover", "0");
    parent.addEventListener("pointerenter", enter); parent.addEventListener("pointermove", move); parent.addEventListener("pointerleave", leave);
    window.addEventListener("resize", enter); parent.addEventListener("scroll", enter, true);
    return () => { parent.removeEventListener("pointerenter", enter); parent.removeEventListener("pointermove", move); parent.removeEventListener("pointerleave", leave); window.removeEventListener("resize", enter); parent.removeEventListener("scroll", enter, true); };
  }, [active, reduced, followMouse, proximity]);
  const style = { "--specular-base": baseColor, "--specular-text": textColor, "--specular-line": lineColor,
    "--specular-tint": tint, "--specular-tint-opacity": Math.min(1, Math.max(0,tintOpacity)),
    "--specular-intensity": Math.min(1, Math.max(0,intensity)), "--specular-idle": Math.min(1,Math.max(0,idleIntensity)),
    "--specular-shine": `${shineSize}px`, "--specular-fade": `${shineFade}px`, "--specular-glow": `${Math.max(0,glow)*5}px`,
    borderRadius: radius, borderWidth: thickness } as CSSProperties;
  const face = <span ref={root} style={style} data-motion-active={active && !reduced} className={`specular-face specular-${size} ${className}`}>
    <span className="specular-light" aria-hidden="true"/><span className="specular-copy">{localizeText(children)}</span>
    {localizeText(sparkle && <span className="specular-sparkles" aria-hidden="true"><i>✦</i><i>✧</i></span>)}
  </span>;
  return as === "span" ? face : <button type="button" onClick={onClick} disabled={disabled} className="specular-control">{localizeText(face)}</button>;
}
