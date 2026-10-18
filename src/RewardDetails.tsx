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
    <div className="flex items-center gap-2"><BackButton onClick={onBack} label="Back to reward list" /><span className="text-sm font-semibold">Reward details</span></div>
    <div className="reward-detail-hero"><span aria-hidden="true">{reward.icon}</span><p>{reward.category}</p><h2 ref={heading} tabIndex={-1} id="reward-detail-title">{reward.name}</h2><strong>{reward.points} Green Points</strong></div>
    <div className="reward-detail-body">
      <p className="reward-demo-note">Check the offer terms before redeeming.</p>
      <dl><div><dt>What you get</dt><dd>{benefit}</dd></div><div><dt>Validity</dt><dd>{reward.validity || "Not specified by the provider"}</dd></div><div><dt>Delivery method</dt><dd>{method}</dd></div><div><dt>Where to use</dt><dd>{reward.applicableStores || "Not specified by the provider"}</dd></div><div><dt>Minimum spend & eligible products</dt><dd>{reward.minimumSpend || "Not specified by the provider"}</dd></div><div><dt>Availability</dt><dd>{available ? `${Math.max(0, reward.maxRedemptions - reward.redeemed)} remaining` : "Unavailable"}</dd></div></dl>
      <h3>How to use</h3><p className="whitespace-pre-line">{reward.usageInstructions || "The provider has not added redemption instructions yet."}</p>
      <h3>Terms and conditions</h3><p className="whitespace-pre-line">{reward.terms || "Provider terms have not been supplied. Confirm the offer before redeeming."}</p>
    </div>
    <div className="reward-detail-action"><p>{!canRedeem ? "Redemption is not available yet." : !available ? "This reward is unavailable." : points < reward.points ? `${reward.points - points} more points needed` : `Your balance: ${points} points`}</p><button type="button" className="primary-action" disabled={!canRedeem || !available || points < reward.points} onClick={onRedeem}>Redeem · {reward.points} points</button></div>
  </section>;
}
