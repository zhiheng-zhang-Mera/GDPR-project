/**
 * Shared bounds for the local temporal evidence ledger.
 *
 * These constants live in their own module so that behavioural tests can assert
 * against the same published limit the engine enforces, instead of duplicating a
 * magic number that could silently drift away from the implementation.
 */

/**
 * Maximum number of temporal observations retained per package. The evaluator
 * keeps the most recent observations inside the active pack's largest window and
 * discards the rest, so an oversized snapshot cannot expand resident state.
 */
export const MAX_RETAINED_TEMPORAL_OBSERVATIONS = 10_000;

/**
 * Maximum number of ledger entries accepted from a persisted snapshot, and the
 * bound applied when a snapshot is restored.
 */
export const MAX_RESTORED_TEMPORAL_ENTRIES = 10_000;

/** Maximum number of completed daily-window summaries retained per package/permission. */
export const MAX_RETAINED_WINDOW_SUMMARIES = 4_096;
