import React, { useRef, useEffect } from "react";

export type NavStep = { icon: "straight" | "left" | "right" | "arrive"; label: string; road: string; dist: string };

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  avatar: string;
  bg: string;
  zone: string;
  area: string;
  phone: string;
  collectionDays: string;
  photoURL?: string;
  provider?: "google" | "email" | "phone";
  lastLoginAt?: number;
}

import { SIME_DARBY_TOWNSHIPS, SIME_DARBY_COLLECTION_POINTS } from "./simeDarbyData";

// Dynamic Device-Level Account History (per-browser / Chrome profile)
const DEVICE_ACCOUNTS_KEY = "bingo_device_accounts";

export function getDeviceAccounts(): UserAccount[] {
  try {
    const raw = localStorage.getItem(DEVICE_ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Remove prototype/demo rows from earlier builds; only real app sign-ins belong here.
    const cleaned = (parsed as UserAccount[]).filter(account =>
      account && typeof account.email === "string" &&
      account.id !== "google_lee_weien_0643" &&
      account.id !== `google_${account.email.toLowerCase().replace(/[^a-z0-9]/g, "_")}`
    );
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(DEVICE_ACCOUNTS_KEY, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch {
    return [];
  }
}

export function saveDeviceAccount(account: UserAccount): void {
  try {
    const accounts = getDeviceAccounts();
    const existingIndex = accounts.findIndex(
      a => (account.email && a.email.toLowerCase() === account.email.toLowerCase()) || a.id === account.id
    );
    const updatedAccount = {
      ...account,
      lastLoginAt: Date.now(),
    };
    if (existingIndex >= 0) {
      accounts[existingIndex] = { ...accounts[existingIndex], ...updatedAccount };
    } else {
      accounts.unshift(updatedAccount);
    }
    localStorage.setItem(DEVICE_ACCOUNTS_KEY, JSON.stringify(accounts.slice(0, 10)));
  } catch (e) {
    console.warn("Failed to save device account:", e);
  }
}

export function removeDeviceAccount(idOrEmail: string): void {
  try {
    const accounts = getDeviceAccounts().filter(
      a => a.id !== idOrEmail && a.email?.toLowerCase() !== idOrEmail.toLowerCase()
    );
    localStorage.setItem(DEVICE_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.warn("Failed to remove device account:", e);
  }
}

export function clearDeviceAccounts(): void {
  try {
    localStorage.removeItem(DEVICE_ACCOUNTS_KEY);
  } catch {}
}

// No hardcoded preset accounts: each device dynamically tracks only accounts authenticated on its own browser
export const PRESET_ACCOUNTS: UserAccount[] = [];

export const recycleLocations = [
  {
    id: 1,
    name: "Elmina Central Park Eco Station",
    type: "Smart Recyclables",
    category: "Recycling",
    distance: "0.8 km",
    status: "Open",
    fill: 42,
    lat: 3.1868,
    lng: 101.5042,
    township: "City of Elmina",
    address: "Elmina Central Park Promenade, City of Elmina, 40160 Shah Alam",
    operatingHours: "7:00 AM – 9:00 PM Daily",
    acceptedMaterials: ["Plastic Bottles", "Aluminium Cans", "Clean Paper", "Fabric"],
    pointsPerKg: 15,
    x: "24%", y: "48%", rx: 77, ry: 100,
    route: "M 96 108 Q 90 106 84 103 Q 80 101 77 100",
    mid: [87, 104] as [number, number],
    navSteps: [
      { icon: "straight", label: "Head along Persiaran Elmina", road: "Towards Elmina Central Park", dist: "0.4 km" },
      { icon: "left", label: "Turn left into Promenade", road: "Eco Station pavilion ahead", dist: "0.4 km" },
      { icon: "arrive", label: "Arrived at Destination", road: "Elmina Central Park Eco Station on your right", dist: "" },
    ] as NavStep[],
  },
  {
    id: 2,
    name: "Kanopi Residences Smart Waste Bay",
    type: "Resident Automated Drop",
    category: "Recycling",
    distance: "1.2 km",
    status: "Open",
    fill: 68,
    lat: 3.1841,
    lng: 101.5015,
    township: "City of Elmina",
    address: "Ground Floor Recycling Bay, Kanopi Residences, Elmina City Centre",
    operatingHours: "24 Hours (Resident RFID / BinGo QR)",
    acceptedMaterials: ["Plastics", "Paper", "Metal Cans", "Household E-Waste"],
    pointsPerKg: 20,
    x: "33%", y: "54%", rx: 106, ry: 112,
    route: "M 96 108 Q 100 109 103 110 Q 105 111 106 112",
    mid: [101, 110] as [number, number],
    navSteps: [
      { icon: "straight", label: "Drive towards Elmina City Centre", road: "Jalan Kanopi 1", dist: "0.7 km" },
      { icon: "right", label: "Turn into Ground Floor drop bay", road: "Dedicated resident unloading ramp", dist: "0.5 km" },
      { icon: "arrive", label: "Arrived at Destination", road: "Kanopi Smart Waste Bay on your left", dist: "" },
    ] as NavStep[],
  },
  {
    id: 3,
    name: "Bandar Bukit Raja Town Park Recycling Hub",
    type: "Community Multi-Stream Depot",
    category: "Recycling",
    distance: "2.5 km",
    status: "Open",
    fill: 35,
    lat: 3.0855,
    lng: 101.4441,
    township: "Bandar Bukit Raja",
    address: "Town Park North Pavilion, Persiaran Bukit Raja 1, Klang",
    operatingHours: "8:00 AM – 7:30 PM Daily",
    acceptedMaterials: ["Plastics", "Cardboard Boxes", "Glass Bottles", "Used Cooking Oil"],
    pointsPerKg: 15,
    x: "20%", y: "44%", rx: 64, ry: 91,
    route: "M 96 108 Q 85 105 77 100 Q 70 96 64 91",
    mid: [80, 100] as [number, number],
    navSteps: [
      { icon: "straight", label: "Head along Persiaran Bukit Raja 1", road: "Past Athira & Casira enclaves", dist: "1.5 km" },
      { icon: "left", label: "Exit into Town Park parking area", road: "Follow green recycling signs", dist: "1.0 km" },
      { icon: "arrive", label: "Arrived at Destination", road: "Bandar Bukit Raja Town Park Hub on your left", dist: "" },
    ] as NavStep[],
  },
  {
    id: 4,
    name: "Cantara Eco Drop-off - Ara Damansara",
    type: "Smart Digital Compactor",
    category: "Recycling",
    distance: "1.8 km",
    status: "Open",
    fill: 52,
    lat: 3.1189,
    lng: 101.5835,
    township: "Ara Damansara",
    address: "Level B1 Green Hub, Cantara Residences, Jalan PJU 1A/41B, Petaling Jaya",
    operatingHours: "6:00 AM – 11:00 PM Daily",
    acceptedMaterials: ["Plastic Bottles", "Beverage Cans", "Cartons", "Batteries"],
    pointsPerKg: 25,
    x: "22%", y: "54%", rx: 70, ry: 112,
    route: "M 96 108 Q 86 110 78 111 Q 73 112 70 112",
    mid: [83, 110] as [number, number],
    navSteps: [
      { icon: "straight", label: "Drive along Jalan PJU 1A/41B", road: "Towards Cantara Residences retail bridge", dist: "1.0 km" },
      { icon: "right", label: "Enter B1 Sustainability Loading Bay", road: "Tap BinGo pass at barrier", dist: "0.8 km" },
      { icon: "arrive", label: "Arrived at Destination", road: "Cantara Eco Drop-off ahead", dist: "" },
    ] as NavStep[],
  },
  {
    id: 5,
    name: "The Glades Eco Pavilion - Putra Heights",
    type: "Eco Sanctuary Green Station",
    category: "Recycling",
    distance: "3.2 km",
    status: "Open",
    fill: 28,
    lat: 3.0062,
    lng: 101.5738,
    township: "Putra Heights",
    address: "The Glades Clubhouse Reserve, Putra Heights, Subang Jaya",
    operatingHours: "7:00 AM – 8:00 PM Daily",
    acceptedMaterials: ["Plastics", "Paper", "Garden Waste", "Glass"],
    pointsPerKg: 18,
    x: "15%", y: "57%", rx: 48, ry: 118,
    route: "M 96 108 Q 80 110 65 113 Q 55 116 48 118",
    mid: [72, 113] as [number, number],
    navSteps: [
      { icon: "straight", label: "Head along Persiaran Putra Indah", road: "Towards The Glades main entrance", dist: "2.0 km" },
      { icon: "left", label: "Turn left into Glades Eco Boulevard", road: "Past The Serenade condominium", dist: "1.2 km" },
      { icon: "arrive", label: "Arrived at Destination", road: "The Glades Eco Pavilion on your left", dist: "" },
    ] as NavStep[],
  },
  {
    id: 6,
    name: "SJCC Central Green Hub - Subang Jaya",
    type: "High-Volume Municipal Hub",
    category: "Recycling",
    distance: "4.5 km",
    status: "Open",
    fill: 59,
    lat: 3.0801,
    lng: 101.5873,
    township: "Subang Jaya & SJCC",
    address: "Persiaran Kemajuan near SJCC Transit Hub, Subang Jaya",
    operatingHours: "8:00 AM – 8:00 PM Daily",
    acceptedMaterials: ["All Recyclable Streams", "E-Waste", "Small Appliances"],
    pointsPerKg: 20,
    x: "10%", y: "52%", rx: 32, ry: 108,
    route: "M 96 108 Q 75 109 58 109 Q 44 109 32 108",
    mid: [64, 108] as [number, number],
    navSteps: [
      { icon: "straight", label: "Head south on Federal Highway", road: "Exit Persiaran Kemajuan / Subang Jaya", dist: "2.5 km" },
      { icon: "straight", label: "Pass Aurora & SJCC East One", road: "Turn into Central Eco Zone", dist: "2.0 km" },
      { icon: "arrive", label: "Arrived at Destination", road: "SJCC Green Hub on your right", dist: "" },
    ] as NavStep[],
  },
  {
    id: 7,
    name: "KL East Mall & The Ridge Eco Station",
    type: "E-Waste & Commercial Drop Hub",
    category: "E-Waste",
    distance: "8.5 km",
    status: "Open",
    fill: 46,
    lat: 3.2275,
    lng: 101.7302,
    township: "KL East",
    address: "P1 Loading Zone, KL East Mall, 53100 Kuala Lumpur",
    operatingHours: "10:00 AM – 10:00 PM Daily",
    acceptedMaterials: ["Laptops", "Smartphones", "Batteries", "Cables", "Clean Paper"],
    pointsPerKg: 30,
    x: "6%", y: "61%", rx: 19, ry: 127,
    route: "M 96 108 Q 72 111 50 116 Q 33 121 19 127",
    mid: [58, 118] as [number, number],
    navSteps: [
      { icon: "straight", label: "Take Middle Ring Road 2 (MRR2) North", road: "Exit into KL East Boulevard", dist: "5.0 km" },
      { icon: "straight", label: "Enter KL East Mall Car Park P1", road: "Green Zone Eco Station", dist: "3.5 km" },
      { icon: "arrive", label: "Arrived at Destination", road: "The Ridge Eco Station on your left", dist: "" },
    ] as NavStep[],
  },
  {
    id: 8,
    name: "Bukit Jelutong Eco Depot",
    type: "Bulk Waste & Organic Composting",
    category: "Organic",
    distance: "5.1 km",
    status: "Open",
    fill: 31,
    lat: 3.1025,
    lng: 101.5288,
    township: "Bukit Jelutong",
    address: "Jalan Tiara U8/92, Bukit Jelutong, Shah Alam",
    operatingHours: "8:30 AM – 6:00 PM Daily",
    acceptedMaterials: ["Organic Food Waste", "Garden Biomass", "Cardboard", "Plastics"],
    pointsPerKg: 15,
    x: "39%", y: "57%", rx: 125, ry: 118,
    route: "M 96 108 Q 107 112 117 115 Q 121 117 125 118",
    mid: [111, 113] as [number, number],
    navSteps: [
      { icon: "straight", label: "Follow Guthrie Corridor Expressway", road: "Exit Bukit Jelutong interchange", dist: "3.0 km" },
      { icon: "straight", label: "Proceed towards Tiara Residences", road: "Jalan Tiara U8/92", dist: "2.1 km" },
      { icon: "arrive", label: "Arrived at Destination", road: "Bukit Jelutong Eco Depot on your right", dist: "" },
    ] as NavStep[],
  },
  {
    id: 9,
    name: "Serenia Kinetic Park Green Drop Point",
    type: "Eco Park Drop-off Station",
    category: "Recycling",
    distance: "14.2 km",
    status: "Open",
    fill: 24,
    lat: 2.8612,
    lng: 101.7035,
    township: "Serenia City",
    address: "Central Kinetic Park Plaza, Serenia City, Sepang",
    operatingHours: "7:00 AM – 8:30 PM Daily",
    acceptedMaterials: ["Plastics", "Aluminium Cans", "Cardboard"],
    pointsPerKg: 15,
    x: "41%", y: "47%", rx: 131, ry: 98,
    route: "M 96 108 Q 108 106 119 102 Q 125 100 131 98",
    mid: [114, 103] as [number, number],
    navSteps: [
      { icon: "straight", label: "Take ELITE Highway South", road: "Exit Bandar Serenia Interchange", dist: "10.0 km" },
      { icon: "right", label: "Turn into Serenia Kinetic Park", road: "Near Serenia Aiora & Ariya", dist: "4.2 km" },
      { icon: "arrive", label: "Arrived at Destination", road: "Serenia Kinetic Park Drop Point on your left", dist: "" },
    ] as NavStep[],
  },
  {
    id: 10,
    name: "Senada Towers Green Centre - KLGCC Resort",
    type: "High-Grade E-Waste & Recyclables",
    category: "E-Waste",
    distance: "6.8 km",
    status: "Open",
    fill: 20,
    lat: 3.1428,
    lng: 101.6441,
    township: "KLGCC Resort",
    address: "Concourse Recycling Lounge, Senada Towers, Jalan Bukit Kiara 1, KL",
    operatingHours: "24 Hours (Resident Access)",
    acceptedMaterials: ["E-Waste", "Clean Paper", "Glass Bottles", "Plastics"],
    pointsPerKg: 25,
    x: "42%", y: "65%", rx: 134, ry: 135,
    route: "M 96 108 Q 108 115 120 124 Q 127 130 134 135",
    mid: [115, 122] as [number, number],
    navSteps: [
      { icon: "straight", label: "Head along Jalan Bukit Kiara 1", road: "Towards KLGCC Golf Club & Senada", dist: "4.5 km" },
      { icon: "straight", label: "Enter Senada Residential Concourse", road: "Follow Green Centre indicators", dist: "2.3 km" },
      { icon: "arrive", label: "Arrived at Destination", road: "Senada Green Centre on your right", dist: "" },
    ] as NavStep[],
  },
];

export function SimpleQR({ code }: { code: string }) {
  const SIZE = 9;
  const cells = Array.from({ length: SIZE }, (_, r) =>
    Array.from({ length: SIZE }, (_, c) => {
      if ((r < 3 && c < 3) || (r < 3 && c > 5) || (r > 5 && c < 3)) return true;
      if (r === 1 && c === 1) return false;
      if (r === 1 && c === 7) return false;
      if (r === 7 && c === 1) return false;
      const idx = (r * SIZE + c) % code.length;
      return code.charCodeAt(idx) % 2 === 0;
    })
  );
  return (
    <svg viewBox="0 0 90 90" className="w-full h-full" style={{ imageRendering: "pixelated" }}>
      <rect width={90} height={90} fill="white" />
      {cells.flatMap((row, r) =>
        row.map((filled, c) =>
          filled ? <rect key={`${r}-${c}`} x={c * 10} y={r * 10} width={9} height={9} rx={1} fill="#14532d" /> : null
        )
      )}
    </svg>
  );
}

export function fillColor(pct: number) {
  if (pct >= 80) return { bar: "bg-red-500", dot: "#EF4444", text: "text-red-700" };
  if (pct >= 50) return { bar: "bg-amber-500", dot: "#F59E0B", text: "text-amber-700" };
  return { bar: "bg-emerald-600", dot: "#059669", text: "text-emerald-700" };
}

export function matchesFilter(loc: { category: string; status: string }, catFilter: string, statusFilter: string) {
  const catOk = catFilter === "All" || loc.category === catFilter;
  const statusOk = statusFilter === "All" || loc.status === statusFilter;
  return catOk && statusOk;
}

export function generateSchedules() {
  const now = new Date();
  const types = ["General Waste", "Recyclables (Paper/Plastics)", "Bulk & Garden Waste", "E-Waste Special Pickup", "General Waste"];
  const zones = [
    "Zone E – City of Elmina",
    "Zone BBR – Bandar Bukit Raja",
    "Zone AD – Ara Damansara",
    "Zone PH – Putra Heights",
    "Zone KLE – KL East"
  ];
  const times = ["7:30 AM", "8:30 AM", "9:00 AM", "10:00 AM", "8:00 AM"];
  const offsets = [1, 3, 5, 8, 11];
  return offsets.map((offset, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    return {
      id: i + 1,
      day: d.toLocaleDateString("en-US", { weekday: "short" }),
      date: String(d.getDate()),
      month: d.toLocaleDateString("en-US", { month: "short" }),
      rawDate: d.toISOString().slice(0, 10),
      time: times[i],
      zone: zones[i],
      type: types[i],
      status: "upcoming",
    };
  });
}

export function getCompassDir(x: string, y: string): string {
  const dx = parseFloat(x) - 30;
  const dy = -(parseFloat(y) - 52);
  const deg = Math.atan2(dx, dy) * (180 / Math.PI);
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(((deg + 360) % 360) / 45) % 8];
}

export function calcETA(distStr: string): { walk: number; drive: number } {
  const km = parseFloat(distStr);
  return { walk: Math.max(1, Math.round(km / 5 * 60)), drive: Math.max(1, Math.round(km / 30 * 60)) };
}

export function todayLabel(): string {
  const d = new Date();
  return d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });
}

export const initialSchedules = generateSchedules();

export const initialLiveUpdates = [
  { id: 1, date: todayLabel(), time: "7:45 AM", location: "Persiaran Elmina, City of Elmina", eta: "11 min", progress: 68 },
  { id: 2, date: todayLabel(), time: "9:15 AM", location: "Persiaran Bukit Raja 1, Klang", eta: "24 min", progress: 42 },
];

export const initialReports = [
  { id: 1, issue: "Overflowing Bin", description: "Smart bin sensor triggered full at Elmina Central Park promenade near Kanopi Residences.", address: "Kanopi Residences, City of Elmina, Shah Alam", urgency: "High", status: "In Action", points: 8, time: "2h ago", photo: true, adminComment: "MBSA & Sime Darby Waste fleet en route.", timeline: ["Submitted · 2h ago", "Pending · 1h 50m ago", "In Action – Fleet dispatched · 1h 30m ago"] },
  { id: 2, issue: "Illegal Dumping", description: "Garden construction debris left along roadside clearing near Casira 3 entrance.", address: "Casira 3, Bandar Bukit Raja, Klang", urgency: "High", status: "Pending", points: 8, time: "5h ago", photo: true, adminComment: "", timeline: ["Submitted · 5h ago", "Pending · 4h 50m ago"] },
  { id: 3, issue: "Missed Collection", description: "Monday recyclables pickup not serviced on Jalan PJU 1A/32.", address: "Andara, Ara Damansara, Petaling Jaya", urgency: "Medium", status: "Pending", points: 5, time: "1d ago", photo: true, adminComment: "", timeline: ["Submitted · 1d ago", "Pending · 1d ago"] },
  { id: 4, issue: "Damaged Smart Sensor", description: "RFID scanner panel lid cracked at The Glades Eco Pavilion drop point.", address: "The Glades, Putra Heights, Subang Jaya", urgency: "Low", status: "Completed", points: 5, time: "3d ago", photo: true, adminComment: "Sensor housing repaired and re-calibrated.", timeline: ["Submitted · 3d ago", "Pending · 3d ago", "In Action · 2d ago", "Completed · 1d ago"], completedAt: Date.now() - 24 * 60 * 60 * 1000 },
];

export const leaderboard = [
  { rank: 1, name: "Ahmad Rizwan", points: 2840, badge: "♻️" },
  { rank: 2, name: "Siti Amirah", points: 2610, badge: "🌿" },
  { rank: 3, name: "Tan Wei Liang", points: 2390, badge: "⭐" },
  { rank: 4, name: "You", points: 1250, badge: "🏅", isUser: true },
];

export const initialRewards = [
  { id: 1, name: "Touch 'n Go RM5 Reload", points: 500, category: "E-Wallet", icon: "💳", maxRedemptions: 100, redeemed: 34, banned: false },
  { id: 2, name: "Eco Tote Bag", points: 100, category: "Merchandise", icon: "🛍️", maxRedemptions: 50, redeemed: 12, banned: false },
  { id: 3, name: "ZUS Coffee Free Drink", points: 300, category: "Food & Drink", icon: "☕", maxRedemptions: 80, redeemed: 45, banned: false },
  { id: 4, name: "Grab Food RM5 Voucher", points: 350, category: "Food & Drink", icon: "🍔", maxRedemptions: 60, redeemed: 20, banned: false },
  { id: 5, name: "McD Ice Cream Cone", points: 150, category: "Food & Drink", icon: "🍦", maxRedemptions: 100, redeemed: 38, banned: false },
  { id: 6, name: "Grocery Voucher RM10", points: 400, category: "Voucher", icon: "🛒", maxRedemptions: 40, redeemed: 8, banned: false },
  { id: 7, name: "Recycling Starter Kit", points: 250, category: "Merchandise", icon: "♻️", maxRedemptions: 30, redeemed: 5, banned: false },
  { id: 8, name: "Maybank RM5 Cashback", points: 600, category: "E-Wallet", icon: "💰", maxRedemptions: 50, redeemed: 15, banned: false },
  { id: 9, name: "BinGo Premium Badge", points: 200, category: "Digital", icon: "🏅", maxRedemptions: 200, redeemed: 60, banned: false },
  { id: 10, name: "Hybrid Plant Seedling", points: 120, category: "Merchandise", icon: "🌱", maxRedemptions: 40, redeemed: 7, banned: false },
  { id: 11, name: "Shopee RM5 Voucher", points: 450, category: "Voucher", icon: "🎁", maxRedemptions: 80, redeemed: 22, banned: false },
  { id: 12, name: "Reusable Water Bottle", points: 180, category: "Merchandise", icon: "🍶", maxRedemptions: 35, redeemed: 9, banned: false },
];

export const urgencyColors: Record<string, string> = {
  Urgent: "bg-red-50 text-red-700 border border-red-200",
  High: "bg-amber-50 text-amber-800 border border-amber-200",
  Medium: "bg-sky-50 text-sky-800 border border-sky-200",
  Low: "bg-emerald-50 text-emerald-800 border border-emerald-200",
};

export const statusColors: Record<string, string> = {
  "In Action": "text-amber-800 bg-amber-50 border border-amber-200/80 rounded-md px-2 py-0.5 font-medium text-[11px]",
  "Completed": "text-emerald-800 bg-emerald-50 border border-emerald-200/80 rounded-md px-2 py-0.5 font-medium text-[11px]",
  "Pending": "text-slate-700 bg-slate-100 border border-slate-200 rounded-md px-2 py-0.5 font-medium text-[11px]",
  "Rejected": "text-red-800 bg-red-50 border border-red-200/80 rounded-md px-2 py-0.5 font-medium text-[11px]",
};

export const DEPARTMENTS = ["Waste Collection", "Environmental Health", "Community Services", "Infrastructure"];

/**
 * Calculate elapsed minutes since report/history item was filed.
 * Prioritizes relative human strings like "2h", "5h", "1d", "3d", "just now".
 * Lower elapsed minutes = nearer time / more recent.
 */
export function getReportElapsedMinutes(r: any): number {
  if (!r) return 999999999;
  const timeStr = String(r.time || "").toLowerCase().trim();
  if (timeStr) {
    if (timeStr.includes("just now") || timeStr.includes("sebentar") || timeStr.includes("baru")) return 0;

    // Minutes: "2m", "15 mins", "30m ago"
    const mMatch = timeStr.match(/(\d+)\s*(?:m|min|mins|minute|minutes)(?:\s*ago)?\b/);
    if (mMatch) return parseInt(mMatch[1], 10);

    // Hours: "2h", "5h", "2h ago", "5 hours ago"
    const hMatch = timeStr.match(/(\d+)\s*(?:h|hr|hrs|hour|hours)(?:\s*ago)?\b/);
    if (hMatch) return parseInt(hMatch[1], 10) * 60;

    // Days: "1d", "3d", "1 day ago", "3 days ago"
    const dMatch = timeStr.match(/(\d+)\s*(?:d|day|days)(?:\s*ago)?\b/);
    if (dMatch) return parseInt(dMatch[1], 10) * 1440;

    // Weeks: "1w", "2w", "1 week ago"
    const wMatch = timeStr.match(/(\d+)\s*(?:w|week|weeks)(?:\s*ago)?\b/);
    if (wMatch) return parseInt(wMatch[1], 10) * 10080;

    // Months: "1mo", "2mo", "1 month ago"
    const moMatch = timeStr.match(/(\d+)\s*(?:mo|month|months)(?:\s*ago)?\b/);
    if (moMatch) return parseInt(moMatch[1], 10) * 43200;
  }

  // Fallback to timestamps if time string is absent or not a relative duration
  let ts: number | null = null;
  if (typeof r.createdAt === "number" && !isNaN(r.createdAt)) ts = r.createdAt;
  else if (r.createdAt?.toMillis && typeof r.createdAt.toMillis === "function") ts = r.createdAt.toMillis();
  else if (r.createdAt?.seconds) ts = r.createdAt.seconds * 1000;
  else if (typeof r.completedAt === "number" && !isNaN(r.completedAt)) ts = r.completedAt;
  else if (typeof r.id === "number" && r.id > 1000000000) ts = r.id;

  if (ts !== null && ts > 0) {
    const diff = Math.max(0, Date.now() - ts);
    return diff / 60000;
  }

  if (typeof r.id === "number") {
    // Smaller ID -> older -> larger elapsed minutes
    return Math.max(1, (10000 - r.id) * 60);
  }

  return 999999999;
}

/**
 * Returns a numerical score where larger = nearer time (more recent).
 * Sorting by `getReportTimeScore(b) - getReportTimeScore(a)` sorts nearest time first
 * (e.g. Just now, then 2h, then 5h, 1d, 3d and so on).
 */
export function getReportTimeScore(r: any): number {
  return 10000000000000 - getReportElapsedMinutes(r) * 60000;
}

export type Report = typeof initialReports[0] & { department?: string; assignedAt?: string; resolvedAt?: string; completedAt?: number; createdAt?: number; };
export type LiveUpdate = typeof initialLiveUpdates[0];
export type Schedule = typeof initialSchedules[0];
export type Reward = typeof initialRewards[0];
export type Bin = typeof recycleLocations[0];
export type Notice = { id: number; title: string; body: string; date: string; pinned: boolean; };

export const initialNotices: Notice[] = [
  { id: 1, title: "Scheduled Maintenance Notice", body: "Collection services in Zone B will be paused on 26 Aug due to road works. Resume on 27 Aug.", date: "2026-08-20", pinned: true },
  { id: 2, title: "New Recycling Drop-off Point", body: "A new e-waste drop-off station is now available at SS2 Community Centre.", date: "2026-08-10", pinned: false },
];

export const MONTH_NUM: Record<string, string> = {
  Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
  Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
};

export const schedSortKey = (s: { date: string; month?: string; rawDate?: string }) =>
  (s as any).rawDate ?? `2026-${MONTH_NUM[(s as any).month] ?? "01"}-${String(s.date).padStart(2, "0")}`;

export function ScrollCol({ items, value, onChange }: { items: string[]; value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const ITEM_H = 44;
  const snapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const snapTo = (idx: number, smooth = true) => {
    const clamped = Math.max(0, Math.min(idx, items.length - 1));
    ref.current?.scrollTo({ top: clamped * ITEM_H, behavior: smooth ? "smooth" : "instant" as ScrollBehavior });
    return clamped;
  };

  useEffect(() => {
    const idx = items.indexOf(value);
    if (idx >= 0) snapTo(idx, false);
  }, []);

  const onScroll = () => {
    if (!ref.current) return;
    if (snapTimer.current) clearTimeout(snapTimer.current);
    snapTimer.current = setTimeout(() => {
      if (!ref.current) return;
      const rawIdx = ref.current.scrollTop / ITEM_H;
      const clamped = snapTo(Math.round(rawIdx));
      onChange(items[clamped]);
    }, 120);
  };

  const onWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    if (!ref.current) return;
    ref.current.scrollTop += e.deltaY > 0 ? ITEM_H : -ITEM_H;
  };

  return (
    <div className="relative flex-1" style={{ userSelect: "none" }}>
      <div className="absolute inset-x-0 top-0 pointer-events-none z-20"
        style={{ height: ITEM_H, background: "linear-gradient(to bottom, rgba(255,255,255,0.95), transparent)" }} />
      <div className="absolute inset-x-1 pointer-events-none z-10 rounded-xl"
        style={{ top: ITEM_H, height: ITEM_H, background: "rgba(21,128,61,0.08)" }} />
      <div className="absolute inset-x-0 bottom-0 pointer-events-none z-20"
        style={{ height: ITEM_H, background: "linear-gradient(to top, rgba(255,255,255,0.95), transparent)" }} />
      <div
        ref={ref}
        onScroll={onScroll}
        onWheel={onWheel}
        style={{
          height: ITEM_H * 3,
          overflowY: "scroll",
          scrollSnapType: "y mandatory",
          overscrollBehavior: "contain",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        } as React.CSSProperties}
      >
        <div style={{ height: ITEM_H, flexShrink: 0, scrollSnapAlign: "none" }} />
        {items.map(item => (
          <div
            key={item}
            style={{ height: ITEM_H, scrollSnapAlign: "center", flexShrink: 0 }}
            className={`flex items-center justify-center font-bold transition-all duration-100 ${item === value ? "text-slate-900 text-[18px]" : "text-slate-400 text-[14px]"}`}
          >
            {item}
          </div>
        ))}
        <div style={{ height: ITEM_H, flexShrink: 0, scrollSnapAlign: "none" }} />
      </div>
    </div>
  );
}

export const MANUAL_CATEGORIES = [
  { name: "Paper / Cardboard", icon: "📄", bin: "Blue Bin (Recyclables)", targetColor: "bg-sky-50 text-sky-800 border-sky-200", pts: 15 },
  { name: "Plastic", icon: "🧴", bin: "Blue Bin (Recyclables)", targetColor: "bg-amber-50 text-amber-800 border-amber-200", pts: 15 },
  { name: "Metal / Tin", icon: "🥫", bin: "Blue Bin (Recyclables)", targetColor: "bg-rose-50 text-rose-800 border-rose-200", pts: 15 },
  { name: "Glass", icon: "🍶", bin: "Glass Station (Brown)", targetColor: "bg-teal-50 text-teal-800 border-teal-200", pts: 15 },
  { name: "E-Waste", icon: "🔋", bin: "Purple Smart E-Waste Bin", targetColor: "bg-purple-50 text-purple-800 border-purple-200", pts: 25 },
  { name: "Clothes / Textiles", icon: "👕", bin: "Textile Community Bank", targetColor: "bg-emerald-50 text-emerald-800 border-emerald-200", pts: 20 },
  { name: "Organic / Food", icon: "🍂", bin: "Green Bin (Organic)", targetColor: "bg-lime-50 text-lime-800 border-lime-200", pts: 10 },
  { name: "Garden / Biomass", icon: "🌿", bin: "Green Bin (Garden Biomass)", targetColor: "bg-emerald-50 text-emerald-800 border-emerald-200", pts: 10 },
  { name: "General Waste", icon: "🗑️", bin: "Black Bin (General Waste)", targetColor: "bg-slate-100 text-slate-800 border-slate-300", pts: 5 },
  { name: "Bulky / Furniture", icon: "🛋️", bin: "Municipal Bulk Drive", targetColor: "bg-amber-50 text-amber-900 border-amber-300", pts: 10 },
  { name: "Tetra Pak Cartons", icon: "🧃", bin: "Blue Bin (Beverage Cartons)", targetColor: "bg-cyan-50 text-cyan-800 border-cyan-200", pts: 15 },
  { name: "Used Cooking Oil", icon: "🍳", bin: "Oil Collection Depot", targetColor: "bg-yellow-50 text-yellow-800 border-yellow-200", pts: 20 },
  { name: "Household Hazardous", icon: "💡", bin: "Hazardous Drop Box", targetColor: "bg-red-50 text-red-800 border-red-200", pts: 20 },
  { name: "Rubber / Tyres", icon: "🛞", bin: "Specialty Tyre Bay", targetColor: "bg-slate-100 text-slate-800 border-slate-300", pts: 15 },
];

export const CATEGORY_ITEM_TYPES: Record<string, string[]> = {
  "Plastic": ["Drink Bottles", "Hard Bottles", "Containers & Jugs", "Bags & Packaging", "Cups & Cutlery", "Rigid Plastics"],
  "Paper / Cardboard": ["Cardboard Boxes", "Clean Paper & Books", "Newspapers & Magazines", "Office Paper", "Paper Bags"],
  "Metal / Tin": ["Aluminium Beverage Cans", "Food Tins & Cans", "Scrap Metal", "Clean Aluminium Foil", "Aerosol Tins"],
  "Glass": ["Glass Beverage Bottles", "Food & Jam Jars", "Cosmetic Bottles", "Glassware"],
  "E-Waste": ["Smartphones & Tablets", "Laptops & Computers", "Household Batteries", "Power Banks", "Power Cables & Adapters", "Small Appliances"],
  "Clothes / Textiles": ["T-shirts / Tops", "Shirts & Pants", "Shoes", "Bedding & Linens", "Bags & Accessories", "Fabrics & Towels"],
  "Organic / Food": ["Food Scraps & Leftovers", "Fruit & Veg Peelings", "Coffee Grounds & Tea", "Eggshells", "Bakery & Crusts"],
  "Garden / Biomass": ["Garden Clippings", "Tree Branches", "Fallen Leaves", "Pruned Twigs", "Plant Soil"],
  "General Waste": ["Soiled Food Wrappers", "Oily Pizza Boxes", "Polystyrene Styrofoam", "Broken Ceramics & Glassware", "Hygiene Disposables"],
  "Bulky / Furniture": ["Chairs & Tables", "Sofas & Couches", "Mattresses", "Wooden Wardrobes", "Appliances"],
  "Tetra Pak Cartons": ["Milk Cartons", "Juice Cartons", "Soy Beverage Boxes", "Food Paste Packs"],
  "Used Cooking Oil": ["Cooking Oil in Bottle", "Deep Fryer Oil Can", "Grease Container"],
  "Household Hazardous": ["Fluorescent Tubes", "Paint Tins", "Pesticide Bottles", "Aerosol Spray"],
  "Rubber / Tyres": ["Car Tyres", "Bicycle Tyres", "Rubber Mats", "Rubber Hoses"],
};

export const MANUAL_CONDITIONS = ["Good", "Fair", "Poor", "Broken"];

export const AI_SAMPLE_ITEMS = [
  {
    name: "PET Mineral Bottle",
    category: "Plastic",
    itemType: "Drink Bottles",
    condition: "Clean & Empty",
    weight: "0.6",
    confidence: 97,
    icon: "🧴",
    bin: "Blue Bin (Recyclables)",
    description: "Clear beverage container, emptied and clean",
    pts: 20,
  },
  {
    name: "Aluminium Soda Can",
    category: "Metal / Tin",
    itemType: "Aluminium Beverage Cans",
    condition: "Good",
    weight: "0.3",
    confidence: 95,
    icon: "🥫",
    bin: "Blue Bin (Recyclables)",
    description: "Lightweight beverage can, 100% recyclable metal",
    pts: 20,
  },
  {
    name: "Cardboard Delivery Box",
    category: "Paper / Cardboard",
    itemType: "Cardboard Boxes",
    condition: "Good",
    weight: "1.2",
    confidence: 98,
    icon: "📦",
    bin: "Blue Bin (Recyclables)",
    description: "Flattened corrugated cardboard shipping carton",
    pts: 15,
  },
  {
    name: "Lithium-Ion Battery",
    category: "E-Waste",
    itemType: "Household Batteries",
    condition: "Fair",
    weight: "0.4",
    confidence: 93,
    icon: "🔋",
    bin: "Purple Smart E-Waste Bin",
    description: "Rechargeable device cell, specialized recycling stream",
    pts: 25,
  },
];

export interface DisposedItemRecord {
  id: string | number;
  itemName: string;
  category: string;
  icon: string;
  bin: string;
  weight: string;
  condition: string;
  points: number;
  facility: string;
  status: "Completed" | "Verified" | "Logged";
  time: string;
  createdAt: number;
}

export const initialDisposedItems: DisposedItemRecord[] = [
  {
    id: "disp-1",
    itemName: "Plastic Drink Bottles",
    category: "Plastic",
    icon: "🧴",
    bin: "Blue Bin (Recyclables)",
    weight: "2.4 kg",
    condition: "Good",
    points: 15,
    facility: "Elmina Central Park Eco Station",
    status: "Verified",
    time: "2h ago",
    createdAt: Date.now() - 2 * 3600 * 1000,
  },
  {
    id: "disp-2",
    itemName: "Cardboard Boxes",
    category: "Paper / Cardboard",
    icon: "📦",
    bin: "Blue Bin (Recyclables)",
    weight: "4.8 kg",
    condition: "Good",
    points: 15,
    facility: "Kanopi Residences Smart Waste Bay",
    status: "Completed",
    time: "1d ago",
    createdAt: Date.now() - 24 * 3600 * 1000,
  },
  {
    id: "disp-3",
    itemName: "Aluminium Beverage Cans",
    category: "Metal / Tin",
    icon: "🥫",
    bin: "Blue Bin (Recyclables)",
    weight: "1.2 kg",
    condition: "Good",
    points: 20,
    facility: "Elmina Central Park Eco Station",
    status: "Verified",
    time: "3d ago",
    createdAt: Date.now() - 3 * 24 * 3600 * 1000,
  },
];
