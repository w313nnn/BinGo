import { L } from "./i18n";
import {
  getGoogleMapsNavigationUrl,
  PUBLIC_RECYCLING_DIRECTORY,
  PUBLIC_RECYCLING_SITES,
} from "./simeDarbyData";

export function GoogleMapView() {
  return (
    <section className="space-y-3" aria-label="Public recycling sites">
      <h2 className="text-sm font-bold text-emerald-950"><L>{"Public recycling sites listed by Tzu Chi"}</L></h2>
      {PUBLIC_RECYCLING_SITES.map(site => (
        <article key={site.name} className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm">
          <h3 className="font-bold text-slate-900">{site.name}</h3>
          <p className="text-slate-700">{site.address}</p>
          <p className="text-slate-700">{site.arrival}</p>
          <a className="inline-block rounded-xl bg-emerald-700 px-3 py-2 font-semibold text-white"
            href={getGoogleMapsNavigationUrl(site.address)} target="_blank" rel="noopener noreferrer">
            <L>{"Open Google Maps"}</L>
          </a>
        </article>
      ))}
      <a className="text-sm text-emerald-800 underline" href={PUBLIC_RECYCLING_DIRECTORY} target="_blank" rel="noopener noreferrer">
        <L>{"Check operator hours before visiting"}</L>
      </a>
    </section>
  );
}
