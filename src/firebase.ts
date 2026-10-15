import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import {
  getFirestore, doc, getDocFromServer, getDocs, setDoc, addDoc, updateDoc,
  collection, onSnapshot, query, limit, serverTimestamp,
} from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";
import {
  initialReports, initialSchedules, initialLiveUpdates, initialNotices,
  Report, Schedule, LiveUpdate, Notice, UserAccount, PRESET_ACCOUNTS,
} from "./appData";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: firestoreDatabaseId must be passed as per guidelines
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on startup
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("Firestore client is offline or network connection pending.");
    }
    return false;
  }
}

// ── Database Services for BinGo ──

/**
 * Real-time Reports Subscription
 * Syncs incident reports between residents and municipal admin panel
 */
export function subscribeToReports(callback: (reports: Report[]) => void): () => void {
  const reportsCol = collection(db, "reports");
  const q = query(reportsCol, limit(50));

  return onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      // Seed default reports to database on first run
      seedInitialReports();
      callback(initialReports);
      return;
    }
    const items: Report[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      items.push({
        id: Number(data.numericId || docSnap.id.replace(/\D/g, "")) || Math.floor(Math.random() * 1000) + 1,
        issue: data.issue || data.type || "Overflowing Bin",
        description: data.description || data.desc || "",
        address: data.address || data.location || "Taman Jaya, PJ",
        urgency: data.urgency || "Medium",
        status: data.status || "Pending",
        points: Number(data.points) || 8,
        time: data.time || "Just now",
        photo: data.photo !== undefined ? Boolean(data.photo) : true,
        adminComment: data.adminComment || "",
        timeline: Array.isArray(data.timeline) ? data.timeline : ["Submitted · just now"],
        department: data.department || "Waste Collection",
        completedAt: data.completedAt ? Number(data.completedAt) : undefined,
      });
    });
    // Sort with highest ID or newest first
    items.sort((a, b) => b.id - a.id);
    callback(items);
  }, (error) => {
    console.error("Reports subscription error:", error);
    callback(initialReports);
  });
}

/**
 * Add a new report to Firestore
 */
