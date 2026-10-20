export const REVIEW_ESTIMATE = 'Admin review usually takes 1–3 working days. Green Points stay pending until approval.';
export function validPoints(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0 || value > 100000) throw new Error('Enter whole-number points between 0 and 100,000.');
  return value;
}
export function assertCollectorSubmission(booking: any, uid: string, photo: string, confirmed: boolean) {
  if (!uid || booking.assignedCollectorUid !== uid || booking.status !== 'Assigned') throw new Error('Only the assigned collector can submit an assigned pickup.');
  if (!confirmed) throw new Error('Check and confirm the pickup details first.');
  if (!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(photo) || photo.length > 450000) throw new Error('A prepared evidence photo is required (maximum 450 KB).');
}
export function assertPickupEvidence(session: any, booking: any, evidence: any) {
  if (session.collectionMethod !== 'collector_pickup') return;
  if (!booking || booking.status !== 'Collected' || !evidence || evidence.detailsVerified !== true || evidence.collectorUid !== booking.assignedCollectorUid || evidence.submissionId !== booking.recyclingSubmissionId || evidence.ownerUid !== session.ownerUid) throw new Error('Collector evidence and a collected pickup are required before approval.');
}
