import {Leaf, Recycle} from "lucide-react";
/** Shared identity for sign-in and startup so the logo and tagline stay identical. */
export default function BrandIdentity() {
  return <div className="bingo-brand">
    <div className="bingo-brand-mark" aria-hidden="true"><div className="relative">
      <Leaf className="w-7 h-7 text-emerald-700" strokeWidth={2.2} />
      <Recycle className="w-3.5 h-3.5 text-emerald-500 absolute -bottom-1 -right-1 bg-white rounded-full p-0.5" strokeWidth={2.5} />
    </div></div>
    <h1 className="bingo-brand-name"><span>Bin</span><span className="bingo-brand-go">Go</span></h1>
    <p className="bingo-brand-tagline">Waste less. Recycle more.</p>
  </div>;
}
