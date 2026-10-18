import {useRef} from "react";
import {gsap} from "gsap";
import {useGSAP} from "@gsap/react";
gsap.registerPlugin(useGSAP);
export default function Startup() {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.timeline({defaults: {duration: .35, ease: "power2.out"}})
        .from(".startup-mark", {scale: .9, opacity: 0})
        .from("h1, p", {y: 8, opacity: 0, stagger: .05}, "-=.18");
    });
    return () => media.revert();
  }, {scope: root});
  return <div ref={root} className="app-viewport startup-viewport"><div className="app-shell startup-screen startup-mobile" role="status" aria-label="Loading BinGo">
    <div className="startup-mark"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M35 8C15 8 9 17 12 29c12 8 25-1 23-21Z M14 34l15-16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg><span /></div>
    <h1>BinGo</h1><p>A greener everyday.</p><span className="sr-only">Preparing your recycling space</span>
  </div></div>;
}
