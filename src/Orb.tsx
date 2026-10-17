import { useId, useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "motion/react";
import useAnimationActivity from "./useAnimationActivity";
gsap.registerPlugin(useGSAP);
/** Green edge interpretation of the supplied Orb API, kept clear of form controls. */
export default function Orb({ colors = ["#BCE88A", "#3FAD66", "#D8FFAE"], hoverIntensity = 1,
  trail = 1, rotateOnHover = true, followCursor = true }: {
  colors?: string[]; hoverIntensity?: number; trail?: number; rotateOnHover?: boolean; followCursor?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null), layer = useRef<SVGGElement>(null);
  const reduced = useReducedMotion(), active = useAnimationActivity(root);
  const gradient = useId();
  useGSAP(() => {
    if (reduced || !active || !root.current || !layer.current) return;
    const intensity = gsap.utils.clamp(0, 2, hoverIntensity);
    const xTo = gsap.quickTo(layer.current, "x", { duration: .7, ease: "power2.out" });
    const yTo = gsap.quickTo(layer.current, "y", { duration: .7, ease: "power2.out" });
    const rotateTo = gsap.quickTo(layer.current, "rotation", { duration: .8, ease: "power2.out" });
    const shell = root.current.parentElement;
    let bounds: DOMRect | undefined;
    const enter = () => { bounds = shell?.getBoundingClientRect(); };
    const move = (event: PointerEvent) => {
      if (event.pointerType === "touch" || !bounds) return;
      const x = gsap.utils.clamp(-1, 1, (event.clientX - bounds.left) / bounds.width * 2 - 1);
      const y = gsap.utils.clamp(-1, 1, (event.clientY - bounds.top) / bounds.height * 2 - 1);
      if (followCursor) { xTo(x * 9 * intensity); yTo(y * 5 * intensity); }
      if (rotateOnHover) rotateTo(x * 2 * intensity);
    };
    const leave = () => { xTo(0); yTo(0); rotateTo(0); };
    shell?.addEventListener("pointerenter", enter);
    shell?.addEventListener("pointermove", move);
    shell?.addEventListener("pointerleave", leave);
    window.addEventListener("resize", enter);
    gsap.to(".login-orbit-trail", { strokeDashoffset: -100, duration: 9 / Math.max(.5, gsap.utils.clamp(0, 2, trail)), ease: "none", repeat: -1 });
    return () => { shell?.removeEventListener("pointerenter", enter); shell?.removeEventListener("pointermove", move); shell?.removeEventListener("pointerleave", leave); window.removeEventListener("resize", enter); };
  }, { scope: root, dependencies: [reduced, active, hoverIntensity, trail, followCursor, rotateOnHover], revertOnUpdate: true });
  return <div ref={root} className="login-orbit" aria-hidden="true"><svg viewBox="0 0 480 290" preserveAspectRatio="none">
    <defs><linearGradient id={gradient}><stop stopColor={colors[0]} stopOpacity=".2"/><stop offset=".45" stopColor={colors[1] || colors[0]}/><stop offset=".7" stopColor={colors[2] || colors[0]}/><stop offset="1" stopColor={colors[1] || colors[0]} stopOpacity=".2"/></linearGradient></defs>
    <g ref={layer} style={{ transformOrigin: "240px 140px", stroke: `url(#${gradient})` }}>
      <path className="login-orbit-glow" d="M-35 235 C-10 -45 440 -65 515 215"/>
      <path className="login-orbit-line" d="M-35 235 C-10 -45 440 -65 515 215"/>
      <path className="login-orbit-trail" pathLength="100" d="M-35 235 C-10 -45 440 -65 515 215"/>
    </g>
  </svg></div>;
}
