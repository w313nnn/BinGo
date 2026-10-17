import { useEffect, useRef } from "react";
import type { Reward } from "./appData";
import BackButton from "./BackButton";
const descriptions: Record<number, [string, string]> = {
  1: ["RM5 Touch 'n Go reload", "E-wallet credit"],
  2: ["One reusable eco tote bag", "Collection"],
  3: ["One ZUS Coffee drink", "Merchant voucher"],
  4: ["RM5 off a GrabFood order", "Merchant voucher"],
  5: ["One McD ice cream cone", "Merchant voucher"],
  6: ["RM10 grocery voucher", "Merchant voucher"],
  7: ["One recycling starter kit", "Collection"],
  8: ["RM5 Maybank cashback", "Account credit"],
  9: ["A BinGo profile badge", "Digital reward"],
  10: ["One plant seedling", "Collection"],
  11: ["RM5 Shopee voucher", "Merchant voucher"],
  12: ["One reusable water bottle", "Collection"],
};
export default function RewardDetails({ reward, points, onBack, onRedeem }: {
  reward: Reward; points: number; onBack: () => void; onRedeem: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, [reward.id]);
  const [benefit, method] = descriptions[reward.id] || [reward.name, reward.category];
  const available = !reward.banned && reward.redeemed < reward.maxRedemptions;
  return <section className="reward-detail" aria-labelledby="reward-detail-title">
    <div className="flex items-center gap-2"><BackButton onClick={onBack} label="Back to reward list" /><span className="text-sm font-semibold">Reward details</span></div>
    <div className="reward-detail-hero"><span aria-hidden="true">{reward.icon}</span><p>{reward.category}</p><h2 ref={heading} tabIndex={-1} id="reward-detail-title">{reward.name}</h2><strong>{reward.points} Green Points</strong></div>
    <div className="reward-detail-body">
      <p className="reward-demo-note">Demo reward. Merchant conditions and participating stores are not configured.</p>
      <dl><div><dt>What you get</dt><dd>{benefit}</dd></div><div><dt>Validity</dt><dd>30 days after redemption in this demo.</dd></div><div><dt>Delivery method</dt><dd>{method}</dd></div><div><dt>Where to use</dt><dd>{method === "Digital reward" ? "Your BinGo account" : "To be confirmed by the reward provider."}</dd></div><div><dt>Minimum spend & eligible products</dt><dd>Not configured. Check the provider's offer before use.</dd></div><div><dt>Availability</dt><dd>{available ? `${Math.max(0, reward.maxRedemptions - reward.redeemed)} remaining` : "Unavailable"}</dd></div></dl>
      <h3>How to use</h3><ol><li>Check the reward details and your point balance.</li><li>Redeem to receive a BinGo reward code.</li><li>Keep the code and follow the provider's confirmed instructions.</li></ol>
      <h3>Terms and conditions</h3><ul><li>{reward.points} Green Points are required for each redemption.</li><li>Rewards are subject to availability.</li><li>Demo codes are for testing; merchant acceptance is not enabled.</li><li>Store, product, minimum-spend and offer-combination restrictions must be confirmed by the provider.</li></ul>
    </div>
    <div className="reward-detail-action"><p>{!available ? "This reward is unavailable." : points < reward.points ? `${reward.points - points} more points needed` : `Your balance: ${points} points`}</p><button type="button" className="primary-action" disabled={!available || points < reward.points} onClick={onRedeem}>Redeem · {reward.points} points</button></div>
  </section>;
}
