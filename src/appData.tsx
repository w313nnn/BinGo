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
}

import { SIME_DARBY_TOWNSHIPS, SIME_DARBY_COLLECTION_POINTS } from "./simeDarbyData";

export const PRESET_ACCOUNTS: UserAccount[] = [
  {
    id: "weien_gmail",
    name: "Wei En Lee",
    email: "weien.0643@gmail.com",
    avatar: "W",
    bg: "bg-purple-600 text-white",
    zone: "Zone E – City of Elmina",
    area: "Kanopi Residences, City of Elmina, Shah Alam",
    phone: "+60 12-882 1923",
    collectionDays: "Monday, Wednesday & Saturday",
  },
  {
    id: "weien_utar",
    name: "WEI EN LEE",
    email: "weien.0211@1utar.my",
    avatar: "W",
    bg: "bg-fuchsia-700 text-white",
    zone: "Zone BBR – Bandar Bukit Raja",
    area: "Lyra Link Homes, Bandar Bukit Raja, Klang",
    phone: "+60 17-912 3341",
    collectionDays: "Tuesday, Thursday & Saturday",
  },
  {
    id: "ahmad",
    name: "Ahmad Rizwan",
    email: "ahmad.rizwan@gmail.com",
    avatar: "AR",
    bg: "bg-emerald-700 text-white",
    zone: "Zone AD – Ara Damansara",
    area: "Cantara Residences, Ara Damansara, PJ",
    phone: "+60 12-345 6789",
    collectionDays: "Monday & Friday",
  },
  {
    id: "siti",
    name: "Siti Amirah",
    email: "siti.amirah@gmail.com",
    avatar: "SA",
    bg: "bg-blue-600 text-white",
    zone: "Zone PH – Putra Heights",
    area: "The Serenade, The Glades, Putra Heights",
    phone: "+60 17-889 2314",
    collectionDays: "Monday, Thursday & Saturday",
  },
  {
    id: "tan",
    name: "Tan Wei Liang",
    email: "tan.weiliang@gmail.com",
    avatar: "TW",
    bg: "bg-amber-600 text-white",
    zone: "Zone KLE – KL East",
    area: "The Ridge, KL East, Kuala Lumpur",
    phone: "+60 19-456 7812",
    collectionDays: "Monday & Thursday",
  },
];

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
    acceptedMaterials: ["Plastic Bottles (PET)", "Aluminium Cans", "Clean Paper", "Fabric"],
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
    acceptedMaterials: ["PET Bottles", "Beverage Cans", "Cartons", "Batteries"],
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
  { id: 1, issue: "Overflowing Bin", description: "Smart bin sensor triggered full at Elmina Central Park promenade near Kanopi Residences.", address: "Kanopi Residences, City of Elmina, Shah Alam", urgency: "High", status: "In Action", points: 8, time: "1h ago", photo: true, adminComment: "MBSA & Sime Darby Waste fleet en route.", timeline: ["Submitted · 1h ago", "Pending · 50m ago", "In Action – Fleet dispatched · 30m ago"] },
  { id: 2, issue: "Illegal Dumping", description: "Garden construction debris left along roadside clearing near Casira 3 entrance.", address: "Casira 3, Bandar Bukit Raja, Klang", urgency: "High", status: "Pending", points: 8, time: "4h ago", photo: true, adminComment: "", timeline: ["Submitted · 4h ago", "Pending · 3h 50m ago"] },
  { id: 3, issue: "Missed Collection", description: "Monday recyclables pickup not serviced on Jalan PJU 1A/32.", address: "Andara, Ara Damansara, Petaling Jaya", urgency: "Medium", status: "Pending", points: 5, time: "1d ago", photo: true, adminComment: "", timeline: ["Submitted · 1d ago", "Pending · 1d ago"] },
  { id: 4, issue: "Damaged Smart Sensor", description: "RFID scanner panel lid cracked at The Glades Eco Pavilion drop point.", address: "The Glades, Putra Heights, Subang Jaya", urgency: "Low", status: "Completed", points: 5, time: "2d ago", photo: true, adminComment: "Sensor housing repaired and re-calibrated.", timeline: ["Submitted · 2d ago", "Pending · 2d ago", "In Action · 1d ago", "Completed · 8h ago"], completedAt: Date.now() - 8 * 60 * 60 * 1000 },
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

export type Report = typeof initialReports[0] & { department?: string; assignedAt?: string; resolvedAt?: string; completedAt?: number; };
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
