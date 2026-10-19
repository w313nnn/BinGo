import {useRef} from "react";
import {gsap} from "gsap";
import {useGSAP} from "@gsap/react";
import {setAppLanguage, type AppLanguage} from "./i18n";
gsap.registerPlugin(useGSAP);
export default function LanguageTransition({language,onComplete}:{language:AppLanguage;onComplete:()=>void}) {
  const root=useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduced) gsap.to("[data-language-dot]",{y:-5,autoAlpha:.45,duration:.35,stagger:.12,repeat:-1,yoyo:true,ease:"sine.inOut"});
    gsap.delayedCall(reduced ? .12 : .65, () => {setAppLanguage(language);onComplete();});
  }, {scope:root});
  return <div ref={root} className="language-transition" role="status" aria-live="polite" aria-busy="true" lang={language}>
    <div className="language-transition-card"><p>{language === "ms" ? "Menukar bahasa…" : "Changing language…"}</p><div className="language-transition-dots" aria-hidden="true">{[0,1,2].map(i=><span key={i} data-language-dot />)}</div></div>
  </div>;
}
