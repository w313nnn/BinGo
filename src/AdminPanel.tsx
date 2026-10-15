import { useState, useEffect } from "react";
import {
  LayoutDashboard, FileText, CalendarDays, Gift, Bell, MessageSquare,
  LogOut, AlertTriangle, Filter, ChevronRight, MapPin, CheckCircle2,
  Pencil, X, Plus, Pin, PinOff, ArrowLeft, Star, User,
} from "lucide-react";
import {
  Report, LiveUpdate, Schedule, Reward, Bin, Notice,
  DEPARTMENTS, urgencyColors, fillColor, schedSortKey, ScrollCol,
} from "./appData";
import { updateReportStatusInDb } from "./firebase";

export default function AdminPanel({
  reports, setReports, liveUpdates, setLiveUpdates,
  schedules, setSchedules, rewards, setRewards,
  bins, setBins, notices, setNotices, onLogout,
}: {
  reports: Report[]; setReports: React.Dispatch<React.SetStateAction<Report[]>>;
  liveUpdates: LiveUpdate[]; setLiveUpdates: React.Dispatch<React.SetStateAction<LiveUpdate[]>>;
  schedules: Schedule[]; setSchedules: React.Dispatch<React.SetStateAction<Schedule[]>>;
  rewards: Reward[]; setRewards: React.Dispatch<React.SetStateAction<Reward[]>>;
  bins: Bin[]; setBins: React.Dispatch<React.SetStateAction<Bin[]>>;
  notices: Notice[]; setNotices: React.Dispatch<React.SetStateAction<Notice[]>>;
  onLogout: () => void;
}) {
  type AdminTab = "Dashboard" | "Reports" | "Schedule" | "Rewards" | "Updates" | "Feedback";
  const [tab, setTab] = useState<AdminTab>("Dashboard");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reportSort, setReportSort] = useState<"time" | "urgency" | "status">("time");
  const [reportStatusFilter, setReportStatusFilter] = useState("All");
  const [historyMonthFilter, setHistoryMonthFilter] = useState("All");
  const [activeStatusFilter, setActiveStatusFilter] = useState("ALL");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ id: number; status: string } | null>(null);
  const [selectedInAction, setSelectedInAction] = useState("");
  const [timelineExpanded, setTimelineExpanded] = useState(false);
  const [showAllBins, setShowAllBins] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ label: string; onConfirm: () => void } | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [commentSaved, setCommentSaved] = useState(false);
  const [editReward, setEditReward] = useState<Reward | null>(null);
  const [editRewardDraft, setEditRewardDraft] = useState<Partial<Reward>>({});
  const [addRewardMode, setAddRewardMode] = useState(false);
  const [editSchedule, setEditSchedule] = useState<Schedule | null>(null);
  const [editScheduleDraft, setEditScheduleDraft] = useState<Partial<Schedule> & { rawDate?: string }>({});
  const [addScheduleMode, setAddScheduleMode] = useState(false);
  const [scheduleModalError, setScheduleModalError] = useState("");
  const [schedHour, setSchedHour] = useState("7");
  const [schedMin, setSchedMin] = useState("00");
  const [schedAmPm, setSchedAmPm] = useState<"AM" | "PM">("AM");
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeBody, setNoticeBody] = useState("");
  const [noticePinned, setNoticePinned] = useState(false);
  const [noticeError, setNoticeError] = useState("");
  const [editNotice, setEditNotice] = useState<Notice | null>(null);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  useEffect(() => { setTimelineExpanded(false); setSelectedInAction(""); }, [selectedReport?.id]);

  useEffect(() => {
    const D = 86400000, now = Date.now();
    const seed = [
      { name: "Ahmad Rizwan", rating: 5, text: "Really love the app! Easy to report issues and track status in real time. Keep it up!", ts: now - 1 * D },
      { name: "Siti Amirah", rating: 4, text: "Good app overall. The schedule feature is helpful but I would love push notifications too.", ts: now - 2 * D },
      { name: "Tan Wei Liang", rating: 5, text: "The bin capacity map is very useful. I can plan my recycling trip without wasting fuel!", ts: now - 3 * D },
      { name: "Nurul Hana", rating: 3, text: "App is decent but sometimes the GPS takes too long to load. Needs performance improvement.", ts: now - 4 * D },
      { name: "Lim Jun Hao", rating: 4, text: "Love the live truck tracking feature. I know exactly when collection is coming to my area.", ts: now - 5 * D },
      { name: "Priya Nair", rating: 5, text: "Excellent! I reported an illegal dumping site and it was cleaned up within 2 days. Amazing!", ts: now - 6 * D },
      { name: "Hafiz Zainal", rating: 4, text: "Very clean design. Reporting is straightforward. Would be better with a dark mode option.", ts: now - 8 * D },
      { name: "Mei Ling Choo", rating: 5, text: "I earned enough reward points to redeem a voucher! Great incentive to keep the area clean.", ts: now - 10 * D },
      { name: "Rajan Kumar", rating: 2, text: "My report was rejected without a clear reason. The admin comment was too brief. Please improve.", ts: now - 12 * D },
      { name: "Aishah Bt Yusof", rating: 5, text: "Best waste management app I have used. The leaderboard makes recycling fun and competitive!", ts: now - 14 * D },
    ];
    try {
      const cur = JSON.parse(localStorage.getItem("bingo_feedback") || "[]");
      if (cur.length < 10) localStorage.setItem("bingo_feedback", JSON.stringify(seed));
    } catch { localStorage.setItem("bingo_feedback", JSON.stringify(seed)); }
  }, []);

  const IN_ACTION_OPTIONS = [
    "Dispatching cleanup crew",
    "Notifying local authority",
    "Issuing warning notice",
    "Scheduling special pickup",
    "Under investigation",
    "Forwarding to department",
    "Awaiting site inspection",
  ];

  const advanceToInAction = (id: number, actionType: string) => {
    const entry = `In Action – ${actionType} · just now`;
    let updatedTimeline: string[] = [];
    const updater = (r: typeof reports[0]) => {
      if (r.id !== id) return r;
      const existing = r.timeline || [];
      const has = (s: string) => existing.some(t => t.startsWith(s + " ·"));
      const fill: string[] = [];
      if (!has("Submitted")) fill.push("Submitted · just now");
      if (!has("Pending")) fill.push("Pending · just now");
      updatedTimeline = [...existing, ...fill, entry];
      return { ...r, status: "In Action", timeline: updatedTimeline };
    };
    setReports(prev => prev.map(updater));
    if (selectedReport?.id === id) setSelectedReport(prev => prev ? updater(prev) : null);
    setSelectedInAction("");
    updateReportStatusInDb(id, { status: "In Action", timeline: updatedTimeline });
    showToast("Report moved to In Action & synced to DB.");
  };

  const urgencyOrder: Record<string, number> = { High: 0, Medium: 1, Low: 2 };
  const statusOrder: Record<string, number> = { Pending: 0, "In Action": 1, Completed: 2, Rejected: 3 };

  const filteredReports = reports
    .filter(r => reportStatusFilter === "All" || r.status === reportStatusFilter)
    .sort((a, b) => {
      if (reportSort === "urgency") return (urgencyOrder[a.urgency] ?? 9) - (urgencyOrder[b.urgency] ?? 9);
      if (reportSort === "status") return (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9);
      return 0;
    });

  const updateReportStatus = (id: number, status: string) => {
    const now = Date.now();
    let updatedTimeline: string[] = [];
    const updater = (r: typeof reports[0]) => {
      if (r.id !== id) return r;
      updatedTimeline = [...(r.timeline || []), `${status} · just now`];
      return { ...r, status, timeline: updatedTimeline, completedAt: now };
    };
    setReports(prev => prev.map(updater));
    if (selectedReport?.id === id) setSelectedReport(prev => prev ? updater(prev) : null);
    updateReportStatusInDb(id, { status, timeline: updatedTimeline, completedAt: now });
    showToast(status === "Completed" ? "Report marked as Completed & synced." : "Report rejected & synced.");
  };

  const assignDept = (id: number, dept: string) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, department: dept } : r));
    if (selectedReport?.id === id) setSelectedReport(prev => prev ? { ...prev, department: dept } : null);
    updateReportStatusInDb(id, { department: dept });
    showToast(`Assigned to ${dept}`);
  };

  const saveComment = (id: number) => {
    if (!commentDraft.trim()) return;
    setReports(prev => prev.map(r => r.id === id ? { ...r, adminComment: commentDraft } : r));
    if (selectedReport?.id === id) setSelectedReport(prev => prev ? { ...prev, adminComment: commentDraft } : null);
    setCommentSaved(true);
    updateReportStatusInDb(id, { adminComment: commentDraft });
    showToast("Comment saved & synced to DB");
    setTimeout(() => setCommentSaved(false), 3000);
  };

  const adminStatusBadge: Record<string, string> = {
    "Pending": "bg-slate-100 text-slate-700 border border-slate-200",
    "In Action": "bg-amber-50 text-amber-800 border border-amber-200",
    "Completed": "bg-emerald-50 text-emerald-800 border border-emerald-200",
    "Rejected": "bg-red-50 text-red-700 border border-red-200",
  };

  const totalPending = reports.filter(r => r.status === "Pending").length;
  const totalInAction = reports.filter(r => r.status === "In Action").length;
  const totalCompleted = reports.filter(r => r.status === "Completed").length;

  const adminNavItems: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: "Dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" strokeWidth={1.5} /> },
    { id: "Reports", label: "Reports", icon: <FileText className="w-5 h-5" strokeWidth={1.5} /> },
    { id: "Schedule", label: "Schedule", icon: <CalendarDays className="w-5 h-5" strokeWidth={1.5} /> },
    { id: "Rewards", label: "Rewards", icon: <Gift className="w-5 h-5" strokeWidth={1.5} /> },
    { id: "Updates", label: "Updates", icon: <Bell className="w-5 h-5" strokeWidth={1.5} /> },
    { id: "Feedback", label: "Feedback", icon: <MessageSquare className="w-5 h-5" strokeWidth={1.5} /> },
  ];

  return (
    <div className="w-full max-w-[420px] mx-auto min-h-screen sm:min-h-[820px] sm:max-h-[92vh] bg-white sm:rounded-[2.5rem] shadow-2xl border-0 sm:border sm:border-slate-300/80 flex flex-col overflow-hidden">

      {/* Header */}
      <div className="bg-[#133E26] px-5 pt-4 pb-4 shrink-0 text-white">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-emerald-200/80 text-[10px] font-semibold uppercase tracking-widest">BinGo Municipal Portal</p>
            <h1 className="text-white text-[16px] font-bold leading-tight">Control Panel</h1>
          </div>
          <button onClick={onLogout} className="bg-white/10 rounded-xl px-3 py-1.5 flex items-center gap-1.5 hover:bg-white/20 transition-colors">
            <LogOut className="w-3.5 h-3.5 text-white" strokeWidth={1.5} />
            <span className="text-white text-[11px] font-bold">Logout</span>
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-[#2D8A45] text-white text-[11px] font-bold px-4 py-2 rounded-full shadow-lg">
          {toast}
        </div>
      )}

      {/* Confirm dialog */}
      {confirmAction && (
        <div className="absolute inset-0 z-[60] bg-black/50 flex items-center justify-center px-6">
          <div className="bg-white rounded-3xl p-6 w-full max-w-[300px] shadow-xl">
            <div className="w-10 h-10 rounded-2xl bg-[#FF0000]/10 flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5 text-[#FF0000]" strokeWidth={1.5} />
            </div>
            <h3 className="text-[14px] font-bold text-[#0d0d0d] mb-1">Confirm Action</h3>
            <p className="text-[11px] text-[#222222] mb-4">
              Mark this report as <strong>{confirmAction.status}</strong>? This action cannot be undone and the report will move to history.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmAction(null)}
                className="flex-1 py-2.5 rounded-xl text-[11px] font-bold bg-[#f0f0f0] text-[#0d0d0d] hover:bg-[#e0e0e0] transition-colors">
                Cancel
              </button>
              <button onClick={() => { updateReportStatus(confirmAction.id, confirmAction.status); setConfirmAction(null); }}
                className={`flex-1 py-2.5 rounded-xl text-[11px] font-bold transition-colors ${confirmAction.status === "Completed" ? "bg-[#2D8A45] text-white hover:bg-[#2D8A45]" : "bg-[#FF0000] text-white hover:bg-[#FF0000]"}`}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm dialog */}
      {deleteConfirm && (
        <div className="absolute inset-0 z-[60] bg-black/50 flex items-center justify-center px-6">
          <div className="bg-white rounded-3xl p-6 w-full max-w-[300px] shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-[#FEE2E2] flex items-center justify-center mb-3 mx-auto">
              <AlertTriangle className="w-6 h-6 text-[#DC2626]" strokeWidth={1.5} />
            </div>
            <h3 className="text-[15px] font-bold text-[#0d0d0d] text-center mb-1">Are you sure?</h3>
            <p className="text-[11px] text-[#555555] text-center mb-1 leading-relaxed">
              You are about to delete the {deleteConfirm.label}.
            </p>
            <p className="text-[11px] font-bold text-[#DC2626] text-center mb-4">This action cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl text-[12px] font-bold bg-[#f0f0f0] text-[#0d0d0d] hover:bg-[#e0e0e0] transition-colors">
                Cancel
              </button>
              <button onClick={() => { deleteConfirm.onConfirm(); setDeleteConfirm(null); }}
                className="flex-1 py-2.5 rounded-xl text-[12px] font-bold bg-[#DC2626] text-white hover:bg-[#B91C1C] transition-colors">
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-[#F0FAF2]">

        {/* DASHBOARD */}
        {tab === "Dashboard" && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Total Reports", value: reports.length, color: "bg-white border border-[#2D8A45]", text: "text-[#2D8A45]" },
                { label: "Pending", value: totalPending, color: "bg-[#F3F4F6] border border-[#d8d8d8]", text: "text-[#4B5563]" },
                { label: "In Action", value: totalInAction, color: "bg-[#FEF3C7]", text: "text-[#B45309]" },
                { label: "Completed", value: totalCompleted, color: "bg-[#D1FAE5]", text: "text-[#065F46]" },
              ].map(s => (
                <div key={s.label} className={`${s.color} rounded-2xl p-4`}>
                  <p className={`text-[10px] font-semibold ${s.text} opacity-70`}>{s.label}</p>
                  <p className={`text-[28px] font-bold ${s.text} leading-none mt-1`}>{s.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl p-4 border border-[#e0e0e0]">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold text-[#222222] uppercase tracking-widest">Live Truck Progress</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#2D8A45] animate-pulse" />
                  <span className="text-[9px] text-[#999999] font-semibold">Sensor</span>
                </div>
              </div>
              <div className="space-y-3">
                {liveUpdates.map(truck => {
                  const fc = fillColor(truck.progress);
                  return (
                    <div key={truck.id}>
                      <div className="flex justify-between items-center mb-1">
                        <div>
                          <p className="text-[11px] font-bold text-[#0d0d0d]">{truck.date} · {truck.time}</p>
                          <p className="text-[10px] text-[#222222]">{truck.location} — ETA {truck.eta}</p>
                        </div>
                        <span className="text-[11px] font-bold" style={{ color: fc.dot }}>{truck.progress}%</span>
                      </div>
                      <div className="h-2 bg-[#f0f0f0] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${fc.bar}`} style={{ width: `${truck.progress}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-[#e0e0e0]">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold text-[#222222] uppercase tracking-widest">Bin Capacity Overview</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#2D8A45] animate-pulse" />
                  <span className="text-[9px] text-[#999999] font-semibold">Sensor</span>
                </div>
              </div>
              <div className="space-y-2.5">
                {([...bins].sort((a, b) => b.fill - a.fill).slice(0, showAllBins ? bins.length : 5)).map(b => {
                  const fc = fillColor(b.fill);
                  return (
                    <div key={b.id}>
                      <div className="flex justify-between mb-0.5">
                        <div>
                          <span className="text-[10px] text-[#0d0d0d] font-semibold">{b.name}</span>
                          <span className="text-[9px] text-[#999999] ml-1.5">{b.distance}</span>
                        </div>
                        <span className="text-[10px] font-bold" style={{ color: fc.dot }}>{b.fill}%</span>
                      </div>
                      <div className="h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${fc.bar}`} style={{ width: `${b.fill}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              {bins.length > 5 && (
                <button onClick={() => setShowAllBins(v => !v)}
                  className="mt-3 w-full text-[10px] font-bold text-[#2D8A45] bg-[#F0FAF2] hover:bg-[#D1FAE5] py-2 rounded-xl transition-colors">
                  {showAllBins ? "Show Less ▲" : `View All (${bins.length}) ▼`}
                </button>
              )}
            </div>

            <div className="bg-white rounded-2xl p-4 border border-[#e0e0e0]">
              <p className="text-[10px] font-bold text-[#222222] uppercase tracking-widest mb-3">Rewards Overview</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-[#F0FAF2] rounded-xl py-3">
                  <p className="text-[22px] font-bold text-[#0d0d0d] leading-none">{rewards.length}</p>
                  <p className="text-[9px] text-[#999999] mt-1">Rewards</p>
                </div>
                <div className="bg-[#F0FAF2] rounded-xl py-3">
                  <p className="text-[22px] font-bold text-[#0d0d0d] leading-none">{rewards.reduce((s, r) => s + r.redeemed, 0)}</p>
                  <p className="text-[9px] text-[#999999] mt-1">Redeemed</p>
                </div>
                <div className="bg-[#F0FAF2] rounded-xl py-3">
                  <p className="text-[22px] font-bold text-[#0d0d0d] leading-none">{rewards.reduce((s, r) => s + (r.maxRedemptions - r.redeemed), 0)}</p>
                  <p className="text-[9px] text-[#999999] mt-1">Remaining</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REPORTS LIST */}
        {tab === "Reports" && !selectedReport && (
          <div className="p-4 space-y-4">
            {(() => {
              const activeReports = reports
                .filter(r => {
                  if (r.status !== "Pending" && r.status !== "In Action") return false;
                  if (activeStatusFilter === "PENDING") return r.status === "Pending";
                  if (activeStatusFilter === "ACTION") return r.status === "In Action";
                  return true;
                })
                .sort((a, b) => b.id - a.id);
              return (
                <div className="space-y-3">
                  <p className="text-[11px] font-bold text-[#0d0d0d] uppercase tracking-widest">Active</p>
                  <div className="relative" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => setActiveDropdown(activeDropdown === "adminActive" ? null : "adminActive")}
                      className="flex items-center gap-1.5 bg-white border border-[#d8d8d8] rounded-xl px-3 py-1.5 text-[10px] font-bold text-[#0d0d0d] hover:bg-[#F0FAF2] transition-colors">
                      <Filter className="w-3 h-3" strokeWidth={2} />
                      {activeStatusFilter === "ALL" ? "All Status" : activeStatusFilter === "PENDING" ? "Pending" : "In Action"}
                      <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                    </button>
                    {activeDropdown === "adminActive" && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setActiveDropdown(null)} />
                        <div className="absolute top-full left-0 mt-1 z-20 bg-white rounded-xl shadow-lg border border-[#d8d8d8] overflow-hidden min-w-[130px]">
                          {[["ALL", "All Status"], ["PENDING", "Pending"], ["ACTION", "In Action"]].map(([val, label]) => (
                            <button key={val} onClick={() => { setActiveStatusFilter(val); setActiveDropdown(null); }}
                              className={`w-full px-3 py-2 text-left text-[11px] font-bold transition-colors ${activeStatusFilter === val ? "bg-[#2D8A45] text-white" : "text-[#0d0d0d] hover:bg-[#F0FAF2]"}`}>{label}</button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  {activeReports.length === 0 && (
                    <p className="text-center text-[11px] text-[#999999] py-4 bg-white rounded-2xl border border-[#e0e0e0]">No active reports.</p>
                  )}
                  {activeReports.map(r => (
                    <div key={r.id} className="bg-white rounded-2xl p-3 border border-[#e0e0e0]">
                      <div className="flex justify-between items-start mb-1.5">
                        <p className="text-[11px] font-bold text-[#0d0d0d] flex-1 pr-2">{r.issue}</p>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${adminStatusBadge[r.status]}`}>{r.status}</span>
                      </div>
                      <p className="text-[10px] text-[#222222] mb-1 line-clamp-1">{r.description}</p>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${urgencyColors[r.urgency]}`}>{r.urgency}</span>
                        <span className="text-[9px] text-[#999999]">{r.time}</span>
                        {(r as any).department && <span className="text-[9px] bg-[#f0f0f0] text-[#222222] px-1.5 py-0.5 rounded font-semibold">{(r as any).department}</span>}
                      </div>
                      <button onClick={() => { setSelectedReport(r); setCommentDraft(r.adminComment || ""); }}
                        className="w-full bg-[#2D8A45] text-white text-[10px] font-bold py-2 rounded-xl flex items-center justify-center gap-1 hover:bg-[#236B37] transition-colors">
                        Manage Report <ChevronRight className="w-3 h-3" strokeWidth={2} />
                      </button>
                    </div>
                  ))}
                </div>
              );
            })()}

            {(() => {
              const allHistory = reports
                .filter(r => r.status === "Completed" || r.status === "Rejected")
                .sort((a, b) => ((b as any).completedAt ?? b.id) - ((a as any).completedAt ?? a.id));
              if (allHistory.length === 0) return null;
              const fmtYear = (ts: number) => String(new Date(ts).getFullYear());
              const yearOptions = ["All", ...Array.from(new Set(
                allHistory.filter(r => (r as any).completedAt).map(r => fmtYear((r as any).completedAt))
              )).sort((a, b) => Number(b) - Number(a))];
              const history = historyMonthFilter === "All"
                ? allHistory
                : allHistory.filter(r => (r as any).completedAt && fmtYear((r as any).completedAt) === historyMonthFilter);
              return (
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-[#0d0d0d] uppercase tracking-widest">History</p>
                  <div className="relative" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => setActiveDropdown(activeDropdown === "adminHistory" ? null : "adminHistory")}
                      className="flex items-center gap-1.5 bg-white border border-[#d8d8d8] rounded-xl px-3 py-1.5 text-[10px] font-bold text-[#0d0d0d] hover:bg-[#F0FAF2] transition-colors">
                      <Filter className="w-3 h-3" strokeWidth={2} />
                      Year: {historyMonthFilter}
                      <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                    </button>
                    {activeDropdown === "adminHistory" && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setActiveDropdown(null)} />
                        <div className="absolute top-full left-0 mt-1 z-20 bg-white rounded-xl shadow-lg border border-[#d8d8d8] overflow-hidden min-w-[110px]">
                          {yearOptions.map(y => (
                            <button key={y} onClick={() => { setHistoryMonthFilter(y); setActiveDropdown(null); }}
                              className={`w-full px-3 py-2 text-left text-[11px] font-bold transition-colors ${historyMonthFilter === y ? "bg-[#2D8A45] text-white" : "text-[#0d0d0d] hover:bg-[#F0FAF2]"}`}>{y}</button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  {history.length === 0 && (
                    <p className="text-center text-[11px] text-[#999999] py-4 bg-[#F0FAF2] rounded-2xl border border-[#e0e0e0]">No records for this period.</p>
                  )}
                  {history.map(r => (
                    <div key={r.id}
                      onClick={() => { setSelectedReport(r); setCommentDraft(r.adminComment || ""); }}
                      className="bg-[#F0FAF2] rounded-2xl p-3 border border-[#e0e0e0] flex items-start gap-3 cursor-pointer hover:bg-[#f0f0f0] transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-[11px] font-semibold text-[#0d0d0d] truncate flex-1">{r.issue}</p>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${adminStatusBadge[r.status]}`}>{r.status}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${urgencyColors[r.urgency]}`}>{r.urgency}</span>
                          <span className="text-[9px] text-[#999999]">{(r as any).completedAt ? fmtYear((r as any).completedAt) : r.time}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#999999] shrink-0 mt-0.5" strokeWidth={1.5} />
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* REPORT DETAIL */}
        {tab === "Reports" && selectedReport && (() => {
          const isHistory = selectedReport.status === "Completed" || selectedReport.status === "Rejected";
          const TimelineBlock = () => {
            const timelineMap: Record<string, string> = {};
            (selectedReport.timeline || []).forEach(t => {
              const sepIdx = t.indexOf(" · ");
              if (sepIdx !== -1) {
                const key = t.slice(0, sepIdx);
                const baseKey = key.startsWith("In Action") ? "In Action" : key;
                if (!timelineMap[baseKey]) timelineMap[baseKey] = t.slice(sepIdx + 3);
                if (!timelineMap[key]) timelineMap[key] = t.slice(sepIdx + 3);
              }
            });
            const inActionEntry = (selectedReport.timeline || []).find(t => t.startsWith("In Action"));
            const inActionLabel = inActionEntry ? inActionEntry.slice(0, inActionEntry.indexOf(" · ")) : "In Action";
            const finalStage = selectedReport.status === "Rejected" ? "Rejected" : "Completed";
            const stages = ["Submitted", "Pending", inActionLabel, finalStage];
            const FOLD_AT = 3;
            const visible = timelineExpanded ? stages : stages.slice(0, FOLD_AT);
            const hidden = stages.length - FOLD_AT;
            return (
              <div className="bg-white rounded-2xl p-4 border border-[#e0e0e0]">
                <p className="text-[10px] font-bold text-[#222222] uppercase tracking-widest mb-3">Timeline</p>
                <div>
                  {visible.map((stage, i) => {
                    const baseKey = stage.startsWith("In Action") ? "In Action" : stage;
                    const time = timelineMap[stage] ?? timelineMap[baseKey];
                    const isDone = !!time;
                    const isLast = i === visible.length - 1;
                    return (
                      <div key={stage} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full border-2 shrink-0 mt-0.5 ${isDone ? "bg-[#2D8A45] border-[#2D8A45]" : "bg-white border-[#d8d8d8]"}`} />
                          {!isLast && <div className={`w-0.5 flex-1 min-h-[18px] my-0.5 ${isDone ? "bg-[#2D8A45]" : "bg-[#e0e0e0]"}`} />}
                        </div>
                        <div className={`flex justify-between items-start w-full ${isLast ? "" : "pb-2"}`}>
                          <span className={`text-[11px] font-bold ${isDone ? "text-[#0d0d0d]" : "text-[#c0c0c0]"}`}>{stage}</span>
                          {time
                            ? <span className="text-[10px] text-[#999999] shrink-0 ml-2">{time}</span>
                            : <span className="text-[10px] text-[#d8d8d8] shrink-0 ml-2">—</span>
                          }
                        </div>
                      </div>
                    );
                  })}
                </div>
                {hidden > 0 && (
                  <button onClick={() => setTimelineExpanded(v => !v)}
                    className="mt-2 text-[10px] font-bold text-[#0d0d0d] underline underline-offset-2">
                    {timelineExpanded ? "Show less" : `Show ${hidden} more step${hidden > 1 ? "s" : ""}`}
                  </button>
                )}
              </div>
            );
          };

          return (
            <div className="p-4 space-y-3">
              <button onClick={() => setSelectedReport(null)} className="flex items-center gap-1 text-[11px] font-bold text-[#0d0d0d] mb-1">
                <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} /> Back to Reports
              </button>
              <div className="bg-white rounded-2xl p-4 border border-[#e0e0e0]">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-[13px] font-bold text-[#0d0d0d] flex-1 pr-2">{selectedReport.issue}</h2>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${adminStatusBadge[selectedReport.status]}`}>{selectedReport.status}</span>
                </div>
                <p className="text-[11px] text-[#222222] mb-2">{selectedReport.description}</p>
                <div className="flex items-center gap-2 text-[10px] text-[#999999]">
                  <MapPin className="w-3 h-3" strokeWidth={1.5} />{selectedReport.address}
                </div>
              </div>

              {isHistory ? (
                <>
                  <TimelineBlock />
                  {selectedReport.adminComment ? (
                    <div className="bg-[#F0FAF2] rounded-2xl p-4 border border-[#e0e0e0]">
                      <p className="text-[10px] font-bold text-[#222222] uppercase tracking-widest mb-2">Responder Comment</p>
                      <div className="flex items-start gap-1.5">
                        <MessageSquare className="w-3 h-3 text-[#999999] mt-0.5 shrink-0" strokeWidth={1.5} />
                        <p className="text-[11px] text-[#222222] italic">{selectedReport.adminComment}</p>
                      </div>
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  <div className="bg-white rounded-2xl p-4 border border-[#e0e0e0]">
                    <p className="text-[10px] font-bold text-[#222222] uppercase tracking-widest mb-3">Update Status</p>
                    {selectedReport.status === "Pending" && (
                      <>
                        <select value={selectedInAction} onChange={e => setSelectedInAction(e.target.value)}
                          className="w-full bg-[#F0FAF2] border border-[#d8d8d8] rounded-xl px-3 py-2.5 text-[11px] text-[#0d0d0d] outline-none focus:border-[#2D8A45] mb-3">
                          <option value="">Select action type…</option>
                          {IN_ACTION_OPTIONS.map(o => <option key={o}>{o}</option>)}
                        </select>
                        <div className="grid grid-cols-2 gap-2">
                          <button disabled={!selectedInAction} onClick={() => advanceToInAction(selectedReport.id, selectedInAction)}
                            className={`py-2.5 rounded-xl text-[10px] font-bold transition-colors ${selectedInAction ? "bg-[#FEF3C7] text-[#B45309] hover:bg-[#FDE68A]" : "bg-[#f0f0f0] text-[#999999] cursor-not-allowed"}`}>
                            In Action
                          </button>
                          <button onClick={() => setConfirmAction({ id: selectedReport.id, status: "Rejected" })}
                            className="py-2.5 rounded-xl text-[10px] font-bold bg-[#FF0000]/10 text-[#FF0000] hover:bg-[#FF0000]/20 transition-colors">
                            Rejected
                          </button>
                        </div>
                      </>
                    )}
                    {selectedReport.status === "In Action" && (
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setConfirmAction({ id: selectedReport.id, status: "Completed" })}
                          className="py-2.5 rounded-xl text-[10px] font-bold bg-[#2D8A45] text-white hover:bg-[#236B37] transition-colors">
                          Completed
                        </button>
                        <button onClick={() => setConfirmAction({ id: selectedReport.id, status: "Rejected" })}
                          className="py-2.5 rounded-xl text-[10px] font-bold bg-[#FF0000]/10 text-[#FF0000] hover:bg-[#FF0000]/20 transition-colors">
                          Rejected
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl p-4 border border-[#e0e0e0]">
                    <p className="text-[10px] font-bold text-[#222222] uppercase tracking-widest mb-2">Assign Department</p>
                    <div className="space-y-1.5">
                      {DEPARTMENTS.map(d => (
                        <button key={d} onClick={() => assignDept(selectedReport.id, d)}
                          className={`w-full py-2 px-3 rounded-xl text-[10px] font-semibold text-left border transition-colors ${(selectedReport as any).department === d ? "bg-[#2D8A45] text-white border-[#2D8A45]" : "bg-[#F0FAF2] text-[#0d0d0d] border-[#d8d8d8]"}`}>
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  <TimelineBlock />

                  <div className={`bg-white rounded-2xl p-4 border transition-colors ${commentSaved ? "border-[#2D8A45]" : "border-[#e0e0e0]"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-bold text-[#222222] uppercase tracking-widest">Responder Comment</p>
                      {commentSaved && (
                        <div className="flex items-center gap-1 bg-[#2D8A45] rounded-full px-2 py-0.5">
                          <CheckCircle2 className="w-3 h-3 text-[#0d0d0d]" strokeWidth={2} />
                          <span className="text-[9px] font-bold text-[#0d0d0d]">Saved</span>
                        </div>
                      )}
                    </div>
                    {selectedReport.adminComment && !commentSaved && (
                      <div className="bg-[#F0FAF2] rounded-xl px-3 py-2 mb-2 flex items-start gap-1.5">
                        <MessageSquare className="w-3 h-3 text-[#999999] mt-0.5 shrink-0" strokeWidth={1.5} />
                        <p className="text-[10px] text-[#222222] italic">{selectedReport.adminComment}</p>
                      </div>
                    )}
                    <textarea value={commentDraft} onChange={e => { setCommentDraft(e.target.value); if (commentSaved) setCommentSaved(false); }}
                      placeholder="Add a comment visible to the user…" rows={3}
                      className={`w-full bg-[#F0FAF2] border rounded-xl px-3 py-2 text-[11px] text-[#0d0d0d] placeholder:text-[#999999] outline-none resize-none transition-colors mb-2 ${commentSaved ? "border-[#2D8A45]" : "border-[#d8d8d8] focus:border-[#2D8A45]"}`} />
                    <button onClick={() => saveComment(selectedReport.id)} disabled={!commentDraft.trim()}
                      className={`w-full text-[11px] font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${commentSaved ? "bg-[#2D8A45] text-white" : "bg-[#2D8A45] text-white hover:bg-[#236B37] disabled:opacity-40"}`}>
                      {commentSaved ? <><CheckCircle2 className="w-4 h-4" strokeWidth={2} /> Comment Saved!</> : "Save Comment"}
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })()}

        {/* SCHEDULE */}
        {tab === "Schedule" && (
          <div className="p-4 space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-[11px] font-bold text-[#0d0d0d]">Collection Schedules</p>
              <button onClick={() => {
                setAddScheduleMode(true);
                setEditScheduleDraft({ day: "", date: "", time: "", zone: "Zone A – Taman Jaya", type: "General Waste", status: "upcoming" });
                setSchedHour("7"); setSchedMin("00"); setSchedAmPm("AM");
                setScheduleModalError("");
              }}
                className="bg-[#2D8A45] text-white text-[10px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 hover:bg-[#236B37] transition-colors">
                <Plus className="w-3 h-3" strokeWidth={2} /> Add
              </button>
            </div>

            {[...schedules].sort((a, b) => schedSortKey(b).localeCompare(schedSortKey(a))).map(s => (
              <div key={s.id} className="bg-white rounded-2xl p-3 border border-[#e0e0e0]">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[11px] font-bold text-[#0d0d0d]">{s.day}, {s.date} {(s as any).month ?? ""} — {s.time}</p>
                    <p className="text-[10px] text-[#222222]">{s.type} · {s.zone}</p>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-1 inline-flex items-center gap-1 bg-[#2D8A45]/20 text-[#0d0d0d] border border-[#2D8A45]/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2D8A45] inline-block" />Soon
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => {
                      setEditSchedule(s); setEditScheduleDraft({ ...s });
                      const m = s.time.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
                      if (m) { setSchedHour(m[1]); setSchedMin(m[2].padStart(2, "0")); setSchedAmPm(m[3].toUpperCase() as "AM" | "PM"); }
                      else { setSchedHour("7"); setSchedMin("00"); setSchedAmPm("AM"); }
                      setScheduleModalError("");
                    }}
                      className="bg-[#f0f0f0] rounded-lg p-1.5 hover:bg-[#e0e0e0] transition-colors">
                      <Pencil className="w-3 h-3 text-[#0d0d0d]" strokeWidth={1.5} />
                    </button>
                    <button onClick={() => setDeleteConfirm({ label: `schedule "${s.day}, ${s.date} ${(s as any).month}"`, onConfirm: () => { setSchedules(prev => prev.filter(x => x.id !== s.id)); showToast("Schedule deleted"); } })}
                      className="bg-[#FF0000]/10 rounded-lg p-1.5 hover:bg-[#FF0000]/20 transition-colors">
                      <X className="w-3 h-3 text-[#FF0000]" strokeWidth={2} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {(editSchedule || addScheduleMode) && (
              <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center">
                <div className="bg-white rounded-t-3xl p-5 pb-8 w-full max-w-[360px] space-y-4 overflow-y-auto max-h-[92vh]">
                  <div className="flex justify-between items-center">
                    <h3 className="text-[13px] font-bold text-[#0d0d0d]">{addScheduleMode ? "Add Schedule" : "Edit Schedule"}</h3>
                    <button onClick={() => { setEditSchedule(null); setAddScheduleMode(false); setScheduleModalError(""); }}><X className="w-4 h-4 text-[#0d0d0d]" strokeWidth={2} /></button>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#222222] block mb-1.5">Date</label>
                    <input type="date" value={editScheduleDraft.rawDate ?? ""}
                      min={new Date().toISOString().slice(0, 10)}
                      onChange={e => {
                        const raw = e.target.value;
                        if (!raw) { setEditScheduleDraft(p => ({ ...p, rawDate: "", day: "", date: "" })); return; }
                        const d = new Date(raw + "T00:00:00");
                        const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
                        const monthName = d.toLocaleDateString("en-US", { month: "short" });
                        setEditScheduleDraft(p => ({ ...p, rawDate: raw, day: dayName, date: String(d.getDate()), month: monthName }));
                        setScheduleModalError("");
                      }}
                      className="w-full bg-[#F0FAF2] border border-[#d8d8d8] rounded-xl px-4 py-3 text-[13px] font-semibold text-[#0d0d0d] outline-none focus:border-[#2D8A45] cursor-pointer"
                      style={{ colorScheme: "light" }} />
                    {editScheduleDraft.rawDate && (
                      <p className="text-[10px] text-[#2D8A45] font-semibold mt-1 ml-1">
                        {new Date(editScheduleDraft.rawDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#222222] block mb-1.5">Time</label>
                    <div className="bg-[#F0FAF2] border border-[#d8d8d8] rounded-2xl overflow-hidden">
                      <div className="flex border-b border-[#e8e8e8] px-2 pt-2 pb-1">
                        <div className="flex-1 text-center text-[9px] font-bold text-[#999999] uppercase tracking-widest">Hour</div>
                        <div className="flex-1 text-center text-[9px] font-bold text-[#999999] uppercase tracking-widest">Min</div>
                        <div className="flex-1 text-center text-[9px] font-bold text-[#999999] uppercase tracking-widest">Period</div>
                      </div>
                      <div className="flex px-2 pb-2">
                        <ScrollCol items={["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]} value={schedHour} onChange={v => { setSchedHour(v); setScheduleModalError(""); }} />
                        <div className="w-px bg-[#e8e8e8] mx-1 self-stretch" />
                        <ScrollCol items={Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"))} value={schedMin} onChange={v => { setSchedMin(v); setScheduleModalError(""); }} />
                        <div className="w-px bg-[#e8e8e8] mx-1 self-stretch" />
                        <ScrollCol items={["AM", "PM"]} value={schedAmPm} onChange={v => { setSchedAmPm(v as "AM" | "PM"); setScheduleModalError(""); }} />
                      </div>
                      <div className="px-3 pb-2 text-center">
                        <span className="text-[11px] font-bold text-[#0d0d0d]">{schedHour}:{schedMin} {schedAmPm}</span>
                      </div>
                    </div>
                  </div>
                  {[["Zone", "zone"], ["Type", "type"]].map(([label, key]) => (
                    <div key={key}>
                      <label className="text-[10px] font-bold text-[#222222] block mb-1.5">{label}</label>
                      <input value={(editScheduleDraft as any)[key] ?? ""} onChange={e => setEditScheduleDraft(p => ({ ...p, [key]: e.target.value }))}
                        className="w-full bg-[#F0FAF2] border border-[#d8d8d8] rounded-xl px-4 py-3 text-[13px] outline-none focus:border-[#2D8A45]" />
                    </div>
                  ))}
                  {scheduleModalError && (
                    <p className="text-[11px] font-semibold text-[#FF0000] flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />{scheduleModalError}
                    </p>
                  )}
                  <button onClick={() => {
                    const today = new Date().toISOString().slice(0, 10);
                    if (!editScheduleDraft.rawDate) { setScheduleModalError("Please select a date."); return; }
                    if (editScheduleDraft.rawDate < today) { setScheduleModalError("Date cannot be in the past."); return; }
                    if (!editScheduleDraft.zone?.trim()) { setScheduleModalError("Zone cannot be empty."); return; }
                    if (!editScheduleDraft.type?.trim()) { setScheduleModalError("Type cannot be empty."); return; }
                    setScheduleModalError("");
                    const timeStr = `${schedHour}:${schedMin} ${schedAmPm}`;
                    const draft = { ...editScheduleDraft, time: timeStr, status: "upcoming" };
                    if (addScheduleMode) {
                      setSchedules(prev => [...prev, { ...draft, id: Date.now() } as Schedule]);
                      showToast("Schedule added");
                    } else {
                      setSchedules(prev => prev.map(s => s.id === editSchedule!.id ? { ...s, ...draft } : s));
                      showToast("Schedule updated");
                    }
                    setEditSchedule(null); setAddScheduleMode(false);
                  }} className="w-full bg-[#2D8A45] text-white font-bold py-3 rounded-2xl text-[12px]">Save Schedule</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* REWARDS */}
        {tab === "Rewards" && (
          <div className="p-4 space-y-3">
            <div className="flex justify-end">
              <button onClick={() => { setAddRewardMode(true); setEditRewardDraft({ name: "", points: 100, category: "", icon: "🎁", maxRedemptions: 50, redeemed: 0 }); }}
                className="bg-[#2D8A45] text-white text-[10px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 hover:bg-[#236B37] transition-colors">
                <Plus className="w-3 h-3" strokeWidth={2} /> Add Reward
              </button>
            </div>
            {rewards.map(r => (
              <div key={r.id} className="bg-white border border-[#e0e0e0] rounded-2xl p-3">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{r.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold truncate text-[#0d0d0d]">{r.name}</p>
                    <p className="text-[10px] text-[#999999]">{r.category} · {r.points} pts</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => { setEditReward(r); setEditRewardDraft({ ...r }); }}
                      className="bg-[#f0f0f0] rounded-lg p-1.5 hover:bg-[#e0e0e0] transition-colors">
                      <Pencil className="w-3 h-3 text-[#0d0d0d]" strokeWidth={1.5} />
                    </button>
                    <button onClick={() => setDeleteConfirm({ label: `reward "${r.name}"`, onConfirm: () => { setRewards(prev => prev.filter(x => x.id !== r.id)); showToast("Reward deleted"); } })}
                      className="bg-[#FF0000]/10 rounded-lg p-1.5 hover:bg-[#FF0000]/20 transition-colors">
                      <X className="w-3 h-3 text-[#FF0000]" strokeWidth={2} />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between text-[10px] text-[#222222] mb-1">
                  <span>Redeemed: <strong>{r.redeemed}</strong></span>
                  <span>Max: <strong>{r.maxRedemptions}</strong></span>
                  <span>Remaining: <strong className={r.maxRedemptions - r.redeemed <= 5 ? "text-[#FF0000]" : ""}>{r.maxRedemptions - r.redeemed}</strong></span>
                </div>
                <div className="h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
                  <div className="h-full bg-[#2D8A45] rounded-full" style={{ width: `${Math.min(100, (r.redeemed / r.maxRedemptions) * 100)}%` }} />
                </div>
              </div>
            ))}
            {(editReward || addRewardMode) && (
              <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center">
                <div className="bg-white rounded-t-3xl p-5 pb-8 w-full max-w-[360px] space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-[13px] font-bold text-[#0d0d0d]">{addRewardMode ? "Add Reward" : "Edit Reward"}</h3>
                    <button onClick={() => { setEditReward(null); setAddRewardMode(false); }}><X className="w-4 h-4 text-[#0d0d0d]" strokeWidth={2} /></button>
                  </div>
                  {[["Name", "name", "text"], ["Category", "category", "text"], ["Icon (emoji)", "icon", "text"], ["Points", "points", "number"], ["Max Redemptions", "maxRedemptions", "number"]].map(([label, key, type]) => (
                    <div key={key}>
                      <label className="text-[10px] font-bold text-[#222222] block mb-1">{label}</label>
                      <input type={type} value={(editRewardDraft as any)[key] ?? ""} onChange={e => setEditRewardDraft(p => ({ ...p, [key]: type === "number" ? +e.target.value : e.target.value }))}
                        className="w-full bg-[#F0FAF2] border border-[#d8d8d8] rounded-xl px-3 py-2 text-[12px] outline-none" />
                    </div>
                  ))}
                  <button onClick={() => {
                    if (addRewardMode) {
                      setRewards(prev => [...prev, { ...editRewardDraft, id: Date.now(), redeemed: 0 } as Reward]);
                      showToast("Reward added");
                    } else {
                      setRewards(prev => prev.map(x => x.id === editReward!.id ? { ...x, ...editRewardDraft } : x));
                      showToast("Reward updated");
                    }
                    setEditReward(null); setAddRewardMode(false);
                  }} className="w-full bg-[#2D8A45] hover:bg-[#236B37] text-white font-bold py-3 rounded-2xl text-[12px] transition-colors">Save</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* UPDATES */}
        {tab === "Updates" && (() => {
          const groupedNotices = notices.reduce<Record<string, Notice[]>>((acc, n) => {
            const key = n.date.slice(0, 7);
            if (!acc[key]) acc[key] = [];
            acc[key].push(n);
            return acc;
          }, {});
          const sortedKeys = Object.keys(groupedNotices).sort((a, b) => b.localeCompare(a));
          const fmtMonthKey = (k: string) => new Date(k + "-01").toLocaleDateString("en-US", { year: "numeric", month: "long" });
          const openEdit = (n: Notice) => { setEditNotice(n); setNoticeTitle(n.title); setNoticeBody(n.body); setNoticePinned(n.pinned); setNoticeError(""); };
          const clearForm = () => { setEditNotice(null); setNoticeTitle(""); setNoticeBody(""); setNoticePinned(false); setNoticeError(""); };
          const handleSaveNotice = () => {
            if (!noticeTitle.trim()) { setNoticeError("Title is required."); return; }
            if (!noticeBody.trim()) { setNoticeError("Message body is required."); return; }
            setNoticeError("");
            const today = new Date().toISOString().slice(0, 10);
            if (editNotice) {
              setNotices(prev => prev.map(n => n.id === editNotice.id ? { ...n, title: noticeTitle.trim(), body: noticeBody.trim(), pinned: noticePinned } : n));
              showToast("Notice updated");
            } else {
              setNotices(prev => [{ id: Date.now(), title: noticeTitle.trim(), body: noticeBody.trim(), date: today, pinned: noticePinned }, ...prev]);
              showToast("Notice published to all users");
            }
            clearForm();
          };
          return (
            <div className="p-4 space-y-4">
              <div className={`bg-white rounded-2xl p-4 border ${editNotice ? "border-[#C5E48A]" : "border-[#e0e0e0]"}`}>
                <p className="text-[10px] font-bold text-[#222222] uppercase tracking-widest mb-3">
                  {editNotice ? "Edit Notice" : "Create New Notice"}
                </p>
                <div className="space-y-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-[#222222] block mb-1">Title</label>
                    <input value={noticeTitle} onChange={e => { setNoticeTitle(e.target.value); if (noticeError) setNoticeError(""); }}
                      placeholder="e.g. Schedule Change Notice"
                      className="w-full bg-[#F0FAF2] border border-[#d8d8d8] rounded-xl px-3 py-2.5 text-[12px] outline-none focus:border-[#2D8A45] transition-colors" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#222222] block mb-1">Message</label>
                    <textarea value={noticeBody} onChange={e => { setNoticeBody(e.target.value); if (noticeError) setNoticeError(""); }}
                      placeholder="Write your notice to users here…" rows={3}
                      className="w-full bg-[#F0FAF2] border border-[#d8d8d8] rounded-xl px-3 py-2.5 text-[12px] outline-none focus:border-[#2D8A45] transition-colors resize-none" />
                  </div>
                  {(() => {
                    const canPin = noticeTitle.trim().length > 0 && noticeBody.trim().length > 0;
                    return (
                      <button type="button" disabled={!canPin} onClick={() => { if (canPin) setNoticePinned(v => !v); }}
                        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-[11px] font-bold transition-all
                          ${!canPin ? "bg-[#F0FAF2] border-[#e0e0e0] text-[#c0c0c0] cursor-not-allowed"
                            : noticePinned ? "bg-[#C5E48A] border-[#C5E48A] text-[#0d0d0d]"
                            : "bg-white border-[#d8d8d8] text-[#999999] hover:border-[#2D8A45] hover:text-[#0d0d0d]"}`}>
                        {noticePinned && canPin
                          ? <><PinOff className="w-3.5 h-3.5" strokeWidth={1.5} /> Pinned — tap to unpin</>
                          : <><Pin className="w-3.5 h-3.5" strokeWidth={1.5} /> {canPin ? "Pin to top of notifications" : "Fill title & message to pin"}</>}
                      </button>
                    );
                  })()}
                  {noticeError && (
                    <p className="text-[10px] font-semibold text-[#FF0000] flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 shrink-0" strokeWidth={2} />{noticeError}
                    </p>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button onClick={handleSaveNotice}
                      className="flex-1 bg-[#2D8A45] text-white text-[11px] font-bold py-2.5 rounded-xl hover:bg-[#236B37] transition-colors">
                      {editNotice ? "Update Notice" : "Publish Notice"}
                    </button>
                    {editNotice && (
                      <button onClick={clearForm}
                        className="bg-[#f0f0f0] text-[#0d0d0d] text-[11px] font-bold px-4 py-2.5 rounded-xl hover:bg-[#e0e0e0] transition-colors">
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#222222] uppercase tracking-widest mb-2">Notice History</p>
                {sortedKeys.length === 0 && <p className="text-center text-[11px] text-[#999999] py-6">No notices published yet.</p>}
                {sortedKeys.map(key => (
                  <div key={key} className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[9px] font-bold text-[#999999] uppercase tracking-widest">{fmtMonthKey(key)}</span>
                      <div className="flex-1 h-px bg-[#e8e8e8]" />
                    </div>
                    <div className="space-y-2">
                      {groupedNotices[key].sort((a, b) => b.date.localeCompare(a.date)).map(n => (
                        <div key={n.id} className={`bg-white rounded-2xl p-3 border ${n.pinned ? "border-[#C5E48A]" : "border-[#e0e0e0]"}`}>
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                              {n.pinned && <span className="text-[8px] font-bold bg-[#C5E48A] text-[#0d0d0d] px-1.5 py-0.5 rounded-full shrink-0">PINNED</span>}
                              <p className="text-[11px] font-bold text-[#0d0d0d] truncate">{n.title}</p>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <button onClick={() => { setNotices(prev => prev.map(x => x.id === n.id ? { ...x, pinned: !x.pinned } : x)); showToast(n.pinned ? "Notice unpinned" : "Notice pinned"); }}
                                className={`rounded-lg p-1.5 transition-colors ${n.pinned ? "bg-[#C5E48A] hover:bg-[#C5E48A]" : "bg-[#f0f0f0] hover:bg-[#e0e0e0]"}`}>
                                {n.pinned ? <PinOff className="w-3 h-3 text-[#0d0d0d]" strokeWidth={1.5} /> : <Pin className="w-3 h-3 text-[#0d0d0d]" strokeWidth={1.5} />}
                              </button>
                              <button onClick={() => openEdit(n)} className="bg-[#f0f0f0] rounded-lg p-1.5 hover:bg-[#e0e0e0] transition-colors">
                                <Pencil className="w-3 h-3 text-[#0d0d0d]" strokeWidth={1.5} />
                              </button>
                              <button onClick={() => setDeleteConfirm({ label: `notice "${n.title}"`, onConfirm: () => { setNotices(prev => prev.filter(x => x.id !== n.id)); showToast("Notice deleted"); } })}
                                className="bg-[#FF0000]/10 rounded-lg p-1.5 hover:bg-[#FF0000]/20 transition-colors">
                                <X className="w-3 h-3 text-[#FF0000]" strokeWidth={2} />
                              </button>
                            </div>
                          </div>
                          <p className="text-[10px] text-[#222222] leading-snug line-clamp-2">{n.body}</p>
                          <p className="text-[9px] text-[#999999] mt-1.5">{new Date(n.date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* FEEDBACK */}
        {tab === "Feedback" && (() => {
          const D = 86400000, now = Date.now();
          const defaultFeedback = [
            { name: "Ahmad Rizwan", rating: 5, text: "Really love the app! Easy to report issues and track status in real time. Keep it up!", ts: now - 1 * D },
            { name: "Siti Amirah", rating: 4, text: "Good app overall. The schedule feature is helpful but I would love push notifications too.", ts: now - 2 * D },
            { name: "Tan Wei Liang", rating: 5, text: "The bin capacity map is very useful. I can plan my recycling trip without wasting fuel!", ts: now - 3 * D },
            { name: "Nurul Hana", rating: 3, text: "App is decent but sometimes the GPS takes too long to load. Needs performance improvement.", ts: now - 4 * D },
            { name: "Lim Jun Hao", rating: 4, text: "Love the live truck tracking feature. I know exactly when collection is coming to my area.", ts: now - 5 * D },
            { name: "Priya Nair", rating: 5, text: "Excellent! I reported an illegal dumping site and it was cleaned up within 2 days. Amazing!", ts: now - 6 * D },
            { name: "Hafiz Zainal", rating: 4, text: "Very clean design. Reporting is straightforward. Would be better with a dark mode option.", ts: now - 8 * D },
            { name: "Mei Ling Choo", rating: 5, text: "I earned enough reward points to redeem a voucher! Great incentive to keep the area clean.", ts: now - 10 * D },
            { name: "Rajan Kumar", rating: 2, text: "My report was rejected without a clear reason. The admin comment was too brief. Please improve.", ts: now - 12 * D },
            { name: "Aishah Bt Yusof", rating: 5, text: "Best waste management app I have used. The leaderboard makes recycling fun and competitive!", ts: now - 14 * D },
          ];
          const stored: { name: string; rating: number; text: string; ts: number }[] = (() => {
            try { return JSON.parse(localStorage.getItem("bingo_feedback") || "[]"); } catch { return []; }
          })();
          const feedbackList = stored.length >= 10 ? stored : defaultFeedback;
          const sorted = [...feedbackList].sort((a, b) => b.ts - a.ts);
          const avgRating = sorted.length ? (sorted.reduce((s, f) => s + f.rating, 0) / sorted.length).toFixed(1) : "–";
          return (
            <div className="p-4 space-y-3">
              <div className="bg-white rounded-2xl p-4 border border-[#e0e0e0] flex items-center gap-4">
                <div className="text-center">
                  <p className="text-[28px] font-bold text-[#0d0d0d] leading-none">{avgRating}</p>
                  <div className="flex gap-0.5 mt-1 justify-center">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`w-3 h-3 ${s <= Math.round(Number(avgRating)) ? "fill-[#2D8A45] text-[#2D8A45]" : "text-[#d8d8d8]"}`} strokeWidth={1.5} />
                    ))}
                  </div>
                  <p className="text-[9px] text-[#999999] mt-0.5">avg rating</p>
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-bold text-[#0d0d0d]">User Feedback</p>
                  <p className="text-[11px] text-[#222222]">{sorted.length} submission{sorted.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
              {sorted.length === 0 && (
                <div className="text-center py-10">
                  <MessageSquare className="w-10 h-10 text-[#d8d8d8] mx-auto mb-2" strokeWidth={1.5} />
                  <p className="text-[12px] text-[#999999]">No feedback submitted yet.</p>
                </div>
              )}
              {sorted.map((f, i) => (
                <div key={i} className="bg-white rounded-2xl p-3.5 border border-[#e0e0e0] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-[#7AAA83]/10 rounded-xl flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-[#0d0d0d]" strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-[#0d0d0d]">{f.name}</p>
                        <p className="text-[9px] text-[#999999]">{new Date(f.ts).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`w-3.5 h-3.5 ${s <= f.rating ? "fill-[#2D8A45] text-[#2D8A45]" : "text-[#e0e0e0]"}`} strokeWidth={1.5} />
                      ))}
                    </div>
                  </div>
                  {f.text && (
                    <p className="text-[11px] text-[#222222] bg-[#F0FAF2] rounded-xl px-3 py-2 leading-snug">"{f.text}"</p>
                  )}
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Bottom Nav */}
      <div className="bg-white border-t border-[#e8e8e8] px-2 pt-2 pb-3 flex shrink-0">
        {adminNavItems.map(item => (
          <button key={item.id} onClick={() => setTab(item.id)}
            className="flex-1 flex flex-col items-center gap-0.5 py-1 transition-colors">
            <span className={tab === item.id ? "text-[#0d0d0d]" : "text-[#999999]"}>{item.icon}</span>
            <span className={`text-[9px] font-bold ${tab === item.id ? "text-[#0d0d0d]" : "text-[#999999]"}`}>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
