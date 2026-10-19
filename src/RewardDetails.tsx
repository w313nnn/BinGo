import { L, localizeText } from "./i18n";
import { useEffect, useRef } from "react";
import type { Reward } from "./appData";
import BackButton from "./BackButton";
export default function RewardDetails({ reward, points, canRedeem = false, onBack, onRedeem }: {
  reward: Reward; points: number; canRedeem?: boolean; onBack: () => void; onRedeem: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, [reward.id]);
  const benefit = reward.description || reward.name;
  const method = reward.deliveryMethod || "Not specified by the provider";
  const available = !reward.banned && reward.redeemed < reward.maxRedemptions;
  return <section className="reward-detail" aria-labelledby="reward-detail-title">
    <div className="flex items-center gap-2"><BackButton onClick={onBack} label={localizeText("Back to reward list")} /><span className="text-sm font-semibold"><L>{"Reward details"}</L></span></div>
    <div className="reward-detail-hero"><span aria-hidden="true">{localizeText(reward.icon)}</span><p>{localizeText(reward.category)}</p><h2 ref={heading} tabIndex={-1} id="reward-detail-title">{localizeText(reward.name)}</h2><strong>{localizeText(reward.points)}<L>{" Green Points"}</L></strong></div>
    <div className="reward-detail-body">
      <p className="reward-demo-note"><L>{"Check the offer terms before redeeming."}</L></p>
      <dl><div><dt><L>{"What you get"}</L></dt><dd>{localizeText(benefit)}</dd></div><div><dt><L>{"Validity"}</L></dt><dd>{localizeText(reward.validity || "Not specified by the provider")}</dd></div><div><dt><L>{"Delivery method"}</L></dt><dd>{localizeText(method)}</dd></div><div><dt><L>{"Where to use"}</L></dt><dd>{localizeText(reward.applicableStores || "Not specified by the provider")}</dd></div><div><dt><L>{"Minimum spend & eligible products"}</L></dt><dd>{localizeText(reward.minimumSpend || "Not specified by the provider")}</dd></div><div><dt><L>{"Availability"}</L></dt><dd>{localizeText(available ? `${Math.max(0, reward.maxRedemptions - reward.redeemed)} remaining` : "Unavailable")}</dd></div></dl>
      <h3><L>{"How to use"}</L></h3><p className="whitespace-pre-line">{localizeText(reward.usageInstructions || "The provider has not added redemption instructions yet.")}</p>
      <h3><L>{"Terms and conditions"}</L></h3><p className="whitespace-pre-line">{localizeText(reward.terms || "Provider terms have not been supplied. Confirm the offer before redeeming.")}</p>
    </div>
    <div className="reward-detail-action"><p>{localizeText(!canRedeem ? "Redemption is not available yet." : !available ? "This reward is unavailable." : points < reward.points ? `${reward.points - points} more points needed` : `Your balance: ${points} points`)}</p><button type="button" className="primary-action" disabled={!canRedeem || !available || points < reward.points} onClick={onRedeem}><L>{"Redeem · "}</L>{localizeText(reward.points)}<L>{" points"}</L></button></div>
  </section>;
}