export async function addReportToDb(report: Partial<Report> & { authorName?: string; authorEmail?: string }) {
  const path = "reports";
  try {
    const reportDoc = {
      numericId: report.id || Date.now(),
      issue: report.issue || "Overflowing Bin",
      description: report.description || "",
      address: report.address || "Taman Jaya, Petaling Jaya",
      urgency: report.urgency || "High",
      status: report.status || "Pending",
      points: report.points ?? 8,
      time: report.time || "Just now",
      photo: Boolean(report.photo),
      adminComment: report.adminComment || "",
      timeline: report.timeline || ["Submitted · just now"],
      department: report.department || "Waste Collection",
      authorName: report.authorName || (typeof window !== "undefined" ? localStorage.getItem("bingo_username") : null) || "Resident",
      authorEmail: report.authorEmail || auth.currentUser?.email || (typeof window !== "undefined" ? localStorage.getItem("bingo_user_email") : null) || "resident@bingo.my",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, path), reportDoc);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Update report status / admin notes in Firestore
 */
export async function updateReportStatusInDb(
  numericId: number,
  updates: Partial<Report>
) {
  const path = "reports";
  try {
    const reportsCol = collection(db, "reports");
    const snapshot = await getDocs(reportsCol);
    for (const d of snapshot.docs) {
      const data = d.data();
      if (Number(data.numericId) === numericId || Number(d.id.replace(/\D/g, "")) === numericId) {
        await updateDoc(doc(db, "reports", d.id), {
          ...updates,
          updatedAt: serverTimestamp(),
        });
        return;
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Real-time Schedules Subscription
 */
export function subscribeToSchedules(callback: (schedules: Schedule[]) => void): () => void {
  const schedCol = collection(db, "schedules");
  return onSnapshot(schedCol, (snapshot) => {
    if (snapshot.empty) {
      seedInitialSchedules();
      callback(initialSchedules);
      return;
    }
    const items: Schedule[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      items.push({
        id: Number(data.numericId || docSnap.id.replace(/\D/g, "")) || Math.floor(Math.random() * 100),
        day: data.day || "Mon",
        date: String(data.date || "1"),
        month: data.month || "Jan",
        rawDate: data.rawDate || "2026-08-25",
        time: data.time || "8:00 AM",
        zone: data.zone || data.area || "Zone A – Taman Jaya",
        type: data.type || "General Waste",
        status: data.status || "upcoming",
      });
    });
    callback(items);
  }, (error) => {
    console.error("Schedules subscription error:", error);
    callback(initialSchedules);
  });
}

/**
 * Real-time Community Notices Subscription
 */
export function subscribeToNotices(callback: (notices: Notice[]) => void): () => void {
  const noticesCol = collection(db, "notices");
  return onSnapshot(noticesCol, (snapshot) => {
    if (snapshot.empty) {
      seedInitialNotices();
      callback(initialNotices);
      return;
    }
    const items: Notice[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      items.push({
        id: Number(data.numericId || docSnap.id.replace(/\D/g, "")) || 1,
        title: data.title || "Community Notice",
        body: data.body || "",
        date: data.date || "2026-08-20",
        pinned: Boolean(data.pinned),
      });
    });
    callback(items);
  }, (error) => {
    console.error("Notices subscription error:", error);
    callback(initialNotices);
  });
}

/**
 * Real-time Fleet / Live Truck Updates
 */
export function subscribeToLiveUpdates(callback: (updates: LiveUpdate[]) => void): () => void {
  const fleetCol = collection(db, "fleetUpdates");
  return onSnapshot(fleetCol, (snapshot) => {
    if (snapshot.empty) {
      callback(initialLiveUpdates);
      return;
    }
    const items: LiveUpdate[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      items.push({
        id: Number(data.numericId || docSnap.id.replace(/\D/g, "")) || 1,
        date: data.date || "Today",
        time: data.time || "8:00 AM",
        location: data.location || "Taman Jaya, PJ",
        eta: data.eta || "15 min",
        progress: Number(data.progress) || 50,
      });
    });
    callback(items);
  }, (error) => {
    console.error("Fleet updates subscription error:", error);
    callback(initialLiveUpdates);
  });
}

/**
 * Record a Recycling Drop-off Session
 */
export async function addRecycleSessionToDb(session: {
  residentName: string;
  userEmail: string;
  stationName: string;
  materialType: string;
  weightKg: number;
  pointsEarned: number;
}) {
  const path = "recycleSessions";
  try {
    const docRef = await addDoc(collection(db, path), {
      ...session,
      verified: true,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Record a Reward Voucher Redemption
 */
export async function addRedemptionToDb(redemption: {
  residentName: string;
  userEmail: string;
  rewardName: string;
  pointsCost: number;
  voucherCode: string;
  expiresAt: string;
}) {
  const path = "redemptions";
  try {
    const docRef = await addDoc(collection(db, path), {
      ...redemption,
      status: "Active",
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Save or sync resident profile in Firestore
 */
export async function syncUserProfileToDb(profile: {
  name: string;
  email: string;
  phone?: string;
  zone?: string;
  area?: string;
  collectionDays?: string;
  greenPoints?: number;
  preferredLanguage?: string;
}) {
  if (!profile.email) return;
  const cleanId = profile.email.toLowerCase().replace(/[^a-z0-9]/g, "_");
  const path = `users/${cleanId}`;
  try {
    await setDoc(doc(db, "users", cleanId), {
      ...profile,
      role: profile.email.includes("admin") ? "admin" : "resident",
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.warn("Profile sync notice:", error);
  }
}

// ── Initial Database Seeders ──

async function seedInitialReports() {
  try {
    for (const rep of initialReports) {
      await addDoc(collection(db, "reports"), {
        numericId: rep.id,
        issue: rep.issue,
        description: rep.description,
        address: rep.address,
        urgency: rep.urgency,
        status: rep.status,
        points: rep.points,
        time: rep.time,
        photo: rep.photo,
        adminComment: rep.adminComment || "",
        timeline: rep.timeline || ["Submitted · just now"],
        createdAt: serverTimestamp(),
      });
    }
  } catch (e) {
    console.warn("Seeding reports handled:", e);
  }
}

async function seedInitialSchedules() {
  try {
    for (const sc of initialSchedules) {
      await addDoc(collection(db, "schedules"), {
        numericId: sc.id,
        day: sc.day,
        date: sc.date,
        month: sc.month,
        rawDate: sc.rawDate,
        time: sc.time,
        zone: sc.zone,
        type: sc.type,
        status: sc.status,
        createdAt: serverTimestamp(),
      });
    }
  } catch (e) {
    console.warn("Seeding schedules handled:", e);
  }
}

async function seedInitialNotices() {
  try {
    for (const n of initialNotices) {
      await addDoc(collection(db, "notices"), {
        numericId: n.id,
        title: n.title,
        body: n.body,
        date: n.date,
        pinned: n.pinned,
        createdAt: serverTimestamp(),
      });
    }
  } catch (e) {
    console.warn("Seeding notices handled:", e);
  }
}

// Only sync authentic profiles dynamically when residents log in
export async function seedPresetUsers() {
  // Dynamic mode: No hardcoded profiles are seeded to Firestore.
  // Profiles are generated when residents authenticate via Google or register.
}

// Initialize connectivity check
testConnection();
