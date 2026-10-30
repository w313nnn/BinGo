export type BookingPhase = "get" | "create" | "list";
export type BookingInput = {
  residentName: string; residentEmail: string; recyclingSubmissionId: string;
  pickupAddress: string; pickupDate: string; pickupTime: string;
};
export function validatePickupBooking(id: string, input: BookingInput): BookingInput {
  if (typeof id !== "string" || !id.trim() || id.includes("/")) throw new Error("A valid stable pickup booking ID is required.");
  if (id !== input.recyclingSubmissionId) throw new Error("The pickup booking ID must match its recycling submission ID.");
  if (typeof input.residentName !== "string" || typeof input.residentEmail !== "string") throw new Error("Resident name and email must be strings.");
  if (typeof input.pickupAddress !== "string" || !input.pickupAddress.trim() || input.pickupAddress.trim().length > 500) throw new Error("Pickup address must contain 1 to 500 characters.");
  if (typeof input.pickupDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(input.pickupDate)) throw new Error("Pickup date must use YYYY-MM-DD.");
  const date = new Date(`${input.pickupDate}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== input.pickupDate) throw new Error("Choose a valid pickup date.");
  if (typeof input.pickupTime !== "string" || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(input.pickupTime)) throw new Error("Pickup time must use 24-hour HH:mm.");
  return { ...input, pickupAddress: input.pickupAddress.trim() };
}
export class PickupBookingError extends Error {
  readonly code: string;
  constructor(readonly phase: BookingPhase, readonly projectId: string, readonly databaseId: string, original: unknown) {
    const raw = original as { code?: unknown; message?: unknown } | null;
    const code = typeof raw?.code === "string" ? raw.code : "unknown";
    const message = typeof raw?.message === "string" ? raw.message : String(original);
    const denied = code === "permission-denied" || /missing or insufficient permissions/i.test(message);
    const operation = phase === "get" ? "read the booking before creating it" : phase === "list" ? "load your pickup bookings" : "create the pickup booking";
    super(denied
      ? `Firestore permission-denied: cannot ${operation}. Check the published pickupBookings ${phase} rules in project ${projectId}, database ${databaseId}.`
      : `Could not ${operation}: ${message}`);
    this.name = "PickupBookingError";
    this.code = denied ? "permission-denied" : code;
  }
}
export function pickupBookingFailure(error: unknown, phase: BookingPhase, projectId: string, databaseId: string) {
  const failure = error instanceof PickupBookingError ? error : new PickupBookingError(phase, projectId, databaseId, error);
  // Keep credentials, tokens, addresses and resident contact information out of diagnostics.
  console.error("Pickup booking request failed", { code: failure.code, phase: failure.phase, projectId, databaseId, collection: "pickupBookings" });
  return failure;
}
