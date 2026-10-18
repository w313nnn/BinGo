import type {RefObject} from "react";
import {gsap} from "gsap";
import {useGSAP} from "@gsap/react";
import {ScrollTrigger} from "gsap/ScrollTrigger";
gsap.registerPlugin(useGSAP, ScrollTrigger);
/** Scoped to the app scroll panel; no scroll hijacking or global trigger cleanup. */
export default function usePageMotion(root: RefObject<HTMLElement | null>, page: string) {
  useGSAP(() => {
    if (!root.current) return;
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const panel = root.current!;
      const cards = gsap.utils.toArray<HTMLElement>("[data-reveal]", panel);
      if (!cards.length) return;
      const tweens: gsap.core.Tween[] = [];
      const enter = (batch: Element[]) => {
        tweens.push(gsap.fromTo(batch, {y: 10, opacity: .75}, {y: 0, opacity: 1, duration: .3,
          stagger: .035, ease: "power2.out", overwrite: "auto", clearProps: "transform,opacity"}));
      };
      const triggers = ScrollTrigger.batch(cards, {scroller: panel, start: "top 96%", once: true,
        batchMax: 8, onEnter: enter});
      return () => { triggers.forEach(trigger => trigger.kill()); tweens.forEach(tween => tween.kill()); gsap.set(cards, {clearProps: "transform,opacity"}); };
    });
    return () => media.revert();
  }, {scope: root, dependencies: [page], revertOnUpdate: true});
}
