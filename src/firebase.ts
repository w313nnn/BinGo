import {requireLiveSession} from "./demoSession";
import { validatePickupBooking, pickupBookingFailure, type BookingPhase } from "./pickupBookingSupport";
import { initializeApp } from "firebase/app";
import { getAuth, getIdTokenResult, GoogleAuthProvider, type User } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import {
  getFirestore, doc, getDocFromServer, setDoc, addDoc, updateDoc,
  getDocs, collection, onSnapshot, query, where, limit, orderBy, runTransaction, serverTimestamp, Timestamp, deleteDoc,
  type DocumentData,
} from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";
import {
  Report, Schedule, LiveUpdate, Notice, Reward, UserAccount, PRESET_ACCOUNTS,
  getReportTimeScore,
} from "./appData";
import type { DisposedItemRecord, PickupBooking, PickupBookingStatus } from "./appData";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: firestoreDatabaseId must be passed as per guidelines
const configuredDatabaseId = (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId;
if (typeof configuredDatabaseId !== "string" || !configuredDatabaseId.trim()) {
  throw new Error("firebase-applet-config.json must specify firestoreDatabaseId; do not silently use the default database.");
}
const bookingDatabaseId: string = configuredDatabaseId;
export const db = getFirestore(app, bookingDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Only privileged Console/IAM administrators may write this role record.
// Read from the server: cached roles must not restore revoked access.
export async function resolveAdminAccess(user: User, forceRefresh = false): Promise<boolean> {
  if (auth.currentUser?.uid !== user.uid) return false;
  const token = await getIdTokenResult(user, forceRefresh);
  if (auth.currentUser?.uid !== user.uid) return false;
  if (token.claims.admin === true) return true;
  try {
    const role = await getDocFromServer(doc(db, "admins", user.uid));
    return auth.currentUser?.uid === user.uid && role.exists()
      && role.data().role === "admin" && role.data().active === true;
  } catch (error) {
    if ((error as {code?: string}).code === "permission-denied") return false;
    throw error;
  }
}


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
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "unknown";
  const message = error instanceof Error ? error.message : "Could not access saved data.";
  console.error("Firestore request failed", {operationType, collection: path?.split("/")[0], code});
  throw Object.assign(new Error(message), {code});
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

function assignDocumentIds(documents: { id: string }[]): Map<string, number> {
  const assignedIds = new Map<string, number>();
  const usedIds = new Set<number>();

  for (const document of [...documents].sort((a, b) => a.id.localeCompare(b.id))) {
    let hash = 0;
    for (const character of document.id) {
      hash = (hash * 31 + character.charCodeAt(0)) | 0;
    }
    let numericId = Math.abs(hash) || 1;
    while (usedIds.has(numericId)) {
      numericId = numericId === Number.MAX_SAFE_INTEGER ? 1 : numericId + 1;
    }
    usedIds.add(numericId);
    assignedIds.set(document.id, numericId);
  }

  return assignedIds;
}

const REPORT_STATUSES = ["Pending", "In Action", "Completed", "Rejected"] as const;

// Both the resident and admin pages read reports through this mapping, so they always show the same status.
function normalizeReportStatus(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "Pending";
  const match = REPORT_STATUSES.find(status => status.toLowerCase() === value.trim().toLowerCase());
  if (!match) console.warn("Unknown report status in Firestore; showing as Pending:", value);
  return match ?? "Pending";
}

// ── Database Services for BinGo ──

/**
 * Real-time Reports Subscription
 * Syncs incident reports between residents and municipal admin panel
 */
export function subscribeToReports(
  callback: (reports: Report[]) => void,
  residentUid?: string,
  onError?: (error: Error) => void,
): () => void {
  const currentUser = auth.currentUser;
  if (residentUid && !currentUser) throw new Error("Sign in with Firebase Authentication to view your reports.");
  if (residentUid && residentUid !== currentUser?.uid) {
    throw new Error("Reports can only be retrieved for the currently authenticated resident.");
  }
  const reportsCol = collection(db, "reports");
  const q = residentUid
    ? query(reportsCol, where("authorUid", "==", residentUid), limit(50))
    : query(reportsCol, limit(50));

  return onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      callback([]);
      return;
    }
    const items: Report[] = [];
    const documentIds = assignDocumentIds(snapshot.docs);
    snapshot.forEach(docSnap => {
      // "estimate" avoids a null createdAt while the server timestamp is still pending
      const data = docSnap.data({ serverTimestamps: "estimate" });
      const createdAt = data.createdAt?.toMillis ? data.createdAt.toMillis() : (typeof data.createdAt === "number" ? data.createdAt : (data.numericId || undefined));
      const id = documentIds.get(docSnap.id)!;
      const points = Number(data.points);
      items.push({
        id,
        firestoreId: docSnap.id,
        issue: data.issue || data.type || "Unknown issue",
        description: data.description || data.desc || "",
        address: data.address || data.location || "",
        urgency: data.urgency || "Medium",
        status: normalizeReportStatus(data.status),
        points: Number.isFinite(points) ? points : 0,
        time: data.time || "",
        photo: Boolean(data.photo),
        adminComment: data.adminComment || "",
        timeline: Array.isArray(data.timeline) ? data.timeline : ["Submitted · just now"],
        department: data.department || "Waste Collection",
        completedAt: data.completedAt ? Number(data.completedAt) : undefined,
        createdAt: createdAt,
      } as any);
    });
    // Sort nearest time first (e.g. 2h on top, followed by 5h, 1d, 3d, etc.)
    items.sort((a: any, b: any) => getReportTimeScore(b) - getReportTimeScore(a));
    callback(items);
  }, (error) => {
    console.error("Reports subscription error:", error);
    onError?.(error);
  });
}

