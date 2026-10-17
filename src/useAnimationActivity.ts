import { useEffect, useState, type RefObject } from "react";
/** Do not keep decorative animation running in clipped content or background tabs. */
export default function useAnimationActivity(ref: RefObject<HTMLElement | null>) {
  const [active, setActive] = useState(false);
  useEffect(() => {
    let intersecting = false;
    const refresh = () => setActive(intersecting && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { intersecting = entry.isIntersecting; refresh(); });
    if (ref.current) observer.observe(ref.current);
    document.addEventListener("visibilitychange", refresh);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", refresh); };
  }, [ref]);
  return active;
}
