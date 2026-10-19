import { useState, useEffect, useRef } from "react";
import { AdminLiveValue, AdminLiveMeter } from "./AdminLiveData";
import AdminOperations from "./AdminOperations";
import BackButton from "./BackButton";
import AnimatedIcon from "./AnimatedIcon";
import {
  LayoutDashboard, FileText, CalendarDays, Gift, Bell, MessageSquare,
  LogOut, AlertTriangle, Filter, ChevronRight, MapPin, CheckCircle2,
  Pencil, X, Plus, Pin, PinOff, Star, User,
} from "lucide-react";
import {
  Report, LiveUpdate, Schedule, Reward, Bin, Notice,
  DEPARTMENTS, urgencyColors, fillColor, schedSortKey, ScrollCol,
  getReportTimeScore,
} from "./appData";
import { subscribeToFeedback, type ResidentFeedback, addRewardToDb, updateRewardInDb, deleteRewardFromDb, addScheduleToDb, updateScheduleInDb, deleteScheduleFromDb, addNoticeToDb, updateNoticeInDb, deleteNoticeFromDb, updateReportStatusInDb, getFeedbackForAdmin } from "./firebase";

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
  onLogout: () => void; rewardsLoading?: boolean; rewardsError?: string; reportsError?: string; demoAdmin?: boolean;
}) {
  type AdminTab = "Review" | "Dashboard" | "Reports" | "Schedule" | "Rewards" | "Updates" | "Feedback";
  const [tab, setTab] = useState<AdminTab>("Dashboard");
  const [feedbackState, setFeedbackState] = useState<{
    loading: boolean; error: string; items: { id: string; name: string; rating: number; text: string; ts: number }[];
  }>({ loading: false, error: "", items: [] });
  const [feedbackReload, setFeedbackReload] = useState(0);
  useEffect(() => {
    if (tab !== "Feedback") return;
    let active = true;
    setFeedbackState(prev => ({ ...prev, loading: true, error: "" }));
    getFeedbackForAdmin().then(items => {
      if (active) setFeedbackState({ loading: false, error: "", items });
    }).catch(error => {
      if (!active) return;
      const code = (error as { code?: string }).code;
      setFeedbackState({
        loading: false,
        items: [],
        error: code === "permission-denied"
          ? "Permission denied: reading feedback needs a Firebase administrator account with the admin claim."
          : "Could not load feedback. Please try again.",
      });
    });
    return () => { active = false; };
  }, [tab, feedbackReload]);
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
  const [deleteConfirm, setDeleteConfirm] = useState<{ label: string; onConfirm: () => Promise<boolean> } | null>(null);
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

  const [feedback, setFeedback] = useState<ResidentFeedback[]>([]);
  const [feedbackError, setFeedbackError] = useState("");
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  useEffect(() => {
    if (tab !== "Feedback") return;
    setFeedbackLoading(true); setFeedbackError("");
    return subscribeToFeedback(items => { setFeedback(items); setFeedbackLoading(false); }, error => {
      setFeedback([]); setFeedbackLoading(false);
      setFeedbackError("Feedback could not load. Check Firebase admin authorization. " + error.message);
    });
  }, [tab]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  useEffect(() => { setTimelineExpanded(false); setSelectedInAction(""); }, [selectedReport?.id]);

  const IN_ACTION_OPTIONS = [
    "Dispatching cleanup crew",
    "Notifying local authority",
    "Issuing warning notice",
    "Scheduling special pickup",
    "Under investigation",
    "Forwarding to department",
    "Awaiting site inspection",
  ];

  const writeLock = useRef(false);
  const [writeError, setWriteError] = useState("");
  const [writing, setWriting] = useState(false);
  const requireId = (item: {firestoreId?: string}) => {
    if (!item.firestoreId) throw new Error("This record has no saved document. Refresh and try again.");
    return item.firestoreId;
  };
  const runWrite = async (operation: () => Promise<unknown>, message: string) => {
    if (writeLock.current) return false;
    writeLock.current = true; setWriting(true); setWriteError("");
    try { await operation(); showToast(message); return true; }
    catch (error) { setWriteError(error instanceof Error ? error.message : "Could not save. Try again."); return false; }
    finally { writeLock.current = false; setWriting(false); }
  };
  const persistReport = async (id: number, updates: Partial<Report>) => {
    const report = reports.find(r => r.id === id);
    if (!report) return;
    await runWrite(async () => {
      await updateReportStatusInDb(requireId(report), updates);
      setReports(prev => prev.map(r => r.id === id ? {...r, ...updates} : r));
      setSelectedReport(prev => prev?.id === id ? {...prev, ...updates} : prev);
    }, "Report saved");
  };
  const advanceToInAction = async (id: number, actionType: string) => {
    const report = reports.find(r => r.id === id);
    if (!report) return;
    await persistReport(id, {status: "In Action", timeline: [...(report.timeline || []), `In Action – ${actionType} · just now`]});
    setSelectedInAction("");
  };

  const urgencyOrder: Record<string, number> = { High: 0, Medium: 1, Low: 2 };
  const statusOrder: Record<string, number> = { Pending: 0, "In Action": 1, Completed: 2, Rejected: 3 };

  const filteredReports = reports
    .filter(r => reportStatusFilter === "All" || r.status === reportStatusFilter)
    .sort((a, b) => {
      if (reportSort === "urgency") return (urgencyOrder[a.urgency] ?? 9) - (urgencyOrder[b.urgency] ?? 9);
      if (reportSort === "status") return (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9);
      return getReportTimeScore(b) - getReportTimeScore(a);
    });

  const updateReportStatus = (id: number, status: string) => {
    const report = reports.find(r => r.id === id);
    if (report) void persistReport(id, {status, completedAt: Date.now(), timeline: [...(report.timeline || []), `${status} · just now`]});
  };
  const assignDept = (id: number, department: string) => { void persistReport(id, {department}); };
  const saveComment = (id: number) => { if (commentDraft.trim()) void persistReport(id, {adminComment: commentDraft.trim()}); };

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
    { id: "Review", label: "Review", icon: <CheckCircle2 className="w-5 h-5" /> },
    { id: "Dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" strokeWidth={1.5} /> },
    { id: "Reports", label: "Reports", icon: <FileText className="w-5 h-5" strokeWidth={1.5} /> },
    { id: "Schedule", label: "Schedule", icon: <CalendarDays className="w-5 h-5" strokeWidth={1.5} /> },
    { id: "Rewards", label: "Rewards", icon: <Gift className="w-5 h-5" strokeWidth={1.5} /> },
    { id: "Updates", label: "Updates", icon: <Bell className="w-5 h-5" strokeWidth={1.5} /> },
    { id: "Feedback", label: "Feedback", icon: <MessageSquare className="w-5 h-5" strokeWidth={1.5} /> },
  ];

  return (
    <div className="w-full max-w-[420px] mx-auto app-shell bg-white sm:rounded-[2.8rem] sm:border-[8px] sm:border-slate-900 shadow-2xl flex flex-col overflow-hidden relative ring-1 ring-slate-900/10">
      {writeError && <p role="alert" className="absolute top-12 inset-x-3 z-[100] rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-800">{writeError}</p>}
      {/* Mobile Top Dynamic Island / Speaker Pill on Desktop */}
      <div className="hidden sm:flex justify-center pt-2 pb-1 bg-[#133E26] shrink-0">
        <div className="w-24 h-4 bg-black/70 rounded-full flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500/80" />
          <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
        </div>
      </div>

      {/* Header */}
      <header className="px-5 py-4 shrink-0">
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
      </header>

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
            <div className="icon-container w-10 h-10 rounded-2xl bg-[#FF0000]/10 flex items-center justify-center mb-3">
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
            <div className="icon-container w-12 h-12 rounded-2xl bg-[#FEE2E2] flex items-center justify-center mb-3 mx-auto">
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
              <button disabled={writing} onClick={async () => { if (await deleteConfirm.onConfirm()) setDeleteConfirm(null); }}
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
                  <p className={`text-[28px] font-bold ${s.text} leading-none mt-1`}><AdminLiveValue value={s.value} /></p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl p-4 border border-[#e0e0e0]">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold text-[#222222] uppercase tracking-widest">Collection Progress</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#2D8A45] animate-pulse" />
                  <span className="text-[9px] text-[#999999] font-semibold">Snapshot</span>
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
                        <span className="text-[11px] font-bold" style={{ color: fc.dot }}><AdminLiveValue value={truck.progress} suffix="%" /></span>
                      </div>
                      <AdminLiveMeter value={truck.progress} color={fc.bar} label={`${truck.location} collection progress`} />
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
                  <span className="text-[9px] text-[#999999] font-semibold">Snapshot</span>
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
                        <span className="text-[10px] font-bold" style={{ color: fc.dot }}><AdminLiveValue value={b.fill} suffix="%" /></span>
                      </div>
                      <AdminLiveMeter value={b.fill} color={fc.bar} label={`${b.name} capacity`} />
                    </div>
                  );
                })}
              </div>
              {bins.length > 5 && (
                <button onClick={() => setShowAllBins(v => !v)}
                  className="mt-3 w-full text-[10px] font-bold text-[#2D8A45] bg-[#F0FAF2] hover:bg-[#D1FAE5] py-2 rounded-xl transition-colors">
                  <span className="inline-flex items-center justify-center gap-1.5"><AnimatedIcon name={showAllBins ? "up" : "down"} className="w-4 h-4" />{showAllBins ? "Show Less" : `View All (${bins.length})`}</span>
                </button>
              )}
            </div>

            <div className="bg-white rounded-2xl p-4 border border-[#e0e0e0]">
              <p className="text-[10px] font-bold text-[#222222] uppercase tracking-widest mb-3">Rewards Overview</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-[#F0FAF2] rounded-xl py-3">
                  <p className="text-[22px] font-bold text-[#0d0d0d] leading-none"><AdminLiveValue value={rewards.length} /></p>
                  <p className="text-[9px] text-[#999999] mt-1">Rewards</p>
                </div>
                <div className="bg-[#F0FAF2] rounded-xl py-3">
                  <p className="text-[22px] font-bold text-[#0d0d0d] leading-none"><AdminLiveValue value={rewards.reduce((s, r) => s + r.redeemed, 0)} /></p>
                  <p className="text-[9px] text-[#999999] mt-1">Redeemed</p>
                </div>
                <div className="bg-[#F0FAF2] rounded-xl py-3">
                  <p className="text-[22px] font-bold text-[#0d0d0d] leading-none"><AdminLiveValue value={rewards.reduce((s, r) => s + (r.maxRedemptions - r.redeemed), 0)} /></p>
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
                .sort((a, b) => getReportTimeScore(b) - getReportTimeScore(a));
              return (
                <div className="space-y-3">
                  <p className="text-[11px] font-bold text-[#0d0d0d] uppercase tracking-widest">Active</p>
                  <div className="relative" onClick={e => e.stopPropagation()}>
                    <button
                      aria-expanded={activeDropdown === "adminActive"} onClick={() => setActiveDropdown(activeDropdown === "adminActive" ? null : "adminActive")}
                      className="flex items-center gap-1.5 bg-white border border-[#d8d8d8] rounded-xl px-3 py-1.5 text-[10px] font-bold text-[#0d0d0d] hover:bg-[#F0FAF2] transition-colors">
                      <AnimatedIcon name={activeDropdown === "adminActive" ? "close" : "filter"} className="w-3 h-3" />
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
                .sort((a, b) => getReportTimeScore(b) - getReportTimeScore(a));
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
                      aria-expanded={activeDropdown === "adminHistory"} onClick={() => setActiveDropdown(activeDropdown === "adminHistory" ? null : "adminHistory")}
                      className="flex items-center gap-1.5 bg-white border border-[#d8d8d8] rounded-xl px-3 py-1.5 text-[10px] font-bold text-[#0d0d0d] hover:bg-[#F0FAF2] transition-colors">
                      <AnimatedIcon name={activeDropdown === "adminHistory" ? "close" : "filter"} className="w-3 h-3" />
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
                    <span className="inline-flex items-center gap-1.5"><AnimatedIcon name={timelineExpanded ? "up" : "down"} className="w-4 h-4" />{timelineExpanded ? "Show less" : `Show ${hidden} more step${hidden > 1 ? "s" : ""}`}</span>
                  </button>
                )}
              </div>
            );
          };

          return (
            <div className="p-4 space-y-3">
              <div className="bg-white rounded-2xl p-4 border border-[#e0e0e0]">
                <div className="flex justify-between items-start mb-2">
                  <BackButton onClick={() => setSelectedReport(null)} label="Back to reports" />
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
                      className="icon-button bg-[#f0f0f0] rounded-lg p-1.5 hover:bg-[#e0e0e0] transition-colors">
                      <Pencil className="w-3 h-3 text-[#0d0d0d]" strokeWidth={1.5} />
                    </button>
                    <button onClick={() => setDeleteConfirm({ label: `schedule "${s.day}, ${s.date} ${(s as any).month}"`, onConfirm: () => runWrite(() => deleteScheduleFromDb(requireId(s)), "Schedule deleted") })}
                      className="icon-button bg-[#FF0000]/10 rounded-lg p-1.5 hover:bg-[#FF0000]/20 transition-colors">
                      <X className="w-3 h-3 text-[#FF0000]" strokeWidth={2} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {(editSchedule || addScheduleMode) && (
              <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center">
                <div className="bg-white rounded-t-3xl p-5 pb-8 w-full max-w-[360px] space-y-4 overflow-y-auto max-h-[92dvh]">
                  <div className="flex justify-between items-center">
                    <h3 className="text-[13px] font-bold text-[#0d0d0d]">{addScheduleMode ? "Add Schedule" : "Edit Schedule"}</h3>
                    <button className="icon-button" onClick={() => { setEditSchedule(null); setAddScheduleMode(false); setScheduleModalError(""); }}><X className="w-4 h-4 text-[#0d0d0d]" strokeWidth={2} /></button>
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
                        <div className="icon-container w-px bg-[#e8e8e8] mx-1 self-stretch" />
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
                  <button disabled={writing} onClick={async () => {
                    const today = new Date().toISOString().slice(0, 10);
                    if (!editScheduleDraft.rawDate) { setScheduleModalError("Please select a date."); return; }
                    if (editScheduleDraft.rawDate < today) { setScheduleModalError("Date cannot be in the past."); return; }
                    if (!editScheduleDraft.zone?.trim()) { setScheduleModalError("Zone cannot be empty."); return; }
                    if (!editScheduleDraft.type?.trim()) { setScheduleModalError("Type cannot be empty."); return; }
                    setScheduleModalError("");
                    const timeStr = `${schedHour}:${schedMin} ${schedAmPm}`;
                    const draft = { ...editScheduleDraft, time: timeStr, status: "upcoming" };
                    const {rawDate, ...savedDraft} = draft;
                    const saved = await runWrite(() => addScheduleMode
                      ? addScheduleToDb(savedDraft as Omit<Schedule, "id" | "firestoreId">)
                      : updateScheduleInDb(requireId(editSchedule!), savedDraft), "Schedule saved");
                    if (!saved) return;
                    setEditSchedule(null); setAddScheduleMode(false);
                  }} className="w-full bg-[#2D8A45] text-white font-bold py-3 rounded-2xl text-[12px]">Save Schedule</button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "Review" && <AdminOperations />}

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
                      className="icon-button bg-[#f0f0f0] rounded-lg p-1.5 hover:bg-[#e0e0e0] transition-colors">
                      <Pencil className="w-3 h-3 text-[#0d0d0d]" strokeWidth={1.5} />
                    </button>
                    <button onClick={() => setDeleteConfirm({ label: `reward "${r.name}"`, onConfirm: () => runWrite(() => deleteRewardFromDb(requireId(r)), "Reward deleted") })}
                      className="icon-button bg-[#FF0000]/10 rounded-lg p-1.5 hover:bg-[#FF0000]/20 transition-colors">
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
                <div className="bg-white rounded-t-3xl p-5 pb-8 w-full max-w-[360px] max-h-[85dvh] overflow-y-auto space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-[13px] font-bold text-[#0d0d0d]">{addRewardMode ? "Add Reward" : "Edit Reward"}</h3>
                    <button className="icon-button" onClick={() => { setEditReward(null); setAddRewardMode(false); }}><X className="w-4 h-4 text-[#0d0d0d]" strokeWidth={2} /></button>
                  </div>
                  {[["Name", "name", "text"], ["Category", "category", "text"], ["Icon (emoji)", "icon", "text"], ["Points", "points", "number"], ["Max Redemptions", "maxRedemptions", "number"]].map(([label, key, type]) => (
                    <div key={key}>
                      <label className="text-[10px] font-bold text-[#222222] block mb-1">{label}</label>
                      <input type={type} value={(editRewardDraft as any)[key] ?? ""} onChange={e => setEditRewardDraft(p => ({ ...p, [key]: type === "number" ? +e.target.value : e.target.value }))}
                        className="w-full bg-[#F0FAF2] border border-[#d8d8d8] rounded-xl px-3 py-2 text-[12px] outline-none" />
                    </div>
                  ))}
                  <details className="text-xs"><summary>Offer details & terms</summary><div className="space-y-2 mt-2">{([['Description','description'],['Validity','validity'],['Delivery method','deliveryMethod'],['Applicable stores','applicableStores'],['Minimum spend / eligible products','minimumSpend'],['Usage instructions','usageInstructions'],['Terms and conditions','terms']] as const).map(([label,key]) => <label key={key} className="block">{label}<textarea className="mt-1 w-full border rounded-lg p-2" value={editRewardDraft[key] || ''} onChange={e => setEditRewardDraft(v => ({...v,[key]:e.target.value}))} /></label>)}</div></details>
                  <button disabled={writing} onClick={async () => {
                    if (!editRewardDraft.name?.trim() || !Number.isInteger(editRewardDraft.points) || (editRewardDraft.points || 0) <= 0 || !Number.isInteger(editRewardDraft.maxRedemptions) || (editRewardDraft.maxRedemptions || 0) < 1) {
                      setWriteError("Enter a name, positive whole-number points and redemption limit."); return;
                    }
                    const {id, firestoreId, redeemed, ...draft} = editRewardDraft;
                    const saved = await runWrite(() => addRewardMode
                      ? addRewardToDb({...draft, id: Date.now(), redeemed: 0} as Reward)
                      : updateRewardInDb(requireId(editReward!), draft), "Reward saved");
                    if (!saved) return;
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
          const handleSaveNotice = async () => {
            if (!noticeTitle.trim()) { setNoticeError("Title is required."); return; }
            if (!noticeBody.trim()) { setNoticeError("Message body is required."); return; }
            setNoticeError("");
            const today = new Date().toISOString().slice(0, 10);
            const draft = {title: noticeTitle.trim(), body: noticeBody.trim(), pinned: noticePinned};
            const saved = await runWrite(() => editNotice
              ? updateNoticeInDb(requireId(editNotice), draft)
              : addNoticeToDb({...draft, date: today}), "Notice saved");
            if (!saved) return;
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
                        <AnimatedIcon name={noticePinned && canPin ? "pinOff" : "pin"} className="w-3.5 h-3.5" strokeWidth={1.5} />
                        {noticePinned && canPin ? "Pinned — tap to unpin" : canPin ? "Pin to top of notifications" : "Fill title & message to pin"}
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
                              <button onClick={() => void runWrite(() => updateNoticeInDb(requireId(n), {pinned: !n.pinned}), "Notice saved")}
                                className={`icon-button rounded-lg p-1.5 transition-colors ${n.pinned ? "bg-[#C5E48A] hover:bg-[#C5E48A]" : "bg-[#f0f0f0] hover:bg-[#e0e0e0]"}`}>
                                <AnimatedIcon name={n.pinned ? "pinOff" : "pin"} className="w-3 h-3 text-[#0d0d0d]" strokeWidth={1.5} />
                              </button>
                              <button onClick={() => openEdit(n)} className="icon-button bg-[#f0f0f0] rounded-lg p-1.5 hover:bg-[#e0e0e0] transition-colors">
                                <Pencil className="w-3 h-3 text-[#0d0d0d]" strokeWidth={1.5} />
                              </button>
                              <button onClick={() => setDeleteConfirm({ label: `notice "${n.title}"`, onConfirm: () => runWrite(() => deleteNoticeFromDb(requireId(n)), "Notice deleted") })}
                                className="icon-button bg-[#FF0000]/10 rounded-lg p-1.5 hover:bg-[#FF0000]/20 transition-colors">
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
          const sorted = [...feedbackState.items].sort((a, b) => b.ts - a.ts);
          const avgRating = sorted.length ? (sorted.reduce((s, f) => s + f.rating, 0) / sorted.length).toFixed(1) : "–";
          return (
            <div className="p-4 space-y-3">
              {feedbackLoading && <p role="status">Loading feedback…</p>}
              {feedbackError && <p role="alert" className="text-xs text-red-700">{feedbackError}</p>}
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
                  <p className="text-[13px] font-bold text-[#0d0d0d]">Resident feedback</p>
                  <p className="text-[11px] text-[#222222]">{feedbackState.loading ? "Loading…" : `${sorted.length} submission${sorted.length !== 1 ? "s" : ""}`}</p>
                </div>
              </div>
              {!feedbackLoading && !feedbackError && sorted.length === 0 && (
                <div className="text-center py-10">
                  <MessageSquare className="w-10 h-10 text-[#d8d8d8] mx-auto mb-2" strokeWidth={1.5} />
                  <p className="text-[12px] text-[#999999]">No feedback submitted yet.</p>
                </div>
              )}
              {sorted.map((f) => (
                <div key={f.id} className="bg-white rounded-2xl p-3.5 border border-[#e0e0e0] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="icon-container w-8 h-8 bg-[#7AAA83]/10 rounded-xl flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-[#0d0d0d]" strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-[#0d0d0d]">{f.name}</p>
                        <p className="text-[9px] text-[#999999]">{f.ts ? new Date(f.ts).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Date unavailable"}</p>
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
      <div className="bg-white border-t border-[#e8e8e8] px-2 pt-2 pb-2.5 flex shrink-0">
        {adminNavItems.map(item => (
          <button key={item.id} onClick={() => setTab(item.id)}
            className="flex-1 flex flex-col items-center gap-0.5 py-1 transition-colors">
            <span className={tab === item.id ? "text-[#0d0d0d]" : "text-[#999999]"}>{item.icon}</span>
            <span className={`text-[9px] font-bold ${tab === item.id ? "text-[#0d0d0d]" : "text-[#999999]"}`}>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Mobile Bottom Home Bar Indicator */}
      <div className="hidden sm:block py-1.5 bg-white shrink-0">
        <div className="w-28 h-1 bg-slate-900/20 rounded-full mx-auto" />
      </div>
    </div>
  );
}
