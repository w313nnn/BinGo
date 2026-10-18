import { useEffect, useRef, useState } from "react";
import type { DisposedItemRecord, PickupBooking, PickupBookingStatus } from "./appData";
import { getPickupRequestsForAdmin, getRecycleSessionsForAdmin, updatePickupBookingInDb, updateRecycleSessionReviewInDb } from "./firebase";

export default function AdminOperations() {
  const [bookings, setBookings] = useState<PickupBooking[]>([]);
  const [sessions, setSessions] = useState<DisposedItemRecord[]>([]);
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
    const result = await Promise.allSettled([getPickupRequestsForAdmin(), getRecycleSessionsForAdmin()]);
    if (!alive.current || request !== generation.current) return;
    if (result[0].status === "fulfilled") setBookings(result[0].value);
    if (result[1].status === "fulfilled") setSessions(result[1].value);
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
    if (status === "Assigned" && !uid) { setError("Enter a registered collector UID."); return; }
    void save(() => updatePickupBookingInDb(booking.id, {status, ...(status === "Assigned" ? {assignedCollectorUid: uid} : {})}));
  };
  return <section className="p-4 space-y-3" aria-label="Pickup and recycling review">
    <div className="flex gap-2"><button className="filter-chip" aria-pressed={view === "pickups"} onClick={() => {setView("pickups"); setError("");}}>Pickups</button><button className="filter-chip" aria-pressed={view === "review"} onClick={() => {setView("review"); setError("");}}>Recycling review</button><button className="ml-auto text-xs text-emerald-800" disabled={busy || loading} onClick={() => void load()}>Refresh</button></div>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-xs text-red-800">{error}</p>}
    {loading && <p role="status" className="text-xs text-slate-600">Loading records…</p>}
    {view === "pickups" ? bookings.map(b => <article key={b.id} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
      <div className="flex justify-between gap-2 text-sm"><strong>{b.residentName || "Resident"}</strong><span>{b.status}</span></div>
      <p className="text-xs text-slate-600">{b.pickupAddress}</p><p className="text-xs">{b.pickupDate} · {b.pickupTime}</p>
      <details className="text-xs text-slate-600"><summary>Booking details</summary><p className="break-all mt-2">Reference: {b.id}</p><p>Collector: {b.assignedCollectorUid || "Unassigned"}</p></details>
      {b.status === "Approved" && <label className="block text-xs">Registered collector UID<input className="mt-1 w-full border rounded-lg p-2" value={collector[b.id] || ""} onChange={e => setCollector(v => ({...v, [b.id]: e.target.value}))} /></label>}
      <div className="flex gap-2 text-xs">{(b.status === "Requested" ? ["Approved", "Rejected"] : b.status === "Approved" ? ["Assigned"] : b.status === "Assigned" ? ["Collected"] : []).map(status => <button key={status} disabled={busy} className="rounded-xl bg-emerald-700 text-white px-3 py-2 disabled:opacity-50" onClick={() => move(b, status as PickupBookingStatus)}>{status === "Approved" ? "Approve" : status === "Rejected" ? "Reject" : status === "Assigned" ? "Assign collector" : "Mark collected"}</button>)}</div>
    </article>) : sessions.map(r => <article key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
      <h3 className="font-semibold text-sm">{r.itemName}</h3><p className="text-xs text-slate-600">{r.residentName || "Resident"} · {r.weight} · {r.status}</p>
      {(r.status === "Pending Verification" || r.status === "Logged") && <><label className="block text-xs">Approved points<input type="number" min="0" step="1" className="mt-1 w-full border rounded-lg p-2" value={points[r.id] ?? String(r.pointsPending || 0)} onChange={e => setPoints(v => ({...v, [r.id]: e.target.value}))} /></label>
      <div className="flex gap-2 text-xs"><button disabled={busy} className="rounded-xl bg-emerald-700 text-white px-3 py-2" onClick={() => {
        const value = Number(points[r.id] ?? r.pointsPending ?? 0);
        if ((points[r.id] !== undefined && !points[r.id].trim()) || !Number.isInteger(value) || value < 0) {setError("Enter non-negative whole-number points."); return;}
        void save(() => updateRecycleSessionReviewInDb(String(r.id), {status: "Verified", verified: true, pointsApproved: value}));
      }}>Verify</button><button disabled={busy} className="rounded-xl border px-3 py-2" onClick={() => void save(() => updateRecycleSessionReviewInDb(String(r.id), {status: "Rejected", verified: false}))}>Reject</button></div></>}
    </article>)}
    {!loading && (view === "pickups" ? !bookings.length : !sessions.length) && <p className="text-sm text-slate-500 py-8 text-center">No records to review.</p>}
  </section>;
}
