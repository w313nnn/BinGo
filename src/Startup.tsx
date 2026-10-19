import { L, localizeText } from "./i18n";
import {useRef} from "react";
import {gsap} from "gsap";
import {useGSAP} from "@gsap/react";
import BrandIdentity from "./BrandIdentity";
import LoadingItems from "./LoadingItems";
gsap.registerPlugin(useGSAP);
export default function Startup({onReady}: {onReady?: () => void}) {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add({reduce: "(prefers-reduced-motion: reduce)", animate: "(prefers-reduced-motion: no-preference)"}, context => {
      const items = gsap.utils.toArray<HTMLElement>(".loading-item", root.current);
      if (context.conditions?.reduce) {onReady?.(); return;}
      const tilt = gsap.utils.wrap([-4, 3, -2, 4, -2]);
      const rise = gsap.utils.mapRange(0, Math.max(1, items.length - 1), 18, 28);
      const timeline = gsap.timeline({paused: document.hidden, onComplete: () => onReady?.()});
      timeline.fromTo(".loading-baseline", {scaleX: 0}, {scaleX: 1, duration: .4, ease: "power2.out"})
        .fromTo(".startup-brand", {opacity: 0, y: 5}, {opacity: 1, y: 0, duration: .35, stagger: .05}, 0)
        .fromTo(items, {autoAlpha: 0, y: index => rise(index), scaleX: .65, scaleY: .15, rotation: index => tilt(index)},
          {autoAlpha: 1, y: 0, scaleX: 1, scaleY: 1, rotation: 0, duration: .56, ease: "back.out(1.65)",
            stagger: gsap.utils.distribute({each: .085, from: "start"})}, .2)
        .to({}, {duration: .32});
      const visibility = () => document.hidden ? timeline.pause() : timeline.resume();
      document.addEventListener("visibilitychange", visibility);
      return () => document.removeEventListener("visibilitychange", visibility);
    });
    return () => media.revert();
  }, {scope: root, dependencies: [onReady], revertOnUpdate: true});
  return <div ref={root} className="app-viewport startup-viewport"><div className="app-shell startup-screen startup-mobile startup-line-screen" role="status" aria-label={localizeText("Loading BinGo")}>
    <div className="startup-brand"><BrandIdentity /></div>
    <LoadingItems />
    <span className="startup-loading-label"><L>{"Getting things ready"}</L><span aria-hidden="true">…</span></span>
  </div></div>;
}