/**
 * Add a new report to Firestore
 */
export async function addReportToDb(report: Partial<Report> & { authorName?: string; authorEmail?: string }) {
  requireLiveSession();
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Sign in with Firebase Authentication before submitting a report.");
  const path = "reports";
  try {
    const reportDoc = {
      numericId: report.id || Date.now(),
      issue: report.issue || "Unknown issue",
      description: report.description || "",
      address: report.address || "",
      urgency: report.urgency || "High",
      status: report.status || "Pending",
      // firestore.rules only accept points == 0 on create; points are never self-awarded
      points: 0,
      time: report.time || "Just now",
      photo: Boolean(report.photo),
      adminComment: report.adminComment || "",
      timeline: report.timeline || ["Submitted · just now"],
      department: report.department || "Waste Collection",
      authorName: report.authorName || (typeof window !== "undefined" ? localStorage.getItem("bingo_username") : null) || "Resident",
      authorEmail: report.authorEmail || auth.currentUser?.email || (typeof window !== "undefined" ? localStorage.getItem("bingo_user_email") : null) || "resident@bingo.my",
      authorUid: currentUser.uid,
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
  firestoreId: string,
  updates: Partial<Report>
) {
  requireLiveSession();
  const path = "reports";
  try {
    if (!firestoreId) {
      throw new Error("A Firestore report document ID is required.");
    }
    await updateDoc(doc(db, path, firestoreId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Save resident feedback. Only the UID, display name, rating, text and a server timestamp are stored.
 */
export async function addFeedbackToDb(feedback: { name: string; rating: number; text: string }): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Sign in with Firebase Authentication before sending feedback.");
  const name = feedback.name.trim().slice(0, 100) || "Resident";
  const text = feedback.text.trim();
  if (!Number.isInteger(feedback.rating) || feedback.rating < 1 || feedback.rating > 5) {
    throw new Error("Choose a rating from 1 to 5 stars.");
  }
  if (text.length > 1000) throw new Error("Feedback must be 1,000 characters or fewer.");
  const path = "feedback";
  try {
    const docRef = await addDoc(collection(db, path), {
      ownerUid: currentUser.uid,
      name,
      rating: feedback.rating,
      text,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Latest feedback for administrators. Firestore rules decide who may read it.
 */
export async function getFeedbackForAdmin(): Promise<{ id: string; name: string; rating: number; text: string; ts: number }[]> {
  const path = "feedback";
  try {
    const snapshot = await getDocs(query(collection(db, path), orderBy("createdAt", "desc"), limit(200)));
    return snapshot.docs.flatMap(docSnap => {
      const data = docSnap.data();
      if (typeof data.rating !== "number" || !Number.isFinite(data.rating)) return [];
      return [{
        id: docSnap.id,
        name: typeof data.name === "string" && data.name ? data.name : "Resident",
        rating: data.rating,
        text: typeof data.text === "string" ? data.text : "",
        ts: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : 0,
      }];
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Real-time Schedules Subscription
 */
export function subscribeToSchedules(callback: (schedules: Schedule[]) => void): () => void {
  const schedCol = collection(db, "schedules");
  return onSnapshot(schedCol, (snapshot) => {
    if (snapshot.empty) {
      callback([]);
      return;
    }
    const items: Schedule[] = [];
    const documentIds = assignDocumentIds(snapshot.docs);
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      items.push({
        id: documentIds.get(docSnap.id)!,
        firestoreId: docSnap.id,
        day: data.day || "",
        date: String(data.date || ""),
        month: data.month || "",
        rawDate: data.rawDate || "",
        time: data.time || "",
        zone: data.zone || data.area || "",
        type: data.type || "",
        status: data.status || "",
      });
    });
    callback(items);
  }, (error) => {
    console.error("Schedules subscription error:", error);
  });
}

/**
 * Real-time Community Notices Subscription
 */
export function subscribeToNotices(callback: (notices: Notice[]) => void): () => void {
  const noticesCol = collection(db, "notices");
  return onSnapshot(noticesCol, (snapshot) => {
    if (snapshot.empty) {
      callback([]);
      return;
    }
    const items: Notice[] = [];
    const documentIds = assignDocumentIds(snapshot.docs);
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      items.push({
        id: documentIds.get(docSnap.id)!,
        firestoreId: docSnap.id,
        title: data.title || "Community Notice",
        body: data.body || "",
        date: data.date || "",
        pinned: Boolean(data.pinned),
      });
    });
    callback(items);
  }, (error) => {
    console.error("Notices subscription error:", error);
  });
}

/**
 * Real-time Rewards Catalogue Subscription
 */
export function subscribeToRewards(
  callback: (rewards: Reward[]) => void,
  onError: (error: Error) => void,
): () => void {
  const path = "rewards";
  return onSnapshot(collection(db, path), (snapshot) => {
    const documentIds = assignDocumentIds(snapshot.docs);
    const items: Reward[] = [];
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      if (typeof data.name !== "string" || !data.name.trim()
        || typeof data.points !== "number" || !Number.isFinite(data.points)) {
        try {
          handleFirestoreError(
            new Error(`Reward document ${docSnap.id} has an invalid name or point cost.`),
            OperationType.LIST,
            path,
          );
        } catch (handledError) {
          onError(handledError instanceof Error ? handledError : new Error(String(handledError)));
        }
        return;
      }
      items.push({
        id: typeof data.id === "number" && Number.isFinite(data.id)
          ? data.id
          : documentIds.get(docSnap.id)!,
        firestoreId: docSnap.id,
        description: typeof data.description === "string" ? data.description : "",
        validity: typeof data.validity === "string" ? data.validity : "",
        deliveryMethod: typeof data.deliveryMethod === "string" ? data.deliveryMethod : "",
        applicableStores: typeof data.applicableStores === "string" ? data.applicableStores : "",
        minimumSpend: typeof data.minimumSpend === "string" ? data.minimumSpend : "",
        usageInstructions: typeof data.usageInstructions === "string" ? data.usageInstructions : "",
        terms: typeof data.terms === "string" ? data.terms : "",
        name: data.name,
        points: data.points,
        category: typeof data.category === "string" ? data.category : "",
        icon: typeof data.icon === "string" ? data.icon : "",
        maxRedemptions: typeof data.maxRedemptions === "number" ? data.maxRedemptions : 0,
        redeemed: typeof data.redeemed === "number" ? data.redeemed : 0,
        banned: Boolean(data.banned),
      });
    }
    callback(items);
  }, (error) => {
    try {
      handleFirestoreError(error, OperationType.LIST, path);
    } catch (handledError) {
      onError(handledError instanceof Error ? handledError : new Error(String(handledError)));
    }
  });
}

export async function addRewardToDb(reward: Omit<Reward, "firestoreId">): Promise<string> {
  requireLiveSession();
  const path = "rewards";
  try {
    const docRef = await addDoc(collection(db, path), reward);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateRewardInDb(
  firestoreId: string,
  updates: Partial<Omit<Reward, "firestoreId">>,
): Promise<void> {
  requireLiveSession();
  const path = "rewards";
  try {
    if (!firestoreId) throw new Error("A Firestore reward document ID is required.");
    await updateDoc(doc(db, path, firestoreId), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteRewardFromDb(firestoreId: string): Promise<void> {
  requireLiveSession();
  const path = "rewards";
  try {
    if (!firestoreId) throw new Error("A Firestore reward document ID is required.");
    await deleteDoc(doc(db, path, firestoreId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function addScheduleToDb(schedule: Omit<Schedule, "id" | "firestoreId">): Promise<string> {
  requireLiveSession();
  const path = "schedules";
  try {
    const docRef = await addDoc(collection(db, path), schedule);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateScheduleInDb(
  firestoreId: string,
  updates: Partial<Omit<Schedule, "id" | "firestoreId">>,
): Promise<void> {
  requireLiveSession();
  const path = "schedules";
  try {
    if (!firestoreId) throw new Error("A Firestore schedule document ID is required.");
    await updateDoc(doc(db, path, firestoreId), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteScheduleFromDb(firestoreId: string): Promise<void> {
  requireLiveSession();
  const path = "schedules";
  try {
    if (!firestoreId) throw new Error("A Firestore schedule document ID is required.");
    await deleteDoc(doc(db, path, firestoreId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function addNoticeToDb(notice: Omit<Notice, "id" | "firestoreId">): Promise<string> {
  requireLiveSession();
  const path = "notices";
  try {
    const docRef = await addDoc(collection(db, path), notice);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateNoticeInDb(
  firestoreId: string,
  updates: Partial<Omit<Notice, "id" | "firestoreId">>,
): Promise<void> {
  requireLiveSession();
  const path = "notices";
  try {
    if (!firestoreId) throw new Error("A Firestore notice document ID is required.");
    await updateDoc(doc(db, path, firestoreId), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteNoticeFromDb(firestoreId: string): Promise<void> {
  requireLiveSession();
  const path = "notices";
  try {
    if (!firestoreId) throw new Error("A Firestore notice document ID is required.");
    await deleteDoc(doc(db, path, firestoreId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Real-time Fleet / Live Truck Updates
 */
export function subscribeToLiveUpdates(callback: (updates: LiveUpdate[]) => void): () => void {
  const fleetCol = collection(db, "fleetUpdates");
  return onSnapshot(fleetCol, (snapshot) => {
    if (snapshot.empty) {
      callback([]);
      return;
    }
    const items: LiveUpdate[] = [];
    const documentIds = assignDocumentIds(snapshot.docs);
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      items.push({
        id: documentIds.get(docSnap.id)!,
        date: data.date || "",
        time: data.time || "",
        location: data.location || "",
        eta: data.eta || "",
        progress: Number(data.progress) || 0,
        ...(typeof data.lat === "number" && typeof data.lng === "number" ? {lat: data.lat, lng: data.lng} : {}),
        plate: typeof data.plate === "string" ? data.plate : "",
        route: typeof data.route === "string" ? data.route : "",
        status: typeof data.status === "string" ? data.status : "",
      });
    });
    callback(items);
  }, (error) => {
    console.error("Fleet updates subscription error:", error);
  });
}

/**
 * Record a Recycling Drop-off Session
 */
export async function addRecycleSessionToDb(session: {
  submissionId: string;
  residentName: string;
  userEmail: string;
  stationName: string;
  materialType: string;
  itemName: string;
  category: string;
  itemType: string;
  condition: string;
  icon: string;
  bin: string;
  weightKg: number;
  pointsPending: number;
  collectionMethod: "self_drop_off" | "collector_pickup";
  identificationMode: "simulated" | "manual";
  detectedItem?: string;
  confidence?: number;
  suggestedRoute?: string;
  photoAttached: boolean;
}) {
  requireLiveSession();
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Sign in with Firebase Authentication before saving a recycling submission.");
  const path = "recycleSessions";
  try {
    const { submissionId, ...record } = session;
    if (!submissionId.trim() || submissionId.includes("/")) {
      throw new Error("A valid stable recycling submission ID is required.");
    }
    const sessionRef = doc(db, path, submissionId);
    await runTransaction(db, async transaction => {
      const existing = await transaction.get(sessionRef);
      if (existing.exists()) {
        const data = existing.data();
        if (data.ownerUid !== currentUser.uid
          || data.weightKg !== record.weightKg
          || data.materialType !== record.materialType
          || data.itemType !== record.itemType) {
          throw new Error("A recycling submission with this ID already exists with different ownership or details.");
        }
        return;
      }
      transaction.set(sessionRef, {
        ...record,
        ownerUid: currentUser.uid,
        verified: false,
        pointsApproved: null,
        status: "Pending Verification",
        createdAt: serverTimestamp(),
      });
    });
    return submissionId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function mapRecycleSessionToDisposedItem(
  id: string,
  data: DocumentData,
): DisposedItemRecord {
  const createdAt = data.createdAt instanceof Timestamp
    ? data.createdAt.toMillis()
    : typeof data.createdAt === "number" ? data.createdAt : 0;
  const materialType = typeof data.materialType === "string" ? data.materialType : "";
  const itemType = typeof data.itemType === "string" ? data.itemType : "";
  const verified = typeof data.verified === "boolean"
    ? data.verified
    : data.status === "Verified"
      ? true
      : data.status === "Pending Verification" || data.status === "Logged"
        ? false
        : undefined;
  const isVerified = data.status !== "Rejected"
    && (data.verified === true || data.status === "Verified");
  const isPending = !isVerified && (
    data.verified === false
    || data.status === "Pending Verification"
    || data.status === "Logged"
  );
  const isRejected = data.status === "Rejected";
  const status: DisposedItemRecord["status"] = isRejected
    ? "Rejected"
    : isVerified
    ? data.status === "Completed" ? "Completed" : "Verified"
    : isPending ? "Pending Verification" : "Unknown";
  const pendingPoints = !isVerified && !isRejected && typeof data.pointsPending === "number"
    ? data.pointsPending
    : undefined;
  const pointsApproved = typeof data.pointsApproved === "number"
    && Number.isFinite(data.pointsApproved)
    && data.pointsApproved >= 0
    ? data.pointsApproved
    : undefined;
  const pointsClassification = isVerified && pointsApproved !== undefined ? "approved" : pendingPoints !== undefined ? "pending" : "unknown";

  return {
    id,
    source: "firestore",
    ...(verified !== undefined ? { verified } : {}),
    ...(typeof data.ownerUid === "string" ? { ownerUid: data.ownerUid } : {}),
    ...(data.collectionMethod === "self_drop_off" || data.collectionMethod === "collector_pickup"
      ? { collectionMethod: data.collectionMethod } : {}),
    ...(typeof data.residentName === "string" ? { residentName: data.residentName } : {}),
    itemName: typeof data.itemName === "string" ? data.itemName : itemType || materialType,
    category: typeof data.category === "string" ? data.category : materialType.split(" - ")[0] || "",
    itemType,
    icon: typeof data.icon === "string" ? data.icon : "♻️",
    bin: typeof data.bin === "string" ? data.bin : "",
    weight: typeof data.weightKg === "number" ? `${data.weightKg} kg` : "",
    condition: typeof data.condition === "string" ? data.condition : "",
    points: 0,
    ...(pendingPoints !== undefined ? { pointsPending: pendingPoints } : {}),
    ...(pointsApproved !== undefined ? { pointsApproved } : {}),
    pointsClassification,
    facility: typeof data.stationName === "string" ? data.stationName : "",
    status,
    time: createdAt ? new Date(createdAt).toLocaleString() : "",
    createdAt,
    ...(data.identificationMode === "simulated" || data.identificationMode === "manual"
      ? { identificationMode: data.identificationMode } : {}),
    ...(typeof data.detectedItem === "string" ? { detectedItem: data.detectedItem } : {}),
    ...(typeof data.confidence === "number" ? { confidence: data.confidence } : {}),
    ...(typeof data.suggestedRoute === "string" ? { suggestedRoute: data.suggestedRoute } : {}),
    ...(typeof data.photoAttached === "boolean" ? { photoAttached: data.photoAttached } : {}),
  };
}

/**
 * Subscribe to recycling submissions owned by the currently authenticated resident.
 */
export function subscribeToRecycleSessionsForResident(
  residentUid: string,
  callback: (records: DisposedItemRecord[]) => void,
  onError: (error: Error) => void,
): () => void {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Sign in with Firebase Authentication to view recycling history.");
  if (!residentUid || residentUid !== currentUser.uid) {
    throw new Error("Recycling history can only be retrieved for the currently authenticated resident.");
  }

  const path = "recycleSessions";
  return onSnapshot(query(
    collection(db, path),
    where("ownerUid", "==", currentUser.uid),
  ), snapshot => {
    callback(snapshot.docs
      .map(document => mapRecycleSessionToDisposedItem(document.id, document.data({ serverTimestamps: "estimate" })))
      .sort((a, b) => b.createdAt - a.createdAt));
  }, error => {
    console.error("Could not subscribe to resident recycling history:", error);
    onError(error);
  });
}

/**
 * Retrieve recycling submissions for authorized Admin review.
 */
export async function getRecycleSessionsForAdmin(): Promise<DisposedItemRecord[]> {
  // No client-side claim check: Firestore rules decide, and a denial is shown as a real error.
  const path = "recycleSessions";
  try {
    const snapshot = await getDocs(collection(db, path));
    return snapshot.docs
      .map(document => mapRecycleSessionToDisposedItem(document.id, document.data()))
      .sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Admin review writes are authorized and field-limited by Firestore rules.
 */
export async function updateRecycleSessionReviewInDb(
  submissionId: string,
  updates: {
    verified: boolean;
    status: "Verified" | "Rejected";
    pointsApproved?: number;
  },
): Promise<void> {
  requireLiveSession();
  if (!submissionId) throw new Error("A recycling submission ID is required.");
  if (updates.status === "Rejected" && updates.verified) {
    throw new Error("A rejected recycling submission cannot be marked verified.");
  }
  if (updates.pointsApproved !== undefined
    && (!Number.isInteger(updates.pointsApproved) || updates.pointsApproved < 0)) {
    throw new Error("Approved Green Points must be a non-negative whole number.");
  }
  const path = "recycleSessions";
  try {
    await updateDoc(doc(db, path, submissionId), {
      verified: updates.verified,
      status: updates.status,
      ...(updates.pointsApproved !== undefined ? { pointsApproved: updates.pointsApproved } : {}),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

const PICKUP_BOOKING_STATUSES: PickupBookingStatus[] = [
  "Requested", "Approved", "Rejected", "Assigned", "Collected", "Cancelled",
];

function pickupBookingTimestamp(value: unknown, field: string): number {
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === "number" && Number.isFinite(value)) return value;
  throw new Error(`Pickup booking has an invalid ${field} timestamp.`);
}

export function mapPickupBookingFromFirestore(id: string, data: DocumentData): PickupBooking {
  if (!PICKUP_BOOKING_STATUSES.includes(data.status)) {
    throw new Error("Pickup booking has an invalid status.");
  }
  const requiredStringFields = [
    "ownerUid", "residentName", "residentEmail", "recyclingSubmissionId",
    "pickupAddress", "pickupDate", "pickupTime",
  ] as const;
  for (const field of requiredStringFields) {
    if (typeof data[field] !== "string") {
      throw new Error(`Pickup booking has an invalid ${field}.`);
    }
  }

  return {
    id,
    ownerUid: data.ownerUid,
    residentName: data.residentName,
    residentEmail: data.residentEmail,
    recyclingSubmissionId: data.recyclingSubmissionId,
    pickupAddress: data.pickupAddress,
    pickupDate: data.pickupDate,
    pickupTime: data.pickupTime,
    status: data.status,
    ...(typeof data.assignedCollectorUid === "string"
      ? { assignedCollectorUid: data.assignedCollectorUid } : {}),
    createdAt: pickupBookingTimestamp(data.createdAt, "createdAt"),
    updatedAt: pickupBookingTimestamp(data.updatedAt, "updatedAt"),
    ...(typeof data.statusNote === "string" ? { statusNote: data.statusNote } : {}),
  };
}

type NewPickupBooking = Pick<
  PickupBooking,
  "residentName" | "residentEmail" | "recyclingSubmissionId"
  | "pickupAddress" | "pickupDate" | "pickupTime"
>;

/**
 * Create a pickup booking owned by the currently authenticated Firebase user.
 */
export async function addPickupBookingToDb(
  bookingId: string,
  booking: NewPickupBooking,
): Promise<{ id: string; created: boolean }> {
  requireLiveSession();
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Sign in with Firebase Authentication before requesting a pickup.");
  booking = validatePickupBooking(bookingId, booking);

  const path = "pickupBookings";
  let phase: BookingPhase = "get";
  try {
    const bookingRef = doc(db, path, bookingId);
    const created = await runTransaction(db, async transaction => {
      phase = "get";
      const existing = await transaction.get(bookingRef);
      if (existing.exists()) {
        const existingData = existing.data();
        const belongsToSameSubmission = existingData.ownerUid === currentUser.uid
          && existingData.recyclingSubmissionId === booking.recyclingSubmissionId;
        const requestMatches = existingData.residentName === booking.residentName
          && existingData.residentEmail === booking.residentEmail
          && existingData.pickupAddress === booking.pickupAddress
          && existingData.pickupDate === booking.pickupDate
          && existingData.pickupTime === booking.pickupTime;
        if (!belongsToSameSubmission || !requestMatches) {
          throw new Error("A pickup booking with this ID already exists with different ownership or request details.");
        }
        return false;
      }

      phase = "create";
      transaction.set(bookingRef, {
        residentName: booking.residentName,
        residentEmail: booking.residentEmail,
        recyclingSubmissionId: booking.recyclingSubmissionId,
        pickupAddress: booking.pickupAddress,
        pickupDate: booking.pickupDate,
        pickupTime: booking.pickupTime,
        ownerUid: currentUser.uid,
        status: "Requested",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return true;
    });
    return { id: bookingId, created };
  } catch (error) {
    throw pickupBookingFailure(error, phase, app.options.projectId || "unknown", bookingDatabaseId);
  }
}

/**
 * Retrieve bookings belonging only to the currently authenticated resident.
 */
export async function getPickupBookingsForResident(residentUid: string): Promise<PickupBooking[]> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Sign in with Firebase Authentication to view pickup bookings.");
  if (!residentUid || residentUid !== currentUser.uid) {
    throw new Error("Pickup bookings can only be retrieved for the currently authenticated resident.");
  }

  const path = "pickupBookings";
  try {
    const snapshot = await getDocs(query(
      collection(db, path),
      where("ownerUid", "==", currentUser.uid),
    ));
    return snapshot.docs
      .map(docSnap => mapPickupBookingFromFirestore(docSnap.id, docSnap.data()))
      .sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    throw pickupBookingFailure(error, "list", app.options.projectId || "unknown", bookingDatabaseId);
  }
}

/**
 * Subscribe to bookings belonging only to the currently authenticated resident.
 */
export function subscribeToPickupBookingsForResident(
  residentUid: string,
  callback: (bookings: PickupBooking[]) => void,
  onError: (error: Error) => void,
): () => void {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Sign in with Firebase Authentication to view pickup bookings.");
  if (!residentUid || residentUid !== currentUser.uid) {
    throw new Error("Pickup bookings can only be retrieved for the currently authenticated resident.");
  }
  return onSnapshot(query(
    collection(db, "pickupBookings"),
    where("ownerUid", "==", currentUser.uid),
  ), snapshot => {
    callback(snapshot.docs
      .map(document => mapPickupBookingFromFirestore(document.id, document.data({ serverTimestamps: "estimate" })))
      .sort((a, b) => b.createdAt - a.createdAt));
  }, error => {
    onError(pickupBookingFailure(error, "list", app.options.projectId || "unknown", bookingDatabaseId));
  });
}

/**
 * Retrieve all pickup requests; Firestore rules must restrict this to authorized Admins.
 */
export async function getPickupRequestsForAdmin(): Promise<PickupBooking[]> {
  // No client-side claim check: Firestore rules decide, and a denial is shown as a real error.
  const path = "pickupBookings";
  try {
    const snapshot = await getDocs(collection(db, path));
    return snapshot.docs
      .map(docSnap => mapPickupBookingFromFirestore(docSnap.id, docSnap.data()))
      .sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Update booking status and optional assignment/note; Firestore rules must authorize staff actions.
 */
export async function updatePickupBookingInDb(
  bookingId: string,
  updates: {
    status: PickupBookingStatus;
    assignedCollectorUid?: string;
    statusNote?: string;
  },
): Promise<void> {
  requireLiveSession();
  if (!bookingId) throw new Error("A Firestore pickup booking document ID is required.");
  if (!PICKUP_BOOKING_STATUSES.includes(updates.status)) {
    throw new Error("A valid pickup booking status is required.");
  }

  const path = "pickupBookings";
  try {
    await updateDoc(doc(db, path, bookingId), {
      status: updates.status,
      ...(updates.assignedCollectorUid !== undefined
        ? { assignedCollectorUid: updates.assignedCollectorUid } : {}),
      ...(updates.statusNote !== undefined ? { statusNote: updates.statusNote } : {}),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Record a Reward Voucher Redemption
 */
export interface ResidentRedemption {
  id: string;
  rewardName: string;
  pointsCost: number;
  voucherCode: string;
  expiresAt: string;
  status: string;
  createdAt: number;
}

export async function getRedemptionsForResident(residentUid: string): Promise<ResidentRedemption[]> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Sign in with Firebase Authentication to view redemption history.");
  if (!residentUid || residentUid !== currentUser.uid) {
    throw new Error("Redemption history can only be retrieved for the currently authenticated resident.");
  }
  const path = "redemptions";
  try {
    const snapshot = await getDocs(query(
      collection(db, path),
      where("ownerUid", "==", currentUser.uid),
    ));
    return snapshot.docs.map(document => {
      const data = document.data();
      const createdAt = data.createdAt instanceof Timestamp
        ? data.createdAt.toMillis()
        : typeof data.createdAt === "number" && Number.isFinite(data.createdAt)
          ? data.createdAt
          : 0;
      if (typeof data.rewardName !== "string"
        || typeof data.pointsCost !== "number"
        || !Number.isFinite(data.pointsCost)
        || typeof data.voucherCode !== "string"
        || typeof data.expiresAt !== "string"
        || typeof data.status !== "string") {
        throw new Error(`Redemption record ${document.id} has invalid display data.`);
      }
      return {
        id: document.id,
        rewardName: data.rewardName,
        pointsCost: data.pointsCost,
        voucherCode: data.voucherCode,
        expiresAt: data.expiresAt,
        status: data.status,
        createdAt,
      };
    }).sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// TEMPORARY, read-only investigation helper for legacy browser records. Safe to delete.
export type LegacyRecordCheckOutcome =
  | "Not found"
  | "Exists — ownership verified"
  | "Exists — not owned by current user"
  | "Access denied — existence unknown"
  | "Check failed — unknown";

export async function checkLegacyRecordAgainstFirestore(id: string): Promise<LegacyRecordCheckOutcome> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Sign in with Firebase Authentication before checking records.");
  try {
    const snapshot = await getDocFromServer(doc(db, "recycleSessions", id));
    if (!snapshot.exists()) return "Not found";
    // Compared locally; the owner UID is never returned or displayed.
    return snapshot.get("ownerUid") === currentUser.uid
      ? "Exists — ownership verified"
      : "Exists — not owned by current user";
  } catch (error) {
    return (error as { code?: string })?.code === "permission-denied"
      ? "Access denied — existence unknown"
      : "Check failed — unknown";
  }
}

export interface RedeemRewardResult {
  redemptionId: string;
  rewardName: string;
  pointsCost: number;
  voucherCode: string;
  expiresAt: string;
  status: string;
  balanceAfter: number;
  alreadyProcessed: boolean;
}

/**
 * Redemption only works once the `redeemReward` Cloud Function (supplied separately by the backend team) has been
 * deployed. Set VITE_REDEMPTION_SERVICE_ENABLED=true after the project owner deploys it.
 */
export const redemptionServiceConfigured = import.meta.env.VITE_REDEMPTION_SERVICE_ENABLED === "true";

/**
 * Ask the trusted server to redeem a reward. The client sends only the reward ID and a retry key;
 * the server reads the price, stock and approved-point balance itself and issues the voucher.
 */
export async function redeemRewardOnServer(rewardId: string, requestId: string): Promise<RedeemRewardResult> {
  requireLiveSession();
  if (!auth.currentUser) throw new Error("Sign in with Firebase Authentication before redeeming a reward.");
  if (!redemptionServiceConfigured) throw new Error("The secure redemption service has not been set up yet.");
  const functions = getFunctions(app, import.meta.env.VITE_FUNCTIONS_REGION || "us-central1");
  const callable = httpsCallable<{ rewardId: string; requestId: string }, RedeemRewardResult>(functions, "redeemReward");
  const response = await callable({ rewardId, requestId });
  return response.data;
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
  requireLiveSession();
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Sign in with Firebase Authentication before saving a profile.");
  const path = `users/${currentUser.uid}`;
  try {
    const { greenPoints: _untrustedGreenPoints, email: _displayEmail, ...safeProfile } = profile;
    await setDoc(doc(db, "users", currentUser.uid), {
      ...safeProfile,
      email: currentUser.email || "",
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Only sync authentic profiles dynamically when residents log in
export async function seedPresetUsers() {
  // Dynamic mode: No hardcoded profiles are seeded to Firestore.
  // Profiles are generated when residents authenticate via Google or register.
}

// Initialize connectivity check
testConnection();

/** Load only the authenticated resident's profile; rules remain authoritative. */
export async function getUserProfileFromDb() {
  const user = auth.currentUser;
  if (!user) throw new Error("Sign in to load your profile.");
  const snapshot = await getDocFromServer(doc(db, "users", user.uid));
  const data = snapshot.exists() ? snapshot.data() : {};
  return Object.fromEntries(["name", "phone", "zone", "area", "collectionDays"].map(key => [key, typeof data[key] === "string" ? data[key] : ""])) as Record<"name" | "phone" | "zone" | "area" | "collectionDays", string>;
}

export interface ResidentFeedback { id: string; name: string; rating: number; text: string; ts: number; }
export async function submitFeedbackToDb(rating: number, text: string): Promise<void> {
  requireLiveSession();
  const user = auth.currentUser;
  if (!user) throw new Error("Sign in before sending feedback.");
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error("Choose a rating from 1 to 5.");
  if (text.trim().length > 1000) throw new Error("Feedback must be at most 1,000 characters.");
  await addDoc(collection(db, "feedback"), {
    ownerUid: user.uid, name: (user.displayName || user.email?.split("@")[0] || "Resident").slice(0, 100),
    rating, text: text.trim(), createdAt: serverTimestamp(),
  });
}
export function subscribeToFeedback(callback: (items: ResidentFeedback[]) => void, onError: (error: Error) => void) {
  return onSnapshot(collection(db, "feedback"), snapshot => callback(snapshot.docs.map(item => {
    const data = item.data();
    return { id: item.id, name: String(data.name || "Resident"), rating: Number(data.rating), text: String(data.text || ""), ts: data.createdAt?.toMillis?.() || 0 };
  }).sort((a, b) => b.ts - a.ts)), onError);
}
