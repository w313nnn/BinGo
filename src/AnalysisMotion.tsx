import { useEffect, useState, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import useAnimationActivity from "./useAnimationActivity";
import DetailsDisclosure from "./DetailsDisclosure";

const labels = ["Looking closer", "Reviewing materials", "Finding options"];
export default function AnalysisMotion() {
  const root = useRef<HTMLDivElement>(null);
  const active = useAnimationActivity(root);
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState(0);
  useEffect(() => { if (!active || reduced) return; const timer = setInterval(() => setPhase(value => (value + 1) % labels.length), 1100); return () => clearInterval(timer); }, [active, reduced]);
  return <div ref={root} className="analysis-scene" role="status" aria-live="polite">
    <div className="analysis-stage">
      <motion.div className="analysis-tile" animate={reduced || !active ? {scale: 1, y: 0, rotate: 0} : { scale: [1, 1.04, 1], y: [0, -5, 0], rotate: [0, 1, 0] }}
        transition={{ duration: active && !reduced ? 5 : 0, repeat: active && !reduced ? Infinity : 0, ease: "easeInOut" }}>
        <div className="analysis-dots" aria-hidden="true">{Array.from({ length: 6 }, (_, index) => <span key={index} style={{ animationDelay: `${index * 110}ms` }} />)}</div>
        <span className="analysis-label">{labels[phase]}</span>
      </motion.div>
    </div>
    <p className="text-sm font-semibold text-slate-800">Demo analysis</p>
    <DetailsDisclosure label="About this preview"><p>This build shows sample results. A live image model is not connected. Check every suggestion before continuing.</p></DetailsDisclosure>
  </div>;
}
