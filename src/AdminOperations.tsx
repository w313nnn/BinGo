import {listCollectors, resolveCollectorId, type CollectorRecord, listPickupEvidence, type PickupEvidence} from "./collectionWorkflow";
import {REVIEW_ESTIMATE} from "./reviewPolicy";
import { L, localizeText } from "./i18n";
import { useEffect, useRef, useState } from "react";
import type { DisposedItemRecord, PickupBooking, PickupBookingStatus } from "./appData";
import { getPickupRequestsForAdmin, getRecycleSessionsForAdmin, updatePickupBookingInDb, updateRecycleSessionReviewInDb } from "./firebase";

export default function AdminOperations() {
  const [collectors,setCollectors]=useState<CollectorRecord[]>([]);
  const [bookings, setBookings] = useState<PickupBooking[]>([]);
  const [sessions, setSessions] = useState<DisposedItemRecord[]>([]);
  const [statusFilter,setStatusFilter]=useState("All");
  const [search,setSearch]=useState("");
  const [evidenceChecked,setEvidenceChecked]=useState<Record<string,boolean>>({});
  const [evidence,setEvidence]=useState<Record<string,PickupEvidence>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<"pickups" | "review">("pickups");
  const [collector, setCollector] = useState<Record<string, string>>({});
  const [points, setPoints] = useState<Record<string, string>>({});
  const alive = useRef(false), lock = useRef(false), generation = useRef(0);
  const load = async () => {
    const request = ++generation.current;
    setLoading(true); setError("");
    const result = await Promise.allSettled([getPickupRequestsForAdmin(), getRecycleSessionsForAdmin(), listPickupEvidence(), listCollectors()]);
    if (!alive.current || request !== generation.current) return;
    if (result[0].status === "fulfilled") setBookings(result[0].value);
    if (result[1].status === "fulfilled") setSessions(result[1].value);
    if (result[2].status === "fulfilled") setEvidence(result[2].value as Record<string,PickupEvidence>);
    if (result[3].status === "fulfilled") setCollectors(result[3].value);
    const failures = result.filter(r => r.status === "rejected");
    if (failures.length) setError("Some records could not load. Check your admin permissions and retry.");
    setLoading(false);
  };
  useEffect(() => { alive.current = true; void load(); return () => { alive.current = false; generation.current++; }; }, []);
  const save = async (operation: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError("");
    try { await operation(); if (alive.current) await load(); }
    catch (e) { if (alive.current) setError(e instanceof Error ? e.message : "Could not save. Try again."); }
    finally { lock.current = false; if (alive.current) setBusy(false); }
  };
  const move = (booking: PickupBooking, status: PickupBookingStatus) => {
    const uid = collector[booking.id]?.trim();
    if (status === "Assigned" && !uid) { setError("Enter a registered collector ID."); return; }
    void save(async () => {const assignedCollectorUid=status === "Assigned" ? await resolveCollectorId(uid!) : undefined; await updatePickupBookingInDb(booking.id,{status,...(assignedCollectorUid?{assignedCollectorUid}:{})});});
  };
  const statuses=view==="pickups"?["All","Requested","Approved","Assigned","Collected","Rejected","Cancelled"]:["All","Pending Verification","Verified","Rejected"];
  const matches=(text:string)=>text.toLowerCase().includes(search.trim().toLowerCase());
  const filteredBookings=bookings.filter(b=>(statusFilter==="All"||b.status===statusFilter)&&matches(`${b.residentName} ${b.pickupAddress} ${b.id}`));
  const filteredSessions=sessions.filter(r=>(statusFilter==="All"||r.status===statusFilter)&&matches(`${r.residentName} ${r.itemName} ${r.id}`));
  return <section className="p-4 space-y-3" aria-label={localizeText("Pickup and recycling review")}>
    <div className="flex gap-2"><button className="filter-chip" aria-pressed={view === "pickups"} onClick={() => {setView("pickups"); setStatusFilter("All"); setError("");}}><L>{"Pickups"}</L></button><button className="filter-chip" aria-pressed={view === "review"} onClick={() => {setView("review"); setStatusFilter("All"); setError("");}}><L>{"Recycling review"}</L></button><button className="ml-auto text-xs text-emerald-800" disabled={busy || loading} onClick={() => void load()}><L>{"Refresh"}</L></button></div>
    <div className="flex gap-2 overflow-x-auto pb-1" aria-label={localizeText("Filter review status")}>{statuses.map(status=><button key={status} aria-pressed={statusFilter===status} onClick={()=>setStatusFilter(status)} className={`shrink-0 rounded-full px-3 py-2 text-xs border ${statusFilter===status?"bg-emerald-700 text-white":"bg-white text-slate-600"}`}>{localizeText(status)} ({(view==="pickups"?bookings:sessions).filter(r=>status==="All"||r.status===status).length})</button>)}</div>
    <input aria-label={localizeText("Search review records")} placeholder={localizeText("Search name, item, address or reference")} value={search} onChange={e=>setSearch(e.target.value)} className="w-full border rounded-xl p-3 text-xs bg-white"/>
    <datalist id="active-collector-ids">{collectors.filter(c=>c.active&&c.collectorId).map(c=><option key={c.uid} value={c.collectorId}>{c.name}</option>)}</datalist>
    <p className="text-xs text-slate-500">{localizeText(REVIEW_ESTIMATE)}</p>
    {localizeText(error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-xs text-red-800">{localizeText(error)}</p>)}
    {localizeText(loading && <p role="status" className="text-xs text-slate-600"><L>{"Loading records…"}</L></p>)}
    {view === "pickups" ? filteredBookings.map(b => <article key={b.id} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
      <div className="flex justify-between gap-2 text-sm"><strong>{b.residentName || "Resident"}</strong><span>{localizeText(b.status)}</span></div>
      <p className="text-xs text-slate-600">{b.pickupAddress}</p><p className="text-xs">{localizeText(b.pickupDate)} · {localizeText(b.pickupTime)}</p>
      <details className="text-xs text-slate-600"><summary><L>{"Booking details"}</L></summary><p className="break-all mt-2"><L>{"Reference: "}</L>{localizeText(b.id)}</p><p><L>{"Collector: "}</L>{localizeText(collectors.find(c=>c.uid===b.assignedCollectorUid)?.collectorId || (b.assignedCollectorUid ? "Collector ID pending" : "Unassigned"))}</p></details>
      {localizeText(b.status === "Approved" && <label className="block text-xs"><L>{"Collector ID"}</L><input className="mt-1 w-full border rounded-lg p-2" placeholder="C250001" list="active-collector-ids" value={collector[b.id] || ""} onChange={e => setCollector(v => ({...v, [b.id]: e.target.value.toUpperCase()}))} /></label>)}
      {b.status === "Collected" && evidence[b.id] && <details className="text-xs"><summary><L>Collection evidence</L></summary><img src={evidence[b.id].photoData} alt={localizeText("Collection evidence")} className="mt-2 w-full rounded-xl"/><p>{evidence[b.id].notes}</p></details>}
      <div className="flex gap-2 text-xs">{localizeText((b.status === "Requested" ? ["Approved", "Rejected"] : b.status === "Approved" ? ["Assigned"] : []).map(status => <button key={status} disabled={busy} className="rounded-xl bg-emerald-700 text-white px-3 py-2 disabled:opacity-50" onClick={() => move(b, status as PickupBookingStatus)}>{localizeText(status === "Approved" ? "Approve" : status === "Rejected" ? "Reject" : status === "Assigned" ? "Assign collector" : "Mark collected")}</button>))}</div>
    </article>) : filteredSessions.map(r => <article key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
      <h3 className="font-semibold text-sm">{localizeText(r.itemName)}</h3><p className="text-xs text-slate-600">{r.residentName || "Resident"} · {localizeText(r.weight)} · {localizeText(r.status)}</p>
      {r.collectionMethod === "collector_pickup" && <details className="text-xs"><summary><L>Collection evidence</L></summary>{evidence[String(r.id)]?<><img src={evidence[String(r.id)].photoData} alt={localizeText("Collection evidence")} className="mt-2 w-full rounded-xl"/><p>{evidence[String(r.id)].notes}</p><p>{evidence[String(r.id)].collectorUid}</p><label className="flex gap-2 mt-2"><input type="checkbox" checked={!!evidenceChecked[String(r.id)]} onChange={e=>setEvidenceChecked(v=>({...v,[String(r.id)]:e.target.checked}))}/><L>I reviewed the collector evidence.</L></label></>:<p><L>Waiting for collector evidence.</L></p>}</details>}
      {localizeText((r.status === "Pending Verification" || r.status === "Logged") && <><label className="block text-xs"><L>{"Approved points"}</L><input type="number" min="0" step="1" className="mt-1 w-full border rounded-lg p-2" value={points[r.id] ?? String(r.pointsPending || 0)} onChange={e => setPoints(v => ({...v, [r.id]: e.target.value}))} /></label>
      <div className="flex gap-2 text-xs"><button disabled={busy || (r.collectionMethod === "collector_pickup" && (!evidence[String(r.id)] || !evidenceChecked[String(r.id)]))} className="rounded-xl bg-emerald-700 text-white px-3 py-2 disabled:opacity-50" onClick={() => {
        const value = Number(points[r.id] ?? r.pointsPending ?? 0);
        if ((points[r.id] !== undefined && !points[r.id].trim()) || !Number.isInteger(value) || value < 0) {setError("Enter non-negative whole-number points."); return;}
        void save(() => updateRecycleSessionReviewInDb(String(r.id), {status: "Verified", verified: true, pointsApproved: value}));
      }}><L>{"Approve and Award Points"}</L></button><button disabled={busy} className="rounded-xl border px-3 py-2" onClick={() => void save(() => updateRecycleSessionReviewInDb(String(r.id), {status: "Rejected", verified: false}))}><L>{"Reject"}</L></button></div></>)}
    </article>)}
    {localizeText(!loading && (view === "pickups" ? !filteredBookings.length : !filteredSessions.length) && <p className="text-sm text-slate-500 py-8 text-center"><L>{"No records to review."}</L></p>)}
  </section>;
}
